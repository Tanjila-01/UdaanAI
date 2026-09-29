"""One-time BharatGenAI Shrutam-2 model download. Never invoked by a student request."""
import os
from huggingface_hub import snapshot_download

if __name__ == '__main__':
    target_dir = os.environ.get('SPEECH_MODEL_PATH', '/models/shrutam-2')
    print(f"Downloading BharatGenAI Shrutam-2 into {target_dir}...")
    snapshot_download(
        'bharatgenai/Shrutam-2',
        local_dir=target_dir,
        allow_patterns=['*.json', '*.py', '*.safetensors', '*.jinja'],
    )
    print('Local Shrutam-2 speech model is ready.')
