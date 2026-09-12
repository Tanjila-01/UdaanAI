import json

import pytest

from app.services.knowledge import load_documents, chunk_document, vector_literal


def source(tmp_path):
    meta = dict(id="example", file="example.md", title="Example", category="careers",
                pathway_ids=["c10-puc"], stages=["FOUNDATION"], region="general", language="en",
                status="draft", sources=[], reviewed_on=None, review_due=None, version=1, scope="Test")
    (tmp_path / "example.md").write_text("# Example\n\n## Duties\n" + "ಕನ್ನಡ ಮಾಹಿತಿ " * 200, encoding="utf-8")
    return meta


def write_manifest(root, meta):
    (root / "manifest.json").write_text(json.dumps({"schema_version": 1, "documents": [meta]}))


def test_unicode_chunking_retains_all_text(tmp_path):
    meta = source(tmp_path)
    write_manifest(tmp_path, meta)
    doc = load_documents(tmp_path)[0]
    chunks = chunk_document(doc)
    assert len(chunks) > 1
    assert all(len(c["content"]) <= 1200 and c["heading"] == "Duties" for c in chunks)
    assert " ".join(c["content"] for c in chunks).split() == ("ಕನ್ನಡ ಮಾಹಿತಿ " * 200).split()
    assert chunks[0]["input"].startswith("Example\nDuties\n")


def test_verified_requires_sources_and_dates(tmp_path):
    meta = source(tmp_path)
    meta["status"] = "verified"
    write_manifest(tmp_path, meta)
    with pytest.raises(ValueError, match="sources and review dates"):
        load_documents(tmp_path)


def test_path_escape_rejected(tmp_path):
    root = tmp_path / "knowledge"
    root.mkdir()
    meta = source(tmp_path)
    meta["file"] = "../example.md"
    write_manifest(root, meta)
    with pytest.raises(ValueError, match="source path"):
        load_documents(root)


def test_unmapped_file_rejected(tmp_path):
    meta = source(tmp_path)
    write_manifest(tmp_path, meta)
    (tmp_path / "unlisted.md").write_text("# Unlisted\n")
    with pytest.raises(ValueError, match="Every Markdown"):
        load_documents(tmp_path)


@pytest.mark.parametrize("vector", [[1.0], [0.0]*1024, [float('nan')]*1024, [float('inf')]*1024])
def test_invalid_vectors_rejected(vector):
    with pytest.raises(ValueError):
        vector_literal(vector)
