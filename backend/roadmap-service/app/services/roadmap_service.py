from typing import List, Optional, Callable
from uuid import UUID
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy import case
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload
from app.models.pathway import Pathway, PathwayOption, PathwayMilestone, StudentGoal, StudentMilestoneProgress
from app.schemas.goal import CreateGoalRequest, StudentGoalResponse, GoalProgressSummary, MilestoneProgressResponse
from app.db.seed_pathways import INITIAL_PATHWAYS_DATA


class RoadmapService:
    @staticmethod
    def get_pathways(
        db: Session,
        education_level: Optional[str] = None,
        stream: Optional[str] = None,
        ids: Optional[List[str]] = None,
    ) -> List[Pathway]:
        """
        Query pathways from database filtered by education_level, stream, or explicit list of ids.
        Uses selectinload to eagerly load options and milestones in 2 efficient queries (preventing N+1).
        """
        query = db.query(Pathway).options(
            selectinload(Pathway.options),
            selectinload(Pathway.milestones)
        )

        if ids:
            query = query.filter(Pathway.id.in_(ids))

        if education_level:
            level_clean = education_level.strip()
            if level_clean in ["Class 8", "Class 9"]:
                # For middle school students (Class 8/9), include both current level & Class 10 SSLC choices
                query = query.filter(Pathway.education_level.in_([level_clean, "Class 10"]))
            elif level_clean in ["PUC", "PUC 1", "PUC 2"]:
                query = query.filter(Pathway.education_level.in_(["PUC", "PUC 1", "PUC 2"]))
            else:
                query = query.filter(Pathway.education_level == level_clean)

        if stream:
            query = query.filter(Pathway.stream == stream.strip())

        return query.order_by(Pathway.id).all()

    @staticmethod
    def get_pathway_by_id(db: Session, pathway_id: str) -> Optional[Pathway]:
        """
        Retrieve a single pathway by ID with options and milestones eagerly loaded.
        Returns None if pathway is not found.
        """
        return (
            db.query(Pathway)
            .options(
                selectinload(Pathway.options),
                selectinload(Pathway.milestones)
            )
            .filter(Pathway.id == pathway_id.strip())
            .first()
        )

    @staticmethod
    def seed_initial_data(db: Session) -> int:
        """
        Idempotent database seeding method (upsert strategy).
        Uses a two-pass strategy to prevent foreign key violations on self-referential parent_id.
        """
        # Pass 1: Upsert all pathways and their components without setting parent_id
        for p_data in INITIAL_PATHWAYS_DATA:
            pathway = db.query(Pathway).filter(Pathway.id == p_data["id"]).first()
            if not pathway:
                pathway = Pathway(
                    id=p_data["id"],
                    education_level=p_data["education_level"],
                    stream=p_data.get("stream"),
                    title=p_data["title"],
                    category=p_data["category"],
                    duration=p_data.get("duration"),
                    description=p_data["description"],
                    parent_id=None,
                    recommendation_dimensions=p_data.get("recommendation_dimensions"),
                )
                for opt in p_data.get("options", []):
                    pathway.options.append(
                        PathwayOption(
                            option_name=opt["option_name"],
                            stream_or_code=opt.get("stream_or_code"),
                            description=opt["description"],
                            eligibility=opt.get("eligibility"),
                            display_order=opt.get("display_order", 1),
                        )
                    )
                for ms in p_data.get("milestones", []):
                    pathway.milestones.append(
                        PathwayMilestone(
                            step_number=ms["step_number"],
                            title=ms["title"],
                            description=ms["description"],
                            key_action=ms.get("key_action"),
                            is_active=True,
                        )
                    )
                db.add(pathway)
            else:
                # Update top-level pathway fields in-place if existing
                pathway.education_level = p_data["education_level"]
                pathway.stream = p_data.get("stream")
                pathway.title = p_data["title"]
                pathway.category = p_data["category"]
                pathway.duration = p_data.get("duration")
                pathway.description = p_data["description"]
                pathway.recommendation_dimensions = p_data.get("recommendation_dimensions")

                # Update or append options
                existing_opts = {opt.display_order: opt for opt in pathway.options}
                for opt_data in p_data.get("options", []):
                    order = opt_data.get("display_order", 1)
                    if order in existing_opts:
                        existing_opts[order].option_name = opt_data["option_name"]
                        existing_opts[order].stream_or_code = opt_data.get("stream_or_code")
                        existing_opts[order].description = opt_data["description"]
                        existing_opts[order].eligibility = opt_data.get("eligibility")
                    else:
                        pathway.options.append(
                            PathwayOption(
                                option_name=opt_data["option_name"],
                                stream_or_code=opt_data.get("stream_or_code"),
                                description=opt_data["description"],
                                eligibility=opt_data.get("eligibility"),
                                display_order=order,
                            )
                        )

                # Update or append milestones & handle is_active lifecycle flag
                seed_ms_by_step = {ms_data["step_number"]: ms_data for ms_data in p_data.get("milestones", [])}
                db_ms_list = db.query(PathwayMilestone).filter(PathwayMilestone.pathway_id == pathway.id).all()
                db_ms_by_step = {ms.step_number: ms for ms in db_ms_list}

                for step_num, ms_data in seed_ms_by_step.items():
                    if step_num in db_ms_by_step:
                        db_ms_by_step[step_num].title = ms_data["title"]
                        db_ms_by_step[step_num].description = ms_data["description"]
                        db_ms_by_step[step_num].key_action = ms_data.get("key_action")
                        db_ms_by_step[step_num].is_active = True
                    else:
                        db.add(
                            PathwayMilestone(
                                pathway_id=pathway.id,
                                step_number=step_num,
                                title=ms_data["title"],
                                description=ms_data["description"],
                                key_action=ms_data.get("key_action"),
                                is_active=True,
                            )
                        )

                for step_num, db_ms_obj in db_ms_by_step.items():
                    if step_num not in seed_ms_by_step:
                        db_ms_obj.is_active = False
        db.commit()

        # Pass 2: Setup parent_id references now that all pathways exist in database
        for p_data in INITIAL_PATHWAYS_DATA:
            if p_data.get("parent_id"):
                pathway = db.query(Pathway).filter(Pathway.id == p_data["id"]).first()
                if pathway:
                    pathway.parent_id = p_data["parent_id"]

        db.commit()
        return db.query(Pathway).count()

    @staticmethod
    def _build_goal_response(goal: StudentGoal) -> StudentGoalResponse:
        milestone_items = []
        completed_count = 0
        total_count = len(goal.milestone_progress)

        for item in goal.milestone_progress:
            if item.status == "COMPLETED":
                completed_count += 1
            milestone_items.append(
                MilestoneProgressResponse(
                    id=item.id,
                    milestone_id=item.milestone_id,
                    step_number=item.step_number,
                    title=item.milestone.title if item.milestone else "",
                    description=item.milestone.description if item.milestone else "",
                    key_action=item.milestone.key_action if item.milestone else None,
                    status=item.status,
                    completed_at=item.completed_at,
                )
            )

        percentage = round((completed_count / total_count * 100.0), 1) if total_count > 0 else 0.0

        return StudentGoalResponse(
            id=goal.id,
            student_id=goal.student_id,
            pathway_id=goal.pathway_id,
            pathway_title=goal.pathway.title if goal.pathway else "",
            pathway_option_id=goal.pathway_option_id,
            pathway_option_name=goal.option.option_name if goal.option else None,
            goal_title=goal.goal_title,
            status=goal.status,
            created_at=goal.created_at,
            progress=GoalProgressSummary(
                completed=completed_count,
                total=total_count,
                percentage=percentage,
            ),
            milestones=milestone_items,
        )

    @classmethod
    def get_active_student_goal(cls, db: Session, student_id: UUID) -> Optional[StudentGoalResponse]:
        """
        Retrieves the current student goal deterministically:
        1. Current ACTIVE goal (if one exists).
        2. If no active goal exists, the latest COMPLETED goal (ordered by updated_at desc, created_at desc, id desc).
        Returns None if no active or completed goals exist (genuine empty state).
        """
        # 1. Query for active goal first
        active_goal = (
            db.query(StudentGoal)
            .options(
                selectinload(StudentGoal.pathway),
                selectinload(StudentGoal.option),
                selectinload(StudentGoal.milestone_progress).selectinload(StudentMilestoneProgress.milestone),
            )
            .filter(StudentGoal.student_id == student_id, StudentGoal.status == "ACTIVE")
            .first()
        )
        if active_goal:
            return cls._build_goal_response(active_goal)

        # 2. Fall back to latest completed goal
        completed_goal = (
            db.query(StudentGoal)
            .options(
                selectinload(StudentGoal.pathway),
                selectinload(StudentGoal.option),
                selectinload(StudentGoal.milestone_progress).selectinload(StudentMilestoneProgress.milestone),
            )
            .filter(StudentGoal.student_id == student_id, StudentGoal.status == "COMPLETED")
            .order_by(StudentGoal.updated_at.desc(), StudentGoal.created_at.desc(), StudentGoal.id.desc())
            .first()
        )
        if completed_goal:
            return cls._build_goal_response(completed_goal)

        return None

    @classmethod
    def create_or_update_student_goal(
        cls,
        db: Session,
        student_id: UUID,
        pathway_id: str,
        pathway_option_id: Optional[UUID] = None
    ) -> StudentGoalResponse:
        pathway = db.query(Pathway).options(selectinload(Pathway.milestones)).filter(Pathway.id == pathway_id.strip()).first()
        if not pathway:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Pathway '{pathway_id}' not found."
            )

        selected_option = None
        if pathway_option_id:
            selected_option = db.query(PathwayOption).filter(
                PathwayOption.id == pathway_option_id,
                PathwayOption.pathway_id == pathway.id
            ).first()
            if not selected_option:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Selected pathway option is invalid or does not belong to the target pathway."
                )

        # Helper to check if a goal matches requested pathway & option
        def matches_target(g: StudentGoal) -> bool:
            if g.pathway_id != pathway.id:
                return False
            if pathway_option_id is None:
                return g.pathway_option_id is None
            return g.pathway_option_id == pathway_option_id

        # Query existing active goal for this student
        current_active = (
            db.query(StudentGoal)
            .options(
                selectinload(StudentGoal.pathway),
                selectinload(StudentGoal.option),
                selectinload(StudentGoal.milestone_progress).selectinload(StudentMilestoneProgress.milestone),
            )
            .filter(StudentGoal.student_id == student_id, StudentGoal.status == "ACTIVE")
            .first()
        )

        # Case 1: Active goal already matches the requested pathway & option
        # Return existing goal and its progress without resetting, archiving, or recreating
        if current_active and matches_target(current_active):
            return cls._build_goal_response(current_active)

        # Query existing completed goals for this student that match the target pathway & option
        matching_completed = (
            db.query(StudentGoal)
            .options(
                selectinload(StudentGoal.pathway),
                selectinload(StudentGoal.option),
                selectinload(StudentGoal.milestone_progress).selectinload(StudentMilestoneProgress.milestone),
            )
            .filter(
                StudentGoal.student_id == student_id,
                StudentGoal.status == "COMPLETED",
            )
            .filter(StudentGoal.pathway_id == pathway.id)
            .filter(StudentGoal.pathway_option_id == (selected_option.id if selected_option else None))
            .order_by(StudentGoal.updated_at.desc(), StudentGoal.created_at.desc(), StudentGoal.id.desc())
            .first()
        )

        # Case 2: Target pathway was previously COMPLETED by this student.
        # After explicit switch confirmation, archive B and display completed A without resetting/reopening A.
        # POST and subsequent GET must agree. Preserve all history.
        if matching_completed:
            if current_active:
                db.query(StudentGoal).filter(
                    StudentGoal.id == current_active.id,
                    StudentGoal.status == "ACTIVE"
                ).update({"status": "ARCHIVED", "updated_at": datetime.now(timezone.utc)}, synchronize_session=False)
            # Touch updated_at to ensure deterministic ordering on subsequent GET
            matching_completed.updated_at = datetime.now(timezone.utc)
            db.commit()
            return cls._build_goal_response(matching_completed)

        # Case 3: Switching to a new target pathway that is not currently active or completed.
        # Keep switching atomic: archive previous active goal and create new goal in the same transaction.
        if current_active:
            db.query(StudentGoal).filter(
                StudentGoal.id == current_active.id,
                StudentGoal.status == "ACTIVE"
            ).update({"status": "ARCHIVED", "updated_at": datetime.now(timezone.utc)}, synchronize_session=False)

        goal_title = selected_option.option_name if selected_option else pathway.title

        new_goal = StudentGoal(
            student_id=student_id,
            pathway_id=pathway.id,
            pathway_option_id=selected_option.id if selected_option else None,
            goal_title=goal_title,
            status="ACTIVE",
        )
        db.add(new_goal)
        try:
            db.flush()

            # Initialize progress records for each milestone in step order
            milestones = sorted(pathway.milestones, key=lambda m: m.step_number)
            for idx, m in enumerate(milestones):
                init_status = "AVAILABLE" if idx == 0 else "LOCKED"
                prog = StudentMilestoneProgress(
                    goal_id=new_goal.id,
                    milestone_id=m.id,
                    step_number=m.step_number,
                    status=init_status,
                )
                db.add(prog)

            db.commit()
        except IntegrityError as exc:
            db.rollback()
            # Recover ONLY from specific active-goal uniqueness conflict
            err_str = str(exc.orig) if hasattr(exc, "orig") and exc.orig else str(exc)
            is_active_goal_conflict = (
                "uq_student_active_goal" in err_str
                or "student_goals.student_id" in err_str
                or ("UNIQUE constraint failed" in err_str and "student_id" in err_str)
            )
            if not is_active_goal_conflict:
                raise exc

            import time
            concurrent_active = None
            for _ in range(10):
                concurrent_active = (
                    db.query(StudentGoal)
                    .options(
                        selectinload(StudentGoal.pathway),
                        selectinload(StudentGoal.option),
                        selectinload(StudentGoal.milestone_progress).selectinload(StudentMilestoneProgress.milestone),
                    )
                    .filter(StudentGoal.student_id == student_id, StudentGoal.status == "ACTIVE")
                    .first()
                )
                if concurrent_active:
                    break
                time.sleep(0.05)

            # Return existing goal only if pathway and option match the request
            if concurrent_active and matches_target(concurrent_active):
                return cls._build_goal_response(concurrent_active)

            # Otherwise return a clear 409 conflict
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A conflicting active goal was created by a concurrent request. Please refresh and retry."
            )

        # Reload the newly created goal eagerly to return full response
        fresh_goal = (
            db.query(StudentGoal)
            .options(
                selectinload(StudentGoal.pathway),
                selectinload(StudentGoal.option),
                selectinload(StudentGoal.milestone_progress).selectinload(StudentMilestoneProgress.milestone),
            )
            .filter(StudentGoal.id == new_goal.id)
            .first()
        )
        if fresh_goal:
            return cls._build_goal_response(fresh_goal)
        return cls.get_active_student_goal(db, student_id)

    @classmethod
    def complete_student_milestone(
        cls,
        db: Session,
        student_id: UUID,
        milestone_id: UUID,
        _before_commit_hook: Optional[Callable] = None,
    ) -> StudentGoalResponse:
        """
        Updates progress for a milestone against the student-owned goal containing that progress record.
        Never chooses an arbitrary active/completed goal.
        Ensures safe repeated completion requests (idempotent 200).
        """
        # Find the specific progress record owned by this student
        # Look for matching progress record by progress ID or milestone template ID,
        # strictly scoped to goals owned by this student and in ACTIVE or COMPLETED status.
        prog = (
            db.query(StudentMilestoneProgress)
            .join(StudentGoal, StudentMilestoneProgress.goal_id == StudentGoal.id)
            .options(
                selectinload(StudentMilestoneProgress.milestone),
                selectinload(StudentMilestoneProgress.goal).selectinload(StudentGoal.pathway),
                selectinload(StudentMilestoneProgress.goal).selectinload(StudentGoal.option),
                selectinload(StudentMilestoneProgress.goal).selectinload(StudentGoal.milestone_progress).selectinload(StudentMilestoneProgress.milestone),
            )
            .filter(
                StudentGoal.student_id == student_id,
                StudentGoal.status.in_(["ACTIVE", "COMPLETED"]),
                (StudentMilestoneProgress.id == milestone_id) | (StudentMilestoneProgress.milestone_id == milestone_id),
            )
            .order_by(
                case((StudentGoal.status == "ACTIVE", 1), else_=2),
                StudentGoal.updated_at.desc(),
                StudentMilestoneProgress.step_number.asc()
            )
            .first()
        )

        if not prog:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Milestone not found for student's current goal."
            )

        goal = prog.goal

        # Safe idempotent completion: if milestone is already completed, safely return goal response
        if prog.status == "COMPLETED":
            return cls._build_goal_response(goal)

        if prog.status == "LOCKED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Milestone is locked. Please complete previous milestones first."
            )

        # Mark milestone COMPLETED with timestamp
        now = datetime.now(timezone.utc)
        prog.status = "COMPLETED"
        prog.completed_at = now
        prog.updated_at = now

        # Unlock next milestone in sequence for this specific goal
        for other_prog in goal.milestone_progress:
            if other_prog.step_number == prog.step_number + 1 and other_prog.status == "LOCKED":
                other_prog.status = "AVAILABLE"
                other_prog.updated_at = now
                break

        if _before_commit_hook:
            _before_commit_hook()

        # Check if all milestones for this goal are now completed
        all_completed = all(p.status == "COMPLETED" for p in goal.milestone_progress)
        if all_completed:
            # Make the transition conditional on current database status being ACTIVE.
            # An in-memory status check is insufficient against concurrent state changes.
            rows_updated = (
                db.query(StudentGoal)
                .filter(
                    StudentGoal.id == goal.id,
                    StudentGoal.status == "ACTIVE"
                )
                .update(
                    {"status": "COMPLETED", "updated_at": now},
                    synchronize_session=False
                )
            )
            if rows_updated > 0:
                goal.status = "COMPLETED"

        goal.updated_at = now
        db.commit()
        db.refresh(goal)
        return cls._build_goal_response(goal)
