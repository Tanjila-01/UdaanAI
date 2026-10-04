"""Bounded, in-memory multilingual speech transcription using faster-whisper."""
import io
import os
import re
from functools import lru_cache
from typing import Optional

from app.core.config import settings

MAX_AUDIO_BYTES = 4 * 1024 * 1024
MAX_SECONDS = 30
SAMPLE_RATE = 16000
MODEL_PATH = os.environ.get('SPEECH_MODEL_PATH', settings.SPEECH_MODEL_PATH)
REPO_ID = os.environ.get('SPEECH_MODEL_ID', settings.SPEECH_MODEL_ID)
DEVICE = os.environ.get('SPEECH_MODEL_DEVICE', settings.SPEECH_MODEL_DEVICE)
COMPUTE_TYPE = os.environ.get('SPEECH_MODEL_COMPUTE_TYPE', getattr(settings, 'SPEECH_MODEL_COMPUTE_TYPE', 'int8'))

SUPPORTED_VOICE_LANGUAGES = {'en'}


def normalize_voice_language(language: Optional[str]) -> str:
    value = (language or '').strip().lower()
    if value in ('en', 'english'):
        return 'en'
    raise ValueError('Unsupported voice language. Supported languages: en')


class AudioInputError(ValueError):
    pass


def decode_clip(data: bytes):
    import av  # type: ignore
    import numpy as np  # type: ignore
    parts, samples = [], 0
    try:
        with av.open(io.BytesIO(data), options={'protocol_whitelist': 'pipe'}) as clip:
            if not clip.streams.audio:
                raise AudioInputError('The recording has no audio.')
            resampler = av.AudioResampler(format='fltp', layout='mono', rate=SAMPLE_RATE)
            for frame in clip.decode(audio=0):
                for converted in resampler.resample(frame):
                    samples += converted.samples
                    if samples > SAMPLE_RATE * MAX_SECONDS:
                        raise AudioInputError('Please record no more than 30 seconds.')
                    parts.append(converted.to_ndarray().reshape(-1))
            for converted in resampler.resample(None):
                samples += converted.samples
                if samples > SAMPLE_RATE * MAX_SECONDS:
                    raise AudioInputError('Please record no more than 30 seconds.')
                parts.append(converted.to_ndarray().reshape(-1))
    except AudioInputError:
        raise
    except Exception as exc:
        raise AudioInputError('This recording could not be decoded. Please record again.') from exc
    if samples < SAMPLE_RATE // 4:
        raise AudioInputError('The recording is too short. Please try again.')
    audio = np.concatenate(parts).astype(np.float32)
    if np.max(np.abs(audio)) < 0.005:
        raise AudioInputError('No clear speech was detected. Please try again in a quieter place.')
    return audio


def detect_language(text: str) -> str:
    """Detect language from transcription text script."""
    # Kannada: 0x0C80 - 0x0CFF
    if re.search(r'[\u0c80-\u0cff]', text):
        return 'kn'
    # Devanagari (Hindi, Marathi): 0x0900 - 0x097F
    if re.search(r'[\u0900-\u097f]', text):
        return 'hi'
    # Latin / English
    if re.search(r'[a-zA-Z]', text):
        return 'en'
    return 'en'


@lru_cache(maxsize=1)
def speech_model():
    """Load faster-whisper WhisperModel as a cached singleton."""
    from faster_whisper import WhisperModel  # type: ignore

    model_path = os.environ.get('SPEECH_MODEL_PATH', settings.SPEECH_MODEL_PATH)
    repo_id = os.environ.get('SPEECH_MODEL_ID', settings.SPEECH_MODEL_ID)
    device = os.environ.get('SPEECH_MODEL_DEVICE', settings.SPEECH_MODEL_DEVICE)
    compute_type = os.environ.get('SPEECH_MODEL_COMPUTE_TYPE', getattr(settings, 'SPEECH_MODEL_COMPUTE_TYPE', 'int8')) or "int8"
    cpu_threads = min(4, os.cpu_count() or 4)

    # If local directory exists and is non-empty, load from it; else load by repo/model name
    model_source = model_path if (os.path.exists(model_path) and os.path.isdir(model_path) and os.listdir(model_path)) else repo_id
    target_device = "cuda" if device == "cuda" else "cpu"

    try:
        model = WhisperModel(
            model_source,
            device=target_device,
            compute_type=compute_type,
            cpu_threads=cpu_threads,
            download_root=model_path if not (os.path.exists(model_path) and os.path.isdir(model_path) and os.listdir(model_path)) else None,
        )
        return model
    except Exception as exc:
        raise RuntimeError(f"Could not load faster-whisper model from '{model_source}' on '{target_device}': {exc}") from exc


def transcribe_clip(data: bytes, language: Optional[str] = None):
    norm_lang = normalize_voice_language(language)
    audio = decode_clip(data)
    model = speech_model()

    segments, _ = model.transcribe(
        audio,
        language="en",
        task="transcribe",
        beam_size=1,
        word_timestamps=False,
    )
    text = " ".join(seg.text for seg in segments).strip()

    if not text:
        raise AudioInputError('No clear speech was detected. Please try again in a quieter place.')
    if len(text) > 1000:
        raise AudioInputError('Please record a shorter question, up to 1000 characters.')

    return {'text': text, 'language': 'en'}
