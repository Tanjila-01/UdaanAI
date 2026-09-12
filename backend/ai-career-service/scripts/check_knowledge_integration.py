"""Exercise migrations and ingestion in a disposable database, never the student database."""
import copy
import os
import subprocess
import uuid

from sqlalchemy import create_engine, text

from app.core.config import settings
from app.db.session import engine
from app.services.knowledge import ingest, retrieve


class FakeAI:
    calls = 0

    def embed(self, inputs):
        self.calls += 1
        return [[1.0] + [0.0] * 1023 for _ in inputs]


def document(doc_id, status="verified", **changes):
    meta = dict(id=doc_id, file=doc_id + ".md", title=doc_id, category="careers", pathway_ids=["c10-puc"],
                stages=["FOUNDATION"], region="general", language="en", status=status,
                sources=[dict(url="https://example.org/source", publisher="Test", jurisdiction="Test")],
                reviewed_on="2026-01-01", review_due="2099-01-01", version=1, scope="Test only")
    meta.update(changes)
    return {"metadata": meta, "body": f"# {doc_id}\n\n## Duties\nTest career duties."}


def main():
    name = "udaan_rag_test_" + uuid.uuid4().hex[:12]
    admin = create_engine(engine.url, isolation_level="AUTOCOMMIT")
    test_engine = None
    with admin.connect() as c:
        c.execute(text('CREATE DATABASE "' + name + '"'))
    try:
        url = engine.url.set(database=name)
        env = dict(os.environ, DATABASE_URL=url.render_as_string(hide_password=False))
        subprocess.run(["alembic", "upgrade", "head"], env=env, check=True)
        test_engine = create_engine(url)
        ai = FakeAI()
        docs = [document("verified"), document("draft", "draft"), document("expired", review_due="2020-01-01")]
        with test_engine.begin() as c:
            assert ingest(c, docs, ai, "test-digest")["changed"] == 3
        calls = ai.calls
        with test_engine.begin() as c:
            assert ingest(c, docs, ai, "test-digest")["unchanged"] == 3
        assert ai.calls == calls, "Unchanged import must not request embeddings"
        with test_engine.connect() as c:
            assert c.execute(text("SELECT count(*) FROM career_ai.knowledge_chunks")).scalar() == 3
            results = retrieve(c, "career", ai=ai, digest="test-digest")
            assert {r["document_id"] for r in results} == {"verified"}
            assert results[0]["metadata"]["sources"][0]["publisher"] == "Test"
            assert retrieve(c, "career", ai=ai, digest="other-digest") == []
            assert retrieve(c, "career", ai=ai, digest="test-digest", pathway_id="c10-iti") == []
            assert retrieve(c, "career", ai=ai, digest="test-digest", stage="ITI") == []
            assert retrieve(c, "career", ai=ai, digest="test-digest", language="kn") == []
            assert len(retrieve(c, "career", ai=ai, digest="test-digest", include_drafts=True)) == 3
        changed = copy.deepcopy(docs)
        changed[0]["body"] += "\n\n## Added\nNew section."
        with test_engine.begin() as c:
            assert ingest(c, changed, ai, "test-digest")["changed"] == 1
            assert c.execute(text("SELECT count(*) FROM career_ai.knowledge_chunks WHERE document_id='verified'")).scalar() == 2
        class FailingAI:
            calls = 0
            def embed(self, inputs):
                self.calls += 1
                if self.calls > 1:
                    raise RuntimeError("Simulated provider failure")
                return [[1.0] + [0.0] * 1023 for _ in inputs]
        try:
            with test_engine.begin() as c:
                ingest(c, changed, FailingAI(), "new-digest")
        except RuntimeError:
            pass
        else:
            raise AssertionError("Expected simulated provider failure")
        with test_engine.connect() as c:
            assert c.execute(text("SELECT count(*) FROM career_ai.knowledge_chunks WHERE model_digest='new-digest'")).scalar() == 0
        with test_engine.begin() as c:
            assert ingest(c, docs[1:], ai, "test-digest")["deactivated"] == 1
        with test_engine.connect() as c:
            assert retrieve(c, "career", ai=ai, digest="test-digest") == []
        # Review status changes must take effect on the next complete import.
        downgraded = copy.deepcopy(docs)
        downgraded[0]["metadata"]["status"] = "draft"
        with test_engine.begin() as c:
            ingest(c, downgraded, ai, "test-digest")
        with test_engine.connect() as c:
            assert retrieve(c, "career", ai=ai, digest="test-digest") == []
        subprocess.run(["alembic", "downgrade", "001"], env=env, check=True)
        subprocess.run(["alembic", "upgrade", "head"], env=env, check=True)
        print("PASS: migrations, repeat import, replacement, rollback, removal, review downgrade, filters and source references")
    finally:
        if test_engine:
            test_engine.dispose()
        with admin.connect() as c:
            c.execute(text('DROP DATABASE "' + name + '" WITH (FORCE)'))
        admin.dispose()


if __name__ == "__main__":
    main()
