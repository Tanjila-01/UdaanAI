from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_user_claims
from app.schemas.pathway import PathwayDetailResponse, PathwayListResponse
from app.schemas.goal import CreateGoalRequest, StudentGoalResponse
from app.services.roadmap_service import RoadmapService

router = APIRouter(prefix="/roadmaps", tags=["Roadmaps"])


@router.get(
    "/pathways",
    response_model=PathwayListResponse,
    status_code=status.HTTP_200_OK,
    summary="List career and education pathways",
    description=(
        "Retrieves Karnataka career and education pathways filtered by student education level and stream. "
        "Business rule: Class 8 and Class 9 automatically map to post-SSLC (Class 10) pathway recommendations."
    ),
)
def list_pathways(
    education_level: Optional[str] = Query(
        None,
        description="Filter pathways by student education level (e.g. Class 10, PUC 2)",
    ),
    stream: Optional[str] = Query(
        None,
        description="Filter pathways by PUC academic stream (e.g. Science, Commerce, Arts)",
    ),
    ids: Optional[str] = Query(
        None,
        description="Comma-separated list of pathway IDs to fetch specifically",
    ),
    db: Session = Depends(get_db),
):
    ids_list = [i.strip() for i in ids.split(",") if i.strip()] if ids else None
    pathways_orm = RoadmapService.get_pathways(db, education_level=education_level, stream=stream, ids=ids_list)
    pathway_details = [PathwayDetailResponse.model_validate(p) for p in pathways_orm]
    return PathwayListResponse(
        total=len(pathway_details),
        education_level=education_level,
        stream=stream,
        pathways=pathway_details,
    )


@router.get(
    "/pathways/{pathway_id}",
    response_model=PathwayDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get pathway detail by ID",
    description="Retrieves detailed pathway information including options and milestones by pathway identifier.",
)
def get_pathway_detail(
    pathway_id: str,
    db: Session = Depends(get_db),
):
    pathway_orm = RoadmapService.get_pathway_by_id(db, pathway_id)
    if not pathway_orm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pathway '{pathway_id}' was not found.",
        )
    return PathwayDetailResponse.model_validate(pathway_orm)


@router.post(
    "/goals",
    response_model=StudentGoalResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create or select active student career goal",
    description="Sets a target pathway and option as the student's active career goal, initializing ordered milestone progress.",
)
def create_goal(
    data: CreateGoalRequest,
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db),
):
    student_id_str = claims.get("sub")
    try:
        student_uuid = UUID(student_id_str)
    except (ValueError, TypeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid student identity claim")

    return RoadmapService.create_or_update_student_goal(
        db=db,
        student_id=student_uuid,
        pathway_id=data.pathway_id,
        pathway_option_id=data.pathway_option_id,
    )


@router.get(
    "/goals/me",
    response_model=Optional[StudentGoalResponse],
    status_code=status.HTTP_200_OK,
    summary="Get current active student career goal",
    description="Retrieves the active career goal, assigned pathway, milestone checklist, and overall completion progress for the authenticated student.",
)
def get_my_goal(
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db),
):
    student_id_str = claims.get("sub")
    try:
        student_uuid = UUID(student_id_str)
    except (ValueError, TypeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid student identity claim")

    return RoadmapService.get_active_student_goal(db=db, student_id=student_uuid)


@router.patch(
    "/goals/me/milestones/{milestone_id}",
    response_model=StudentGoalResponse,
    status_code=status.HTTP_200_OK,
    summary="Mark milestone complete and unlock next step",
    description="Updates progress for an available milestone to COMPLETED, automatically unlocking the next milestone in sequence.",
)
def complete_milestone(
    milestone_id: UUID,
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db),
):
    student_id_str = claims.get("sub")
    try:
        student_uuid = UUID(student_id_str)
    except (ValueError, TypeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid student identity claim")

    return RoadmapService.complete_student_milestone(
        db=db,
        student_id=student_uuid,
        milestone_id=milestone_id,
    )
