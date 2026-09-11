import uuid
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.student_profile import StudentProfile
from app.schemas.student_profile import ProfileCreate, ProfileUpdate, AcademicStageUpdate


SUPPORTED_LEVELS = {"Class 8", "Class 9", "Class 10", "PUC 1", "PUC 2", "Diploma", "ITI"}
SUPPORTED_PUC_STREAMS = {"Science", "Commerce", "Arts"}


class StudentService:
    @staticmethod
    def normalize_and_validate_academic_fields(
        level: str,
        stream: Optional[str],
        diploma_branch: Optional[str],
        iti_trade: Optional[str]
    ) -> tuple[Optional[str], Optional[str], Optional[str]]:
        level_str = (level or "").strip()

        if not level_str or level_str not in SUPPORTED_LEVELS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid current_level '{level}'. Must be one of: {', '.join(sorted(SUPPORTED_LEVELS))}"
            )

        if level_str in ["Class 8", "Class 9", "Class 10"]:
            return None, None, None
        elif level_str in ["PUC 1", "PUC 2"]:
            if not stream or not stream.strip():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Stream is required for {level_str} (e.g. Science, Commerce, Arts)"
                )
            clean_stream = stream.strip().title()
            if clean_stream not in SUPPORTED_PUC_STREAMS:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid stream '{stream}'. Must be one of: Science, Commerce, Arts"
                )
            return clean_stream, None, None
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

        filled = sum(1 for field in required_fields if profile_data.get(field) and str(profile_data.get(field)).strip())
        percentage = int((filled / len(required_fields)) * 100)
        is_complete = percentage == 100
        return is_complete, percentage

    @staticmethod
    def create_or_update_profile(db: Session, user_id_str: str, full_name_claim: str, data: ProfileCreate) -> StudentProfile:
        user_uuid = uuid.UUID(user_id_str)
        profile = db.query(StudentProfile).filter(StudentProfile.user_id == user_uuid).first()

        # Validate non-academic required fields against empty or whitespace-only inputs
        if not data.institution_name or not data.institution_name.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Institution name cannot be empty or whitespace only"
            )
        if not data.district or not data.district.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="District cannot be empty or whitespace only"
            )
        if not data.class_or_year or not data.class_or_year.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Class or year cannot be empty or whitespace only"
            )
        if not data.board or not data.board.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Board cannot be empty or whitespace only"
            )

        full_name = (data.full_name or full_name_claim or "Student").strip()
        if not full_name:
            full_name = "Student"

        clean_level = data.current_level.strip()
        clean_stream, clean_diploma, clean_iti = StudentService.normalize_and_validate_academic_fields(
            clean_level, data.stream, data.diploma_branch, data.iti_trade
        )

        clean_inst = data.institution_name.strip()
        clean_dist = data.district.strip()
        clean_class = data.class_or_year.strip()
        clean_board = data.board.strip()
        clean_state = (data.state or "Karnataka").strip()
        clean_lang = data.preferred_language.strip() if data.preferred_language else "English"

        profile_dict = {
            "current_level": clean_level,
            "class_or_year": clean_class,
            "board": clean_board,
            "institution_name": clean_inst,
            "district": clean_dist,
            "stream": clean_stream,
            "diploma_branch": clean_diploma,
            "iti_trade": clean_iti,
        }

        is_complete, percentage = StudentService.calculate_completion(profile_dict)

        if not profile:
            profile = StudentProfile(
                user_id=user_uuid,
                full_name=full_name,
                current_level=clean_level,
                class_or_year=clean_class,
                board=clean_board,
                stream=clean_stream,
                diploma_branch=clean_diploma,
                iti_trade=clean_iti,
                institution_name=clean_inst,
                district=clean_dist,
                state=clean_state,
                preferred_language=clean_lang,
                is_complete=is_complete,
                completion_percentage=percentage,
            )
            db.add(profile)
        else:
            profile.full_name = full_name
            profile.current_level = clean_level
            profile.class_or_year = clean_class
            profile.board = clean_board
            profile.stream = clean_stream
            profile.diploma_branch = clean_diploma
            profile.iti_trade = clean_iti
            profile.institution_name = clean_inst
            profile.district = clean_dist
            profile.state = clean_state
            profile.preferred_language = clean_lang
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
                if isinstance(value, str):
                    clean_val = value.strip()
                    if not clean_val and field in ["institution_name", "district", "full_name"]:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"{field.replace('_', ' ').capitalize()} cannot be empty or whitespace only"
                        )
                    setattr(profile, field, clean_val)
                else:
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

        # Validate and normalize legal combinations centrally
        clean_level = data.current_level.strip()
        clean_stream, clean_diploma, clean_iti = StudentService.normalize_and_validate_academic_fields(
            clean_level, data.stream, data.diploma_branch, data.iti_trade
        )

        profile.current_level = clean_level
        if data.class_or_year is not None:
            clean_class = data.class_or_year.strip()
            if not clean_class:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Class or year cannot be empty or whitespace only"
                )
            profile.class_or_year = clean_class
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

        if data.board is not None:
            clean_board = data.board.strip()
            if not clean_board:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Board cannot be empty or whitespace only"
                )
            profile.board = clean_board

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
