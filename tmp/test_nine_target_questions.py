import urllib.request
import json
import time
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

TARGET_QUESTIONS = [
    "What does a software developer do?",
    "What does an electrician do?",
    "What does a graphic designer do?",
    "What skills does a data analyst need?",
    "How can I become a software developer after Class 10?",
    "What can I do after Class 10 if I like computers?",
    "What should I study after PUC Science to enter technology?",
    "What is the current eligibility for a diploma course in Karnataka?",
    "Which colleges currently offer cybersecurity in Karnataka?"
]

def check_answer_formatting(text):
    has_raw_escaped_html = bool(re.search(r'\\?<(?:\/)?(?:ul|li|p|br|table|tr|td|th)[^>]*>|&lt;ul&gt;|&lt;li&gt;', text, re.I))
    has_escaped_brackets = r'\<' in text or r'\>' in text
    has_broken_bullets = bool(re.search(r'^\s*-\s*•', text, re.M)) # double bullet
    has_giant_tables = text.count('|---|') > 2
    return {
        'has_raw_escaped_html': has_raw_escaped_html,
        'has_escaped_brackets': has_escaped_brackets,
        'has_broken_bullets': has_broken_bullets,
        'has_giant_tables': has_giant_tables
    }

def main():
    login_data = json.dumps({"email": "priya@example.com", "password": "Password123!"}).encode()
    login_req = urllib.request.Request("http://localhost:8000/api/v1/auth/login", data=login_data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(login_req) as resp:
        tokens = json.loads(resp.read().decode())
    token = tokens["access_token"]
    print("Logged in successfully. Testing 9 target questions...\n")

    results = []
    for i, q in enumerate(TARGET_QUESTIONS, 1):
        print(f"[{i}/9] Testing: '{q}'")
        payload = json.dumps({"question": q, "intent": "explore", "language": "en"}).encode()
        req = urllib.request.Request(
            "http://localhost:8000/api/v1/career-intelligence/answers",
            data=payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}",
                "Connection": "close"
            }
        )
        t0 = time.time()
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode())
        elapsed = round(time.time() - t0, 2)

        status = data.get("status")
        topic = data.get("conversation_topic")
        sources_count = len(data.get("sources", []))
        answer = data.get("answer", "") or ""
        fmt = check_answer_formatting(answer)

        print(f" -> Status: {status} | Topic: '{topic}' | Time: {elapsed}s | Sources: {sources_count}")
        print(f" -> Formatting Check: Raw HTML: {fmt['has_raw_escaped_html']}, Escaped brackets: {fmt['has_escaped_brackets']}, Giant tables: {fmt['has_giant_tables']}")
        print(f" -> Preview: {answer[:140].replace(chr(10), ' ')}...\n")

        results.append({
            "question": q,
            "status": status,
            "topic": topic,
            "elapsed": elapsed,
            "sources_count": sources_count,
            "fmt": fmt,
            "preview": answer[:140]
        })

    all_passed = all(r["status"] == "answered" for r in results)
    print("\n=======================================================")
    print(f"FINAL RESULT: {'ALL 9 TARGET QUESTIONS RETURNED HTTP 200 + ANSWERED' if all_passed else 'SOME QUESTIONS FAILED'}")
    print("=======================================================")

if __name__ == "__main__":
    main()
