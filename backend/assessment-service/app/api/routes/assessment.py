from uuid import UUID
from typing import List, Optional
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_user_claims
from app.schemas.assessment import (
    AssessmentSummaryResponse,
    AssessmentDetailResponse,
    AttemptCreateResponse,
    AttemptDetailResponse,
    AnswerSubmitRequest,
    AnswerResponse,
    AssessmentResultResponse,
)
from app.services.assessment_service import AssessmentService

router = APIRouter(prefix="/assessments", tags=["Assessment Service"])


@router.get("", response_model=List[AssessmentSummaryResponse])
def list_assessments(db: Session = Depends(get_db)):
    return AssessmentService.get_active_assessments(db)


@router.get("/my-latest-result", response_model=Optional[AssessmentResultResponse])
def get_my_latest_result(
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db)
):
    user_id = claims.get("sub")
    return AssessmentService.get_my_latest_result(db, user_id)


@router.get("/{assessment_id}", response_model=AssessmentDetailResponse)
def get_assessment(
    assessment_id: str,
    db: Session = Depends(get_db)
):
    return AssessmentService.get_assessment_by_id(db, assessment_id)


@router.post("/{assessment_id}/attempts", response_model=AttemptCreateResponse, status_code=status.HTTP_201_CREATED)
def start_attempt(
    assessment_id: str,
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db)
):
    user_id = claims.get("sub")
    return AssessmentService.start_assessment_attempt(db, user_id, assessment_id)


@router.post("/attempts/{attempt_id}/answers", response_model=AnswerResponse)
def submit_answer(
    attempt_id: UUID,
    data: AnswerSubmitRequest,
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db)
):
    user_id = claims.get("sub")
    return AssessmentService.submit_answer(db, user_id, attempt_id, data)


@router.post("/attempts/{attempt_id}/complete", response_model=AssessmentResultResponse)
def complete_attempt(
    attempt_id: UUID,
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db)
):
    user_id = claims.get("sub")
    return AssessmentService.complete_assessment(db, user_id, attempt_id)


@router.get("/attempts/{attempt_id}", response_model=AttemptDetailResponse)
def get_attempt_detail(
    attempt_id: UUID,
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db)
):
    user_id = claims.get("sub")
    return AssessmentService.get_attempt_detail(db, user_id, attempt_id)


@router.get("/attempts/{attempt_id}/result", response_model=AssessmentResultResponse)
def get_attempt_result(
    attempt_id: UUID,
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db)
):
    user_id = claims.get("sub")
    return AssessmentService.get_attempt_result(db, user_id, attempt_id)
