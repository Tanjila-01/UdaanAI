import re
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict


class GeneralInquiryCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Full name of sender")
    email: EmailStr = Field(..., max_length=254, description="Valid email address")
    subject: str = Field(..., min_length=3, max_length=150, description="Inquiry subject")
    message: str = Field(..., min_length=10, max_length=2000, description="Message content")

    @field_validator("name", "subject", "message", mode="before")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        if isinstance(v, str):
            v = v.strip()
        return v

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        if isinstance(v, str):
            v = v.strip().lower()
        return v


class GeneralInquiryPublicResponse(BaseModel):
    id: UUID
    status: str
    message: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GeneralInquiryAdminResponse(BaseModel):
    id: UUID
    name: str
    email: str
    subject: str
    message: str
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GeneralInquiryStatusUpdate(BaseModel):
    status: str = Field(..., description="New status: NEW, CONTACTED, RESOLVED, ARCHIVED")

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        upper_v = v.strip().upper()
        valid = {"NEW", "CONTACTED", "RESOLVED", "ARCHIVED"}
        if upper_v not in valid:
            raise ValueError(f"Status must be one of: {', '.join(sorted(valid))}")
        return upper_v

