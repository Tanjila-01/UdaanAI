"""Comprehensive regression tests for AI Career Advisor fixes.
Verifies routing by meaning, profile facts, score ties, probability disclaimers,
provenance tracking, direct guidance without search, domain rejection,
failed turn recovery, and local independence when web search is disabled.
"""
from types import SimpleNamespace
from unittest.mock import MagicMock, Mock
from uuid import uuid4
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
from app.services import web_answers as web
from app.services import advisor_context as context
from app.services import assessment_grounding as grounding

OWNER = str(uuid4())


@pytest.fixture
def advisor_db(monkeypatch):
    engine = create_engine('sqlite://', connect_args={'check_same_thread': False}, poolclass=StaticPool)
    with engine.connect() as conn:
        conn.execute(text("ATTACH DATABASE ':memory:' AS career_ai"))
    AdvisorHistory.__table__.create(engine)
    db = sessionmaker(bind=engine)()
    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_user_claims] = lambda: {'sub': OWNER}

    # Mock personal_context to return ITI and PUC both with score 50
    recs = [
        {'pathway_id': 'c10-iti', 'title': 'ITI Vocational Trades', 'rank': 1, 'match_score': 50, 'match_label': 'Good', 'interest_areas': ['iti'], 'explanation': 'Vocational trade skills.'},
        {'pathway_id': 'c10-puc', 'title': 'Pre-University College (PUC)', 'rank': 2, 'match_score': 50, 'match_label': 'Good', 'interest_areas': ['science'], 'explanation': 'Pre-university courses.'}
    ]
    monkeypatch.setattr(answer_route, 'personal_context', lambda db, uid, token: ('current', recs, 'Your saved recommendations are ITI and PUC.'))

    # Mock student profile retrieval to return Class 10
    class MockProfileClient:
        def __init__(self, *args, **kwargs): pass
        def __enter__(self): return self
        def __exit__(self, *args): pass
        def get(self, url, headers=None):
            resp = Mock()
            resp.status_code = 200
            resp.json.return_value = {'current_level': 'Class 10', 'stream': None, 'name': 'Test Student'}
            return resp

    monkeypatch.setattr(answer_route.httpx, 'Client', MockProfileClient)

    yield db
    app.dependency_overrides.clear()
    db.close()
    engine.dispose()


def test_profile_fact_answered_locally(advisor_db):
    """Answers profile class questions locally without web search."""
    with TestClient(app) as client:
        res = client.post('/career-intelligence/answers', headers={'Authorization': 'Bearer test'}, json={
            'question': 'What class am I actually studying in according to my profile?'
        })
        assert res.status_code == 200
        data = res.json()
        assert data['answer_origin'] == 'local'
        assert data['status'] == 'answered'
        assert 'Class 10' in data['answer']
        assert data['sources'] == []


def test_profile_missing_disclosed_honestly(advisor_db, monkeypatch):
    """Discloses missing profile records honestly rather than searching the internet."""
    class MockEmptyProfileClient:
        def __init__(self, *args, **kwargs): pass
        def __enter__(self): return self
        def __exit__(self, *args): pass
        def get(self, url, headers=None):
            resp = Mock()
            resp.status_code = 404
            resp.json.return_value = None
            return resp

    monkeypatch.setattr(answer_route.httpx, 'Client', MockEmptyProfileClient)
    with TestClient(app) as client:
        res = client.post('/career-intelligence/answers', headers={'Authorization': 'Bearer test'}, json={
            'question': 'What class am I actually studying in according to my profile?'
        })
        assert res.status_code == 200
        data = res.json()
        assert data['answer_origin'] == 'local'
        assert data['status'] == 'needs_update'
        assert 'not yet available' in data['answer'] or 'does not currently record' in data['answer']


