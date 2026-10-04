"""Tests for Career Advisor Conversational Context & Grounding.

Covers Phase 7 requirements:
- Test 1: Personalized recommendation ("What is my recommended path?")
- Test 2: Saved pathways ("What are my pathways?")
- Test 3: Generic exploration ("What careers are available after PUC Science?")
- Test 4: Why recommended ("Why was Allied Health Sciences & Nursing recommended for me?")
- Test 5: Follow-up reference ("What are my pathways?" -> "Tell me more about the first one.")
- Test 6: Alternative path ("Can I choose another path?")
- Test 7: No assessment ("What is my recommended path?" without assessment)
- Test 8: Ambiguous follow-up without topic ("What is the day-to-day work environment like?")
"""
import uuid
from types import SimpleNamespace
from unittest.mock import MagicMock
import pytest

from app.services import career_answers as answers
from app.services import advisor_context as context


class FakeAI:
    def __init__(self, answer=None):
        self._answer = answer or "Based on your assessment, your top recommended path is Allied Health Sciences & Nursing."
        self.messages = None

    def chat(self, messages, **kwargs):
        self.messages = messages
        return self._answer

    def embed(self, texts):
        return [[0.1] * 384 for _ in texts]

    def model_name(self):
        return "fake-model"


def make_puc_science_student_context(monkeypatch, has_assessment=True):
    user_id = str(uuid.uuid4())
    attempt = uuid.uuid4()
    profile = {"current_level": "PUC 2", "stream": "Science", "name": "Student T"}
    monkeypatch.setattr(answers, "retrieve", lambda *args, **kwargs: [])

    if not has_assessment:
        monkeypatch.setattr(answers, "fetch_student_context", lambda token: (profile, None))
        db = MagicMock()
        db.query.return_value.filter.return_value.order_by.return_value.first.return_value = None
        return user_id, None, None, db

    assessment = {
        "user_id": user_id,
        "is_current": True,
        "attempt_id": str(attempt),
        "assessment_id": "puc-science",
        "scoring_version": "rule-v1",
        "primary_stream_recommendation": "Allied Health Sciences & Pharmacy",
        "secondary_stream_recommendation": "Pure & Applied Sciences (B.Sc)",
        "top_career_match": "Medical Laboratory Technologist / Pharmacist",
        "dimension_scores": {
            "engineering": 13,
            "computing": 8,
            "medicine": 25,
            "pure_sciences": 30,
            "allied_health": 60,
        },
    }

    # Stored recommendations matching corrected pipeline
    saved = SimpleNamespace(
        id=uuid.uuid4(),
        user_id=uuid.UUID(user_id),
        source_attempt_id=attempt,
        source_assessment_id="puc-science",
        source_scoring_version="rule-v1",
        recommendations=[
            SimpleNamespace(
                pathway_id="puc-science-allied",
                pathway_title="Allied Health Sciences & Nursing",
                rank=1,
                match_score=60,
                match_label="Good",
                reasons=["Fits your interest in pharmaceutical formulations, clinical diagnostics, and healthcare support."],
            ),
            SimpleNamespace(
                pathway_id="puc-science-pharm",
                pathway_title="Pharmacy Education (B.Pharm / D.Pharm)",
                rank=2,
                match_score=60,
                match_label="Good",
                reasons=["Fits your interest in pharmaceutical formulations, clinical diagnostics, and healthcare support."],
            ),
            SimpleNamespace(
                pathway_id="puc-science-agri",
                pathway_title="Agriculture & Allied Sciences",
                rank=3,
                match_score=30,
                match_label="Explore",
                reasons=["Aligned with your passion for fundamental research, mathematical proofs, laboratory inquiry, or agricultural sciences."],
            ),
        ],
    )

    db = MagicMock()
    db.query.return_value.filter.return_value.order_by.return_value.first.return_value = saved
    monkeypatch.setattr(answers, "fetch_student_context", lambda token: (profile, assessment))
    return user_id, assessment, saved, db


