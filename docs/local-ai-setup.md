# AI model setup

Udaan sends career-answer generation to Ollama Cloud with `gpt-oss:120b-cloud`.
It does not download `gpt-oss:120b` or any large local text-generation model. The
small local Ollama container remains only for the existing 1024-dimensional
`qwen3-embedding:0.6b` retrieval model. English voice input remains local through
faster-whisper and `whisper-tiny-en`.

## Recommended Docker setup

1. Create an Ollama Cloud API key in your Ollama account. Put it only in the
   untracked root `.env` file:

   ```text
   OLLAMA_GENERATION_BASE_URL=https://ollama.com
   OLLAMA_CLOUD_API_KEY=replace_with_your_key
   OLLAMA_TEXT_MODEL=gpt-oss:120b-cloud
   ```

   Do not put this key in source code, `.env.example`, or frontend variables.

2. Start the services and install only the required local embedding model:

   ```powershell
   docker compose up -d ollama
   docker compose exec ollama ollama pull qwen3-embedding:0.6b
   docker compose up -d --build
   docker compose exec -T ai-career-service python -m scripts.check_local_ai
   ```

   `scripts.check_local_ai` checks both the cloud text response and local embeddings.
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

- **Embeddings:** `qwen3-embedding:0.6b` remains local. The `career_ai.knowledge_chunks`
  table holds 1024-dimensional vectors and records the model digest. Changing this
  model needs a migration and complete re-index; do not mix vectors from different models.
- **Speech to text:** `whisper-tiny-en` remains in the `speech_models` Docker volume.
  It is loaded on CPU only during voice transcription. No cloud STT replacement is
  implemented in this project.

If the previous local text model is still present in the `ollama_models` volume, first
verify a cloud answer and embedding retrieval. You may then remove that no-longer-used
model with `docker compose exec ollama ollama rm <old-text-model>`. This deletes model
data, so do it only after the verification checklist passes.

## Troubleshooting

- **Authentication failure:** confirm that `OLLAMA_CLOUD_API_KEY` is set in `.env`,
  rebuild `ai-career-service`, and check that the key has Ollama Cloud access.
- **Cloud model unavailable or usage limit:** check your Ollama account usage and the
  configured model name. The required cloud model is `gpt-oss:120b-cloud`.
- **Embedding search unavailable:** start the `ollama` container and ensure
  `qwen3-embedding:0.6b` is installed. Do not point the embedding setting at the
  generative cloud model.
- **Voice typing unavailable:** verify the existing local speech model using the
  [voice setup guide](local-voice.md). It is independent of Ollama Cloud.
