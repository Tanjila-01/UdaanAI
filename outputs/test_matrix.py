import time
import os
import json
import torch
from app.services.speech import speech_model, decode_clip

model = speech_model()
tok = model.tokenizer

samples = [
    ('sample_en1.mp3', 'English 1: Good morning, how do you do?'),
    ('sample_en2.mp3', 'English 2: What does a software developer do?'),
    ('sample_kn.mp3', 'Kannada: Ninage Kannada baruttadeye'),
    ('sample_hi.mp3', 'Hindi: Aap kaise hain?'),
    ('sample_mixed.mp3', 'Mixed: Nanage CSE bagge information beku')
]

prompts_to_test = [
    ("Transcribe speech.", "default_generic"),
    ("Transcribe speech to English text.", "explicit_english"),
    ("Transcribe speech to Kannada text.", "explicit_kannada"),
    ("Transcribe speech to Hindi text.", "explicit_hindi"),
    ("Transcribe speech in English.", "in_english"),
    ("Transcribe speech in the spoken language.", "spoken_lang"),
]

results = []

for fname, desc in samples:
    path = os.path.join('/tmp/audio_samples', fname)
    with open(path, 'rb') as f:
        audio = decode_clip(f.read())
    print(f"\n=======================================================", flush=True)
    print(f"AUDIO: {desc} ({len(audio)} samples, {len(audio)/16000:.2f}s)", flush=True)
    print(f"=======================================================", flush=True)
    
    for prompt, tag in prompts_to_test:
        t0 = time.time()
        # Test max_new_tokens=48
        out = model.transcribe([audio], prompts=[prompt], tokenizer=tok, num_beams=1, max_new_tokens=48)
        dur = time.time() - t0
        text = out[0] if out else ""
        print(f"[{tag}] Prompt: '{prompt}'", flush=True)
        print(f"        Output: {text}", flush=True)
        print(f"        Time:   {dur:.2f}s", flush=True)
        results.append({
            'sample': fname,
            'desc': desc,
            'tag': tag,
            'prompt': prompt,
            'output': text,
            'time': round(dur, 2)
        })

with open('/tmp/matrix_results.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print("\nFinished all tests. Saved to /tmp/matrix_results.json", flush=True)
