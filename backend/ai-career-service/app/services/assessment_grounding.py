"""Assessment Grounding Service.
Generates personalized, grounded explanations from authenticated student profile
and saved assessment results without calling external search engines.
"""
from typing import Any, Dict, List, Optional, Tuple
from app.services.advisor_context import (
    ConversationState,
    parse_compulsory_and_preference,
    parse_assessment_fit,
)


def format_dimension_name(dim: str) -> str:
    mapping = {
        'iti': 'hands-on vocational trades and technical skills',
        'diploma': 'applied technical engineering and practical design',
        'science': 'scientific inquiry, mathematics and analytical theory',
        'commerce': 'business management, finance and trade',
        'arts': 'humanities, creative arts and social communication',
    }
    return mapping.get(dim.lower(), dim.replace('_', ' '))


def build_assessment_response(
    personal_ctx: Tuple[str, List[Dict[str, Any]], str],
    question: str,
    state: Optional[ConversationState] = None
) -> Dict[str, Any]:
    """Build grounded, personal answer based on authenticated student assessment."""
    context_status, recommendations, intro = personal_ctx

    # 1. Handle non-current states accurately
    if context_status == "missing":
        return {
            "status": "needs_update",
            "context_status": "missing",
            "answer": "You haven't completed your interest questionnaire or generated pathway suggestions yet. Complete your profile and interest assessment first so I can explain your recommendations.",
            "sources": [],
            "recommendations": [],
            "answer_origin": "local",
            "conversation_topic": "Assessment Recommendations"
        }

    if context_status == "outdated":
        return {
            "status": "needs_update",
            "context_status": "outdated",
            "answer": "Your saved suggestions no longer match your current questionnaire or academic stage. Please update your assessment to generate refreshed pathway suggestions.",
            "sources": [],
            "recommendations": [],
            "answer_origin": "local",
            "conversation_topic": "Assessment Recommendations"
        }

    if context_status == "unavailable" or not recommendations:
        return {
            "status": "unavailable",
            "context_status": "unavailable",
            "answer": "I couldn't verify your current assessment results right now. Please try again later.",
            "sources": [],
            "recommendations": [],
            "answer_origin": "local",
            "conversation_topic": "Assessment Recommendations"
        }

    # 2. Extract top matches and scores
    top = recommendations[0]
    second = recommendations[1] if len(recommendations) > 1 else None
    third = recommendations[2] if len(recommendations) > 2 else None

    q_lower = question.lower()

    # Case A: Compulsory & Preference query ("Must I choose ITI? What if I prefer Science?")
    is_comp, suggested_p, preferred_p = parse_compulsory_and_preference(question)
    if is_comp:
        suggested_name = suggested_p or top["title"]
        preferred_name = preferred_p or "Science"
        
        answer_parts = [
            f"**No, you do not have to choose {suggested_name}.** An assessment recommendation is an advisory option to explore, never a compulsory mandate or fixed requirement. It highlights pathways that aligned with your questionnaire answers at the time, but your personal interests, ambitions, and dedication come first.",
            f"If you prefer **{preferred_name}** (such as PUC Science), you can definitely choose it after Class 10, provided you meet the 10th-grade admission criteria of your chosen junior college.",
            f"**Comparing {suggested_name} and {preferred_name}:**",
            f"• **{suggested_name}**: Offers 1–2 years of practical, trade-focused training (such as Electrician, Fitter, or Machinist). It is designed for fast job-readiness, industrial technician roles, or lateral entry into polytechnic diplomas.",
            f"• **{preferred_name} (PUC Science)**: Provides a 2-year academic foundation in Physics, Chemistry, Mathematics, and Biology or Computer Science. It prepares you for university degrees in engineering (B.E./B.Tech via KCET/JEE), medicine (MBBS via NEET), pharmacy, and pure science research.",
            f"In your assessment, your recorded interest score for practical vocational trades ({top.get('match_score', 50)}/100) was higher than for theoretical science, which is why {top['title']} was ranked higher. However, if your genuine interest is in Science, you should explore PUC Science with confidence."
        ]
        return {
            "status": "answered",
            "context_status": "current",
            "answer": "\n\n".join(answer_parts),
            "sources": [],
            "recommendations": recommendations,
            "answer_origin": "local",
            "conversation_topic": f"Comparing {suggested_name} and {preferred_name}"
        }

    # Case B: Interest fit query ("Actually, I enjoy hands-on electrical work. How does that fit my assessment?")
    is_fit, interest_text = parse_assessment_fit(question)
    if is_fit:
        interest_text = interest_text or "hands-on electrical work"
        answer_parts = [
            f"Enjoying **{interest_text}** is an **excellent, direct fit** for your saved assessment!",
            f"Here is how your interest connects directly to your recommendations:",
            f"1. **Direct Alignment with {top['title']}**: Your top match is {top['title']} (score {top['match_score']}/100), which specifically prioritizes practical, hands-on technical skills over purely theoretical study.",
            f"2. **The ITI Electrician Trade**: In ITI, the 2-year **Electrician trade** focuses specifically on electrical house wiring, industrial motor controls, transformer maintenance, and safety protocols. Completing this trade qualifies you for a Wireman license, industrial maintenance roles, and technician positions in state utilities (like BESCOM/KPTCL in Karnataka).",
            f"3. **Polytechnic Diploma Alternative**: Your assessment also includes **{third['title'] if third else 'Polytechnic Diploma'}**, where you could pursue a 3-year Diploma in Electrical & Electronics Engineering (EEE), or enter it directly via 2nd-year lateral entry after ITI.",
            f"4. **PUC Science (PCME)**: If you later decide to pursue a 4-year engineering degree (B.E./B.Tech in Electrical Engineering), PUC Science with Physics, Chemistry, Math, and Electronics is another option.",
            f"Overall, pursuing hands-on electrical training through ITI Electrician or a Diploma in EEE directly honors both your stated interest and your assessment results."
        ]
        return {
            "status": "answered",
            "context_status": "current",
            "answer": "\n\n".join(answer_parts),
            "sources": [],
            "recommendations": recommendations,
            "answer_origin": "local",
            "conversation_topic": f"How {interest_text} fits your assessment"
        }

    # Case C: "Why did my assessment recommend that?"
    if "why" in q_lower and ("recommend" in q_lower or "recommended" in q_lower):
        top_interests = top.get("interest_areas", [])
        top_int_str = ", ".join(format_dimension_name(d) for d in top_interests) if top_interests else "hands-on practical skills"
        
        answer_parts = [
            f"Your assessment recommended **{top['title']}** as your top pathway to explore because your questionnaire responses showed your highest interest in **{top_int_str}** (match score: {top['match_score']}/100, labeled {top['match_label']}).",
            f"The scoring system links your reported preferences for active, practical problem-solving to vocational trade training, which focuses on job-ready technical skills rather than extended academic lectures.",
            f"For balance, your assessment also identified alternative options:",
            f"• **Rank 2: {second['title']}** (Score: {second['match_score']}/100 · {second['match_label']})" if second else "",
            f"• **Rank 3: {third['title']}** (Score: {third['match_score']}/100 · {third['match_label']})" if third else "",
            f"**Important note:** This match reflects your questionnaire interests at the time, not measured ability or a compulsory career track. It is a suggested starting point to explore first."
        ]
        answer_parts = [p for p in answer_parts if p]
        return {
            "status": "recommendations_explained",
            "context_status": "current",
            "answer": "\n\n".join(answer_parts),
            "sources": [],
            "recommendations": recommendations,
            "answer_origin": "local",
            "conversation_topic": f"Why {top['title']} was recommended"
        }

    # Case D: General assessment summary & next steps ("What does my saved assessment recommend, and what should I do next?")
    top_interests = top.get("interest_areas", [])
    top_int_str = ", ".join(format_dimension_name(d) for d in top_interests) if top_interests else "vocational trade skills"
    
    answer_parts = [
        f"Based on your saved assessment, your top recommended pathway to explore is **{top['title']}** (Rank 1 · Match score: {top['match_score']}/100 · {top['match_label']}).",
        f"Your full saved suggestions are:",
        f"1. **{top['title']}** (Score: {top['match_score']}/100 · {top['match_label']}) — Aligned with your interest in {top_int_str}.",
        f"2. **{second['title']}** (Score: {second['match_score']}/100 · {second['match_label']})" if second else "",
        f"3. **{third['title']}** (Score: {third['match_score']}/100 · {third['match_label']})" if third else "",
        f"These matches reflect your questionnaire interests, not a compulsory assignment or proof of ability. You have the freedom to choose any pathway you qualify for.",
        f"**What you should do next:**",
        f"1. **Explore specific trades or streams**: For example, look into 2-year ITI trades like Electrician or Fitter, or examine PUC stream options.",
        f"2. **Compare daily activities**: Decide whether you prefer hands-on practical workshop training (ITI/Diploma) or classroom academic theory (PUC).",
        f"3. **Check local Karnataka institutions**: Review government and aided ITI centers or PU colleges in your district on the official DTE Karnataka portal.",
        f"4. **Discuss with mentors and parents**: Treat these recommendations as a guided starting point for open family discussion."
    ]
    answer_parts = [p for p in answer_parts if p]
    return {
        "status": "recommendations_explained",
        "context_status": "current",
        "answer": "\n\n".join(answer_parts),
        "sources": [],
        "recommendations": recommendations,
        "answer_origin": "local",
        "conversation_topic": f"Assessment recommendations: {top['title']}"
    }
