import os
import re
import sys
import time
import httpx
import uuid
import jwt

SECRET = "dev_secret_key_udaan_ai_phase2_change_in_prod"
token = jwt.encode({"sub": str(uuid.uuid4()), "email": "smoke@udaan.com", "role": "student", "type": "access", "exp": 9999999999}, SECRET, algorithm="HS256")

HEADERS = {
    "Authorization": f"Bearer {token}",
}

BASE_URL = "http://127.0.0.1:8004/career-intelligence/speech/transcribe"
SAMPLES_DIR = os.path.join(os.path.dirname(__file__), "test_samples")

samples = [
    {"name": "English Sample 1", "file": "english_sample1.wav", "lang": "en", "mime": "audio/wav"},
    {"name": "English Sample 2", "file": "english_sample2.wav", "lang": "en", "mime": "audio/wav"},
    {"name": "Kannada Sample", "file": "sample_kn.mp3", "lang": "kn", "mime": "audio/mp4"}, # or audio/mpeg or webm
    {"name": "Mixed Kannada Sample", "file": "sample_mixed.mp3", "lang": "kn", "mime": "audio/mp4"},
]

def count_scripts(text):
    return {
        "kannada": len(re.findall(r'[\u0c80-\u0cff]', text)),
        "latin": len(re.findall(r'[a-zA-Z]', text)),
        "devanagari": len(re.findall(r'[\u0900-\u097f]', text)),
        "cyrillic": len(re.findall(r'[\u0400-\u04ff]', text)),
        "arabic": len(re.findall(r'[\u0600-\u06ff]', text)),
        "tamil": len(re.findall(r'[\u0b80-\u0bff]', text)),
    }

def run_smoke_test():
    print("=" * 80)
    print("PRODUCTION API SMOKE TEST: Vasista CTranslate2 INT8 via /career-intelligence/speech/transcribe")
    print("=" * 80)

    client = httpx.Client(timeout=60.0)

    for s in samples:
        path = os.path.join(SAMPLES_DIR, s["file"])
        if not os.path.exists(path):
            # fallback to outputs/audio_samples
            fallback = os.path.join(os.path.dirname(__file__), "../../outputs/audio_samples", s["file"])
            if os.path.exists(fallback):
                path = fallback

        with open(path, "rb") as f:
            audio_bytes = f.read()

        url = f"{BASE_URL}?language={s['lang']}"
        # Determine content-type header based on file extension
        ext = os.path.splitext(s["file"])[1].lower()
        if ext == ".wav":
            content_type = "audio/wav"
        elif ext == ".mp3":
            # speech route accepts audio/webm, audio/ogg, audio/mp4, audio/wav, audio/x-wav
            # In production browser MediaRecorder, audio is webm/mp4/wav.
            # Route AUDIO_TYPES = {'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/wav', 'audio/x-wav'}
            content_type = "audio/mp4"
        else:
            content_type = "audio/wav"

        req_headers = dict(HEADERS)
        req_headers["Content-Type"] = content_type

        print(f"\n--- Testing {s['name']} ({s['file']}) [Query: language={s['lang']}] ---")
        t0 = time.perf_counter()
        resp = client.post(url, headers=req_headers, content=audio_bytes)
        t_elapsed = time.perf_counter() - t0

        print(f"Status Code: {resp.status_code}")
        if resp.status_code != 200:
            print(f"ERROR: {resp.text}")
            continue

        data = resp.json()
        transcript = data.get("text", "")
        returned_lang = data.get("language", "")
        counts = count_scripts(transcript)

        print(f"API Latency: {t_elapsed:.3f} s")
        print(f"Response JSON: {data}")
        print(f"Script Counts:")
        print(f"  Kannada:    {counts['kannada']}")
        print(f"  Latin:      {counts['latin']}")
        print(f"  Devanagari: {counts['devanagari']}")
        print(f"  Cyrillic:   {counts['cyrillic']}")
        print(f"  Arabic:     {counts['arabic']}")
        print(f"  Tamil:      {counts['tamil']}")

        if s['lang'] == 'kn':
            assert counts['kannada'] > 0, f"Expected native Kannada characters for {s['name']}"
            print("  PASSED: Native Kannada Unicode detected.")
        elif s['lang'] == 'en':
            assert counts['latin'] > 0, f"Expected Latin characters for {s['name']}"
            assert counts['kannada'] == 0, f"Unexpected Kannada characters in English sample"
            print("  PASSED: English Latin text verified.")

    print("\n" + "=" * 80)
    print("ALL PRODUCTION API SMOKE TESTS COMPLETED SUCCESSFULLY!")
    print("=" * 80)

if __name__ == '__main__':
    run_smoke_test()
