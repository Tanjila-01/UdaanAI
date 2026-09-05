import uuid
from uuid import UUID
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.assessment import (
    Assessment,
    AssessmentQuestion,
    AssessmentOption,
    AssessmentAttempt,
    AssessmentAnswer,
    AssessmentResult,
)
from app.schemas.assessment import AnswerSubmitRequest
from app.services.student_client import StudentClient


class AssessmentService:

    @staticmethod
    def get_active_assessments(db: Session) -> List[Assessment]:
        return db.query(Assessment).filter(Assessment.is_active == True).all()

    @staticmethod
    def get_assessment_by_id(db: Session, assessment_id: str) -> Assessment:
        assessment = db.query(Assessment).filter(
            Assessment.id == assessment_id,
            Assessment.is_active == True
        ).first()
        if not assessment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Assessment '{assessment_id}' not found or inactive."
            )
        return assessment

    @staticmethod
    def start_assessment_attempt(db: Session, user_id: str, assessment_id: str) -> AssessmentAttempt:
        user_uuid = uuid.UUID(str(user_id))
        assessment = AssessmentService.get_assessment_by_id(db, assessment_id)

        # Check if an active attempt already exists
        existing_attempt = db.query(AssessmentAttempt).filter(
            AssessmentAttempt.student_id == user_uuid,
            AssessmentAttempt.assessment_id == assessment.id,
            AssessmentAttempt.status == "in_progress"
        ).first()

        if existing_attempt:
            return existing_attempt

        # Create new attempt
        new_attempt = AssessmentAttempt(
            id=uuid.uuid4(),
            student_id=user_uuid,
            assessment_id=assessment.id,
            status="in_progress",
            started_at=datetime.now(timezone.utc)
        )
        db.add(new_attempt)
        db.commit()
        db.refresh(new_attempt)
        return new_attempt

    @staticmethod
    def submit_answer(
        db: Session,
        user_id: str,
        attempt_id: UUID,
        data: AnswerSubmitRequest
    ) -> AssessmentAnswer:
        user_uuid = uuid.UUID(str(user_id))

        attempt = db.query(AssessmentAttempt).filter(
            AssessmentAttempt.id == attempt_id,
            AssessmentAttempt.student_id == user_uuid
        ).first()

        if not attempt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assessment attempt not found or unauthorized."
            )

        if attempt.status != "in_progress":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot submit answers to a completed assessment attempt."
            )

        # Verify question belongs to this assessment
        question = db.query(AssessmentQuestion).filter(
            AssessmentQuestion.id == data.question_id,
            AssessmentQuestion.assessment_id == attempt.assessment_id
        ).first()

        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Question does not belong to this assessment."
            )

        # Verify option belongs to this question
        option = db.query(AssessmentOption).filter(
            AssessmentOption.id == data.selected_option_id,
            AssessmentOption.question_id == data.question_id
        ).first()

        if not option:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Selected option does not belong to this question."
            )

        # Check existing answer
        existing_answer = db.query(AssessmentAnswer).filter(
            AssessmentAnswer.attempt_id == attempt.id,
            AssessmentAnswer.question_id == data.question_id
        ).first()

        if existing_answer:
            existing_answer.selected_option_id = data.selected_option_id
            existing_answer.created_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(existing_answer)
            return existing_answer

        new_answer = AssessmentAnswer(
            id=uuid.uuid4(),
            attempt_id=attempt.id,
            question_id=data.question_id,
            selected_option_id=data.selected_option_id,
            created_at=datetime.now(timezone.utc)
        )
        db.add(new_answer)
        db.commit()
        db.refresh(new_answer)
        return new_answer

    @staticmethod
    def resolve_assessment_for_student(db: Session, user_id: str, token: str) -> Assessment:
        profile = StudentClient.get_student_profile(token)

        current_level = profile.get("current_level")
        stream = profile.get("stream")
        is_complete = profile.get("is_complete")

        if not is_complete:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Student profile is incomplete. Please complete your profile first."
            )

        level_clean = (current_level or "").strip()

        # Constraint 7: Class 8, Class 9, and Class 10 share the SAME Foundation assessment family
        if level_clean in ["Class 8", "Class 9", "Class 10"]:
            # Prefer v2 foundation assessment
            v2_found = db.query(Assessment).filter(
                Assessment.id == "foundation-career-discovery-v2",
                Assessment.is_active == True
            ).first()
            if v2_found:
                return v2_found
            # Fallback for existing v1 fixtures
            fallback = db.query(Assessment).filter(
                Assessment.target_level.in_(["Class 8-9", "Class 10"]),
                Assessment.is_active == True
            ).first()
            if fallback:
                return fallback

        elif level_clean in ["PUC 1", "PUC 2"]:
            if not stream:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Academic stream is required for PUC assessment selection."
                )
            stream_clean = stream.strip().title()
            stream_map = {
                "Science": "puc-science-direction-v2",
                "Commerce": "puc-commerce-direction-v2",
                "Arts": "puc-arts-direction-v2"
            }
            target_id = stream_map.get(stream_clean)
            if target_id:
                v2_puc = db.query(Assessment).filter(
                    Assessment.id == target_id,
                    Assessment.is_active == True
                ).first()
                if v2_puc:
                    return v2_puc

            # Fallback for v1 fixtures
            fallback = db.query(Assessment).filter(
                Assessment.target_level == "PUC",
                Assessment.target_stream == stream_clean,
                Assessment.is_active == True
            ).first()
            if fallback:
                return fallback

        elif level_clean == "Diploma":
            v2_dip = db.query(Assessment).filter(
                Assessment.id == "diploma-direction-v2",
                Assessment.is_active == True
            ).first()
            if v2_dip:
                return v2_dip
            fallback = db.query(Assessment).filter(
                Assessment.target_level == "Diploma",
                Assessment.is_active == True
            ).first()
            if fallback:
                return fallback

        elif level_clean == "ITI":
            v2_iti = db.query(Assessment).filter(
                Assessment.id == "iti-direction-v2",
                Assessment.is_active == True
            ).first()
            if v2_iti:
                return v2_iti
            fallback = db.query(Assessment).filter(
                Assessment.target_level == "ITI",
                Assessment.is_active == True
            ).first()
            if fallback:
                return fallback

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No active assessment found for level '{current_level}'" + (f" and stream '{stream}'" if stream else "") + "."
        )

    @staticmethod
    def validate_assessment_for_student(db: Session, user_id: str, assessment_id: str, token: str) -> None:
        target_assessment = AssessmentService.resolve_assessment_for_student(db, user_id, token)
        if target_assessment.id != assessment_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Assessment '{assessment_id}' is not appropriate for your level and stream."
            )

    @staticmethod
    def start_assessment_attempt_auto(db: Session, user_id: str, token: str) -> AssessmentAttempt:
        assessment = AssessmentService.resolve_assessment_for_student(db, user_id, token)
        return AssessmentService.start_assessment_attempt(db, user_id, assessment.id)

    @staticmethod
    def complete_assessment(db: Session, user_id: str, attempt_id: UUID) -> AssessmentResult:
        user_uuid = uuid.UUID(str(user_id))

        attempt = db.query(AssessmentAttempt).filter(
            AssessmentAttempt.id == attempt_id,
            AssessmentAttempt.student_id == user_uuid
        ).first()

        if not attempt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assessment attempt not found or unauthorized."
            )

        if attempt.status == "completed":
            if attempt.result:
                return attempt.result
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assessment attempt is already completed."
            )

        # Fetch all questions for this assessment
        questions = db.query(AssessmentQuestion).filter(
            AssessmentQuestion.assessment_id == attempt.assessment_id
        ).all()
        total_required = len(questions)

        # Fetch all answers for this attempt
        answers = db.query(AssessmentAnswer).filter(
            AssessmentAnswer.attempt_id == attempt.id
        ).all()

        answered_count = len(answers)
        if answered_count < total_required:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot complete assessment. You have answered {answered_count} out of {total_required} required questions."
            )

        # Calculate maximum possible score for each dimension dynamically from assessment questions
        max_scores = {}
        dimension_scores = {}
        for q in questions:
            q_max = {}
            for opt in q.options:
                dim = opt.weight_dimension.lower()
                dimension_scores.setdefault(dim, 0)
                if opt.weight_score > q_max.get(dim, 0):
                    q_max[dim] = opt.weight_score
            for dim, score in q_max.items():
                max_scores[dim] = max_scores.get(dim, 0) + score

        # Accumulate raw scores from student answers
        for ans in answers:
            opt = ans.selected_option
            if opt and opt.weight_dimension:
                dim = opt.weight_dimension.lower()
                dimension_scores[dim] = dimension_scores.get(dim, 0) + opt.weight_score

        # Normalize raw scores to integers out of 100
        normalized_scores = {}
        for dim, raw_score in dimension_scores.items():
            max_val = max_scores.get(dim, 0)
            if max_val > 0:
                normalized_scores[dim] = int(round((raw_score / max_val) * 100.0))
            else:
                normalized_scores[dim] = 0

        # Sort dimensions by normalized score descending to identify primary strengths
        sorted_dims = sorted(normalized_scores.items(), key=lambda x: x[1], reverse=True)
        top_dim, top_score = sorted_dims[0] if sorted_dims else ("general", 0)
        second_dim, second_score = sorted_dims[1] if len(sorted_dims) > 1 else (top_dim, top_score)

        dimension_map = {
            # Foundation
            "science": ("PUC Science", "AI & Software Application Engineer"),
            "diploma": ("Polytechnic Diploma", "Computer Science & Robotics Engineer"),
            "commerce": ("PUC Commerce", "Financial Analyst & CA Associate"),
            "arts": ("PUC Arts & Humanities", "UI/UX & Product Designer"),
            "iti": ("ITI Vocational Trades", "Industrial Automation & Solar Technician"),
            # PUC Science
            "engineering": ("Engineering & Technology (B.E / B.Tech)", "Systems Design & Robotics Engineer"),
            "computing": ("Computer Applications & IT", "Software Architect & Machine Learning Engineer"),
            "medicine": ("Medicine & Health Sciences", "Physician / Healthcare Specialist"),
            "allied_health": ("Allied Health Sciences & Pharmacy", "Clinical Pharmacologist / Diagnostic Specialist"),
            "pure_sciences": ("Pure & Applied Sciences (B.Sc)", "Research Scientist & Data Analyst"),
            # PUC Commerce
            "accounting_ca": ("Chartered Accountancy & Audit", "Chartered Accountant / Statutory Auditor"),
            "finance_banking": ("Investment Banking & Finance", "Financial Risk Analyst / Portfolio Manager"),
            "business_management": ("Business Management & Operations", "Operations Director / Strategy Consultant"),
            "corporate_law": ("Corporate Law & Compliance", "Corporate Legal Counsel / Company Secretary"),
            # PUC Arts
            "law_judiciary": ("Integrated Law (B.A. LL.B)", "Advocate / Judicial Services Officer"),
            "design_arts": ("Design & Creative Visual Arts (B.Des)", "Product Designer / Art Director"),
            "media_journalism": ("Media & Digital Journalism", "Special Correspondent / Media Editor"),
            "humanities_social": ("Social Policy & Administration", "Civil Services Officer / Policy Specialist"),
            # Diploma
            "dcet_lateral_engineering": ("B.E Lateral Entry (DCET)", "Graduate Engineer Trainee / Project Engineer"),
            "software_digital": ("Software & Digital Tech", "Full-Stack Developer / Cloud Systems Engineer"),
            "core_industrial": ("Core Industrial Engineering", "CAD/CAM Tooling Specialist / Automation Engineer"),
            "industry_employment": ("Direct Industry Operations", "Plant Supervisor / Junior Site Engineer"),
            # ITI
            "apprenticeship_industry": ("National Apprenticeship (PSU/Railways)", "Permanent Industrial Technician"),
            "energy_electrical": ("Electrical & Solar Energy Trade", "Certified Electrical / Solar Contractor"),
            "mechanical_machining": ("Precision CNC Machining & Tooling", "Precision Machinist & CNC Programmer"),
            "diploma_lateral": ("Polytechnic Diploma Lateral Entry", "Diploma Engineer Trainee")
        }

        primary_recommendation, top_career = dimension_map.get(
            top_dim, (top_dim.replace("_", " ").title(), "Technical Specialist")
        )
        secondary_recommendation, _ = dimension_map.get(
            second_dim, (second_dim.replace("_", " ").title(), "Career Specialist")
        )

        summary_text = (
            f"Based on your assessment responses, you show strong aptitude for {primary_recommendation} "
            f"with key strength in {top_dim.replace('_', ' ').title()} (score: {top_score}). Your secondary suitable pathway is "
            f"{secondary_recommendation}. Target career match: {top_career}."
        )

        # Update attempt status
        attempt.status = "completed"
        attempt.completed_at = datetime.now(timezone.utc)

        # Create or update Result
        result = AssessmentResult(
            id=uuid.uuid4(),
            attempt_id=attempt.id,
            user_id=user_uuid,
            assessment_id=attempt.assessment_id,
            assessment_version=attempt.assessment.assessment_version,
            scoring_version=attempt.assessment.scoring_version,
            primary_stream_recommendation=primary_recommendation,
            secondary_stream_recommendation=secondary_recommendation,
            top_career_match=top_career,
            dimension_scores=normalized_scores,
            summary_text=summary_text,
            created_at=datetime.now(timezone.utc)
        )
        db.add(result)
        db.commit()
        db.refresh(result)
        return result

    @staticmethod
    def get_attempt_detail(db: Session, user_id: str, attempt_id: UUID) -> AssessmentAttempt:
        user_uuid = uuid.UUID(str(user_id))
        attempt = db.query(AssessmentAttempt).filter(
            AssessmentAttempt.id == attempt_id,
            AssessmentAttempt.student_id == user_uuid
        ).first()

        if not attempt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assessment attempt not found or unauthorized."
            )
        return attempt

    @staticmethod
    def get_attempt_result(db: Session, user_id: str, attempt_id: UUID) -> AssessmentResult:
        user_uuid = uuid.UUID(str(user_id))
        result = db.query(AssessmentResult).filter(
            AssessmentResult.attempt_id == attempt_id,
            AssessmentResult.user_id == user_uuid
        ).first()

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assessment result not found or incomplete."
            )
        return result

    @staticmethod
    def get_my_latest_result(db: Session, user_id: str) -> Optional[AssessmentResult]:
        user_uuid = uuid.UUID(str(user_id))
        return db.query(AssessmentResult).filter(
            AssessmentResult.user_id == user_uuid
        ).order_by(AssessmentResult.created_at.desc()).first()

    @staticmethod
    def get_my_latest_result_with_status(db: Session, user_id: str, token: Optional[str] = None) -> Optional[dict]:
        """
        Constraint 2: Current assessment semantics include version identity.
        A result is current only if it matches the assessment_id, assessment_version,
        and scoring_version expected for the student's current academic context.
        """
        latest = AssessmentService.get_my_latest_result(db, user_id)
        if not latest:
            return None

        is_current = False
        if token:
            try:
                assigned = AssessmentService.resolve_assessment_for_student(db, user_id, token)
                if (
                    latest.assessment_id == assigned.id
                    and latest.assessment_version == assigned.assessment_version
                    and latest.scoring_version == assigned.scoring_version
                ):
                    is_current = True
            except Exception:
                is_current = False

        return {
            "id": latest.id,
            "attempt_id": latest.attempt_id,
            "user_id": latest.user_id,
            "assessment_id": latest.assessment_id,
            "assessment_version": latest.assessment_version,
            "scoring_version": latest.scoring_version,
            "primary_stream_recommendation": latest.primary_stream_recommendation,
            "secondary_stream_recommendation": latest.secondary_stream_recommendation,
            "top_career_match": latest.top_career_match,
            "dimension_scores": latest.dimension_scores,
            "summary_text": latest.summary_text,
            "is_current": is_current,
            "created_at": latest.created_at,
        }
