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

        current_level = (profile.get("current_level") or "").strip()
        stream = (profile.get("stream") or "").strip()

        # Constraint 1 & 5: Determine decision stage and family-specific candidate scope & dimension contract
        STAGE_CONFIG = {
            "FOUNDATION": {
                "candidate_ids": ["c10-puc", "c10-diploma", "c10-iti"],
                "supported_dimensions": {"science", "commerce", "arts", "diploma", "iti"},
                "dimension_pathway_map": {
                    "science": ["c10-puc"],
                    "commerce": ["c10-puc"],
                    "arts": ["c10-puc"],
                    "diploma": ["c10-diploma"],
                    "iti": ["c10-iti"],
                },
                "dimension_reasons": {
                    "science": [
                        "Matches your high interest in coding, engineering, or scientific research.",
                        "Aligned with your logical and analytical problem-solving aptitude."
                    ],
                    "commerce": [
                        "Matches your interest in business management, banking, and ledger statistics.",
                        "Strong foundation for professional finance pathways like CA."
                    ],
                    "arts": [
                        "Fits your interest in creative communication, humanities, and critical social reading.",
                        "Aligned with corporate policy, design, or legal studies."
                    ],
                    "diploma": [
                        "Matches your preference for practical technical design, robotics, and applied projects.",
                        "Offers a direct route to lateral entry engineering programs."
                    ],
                    "iti": [
                        "Aligned with hands-on trade skills, solar power, and industrial automation trades.",
                        "Focuses on rapid vocational specialization and direct apprenticeship."
                    ],
                }
            },
            "PUC_SCIENCE": {
                "candidate_ids": [
                    "puc-science-eng",
                    "puc-science-comp",
                    "puc-science-med",
                    "puc-science-allied",
                    "puc-science-pharm",
                    "puc-science-pure",
                    "puc-science-agri",
                    "puc-science-vet",
                    "puc-science-arch",
                    "puc-science-ayush",
                    "cross-law",
                    "cross-design",
                ],
                "supported_dimensions": {"engineering", "computing", "medicine", "allied_health", "pure_sciences"},
                "dimension_pathway_map": {
                    "engineering": ["puc-science-eng", "puc-science-arch"],
                    "computing": ["puc-science-comp"],
                    "medicine": ["puc-science-med", "puc-science-ayush", "puc-science-vet"],
                    "allied_health": ["puc-science-allied", "puc-science-pharm", "puc-science-agri"],
                    "pure_sciences": ["puc-science-pure", "cross-law", "cross-design"],
                },
                "dimension_reasons": {
                    "engineering": [
                        "Aligned with your aptitude for physical mechanisms, structural design, and technology systems.",
                        "Opens direct pathways to Karnataka B.E/B.Tech programs via KCET and JEE."
                    ],
                    "computing": [
                        "Strong alignment with algorithms, software architecture, and modern computer applications.",
                        "Direct path toward BCA, B.Tech CSE, and artificial intelligence careers."
                    ],
                    "medicine": [
                        "Matches your clinical aptitude for living systems, diagnostics, and patient care.",
                        "Prepares for NEET-UG admissions into MBBS, BDS, and AYUSH degree colleges."
                    ],
                    "allied_health": [
                        "Fits your interest in pharmaceutical formulations, clinical diagnostics, and healthcare support.",
                        "Strong foundation for B.Pharm, Nursing, and Allied Health Sciences in Karnataka."
                    ],
                    "pure_sciences": [
                        "Aligned with your passion for fundamental research, mathematical proofs, and laboratory inquiry.",
                        "Direct route to IISER, B.Sc Honours, and scientific research institutions."
                    ],
                }
            },
            "PUC_COMMERCE": {
                "candidate_ids": [
                    "puc-commerce-ca",
                    "puc-commerce-fin",
                    "cross-hospitality",
                    "cross-law",
                ],
                "supported_dimensions": {"accounting_ca", "finance_banking", "business_management", "corporate_law"},
                "dimension_pathway_map": {
                    "accounting_ca": ["puc-commerce-ca"],
                    "finance_banking": ["puc-commerce-fin"],
                    "business_management": ["cross-hospitality"],
                    "corporate_law": ["cross-law"],
                },
                "dimension_reasons": {
                    "accounting_ca": [
                        "Exceptional aptitude for double-entry bookkeeping, auditing, and statutory financial compliance.",
                        "Direct alignment with ICAI Chartered Accountancy (CA) and CMA programs."
                    ],
                    "finance_banking": [
                        "Strong orientation toward capital markets, investment banking, and macroeconomic analytics.",
                        "Prepares for B.Com (Finance), banking certifications, and wealth management."
                    ],
                    "business_management": [
                        "Fits your operational leadership, retail organization, and customer strategy skills.",
                        "Direct pathway into BBA / BBM and specialized management disciplines."
                    ],
                    "corporate_law": [
                        "Strong reasoning in commercial contracts, company law, and regulatory compliance.",
                        "Seamless progression into 5-year integrated B.Com LL.B or Company Secretary (CS)."
                    ],
                }
            },
            "PUC_ARTS": {
                "candidate_ids": [
                    "cross-law",
                    "cross-design",
                    "puc-arts-media",
                    "puc-arts-bsw",
                    "puc-arts-edu",
                ],
                "supported_dimensions": {"law_judiciary", "design_arts", "media_journalism", "humanities_social"},
                "dimension_pathway_map": {
                    "law_judiciary": ["cross-law"],
                    "design_arts": ["cross-design"],
                    "media_journalism": ["puc-arts-media"],
                    "humanities_social": ["puc-arts-bsw", "puc-arts-edu"],
                },
                "dimension_reasons": {
                    "law_judiciary": [
                        "Exceptional aptitude for legal argument, constitutional safeguards, and statutory analysis.",
                        "Direct route into 5-Year Integrated B.A. LL.B via CLAT and Karnataka State Law University."
                    ],
                    "design_arts": [
                        "Strong inclination toward visual aesthetics, user interface design, and multimedia creativity.",
                        "Direct pathway to Bachelor of Design (B.Des) programs via UCEED and NID."
                    ],
                    "media_journalism": [
                        "Fits your investigative reporting, digital storytelling, and public communication strengths.",
                        "Prepares for BA in Journalism & Mass Communication (BAJMC) and broadcasting careers."
                    ],
                    "humanities_social": [
                        "Aligned with public policy analysis, social welfare systems, and community development.",
                        "Strong foundation for Bachelor of Social Work (BSW), Civil Services (UPSC/KPSC), and education."
                    ],
                }
            },
            "DIPLOMA": {
                "candidate_ids": [
                    "dip-family-comp",
                    "dip-family-elec",
                    "dip-family-mech",
                    "dip-family-civil",
                ],
                "supported_dimensions": {"dcet_lateral_engineering", "software_digital", "core_industrial", "industry_employment"},
                "dimension_pathway_map": {
                    "software_digital": ["dip-family-comp"],
                    "core_industrial": ["dip-family-mech", "dip-family-civil"],
                    "dcet_lateral_engineering": ["dip-family-elec", "dip-family-comp"],
                    "industry_employment": ["dip-family-mech", "dip-family-elec"],
                },
                "dimension_reasons": {
                    "dcet_lateral_engineering": [
                        "Strong drive for higher degree engineering status through DCET competitive lateral entry.",
                        "Enables direct admission into 2nd year B.E/B.Tech at Karnataka engineering colleges."
                    ],
                    "software_digital": [
                        "High aptitude for programming, networking protocols, and full-stack software development.",
                        "Direct route to computing roles and IT industry technical certifications."
                    ],
                    "core_industrial": [
                        "Focused on mechanical tooling, CAD/CAM precision design, and industrial automation.",
                        "Direct progression in automotive, aerospace, and advanced manufacturing sectors."
                    ],
                    "industry_employment": [
                        "Oriented toward hands-on plant supervision, site coordination, and rapid employment.",
                        "Prepares for immediate appointment as Junior Engineer or Technical Supervisor."
                    ],
                }
            },
            "ITI": {
                "candidate_ids": [
                    "iti-family-elec",
                    "iti-family-mech",
                    "iti-family-comp",
                ],
                "supported_dimensions": {"apprenticeship_industry", "energy_electrical", "mechanical_machining", "diploma_lateral"},
                "dimension_pathway_map": {
                    "energy_electrical": ["iti-family-elec"],
                    "mechanical_machining": ["iti-family-mech"],
                    "apprenticeship_industry": ["iti-family-mech", "iti-family-elec"],
                    "diploma_lateral": ["iti-family-comp"],
                },
                "dimension_reasons": {
                    "apprenticeship_industry": [
                        "Strong orientation toward PSU and Indian Railways paid National Apprenticeships (NAPS).",
                        "Direct eligibility for permanent industrial technician recruitment exams."
                    ],
                    "energy_electrical": [
                        "High aptitude for electrical panel wiring, solar power installations, and motor maintenance.",
                        "Path to state electrical contractor licensing and energy sector employment."
                    ],
                    "mechanical_machining": [
                        "High precision in lathe tooling, CNC programming, welding, and machine fabrication.",
                        "Direct route to specialized machine shop technician roles."
                    ],
                    "diploma_lateral": [
                        "Drive to advance from vocational trade certificate to engineering polytechnic diploma.",
                        "Direct eligibility for 2nd-year lateral entry into Karnataka Polytechnic colleges."
                    ],
                }
            }
        }

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
        return recommendation_result
