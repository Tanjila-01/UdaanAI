from uuid import uuid4
from unittest.mock import Mock
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from sqlalchemy.exc import SQLAlchemyError
from app.main import app
from app.api.routes import answers as answer_route
from app.db.session import get_db
from app.core.security import get_current_user_claims
from app.models.advisor_history import AdvisorHistory
from app.services.advisor_history import save_answer

OWNER = str(uuid4())
OTHER = str(uuid4())
SAMPLE_SOURCE = [{
    'reference': 1,
    'chunk_id': 'web-1234567890abcdef123456',
    'document_id': 'web-1234567890abcdef123456',
    'title': 'Software engineering overview',
    'heading': 'Web source',
    'references': [{'url': 'https://en.wikipedia.org/wiki/Software_engineering', 'publisher': 'en.wikipedia.org'}],
    'scope': 'Public web evidence; see the source for publication date and regional context.',
    'reviewed_on': ''
}]
ANSWER = {'status': 'answered', 'answer': 'A saved answer. [1]', 'sources': SAMPLE_SOURCE, 'recommendations': [], 'context_status': 'not_requested', 'answer_origin': 'web'}
REQUEST = {'question': 'What does a designer do?', 'intent': 'explore', 'language': 'en', 'pathway_id': None}

@pytest.fixture
def history_db(monkeypatch):
    monkeypatch.setattr(answer_route.settings, "WEB_SEARCH_ENABLED", False)
    engine = create_engine('sqlite://', connect_args={'check_same_thread': False}, poolclass=StaticPool)
    with engine.connect() as conn:
        conn.execute(text("ATTACH DATABASE ':memory:' AS career_ai"))
    AdvisorHistory.__table__.create(engine)
    db = sessionmaker(bind=engine)()
    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_user_claims] = lambda: {'sub': OWNER}
    yield db
    app.dependency_overrides.clear()
    db.close(); engine.dispose()


def test_saved_answer_survives_requests_and_preserves_snapshot(history_db):
    key = save_answer(history_db, OWNER, REQUEST, ANSWER)
    with TestClient(app) as client:
        assert client.get('/career-intelligence/history').json()['items'][0]['id'] == key
        saved = client.get(f'/career-intelligence/history/{key}').json()
        assert saved['request'] == REQUEST
        assert saved['response'] == ANSWER
        assert saved['created_at']
        assert client.delete(f'/career-intelligence/history/{key}').status_code == 204
        assert client.get(f'/career-intelligence/history/{key}').status_code == 404
        assert client.get('/career-intelligence/history').json()['items'] == []


def test_students_cannot_list_read_or_delete_another_students_answers(history_db):
    key = save_answer(history_db, OTHER, REQUEST, ANSWER)
    with TestClient(app) as client:
        assert client.get('/career-intelligence/history').json()['items'] == []
        assert client.get(f'/career-intelligence/history/{key}').status_code == 404
        assert client.delete(f'/career-intelligence/history/{key}').status_code == 404
    assert history_db.query(AdvisorHistory).count() == 1


def test_pagination_and_invalid_ids(history_db):
    for index in range(22): save_answer(history_db, OWNER, {**REQUEST, 'question': f'Question {index}'}, ANSWER)
    with TestClient(app) as client:
        first = client.get('/career-intelligence/history').json()
        second = client.get('/career-intelligence/history?offset=20').json()
        assert len(first['items']) == 20 and first['has_more']
        assert len(second['items']) == 2 and not second['has_more']
        assert not ({row['id'] for row in first['items']} & {row['id'] for row in second['items']})
        assert client.get('/career-intelligence/history?offset=-1').status_code == 422
        assert client.get('/career-intelligence/history/not-a-uuid').status_code == 422


def test_history_requires_authentication(history_db):
    app.dependency_overrides.pop(get_current_user_claims)
    with TestClient(app) as client:
        for method, path in [('get', '/career-intelligence/history'), ('get', f'/career-intelligence/history/{uuid4()}'), ('delete', f'/career-intelligence/history/{uuid4()}')]:
            assert getattr(client, method)(path).status_code == 401


def test_saving_failure_does_not_discard_answer_and_fallbacks_not_saved():
    db = Mock(); db.commit.side_effect = SQLAlchemyError('database unavailable')
    assert save_answer(db, OWNER, REQUEST, ANSWER) is None
    db.rollback.assert_called_once()
    db.reset_mock()
    assert save_answer(db, OWNER, REQUEST, {**ANSWER, 'status': 'unavailable'}) is None
    db.add.assert_not_called()


