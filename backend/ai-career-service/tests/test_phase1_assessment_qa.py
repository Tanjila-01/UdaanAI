"""Phase 1 Assessment-Aware Q&A Regression Tests.

Verifies:
TEST A: "What is my recommended path to follow?" uses saved assessment recommendations.
TEST B: "What are my top recommendations?" uses saved assessment recommendations.
TEST C: "What did my assessment say?" uses saved assessment context.
TEST D: "What is BE CSE?" remains general pathway answer without forced assessment context.
TEST E: Student with no completed assessment receives clear assessment-required response (no hallucinated recommendations).
TEST F: Assessment exists but saved recommendations are unavailable/missing (no hallucinated recommendations).
Additional: Verifies semantic detection of all Phase 1 assessment-context queries.
"""
from types import SimpleNamespace
from unittest.mock import MagicMock, Mock
from uuid import uuid4
import json
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.api.routes import answers as answer_route
from app.db.session import get_db
from app.core.security import get_current_user_claims
from app.models.advisor_history import AdvisorHistory
from app.services import career_answers as answers
from app.services import advisor_context as context

OWNER = str(uuid4())


class FakeAI:
    def __init__(self, output=None):
        self.output = output or "Based on your assessment, your top recommended path is Agriculture & Allied Sciences with a match score of 60/100."
        self.messages = None

    def chat(self, messages, **kwargs):
        self.messages = messages
        return self.output


def make_assessment_context(monkeypatch, has_assessment=True, has_saved_recs=True, is_current=True):
    user_id = OWNER
    attempt = uuid4()
    if not has_assessment:
        profile = {"current_level": "PUC 2", "stream": "Science", "name": "Student A"}
        monkeypatch.setattr(answers, "fetch_student_context", lambda token: (profile, None))
        db = MagicMock()
        db.query.return_value.filter.return_value.order_by.return_value.first.return_value = None
        return user_id, None, None, db

    assessment = {
        "user_id": user_id,
        "is_current": is_current,
        "attempt_id": str(attempt),
        "assessment_id": "puc-science",
        "scoring_version": "rule-v1",
        "dimension_scores": {
            "allied_health": 60,
            "pure_sciences": 30,
            "medicine": 25,
        },
    }
    profile = {"current_level": "PUC 2", "stream": "Science", "name": "Student A"}

    if not has_saved_recs:
        saved = None
    else:
        saved = SimpleNamespace(
            source_attempt_id=attempt,
            source_assessment_id="puc-science",
            source_scoring_version="rule-v1",
            recommendations=[
                SimpleNamespace(
                    pathway_id="puc-science-agri",
                    pathway_title="Agriculture & Allied Sciences",
                    rank=1,
                    match_score=60,
                    match_label="Good",
                    reasons=["Strong alignment with biological and field science interests."],
                ),
                SimpleNamespace(
                    pathway_id="puc-science-allied",
                    pathway_title="Allied Health Sciences & Nursing",
                    rank=2,
                    match_score=60,
                    match_label="Good",
                    reasons=["Interest in healthcare patient service."],
                ),
                SimpleNamespace(
                    pathway_id="puc-science-pharm",
                    pathway_title="Pharmacy Education (B.Pharm / D.Pharm)",
                    rank=3,
                    match_score=60,
                    match_label="Good",
                    reasons=["Interest in pharmaceutical chemistry."],
                ),
            ],
        )

    db = MagicMock()
    db.query.return_value.filter.return_value.order_by.return_value.first.return_value = saved
    monkeypatch.setattr(answers, "fetch_student_context", lambda token: (profile, assessment))
    return user_id, assessment, saved, db


# -------------------------------------------------------------------------
# Intent Classification Unit Tests
# -------------------------------------------------------------------------

@pytest.mark.parametrize("question", [
    "What is my recommended path?",
    "What is my recommended path to follow?",
    "What are my recommendations?",
    "What were my top recommendations?",
    "What did my assessment say?",
    "Why was this recommended to me?",
    "Which paths were recommended for me?",
    "What did I get in my assessment?",
    "What did my assessment recommend?",
    "What was recommended to me?",
    "my assessment results",
    "what are my recommended pathways?",
])
def test_assessment_context_intent_detected(question):
    assert context.is_assessment_context_question(question) is True


