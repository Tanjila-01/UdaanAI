"""CLI: python -m scripts.knowledge audit|ingest|search."""
import argparse
import json
import os
from collections import Counter
from pathlib import Path

from app.db.session import engine
from app.services.knowledge import load_documents, chunk_document, ingest, retrieve, model_digest
from app.services.local_ai import LocalAI


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["audit", "ingest", "search"])
    parser.add_argument("--root", default=os.getenv("KNOWLEDGE_ROOT") or str(Path(__file__).resolve().parents[3] / "knowledge"))
    parser.add_argument("--query")
    parser.add_argument("--category")
    parser.add_argument("--stage")
    parser.add_argument("--pathway-id")
    parser.add_argument("--language")
    parser.add_argument("--include-drafts", action="store_true", help="Development search only; never enable in student APIs")
    args = parser.parse_args()
    if args.command == "search":
        if not args.query:
            parser.error("--query is required for search")
        with engine.connect() as connection:
            result = retrieve(connection, args.query, category=args.category, stage=args.stage,
                              pathway_id=args.pathway_id, language=args.language, include_drafts=args.include_drafts)
    else:
        docs = load_documents(args.root)
        result = {"documents": len(docs), "status": dict(Counter(d['metadata']['status'] for d in docs)),
                  "chunks": sum(len(chunk_document(d)) for d in docs),
                  "unmapped": [d['metadata']['file'] for d in docs if not d['metadata']['pathway_ids']]}
        if args.command == "ingest":
            ai = LocalAI()
            digest = model_digest(ai)
            with engine.begin() as connection:
                result.update(ingest(connection, docs, ai, digest))
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
