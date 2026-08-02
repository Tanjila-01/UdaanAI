from fastapi import FastAPI
from app.core.config import settings
from app.api.routes.health import router as health_router
from app.api.routes.student import router as student_router
from app.db.session import engine, Base
from app.models.student_profile import StudentProfile

app = FastAPI(
    title=f"Udaan AI - {settings.SERVICE_NAME}",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)


@app.on_event("startup")
def startup_db_client():
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Student Service DB init deferred/warning: {e}")


app.include_router(health_router)
app.include_router(student_router)
