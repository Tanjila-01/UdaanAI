import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.inquiry import GeneralInquiry
from app.schemas.inquiry import GeneralInquiryCreate, GeneralInquiryPublicResponse, GeneralInquiryAdminResponse


# In-memory sliding window rate limiter: email -> list of UTC submission timestamps
_SUBMISSION_HISTORY: Dict[str, List[datetime]] = {}
RATE_LIMIT_WINDOW = timedelta(minutes=5)
MAX_SUBMISSIONS_PER_WINDOW = 5


def _check_rate_limit(key: str) -> None:
    now = datetime.now(timezone.utc)
    cutoff = now - RATE_LIMIT_WINDOW
    timestamps = [t for t in _SUBMISSION_HISTORY.get(key, []) if t > cutoff]
    if len(timestamps) >= MAX_SUBMISSIONS_PER_WINDOW:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many contact submissions. Please wait a few minutes before trying again.",
        )
    timestamps.append(now)
    _SUBMISSION_HISTORY[key] = timestamps


def reset_rate_limits() -> None:
    """Utility for testing purposes."""
    _SUBMISSION_HISTORY.clear()


class InquiryService:
    @staticmethod
    def create_public_inquiry(db: Session, data: GeneralInquiryCreate, client_ip: Optional[str] = None) -> GeneralInquiryPublicResponse:
        rate_key = (data.email or "").strip().lower()
        if client_ip:
            rate_key = f"{rate_key}:{client_ip}"
        _check_rate_limit(rate_key)

        inquiry = GeneralInquiry(
            id=uuid.uuid4(),
            name=data.name.strip(),
            email=data.email.strip().lower(),
            subject=data.subject.strip(),
            message=data.message.strip(),
            status="NEW",
            created_at=datetime.now(timezone.utc),
        )

        db.add(inquiry)
        db.commit()
        db.refresh(inquiry)

        return GeneralInquiryPublicResponse(
            id=inquiry.id,
            status="RECEIVED",
            message="Your enquiry has been received. Our team will review it shortly.",
            created_at=inquiry.created_at,
        )

    @staticmethod
    def list_admin_inquiries(db: Session, status_filter: Optional[str] = None) -> List[GeneralInquiryAdminResponse]:
        query = db.query(GeneralInquiry)
        if status_filter:
            query = query.filter(GeneralInquiry.status == status_filter.upper())
        inquiries = query.order_by(GeneralInquiry.created_at.desc()).all()
        return [GeneralInquiryAdminResponse.model_validate(item) for item in inquiries]

    @staticmethod
    def update_inquiry_status(db: Session, inquiry_id: uuid.UUID, new_status: str) -> GeneralInquiryAdminResponse:
        inquiry = db.query(GeneralInquiry).filter(GeneralInquiry.id == inquiry_id).first()
        if not inquiry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Contact inquiry {inquiry_id} not found."
            )
        inquiry.status = new_status.upper()
        db.commit()
        db.refresh(inquiry)
        return GeneralInquiryAdminResponse.model_validate(inquiry)

