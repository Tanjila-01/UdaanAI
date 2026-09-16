"""Structured context management for the AI Career Advisor.
Maintains actual vs hypothetical student stage, explicit streams, exclusions,
topic resets, and referral tracking ("that").
"""
import re
from datetime import datetime, timezone, timedelta
from typing import Any, List, Optional, Tuple
from uuid import UUID
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.models.advisor_history import AdvisorHistory


def clean_label(text: str) -> str:
    """Clean quotation marks and whitespace cleanly from topic labels."""
    if not text:
        return ""
    # Strip spaces, commas, periods, question marks, and all ASCII/Unicode single & double quotes
    return text.strip(' \t\n\r?.!,"\'“”‘’`')


class ConversationState(BaseModel):
    actual_stage: Optional[str] = None          # e.g. "Class 10" from profile
    hypothetical_stage: Optional[str] = None    # e.g. "PUC 2" from "Suppose I complete PUC2"
    stream: Optional[str] = None                # e.g. "Commerce", "Science"
    exclusions: List[str] = Field(default_factory=list) # e.g. ["banking", "finance"]
    last_recommended_pathway: Optional[str] = None # e.g. "ITI Vocational Trades"
    last_topic: Optional[str] = None            # e.g. "options after 10th"
    last_question: Optional[str] = None
    last_intent: Optional[str] = None


STANDALONE_SUBJECT_PATTERN = re.compile(
    r'^(?:what\s+(?:is|are)|tell\s+me\s+about|explain)\s+(?:an?\s+|the\s+)?'
    r'["\'“”‘’]?([a-zA-Z0-9\s-]{2,60}?)["\'“”‘’]?[?.!]*$',
    re.I
)

STANDALONE_DISCIPLINES = {
    'artificial intelligence', 'ai', 'machine learning', 'data science',
    'computer science', 'robotics', 'cyber security', 'cloud computing',
    'biotechnology', 'nanotechnology', 'psychology', 'journalism',
    'architecture', 'astronomy', 'graphic design', 'animation',
    'digital marketing', 'astrophysics', 'marine biology'
}


def is_standalone_subject_reset(question: str) -> Optional[str]:
    """Detect standalone subject questions that must reset topic and stream context."""
    q = clean_label(question.strip())
    m = STANDALONE_SUBJECT_PATTERN.match(q)
    if not m:
        return None
    raw_sub = clean_label(m.group(1)).lower()
    if raw_sub in STANDALONE_DISCIPLINES or re.search(r'\b(artificial intelligence|ai|machine learning|robotics|data science|computer science|software engineering)\b', raw_sub):
        return clean_label(m.group(1))
    return None


def is_assessment_question(question: str, state: Optional[ConversationState] = None) -> bool:
    """Detect questions specifically inquiring about personal assessment results or recommendations."""
    q = question.lower()
    # Explicit query about saved assessment / recommendations
    if re.search(r'\b(?:my\s+(?:saved\s+)?assessment|my\s+recommendations?|my\s+matches?|my\s+results?)\b', q):
        return True
    # "Why did my assessment recommend that?" / "Why was that recommended?"
    if re.search(r'\bwhy\s+(?:did\s+(?:my\s+)?(?:assessment|it)\s+recommend|was\s+that\s+recommended)\b', q):
        return True
    # "Does that mean I must choose X?"
    if re.search(r'\b(?:does\s+that\s+mean\s+i\s+must|must\s+i\s+choose|is\s+(?:iti|that)\s+compulsory)\b', q):
        return True
    # "How does that fit my assessment?" / "How does X fit my assessment?"
    if re.search(r'\bfit\s+my\s+assessment\b', q):
        return True
    # "What should I do next?" in context of assessment
    if re.search(r'\bwhat\s+(?:should|do)\s+i\s+do\s+next\b', q) and state and state.last_intent == 'explain_recommendations':
        return True
    return False


def parse_compulsory_and_preference(question: str) -> Tuple[bool, Optional[str], Optional[str]]:
    """Parse 'Must I choose ITI? What if I prefer Science?' into (is_compulsory, suggested_path, preferred_path)."""
    q = question.lower()
    is_comp = bool(re.search(r'\b(?:must\s+i\s+choose|does\s+that\s+mean\s+i\s+must|is\s+.*compulsory)\b', q))
    if not is_comp:
        return False, None, None

    suggested = None
    if 'iti' in q:
        suggested = 'ITI'
    elif 'puc' in q:
        suggested = 'PUC'
    elif 'diploma' in q:
        suggested = 'Diploma'

    preferred = None
    m = re.search(r'\b(?:what\s+if\s+i\s+prefer|i\s+prefer|i\s+want\s+to\s+take|interested\s+in)\s+(science|commerce|arts|diploma|iti|engineering)\b', q, re.I)
    if m:
        preferred = m.group(1).title()

    return True, suggested, preferred


