"""Bounded, in-memory multilingual speech transcription using BharatGenAI Shrutam-2.

LICENSING NOTICE:
BharatGenAI Shrutam-2 is released under the BharatGen Non-Commercial License.
Commercial deployment requires compliance with the official BharatGen authorization/license terms.
(Developed under NM-ICPS, Department of Science and Technology, Government of India).
"""
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


class AudioInputError(ValueError):
    pass


def decode_clip(data: bytes):
    import av
    import numpy as np
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
    # Tamil: 0x0B80 - 0x0BFF
    if re.search(r'[\u0b80-\u0bff]', text):
        return 'ta'
    # Telugu: 0x0C00 - 0x0C7F
    if re.search(r'[\u0c00-\u0c7f]', text):
        return 'te'
    # Malayalam: 0x0D00 - 0x0D7F
    if re.search(r'[\u0d00-\u0d7f]', text):
        return 'ml'
    # Bengali: 0x0980 - 0x09FF
    if re.search(r'[\u0980-\u09ff]', text):
        return 'bn'
    # Gujarati: 0x0A80 - 0x0AFF
    if re.search(r'[\u0a80-\u0aff]', text):
        return 'gu'
    # Gurmukhi (Punjabi): 0x0A00 - 0x0A7F
    if re.search(r'[\u0a00-\u0a7f]', text):
        return 'pa'
    # Odia: 0x0B00 - 0x0B7F
    if re.search(r'[\u0b00-\u0b7f]', text):
        return 'or'
    # Arabic/Urdu: 0x0600 - 0x06FF
    if re.search(r'[\u0600-\u06ff]', text):
        return 'ur'
    # Latin / English
    if re.search(r'[a-zA-Z]', text):
        return 'en'
    return 'en'


@lru_cache(maxsize=1)
def speech_model():
    """Load BharatGenAI Shrutam-2 model and tokenizer with CPU thread tuning and token bounds."""
    import torch
    from transformers import AutoModel, AutoTokenizer

    # Optimal CPU concurrency: 4 threads avoids core thrashing and context switching
    if not torch.cuda.is_available():
        torch.set_num_threads(min(4, os.cpu_count() or 4))

    model_source = MODEL_PATH if (os.path.exists(MODEL_PATH) and os.path.isdir(MODEL_PATH)) else REPO_ID
    target_device = "cuda" if (DEVICE == "auto" and torch.cuda.is_available()) or DEVICE == "cuda" else "cpu"

    try:
        tokenizer = AutoTokenizer.from_pretrained(model_source, trust_remote_code=True)
        model = AutoModel.from_pretrained(model_source, trust_remote_code=True)
        model.to(target_device)
        model.eval()
        model.tokenizer = tokenizer

        # Safe tokenizer patch for transformers v5+
        def _safe_tokenize(self, prompt: str, tok):
            conversation = [{"content": prompt, "role": "user"}]
            res = tok.apply_chat_template(conversation, tokenize=True, add_generation_prompt=True, return_dict=False)
            if isinstance(res, dict) or hasattr(res, "input_ids"):
                prompt_ids = res["input_ids"]
            else:
                prompt_ids = res
            prompt_length = len(prompt_ids)
            prompt_ids = torch.tensor(prompt_ids, dtype=torch.int64)
            return prompt_ids, prompt_length

        model.__class__._tokenize = _safe_tokenize
        return model
    except Exception as exc:
        raise RuntimeError(f"Could not load Shrutam-2 model from '{model_source}' on '{target_device}': {exc}") from exc


def transcribe_clip(data: bytes, language: Optional[str] = None):
    audio = decode_clip(data)
    model = speech_model()
    tokenizer = getattr(model, "tokenizer", None)

    # Shrutam-2 prompt steering
    lang_code = (language or '').strip().lower()
    if lang_code in ('kn', 'kannada'):
        prompt = "Transcribe speech to Kannada text."
        steered_lang = 'kn'
    elif lang_code in ('hi', 'hindi'):
        prompt = "Transcribe speech to Hindi text."
        steered_lang = 'hi'
    elif lang_code in ('en', 'english'):
        prompt = "Transcribe speech to English text."
        steered_lang = 'en'
    else:
        prompt = "Transcribe speech."
        steered_lang = None

    # Optimized generation: greedy search (num_beams=1), early stop tokens, bounded max_new_tokens=48
    predictions = model.transcribe(
        [audio],
        prompts=[prompt],
        tokenizer=tokenizer,
        num_beams=1,
        max_new_tokens=48
    )
    text = predictions[0].strip() if predictions else ""
    if not text:
        raise AudioInputError('No clear speech was detected. Please try again in a quieter place.')
    if len(text) > 1000:
        raise AudioInputError('Please record a shorter question, up to 1000 characters.')

    detected_lang = steered_lang or detect_language(text)
    return {'text': text, 'language': detected_lang}
