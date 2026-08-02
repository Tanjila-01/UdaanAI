from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_user_claims
from app.schemas.student_profile import ProfileCreate, ProfileUpdate, ProfileResponse
from app.services.student_service import StudentService

router = APIRouter(prefix="/students", tags=["Student Profile"])


@router.post("/profile", response_model=ProfileResponse, status_code=status.HTTP_201_CREATED)
def create_profile(
    data: ProfileCreate,
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db)
):
    user_id = claims.get("sub")
    full_name_claim = claims.get("email", "").split("@")[0]
    return StudentService.create_or_update_profile(db, user_id, full_name_claim, data)


@router.get("/profile/me", response_model=ProfileResponse)
def get_my_profile(
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db)
):
    user_id = claims.get("sub")
    return StudentService.get_profile_by_user_id(db, user_id)


@router.put("/profile/me", response_model=ProfileResponse)
def update_my_profile(
    data: ProfileUpdate,
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db)
):
    user_id = claims.get("sub")
    return StudentService.update_profile(db, user_id, data)