def test_sslc_options_from_saved_assessment(advisor_db):
    """Prioritizes saved assessment matches for SSLC options inquiry."""
    with TestClient(app) as client:
        res = client.post('/career-intelligence/answers', headers={'Authorization': 'Bearer test'}, json={
            'question': 'Based on what you know about me, which two options should I explore after SSLC?'
        })
        assert res.status_code == 200
        data = res.json()
        assert data['answer_origin'] == 'local'
        assert data['status'] == 'recommendations_explained'
        assert 'ITI Vocational Trades' in data['answer']
        assert 'Pre-University College (PUC)' in data['answer']
        assert data['sources'] == []


def test_score_tie_explanation(advisor_db):
    """Explains score tie and catalogue order honestly without claiming higher ability."""
    with TestClient(app) as client:
        res = client.post('/career-intelligence/answers', headers={'Authorization': 'Bearer test'}, json={
            'question': 'ITI and PUC both show 50. Why are you putting ITI first?'
        })
        assert res.status_code == 200
        data = res.json()
        assert data['answer_origin'] == 'local'
        assert data['status'] == 'recommendations_explained'
        assert 'tied' in data['answer'].lower() or 'equal' in data['answer'].lower()
        assert 'catalogue presentation' in data['answer'].lower() or 'order' in data['answer'].lower()
        assert '50/100' in data['answer']


def test_match_score_probability_disclaimer(advisor_db):
    """Explains that match score is not a probability of success or measurement of ability."""
    with TestClient(app) as client:
        res = client.post('/career-intelligence/answers', headers={'Authorization': 'Bearer test'}, json={
            'question': 'Does a match score of 50 mean I have a 50% chance of succeeding?'
        })
        assert res.status_code == 200
        data = res.json()
        assert data['answer_origin'] == 'local'
        assert data['status'] == 'answered'
        assert 'not a probability of success' in data['answer'].lower()
        assert 'dedication' in data['answer'].lower() or 'effort' in data['answer'].lower()


def test_provenance_distinguishes_chat_from_assessment(advisor_db):
    """Explains whether interest came from chat or saved assessment."""
    with TestClient(app) as client:
        res = client.post('/career-intelligence/answers', headers={'Authorization': 'Bearer test'}, json={
            'question': 'Did you get my interest in drawing from my assessment, or because I just told you?'
        })
        assert res.status_code == 200
        data = res.json()
        assert data['answer_origin'] == 'local'
        assert data['status'] == 'answered'
        assert 'you just told me' in data['answer'].lower()
        assert 'not from your saved assessment' in data['answer'].lower()


def test_direct_guidance_guarantees(advisor_db):
    """Answers admission and job guarantee questions directly without search."""
    with TestClient(app) as client:
        res = client.post('/career-intelligence/answers', headers={'Authorization': 'Bearer test'}, json={
            'question': 'Can you guarantee I’ll get admission and a job after it?'
        })
        assert res.status_code == 200
        data = res.json()
        assert data['answer_origin'] == 'local'
        assert data['status'] == 'answered'
        assert 'cannot guarantee' in data['answer'].lower()
        assert 'eligibility' in data['answer'].lower()


def test_direct_guidance_info_needed(advisor_db):
    """Answers what information is needed to help choose directly without search."""
    with TestClient(app) as client:
        res = client.post('/career-intelligence/answers', headers={'Authorization': 'Bearer test'}, json={
            'question': 'What information do you still need from me to help me choose?'
        })
        assert res.status_code == 200
        data = res.json()
        assert data['answer_origin'] == 'local'
        assert data['status'] == 'answered'
        assert 'district or city' in data['answer'].lower()
        assert 'learning style' in data['answer'].lower()


def test_preference_overriding_recommends_design(advisor_db):
    """Does not force ITI when student rejects it and states creative drawing preference."""
    with TestClient(app) as client:
        res = client.post('/career-intelligence/answers', headers={'Authorization': 'Bearer test'}, json={
            'question': 'I don’t want ITI. I enjoy drawing and making posters. What else could suit me?'
        })
        assert res.status_code == 200
        data = res.json()
        assert data['answer_origin'] == 'local'
        assert data['status'] == 'answered'
        assert 'graphic design' in data['answer'].lower() or 'design' in data['answer'].lower()
        assert 'polytechnic diploma' in data['answer'].lower() or 'puc' in data['answer'].lower()


