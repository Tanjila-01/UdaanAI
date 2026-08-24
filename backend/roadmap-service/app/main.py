from contextlib import asynccontextmanager
from fastapi import FastAPI
from sqlalchemy import text
from app.core.config import settings
from app.api.routes.health import router as health_router
from app.api.routes.roadmap import router as roadmap_router
from app.db.session import engine, Base, SessionLocal
from app.services.roadmap_service import RoadmapService
import app.models  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        with engine.begin() as conn:
            conn.execute(text("CREATE SCHEMA IF NOT EXISTS roadmap;"))
        Base.metadata.create_all(bind=engine)
        with SessionLocal() as db:
            RoadmapService.seed_initial_data(db)
    except Exception as e:
        print(f"Roadmap Service DB init warning: {e}")
    yield


app = FastAPI(
    title=f"Udaan AI - {settings.SERVICE_NAME}",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.include_router(health_router)
app.include_router(roadmap_router)
