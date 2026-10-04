import os
import re
import sys
import time
import psutil
from faster_whisper import WhisperModel
from app.services.speech import decode_clip, SAMPLE_RATE

def get_ram_mb():
    return psutil.Process(os.getpid()).memory_info().rss / (1024 * 1024)

def check_kannada_unicode(text):
    kn_chars = re.findall(r'[\u0c80-\u0cff]', text)
    latin_chars = re.findall(r'[a-zA-Z]', text)
    other_chars = re.findall(r'[^\s\w\d]', text)
    return len(kn_chars), len(latin_chars)

def run_benchmark():
    print("=" * 70)
    print("BENCHMARK: Systran/faster-whisper-small (CPU, int8, beam_size=1)")
    print("=" * 70)

    ram_initial = get_ram_mb()
    print(f"Initial process RAM: {ram_initial:.2f} MB")

    # 1. Cold model load time (downloads/initializes model)
    print("\n[1] Measuring Cold Model Load...")
    t0 = time.perf_counter()
    model = WhisperModel(
        "small",
        device="cpu",
        compute_type="int8",
        cpu_threads=min(4, os.cpu_count() or 4),
        download_root="/models/whisper-small"
    )
    cold_load_time = time.perf_counter() - t0
    ram_after_cold = get_ram_mb()
    print(f"Cold model load time: {cold_load_time:.3f} s")
    print(f"RAM after load: {ram_after_cold:.2f} MB (Delta: {ram_after_cold - ram_initial:+.2f} MB)")

    # 2. Cached model load time
    print("\n[2] Measuring Cached Model Load...")
    t0 = time.perf_counter()
    model_cached = WhisperModel(
        "small",
        device="cpu",
        compute_type="int8",
        cpu_threads=min(4, os.cpu_count() or 4),
        download_root="/models/whisper-small"
    )
    cached_load_time = time.perf_counter() - t0
    print(f"Cached model load time: {cached_load_time:.3f} s")

    # 3. Model storage size
    model_dir = "/models/whisper-small"
    total_size_bytes = 0
    if os.path.exists(model_dir):
        for root, dirs, files in os.walk(model_dir):
            for f in files:
                total_size_bytes += os.path.getsize(os.path.join(root, f))
    print(f"Model storage size on disk: {total_size_bytes / (1024 * 1024):.2f} MB")

    samples = [
        {"name": "English Sample 1", "file": "english_sample1.wav", "lang": "en"},
        {"name": "English Sample 2", "file": "english_sample2.wav", "lang": "en"},
        {"name": "Kannada Sample", "file": "sample_kn.mp3", "lang": "kn"},
        {"name": "Mixed Kannada Sample", "file": "sample_mixed.mp3", "lang": "kn"},
    ]

    for s in samples:
        path = os.path.join("/app/test_samples", s["file"])
        with open(path, "rb") as f:
            s["bytes"] = f.read()
        audio = decode_clip(s["bytes"])
        s["duration"] = len(audio) / SAMPLE_RATE

    # Warm-up run
    print("\n[3] Warming up model with English Sample 1...")
    audio_warm = decode_clip(samples[0]["bytes"])
    _ = list(model.transcribe(audio_warm, language="en", task="transcribe", beam_size=1, word_timestamps=False)[0])
    print("Warm-up complete.")

    results = []
    print("\n[4] Running 3 warm evaluation passes per sample...")

    for s in samples:
        print(f"\n--- Evaluating {s['name']} (Language: {s['lang']}, Duration: {s['duration']:.2f}s) ---")
        runs = []
        for run_idx in range(1, 4):
            t_start = time.perf_counter()
            t_pre_0 = time.perf_counter()
            audio = decode_clip(s["bytes"])
            t_pre = time.perf_counter() - t_pre_0

            t_inf_0 = time.perf_counter()
            segments, info = model.transcribe(
                audio,
                language=s["lang"],
                task="transcribe",
                beam_size=1,
                word_timestamps=False,
            )
            transcript = " ".join(seg.text for seg in segments).strip()
            t_inf = time.perf_counter() - t_inf_0
            t_total = time.perf_counter() - t_start
            ram = get_ram_mb()

            print(f"  Run {run_idx}: Pre: {t_pre*1000:.1f}ms | Inf: {t_inf:.3f}s | Total: {t_total:.3f}s | RAM: {ram:.1f}MB")
            runs.append({
                "run": run_idx,
                "pre": t_pre,
                "inf": t_inf,
                "total": t_total,
                "ram": ram,
                "transcript": transcript,
            })

        avg_pre = sum(r["pre"] for r in runs) / len(runs)
        avg_inf = sum(r["inf"] for r in runs) / len(runs)
        avg_total = sum(r["total"] for r in runs) / len(runs)
        peak_ram = max(r["ram"] for r in runs)
        final_transcript = runs[-1]["transcript"]
        kn_count, lat_count = check_kannada_unicode(final_transcript)

        results.append({
            "name": s["name"],
            "lang": s["lang"],
            "duration": s["duration"],
            "avg_pre": avg_pre,
            "avg_inf": avg_inf,
            "avg_total": avg_total,
            "rtf": avg_inf / s["duration"] if s["duration"] > 0 else 0,
            "peak_ram": peak_ram,
            "transcript": final_transcript,
            "kn_chars": kn_count,
            "latin_chars": lat_count,
        })

    print("\n" + "=" * 70)
    print("DETAILED PERFORMANCE SUMMARY TABLE")
    print("=" * 70)
    print(f"{'Sample':<22} | {'Lang':<5} | {'Duration':<9} | {'Inference':<10} | {'Total Time':<10} | {'RTF':<6} | {'Peak RAM':<9}")
    print("-" * 78)
    for r in results:
        print(f"{r['name']:<22} | {r['lang']:<5} | {r['duration']:>7.2f}s | {r['avg_inf']:>8.3f}s | {r['avg_total']:>8.3f}s | {r['rtf']:>5.2f}x | {r['peak_ram']:>7.1f}MB")

    print("\n" + "=" * 70)
    print("TRANSCRIPTS & SCRIPT EVALUATION")
    print("=" * 70)
    for r in results:
        has_kannada_script = r["kn_chars"] > 0
        has_latin_script = r["latin_chars"] > 0
        print(f"Sample: {r['name']} [Lang: {r['lang']}]")
        print(f"  Transcript: \"{r['transcript']}\"")
        print(f"  Kannada Unicode chars (U+0C80-U+0CFF): {r['kn_chars']}")
        print(f"  Latin letters (A-Z, a-z): {r['latin_chars']}")
        if r['lang'] == 'kn':
            if r['kn_chars'] > 0 and r['latin_chars'] == 0:
                print("  Script Assessment: Native Kannada Script Only")
            elif r['kn_chars'] > 0 and r['latin_chars'] > 0:
                print("  Script Assessment: Mixed Kannada + Latin Script")
            else:
                print("  Script Assessment: NO KANNADA SCRIPT DETECTED (Latin or corrupted transliteration)")
        print()

    print("=" * 70)
    print("LOAD TIME & STORAGE SUMMARY")
    print("=" * 70)
    print(f"Cold load time:   {cold_load_time:.3f} s")
    print(f"Cached load time: {cached_load_time:.3f} s")
    print(f"Disk storage:     {total_size_bytes / (1024 * 1024):.2f} MB")
    print(f"RAM baseline:     {ram_initial:.2f} MB")
    print(f"RAM post-load:    {ram_after_cold:.2f} MB (+{ram_after_cold - ram_initial:.2f} MB)")
    print(f"RAM peak:         {max(r['peak_ram'] for r in results):.2f} MB")

if __name__ == '__main__':
    run_benchmark()
