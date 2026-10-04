import os
import sys
import time
import psutil
from app.services.speech import speech_model, decode_clip, transcribe_clip, SAMPLE_RATE

def get_ram_mb():
    process = psutil.Process(os.getpid())
    return process.memory_info().rss / (1024 * 1024)

def benchmark():
    print("=" * 60)
    print("UDAANAI SPEECH BENCHMARK: FASTER-WHISPER MULTILINGUAL BASE")
    print("=" * 60)

    ram_initial = get_ram_mb()
    print(f"Initial process RAM: {ram_initial:.2f} MB")

    # 1. Cold model load time
    t0 = time.perf_counter()
    model = speech_model()
    load_time = time.perf_counter() - t0
    ram_after_load = get_ram_mb()
    print(f"Cold model load time: {load_time:.3f} s")
    print(f"RAM after model load: {ram_after_load:.2f} MB (Delta: {ram_after_load - ram_initial:+.2f} MB)")

    samples = [
        {"name": "English Sample 1", "path": "/app/test_samples/english_sample1.wav", "lang": "en"},
        {"name": "Kannada Sample", "path": "/app/test_samples/sample_kn.mp3", "lang": "kn"},
    ]

    # Pre-read audio bytes
    for s in samples:
        with open(s["path"], "rb") as f:
            s["bytes"] = f.read()
        audio = decode_clip(s["bytes"])
        s["duration"] = len(audio) / SAMPLE_RATE

    # Warm-up run
    print("\nWarming up model...")
    speech_model()
    _ = transcribe_clip(samples[0]["bytes"], language=samples[0]["lang"])
    print("Warm-up complete.")

    results = []
    print("\nRunning benchmarks (3 runs per sample)...")
    for s in samples:
        print(f"\nEvaluating: {s['name']} (Language: {s['lang']}, Audio Duration: {s['duration']:.2f}s)")
        runs = []
        for run_idx in range(1, 4):
            ram_before = get_ram_mb()
            t_start = time.perf_counter()
            t_pre_start = time.perf_counter()
            audio = decode_clip(s["bytes"])
            t_pre = time.perf_counter() - t_pre_start

            t_inf_start = time.perf_counter()
            segments, _ = model.transcribe(
                audio,
                language=s["lang"],
                task="transcribe",
                beam_size=1,
                word_timestamps=False,
            )
            transcript = " ".join(seg.text for seg in segments).strip()
            t_inf = time.perf_counter() - t_inf_start
            t_total = time.perf_counter() - t_start
            ram_after = get_ram_mb()

            print(f"  Run {run_idx}: Pre: {t_pre*1000:.1f}ms | Inf: {t_inf:.3f}s | Total: {t_total:.3f}s | RAM: {ram_after:.1f}MB")
            runs.append({
                "run": run_idx,
                "pre_time": t_pre,
                "inf_time": t_inf,
                "total_time": t_total,
                "ram": ram_after,
                "transcript": transcript,
            })

        avg_inf = sum(r["inf_time"] for r in runs) / len(runs)
        avg_total = sum(r["total_time"] for r in runs) / len(runs)
        results.append({
            "name": s["name"],
            "lang": s["lang"],
            "duration": s["duration"],
            "avg_inf": avg_inf,
            "avg_total": avg_total,
            "rtf": avg_inf / s["duration"] if s["duration"] > 0 else 0,
            "transcript": runs[-1]["transcript"],
            "peak_ram": max(r["ram"] for r in runs),
        })

    print("\n" + "=" * 60)
    print("BENCHMARK SUMMARY TABLE")
    print("=" * 60)
    print(f"{'Language':<10} | {'Duration':<10} | {'Inference':<10} | {'Total Time':<10} | {'RTF':<8} | {'Peak RAM':<10}")
    print("-" * 72)
    for r in results:
        print(f"{r['lang']:<10} | {r['duration']:>8.2f}s | {r['avg_inf']:>8.3f}s | {r['avg_total']:>8.3f}s | {r['rtf']:>6.2f}x | {r['peak_ram']:>8.1f}MB")

    print("\n" + "=" * 60)
    print("SAMPLE TRANSCRIPTS")
    print("=" * 60)
    for r in results:
        print(f"[{r['lang'].upper()}] ({r['name']}):\n  \"{r['transcript']}\"\n")

if __name__ == '__main__':
    benchmark()
