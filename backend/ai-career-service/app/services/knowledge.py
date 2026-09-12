"""Manifest-controlled Markdown ingestion and exact, metadata-filtered retrieval."""
import hashlib
import json
import math
import re
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

from sqlalchemy import text

from app.core.config import settings
from app.core.stage_config import STAGE_CONFIG
from app.services.local_ai import LocalAI

RECIPE = "headings-char1200-v1-qwen-query-instruction"
DIMENSIONS = 1024
CATEGORIES = {"careers", "education", "streams", "iti", "puc", "karnataka"}
PATHWAYS = {p for c in STAGE_CONFIG.values() for p in c["candidate_ids"]}


def sha(value):
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def load_documents(root):
    root = Path(root).resolve(strict=True)
    manifest = json.loads((root / "manifest.json").read_text(encoding="utf-8"))
    if manifest.get("schema_version") != 1 or not manifest.get("documents"):
        raise ValueError("A non-empty version 1 manifest is required")
    documents, ids, files = [], set(), set()
    required = {"id", "file", "title", "category", "pathway_ids", "stages", "region", "language",
                "status", "sources", "reviewed_on", "review_due", "version", "scope"}
    for meta in manifest["documents"]:
        if set(meta) != required:
            raise ValueError("Manifest fields missing or unexpected")
        if not re.fullmatch(r"[a-z0-9-]+", meta["id"]) or meta["id"] in ids:
            raise ValueError("Invalid or duplicate document ID")
        relative = Path(meta["file"])
        path = (root / relative).resolve(strict=True)
        if (relative.is_absolute() or ".." in relative.parts or not path.is_relative_to(root)
                or path.suffix != ".md" or path.name.lower() == "readme.md" or path in files):
            raise ValueError("Invalid or duplicate source path")
        if meta["category"] not in CATEGORIES or meta["status"] not in {"draft", "verified"}:
            raise ValueError("Invalid category or review status")
        if (not isinstance(meta["pathway_ids"], list) or not set(meta["pathway_ids"]) <= PATHWAYS
                or not isinstance(meta["stages"], list) or not set(meta["stages"]) <= set(STAGE_CONFIG)):
            raise ValueError("Unknown pathway or stage")
        if meta["language"] not in {"en", "kn"} or meta["region"] not in {"Karnataka", "India", "general"}:
            raise ValueError("Invalid language or region")
        if not isinstance(meta["version"], int) or meta["version"] < 1 or not meta["scope"]:
            raise ValueError("A positive version and source scope are required")
        if meta["status"] == "verified":
            if not meta["sources"] or not meta["reviewed_on"] or not meta["review_due"]:
                raise ValueError("Verified documents require sources and review dates")
            reviewed, due = date.fromisoformat(meta["reviewed_on"]), date.fromisoformat(meta["review_due"])
            if reviewed > date.today() or due <= reviewed:
                raise ValueError("Invalid review date range")
        for source in meta["sources"]:
            u = urlparse(source["url"])
            if u.scheme != "https" or not u.netloc or not source.get("publisher") or not source.get("jurisdiction"):
                raise ValueError("Source requires an HTTPS URL, publisher and jurisdiction")
        body = path.read_text(encoding="utf-8-sig").replace("\r\n", "\n")
        if not body.startswith("# " + meta["title"] + "\n"):
            raise ValueError("Document title must match the manifest")
        ids.add(meta["id"])
        files.add(path)
        documents.append({"metadata": meta, "body": body})
    actual = {p.resolve() for p in root.rglob("*.md") if p.name.lower() != "readme.md"}
    if actual != files:
        raise ValueError("Every Markdown source must be listed exactly once in the manifest")
    return documents


def chunk_document(document):
    meta, body = document["metadata"], document["body"]
    parts = re.split(r"(?m)^## ([^\n]+)\n", body)
    sections = []
    intro = parts[0].split("\n", 1)[1].strip()
    if intro:
        sections.append(("Overview", intro))
    sections.extend((parts[i].strip(), parts[i + 1].strip()) for i in range(1, len(parts), 2))
    chunks = []
    for heading, content in sections:
        if not content:
            continue
        # Character bound is conservative for both English and Kannada; do not split UTF-8 bytes.
        while content:
            end = len(content) if len(content) <= 1200 else content.rfind(" ", 0, 1200)
            if end <= 0:
                end = min(len(content), 1200)
            piece, content = content[:end].strip(), content[end:].strip()
            chunks.append({"heading": heading, "content": piece,
                           "input": f"{meta['title']}\n{heading}\n{piece}"})
    if not chunks:
        raise ValueError("Document has no content")
    return chunks


def model_digest(ai):
    # Querying tags is local too. Never mix vectors from different model versions.
    import httpx
    with httpx.Client(timeout=10, trust_env=False) as client:
        response = client.get(ai.base_url + "/api/tags")
        response.raise_for_status()
        for model in response.json()["models"]:
            if model["name"] == settings.OLLAMA_EMBEDDING_MODEL:
                return model["digest"]
    raise ValueError("Configured local embedding model is not installed")


def vector_literal(vector):
    if len(vector) != DIMENSIONS or not all(math.isfinite(x) for x in vector) or not any(vector):
        raise ValueError("Expected a finite, nonzero 1024-dimensional vector")
    return json.dumps(vector)


