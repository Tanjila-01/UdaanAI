import hashlib
import json
import re
import uuid
from datetime import date, datetime, timezone, timedelta
from typing import List, Optional
from zoneinfo import ZoneInfo
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status

from app.models.workshop import WorkshopRequest, WorkshopSchedule
from app.schemas.workshop import (
    PublicWorkshopRequestCreate,
    WorkshopScheduleCreate,
    WorkshopScheduleUpdate,
    WorkshopCompleteRequest,
    WorkshopCancelRequest,
    AdminOverviewResponse,
    AdminOverviewMetrics,
)


def compute_payload_hash(data: PublicWorkshopRequestCreate) -> str:
    """Computes a SHA-256 hash of the normalized request payload."""
    canonical = {
        "institution_name": data.institution_name.strip().lower(),
        "institution_type": data.institution_type.strip().lower(),
        "contact_name": data.contact_name.strip().lower(),
        "contact_phone": re.sub(r"[\s\-\(\)\+]", "", data.contact_phone),
        "contact_email": data.contact_email.strip().lower(),
        "district": data.district.strip(),
        "city": (data.city.strip().lower() if data.city else ""),
        "student_count": data.student_count,
        "preferred_mode": data.preferred_mode.strip().lower(),
        "preferred_topics": sorted(t.strip().lower() for t in data.preferred_topics),
        "preferred_date": data.preferred_date.isoformat() if data.preferred_date else "",
        "message": (data.message.strip() if data.message else ""),
    }
    canonical_str = json.dumps(canonical, sort_keys=True)
    return hashlib.sha256(canonical_str.encode("utf-8")).hexdigest()


def compute_active_duplicate_hash_from_fields(
    institution_name: str,
    district: str,
    contact_email: str,
    preferred_mode: str,
    preferred_date: Optional[date],
    preferred_topics: list[str],
) -> str:
    """Computes a SHA-256 hash representing key fields of an active workshop request from raw fields."""
    key_parts = [
        (institution_name or "").strip().lower(),
        (district or "").strip(),
        (contact_email or "").strip().lower(),
        (preferred_mode or "").strip().lower(),
        preferred_date.isoformat() if preferred_date else "NONE",
        ",".join(sorted(t.strip().lower() for t in (preferred_topics or []))),
    ]
    key_str = "|".join(key_parts)
    return hashlib.sha256(key_str.encode("utf-8")).hexdigest()


def compute_active_duplicate_hash(data: PublicWorkshopRequestCreate) -> str:
    """Computes a SHA-256 hash representing key fields of an active workshop request from schema data."""
    return compute_active_duplicate_hash_from_fields(
        institution_name=data.institution_name,
        district=data.district,
        contact_email=data.contact_email,
        preferred_mode=data.preferred_mode,
        preferred_date=data.preferred_date,
        preferred_topics=data.preferred_topics,
    )


