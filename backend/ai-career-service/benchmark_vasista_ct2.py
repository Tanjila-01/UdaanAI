import os
import re
import sys
import time
import psutil
from faster_whisper import WhisperModel
from app.services.speech import decode_clip, SAMPLE_RATE

def get_ram_mb():
    return psutil.Process(os.getpid()).memory_info().rss / (1024 * 1024)

def count_scripts(text):
    return {
        "kannada": len(re.findall(r'[\u0c80-\u0cff]', text)),
        "latin": len(re.findall(r'[a-zA-Z]', text)),
        "devanagari": len(re.findall(r'[\u0900-\u097f]', text)),
        "cyrillic": len(re.findall(r'[\u0400-\u04ff]', text)),
        "arabic": len(re.findall(r'[\u0600-\u06ff]', text)),
        "tamil": len(re.findall(r'[\u0b80-\u0bff]', text)),
    }

def run_benchmark():
    model_path = "/models/whisper-kannada-small-ct2-int8"
    cpu_threads = min(4, os.cpu_count() or 4)

    print("=" * 80)
    print("BENCHMARK: vasista22/whisper-kannada-small (CTranslate2 INT8, CPU)")
    print("=" * 80)

    ram_initial = get_ram_mb()
    print(f"Initial process RAM: {ram_initial:.2f} MB")
    print(f"CPU threads configured: {cpu_threads}")

    # 1. Cold model load time
    print(f"\n[1] Measuring Cold Model Load from {model_path}...")
    t0 = time.perf_counter()
    model = WhisperModel(
        model_path,
        device="cpu",
        compute_type="int8",
        cpu_threads=cpu_threads,
    )
    cold_load_time = time.perf_counter() - t0
    ram_after_cold = get_ram_mb()
    print(f"Cold model load time: {cold_load_time:.3f} s")
    print(f"RAM after load: {ram_after_cold:.2f} MB (Delta: {ram_after_cold - ram_initial:+.2f} MB)")

    # 2. Cached model load time
    print("\n[2] Measuring Cached Model Load...")
    t0 = time.perf_counter()
    model_cached = WhisperModel(
        model_path,
        device="cpu",
        compute_type="int8",
        cpu_threads=cpu_threads,
    )
    cached_load_time = time.perf_counter() - t0
    print(f"Cached model load time: {cached_load_time:.3f} s")

    # 3. Model storage size
    total_size_bytes = 0
    if os.path.exists(model_path):
        for root, dirs, files in os.walk(model_path):
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
        print(f"\n--- Evaluating {s['name']} (Language requested: {s['lang']}, Duration: {s['duration']:.2f}s) ---")
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

            print(f"  Run {run_idx}: Pre: {t_pre*1000:.1f}ms | Inf: {t_inf:.3f}s | Total: {t_total:.3f}s | RAM: {ram:.1f}MB | Transcript: \"{transcript}\"")
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
        counts = count_scripts(final_transcript)

        results.append({
            "name": s["name"],
            "file": s["file"],
            "lang": s["lang"],
            "duration": s["duration"],
            "avg_pre": avg_pre,
            "avg_inf": avg_inf,
            "avg_total": avg_total,
            "rtf": avg_inf / s["duration"] if s["duration"] > 0 else 0,
            "peak_ram": peak_ram,
            "transcript": final_transcript,
            "counts": counts,
        })

    print("\n" + "=" * 80)
    print("DETAILED PERFORMANCE SUMMARY TABLE")
    print("=" * 80)
    print(f"{'Sample':<22} | {'Lang':<5} | {'Duration':<9} | {'Pre (ms)':<9} | {'Inference':<10} | {'Total Time':<10} | {'RTF':<6} | {'Peak RAM':<9}")
    print("-" * 92)
    for r in results:
        print(f"{r['name']:<22} | {r['lang']:<5} | {r['duration']:>7.2f}s | {r['avg_pre']*1000:>7.1f}ms | {r['avg_inf']:>8.3f}s | {r['avg_total']:>8.3f}s | {r['rtf']:>5.2f}x | {r['peak_ram']:>7.1f}MB")

    print("\n" + "=" * 80)
    print("TRANSCRIPTS & SCRIPT DECOMPOSITION")
    print("=" * 80)
    for r in results:
        c = r["counts"]
        print(f"Sample: {r['name']} ({r['file']}) [Lang: {r['lang']}]")
        print(f"  Exact Transcript: \"{r['transcript']}\"")
        print(f"  Character Counts:")
        print(f"    - Kannada (U+0C80-U+0CFF): {c['kannada']}")
        print(f"    - Latin (a-zA-Z):          {c['latin']}")
        print(f"    - Devanagari:              {c['devanagari']}")
        print(f"    - Cyrillic:                {c['cyrillic']}")
        print(f"    - Arabic:                  {c['arabic']}")
        print(f"    - Tamil:                   {c['tamil']}")
        print()

    print("=" * 80)
    print("MODEL METRICS & MEMORY")
    print("=" * 80)
    print(f"Cold model load time:   {cold_load_time:.3f} s")
    print(f"Cached model load time: {cached_load_time:.3f} s")
    print(f"Disk storage:           {total_size_bytes / (1024 * 1024):.2f} MB")
    print(f"RAM baseline:           {ram_initial:.2f} MB")
    print(f"RAM post-load:          {ram_after_cold:.2f} MB (+{ram_after_cold - ram_initial:.2f} MB)")
    print(f"RAM peak:               {max(r['peak_ram'] for r in results):.2f} MB")

if __name__ == '__main__':
    run_benchmark()
