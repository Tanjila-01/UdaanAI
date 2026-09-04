from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, selectinload
from app.models.pathway import Pathway, PathwayOption, PathwayMilestone, StudentGoal, StudentMilestoneProgress
from app.schemas.goal import CreateGoalRequest, StudentGoalResponse, GoalProgressSummary, MilestoneProgressResponse
from app.db.seed_pathways import INITIAL_PATHWAYS_DATA


class RoadmapService:
    @staticmethod
    def get_pathways(
        db: Session,
        education_level: Optional[str] = None,
        stream: Optional[str] = None
    ) -> List[Pathway]:
        """
        Query pathways from database filtered by education_level and stream.
        Uses selectinload to eagerly load options and milestones in 2 efficient queries (preventing N+1).
        """
        query = db.query(Pathway).options(
            selectinload(Pathway.options),
            selectinload(Pathway.milestones)
        )

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
        goal = (
            db.query(StudentGoal)
            .options(
                selectinload(StudentGoal.pathway),
                selectinload(StudentGoal.option),
                selectinload(StudentGoal.milestone_progress).selectinload(StudentMilestoneProgress.milestone),
            )
            .filter(StudentGoal.student_id == student_id, StudentGoal.status == "ACTIVE")
            .first()
        )
        if not goal:
            return None
        return cls._build_goal_response(goal)

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

        # Archive any previous active goal for this student
        db.query(StudentGoal).filter(
            StudentGoal.student_id == student_id,
            StudentGoal.status == "ACTIVE"
        ).update({"status": "ARCHIVED"}, synchronize_session=False)

        goal_title = selected_option.option_name if selected_option else pathway.title

        new_goal = StudentGoal(
            student_id=student_id,
            pathway_id=pathway.id,
            pathway_option_id=selected_option.id if selected_option else None,
            goal_title=goal_title,
            status="ACTIVE",
        )
        db.add(new_goal)
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
        return cls.get_active_student_goal(db, student_id)

    @classmethod
    def complete_student_milestone(
        cls,
        db: Session,
        student_id: UUID,
        milestone_id: UUID
    ) -> StudentGoalResponse:
        goal = (
            db.query(StudentGoal)
            .options(
                selectinload(StudentGoal.pathway),
                selectinload(StudentGoal.option),
                selectinload(StudentGoal.milestone_progress).selectinload(StudentMilestoneProgress.milestone),
            )
            .filter(StudentGoal.student_id == student_id, StudentGoal.status == "ACTIVE")
            .first()
        )
        if not goal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active career goal found."
            )

        target_prog = None
        for prog in goal.milestone_progress:
            if str(prog.id) == str(milestone_id) or str(prog.milestone_id) == str(milestone_id):
                target_prog = prog
                break

        if not target_prog:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Milestone not found for current goal."
            )

        if target_prog.status == "COMPLETED":
            return cls._build_goal_response(goal)

        if target_prog.status == "LOCKED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Milestone is locked. Please complete previous milestones first."
            )

        target_prog.status = "COMPLETED"
        target_prog.completed_at = datetime.now(timezone.utc)

        # Find next milestone in order to unlock
        next_prog = None
        for prog in goal.milestone_progress:
            if prog.step_number == target_prog.step_number + 1:
                next_prog = prog
                break

        if next_prog and next_prog.status == "LOCKED":
            next_prog.status = "AVAILABLE"

        # Check if all milestones are completed
        all_completed = all(p.status == "COMPLETED" for p in goal.milestone_progress)
        if all_completed:
            goal.status = "COMPLETED"

        db.commit()
        return cls._build_goal_response(goal)
