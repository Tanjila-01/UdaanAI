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

router = APIRouter(prefix="/career-intelligence", tags=["Career answers"])
capacity = BoundedSemaphore(1)


class AnswerRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    question: str = Field(min_length=1, max_length=1000)
    intent: Literal["explore", "explain_recommendations"] = "explore"
    pathway_id: str | None = None
    language: Literal["en"] = "en"
    follow_up_to: UUID | None = None

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
        if request.follow_up_to:
            if request.intent != 'explore' or request.pathway_id is not None:
                raise HTTPException(422, 'Follow-ups use the selected career answer. Start a new question to change modes.')
            topic, pathway_id = followup_context(db, claims['sub'], request.follow_up_to)
            if topic is None:
                return dict(status='needs_clarification', answer='Please name one career in your question. For your saved matches, choose Explain my recommendations.', sources=[], recommendations=[], context_status='not_requested')
        result = answer_question(db, claims["sub"], credentials.credentials, request.question,
                               request.intent, pathway_id, conversation_topic=topic)
        result['conversation_topic'] = topic
        result = AnswerResponse.model_validate(result).model_dump(exclude={'history_id'})
        result['history_id'] = save_answer(db, claims['sub'], request.model_dump(mode='json'), result.copy())
        return result
    except ValueError:
        raise HTTPException(422, "The requested pathway is not one of your saved suggestions. Use explore mode for alternatives.")
    finally:
        capacity.release()
