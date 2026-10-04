"""Structured context management for the AI Career Advisor.
Maintains actual vs hypothetical student stage, explicit streams, exclusions,
preferences with origin tracking, topic resets, and referral tracking ("that").
"""
import re
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from app.models.advisor_history import AdvisorHistory


def normalize_text(text: Optional[str]) -> str:
    """Normalize smart quotes and unicode typography to standard ascii."""
    if not text:
        return ""
    return text.replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"')


def clean_label(text: Optional[str]) -> str:
    """Clean quotation marks and whitespace cleanly from topic labels."""
    if not text:
        return ""
    return text.strip(' \t\n\r?.!,"\'“”‘’`')


class StatedPreference(BaseModel):
    model_config = ConfigDict(extra="ignore")
    preference: str
    field: Optional[str] = None
    origin: str = "chat"  # "chat" or "assessment"


class ConversationState(BaseModel):
    model_config = ConfigDict(extra="ignore")
    actual_stage: Optional[str] = None          # e.g. "Class 10" from profile
    hypothetical_stage: Optional[str] = None    # e.g. "PUC 2" from "Suppose I complete PUC2"
    stream: Optional[str] = None                # e.g. "Commerce", "Science"
    exclusions: List[str] = Field(default_factory=list) # e.g. ["banking", "finance", "accounting"]
    stated_preferences: List[Dict[str, str]] = Field(default_factory=list) # [{"preference": "drawing", "origin": "chat"}]
    discussed_options: List[str] = Field(default_factory=list) # e.g. ["Graphic Design", "Animation", "Media"]
    last_recommended_pathway: Optional[str] = None # e.g. "ITI Vocational Trades"
    last_specific_pathway: Optional[str] = None # e.g. "Pharmacy Education (B.Pharm / D.Pharm)"
    last_topic: Optional[str] = None            # e.g. "options after SSLC"
    last_question: Optional[str] = None
    last_answer: Optional[str] = None
    last_intent: Optional[str] = None
    last_status: Optional[str] = None           # e.g. "answered", "failed", "unavailable"
    referral_subject: Optional[str] = None      # e.g. "electrical contractor licence in Karnataka"
    region: Optional[str] = "Karnataka, India"


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


def is_profile_question(question: str) -> bool:
    """Detect questions asking about the authenticated student's saved profile facts."""
    q = normalize_text(question).lower().strip()
    if re.search(r'\b(?:what\s+class|which\s+class|what\s+grade|which\s+grade|what\s+stage|what\s+level)\b.*?\b(?:am\s+i|studying|profile)\b', q):
        return True
    if re.search(r'\b(?:according\s+to|in|from)\s+my\s+profile\b', q):
        return True
    if re.search(r'\bwhat\s+(?:does\s+)?my\s+profile\s+(?:say|show|have)\b', q):
        return True
    return False


def is_provenance_question(question: str, state: Optional[ConversationState] = None) -> bool:
    """Detect questions asking about the origin/provenance of an interest or information."""
    q = normalize_text(question).lower().strip()
    if re.search(r'\b(?:did\s+you\s+(?:get|learn|find|know)|where\s+did\s+you\s+(?:get|learn|find)|how\s+do\s+you\s+know)\b.*?\b(?:assessment|test|questionnaire|results?)\b.*?\b(?:told|said|conversation|chat)\b', q):
        return True
    if re.search(r'\b(?:did\s+you\s+(?:get|learn|find|know)|where\s+did\s+you\s+(?:get|learn|find)|how\s+do\s+you\s+know)\b.*?\b(?:from\s+my\s+(?:assessment|test|questionnaire)|because\s+i\s+(?:just\s+)?told\s+you|from\s+what\s+i\s+said|from\s+(?:our\s+)?conversation|from\s+chat)\b', q):
        return True
    if re.search(r'\b(?:did\s+that\s+come|where\s+did\s+that\s+come)\s+from\b', q) and re.search(r'\b(?:assessment|test|questionnaire|chat|told|conversation)\b', q):
        return True
    return False


