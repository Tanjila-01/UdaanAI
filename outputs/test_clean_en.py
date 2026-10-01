import time
import torch
from transformers import LogitsProcessor, LogitsProcessorList
from app.services.speech import speech_model, decode_clip

print("Loading audio...")
with open('/tmp/audio_samples/sample_en1.mp3', 'rb') as f:
    audio1 = decode_clip(f.read())
with open('/tmp/audio_samples/sample_en2.mp3', 'rb') as f:
    audio2 = decode_clip(f.read())

model = speech_model()
tok = model.tokenizer

# Build English allowed mask:
# Allow only tokens that are:
# 1. eos / pad / bos
# 2. English words, word pieces, spaces, and punctuation (NO '#' tokens, NO non-ascii)
allowed_mask = torch.zeros(len(tok), dtype=torch.bool)
allowed_mask[tok.eos_token_id] = True
allowed_mask[tok.pad_token_id] = True
allowed_mask[3] = True
allowed_mask[128001] = True

for token_id in range(len(tok)):
    s = tok.decode([token_id])
    if not s:
        continue
    # Must be ascii
    if not all(ord(c) < 128 for c in s):
        continue
    # Must not contain hashtag, html, or code noise tokens
    if any(c in '#<>[]{}\\`~@$%^&*_+=|' for c in s):
        continue
    allowed_mask[token_id] = True

class EnglishOnlyLogitsProcessor(LogitsProcessor):
    def __call__(self, input_ids, scores):
        scores[:, ~allowed_mask.to(scores.device)] = -1e9
        return scores

proc = LogitsProcessorList([EnglishOnlyLogitsProcessor()])

for name, aud in [('sample_en1 (Good morning, how do you do?)', audio1), ('sample_en2 (What does a software developer do?)', audio2)]:
    audio_batch = [model._prepare_waveform(aud).to(model.device)]
    audio_raw_batch = torch.stack(audio_batch)
    audio_mask_batch = torch.ones(1, audio_raw_batch.shape[1], device=model.device)

    prompt_ids = [model._tokenize('Transcribe speech.', tok)[0]]
    text_ids_batch = torch.stack(prompt_ids).to(model.device)
    text_ids_attention_mask = torch.ones(1, text_ids_batch.shape[1], device=model.device)

    inputs_embeds, attention_mask = model.forward(
        audio=audio_raw_batch,
        text_ids=text_ids_batch,
        text_ids_attention_mask=text_ids_attention_mask,
        audio_mask=audio_mask_batch
    )

    t0 = time.time()
    outputs = model.llm.generate(
        inputs_embeds=inputs_embeds,
        max_new_tokens=25,
        num_beams=1,
        repetition_penalty=1.2,
        attention_mask=attention_mask,
        eos_token_id=[3, 128001],
        pad_token_id=tok.pad_token_id,
        logits_processor=proc
    )
    res = tok.decode(outputs[0], skip_special_tokens=True).strip()
    dur = time.time() - t0
    print(f"{name} ({dur:.2f}s) -> '{res}'")
