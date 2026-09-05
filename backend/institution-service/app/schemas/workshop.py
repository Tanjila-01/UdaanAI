import re
from datetime import date, datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict

KARNATAKA_DISTRICTS = [
    "Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban",
    "Bidar", "Chamarajanagar", "Chikkaballapur", "Chikkamagaluru", "Chitradurga",
    "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan",
    "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal",
    "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga",
    "Tumakuru", "Udupi", "Uttara Kannada", "Vijayanagara", "Yadgir",
]

ALLOWED_INSTITUTION_TYPES = {
    "high_school",
    "puc_college",
    "polytechnic",
    "iti",
    "degree_college",
    "other",
}

ALLOWED_MODES = {"online", "offline", "hybrid"}

ALLOWED_TOPICS = {
    "career_guidance",
    "ai_literacy",
    "future_skills",
    "polytechnic_vs_puc",
}


# --- Public Schemas ---

class PublicWorkshopRequestCreate(BaseModel):
    institution_name: str = Field(..., min_length=2, max_length=255)
    institution_type: str = Field(...)
    contact_name: str = Field(..., min_length=2, max_length=255)
    contact_phone: str = Field(..., min_length=10, max_length=30)
    contact_email: EmailStr
    district: str = Field(...)
    city: Optional[str] = Field(None, max_length=100)
    student_count: int = Field(..., ge=1, le=5000)
    preferred_mode: str = Field(...)
    preferred_topics: List[str] = Field(...)
    preferred_date: Optional[date] = None
    message: Optional[str] = Field(None, max_length=1000)

    @field_validator("institution_type")
    @classmethod
    def validate_institution_type(cls, v: str) -> str:
        clean = v.strip().lower()
        if clean not in ALLOWED_INSTITUTION_TYPES:
            raise ValueError(f"Invalid institution type. Allowed: {', '.join(sorted(ALLOWED_INSTITUTION_TYPES))}")
        return clean

    @field_validator("district")
    @classmethod
    def validate_district(cls, v: str) -> str:
        clean = v.strip()
        matched = next((d for d in KARNATAKA_DISTRICTS if d.lower() == clean.lower()), None)
        if not matched:
            raise ValueError("District must be a valid Karnataka district.")
        return matched

    @field_validator("preferred_mode")
    @classmethod
    def validate_preferred_mode(cls, v: str) -> str:
        clean = v.strip().lower()
        if clean not in ALLOWED_MODES:
            raise ValueError(f"Invalid mode. Allowed: {', '.join(sorted(ALLOWED_MODES))}")
        return clean

    @field_validator("preferred_topics")
    @classmethod
    def validate_preferred_topics(cls, topics: List[str]) -> List[str]:
        if not topics:
            raise ValueError("At least one preferred topic must be selected.")
        clean_topics = []
        for t in topics:
            t_clean = t.strip().lower()
            if t_clean not in ALLOWED_TOPICS:
                raise ValueError(f"Invalid topic '{t}'. Allowed: {', '.join(sorted(ALLOWED_TOPICS))}")
            if t_clean not in clean_topics:
                clean_topics.append(t_clean)
        return clean_topics

    @field_validator("contact_phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        clean = re.sub(r"[\s\-\(\)\+]", "", v)
        if len(clean) < 10 or not clean.isdigit():
            raise ValueError("Contact phone must contain at least 10 digits.")
        return v.strip()


class PublicWorkshopRequestResponse(BaseModel):
    id: UUID
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Schedule Schemas ---

class WorkshopScheduleCreate(BaseModel):
    scheduled_start: datetime
    duration_minutes: Optional[int] = Field(None, ge=15, le=480)
    mode: str = Field(..., max_length=30)
    venue_or_meeting_link: str = Field(..., min_length=2, max_length=1000)
    assigned_facilitator: Optional[str] = Field(None, max_length=255)
    internal_notes: Optional[str] = Field(None, max_length=2000)

    @field_validator("mode")
    @classmethod
    def validate_mode(cls, v: str) -> str:
        clean = v.strip().lower()
        if clean not in {"online", "offline", "hybrid"}:
            raise ValueError("Mode must be online, offline, or hybrid.")
        return clean


class WorkshopScheduleUpdate(BaseModel):
    scheduled_start: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(None, ge=15, le=480)
    mode: Optional[str] = Field(None, max_length=30)
    venue_or_meeting_link: Optional[str] = Field(None, min_length=2, max_length=1000)
    assigned_facilitator: Optional[str] = Field(None, max_length=255)
    internal_notes: Optional[str] = Field(None, max_length=2000)

    @field_validator("mode")
    @classmethod
    def validate_mode(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            clean = v.strip().lower()
            if clean not in {"online", "offline", "hybrid"}:
                raise ValueError("Mode must be online, offline, or hybrid.")
            return clean
        return v


class WorkshopScheduleResponse(BaseModel):
    id: UUID
    request_id: UUID
    scheduled_start: datetime
    duration_minutes: Optional[int] = None
    mode: str
    venue_or_meeting_link: str
    assigned_facilitator: Optional[str] = None
    internal_notes: Optional[str] = None
    actual_attendance: Optional[int] = None
    completion_notes: Optional[str] = None
    feedback_score: Optional[float] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Admin Operation Schemas ---

class WorkshopCompleteRequest(BaseModel):
    actual_attendance: Optional[int] = Field(None, ge=0)
    completion_notes: Optional[str] = Field(None, max_length=2000)
    feedback_score: Optional[float] = Field(None, ge=0.0, le=5.0)


class WorkshopCancelRequest(BaseModel):
    cancellation_reason: str = Field(..., min_length=3, max_length=500)


class AdminWorkshopRequestResponse(BaseModel):
    id: UUID
    institution_name: str
    institution_type: str
    contact_name: str
    contact_phone: str
    contact_email: str
    district: str
    city: Optional[str] = None
    student_count: int
    preferred_mode: str
    preferred_topics: List[str]
    preferred_date: Optional[date] = None
    message: Optional[str] = None
    status: str
    cancelled_at: Optional[datetime] = None
    cancellation_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    schedule: Optional[WorkshopScheduleResponse] = None

    model_config = ConfigDict(from_attributes=True)


class AdminOverviewMetrics(BaseModel):
    new_requests: int
    contacted_requests: int
    scheduled_workshops: int
    completed_workshops: int
    upcoming_this_week: int


class AdminOverviewResponse(BaseModel):
    metrics: AdminOverviewMetrics
    recent_new_requests: List[AdminWorkshopRequestResponse]
    upcoming_workshops: List[AdminWorkshopRequestResponse]
