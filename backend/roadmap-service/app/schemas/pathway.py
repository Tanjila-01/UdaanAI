from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class PathwayOptionBase(BaseModel):
    option_name: str
    stream_or_code: Optional[str] = None
    description: str
    eligibility: Optional[str] = None
    display_order: int = 1


class PathwayOptionResponse(PathwayOptionBase):
    id: UUID
    pathway_id: str

    model_config = ConfigDict(from_attributes=True)


class PathwayMilestoneBase(BaseModel):
    step_number: int
    title: str
    description: str
    key_action: Optional[str] = None


class PathwayMilestoneResponse(PathwayMilestoneBase):
    id: UUID
    pathway_id: str
    is_active: bool = True

    model_config = ConfigDict(from_attributes=True)


class PathwayBase(BaseModel):
    education_level: str
    stream: Optional[str] = None
    title: str
    category: str
    duration: Optional[str] = None
    description: str
    parent_id: Optional[str] = None
    recommendation_dimensions: Optional[List[str]] = None


class PathwaySummaryResponse(PathwayBase):
    id: str
    created_at: datetime
    options_count: int = 0
    milestones_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class PathwayDetailResponse(PathwayBase):
    id: str
    created_at: datetime
    options: List[PathwayOptionResponse] = []
    milestones: List[PathwayMilestoneResponse] = []

    model_config = ConfigDict(from_attributes=True)


class PathwayListResponse(BaseModel):
    total: int
    education_level: Optional[str] = None
    stream: Optional[str] = None
    pathways: List[PathwayDetailResponse]