@pytest.mark.parametrize("question", [
    "What is BE CSE?",
    "What do software developers do?",
    "What is graphic design?",
    "How can I become an electrician?",
    "Tell me about data science.",
])
def test_general_questions_not_classified_as_assessment_context(question):
    assert context.is_assessment_context_question(question) is False


# -------------------------------------------------------------------------
# Test A: "What is my recommended path to follow?"
# -------------------------------------------------------------------------

def test_a_recommended_path_to_follow_uses_saved_recommendations(monkeypatch):
    user_id, assessment, saved, db = make_assessment_context(monkeypatch)
    ai = FakeAI("Your top recommended path is Agriculture & Allied Sciences (match score 60/100).")

    response = answers.answer_assessment_context(
        db, user_id, "test_token", "What is my recommended path to follow?", ai=ai
    )

    assert response["status"] == "recommendations_explained"
    assert response["context_status"] == "current"
    assert len(response["recommendations"]) == 3
    assert response["recommendations"][0]["pathway_id"] == "puc-science-agri"
    assert response["recommendations"][0]["title"] == "Agriculture & Allied Sciences"
    assert response["recommendations"][0]["match_score"] == 60
    assert "Agriculture & Allied Sciences" in response["answer"]
    # Verify AI messages received authoritative student assessment context
    system_msg = ai.messages[0]["content"]
    user_msg = ai.messages[1]["content"]
    assert "AUTHORITATIVE DATA" in system_msg or "STUDENT ASSESSMENT CONTEXT" in user_msg
    assert "Agriculture & Allied Sciences" in user_msg
    assert "Match Score: 60/100" in user_msg


# -------------------------------------------------------------------------
# Test B: "What are my top recommendations?"
# -------------------------------------------------------------------------

def test_b_top_recommendations_uses_saved_recommendations(monkeypatch):
    user_id, assessment, saved, db = make_assessment_context(monkeypatch)
    ai = FakeAI()

    response = answers.answer_assessment_context(
        db, user_id, "test_token", "What are my top recommendations?", ai=ai
    )

    assert response["status"] == "recommendations_explained"
    assert len(response["recommendations"]) == 3
    assert [r["title"] for r in response["recommendations"]] == [
        "Agriculture & Allied Sciences",
        "Allied Health Sciences & Nursing",
        "Pharmacy Education (B.Pharm / D.Pharm)",
    ]


# -------------------------------------------------------------------------
# Test C: "What did my assessment say?"
# -------------------------------------------------------------------------

def test_c_what_did_my_assessment_say(monkeypatch):
    user_id, assessment, saved, db = make_assessment_context(monkeypatch)
    ai = FakeAI()

    response = answers.answer_assessment_context(
        db, user_id, "test_token", "What did my assessment say?", ai=ai
    )

    assert response["status"] == "recommendations_explained"
    # User message sent to LLM contains dimension scores and stage
    user_msg = ai.messages[1]["content"]
    assert "Stage: PUC Science" in user_msg
    assert "allied_health: 60" in user_msg
    assert "rule-v1" in user_msg


# -------------------------------------------------------------------------
# Test D: "What is BE CSE?" (General Pathway Question, not personal)
# -------------------------------------------------------------------------

def test_d_general_pathway_question_not_forced_into_assessment(monkeypatch):
    # Mock retrieve to simulate verified career knowledge
    row = {
        "chunk_id": "chunk-be-cse",
        "document_id": "verified--be-cse",
        "heading": "Overview",
        "content": "BE CSE is Bachelor of Engineering in Computer Science and Engineering. It covers programming, data structures, and algorithms.",
        "similarity": 0.85,
        "metadata": {
            "status": "verified",
            "review_due": "2099-01-01",
            "reviewed_on": "2026-01-01",
            "title": "BE Computer Science",
            "scope": "Engineering degree overview",
            "sources": [{"url": "https://example.org/cse", "publisher": "Test"}],
        },
    }
    monkeypatch.setattr(answers, "retrieve", lambda *a, **kw: [row])
    ai = FakeAI(json.dumps({"can_answer": True, "sentence_ids": ["S1"]}))

    # Call general answer_question with intent="explore"
    response = answers.answer_question(
        None, OWNER, "token", "What is BE CSE?", intent="explore", ai=ai
    )

    assert response["status"] == "answered"
    assert "BE CSE" in response["answer"] or "Computer Science" in response["answer"]
    # Ensure it did NOT retrieve or populate assessment recommendations
    assert response["recommendations"] == []
    assert response["context_status"] == "not_requested"


