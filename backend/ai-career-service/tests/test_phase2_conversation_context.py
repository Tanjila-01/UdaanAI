"""Phase 2 Conversation Context + Targeted Follow-up Tests.

Verifies:
1. aspect-question detection (skills, work environment, daily work, programming languages, duration, etc.)
2. named_topic false-positive prevention (aspect phrases not treated as career names)
3. education-context statement recognition without assuming MBBS
4. typed conversation context recovery when follow_up_to is omitted
5. pronoun topic inheritance across turns (Turn 1: "What is BE CSE?" -> Turn 2: "What skills do I need to succeed in it?" -> Turn 3: "What is the day-to-day work environment like?")
6. explicit topic switching (Turn 1: "What is BE CSE?" -> Turn 2: "What is Pharmacy?")
7. targeted answer scope for aspect follow-ups vs broad career questions
8. explicit assessment pathway follow-up ("Why was Pharmacy recommended to me?", "Tell me more about Pharmacy")
9. assessment inquiry for unrecommended pathway ("Is BE CSE suitable for me?")
"""
import uuid
from types import SimpleNamespace
from unittest.mock import MagicMock
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
from app.services import advisor_context as context
from app.services import career_answers as answers
from app.services import web_answers as web


OWNER = str(uuid.uuid4())


class FakeAI:
    def __init__(self, answer=None):
        self._answer = answer or "Targeted answer text from AI."
        self.messages = None

    def chat(self, messages, **kwargs):
        self.messages = messages
        return self._answer

    def embed(self, texts):
        return [[0.1] * 768 for _ in texts]

    def model_name(self):
        return "fake-model"


@pytest.fixture
def mock_db():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    with engine.connect() as conn:
        conn.execute(text("ATTACH DATABASE ':memory:' AS career_ai"))
    AdvisorHistory.__table__.create(engine)
    session = sessionmaker(bind=engine)()
    try:
        yield session
    finally:
        session.close()


def test_is_aspect_question_detection():
    # Aspect follow-up questions
    assert context.is_aspect_question("What skills do I need to succeed in it?") is True
    assert context.is_aspect_question("What programming languages are useful?") is True
    assert context.is_aspect_question("What is the day-to-day work environment like?") is True
    assert context.is_aspect_question("What is the typical work day?") is True
    assert context.is_aspect_question("What are the responsibilities?") is True
    assert context.is_aspect_question("What is the salary?") is True
    assert context.is_aspect_question("How long does it take?") is True
    assert context.is_aspect_question("What subjects should I focus on?") is True
    assert context.is_aspect_question("What kind of jobs can I get?") is True

    # Broad questions (not aspect follow-ups)
    assert context.is_aspect_question("What is BE CSE?") is False
    assert context.is_aspect_question("What is Pharmacy?") is False
    assert context.is_aspect_question("Tell me about software engineering.") is False


def test_named_topic_false_positives_prevented():
    # Day-to-day work environment should NOT be extracted as a career topic
    assert web.named_topic("What is the day-to-day work environment like?") is None
    assert web.named_topic("What is their salary?") is None
    assert web.named_topic("What are the skills required?") is None
    assert web.named_topic("What is the duration of the course?") is None

    # Legitimate careers should still be extracted
    assert web.named_topic("What is BE CSE?") is not None
    assert web.named_topic("What is Pharmacy?") == "Pharmacy"
    assert web.named_topic("What is Data Science?") == "Data Science"
    assert web.named_topic("What does a graphic designer do?") == "graphic designer"


def test_education_context_statement_detection():
    # Statements sharing educational background/stream
    s1 = context.is_education_context_statement("I am studying in 1st PUC.")
    assert s1 is not None

    s2 = context.is_education_context_statement("I already took science PCMB.")
    assert s2 is not None
    assert "PCMB" in s2.get("stream", "")

    # Normal questions are not education-context statements
    assert context.is_education_context_statement("What is BE CSE?") is None
    assert context.is_education_context_statement("How do I become a doctor?") is None

    # Handler provides broad multi-pathway guidance without assuming MBBS
    resp = context.handle_education_context_statement(
        "I already took science PCMB.", s2, context.ConversationState()
    )
    assert resp["status"] == "answered"
    assert "Engineering" in resp["answer"]
    assert "Medical" in resp["answer"]
    assert "Pharmacy" in resp["answer"]
    assert resp["conversation_topic"] == "PUC Science (PCMB)"


def test_load_conversation_state_recovers_latest_history_without_follow_up_to(mock_db):
    user_uuid = uuid.UUID(OWNER)
    row_id = uuid.uuid4()
    history = AdvisorHistory(
        id=row_id,
        user_id=user_uuid,
        question="What is BE CSE?",
        request={"question": "What is BE CSE?", "intent": "explore"},
        response={
            "status": "answered",
            "answer": "BE CSE is a 4-year undergraduate degree in computer science.",
            "conversation_topic": "Computer Science Engineering",
            "conversation_state": {
                "last_topic": "Computer Science Engineering",
                "last_question": "What is BE CSE?",
                "last_answer": "BE CSE is a 4-year undergraduate degree in computer science.",
                "last_intent": "explore",
                "last_status": "answered",
            }
        }
    )
    mock_db.add(history)
    mock_db.commit()

    # Call load_conversation_state with follow_up_to=None
    state = context.load_conversation_state(mock_db, OWNER, follow_up_to=None)
    assert state.last_topic == "Computer Science Engineering"
    assert state.last_question == "What is BE CSE?"
    assert "undergraduate degree" in (state.last_answer or "")