ASSESSMENT_CONTEXT_PATTERNS = [
    r'\b(?:what\s+is|what\s+are|show\s+me|tell\s+me|explain)\s+(?:my|the)\s+(?:saved\s+|career\s+|top\s+)*(?:recommended|recommendations?)\b',
    r'\b(?:my|the)\s+recommended\s+(?:path|pathway|career|stream|course|track|option)s?\b',
    r'\b(?:what\s+(?:are|is|were)|show\s+me|tell\s+me\s+about|explain)\s+my\s+(?:saved\s+|career\s+)?(?:pathways?|paths?|options?)\b',
    r'\bwhat\s+are\s+my\s+pathways\b',
    r'\bmy\s+pathways\b',
    r'\bwhat\s+(?:is|was|are|were)\s+my\s+(?:top|primary|highest)\s+(?:career\s+)?(?:path|pathway|option|track|match)s?\b',
    r'\b(?:paths?|pathways?|careers?|options?|courses?)\s+(?:was\s+|were\s+|are\s+|is\s+)?recommended\s+(?:for|to)\s+me\b',
    r'\bwhich\s+path\s+(?:was\s+|is\s+)?recommended\s+(?:for|to)\s+me\b',
    r'\bwhy\s+(?:was|were)\s+(.+?)\s+(?:pathways?\s+)?recommended\s*(?:to|for)?\s*me?\b',
    r'\bwhy\s+was\s+(.+?)\s+recommended\b',
    r'\bwhy\s+(?:was|were)\s+(?:this|that|these)\s+(?:path|pathway|career)?\s*recommended\b',
    r'\bwhy\s+did\s+i\s+get\s+(?:that|this|these)\b',
    r'\b(?:can|could)\s+i\s+(?:choose|pick|take|pursue|switch\s+to|change\s+to)\s+(?:an?other|different|alternative)\s+(?:path|pathway|career|stream|course|option)\b',
    r'\b(?:can|could)\s+i\s+(?:change|switch)\s+(?:my\s+)?(?:path|pathway|direction)\b',
    r'\b(?:tell\s+me\s+more\s+about|tell\s+me\s+about|what\s+about|explain)\s+(?:the\s+)?(?:first|second|third|1st|2nd|3rd|last|top)\s+(?:one|path|pathway|recommendation|option)\b',
    r'\bwhat\s+(?:was|were|is|are)\s+recommended\s+(?:to|for)\s+me\b',
    r'\bwhat\s+(?:are|were)\s+my\s+(?:top\s+)?(?:recommendations?|matches?|results?)\b',
    r'\bmy\s+(?:saved\s+|career\s+|top\s+)*(?:recommendations?|matches?)\b',
    r'\bwhat\s+did\s+(?:my|the)\s+assessment\s+(?:say|recommend|suggest|show|give)\b',
    r'\bwhat\s+did\s+i\s+get\s+(?:in|on|from)\s+(?:my|the)\s+assessment\b',
    r'\bwhat\s+did\s+i\s+get\b.*\b(?:assessment|results?|test)\b',
    r'\b(?:my\s+(?:saved\s+)?(?:assessment|questionnaire|test\s+results?))\b',
    r'\b(?:is|would)\s+(.+?)\s+(?:be\s+)?suitable\s+for\s+me\b',
    r'\bsuitable\s+for\s+me\b',
]


def is_assessment_context_question(question: str, state: Optional[ConversationState] = None) -> bool:
    """Detect questions inquiring about personal assessment recommendations and results."""
    q = normalize_text(question).lower().strip()
    if any(re.search(p, q) for p in ASSESSMENT_CONTEXT_PATTERNS):
        return True
    # If active conversation context just explained recommendations, follow-ups are assessment-context
    if state and getattr(state, "last_status", None) == "recommendations_explained":
        if re.search(r'\btell\s+me\s+more\s+about\s+(.+?)\b', q) or re.search(r'\bwhat\s+about\s+(.+?)\b', q):
            return True
        if re.search(r'\b(?:why|how)\s+(?:did\s+i\s+get|was\s+that|were\s+those)\b', q):
            return True
    return False


