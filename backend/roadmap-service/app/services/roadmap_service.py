from typing import List, Optional
from sqlalchemy.orm import Session, selectinload
from app.models.pathway import Pathway, PathwayOption, PathwayMilestone
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
        Inserts missing pathways, options, and milestones or updates existing entries in-place without creating duplicates.
        Returns total count of pathways in database.
        """
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

                # Update or append milestones
                existing_ms = {ms.step_number: ms for ms in pathway.milestones}
                for ms_data in p_data.get("milestones", []):
                    step = ms_data["step_number"]
                    if step in existing_ms:
                        existing_ms[step].title = ms_data["title"]
                        existing_ms[step].description = ms_data["description"]
                        existing_ms[step].key_action = ms_data.get("key_action")
                    else:
                        pathway.milestones.append(
                            PathwayMilestone(
                                step_number=step,
                                title=ms_data["title"],
                                description=ms_data["description"],
                                key_action=ms_data.get("key_action"),
                            )
                        )

        db.commit()
        return db.query(Pathway).count()
