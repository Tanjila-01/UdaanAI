"""Model preparation script for vasista22/whisper-kannada-small CT2 INT8. Never invoked by a student request."""
import os
import subprocess
from transformers import WhisperProcessor

if __name__ == '__main__':
    target_dir = os.environ.get('SPEECH_MODEL_PATH', '/models/whisper-kannada-small-ct2-int8')
    model_id = os.environ.get('SPEECH_MODEL_ID', 'vasista22/whisper-kannada-small')
    if os.path.exists(target_dir) and os.path.isdir(target_dir) and os.path.exists(os.path.join(target_dir, "model.bin")):
        print(f"Local speech model already prepared at {target_dir}.")
    else:
        print(f"Converting '{model_id}' to CTranslate2 INT8 in {target_dir}...")
        subprocess.run([
            "ct2-transformers-converter",
            "--model", model_id,
            "--output_dir", target_dir,
            "--quantization", "int8",
            "--force"
        ], check=True)
        processor = WhisperProcessor.from_pretrained(model_id)
        processor.save_pretrained(target_dir)
        print(f"Local speech model '{model_id}' is ready at {target_dir}.")

