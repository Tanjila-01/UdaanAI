import uuid
from sqlalchemy.orm import Session
from app.models.assessment import Assessment, AssessmentQuestion, AssessmentOption

SEED_ASSESSMENT = {
    "id": "karnataka-sslc-interest-v1",
    "title": "Karnataka Career & Stream Aptitude Assessment",
    "description": "A structured 10-question interest assessment designed for Karnataka school (SSLC Class 10) and pre-university students to evaluate strengths across Science, Polytechnic Diploma, Commerce, Arts, and ITI Trades.",
    "category": "career_aptitude",
    "total_questions": 10,
    "is_active": True,
    "questions": [
        {
            "question_text": "Which subject or topic do you enjoy studying the most in school?",
            "dimension": "academic_interest",
            "display_order": 1,
            "options": [
                {"option_code": "A", "option_text": "Mathematics, Physics & Computer Science", "weight_dimension": "science", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Practical Technical Circuits, Robotics & Coding", "weight_dimension": "diploma", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Business Studies, Economics & Accountancy", "weight_dimension": "commerce", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Social Studies, History & Creative Writing", "weight_dimension": "arts", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "question_text": "How do you prefer solving complex real-world problems?",
            "dimension": "problem_solving",
            "display_order": 2,
            "options": [
                {"option_code": "A", "option_text": "Using mathematical formulas, logic, and scientific theories", "weight_dimension": "science", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Building hardware tools, microcontrollers, or practical prototypes", "weight_dimension": "diploma", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Analyzing financial budgets, data spreadsheets, and market trends", "weight_dimension": "commerce", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Hands-on electrical wiring, motor repair, and machine assembly", "weight_dimension": "iti", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "question_text": "What type of career environment appeals to you most?",
            "dimension": "work_environment",
            "display_order": 3,
            "options": [
                {"option_code": "A", "option_text": "High-tech software company or AI research laboratory", "weight_dimension": "science", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Engineering workshop, robotics lab, or tech startup", "weight_dimension": "diploma", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Corporate finance office, bank, or auditing firm", "weight_dimension": "commerce", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Industrial automation plant, solar power site, or field workshop", "weight_dimension": "iti", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "question_text": "What is your primary goal after completing Class 10 (SSLC)?",
            "dimension": "higher_ed_goal",
            "display_order": 4,
            "options": [
                {"option_code": "A", "option_text": "2-Year PUC Science to prepare for KCET / JEE entrance exams", "weight_dimension": "science", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "3-Year Polytechnic Diploma with direct B.Tech lateral entry", "weight_dimension": "diploma", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "2-Year PUC Commerce for CA Foundation or Banking degrees", "weight_dimension": "commerce", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "1-2 Year ITI Trade for immediate industrial technical skills", "weight_dimension": "iti", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "question_text": "How do you feel about Artificial Intelligence and modern technology?",
            "dimension": "tech_inclination",
            "display_order": 5,
            "options": [
                {"option_code": "A", "option_text": "Enthusiastic about learning AI algorithms and writing software code", "weight_dimension": "science", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Excited to integrate AI into robotics, IoT devices, and web applications", "weight_dimension": "diploma", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Interested in using AI tools for business analytics and marketing", "weight_dimension": "commerce", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Keen on learning automated industrial machinery and solar energy tech", "weight_dimension": "iti", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "question_text": "When working on a group project, what role do you naturally take?",
            "dimension": "team_role",
            "display_order": 6,
            "options": [
                {"option_code": "A", "option_text": "The Lead Researcher & Technical Architect", "weight_dimension": "science", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "The Hands-on Developer & Prototype Builder", "weight_dimension": "diploma", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "The Budget Manager & Resource Planner", "weight_dimension": "commerce", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "The Creative Storyteller & Presenter", "weight_dimension": "arts", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "question_text": "How do you react when you face a challenging math or science problem?",
            "dimension": "analytical_aptitude",
            "display_order": 7,
            "options": [
                {"option_code": "A", "option_text": "I enjoy spending time analyzing step-by-step logic to find the answer", "weight_dimension": "science", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "I prefer applying practical diagrams, CAD models, or code simulations", "weight_dimension": "diploma", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "I prefer calculations involving money, statistics, and business percentages", "weight_dimension": "commerce", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "I prefer visual, written, or conceptual explanations over numbers", "weight_dimension": "arts", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "question_text": "Which of these extracurricular activities interests you most?",
            "dimension": "extracurricular",
            "display_order": 8,
            "options": [
                {"option_code": "A", "option_text": "Coding competitions, Science Olympiad, and Math clubs", "weight_dimension": "science", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Robotics workshops, electronics tinkering, and Maker Faires", "weight_dimension": "diploma", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Debate, Mock Stock market, and Entrepreneurship clubs", "weight_dimension": "commerce", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Technical trade workshops, solar installations, or carpentry", "weight_dimension": "iti", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "question_text": "What is your preferred learning style?",
            "dimension": "learning_style",
            "display_order": 9,
            "options": [
                {"option_code": "A", "option_text": "Theoretical lectures combined with lab experiments and problem solving", "weight_dimension": "science", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Project-based learning with 70% practical shop floor & lab work", "weight_dimension": "diploma", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Case studies, ledger practice, and business simulation games", "weight_dimension": "commerce", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Direct industrial apprenticeship and hands-on tool usage", "weight_dimension": "iti", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "question_text": "Where do you see yourself 5 years after high school?",
            "dimension": "future_vision",
            "display_order": 10,
            "options": [
                {"option_code": "A", "option_text": "Graduating with B.E. / B.Tech or M.Sc in Artificial Intelligence", "weight_dimension": "science", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Working as a Software Developer or entering B.Tech via Lateral Entry", "weight_dimension": "diploma", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Working as a Chartered Accountant, Financial Analyst, or Business Lead", "weight_dimension": "commerce", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Certified Industrial Specialist running solar energy or technical services", "weight_dimension": "iti", "weight_score": 3, "display_order": 4},
            ]
        }
    ]
}


def seed_initial_assessment_data(db: Session) -> dict:
    existing_assessment = db.query(Assessment).filter(Assessment.id == SEED_ASSESSMENT["id"]).first()
    if existing_assessment:
        return {"status": "exists", "assessment_id": existing_assessment.id}

    assessment = Assessment(
        id=SEED_ASSESSMENT["id"],
        title=SEED_ASSESSMENT["title"],
        description=SEED_ASSESSMENT["description"],
        category=SEED_ASSESSMENT["category"],
        total_questions=SEED_ASSESSMENT["total_questions"],
        is_active=SEED_ASSESSMENT["is_active"]
    )
    db.add(assessment)

    for q_data in SEED_ASSESSMENT["questions"]:
        q_id = uuid.uuid4()
        question = AssessmentQuestion(
            id=q_id,
            assessment_id=assessment.id,
            question_text=q_data["question_text"],
            dimension=q_data["dimension"],
            display_order=q_data["display_order"]
        )
        db.add(question)

        for opt_data in q_data["options"]:
            option = AssessmentOption(
                id=uuid.uuid4(),
                question_id=q_id,
                option_text=opt_data["option_text"],
                option_code=opt_data["option_code"],
                weight_dimension=opt_data["weight_dimension"],
                weight_score=opt_data["weight_score"],
                display_order=opt_data["display_order"]
            )
            db.add(option)

    db.commit()
    return {"status": "created", "assessment_id": assessment.id}
