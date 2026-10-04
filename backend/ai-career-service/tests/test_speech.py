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


class MockSegment:
    def __init__(self, text: str):
        self.text = text


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
    model.transcribe.return_value = ([MockSegment('What do designers do?')], None)
    monkeypatch.setattr(speech, 'speech_model', lambda: model)

    result_en = speech.transcribe_clip(wav(1.0), language='en')
    assert result_en == {'text': 'What do designers do?', 'language': 'en'}
    assert model.transcribe.call_args.kwargs['language'] == 'en'
    assert model.transcribe.call_args.kwargs['task'] == 'transcribe'
    assert model.transcribe.call_args.kwargs['beam_size'] == 1
    assert 'prompts' not in model.transcribe.call_args.kwargs

    result_english = speech.transcribe_clip(wav(1.0), language='english')
    assert result_english == {'text': 'What do designers do?', 'language': 'en'}
    assert model.transcribe.call_args.kwargs['language'] == 'en'


def test_transcription_kannada_rejected():
    for lang in ('kn', 'kannada', 'KN', 'Kannada'):
        with pytest.raises(ValueError, match='Unsupported voice language. Supported languages: en'):
            speech.transcribe_clip(wav(1.0), language=lang)


def test_no_shrutam_prompts_sent(monkeypatch):
    model = Mock()
    model.transcribe.return_value = ([MockSegment('Career question')], None)
    monkeypatch.setattr(speech, 'speech_model', lambda: model)

    for lang in ('en', 'english'):
        speech.transcribe_clip(wav(1.0), language=lang)
        kwargs = model.transcribe.call_args.kwargs
        assert 'prompts' not in kwargs
        assert kwargs['language'] == 'en'


def test_transcription_unsupported_languages_rejected():
    for invalid_lang in ('kn', 'kannada', 'hi', 'hindi', 'ta', 'te', 'ml', 'mr', 'bn', 'gu', 'or', 'pa', 'ur', 'as', 'fr', 'de', 'es', 'random', '', None):
        with pytest.raises(ValueError, match='Unsupported voice language. Supported languages: en'):
            speech.transcribe_clip(wav(1.0), language=invalid_lang)


def test_transcription_empty_prediction_rejected(monkeypatch):
    model = Mock()
    model.transcribe.return_value = ([MockSegment('   ')], None)
    monkeypatch.setattr(speech, 'speech_model', lambda: model)

    with pytest.raises(speech.AudioInputError, match='No clear speech'):
        speech.transcribe_clip(wav(1.0), language='en')


def test_model_singleton():
    """Verify that speech_model() caches the instance and does not reload on every call."""
    mock_instance = Mock()
    with pytest.MonkeyPatch.context() as mp:
        factory = Mock(return_value=mock_instance)
        mp.setattr('faster_whisper.WhisperModel', factory)
        speech.speech_model.cache_clear()
        first = speech.speech_model()
        second = speech.speech_model()
        assert first is second
        assert factory.call_count == 1
        speech.speech_model.cache_clear()


def test_consecutive_recordings_en(client, monkeypatch):
    """Verify consecutive recordings in English on the same model."""
    call_log = []

    def mock_transcribe(data, language=None):
        call_log.append(language)
        return {'text': f'English question {len(call_log)}', 'language': 'en'}

    monkeypatch.setattr(route, 'transcribe_clip', mock_transcribe)

    # 1. English
    res1 = client.post('/career-intelligence/speech/transcribe?language=en', content=wav(), headers={'Content-Type': 'audio/wav'})
    assert res1.status_code == 200
    assert res1.json() == {'text': 'English question 1', 'language': 'en'}

    # 2. English (english alias)
    res2 = client.post('/career-intelligence/speech/transcribe?language=english', content=wav(), headers={'Content-Type': 'audio/wav'})
    assert res2.status_code == 200
    assert res2.json() == {'text': 'English question 2', 'language': 'en'}

    # 3. English again
    res3 = client.post('/career-intelligence/speech/transcribe?language=en', content=wav(), headers={'Content-Type': 'audio/wav'})
    assert res3.status_code == 200
    assert res3.json() == {'text': 'English question 3', 'language': 'en'}

    assert call_log == ['en', 'en', 'en']


