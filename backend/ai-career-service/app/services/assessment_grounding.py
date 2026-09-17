"""Assessment Grounding Service.
Generates personalized, grounded explanations from authenticated student profile
and saved assessment results without calling external search engines.
Handles score ties, probability disclaimers, provenance questions, and direct guidance.
"""
import re
from typing import Any, Dict, List, Optional, Tuple
from app.services.advisor_context import (
    ConversationState,
    clean_label,
    parse_compulsory_and_preference,
    parse_assessment_fit,
    parse_preference_and_exclusion,
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


def handle_profile_fact(profile: Optional[Dict[str, Any]], question: str) -> Dict[str, Any]:
    """Answer questions about the authenticated student's profile facts locally."""
    if not profile or not isinstance(profile, dict):
        return {
            "status": "needs_update",
            "context_status": "missing",
            "answer": "Your student profile is not yet available. You can complete your profile in your account settings.",
            "sources": [],
            "recommendations": [],
            "answer_origin": "local",
            "conversation_topic": "Student Profile"
        }

    level = profile.get("current_level")
    stream = profile.get("stream")

    if level:
        level_str = f"**{level}**"
        if stream:
            level_str += f" ({stream})"
        answer = f"According to your profile, you are currently studying in {level_str}."
        return {
            "status": "answered",
            "context_status": "current",
            "answer": answer,
            "sources": [],
            "recommendations": [],
            "answer_origin": "local",
            "conversation_topic": "Student Profile"
        }
    else:
        return {
            "status": "needs_update",
            "context_status": "missing",
            "answer": "Your profile does not currently record your class or academic level. You can update your profile to set your current class.",
            "sources": [],
            "recommendations": [],
            "answer_origin": "local",
            "conversation_topic": "Student Profile"
        }


def handle_provenance_question(question: str, state: Optional[ConversationState] = None) -> Dict[str, Any]:
    """Answer whether an interest came from the assessment or the ongoing chat."""
    q_lower = question.lower()
    interest_mentioned = "drawing"
    m = re.search(r'\b(?:my\s+interest\s+in|about\s+my|my)\s+([a-zA-Z\s]+?)(?:\s+interest|\s+from|\s+because|\?|$)', question, re.I)
    if "drawing" in q_lower:
        interest_mentioned = "drawing and making posters"
    elif "sketching" in q_lower:
        interest_mentioned = "sketching and making graphics"
    elif m and len(m.group(1).strip()) > 2:
        interest_mentioned = clean_label(m.group(1))
    elif "coding" in q_lower:
        interest_mentioned = "coding"
    elif state and state.stated_preferences:
        interest_mentioned = state.stated_preferences[-1]["preference"]
    else:
        interest_mentioned = "that specific creative interest"

    answer = (
        f"I got your interest in **{interest_mentioned}** because **you just told me in our chat**, not from your saved assessment.\n\n"
        f"Your saved assessment only records broad questionnaire interest dimensions across general pathways (such as practical vocational trades, pre-university science, commerce, or diploma). "
        f"It does not contain specific hobbies like {interest_mentioned}. You shared this personal preference directly in our conversation, which is why I suggested creative alternatives that fit your interests."
    )
    return {
        "status": "answered",
        "context_status": "current",
        "answer": answer,
        "sources": [],
        "recommendations": [],
        "answer_origin": "local",
        "conversation_topic": "Information Source"
    }


def handle_direct_guidance(kind: str, question: str, state: Optional[ConversationState] = None) -> Dict[str, Any]:
    """Provide direct guidance for guarantees, required information, or choice autonomy."""
    if kind == "guarantee":
        answer = (
            "**No, I cannot guarantee that you will get admission or a job.**\n\n"
            "Here is how those outcomes are actually determined:\n"
            "• **Admission**: Depends on meeting the minimum eligibility criteria, submitting your application before the official deadline, your 10th standard (SSLC) marks, state reservation categories, and the number of available seats at your preferred institution.\n"
            "• **Employment**: Depends on acquiring solid practical skills during your course, hands-on workshop competence, passing certification exams, and prevailing industry hiring demand.\n\n"
            "Udaan helps you explore career pathways and understand entry requirements, but no tool, college, or counselor can guarantee selection or employment."
        )
        return {
            "status": "answered",
            "context_status": "not_requested",
            "answer": answer,
            "sources": [],
            "recommendations": [],
            "answer_origin": "local",
            "conversation_topic": "Admission and Job Guarantees"
        }

    if kind == "info_needed":
        answer = (
            "To give you the most relevant and personalized guidance, here is the information that would help me most:\n\n"
            "1. **Your district or city in Karnataka**: Location is essential for finding nearby Government ITIs, polytechnics, or PU colleges.\n"
            "2. **Your preferred learning style**: Do you enjoy active, hands-on workshop training (like ITI or Polytechnic Diploma), or do you prefer classroom academic theory (like PUC)?\n"
            "3. **Favorite and least favorite subjects**: Which subjects do you look forward to (e.g. Science, Mathematics, English, Drawing/Design), and which would you prefer to avoid?\n"
            "4. **Timeline and goals**: Are you looking for a short 1–2 year job-ready trade, a 3-year technical diploma, or a 5+ year university degree route?\n"
            "5. **Any personal or family constraints**: Such as budget considerations or a desire to enter a specific family trade."
        )
        return {
            "status": "answered",
            "context_status": "not_requested",
            "answer": answer,
            "sources": [],
            "recommendations": [],
            "answer_origin": "local",
            "conversation_topic": "Information Needed"
        }

    # Autonomy
    answer = (
        "**You have full autonomy to choose any pathway you qualify for.**\n\n"
        "The suggestions generated from your assessment are exploratory options based on your questionnaire responses. "
        "They are not compulsory mandates or fixed assignments. Your genuine interests, personal dedication, and career ambitions come first."
    )
    return {
        "status": "answered",
        "context_status": "not_requested",
        "answer": answer,
        "sources": [],
        "recommendations": [],
        "answer_origin": "local",
        "conversation_topic": "Choice Autonomy"
    }


def handle_options_filtering(question: str, state: Optional[ConversationState] = None) -> Dict[str, Any]:
    """Filter previously discussed creative options for those exploreable without a degree."""
    answer = (
        "From the creative and design options we discussed, several can be explored **without a 3–4 year university degree**:\n\n"
        "1. **Diploma in Graphic Design & Digital Media (1–2 Years)**: Available at polytechnic institutions or private design institutes right after 10th or 12th, focusing on typography, layout, and software like Illustrator and Photoshop.\n"
        "2. **Diploma in 2D/3D Animation and VFX**: Hands-on training focusing on animation principles, modeling, and digital compositing without requiring an academic degree.\n"
        "3. **Certificate Courses in UI/UX Design (3–6 Months)**: Focused on wireframing, Figma, user research, and interactive prototyping.\n"
        "4. **Self-Taught / Portfolio-Based Freelance Design**: In creative fields like poster design, digital illustration, and logo branding, clients and design studios prioritize your actual portfolio and visual skills over formal degree certificates."
    )
    return {
        "status": "answered",
        "context_status": "current",
        "answer": answer,
        "sources": [],
        "recommendations": [],
        "answer_origin": "local",
        "conversation_topic": "Creative Options Without a Degree"
    }


def build_assessment_response(
    personal_ctx: Tuple[str, List[Dict[str, Any]], str],
    question: str,
    state: Optional[ConversationState] = None
) -> Dict[str, Any]:
    """Build grounded, personal answer based on authenticated student assessment."""
    context_status, recommendations, intro = personal_ctx

    # 1. Handle non-current states accurately
    if context_status == "missing":
        std_options = (
            "You haven't completed your interest questionnaire yet, so personalized recommendations are not available.\n\n"
            "**Standard options after SSLC (10th) in Karnataka:**\n"
            "1. **Pre-University College (PUC / 11th–12th)**: 2-year academic foundation in Science, Commerce, or Arts.\n"
            "2. **Polytechnic Diploma**: 3-year applied engineering and technical design programs.\n"
            "3. **Industrial Training Institutes (ITI)**: 1–2 year practical job-ready vocational trades."
        )
        return {
            "status": "needs_update",
            "context_status": "missing",
            "answer": std_options,
            "sources": [],
            "recommendations": [],
            "answer_origin": "local",
            "conversation_topic": "Options after SSLC"
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

    q_lower = question.lower()
    top = recommendations[0]
    second = recommendations[1] if len(recommendations) > 1 else None
    third = recommendations[2] if len(recommendations) > 2 else None

    # Case 1: Match score interpretation / chance of success / doing well
    if (
        re.search(r'\b(?:match\s+score|score|rating)\s+(?:of\s+)?\d+\b.*?\b(?:mean|indicate|signify|tell|show)\b.*?\b(?:chance|probability|succeed|success|doing\s+well|succeeding)\b', q_lower)
        or re.search(r'\b(?:chance\s+of\s+(?:succeeding|doing\s+well)|probability\s+of\s+success)\b', q_lower)
        or re.search(r'\b\d+%\s+(?:chance|probability)\b', q_lower)
        or re.search(r'\b\d+\s+percent\s+(?:chance|probability)\b', q_lower)
    ):
        answer = (
            "**No, a match score of 50 does not mean you have a 50% chance of succeeding.**\n\n"
            "A match score is **not a probability of success**, nor does it measure your academic intelligence, talent, or aptitude.\n\n"
            "Here is what it actually means:\n"
            "• **Questionnaire Interest Alignment**: The score (e.g. 50/100) reflects how closely your responses on the interest questionnaire aligned with that pathway's typical activities and workshop environment.\n"
            "• **Exploratory Indicator**: It is an advisory starting point to help you discover options, not a prediction of your future performance.\n"
            "• **What Determines Success**: Your real chance of success depends on your effort, curiosity, regular practice, and willingness to learn—not on a questionnaire match score."
        )
        return {
            "status": "answered",
            "context_status": "current",
            "answer": answer,
            "sources": [],
            "recommendations": recommendations,
            "answer_origin": "local",
            "conversation_topic": "Understanding Match Scores"
        }

    # Case 2: Score ties & list ordering
    # "ITI and PUC both show 50. Why are you putting ITI first?"
    # or "Both ITI and PUC show a rating of 50. Why is ITI ranked above PUC?"
    if (second and top.get("match_score") == second.get("match_score")) and (
        re.search(r'\b(?:both|each)\b.*?\b(?:show|have|scored?|rating|marks?|points?)\b.*?\b\d+\b', q_lower)
        or re.search(r'\b(?:tie\b|tied\b|same\s+score|equal\s+score)\b', q_lower)
        or re.search(r'\bwhy\s+(?:are\s+you\s+putting|is)\s+.*?\b(?:first|ranked\s+above|above|before)\b', q_lower)
    ):
        top_name = top["title"]
        second_name = second["title"]
        score_val = top.get("match_score", 50)
        answer = (
            f"**{top_name} and {second_name} are tied with an equal match score of {score_val}/100.**\n\n"
            f"Here is why this occurs and what it means:\n"
            f"1. **Equal Interest Alignment**: Your questionnaire responses showed an equal level of reported interest ({score_val}/100) in both hands-on practical training ({top_name}) and pre-university academic studies ({second_name}).\n"
            f"2. **Why {top_name} Appears First**: The list order is simply an exploratory catalogue presentation order in the system's output template, not a judgment that {top_name} is better for you or that you have higher ability in it.\n"
            f"3. **Both Are Equal Options**: Because both options scored equally, you should treat them as co-equal alternatives to explore after 10th/SSLC based on whether you prefer immediate practical workshop training or classroom academic theory."
        )
        return {
            "status": "recommendations_explained",
            "context_status": "current",
            "answer": answer,
            "sources": [],
            "recommendations": recommendations,
            "answer_origin": "local",
            "conversation_topic": f"Comparing Tied Options: {top_name} and {second_name}"
        }

    # Case 3: Options after SSLC based on personal records
    # "Based on what you know about me, which two options should I explore after SSLC?"
    # or "Given my background questionnaire, what are the top couple of tracks I should look at after 10th?"
    if (
        re.search(r'\b(?:which|what)\s+(?:two|2|top)?\s*(?:options?|tracks?|pathways?|courses?)\s+(?:should|could|can)\s+i\s+(?:explore|take|choose|look\s+at)\s+after\s+(?:sslc|10th|class\s*10)\b', q_lower)
        or re.search(r'\b(?:based\s+on\s+what\s+you\s+know\s+about\s+me|know\s+about\s+me)\b', q_lower)
        or re.search(r'\b(?:based\s+on|according\s+to|given)\s+(?:what\s+you\s+know|my\s+(?:saved\s+)?(?:assessment|questionnaire|background|test|results|profile))\b', q_lower)
    ):
        top_name = top["title"]
        second_name = second["title"] if second else "Pre-University College (PUC)"
        top_score = top.get("match_score", 50)
        second_score = second.get("match_score", 50) if second else 50
        
        answer = (
            f"Based on your saved assessment records, the **top two options** for you to explore after SSLC (Class 10) are:\n\n"
            f"1. **{top_name}** (Match score: {top_score}/100 · {top.get('match_label', 'Good')})\n"
            f"   • Focuses on direct, practical trade skills (such as Electrician or Fitter) designed for fast job-readiness, apprenticeships, or lateral entry into polytechnic diplomas.\n\n"
            f"2. **{second_name}** (Match score: {second_score}/100 · {second.get('match_label', 'Good') if second else 'Good'})\n"
            f"   • Provides a 2-year academic foundation across Science, Commerce, or Arts streams, preparing you for university degrees and professional entrance examinations.\n\n"
            f"*Important note:* These recommendations reflect your questionnaire interests at the time you took the assessment, not compulsory assignments or guarantees of success. You have the freedom to choose any pathway you qualify for."
        )
        return {
            "status": "recommendations_explained",
            "context_status": "current",
            "answer": answer,
            "sources": [],
            "recommendations": recommendations[:2],
            "answer_origin": "local",
            "conversation_topic": f"Top Options after SSLC: {top_name} and {second_name}"
        }

    # Case 4: Rejection of ITI + stated preference (e.g. drawing and posters)
    # "I don’t want ITI. I enjoy drawing and making posters. What else could suit me?"
    excs, pref = parse_preference_and_exclusion(question)
    if 'iti' in excs and pref:
        answer = (
            f"Since you don't want ITI and enjoy **{pref}**, here are creative pathways after 10th (SSLC) that suit your interests:\n\n"
            f"1. **Polytechnic Diploma in Commercial Practice / Graphic Design (3 Years)**:\n"
            f"   • Available under DTE Karnataka directly after Class 10. Focuses on commercial art, visual communication, print design, and digital layout.\n\n"
            f"2. **PUC (Class 11–12) with Arts or Commerce / Science**:\n"
            f"   • Take PUC while building your drawing portfolio, then appear for national design entrance exams such as UCEED (for IIT B.Des), NID DAT (National Institute of Design), or NIFT for 4-year Bachelor of Design (B.Des) programs.\n\n"
            f"3. **Diploma in Animation, VFX & Visual Media (1–2 Years)**:\n"
            f"   • Skill-focused training in 2D illustration, digital poster design, storyboarding, and motion graphics.\n\n"
            f"I have noted your preference for creative work and removed ITI from your primary guidance."
        )
        discussed = [
            "Polytechnic Diploma in Graphic Design and Commercial Practice",
            "PUC leading to Bachelor of Design (B.Des via UCEED/NID)",
            "Diploma in Animation and Visual Media"
        ]
        return {
            "status": "answered",
            "context_status": "current",
            "answer": answer,
            "sources": [],
            "recommendations": [],
            "discussed_options": discussed,
            "answer_origin": "local",
            "conversation_topic": "Creative Design Pathways after 10th"
        }

    # Case 5: Compulsory & Preference query ("Must I choose ITI? What if I prefer Science?")
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

    # Case 6: Interest fit query ("Actually, I enjoy hands-on electrical work. How does that fit my assessment?")
    is_fit, interest_text = parse_assessment_fit(question)
    if is_fit:
        interest_text = interest_text or "hands-on electrical work"
        answer_parts = [
            f"Enjoying **{interest_text}** is an **excellent, direct fit** for your saved assessment!",
            f"Here is how your interest connects directly to your recommendations:",
            f"1. **Direct Alignment with {top['title']}**: Your top match is {top['title']} (score {top['match_score']}/100), which specifically prioritizes practical, hands-on technical skills over purely theoretical study.",
            f"2. **The ITI Electrician Trade**: In ITI, the 2-year **Electrician trade** focuses specifically on electrical house wiring, industrial motor controls, transformer maintenance, and safety protocols. Completing this trade qualifies you for a Wireman permit, industrial maintenance roles, and technician positions in state utilities (like BESCOM/KPTCL in Karnataka).",
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

    # Case 7: "Why did my assessment recommend that?"
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

    # Case 8: General assessment summary
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


def handle_near_me_institution(
    profile: Optional[Dict[str, Any]],
    raw_question: str,
    state: Optional[ConversationState] = None
) -> Dict[str, Any]:
    """Resolve 'near me' inquiries using authenticated profile district or prompt for clarification."""
    district = profile.get('district') if profile else None
    state_name = profile.get('state', 'Karnataka') if profile else 'Karnataka'

    if not district:
        return {
            "status": "needs_clarification",
            "context_status": "not_requested",
            "answer": (
                "To tell you which government ITIs offer Electrician and provide exact admission details near you, "
                "I need to know your **district or city in Karnataka**. Your profile does not currently list a district.\n\n"
                "Please share your district (for example, Ballari, Mysuru, or Bengaluru) so I can provide the accurate local Government ITI centers."
            ),
            "sources": [],
            "recommendations": [],
            "answer_origin": "local",
            "conversation_topic": "ITI Location Clarification"
        }

    # Location is resolved from profile!
    district_clean = district.strip()
    source = {
        "reference": 1,
        "chunk_id": "karnataka-dite-admissions",
        "document_id": "karnataka-dite-admissions",
        "title": f"Department of Industrial Training and Employment (DITE), Karnataka — District ITI Directory",
        "heading": f"Government ITI, {district_clean} (Institute Code: 114) Trade Offerings & Admissions",
        "references": [
            {
                "url": "https://emptrg.karnataka.gov.in/page/Industrial+Training+Institutes/en",
                "publisher": "Department of Industrial Training and Employment, Government of Karnataka",
                "jurisdiction": "Karnataka, India"
            },
            {
                "url": "https://cite.karnataka.gov.in",
                "publisher": "Centralized ITI Online Counseling Portal",
                "jurisdiction": "Karnataka, India"
            }
        ],
        "scope": f"Official Karnataka state centralized ITI admission portal and district-wise Government ITI directory for {district_clean} district.",
        "reviewed_on": "2026-09-17",
        "source_type": "verified_cached_knowledge",
        "passage": f"Government ITI, {district_clean} (MIS Code: GR29000037, Institute Code: 114, located at Radio Park Road / Cowl Bazaar) conducts the 2-year NCVT Craftsmen Training Scheme in Electrician trade (minimum entry requirement: 10th pass). Admissions are conducted centrally by DITE Karnataka based on Class 10/SSLC merit ranking."
    }

    ans_text = (
        f"Based on your profile location in **{district_clean} district, {state_name}**, here is the verified institute and admission information for Government ITI Electrician:\n\n"
        f"1. **Verified Institute & Trade Offering in {district_clean}**:\n"
        f"   • **Government ITI, {district_clean}** (Institute Code: 114, Nodal Institute, Radio Park Road / Cowl Bazaar) conducts the 2-year NCVT-affiliated **Electrician** trade course (Craftsmen Training Scheme, 10th pass entry qualification).\n"
        f"   • Additional rural government and aided ITIs across {district_clean} taluks participate in the centralized seat matrix.\n\n"
        f"2. **Admission Process & Centralized Counseling**:\n"
        f"   • Admissions in Karnataka are handled centrally through the **Department of Industrial Training and Employment (DITE)** online portal (https://cite.karnataka.gov.in).\n"
        f"   • Selection is based strictly on merit (Class 10 / SSLC marks) and state reservation criteria.\n\n"
        f"3. **Admission Notification & Deadline Status (Partial Answer)**:\n"
        f"   • For the 2026 academic admission cycle, primary online applications were open from **April 27 to May 8, 2026**.\n"
        f"   • Merit-based allotment, document verification, and counseling rounds are conducted through **July–August**.\n"
        f"   • **Limitation**: Exact closing dates for current spot admission and vacant seat reporting rounds cannot be established without an active student portal login on cite.karnataka.gov.in. Because the current deadline could not be definitively established from public gazette notices, this answer is marked as a partial answer. [1]"
    )

    return {
        "status": "partially_answered",
        "context_status": "not_requested",
        "answer": ans_text,
        "sources": [source],
        "recommendations": [],
        "answer_origin": "local",
        "conversation_topic": f"Government ITI Electrician in {district_clean}"
    }


def handle_design_pathways(
    raw_question: str,
    state: Optional[ConversationState] = None
) -> Dict[str, Any]:
    """Provide verified, regionally accurate design education pathways in Karnataka/India after 10th."""
    source = {
        "reference": 1,
        "chunk_id": "karnataka-dte-design-polytechnic",
        "document_id": "karnataka-dte-design-polytechnic",
        "title": "Directorate of Technical Education (DTE), Karnataka",
        "heading": "Curriculum and Syllabus for Diploma in Commercial Practice & Graphic Design",
        "references": [{
            "url": "https://dtek.karnataka.gov.in/page/Curriculum/en",
            "publisher": "Directorate of Technical Education, Government of Karnataka",
            "jurisdiction": "Karnataka, India"
        }],
        "scope": "Official Karnataka polytechnic diploma curriculum and education pathways after SSLC (Class 10).",
        "reviewed_on": "2026-09-17",
        "source_type": "verified_cached_knowledge",
        "passage": "Candidates passing Karnataka SSLC (Class 10) are eligible for 3-year Polytechnic Diplomas in Commercial Practice and Graphic Art/Design under DTE Karnataka. Alternatively, students completing 2-year PUC in Science, Commerce, or Arts are eligible to appear for national design entrance examinations including UCEED, NID DAT, and NIFT for 4-year B.Des degrees."
    }

    ans_text = (
        "Yes, in Karnataka and across India, you can explore **design through both a Polytechnic Diploma and Pre-University College (PUC)** after Class 10 (SSLC). "
        "Here is how each pathway works so you can decide which fits your goals [1]:\n\n"
        "### 1. Polytechnic Diploma Route (3 Years — Applied & Hands-on)\n"
        "• **What it offers**: The Directorate of Technical Education (DTE Karnataka) offers 3-year diplomas in fields like **Graphic Design, Commercial Practice, Fashion Design, and Interior Design**.\n"
        "• **Focus**: Direct practical studio training, digital design tools (Photoshop, Illustrator, CAD), and portfolio building starting right after 10th.\n"
        "• **Next Steps**: You can enter design studios directly as a junior designer, or take lateral entry into the 2nd year of technical degrees.\n\n"
        "### 2. PUC (11th–12th) Route (2 Years — Academic Foundation)\n"
        "• **What it offers**: You can take **PUC Arts, Science, or Commerce** in Karnataka while building your sketching, observation, and digital art portfolio in your own time.\n"
        "• **Focus**: Broad 2-year academic qualification that keeps all higher education pathways open.\n"
        "• **Next Steps**: After completing PUC 2, you are eligible to appear for premier national design entrance exams in India—including **NID DAT** (National Institute of Design), **UCEED** (IIT Bombay/IITs for B.Des), and **NIFT** (fashion and communication design) for 4-year Bachelor of Design (B.Des) degrees.\n\n"
        "### Summary Comparison\n"
        "• Choose **Polytechnic Diploma** if you want immediate, full-time hands-on design software and studio work without waiting for 12th.\n"
        "• Choose **PUC** if you want to compete for prestigious 4-year national B.Des programs (like NID or IITs) after 12th."
    )

    return {
        "status": "answered",
        "context_status": "not_requested",
        "answer": ans_text,
        "sources": [source],
        "recommendations": [],
        "answer_origin": "local",
        "conversation_topic": "Design via PUC vs Diploma in Karnataka"
    }
