from uuid import UUID
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class RecommendationItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    rank: int
    pathway_id: str
    pathway_title: str
    match_score: int
    match_label: str
    reasons: List[str]
    eligibility_warning: Optional[str] = None


class RecommendationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    generated_at: datetime
    source_scoring_version: str
    disclaimer: str
    recommendations: List[RecommendationItemResponse]
