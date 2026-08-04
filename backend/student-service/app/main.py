from contextlib import asynccontextmanager
from fastapi import FastAPI
from sqlalchemy import text
from app.core.config import settings
from app.api.routes.health import router as health_router
from app.api.routes.student import router as student_router
from app.db.session import engine, Base
from app.models.student_profile import StudentProfile  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables exist and apply schema column additions safely
    try:
        with engine.begin() as conn:
            conn.execute(text("CREATE SCHEMA IF NOT EXISTS student;"))
        Base.metadata.create_all(bind=engine)

        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE student.student_profiles ADD COLUMN IF NOT EXISTS stream VARCHAR(100);"))
            conn.execute(text("ALTER TABLE student.student_profiles ADD COLUMN IF NOT EXISTS diploma_branch VARCHAR(150);"))
            conn.execute(text("ALTER TABLE student.student_profiles ADD COLUMN IF NOT EXISTS iti_trade VARCHAR(150);"))
    except Exception as e:
        print(f"Student Service DB init/migration warning: {e}")
    yield


app = FastAPI(
    title=f"Udaan AI - {settings.SERVICE_NAME}",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

app.include_router(health_router)
app.include_router(student_router)
