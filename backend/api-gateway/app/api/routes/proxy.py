import httpx
from typing import Optional
from fastapi import APIRouter, Request, Response, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings

router = APIRouter(prefix="/api/v1")
security = HTTPBearer(auto_error=False)


async def forward_request(target_url: str, request: Request, error_detail: Optional[str] = None) -> Response:
    body = await request.body()
    headers = dict(request.headers)
    # Strip host header to prevent target service header conflicts
    headers.pop("host", None)

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.request(
                method=request.method,
                url=target_url,
                headers=headers,
                params=dict(request.query_params),
                content=body,
            )
            return Response(
                content=resp.content,
                status_code=resp.status_code,
                headers=dict(resp.headers),
                media_type=resp.headers.get("content-type"),
            )
        except httpx.RequestError as exc:
            detail_msg = error_detail if error_detail else f"Target microservice unavailable: {exc}"
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=detail_msg
            )


async def _proxy_auth(path: str, request: Request) -> Response:
    target_url = f"{settings.AUTH_SERVICE_URL.rstrip('/')}/auth/{path}"
    return await forward_request(target_url, request)


async def _proxy_students(path: str, request: Request) -> Response:
    target_url = f"{settings.STUDENT_SERVICE_URL.rstrip('/')}/students/{path}"
    return await forward_request(target_url, request)


# --- Auth Service Proxy Routes ---

