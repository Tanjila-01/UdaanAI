from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.core.security import get_current_user_claims
from app.db.session import get_db
from app.models.advisor_history import AdvisorHistory

router = APIRouter(prefix='/career-intelligence/history', tags=['Advisor history'])


def owned(db, claims):
    return db.query(AdvisorHistory).filter(AdvisorHistory.user_id == UUID(claims['sub']))


@router.get('')
def list_history(offset: int = Query(0, ge=0, le=100000), claims=Depends(get_current_user_claims), db: Session = Depends(get_db)):
    try:
        rows = owned(db, claims).order_by(AdvisorHistory.created_at.desc(), AdvisorHistory.id.desc()).offset(offset).limit(21).all()
        return {'items': [{'id': str(row.id), 'question': row.question, 'created_at': row.created_at.isoformat()} for row in rows[:20]],
                'has_more': len(rows) > 20}
    except SQLAlchemyError:
        raise HTTPException(503, 'Previous questions are temporarily unavailable.')


@router.get('/{history_id}')
def get_history(history_id: UUID, claims=Depends(get_current_user_claims), db: Session = Depends(get_db)):
    try:
        row = owned(db, claims).filter(AdvisorHistory.id == history_id).first()
        if not row:
            raise HTTPException(404, 'Saved question not found.')
        return {'id': str(row.id), 'created_at': row.created_at.isoformat(), 'request': row.request, 'response': row.response}
    except SQLAlchemyError:
        raise HTTPException(503, 'Previous questions are temporarily unavailable.')


@router.delete('/{history_id}', status_code=204)
def delete_history(history_id: UUID, claims=Depends(get_current_user_claims), db: Session = Depends(get_db)):
    try:
        row = owned(db, claims).filter(AdvisorHistory.id == history_id).first()
        if not row:
            raise HTTPException(404, 'Saved question not found.')
        db.delete(row)
        db.commit()
        return Response(status_code=204)
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(503, 'This question could not be deleted. Please retry.')
