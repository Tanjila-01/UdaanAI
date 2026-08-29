import uuid
from sqlalchemy.orm import Session
from app.models.assessment import Assessment, AssessmentQuestion, AssessmentOption

SEED_ASSESSMENTS = [
    {
        "id": "karnataka-class-8-9-exploration-v1",
        "title": "Class 8-9 Career Exploration Assessment",
        "description": "Designed for Class 8 and 9 students to explore general interests, emerging strengths, and broad career concepts.",
        "category": "career_aptitude",
        "target_level": "Class 8-9",
        "target_stream": None,
        "assessment_version": "v1",
        "scoring_version": "rule-v1",
        "questions": [
            {
                "question_text": "What kind of activities do you enjoy most in your free time?",
                "dimension": "general_interest",
                "display_order": 1,
                "options": [
                    {"option_code": "A", "option_text": "Solving puzzles, logic games, or reading science articles", "weight_dimension": "science", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "Tinkering with electronic gadgets, toys, or basic block coding", "weight_dimension": "diploma", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "Running a small game stall, managing school event expenses, or budgeting", "weight_dimension": "commerce", "weight_score": 3, "display_order": 3},
                    {"option_code": "D", "option_text": "Drawing, painting, writing stories, or participating in school plays", "weight_dimension": "arts", "weight_score": 3, "display_order": 4},
                ]
            },
            {
                "question_text": "How do you prefer to work on class science projects?",
                "dimension": "problem_solving",
                "display_order": 2,
                "options": [
                    {"option_code": "A", "option_text": "Finding out why things work using textbooks and research", "weight_dimension": "science", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "Building a working physical model or model layout", "weight_dimension": "diploma", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "Presenting the project cost and explaining its practical uses", "weight_dimension": "commerce", "weight_score": 3, "display_order": 3},
                    {"option_code": "D", "option_text": "Repairing classroom tools or doing hands-on assembly", "weight_dimension": "iti", "weight_score": 3, "display_order": 4},
                ]
            },
            {
                "question_text": "Which school subjects do you find most interesting?",
                "dimension": "academic_interest",
                "display_order": 3,
                "options": [
                    {"option_code": "A", "option_text": "Science and Mathematics", "weight_dimension": "science", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "Computer Science and Technical Drawing", "weight_dimension": "diploma", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "Social Sciences, History, and Languages", "weight_dimension": "arts", "weight_score": 3, "display_order": 3},
                    {"option_code": "D", "option_text": "Practical Crafts, Work Experience, or DIY workshops", "weight_dimension": "iti", "weight_score": 3, "display_order": 4},
                ]
            },
            {
                "question_text": "What type of environment would you like to work in in the future?",
                "dimension": "work_environment",
                "display_order": 4,
                "options": [
                    {"option_code": "A", "option_text": "A clean office, computer software company, or research lab", "weight_dimension": "science", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "An engineering department, robotics workshop, or design lab", "weight_dimension": "diploma", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "A bank, retail market business, or corporate finance team", "weight_dimension": "commerce", "weight_score": 3, "display_order": 3},
                    {"option_code": "D", "option_text": "A modern factory, green energy solar plant, or industrial facility", "weight_dimension": "iti", "weight_score": 3, "display_order": 4},
                ]
            },
            {
                "question_text": "If you had a computer, what would you want to learn first?",
                "dimension": "technology_inclination",
                "display_order": 5,
                "options": [
                    {"option_code": "A", "option_text": "How computer programs, apps, and artificial intelligence work", "weight_dimension": "science", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "How to design digital graphics, interfaces, or websites", "weight_dimension": "arts", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "How to use software to track business sales and accounts", "weight_dimension": "commerce", "weight_score": 3, "display_order": 3},
                    {"option_code": "D", "option_text": "How computer hardware is assembled and connected", "weight_dimension": "iti", "weight_score": 3, "display_order": 4},
                ]
            },
            {
                "question_text": "When you read a story book or watch a movie, what captures your interest?",
                "dimension": "concept_appreciation",
                "display_order": 6,
                "options": [
                    {"option_code": "A", "option_text": "The scientific mysteries, logic puzzles, or futuristic technology", "weight_dimension": "science", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "The relationships, historical settings, and creative stories", "weight_dimension": "arts", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "How people build businesses, manage money, or lead others", "weight_dimension": "commerce", "weight_score": 3, "display_order": 3},
                    {"option_code": "D", "option_text": "How machines, vehicles, and complex systems are constructed", "weight_dimension": "diploma", "weight_score": 3, "display_order": 4},
                ]
            },
            {
                "question_text": "How do you prefer to spend a holiday afternoon?",
                "dimension": "leisure_style",
                "display_order": 7,
                "options": [
                    {"option_code": "A", "option_text": "Doing science experiments at home or playing math games", "weight_dimension": "science", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "Drawing cartoons, coding a simple script, or creating crafts", "weight_dimension": "arts", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "Visiting a local market to see how shops sell goods", "weight_dimension": "commerce", "weight_score": 3, "display_order": 3},
                    {"option_code": "D", "option_text": "Helping repair a bicycle, household appliance, or furniture", "weight_dimension": "iti", "weight_score": 3, "display_order": 4},
                ]
            },
            {
                "question_text": "Which of these talks at school would you attend?",
                "dimension": "curiosity_direction",
                "display_order": 8,
                "options": [
                    {"option_code": "A", "option_text": "Space exploration and how life evolved on earth", "weight_dimension": "science", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "How robots and automated machines work in fields", "weight_dimension": "diploma", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "How successful companies grew from small startups", "weight_dimension": "commerce", "weight_score": 3, "display_order": 3},
                    {"option_code": "D", "option_text": "How solar power panels produce electrical energy", "weight_dimension": "iti", "weight_score": 3, "display_order": 4},
                ]
            }
        ]
    },
    {
        "id": "karnataka-class-10-pathway-exploration-v1",
        "title": "SSLC Class 10 Aptitude Assessment",
        "description": "Structured interest assessment designed for SSLC Class 10 students to evaluate post-Class-10 pathways: PUC, Diploma, ITI.",
        "category": "career_aptitude",
        "target_level": "Class 10",
        "target_stream": None,
        "assessment_version": "v1",
        "scoring_version": "rule-v1",
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
    },
    {
        "id": "karnataka-puc-science-direction-v1",
        "title": "PUC Science Career Direction Assessment",
        "description": "Evaluates Science stream PUC students (both PUC 1 and PUC 2) for higher education routes in engineering, health sciences, computing, and technology.",
        "category": "career_aptitude",
        "target_level": "PUC",
        "target_stream": "Science",
        "assessment_version": "v1",
        "scoring_version": "rule-v1",
        "questions": [
            {
                "question_text": "Which advanced topic in your Science class interests you most?",
                "dimension": "advanced_science_interest",
                "display_order": 1,
                "options": [
                    {"option_code": "A", "option_text": "Algorithms, coding software programs, or data structures", "weight_dimension": "science", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "Microcontrollers, embedded systems, and IoT networks", "weight_dimension": "diploma", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "Biotechnology, human clinical biology, or life sciences", "weight_dimension": "science", "weight_score": 3, "display_order": 3},
                    {"option_code": "D", "option_text": "Numerical statistics, quantitative business data analysis", "weight_dimension": "commerce", "weight_score": 2, "display_order": 4},
                ]
            },
            {
                "question_text": "What type of project would you choose for a Science exhibition?",
                "dimension": "science_project",
                "display_order": 2,
                "options": [
                    {"option_code": "A", "option_text": "An AI application, software chatbot, or web utility", "weight_dimension": "science", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "A working automation prototype, smart robot, or solar tracker", "weight_dimension": "diploma", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "A chemical synthesis project or molecular biology research poster", "weight_dimension": "science", "weight_score": 3, "display_order": 3},
                    {"option_code": "D", "option_text": "A mathematical model for business stock trades or sales forecast", "weight_dimension": "commerce", "weight_score": 2, "display_order": 4},
                ]
            },
            {
                "question_text": "Which career track fits your long-term goal?",
                "dimension": "career_track",
                "display_order": 3,
                "options": [
                    {"option_code": "A", "option_text": "Software Engineering, Cybersecurity, or Cloud Architecture", "weight_dimension": "science", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "Medical doctor, dental specialist, clinical pharmacology expert", "weight_dimension": "science", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "Robotics developer, hardware engineer, or network lead", "weight_dimension": "diploma", "weight_score": 3, "display_order": 3},
                    {"option_code": "D", "option_text": "UI/UX interface designer, game artist, or digital creator", "weight_dimension": "arts", "weight_score": 2, "display_order": 4},
                ]
            },
            {
                "question_text": "How do you prefer to analyze data in a laboratory?",
                "dimension": "lab_analysis",
                "display_order": 4,
                "options": [
                    {"option_code": "A", "option_text": "Developing python scripts to analyze scientific data", "weight_dimension": "science", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "Connecting sensors and checking digital oscilloscope waveforms", "weight_dimension": "diploma", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "Recording clinical observations, medical symptoms, or biological cell growth", "weight_dimension": "science", "weight_score": 3, "display_order": 3},
                    {"option_code": "D", "option_text": "Preparing cost charts, supply logs, and business plans for lab setups", "weight_dimension": "commerce", "weight_score": 2, "display_order": 4},
                ]
            },
            {
                "question_text": "What type of college courses appeal to you?",
                "dimension": "academic_coursework",
                "display_order": 5,
                "options": [
                    {"option_code": "A", "option_text": "Four-year B.E. or B.Tech engineering degree in CS, IT, or ECE", "weight_dimension": "science", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "MBBS, B.Pharm, or agricultural sciences degree", "weight_dimension": "science", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "B.Sc or M.Sc in computer science, statistics, or biotechnology", "weight_dimension": "diploma", "weight_score": 2, "display_order": 3},
                    {"option_code": "D", "option_text": "Integrated 5-Year Law program or digital design course", "weight_dimension": "arts", "weight_score": 2, "display_order": 4},
                ]
            },
            {
                "question_text": "If you could visit a workplace for a day, which would you pick?",
                "dimension": "workplace_preference",
                "display_order": 6,
                "options": [
                    {"option_code": "A", "option_text": "An IT park or software company engineering lab", "weight_dimension": "science", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "A multispecialty hospital, research clinic, or pharmacy lab", "weight_dimension": "science", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "An automation factory or hardware design shop", "weight_dimension": "diploma", "weight_score": 3, "display_order": 3},
                    {"option_code": "D", "option_text": "A corporate banking center or financial investment office", "weight_dimension": "commerce", "weight_score": 2, "display_order": 4},
                ]
            },
            {
                "question_text": "How do you feel about coding or software development?",
                "dimension": "coding_inclination",
                "display_order": 7,
                "options": [
                    {"option_code": "A", "option_text": "Highly interested; I enjoy writing logical code, algorithms, and apps", "weight_dimension": "science", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "Interested in applying scripts to manage hardware, databases, and microcontrollers", "weight_dimension": "diploma", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "Prefer using computer tools for data plotting, report making, or editing", "weight_dimension": "commerce", "weight_score": 2, "display_order": 3},
                    {"option_code": "D", "option_text": "Not interested in coding; I prefer creative design, writing, or arts", "weight_dimension": "arts", "weight_score": 2, "display_order": 4},
                ]
            },
            {
                "question_text": "What type of challenge excites you?",
                "dimension": "challenge_preference",
                "display_order": 8,
                "options": [
                    {"option_code": "A", "option_text": "Solving abstract equations, calculus, or physics word problems", "weight_dimension": "science", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "Troubleshooting electronic circuits, mechanical assemblies, or software bugs", "weight_dimension": "diploma", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "Understanding how financial markets, trade logic, or company stock values work", "weight_dimension": "commerce", "weight_score": 2, "display_order": 3},
                    {"option_code": "D", "option_text": "Designing a visual concept map, poster presentation, or creative interface", "weight_dimension": "arts", "weight_score": 2, "display_order": 4},
                ]
            }
        ]
    },
    {
        "id": "karnataka-puc-commerce-direction-v1",
        "title": "PUC Commerce Career Direction Assessment",
        "description": "Designed for Commerce stream PUC students (both PUC 1 and PUC 2) to evaluate aptitude for finance, accounting, banking, corporate law, and management tracks.",
        "category": "career_aptitude",
        "target_level": "PUC",
        "target_stream": "Commerce",
        "assessment_version": "v1",
        "scoring_version": "rule-v1",
        "questions": [
            {
                "question_text": "Which area of your business studies interests you most?",
                "dimension": "business_aptitude",
                "display_order": 1,
                "options": [
                    {"option_code": "A", "option_text": "Double-entry bookkeeping, final ledger sheets, and auditing", "weight_dimension": "commerce", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "Financial economics, banking regulations, and supply-demand theory", "weight_dimension": "commerce", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "Using computers to run financial database systems and spreadsheets", "weight_dimension": "commerce", "weight_score": 3, "display_order": 3},
                    {"option_code": "D", "option_text": "Creative marketing campaigns, product design, or PR writing", "weight_dimension": "arts", "weight_score": 2, "display_order": 4},
                ]
            },
            {
                "question_text": "What type of simulation game would you play?",
                "dimension": "simulation_pref",
                "display_order": 2,
                "options": [
                    {"option_code": "A", "option_text": "Stock market trading simulation to optimize investments", "weight_dimension": "commerce", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "Management simulation running a startup company budget", "weight_dimension": "commerce", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "Designing a building layout using CAD modeling systems", "weight_dimension": "diploma", "weight_score": 2, "display_order": 3},
                    {"option_code": "D", "option_text": "Writing logic code to build a game database engine", "weight_dimension": "science", "weight_score": 2, "display_order": 4},
                ]
            },
            {
                "question_text": "Which career milestone track fits your long-term plan?",
                "dimension": "career_milestone",
                "display_order": 3,
                "options": [
                    {"option_code": "A", "option_text": "Passing the Chartered Accountant (CA) or Company Secretary (CS) exams", "weight_dimension": "commerce", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "Working as an investment analyst, corporate banker, or audit lead", "weight_dimension": "commerce", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "Integrated 5-Year corporate law degree (B.Com LL.B or BBA LL.B)", "weight_dimension": "commerce", "weight_score": 3, "display_order": 3},
                    {"option_code": "D", "option_text": "Becoming a hospitality or hotel manager running global branches", "weight_dimension": "arts", "weight_score": 2, "display_order": 4},
                ]
            },
            {
                "question_text": "How do you prefer to handle quantitative data?",
                "dimension": "quantitative_pref",
                "display_order": 4,
                "options": [
                    {"option_code": "A", "option_text": "Using mathematical statistics, ledger balances, and corporate accounts", "weight_dimension": "commerce", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "Analyzing macro-economic indicators, inflation data, and market graphs", "weight_dimension": "commerce", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "Writing math algorithms or computer program loops to calculate scores", "weight_dimension": "science", "weight_score": 2, "display_order": 3},
                    {"option_code": "D", "option_text": "Visualizing cost data using infographics and creative presentations", "weight_dimension": "arts", "weight_score": 2, "display_order": 4},
                ]
            },
            {
                "question_text": "If you could manage a budget, what would you focus on?",
                "dimension": "budget_mgmt",
                "display_order": 5,
                "options": [
                    {"option_code": "A", "option_text": "Maximizing returns by cutting costs and auditing accounts", "weight_dimension": "commerce", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "Allocating capital to fund new business ideas and advertising", "weight_dimension": "commerce", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "Allocating resources to build technical hardware pipelines", "weight_dimension": "diploma", "weight_score": 2, "display_order": 3},
                    {"option_code": "D", "option_text": "Sponsoring creative art installations and design exhibitions", "weight_dimension": "arts", "weight_score": 2, "display_order": 4},
                ]
            },
            {
                "question_text": "Which corporate project sounds most interesting?",
                "dimension": "corporate_project",
                "display_order": 6,
                "options": [
                    {"option_code": "A", "option_text": "Preparing the annual tax and audit report for a public company", "weight_dimension": "commerce", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "Planning the marketing and rollout strategy for a new app", "weight_dimension": "commerce", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "Drafting the legal contract for corporate mergers and acquisitions", "weight_dimension": "arts", "weight_score": 2, "display_order": 3},
                    {"option_code": "D", "option_text": "Designing the database structure for client sales records", "weight_dimension": "science", "weight_score": 2, "display_order": 4},
                ]
            },
            {
                "question_text": "How do you prefer to resolve business problems?",
                "dimension": "biz_resolution",
                "display_order": 7,
                "options": [
                    {"option_code": "A", "option_text": "Analyzing transaction logs to trace lost funds", "weight_dimension": "commerce", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "Negotiating with suppliers to reduce manufacturing costs", "weight_dimension": "commerce", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "Troubleshooting database errors in accounting systems", "weight_dimension": "science", "weight_score": 2, "display_order": 3},
                    {"option_code": "D", "option_text": "Conducting interviews to understand client satisfaction", "weight_dimension": "arts", "weight_score": 2, "display_order": 4},
                ]
            },
            {
                "question_text": "What type of news articles do you read first?",
                "dimension": "reading_pref",
                "display_order": 8,
                "options": [
                    {"option_code": "A", "option_text": "Central bank interest rates changes and monetary policy reviews", "weight_dimension": "commerce", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "Startup profiles, business funding, and tech acquisitions", "weight_dimension": "commerce", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "New space telescopes, physics breakthroughs, or AI releases", "weight_dimension": "science", "weight_score": 2, "display_order": 3},
                    {"option_code": "D", "option_text": "Book reviews, art awards, design projects, or policy debates", "weight_dimension": "arts", "weight_score": 2, "display_order": 4},
                ]
            }
        ]
    },
    {
        "id": "karnataka-puc-arts-direction-v1",
        "title": "PUC Arts Career Direction Assessment",
        "description": "Designed for Arts stream PUC students (both PUC 1 and PUC 2) to evaluate directions in social sciences, humanities, law, design, media, and public services.",
        "category": "career_aptitude",
        "target_level": "PUC",
        "target_stream": "Arts",
        "assessment_version": "v1",
        "scoring_version": "rule-v1",
        "questions": [
            {
                "question_text": "Which topic in your Humanities classes interests you most?",
                "dimension": "humanities_interest",
                "display_order": 1,
                "options": [
                    {"option_code": "A", "option_text": "Political theories, constitutional law, and public policy structures", "weight_dimension": "arts", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "Sociology case studies, human relations, and social systems", "weight_dimension": "arts", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "Historical economics, business trade networks, and taxation history", "weight_dimension": "commerce", "weight_score": 2, "display_order": 3},
                    {"option_code": "D", "option_text": "Scientific method in archaeological dating or logic models", "weight_dimension": "science", "weight_score": 2, "display_order": 4},
                ]
            },
            {
                "question_text": "What type of project would you choose for a humanities seminar?",
                "dimension": "arts_project",
                "display_order": 2,
                "options": [
                    {"option_code": "A", "option_text": "A study on human rights cases or political debates in history", "weight_dimension": "arts", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "A creative visual design portfolio, poster presentation, or infographic", "weight_dimension": "arts", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "A proposal for a village tourism development or event budget", "weight_dimension": "commerce", "weight_score": 2, "display_order": 3},
                    {"option_code": "D", "option_text": "A study on the technology infrastructure of ancient civilisations", "weight_dimension": "diploma", "weight_score": 2, "display_order": 4},
                ]
            },
            {
                "question_text": "Which career track fits your long-term goal?",
                "dimension": "arts_career_track",
                "display_order": 3,
                "options": [
                    {"option_code": "A", "option_text": "Integrated 5-Year Law program (BA LL.B) to practice as an advocate", "weight_dimension": "arts", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "UI/UX interface designer, product designer, or creative artist", "weight_dimension": "arts", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "Corporate management, retail logistics lead, or business planner", "weight_dimension": "commerce", "weight_score": 2, "display_order": 3},
                    {"option_code": "D", "option_text": "Industrial safety inspector or trade workshop controller", "weight_dimension": "iti", "weight_score": 2, "display_order": 4},
                ]
            },
            {
                "question_text": "How do you prefer to gather facts for an argument?",
                "dimension": "argument_gathering",
                "display_order": 4,
                "options": [
                    {"option_code": "A", "option_text": "Reading court judgments, policy drafts, and legal history", "weight_dimension": "arts", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "Conducting interviews, user surveys, and recording stories", "weight_dimension": "arts", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "Analyzing market sales data spreadsheets and business indices", "weight_dimension": "commerce", "weight_score": 2, "display_order": 3},
                    {"option_code": "D", "option_text": "Reviewing blueprints, electrical lines, and machine data logs", "weight_dimension": "iti", "weight_score": 2, "display_order": 4},
                ]
            },
            {
                "question_text": "If you could write an article for a local newspaper, what would you choose?",
                "dimension": "media_pref",
                "display_order": 5,
                "options": [
                    {"option_code": "A", "option_text": "A critical analysis of central government policies and laws", "weight_dimension": "arts", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "A feature on local cultural arts, design projects, and murals", "weight_dimension": "arts", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "A review of how local trade cooperatives manage credit budgets", "weight_dimension": "commerce", "weight_score": 2, "display_order": 3},
                    {"option_code": "D", "option_text": "An explanation of solar panel installations and trade careers", "weight_dimension": "iti", "weight_score": 2, "display_order": 4},
                ]
            },
            {
                "question_text": "Which type of challenge is most satisfying?",
                "dimension": "arts_challenge",
                "display_order": 6,
                "options": [
                    {"option_code": "A", "option_text": "Participating in structured debate tournaments and moot court trials", "weight_dimension": "arts", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "Designing a visual poster, logo, or website interface from scratch", "weight_dimension": "arts", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "Organizing a school fair and tracking the profit margins of each booth", "weight_dimension": "commerce", "weight_score": 2, "display_order": 3},
                    {"option_code": "D", "option_text": "Diagnosing a mechanical glitch in a school printer or audio console", "weight_dimension": "diploma", "weight_score": 2, "display_order": 4},
                ]
            },
            {
                "question_text": "What type of community project would you lead?",
                "dimension": "community_project",
                "display_order": 7,
                "options": [
                    {"option_code": "A", "option_text": "A legal literacy camp explaining citizen rights and court options", "weight_dimension": "arts", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "An art project designing posters and creative layouts for public spaces", "weight_dimension": "arts", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "A credit society helping local women secure small business capital", "weight_dimension": "commerce", "weight_score": 2, "display_order": 3},
                    {"option_code": "D", "option_text": "A workshop teaching local youth basic household wiring safety", "weight_dimension": "iti", "weight_score": 2, "display_order": 4},
                ]
            },
            {
                "question_text": "Which of these courses sounds most appealing?",
                "dimension": "course_pref",
                "display_order": 8,
                "options": [
                    {"option_code": "A", "option_text": "Bachelor of Law (LL.B) with legal advocacy training", "weight_dimension": "arts", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "Bachelor of Design (B.Des) in UI/UX or Communication Design", "weight_dimension": "arts", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "Bachelor of Hotel Management (BHM) or Business Administration (BBA)", "weight_dimension": "commerce", "weight_score": 2, "display_order": 3},
                    {"option_code": "D", "option_text": "Bachelor of Arts in Economics/Political Science with statistics focus", "weight_dimension": "arts", "weight_score": 2, "display_order": 4},
                ]
            }
        ]
    },
    {
        "id": "karnataka-diploma-direction-v1",
        "title": "Polytechnic Diploma Specialization Assessment",
        "description": "Designed for Polytechnic Diploma students to evaluate technical specializations, further-study lateral entry pathways, and industrial career tracks.",
        "category": "career_aptitude",
        "target_level": "Diploma",
        "target_stream": None,
        "assessment_version": "v1",
        "scoring_version": "rule-v1",
        "questions": [
            {
                "question_text": "Which practical domain in your Engineering Diploma interests you most?",
                "dimension": "diploma_field",
                "display_order": 1,
                "options": [
                    {"option_code": "A", "option_text": "Software architecture, database admin, and system coding", "weight_dimension": "diploma", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "Integrated circuits, semiconductor chips, and electronic boards", "weight_dimension": "diploma", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "CAD/CAM mechanical designing, thermodynamics, and robotics", "weight_dimension": "diploma", "weight_score": 3, "display_order": 3},
                    {"option_code": "D", "option_text": "Scientific physics, algorithms, and advanced mathematics", "weight_dimension": "science", "weight_score": 2, "display_order": 4},
                ]
            },
            {
                "question_text": "What type of capstone project do you prefer for your Diploma final year?",
                "dimension": "diploma_project",
                "display_order": 2,
                "options": [
                    {"option_code": "A", "option_text": "Building a full-stack web app, mobile software utility, or cloud setup", "weight_dimension": "diploma", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "Designing an IoT smart automation device or micro-robotic arm", "weight_dimension": "diploma", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "Constructing a model solar tracker or automated conveyor system", "weight_dimension": "diploma", "weight_score": 3, "display_order": 3},
                    {"option_code": "D", "option_text": "Writing a theoretical research thesis on structural materials and physics", "weight_dimension": "science", "weight_score": 2, "display_order": 4},
                ]
            },
            {
                "question_text": "What is your main goal after completing your Polytechnic Diploma?",
                "dimension": "post_diploma_goal",
                "display_order": 3,
                "options": [
                    {"option_code": "A", "option_text": "Direct lateral entry into 2nd year B.E / B.Tech via DCET entrance", "weight_dimension": "diploma", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "Immediate technical placement in an industrial software or engineering park", "weight_dimension": "diploma", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "Starting a technical consultancy service or engineering repair trade shop", "weight_dimension": "iti", "weight_score": 2, "display_order": 3},
                    {"option_code": "D", "option_text": "Pursuing corporate MBA and management courses after graduation", "weight_dimension": "commerce", "weight_score": 2, "display_order": 4},
                ]
            },
            {
                "question_text": "Which workplace environment appeals to you?",
                "dimension": "diploma_workplace",
                "display_order": 4,
                "options": [
                    {"option_code": "A", "option_text": "An IT team designing algorithms, network firewalls, and cloud databases", "weight_dimension": "diploma", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "An R&D department designing embedded hardware circuit boards", "weight_dimension": "diploma", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "A manufacturing plant workshop overseeing robotic conveyor systems", "weight_dimension": "diploma", "weight_score": 3, "display_order": 3},
                    {"option_code": "D", "option_text": "An industrial shop floor running manual lathe work and solar power tools", "weight_dimension": "iti", "weight_score": 2, "display_order": 4},
                ]
            },
            {
                "question_text": "How do you prefer to troubleshoot a hardware fault?",
                "dimension": "hardware_troubleshooting",
                "display_order": 5,
                "options": [
                    {"option_code": "A", "option_text": "Using digital software debuggers, logic analyzers, and logs", "weight_dimension": "diploma", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "Testing electronic pins with digital multimeters and oscilloscope waves", "weight_dimension": "diploma", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "Applying scientific physics calculations to check load parameters", "weight_dimension": "science", "weight_score": 2, "display_order": 3},
                    {"option_code": "D", "option_text": "Rewiring connections manually and replacing structural trade fuses", "weight_dimension": "iti", "weight_score": 2, "display_order": 4},
                ]
            },
            {
                "question_text": "If you could take an additional certification, which would you pick?",
                "dimension": "certification_pref",
                "display_order": 6,
                "options": [
                    {"option_code": "A", "option_text": "Full-stack software developer, AWS Cloud Architect, or database lead", "weight_dimension": "diploma", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "Embedded systems designer, IoT programmer, or VLSI hardware architect", "weight_dimension": "diploma", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "CAD/CAM mechanical designer, Autodesk Inventor, or industrial designer", "weight_dimension": "diploma", "weight_score": 3, "display_order": 3},
                    {"option_code": "D", "option_text": "Project management framework certification (PMP) or business analytics", "weight_dimension": "commerce", "weight_score": 2, "display_order": 4},
                ]
            },
            {
                "question_text": "What type of laboratory activity is most satisfying?",
                "dimension": "lab_pref",
                "display_order": 7,
                "options": [
                    {"option_code": "A", "option_text": "Writing code modules to run server databases and APIs", "weight_dimension": "diploma", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "Wiring electronic microcontrollers and checking circuit responses", "weight_dimension": "diploma", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "Measuring structural stress loads on beams and testing motors", "weight_dimension": "diploma", "weight_score": 3, "display_order": 3},
                    {"option_code": "D", "option_text": "Splicing optical fibers, installing switchboards, or mechanical alignment", "weight_dimension": "iti", "weight_score": 2, "display_order": 4},
                ]
            },
            {
                "question_text": "Which subject in school did you feel set your foundation?",
                "dimension": "foundation_subject",
                "display_order": 8,
                "options": [
                    {"option_code": "A", "option_text": "Applied Sciences and Physics logic", "weight_dimension": "science", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "Technical Drawing and Practical workshop", "weight_dimension": "diploma", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "Commercial Arithmetic and basic economics", "weight_dimension": "commerce", "weight_score": 2, "display_order": 3},
                    {"option_code": "D", "option_text": "Basic crafts, metalwork, or carpentry skills", "weight_dimension": "iti", "weight_score": 2, "display_order": 4},
                ]
            }
        ]
    },
    {
        "id": "karnataka-iti-direction-v1",
        "title": "ITI Trade & Vocational Skills Assessment",
        "description": "Designed for ITI trade students to evaluate vocational strengths, industrial apprentice pathways, and direct trade job readiness.",
        "category": "career_aptitude",
        "target_level": "ITI",
        "target_stream": None,
        "assessment_version": "v1",
        "scoring_version": "rule-v1",
        "questions": [
            {
                "question_text": "Which trade domain in ITI interests you most?",
                "dimension": "iti_domain",
                "display_order": 1,
                "options": [
                    {"option_code": "A", "option_text": "Electrical wiring, power panels, motor rewinding, and solar setup", "weight_dimension": "iti", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "Electronics technician, circuit card repair, and device troubleshooting", "weight_dimension": "iti", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "Fitter trades, lathe operations, welding, and machine assembly", "weight_dimension": "iti", "weight_score": 3, "display_order": 3},
                    {"option_code": "D", "option_text": "Basic computer programming, office database apps, and web tools", "weight_dimension": "diploma", "weight_score": 2, "display_order": 4},
                ]
            },
            {
                "question_text": "What type of hands-on activity do you enjoy most?",
                "dimension": "hands_on_activity",
                "display_order": 2,
                "options": [
                    {"option_code": "A", "option_text": "Installing solar power panels, domestic conduits, or lighting systems", "weight_dimension": "iti", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "Soldering microchips, replacing electronic capacitors, or wiring boards", "weight_dimension": "iti", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "Operating manual drill presses, milling machines, or welding joints", "weight_dimension": "iti", "weight_score": 3, "display_order": 3},
                    {"option_code": "D", "option_text": "Drafting technical layouts, schematic diagrams, or circuit designs", "weight_dimension": "diploma", "weight_score": 2, "display_order": 4},
                ]
            },
            {
                "question_text": "What is your primary goal after completing your ITI trade?",
                "dimension": "post_iti_goal",
                "display_order": 3,
                "options": [
                    {"option_code": "A", "option_text": "Securing a direct industrial apprentice position (like BHEL, KSRTC)", "weight_dimension": "iti", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "Working as an electrical or solar maintenance trade specialist", "weight_dimension": "iti", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "Lateral entry into a 3-year Polytechnic Diploma course (2nd year entry)", "weight_dimension": "diploma", "weight_score": 3, "display_order": 3},
                    {"option_code": "D", "option_text": "Starting a commercial business selling electrical or hardware supplies", "weight_dimension": "commerce", "weight_score": 2, "display_order": 4},
                ]
            },
            {
                "question_text": "Which work environment would you find most satisfying?",
                "dimension": "iti_workplace",
                "display_order": 4,
                "options": [
                    {"option_code": "A", "option_text": "An industrial plant floor running automated solar generators", "weight_dimension": "iti", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "A field site installing solar grids, domestic wires, and panels", "weight_dimension": "iti", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "A maintenance workshop repairing mechanical lathe engines", "weight_dimension": "iti", "weight_score": 3, "display_order": 3},
                    {"option_code": "D", "option_text": "A software team testing application scripts and database loops", "weight_dimension": "science", "weight_score": 2, "display_order": 4},
                ]
            },
            {
                "question_text": "How do you prefer to learn new trade skills?",
                "dimension": "learning_style_pref",
                "display_order": 5,
                "options": [
                    {"option_code": "A", "option_text": "Direct shop floor apprenticeship with hands-on machinery usage", "weight_dimension": "iti", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "Structured wiring tutorials, schematic reviews, and bench tests", "weight_dimension": "iti", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "Watching video demonstrations of mechanical fitters welding joints", "weight_dimension": "iti", "weight_score": 3, "display_order": 3},
                    {"option_code": "D", "option_text": "Reading classroom textbooks and solving science physics equations", "weight_dimension": "science", "weight_score": 2, "display_order": 4},
                ]
            },
            {
                "question_text": "If you could purchase a tool set, what would it contain?",
                "dimension": "tools_pref",
                "display_order": 6,
                "options": [
                    {"option_code": "A", "option_text": "Insulated screwdrivers, wire strippers, multimeters, and conduit tools", "weight_dimension": "iti", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "Soldering irons, magnifying lenses, circuit testers, and desoldering pumps", "weight_dimension": "iti", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "Wrenches, calipers, welding torches, and manual machine clamps", "weight_dimension": "iti", "weight_score": 3, "display_order": 3},
                    {"option_code": "D", "option_text": "Software database licenses and computer programming textbooks", "weight_dimension": "diploma", "weight_score": 2, "display_order": 4},
                ]
            },
            {
                "question_text": "Which industrial sector seems most stable and growing?",
                "dimension": "sector_preference",
                "display_order": 7,
                "options": [
                    {"option_code": "A", "option_text": "Solar energy generation, green power grids, and electrical utilities", "weight_dimension": "iti", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "Automotive assembly lines, heavy machinery fitter workshops", "weight_dimension": "iti", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "Consumer electronics manufacturing and circuit repairing shops", "weight_dimension": "iti", "weight_score": 3, "display_order": 3},
                    {"option_code": "D", "option_text": "Digital retail sales, corporate banking, and trade economics", "weight_dimension": "commerce", "weight_score": 2, "display_order": 4},
                ]
            },
            {
                "question_text": "What type of manual task gives you satisfaction?",
                "dimension": "task_satisfaction",
                "display_order": 8,
                "options": [
                    {"option_code": "A", "option_text": "Wiring a domestic building switchboard and checking it lights up", "weight_dimension": "iti", "weight_score": 3, "display_order": 1},
                    {"option_code": "B", "option_text": "Soldering an electronic kit and seeing the LED pulse properly", "weight_dimension": "iti", "weight_score": 3, "display_order": 2},
                    {"option_code": "C", "option_text": "Filing a metal block to exact millimeter specifications", "weight_dimension": "iti", "weight_score": 3, "display_order": 3},
                    {"option_code": "D", "option_text": "Creating a spreadsheet to calculate family business monthly expenses", "weight_dimension": "commerce", "weight_score": 2, "display_order": 4},
                ]
            }
        ]
    }
]


def seed_initial_assessment_data(db: Session) -> dict:
    created_count = 0
    skipped_count = 0

    for a_data in SEED_ASSESSMENTS:
        existing_assessment = db.query(Assessment).filter(Assessment.id == a_data["id"]).first()
        if existing_assessment:
            skipped_count += 1
            continue

        assessment = Assessment(
            id=a_data["id"],
            title=a_data["title"],
            description=a_data["description"],
            category=a_data["category"],
            total_questions=len(a_data["questions"]),
            is_active=True,
            target_level=a_data["target_level"],
            target_stream=a_data["target_stream"],
            assessment_version=a_data["assessment_version"],
            scoring_version=a_data["scoring_version"]
        )
        db.add(assessment)
        db.flush()

        for q_data in a_data["questions"]:
            q_id = uuid.uuid4()
            question = AssessmentQuestion(
                id=q_id,
                assessment_id=assessment.id,
                question_text=q_data["question_text"],
                dimension=q_data["dimension"],
                display_order=q_data["display_order"]
            )
            db.add(question)
            db.flush()

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

        created_count += 1

    db.commit()
    return {"status": "success", "created": created_count, "skipped": skipped_count}