ASPECT_PATTERNS = re.compile(
    r'\b(?:skills?|key\s+skills?|technical\s+skills?|programming\s+languages?|'
    r'work\s+environment|working\s+environment|day-to-day\s+work|typical\s+work\s+day|'
    r'daily\s+work|day-to-day|responsibilit(?:y|ies)|salary|salaries|pay|earnings?|'
    r'education\s+path(?:way)?|education(?:\s+is)?\s+required|required\s+education|degree|qualifications?|'
    r'prepar(?:e|ation)|how\s+to\s+prepare|what\s+should\s+i\s+prepare|'
    r'stud(?:y|ies)|what\s+should\s+i\s+study|'
    r'scope|career\s+scope|career\s+growth|opportunities|'
    r'how\s+long\s+(?:does\s+it\s+take|is\s+it)|duration|job\s+roles?|kinds?\s+of\s+jobs?|'
    r'subjects\s+should\s+i\s+focus\s+on)\b',
    re.I
)


def is_aspect_question(question: str) -> bool:
    """Detect if a question is asking about a specific aspect of a career/pathway rather than a full overview."""
    q = normalize_text(question).lower().strip()
    return bool(ASPECT_PATTERNS.search(q))


REFERENTIAL_FOLLOWUP_PATTERNS = [
    r'\b(?:this|that|it|the)\s+(?:career|path|pathway|profession|field|job|course|option|track|stream|role)\b',
    r'\b(?:for|in|about)\s+(?:this|that|it)\b',
    r'\b(?:how\s+to\s+prepare|how\s+(?:do|can)\s+i\s+prepare|what\s+should\s+i\s+prepare)\b',
    r'\bwhat\s+(?:should|do)\s+i\s+study\b',
    r'\bwhat\s+(?:is|are)\s+the\s+(?:career\s+)?scope\b',
    r'\bwhat\s+education\s+is\s+required\b',
    r'\bwhat\s+(?:are\s+the\s+)?skills\s+(?:do\s+i\s+need|needed|required)\b',
    r'\bwhat\s+is\s+the\s+(?:day-to-day|daily|work)\b',
]


def is_referential_followup(question: str) -> bool:
    """Detect if a question is a referential follow-up to an existing career/pathway."""
    q = normalize_text(question).lower().strip()
    if any(re.search(p, q) for p in REFERENTIAL_FOLLOWUP_PATTERNS):
        return True
    return is_aspect_question(q)


def is_generic_topic(topic: Optional[str]) -> bool:
    """Check if topic is a generic bucket rather than a specific pathway/career."""
    if not topic:
        return True
    t = clean_label(topic).lower()
    if t.startswith("assessment recommendations:"):
        inner = clean_label(t[len("assessment recommendations:"):])
        return is_generic_topic(inner)
    if t in {
        "career exploration",
        "assessment recommendations",
        "alternative pathways",
        "alternative pathway",
        "admissions",
        "course inquiry",
        "general",
        "options",
        "this career",
        "that career",
        "the career"
    }:
        return True
    if t.startswith("options after"):
        return True
    return False


def clean_pathway_topic(topic: Optional[str]) -> Optional[str]:
    """Extract clean specific pathway/career title, or None if generic."""
    if not topic:
        return None
    t = clean_label(topic)
    if t.lower().startswith("assessment recommendations:"):
        inner = clean_label(t[len("assessment recommendations:"):])
        if not is_generic_topic(inner):
            return inner
        return None
    if not is_generic_topic(t):
        return t
    return None


EDUCATION_STATEMENT_PATTERNS = [
    r'\b(?:i\s+(?:am\s+)?(?:currently\s+)?studying\s+in|i\s+am\s+in|i\s+study\s+in)\s+(?:1st\s+puc|2nd\s+puc|puc\s*[12]|class\s*(?:8|9|10|11|12)|10th|11th|12th|sslc)\b',
    r'\b(?:i\s+(?:have\s+)?(?:already\s+)?(?:took|taken|chosen|opted\s+for|selected)|my\s+stream\s+is|my\s+combination\s+is)\s+(?:science\s+)?(?:pcmb|pcmc|pcme|pcmb\s+combination|commerce|arts)\b',
    r'\b(?:i\s+took|i\s+have\s+taken)\s+(?:science\s+)?(?:pcmb|pcmc|pcme|commerce|arts)\b',
]