# -------------------------------------------------------------------------
# Test 1: Personalized recommendation
# -------------------------------------------------------------------------
def test_1_personalized_recommendation_top_path(monkeypatch):
    """'What is my recommended path?' identifies Allied Health Sciences & Nursing with score 60."""
    user_id, assessment, saved, db = make_puc_science_student_context(monkeypatch)
    ai = FakeAI("Your top saved recommendation is Allied Health Sciences & Nursing with a match score of 60/100.")

    response = answers.answer_question(
        db, user_id, "token", "What is my recommended path?", intent="explore", ai=ai
    )

    assert response["status"] == "recommendations_explained"
    assert response["context_status"] == "current"
    assert len(response["recommendations"]) == 3
    # Top recommendation is Allied Health Sciences & Nursing
    top_rec = response["recommendations"][0]
    assert top_rec["pathway_id"] == "puc-science-allied"
    assert top_rec["title"] == "Allied Health Sciences & Nursing"
    assert top_rec["match_score"] == 60
    assert "Allied Health Sciences & Nursing" in response["answer"]
    # AI system prompt grounding verification
    assert ai.messages is not None
    system_content = ai.messages[0]["content"]
    user_content = ai.messages[1]["content"]
    assert "AUTHORITATIVE DATA" in system_content or "STUDENT ASSESSMENT CONTEXT" in user_content
    assert "Allied Health Sciences & Nursing" in user_content


# -------------------------------------------------------------------------
# Test 2: Saved pathways
# -------------------------------------------------------------------------
def test_2_saved_pathways_all_three_returned(monkeypatch):
    """'What are my pathways?' returns all 3 saved pathways with scores 60, 60, 30."""
    user_id, assessment, saved, db = make_puc_science_student_context(monkeypatch)
    ai = FakeAI("Here are your saved pathways: Allied Health, Pharmacy, and Agriculture.")

    response = answers.answer_question(
        db, user_id, "token", "What are my pathways?", intent="explore", ai=ai
    )

    assert response["status"] == "recommendations_explained"
    assert len(response["recommendations"]) == 3
    recs = {r["pathway_id"]: r for r in response["recommendations"]}
    assert recs["puc-science-allied"]["match_score"] == 60
    assert recs["puc-science-pharm"]["match_score"] == 60
    assert recs["puc-science-agri"]["match_score"] == 30
    assert recs["puc-science-agri"]["match_score"] != 60


# -------------------------------------------------------------------------
# Test 3: Generic exploration
# -------------------------------------------------------------------------
def test_3_generic_exploration_not_claimed_as_saved(monkeypatch):
    """'What careers are available after PUC Science?' does not enter assessment context."""
    user_id, assessment, saved, db = make_puc_science_student_context(monkeypatch)
    # Verify intent detector classifies it as False
    assert context.is_assessment_context_question("What careers are available after PUC Science?") is False

    mock_retrieve = MagicMock(return_value=[{
        "chunk_id": "chunk-puc-sci",
        "document_id": "verified--puc-science",
        "heading": "Options",
        "content": "PUC Science students can pursue Engineering, Medicine, Pure Sciences, and Pharmacy.",
        "similarity": 0.85,
        "metadata": {
            "status": "verified",
            "review_due": "2099-01-01",
            "reviewed_on": "2026-09-01",
            "title": "PUC Science",
            "sources": [{"url": "https://example.org"}]
        }
    }])
    monkeypatch.setattr(answers, "retrieve", mock_retrieve)

    response = answers.answer_question(
        db, user_id, "token", "What careers are available after PUC Science?", intent="explore", ai=FakeAI()
    )

    # Status should be answered, NOT recommendations_explained
    assert response["status"] == "answered"
    assert response["context_status"] == "not_requested"
    assert response["recommendations"] == []


# -------------------------------------------------------------------------
# Test 4: Why recommended
# -------------------------------------------------------------------------
def test_4_why_recommended_uses_saved_assessment_context(monkeypatch):
    """'Why was Allied Health Sciences & Nursing recommended for me?' uses saved context."""
    user_id, assessment, saved, db = make_puc_science_student_context(monkeypatch)
    ai = FakeAI("Allied Health Sciences & Nursing was recommended because of your high allied_health score (60/100).")

    response = answers.answer_question(
        db, user_id, "token", "Why was Allied Health Sciences & Nursing recommended for me?", intent="explore", ai=ai
    )

    assert response["status"] == "recommendations_explained"
    assert response["context_status"] == "current"
    # Grounding messages sent to LLM contains official scores
    user_content = ai.messages[1]["content"]
    assert "Allied Health Sciences & Nursing" in user_content
    assert "Match Score: 60/100" in user_content
    assert "allied_health: 60" in user_content
    # No aptitude claim
    for r in response["recommendations"]:
        assert "aptitude" not in r.get("explanation", "").lower()
        for reason in r.get("reasons", []):
            assert "aptitude" not in reason.lower()


