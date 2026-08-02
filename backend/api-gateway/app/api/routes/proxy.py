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


@router.api_route("/auth/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def proxy_auth(path: str, request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    target_url = f"{settings.AUTH_SERVICE_URL.rstrip('/')}/auth/{path}"
    return await forward_request(target_url, request)


@router.api_route("/students/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def proxy_students(path: str, request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    target_url = f"{settings.STUDENT_SERVICE_URL.rstrip('/')}/students/{path}"
    return await forward_request(target_url, request)
