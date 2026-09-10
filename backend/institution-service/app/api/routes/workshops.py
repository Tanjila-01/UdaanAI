import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import require_admin_user
from app.services.workshop_service import WorkshopService
from app.schemas.workshop import (
    PublicWorkshopRequestCreate,
    PublicWorkshopRequestResponse,
    WorkshopScheduleCreate,
    WorkshopScheduleUpdate,
    WorkshopCompleteRequest,
    WorkshopCancelRequest,
    AdminWorkshopRequestResponse,
    AdminOverviewResponse,
    CoordinatorFeedbackContextResponse,
    CoordinatorFeedbackSubmission,
    AdminFeedbackLinkResponse,
)

router = APIRouter(prefix="/workshops", tags=["Workshops"])


# ============================================================================
# PUBLIC ENDPOINT (Unauthenticated, strict validation, safe response)
# ============================================================================

@router.post(
    "/requests",
    response_model=PublicWorkshopRequestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Public submission of an institutional workshop request",
)
def create_workshop_request(
    data: PublicWorkshopRequestCreate,
    db: Session = Depends(get_db),
):
    """
    Allows Karnataka schools, colleges, and polytechnics to request a career orientation,
    AI literacy, or skill workshop. No authentication required.
    """
    return WorkshopService.create_public_request(db, data)


# ============================================================================
# ADMIN OPERATIONS ENDPOINTS (Strictly protected by require_admin_user)
# ============================================================================

@router.get(
    "/admin/overview",
    response_model=AdminOverviewResponse,
    summary="Admin operational metrics and queues",
)
def get_admin_overview(
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin_user),
):
    """
    Returns live operational counts (New, Contacted, Scheduled, Completed),
    the immediate 'Requires Attention' queue, and upcoming sessions.
    """
    return WorkshopService.get_admin_overview(db)


@router.get(
    "/admin/requests",
    response_model=List[AdminWorkshopRequestResponse],
    summary="List workshop requests with operational filters",
)
def list_admin_requests(
    status: Optional[str] = Query(None, description="Filter by status: NEW, CONTACTED, SCHEDULED, COMPLETED, CANCELLED"),
    district: Optional[str] = Query(None, description="Filter by Karnataka district"),
    mode: Optional[str] = Query(None, description="Filter by preferred delivery mode: online, offline, hybrid"),
    search: Optional[str] = Query(None, description="Search term for institution, contact, district"),
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin_user),
):
    return WorkshopService.list_requests(
        db,
        status_filter=status,
        district_filter=district,
        mode_filter=mode,
        search_query=search,
    )


@router.get(
    "/admin/requests/{request_id}",
    response_model=AdminWorkshopRequestResponse,
    summary="Get single workshop request details",
)
def get_admin_request_detail(
    request_id: uuid.UUID,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin_user),
):
    return WorkshopService.get_request_by_id(db, request_id)


# Semantic Lifecycle Actions

@router.post(
    "/admin/requests/{request_id}/contact",
    response_model=AdminWorkshopRequestResponse,
    summary="Mark request as Contacted",
)
def mark_request_contacted(
    request_id: uuid.UUID,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin_user),
):
    """Transitions status from NEW -> CONTACTED."""
    return WorkshopService.mark_contacted(db, request_id)


@router.post(
    "/admin/requests/{request_id}/schedule",
    response_model=AdminWorkshopRequestResponse,
    summary="Schedule workshop date, time, mode, and facilitator",
)
def schedule_workshop(
    request_id: uuid.UUID,
    data: WorkshopScheduleCreate,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin_user),
):
    """Transitions status to SCHEDULED and creates/updates the schedule record."""
    return WorkshopService.schedule_workshop(db, request_id, data)


@router.patch(
    "/admin/requests/{request_id}/schedule",
    response_model=AdminWorkshopRequestResponse,
    summary="Update existing workshop schedule details",
)
def update_workshop_schedule(
    request_id: uuid.UUID,
    data: WorkshopScheduleUpdate,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin_user),
):
    """Updates confirmed schedule time, venue/link, facilitator, or notes."""
    return WorkshopService.update_schedule(db, request_id, data)


@router.post(
    "/admin/requests/{request_id}/complete",
    response_model=AdminWorkshopRequestResponse,
    summary="Complete workshop and record attendance & feedback",
)
def complete_workshop(
    request_id: uuid.UUID,
    data: WorkshopCompleteRequest,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin_user),
):
    """Transitions status from SCHEDULED -> COMPLETED and logs actual attendance."""
    return WorkshopService.complete_workshop(db, request_id, data)


@router.post(
    "/admin/requests/{request_id}/cancel",
    response_model=AdminWorkshopRequestResponse,
    summary="Cancel workshop request with mandatory reason",
)
def cancel_workshop(
    request_id: uuid.UUID,
    data: WorkshopCancelRequest,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin_user),
):
    """Transitions request to CANCELLED and records audit reason without deleting records."""
    return WorkshopService.cancel_request(db, request_id, data)


# ============================================================================
# COORDINATOR FEEDBACK ENDPOINTS
# ============================================================================

@router.get(
    "/feedback/{token}",
    response_model=CoordinatorFeedbackContextResponse,
    summary="Get minimal public context for coordinator feedback form",
)
def get_feedback_context(
    token: str,
    db: Session = Depends(get_db),
):
    """
    Returns minimal workshop details (institution name, topic, mode, completed date)
    for coordinator feedback. Strictly omits coordinator contact details and internal notes.
    """
    return WorkshopService.get_feedback_context(db, token)


@router.post(
    "/feedback/{token}",
    status_code=status.HTTP_200_OK,
    summary="Submit coordinator feedback for completed workshop",
)
def submit_coordinator_feedback(
    token: str,
    data: CoordinatorFeedbackSubmission,
    db: Session = Depends(get_db),
):
    """
    Accepts one coordinator feedback submission (rating 1-5, optional comments up to 1000 chars).
    Enforces atomic one-response restriction in database.
    """
    return WorkshopService.submit_coordinator_feedback(db, token, data)


@router.get(
    "/admin/requests/{request_id}/feedback-link",
    response_model=AdminFeedbackLinkResponse,
    summary="Get or generate coordinator feedback link for completed workshop",
)
def get_admin_feedback_link(
    request_id: uuid.UUID,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin_user),
):
    """
    Generates or retrieves unguessable token link for manual coordinator sharing by admin.
    """
    return WorkshopService.get_admin_feedback_link(db, request_id)
