import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.security import get_current_user_claims
from app.db.session import get_db
from app.services.knowledge import retrieve

router = APIRouter(prefix="/career-intelligence/knowledge", tags=["knowledge"])


class SearchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    query: str = Field(min_length=1, max_length=2000)
    category: str | None = None
    stage: str | None = None
    pathway_id: str | None = None
    language: str | None = None
    region: str = "Karnataka"
    limit: int = Field(default=5, ge=1, le=10)


@router.post("/search")
def search_knowledge(request: SearchRequest, claims=Depends(get_current_user_claims), db: Session = Depends(get_db)):
    try:
        # Deliberately no client-controlled draft flag. This endpoint returns evidence, not recommendations.
        matches = retrieve(db, **request.model_dump())
    except ValueError:
        raise HTTPException(422, "Invalid search filters or local model configuration")
    except (httpx.HTTPError, SQLAlchemyError, KeyError):
        raise HTTPException(503, "Local knowledge search is unavailable. Please try again later.")
    return {
        "status": "matches_found" if matches else "no_verified_matches",
        "matches": matches,
        "notice": "Similarity ranks source passages; it is not confidence or proof that a passage answers the question. Check source scope.",
    }
