import time
import sys
from app.services.speech import speech_model, decode_clip  # type: ignore

with open('/tmp/english_sample1.wav', 'rb') as f:
    audio1 = decode_clip(f.read())
with open('/tmp/english_sample2.wav', 'rb') as f:
    audio2 = decode_clip(f.read())

model = speech_model()
tok = model.tokenizer

prompts = [
    'Transcribe speech.',
    'Transcribe speech to English text.',
    'Transcribe speech to Hindi text.',
    'Transcribe speech to Kannada text.',
    'Transcribe the speech exactly as spoken.'
]

print('=== TESTING SAMPLE 1: Good morning, how do you do? ===', flush=True)
for p in prompts:
    t0 = time.time()
    out = model.transcribe([audio1], prompts=[p], tokenizer=tok, num_beams=1, max_new_tokens=48)
    dur = time.time() - t0
    # Safe printing of any script
    text = out[0] if out else ''
    print(f'Prompt: "{p}" -> Result: {text} ({dur:.2f}s)', flush=True)

print('=== TESTING SAMPLE 2: What does a software developer do? ===', flush=True)
for p in ['Transcribe speech.', 'Transcribe speech to English text.']:
    t0 = time.time()
    out = model.transcribe([audio2], prompts=[p], tokenizer=tok, num_beams=1, max_new_tokens=48)
    dur = time.time() - t0
    text = out[0] if out else ''
    print(f'Prompt: "{p}" -> Result: {text} ({dur:.2f}s)', flush=True)