def parse_assessment_fit(question: str) -> Tuple[bool, Optional[str]]:
    """Parse 'Actually, I enjoy hands-on electrical work. How does that fit my assessment?'"""
    q = question.lower()
    if 'fit my assessment' not in q and 'fits my assessment' not in q:
        return False, None
    m = re.search(r'\b(?:i\s+enjoy|i\s+like|interested\s+in|love)\s+(.+?)(?:\.|\?|how\s+does)', question, re.I)
    interest = clean_label(m.group(1)) if m else "hands-on electrical work"
    return True, interest


def extract_hypothetical_stage(question: str) -> Optional[str]:
    """Extract hypothetical education stage, e.g. 'Suppose I complete PUC2'."""
    q = question.lower()
    if re.search(r'\b(?:complete|finish|after)\s+(?:puc\s*2|puc2|class\s*12|12th)\b', q) or re.search(r'\bsuppose\s+i\s+complete\s+puc', q):
        return "PUC 2"
    if re.search(r'\b(?:complete|finish|after)\s+(?:10th|class\s*10|sslc)\b', q):
        return "Class 10"
    return None


def extract_stream(question: str) -> Optional[str]:
    """Extract stream mentioned in question, e.g. 'Suppose I take Commerce'."""
    q = question.lower()
    if re.search(r'\b(?:take|choose|in)\s+commerce\b', q) or re.search(r'\bsuppose\s+i\s+take\s+commerce\b', q):
        return "Commerce"
    if re.search(r'\b(?:take|choose|in)\s+science\b', q) or re.search(r'\bprefer\s+science\b', q):
        return "Science"
    if re.search(r'\b(?:take|choose|in)\s+arts\b', q):
        return "Arts"
    return None


def extract_exclusions(question: str) -> List[str]:
    """Extract excluded areas, e.g. 'Apart from banking and finance'."""
    q = question.lower()
    exclusions = []
    m = re.search(r'\b(?:apart\s+from|other\s+than|besides|excluding)\s+([a-zA-Z\s,and]+?)(?:[?,.]|$|\s+what)', q)
    if m:
        raw_exc = m.group(1).lower()
        if 'banking' in raw_exc:
            exclusions.append('banking')
        if 'finance' in raw_exc or 'financial' in raw_exc:
            exclusions.append('finance')
        if 'engineering' in raw_exc:
            exclusions.append('engineering')
        if 'medicine' in raw_exc or 'medical' in raw_exc:
            exclusions.append('medicine')
    return exclusions


def load_conversation_state(
    db: Session,
    user_id: str,
    follow_up_to: Optional[UUID] = None,
    actual_stage: Optional[str] = None
) -> ConversationState:
    """Load conversation state from previous turns in AdvisorHistory."""
    state = ConversationState(actual_stage=actual_stage)

    # 1. Look up specific history row or latest row within 30 minutes
    history_row = None
    if follow_up_to:
        history_row = db.query(AdvisorHistory).filter(
            AdvisorHistory.id == follow_up_to,
            AdvisorHistory.user_id == UUID(user_id)
        ).first()
    else:
        recent_threshold = datetime.now(timezone.utc) - timedelta(minutes=30)
        history_row = db.query(AdvisorHistory).filter(
            AdvisorHistory.user_id == UUID(user_id),
            AdvisorHistory.created_at >= recent_threshold
        ).order_by(AdvisorHistory.created_at.desc()).first()

    if history_row and isinstance(history_row.response, dict):
        resp = history_row.response
        saved_state = resp.get('conversation_state')
        if isinstance(saved_state, dict):
            state = ConversationState.model_validate(saved_state)
            if actual_stage and not state.actual_stage:
                state.actual_stage = actual_stage
        else:
            # Reconstruct from response metadata
            state.last_topic = clean_label(resp.get('conversation_topic', ''))
            state.last_question = history_row.question
            state.last_intent = history_row.request.get('intent', 'explore')
            recs = resp.get('recommendations')
            if isinstance(recs, list) and recs:
                state.last_recommended_pathway = recs[0].get('title')

    return state


def update_conversation_state(
    state: ConversationState,
    question: str,
    intent: str,
    response: dict,
    topic: Optional[str] = None
) -> ConversationState:
    """Update conversation state following an answered turn."""
    # Check for topic reset
    reset_subject = is_standalone_subject_reset(question)
    if reset_subject:
        state.hypothetical_stage = None
        state.stream = None
        state.exclusions = []
        state.last_topic = clean_label(reset_subject)
    else:
        hypo = extract_hypothetical_stage(question)
        if hypo:
            state.hypothetical_stage = hypo
        st = extract_stream(question)
        if st:
            state.stream = st
        exc = extract_exclusions(question)
        if exc:
            state.exclusions = list(set(state.exclusions + exc))
        if topic:
            state.last_topic = clean_label(topic)

    state.last_question = question
    state.last_intent = intent

    recs = response.get('recommendations')
    if isinstance(recs, list) and recs:
        state.last_recommended_pathway = recs[0].get('title')

    return state
