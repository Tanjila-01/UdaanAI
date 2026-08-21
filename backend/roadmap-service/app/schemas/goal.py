from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class CreateGoalRequest(BaseModel):
    pathway_id: str
    pathway_option_id: Optional[UUID] = None


class MilestoneProgressResponse(BaseModel):
    id: UUID
    milestone_id: UUID
    step_number: int
    title: str
    description: str
    key_action: Optional[str] = None
    status: str  # 'LOCKED', 'AVAILABLE', 'COMPLETED'
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class GoalProgressSummary(BaseModel):
    completed: int
    total: int
    percentage: float


class StudentGoalResponse(BaseModel):
    id: UUID
    student_id: UUID
    pathway_id: str
    pathway_title: str
    pathway_option_id: Optional[UUID] = None
    pathway_option_name: Optional[str] = None
    goal_title: str
    status: str  # 'ACTIVE', 'COMPLETED', 'ARCHIVED'
    created_at: datetime
    progress: GoalProgressSummary
    milestones: List[MilestoneProgressResponse]

    model_config = ConfigDict(from_attributes=True)
