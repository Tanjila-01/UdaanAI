"""Bounded, in-memory English transcription. Model installation is explicit."""
import io
import os
from functools import lru_cache

MAX_AUDIO_BYTES = 4 * 1024 * 1024
MAX_SECONDS = 30
SAMPLE_RATE = 16000
MODEL_PATH = os.environ.get('SPEECH_MODEL_PATH', '/models/whisper-tiny-en')


class AudioInputError(ValueError):
    pass


def decode_clip(data):
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
    return np.concatenate(parts).astype(np.float32)


@lru_cache(maxsize=1)
def speech_model():
    from faster_whisper import WhisperModel
    # A local directory and local_files_only prevent downloads during student requests.
    return WhisperModel(MODEL_PATH, device='cpu', compute_type='int8', cpu_threads=2,
                        num_workers=1, local_files_only=True)


def transcribe_clip(data):
    audio = decode_clip(data)
    model = speech_model()
    segments, _ = model.transcribe(audio, language='en', beam_size=1, temperature=0,
                                   condition_on_previous_text=False, vad_filter=True,
                                   vad_parameters={'min_silence_duration_ms': 400})
    text = ' '.join(segment.text.strip() for segment in segments).strip()
    if not text:
        raise AudioInputError('No clear speech was detected. Please try again in a quieter place.')
    if len(text) > 1000:
        raise AudioInputError('Please record a shorter question, up to 1000 characters.')
    return {'text': text, 'language': 'en'}
