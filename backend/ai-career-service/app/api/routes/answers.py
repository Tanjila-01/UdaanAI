from threading import BoundedSemaphore
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy.orm import Session

from app.core.security import get_current_user_claims, security
from app.db.session import get_db
from app.services.career_answers import answer_question
from app.services.knowledge import PATHWAYS

router = APIRouter(prefix="/career-intelligence", tags=["Career answers"])
capacity = BoundedSemaphore(1)


class AnswerRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    question: str = Field(min_length=1, max_length=1000)
    intent: Literal["explore", "explain_recommendations"] = "explore"
    pathway_id: str | None = None
    language: Literal["en"] = "en"

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
    status: Literal["answered", "recommendations_explained", "insufficient_evidence", "needs_update", "out_of_scope", "unavailable"]
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
        return answer_question(db, claims["sub"], credentials.credentials, request.question,
                               request.intent, request.pathway_id)
    except ValueError:
        raise HTTPException(422, "The requested pathway is not one of your saved suggestions. Use explore mode for alternatives.")
    finally:
        capacity.release()