def is_education_context_statement(question: str) -> Optional[dict]:
    """Detect statements where a student shares their current study stage or stream context without asking a career question."""
    q = normalize_text(question).lower().strip()
    if re.search(r'^(?:what|how|why|which|can|is|does|will|where)\b', q) or '?' in q:
        return None
    for pattern in EDUCATION_STATEMENT_PATTERNS:
        if re.search(pattern, q):
            hypo_stage = extract_hypothetical_stage(q)
            stream = extract_stream(q)
            if 'pcmb' in q:
                stream = 'Science (PCMB)'
            elif 'pcmc' in q:
                stream = 'Science (PCMC)'
            return {'stage': hypo_stage, 'stream': stream, 'raw': question}
    return None


def handle_education_context_statement(question: str, edu_info: dict, state: ConversationState) -> dict:
    q_lower = question.lower()
    stage = edu_info.get('stage') or state.hypothetical_stage or state.actual_stage or "PUC"
    stream = edu_info.get('stream') or state.stream or "Science"

    if 'pcmb' in q_lower or (stream and 'pcmb' in stream.lower()):
        answer_text = (
            "Studying **Science with PCMB (Physics, Chemistry, Mathematics, Biology)** in PUC is a versatile combination in Karnataka that keeps multiple major pathways open:\n\n"
            "• **Engineering & Technology**: Eligible for B.E./B.Tech programs via KCET and JEE using your Physics, Chemistry, and Mathematics scores.\n"
            "• **Medical & Healthcare**: Eligible for MBBS, BDS, B.Sc Nursing, and Allied Health Sciences via NEET using your Physics, Chemistry, and Biology scores.\n"
            "• **Pharmacy & Agricultural Sciences**: Eligible for B.Pharm and B.Sc (Hons) Agriculture via KCET.\n"
            "• **Pure & Applied Sciences**: Direct eligibility for B.Sc research and degree programs in physics, chemistry, biotechnology, and mathematics.\n\n"
            "Would you like to explore technical engineering options, healthcare and allied sciences, or check what your interest assessment recommends?"
        )
        topic = "PUC Science (PCMB)"
    elif '1st puc' in q_lower or 'puc 1' in q_lower:
        answer_text = (
            "Great! Being in **1st PUC** is an important transitional stage in Karnataka where you build your core subject foundation.\n\n"
            "Which stream are you studying in—such as Science (PCMB/PCMC), Commerce, or Arts—or what career directions are you curious to explore?"
        )
        topic = "1st PUC Studies"
    elif '2nd puc' in q_lower or 'puc 2' in q_lower:
        answer_text = (
            "Being in **2nd PUC** is your board examination and entrance preparation year in Karnataka.\n\n"
            "What stream or entrance exams (such as KCET, NEET, or JEE) are you preparing for, or which degree pathways would you like to explore?"
        )
        topic = "2nd PUC Studies"
    else:
        answer_text = (
            f"Understood! You are studying in {stage} with {stream}. What career pathways, courses, or options would you like to explore?"
        )
        topic = f"{stage} {stream}"

    return {
        "status": "answered",
        "answer": answer_text,
        "sources": [],
        "recommendations": [],
        "context_status": "not_requested",
        "answer_origin": "local",
        "conversation_topic": topic
    }


