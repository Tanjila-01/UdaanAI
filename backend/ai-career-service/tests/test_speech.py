import io
import math
import struct
import wave
from unittest.mock import Mock
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import get_current_user_claims
from app.services import speech
from app.api.routes import speech as route


def wav(seconds=1, frequency=440.0):
    output = io.BytesIO()
    with wave.open(output, 'wb') as audio:
        audio.setnchannels(1)
        audio.setsampwidth(2)
        audio.setframerate(16000)
        if frequency == 0:
            audio.writeframes(b'\0\0' * int(seconds * 16000))
        else:
            frames = bytearray()
            for i in range(int(seconds * 16000)):
                val = int(16000 * math.sin(2 * math.pi * frequency * i / 16000))
                frames.extend(struct.pack('<h', val))
            audio.writeframes(bytes(frames))
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
        with pytest.raises(speech.AudioInputError):
            speech.decode_clip(data)
    assert len(speech.decode_clip(wav(1.0))) == 16000


def test_silence_rejected():
    with pytest.raises(speech.AudioInputError, match='No clear speech'):
        speech.decode_clip(wav(1.0, frequency=0))


def test_transcription_english(monkeypatch):
    model = Mock()
    model.tokenizer = Mock()
    model.transcribe.return_value = ['What do designers do?']
    monkeypatch.setattr(speech, 'speech_model', lambda: model)

    result = speech.transcribe_clip(wav(1.0))
    assert result == {'text': 'What do designers do?', 'language': 'en'}


def test_transcription_kannada(monkeypatch):
    model = Mock()
    model.tokenizer = Mock()
    model.transcribe.return_value = ['ಸಾಫ್ಟ್ವೇರ್ ಡೆವಲಪರ್ ಆಗಲು ಯಾವ ಮಾರ್ಗವಿದೆ?']
    monkeypatch.setattr(speech, 'speech_model', lambda: model)

    result = speech.transcribe_clip(wav(1.0))
    assert result['text'] == 'ಸಾಫ್ಟ್ವೇರ್ ಡೆವಲಪರ್ ಆಗಲು ಯಾವ ಮಾರ್ಗವಿದೆ?'
    assert result['language'] == 'kn'


def test_transcription_hindi(monkeypatch):
    model = Mock()
    model.tokenizer = Mock()
    model.transcribe.return_value = ['सॉफ्टवेयर इंजीनियर कैसे बनें?']
    monkeypatch.setattr(speech, 'speech_model', lambda: model)

    result = speech.transcribe_clip(wav(1.0))
    assert result['text'] == 'सॉफ्टवेयर इंजीनियर कैसे बनें?'
    assert result['language'] == 'hi'


def test_transcription_code_mixed(monkeypatch):
    model = Mock()
    model.tokenizer = Mock()
    model.transcribe.return_value = ['Software developer agoke 10th aadmele en madbeku?']
    monkeypatch.setattr(speech, 'speech_model', lambda: model)

    result = speech.transcribe_clip(wav(1.0))
    assert result['text'] == 'Software developer agoke 10th aadmele en madbeku?'
    assert result['language'] in {'en', 'kn'}


def test_transcription_empty_prediction_rejected(monkeypatch):
    model = Mock()
    model.tokenizer = Mock()
    model.transcribe.return_value = ['   ']
    monkeypatch.setattr(speech, 'speech_model', lambda: model)

    with pytest.raises(speech.AudioInputError, match='No clear speech'):
        speech.transcribe_clip(wav(1.0))


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