def ingest(connection, documents, ai, digest):
    """Caller owns the transaction; any failure rolls back the complete ingestion."""
    connection.execute(text("SELECT pg_advisory_xact_lock(78642109)"))
    old = dict(connection.execute(text("SELECT id, checksum FROM career_ai.knowledge_documents")).all())
    changed = skipped = count = 0
    for document in documents:
        meta = document["metadata"]
        checksum = sha(json.dumps(meta, sort_keys=True) + document["body"] + RECIPE
                       + settings.OLLAMA_EMBEDDING_MODEL + digest)
        if old.get(meta["id"]) == checksum:
            connection.execute(text("UPDATE career_ai.knowledge_documents SET active=true WHERE id=:id"), {"id": meta["id"]})
            skipped += 1
            continue
        chunks = chunk_document(document)
        vectors = []
        for start in range(0, len(chunks), 8):
            vectors.extend(ai.embed([c["input"] for c in chunks[start:start + 8]]))
        if len(vectors) != len(chunks):
            raise ValueError("Embedding count mismatch")
        literals = [vector_literal(v) for v in vectors]
        connection.execute(text("""
            INSERT INTO career_ai.knowledge_documents(id,checksum,metadata) VALUES (:id,:checksum,CAST(:meta AS jsonb))
            ON CONFLICT(id) DO UPDATE SET checksum=excluded.checksum, metadata=excluded.metadata,
                active=true, updated_at=now()
        """), {"id": meta["id"], "checksum": checksum, "meta": json.dumps(meta)})
        connection.execute(text("DELETE FROM career_ai.knowledge_chunks WHERE document_id=:id"), {"id": meta["id"]})
        for ordinal, (chunk, vector) in enumerate(zip(chunks, literals)):
            connection.execute(text("""
                INSERT INTO career_ai.knowledge_chunks
                (id,document_id,ordinal,heading,content,embedding,embedding_model,model_digest,recipe)
                VALUES (:id,:doc,:ordinal,:heading,:content,CAST(:vector AS public.vector),:model,:digest,:recipe)
            """), {"id": sha(meta["id"] + checksum + str(ordinal)), "doc": meta["id"],
                   "ordinal": ordinal, "heading": chunk["heading"], "content": chunk["content"],
                   "vector": vector, "model": settings.OLLAMA_EMBEDDING_MODEL, "digest": digest, "recipe": RECIPE})
        changed += 1
        count += len(chunks)
    # Removed sources become inactive, preserving traceability without remaining searchable.
    incoming = {d["metadata"]["id"] for d in documents}
    removed = set(old) - incoming
    for doc_id in removed:
        connection.execute(text("UPDATE career_ai.knowledge_documents SET active=false WHERE id=:id"), {"id": doc_id})
    return {"changed": changed, "unchanged": skipped, "deactivated": len(removed), "chunks_written": count}


def retrieve(connection, query, *, ai=None, digest=None, category=None, stage=None,
             pathway_id=None, language=None, region="Karnataka", limit=5, include_drafts=False):
    query = query.strip()
    if not query or len(query) > 2000 or not 1 <= limit <= 10:
        raise ValueError("Query must contain 1-2000 characters; limit must be 1-10")
    for value, allowed in [(category, CATEGORIES), (stage, set(STAGE_CONFIG)),
                           (pathway_id, PATHWAYS), (language, {"en", "kn"}),
                           (region, {"Karnataka", "India", "general"})]:
        if value is not None and value not in allowed:
            raise ValueError("Unknown retrieval filter")
    ai = ai or LocalAI()
    digest = digest or model_digest(ai)
    vector = vector_literal(ai.embed(["Instruct: Retrieve career and education information relevant to the question.\nQuery: " + query])[0])
    conditions = ["d.active", "c.embedding_model=:model", "c.model_digest=:digest", "c.recipe=:recipe"]
    params = {"model": settings.OLLAMA_EMBEDDING_MODEL, "digest": digest, "recipe": RECIPE,
              "vector": vector, "limit": limit, "today": date.today().isoformat()}
    if not include_drafts:
        conditions += ["d.metadata->>'status'='verified'", "d.metadata->>'review_due' >= :today"]
    for key, value in [("category", category), ("language", language)]:
        if value is not None:
            conditions.append(f"d.metadata->>'{key}'=:{key}")
            params[key] = value
    for key, value in [("stages", stage), ("pathway_ids", pathway_id)]:
        if value is not None:
            conditions.append(f"d.metadata->'{key}' @> CAST(:{key} AS jsonb)")
            params[key] = json.dumps([value])
    regions = {"Karnataka": ["Karnataka", "India", "general"], "India": ["India", "general"], "general": ["general"]}[region]
    conditions.append("CAST(:regions AS jsonb) ? (d.metadata->>'region')")
    params["regions"] = json.dumps(regions)
    rows = connection.execute(text("""
        SELECT c.id AS chunk_id, d.id AS document_id, c.heading, c.content, d.metadata,
            1 - (c.embedding <=> CAST(:vector AS public.vector)) AS similarity
        FROM career_ai.knowledge_chunks c JOIN career_ai.knowledge_documents d ON d.id=c.document_id
        WHERE """ + " AND ".join(conditions) + """
        ORDER BY c.embedding <=> CAST(:vector AS public.vector), c.id LIMIT :limit
    """), params).mappings().all()
    return [dict(r) for r in rows]