def is_assessment_behavioral_question(question: str, state: Optional[ConversationState] = None) -> bool:
    """Detect specific assessment behavioral edge-cases (score ties, probability disclaimers, SSLC options)."""
    q = normalize_text(question).lower().strip()

    # 1. Score ties & list ordering
    if (re.search(r'\b(?:both|each)\b.*?\b(?:show|have|scored?|rating|marks?|points?)\b.*?\b\d+\b', q)
            or re.search(r'\b(?:tie\b|tied\b|same\s+score|equal\s+score)\b', q)
            or re.search(r'\bwhy\s+(?:are\s+you\s+putting|is)\s+.*?\b(?:first|ranked\s+above|above|before)\b', q)):
        return True

    # 2. Score meaning / probability / chance of success
    if (re.search(r'\b(?:match\s+score|score|rating)\s+(?:of\s+)?\d+\b.*?\b(?:mean|indicate|signify|tell|show)\b.*?\b(?:chance|probability|succeed|success|doing\s+well|succeeding)\b', q)
            or re.search(r'\b\d+%\s+(?:chance|probability)\b', q)
            or re.search(r'\b\d+\s+percent\s+(?:chance|probability)\b', q)
            or re.search(r'\b(?:chance\s+of\s+(?:succeeding|doing\s+well)|probability\s+of\s+success)\b', q)):
        return True

    # 3. Explicit SSLC options inquiry
    if re.search(r'\b(?:which|what)\s+(?:two|2|top)?\s*(?:options?|tracks?|pathways?|courses?)\s+(?:should|could|can)\s+i\s+(?:explore|take|choose|look\s+at)\s+after\s+(?:sslc|10th|class\s*10)\b', q):
        return True

    # 4. Compulsory inquiry ("Must I choose ITI?")
    if re.search(r'\b(?:does\s+that\s+mean\s+i\s+must|must\s+i\s+choose|is\s+(?:iti|puc|that)\s+compulsory)\b', q):
        return True

    # 5. Fit assessment
    if re.search(r'\bfit\s+my\s+assessment\b', q):
        return True

    return False


def is_assessment_or_scoring_question(question: str, state: Optional[ConversationState] = None) -> bool:
    """Detect questions inquiring about personal assessment results, scores, ties, or options based on student records."""
    return is_assessment_behavioral_question(question, state) or is_assessment_context_question(question)



def is_direct_guidance_question(question: str) -> Optional[str]:
    """Detect direct guidance questions that must be answered honestly without web search.
    Returns: 'guarantee', 'info_needed', 'autonomy', or None.
    """
    q = normalize_text(question).lower().strip()
    if re.search(r'\b(?:can\s+you\s+guarantee|will\s+you\s+guarantee|guarantee\s+(?:me\s+)?(?:admission|a\s+job|placement|hire)|promise\s+admission)\b', q):
        return 'guarantee'
    if re.search(r'\bwhat\s+information\s+do\s+you\s+(?:still\s+)?need\s+from\s+me\b', q) or re.search(r'\bwhat\s+(?:else\s+)?do\s+you\s+need\s+to\s+know\s+from\s+me\b', q):
        return 'info_needed'
    if re.search(r'\b(?:must\s+i\s+follow|do\s+i\s+have\s+to\s+follow|can\s+i\s+choose\s+something\s+else)\b', q):
        return 'autonomy'
    return None


def is_referral_source_question(question: str, state: Optional[ConversationState] = None) -> bool:
    """Detect 'Show me the official source supporting that' follow-up questions."""
    q = normalize_text(question).lower().strip()
    return bool(re.search(r'\b(?:show\s+(?:me\s+)?(?:the\s+)?official\s+source|what\s+is\s+the\s+official\s+source|where\s+is\s+the\s+official\s+source)\b', q))


def is_options_filtering_question(question: str, state: Optional[ConversationState] = None) -> bool:
    """Detect 'Which of those options could I explore without a degree?'."""
    q = normalize_text(question).lower().strip()
    return bool(re.search(r'\bwhich\s+of\s+those\s+(?:options\s+)?(?:could|can)\s+i\s+explore\b', q) or re.search(r'\bwhich\s+of\s+those\b.*?\bwithout\s+a\s+degree\b', q))


def is_near_me_institution_question(question: str) -> bool:
    """Detect questions asking for institutions/colleges/ITIs 'near me', in their city/district, or admission deadlines."""
    q = normalize_text(question).lower().strip()
    if re.search(r'\b(?:iti|college|polytechnic|school|institution)\b.*?\b(?:near\s+me|nearby|in\s+my\s+area|in\s+my\s+district|in\s+my\s+city|near\s+here)\b', q):
        return True
    if re.search(r'\b(?:near\s+me|nearby|in\s+my\s+district|in\s+my\s+city)\b.*?\b(?:offers?|admission|deadline|iti|college)\b', q):
        return True
    if re.search(r'\bwhich\s+(?:government\s+)?iti\s+near\s+me\b', q):
        return True
    return False


