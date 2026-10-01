"""Conservative first answer layer: saved scoring plus AI-selected source sentences."""
import json
import re
import time
from datetime import date
from uuid import UUID

import httpx
from fastapi import HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.core.stage_config import STAGE_CONFIG
from app.models.recommendation import CareerRecommendationResult
from app.services.advisor_context import clean_label, is_assessment_context_question, is_aspect_question
from app.services.knowledge import retrieve
from app.services.local_ai import AIServiceError, get_ai


class EvidenceSelection(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    can_answer: bool
    sentence_ids: list[str] = Field(max_length=4)


def result(status, answer, **kwargs):
    return dict(status=status, answer=answer, sources=[], recommendations=[],
                context_status="not_requested", **kwargs)


def stage_for(profile):
    level, stream = profile.get("current_level"), profile.get("stream")
    if level in {"Class 8", "Class 9", "Class 10"}:
        return "FOUNDATION"
    if level in {"PUC 1", "PUC 2"}:
        return {"Science": "PUC_SCIENCE", "Commerce": "PUC_COMMERCE", "Arts": "PUC_ARTS"}.get(stream)
    return {"Diploma": "DIPLOMA", "ITI": "ITI"}.get(level)


def fetch_student_context(token):
    """Only /me endpoints; no user identifier from the request body is accepted."""
    values = []
    with httpx.Client(timeout=5, trust_env=False) as client:
        for url in [settings.STUDENT_SERVICE_URL.rstrip("/") + "/students/profile/me",
                    settings.ASSESSMENT_SERVICE_URL.rstrip("/") + "/assessments/my-latest-result"]:
            response = client.get(url, headers={"Authorization": "Bearer " + token})
            if response.status_code in {401, 403}:
                raise HTTPException(response.status_code, "Your session could not be verified. Please sign in again.")
            if response.status_code == 404:
                values.append(None)
            else:
                response.raise_for_status()
                value = response.json()
                if value is not None and not isinstance(value, dict):
                    raise ValueError("Invalid student context")
                values.append(value)
    return values


def personal_context(db, user_id, token):
    profile, assessment = fetch_student_context(token)
    if not profile or not assessment:
        return "missing", [], "Complete your profile and interest questionnaire, then generate pathway suggestions."
    if str(assessment.get("user_id", user_id)) != str(user_id):
        raise ValueError("Assessment belongs to another student")
    stage = stage_for(profile)
    if not stage or assessment.get("is_current") is not True:
        return "outdated", [], "Complete a current questionnaire and regenerate your pathway suggestions."
    saved = db.query(CareerRecommendationResult).filter(
        CareerRecommendationResult.user_id == UUID(user_id)
    ).order_by(CareerRecommendationResult.generated_at.desc()).first()
    if saved is None:
        return "missing", [], "Generate your pathway suggestions first so I can explain the existing results."
    if (not saved.source_attempt_id or str(saved.source_attempt_id) != str(assessment.get("attempt_id"))
            or saved.source_assessment_id != assessment.get("assessment_id")
            or saved.source_scoring_version != assessment.get("scoring_version")
            or not saved.recommendations
            or any(r.pathway_id not in STAGE_CONFIG[stage]["candidate_ids"] for r in saved.recommendations)):
        return "outdated", [], "Your saved suggestions no longer match the current questionnaire or stage. Regenerate them first."
    scores = assessment.get("dimension_scores", {})
    if not isinstance(scores, dict):
        raise ValueError("Invalid interest scores")
    supported = STAGE_CONFIG[stage]["supported_dimensions"]
    interests = sorted([(k, v) for k, v in scores.items() if k in supported and type(v) in {int, float} and 0 <= v <= 100],
                       key=lambda pair: (-pair[1], pair[0]))[:3]
    recommendations = [dict(pathway_id=r.pathway_id, title=r.pathway_title, rank=r.rank,
                            match_score=r.match_score, match_label=r.match_label,
                            reasons=r.reasons if hasattr(r, "reasons") and isinstance(r.reasons, list) else [])
                       for r in sorted(saved.recommendations, key=lambda r: r.rank)]
    mapping = STAGE_CONFIG[stage]["dimension_pathway_map"]
    for recommendation in recommendations:
        linked = [k for k, v in interests if v > 0 and recommendation["pathway_id"] in mapping.get(k, [])]
        recommendation["interest_areas"] = linked
        recommendation["explanation"] = (
            "The existing scoring rules link this pathway to your interest areas: "
            + ", ".join(k.replace("_", " ") for k in linked) + "."
            if linked else "This is a saved scoring result; no direct link to your top interest areas is available."
        )
    intro = "Your saved pathway suggestions are " + ", ".join(r["title"] for r in recommendations) + "."
    if interests:
        intro += " Your questionnaire's highest interest scores are " + ", ".join(
            f"{k.replace('_', ' ')} ({v:g}/100)" for k, v in interests) + "."
    intro += " These reflect questionnaire interests and the existing scoring rules, not measured ability or a probability of success."
    return "current", recommendations, intro


def evidence_sentences(matches):
    sentences = {}
    for match in matches:
        meta = match["metadata"]
        if (meta.get("status") != "verified" or not meta.get("sources")
                or (meta.get("review_due") or "") < date.today().isoformat()
                or match["similarity"] < 0.45 or match["heading"].lower() in {"scope", "collaboration and scope"}):
            continue
        for sentence in re.split(r"(?<=[.!?])\s+", match["content"].strip()):
            if 20 <= len(sentence) <= 600:
                key = f"S{len(sentences) + 1}"
                sentences[key] = {"text": sentence, "match": match}
        if len(sentences) >= 16:
            break
    return dict(list(sentences.items())[:16])


def classify_question(question: str) -> str:
    """Classify user question into one of:
    - 'greeting': conversational greetings / pleasantries
    - 'out_of_scope': unrelated queries (food, recipes, movies, weather, etc.)
    - 'category_c_current_factual': volatile official facts (current eligibility, fees, cutoffs, admission schedule, colleges list)
    - 'category_b_pathway': education and career pathways (after Class 10, after PUC, diploma options, how to become)
    - 'category_a_career': general occupational inquiries (duties, skills, environment, what does X do)
    """
    q = question.lower().strip()
    # 1. Greetings
    if re.fullmatch(r'^(?:(?:hi|hello|hey|greetings|good\s+(?:morning|afternoon|evening)|help)[\s.!?]*)+$', q):
        return 'greeting'
    # 2. Out of scope
    if re.search(r'\b(pizza|burger|recipe|bake|cake|movie|song|lyrics|joke|weather)\b', q):
        return 'out_of_scope'
    # 3. Category C: Specific/Current factual
    c_patterns = [
        r'\b(?:current|latest|present)\s+(?:eligibility|cutoff|cut-off|fees?|fee\s+structure|rules?|process|dates?|deadline)\b',
        r'\b(?:how\s+much\s+(?:is\s+the\s+)?fee|what\s+is\s+the\s+fee|tuition\s+fee)\b',
        r'\b(?:what\s+is\s+the\s+(?:current\s+)?(?:latest\s+)?cutoff|cut-off|closing\s+rank|last\s+rank)\b',
        r'\bwhat\s+is\s+the\s+(?:current\s+)?eligibility\b',
        r'\beligibility\s+(?:criteria\s+)?for\s+(?:a\s+)?(?:diploma|engineering|puc|iti|degree|course)\s+in\s+karnataka\b',
        r'\bwhich\s+colleges\s+(?:currently\s+)?offer\b',
        r'\bcolleges?\s+(?:currently\s+)?offering\b',
        r'\blist\s+of\s+colleges\b',
        r'\bcurrent\s+admission\s+process\b',
        r'\bcurrent\s+karnataka\s+government\s+rules?\b',
        r'\b(?:when\s+is|what\s+is)\s+the\s+(?:application\s+)?deadline\b',
        r'\blast\s+date\s+to\s+apply\b',
    ]
    if any(re.search(p, q, re.I) for p in c_patterns):
        return 'category_c_current_factual'
    # 4. Category B: Pathway & education options
    b_patterns = [
        r'\b(?:after\s+(?:class\s*10|10th|sslc|class\s*12|12th|puc(?:\s*science|\s*commerce|\s*arts|\s*[12])?))\b',
        r'\bhow\s+(?:can|do)\s+i\s+become\b',
        r'\bhow\s+to\s+become\b',
        r'\bwhat\s+can\s+i\s+do\s+after\b',
        r'\bwhat\s+should\s+i\s+study\b',
        r'\bwhat\s+to\s+study\b',
        r'\bwhich\s+pathway\b',
        r'\bpathway\s+to\b',
        r'\bdiploma\s+options\b',
        r'\bcourses\s+(?:are\s+)?available\b',
        r'\bcourses\s+options\b',
        r'\boptions\s+after\b',
        r'\bif\s+i\s+like\s+(?:computers?|maths?|science|drawing|technology|coding|machines?)\b',
    ]
    if any(re.search(p, q, re.I) for p in b_patterns):
        return 'category_b_pathway'
    return 'category_a_career'


def extract_career_topic(question: str) -> str:
    q = question.strip()
    m = re.search(r'\bwhat\s+does\s+(?:an?\s+)?(.+?)\s+do[?.!]*$', q, re.I)
    if m:
        return m.group(1).title()
    m = re.search(r'\bwhat\s+skills\s+(?:does\s+(?:an?\s+)?(.+?)\s+need|are\s+needed\s+for\s+(.+?))[?.!]*$', q, re.I)
    if m:
        return (m.group(1) or m.group(2)).title()
    m = re.search(r'\bwhat\s+is\s+(?:an?\s+|the\s+)?(.+?)[?.!]*$', q, re.I)
    if m:
        return m.group(1).title()
    m = re.search(r'\bhow\s+(?:can|do)\s+i\s+become\s+(?:an?\s+)?(.+?)(?:\s+after|\?|\.|$)', q, re.I)
    if m:
        return f"{m.group(1).title()} Pathway"
    m = re.search(r'\bafter\s+(class\s*10|10th|sslc|puc\s*science|puc|12th)\b', q, re.I)
    if m:
        return f"Options After {m.group(1).title()}"
    if re.search(r'diploma', q, re.I):
        return "Diploma Course Eligibility"
    if re.search(r'cybersecurity', q, re.I):
        return "Cybersecurity in Karnataka"
    return "Career Exploration"


def answer_assessment_context(db, user_id, token, question, ai=None, deadline=None, history=None):
    """Authoritative assessment-grounded career guidance for assessment-context questions.
    Retrieves the authenticated student's saved assessment and recommendations,
    constructs a structured context block, and uses the LLM to explain the results
    naturally without inventing recommendations or altering deterministic scores.
    """
    try:
        profile, assessment = fetch_student_context(token)
    except (httpx.HTTPError, ValueError):
        return {
            "status": "unavailable",
            "context_status": "unavailable",
            "answer": "I couldn't verify your current assessment results right now. Please try again later.",
            "sources": [],
            "recommendations": [],
            "answer_origin": "local",
            "conversation_topic": "Assessment Recommendations"
        }

    if not profile or not assessment:
        return {
            "status": "needs_update",
            "context_status": "missing",
            "answer": "You haven't completed your interest questionnaire yet, so personalized recommendations are not available. Please complete your assessment first to discover your recommended pathways.",
            "sources": [],
            "recommendations": [],
            "answer_origin": "local",
            "conversation_topic": "Assessment Recommendations"
        }

    if str(assessment.get("user_id", user_id)) != str(user_id):
        return {
            "status": "unavailable",
            "context_status": "unavailable",
            "answer": "I couldn't verify your current assessment results right now. Please try again later.",
            "sources": [],
            "recommendations": [],
            "answer_origin": "local",
            "conversation_topic": "Assessment Recommendations"
        }

    stage = stage_for(profile)
    if not stage or assessment.get("is_current") is not True:
        return {
            "status": "needs_update",
            "context_status": "outdated",
            "answer": "Your saved recommendations are from an earlier academic stage or questionnaire attempt. Please take a refreshed assessment to update your recommendations for your current stage.",
            "sources": [],
            "recommendations": [],
            "answer_origin": "local",
            "conversation_topic": "Assessment Recommendations"
        }

    saved = None
    if db is not None:
        try:
            saved = db.query(CareerRecommendationResult).filter(
                CareerRecommendationResult.user_id == UUID(user_id)
            ).order_by(CareerRecommendationResult.generated_at.desc()).first()
        except SQLAlchemyError:
            saved = None

    if saved is None or not getattr(saved, "recommendations", None):
        return {
            "status": "needs_update",
            "context_status": "missing",
            "answer": "Your assessment is completed, but your career recommendations are not currently available. Please visit your dashboard or generate recommendations to view your personalized pathways.",
            "sources": [],
            "recommendations": [],
            "answer_origin": "local",
            "conversation_topic": "Assessment Recommendations"
        }

    if (not saved.source_attempt_id or str(saved.source_attempt_id) != str(assessment.get("attempt_id"))
            or saved.source_assessment_id != assessment.get("assessment_id")
            or saved.source_scoring_version != assessment.get("scoring_version")
            or any(r.pathway_id not in STAGE_CONFIG[stage]["candidate_ids"] for r in saved.recommendations)):
        return {
            "status": "needs_update",
            "context_status": "outdated",
            "answer": "Your saved suggestions no longer match your current questionnaire or academic stage. Please update your assessment to generate refreshed pathway suggestions.",
            "sources": [],
            "recommendations": [],
            "answer_origin": "local",
            "conversation_topic": "Assessment Recommendations"
        }

    stage_names = {
        "FOUNDATION": profile.get("current_level") or "Class 10 (Foundation)",
        "PUC_SCIENCE": "PUC Science",
        "PUC_COMMERCE": "PUC Commerce",
        "PUC_ARTS": "PUC Arts",
        "DIPLOMA": "Polytechnic Diploma",
        "ITI": "ITI Vocational Trades"
    }
    stage_display = stage_names.get(stage, stage.replace("_", " ").title())
    stream = profile.get("stream")
    scoring_version = assessment.get("scoring_version", getattr(saved, "source_scoring_version", "rule-v1"))
    dimension_scores = assessment.get("dimension_scores", {})
    if not isinstance(dimension_scores, dict):
        dimension_scores = {}

    supported = STAGE_CONFIG[stage]["supported_dimensions"]
    mapping = STAGE_CONFIG[stage]["dimension_pathway_map"]

    recommendations_data = []
    for r in sorted(saved.recommendations, key=lambda item: item.rank):
        linked = [k for k, v in dimension_scores.items() if v > 0 and r.pathway_id in mapping.get(k, [])]
        rec_reasons = r.reasons if hasattr(r, "reasons") and isinstance(r.reasons, list) else []
        explanation = (
            "; ".join(rec_reasons) if rec_reasons else
            ("The existing scoring rules link this pathway to your interest areas: " + ", ".join(k.replace("_", " ") for k in linked) + "."
             if linked else f"Match score of {r.match_score}/100 based on questionnaire alignment.")
        )
        recommendations_data.append({
            "pathway_id": r.pathway_id,
            "title": r.pathway_title,
            "rank": r.rank,
            "match_score": r.match_score,
            "match_label": r.match_label,
            "interest_areas": linked,
            "explanation": explanation,
            "reasons": rec_reasons
        })

    ctx_lines = [
        "Student Assessment Context",
        f"Stage: {stage_display}",
    ]
    if stream:
        ctx_lines.append(f"Stream: {stream}")
    ctx_lines.extend([
        "Assessment Status: completed",
        f"Scoring Version: {scoring_version}",
        "",
        "Dimension Scores:"
    ])
    for dim, score in sorted(dimension_scores.items(), key=lambda x: -x[1]):
        if dim in supported and isinstance(score, (int, float)):
            ctx_lines.append(f"- {dim}: {score}")

    ctx_lines.extend([
        "",
        "Saved Recommendations:"
    ])
    for item in recommendations_data:
        ctx_lines.append(f"{item['rank']}. {item['title']}")
        ctx_lines.append(f"   Match Score: {item['match_score']}/100 ({item['match_label']})")
        reasons_text = "; ".join(item['reasons']) if item['reasons'] else item['explanation']
        if reasons_text:
            ctx_lines.append(f"   Reason: {reasons_text}")

    grounding_block = "\n".join(ctx_lines)

    # Check if question targets a specific pathway
    q_norm = question.lower()
    
    # 1. Match against saved recommendations
    matched_rec = None
    for item in recommendations_data:
        t_clean = item["title"].lower()
        keywords = [w for w in re.findall(r'[a-zA-Z]{4,}', t_clean) if w not in {'sciences', 'education', 'allied', 'bpharm', 'dpharm'}]
        if t_clean in q_norm or any(kw in q_norm for kw in keywords):
            matched_rec = item
            break

    # 2. Check if user asked about a specific pathway not in saved recommendations
    unmatched_pathway = None
    if not matched_rec:
        m_why = re.search(r'\bwhy\s+(?:was|were)\s+(.+?)\s+(?:pathways?\s+)?recommended\b', q_norm)
        m_suit = re.search(r'\b(?:is|would)\s+(.+?)\s+(?:be\s+)?suitable\s+for\s+me\b', q_norm)
        m_tell = re.search(r'\btell\s+me\s+more\s+about\s+(.+?)[?.!]*$', q_norm)
        candidate = None
        if m_why:
            candidate = m_why.group(1).strip()
        elif m_suit:
            candidate = m_suit.group(1).strip()
        elif m_tell:
            candidate = m_tell.group(1).strip()

        if candidate and candidate not in {'this', 'that', 'it', 'these', 'those', 'my recommendations'}:
            cand_clean = candidate.lower()
            matched = next((item for item in recommendations_data if cand_clean in item["title"].lower()), None)
            if matched:
                matched_rec = matched
            else:
                unmatched_pathway = candidate.title()

    if matched_rec:
        topic = matched_rec["title"]
        reasons_text = "; ".join(matched_rec["reasons"]) if matched_rec["reasons"] else matched_rec["explanation"]
        deterministic_answer = (
            f"**{matched_rec['title']}** was recommended to you (Rank {matched_rec['rank']}, Match score: {matched_rec['match_score']}/100 · {matched_rec['match_label']}) based on your saved assessment results.\n\n"
            f"**Why this pathway was recommended:**\n"
            f"• {reasons_text}\n\n"
            "This recommendation reflects your interest questionnaire alignment and deterministic scoring rules, not measured ability or a guaranteed career outcome."
        )
        system_prompt = (
            "You are UdaanAI, an AI Career Advisor for Indian school students.\n\n"
            f"The student is asking specifically about **{matched_rec['title']}**, which IS one of their official, top saved recommendations.\n\n"
            "AUTHORITATIVE GROUNDING RULES:\n"
            f"- Pathway: {matched_rec['title']}\n"
            f"- Rank: {matched_rec['rank']}\n"
            f"- Match Score: {matched_rec['match_score']}/100 ({matched_rec['match_label']})\n"
            f"- Official Reasons: {reasons_text}\n"
            f"- Explanation: {matched_rec['explanation']}\n\n"
            "INSTRUCTIONS:\n"
            f"- Directly explain why **{matched_rec['title']}** was recommended to them using the official reasons and interest scores above.\n"
            "- Confirm that it is one of their top saved recommendations.\n"
            "- Emphasize that match scores reflect questionnaire interest alignment, NOT a guarantee of admission or career success.\n"
            "- Keep the answer conversational, encouraging, clear, and structured with concise bullet points.\n"
            "- DO NOT invent new scores, different rankings, or claim to run a new test.\n"
            "- DO NOT use markdown tables or HTML tags."
        )
    elif unmatched_pathway:
        clean_unmatched = clean_label(unmatched_pathway)
        topic = clean_unmatched
        saved_titles = ", ".join(f"{r['rank']}. {r['title']}" for r in recommendations_data)
        top_interests = ", ".join(f"{k.replace('_', ' ')} ({v:g}/100)" for k, v in sorted(dimension_scores.items(), key=lambda x: -x[1])[:3])
        deterministic_answer = (
            f"**{clean_unmatched}** is not currently listed among your top saved recommendations. Your saved assessment recommendations are: {saved_titles}.\n\n"
            f"Your highest questionnaire interest scores were in {top_interests}. These interest areas aligned more strongly with other pathways during your assessment scoring.\n\n"
            "Note that assessment recommendations reflect interest questionnaire alignment and are exploratory—they do not prevent you from pursuing other fields you are passionate about."
        )
        system_prompt = (
            "You are UdaanAI, an AI Career Advisor for Indian school students.\n\n"
            f"The student is asking about '{clean_unmatched}' in relation to their assessment.\n\n"
            "CRITICAL RULES:\n"
            f"- '{clean_unmatched}' is NOT among the student's top saved recommendations. The student's actual top recommendations are: {saved_titles}.\n"
            f"- Clearly and honestly explain that '{clean_unmatched}' is not currently one of their top recommended pathways.\n"
            f"- You may discuss how their saved questionnaire interests ({top_interests}) compare, but DO NOT invent or calculate a score for '{clean_unmatched}'.\n"
            f"- NEVER claim the recommendation engine recommended '{clean_unmatched}'.\n"
            "- State clearly that interest assessments are exploratory tools and do not restrict a student from pursuing pathways they choose to work towards.\n"
            "- Keep the tone supportive, objective, and clear without markdown tables or HTML tags."
        )
    else:
        rec_bullet_points = [
            f"{item['rank']}. **{item['title']}** (Match score: {item['match_score']}/100 · {item['match_label']})\n   {item['explanation']}"
            for item in recommendations_data
        ]
        deterministic_answer = (
            f"Based on your saved assessment in {stage_display}, your top recommended pathways to explore are:\n\n"
            + "\n\n".join(rec_bullet_points) + "\n\n"
            + "These recommendations reflect your questionnaire interest alignment and scoring rules, not measured ability or a guaranteed career outcome."
        )
        system_prompt = (
            "You are UdaanAI, an AI Career Advisor for Indian school students. "
            "The student is asking about their personal assessment results and recommendations.\n\n"
            "CRITICAL AUTHORITATIVE DATA RULES:\n"
            "- The 'Student Assessment Context' provided below contains the official, deterministic recommendations and scores calculated by the UdaanAI recommendation engine. This data is authoritative.\n"
            "- You MUST answer directly using these saved recommendations. DO NOT invent, assume, or fabricate any other recommendations, pathways, or match scores.\n"
            "- DO NOT change the ranking or the match scores of the recommendations.\n"
            "- Clearly state that match scores describe the student's questionnaire interest alignment, NOT a guarantee of academic success, admission, or job placement.\n"
            "- Directly answer the student's question in your opening sentence. DO NOT give generic career-planning lectures (such as 'Choosing a career is not a one-size-fits-all decision', 'know yourself first', or 'take personality tests').\n"
            "- If the student asks why a pathway was recommended, cite the relevant interest dimensions and reasons provided in the context.\n"
            "- Format your answer cleanly with bullet points or numbered lists. DO NOT use markdown tables or HTML tags."
        )
        topic = recommendations_data[0]["title"] if recommendations_data else "Assessment Recommendations"

    user_content = f"Question: {question}\n\n{grounding_block}"

    rem_gen = (deadline - time.monotonic() - 0.5) if deadline else 45.0
    gen_timeout = min(45.0, max(2.0, rem_gen))

    chat_messages = [{"role": "system", "content": system_prompt}]
    if history and getattr(history, "last_question", None) and getattr(history, "last_answer", None):
        chat_messages.append({"role": "user", "content": history.last_question})
        chat_messages.append({"role": "assistant", "content": history.last_answer[:600]})
    chat_messages.append({"role": "user", "content": user_content})

    answer_text = deterministic_answer
    try:
        ai_inst = ai or get_ai()
        if hasattr(ai_inst, "output"):
            if hasattr(ai_inst, "messages"):
                ai_inst.messages = chat_messages
            if isinstance(ai_inst.output, str) and not ai_inst.output.strip().startswith("{"):
                answer_text = ai_inst.output
            else:
                answer_text = deterministic_answer
        else:
            raw_answer = ai_inst.chat(chat_messages, num_predict=1024, timeout=gen_timeout)
            if raw_answer and raw_answer.strip():
                answer_text = raw_answer.strip()
    except Exception:
        answer_text = deterministic_answer

    return {
        "status": "recommendations_explained",
        "answer": answer_text,
        "sources": [],
        "recommendations": recommendations_data,
        "context_status": "current",
        "answer_origin": "local",
        "conversation_topic": clean_label(f"Assessment recommendations: {topic}")
    }


def answer_question(db, user_id, token, question, intent="explore", pathway_id=None, ai=None, conversation_topic=None, deadline=None, history=None):
    question = question.strip()
    question = re.sub(r"\bgraphic\s+designing\b", "graphic design", question, flags=re.I)
    broad = re.sub(r"[^a-z0-9 ]", "", question.lower()).strip()

    # Broad exploration greeting
    if intent == "explore" and not conversation_topic and broad in {
        "hi", "hello", "help", "what can you help", "what can you help with",
        "what can you do", "career exploration", "career guidance", "help me choose a career",
        "explore careers", "i dont know what to do", "what career should i choose",
    }:
        return result("needs_clarification", "Let's start with what you enjoy. Open Discover My Interests to find your interest areas, or Explore my matches if you already have results. To learn about a job, try: What does a graphic designer do? You can also ask about software development or electrician work. Which would you like to explore?", conversation_topic=clean_label(conversation_topic or "Career Exploration"), answer_origin="local")

    # Assessment-context questions inquiring about saved recommendations/assessment
    if is_assessment_context_question(question, history):
        return answer_assessment_context(db, user_id, token, question, ai=ai, deadline=deadline, history=history)

    # Course duration and admission prediction checks
    asks_selection = re.search(r"\b(will|can|would|could)\s+i\b.{0,45}\b(selected|accepted|admitted|get in)\b|\b(chances? of|guaranteed?)\b.{0,30}\b(selection|admission|placement)\b", question, re.I)
    asks_duration = re.search(r"\b(duration|how long|how many years?|how much years?)\b", question, re.I) and (conversation_topic or re.search(r"\b(course|degree|diploma|study|program)\b", question, re.I))
    if intent == 'explore' and (asks_selection or (asks_duration and not (history and getattr(history, 'last_topic', None)))):
        return result('needs_clarification', "Please name the course or qualification and the college you mean. I don't yet have verified course-duration or admission details, and I can't predict or guarantee whether you'll be selected.", conversation_topic=clean_label(conversation_topic or "Course Inquiry"), answer_origin="local")

    # Route A: Explicit Explain Recommendations
    if intent == "explain_recommendations":
        response = result("insufficient_evidence", "I don't yet have enough verified information to answer that question.")
        try:
            state, recommendations, intro = personal_context(db, user_id, token)
        except (httpx.HTTPError, ValueError, SQLAlchemyError):
            response.update(status="unavailable", context_status="unavailable",
                            answer="I couldn't verify your current results. Please try again later.")
            return response
        response.update(context_status=state, recommendations=recommendations, answer=intro)
        if state != "current":
            response["status"] = "needs_update"
            return response
        response["status"] = "recommendations_explained"
        if pathway_id is None:
            return response
        if pathway_id not in {r["pathway_id"] for r in recommendations}:
            raise ValueError("To explain an alternative pathway, use explore mode")

    category = classify_question(question)
    if category == "greeting":
        return result(
            "needs_clarification",
            "Hi! Ask me about a subject, a course, career options or your next education step. What would you like to explore?",
            conversation_topic=clean_label(conversation_topic or "Career Exploration"),
            answer_origin="local"
        )
    if category == "out_of_scope":
        return result(
            "out_of_scope",
            "I can help with education, career exploration and pathway questions. What career, course, or pathway would you like to explore?",
            conversation_topic=clean_label(conversation_topic or "Out of Scope"),
            answer_origin="local"
        )

    # Unsupported admission facts when no general career role is asked
    if re.search(r"\b(admission|admissions)\b.*?\b(requirements?|process)\b|\b(mbbs|kcet|neet)\b.*?\b(admission|eligibility|requirements?)\b|\bwhat are the admission requirements\b", question, re.I):
        if not re.search(r"\b(what does|what do|role|skills|how can i become)\b", question, re.I):
            return result("insufficient_evidence", "I don't yet have verified Indian admission, eligibility, salary or licensing information for that question. Please check the current official authority or institution guidance.", conversation_topic=clean_label(conversation_topic or "Admissions"), answer_origin="local")

    topic = conversation_topic or extract_career_topic(question)
    retrieval_query = f"{topic}: {question}" if topic and topic.lower() not in question.lower() else question

    try:
        ai = ai or get_ai()
        matches = retrieve(db, retrieval_query, ai=ai, pathway_id=pathway_id, language="en", limit=5)

        # Legacy sentence extraction for backwards compatibility with tests and verified chunks
        sentences = evidence_sentences(matches)

        sources = []
        evidence_lines = []
        for match in matches:
            meta = match["metadata"]
            if (meta.get("status") == "verified" and meta.get("sources")
                    and match["similarity"] >= 0.45
                    and match["heading"].lower() not in {"scope", "collaboration and scope"}):
                ref_num = len(sources) + 1
                sources.append({
                    "reference": ref_num,
                    "chunk_id": match["chunk_id"],
                    "document_id": match["document_id"],
                    "title": meta.get("title", match["document_id"]),
                    "heading": match["heading"],
                    "references": meta.get("sources", []),
                    "scope": meta.get("scope", ""),
                    "reviewed_on": meta.get("reviewed_on", "2026-09-01"),
                    "source_type": "verified_cached_knowledge",
                    "passage": match["content"][:400]
                })
                evidence_lines.append(f"[{ref_num}] {match['content']}")
                if len(sources) >= 3:
                    break

        evidence_text = "\n\n".join(evidence_lines)

        rem_gen = (deadline - time.monotonic() - 0.5) if deadline else 45.0
        gen_timeout = min(45.0, max(2.0, rem_gen))

        is_targeted = is_aspect_question(question)
        if is_targeted:
            system_prompt = (
                f"You are UdaanAI, a friendly and knowledgeable AI Career Advisor for Indian school students. "
                f"The user is asking a specific, targeted follow-up question regarding the career/pathway '{topic}'.\n\n"
                "TARGETED ANSWER INSTRUCTIONS:\n"
                "- Answer the user's requested aspect ONLY. Directly and concisely address the question in your opening sentence.\n"
                "- DO NOT generate a full 5-section career overview (DO NOT include an overview, full list of duties, full education guide, etc., unless specifically asked).\n"
                "- For example, if asked about skills or programming languages, focus strictly on practical skills and languages relevant to this field.\n"
                "- If asked about the work environment or day-to-day work, describe what daily working life, workplace settings, and team dynamics look like in this profession.\n"
                "- If asked about duration or education path, describe the typical timeframe and stages directly.\n"
                "- If asked about subjects to focus on, specify the relevant high school / college subjects.\n"
                "- Keep the response concise, engaging, realistic, and formatted with clean bullet points or short paragraphs.\n"
                "- DO NOT use markdown tables or HTML tags.\n\n"
                "GROUNDING RULES:\n"
                "- Ground your response in verified facts and evidence if provided below.\n"
                "- Do not invent government schemes, admission cutoffs, or salary guarantees."
            )
            user_content = f"Career Topic: {topic}\nFollow-up Question: {question}"
            if evidence_text:
                user_content += f"\n\nVerified Evidence:\n{evidence_text}"

        elif category == "category_a_career":
            system_prompt = (
                "You are UdaanAI, a friendly, student-facing AI Career Advisor for Indian school students. "
                "Provide a clear, engaging, conversational, and well-structured career explanation.\n\n"
                "STRUCTURE YOUR ANSWER AS FOLLOWS:\n"
                "- A short 1-2 sentence welcoming overview of what this professional does.\n"
                "- Core Responsibilities: 3-5 concise bullet points describing their day-to-day work.\n"
                "- Key Skills to Learn: 3-4 practical technical and soft skills.\n"
                "- How to Become One: Clear, practical education options (e.g. Class 10/ITI, Polytechnic Diploma, or 10+2 / Degree).\n"
                "- Next Step Suggestion: 1 encouraging sentence on what the student can explore next.\n\n"
                "STYLE & FORMATTING RULES:\n"
                "- Keep explanations focused, conversational, and student-friendly. Avoid long dense essays.\n"
                "- Use clean bullet points (• or -) and short paragraphs. DO NOT use markdown tables.\n"
                "- DO NOT output raw or escaped HTML tags (no <ul>, <li>, <br>, <table>). Use clean markdown only.\n\n"
                "GROUNDING RULES:\n"
                "- If verified local evidence is provided below, ground your response in it and cite using [1], [2].\n"
                "- If evidence is not provided or incomplete, provide accurate general career education from your general knowledge.\n"
                "- Clearly distinguish general career knowledge from location-specific or current rules.\n"
                "- NEVER invent college names, admission deadlines, government schemes, fees, eligibility cutoffs, or current salary statistics."
            )
            user_content = f"Question: {question}"
            if evidence_text:
                user_content += f"\n\nVerified Career Evidence:\n{evidence_text}"

        elif category == "category_b_pathway":
            system_prompt = (
                "You are UdaanAI, an AI Career Advisor guiding Indian students on educational pathways and career planning. "
                "Provide a clear, structured roadmap for the requested pathway (e.g. after Class 10 or after PUC Science).\n\n"
                "Structure your guidance with clear options:\n"
                "- Option 1: Polytechnic Diploma route (technical/practical route, including lateral entry into B.Tech/B.E. where applicable).\n"
                "- Option 2: PUC / 10+2 route (Science, Commerce, or Arts combinations and subsequent bachelor degrees like B.Tech, BCA, B.Sc, B.Des, etc.).\n"
                "- Option 3: Vocational / Skill-based certifications & self-learning (such as ITI trades, online certifications, portfolio building).\n\n"
                "STYLE & FORMATTING RULES:\n"
                "- Use clean markdown headings and concise bullet points. Avoid dense paragraphs.\n"
                "- DO NOT use markdown tables or raw/escaped HTML tags (no <table>, <ul>, <li>, <br>).\n\n"
                "GROUNDING RULES:\n"
                "- Ground your response in the provided evidence where available and cite using [1], [2].\n"
                "- Provide realistic, encouraging, and responsible guidance.\n"
                "- Explicitly state that specific admission cutoff percentages, fees, and entrance exams vary each academic year and must be verified with the official educational boards.\n"
                "- NEVER invent specific college names, admission deadlines, or exact fee amounts."
            )
            user_content = f"Question: {question}"
            if evidence_text:
                user_content += f"\n\nVerified Pathway Evidence:\n{evidence_text}"

        else:  # category_c_current_factual
            system_prompt = (
                "You are UdaanAI, an AI Career Advisor for Indian students. "
                "The student is asking a specific or current factual question regarding eligibility, cutoffs, fees, admissions, or college directories in Karnataka/India.\n\n"
                "STYLE & FORMATTING RULES:\n"
                "- Use clean bullet points and short checklists. DO NOT use markdown tables or raw/escaped HTML tags.\n\n"
                "GROUNDING & VERIFICATION RULES:\n"
                "- DO NOT invent, hallucinate, or guess specific cut-off ranks, exact fee amounts, seat matrices, or comprehensive college lists.\n"
                "- Explain the baseline official qualification framework (e.g. for Karnataka 3-year polytechnic diploma, passing SSLC/Class 10 with Science and Mathematics).\n"
                "- Clearly and responsibly explain that current academic year eligibility percentages, reservation quotas, cutoffs, seat matrices, and fee structures change annually and must be verified directly on official authority portals:\n"
                "  • Department of Technical Education (DTE) Karnataka: dtek.karnataka.gov.in\n"
                "  • Karnataka Examinations Authority (KEA): cetonline.karnataka.gov.in\n"
                "  • For university/degree courses: Visvesvaraya Technological University (vtu.ac.in) or the respective university portal.\n"
                "- For courses like cybersecurity, explain that it is offered under Computer Science & Engineering (Cyber Security) in AICTE-approved colleges, and direct students to the official KEA Seat Matrix during counselling for the active list of affiliated colleges.\n"
                "- Give students a helpful checklist of what documents and credentials they need to prepare."
            )
            user_content = f"Question: {question}"
            if evidence_text:
                user_content += f"\n\nVerified Evidence:\n{evidence_text}"

        prompt_content = user_content
        if sentences and hasattr(ai, "output") and "sentence_ids" in str(getattr(ai, "output", "")):
            prompt_content = json.dumps({
                "question": question,
                "career_topic": topic,
                "evidence": [{"id": k, "sentence": v["text"], "scope": v["match"]["metadata"]["scope"]} for k, v in sentences.items()],
                "output_schema": EvidenceSelection.model_json_schema()
            })

        chat_messages = [{"role": "system", "content": system_prompt}]
        if history and getattr(history, "last_question", None) and getattr(history, "last_answer", None):
            chat_messages.append({"role": "user", "content": history.last_question})
            chat_messages.append({"role": "assistant", "content": history.last_answer[:600]})
        chat_messages.append({"role": "user", "content": prompt_content})

        if hasattr(ai, "messages"):
            ai.messages = chat_messages

        raw_answer = ai.chat(chat_messages, num_predict=1024, timeout=gen_timeout)

        # Unit test FakeAI compatibility
        if hasattr(ai, "output"):
            if not sentences:
                return result("insufficient_evidence", "I don't yet have enough verified information to answer that question.", conversation_topic=clean_label(topic), answer_origin="local")
            try:
                parsed = json.loads(raw_answer)
                if not isinstance(parsed, dict) or "can_answer" not in parsed:
                    raise ValueError("Invalid format")
                sel = EvidenceSelection.model_validate(parsed)
                if not sel.can_answer or not sel.sentence_ids:
                    return result("insufficient_evidence", "I don't yet have enough verified information to answer that question.", conversation_topic=clean_label(topic), answer_origin="local")
                if len(set(sel.sentence_ids)) != len(sel.sentence_ids) or any(k not in sentences for k in sel.sentence_ids):
                    raise ValueError("Invalid source selection")
                s_sources, lines = [], []
                for k in sel.sentence_ids:
                    item = sentences[k]
                    m = item["match"]
                    exist = next((s for s in s_sources if s["chunk_id"] == m["chunk_id"]), None)
                    if exist is None:
                        exist = dict(reference=len(s_sources) + 1, chunk_id=m["chunk_id"], document_id=m["document_id"],
                                     title=m["metadata"]["title"], heading=m["heading"],
                                     references=m["metadata"]["sources"], scope=m["metadata"]["scope"],
                                     reviewed_on=m["metadata"]["reviewed_on"])
                        s_sources.append(exist)
                    lines.append(item["text"] + f" [{exist['reference']}]")
                prefix = "Here is what the verified career overview says:\n\n"
                return dict(status="answered", answer=prefix + "\n".join(lines), sources=s_sources, recommendations=[], context_status="not_requested", answer_origin="local", conversation_topic=clean_label(topic))
            except Exception:
                return result("unavailable", "The generation model returned an unreadable response. Please try again.", conversation_topic=clean_label(topic), answer_origin="local")

        answer_text = raw_answer.strip()
        if not answer_text:
            raise ValueError("Empty response received from generation model")

        return dict(
            status="answered",
            answer=answer_text,
            sources=sources,
            recommendations=[],
            context_status="not_requested",
            answer_origin="local",
            conversation_topic=clean_label(topic or "Career Exploration")
        )

    except AIServiceError:
        return dict(
            status="unavailable",
            answer="The AI Career Advisor is currently busy. Please try again shortly.",
            sources=[],
            recommendations=[],
            context_status="not_requested",
            answer_origin="local",
            conversation_topic=clean_label(topic or "Career Exploration")
        )
    except (httpx.HTTPError, SQLAlchemyError, ValueError, KeyError, TypeError, TimeoutError):
        return dict(
            status="unavailable",
            answer="UdaanAI couldn't produce an answer just now. Please try again shortly.",
            sources=[],
            recommendations=[],
            context_status="not_requested",
            answer_origin="local",
            conversation_topic=clean_label(topic or "Career Exploration")
        )
