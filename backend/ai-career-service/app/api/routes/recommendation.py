from fastapi import APIRouter, Depends, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import get_db
from app.core.security import get_current_user_claims, security
from app.schemas.recommendation import RecommendationResponse
from app.services.recommendation_service import RecommendationService

router = APIRouter(prefix="/career-intelligence/recommendations", tags=["Career Intelligence"])


@router.post("/generate", response_model=RecommendationResponse, status_code=status.HTTP_200_OK)
def generate_recommendations(
    claims: dict = Depends(get_current_user_claims),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
):
    user_id = claims.get("sub")
    token = credentials.credentials if credentials else None
    return RecommendationService.generate_recommendations(db, user_id, token)


@router.get("/me", response_model=Optional[RecommendationResponse])
def get_my_recommendation(
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db)
):
    user_id = claims.get("sub")
    return RecommendationService.get_latest_recommendation(db, user_id)
