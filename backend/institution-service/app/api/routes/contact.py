from uuid import UUID
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import require_admin_user
from app.services.inquiry_service import InquiryService
from app.schemas.inquiry import (
    GeneralInquiryCreate,
    GeneralInquiryPublicResponse,
    GeneralInquiryAdminResponse,
    GeneralInquiryStatusUpdate,
)

router = APIRouter(prefix="/contact", tags=["Contact"])


# ============================================================================
# PUBLIC ENDPOINT (Unauthenticated, strict validation, safe response)
# ============================================================================

@router.post(
    "",
    response_model=GeneralInquiryPublicResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a general contact inquiry",
)
def submit_contact_inquiry(
    data: GeneralInquiryCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Allows students, educators, parents, and visitors to submit general inquiries.
    No authentication required. Strict validation and rate limiting applied.
    """
    client_ip = request.client.host if request.client else None
    return InquiryService.create_public_inquiry(db, data, client_ip=client_ip)


# ============================================================================
# ADMIN ENDPOINTS (Protected by require_admin_user)
# ============================================================================

@router.get(
    "/admin",
    response_model=List[GeneralInquiryAdminResponse],
    summary="List contact inquiries (Admin only)",
)
def list_contact_inquiries(
    status: Optional[str] = Query(None, description="Filter by status: NEW, CONTACTED, RESOLVED, ARCHIVED"),
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin_user),
):
    """
    Allows administrators to retrieve and review submitted contact inquiries.
    Public users cannot access this endpoint.
    """
    return InquiryService.list_admin_inquiries(db, status_filter=status)


@router.patch(
    "/admin/{inquiry_id}",
    response_model=GeneralInquiryAdminResponse,
    summary="Update contact inquiry status (Admin only)",
)
def update_contact_inquiry_status(
    inquiry_id: UUID,
    payload: GeneralInquiryStatusUpdate,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin_user),
):
    """
    Allows administrators to update inquiry status (NEW, CONTACTED, RESOLVED, ARCHIVED).
    """
    return InquiryService.update_inquiry_status(db, inquiry_id=inquiry_id, new_status=payload.status)

