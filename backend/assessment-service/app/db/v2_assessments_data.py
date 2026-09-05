"""
Udaan AI - Level-Aware Career Discovery Assessment v2 Dataset
6 Distinct Assessment Families:
1. Foundation (Class 8-10) -> foundation-career-discovery-v2
2. PUC Science -> puc-science-direction-v2
3. PUC Commerce -> puc-commerce-direction-v2
4. PUC Arts -> puc-arts-direction-v2
5. Polytechnic Diploma -> diploma-direction-v2
6. ITI Vocational Trades -> iti-direction-v2

Each family contains 15 decision-stage-appropriate questions with explicit dimension weighting.
No obvious career-title giveaway questions.
"""

# ==============================================================================
# 1. FOUNDATION (Class 8-10)
# Dimensions: science, commerce, arts, diploma, iti
# ==============================================================================
FOUNDATION_V2 = {
    "id": "foundation-career-discovery-v2",
    "title": "Foundation Career Discovery Assessment",
    "description": "Comprehensive orientation assessment for Class 8, 9, and 10 students evaluating interests across academic, technical, business, creative, and vocational pathways.",
    "category": "career_aptitude",
    "target_level": "Foundation (Class 8-10)",
    "target_stream": None,
    "assessment_version": "v2",
    "scoring_version": "rule-v2-foundation",
    "questions": [
        {
            "display_order": 1,
            "question_text": "When you have free time on a weekend, which type of activity engages you the most?",
            "dimension": "curiosity_orientation",
            "options": [
                {"option_code": "A", "option_text": "Reading about astronomy, biology breakthroughs, or solving mathematical riddles", "weight_dimension": "science", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Taking apart small gadgets, fixing bicycle parts, or assembling construction kits", "weight_dimension": "diploma", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Managing pocket money, tracking household shopping lists, or planning game stall budgets", "weight_dimension": "commerce", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Sketching, writing fictional stories, or learning about regional folklore and history", "weight_dimension": "arts", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 2,
            "question_text": "In a school science exhibition, what role would you naturally pick?",
            "dimension": "project_role",
            "options": [
                {"option_code": "A", "option_text": "Writing the scientific hypothesis, research facts, and chemical equations", "weight_dimension": "science", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Wiring the sensor circuit or crafting the physical mechanical model", "weight_dimension": "diploma", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Calculating project costs, procuring materials, and presenting to visitors", "weight_dimension": "commerce", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Soldering connections, cutting metal brackets, and testing wiring durability", "weight_dimension": "iti", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 3,
            "question_text": "Which school subject chapter do you look forward to reading the most?",
            "dimension": "subject_affinity",
            "options": [
                {"option_code": "A", "option_text": "Cell division, electricity laws, or algebraic quadratic equations", "weight_dimension": "science", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Trade routes, banking systems, and market economics", "weight_dimension": "commerce", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Democratic institutions, constitutional rights, and historical movements", "weight_dimension": "arts", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Practical geometric drawing, technical diagrams, and workshop safety", "weight_dimension": "diploma", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 4,
            "question_text": "If a household ceiling fan stops rotating, what is your first instinct?",
            "dimension": "practical_troubleshooting",
            "options": [
                {"option_code": "A", "option_text": "Understand the electromagnetic induction theory behind capacitor torque", "weight_dimension": "science", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Inspect the wiring connections, check voltage with a tester, and check bearing wear", "weight_dimension": "iti", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Estimate the replacement cost versus repair cost and evaluate guarantee cards", "weight_dimension": "commerce", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Look up the schematic diagram to inspect motor speed regulator circuitry", "weight_dimension": "diploma", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 5,
            "question_text": "What type of workspace environment would you find most inspiring?",
            "dimension": "work_environment",
            "options": [
                {"option_code": "A", "option_text": "A modern laboratory with microscopes, computers, and diagnostic tools", "weight_dimension": "science", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "An industrial design lab with 3D printers, motors, and testing rigs", "weight_dimension": "diploma", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "A corporate banking office analyzing market statistics and financial portfolios", "weight_dimension": "commerce", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "A creative studio, media room, or public administration center", "weight_dimension": "arts", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 6,
            "question_text": "When learning how computers work, what topic sounds most intriguing?",
            "dimension": "tech_inclination",
            "options": [
                {"option_code": "A", "option_text": "Writing code scripts and understanding algorithmic logic", "weight_dimension": "science", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Designing user interfaces, website graphics, and interactive layouts", "weight_dimension": "arts", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Building spreadsheets to compute financial interest and inventory logs", "weight_dimension": "commerce", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Assembling processor components, motherboard ports, and network cables", "weight_dimension": "iti", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 7,
            "question_text": "How do you prefer to resolve an argument or debate with peers?",
            "dimension": "reasoning_style",
            "options": [
                {"option_code": "A", "option_text": "Looking up constitutional rules, ethical guidelines, and legal precedents", "weight_dimension": "arts", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Comparing numerical data, facts, and verified scientific evidence", "weight_dimension": "science", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Negotiating a practical compromise that saves costs and time for everyone", "weight_dimension": "commerce", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Testing physical reality directly by demonstrating which solution works practically", "weight_dimension": "diploma", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 8,
            "question_text": "If you were helping to organize a school sports day, what task would you choose?",
            "dimension": "organization_style",
            "options": [
                {"option_code": "A", "option_text": "Managing budget, sponsor contributions, and prize purchase accounting", "weight_dimension": "commerce", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Setting up the audio speaker wiring, measuring tracks, and marking lanes", "weight_dimension": "iti", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Designing event banners, certificates, and delivering commentary announcements", "weight_dimension": "arts", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Building an automated electronic timer or stopwatch recording system", "weight_dimension": "diploma", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 9,
            "question_text": "Which real-world problem would you be most proud to contribute towards solving?",
            "dimension": "impact_orientation",
            "options": [
                {"option_code": "A", "option_text": "Discovering clean green energy sources or developing medical treatments", "weight_dimension": "science", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Designing affordable electric scooters or durable rural irrigation pumps", "weight_dimension": "diploma", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Helping local micro-businesses get loans and manage profitable operations", "weight_dimension": "commerce", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Reforming legal aid access and writing community education policies", "weight_dimension": "arts", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 10,
            "question_text": "Which documentary topic would hold your attention for an entire hour?",
            "dimension": "intellectual_curiosity",
            "options": [
                {"option_code": "A", "option_text": "How the human immune system fights viruses at a molecular level", "weight_dimension": "science", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "How modern solar power stations and electrical grids distribute electricity", "weight_dimension": "iti", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "The history of the stock market crash and international currency systems", "weight_dimension": "commerce", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "How archaeologists unearth ancient civilizations and interpret old scripts", "weight_dimension": "arts", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 11,
            "question_text": "When you visit a large railway station or airport, what catches your eye?",
            "dimension": "observational_interest",
            "options": [
                {"option_code": "A", "option_text": "The mechanical signals, track switches, and locomotive diesel/electric engines", "weight_dimension": "diploma", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "The ticketing software, seat reservation databases, and logistics accounting", "weight_dimension": "commerce", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "The architectural space, passenger wayfinding signage, and visual layout", "weight_dimension": "arts", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "The high-voltage overhead cables, maintenance tools, and emergency generators", "weight_dimension": "iti", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 12,
            "question_text": "What type of school assignment brings out your best effort?",
            "dimension": "learning_style",
            "options": [
                {"option_code": "A", "option_text": "Solving 20 challenging multi-step math and physics problems", "weight_dimension": "science", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Building a working physical crane, pulley, or wind turbine model", "weight_dimension": "diploma", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Writing an essay analyzing causes and consequences of historical conflicts", "weight_dimension": "arts", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Creating a mock trade balance sheet with incomes, debits, and taxes", "weight_dimension": "commerce", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 13,
            "question_text": "If given a kit of hand tools (screwdrivers, wrenches, pliers), how comfortable are you?",
            "dimension": "manual_dexterity",
            "options": [
                {"option_code": "A", "option_text": "Very comfortable—I enjoy hands-on fitting, tightening, and fabricating objects", "weight_dimension": "iti", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Comfortable when following a technical blueprint or assembly manual", "weight_dimension": "diploma", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "I prefer conceptual problem-solving over physical assembly work", "weight_dimension": "science", "weight_score": 2, "display_order": 3},
                {"option_code": "D", "option_text": "I prefer communication, artistic expression, or analytical paper work", "weight_dimension": "arts", "weight_score": 2, "display_order": 4},
            ]
        },
        {
            "display_order": 14,
            "question_text": "How do you feel about working with numbers, money, and spreadsheets?",
            "dimension": "quantitative_comfort",
            "options": [
                {"option_code": "A", "option_text": "I enjoy computing profits, percentage interest, and balancing accounts", "weight_dimension": "commerce", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "I enjoy numbers when they model physical formulas, motion, or calculus", "weight_dimension": "science", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "I prefer using measurements to calibrate machinery and cut materials accurately", "weight_dimension": "diploma", "weight_score": 2, "display_order": 3},
                {"option_code": "D", "option_text": "I prefer qualitative stories, linguistic debates, and social arguments", "weight_dimension": "arts", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 15,
            "question_text": "Which career achievement would give you the deepest satisfaction?",
            "dimension": "aspiration",
            "options": [
                {"option_code": "A", "option_text": "Publishing pioneering research or developing innovative software algorithms", "weight_dimension": "science", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Leading high-precision technical manufacturing or infrastructure installations", "weight_dimension": "diploma", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Auditing major corporations or managing profitable investment enterprises", "weight_dimension": "commerce", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Mastering skilled technical trades with immediate industry certification", "weight_dimension": "iti", "weight_score": 3, "display_order": 4},
            ]
        },
    ]
}

# ==============================================================================
# 2. PUC SCIENCE
# Dimensions: engineering, computing, medicine, allied_health, pure_sciences
# ==============================================================================
PUC_SCIENCE_V2 = {
    "id": "puc-science-direction-v2",
    "title": "PUC Science Degree & Career Direction Assessment",
    "description": "Specialized assessment for 1st and 2nd Year PUC Science students evaluating inclinations across engineering technology, software computing, clinical medicine, allied healthcare, and pure scientific research.",
    "category": "career_aptitude",
    "target_level": "PUC",
    "target_stream": "Science",
    "assessment_version": "v2",
    "scoring_version": "rule-v2-puc-science",
    "questions": [
        {
            "display_order": 1,
            "question_text": "Which chapter in your PUC syllabus stimulates your deepest curiosity?",
            "dimension": "core_affinity",
            "options": [
                {"option_code": "A", "option_text": "Thermodynamics, rotational dynamics, and electromagnetic waves", "weight_dimension": "engineering", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Boolean logic, algorithm complexity, and digital computational circuits", "weight_dimension": "computing", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Human physiology, neurobiology, and cellular genetics", "weight_dimension": "medicine", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Quantum mechanics, organic reaction mechanisms, and theoretical calculus", "weight_dimension": "pure_sciences", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 2,
            "question_text": "In a laboratory experiment, which task do you find most satisfying?",
            "dimension": "lab_preference",
            "options": [
                {"option_code": "A", "option_text": "Calibrating optical spectrometers, potentiometer bridges, and physical calipers", "weight_dimension": "engineering", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Dissecting plant/animal tissues and examining pathology slides under microscopes", "weight_dimension": "medicine", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Analyzing blood serum chemistry, drug titration, or medical testing reagents", "weight_dimension": "allied_health", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Automating data collection with Python scripts or microcontrollers", "weight_dimension": "computing", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 3,
            "question_text": "If you could spend a summer internship shadowing a professional, who would you choose?",
            "dimension": "role_shadowing",
            "options": [
                {"option_code": "A", "option_text": "A software architect designing scalable cloud algorithms and AI models", "weight_dimension": "computing", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "A chief surgeon or physician diagnosing complex clinical disorders in a hospital", "weight_dimension": "medicine", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "An aerospace or structural engineer designing propulsion turbines or bridges", "weight_dimension": "engineering", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "A clinical pharmacologist or medical laboratory technologist formulating therapies", "weight_dimension": "allied_health", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 4,
            "question_text": "When tackling a challenging multi-step problem, what is your preferred approach?",
            "dimension": "problem_approach",
            "options": [
                {"option_code": "A", "option_text": "Decomposing it into recursive logical steps and writing modular pseudo-code", "weight_dimension": "computing", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Drawing force vectors, physical free-body diagrams, and calculating stresses", "weight_dimension": "engineering", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Correlating biological symptoms, biochemical markers, and anatomical causes", "weight_dimension": "medicine", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Formulating fundamental mathematical theorems and proving first-principle laws", "weight_dimension": "pure_sciences", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 5,
            "question_text": "Which societal healthcare challenge would you feel most driven to work on?",
            "dimension": "health_impact",
            "options": [
                {"option_code": "A", "option_text": "Providing primary emergency surgical and medical diagnoses in underserved clinics", "weight_dimension": "medicine", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Managing specialized medical imaging (MRI/CT), dialysis equipment, or pharmacy supply", "weight_dimension": "allied_health", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Developing robotic surgical arms and biocompatible prosthetic materials", "weight_dimension": "engineering", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Building healthcare AI systems to analyze patient diagnostic records securely", "weight_dimension": "computing", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 6,
            "question_text": "How do you feel about mathematical abstraction versus empirical observation?",
            "dimension": "abstract_vs_applied",
            "options": [
                {"option_code": "A", "option_text": "I love pure mathematical rigor, proofs, and exploring number theory or astrophysics", "weight_dimension": "pure_sciences", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "I prefer using discrete math and graph theory to optimize data structures", "weight_dimension": "computing", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "I prefer using calculus and mechanics to solve concrete structural engineering challenges", "weight_dimension": "engineering", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "I prefer observing biological organisms, metabolic reactions, and medical data", "weight_dimension": "allied_health", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 7,
            "question_text": "Which technology advancement excites your vision for the next decade?",
            "dimension": "future_tech",
            "options": [
                {"option_code": "A", "option_text": "Autonomous self-driving vehicles, drone logistics, and hyperloop infrastructure", "weight_dimension": "engineering", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Generative neural networks, decentralized cryptography, and operating systems", "weight_dimension": "computing", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "CRISPR gene editing, personalized oncology therapeutics, and organ regeneration", "weight_dimension": "medicine", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Nuclear fusion reactors, quantum computing hardware, and dark matter detection", "weight_dimension": "pure_sciences", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 8,
            "question_text": "If designing a scientific app, what primary function would you build?",
            "dimension": "project_type",
            "options": [
                {"option_code": "A", "option_text": "A real-time compiler, code debugger, or distributed database engine", "weight_dimension": "computing", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "A structural CAD modeling tool with 3D stress simulation capabilities", "weight_dimension": "engineering", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "A clinical patient drug dosage and interaction safety calculator", "weight_dimension": "allied_health", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "An interactive periodic table simulator tracking electron orbital wavefunctions", "weight_dimension": "pure_sciences", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 9,
            "question_text": "When learning about agricultural and environmental science, what interests you most?",
            "dimension": "bio_applied",
            "options": [
                {"option_code": "A", "option_text": "Veterinary medicine, animal nutrition, and livestock health management", "weight_dimension": "allied_health", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Designing automated drip-irrigation sensors and automated harvesting machinery", "weight_dimension": "engineering", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Soil microbiology, botanical taxonomy, and ecological biochemistry", "weight_dimension": "pure_sciences", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Satellite imagery analytics to predict crop yields and monitor water tables", "weight_dimension": "computing", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 10,
            "question_text": "How do you handle demanding laboratory protocols requiring strict precision?",
            "dimension": "precision_style",
            "options": [
                {"option_code": "A", "option_text": "I excel when following sterile medical protocols and patient care standards", "weight_dimension": "medicine", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "I enjoy precision chemical titration, spectrophotometry, and chromatography testing", "weight_dimension": "allied_health", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "I focus on machining tolerances, circuit electrical grounding, and hardware safety", "weight_dimension": "engineering", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "I write automated test suites and unit tests to catch software edge cases", "weight_dimension": "computing", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 11,
            "question_text": "Which type of scientific publication would you read cover to cover?",
            "dimension": "reading_preference",
            "options": [
                {"option_code": "A", "option_text": "IEEE Transactions on Robotics, Power Grids, and Semiconductor Architecture", "weight_dimension": "engineering", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "ACM Communications on Distributed Systems, Cybersecurity, and Machine Learning", "weight_dimension": "computing", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "New England Journal of Medicine or Lancet articles on clinical trial treatments", "weight_dimension": "medicine", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Nature Physical Sciences on particle physics, cosmology, and synthetic chemistry", "weight_dimension": "pure_sciences", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 12,
            "question_text": "If working in a large institution, what department appeals to you most?",
            "dimension": "institutional_preference",
            "options": [
                {"option_code": "A", "option_text": "A university pure science research department leading fundamental grant studies", "weight_dimension": "pure_sciences", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "A tertiary multi-specialty hospital critical care or surgery wing", "weight_dimension": "medicine", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "A core engineering R&D center testing prototypes and physical durability", "weight_dimension": "engineering", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "A specialized diagnostics laboratory, dialysis unit, or pharmaceutical QC facility", "weight_dimension": "allied_health", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 13,
            "question_text": "What is your perspective on sitting at a workstation writing code for hours?",
            "dimension": "screen_vs_physical",
            "options": [
                {"option_code": "A", "option_text": "I thrive on it—building algorithms and seeing code execute is thrilling", "weight_dimension": "computing", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "I like computing, but I need physical engineering hardware to interface with", "weight_dimension": "engineering", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "I prefer face-to-face patient interactions, clinical rounds, and active care", "weight_dimension": "medicine", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "I prefer working in clinical diagnostic labs or conducting experimental bench chemistry", "weight_dimension": "allied_health", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 14,
            "question_text": "Which competitive entrance preparation track feels most aligned with your goals?",
            "dimension": "exam_alignment",
            "options": [
                {"option_code": "A", "option_text": "KCET Engineering / JEE Main focused on Physics, Chemistry, and Mathematics", "weight_dimension": "engineering", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "NEET-UG focused on intensive Biology, Organic Chemistry, and Physics", "weight_dimension": "medicine", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Karnataka B.Pharm / Allied Health CET / Nursing entrance counseling", "weight_dimension": "allied_health", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "IISER IAT / NEST / Central Universities entrance for integrated B.Sc-M.Sc", "weight_dimension": "pure_sciences", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 15,
            "question_text": "Looking ahead 5-7 years, what professional title reflects your vision?",
            "dimension": "long_term_vision",
            "options": [
                {"option_code": "A", "option_text": "Senior Systems Engineer or Hardware/Civil Infrastructure Design Specialist", "weight_dimension": "engineering", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Software Architect, Cloud Security Lead, or Machine Learning Engineer", "weight_dimension": "computing", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Medical Officer, Specialized Physician, or Surgical Consultant", "weight_dimension": "medicine", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Principal Research Scientist or Theoretical Academician", "weight_dimension": "pure_sciences", "weight_score": 3, "display_order": 4},
            ]
        },
    ]
}

# ==============================================================================
# 3. PUC COMMERCE
# Dimensions: accounting_ca, finance_banking, business_management, corporate_law
# ==============================================================================
PUC_COMMERCE_V2 = {
    "id": "puc-commerce-direction-v2",
    "title": "PUC Commerce Professional Direction Assessment",
    "description": "Tailored assessment for 1st and 2nd Year PUC Commerce students evaluating orientation toward chartered accountancy & auditing, investment banking & finance, corporate management, and corporate business law.",
    "category": "career_aptitude",
    "target_level": "PUC",
    "target_stream": "Commerce",
    "assessment_version": "v2",
    "scoring_version": "rule-v2-puc-commerce",
    "questions": [
        {
            "display_order": 1,
            "question_text": "Which part of your Accountancy and Business Studies syllabus do you enjoy the most?",
            "dimension": "core_affinity",
            "options": [
                {"option_code": "A", "option_text": "Preparing balance sheets, ledger journal entries, and reconciliation statements", "weight_dimension": "accounting_ca", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Understanding capital markets, compound interest yields, and stock shares", "weight_dimension": "finance_banking", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Principles of management, marketing strategies, and team organization", "weight_dimension": "business_management", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Company law provisions, statutory business contracts, and partner agreements", "weight_dimension": "corporate_law", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 2,
            "question_text": "When reviewing an annual financial report of a company, what grabs your attention?",
            "dimension": "analytical_focus",
            "options": [
                {"option_code": "A", "option_text": "The auditor's report, notes on accounts, and statutory tax compliance", "weight_dimension": "accounting_ca", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Debt-to-equity ratios, profit margins, and dividend payout trajectories", "weight_dimension": "finance_banking", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Expansion into new retail markets, brand positioning, and supply chain efficiency", "weight_dimension": "business_management", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Regulatory filings with SEBI, intellectual property disclosures, and litigation risks", "weight_dimension": "corporate_law", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 3,
            "question_text": "If a retail business is losing money every month, how would you diagnose the problem?",
            "dimension": "business_diagnosis",
            "options": [
                {"option_code": "A", "option_text": "Audit supplier invoices, inventory write-offs, and verify double-entry books", "weight_dimension": "accounting_ca", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Restructure loan interest rates, calculate working capital, and renegotiate debts", "weight_dimension": "finance_banking", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Re-evaluate customer service, staff motivation, and product pricing models", "weight_dimension": "business_management", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Review supplier delivery agreements, lease contracts, and legal penalties", "weight_dimension": "corporate_law", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 4,
            "question_text": "What type of professional exam pathway interests you the most after 2nd PUC?",
            "dimension": "credential_preference",
            "options": [
                {"option_code": "A", "option_text": "CA Foundation (ICAI) or CMA Foundation leading to statutory auditing", "weight_dimension": "accounting_ca", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Chartered Financial Analyst (CFA) or banking recruitment competitive exams", "weight_dimension": "finance_banking", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "BBA / IPMAT leading to MBA programs in leadership and marketing", "weight_dimension": "business_management", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "CS Executive (ICSI) or 5-Year B.Com LL.B leading to corporate legal advisory", "weight_dimension": "corporate_law", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 5,
            "question_text": "How do you feel about working with tax laws and government revenue notifications?",
            "dimension": "tax_and_compliance",
            "options": [
                {"option_code": "A", "option_text": "I enjoy computing GST inputs, income tax slabs, and filing statutory returns", "weight_dimension": "accounting_ca", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "I am interested in how corporate tax incentives influence cross-border investments", "weight_dimension": "finance_banking", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "I analyze how tax policy affects business operating costs and retail consumer prices", "weight_dimension": "business_management", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "I enjoy interpreting tax dispute rulings, tribunal decisions, and appellate law", "weight_dimension": "corporate_law", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 6,
            "question_text": "Which news headline would you click on first in a business newspaper?",
            "dimension": "reading_interest",
            "options": [
                {"option_code": "A", "option_text": "'Reserve Bank of India modifies repo rate to curb inflation and bank liquidity'", "weight_dimension": "finance_banking", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "'Supreme Court issues landmark ruling on corporate insolvency and bankruptcy code'", "weight_dimension": "corporate_law", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "'Institute of Chartered Accountants issues stricter accounting guidelines on revenue'", "weight_dimension": "accounting_ca", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "'Fast-growing Indian consumer startup expands operations to 50 tier-2 cities'", "weight_dimension": "business_management", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 7,
            "question_text": "In a group project simulating a new business launch, what is your chosen responsibility?",
            "dimension": "project_role",
            "options": [
                {"option_code": "A", "option_text": "Setting up the accounting software, chart of accounts, and ledger records", "weight_dimension": "accounting_ca", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Valuing the company equity, preparing investor pitch decks, and forecasting ROI", "weight_dimension": "finance_banking", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Managing operations, assigning member responsibilities, and ensuring deadlines", "weight_dimension": "business_management", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Drafting partnership terms, trademark protections, and non-disclosure agreements", "weight_dimension": "corporate_law", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 8,
            "question_text": "What type of problem solving gives you the most confidence?",
            "dimension": "problem_style",
            "options": [
                {"option_code": "A", "option_text": "Finding a missing debit entry of ₹500 that balances a ₹5 crore ledger perfectly", "weight_dimension": "accounting_ca", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Analyzing bond yields and stock market trends to protect an investment fund", "weight_dimension": "finance_banking", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Resolving customer dissatisfaction and negotiating terms with disgruntled vendors", "weight_dimension": "business_management", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Spotting an ambiguous clause in a commercial contract before signing", "weight_dimension": "corporate_law", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 9,
            "question_text": "How do you view the role of ethics in commerce?",
            "dimension": "ethics_and_governance",
            "options": [
                {"option_code": "A", "option_text": "Essential—auditors must maintain complete independence and zero fraud tolerance", "weight_dimension": "accounting_ca", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Essential—protecting retail investors from deceptive financial insider trading", "weight_dimension": "finance_banking", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Essential—ensuring fair labor practices, customer honesty, and environmental care", "weight_dimension": "business_management", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Essential—governed through strict adherence to statutory corporate legal charters", "weight_dimension": "corporate_law", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 10,
            "question_text": "If you had capital to invest, what strategy would you adopt?",
            "dimension": "investment_philosophy",
            "options": [
                {"option_code": "A", "option_text": "Diversify across mutual funds, debt securities, and high-yield dividend stocks", "weight_dimension": "finance_banking", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Invest in a physical franchise business that I can manage and scale operationally", "weight_dimension": "business_management", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Conduct deep forensic audits of company balance sheets before buying any shares", "weight_dimension": "accounting_ca", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Invest in ventures with strong patent rights and compliant regulatory structures", "weight_dimension": "corporate_law", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 11,
            "question_text": "Which software tools do you find most appealing to master?",
            "dimension": "tools_proficiency",
            "options": [
                {"option_code": "A", "option_text": "Advanced Tally Prime, Zoho Books, and taxation return filing software", "weight_dimension": "accounting_ca", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Financial modeling in Excel with macros, DCF valuations, and Bloomberg terminals", "weight_dimension": "finance_banking", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Enterprise Resource Planning (ERP) systems, CRM portals, and project kanbans", "weight_dimension": "business_management", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Legal research databases (Manupatra, SCC Online) and contract drafting suites", "weight_dimension": "corporate_law", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 12,
            "question_text": "How do you handle negotiations where high stakes are involved?",
            "dimension": "negotiation_style",
            "options": [
                {"option_code": "A", "option_text": "I rely on precise numbers, audited receipts, and verifiable financial proof", "weight_dimension": "accounting_ca", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "I calculate risk premiums, discounting rates, and present trade-off equations", "weight_dimension": "finance_banking", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "I focus on interpersonal rapport, win-win compromises, and team morale", "weight_dimension": "business_management", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "I scrutinize statutory liabilities, indemnities, and protective covenants", "weight_dimension": "corporate_law", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 13,
            "question_text": "Which international topic do you find most relevant to your future career?",
            "dimension": "global_outlook",
            "options": [
                {"option_code": "A", "option_text": "International Financial Reporting Standards (IFRS) and global accounting audits", "weight_dimension": "accounting_ca", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Global foreign exchange fluctuations, sovereign debt, and international banking", "weight_dimension": "finance_banking", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Multinational supply chain networks, logistics hubs, and overseas market entry", "weight_dimension": "business_management", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Cross-border trade agreements, WTO tariffs, and international arbitration treaties", "weight_dimension": "corporate_law", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 14,
            "question_text": "In a corporate dispute between directors, what should be the primary arbiter?",
            "dimension": "governance_attitude",
            "options": [
                {"option_code": "A", "option_text": "The Articles of Association, Companies Act statutory provisions, and board minutes", "weight_dimension": "corporate_law", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "An independent forensic audit to confirm financial transparency and cash flows", "weight_dimension": "accounting_ca", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Protecting enterprise valuation and share price stability for shareholders", "weight_dimension": "finance_banking", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Restoring organizational harmony and setting clear operational boundaries", "weight_dimension": "business_management", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 15,
            "question_text": "When you imagine yourself at age 25, which professional accomplishment appeals most?",
            "dimension": "long_term_vision",
            "options": [
                {"option_code": "A", "option_text": "Passing the CA Final examination and signing off as a qualified statutory auditor", "weight_dimension": "accounting_ca", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Managing an investment portfolio or serving as a financial analyst in banking", "weight_dimension": "finance_banking", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Running a high-performing department or scaling a fast-growing business venture", "weight_dimension": "business_management", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Advising corporate boards on regulatory compliance and high-value mergers", "weight_dimension": "corporate_law", "weight_score": 3, "display_order": 4},
            ]
        },
    ]
}

# ==============================================================================
# 4. PUC ARTS
# Dimensions: law_judiciary, design_arts, media_journalism, humanities_social
# ==============================================================================
PUC_ARTS_V2 = {
    "id": "puc-arts-direction-v2",
    "title": "PUC Arts & Humanities Career Direction Assessment",
    "description": "Comprehensive assessment for 1st and 2nd Year PUC Arts students evaluating aptitude across legal advocacy & judiciary, visual arts & communication design, investigative media & journalism, and social humanities & civil administration.",
    "category": "career_aptitude",
    "target_level": "PUC",
    "target_stream": "Arts",
    "assessment_version": "v2",
    "scoring_version": "rule-v2-puc-arts",
    "questions": [
        {
            "display_order": 1,
            "question_text": "Which topic in your Humanities curriculum excites your analytical mind the most?",
            "dimension": "core_affinity",
            "options": [
                {"option_code": "A", "option_text": "Fundamental rights, constitutional jurisprudence, and legal landmark trials", "weight_dimension": "law_judiciary", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Visual aesthetics, digital typography, architectural design, and iconography", "weight_dimension": "design_arts", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Press freedom, investigative reporting, broadcasting, and public communication", "weight_dimension": "media_journalism", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Social stratification, rural development policies, and community welfare programs", "weight_dimension": "humanities_social", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 2,
            "question_text": "When a major public controversy occurs, how do you instinctively respond?",
            "dimension": "analytical_response",
            "options": [
                {"option_code": "A", "option_text": "Analyze which statutory laws, constitutional safeguards, or court orders apply", "weight_dimension": "law_judiciary", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Investigate witness accounts, fact-check rumors, and draft an objective report", "weight_dimension": "media_journalism", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Examine how socioeconomic background and historical inequality caused the issue", "weight_dimension": "humanities_social", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Create an impactful visual illustration, infographic, or documentary poster", "weight_dimension": "design_arts", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 3,
            "question_text": "In a university campus festival, what department would you want to lead?",
            "dimension": "creative_leadership",
            "options": [
                {"option_code": "A", "option_text": "The Parliamentary Debate, Moot Court, or Legal Disputation Forum", "weight_dimension": "law_judiciary", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "The Visual Branding, Stage Scenography, and Promotional Graphic Design Team", "weight_dimension": "design_arts", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "The Student Media Cell, Festival Newspaper, and Podcast Broadcasting Studio", "weight_dimension": "media_journalism", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "The Community Outreach, Rural School Workshop, and Social Impact Committee", "weight_dimension": "humanities_social", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 4,
            "question_text": "Which entrance examination or higher education goal appeals most to you?",
            "dimension": "degree_path",
            "options": [
                {"option_code": "A", "option_text": "CLAT / AILET for 5-year integrated B.A. LL.B programs in National Law Universities", "weight_dimension": "law_judiciary", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "UCEED / NID DAT / NIFT for Bachelor of Design (B.Des) programs", "weight_dimension": "design_arts", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Journalism & Mass Communication (BAJMC) in leading media institutions", "weight_dimension": "media_journalism", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "B.A. (Honours) / BSW leading towards Civil Services (UPSC/KPSC) or Social Work", "weight_dimension": "humanities_social", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 5,
            "question_text": "What type of writing do you find most natural and rewarding?",
            "dimension": "writing_style",
            "options": [
                {"option_code": "A", "option_text": "Structured arguments with cited evidence, legal provisions, and rebuttal logic", "weight_dimension": "law_judiciary", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Compelling headlines, investigative interview stories, and fast-paced journalism", "weight_dimension": "media_journalism", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "In-depth sociological essays analyzing historical change and cultural narratives", "weight_dimension": "humanities_social", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Visual storytelling briefs, mood boards, design rationale, and script outlines", "weight_dimension": "design_arts", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 6,
            "question_text": "How do you evaluate digital social media platforms?",
            "dimension": "media_critique",
            "options": [
                {"option_code": "A", "option_text": "As powerful broadcasting channels that require rigorous journalistic ethics", "weight_dimension": "media_journalism", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "As spaces of visual culture, user interface design, and multimedia creativity", "weight_dimension": "design_arts", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "As legal zones where digital privacy rights and free speech boundaries clash", "weight_dimension": "law_judiciary", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "As sociological phenomena reshaping youth psychology, community bonds, and elections", "weight_dimension": "humanities_social", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 7,
            "question_text": "When visiting a museum or art gallery, what keeps you captivated?",
            "dimension": "cultural_affinity",
            "options": [
                {"option_code": "A", "option_text": "The evolution of painting styles, sculpture materials, and color harmonies", "weight_dimension": "design_arts", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "How ancient legal treaties, edicts, and governing charters maintained public order", "weight_dimension": "law_judiciary", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "The daily lived experiences, traditions, and struggles of ordinary working people", "weight_dimension": "humanities_social", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "The historical printing presses, wartime newspapers, and propaganda posters", "weight_dimension": "media_journalism", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 8,
            "question_text": "If you were working with a non-profit organization, what would be your focus?",
            "dimension": "impact_approach",
            "options": [
                {"option_code": "A", "option_text": "Conducting grassroots community surveys and organizing rural health camps", "weight_dimension": "humanities_social", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Filing public interest litigations (PIL) to protect environmental and human rights", "weight_dimension": "law_judiciary", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Producing video documentaries and managing press conferences to raise awareness", "weight_dimension": "media_journalism", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Designing engaging brand identity campaigns and awareness posters", "weight_dimension": "design_arts", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 9,
            "question_text": "Which skill set would you most eagerly practice for 20 hours a week?",
            "dimension": "skill_investment",
            "options": [
                {"option_code": "A", "option_text": "Legal case briefing, statutory research, and persuasive courtroom oral advocacy", "weight_dimension": "law_judiciary", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Graphic tablets, Figma UI/UX prototyping, 3D blender modeling, and sketching", "weight_dimension": "design_arts", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Camera operating techniques, video timeline editing, and live audio interviewing", "weight_dimension": "media_journalism", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Policy research papers, demographic analysis, and qualitative sociological fieldwork", "weight_dimension": "humanities_social", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 10,
            "question_text": "When you observe urban infrastructure in a city, what bothers you most?",
            "dimension": "social_critique",
            "options": [
                {"option_code": "A", "option_text": "Poor visual aesthetic coherence, ugly signboards, and lack of green public spaces", "weight_dimension": "design_arts", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Lack of civic enforcement, violation of municipal bylaws, and corruption in contracts", "weight_dimension": "law_judiciary", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Social displacement of vulnerable communities and poor access to government schools", "weight_dimension": "humanities_social", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Lack of independent investigative reporting holding civic authorities accountable", "weight_dimension": "media_journalism", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 11,
            "question_text": "How do you prefer to spend your reading time?",
            "dimension": "intellectual_diet",
            "options": [
                {"option_code": "A", "option_text": "Judicial biographies, constitutional commentaries, and famous legal arguments", "weight_dimension": "law_judiciary", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Visual design annuals, typography guides, and contemporary art retrospectives", "weight_dimension": "design_arts", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Investigative non-fiction books on political exposés and international reporting", "weight_dimension": "media_journalism", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Anthropological studies, historical analyses, and public policy whitepapers", "weight_dimension": "humanities_social", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 12,
            "question_text": "What type of workplace setting would energize you every morning?",
            "dimension": "workplace_preference",
            "options": [
                {"option_code": "A", "option_text": "A busy High Court chamber or corporate law firm surrounded by legal archives", "weight_dimension": "law_judiciary", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "A collaborative design studio with digital drawing displays and prototyping tools", "weight_dimension": "design_arts", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "A bustling newsroom with breaking news monitors, cameras, and audio edit suites", "weight_dimension": "media_journalism", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "A government administrative office or community field center driving public policy", "weight_dimension": "humanities_social", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 13,
            "question_text": "If invited to participate in a statewide seminar, which panel would you join?",
            "dimension": "scholarly_interest",
            "options": [
                {"option_code": "A", "option_text": "'Evolving Dimensions of Privacy and Judicial Activism in Modern India'", "weight_dimension": "law_judiciary", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "'Ethical Digital Journalism in the Era of Algorithmic Information Feeds'", "weight_dimension": "media_journalism", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "'Designing Inclusive Public Environments: Accessibility, Graphics, and Culture'", "weight_dimension": "design_arts", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "'Eradicating Multidimensional Poverty through Decentralized Panchayat Governance'", "weight_dimension": "humanities_social", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 14,
            "question_text": "How do you handle complex ethical dilemmas involving conflicting duties?",
            "dimension": "ethical_style",
            "options": [
                {"option_code": "A", "option_text": "I rely on statutory legal doctrines, due process, and codified natural justice", "weight_dimension": "law_judiciary", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "I prioritize truth-telling, transparent disclosure, and the public's right to know", "weight_dimension": "media_journalism", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "I focus on empathy, reducing human suffering, and protecting community dignity", "weight_dimension": "humanities_social", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "I seek creative, human-centered solutions that honor cultural integrity", "weight_dimension": "design_arts", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 15,
            "question_text": "Which career aspiration resonates most with your values by age 26?",
            "dimension": "long_term_vision",
            "options": [
                {"option_code": "A", "option_text": "Advocate arguing before the High Court or entering Judicial Services", "weight_dimension": "law_judiciary", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Senior Product Designer or Creative Art Director leading digital design", "weight_dimension": "design_arts", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Special Correspondent, Investigative Reporter, or Digital Media Editor", "weight_dimension": "media_journalism", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Civil Services Officer (IAS/KAS) or Senior Program Specialist in Social Policy", "weight_dimension": "humanities_social", "weight_score": 3, "display_order": 4},
            ]
        },
    ]
}

# ==============================================================================
# 5. POLYTECHNIC DIPLOMA
# Dimensions: dcet_lateral_engineering, software_digital, core_industrial, industry_employment
# ==============================================================================
DIPLOMA_V2 = {
    "id": "diploma-direction-v2",
    "title": "Polytechnic Diploma Career & Progression Assessment",
    "description": "Tailored career orientation assessment for Karnataka Polytechnic Diploma students evaluating direction between B.E/B.Tech lateral degree entry (DCET), software technology, core industrial engineering, and immediate supervisory employment.",
    "category": "career_aptitude",
    "target_level": "Diploma",
    "target_stream": None,
    "assessment_version": "v2",
    "scoring_version": "rule-v2-diploma",
    "questions": [
        {
            "display_order": 1,
            "question_text": "What is your primary milestone priority upon completing your 3-year diploma?",
            "dimension": "primary_milestone",
            "options": [
                {"option_code": "A", "option_text": "Crack DCET with high rank to secure 2nd-year lateral entry into a top B.E/B.Tech college", "weight_dimension": "dcet_lateral_engineering", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Specializing in full-stack web programming, cloud networking, and IT development", "weight_dimension": "software_digital", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Working with mechanical CAD/CAM tools, structural civil design, or industrial hydraulics", "weight_dimension": "core_industrial", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Joining a manufacturing plant or infrastructure site as a Junior Engineer / Supervisor", "weight_dimension": "industry_employment", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 2,
            "question_text": "In your diploma practical laboratory workshops, where do you spend the most energy?",
            "dimension": "lab_engagement",
            "options": [
                {"option_code": "A", "option_text": "Mastering applied engineering mathematics and circuit/mechanics calculation formulas", "weight_dimension": "dcet_lateral_engineering", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Writing code in Python/C++, configuring Linux servers, and troubleshooting database queries", "weight_dimension": "software_digital", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Operating CNC machines, testing concrete tensile strength, or tuning electrical switchboards", "weight_dimension": "core_industrial", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Learning workshop equipment maintenance logs, production scheduling, and shift safety checklists", "weight_dimension": "industry_employment", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 3,
            "question_text": "How do you feel about preparing for the DCET (Diploma CET) examination?",
            "dimension": "dcet_drive",
            "options": [
                {"option_code": "A", "option_text": "Highly motivated—I am determined to get a B.Tech degree and engineering status", "weight_dimension": "dcet_lateral_engineering", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Interested if it allows me to transition into Computer Science / Artificial Intelligence B.E.", "weight_dimension": "software_digital", "weight_score": 2, "display_order": 2},
                {"option_code": "C", "option_text": "Interested only if it enhances my design and specialized core engineering capabilities", "weight_dimension": "core_industrial", "weight_score": 2, "display_order": 3},
                {"option_code": "D", "option_text": "I prefer starting my professional career in industry immediately after diploma", "weight_dimension": "industry_employment", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 4,
            "question_text": "When you solve technical problems, what tool do you reach for first?",
            "dimension": "tool_preference",
            "options": [
                {"option_code": "A", "option_text": "Visual Studio Code, GitHub, and software terminal command lines", "weight_dimension": "software_digital", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "SolidWorks / AutoCAD 3D modelling and technical drafting templates", "weight_dimension": "core_industrial", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Advanced engineering mathematics handbooks, formula sheets, and derivations", "weight_dimension": "dcet_lateral_engineering", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Multimeters, torque wrenches, inspection calipers, and physical diagnostic meters", "weight_dimension": "industry_employment", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 5,
            "question_text": "What type of final-year diploma polytechnic project would you propose?",
            "dimension": "capstone_preference",
            "options": [
                {"option_code": "A", "option_text": "A full-stack IoT cloud dashboard monitoring factory sensor data in real time", "weight_dimension": "software_digital", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "A scaled prototype of an automated pneumatic sorting arm or hydraulic mechanism", "weight_dimension": "core_industrial", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "A mathematically validated engineering simulation comparing structural stress distributions", "weight_dimension": "dcet_lateral_engineering", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "An industrial shop-floor safety audit and preventive maintenance scheduling system", "weight_dimension": "industry_employment", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 6,
            "question_text": "How do you rate your desire for immediate financial independence?",
            "dimension": "employment_readiness",
            "options": [
                {"option_code": "A", "option_text": "High—I want to secure campus placement as a Diploma Trainee Engineer right away", "weight_dimension": "industry_employment", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Moderate—I will work in software/tech if paid well, or freelance while studying", "weight_dimension": "software_digital", "weight_score": 2, "display_order": 2},
                {"option_code": "C", "option_text": "Lower—my primary focus is completing 3 more years of degree engineering via DCET", "weight_dimension": "dcet_lateral_engineering", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Moderate—I want core manufacturing industry experience before considering higher studies", "weight_dimension": "core_industrial", "weight_score": 2, "display_order": 4},
            ]
        },
        {
            "display_order": 7,
            "question_text": "Which technical topic do you find most interesting to master during holidays?",
            "dimension": "self_learning",
            "options": [
                {"option_code": "A", "option_text": "DCET engineering mathematics, applied physics, and mechanics problem sets", "weight_dimension": "dcet_lateral_engineering", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Web development (React, Node.js), API design, and cybersecurity fundamentals", "weight_dimension": "software_digital", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "PLC ladder logic, robotics controller programming, and hydraulic schematics", "weight_dimension": "core_industrial", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "ISO industrial quality standards, Six Sigma basics, and plant production management", "weight_dimension": "industry_employment", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 8,
            "question_text": "If visiting a major automobile or aerospace manufacturing plant in Bengaluru, what stands out?",
            "dimension": "industrial_observation",
            "options": [
                {"option_code": "A", "option_text": "The computer control room monitoring automated assembly robots via enterprise networks", "weight_dimension": "software_digital", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "The massive stamping presses, precision welding fixtures, and CAD design specs", "weight_dimension": "core_industrial", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "The theoretical thermodynamic and structural stress calculations behind the engine design", "weight_dimension": "dcet_lateral_engineering", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "The shift supervisors coordinating technicians, managing output quotas, and safety", "weight_dimension": "industry_employment", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 9,
            "question_text": "How do you handle technical blueprints and electrical wiring diagrams?",
            "dimension": "schematic_aptitude",
            "options": [
                {"option_code": "A", "option_text": "I read orthographic projections, isometric views, and tolerancing symbols with ease", "weight_dimension": "core_industrial", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "I prefer software architecture diagrams, entity-relationship models, and data flows", "weight_dimension": "software_digital", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "I use schematics to guide direct equipment wiring, panel mounting, and commissioning", "weight_dimension": "industry_employment", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "I analyze the mathematical equations and physical laws that determine schematic component ratings", "weight_dimension": "dcet_lateral_engineering", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 10,
            "question_text": "What type of job title sounds most fulfilling for your first career appointment?",
            "dimension": "entry_role",
            "options": [
                {"option_code": "A", "option_text": "Graduate Engineer Trainee (after completing B.E. via DCET lateral entry)", "weight_dimension": "dcet_lateral_engineering", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Junior Software Developer or IT Systems Associate", "weight_dimension": "software_digital", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "CAD/CAM Design Engineer or Core Production Technical Specialist", "weight_dimension": "core_industrial", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Junior Site Engineer, Plant Supervisor, or Operations Maintenance Lead", "weight_dimension": "industry_employment", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 11,
            "question_text": "How comfortable are you with advanced mathematical calculus and engineering theory?",
            "dimension": "math_tolerance",
            "options": [
                {"option_code": "A", "option_text": "Very comfortable—I enjoy higher mathematics and want to study advanced engineering", "weight_dimension": "dcet_lateral_engineering", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "I prefer discrete logic, algorithmic mathematics, and computational thinking", "weight_dimension": "software_digital", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "I prefer practical engineering calculations that apply directly to machine design", "weight_dimension": "core_industrial", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "I prefer hands-on shop-floor problem solving over heavy theoretical derivations", "weight_dimension": "industry_employment", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 12,
            "question_text": "When a physical machine or industrial circuit malfunctions, what is your reaction?",
            "dimension": "troubleshooting_approach",
            "options": [
                {"option_code": "A", "option_text": "Trace the electrical/mechanical signal physically using diagnostic tools until fixed", "weight_dimension": "industry_employment", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Diagnose whether the machine firmware or sensor software has bugs in code", "weight_dimension": "software_digital", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Analyze the mechanical stress or component wear limits using material engineering principles", "weight_dimension": "core_industrial", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Research the underlying physics and write a comprehensive engineering failure report", "weight_dimension": "dcet_lateral_engineering", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 13,
            "question_text": "What is your perspective on industrial workplace safety protocols?",
            "dimension": "safety_and_standards",
            "options": [
                {"option_code": "A", "option_text": "Non-negotiable—maintaining zero accidents on the shop floor is a supervisor's top duty", "weight_dimension": "industry_employment", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Crucial—structural safety factors must be built directly into the CAD engineering specs", "weight_dimension": "core_industrial", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Crucial—automated interlocks and sensor safety routines must be coded into software", "weight_dimension": "software_digital", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Crucial—safety regulations are grounded in rigorous mathematical structural analysis", "weight_dimension": "dcet_lateral_engineering", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 14,
            "question_text": "Which career progression model matches your personal ambition?",
            "dimension": "career_trajectory",
            "options": [
                {"option_code": "A", "option_text": "Diploma -> DCET Rank -> B.E. Degree -> Senior Technical Project Manager", "weight_dimension": "dcet_lateral_engineering", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Diploma -> IT Certification / B.Tech Evening -> Lead Software Engineer", "weight_dimension": "software_digital", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Diploma -> Specialized CAD/Robotics Certifications -> Principal Tooling Designer", "weight_dimension": "core_industrial", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Diploma -> Industry Junior Engineer -> Senior Plant Operations Manager", "weight_dimension": "industry_employment", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 15,
            "question_text": "If given the opportunity to lead a technical team tomorrow, which team would you choose?",
            "dimension": "leadership_preference",
            "options": [
                {"option_code": "A", "option_text": "An engineering design cell calculating structural blueprints for an upcoming B.E. symposium", "weight_dimension": "dcet_lateral_engineering", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "A digital dev team deploying a cloud mobile app for technical inventory tracking", "weight_dimension": "software_digital", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "A manufacturing team calibrating 5-axis CNC machining tools for automotive parts", "weight_dimension": "core_industrial", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "A plant maintenance team commissioning electrical distribution switchgear on site", "weight_dimension": "industry_employment", "weight_score": 3, "display_order": 4},
            ]
        },
    ]
}

# ==============================================================================
# 6. ITI VOCATIONAL TRADES
# Dimensions: apprenticeship_industry, energy_electrical, mechanical_machining, diploma_lateral
# ==============================================================================
ITI_V2 = {
    "id": "iti-direction-v2",
    "title": "ITI Trade Progression & Apprenticeship Assessment",
    "description": "Specialized vocational assessment for Karnataka ITI trainees evaluating aptitude across NAPS public/private industrial apprenticeships, electrical & solar energy installations, mechanical CNC machining, and lateral entry into Polytechnic Diploma.",
    "category": "career_aptitude",
    "target_level": "ITI",
    "target_stream": None,
    "assessment_version": "v2",
    "scoring_version": "rule-v2-iti",
    "questions": [
        {
            "display_order": 1,
            "question_text": "What is your main ambition upon completing your ITI trade certificate?",
            "dimension": "primary_ambition",
            "options": [
                {"option_code": "A", "option_text": "Secure a paid National Apprenticeship (NAPS) in Indian Railways, BHEL, or HAL", "weight_dimension": "apprenticeship_industry", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Work with industrial electrical panels, solar power plants, and building switchgear", "weight_dimension": "energy_electrical", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Operate high-precision CNC lathe milling machines, welding rigs, and fabrication tools", "weight_dimension": "mechanical_machining", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Take lateral entry into the 2nd year of Polytechnic Diploma to earn an engineering diploma", "weight_dimension": "diploma_lateral", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 2,
            "question_text": "In the workshop practical sessions, which tool do you handle with the greatest confidence?",
            "dimension": "tool_mastery",
            "options": [
                {"option_code": "A", "option_text": "Digital multimeters, megger insulation testers, wire strippers, and crimping tools", "weight_dimension": "energy_electrical", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Vernier calipers, micrometers, dial gauges, and metal lathe cutting tools", "weight_dimension": "mechanical_machining", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Industrial safety gear, pneumatic wrench sets, and assembly line overhaul rigs", "weight_dimension": "apprenticeship_industry", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Technical drafting boards, geometric calipers, and engineering formula tables", "weight_dimension": "diploma_lateral", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 3,
            "question_text": "How do you feel about continuing your education into a 3-year Polytechnic Diploma?",
            "dimension": "further_education",
            "options": [
                {"option_code": "A", "option_text": "Very interested—I want to upgrade from an ITI trade certificate to a Diploma Engineer", "weight_dimension": "diploma_lateral", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "I prefer entering industry immediately through an official apprentice contract", "weight_dimension": "apprenticeship_industry", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "I prefer getting a certified government electrical wireman contractor license", "weight_dimension": "energy_electrical", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "I want to become an expert precision CNC machine programmer in a manufacturing toolroom", "weight_dimension": "mechanical_machining", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 4,
            "question_text": "When installing a rooftop solar energy system, what task would you enjoy most?",
            "dimension": "solar_energy",
            "options": [
                {"option_code": "A", "option_text": "Connecting the solar photovoltaic DC cables, charge controllers, and battery inverters", "weight_dimension": "energy_electrical", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Fabricating and bolting the galvanized steel mounting frames to withstand high winds", "weight_dimension": "mechanical_machining", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Conducting statutory safety testing under the chief electrical inspectorate guidelines", "weight_dimension": "apprenticeship_industry", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Calculating total kilowatt-hour electrical yield and designing line-loss schematics", "weight_dimension": "diploma_lateral", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 5,
            "question_text": "How do you maintain high accuracy when machining or cutting a metal piece?",
            "dimension": "precision_mindset",
            "options": [
                {"option_code": "A", "option_text": "Carefully check tolerances down to 0.02 mm using precision micrometer gauges", "weight_dimension": "mechanical_machining", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Ensure electrical spindle voltage and RPM motors are calibrated smoothly", "weight_dimension": "energy_electrical", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Follow standard operating procedures (SOP) established by plant manufacturing standards", "weight_dimension": "apprenticeship_industry", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Understand the engineering mechanics of cutting speed, feed rate, and metallurgy", "weight_dimension": "diploma_lateral", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 6,
            "question_text": "What type of workplace attracts you the most for your daily job?",
            "dimension": "workplace_environment",
            "options": [
                {"option_code": "A", "option_text": "A Public Sector Undertaking (PSU) rail coach workshop or defense aerospace depot", "weight_dimension": "apprenticeship_industry", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "An electrical power distribution substation or green energy installation facility", "weight_dimension": "energy_electrical", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "A modern CNC automotive tooling factory with computer-controlled machining cells", "weight_dimension": "mechanical_machining", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "An engineering polytechnic technical drafting room or testing laboratory", "weight_dimension": "diploma_lateral", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 7,
            "question_text": "When an electrical motor fails to start, what is your first diagnostic step?",
            "dimension": "electrical_troubleshooting",
            "options": [
                {"option_code": "A", "option_text": "Check phase voltages with a multimeter and test motor winding insulation with a megger", "weight_dimension": "energy_electrical", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Inspect the mechanical shaft for bearing seizure, alignment friction, or keyway damage", "weight_dimension": "mechanical_machining", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Log the breakdown ticket in the plant maintenance log and isolate breaker tags (LOTO)", "weight_dimension": "apprenticeship_industry", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Study the electrical schematic to evaluate circuit overload protection calculations", "weight_dimension": "diploma_lateral", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 8,
            "question_text": "How do you prepare for the All India Trade Test (AITT) practical exam?",
            "dimension": "exam_preparation",
            "options": [
                {"option_code": "A", "option_text": "Practicing domestic electrical wiring circuits, conduit bending, and earthing pits", "weight_dimension": "energy_electrical", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Practicing metal filing to accurate 90-degree square fits and thread cutting on lathes", "weight_dimension": "mechanical_machining", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Reviewing industrial apprentice past question papers and safety regulations", "weight_dimension": "apprenticeship_industry", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Studying engineering drawing projections and workshop calculation science formulas", "weight_dimension": "diploma_lateral", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 9,
            "question_text": "Which government initiative are you most interested in registering for?",
            "dimension": "portal_preference",
            "options": [
                {"option_code": "A", "option_text": "National Apprenticeship Promotion Scheme (NAPS) portal for direct industry stipend placement", "weight_dimension": "apprenticeship_industry", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "State Electrical Inspectorate Licensing Examination for authorized electrical supervisor badge", "weight_dimension": "energy_electrical", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "DTE Karnataka Lateral Entry Admission portal into 2nd-year Polytechnic Diploma", "weight_dimension": "diploma_lateral", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Advanced Tool Training Centre (GTTC/ATDC) specialized CNC machine operator program", "weight_dimension": "mechanical_machining", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 10,
            "question_text": "How do you handle technical safety when working with three-phase 440V electricity?",
            "dimension": "high_voltage_safety",
            "options": [
                {"option_code": "A", "option_text": "Use insulated rubber floor mats, rated gloves, lock-out tag-out (LOTO), and verify zero potential", "weight_dimension": "energy_electrical", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Follow strict factory safety protocols audited by the plant safety engineer", "weight_dimension": "apprenticeship_industry", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Ensure electrical control panels have solid metal enclosures with proper earthing bonds", "weight_dimension": "mechanical_machining", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Understand the theoretical short-circuit fault current calculations and fuse breaking capacity", "weight_dimension": "diploma_lateral", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 11,
            "question_text": "What type of technical drawing do you find easiest to visualize in 3D?",
            "dimension": "blueprint_reading",
            "options": [
                {"option_code": "A", "option_text": "Machine component section drawings showing internal bores, threads, and tapers", "weight_dimension": "mechanical_machining", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Single-line electrical distribution diagrams showing transformers and switchboards", "weight_dimension": "energy_electrical", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Industrial assembly layout blueprints showing machine locations on the factory floor", "weight_dimension": "apprenticeship_industry", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Full orthographic engineering projections with detailed tolerancing and dimensions", "weight_dimension": "diploma_lateral", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 12,
            "question_text": "When working with pneumatic or hydraulic systems, what is your chosen responsibility?",
            "dimension": "fluid_power",
            "options": [
                {"option_code": "A", "option_text": "Connecting solenoid valve electrical wiring, pressure sensors, and control relay timers", "weight_dimension": "energy_electrical", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Fitting high-pressure steel pipes, repairing cylinder seals, and mounting valves", "weight_dimension": "mechanical_machining", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Conducting routine hydraulic oil filter replacements and pressure testing on shifts", "weight_dimension": "apprenticeship_industry", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Designing circuit flow rate schematics and calculating actuator force equations", "weight_dimension": "diploma_lateral", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 13,
            "question_text": "How do you feel about working with digital computers in vocational trades?",
            "dimension": "digital_tech",
            "options": [
                {"option_code": "A", "option_text": "I enjoy using computer software (COPA, office database tools, inventory spreadsheets)", "weight_dimension": "diploma_lateral", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "I enjoy writing G-code and M-code programs directly on CNC machine controllers", "weight_dimension": "mechanical_machining", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "I enjoy configuring smart solar inverter apps and digital energy power meters", "weight_dimension": "energy_electrical", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "I use factory attendance and job-card digital portals for apprenticeship work logs", "weight_dimension": "apprenticeship_industry", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 14,
            "question_text": "What is the biggest advantage of completing a National Apprenticeship Certificate (NAC)?",
            "dimension": "nac_advantage",
            "options": [
                {"option_code": "A", "option_text": "It fulfills eligibility criteria for permanent Technician Grade positions in Indian Railways / PSUs", "weight_dimension": "apprenticeship_industry", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "It provides deep practical experience in high-voltage industrial electrical substations", "weight_dimension": "energy_electrical", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "It qualifies me as an experienced machinist capable of operating multi-axis machine centers", "weight_dimension": "mechanical_machining", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "It strengthens my practical foundation before entering 2nd-year Polytechnic Diploma", "weight_dimension": "diploma_lateral", "weight_score": 3, "display_order": 4},
            ]
        },
        {
            "display_order": 15,
            "question_text": "Where do you envision your career 3 years after finishing ITI training?",
            "dimension": "long_term_vision",
            "options": [
                {"option_code": "A", "option_text": "Permanent Technician in a major public sector undertaking (Railway / BHEL / ISRO)", "weight_dimension": "apprenticeship_industry", "weight_score": 3, "display_order": 1},
                {"option_code": "B", "option_text": "Certified Electrical Contractor managing commercial electrical installations", "weight_dimension": "energy_electrical", "weight_score": 3, "display_order": 2},
                {"option_code": "C", "option_text": "Senior CNC Programmer & Machinist in a precision aerospace component supplier", "weight_dimension": "mechanical_machining", "weight_score": 3, "display_order": 3},
                {"option_code": "D", "option_text": "Final-year Polytechnic Diploma student on track to graduate as a Diploma Engineer", "weight_dimension": "diploma_lateral", "weight_score": 3, "display_order": 4},
            ]
        },
    ]
}

ALL_V2_ASSESSMENTS = [
    FOUNDATION_V2,
    PUC_SCIENCE_V2,
    PUC_COMMERCE_V2,
    PUC_ARTS_V2,
    DIPLOMA_V2,
    ITI_V2,
]
