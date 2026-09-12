import json
from types import SimpleNamespace
from unittest.mock import MagicMock
from uuid import uuid4

import httpx
import pytest

from app.services import career_answers as answers


def evidence():
    return dict(chunk_id="chunk-1", document_id="verified--software-work", heading="Duties",
                content="Developers design software applications. They work with testers.", similarity=.8,
                metadata=dict(status="verified", review_due="2099-01-01", reviewed_on="2026-01-01",
                              title="Software work", scope="General duties only", sources=[{"url": "https://example.org", "publisher": "Test"}]))


class FakeAI:
    def __init__(self, output=None):
        self.output = output or json.dumps({"can_answer": True, "sentence_ids": ["S1"]})
        self.messages = None

    def chat(self, messages, **kwargs):
        self.messages = messages
        return self.output


def test_only_source_text_can_reach_answer(monkeypatch):
    monkeypatch.setattr(answers, "retrieve", lambda *a, **kw: [evidence()])
    ai = FakeAI()
    response = answers.answer_question(None, str(uuid4()), "SECRET", "What do software developers do?", ai=ai)
    assert response["status"] == "answered"
    assert "Developers design software applications. [1]" in response["answer"]
    assert response["sources"][0]["chunk_id"] == "chunk-1"
    assert "SECRET" not in json.dumps(ai.messages)


@pytest.mark.parametrize("output", ["not json", '{"can_answer":true,"sentence_ids":["made-up"]}',
                                  '{"can_answer":true,"sentence_ids":["S1","S1"]}',
                                  '{"can_answer":true,"sentence_ids":["S1"],"answer":"Guaranteed salary"}'])
def test_invalid_model_output_is_not_published(monkeypatch, output):
    monkeypatch.setattr(answers, "retrieve", lambda *a, **kw: [evidence()])
    response = answers.answer_question(None, str(uuid4()), "token", "software work", ai=FakeAI(output))
    assert response["status"] == "unavailable"
    assert response["sources"] == []
    assert "Guaranteed salary" not in response["answer"]


@pytest.mark.parametrize("change", [{"similarity": .1}, {"metadata": {"status": "draft"}},
                                   {"metadata": {"status": "verified", "sources": [{}], "review_due": "2000-01-01"}}])
def test_weak_draft_or_expired_evidence_not_used(monkeypatch, change):
    row = evidence(); row.update(change)
    monkeypatch.setattr(answers, "retrieve", lambda *a, **kw: [row])
    assert answers.answer_question(None, str(uuid4()), "token", "software work", ai=FakeAI())["status"] == "insufficient_evidence"


def test_scope_and_unsupported_facts_do_not_call_model(monkeypatch):
    monkeypatch.setattr(answers, "retrieve", lambda *a, **kw: pytest.fail("Retrieval should not run"))
    assert answers.answer_question(None, str(uuid4()), "token", "Write a cake recipe")["status"] == "out_of_scope"
    assert answers.answer_question(None, str(uuid4()), "token", "What are MBBS admission requirements?")["status"] == "insufficient_evidence"
    assert answers.answer_question(None, str(uuid4()), "token", "What are the current KCET eligibility requirements?")["status"] == "insufficient_evidence"


def test_local_failure_has_no_cloud_fallback(monkeypatch):
    def fail(*a, **kw):
        raise httpx.ConnectError("Offline")
    monkeypatch.setattr(answers, "retrieve", fail)
    assert answers.answer_question(None, str(uuid4()), "token", "software work", ai=FakeAI())["status"] == "unavailable"


def current_context(monkeypatch):
    user_id = str(uuid4()); attempt = uuid4()
    assessment = dict(user_id=user_id, is_current=True, attempt_id=str(attempt), assessment_id="foundation",
                      scoring_version="v1", dimension_scores={"science": 80, "commerce": 50, "invented_ability": 99})
    profile = dict(current_level="Class 10", stream=None, name="PRIVATE NAME", email="private@example.org")
    saved = SimpleNamespace(source_attempt_id=attempt, source_assessment_id="foundation", source_scoring_version="v1",
                            recommendations=[SimpleNamespace(pathway_id="c10-puc", pathway_title="PUC", rank=1, match_score=80, match_label="High")])
    db = MagicMock()
    db.query.return_value.filter.return_value.order_by.return_value.first.return_value = saved
    monkeypatch.setattr(answers, "fetch_student_context", lambda token: (profile, assessment))
    return user_id, assessment, saved, db


def test_personalized_summary_uses_existing_ranks_and_interest_labels(monkeypatch):
    user_id, assessment, saved, db = current_context(monkeypatch)
    response = answers.answer_question(db, user_id, "token", "Explain my results", "explain_recommendations")
    assert response["status"] == "recommendations_explained"
    assert response["recommendations"][0]["match_score"] == 80
    assert response["recommendations"][0]["interest_areas"] == ["science", "commerce"]
    assert "science (80/100)" in response["answer"]
    assert "not measured ability" in response["answer"]
    assert "invented_ability" not in response["answer"]
    assert "PRIVATE NAME" not in json.dumps(response)
    expression = db.query.return_value.filter.call_args.args[0]
    assert str(next(iter(expression.compile().params.values()))) == user_id


@pytest.mark.parametrize("mutation", ["attempt", "stage", "is_current", "version", "mixed_paths"])
def test_stale_results_are_never_explained_as_current(monkeypatch, mutation):
    user_id, assessment, saved, db = current_context(monkeypatch)
    if mutation == "attempt": assessment["attempt_id"] = str(uuid4())
    if mutation == "is_current": assessment["is_current"] = False
    if mutation == "version": assessment["scoring_version"] = "v2"
    if mutation == "stage": saved.recommendations[0].pathway_id = "puc-science-med"
    if mutation == "mixed_paths": saved.recommendations.append(SimpleNamespace(pathway_id="puc-science-med"))
    response = answers.answer_question(db, user_id, "token", "Explain", "explain_recommendations")
    assert response["status"] == "needs_update"
    assert response["recommendations"] == []


def test_missing_context_and_another_students_assessment(monkeypatch):
    monkeypatch.setattr(answers, "fetch_student_context", lambda token: (None, None))
    assert answers.answer_question(None, str(uuid4()), "token", "Explain", "explain_recommendations")["status"] == "needs_update"
    user_id, assessment, saved, db = current_context(monkeypatch)
    assessment["user_id"] = str(uuid4())
    assert answers.answer_question(db, user_id, "token", "Explain", "explain_recommendations")["status"] == "unavailable"
