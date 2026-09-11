# Family-specific candidate scopes and dimension configurations for Karnataka student levels

STAGE_CONFIG = {
    "FOUNDATION": {
        "candidate_ids": ["c10-puc", "c10-diploma", "c10-iti"],
        "supported_dimensions": {"science", "commerce", "arts", "diploma", "iti"},
        "dimension_pathway_map": {
            "science": ["c10-puc"],
            "commerce": ["c10-puc"],
            "arts": ["c10-puc"],
            "diploma": ["c10-diploma"],
            "iti": ["c10-iti"],
        },
        "dimension_reasons": {
            "science": [
                "Matches your high interest in coding, engineering, or scientific research.",
                "Aligned with your logical and analytical problem-solving aptitude."
            ],
            "commerce": [
                "Matches your interest in business management, banking, and ledger statistics.",
                "Strong foundation for professional finance pathways like CA."
            ],
            "arts": [
                "Fits your interest in creative communication, humanities, and critical social reading.",
                "Aligned with corporate policy, design, or legal studies."
            ],
            "diploma": [
                "Matches your preference for practical technical design, robotics, and applied projects.",
                "Offers a direct route to lateral entry engineering programs."
            ],
            "iti": [
                "Aligned with hands-on trade skills, solar power, and industrial automation trades.",
                "Focuses on rapid vocational specialization and direct apprenticeship."
            ],
        }
    },
    "PUC_SCIENCE": {
        "candidate_ids": [
            "puc-science-eng",
            "puc-science-comp",
            "puc-science-med",
            "puc-science-allied",
            "puc-science-pharm",
            "puc-science-pure",
            "puc-science-agri",
            "puc-science-vet",
            "puc-science-arch",
            "puc-science-ayush",
            "cross-law",
            "cross-design",
        ],
        "supported_dimensions": {"engineering", "computing", "medicine", "allied_health", "pure_sciences"},
        "dimension_pathway_map": {
            "engineering": ["puc-science-eng", "puc-science-arch"],
            "computing": ["puc-science-comp"],
            "medicine": ["puc-science-med", "puc-science-ayush", "puc-science-vet"],
            "allied_health": ["puc-science-allied", "puc-science-pharm", "puc-science-agri"],
            "pure_sciences": ["puc-science-pure", "cross-law", "cross-design"],
        },
        "dimension_reasons": {
            "engineering": [
                "Aligned with your aptitude for physical mechanisms, structural design, and technology systems.",
                "Opens direct pathways to Karnataka B.E/B.Tech programs via KCET and JEE."
            ],
            "computing": [
                "Strong alignment with algorithms, software architecture, and modern computer applications.",
                "Direct path toward BCA, B.Tech CSE, and artificial intelligence careers."
            ],
            "medicine": [
                "Matches your clinical aptitude for living systems, diagnostics, and patient care.",
                "Prepares for NEET-UG admissions into MBBS, BDS, and AYUSH degree colleges."
            ],
            "allied_health": [
                "Fits your interest in pharmaceutical formulations, clinical diagnostics, and healthcare support.",
                "Strong foundation for B.Pharm, Nursing, and Allied Health Sciences in Karnataka."
            ],
            "pure_sciences": [
                "Aligned with your passion for fundamental research, mathematical proofs, and laboratory inquiry.",
                "Direct route to IISER, B.Sc Honours, and scientific research institutions."
            ],
        }
    },
    "PUC_COMMERCE": {
        "candidate_ids": [
            "puc-commerce-ca",
            "puc-commerce-fin",
            "cross-hospitality",
            "cross-law",
        ],
        "supported_dimensions": {"accounting_ca", "finance_banking", "business_management", "corporate_law"},
        "dimension_pathway_map": {
            "accounting_ca": ["puc-commerce-ca"],
            "finance_banking": ["puc-commerce-fin"],
            "business_management": ["cross-hospitality"],
            "corporate_law": ["cross-law"],
        },
        "dimension_reasons": {
            "accounting_ca": [
                "Exceptional aptitude for double-entry bookkeeping, auditing, and statutory financial compliance.",
                "Direct alignment with ICAI Chartered Accountancy (CA) and CMA programs."
            ],
            "finance_banking": [
                "Strong orientation toward capital markets, investment banking, and macroeconomic analytics.",
                "Prepares for B.Com (Finance), banking certifications, and wealth management."
            ],
            "business_management": [
                "Fits your operational leadership, retail organization, and customer strategy skills.",
                "Direct pathway into BBA / BBM and specialized management disciplines."
            ],
            "corporate_law": [
                "Strong reasoning in commercial contracts, company law, and regulatory compliance.",
                "Seamless progression into 5-year integrated B.Com LL.B or Company Secretary (CS)."
            ],
        }
    },
    "PUC_ARTS": {
        "candidate_ids": [
            "cross-law",
            "cross-design",
            "puc-arts-media",
            "puc-arts-bsw",
            "puc-arts-edu",
        ],
        "supported_dimensions": {"law_judiciary", "design_arts", "media_journalism", "humanities_social"},
        "dimension_pathway_map": {
            "law_judiciary": ["cross-law"],
            "design_arts": ["cross-design"],
            "media_journalism": ["puc-arts-media"],
            "humanities_social": ["puc-arts-bsw", "puc-arts-edu"],
        },
        "dimension_reasons": {
            "law_judiciary": [
                "Exceptional aptitude for legal argument, constitutional safeguards, and statutory analysis.",
                "Direct route into 5-Year Integrated B.A. LL.B via CLAT and Karnataka State Law University."
            ],
            "design_arts": [
                "Strong inclination toward visual aesthetics, user interface design, and multimedia creativity.",
                "Direct pathway to Bachelor of Design (B.Des) programs via UCEED and NID."
            ],
            "media_journalism": [
                "Fits your investigative reporting, digital storytelling, and public communication strengths.",
                "Prepares for BA in Journalism & Mass Communication (BAJMC) and broadcasting careers."
            ],
            "humanities_social": [
                "Aligned with public policy analysis, social welfare systems, and community development.",
                "Strong foundation for Bachelor of Social Work (BSW), Civil Services (UPSC/KPSC), and education."
            ],
        }
    },
    "DIPLOMA": {
        "candidate_ids": [
            "dip-family-comp",
            "dip-family-elec",
            "dip-family-mech",
            "dip-family-civil",
        ],
        "supported_dimensions": {"dcet_lateral_engineering", "software_digital", "core_industrial", "industry_employment"},
        "dimension_pathway_map": {
            "software_digital": ["dip-family-comp"],
            "core_industrial": ["dip-family-mech", "dip-family-civil"],
            "dcet_lateral_engineering": ["dip-family-elec", "dip-family-comp"],
            "industry_employment": ["dip-family-mech", "dip-family-elec"],
        },
        "dimension_reasons": {
            "dcet_lateral_engineering": [
                "Strong drive for higher degree engineering status through DCET competitive lateral entry.",
                "Enables direct admission into 2nd year B.E/B.Tech at Karnataka engineering colleges."
            ],
            "software_digital": [
                "High aptitude for programming, networking protocols, and full-stack software development.",
                "Direct route to computing roles and IT industry technical certifications."
            ],
            "core_industrial": [
                "Focused on mechanical tooling, CAD/CAM precision design, and industrial automation.",
                "Direct progression in automotive, aerospace, and advanced manufacturing sectors."
            ],
            "industry_employment": [
                "Oriented toward hands-on plant supervision, site coordination, and rapid employment.",
                "Prepares for immediate appointment as Junior Engineer or Technical Supervisor."
            ],
        }
    },
    "ITI": {
        "candidate_ids": [
            "iti-family-elec",
            "iti-family-mech",
            "iti-family-comp",
        ],
        "supported_dimensions": {"apprenticeship_industry", "energy_electrical", "mechanical_machining", "diploma_lateral"},
        "dimension_pathway_map": {
            "energy_electrical": ["iti-family-elec"],
            "mechanical_machining": ["iti-family-mech"],
            "apprenticeship_industry": ["iti-family-mech", "iti-family-elec"],
            "diploma_lateral": ["iti-family-comp"],
        },
        "dimension_reasons": {
            "apprenticeship_industry": [
                "Strong orientation toward PSU and Indian Railways paid National Apprenticeships (NAPS).",
                "Direct eligibility for permanent industrial technician recruitment exams."
            ],
            "energy_electrical": [
                "High aptitude for electrical panel wiring, solar power installations, and motor maintenance.",
                "Path to state electrical contractor licensing and energy sector employment."
            ],
            "mechanical_machining": [
                "High precision in lathe tooling, CNC programming, welding, and machine fabrication.",
                "Direct route to specialized machine shop technician roles."
            ],
            "diploma_lateral": [
                "Drive to advance from vocational trade certificate to engineering polytechnic diploma.",
                "Direct eligibility for 2nd-year lateral entry into Karnataka Polytechnic colleges."
            ],
        }
    }
}