class WorkshopService:

    @staticmethod
    def create_public_request(db: Session, data: PublicWorkshopRequestCreate) -> WorkshopRequest:
        # 1. Enforce calendar date in Asia/Kolkata
        if data.preferred_date:
            today_kolkata = datetime.now(ZoneInfo("Asia/Kolkata")).date()
            if data.preferred_date < today_kolkata:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Please choose today or a future date.",
                )

        p_hash = compute_payload_hash(data)
        dup_hash = compute_active_duplicate_hash(data)
        clean_submission_id = data.submission_id.strip() if data.submission_id else None

        # 2. Check submission_id if provided
        if clean_submission_id:
            existing_sub = (
                db.query(WorkshopRequest)
                .filter(WorkshopRequest.submission_id == clean_submission_id)
                .first()
            )
            if existing_sub:
                # Bound submission ID check: same payload returns existing record; changed payload raises conflict
                if existing_sub.payload_hash == p_hash:
                    return existing_sub
                else:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Submission ID conflict: this submission ID was already used with different request data.",
                    )

        # 3. Active duplicate detection check before insert
        # 3a. Match by active_duplicate_hash (covers new and migrated records)
        active_dup = (
            db.query(WorkshopRequest)
            .filter(
                WorkshopRequest.active_duplicate_hash == dup_hash,
                WorkshopRequest.status.in_(["NEW", "CONTACTED", "SCHEDULED"]),
            )
            .first()
        )
        if not active_dup:
            # 3b. Match against legacy active records with NULL hashes using identical normalized criteria
            legacy_candidates = (
                db.query(WorkshopRequest)
                .filter(
                    WorkshopRequest.active_duplicate_hash.is_(None),
                    WorkshopRequest.status.in_(["NEW", "CONTACTED", "SCHEDULED"]),
                    func.lower(func.trim(WorkshopRequest.contact_email)) == data.contact_email.strip().lower(),
                    WorkshopRequest.district == data.district,
                )
                .all()
            )
            for cand in legacy_candidates:
                cand_hash = compute_active_duplicate_hash_from_fields(
                    institution_name=cand.institution_name,
                    contact_email=cand.contact_email,
                    district=cand.district,
                    preferred_mode=cand.preferred_mode,
                    preferred_date=cand.preferred_date,
                    preferred_topics=cand.preferred_topics or [],
                )
                if cand_hash == dup_hash:
                    active_dup = cand
                    break

        if active_dup:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This workshop request has already been submitted.",
            )

        # 4. Insert record with concurrency handling
        request = WorkshopRequest(
            submission_id=clean_submission_id,
            payload_hash=p_hash,
            active_duplicate_hash=dup_hash,
            institution_name=data.institution_name.strip(),
            institution_type=data.institution_type,
            contact_name=data.contact_name.strip(),
            contact_phone=data.contact_phone.strip(),
            contact_email=data.contact_email.strip().lower(),
            district=data.district,
            city=data.city.strip() if data.city else None,
            student_count=data.student_count,
            preferred_mode=data.preferred_mode,
            preferred_topics=data.preferred_topics,
            preferred_date=data.preferred_date,
            message=data.message.strip() if data.message else None,
            status="NEW",
        )
        db.add(request)
        try:
            db.commit()
            db.refresh(request)
            return request
        except IntegrityError:
            db.rollback()
            # Check if collision was submission_id idempotency race
            if clean_submission_id:
                winner = (
                    db.query(WorkshopRequest)
                    .filter(WorkshopRequest.submission_id == clean_submission_id)
                    .first()
                )
                if winner:
                    if winner.payload_hash == p_hash:
                        return winner
                    else:
                        raise HTTPException(
                            status_code=status.HTTP_409_CONFLICT,
                            detail="Submission ID conflict: this submission ID was already used with different request data.",
                        )

            # Check if collision was active duplicate race (partial unique index on active_duplicate_hash)
            active_winner = (
                db.query(WorkshopRequest)
                .filter(
                    WorkshopRequest.active_duplicate_hash == dup_hash,
                    WorkshopRequest.status.in_(["NEW", "CONTACTED", "SCHEDULED"]),
                )
                .first()
            )
            if active_winner:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="This workshop request has already been submitted.",
                )

            # Fallback for unexpected integrity error
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This workshop request could not be processed due to a duplicate conflict.",
            )

    @staticmethod
    def list_requests(
        db: Session,
        status_filter: Optional[str] = None,
        district_filter: Optional[str] = None,
        mode_filter: Optional[str] = None,
        search_query: Optional[str] = None,
    ) -> List[WorkshopRequest]:
        query = db.query(WorkshopRequest).options(joinedload(WorkshopRequest.schedule))

        if status_filter and status_filter.strip().upper() != "ALL":
            query = query.filter(WorkshopRequest.status == status_filter.strip().upper())

        if district_filter and district_filter.strip().upper() != "ALL":
            query = query.filter(WorkshopRequest.district == district_filter.strip())

        if mode_filter and mode_filter.strip().upper() != "ALL":
            query = query.filter(WorkshopRequest.preferred_mode == mode_filter.strip().lower())

        if search_query and search_query.strip():
            term = f"%{search_query.strip().lower()}%"
            query = query.filter(
                or_(
                    func.lower(WorkshopRequest.institution_name).like(term),
                    func.lower(WorkshopRequest.contact_name).like(term),
                    func.lower(WorkshopRequest.contact_email).like(term),
                    func.lower(WorkshopRequest.district).like(term),
                )
            )

        return query.order_by(WorkshopRequest.created_at.desc()).all()

    @staticmethod
    def get_request_by_id(db: Session, request_id: uuid.UUID) -> WorkshopRequest:
        req = (
            db.query(WorkshopRequest)
            .options(joinedload(WorkshopRequest.schedule))
            .filter(WorkshopRequest.id == request_id)
            .first()
        )
        if not req:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Workshop request '{request_id}' not found.",
            )
        return req

    @staticmethod
    def mark_contacted(db: Session, request_id: uuid.UUID) -> WorkshopRequest:
        req = WorkshopService.get_request_by_id(db, request_id)

        if req.status == "CONTACTED":
            return req

        if req.status != "NEW":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Cannot mark request as CONTACTED from current status '{req.status}'.",
            )

        req.status = "CONTACTED"
        req.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(req)
        return req

    @staticmethod
    def schedule_workshop(
        db: Session, request_id: uuid.UUID, data: WorkshopScheduleCreate
    ) -> WorkshopRequest:
        req = WorkshopService.get_request_by_id(db, request_id)

        if req.status in {"COMPLETED", "CANCELLED"}:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Cannot schedule request in terminal status '{req.status}'.",
            )

        if data.scheduled_start.tzinfo is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Scheduled start timestamp must be timezone-aware (e.g. ISO 8601 with offset like '+05:30' or 'Z').",
            )
        start_utc = data.scheduled_start.astimezone(timezone.utc)
        if start_utc < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Workshop scheduled start time cannot be in the past.",
            )

        schedule = req.schedule
        now = datetime.now(timezone.utc)

        if not schedule:
            schedule = WorkshopSchedule(
                request_id=req.id,
                scheduled_start=data.scheduled_start,
                duration_minutes=data.duration_minutes,
                mode=data.mode,
                venue_or_meeting_link=data.venue_or_meeting_link.strip(),
                assigned_facilitator=data.assigned_facilitator.strip() if data.assigned_facilitator else None,
                internal_notes=data.internal_notes.strip() if data.internal_notes else None,
            )
            db.add(schedule)
        else:
            schedule.scheduled_start = data.scheduled_start
            schedule.duration_minutes = data.duration_minutes
            schedule.mode = data.mode
            schedule.venue_or_meeting_link = data.venue_or_meeting_link.strip()
            schedule.assigned_facilitator = data.assigned_facilitator.strip() if data.assigned_facilitator else None
            schedule.internal_notes = data.internal_notes.strip() if data.internal_notes else None
            schedule.updated_at = now

        req.status = "SCHEDULED"
        req.updated_at = now

        db.commit()
        db.refresh(req)
        return req

    @staticmethod
    def update_schedule(
        db: Session, request_id: uuid.UUID, data: WorkshopScheduleUpdate
    ) -> WorkshopRequest:
        req = WorkshopService.get_request_by_id(db, request_id)

        if not req.schedule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No existing schedule found for this workshop request.",
            )

        if req.status in {"COMPLETED", "CANCELLED"}:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Cannot update schedule for request in terminal status '{req.status}'.",
            )

        now = datetime.now(timezone.utc)
        schedule = req.schedule
        fields_set = data.model_fields_set

        # Reject null or empty values for required schedule fields
        if "scheduled_start" in fields_set:
            if data.scheduled_start is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Scheduled start time is required and cannot be null.",
                )
            if data.scheduled_start.tzinfo is None:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Scheduled start timestamp must be timezone-aware (e.g. ISO 8601 with offset like '+05:30' or 'Z').",
                )
            start_utc = data.scheduled_start.astimezone(timezone.utc)
            if start_utc < datetime.now(timezone.utc):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Workshop scheduled start time cannot be in the past.",
                )
            schedule.scheduled_start = data.scheduled_start

        if "mode" in fields_set:
            if data.mode is None or not data.mode.strip():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Mode is required and cannot be null or empty.",
                )
            schedule.mode = data.mode.strip().lower()

        if "venue_or_meeting_link" in fields_set:
            if data.venue_or_meeting_link is None or not data.venue_or_meeting_link.strip():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Venue or meeting link is required and cannot be null or empty.",
                )
            schedule.venue_or_meeting_link = data.venue_or_meeting_link.strip()

        if "duration_minutes" in fields_set:
            schedule.duration_minutes = data.duration_minutes

        # Optional fields: explicit null or blank clears the value; omitted preserves existing
        if "assigned_facilitator" in fields_set:
            raw_fac = data.assigned_facilitator
            schedule.assigned_facilitator = raw_fac.strip() if (raw_fac and raw_fac.strip()) else None

        if "internal_notes" in fields_set:
            raw_notes = data.internal_notes
            schedule.internal_notes = raw_notes.strip() if (raw_notes and raw_notes.strip()) else None

        schedule.updated_at = now
        req.updated_at = now

        db.commit()
        db.refresh(req)
        return req

    @staticmethod
    def complete_workshop(
        db: Session, request_id: uuid.UUID, data: WorkshopCompleteRequest
    ) -> WorkshopRequest:
        req = WorkshopService.get_request_by_id(db, request_id)

        if req.status != "SCHEDULED":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Only SCHEDULED workshops can be marked as COMPLETED. Current status: '{req.status}'.",
            )

        if not req.schedule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cannot complete workshop without a schedule record.",
            )

        now = datetime.now(timezone.utc)
        schedule = req.schedule
        schedule.actual_attendance = data.actual_attendance
        schedule.completion_notes = data.completion_notes.strip() if data.completion_notes else None
        schedule.feedback_score = data.feedback_score
        schedule.completed_at = now
        schedule.updated_at = now

        req.status = "COMPLETED"
        req.updated_at = now

        db.commit()
        db.refresh(req)
        return req

    @staticmethod
    def cancel_request(
        db: Session, request_id: uuid.UUID, data: WorkshopCancelRequest
    ) -> WorkshopRequest:
        req = WorkshopService.get_request_by_id(db, request_id)

        if req.status in {"COMPLETED", "CANCELLED"}:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Cannot cancel request in terminal status '{req.status}'.",
            )

        now = datetime.now(timezone.utc)
        req.status = "CANCELLED"
        req.cancelled_at = now
        req.cancellation_reason = data.cancellation_reason.strip()
        req.updated_at = now

        db.commit()
        db.refresh(req)
        return req

    @staticmethod
    def get_admin_overview(db: Session) -> AdminOverviewResponse:
        now = datetime.now(timezone.utc)
        week_ahead = now + timedelta(days=7)

        # Operational status counts
        new_count = db.query(func.count(WorkshopRequest.id)).filter(WorkshopRequest.status == "NEW").scalar() or 0
        contacted_count = db.query(func.count(WorkshopRequest.id)).filter(WorkshopRequest.status == "CONTACTED").scalar() or 0
        scheduled_count = db.query(func.count(WorkshopRequest.id)).filter(WorkshopRequest.status == "SCHEDULED").scalar() or 0
        completed_count = db.query(func.count(WorkshopRequest.id)).filter(WorkshopRequest.status == "COMPLETED").scalar() or 0

        # Upcoming this week (scheduled workshops between now and 7 days)
        upcoming_this_week_count = (
            db.query(func.count(WorkshopRequest.id))
            .join(WorkshopSchedule, WorkshopRequest.id == WorkshopSchedule.request_id)
            .filter(
                WorkshopRequest.status == "SCHEDULED",
                WorkshopSchedule.scheduled_start >= now,
                WorkshopSchedule.scheduled_start <= week_ahead,
            )
            .scalar()
            or 0
        )

        metrics = AdminOverviewMetrics(
            new_requests=new_count,
            contacted_requests=contacted_count,
            scheduled_workshops=scheduled_count,
            completed_workshops=completed_count,
            upcoming_this_week=upcoming_this_week_count,
        )

        # Recent 5 NEW requests requiring attention
        recent_new = (
            db.query(WorkshopRequest)
            .options(joinedload(WorkshopRequest.schedule))
            .filter(WorkshopRequest.status == "NEW")
            .order_by(WorkshopRequest.created_at.asc())
            .limit(5)
            .all()
        )

        # Next 5 upcoming workshops
        upcoming_workshops = (
            db.query(WorkshopRequest)
            .join(WorkshopSchedule, WorkshopRequest.id == WorkshopSchedule.request_id)
            .options(joinedload(WorkshopRequest.schedule))
            .filter(
                WorkshopRequest.status == "SCHEDULED",
                WorkshopSchedule.scheduled_start >= now,
            )
            .order_by(WorkshopSchedule.scheduled_start.asc())
            .limit(5)
            .all()
        )

        return AdminOverviewResponse(
            metrics=metrics,
            recent_new_requests=recent_new,
            upcoming_workshops=upcoming_workshops,
        )