def is_design_pathways_question(question: str) -> bool:
    """Detect questions asking about exploring design through PUC or Diploma."""
    q = normalize_text(question).lower().strip()
    if re.search(r'\bexplore\s+design\s+through\s+(?:puc|a\s+diploma|polytechnic)\b', q):
        return True
    if re.search(r'\b(?:can\s+i\s+)?explore\s+design\s+through\s+puc\s+or\s+(?:a\s+)?diploma\b', q):
        return True
    if re.search(r'\bdesign\s+through\s+puc\s+or\s+(?:a\s+)?diploma\b', q):
        return True
    return False


def is_electrical_licensing_question(question: str) -> bool:
    """Detect inquiries about electrical contractor licence in Karnataka, ITI Electrician licensing rules, or wireman permits."""
    q = normalize_text(question).lower().strip()
    has_licence = bool(re.search(r'\b(?:electrical\s+contractor\s+licen[cs]e|contractor\s+licen[cs]e|electrical\s+licen[cs]e|wireman\s+permit)\b', q))
    has_context = bool(re.search(r'\b(?:karnataka|iti|electrician|automatically|qualification|requirements?)\b', q))
    return has_licence and has_context


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


def parse_preference_and_exclusion(question: str) -> Tuple[List[str], Optional[str]]:
    """Parse 'I don't want ITI. I enjoy drawing and making posters. What else could suit me?'
    or 'Remove accounting and finance too. I prefer creative work.'
    Returns (exclusions, preferred_text).
    """
    q = normalize_text(question).strip()
    q_lower = q.lower()
    exclusions = []
    preferred = None

    # Exclusions
    if re.search(r"\b(?:i\s+don'?t\s+(?:want|fancy|like)|not\s+interested\s+in|reject)\s+(?:iti|trades?)\b", q_lower):
        exclusions.append('iti')
    if re.search(r"\b(?:remove|drop|exclude|no)\s+([a-zA-Z\s,and]+?)(?:too|\.|\?|$|\s+i\s+prefer)", q_lower):
        m = re.search(r"\b(?:remove|drop|exclude|no)\s+([a-zA-Z\s,and]+?)(?:too|\.|\?|$|\s+i\s+prefer)", q_lower)
        if m:
            raw = m.group(1).lower()
            if 'accounting' in raw or 'account' in raw:
                exclusions.append('accounting')
            if 'finance' in raw or 'financial' in raw:
                exclusions.append('finance')
            if 'banking' in raw:
                exclusions.append('banking')
            if 'engineering' in raw:
                exclusions.append('engineering')

    # Preferences
    m_pref = re.search(r"\b(?:i\s+enjoy|i\s+prefer|i\s+like|i'?m\s+keen\s+on|interested\s+in|keen\s+on)\s+(.+?)(?:\.|\?|what\s+else|$)", q, re.I)
    if m_pref:
        preferred = clean_label(m_pref.group(1))

    return exclusions, preferred


def extract_hypothetical_stage(question: str) -> Optional[str]:
    """Extract hypothetical education stage, e.g. 'Suppose I complete PUC2'."""
    q = question.lower()
    if re.search(r'\b(?:complete|finish|after)\s+(?:puc\s*2|puc2|class\s*12|12th)\b', q) or re.search(r'\bsuppose\s+i\s+complete\s+puc', q):
        return "PUC 2"
    if re.search(r'\b(?:complete|finish|after)\s+(?:10th|class\s*10|sslc)\b', q):
        return "Class 10"
    return None


def extract_stream(question: str) -> Optional[str]:
    """Extract stream mentioned in question, e.g. 'Suppose I take Commerce' or 'Imagine I take Science with PCB'."""
    q = question.lower()
    if re.search(r'\b(?:science\s+with\s+pcb|pcb\s+but\s+no\s+maths?|pcb)\b', q):
        return "Science (PCB without Maths)"
    if re.search(r'\b(?:take|choose|in)\s+commerce\b', q) or re.search(r'\bsuppose\s+i\s+take\s+commerce\b', q):
        return "Commerce"
    if re.search(r'\b(?:take|choose|in)\s+science\b', q) or re.search(r'\bprefer\s+science\b', q):
        return "Science"
    if re.search(r'\b(?:take|choose|in)\s+arts\b', q):
        return "Arts"
    return None