def test_upload_limits_and_formats(client):
    path = '/career-intelligence/speech/transcribe?language=en'
    assert client.post(path, content=wav(), headers={'Content-Type': 'application/json'}).status_code == 415
    assert client.post(path, content=b'', headers={'Content-Type': 'audio/wav'}).status_code == 422
    assert client.post(path, content=b'x' * (speech.MAX_AUDIO_BYTES + 1), headers={'Content-Type': 'audio/webm'}).status_code == 413


def test_errors_do_not_leak_and_capacity_releases(client, monkeypatch):
    path = '/career-intelligence/speech/transcribe?language=en'
    monkeypatch.setattr(route, 'transcribe_clip', Mock(side_effect=RuntimeError('/private/path')))
    result = client.post(path, content=wav(), headers={'Content-Type': 'audio/wav'})
    assert result.status_code == 503
    assert '/private/path' not in result.text
    monkeypatch.setattr(route, 'transcribe_clip', lambda data, language=None: {'text': 'Career question', 'language': 'en'})
    assert client.post(path, content=wav(), headers={'Content-Type': 'audio/wav'}).json()['text'] == 'Career question'


def test_busy_capacity_is_shared_with_answers(client):
    assert route.capacity.acquire(blocking=False)
    try:
        response = client.post('/career-intelligence/speech/transcribe?language=en', content=wav(), headers={'Content-Type': 'audio/wav'})
        assert response.status_code == 429
        assert response.headers['Retry-After'] == '10'
    finally:
        route.capacity.release()


def test_route_language_validation_and_normalization(client, monkeypatch):
    captured = {}

    def mock_transcribe(data, language=None):
        captured['language'] = language
        return {'text': 'Parsed speech', 'language': language}

    monkeypatch.setattr(route, 'transcribe_clip', mock_transcribe)

    # Valid: en
    res_en = client.post('/career-intelligence/speech/transcribe?language=en', content=wav(), headers={'Content-Type': 'audio/wav'})
    assert res_en.status_code == 200
    assert captured['language'] == 'en'

    # Valid normalized: english -> en
    res_english = client.post('/career-intelligence/speech/transcribe?language=english', content=wav(), headers={'Content-Type': 'audio/wav'})
    assert res_english.status_code == 200
    assert captured['language'] == 'en'

    # Kannada must return 400 (English-only)
    for kn_lang in ('kn', 'kannada'):
        res_kn = client.post(f'/career-intelligence/speech/transcribe?language={kn_lang}', content=wav(), headers={'Content-Type': 'audio/wav'})
        assert res_kn.status_code == 400
        assert res_kn.json()['detail'] == 'Unsupported voice language. Supported languages: en'

    # Invalid languages must return 400 with expected error detail
    for bad_lang in ('hi', 'hindi', 'ta', 'te', 'ml', 'fr', 'es', 'random_lang'):
        res_bad = client.post(f'/career-intelligence/speech/transcribe?language={bad_lang}', content=wav(), headers={'Content-Type': 'audio/wav'})
        assert res_bad.status_code == 400
        assert res_bad.json()['detail'] == 'Unsupported voice language. Supported languages: en'

    # Missing language query param must return 400
    res_missing = client.post('/career-intelligence/speech/transcribe', content=wav(), headers={'Content-Type': 'audio/wav'})
    assert res_missing.status_code == 400
    assert res_missing.json()['detail'] == 'Unsupported voice language. Supported languages: en'

    # Empty language query param must return 400
    res_empty = client.post('/career-intelligence/speech/transcribe?language=', content=wav(), headers={'Content-Type': 'audio/wav'})
    assert res_empty.status_code == 400
    assert res_empty.json()['detail'] == 'Unsupported voice language. Supported languages: en'


def test_kannada_language_rejected_regression():
    """Regression test confirming Kannada is rejected when voice transcription is restricted to English-only."""
    with pytest.raises(ValueError, match='Unsupported voice language. Supported languages: en'):
        speech.transcribe_clip(wav(1.0), language='kn')


def test_speech_model_vasista_ct2_config():
    """Verify that speech configuration points to the validated Vasista CT2 INT8 model."""
    from app.core.config import settings
    assert settings.SPEECH_MODEL_ID == "vasista22/whisper-kannada-small"
    assert settings.SPEECH_MODEL_PATH == "/models/whisper-kannada-small-ct2-int8"
    assert settings.SPEECH_MODEL_DEVICE == "cpu"
    assert settings.SPEECH_MODEL_COMPUTE_TYPE == "int8"

