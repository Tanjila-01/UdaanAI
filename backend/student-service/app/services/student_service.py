import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.student_profile import StudentProfile
from app.schemas.student_profile import ProfileCreate, ProfileUpdate


class StudentService:
    @staticmethod
    def calculate_completion(profile_data: dict) -> tuple[bool, int]:
        required_fields = ["current_level", "class_or_year", "board", "institution_name", "district"]
        filled = sum(1 for field in required_fields if profile_data.get(field))
        percentage = int((filled / len(required_fields)) * 100)
        is_complete = percentage == 100
        return is_complete, percentage

    @staticmethod
    def create_or_update_profile(db: Session, user_id_str: str, full_name_claim: str, data: ProfileCreate) -> StudentProfile:
        user_uuid = uuid.UUID(user_id_str)
        profile = db.query(StudentProfile).filter(StudentProfile.user_id == user_uuid).first()

        full_name = data.full_name or full_name_claim or "Student"
        is_complete, percentage = StudentService.calculate_completion(data.model_dump())

        if not profile:
            profile = StudentProfile(
                user_id=user_uuid,
                full_name=full_name,
                current_level=data.current_level,
                class_or_year=data.class_or_year,
                board=data.board,
                stream=data.stream,
                diploma_branch=data.diploma_branch,
                iti_trade=data.iti_trade,
                institution_name=data.institution_name,
                district=data.district,
                state=data.state or "Karnataka",
                preferred_language=data.preferred_language,
                is_complete=is_complete,
                completion_percentage=percentage,
            )
            db.add(profile)
        else:
            profile.full_name = full_name
            profile.current_level = data.current_level
            profile.class_or_year = data.class_or_year
            profile.board = data.board
            profile.stream = data.stream
            profile.diploma_branch = data.diploma_branch
            profile.iti_trade = data.iti_trade
            profile.institution_name = data.institution_name
            profile.district = data.district
            profile.state = data.state or "Karnataka"
            profile.preferred_language = data.preferred_language
            profile.is_complete = is_complete
            profile.completion_percentage = percentage

        db.commit()
        db.refresh(profile)
        return profile

    @staticmethod
    def get_profile_by_user_id(db: Session, user_id_str: str) -> StudentProfile:
        user_uuid = uuid.UUID(user_id_str)
        profile = db.query(StudentProfile).filter(StudentProfile.user_id == user_uuid).first()
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student profile not found. Please complete onboarding."
            )
        return profile

    @staticmethod
    def update_profile(db: Session, user_id_str: str, data: ProfileUpdate) -> StudentProfile:
        profile = StudentService.get_profile_by_user_id(db, user_id_str)

        update_dict = data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            if value is not None:
                setattr(profile, field, value)

        current_dict = {
            "current_level": profile.current_level,
            "class_or_year": profile.class_or_year,
            "board": profile.board,
            "institution_name": profile.institution_name,
            "district": profile.district,
        }
        is_complete, percentage = StudentService.calculate_completion(current_dict)
        profile.is_complete = is_complete
        profile.completion_percentage = percentage

        db.commit()
        db.refresh(profile)
        return profile
