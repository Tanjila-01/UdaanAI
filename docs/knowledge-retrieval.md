# Local knowledge ingestion and retrieval

This phase implements evidence search, not LLM answers or student recommendations.
No paid API or model is used. The existing recommendation scoring is unchanged.

## Storage and startup

PostgreSQL uses a custom image built from the exact previous PostgreSQL 15.18 Alpine
digest, with pgvector 0.8.6 compiled into it. The existing `postgres_data` volume remains.
Migration 002 adds only `career_ai.knowledge_documents` and `knowledge_chunks`, plus
metadata and document-reference indexes. Exact cosine search is intentional for this
small corpus; an approximate vector index is unnecessary at this size.

The original database backup is `backups/udaan-before-rag-20260912.dump`, excluded
from Git. Existing table row counts were compared before/after and were unchanged.
Use a reviewed restore procedure for recovery; do not delete the database volume.

From the project root:

```powershell
docker compose up -d --build postgres ollama ai-career-service
docker compose exec -T ai-career-service alembic upgrade head
docker compose exec -T ai-career-service python -m scripts.knowledge audit
docker compose exec -T ai-career-service python -m scripts.knowledge ingest
docker compose exec -T ai-career-service python -m scripts.knowledge search --query "What does a software developer do?" --pathway-id puc-science-comp
```

Docker mounts root `knowledge/` read-only at `/knowledge`. README files are excluded;
every source Markdown file must appear exactly once in `manifest.json`. The architecture
PDF and audit documents are not ingested. See [content audit](knowledge-audit.md).

## Ingestion behaviour

- Split on Markdown section headings, with a maximum of 1200 characters per piece.
  Embed the document title and section heading alongside its content. No PDF/OCR needed.
- Store content, heading, ID, editorial metadata, source references and review dates.
- Use local `qwen3-embedding:0.6b` vectors of 1024 dimensions. Track the installed model
  digest and chunking/query recipe. Query and stored vectors must use the same identity.
- Checksum includes text, metadata, model identity and recipe. Unchanged imports skip
  embeddings. Changes atomically replace that document's chunks. Removed documents
  become inactive. Reimporting a removed document reactivates it.
- The caller wraps the complete import in one transaction with an advisory lock.
  Any embedding or database error rolls back the entire run. No partial corpus is published.
- All draft documents can be indexed for development, but default retrieval excludes them.
  `--include-drafts` is a CLI-only diagnostic option and also permits overdue content.
- Small local imports run synchronously. Larger corpora will need background jobs and
  narrower transactions; avoid simultaneous imports on this CPU configuration.

## Authenticated search API

`POST /api/v1/career-intelligence/knowledge/search` through the gateway. Send the normal
student access token in the Authorization header. The gateway allows up to 200 seconds
only for this endpoint so CPU model startup is not cut off by its normal 10-second limit.

```json
{
  "query": "What does an electrician do?",
  "pathway_id": "iti-family-elec",
  "stage": "ITI",
  "region": "Karnataka",
  "limit": 5
}
```

Optional filters: `category`, `stage`, `pathway_id`, `language`, `region`.
Karnataka includes relevant India/general sources; India includes general sources.
Language may be omitted to allow cross-language retrieval. Kannada content and query
quality have not yet been evaluated. A request cannot turn on draft retrieval.

Returns `matches_found` or `no_verified_matches`, with chunk IDs, headings, passages,
metadata, original source links and cosine similarity. Only active, verified, non-overdue
sources matching the embedding model are returned. Similarity is a ranking measure,
not confidence or evidence sufficiency. This initial endpoint has no calibrated relevance
threshold and can return weak neighbours. The future answer layer must check relevance
and source scope and decline unsupported questions rather than treating every hit as an answer.

A local provider/database failure returns 503; it never switches to a paid provider.
This is a protected development API; public rollout still needs rate limiting and
answer-layer evaluation. Queries are not stored as conversation history by this feature.

## Checks

```powershell
docker compose exec -T ai-career-service python -m pytest tests -q
docker compose exec -T ai-career-service python -m scripts.check_knowledge_integration
```

The integration script creates and deletes its own uniquely named test database. It
tests upgrade/downgrade, no-op reimport, replacement, transaction rollback, removal,
review downgrades, stale reviews, model version matching, filters and source references.
It uses synthetic vectors to test database behaviour without model calls. Real local
retrieval checks are separately recorded after ingestion.

## Validation results, 12 September 2026

- 31 documents, 277 stored chunks: 28 original drafts and 3 verified duty summaries.
- Second import: 31 unchanged, zero chunks written, no new embedding requests.
- Real local queries retrieved the expected software, graphic-design and electrician
  duty summaries with pathway filters. A medical-pathway search returned no verified sources.
- 24 AI-service tests and 17 gateway tests passed.
- Disposable-database migration/ingestion integration checks passed.
- Live gateway: unauthenticated requests rejected, authenticated search returned source
  references, and attempts to enable drafts were rejected.
- All pre-existing database table row counts remained unchanged.

These checks establish plumbing and a small retrieval smoke test, not a broad answer-quality
evaluation. No student chat or spoken-answer feature is enabled by this phase.

## Still to implement

Expand verified Karnataka/India knowledge; connect existing scored pathways and student
context; generate grounded answers with validated citations and abstention; add chat
history/UI, voice and evaluation. Do not present this retrieval endpoint as completed RAG chat.
