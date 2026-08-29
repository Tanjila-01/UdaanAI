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

        if current_level in ["Class 8", "Class 9"]:
            target_level = "Class 8-9"
        elif current_level in ["PUC 1", "PUC 2"]:
            target_level = "PUC"
        else:
            target_level = current_level

        query = db.query(Assessment).filter(
            Assessment.target_level == target_level,
            Assessment.is_active == True
        )

        if target_level == "PUC":
            if not stream:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Academic stream is required for PUC assessment selection."
                )
            query = query.filter(Assessment.target_stream == stream)

        assessment = query.first()
        if not assessment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No active assessment found for level '{current_level}'" + (f" and stream '{stream}'" if stream else "") + "."
            )
        return assessment

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

        # Calculate maximum possible score for each dimension dynamically
        max_scores = {
            "science": 0,
            "commerce": 0,
            "arts": 0,
            "diploma": 0,
            "iti": 0
        }
        for q in questions:
            q_max = {}
            for opt in q.options:
                dim = opt.weight_dimension.lower()
                if opt.weight_score > q_max.get(dim, 0):
                    q_max[dim] = opt.weight_score
            for dim, score in q_max.items():
                max_scores[dim] = max_scores.get(dim, 0) + score

        # Deterministic Rule-Based Scoring across dimensions (science, commerce, arts, diploma, iti)
        dimension_scores = {
            "science": 0,
            "commerce": 0,
            "arts": 0,
            "diploma": 0,
            "iti": 0
        }

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

        # Sort dimensions by normalized score descending to find the top recommendation
        sorted_dims = sorted(normalized_scores.items(), key=lambda x: x[1], reverse=True)
        top_dim, top_score = sorted_dims[0]
        second_dim, second_score = sorted_dims[1]

        dimension_map = {
            "science": ("PUC Science", "AI & Software Application Engineer"),
            "diploma": ("Polytechnic Diploma", "Computer Science & Robotics Engineer"),
            "commerce": ("PUC Commerce", "Financial Analyst & CA Associate"),
            "arts": ("PUC Arts & Humanities", "UI/UX & Product Designer"),
            "iti": ("ITI Vocational Trades", "Industrial Automation & Solar Technician")
        }

        primary_recommendation, top_career = dimension_map.get(top_dim, ("PUC Science", "Software Engineer"))
        secondary_recommendation, _ = dimension_map.get(second_dim, ("Polytechnic Diploma", "Technical Specialist"))

        summary_text = (
            f"Based on your assessment responses, you show strong aptitude for {primary_recommendation} "
            f"with key strength in {top_dim.title()} (score: {top_score}). Your secondary suitable pathway is "
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
