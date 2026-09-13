# Local voice and student advisor

The student page at `/student/ai-career` now has career starter cards, a scrollable conversation, expandable sources, a fresh-start action, and English voice input/output. Existing profile, assessment and pathway rankings are unchanged.

## Student flow

1. Type a question or choose **Speak**. Recording begins only after the student clicks and grants microphone permission.
2. Choose **Done** to transcribe; **Cancel** discards the recording. Recording stops automatically at 29 seconds, leaving room for audio encoder padding under the server's 30-second limit.
3. Review/edit the transcript in the question box, then send. Transcripts are never automatically sent as career questions.
4. Choose **Listen** on an answer to hear it; choose **Stop listening** to stop. There is no autoplay.

English is the only supported language in this release. Short, clear recordings work best; names, accents and background noise can reduce accuracy. The student should review the transcript.

## Free, local processing

- Transcription uses `faster-whisper==1.2.1` and the `Systran/faster-whisper-tiny.en` model, pinned to revision `0d3d19a32d3338f10357c0889762bd8d64bbdeba`. It runs on CPU with INT8 computation and two threads.
- The model is stored in the persistent `speech_models` Docker volume. No paid API key or billing account is needed.
- The service loads only the installed model directory with `local_files_only=True`. Docker also sets `HF_HUB_OFFLINE=1` and disables Hub telemetry. No model download or remote transcription fallback occurs during student requests.
- Read-aloud selects an English voice only when its browser `localService` property is true. If there is no local English voice, Listen is disabled and the page explains why. The browser or operating system must supply that voice. See [MDN's localService documentation](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService).
- Browser microphone access requires localhost or HTTPS and a supported MediaRecorder format. WebM/Opus, Ogg/Opus and MP4 recording are supported when exposed by the browser. There is no browser cloud speech-recognition fallback.

The one-time model download uses the official [Systran model repository](https://huggingface.co/Systran/faster-whisper-tiny.en). The implementation follows the [faster-whisper project](https://github.com/SYSTRAN/faster-whisper).

## Setup on another machine

```powershell
docker compose build ai-career-service
docker compose run --rm --no-deps -e HF_HUB_OFFLINE=0 ai-career-service python scripts/install_speech_model.py
docker compose up -d --no-deps ai-career-service
docker compose restart api-gateway
```

The download step needs internet access once. Normal student speech processing does not. Models and PostgreSQL data live in separate volumes; do not remove either volume when restarting services.

## API and limits

`POST /api/v1/career-intelligence/speech/transcribe` takes raw audio bytes with a supported audio Content-Type and the existing Bearer access token. It returns `{ "text": "...", "language": "en" }`.

- Both gateway and service stream-limit uploads to 4 MB, including requests without a Content-Length header. Upload reading times out after 20 seconds.
- Decoded audio is limited to 30 seconds and kept in memory. Audio is not written to files, the database or application logs.
- No transcript or conversation persistence was added. Messages clear on navigation or student identity change.
- Voice and career-answer inference share the same one-request capacity gate. Excess requests receive HTTP 429 and Retry-After: 10.
- Invalid/empty/silent audio returns 422; unsupported media type returns 415; oversized audio returns 413; a missing model/service failure returns 503. Internal errors are not exposed.
- The gateway allows 120 seconds for transcription; the browser allows 130 seconds. Other route timeouts remain unchanged.
- Cancelling or leaving stops microphone tracks and aborts the browser request. Inference already running on the server may finish before releasing capacity.

## Validation

- 116 frontend regression tests passed after the redesign; 8 additional voice-hook tests passed.
- 49 AI-service tests and 19 gateway tests passed.
- Production build passed, with the existing large-bundle warning.
- Voice tests cover transcript handoff, cancel without upload, late permission after unmount, aborting pending transcription, permission denial, automatic recording limit, local voice selection and no remote-voice fallback.
- Backend tests cover authentication, corrupt/short/long recordings, silence, size/type checks, shared busy capacity, error sanitization and binary/auth forwarding.

Actual microphone capture and audible playback still need a student-device check because browser permissions, microphone hardware and installed voices vary. Automated tests simulate those browser interfaces; they do not establish real microphone quality.

A live integration check generated a synthetic WAV question with the installed Windows voice, sent it through the authenticated gateway, and received the exact transcript “What does a software developer do?”. That transcript then produced a real Ollama career answer with one verified source. The temporary test student and audio file were removed afterwards.
