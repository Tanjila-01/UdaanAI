import urllib.request
import urllib.parse
import os

samples = {
    'sample_en1.mp3': ('Good morning, how do you do?', 'en'),
    'sample_en2.mp3': ('What does a software developer do?', 'en'),
    'sample_kn.mp3': ('ನಿನಗೆ ಕನ್ನಡ ಬರುತ್ತದೆಯೇ', 'kn'),
    'sample_hi.mp3': ('आप कैसे हैं?', 'hi'),
    'sample_mixed.mp3': ('ನನಗೆ CSE ಬಗ್ಗೆ information ಬೇಕು', 'kn')
}

os.makedirs('outputs/audio_samples', exist_ok=True)

for fname, (text, lang) in samples.items():
    url = f"https://translate.google.com/translate_tts?ie=UTF-8&tl={lang}&client=tw-ob&q=" + urllib.parse.quote(text)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    path = os.path.join('outputs/audio_samples', fname)
    with urllib.request.urlopen(req) as resp:
        with open(path, 'wb') as f:
            f.write(resp.read())
    print(f"Downloaded {fname} -> {os.path.getsize(path)} bytes")