# -------------------------------------------------------------------------
# Test 5: Follow-up reference
# -------------------------------------------------------------------------
def test_5_follow_up_reference_the_first_one(monkeypatch):
    """'What are my pathways?' followed by 'Tell me more about the first one.' resolves to Allied Health."""
    user_id, assessment, saved, db = make_puc_science_student_context(monkeypatch)
    ai = FakeAI("Allied Health Sciences & Nursing encompasses medical laboratory technology and nursing programs.")

    history = SimpleNamespace(
        last_question="What are my pathways?",
        last_answer="Your top pathways are 1. Allied Health Sciences & Nursing, 2. Pharmacy Education, 3. Agriculture.",
        last_status="recommendations_explained",
        last_recommended_pathway="Allied Health Sciences & Nursing"
    )

    response = answers.answer_question(
        db, user_id, "token", "Tell me more about the first one.", intent="explore", ai=ai, history=history
    )

    assert response["status"] == "recommendations_explained"
    user_content = ai.messages[1]["content"]
    system_content = ai.messages[0]["content"]
    assert "Allied Health Sciences & Nursing" in system_content or "Allied Health Sciences & Nursing" in user_content
    assert "first one" not in system_content.lower()


# -------------------------------------------------------------------------
# Test 6: Alternative path
# -------------------------------------------------------------------------
def test_6_alternative_path_distinguished_from_saved(monkeypatch):
    """'Can I choose another path?' affirms flexibility while preserving saved rankings."""
    user_id, assessment, saved, db = make_puc_science_student_context(monkeypatch)
    ai = FakeAI("Yes, you can choose another path. Your assessment recommendations are exploratory guides.")

    response = answers.answer_question(
        db, user_id, "token", "Can I choose another path?", intent="explore", ai=ai
    )

    assert response["status"] == "recommendations_explained"
    assert len(response["recommendations"]) == 3
    # Saved rankings and scores preserved
    assert response["recommendations"][0]["pathway_id"] == "puc-science-allied"
    assert response["recommendations"][0]["match_score"] == 60
    assert response["recommendations"][2]["pathway_id"] == "puc-science-agri"
    assert response["recommendations"][2]["match_score"] == 30
    # LLM system prompt directs affirmation and differentiation
    system_content = ai.messages[0]["content"]
    assert "another path" in system_content.lower()
    assert "exploratory" in system_content.lower()


# -------------------------------------------------------------------------
# Test 7: No assessment
# -------------------------------------------------------------------------
def test_7_no_assessment_does_not_fabricate_recommendations(monkeypatch):
    """Student with no completed assessment receives guidance to complete assessment first."""
    user_id, assessment, saved, db = make_puc_science_student_context(monkeypatch, has_assessment=False)

    response = answers.answer_question(
        db, user_id, "token", "What is my recommended path?", intent="explore"
    )

    assert response["status"] == "needs_update"
    assert response["context_status"] == "missing"
    assert response["recommendations"] == []
    assert "complete your assessment first" in response["answer"].lower() or "interest questionnaire" in response["answer"].lower()


# -------------------------------------------------------------------------
# Test 8: Ambiguous aspect question clarification
# -------------------------------------------------------------------------
def test_8_ambiguous_aspect_question_prompts_clarification(monkeypatch):
    """Ambiguous aspect question with no specific pathway prompts clarification among saved pathways."""
    user_id, assessment, saved, db = make_puc_science_student_context(monkeypatch)

    response = answers.answer_question(
        db, user_id, "token", "What is the day-to-day work environment like?", intent="explore"
    )

    assert response["status"] == "needs_clarification"
    assert "Allied Health Sciences & Nursing" in response["answer"]
    assert "Pharmacy Education" in response["answer"]
    assert "Agriculture & Allied Sciences" in response["answer"]