def test_followup_uses_owned_topic_and_never_passes_the_old_answer_as_evidence(history_db, monkeypatch):
    monkeypatch.setattr(answer_route.settings, 'WEB_SEARCH_ENABLED', True)
    route = answer_route
    old = {**ANSWER, 'answer': 'OUTDATED PRIVATE ANSWER', 'sources': [{'reference': 1, 'chunk_id': 'web-1', 'document_id': 'web-1', 'title': 'Software development: work overview', 'heading': 'Web source', 'references': [{'url': 'https://example.com', 'publisher': 'example.com'}], 'scope': 'Public web evidence', 'reviewed_on': ''}]}
    key = save_answer(history_db, OWNER, REQUEST, old)
    online = Mock(return_value={**ANSWER, 'conversation_topic': 'Software development: work overview'})
    monkeypatch.setattr(route, 'web_answer', online)
    with TestClient(app) as client:
        response = client.post('/career-intelligence/answers', headers={'Authorization': 'Bearer unused-test-token'}, json={'question': 'What do they do each day?', 'follow_up_to': key})
        assert response.status_code == 200
        assert response.json()['conversation_topic'] == 'Software development: work overview'
        assert response.json()['history_id']
        assert online.call_args.args[0] == 'What do they do each day?'
        assert online.call_args.args[1] == 'Software development: work overview'
        assert 'OUTDATED PRIVATE ANSWER' not in str(online.call_args)


def test_followup_denies_other_owner_deleted_and_spoofed_context(history_db, monkeypatch):
    route = answer_route
    generate = Mock()
    monkeypatch.setattr(route, 'web_answer', generate)
    key = save_answer(history_db, OTHER, REQUEST, {**ANSWER, 'sources': SAMPLE_SOURCE})
    with TestClient(app) as client:
        for target in [key, str(uuid4())]:
            response = client.post('/career-intelligence/answers', headers={'Authorization': 'Bearer unused'}, json={'question': 'What about this?', 'follow_up_to': target})
            assert response.status_code == 404
        assert client.post('/career-intelligence/answers', headers={'Authorization': 'Bearer unused'}, json={'question': 'What about this?', 'conversation_topic': 'Client invented context'}).status_code == 422
    generate.assert_not_called()


def test_ambiguous_followup_asks_for_a_named_career(history_db, monkeypatch):
    route = answer_route
    generate = Mock()
    monkeypatch.setattr(route, 'web_answer', generate)
    key = save_answer(history_db, OWNER, REQUEST, {**ANSWER, 'sources': [{'title': 'Software work'}, {'title': 'Design work'}]})
    with TestClient(app) as client:
        response = client.post('/career-intelligence/answers', headers={'Authorization': 'Bearer unused'}, json={'question': 'What about this?', 'follow_up_to': key})
        assert response.json()['status'] == 'needs_clarification'
        assert client.post('/career-intelligence/answers', headers={'Authorization': 'Bearer unused'}, json={'question': 'Explain this', 'follow_up_to': key, 'intent': 'explain_recommendations'}).status_code == 422
    generate.assert_not_called()


@pytest.mark.parametrize('question', [
    'What does an AI engineer do?',              # Normal career question
    'What is BTech in computer science?',        # Normal course question
    'Which stream should I choose after 10th?',   # Stream question
    'Explain photosynthesis in biology',         # Academic subject question
])
def test_normal_questions_invoke_web_research(history_db, monkeypatch, question):
    monkeypatch.setattr(answer_route.settings, 'WEB_SEARCH_ENABLED', True)
    online = Mock(return_value={**ANSWER, 'answer_origin': 'web'})
    local = Mock()
    monkeypatch.setattr(answer_route, 'web_answer', online)
    monkeypatch.setattr(answer_route, 'answer_question', local)
    with TestClient(app) as client:
        response = client.post('/career-intelligence/answers', headers={'Authorization': 'Bearer test'}, json={'question': question})
    assert response.status_code == 200
    assert online.called
    local.assert_not_called()
    assert response.json()['answer_origin'] == 'web'


@pytest.mark.parametrize('web_status', ['insufficient_evidence', 'unavailable'])
def test_web_failure_does_not_invoke_seeded_answer_service(history_db, monkeypatch, web_status):
    monkeypatch.setattr(answer_route.settings, 'WEB_SEARCH_ENABLED', True)
    online = Mock(return_value={**ANSWER, 'status': web_status, 'sources': [], 'answer_origin': 'web'})
    local = Mock()
    monkeypatch.setattr(answer_route, 'web_answer', online)
    monkeypatch.setattr(answer_route, 'answer_question', local)
    with TestClient(app) as client:
        response = client.post('/career-intelligence/answers', headers={'Authorization': 'Bearer test'}, json={'question': 'What does a graphic designer do?'})
    assert response.status_code == 200
    assert online.called
    local.assert_not_called()
    assert response.json()['status'] == web_status


