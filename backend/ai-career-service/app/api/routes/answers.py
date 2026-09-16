import logging
import re
import time
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
    is_assessment_question,
    is_standalone_subject_reset,
)
from app.services.advisor_history import save_answer
from app.services.assessment_grounding import build_assessment_response
from app.services.career_answers import answer_question, personal_context
from app.services.followups import followup_context
from app.services.knowledge import PATHWAYS
from app.services.web_answers import named_topic, normalize_question, web_answer

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/career-intelligence", tags=["Career answers"])
capacity = BoundedSemaphore(1)
SHARED_BACKEND_DEADLINE = 24.0


class AnswerRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    question: str = Field(min_length=1, max_length=1000)
    intent: Literal["explore", "explain_recommendations"] = "explore"
    pathway_id: str | None = None
    language: Literal["en"] = "en"
    follow_up_to: UUID | None = None
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
    status: Literal["answered", "recommendations_explained", "insufficient_evidence", "needs_update", "out_of_scope", "unavailable", "needs_clarification"]
    answer: str
    sources: list[AnswerSource]
    recommendations: list[SavedPathwayExplanation]
    context_status: Literal["not_requested", "current", "missing", "outdated", "unavailable"]
    timings: dict[str, Any] | None = None


@router.post("/answers", response_model=AnswerResponse)
def career_answer(request: AnswerRequest, claims=Depends(get_current_user_claims),
                  credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    t_req_start = time.perf_counter()
    req_deadline = time.monotonic() + SHARED_BACKEND_DEADLINE
    if not capacity.acquire(blocking=False):
        raise HTTPException(429, "Local AI is busy. Please retry shortly.", headers={"Retry-After": "10"})
    wait_capacity = round(time.perf_counter() - t_req_start, 3)
    try:
        # 1. Fetch personal assessment context server-side when relevant
        personal_ctx = ("not_requested", [], "")
        token_str = credentials.credentials if credentials else ""
        needs_personal = (
            is_assessment_question(request.question)
            or bool(re.search(r'\b(?:what\s+(?:should|can)\s+i\s+(?:choose|do|take)|options\s+after)\b', request.question, re.I))
        )
        if needs_personal and request.intent != 'explain_recommendations':
            try:
                personal_ctx = personal_context(db, claims['sub'], token_str)
            except Exception:
                personal_ctx = ("unavailable", [], "I couldn't verify your current assessment results right now.")

        context_status, recommendations, intro = personal_ctx

        # 2. Fetch authenticated student profile stage
        actual_stage = None
        if needs_personal and token_str and request.intent != 'explain_recommendations':
            try:
                with httpx.Client(timeout=3.0, trust_env=False) as client:
                    res = client.get(
                        settings.STUDENT_SERVICE_URL.rstrip('/') + '/students/profile/me',
                        headers={'Authorization': f'Bearer {token_str}'}
                    )
                    if res.status_code == 200 and isinstance(res.json(), dict):
                        actual_stage = res.json().get('current_level')
            except Exception:
                pass

        # 3. Load structured conversation state
        conv_state = load_conversation_state(
            db, claims['sub'], request.follow_up_to, actual_stage=actual_stage
        )

        question = normalize_question(request.question)
        topic, pathway_id = None, request.pathway_id

        # 4. Route according to request intent and question content
        if request.follow_up_to and (request.intent != 'explore' or request.pathway_id is not None):
            raise HTTPException(422, 'Follow-ups use the selected career answer. Start a new question to change modes.')

        if request.intent == 'explain_recommendations':
            result = answer_question(
                db, claims['sub'], token_str, question,
                request.intent, pathway_id, conversation_topic=topic
            )
            result['answer_origin'] = 'local'
        elif is_assessment_question(request.question, conv_state):
            # Deterministic, local assessment response grounded in stored DB records
            result = build_assessment_response(personal_ctx, request.question, conv_state)
            conv_state = update_conversation_state(
                conv_state, request.question, request.intent, result, topic=result.get('conversation_topic')
            )
            result['conversation_topic'] = clean_label(result.get('conversation_topic'))
        else:
            # Explore mode: General education / career web guidance
            reset_subject = is_standalone_subject_reset(request.question)
            new_topic = named_topic(request.question)

            if reset_subject:
                topic = clean_label(reset_subject)
                conv_state.hypothetical_stage = None
                conv_state.stream = None
                conv_state.exclusions = []
                conv_state.last_topic = topic
            elif request.follow_up_to:
                if request.pathway_id is not None:
                    raise HTTPException(422, 'Follow-ups use the selected career answer. Start a new question to change modes.')
                topic, pathway_id = followup_context(db, claims['sub'], request.follow_up_to)
                if new_topic:
                    topic, pathway_id = new_topic, None
                if topic is None and conv_state.last_topic and not re.search(r'^(?:what|how)\s+about\s+(?:this|that|it)\b', request.question, re.I):
                    topic = conv_state.last_topic
                if topic is None:
                    return dict(status='needs_clarification', answer='Please name one career in your question. For your saved matches, choose Explain my recommendations.', sources=[], recommendations=[], context_status='not_requested', answer_origin='web')
            elif new_topic:
                topic = new_topic
            elif conv_state.last_topic:
                topic = conv_state.last_topic

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

            # Turn 1 personal pathway-choice check:
            # If the student asks what to choose at their current education level, lead with actual saved match
            is_personal_choice = bool(
                re.search(r'\b(?:what\s+(?:should|can)\s+i\s+(?:choose|do|take)(?:\s+next)?|what\s+next|next\s+step)\b', question, re.I)
                and ('10th' in question.lower() or '12th' in question.lower() or (actual_stage and actual_stage.lower() in question.lower()))
            )
            if is_personal_choice:
                if context_status == 'current' and recommendations:
                    top = recommendations[0]
                    second = recommendations[1] if len(recommendations) > 1 else None
                    third = recommendations[2] if len(recommendations) > 2 else None
                    conv_state.last_recommended_pathway = top['title']
                    alt_titles = ', '.join(r['title'] for r in recommendations[1:3])
                    prefix = (
                        f"**Based on your saved assessment:**\n"
                        f"Your top recommended pathway to explore first is **{top['title']}** (match score: {top['match_score']}/100 · {top['match_label']}). "
                        f"This is an exploratory suggestion based on your questionnaire interests, not a compulsory assignment or proof of ability."
                    )
                    if alt_titles:
                        prefix += f" Your profile also lists alternative options to consider, including {alt_titles}."

                    std_options = (
                        "**Standard options after 10th in India:**\n"
                        "1. **Pre-University College (PUC / 11th–12th)**: Academic foundation across Science, Commerce, or Arts streams.\n"
                        "2. **Polytechnic Diploma**: 3-year technical engineering diploma programs.\n"
                        "3. **Industrial Training Institutes (ITI)**: 1–2 year trade training for direct practical careers."
                    )

                    if result.get('status') == 'answered' and result.get('sources'):
                        result['answer'] = f"{prefix}\n\n**Verified course facts:**\n{result['answer']}"
                    else:
                        result['answer'] = f"{prefix}\n\n{std_options}"
                        result['sources'] = []
                        result['answer_origin'] = 'local'
                        result['status'] = 'answered'

                    result['recommendations'] = recommendations
                    result['context_status'] = 'current'
                    result['conversation_topic'] = "options after 10th"
                elif context_status == 'missing':
                    std_options = (
                        "*(Note: You haven't completed your interest questionnaire yet. Complete your assessment to see personalized recommendations.)*\n\n"
                        "**General pathway options after 10th in India:**\n"
                        "1. **Pre-University College (PUC / 11th–12th)**: Science, Commerce, or Arts.\n"
                        "2. **Polytechnic Diploma**: 3-year applied technical courses.\n"
                        "3. **ITI Vocational Trades**: 1–2 year practical job-ready trades."
                    )
                    if result.get('status') == 'answered' and result.get('sources'):
                        result['answer'] = (
                            "*(Note: You haven't completed your interest questionnaire yet. Complete your assessment to see personalized recommendations.)*\n\n"
                            "**General pathway options after 10th in India:**\n" + result['answer']
                        )
                    else:
                        result['answer'] = std_options
                        result['sources'] = []
                        result['answer_origin'] = 'local'
                        result['status'] = 'answered'
                    result['context_status'] = 'missing'
                    result['conversation_topic'] = "options after 10th"
                elif context_status == 'outdated':
                    result['answer'] = (
                        "*(Note: Your saved suggestions no longer match your current academic stage. Update your assessment to see refreshed recommendations.)*\n\n"
                        "**General pathway options after 10th in India:**\n" + result.get('answer', '')
                    )
                    result['context_status'] = 'outdated'
                    result['conversation_topic'] = "options after 10th"

            result['conversation_topic'] = clean_label(result.get('conversation_topic') or topic or new_topic)
            conv_state = update_conversation_state(
                conv_state, request.question, request.intent, result, topic=result.get('conversation_topic')
            )

        # Strict rule: Web answers without sources cannot have status 'answered'
        if result.get('answer_origin') == 'web' and result.get('status') == 'answered' and not result.get('sources'):
            result['status'] = 'insufficient_evidence'
            result['answer'] = 'No verified internet sources were found to support this answer.'

        result['conversation_topic'] = clean_label(result.get('conversation_topic') or topic)

        # Attach stage timings
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
        return resp_dict
    except ValueError:
        raise HTTPException(422, "The requested pathway is not one of your saved suggestions. Use explore mode for alternatives.")
    finally:
        capacity.release()
