"""Run with: python -m scripts.check_local_ai (inside the service)."""
from app.services.local_ai import LocalAI


def main():
    ai = LocalAI()
    vectors = ai.embed(["A software engineer builds software.", "An electrician installs electrical wiring."])
    print(f"Local embeddings OK: {len(vectors)} vectors, {len(vectors[0])} dimensions")
    answer = ai.chat([
        {"role": "system", "content": "You are Udaan, a career exploration assistant. Answer in one short sentence."},
        {"role": "user", "content": "How can I explore whether I enjoy programming?"},
    ])
    print("Local text generation OK:", answer)


if __name__ == "__main__":
    main()