# -------------------------------------------------------------------------
# Test E: Student has no completed assessment
# -------------------------------------------------------------------------

def test_e_no_completed_assessment_returns_clear_message_no_hallucinations(monkeypatch):
    user_id, assessment, saved, db = make_assessment_context(monkeypatch, has_assessment=False)
    ai = FakeAI()

    response = answers.answer_assessment_context(
        db, user_id, "token", "What is my recommended path to follow?", ai=ai
    )

    assert response["status"] == "needs_update"
    assert response["context_status"] == "missing"
    assert response["recommendations"] == []
    assert "assessment" in response["answer"].lower()
    # Ensure AI chat was NOT invoked to hallucinate recommendations
    assert ai.messages is None


# -------------------------------------------------------------------------
# Test F: Assessment exists but recommendation data is unavailable
# -------------------------------------------------------------------------

def test_f_assessment_exists_but_saved_recs_missing(monkeypatch):
    user_id, assessment, saved, db = make_assessment_context(monkeypatch, has_assessment=True, has_saved_recs=False)
    ai = FakeAI()

    response = answers.answer_assessment_context(
        db, user_id, "token", "What are my recommendations?", ai=ai
    )

    assert response["status"] == "needs_update"
    assert response["context_status"] == "missing"
    assert response["recommendations"] == []
    assert "not currently available" in response["answer"] or "pathway suggestions first" in response["answer"]
    assert ai.messages is None


# -------------------------------------------------------------------------
# End-to-End API Route Tests (FastAPI TestClient with intent: "explore")
# -------------------------------------------------------------------------

@pytest.fixture
def api_test_db(monkeypatch):
    engine = create_engine('sqlite://', connect_args={'check_same_thread': False}, poolclass=StaticPool)
    with engine.connect() as conn:
        conn.execute(text("ATTACH DATABASE ':memory:' AS career_ai"))
    AdvisorHistory.__table__.create(engine)
    db = sessionmaker(bind=engine)()
    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_user_claims] = lambda: {'sub': OWNER}

    # Student Profile Mock
    class MockProfileClient:
        def __init__(self, *args, **kwargs): pass
        def __enter__(self): return self
        def __exit__(self, *args): pass
        def get(self, url, headers=None):
            resp = Mock()
            resp.status_code = 200
            resp.json.return_value = {'current_level': 'PUC 2', 'stream': 'Science', 'name': 'Student A'}
            return resp

    monkeypatch.setattr(answer_route.httpx, 'Client', MockProfileClient)

    yield db
    app.dependency_overrides.clear()
    db.close()
    engine.dispose()


def test_api_route_intercepts_explore_intent_for_recommended_path(api_test_db, monkeypatch):
    """Verifies frontend sending intent='explore' triggers Route G2 assessment context."""
    user_id, assessment, saved, _ = make_assessment_context(monkeypatch)

    # Monkeypatch answer_assessment_context in answer_route
    expected_result = {
        "status": "recommendations_explained",
        "answer": "Based on your assessment, your recommended path is Agriculture & Allied Sciences (match score 60/100).",
        "sources": [],
        "recommendations": [
            {
                "pathway_id": "puc-science-agri",
                "title": "Agriculture & Allied Sciences",
                "rank": 1,
                "match_score": 60,
                "match_label": "Good",
                "interest_areas": ["allied_health"],
                "explanation": "High biological science interest",
                "reasons": ["Strong biological interest"],
            }
        ],
        "context_status": "current",
        "answer_origin": "local",
        "conversation_topic": "Assessment Recommendations",
    }
    monkeypatch.setattr(answer_route, "answer_assessment_context", lambda *a, **kw: expected_result)

    with TestClient(app) as client:
        res = client.post(
            "/career-intelligence/answers",
            headers={"Authorization": "Bearer test"},
            json={
                "question": "What is my recommended path to follow?",
                "intent": "explore",  # Frontend default
            },
        )
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "recommendations_explained"
        assert "Agriculture & Allied Sciences" in data["answer"]
        assert len(data["recommendations"]) == 1
        assert data["recommendations"][0]["pathway_id"] == "puc-science-agri"
        assert data["context_status"] == "current"
