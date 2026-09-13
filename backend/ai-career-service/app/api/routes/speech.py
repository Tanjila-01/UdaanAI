import asyncio
from fastapi import APIRouter, Depends, HTTPException, Request
from starlette.concurrency import run_in_threadpool
from app.core.security import get_current_user_claims
from app.services.speech import MAX_AUDIO_BYTES, AudioInputError, transcribe_clip
from app.api.routes.answers import capacity

router = APIRouter(prefix='/career-intelligence/speech', tags=['Local speech'])
AUDIO_TYPES = {'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/wav', 'audio/x-wav'}


@router.post('/transcribe')
async def transcribe(request: Request, claims=Depends(get_current_user_claims)):
    if request.headers.get('content-type', '').split(';')[0].lower() not in AUDIO_TYPES:
        raise HTTPException(415, 'Use a WebM, Ogg, MP4 or WAV audio recording.')
    if not capacity.acquire(blocking=False):
        raise HTTPException(429, 'Local AI is busy. Please retry shortly.', headers={'Retry-After': '10'})
    try:
        async def read_audio():
            data = bytearray()
            async for chunk in request.stream():
                if len(data) + len(chunk) > MAX_AUDIO_BYTES:
                    raise HTTPException(413, 'Recording exceeds the 4 MB limit.')
                data.extend(chunk)
            return bytes(data)
        try:
            data = await asyncio.wait_for(read_audio(), timeout=20)
        except asyncio.TimeoutError:
            raise HTTPException(408, 'Recording upload timed out.')
        if not data:
            raise HTTPException(422, 'Please record a question first.')
        try:
            return await run_in_threadpool(transcribe_clip, data)
        except AudioInputError as exc:
            raise HTTPException(422, str(exc))
        except Exception:
            raise HTTPException(503, 'Local voice typing is unavailable. Please type your question for now.')
    finally:
        capacity.release()
