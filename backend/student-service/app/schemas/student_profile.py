from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from uuid import UUID


class ProfileCreate(BaseModel):
    full_name: Optional[str] = None
    current_level: str = Field(..., min_length=2, max_length=100)
    class_or_year: str = Field(..., min_length=2, max_length=50)
    board: str = Field(..., min_length=2, max_length=150)
    institution_name: str = Field(..., min_length=2, max_length=255)
    district: str = Field(..., min_length=2, max_length=150)
    state: str = Field(default="Karnataka", max_length=100)
    preferred_language: Optional[str] = Field(default="English", max_length=50)


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    current_level: Optional[str] = None
    class_or_year: Optional[str] = None
    board: Optional[str] = None
    institution_name: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    preferred_language: Optional[str] = None


class ProfileResponse(BaseModel):
    id: UUID
    user_id: UUID
    full_name: str
    current_level: str
    class_or_year: str
    board: str
    institution_name: str
    district: str
    state: str
    preferred_language: Optional[str] = None
    is_complete: bool
    completion_percentage: int

    model_config = ConfigDict(from_attributes=True)