@router.get("/auth/{path:path}", operation_id="proxy_auth_get")
async def proxy_auth_get(path: str, request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    return await _proxy_auth(path, request)


@router.post("/auth/{path:path}", operation_id="proxy_auth_post")
async def proxy_auth_post(path: str, request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    return await _proxy_auth(path, request)


@router.put("/auth/{path:path}", operation_id="proxy_auth_put")
async def proxy_auth_put(path: str, request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    return await _proxy_auth(path, request)


@router.delete("/auth/{path:path}", operation_id="proxy_auth_delete")
async def proxy_auth_delete(path: str, request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    return await _proxy_auth(path, request)


@router.patch("/auth/{path:path}", operation_id="proxy_auth_patch")
async def proxy_auth_patch(path: str, request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    return await _proxy_auth(path, request)


@router.options("/auth/{path:path}", operation_id="proxy_auth_options")
async def proxy_auth_options(path: str, request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    return await _proxy_auth(path, request)


# --- Student Profile Service Proxy Routes ---

@router.get("/students/{path:path}", operation_id="proxy_students_get")
async def proxy_students_get(path: str, request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    return await _proxy_students(path, request)


@router.post("/students/{path:path}", operation_id="proxy_students_post")
async def proxy_students_post(path: str, request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    return await _proxy_students(path, request)


@router.put("/students/{path:path}", operation_id="proxy_students_put")
async def proxy_students_put(path: str, request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    return await _proxy_students(path, request)


@router.delete("/students/{path:path}", operation_id="proxy_students_delete")
async def proxy_students_delete(path: str, request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    return await _proxy_students(path, request)


@router.patch("/students/{path:path}", operation_id="proxy_students_patch")
async def proxy_students_patch(path: str, request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    return await _proxy_students(path, request)


@router.options("/students/{path:path}", operation_id="proxy_students_options")
async def proxy_students_options(path: str, request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    return await _proxy_students(path, request)


# --- Roadmap Service Proxy Routes ---

async def _proxy_roadmaps(path: str, request: Request) -> Response:
    clean_path = f"/{path.lstrip('/')}" if path else ""
    target_url = f"{settings.ROADMAP_SERVICE_URL.rstrip('/')}/roadmaps{clean_path}"
    return await forward_request(target_url, request, error_detail="Roadmap service is temporarily unavailable.")


@router.get("/roadmaps", operation_id="proxy_roadmaps_root_get", tags=["Roadmaps"])
async def proxy_roadmaps_root_get(request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    return await _proxy_roadmaps("", request)


@router.get("/roadmaps/{path:path}", operation_id="proxy_roadmaps_get", tags=["Roadmaps"])
async def proxy_roadmaps_get(path: str, request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    return await _proxy_roadmaps(path, request)


@router.post("/roadmaps/{path:path}", operation_id="proxy_roadmaps_post", tags=["Roadmaps"])
async def proxy_roadmaps_post(path: str, request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    return await _proxy_roadmaps(path, request)


@router.put("/roadmaps/{path:path}", operation_id="proxy_roadmaps_put", tags=["Roadmaps"])
async def proxy_roadmaps_put(path: str, request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    return await _proxy_roadmaps(path, request)


@router.patch("/roadmaps/{path:path}", operation_id="proxy_roadmaps_patch", tags=["Roadmaps"])
async def proxy_roadmaps_patch(path: str, request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    return await _proxy_roadmaps(path, request)


@router.delete("/roadmaps/{path:path}", operation_id="proxy_roadmaps_delete", tags=["Roadmaps"])
async def proxy_roadmaps_delete(path: str, request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    return await _proxy_roadmaps(path, request)


# --- Assessment Service Proxy Routes ---

async def _proxy_assessments(path: str, request: Request) -> Response:
    clean_path = f"/{path.lstrip('/')}" if path else ""
    target_url = f"{settings.ASSESSMENT_SERVICE_URL.rstrip('/')}/assessments{clean_path}"
    return await forward_request(target_url, request, error_detail="Assessment service is temporarily unavailable.")



@router.get("/assessments", operation_id="proxy_assessments_root_get", tags=["Assessments"])
async def proxy_assessments_root_get(request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    return await _proxy_assessments("", request)


@router.get("/assessments/{path:path}", operation_id="proxy_assessments_get", tags=["Assessments"])
async def proxy_assessments_get(path: str, request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    return await _proxy_assessments(path, request)


@router.post("/assessments/{path:path}", operation_id="proxy_assessments_post", tags=["Assessments"])
async def proxy_assessments_post(path: str, request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    return await _proxy_assessments(path, request)


@router.put("/assessments/{path:path}", operation_id="proxy_assessments_put", tags=["Assessments"])
async def proxy_assessments_put(path: str, request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    return await _proxy_assessments(path, request)


@router.delete("/assessments/{path:path}", operation_id="proxy_assessments_delete", tags=["Assessments"])
async def proxy_assessments_delete(path: str, request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    return await _proxy_assessments(path, request)


@router.patch("/assessments/{path:path}", operation_id="proxy_assessments_patch", tags=["Assessments"])
async def proxy_assessments_patch(path: str, request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    return await _proxy_assessments(path, request)


@router.options("/assessments/{path:path}", operation_id="proxy_assessments_options", tags=["Assessments"])
async def proxy_assessments_options(path: str, request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    return await _proxy_assessments(path, request)


# --- AI Career Service Proxy Routes ---

async def _proxy_career(path: str, request: Request) -> Response:
    clean_path = f"/{path.lstrip('/')}" if path else ""
    target_url = f"{settings.AI_CAREER_SERVICE_URL.rstrip('/')}/career-intelligence{clean_path}"
    return await forward_request(target_url, request, error_detail="AI Career service is temporarily unavailable.")


@router.get("/career-intelligence/{path:path}", operation_id="proxy_career_get", tags=["Career Intelligence"])
async def proxy_career_get(path: str, request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    return await _proxy_career(path, request)


@router.post("/career-intelligence/{path:path}", operation_id="proxy_career_post", tags=["Career Intelligence"])
async def proxy_career_post(path: str, request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    return await _proxy_career(path, request)


@router.put("/career-intelligence/{path:path}", operation_id="proxy_career_put", tags=["Career Intelligence"])
async def proxy_career_put(path: str, request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    return await _proxy_career(path, request)


@router.delete("/career-intelligence/{path:path}", operation_id="proxy_career_delete", tags=["Career Intelligence"])
async def proxy_career_delete(path: str, request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    return await _proxy_career(path, request)


@router.patch("/career-intelligence/{path:path}", operation_id="proxy_career_patch", tags=["Career Intelligence"])
async def proxy_career_patch(path: str, request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    return await _proxy_career(path, request)


@router.options("/career-intelligence/{path:path}", operation_id="proxy_career_options", tags=["Career Intelligence"])
async def proxy_career_options(path: str, request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    return await _proxy_career(path, request)


# --- Institution / Workshop Service Proxy Routes ---

async def _proxy_workshops(path: str, request: Request) -> Response:
    clean_path = f"/{path.lstrip('/')}" if path else ""
    target_url = f"{settings.INSTITUTION_SERVICE_URL.rstrip('/')}/workshops{clean_path}"
    return await forward_request(target_url, request, error_detail="Institution Workshop service is temporarily unavailable.")


@router.get("/workshops", operation_id="proxy_workshops_root_get", tags=["Workshops"])
async def proxy_workshops_root_get(request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    return await _proxy_workshops("", request)


@router.get("/workshops/{path:path}", operation_id="proxy_workshops_get", tags=["Workshops"])
async def proxy_workshops_get(path: str, request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    return await _proxy_workshops(path, request)


@router.post("/workshops/{path:path}", operation_id="proxy_workshops_post", tags=["Workshops"])
async def proxy_workshops_post(path: str, request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    return await _proxy_workshops(path, request)


@router.put("/workshops/{path:path}", operation_id="proxy_workshops_put", tags=["Workshops"])
async def proxy_workshops_put(path: str, request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    return await _proxy_workshops(path, request)


@router.delete("/workshops/{path:path}", operation_id="proxy_workshops_delete", tags=["Workshops"])
async def proxy_workshops_delete(path: str, request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    return await _proxy_workshops(path, request)


@router.patch("/workshops/{path:path}", operation_id="proxy_workshops_patch", tags=["Workshops"])
async def proxy_workshops_patch(path: str, request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    return await _proxy_workshops(path, request)


@router.options("/workshops/{path:path}", operation_id="proxy_workshops_options", tags=["Workshops"])
async def proxy_workshops_options(path: str, request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    return await _proxy_workshops(path, request)



