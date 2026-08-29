import httpx
from fastapi import HTTPException, status
from app.core.config import settings


class StudentClient:
    @staticmethod
    def get_student_profile(token: str) -> dict:
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing Authorization token to fetch student profile."
            )
        headers = {"Authorization": f"Bearer {token}"}
        try:
            url = f"{settings.STUDENT_SERVICE_URL.rstrip('/')}/students/profile/me"
            with httpx.Client(timeout=5.0) as client:
                resp = client.get(url, headers=headers)
                if resp.status_code == 200:
                    return resp.json()
                elif resp.status_code == 404:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Student profile not found. Please complete your profile first."
                    )
                else:
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail=f"Failed to fetch student profile: {resp.status_code}"
                    )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Student profile service is temporarily unavailable: {str(e)}"
            )
