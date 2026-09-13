"""One-time model download. Never invoked by a student request."""
import os
from huggingface_hub import snapshot_download

if __name__ == '__main__':
    snapshot_download('Systran/faster-whisper-tiny.en',
                      revision='0d3d19a32d3338f10357c0889762bd8d64bbdeba',
                      local_dir=os.environ.get('SPEECH_MODEL_PATH', '/models/whisper-tiny-en'),
                      allow_patterns=['config.json', 'model.bin', 'tokenizer.json', 'vocabulary.txt'])
    print('Local English speech model is ready.')
