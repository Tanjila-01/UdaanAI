"""Resolve a selected saved answer to a topic, never to reusable factual evidence."""
from uuid import UUID
from fastapi import HTTPException
from sqlalchemy.exc import SQLAlchemyError
from app.models.advisor_history import AdvisorHistory


def followup_context(db, user_id, history_id):
    try:
        row = db.query(AdvisorHistory).filter(AdvisorHistory.id == history_id,
                                             AdvisorHistory.user_id == UUID(user_id)).first()
    except SQLAlchemyError:
        raise HTTPException(503, 'The previous answer could not be checked. Please try again.')
    if row is None:
        raise HTTPException(404, 'The selected answer is no longer available. Name the career in a new question.')
    if row.request.get('intent', 'explore') != 'explore' or row.response.get('status') != 'answered':
        return None, None
    titles = {source.get('title', '').strip() for source in row.response.get('sources', [])
              if isinstance(source, dict) and isinstance(source.get('title'), str) and source['title'].strip()}
    if len(titles) != 1:
        return None, None
    topic = titles.pop()
    if len(topic) > 250:
        return None, None
    return topic, row.request.get('pathway_id')
