import sys
from sqlalchemy import text
from app.db.session import SessionLocal, engine
from app.db.seed_assessments import seed_initial_assessment_data


def run_seed():
    print("Starting Assessment Service database seed runner...")
    with engine.begin() as conn:
        conn.execute(text("CREATE SCHEMA IF NOT EXISTS assessment;"))

    db = SessionLocal()
    try:
        res = seed_initial_assessment_data(db)
        print(f"Seed runner completed successfully. Result: {res}")
    except Exception as e:
        print(f"Seed runner failed with error: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
