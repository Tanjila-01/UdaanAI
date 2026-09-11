import httpx
import uuid
from uuid import UUID
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.core.config import settings
from app.core.stage_config import STAGE_CONFIG
from app.models.recommendation import CareerRecommendationResult, CareerRecommendationItem


class RecommendationService:

    @staticmethod
    def get_latest_recommendation(db: Session, user_id: str, token: Optional[str] = None) -> Optional[CareerRecommendationResult]:
        user_uuid = UUID(str(user_id))
        latest = db.query(CareerRecommendationResult).filter(
            CareerRecommendationResult.user_id == user_uuid
        ).order_by(CareerRecommendationResult.generated_at.desc()).first()

        if not latest:
            return None

        freshness_status = "current"
        is_outdated = False
        outdated_reason = None

        if not token:
            freshness_status = "unknown"
            outdated_reason = "Unable to verify recommendation freshness without authorization token."
        else:
            headers = {"Authorization": f"Bearer {token}"}
            assess_data = None
            prof_data = None
            assess_check_failed = False
            prof_check_failed = False

            try:
                assess_url = f"{settings.ASSESSMENT_SERVICE_URL.rstrip('/')}/assessments/my-latest-result"
                with httpx.Client(timeout=3.0) as client:
                    assess_resp = client.get(assess_url, headers=headers)
                    if assess_resp.status_code == 200:
                        assess_data = assess_resp.json()
                    elif assess_resp.status_code == 404:
                        assess_data = None
                    else:
                        assess_check_failed = True
            except Exception:
                assess_check_failed = True

            try:
                profile_url = f"{settings.STUDENT_SERVICE_URL.rstrip('/')}/students/profile/me"
                with httpx.Client(timeout=3.0) as client:
                    prof_resp = client.get(profile_url, headers=headers)
                    if prof_resp.status_code == 200:
                        prof_data = prof_resp.json()
                    elif prof_resp.status_code == 404:
                        prof_data = None
                    else:
                        prof_check_failed = True
            except Exception:
                prof_check_failed = True

            # 1. Profile stage/stream checks
            if prof_data:
                current_level = (prof_data.get("current_level") or "").strip()
                stream = (prof_data.get("stream") or "").strip()

                if current_level in ["Class 8", "Class 9", "Class 10"]:
                    curr_stage = "FOUNDATION"
                elif current_level in ["PUC 1", "PUC 2"]:
                    s_title = stream.title()
                    if s_title == "Commerce":
                        curr_stage = "PUC_COMMERCE"
                    elif s_title == "Arts":
                        curr_stage = "PUC_ARTS"
                    else:
                        curr_stage = "PUC_SCIENCE"
                elif current_level == "Diploma":
                    curr_stage = "DIPLOMA"
                elif current_level == "ITI":
                    curr_stage = "ITI"
                else:
                    curr_stage = "FOUNDATION"

                stage_cfg = STAGE_CONFIG.get(curr_stage)
                if stage_cfg and latest.recommendations:
                    allowed_pids = set(stage_cfg["candidate_ids"])
                    rec_pids = [item.pathway_id for item in latest.recommendations]
                    # If recommended pathways don't belong to current stage candidate scope
                    if rec_pids and not any(pid in allowed_pids for pid in rec_pids):
                        is_outdated = True
                        outdated_reason = "Your academic stage or stream has changed since recommendations were generated."

            # 2. Assessment freshness checks
            if not is_outdated and assess_data:
                if assess_data.get("is_current") is False:
                    is_outdated = True
                    outdated_reason = "Your assessment is outdated for your current academic stage."
                elif (
                    assess_data.get("attempt_id")
                    and latest.source_attempt_id
                    and str(latest.source_attempt_id) != str(assess_data.get("attempt_id"))
                ):
                    is_outdated = True
                    outdated_reason = "A newer assessment attempt is available. Regenerate to update your recommendations."
                elif (
                    assess_data.get("assessment_id")
                    and latest.source_assessment_id
                    and latest.source_assessment_id != assess_data.get("assessment_id")
                ):
                    is_outdated = True
                    outdated_reason = "Assessment version has changed. Regenerate to update your recommendations."

            # Resolve freshness status
            if is_outdated:
                freshness_status = "outdated"
            elif assess_check_failed or prof_check_failed:
                freshness_status = "unknown"
                is_outdated = False
                outdated_reason = "Unable to verify recommendation freshness. Downstream service unavailable."
            else:
                freshness_status = "current"
                is_outdated = False
                outdated_reason = None

        latest.freshness_status = freshness_status
        latest.is_outdated = is_outdated
        latest.outdated_reason = outdated_reason
        return latest

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

        current_level = (profile.get("current_level") or "").strip()
        stream = (profile.get("stream") or "").strip()

        # Resolve student stage
        if current_level in ["Class 8", "Class 9", "Class 10"]:
            stage = "FOUNDATION"
        elif current_level in ["PUC 1", "PUC 2"]:
            s_title = stream.title()
            if s_title == "Commerce":
                stage = "PUC_COMMERCE"
            elif s_title == "Arts":
                stage = "PUC_ARTS"
            else:
                stage = "PUC_SCIENCE"
        elif current_level == "Diploma":
            stage = "DIPLOMA"
        elif current_level == "ITI":
            stage = "ITI"
        else:
            stage = "FOUNDATION"

        stage_cfg = STAGE_CONFIG[stage]
        candidate_ids = stage_cfg["candidate_ids"]
        supported_dims = stage_cfg["supported_dimensions"]
        dim_map = stage_cfg["dimension_pathway_map"]
        dim_reasons = stage_cfg["dimension_reasons"]

        # 3. Fetch candidate pathways from roadmap-service using targeted ids
        try:
            roadmap_url = f"{settings.ROADMAP_SERVICE_URL.rstrip('/')}/roadmaps/pathways"
            params = {"ids": ",".join(candidate_ids)}
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

        # 4. Filter pathways and compute match scores dynamically using family dimensions
        eligible_candidates = []

        for p in pathways_list:
            p_id = p.get("id")
            p_stream = p.get("stream")
            rec_dims = p.get("recommendation_dimensions")

            # Stream validation: if student has a stream, and pathway specifies a stream, they must match
            if stream and p_stream and p_stream.strip().lower() != stream.strip().lower():
                continue

            # Identify valid dimensions for this candidate pathway within the active family contract
            valid_dims = []
            for d, p_ids in dim_map.items():
                if p_id in p_ids and d in supported_dims:
                    valid_dims.append(d)

            # Also check pathway's recommendation_dimensions if they belong to supported_dims
            if rec_dims and isinstance(rec_dims, list):
                for d in rec_dims:
                    if isinstance(d, str):
                        d_clean = d.strip().lower()
                        if d_clean in supported_dims and d_clean not in valid_dims:
                            valid_dims.append(d_clean)

            if not valid_dims:
                continue

            # Calculate match score based on normalized dimensions
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

            # Primary dimension with the highest score
            highest_dim = valid_dims[0]
            for d in valid_dims:
                if dimension_scores.get(d, 0) > dimension_scores.get(highest_dim, 0):
                    highest_dim = d

            reasons = dim_reasons.get(highest_dim, [
                f"Matches your high interest and aptitude in {highest_dim.replace('_', ' ').title()}.",
                "Aligned with your academic strengths and career trajectory."
            ])

            eligible_candidates.append({
                "pathway_id": p_id,
                "pathway_title": p.get("title", "Career Pathway"),
                "match_score": match_score,
                "match_label": match_label,
                "reasons": reasons,
                "eligibility_warning": None
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
        recommendation_result.freshness_status = "current"
        recommendation_result.is_outdated = False
        recommendation_result.outdated_reason = None
        return recommendation_result

