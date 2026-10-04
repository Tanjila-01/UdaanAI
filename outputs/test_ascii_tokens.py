import torch  # type: ignore
from app.services.speech import speech_model, decode_clip  # type: ignore

with open('/tmp/audio_samples/sample_en2.mp3', 'rb') as f:
    audio = decode_clip(f.read())

model = speech_model()
tok = model.tokenizer

audio_batch = [model._prepare_waveform(audio).to(model.device)]
audio_raw_batch = torch.stack(audio_batch)
audio_mask_batch = torch.ones(1, audio_raw_batch.shape[1], device=model.device)

for p in ['Transcribe speech.', 'Transcribe speech to English text.']:
    prompt_ids = [model._tokenize(p, tok)[0]]
    text_ids_batch = torch.stack(prompt_ids).to(model.device)
    text_ids_attention_mask = torch.ones(1, text_ids_batch.shape[1], device=model.device)

    inputs_embeds, attention_mask = model.forward(
        audio=audio_raw_batch,
        text_ids=text_ids_batch,
        text_ids_attention_mask=text_ids_attention_mask,
        audio_mask=audio_mask_batch
    )

    with torch.no_grad():
        res = model.llm(inputs_embeds=inputs_embeds)
        logits = res.logits[0, -1, :]
        ascii_logits = []
        for tid in range(len(tok)):
            s = tok.decode([tid])
            if s and all(c.isascii() and (c.isalnum() or c.isspace() or c in ".,?'\"-") for c in s) and not s.startswith('#'):
                ascii_logits.append((logits[tid].item(), tid, s))
        ascii_logits.sort(reverse=True)
        print(f"Prompt: {p} -> Top 10 clean ASCII tokens:")
        for score, tid, s in ascii_logits[:10]:
            print(f"   {tid}: {repr(s)} ({score:.2f})")
