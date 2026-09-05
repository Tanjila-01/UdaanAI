from uuid import UUID
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class OptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    question_id: UUID
    option_text: str
    option_code: str
    weight_dimension: str
    display_order: int


class QuestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    assessment_id: str
    question_text: str
    dimension: str
    display_order: int
    options: List[OptionResponse] = []


class AssessmentSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    description: str
    category: str
    total_questions: int
    is_active: bool
    target_level: str
    target_stream: Optional[str] = None
    assessment_version: str
    scoring_version: str
    created_at: datetime


class AssessmentDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    description: str
    category: str
    total_questions: int
    is_active: bool
    target_level: str
    target_stream: Optional[str] = None
    assessment_version: str
    scoring_version: str
    created_at: datetime
    questions: List[QuestionResponse] = []


class AnswerSubmitRequest(BaseModel):
    question_id: UUID
    selected_option_id: UUID


class AnswerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    attempt_id: UUID
    question_id: UUID
    selected_option_id: UUID
    created_at: datetime


class AttemptCreateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    student_id: UUID
    assessment_id: str
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None


class AssessmentResultResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    attempt_id: UUID
    user_id: UUID
    assessment_id: str
    assessment_version: str
    scoring_version: str
    primary_stream_recommendation: str
    secondary_stream_recommendation: Optional[str] = None
    top_career_match: str
    dimension_scores: Dict[str, Any]
    summary_text: str
    is_current: Optional[bool] = None
    created_at: datetime


class AttemptDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    student_id: UUID
    assessment_id: str
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    answers: List[AnswerResponse] = []
    result: Optional[AssessmentResultResponse] = None
