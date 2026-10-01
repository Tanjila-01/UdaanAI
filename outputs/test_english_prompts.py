import time
import os
import torch
from app.services.speech import speech_model, decode_clip

model = speech_model()
tok = model.tokenizer

with open('/tmp/audio_samples/sample_en1.mp3', 'rb') as f:
    audio1 = decode_clip(f.read())
with open('/tmp/audio_samples/sample_en2.mp3', 'rb') as f:
    audio2 = decode_clip(f.read())

test_prompts = [
    "Transcribe speech to English text in Latin script.",
    "Transcribe speech to English text using English letters.",
    "Transcribe speech into English Latin script. Do not use Devanagari.",
    "Transcribe the following English audio into English text.",
    "Speech to text (English):",
    "Transcribe:",
    "Please transcribe this English speech:",
    "Transcribe speech to English text."
]

print("=== TESTING PROMPTS FOR ENGLISH LATIN SCRIPT ===", flush=True)
for p in test_prompts:
    t0 = time.time()
    out = model.transcribe([audio1], prompts=[p], tokenizer=tok, num_beams=1, max_new_tokens=32)
    dur = time.time() - t0
    text = out[0] if out else ""
    print(f"Prompt: {repr(p)}", flush=True)
    print(f" -> Output: {repr(text)} ({dur:.2f}s)", flush=True)