def test_web_grounded_answered_response_contains_internet_sources(history_db, monkeypatch):
    monkeypatch.setattr(answer_route.settings, 'WEB_SEARCH_ENABLED', True)
    online = Mock(return_value={**ANSWER, 'status': 'answered', 'sources': SAMPLE_SOURCE, 'answer_origin': 'web'})
    monkeypatch.setattr(answer_route, 'web_answer', online)
    with TestClient(app) as client:
        response = client.post('/career-intelligence/answers', headers={'Authorization': 'Bearer test'}, json={'question': 'What is computer science?'})
    assert response.status_code == 200
    data = response.json()
    assert data['status'] == 'answered'
    assert data['answer_origin'] == 'web'
    assert len(data['sources']) >= 1
    assert data['sources'][0]['references'][0]['url'].startswith('https://')


def test_no_source_responses_cannot_have_status_answered(history_db, monkeypatch):
    monkeypatch.setattr(answer_route.settings, 'WEB_SEARCH_ENABLED', True)
    online = Mock(return_value={**ANSWER, 'status': 'answered', 'sources': [], 'answer_origin': 'web'})
    monkeypatch.setattr(answer_route, 'web_answer', online)
    with TestClient(app) as client:
        response = client.post('/career-intelligence/answers', headers={'Authorization': 'Bearer test'}, json={'question': 'What is quantum computing?'})
    assert response.status_code == 200
    data = response.json()
    assert data['status'] != 'answered'
    assert data['status'] == 'insufficient_evidence'


def test_personalized_saved_recommendation_explanation_remains_local(history_db, monkeypatch):
    monkeypatch.setattr(answer_route.settings, 'WEB_SEARCH_ENABLED', True)
    online = Mock()
    local = Mock(return_value={
        'status': 'recommendations_explained',
        'answer': 'Here is an explanation of your saved recommendations.',
        'sources': [],
        'recommendations': [{'pathway_id': 'software-engineering', 'title': 'Software Engineering', 'rank': 1, 'match_score': 85, 'match_label': 'High match', 'interest_areas': ['Technology'], 'explanation': 'Matches your profile.'}],
        'context_status': 'current',
        'answer_origin': 'local'
    })
    monkeypatch.setattr(answer_route, 'web_answer', online)
    monkeypatch.setattr(answer_route, 'answer_question', local)
    with TestClient(app) as client:
        response = client.post('/career-intelligence/answers', headers={'Authorization': 'Bearer test'}, json={'question': 'Explain my recommendations', 'intent': 'explain_recommendations'})
    assert response.status_code == 200
    online.assert_not_called()
    assert local.called
    data = response.json()
    assert data['status'] == 'recommendations_explained'
    assert data['answer_origin'] == 'local'
    assert len(data['recommendations']) >= 1


def test_new_career_replaces_the_selected_topic(history_db, monkeypatch):
    monkeypatch.setattr(answer_route.settings, 'WEB_SEARCH_ENABLED', True)
    key = save_answer(history_db, OWNER, REQUEST, {**ANSWER, 'sources': SAMPLE_SOURCE})
    online = Mock(return_value={**ANSWER, 'conversation_topic': 'Computer science engineering'})
    monkeypatch.setattr(answer_route, 'web_answer', online)
    with TestClient(app) as client:
        response = client.post('/career-intelligence/answers', headers={'Authorization': 'Bearer test'}, json={'question': 'hi what is Computer science engineering?', 'follow_up_to': key})
    assert response.status_code == 200
    assert online.call_args.args[1] == 'Computer science engineering'
    assert response.json()['conversation_topic'] == 'Computer science engineering'


def test_exact_cse_salary_request_is_accepted(history_db, monkeypatch):
    monkeypatch.setattr(answer_route.settings, 'WEB_SEARCH_ENABLED', True)
    online = Mock(return_value={**ANSWER, 'answer_origin': 'web'})
    local = Mock()
    monkeypatch.setattr(answer_route, 'web_answer', online)
    monkeypatch.setattr(answer_route, 'answer_question', local)
    with TestClient(app) as client:
        response = client.post('/career-intelligence/answers', headers={'Authorization': 'Bearer test'}, json={'question': 'what is cse ? what salary they get paid'})
    assert response.status_code == 200
    assert 'computer science engineering' in online.call_args.args[0]
    local.assert_not_called()


def test_auto_does_not_apply_lexical_scope_gate(history_db, monkeypatch):
    monkeypatch.setattr(answer_route.settings, 'WEB_SEARCH_ENABLED', True)
    online = Mock(return_value={**ANSWER, 'answer_origin': 'web'})
    local = Mock()
    monkeypatch.setattr(answer_route, 'web_answer', online)
    monkeypatch.setattr(answer_route, 'answer_question', local)
    with TestClient(app) as client:
        for question in ['What is AI', 'What is Artificial intelligence?', 'Explain photosynthesis', 'How can I study better?']:
            response = client.post('/career-intelligence/answers', headers={'Authorization': 'Bearer test'}, json={'question': question})
            assert response.status_code == 200
            assert response.json()['status'] == 'answered'
    assert online.call_count == 4
    local.assert_not_called()

