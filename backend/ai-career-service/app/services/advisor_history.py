import uuid
from sqlalchemy.exc import SQLAlchemyError
from app.models.advisor_history import AdvisorHistory


def save_answer(db, user_id, request, response):
    if response['status'] not in {'answered', 'recommendations_explained'}:
        return None
    try:
        row = AdvisorHistory(id=uuid.uuid4(), user_id=uuid.UUID(user_id),
                             question=request['question'], request=request, response=response)
        db.add(row)
        db.commit()
        return str(row.id)
    except SQLAlchemyError:
        db.rollback()
        return None
