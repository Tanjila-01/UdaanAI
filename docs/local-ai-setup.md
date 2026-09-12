# Local AI setup (no API billing)

Udaan uses Ollama in Docker for local text generation and embeddings. No account,
API key or cloud fallback is configured. `OLLAMA_NO_CLOUD=1` disables cloud features.
The host port is bound to localhost only. Models persist in `ollama_models`.

From the project folder in PowerShell:

```powershell
docker compose up -d ollama
docker compose exec ollama ollama pull qwen3:1.7b
docker compose exec ollama ollama pull qwen3-embedding:0.6b
docker compose up -d --build --no-deps ai-career-service
docker compose exec -T ai-career-service python -m scripts.check_local_ai
```

Initial image/model downloads require internet and several GB of disk space.
Inference uses local hardware and electricity. The small CPU model is a starting
point for this 16 GB machine; assess English/Kannada quality before student use.
Docker has about 8 GB available. One loaded model and one parallel request keep
memory use modest. To free model memory, stop just Ollama:

```powershell
docker compose stop ollama
```

This installs the provider foundation, not the completed student chat feature.
Local knowledge ingestion and filtered retrieval have since been added; see
[the retrieval guide](knowledge-retrieval.md). PostgreSQL now includes pgvector and
additive knowledge tables; the existing student data was retained and backed up.
Student-context integration, generated answers and the chat UI remain to be built.

Voice must also avoid paid APIs: use local Whisper for transcription and installed
device voices for playback where available. These voice components are not yet
installed or integrated. Kannada voice availability and recognition quality must be
tested; do not promise Kannada playback until a suitable local voice is available.

References: https://docs.ollama.com/docker and https://docs.ollama.com/faq

## Verified on this computer, 12 September 2026

- Ollama 0.34.0, pinned image digest in Compose.
- Qwen3 1.7B text model and Qwen3 Embedding 0.6B downloaded successfully.
- Backend smoke check returned a career answer and two 1024-dimensional vectors.
- First short CPU answer took 14.6 seconds (not a production latency benchmark).
- AI service test suite: 13 passed, including remote/cloud rejection and no fallback.
- Existing AI service health endpoint passed after rebuilding.
