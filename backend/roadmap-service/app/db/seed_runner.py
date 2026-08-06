import sys
import os
from pathlib import Path

service_root = Path(__file__).resolve().parent.parent.parent
if str(service_root) not in sys.path:
    sys.path.insert(0, str(service_root))

import logging
from app.db.session import SessionLocal
from app.services.roadmap_service import RoadmapService

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)


def run_seed() -> int:
    db = SessionLocal()
    try:
        logger.info("Starting database seeding for roadmap-service...")
        total_pathways = RoadmapService.seed_initial_data(db)
        logger.info("Successfully seeded %d pathways into PostgreSQL database!", total_pathways)
        return 0
    except Exception as e:
        logger.error("Database seeding failed: %s", str(e), exc_info=True)
        return 1
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(run_seed())
