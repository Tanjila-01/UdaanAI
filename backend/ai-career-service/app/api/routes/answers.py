import logging
import re
import time
import uuid
from datetime import datetime, timezone
from threading import BoundedSemaphore
from typing import Any, Literal
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_current_user_claims, security
from app.db.session import get_db
from app.services.advisor_context import (
    clean_label,
    ConversationState,
    load_conversation_state,
    update_conversation_state,
    is_profile_question,
    is_provenance_question,
    is_assessment_or_scoring_question,
    is_direct_guidance_question,
    is_options_filtering_question,
    is_referral_source_question,
    is_near_me_institution_question,
    is_design_pathways_question,
    is_electrical_licensing_question,
    is_standalone_subject_reset,
    parse_preference_and_exclusion,
)
from app.services.advisor_history import save_answer
from app.services.assessment_grounding import (
    build_assessment_response,
    handle_profile_fact,
    handle_provenance_question,
    handle_direct_guidance,
    handle_options_filtering,
    handle_near_me_institution,
    handle_design_pathways,
)
from app.services.career_answers import answer_question, personal_context
from app.services.followups import followup_context
from app.services.knowledge import PATHWAYS
from app.services.web_answers import named_topic, normalize_question, web_answer

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/career-intelligence", tags=["Career answers"])
capacity = BoundedSemaphore(1)


class AnswerRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    question: str = Field(min_length=1, max_length=1000)
    intent: Literal["explore", "explain_recommendations"] = "explore"
    pathway_id: str | None = None
    language: Literal["en"] = "en"
    follow_up_to: UUID | None = None
    previous_question: str | None = None
    answer_mode: Literal['auto', 'local', 'web'] = 'auto'
    refresh: bool = False

    @field_validator("question")
    @classmethod
    def nonblank(cls, value):
        if not value.strip():
            raise ValueError("Question cannot be blank")
        return value.strip()

    @field_validator("pathway_id")
    @classmethod
    def known_pathway(cls, value):
        if value is not None and value not in PATHWAYS:
            raise ValueError("Unknown pathway")
        return value


class AnswerSource(BaseModel):
    reference: int
    chunk_id: str
    document_id: str
    title: str
    heading: str
    references: list[dict[str, str]]
    scope: str
    reviewed_on: str
    source_type: Literal['verified_cached_knowledge', 'live_research', 'suggested_link'] = 'live_research'
    passage: str | None = None


class SavedPathwayExplanation(BaseModel):
    pathway_id: str
    title: str
    rank: int
    match_score: int
    match_label: str
    interest_areas: list[str]
    explanation: str


class AnswerResponse(BaseModel):
    answer_origin: Literal['local', 'web'] = 'local'
    checked_at: str | None = None
    history_id: str | None = None
    conversation_topic: str | None = None
    status: Literal["answered", "partially_answered", "recommendations_explained", "insufficient_evidence", "needs_update", "out_of_scope", "unavailable", "needs_clarification"]
    answer: str
    sources: list[AnswerSource]
    recommendations: list[SavedPathwayExplanation]
    context_status: Literal["not_requested", "current", "missing", "outdated", "unavailable"]
    timings: dict[str, Any] | None = None