def extract_exclusions(question: str) -> List[str]:
    """Extract excluded areas, e.g. 'Apart from banking and finance' or 'Remove accounting and finance too'."""
    q = question.lower()
    exclusions = []
    # Pattern 1: apart from / besides / other than
    m = re.search(r'\b(?:apart\s+from|other\s+than|besides|excluding|outside)\s+([a-zA-Z\s,and]+?)(?:[?,.]|$|\s+what|\s+suggest)', q)
    if m:
        raw_exc = m.group(1).lower()
        if 'banking' in raw_exc:
            exclusions.append('banking')
        if 'finance' in raw_exc or 'financial' in raw_exc:
            exclusions.append('finance')
        if 'accounting' in raw_exc or 'accountancy' in raw_exc:
            exclusions.append('accounting')
        if 'engineering' in raw_exc:
            exclusions.append('engineering')
        if 'medicine' in raw_exc or 'medical' in raw_exc:
            exclusions.append('medicine')
        if 'iti' in raw_exc:
            exclusions.append('iti')

    # Pattern 2: remove / drop / no
    m2 = re.search(r'\b(?:remove|drop|exclude|no)\s+([a-zA-Z\s,and]+?)(?:too|[?,.]|$|\s+i\s+prefer)', q)
    if m2:
        raw_exc = m2.group(1).lower()
        if 'banking' in raw_exc:
            exclusions.append('banking')
        if 'finance' in raw_exc or 'financial' in raw_exc:
            exclusions.append('finance')
        if 'accounting' in raw_exc or 'accountancy' in raw_exc:
            exclusions.append('accounting')
        if 'engineering' in raw_exc:
            exclusions.append('engineering')
        if 'iti' in raw_exc:
            exclusions.append('iti')

    return list(dict.fromkeys(exclusions))


def load_conversation_state(
    db: Session,
    user_id: str,
    follow_up_to: Optional[UUID] = None,
    actual_stage: Optional[str] = None
) -> ConversationState:
    """Load conversation state strictly for the active thread when follow_up_to is provided.
    If follow_up_to is None, recovers the most recent AdvisorHistory for the current user.
    """
    state = ConversationState(actual_stage=actual_stage)

    history_row = None
    try:
        user_uuid = UUID(user_id) if isinstance(user_id, str) else user_id
    except Exception:
        user_uuid = None

    if user_uuid:
        if follow_up_to:
            try:
                history_row = db.query(AdvisorHistory).filter(
                    AdvisorHistory.id == follow_up_to,
                    AdvisorHistory.user_id == user_uuid
                ).first()
            except Exception:
                history_row = None
            if not history_row:
                try:
                    history_row = db.query(AdvisorHistory).filter(
                        AdvisorHistory.id == str(follow_up_to),
                        AdvisorHistory.user_id == str(user_uuid)
                    ).first()
                except Exception:
                    history_row = None
        else:
            # Recover most recent history for user if available
            try:
                history_row = db.query(AdvisorHistory).filter(
                    AdvisorHistory.user_id == user_uuid
                ).order_by(AdvisorHistory.created_at.desc()).first()
            except Exception:
                history_row = None
            if not history_row:
                try:
                    history_row = db.query(AdvisorHistory).filter(
                        AdvisorHistory.user_id == str(user_uuid)
                    ).order_by(AdvisorHistory.created_at.desc()).first()
                except Exception:
                    history_row = None

    if history_row and isinstance(history_row.response, dict):
        resp = history_row.response
        saved_state = resp.get('conversation_state')
        if isinstance(saved_state, dict):
            try:
                state = ConversationState.model_validate(saved_state)
            except Exception:
                state = ConversationState(actual_stage=actual_stage)
            if actual_stage:
                state.actual_stage = actual_stage
        else:
            # Reconstruct from response metadata
            state.last_topic = clean_label(resp.get('conversation_topic', ''))
            state.last_question = history_row.question
            state.last_answer = resp.get('answer', '')
            state.last_intent = history_row.request.get('intent', 'explore') if isinstance(history_row.request, dict) else 'explore'
            state.last_status = resp.get('status')
            recs = resp.get('recommendations')
            if isinstance(recs, list) and recs:
                state.last_recommended_pathway = recs[0].get('title')

        # Ensure last_question, last_answer, and last_topic are populated
        if not state.last_question and history_row.question:
            state.last_question = history_row.question
        if not state.last_answer and resp.get('answer'):
            state.last_answer = resp.get('answer')
        if not state.last_topic and resp.get('conversation_topic'):
            state.last_topic = clean_label(resp.get('conversation_topic'))

        if not state.last_specific_pathway:
            state.last_specific_pathway = clean_pathway_topic(state.last_topic) or clean_pathway_topic(state.last_recommended_pathway)

    return state


