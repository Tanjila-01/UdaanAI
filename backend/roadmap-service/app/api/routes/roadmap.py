from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.pathway import PathwayDetailResponse, PathwayListResponse
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
    db: Session = Depends(get_db),
):
    pathways_orm = RoadmapService.get_pathways(db, education_level=education_level, stream=stream)
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
