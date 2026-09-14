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
ANSWER = {'status': 'answered', 'answer': 'A saved answer. [1]', 'sources': [], 'recommendations': [], 'context_status': 'not_requested'}
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
    route = answer_route
    old = {**ANSWER, 'answer': 'OUTDATED PRIVATE ANSWER', 'sources': [{'title': 'Software development: work overview'}]}
    key = save_answer(history_db, OWNER, REQUEST, old)
    generate = Mock(return_value=ANSWER.copy())
    monkeypatch.setattr(route, 'answer_question', generate)
    with TestClient(app) as client:
        response = client.post('/career-intelligence/answers', headers={'Authorization': 'Bearer unused-test-token'}, json={'question': 'What do they do each day?', 'follow_up_to': key})
        assert response.status_code == 200
        assert response.json()['conversation_topic'] == 'Software development: work overview'
        assert response.json()['history_id']
        assert generate.call_args.args[3] == 'What do they do each day?'
        assert generate.call_args.kwargs == {'conversation_topic': 'Software development: work overview'}
        assert 'OUTDATED PRIVATE ANSWER' not in str(generate.call_args)


def test_followup_denies_other_owner_deleted_and_spoofed_context(history_db, monkeypatch):
    route = answer_route
    generate = Mock()
    monkeypatch.setattr(route, 'answer_question', generate)
    key = save_answer(history_db, OTHER, REQUEST, {**ANSWER, 'sources': [{'title': 'Software work'}]})
    with TestClient(app) as client:
        for target in [key, str(uuid4())]:
            response = client.post('/career-intelligence/answers', headers={'Authorization': 'Bearer unused'}, json={'question': 'What about this?', 'follow_up_to': target})
            assert response.status_code == 404
        assert client.post('/career-intelligence/answers', headers={'Authorization': 'Bearer unused'}, json={'question': 'What about this?', 'conversation_topic': 'Client invented context'}).status_code == 422
    generate.assert_not_called()


def test_ambiguous_followup_asks_for_a_named_career(history_db, monkeypatch):
    route = answer_route
    generate = Mock()
    monkeypatch.setattr(route, 'answer_question', generate)
    key = save_answer(history_db, OWNER, REQUEST, {**ANSWER, 'sources': [{'title': 'Software work'}, {'title': 'Design work'}]})
    with TestClient(app) as client:
        response = client.post('/career-intelligence/answers', headers={'Authorization': 'Bearer unused'}, json={'question': 'What about this?', 'follow_up_to': key})
        assert response.json()['status'] == 'needs_clarification'
        assert client.post('/career-intelligence/answers', headers={'Authorization': 'Bearer unused'}, json={'question': 'Explain this', 'follow_up_to': key, 'intent': 'explain_recommendations'}).status_code == 422
    generate.assert_not_called()

@pytest.mark.parametrize('mode,expected_web', [('auto', True), ('local', False), ('web', True)])
def test_search_modes_use_local_first_or_explicit_web(history_db, monkeypatch, mode, expected_web):
    monkeypatch.setattr(answer_route.settings, 'WEB_SEARCH_ENABLED', True)
    local = Mock(return_value={**ANSWER, 'status': 'insufficient_evidence'})
    online = Mock(return_value={**ANSWER, 'answer_origin': 'web'})
    monkeypatch.setattr(answer_route, 'answer_question', local)
    monkeypatch.setattr(answer_route, 'web_answer', online)
    with TestClient(app) as client:
        response = client.post('/career-intelligence/answers', headers={'Authorization':'Bearer test'}, json={'question':'What is computer science engineering?', 'answer_mode':mode})
    assert response.status_code == 200
    assert online.called == expected_web
    assert local.called == (mode == 'local')


def test_new_career_replaces_the_selected_topic(history_db, monkeypatch):
    key = save_answer(history_db, OWNER, REQUEST, {**ANSWER, 'sources':[{'title':'Graphic design'}]})
    generate = Mock(return_value=ANSWER.copy())
    monkeypatch.setattr(answer_route, 'answer_question', generate)
    with TestClient(app) as client:
        response = client.post('/career-intelligence/answers', headers={'Authorization':'Bearer test'}, json={'question':'hi what is Computer science engineering?', 'follow_up_to':key, 'answer_mode':'local'})
    assert response.status_code == 200
    assert generate.call_args.kwargs['conversation_topic'] == 'Computer science engineering'
    assert response.json()['conversation_topic'] == 'Computer science engineering'

@pytest.mark.parametrize('mode', ['auto', 'web'])
def test_exact_cse_salary_request_is_accepted(history_db, monkeypatch, mode):
    monkeypatch.setattr(answer_route.settings, 'WEB_SEARCH_ENABLED', True)
    monkeypatch.setattr(answer_route, 'answer_question', Mock(return_value={**ANSWER, 'status':'insufficient_evidence'}))
    online = Mock(return_value={**ANSWER, 'answer_origin':'web'})
    monkeypatch.setattr(answer_route, 'web_answer', online)
    with TestClient(app) as client:
        response = client.post('/career-intelligence/answers', headers={'Authorization':'Bearer test'}, json={'question':'what is cse ? what salary they get paid', 'answer_mode':mode})
    assert response.status_code == 200
    assert 'computer science engineering' in online.call_args.args[0]


def test_auto_uses_seeded_answer_only_when_web_evidence_is_unavailable(history_db, monkeypatch):
    monkeypatch.setattr(answer_route.settings, 'WEB_SEARCH_ENABLED', True)
    online = Mock(return_value={**ANSWER, 'status': 'insufficient_evidence', 'answer_origin': 'web'})
    local = Mock(return_value=ANSWER.copy())
    monkeypatch.setattr(answer_route, 'web_answer', online)
    monkeypatch.setattr(answer_route, 'answer_question', local)
    with TestClient(app) as client:
        response = client.post('/career-intelligence/answers', headers={'Authorization':'Bearer test'}, json={'question':'Explain graphic design'})
    assert response.status_code == 200
    assert online.called and local.called
    assert response.json()['status'] == 'answered'


def test_auto_does_not_apply_lexical_scope_gate(history_db, monkeypatch):
    monkeypatch.setattr(answer_route.settings, 'WEB_SEARCH_ENABLED', True)
    online = Mock(return_value={**ANSWER, 'answer_origin': 'web'})
    local = Mock()
    monkeypatch.setattr(answer_route, 'web_answer', online)
    monkeypatch.setattr(answer_route, 'answer_question', local)
    with TestClient(app) as client:
        for question in ['What is AI', 'What is Artificial intelligence?', 'Explain photosynthesis', 'How can I study better?']:
            response = client.post('/career-intelligence/answers', headers={'Authorization':'Bearer test'}, json={'question':question})
            assert response.status_code == 200
            assert response.json()['status'] == 'answered'
    assert online.call_count == 4
    local.assert_not_called()
