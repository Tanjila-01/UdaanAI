"""Verify end-to-end RAG with MiniLM embeddings, pgvector retrieval, and gpt-oss:120b-cloud."""
import sys
from app.db.session import SessionLocal
from app.services.career_answers import answer_question
from app.services.knowledge import retrieve
from app.services.local_ai import get_ai

def main():
    db = SessionLocal()
    ai = get_ai()

    queries = [
        ("English", "What does a software developer do?"),
        ("English Class 10", "What are the options after Class 10 for someone interested in computers?"),
        ("Kannada", "ಸಾಫ್ಟ್ವೇರ್ ಡೆವಲಪರ್ ಆಗಲು ಯಾವ ಮಾರ್ಗವಿದೆ?"),
        ("Hindi", "सॉफ्टवेयर इंजीनियर बनने के लिए कौन सा रास्ता है?"),
        ("Code-mixed", "Software developer agoke 10th aadmele en madbeku?"),
    ]

    for label, q in queries:
        print(f"=== Testing [{label}]: {q} ===")
        # 1. Retrieval
        try:
            matches = retrieve(db, q, ai=ai, limit=3)
            print(f"  Retrieval: Found {len(matches)} chunks")
            if matches:
                top = matches[0]
                print(f"  Top Match: '{top['heading']}' (similarity: {top['similarity']:.4f})")
        except Exception as e:
            print(f"  Retrieval ERROR: {e}")

        # 2. Complete RAG Answer
        try:
            ans = answer_question(
                db,
                "00000000-0000-0000-0000-000000000001",
                "test-token",
                q,
                intent="explore",
                ai=ai,
            )
            print(f"  Answer Status: {ans['status']}")
            print(f"  Sources Count: {len(ans.get('sources', []))}")
            first_line = ans['answer'].split('\n')[0] if ans.get('answer') else ''
            print(f"  Answer Line 1: {first_line[:120]}")
        except Exception as e:
            print(f"  Answer ERROR: {e}")
        print()

if __name__ == "__main__":
    main()
