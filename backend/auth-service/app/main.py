from contextlib import asynccontextmanager
from fastapi import FastAPI
from sqlalchemy import text
from app.core.config import settings
from app.api.routes.health import router as health_router
from app.api.routes.auth import router as auth_router
from app.db.session import engine, Base
from app.models.user import User  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        with engine.begin() as conn:
            conn.execute(text("CREATE SCHEMA IF NOT EXISTS auth;"))
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Auth Service DB init deferred/warning: {e}")
    yield


app = FastAPI(
    title=f"Udaan AI - {settings.SERVICE_NAME}",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

app.include_router(health_router)
app.include_router(auth_router)
