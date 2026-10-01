import torch
from app.services.speech import speech_model, decode_clip

with open('/tmp/audio_samples/sample_en1.mp3', 'rb') as f:
    audio1 = decode_clip(f.read())
with open('/tmp/audio_samples/sample_en2.mp3', 'rb') as f:
    audio2 = decode_clip(f.read())

m = speech_model()
tok = m.tokenizer

for name, aud in [('sample1 (Good morning)', audio1), ('sample2 (What does software developer do)', audio2)]:
    for p in [
        [
            {'role': 'system', 'content': 'You are an ASR model. Transcribe speech accurately in English alphabet.'},
            {'role': 'user', 'content': 'Transcribe speech to English text.'}
        ],
        [
            {'role': 'user', 'content': 'Transcribe speech into English Latin script.'}
        ],
        [
            {'role': 'user', 'content': 'Transcribe audio to English:'}
        ]
    ]:
        prompt_ids = tok.apply_chat_template(p, tokenize=True, add_generation_prompt=True, return_dict=False)
        prompt_tensor = torch.tensor([prompt_ids], dtype=torch.int64).to(m.device)
        audio_batch = [m._prepare_waveform(aud).to(m.device)]
        audio_raw_batch = torch.stack(audio_batch)
        audio_mask_batch = torch.ones(1, audio_raw_batch.shape[1], device=m.device)
        text_mask = torch.ones(1, prompt_tensor.shape[1], device=m.device)

        inputs_embeds, attn_mask = m.forward(
            audio=audio_raw_batch,
            text_ids=prompt_tensor,
            text_ids_attention_mask=text_mask,
            audio_mask=audio_mask_batch
        )

        outputs = m.llm.generate(
            inputs_embeds=inputs_embeds,
            max_new_tokens=30,
            num_beams=1,
            attention_mask=attn_mask,
            eos_token_id=[3, 128001],
            pad_token_id=tok.pad_token_id
        )
        res = tok.decode(outputs[0], skip_special_tokens=True).strip()
        print(f"{name} | {p[-1]['content']} -> '{res}'")