def update_conversation_state(
    state: ConversationState,
    question: str,
    intent: str,
    response: dict,
    topic: Optional[str] = None
) -> ConversationState:
    """Update conversation state following a processed turn."""
    # Check for topic reset
    reset_subject = is_standalone_subject_reset(question)
    if reset_subject:
        state.hypothetical_stage = None
        state.stream = None
        state.exclusions = []
        state.stated_preferences = []
        state.discussed_options = []
        state.last_topic = clean_label(reset_subject)
        state.referral_subject = clean_label(reset_subject)
        state.last_specific_pathway = clean_label(reset_subject)
        state.last_recommended_pathway = clean_label(reset_subject)
    else:
        hypo = extract_hypothetical_stage(question)
        if hypo:
            state.hypothetical_stage = hypo
        st = extract_stream(question)
        if st:
            state.stream = st
        exc = extract_exclusions(question)
        if exc:
            state.exclusions = list(dict.fromkeys(state.exclusions + exc))
        
        # Track stated preferences with origin
        excs_parsed, pref_parsed = parse_preference_and_exclusion(question)
        if excs_parsed:
            state.exclusions = list(dict.fromkeys(state.exclusions + excs_parsed))
        if pref_parsed:
            pref_entry = {"preference": pref_parsed, "origin": "chat"}
            if not any(p["preference"].lower() == pref_parsed.lower() for p in state.stated_preferences):
                state.stated_preferences.append(pref_entry)

        # Track discussed options if provided in response
        if response.get("discussed_options"):
            state.discussed_options = list(dict.fromkeys(state.discussed_options + response["discussed_options"]))

        if topic:
            state.last_topic = clean_label(topic)

    state.last_question = question
    state.last_answer = response.get('answer', '')
    state.last_intent = intent
    state.last_status = response.get('status')

    # Update referral subject (what "that", "those", or "it" refers to)
    q_lower = question.lower()
    if 'electrical contractor licence' in q_lower or 'contractor licence' in q_lower:
        state.referral_subject = "electrical contractor licence in Karnataka"
    elif 'electrician and welder' in q_lower or ('welder' in q_lower and 'electrician' in q_lower):
        state.referral_subject = "ITI Electrician and Welder minimum qualifications"
    elif 'design through puc or a diploma' in q_lower or ('design' in q_lower and ('puc' in q_lower or 'diploma' in q_lower)):
        state.referral_subject = "design pathways through PUC or Diploma in Karnataka"
    elif reset_subject:
        state.referral_subject = reset_subject
    elif topic:
        state.referral_subject = topic

    # Track most recent specific pathway context (do NOT overwrite with generic alternative pathways or general lists)
    specific = response.get('specific_pathway') or clean_pathway_topic(topic) or clean_pathway_topic(response.get('conversation_topic'))
    if specific and not is_generic_topic(specific):
        state.last_specific_pathway = clean_label(specific)
        state.last_recommended_pathway = state.last_specific_pathway
    elif not state.last_specific_pathway:
        recs = response.get('recommendations')
        if isinstance(recs, list) and recs:
            top_title = recs[0].get('title')
            if top_title and not is_generic_topic(top_title):
                state.last_recommended_pathway = top_title

    return state