def test_options_filtering_without_degree(advisor_db):
    """Filters previously discussed creative options without degree instead of returning generic trades."""
    with TestClient(app) as client:
        res = client.post('/career-intelligence/answers', headers={'Authorization': 'Bearer test'}, json={
            'question': 'Which of those options could I explore without a degree?'
        })
        assert res.status_code == 200
        data = res.json()
        assert data['answer_origin'] == 'local'
        assert data['status'] == 'answered'
        assert 'diploma in graphic design' in data['answer'].lower() or 'animation' in data['answer'].lower() or 'freelance' in data['answer'].lower()
        assert 'fitter' not in data['answer'].lower()


def test_domain_rejection_blocks_scribd_and_foreign_schools():
    """Verifies that Scribd and foreign academic domains are blocked for Karnataka/Indian queries."""
    assert not web.approved_url('https://www.scribd.com/document/12345/ITI-Rules')
    assert not web.approved_url('https://scribd.com/doc')
    assert not web.approved_url('https://slideshare.net/presentation')
    assert not web.approved_url('https://www.edinburgh.ac.uk/summer-school/pre-university')
    assert not web.approved_url('https://ie.edu/pre-university-course')
    # Legitimate Indian official hosts are approved
    assert web.approved_url('https://ksei.karnataka.gov.in/rules', official_only=True)
    assert web.approved_url('https://dtek.karnataka.gov.in/admissions', official_only=True)
    assert web.approved_url('https://en.wikipedia.org/wiki/Industrial_training_institute', official_only=False)


def test_failed_turn_followup_resolves_official_source(advisor_db):
    """Resolves 'Show me the official source supporting that' after a failed turn honestly."""
    with TestClient(app) as client:
        res = client.post('/career-intelligence/answers', headers={'Authorization': 'Bearer test'}, json={
            'question': 'Show me the official source supporting that.',
            'previous_question': 'Does completing Electrician ITI automatically give me an electrical contractor licence in Karnataka?'
        })
        assert res.status_code == 200
        data = res.json()
        assert data['status'] == 'answered'
        assert 'electrical contractor licence' in data['answer'].lower()
        assert 'ksei.karnataka.gov.in' in data['sources'][0]['references'][0]['url']
        assert 'scribd' not in data['sources'][0]['references'][0]['url']


def test_local_features_work_when_web_search_disabled(advisor_db, monkeypatch):
    """Ensures profile, assessment, provenance, and direct guidance work when web search is disabled."""
    monkeypatch.setattr(answer_route.settings, 'WEB_SEARCH_ENABLED', False)
    with TestClient(app) as client:
        # Profile fact
        r1 = client.post('/career-intelligence/answers', headers={'Authorization': 'Bearer test'}, json={
            'question': 'What class am I actually studying in according to my profile?'
        })
        assert r1.status_code == 200 and r1.json()['status'] == 'answered'

        # SSLC options
        r2 = client.post('/career-intelligence/answers', headers={'Authorization': 'Bearer test'}, json={
            'question': 'Based on what you know about me, which two options should I explore after SSLC?'
        })
        assert r2.status_code == 200 and r2.json()['status'] == 'recommendations_explained'

        # Score tie
        r3 = client.post('/career-intelligence/answers', headers={'Authorization': 'Bearer test'}, json={
            'question': 'ITI and PUC both show 50. Why are you putting ITI first?'
        })
        assert r3.status_code == 200 and r3.json()['status'] == 'recommendations_explained'

        # Guarantees
        r4 = client.post('/career-intelligence/answers', headers={'Authorization': 'Bearer test'}, json={
            'question': 'Can you guarantee I’ll get admission and a job after it?'
        })
        assert r4.status_code == 200 and r4.json()['status'] == 'answered'
