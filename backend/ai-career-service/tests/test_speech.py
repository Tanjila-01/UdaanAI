import io
import wave
from types import SimpleNamespace
from unittest.mock import Mock
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import get_current_user_claims
from app.services import speech
from app.api.routes import speech as route


def wav(seconds=1):
    output = io.BytesIO()
    with wave.open(output, 'wb') as audio:
        audio.setnchannels(1); audio.setsampwidth(2); audio.setframerate(16000)
        audio.writeframes(b'\0\0' * int(seconds * 16000))
    return output.getvalue()


@pytest.fixture
def client():
    app.dependency_overrides[get_current_user_claims] = lambda: {'sub': 'test-student'}
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_authentication_required():
    with TestClient(app) as client:
        assert client.post('/career-intelligence/speech/transcribe', content=wav(), headers={'Content-Type': 'audio/wav'}).status_code == 401


def test_decode_rejects_corrupt_short_and_long_audio():
    for data in (b'not audio', wav(.1), wav(31)):
        with pytest.raises(speech.AudioInputError): speech.decode_clip(data)
    assert len(speech.decode_clip(wav())) == 16000


def test_transcription_is_local_english_and_rejects_silence(monkeypatch):
    model = Mock()
    model.transcribe.return_value = (iter([SimpleNamespace(text=' What do designers do? ')]), None)
    monkeypatch.setattr(speech, 'speech_model', lambda: model)
    assert speech.transcribe_clip(wav()) == {'text': 'What do designers do?', 'language': 'en'}
    assert model.transcribe.call_args.kwargs['language'] == 'en'
    assert model.transcribe.call_args.kwargs['vad_filter'] is True
    model.transcribe.return_value = (iter([]), None)
    with pytest.raises(speech.AudioInputError, match='No clear speech'): speech.transcribe_clip(wav())


def test_upload_limits_and_formats(client):
    path = '/career-intelligence/speech/transcribe'
    assert client.post(path, content=wav(), headers={'Content-Type': 'application/json'}).status_code == 415
    assert client.post(path, content=b'', headers={'Content-Type': 'audio/wav'}).status_code == 422
    assert client.post(path, content=b'x' * (speech.MAX_AUDIO_BYTES + 1), headers={'Content-Type': 'audio/webm'}).status_code == 413


def test_errors_do_not_leak_and_capacity_releases(client, monkeypatch):
    path = '/career-intelligence/speech/transcribe'
    monkeypatch.setattr(route, 'transcribe_clip', Mock(side_effect=RuntimeError('/private/path')))
    result = client.post(path, content=wav(), headers={'Content-Type': 'audio/wav'})
    assert result.status_code == 503
    assert '/private/path' not in result.text
    monkeypatch.setattr(route, 'transcribe_clip', lambda data: {'text': 'Career question', 'language': 'en'})
    assert client.post(path, content=wav(), headers={'Content-Type': 'audio/wav'}).json()['text'] == 'Career question'


def test_busy_capacity_is_shared_with_answers(client):
    assert route.capacity.acquire(blocking=False)
    try:
        response = client.post('/career-intelligence/speech/transcribe', content=wav(), headers={'Content-Type': 'audio/wav'})
        assert response.status_code == 429
        assert response.headers['Retry-After'] == '10'
    finally:
        route.capacity.release()