# -------------------------------------------------------------------------
# Regression Tests for Referential Follow-ups and Specific Pathway Context
# -------------------------------------------------------------------------
def test_regression_1_second_rec_then_prepare_for_this_career_resolves_to_pharmacy(monkeypatch):
    """'What about the second one?' -> 'What should I prepare for this career?' resolves to Pharmacy."""
    user_id, assessment, saved, db = make_puc_science_student_context(monkeypatch)
    ai = FakeAI("For Pharmacy Education, you should prepare Physics, Chemistry, and Biology/Maths for KCET.")

    # Turn 1: "What about the second one?"
    turn1_res = answers.answer_question(
        db, user_id, "token", "What about the second one?", intent="explore", ai=ai
    )
    assert turn1_res["status"] == "recommendations_explained"
    assert "Pharmacy Education" in turn1_res["conversation_topic"]
    assert turn1_res.get("specific_pathway") == "Pharmacy Education (B.Pharm / D.Pharm)"

    # Update conversation state with Turn 1
    state = context.ConversationState()
    state = context.update_conversation_state(
        state, "What about the second one?", "explore", turn1_res, topic=turn1_res["conversation_topic"]
    )
    assert state.last_specific_pathway == "Pharmacy Education (B.Pharm / D.Pharm)"

    # Turn 2: "What should I prepare for this career?"
    turn2_res = answers.answer_question(
        db, user_id, "token", "What should I prepare for this career?", intent="explore", ai=ai, history=state
    )
    assert turn2_res["status"] == "answered"
    assert turn2_res["conversation_topic"] == "Pharmacy Education (B.Pharm / D.Pharm)"
    assert turn2_res.get("specific_pathway") == "Pharmacy Education (B.Pharm / D.Pharm)"
    # Must not ask for clarification among all 3 pathways
    assert "Which pathway would you like to explore" not in turn2_res["answer"]


def test_regression_2_first_rec_then_skills_resolves_to_allied_health(monkeypatch):
    """'What is my recommended path?' -> 'What skills do I need for this?' resolves to Allied Health."""
    user_id, assessment, saved, db = make_puc_science_student_context(monkeypatch)
    ai = FakeAI("For Allied Health Sciences & Nursing, practical laboratory skills and patient care are essential.")

    # Turn 1: "What is my recommended path?"
    turn1_res = answers.answer_question(
        db, user_id, "token", "What is my recommended path?", intent="explore", ai=ai
    )
    assert turn1_res["status"] == "recommendations_explained"
    assert "Allied Health Sciences & Nursing" in turn1_res["conversation_topic"]
    assert turn1_res.get("specific_pathway") == "Allied Health Sciences & Nursing"

    # Update state
    state = context.ConversationState()
    state = context.update_conversation_state(
        state, "What is my recommended path?", "explore", turn1_res, topic=turn1_res["conversation_topic"]
    )
    assert state.last_specific_pathway == "Allied Health Sciences & Nursing"

    # Turn 2: "What skills do I need for this?"
    turn2_res = answers.answer_question(
        db, user_id, "token", "What skills do I need for this?", intent="explore", ai=ai, history=state
    )
    assert turn2_res["status"] == "answered"
    assert turn2_res["conversation_topic"] == "Allied Health Sciences & Nursing"
    assert turn2_res.get("specific_pathway") == "Allied Health Sciences & Nursing"
    assert "Which pathway would you like to explore" not in turn2_res["answer"]


