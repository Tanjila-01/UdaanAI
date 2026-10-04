import os
import re
import sys
import time
import psutil
import torch
from transformers import WhisperProcessor, WhisperForConditionalGeneration
from app.services.speech import decode_clip, SAMPLE_RATE

def get_ram_mb():
    return psutil.Process(os.getpid()).memory_info().rss / (1024 * 1024)

def count_scripts(text):
    return {
        "kannada": len(re.findall(r'[\u0c80-\u0cff]', text)),
        "latin": len(re.findall(r'[a-zA-Z]', text)),
        "devanagari": len(re.findall(r'[\u0900-\u097f]', text)),
        "arabic": len(re.findall(r'[\u0600-\u06ff]', text)),
        "tamil": len(re.findall(r'[\u0b80-\u0bff]', text)),
    }

def run_benchmark():
    print("=" * 75)
    print("BENCHMARK: vasista22/whisper-kannada-small (Transformers, CPU)")
    print("=" * 75)

    ram_initial = get_ram_mb()
    print(f"Initial process RAM: {ram_initial:.2f} MB")

    # Optimal CPU threading
    torch.set_num_threads(min(4, os.cpu_count() or 4))

    # 1. Measure Cold Load
    print("\n[1] Loading vasista22/whisper-kannada-small...")
    t0 = time.perf_counter()
    model_id = "vasista22/whisper-kannada-small"
    processor = WhisperProcessor.from_pretrained(model_id)
    model = WhisperForConditionalGeneration.from_pretrained(model_id)
    model.eval()
    cold_load_time = time.perf_counter() - t0
    ram_after_load = get_ram_mb()

    print(f"Cold model load time: {cold_load_time:.3f} s")
    print(f"RAM after load: {ram_after_load:.2f} MB (Delta: {ram_after_load - ram_initial:+.2f} MB)")

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
        s["audio"] = audio

    # Warm-up run
    print("\n[2] Warming up model with English Sample 1...")
    inputs = processor(samples[0]["audio"], sampling_rate=SAMPLE_RATE, return_tensors="pt")
    forced_ids = processor.get_decoder_prompt_ids(language="en", task="transcribe")
    model.generation_config.forced_decoder_ids = forced_ids
    with torch.no_grad():
        _ = model.generate(inputs.input_features, num_beams=1, max_new_tokens=32)
    print("Warm-up complete.")

    results = []
    print("\n[3] Running evaluations (3 runs per sample)...")

    for s in samples:
        print(f"\n--- Evaluating {s['name']} (Target Lang: {s['lang']}, Audio Duration: {s['duration']:.2f}s) ---")
        forced_ids = processor.get_decoder_prompt_ids(language=s["lang"], task="transcribe")
        model.generation_config.forced_decoder_ids = forced_ids

        runs = []
        for run_idx in range(1, 4):
            t_start = time.perf_counter()

            # Preprocessing
            t_pre_0 = time.perf_counter()
            audio = decode_clip(s["bytes"])
            inputs = processor(audio, sampling_rate=SAMPLE_RATE, return_tensors="pt")
            t_pre = time.perf_counter() - t_pre_0

            # Inference
            t_inf_0 = time.perf_counter()
            with torch.no_grad():
                pred_ids = model.generate(
                    inputs.input_features,
                    num_beams=1,
                    max_new_tokens=96
                )
            transcript = processor.batch_decode(pred_ids, skip_special_tokens=True)[0].strip()
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
        counts = count_scripts(final_transcript)

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
            "counts": counts,
        })

    print("\n" + "=" * 75)
    print("PERFORMANCE SUMMARY TABLE")
    print("=" * 75)
    print(f"{'Sample':<22} | {'Lang':<5} | {'Duration':<9} | {'Inference':<10} | {'Total Time':<10} | {'RTF':<6} | {'Peak RAM':<9}")
    print("-" * 81)
    for r in results:
        print(f"{r['name']:<22} | {r['lang']:<5} | {r['duration']:>7.2f}s | {r['avg_inf']:>8.3f}s | {r['avg_total']:>8.3f}s | {r['rtf']:>5.2f}x | {r['peak_ram']:>7.1f}MB")

    print("\n" + "=" * 75)
    print("TRANSCRIPTS & SCRIPT DECOMPOSITION")
    print("=" * 75)
    for r in results:
        c = r["counts"]
        print(f"Sample: {r['name']} [Lang: {r['lang']}]")
        print(f"  Transcript: \"{r['transcript']}\"")
        print(f"  Script Counts: Kannada={c['kannada']}, Latin={c['latin']}, Devanagari={c['devanagari']}, Arabic={c['arabic']}, Tamil={c['tamil']}")
        if r['lang'] == 'kn':
            if c['kannada'] > 0 and c['latin'] == 0 and c['devanagari'] == 0:
                print("  Script Assessment: Native Kannada Script Only")
            elif c['kannada'] > 0 and c['latin'] > 0:
                print("  Script Assessment: Mixed Kannada + Latin Script")
            elif c['devanagari'] > 0:
                print("  Script Assessment: Devanagari Script Detected")
            else:
                print("  Script Assessment: NO KANNADA SCRIPT DETECTED")
        elif r['lang'] == 'en':
            if c['latin'] > 0 and c['kannada'] == 0:
                print("  Script Assessment: Native English Latin Script")
            else:
                print("  Script Assessment: WARNING: Non-Latin or Kannada output for English audio!")
        print()

    print("=" * 75)
    print("MODEL METRICS & MEMORY")
    print("=" * 75)
    print(f"Cold model load time: {cold_load_time:.3f} s")
    print(f"RAM baseline:         {ram_initial:.2f} MB")
    print(f"RAM post-load:        {ram_after_load:.2f} MB (+{ram_after_load - ram_initial:.2f} MB)")
    print(f"RAM peak:             {max(r['peak_ram'] for r in results):.2f} MB")

if __name__ == '__main__':
    run_benchmark()
