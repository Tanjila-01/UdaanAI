from threading import BoundedSemaphore
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy.orm import Session

from app.core.security import get_current_user_claims, security
from app.db.session import get_db
from app.services.career_answers import answer_question
from app.services.knowledge import PATHWAYS
from app.services.advisor_history import save_answer
from app.services.followups import followup_context
from app.services.web_answers import web_answer, named_topic, normalize_question
from app.core.config import settings

router = APIRouter(prefix="/career-intelligence", tags=["Career answers"])
capacity = BoundedSemaphore(1)


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


@router.post("/answers", response_model=AnswerResponse)
def career_answer(request: AnswerRequest, claims=Depends(get_current_user_claims),
                  credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    if not capacity.acquire(blocking=False):
        raise HTTPException(429, "Local AI is busy. Please retry shortly.", headers={"Retry-After": "10"})
    try:
        topic, pathway_id = None, request.pathway_id
        question = normalize_question(request.question)
        new_topic = named_topic(request.question) if request.intent == 'explore' else None
        if request.follow_up_to:
            if request.intent != 'explore' or request.pathway_id is not None:
                raise HTTPException(422, 'Follow-ups use the selected career answer. Start a new question to change modes.')
            topic, pathway_id = followup_context(db, claims['sub'], request.follow_up_to)
            if new_topic:
                topic, pathway_id = new_topic, None
            if topic is None and (request.answer_mode == 'local' or not settings.WEB_SEARCH_ENABLED):
                return dict(status='needs_clarification', answer='Please name one career in your question. For your saved matches, choose Explain my recommendations.', sources=[], recommendations=[], context_status='not_requested')
        # General education/career chat researches the web first. Scored personal
        # recommendations remain deterministic and do not leave the server.
        if request.intent == 'explore' and request.answer_mode != 'local' and settings.WEB_SEARCH_ENABLED:
            result = web_answer(question, topic, **({'refresh': True} if request.refresh else {}))
            if request.answer_mode == 'auto' and result['status'] in {'insufficient_evidence', 'unavailable'}:
                local = answer_question(db, claims['sub'], credentials.credentials, question,
                                        request.intent, pathway_id, conversation_topic=topic)
                if local['status'] == 'answered':
                    result = local
        else:
            result = answer_question(db, claims['sub'], credentials.credentials, question,
                                    request.intent, pathway_id, conversation_topic=topic)
        result['conversation_topic'] = result.get('conversation_topic') or topic or new_topic
        result = AnswerResponse.model_validate(result).model_dump(exclude={'history_id'})
        result['history_id'] = save_answer(db, claims['sub'], request.model_dump(mode='json'), result.copy())
        return result
    except ValueError:
        raise HTTPException(422, "The requested pathway is not one of your saved suggestions. Use explore mode for alternatives.")
    finally:
        capacity.release()
