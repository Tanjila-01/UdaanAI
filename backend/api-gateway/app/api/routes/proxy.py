import httpx
from typing import Optional
from fastapi import APIRouter, Request, Response, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings

router = APIRouter(prefix="/api/v1")
security = HTTPBearer(auto_error=False)


async def forward_request(target_url: str, request: Request) -> Response:
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
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Target microservice unavailable: {exc}"
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
