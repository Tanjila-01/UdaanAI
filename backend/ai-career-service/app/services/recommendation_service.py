import httpx
import uuid
from uuid import UUID
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.core.config import settings
from app.models.recommendation import CareerRecommendationResult, CareerRecommendationItem


class RecommendationService:

    @staticmethod
    def get_latest_recommendation(db: Session, user_id: str) -> Optional[CareerRecommendationResult]:
        user_uuid = UUID(str(user_id))
        return db.query(CareerRecommendationResult).filter(
            CareerRecommendationResult.user_id == user_uuid
        ).order_by(CareerRecommendationResult.generated_at.desc()).first()

    @staticmethod
    def generate_recommendations(db: Session, user_id: str, token: str) -> CareerRecommendationResult:
        user_uuid = UUID(str(user_id))

        # 1. Fetch latest assessment result
        headers = {"Authorization": f"Bearer {token}"}
        try:
            assess_url = f"{settings.ASSESSMENT_SERVICE_URL.rstrip('/')}/assessments/my-latest-result"
            with httpx.Client(timeout=5.0) as client:
                assess_resp = client.get(assess_url, headers=headers)
                if assess_resp.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Failed to fetch assessment results."
                    )
                assess_data = assess_resp.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Assessment service is temporarily unavailable: {str(e)}"
            )

        if not assess_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot generate recommendations without completing an assessment first."
            )

        dimension_scores = assess_data.get("dimension_scores", {})
        source_scoring_version = assess_data.get("scoring_version", "rule-v1")
        source_assessment_id = assess_data.get("assessment_id")
        source_attempt_id = assess_data.get("attempt_id")

        # 2. Fetch student profile
        try:
            profile_url = f"{settings.STUDENT_SERVICE_URL.rstrip('/')}/students/profile/me"
            with httpx.Client(timeout=5.0) as client:
                profile_resp = client.get(profile_url, headers=headers)
                if profile_resp.status_code == 404:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Student profile not found. Please complete your profile first."
                    )
                elif profile_resp.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Failed to fetch student profile."
                    )
                profile = profile_resp.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Student profile service is temporarily unavailable: {str(e)}"
            )

        if not profile or not profile.get("is_complete"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Student profile is incomplete. Please complete your profile first."
            )

        current_level = profile.get("current_level")
        stream = profile.get("stream")

        # 3. Fetch candidate pathways from roadmap-service
        try:
            roadmap_url = f"{settings.ROADMAP_SERVICE_URL.rstrip('/')}/roadmaps/pathways"
            params = {"education_level": current_level}
            with httpx.Client(timeout=5.0) as client:
                roadmap_resp = client.get(roadmap_url, params=params, headers=headers)
                if roadmap_resp.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Failed to fetch candidate pathways from roadmap service."
                    )
                roadmap_data = roadmap_resp.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Roadmap service is temporarily unavailable: {str(e)}"
            )

        pathways_list = roadmap_data.get("pathways", [])

        # 4. Filter pathways and compute match scores dynamically using database dimensions
        SUPPORTED_DIMENSIONS = {"science", "commerce", "arts", "diploma", "iti"}
        eligible_candidates = []

        for p in pathways_list:
            p_id = p.get("id")
            p_stream = p.get("stream")
            p_level = p.get("education_level")
            rec_dims = p.get("recommendation_dimensions")

            # Stream validation: if student has a stream, and pathway specifies a stream, they must match
            if stream and p_stream and p_stream.strip().lower() != stream.strip().lower():
                continue  # Exclude incompatible streams

            # Eligibility warnings: Currently no structured prerequisite table is exposed, default to None
            warning = None

            # Validate pathway dimensions: must be non-null, non-empty, and only contain supported dimensions
            valid_dims = []
            if rec_dims and isinstance(rec_dims, list):
                for d in rec_dims:
                    if isinstance(d, str):
                        d_clean = d.strip().lower()
                        if d_clean in SUPPORTED_DIMENSIONS:
                            valid_dims.append(d_clean)

            if not valid_dims:
                # Exclude if no recognized dimensions are mapped
                continue

            # Calculate match score based on normalized dimensions (strongest matches using max)
            max_percent = max(dimension_scores.get(d, 0) for d in valid_dims)

            # Round to nearest 5
            match_score = int(5 * round(max_percent / 5.0))
            match_score = max(0, min(100, match_score))

            # Threshold filtering: score < 25 is excluded
            if match_score < 25:
                continue

            if match_score >= 70:
                match_label = "High"
            elif match_score >= 50:
                match_label = "Good"
            else:
                match_label = "Explore"

            # Generate dynamic plain-language reasons based on matched dimension and score
            reasons = []
            primary_dim = valid_dims[0]
            # Find the actual highest dimension score key if multiple dimensions map
            if len(valid_dims) > 1:
                highest_dim = valid_dims[0]
                for d in valid_dims:
                    if dimension_scores.get(d, 0) > dimension_scores.get(highest_dim, 0):
                        highest_dim = d
                primary_dim = highest_dim

            # Add reasons
            if primary_dim == "science":
                reasons = [
                    "Matches your high interest in coding, engineering, or scientific research.",
                    "Aligned with your logical and analytical problem-solving aptitude."
                ]
            elif primary_dim == "commerce":
                reasons = [
                    "Matches your interest in business management, banking, and ledger statistics.",
                    "Strong foundation for professional finance pathways like CA."
                ]
            elif primary_dim == "arts":
                reasons = [
                    "Fits your interest in creative communication, humanities, and critical social reading.",
                    "Aligned with corporate policy, design, or legal studies."
                ]
            elif primary_dim == "diploma":
                reasons = [
                    "Matches your preference for practical technical design, robotics, and applied projects.",
                    "Offers a direct route to lateral entry engineering programs."
                ]
            elif primary_dim == "iti":
                reasons = [
                    "Aligned with hands-on trade skills, solar power, and industrial automation trades.",
                    "Focuses on rapid vocational specialization and direct apprenticeship."
                ]

            eligible_candidates.append({
                "pathway_id": p_id,
                "pathway_title": p.get("title", "Career Pathway"),
                "match_score": match_score,
                "match_label": match_label,
                "reasons": reasons,
                "eligibility_warning": warning
            })

        # Rank candidates by match_score descending, then by pathway_title alphabetically
        eligible_candidates.sort(key=lambda x: (-x["match_score"], x["pathway_title"]))

        # Select top 3 recommendations
        top_candidates = eligible_candidates[:3]

        # 5. Persist the recommendation result
        recommendation_result = CareerRecommendationResult(
            id=uuid.uuid4(),
            user_id=user_uuid,
            generated_at=datetime.now(timezone.utc),
            source_scoring_version=source_scoring_version,
            disclaimer="These guidance scores are based on your responses and academic context; they are not guaranteed outcomes.",
            source_assessment_id=source_assessment_id,
            source_attempt_id=UUID(str(source_attempt_id)) if source_attempt_id else None
        )
        db.add(recommendation_result)
        db.flush()

        for idx, item in enumerate(top_candidates):
            item_model = CareerRecommendationItem(
                id=uuid.uuid4(),
                result_id=recommendation_result.id,
                rank=idx + 1,
                pathway_id=item["pathway_id"],
                pathway_title=item["pathway_title"],
                match_score=item["match_score"],
                match_label=item["match_label"],
                reasons=item["reasons"],
                eligibility_warning=item["eligibility_warning"]
            )
            db.add(item_model)

        db.commit()
        db.refresh(recommendation_result)
        return recommendation_result
