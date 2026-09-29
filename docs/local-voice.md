# Local voice and student advisor

The student page at `/student/ai-career` now has career starter cards, a scrollable conversation, expandable sources, a fresh-start action, and English voice input/output. Existing profile, assessment and pathway rankings are unchanged.

## Student flow

1. Type a question or choose **Speak**. Recording begins only after the student clicks and grants microphone permission.
2. Choose **Done** to transcribe; **Cancel** discards the recording. Recording stops automatically at 29 seconds, leaving room for audio encoder padding under the server's 30-second limit.
3. Review/edit the transcript in the question box, then send. Transcripts are never automatically sent as career questions.
4. Choose **Listen** on an answer to hear it; choose **Stop listening** to stop. There is no autoplay.

English is the only supported language in this release. Short, clear recordings work best; names, accents and background noise can reduce accuracy. The student should review the transcript.

## Model details and current status

- **Model and parameter count:** `BharatGenAI Shrutam-2` (`bharatgenai/Shrutam-2`) is an Indic multilingual speech model. The official BharatGen model card identifies Shrutam-2 as a **2B-parameter** model (not ~8B; the ~7.28 GB download size represents uncompressed model weight files).
- **Implementation status:** Shrutam-2 is integrated at the code/API level but local inference is currently blocked by available hardware/memory. Whisper Tiny has been removed and there is no automatic Whisper fallback.
- **Licensing:** The official BharatGen model card states that Shrutam-2 is released under the BharatGen non-commercial license (NM-ICPS, Department of Science and Technology, Government of India). Commercial deployment is not authorized without explicit licensing.
- **Production readiness:** Shrutam-2 is not production-ready in this environment and is not locally working for inference.
- **Observed hardware requirements:** BharatGen does not state a hard official minimum (such as a 16 GB VRAM requirement) in its model documentation. However, practical/observed requirements for the current implementation indicate that loading and running inference on the 2B-parameter model requires substantial dedicated host memory or GPU resources beyond what is currently available in the container environment.
- **Storage and download:** Model weights are stored in the persistent `speech_models` Docker volume at `/models/shrutam-2` using the official [BharatGenAI Shrutam-2 repository](https://huggingface.co/bharatgenai/Shrutam-2). PyAV decodes incoming audio (WebM/Opus, OGG, MP4) to 16 kHz mono float32.
- **Audio and browser controls:** Browser microphone access requires localhost or HTTPS and a supported MediaRecorder format. Read-aloud selects a browser-installed local voice when available.

## Setup on another machine

```powershell
docker compose build ai-career-service
docker compose run --rm --no-deps -e HF_HUB_OFFLINE=0 ai-career-service python scripts/install_speech_model.py
docker compose up -d --no-deps ai-career-service
docker compose restart api-gateway
```

The download step needs internet access once. Whisper Tiny has been completely removed from runtime and dependencies; no fallback model exists. Models and PostgreSQL data live in separate volumes; do not remove either volume when restarting services.

## API and limits

`POST /api/v1/career-intelligence/speech/transcribe` takes raw audio bytes with a supported audio Content-Type and the existing Bearer access token. It returns `{ "text": "...", "language": "en" }`.

- Both gateway and service stream-limit uploads to 4 MB, including requests without a Content-Length header. Upload reading times out after 20 seconds.
- Decoded audio is limited to 30 seconds and kept in memory. Audio is not written to files, the database or application logs.
- Audio is never persisted. If a reviewed transcript is sent as a career question and receives a completed answer, its text and answer are saved in student-owned Previous questions. The open view clears on navigation or identity change; saved items can be deleted from history.
- Voice and career-answer inference share the same one-request capacity gate. Excess requests receive HTTP 429 and Retry-After: 10.
- Invalid/empty/silent audio returns 422; unsupported media type returns 415; oversized audio returns 413; when local model loading or inference fails due to hardware/memory limits, the endpoint returns 503 (`Local voice typing is unavailable`). Internal errors are not exposed.
- The gateway allows 120 seconds for transcription; the browser allows 130 seconds. Other route timeouts remain unchanged.
- Cancelling or leaving stops microphone tracks and aborts the browser request. Inference already running on the server may finish before releasing capacity.

## Validation

- 116 frontend regression tests passed after the redesign; 8 additional voice-hook tests passed.
- 49 AI-service tests and 19 gateway tests passed.
- Production build passed, with the existing large-bundle warning.
- Voice tests cover transcript handoff, cancel without upload, late permission after unmount, aborting pending transcription, permission denial, automatic recording limit, local voice selection and no remote-voice fallback.
- Backend tests cover authentication, corrupt/short/long recordings, silence, size/type checks, shared busy capacity, error sanitization and binary/auth forwarding.

### Live Speech Verification Outcome

In live endpoint verification (`POST /career-intelligence/speech/transcribe`), local inference did **not** pass. The speech endpoint returned **HTTP 503** across all tested categories:
- English speech clips
- Kannada speech clips
- Hindi speech clips
- Kannada-English code-mixed speech clips

Local inference is currently blocked by available hardware/memory during model initialization. Whisper Tiny has been completely removed and there is no automatic Whisper fallback.
