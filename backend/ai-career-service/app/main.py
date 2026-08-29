from fastapi import FastAPI
from app.core.config import settings
from app.api.routes.health import router as health_router
from app.api.routes.recommendation import router as recommendation_router

app = FastAPI(
    title=f"Udaan AI - {settings.SERVICE_NAME}",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

app.include_router(health_router)
app.include_router(recommendation_router)
