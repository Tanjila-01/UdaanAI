import time
import os
import torch  # type: ignore
from app.services.speech import speech_model, decode_clip  # type: ignore

torch.set_num_threads(min(8, os.cpu_count() or 4))
model = speech_model()
tok = model.tokenizer

samples = [
    ('sample_en1.mp3', 'Good morning, how do you do?', 'en'),
    ('sample_en2.mp3', 'What does a software developer do?', 'en'),
    ('sample_kn.mp3', 'ನಿನಗೆ ಕನ್ನಡ ಬರುತ್ತದೆಯೇ', 'kn'),
    ('sample_hi.mp3', 'आप कैसे हैं?', 'hi'),
    ('sample_mixed.mp3', 'ನನಗೆ CSE ಬಗ್ಗೆ information ಬೇಕು', 'kn'),
]

print(f"=== BENCHMARKING OPTIMIZED SHRUTAM-2 (Threads: {torch.get_num_threads()}) ===")
for filename, text, lang in samples:
    path = f"/tmp/audio_samples/{filename}"
    with open(path, 'rb') as f:
        data = f.read()

    t_start = time.time()
    audio = decode_clip(data)
    t_decode = time.time() - t_start

    t_enc_start = time.time()
    if lang == 'kn':
        prompt = "Transcribe speech to Kannada text."
    elif lang == 'hi':
        prompt = "Transcribe speech to Hindi text."
    else:
        prompt = "Transcribe speech."

    # Using optimized parameters: num_beams=1, max_new_tokens=40
    out = model.transcribe([audio], prompts=[prompt], tokenizer=tok, num_beams=1, max_new_tokens=40)
    t_total = time.time() - t_start
    result = out[0] if out else ''
    print(f"[{filename}] ({lang}) Total: {t_total:.2f}s (Decode: {t_decode*1000:.1f}ms) -> '{result}'")