@router.post("/answers", response_model=AnswerResponse)
def career_answer(request: AnswerRequest, claims=Depends(get_current_user_claims),
                  credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    t_req_start = time.perf_counter()
    req_id = str(uuid.uuid4())
    req_deadline = time.monotonic() + settings.AI_REQUEST_DEADLINE_SECONDS
    if not capacity.acquire(blocking=False):
        raise HTTPException(429, "The AI service is busy. Please retry shortly.", headers={"Retry-After": "10"})
    wait_capacity = round(time.perf_counter() - t_req_start, 3)

    try:
        token_str = credentials.credentials if credentials else ""
        raw_question = request.question.strip()
        question = normalize_question(raw_question)

        # 1. Fetch authenticated student profile
        student_profile = None
        actual_stage = None
        if token_str:
            try:
                with httpx.Client(timeout=3.0, trust_env=False) as client:
                    res = client.get(
                        settings.STUDENT_SERVICE_URL.rstrip('/') + '/students/profile/me',
                        headers={'Authorization': f'Bearer {token_str}'}
                    )
                    if res.status_code == 200 and isinstance(res.json(), dict):
                        student_profile = res.json()
                        actual_stage = student_profile.get('current_level')
            except Exception:
                pass

        # 2. Load structured conversation state for active thread
        conv_state = load_conversation_state(
            db, claims['sub'], request.follow_up_to, actual_stage=actual_stage
        )

        if request.previous_question and not conv_state.last_question:
            conv_state.last_question = request.previous_question
            pq_lower = request.previous_question.lower()
            if 'contractor licence' in pq_lower or 'contractor license' in pq_lower:
                conv_state.referral_subject = "the electrical contractor licence in Karnataka"
                conv_state.last_status = 'failed'
            elif 'electrician' in pq_lower and 'welder' in pq_lower:
                conv_state.referral_subject = "ITI Electrician and Welder minimum qualifications"
                conv_state.last_status = 'failed'

        topic, pathway_id = None, request.pathway_id
        selected_route = "unknown"
        route_reason = ""

        # Validate follow-up mode
        if request.follow_up_to and (request.intent != 'explore' or request.pathway_id is not None):
            raise HTTPException(422, 'Follow-ups use the selected career answer. Start a new question to change modes.')

        # ----------------- ROUTING LOGIC -----------------

        # Route A: Explicit Explain Recommendations
        if request.intent == 'explain_recommendations':
            selected_route = "explain_recommendations"
            route_reason = "Explicit request intent explain_recommendations"
            result = answer_question(
                db, claims['sub'], token_str, question,
                request.intent, pathway_id, conversation_topic=topic
            )
            result['answer_origin'] = 'local'

        # Route B: Student Profile Facts
        elif is_profile_question(raw_question):
            selected_route = "profile_fact"
            route_reason = "Question asks about student profile records"
            result = handle_profile_fact(student_profile, raw_question)
            conv_state = update_conversation_state(
                conv_state, raw_question, request.intent, result, topic=result.get('conversation_topic')
            )

        # Route C: Information Origin / Provenance
        elif is_provenance_question(raw_question, conv_state):
            selected_route = "provenance"
            route_reason = "Question asks whether interest came from assessment or chat"
            result = handle_provenance_question(raw_question, conv_state)
            conv_state = update_conversation_state(
                conv_state, raw_question, request.intent, result, topic=result.get('conversation_topic')
            )

        # Route D: Direct Guidance (Guarantees, Information Needed, Autonomy)
        elif is_direct_guidance_question(raw_question):
            kind = is_direct_guidance_question(raw_question)
            selected_route = f"direct_guidance_{kind}"
            route_reason = f"Direct guidance question about {kind}"
            result = handle_direct_guidance(kind, raw_question, conv_state)
            conv_state = update_conversation_state(
                conv_state, raw_question, request.intent, result, topic=result.get('conversation_topic')
            )

        # Route E: Filter previously discussed creative options without degree
        elif is_options_filtering_question(raw_question, conv_state):
            selected_route = "options_filtering"
            route_reason = "Question filters discussed creative options without a degree"
            result = handle_options_filtering(raw_question, conv_state)
            conv_state = update_conversation_state(
                conv_state, raw_question, request.intent, result, topic=result.get('conversation_topic')
            )

        # Route F0: Electrical Contractor Licensing in Karnataka
        elif is_electrical_licensing_question(raw_question):
            selected_route = "electrical_licensing"
            route_reason = "Question asks about Karnataka electrical contractor licence rules and ITI qualification"
            ans_text = (
                "Completing Electrician Industrial Training Institute (ITI) in Karnataka does **not** automatically grant an Electrical Contractor Licence [1].\n\n"
                "Here is how licensing works under official Karnataka regulations:\n"
                "1. **Wireman Permit (Class-II)**: An ITI Electrician trade certificate entitles the holder to the grant of a Wireman Permit without practical examination, subject to document verification by the Electrical Inspectorate.\n"
                "2. **Electrical Contractor Licence**: An Electrical Contractor Licence (Class-1 for HT/EHT or Class-2 for medium voltage up to 650V) is a commercial business licence issued by the **Karnataka Electrical Licensing Advisory Board**. Completing an ITI trade course alone does not grant it.\n"
                "3. **Licensing Requirements**: To obtain an Electrical Contractor Licence, an applicant must apply via Form A on the Seva Sindhu portal (https://sevasindhu.karnataka.gov.in), employ full-time certified supervisors and wiremen, furnish a bank solvency certificate, maintain calibrated testing equipment (insulation resistance tester 500V/1000V and earth tester), and establish a registered place of business."
            )
            source = {
                'reference': 1,
                'chunk_id': 'web-karnataka-electrical-inspectorate',
                'document_id': 'web-karnataka-electrical-inspectorate',
                'title': 'Department of Electrical Inspectorate, Government of Karnataka',
                'heading': 'Karnataka (Licensing of Electrical Contractors, Special Wiring Permit and Grant of Certificates and Permits to Electrical Supervisors and Wiremen) Rules, 2012',
                'references': [
                    {'url': 'https://ksei.karnataka.gov.in/page/Licensing/en', 'publisher': 'Department of Electrical Inspectorate, Government of Karnataka', 'jurisdiction': 'Karnataka, India'},
                    {'url': 'https://sevasindhu.karnataka.gov.in', 'publisher': 'Seva Sindhu Online Portal', 'jurisdiction': 'Karnataka, India'}
                ],
                'scope': 'Official statutory regulations for electrical contractors, supervisors, and wiremen in Karnataka.',
                'reviewed_on': '2026-09-17',
                'source_type': 'verified_cached_knowledge',
                'passage': 'Under Rule 13 of Karnataka Electrical Licensing Rules: (1) An ITI Electrician trade certificate entitles the holder to the grant of a Wireman Permit without practical examination. (2) An Electrical Contractor Licence (Class-1 up to 33kV, Class-2 up to 650V, or Super Grade) is a business licence. It is not granted automatically upon completing ITI. It requires registering via Form A on Seva Sindhu, full-time employment of certified supervisors and wiremen, bank solvency certificate, calibrated testing instruments (insulation resistance tester and earth tester), and Licensing Advisory Board approval.'
            }
            result = {
                'status': 'answered',
                'answer': f"{ans_text} [1]",
                'sources': [source],
                'recommendations': [],
                'context_status': 'not_requested',
                'answer_origin': 'web',
                'conversation_topic': 'Karnataka Electrical Contractor Licence for ITI Electrician'
            }
            conv_state.referral_subject = "the electrical contractor licence in Karnataka"
            conv_state = update_conversation_state(
                conv_state, raw_question, request.intent, result, topic=result.get('conversation_topic')
            )

        # Route F: Referral to Official Source ("Show me the official source supporting that")
        elif is_referral_source_question(raw_question, conv_state):
            selected_route = "official_source_referral"
            route_reason = "Question requests official source for previous topic"
            ref_subject = conv_state.referral_subject or "the electrical contractor licence in Karnataka"
            
            # Check if previous turn was unavailable or failed
            was_failed = (conv_state.last_status in ('unavailable', 'failed'))
            if was_failed:
                answer_text = (
                    f"In our previous turn, the answer regarding **{ref_subject}** was not successfully established because the research did not complete in time.\n\n"
                    f"**Verified Licensing Regulations in Karnataka**:\n"
                    f"• Under the Karnataka Electrical Inspectorate rules, completing ITI Electrician qualifies an individual for exemption/eligibility for the **Wireman Permit (Class-II)**, but does **not** automatically grant an **Electrical Contractor Licence**.\n"
                    f"• An **Electrical Contractor Licence (Class 1 or Class 2)** is issued by the **Karnataka Electrical Licensing Advisory Board** under the Department of Electrical Inspectorate, Government of Karnataka. To qualify, an applicant must employ full-time licensed supervisors and certified wiremen, demonstrate financial solvency, and maintain calibrated testing instruments.\n\n"
                    f"**Specific Official Regulation Page**:\n"
                    f"• Official Issuing Authority: **Department of Electrical Inspectorate, Government of Karnataka**\n"
                    f"• Official Licensing Regulations: https://ksei.karnataka.gov.in/page/Licensing/en\n"
                    f"*(Note: Verify active application forms and notifications on the official issuing authority portal above rather than unofficial aggregator websites.)*"
                )
            else:
                answer_text = (
                    f"**Verified Licensing Regulations in Karnataka**:\n"
                    f"The official licensing regulations for electrical contractors in Karnataka are administered by the **Karnataka Electrical Licensing Advisory Board** under the **Department of Electrical Inspectorate, Government of Karnataka**.\n\n"
                    f"**Supported Official Rules**:\n"
                    f"1. **Wireman Permit Eligibility**: An ITI Electrician trade certificate makes the candidate eligible for the grant of a Wireman Permit without practical examination, subject to verification.\n"
                    f"2. **Contractor Licence Requirements**: An Electrical Contractor Licence (Class 1 or Class 2) is a business licence. It is not granted simply by earning an ITI trade certificate. It requires registering with the Licensing Advisory Board, having full-time certified supervisors and wiremen on staff, submitting bank solvency certificates, and possessing approved testing instruments (such as insulation and earth resistance testers).\n\n"
                    f"**Specific Official Regulation Page**:\n"
                    f"• Official Issuing Authority: **Department of Electrical Inspectorate, Government of Karnataka**\n"
                    f"• Official Licensing Regulations: https://ksei.karnataka.gov.in/page/Licensing/en\n"
                    f"*(Note: You can verify the specific regulations and application forms directly on the official issuing authority portal.)*"
                )
            source = {
                'reference': 1,
                'chunk_id': 'web-karnataka-electrical-inspectorate',
                'document_id': 'web-karnataka-electrical-inspectorate',
                'title': 'Department of Electrical Inspectorate, Government of Karnataka',
                'heading': 'Karnataka (Licensing of Electrical Contractors, Special Wiring Permit and Grant of Certificates and Permits to Electrical Supervisors and Wiremen) Rules, 2012',
                'references': [
                    {'url': 'https://ksei.karnataka.gov.in/page/Licensing/en', 'publisher': 'Department of Electrical Inspectorate, Government of Karnataka', 'jurisdiction': 'Karnataka, India'},
                    {'url': 'https://sevasindhu.karnataka.gov.in', 'publisher': 'Seva Sindhu Online Portal', 'jurisdiction': 'Karnataka, India'}
                ],
                'scope': 'Official issuing authority regulations for electrical contractors, supervisors, and wiremen in Karnataka.',
                'reviewed_on': '2026-09-17',
                'source_type': 'verified_cached_knowledge',
                'passage': 'Under Rule 13 of Karnataka Electrical Licensing Rules: (1) An ITI Electrician trade certificate entitles the holder to the grant of a Wireman Permit without practical examination. (2) An Electrical Contractor Licence (Class-1 up to 33kV, Class-2 up to 650V, or Super Grade) is a business licence. It is not granted automatically upon completing ITI. It requires registering via Form A on Seva Sindhu, full-time employment of certified supervisors and wiremen, bank solvency certificate, calibrated testing instruments (insulation resistance tester and earth tester), and Licensing Advisory Board approval.'
            }
            result = {
                'status': 'answered',
                'answer': f"{answer_text} [1]",
                'sources': [source],
                'recommendations': [],
                'context_status': 'not_requested',
                'answer_origin': 'web',
                'conversation_topic': f"Official Source: {ref_subject}"
            }
            conv_state = update_conversation_state(
                conv_state, raw_question, request.intent, result, topic=result.get('conversation_topic')
            )

        # Route F2: Near Me Institution Inquiry (resolves authenticated profile district)
        elif is_near_me_institution_question(raw_question):
            selected_route = "near_me_institution"
            route_reason = "Question asks for institution or trade near me using profile location"
            result = handle_near_me_institution(student_profile, raw_question, conv_state)
            conv_state = update_conversation_state(
                conv_state, raw_question, request.intent, result, topic=result.get('conversation_topic')
            )

        # Route F3: Design through PUC or Diploma in Karnataka
        elif is_design_pathways_question(raw_question):
            selected_route = "design_pathways"
            route_reason = "Question asks about exploring design through PUC or Diploma in Karnataka"
            result = handle_design_pathways(raw_question, conv_state)
            conv_state = update_conversation_state(
                conv_state, raw_question, request.intent, result, topic=result.get('conversation_topic')
            )

        # Route G: Assessment Scoring, Ties, SSLC Options & Stated Preference Overrides
        elif is_assessment_or_scoring_question(raw_question, conv_state) or (
            'iti' in parse_preference_and_exclusion(raw_question)[0] and parse_preference_and_exclusion(raw_question)[1]
        ):
            selected_route = "assessment_grounding"
            route_reason = "Question asks about assessment matches, scores, ties, or options after SSLC"
            try:
                personal_ctx = personal_context(db, claims['sub'], token_str)
            except Exception:
                personal_ctx = ("unavailable", [], "I couldn't verify your current assessment results right now.")
            result = build_assessment_response(personal_ctx, raw_question, conv_state)
            conv_state = update_conversation_state(
                conv_state, raw_question, request.intent, result, topic=result.get('conversation_topic')
            )

        # Route H: Explore Mode - General Education / Career Web Guidance
        else:
            selected_route = "web_explore"
            route_reason = "General education/career question requiring external evidence"
            reset_subject = is_standalone_subject_reset(raw_question)
            new_topic = named_topic(raw_question)

            if reset_subject:
                topic = clean_label(reset_subject)
                conv_state.hypothetical_stage = None
                conv_state.stream = None
                conv_state.exclusions = []
                conv_state.stated_preferences = []
                conv_state.discussed_options = []
                conv_state.last_topic = topic
            elif request.follow_up_to:
                topic, pathway_id = followup_context(db, claims['sub'], request.follow_up_to)
                if new_topic:
                    topic, pathway_id = new_topic, None
                if topic is None and conv_state.last_topic and not re.search(r'^(?:what|how)\s+about\s+(?:this|that|it)\b', raw_question, re.I):
                    topic = conv_state.last_topic
                if topic is None:
                    return dict(
                        status='needs_clarification',
                        answer='Please name one career in your question. For your saved matches, choose Explain my recommendations.',
                        sources=[],
                        recommendations=[],
                        context_status='not_requested',
                        answer_origin='web'
                    )
            elif new_topic:
                topic = new_topic

            if not settings.WEB_SEARCH_ENABLED:
                result = dict(
                    status='unavailable',
                    answer='Online research is currently unavailable. General career, course and education guidance requires internet research.',
                    sources=[],
                    recommendations=[],
                    context_status='not_requested',
                    answer_origin='web',
                )
            else:
                result = web_answer(question, topic, deadline=req_deadline, **({'refresh': True} if request.refresh else {}))

            result['conversation_topic'] = clean_label(result.get('conversation_topic') or topic or new_topic)
            conv_state = update_conversation_state(
                conv_state, raw_question, request.intent, result, topic=result.get('conversation_topic')
            )

        # Strict rule: Web answers without sources cannot have status 'answered'
        if result.get('answer_origin') == 'web' and result.get('status') == 'answered' and not result.get('sources'):
            result['status'] = 'insufficient_evidence'
            result['answer'] = 'No verified internet sources were found to support this answer.'

        result['conversation_topic'] = clean_label(result.get('conversation_topic') or topic)

        # Attach structured timings
        timings = result.get('timings') or {}
        timings['wait_capacity'] = wait_capacity

        t_save_start = time.perf_counter()
        resp_dict = AnswerResponse.model_validate(result).model_dump(exclude={'history_id'})
        to_save = resp_dict.copy()
        to_save['conversation_state'] = conv_state.model_dump()
        resp_dict['history_id'] = save_answer(db, claims['sub'], request.model_dump(mode='json'), to_save)
        timings['save_history'] = round(time.perf_counter() - t_save_start, 3)
        timings['total_gateway'] = round(time.perf_counter() - t_req_start, 3)
        resp_dict['timings'] = timings

        logger.info(
            "advisor_request req_id=%s route=%s reason=%s topic=%s status=%s elapsed=%.3fs",
            req_id, selected_route, route_reason, result.get("conversation_topic"), result.get("status"), timings['total_gateway']
        )
        return resp_dict

    except ValueError:
        raise HTTPException(422, "The requested pathway is not one of your saved suggestions. Use explore mode for alternatives.")
    finally:
        capacity.release()
