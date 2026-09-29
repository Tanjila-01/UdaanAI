# AI model setup

Udaan sends career-answer generation to Ollama Cloud with `gpt-oss:120b-cloud`.
It does not download `gpt-oss:120b` or any large local text-generation model.
Embeddings are locally computed via `sentence-transformers/all-MiniLM-L6-v2` (384 dimensions) directly in Python.
Speech-to-text integration uses `BharatGenAI Shrutam-2` (`bharatgenai/Shrutam-2`), a 2B-parameter model released under the BharatGen non-commercial license. Shrutam-2 is integrated at the code/API level but local inference is currently blocked by available hardware/memory. Whisper Tiny has been removed and there is no automatic Whisper fallback.

## Recommended Docker setup

1. Create an Ollama Cloud API key in your Ollama account. Put it only in the
   untracked root `.env` file:

   ```text
   OLLAMA_GENERATION_BASE_URL=https://ollama.com
   OLLAMA_CLOUD_API_KEY=replace_with_your_key
   OLLAMA_TEXT_MODEL=gpt-oss:120b-cloud
   ```

   Do not put this key in source code, `.env.example`, or frontend variables.

2. Start the services and check local AI and embeddings:

   ```powershell
   docker compose up -d --build ai-career-service
   docker compose exec -T ai-career-service python -m scripts.check_local_ai
   ```

   `scripts.check_local_ai` checks both the cloud text response and local 384-dimensional MiniLM embeddings.
   It never pulls the local `gpt-oss:120b` model.

## Ollama authentication

The Docker configuration uses the direct Ollama Cloud API. It requires
`OLLAMA_CLOUD_API_KEY` because the AI Career Service runs in a container, separate
from any Ollama sign-in on the host machine. This is the recommended setup for a
shared or deployed service.

For a developer-only alternative, run `ollama signin` on a host Ollama installation
and set `OLLAMA_GENERATION_BASE_URL=http://host.docker.internal:11434` in the Docker
environment. The signed-in host Ollama service can forward
`gpt-oss:120b-cloud` requests without downloading its weights. Do not use this mode
for a deployed service unless the host daemon and access controls are intentionally
managed. Direct cloud API authentication is simpler and more portable.

Official references: [Ollama Cloud](https://docs.ollama.com/cloud) and
[Ollama authentication](https://docs.ollama.com/api/authentication).

## Local models that remain

- **Embeddings:** `sentence-transformers/all-MiniLM-L6-v2` runs locally via Sentence Transformers. The `career_ai.knowledge_chunks`
  table holds 384-dimensional vectors and records the model name and recipe (`headings-char1200-v1-minilm`).
- **Speech to text:** `BharatGenAI Shrutam-2` (`bharatgenai/Shrutam-2`) resides in the `speech_models` Docker volume. The official BharatGen model card identifies Shrutam-2 as a 2B-parameter model released under the BharatGen non-commercial license. Shrutam-2 is integrated at the code/API level but local inference is currently blocked by available hardware/memory. Whisper Tiny has been removed and there is no automatic Whisper fallback. Actual speech endpoint tests returned HTTP 503 across English, Kannada, Hindi, and Kannada-English code-mixed speech; Shrutam-2 is not production-ready in this environment.

If the previous local text model is still present in the `ollama_models` volume, first
verify a cloud answer and embedding retrieval. You may then remove that no-longer-used
model with `docker compose exec ollama ollama rm <old-text-model>`. This deletes model
data, so do it only after the verification checklist passes.

## Troubleshooting

- **Authentication failure:** confirm that `OLLAMA_CLOUD_API_KEY` is set in `.env`,
  rebuild `ai-career-service`, and check that the key has Ollama Cloud access.
- **Cloud model unavailable or usage limit:** check your Ollama account usage and the
  configured model name. The required cloud model is `gpt-oss:120b-cloud`.
- **Embedding search unavailable:** verify that PostgreSQL is healthy, migration `004`
  is applied, and the knowledge corpus is ingested with `all-MiniLM-L6-v2`. Embeddings
  run directly in Python without requiring Ollama.
- **Voice typing unavailable:** Shrutam-2 is integrated at the code/API level but local inference is currently blocked by available hardware/memory (returning HTTP 503). Whisper Tiny has been removed and there is no automatic Whisper fallback. See the [voice guide](local-voice.md).
