import uuid
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.student_profile import StudentProfile
from app.schemas.student_profile import ProfileCreate, ProfileUpdate, AcademicStageUpdate


class StudentService:
    @staticmethod
    def normalize_and_validate_academic_fields(
        level: str,
        stream: Optional[str],
        diploma_branch: Optional[str],
        iti_trade: Optional[str]
    ) -> tuple[Optional[str], Optional[str], Optional[str]]:
        level_str = (level or "").strip()

        if level_str in ["Class 8", "Class 9", "Class 10"]:
            return None, None, None
        elif level_str in ["PUC 1", "PUC 2"]:
            if not stream or not stream.strip():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Stream is required for {level_str} (e.g. Science, Commerce, Arts)"
                )
            return stream.strip(), None, None
        elif level_str == "Diploma":
            if not diploma_branch or not diploma_branch.strip():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Diploma branch is required for Diploma level"
                )
            return None, diploma_branch.strip(), None
        elif level_str == "ITI":
            if not iti_trade or not iti_trade.strip():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="ITI trade is required for ITI level"
                )
            return None, None, iti_trade.strip()
        else:
            return stream, diploma_branch, iti_trade

    @staticmethod
    def calculate_completion(profile_data: dict) -> tuple[bool, int]:
        level = (profile_data.get("current_level") or "").strip()
        required_fields = ["current_level", "class_or_year", "board", "institution_name", "district"]

        if level in ["PUC 1", "PUC 2"]:
            required_fields.append("stream")
        elif level == "Diploma":
            required_fields.append("diploma_branch")
        elif level == "ITI":
            required_fields.append("iti_trade")

        filled = sum(1 for field in required_fields if profile_data.get(field))
        percentage = int((filled / len(required_fields)) * 100)
        is_complete = percentage == 100
        return is_complete, percentage

    @staticmethod
    def create_or_update_profile(db: Session, user_id_str: str, full_name_claim: str, data: ProfileCreate) -> StudentProfile:
        user_uuid = uuid.UUID(user_id_str)
        profile = db.query(StudentProfile).filter(StudentProfile.user_id == user_uuid).first()

        full_name = data.full_name or full_name_claim or "Student"

        clean_stream, clean_diploma, clean_iti = StudentService.normalize_and_validate_academic_fields(
            data.current_level, data.stream, data.diploma_branch, data.iti_trade
        )

        profile_dict = data.model_dump()
        profile_dict["stream"] = clean_stream
        profile_dict["diploma_branch"] = clean_diploma
        profile_dict["iti_trade"] = clean_iti

        is_complete, percentage = StudentService.calculate_completion(profile_dict)

        if not profile:
            profile = StudentProfile(
                user_id=user_uuid,
                full_name=full_name,
                current_level=data.current_level,
                class_or_year=data.class_or_year,
                board=data.board,
                stream=clean_stream,
                diploma_branch=clean_diploma,
                iti_trade=clean_iti,
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
            profile.stream = clean_stream
            profile.diploma_branch = clean_diploma
            profile.iti_trade = clean_iti
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

        # Constraint 8: Standard profile update must actively REJECT academic context changes.
        academic_fields = {"current_level", "class_or_year", "board", "stream", "diploma_branch", "iti_trade"}
        attempted_academic = [f for f in academic_fields if f in update_dict]
        if attempted_academic:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Academic fields ({', '.join(attempted_academic)}) cannot be updated via standard profile update. "
                    "Please use the dedicated academic stage update endpoint."
                )
            )

        for field, value in update_dict.items():
            if value is not None:
                setattr(profile, field, value)

        current_dict = {
            "current_level": profile.current_level,
            "class_or_year": profile.class_or_year,
            "board": profile.board,
            "institution_name": profile.institution_name,
            "district": profile.district,
            "stream": profile.stream,
            "diploma_branch": profile.diploma_branch,
            "iti_trade": profile.iti_trade,
        }
        is_complete, percentage = StudentService.calculate_completion(current_dict)
        profile.is_complete = is_complete
        profile.completion_percentage = percentage

        db.commit()
        db.refresh(profile)
        return profile

    @staticmethod
    def update_academic_stage(db: Session, user_id_str: str, data: AcademicStageUpdate) -> StudentProfile:
        profile = StudentService.get_profile_by_user_id(db, user_id_str)

        # Constraint 9: Validate and normalize legal combinations centrally
        clean_stream, clean_diploma, clean_iti = StudentService.normalize_and_validate_academic_fields(
            data.current_level, data.stream, data.diploma_branch, data.iti_trade
        )

        profile.current_level = data.current_level.strip()
        if data.class_or_year:
            profile.class_or_year = data.class_or_year.strip()
        else:
            # Fallback sensible defaults for class_or_year based on level
            level = profile.current_level
            if level in ["Class 8", "Class 9", "Class 10"]:
                profile.class_or_year = f"{level.split()[-1]}th Standard"
            elif level == "PUC 1":
                profile.class_or_year = "1st Year PUC"
            elif level == "PUC 2":
                profile.class_or_year = "2nd Year PUC"
            elif level == "Diploma":
                profile.class_or_year = "1st Year Diploma"
            elif level == "ITI":
                profile.class_or_year = "1st Year ITI"

        if data.board:
            profile.board = data.board.strip()

        profile.stream = clean_stream
        profile.diploma_branch = clean_diploma
        profile.iti_trade = clean_iti

        current_dict = {
            "current_level": profile.current_level,
            "class_or_year": profile.class_or_year,
            "board": profile.board,
            "institution_name": profile.institution_name,
            "district": profile.district,
            "stream": profile.stream,
            "diploma_branch": profile.diploma_branch,
            "iti_trade": profile.iti_trade,
        }
        is_complete, percentage = StudentService.calculate_completion(current_dict)
        profile.is_complete = is_complete
        profile.completion_percentage = percentage

        db.commit()
        db.refresh(profile)
        return profile