def test_regression_3_alternative_path_does_not_erase_specific_pathway_context(monkeypatch):
    """'Can I choose another path?' does not erase the previous specific pathway context."""
    user_id, assessment, saved, db = make_puc_science_student_context(monkeypatch)
    ai = FakeAI("Targeted guidance.")

    # Turn 1: Discuss second recommendation (Pharmacy)
    turn1_res = answers.answer_question(
        db, user_id, "token", "What about the second one?", intent="explore", ai=ai
    )
    state = context.ConversationState()
    state = context.update_conversation_state(
        state, "What about the second one?", "explore", turn1_res, topic=turn1_res["conversation_topic"]
    )
    assert state.last_specific_pathway == "Pharmacy Education (B.Pharm / D.Pharm)"

    # Turn 2: "Can I choose another path?"
    turn2_res = answers.answer_question(
        db, user_id, "token", "Can I choose another path?", intent="explore", ai=ai, history=state
    )
    assert turn2_res["status"] == "recommendations_explained"
    assert "Alternative Pathways" in turn2_res["conversation_topic"]

    # Update state: topic is Alternative Pathways, BUT last_specific_pathway must NOT be erased!
    state = context.update_conversation_state(
        state, "Can I choose another path?", "explore", turn2_res, topic=turn2_res["conversation_topic"]
    )
    assert state.last_topic == "Assessment recommendations: Alternative Pathways"
    assert state.last_specific_pathway == "Pharmacy Education (B.Pharm / D.Pharm)"

    # Turn 3: "What should I prepare for this career?"
    turn3_res = answers.answer_question(
        db, user_id, "token", "What should I prepare for this career?", intent="explore", ai=ai, history=state
    )
    # Must resolve specifically to Pharmacy Education, not ask clarification or treat as Alternative Pathways
    assert turn3_res["status"] == "answered"
    assert turn3_res["conversation_topic"] == "Pharmacy Education (B.Pharm / D.Pharm)"
    assert "Which pathway would you like to explore" not in turn3_res["answer"]


def test_regression_4_genuinely_ambiguous_first_question_asks_clarification(monkeypatch):
    """When there is genuinely no recent specific pathway, referential question asks clarification."""
    user_id, assessment, saved, db = make_puc_science_student_context(monkeypatch)
    ai = FakeAI("General answer.")

    # User asks general recommendation list ("What are my pathways?")
    turn1_res = answers.answer_question(
        db, user_id, "token", "What are my pathways?", intent="explore", ai=ai
    )
    state = context.ConversationState()
    state = context.update_conversation_state(
        state, "What are my pathways?", "explore", turn1_res, topic=turn1_res["conversation_topic"]
    )
    # General list has no single specific pathway
    assert state.last_specific_pathway is None

    # Then user asks referential follow-up without having picked one
    turn2_res = answers.answer_question(
        db, user_id, "token", "What should I prepare for this career?", intent="explore", ai=ai, history=state
    )
    assert turn2_res["status"] == "needs_clarification"
    assert "Which pathway would you like to explore" in turn2_res["answer"]
    assert "Allied Health Sciences & Nursing" in turn2_res["answer"]
    assert "Pharmacy Education" in turn2_res["answer"]
    assert "Agriculture & Allied Sciences" in turn2_res["answer"]


def test_regression_5_explicit_pathway_switch_updates_active_context(monkeypatch):
    """Explicitly naming a different pathway updates the active pathway context."""
    user_id, assessment, saved, db = make_puc_science_student_context(monkeypatch)
    ai = FakeAI("Agriculture & Allied Sciences guidance.")

    # Turn 1: On Pharmacy Education
    turn1_res = answers.answer_question(
        db, user_id, "token", "What about the second one?", intent="explore", ai=ai
    )
    state = context.ConversationState()
    state = context.update_conversation_state(
        state, "What about the second one?", "explore", turn1_res, topic=turn1_res["conversation_topic"]
    )
    assert state.last_specific_pathway == "Pharmacy Education (B.Pharm / D.Pharm)"

    # Turn 2: User explicitly switches to Agriculture & Allied Sciences
    turn2_res = answers.answer_question(
        db, user_id, "token", "What about Agriculture & Allied Sciences?", intent="explore", ai=ai, history=state
    )
    assert turn2_res["status"] == "recommendations_explained"
    assert "Agriculture & Allied Sciences" in turn2_res["conversation_topic"]
    assert turn2_res.get("specific_pathway") == "Agriculture & Allied Sciences"

    state = context.update_conversation_state(
        state, "What about Agriculture & Allied Sciences?", "explore", turn2_res, topic=turn2_res["conversation_topic"]
    )
    assert state.last_specific_pathway == "Agriculture & Allied Sciences"

    # Turn 3: Referential follow-up "What skills do I need for this?"
    turn3_res = answers.answer_question(
        db, user_id, "token", "What skills do I need for this?", intent="explore", ai=ai, history=state
    )
    assert turn3_res["status"] == "answered"
    assert turn3_res["conversation_topic"] == "Agriculture & Allied Sciences"
    assert "Which pathway would you like to explore" not in turn3_res["answer"]

