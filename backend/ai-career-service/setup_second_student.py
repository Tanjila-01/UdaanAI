import uuid
from datetime import datetime, timezone
import jwt
from sqlalchemy import text
from app.db.session import SessionLocal
from app.services.career_answers import personal_context

SECRET = 'dev_secret_key_udaan_ai_phase2_change_in_prod'
user_id = 'd84e96a7-8a2e-4523-b098-5693a72a4a4d' # tanjilateststudent@udaan.com
TOKEN = jwt.encode({'sub': user_id, 'email': 'tanjilateststudent@udaan.com', 'role': 'student', 'type': 'access', 'iat': datetime.now(timezone.utc), 'exp': datetime.now(timezone.utc) + timezone.utc.dst(None) if False else datetime.now(timezone.utc) + (datetime.now(timezone.utc) - datetime.now(timezone.utc))}, SECRET, algorithm='HS256')

db = SessionLocal()
try:
    attempt_id = uuid.uuid4()
    result_id = uuid.uuid4()
    rec_id = uuid.uuid4()

    db.execute(text("""
        INSERT INTO assessment.assessment_attempts (id, student_id, assessment_id, status, started_at, completed_at)
        VALUES (:att_id, :uid, 'foundation-career-discovery-v2', 'completed', NOW(), NOW())
    """), {'att_id': attempt_id, 'uid': user_id})

    db.execute(text("""
        INSERT INTO assessment.assessment_results (id, attempt_id, user_id, assessment_id, assessment_version, scoring_version, primary_stream_recommendation, secondary_stream_recommendation, top_career_match, dimension_scores, summary_text, created_at)
        VALUES (:res_id, :att_id, :uid, 'foundation-career-discovery-v2', 'v2', 'rule-v2-foundation', 'Polytechnic Diploma', 'PUC Science', 'Junior Engineer', '{"diploma": 50, "science": 30, "commerce": 10, "arts": 10, "iti": 5}', 'Polytechnic Diploma recommendation', NOW())
    """), {'res_id': result_id, 'att_id': attempt_id, 'uid': user_id})

    db.execute(text("""
        INSERT INTO career_ai.career_recommendation_results (id, user_id, source_attempt_id, source_assessment_id, source_scoring_version, disclaimer, generated_at)
        VALUES (:rec_id, :uid, :att_id, 'foundation-career-discovery-v2', 'rule-v2-foundation', 'Advisory only based on questionnaire interests.', NOW())
    """), {'rec_id': rec_id, 'uid': user_id, 'att_id': attempt_id})

    db.execute(text("""
        INSERT INTO career_ai.career_recommendation_items (id, result_id, pathway_id, pathway_title, rank, match_score, match_label, reasons)
        VALUES
        (:i1, :rec_id, 'c10-diploma', 'Polytechnic Diploma', 1, 50, 'Good', '["Matches your preference for practical technical design"]'),
        (:i2, :rec_id, 'c10-puc', 'Pre-University College (PUC)', 2, 30, 'Explore', '["Matches your interest in science"]'),
        (:i3, :rec_id, 'c10-iti', 'ITI Vocational Trades', 3, 10, 'Explore', '["Vocational trades"]')
    """), {'i1': uuid.uuid4(), 'i2': uuid.uuid4(), 'i3': uuid.uuid4(), 'rec_id': rec_id})

    db.commit()
    print("Database rows inserted successfully.")
except Exception as e:
    db.rollback()
    print("Error:", e)
finally:
    db.close()