def test_topic_inheritance_and_explicit_switch(mock_db, monkeypatch):
    monkeypatch.setattr(answer_route, "get_current_user_claims", lambda: {"sub": OWNER, "role": "STUDENT"})
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user_claims] = lambda: {"sub": OWNER, "role": "STUDENT"}

    monkeypatch.setattr(answer_route.settings, "WEB_SEARCH_ENABLED", False)
    fake_ai = FakeAI("Computer science engineering overview.")
    monkeypatch.setattr(answers, "get_ai", lambda: fake_ai)

    client = TestClient(app)

    monkeypatch.setattr(answers, "retrieve", lambda *args, **kwargs: [])

    # Turn 1: "What is BE CSE?"
    res1 = client.post(
        "/career-intelligence/answers",
        headers={"Authorization": "Bearer test-token"},
        json={"question": "What is BE CSE?", "intent": "explore", "language": "en"}
    )
    assert res1.status_code == 200
    data1 = res1.json()
    assert "computer science" in data1["conversation_topic"].lower()

    # Turn 2: "What skills do I need to succeed in it?" (pronoun/aspect follow-up)
    res2 = client.post(
        "/career-intelligence/answers",
        headers={"Authorization": "Bearer test-token"},
        json={"question": "What skills do I need to succeed in it?", "intent": "explore", "language": "en"}
    )
    assert res2.status_code == 200
    data2 = res2.json()
    # Should inherit topic from Turn 1
    assert "computer science" in data2["conversation_topic"].lower()

    # Turn 3: "What is the day-to-day work environment like?" (aspect follow-up)
    res3 = client.post(
        "/career-intelligence/answers",
        headers={"Authorization": "Bearer test-token"},
        json={"question": "What is the day-to-day work environment like?", "intent": "explore", "language": "en"}
    )
    assert res3.status_code == 200
    data3 = res3.json()
    assert "computer science" in data3["conversation_topic"].lower()

    # Turn 4: "What is Pharmacy?" (explicit topic switch)
    res4 = client.post(
        "/career-intelligence/answers",
        headers={"Authorization": "Bearer test-token"},
        json={"question": "What is Pharmacy?", "intent": "explore", "language": "en"}
    )
    assert res4.status_code == 200
    data4 = res4.json()
    assert "pharmacy" in data4["conversation_topic"].lower()

    app.dependency_overrides.clear()


def test_targeted_answer_scope_for_aspect_followups(monkeypatch):
    fake_ai = FakeAI("Targeted skills response.")
    monkeypatch.setattr(answers, "retrieve", lambda *args, **kwargs: [])
    db = MagicMock()

    # Targeted aspect question: "What programming languages are useful?"
    res = answers.answer_question(
        db, OWNER, "token", "What programming languages are useful?",
        conversation_topic="Computer Science Engineering", ai=fake_ai
    )
    assert res["status"] == "answered"
    # Verify the prompt passed to AI instructs targeted answer ONLY
    system_msg = next((m["content"] for m in fake_ai.messages if m["role"] == "system"), "")
    assert "TARGETED ANSWER INSTRUCTIONS" in system_msg
    assert "Answer the user's requested aspect ONLY" in system_msg
    assert "DO NOT generate a full 5-section career overview" in system_msg


def test_explicit_assessment_pathway_matching(monkeypatch):
    user_id = OWNER
    profile = {"current_level": "PUC 2", "stream": "Science", "name": "Student A"}
    assessment = {
        "user_id": user_id,
        "is_current": True,
        "attempt_id": str(uuid.uuid4()),
        "assessment_id": "puc-science",
        "scoring_version": "rule-v1",
        "dimension_scores": {"allied_health": 60, "biology": 75, "chemistry": 70},
    }
    monkeypatch.setattr(answers, "fetch_student_context", lambda token: (profile, assessment))

    saved_rec = MagicMock()
    saved_rec.user_id = uuid.UUID(user_id)
    saved_rec.source_attempt_id = uuid.UUID(assessment["attempt_id"])
    saved_rec.source_assessment_id = "puc-science"
    saved_rec.source_scoring_version = "rule-v1"
    saved_rec.recommendations = [
        SimpleNamespace(
            pathway_id="puc-science-pharm",
            pathway_title="Pharmacy Education (B.Pharm / D.Pharm)",
            rank=1,
            match_score=75,
            match_label="High Alignment",
            reasons=["Strong alignment in Chemistry and Biology"],
        ),
        SimpleNamespace(
            pathway_id="puc-science-agri",
            pathway_title="Agriculture & Allied Sciences",
            rank=2,
            match_score=65,
            match_label="Moderate Alignment",
            reasons=["High interest in Biology"],
        ),
    ]

    db = MagicMock()
    db.query.return_value.filter.return_value.order_by.return_value.first.return_value = saved_rec

    fake_ai = FakeAI("Pharmacy explanation.")

    # 1. "Why was Pharmacy recommended to me?" -> matched saved recommendation
    res = answers.answer_assessment_context(
        db, user_id, "token", "Why was Pharmacy recommended to me?", ai=fake_ai
    )
    assert res["status"] == "recommendations_explained"
    assert "Pharmacy" in res["conversation_topic"]
    assert any(r["pathway_id"] == "puc-science-pharm" for r in res["recommendations"])

    # 2. "Is BE CSE suitable for me?" -> unrecommended pathway
    res2 = answers.answer_assessment_context(
        db, user_id, "token", "Is BE CSE suitable for me?", ai=fake_ai
    )
    assert res2["status"] == "recommendations_explained"
    # System prompt must instruct LLM that BE CSE is NOT in top saved recommendations and to not invent scores
    sys_content = next((m["content"] for m in fake_ai.messages if m["role"] == "system"), "")
    assert "NOT among the student's top saved recommendations" in sys_content
    assert "DO NOT invent or calculate a score" in sys_content
