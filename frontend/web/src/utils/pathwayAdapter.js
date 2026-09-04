/**
 * Pathway Data Adapter & Presentation Mapping Utility
 * Supports 3-stage visual graph (Stage 0 Foundation, Stage 1 Main Routes, Stage 2 Streams & Families)
 * and two-step progressive Choice Explorer (Stream -> Combination -> Career Direction).
 */

import { 
  Stethoscope, 
  Sparkles, 
  BookOpen, 
  Briefcase, 
  ShieldCheck, 
  Wrench, 
  Code, 
  GraduationCap,
  Layers,
  Building,
  Scale,
  Palette,
  Coffee,
  HeartHandshake
} from 'lucide-react';

// Mapping table between frontend visual nodes and canonical backend pathway IDs
export const CANONICAL_PATHWAY_MAP = {
  'c10': null, // Structural only, no backend pathway
  'puc': 'c10-puc',
  'diploma': 'c10-diploma',
  'iti': 'c10-iti',
};

export const getCanonicalPathwayId = (id) => {
  if (id === 'c10') return null;
  if (CANONICAL_PATHWAY_MAP[id] !== undefined) {
    return CANONICAL_PATHWAY_MAP[id];
  }
  return id;
};

// Full hierarchy map for breadcrumb trail construction (includes graph nodes AND combination steps)
export const STRUCTURAL_HIERARCHY = {
  'c10-puc': { label: 'Class 10 / SSLC', stage: 'SSLC', parent: null },
  'c10-diploma': { label: 'Class 10 / SSLC', stage: 'SSLC', parent: null },
  'c10-iti': { label: 'Class 10 / SSLC', stage: 'SSLC', parent: null },
  
  'puc-science': { label: 'PUC (11th & 12th)', stage: 'Pre-University', parent: 'c10-puc' },
  'puc-commerce': { label: 'PUC (11th & 12th)', stage: 'Pre-University', parent: 'c10-puc' },
  'puc-arts': { label: 'PUC (11th & 12th)', stage: 'Pre-University', parent: 'c10-puc' },
  
  'puc-science-pcmb': { label: 'Science Stream', stage: 'PUC Combination', parent: 'puc-science' },
  'puc-science-pcmc': { label: 'Science Stream', stage: 'PUC Combination', parent: 'puc-science' },
  'puc-science-pcme': { label: 'Science Stream', stage: 'PUC Combination', parent: 'puc-science' },
  
  'puc-commerce-fin': { label: 'Commerce Stream', stage: 'PUC Combination', parent: 'puc-commerce' },
  'puc-arts-hum': { label: 'Arts & Humanities Stream', stage: 'PUC Combination', parent: 'puc-arts' },
  
  'dip-family-comp': { label: 'Polytechnic Diploma', stage: 'Diploma Family', parent: 'c10-diploma' },
  'dip-family-elec': { label: 'Polytechnic Diploma', stage: 'Diploma Family', parent: 'c10-diploma' },
  'dip-family-mech': { label: 'Polytechnic Diploma', stage: 'Diploma Family', parent: 'c10-diploma' },
  'dip-family-civil': { label: 'Polytechnic Diploma', stage: 'Diploma Family', parent: 'c10-diploma' },
  
  'iti-family-elec': { label: 'ITI Vocational Trades', stage: 'ITI Family', parent: 'c10-iti' },
  'iti-family-mech': { label: 'ITI Vocational Trades', stage: 'ITI Family', parent: 'c10-iti' },
  'iti-family-comp': { label: 'ITI Vocational Trades', stage: 'ITI Family', parent: 'c10-iti' },
};

// Step 1 Choice Mapping: Stream -> Combination Cards
export const STREAM_COMBINATIONS_MAPPING = {
  'puc-science': ['puc-science-pcmb', 'puc-science-pcmc', 'puc-science-pcme'],
  'puc-commerce': ['puc-commerce-fin'],
  'puc-arts': ['puc-arts-hum'],
  'dip-family-comp': ['dip-family-comp'],
  'dip-family-elec': ['dip-family-elec'],
  'dip-family-mech': ['dip-family-mech'],
  'dip-family-civil': ['dip-family-civil'],
  'iti-family-elec': ['iti-family-elec'],
  'iti-family-mech': ['iti-family-mech'],
  'iti-family-comp': ['iti-family-comp']
};

// Step 2 Choice Mapping: Combination -> Specific Career Direction Pathways
export const BRANCH_CHOICE_MAPPING = {
  'puc-science-pcmb': [
    'puc-science-med',
    'puc-science-ayush',
    'puc-science-pure',
    'puc-science-allied',
    'puc-science-pharm',
    'puc-science-agri',
    'puc-science-vet',
    'cross-law',
    'cross-design'
  ],
  'puc-science-pcmc': [
    'puc-science-eng',
    'puc-science-comp',
    'puc-science-arch',
    'puc-science-cse-careers',
    'cross-law',
    'cross-design'
  ],
  'puc-science-pcme': [
    'puc-science-eng',
    'puc-science-comp',
    'cross-design'
  ],
  'puc-commerce-fin': [
    'puc-commerce-fin',
    'puc-commerce-ca',
    'cross-law',
    'cross-design',
    'cross-hospitality'
  ],
  'puc-arts-hum': [
    'puc-arts-hum',
    'puc-arts-media',
    'puc-arts-bsw',
    'puc-arts-edu',
    'cross-law',
    'cross-design',
    'cross-hospitality'
  ],
  'dip-family-comp': ['dip-family-comp'],
  'dip-family-elec': ['dip-family-elec'],
  'dip-family-mech': ['dip-family-mech'],
  'dip-family-civil': ['dip-family-civil'],
  'iti-family-elec': ['iti-family-elec'],
  'iti-family-mech': ['iti-family-mech'],
  'iti-family-comp': ['iti-family-comp']
};

// UI presentation metadata dictionary (icons, short tags, entrance badges, search aliases)
export const PRESENTATION_METADATA = {
  'puc-science-pcmb': {
    icon: Stethoscope,
    shortTag: 'Biology & Math Combination',
    entranceBadge: 'NEET / KCET / Agri / Pharma',
    searchAliases: ['PCMB', 'PCB', 'Medical Stream', 'Biology Stream', 'NEET Prep']
  },
  'puc-science-pcmc': {
    icon: Code,
    shortTag: 'Computer Science Combination',
    entranceBadge: 'KCET / COMEDK / JEE Main',
    searchAliases: ['PCMC', 'Computer Stream', 'Software Stream', 'BCA Prep']
  },
  'puc-science-pcme': {
    icon: Wrench,
    shortTag: 'Electronics Combination',
    entranceBadge: 'KCET / COMEDK Engineering',
    searchAliases: ['PCME', 'Electronics Combination']
  },
  'puc-commerce-fin': {
    icon: Briefcase,
    shortTag: 'Commerce & Finance Track',
    entranceBadge: '2nd PUC Board / ICAI Foundation',
    searchAliases: ['Commerce', 'CEBA', 'SEBA', 'Finance', 'Accounting', 'B.Com']
  },
  'puc-arts-hum': {
    icon: BookOpen,
    shortTag: 'Humanities & Social Sciences',
    entranceBadge: '2nd PUC Arts Board / KSLU / NID',
    searchAliases: ['Arts', 'Humanities', 'HEPS', 'Journalism', 'Social Work']
  },
  'puc-science-med': {
    icon: Stethoscope,
    shortTag: 'Clinical Practice',
    entranceBadge: 'NEET-UG Required',
    searchAliases: ['MBBS', 'BDS', 'Doctor', 'Dentist', 'Clinical', 'Medicine', 'NEET', 'Medical']
  },
  'puc-science-ayush': {
    icon: Sparkles,
    shortTag: 'Indian Medicine Systems',
    entranceBadge: 'NEET / KEA AYUSH',
    searchAliases: ['BAMS', 'BHMS', 'BNYS', 'Ayurveda', 'Homeopathy', 'Naturopathy', 'AYUSH']
  },
  'puc-science-pure': {
    icon: BookOpen,
    shortTag: 'Pure & Research Sciences',
    entranceBadge: '2nd PUC Science Merit',
    searchAliases: ['B.Sc', 'Physics', 'Chemistry', 'Biology', 'Mathematics', 'Biotech', 'Research']
  },
  'puc-science-allied': {
    icon: ShieldCheck,
    shortTag: 'Healthcare Operations',
    entranceBadge: 'KEA Allied Health / Merit',
    searchAliases: ['Nursing', 'BPT', 'Physiotherapy', 'Lab Tech', 'MLT', 'Radiology', 'Optometry']
  },
  'puc-science-pharm': {
    icon: Stethoscope,
    shortTag: 'Pharma & Manufacturing',
    entranceBadge: 'KCET Rank / 2nd PUC',
    searchAliases: ['B.Pharm', 'D.Pharm', 'Pharmacy', 'Pharmacist', 'Drug Design']
  },
  'puc-science-agri': {
    icon: Layers,
    shortTag: 'Agricultural Innovation',
    entranceBadge: 'KCET Agri Practical Rank',
    searchAliases: ['Agriculture', 'Horticulture', 'Forestry', 'Agri Tech', 'Food Tech', 'Agribusiness']
  },
  'puc-science-vet': {
    icon: ShieldCheck,
    shortTag: 'Animal Healthcare',
    entranceBadge: 'KCET Vet Counseling',
    searchAliases: ['B.V.Sc', 'Veterinary', 'Animal Husbandry', 'Vet Doctor']
  },
  'puc-science-eng': {
    icon: Wrench,
    shortTag: 'Engineering & Tech',
    entranceBadge: 'KCET / COMEDK / JEE',
    searchAliases: ['B.E', 'B.Tech', 'Engineering', 'Mechanical', 'Electronics', 'Civil', 'KCET', 'COMEDK']
  },
  'puc-science-comp': {
    icon: Code,
    shortTag: 'Software & Computing',
    entranceBadge: 'Direct Merit / Entrance',
    searchAliases: ['BCA', 'B.Sc CS', 'Computer Applications', 'Software', 'Coding', 'IT', 'Web Dev']
  },
  'puc-science-arch': {
    icon: Building,
    shortTag: 'Spatial Design & Building',
    entranceBadge: 'NATA Entrance Required',
    searchAliases: ['B.Arch', 'Architecture', 'NATA', 'Building Design', 'Cad']
  },
  'puc-science-cse-careers': {
    icon: Code,
    shortTag: 'Advanced AI & Data',
    entranceBadge: 'KCET / B.E Allotment',
    searchAliases: ['CSE', 'AI', 'Artificial Intelligence', 'Data Science', 'Machine Learning', 'Cloud']
  },
  'puc-commerce-ca': {
    icon: GraduationCap,
    shortTag: 'Statutory Audit & Tax',
    entranceBadge: 'ICAI / ICSI Foundation',
    searchAliases: ['CA', 'Chartered Accountant', 'CS', 'Company Secretary', 'CMA', 'Audit', 'Taxation']
  },
  'puc-arts-media': {
    icon: Sparkles,
    shortTag: 'Journalism & Media',
    entranceBadge: 'University Portfolio / Merit',
    searchAliases: ['Journalism', 'Media', 'Mass Communication', 'Broadcasting', 'Digital Content']
  },
  'puc-arts-bsw': {
    icon: HeartHandshake,
    shortTag: 'Social Work & Policy',
    entranceBadge: '2nd PUC Merit',
    searchAliases: ['BSW', 'Social Work', 'Public Policy', 'NGO', 'Community Service']
  },
  'puc-arts-edu': {
    icon: GraduationCap,
    shortTag: 'Teaching & Pedagogy',
    entranceBadge: 'Degree + B.Ed + K-TET',
    searchAliases: ['B.Ed', 'Teaching', 'Teacher', 'K-TET', 'C-TET', 'Education']
  },
  'dip-family-comp': {
    icon: Code,
    shortTag: 'Technical Diploma (CS)',
    entranceBadge: 'DTE Merit Allotment / DCET',
    searchAliases: ['Diploma CS', 'Computer Diploma', 'DCET', 'Polytechnic CS']
  },
  'dip-family-elec': {
    icon: Wrench,
    shortTag: 'Technical Diploma (Elec)',
    entranceBadge: 'DTE Merit Allotment / DCET',
    searchAliases: ['Diploma Electrical', 'ECE Diploma', 'EEE Diploma', 'DCET']
  },
  'dip-family-mech': {
    icon: Wrench,
    shortTag: 'Technical Diploma (Mech)',
    entranceBadge: 'DTE Merit Allotment / DCET',
    searchAliases: ['Diploma Mechanical', 'Automobile Diploma', 'DCET', 'ME-DIP']
  },
  'dip-family-civil': {
    icon: Building,
    shortTag: 'Technical Diploma (Civil)',
    entranceBadge: 'DTE Merit Allotment / DCET',
    searchAliases: ['Diploma Civil', 'Building Diploma', 'Surveying']
  },
  'iti-family-elec': {
    icon: Wrench,
    shortTag: 'Vocational Trade Certificate',
    entranceBadge: 'DET ITI Counseling / AITT',
    searchAliases: ['Electrician', 'ITI Electrician', 'AITT', 'NTC', 'Trade']
  },
  'iti-family-mech': {
    icon: Wrench,
    shortTag: 'Vocational Trade Certificate',
    entranceBadge: 'DET ITI Counseling / AITT',
    searchAliases: ['Fitter', 'Turner', 'Welder', 'ITI Fitter', 'Apprenticeship']
  },
  'iti-family-comp': {
    icon: Code,
    shortTag: 'Vocational Trade Certificate',
    entranceBadge: 'DET ITI Counseling / AITT',
    searchAliases: ['COPA', 'ITI COPA', 'Computer Operator']
  },
  'cross-law': {
    icon: Scale,
    shortTag: 'Legal Practice & Advocacy',
    entranceBadge: 'CLAT / LSAT / KSLU Allotment',
    searchAliases: ['Law', 'LLB', 'BA LLB', 'Advocate', 'Legal', 'CLAT', 'Court']
  },
  'cross-design': {
    icon: Palette,
    shortTag: 'Creative Design & Visual Arts',
    entranceBadge: 'NID / UCEED / Portfolio',
    searchAliases: ['Design', 'B.Des', 'NID', 'UCEED', 'Fine Arts', 'UX Design', 'Graphics']
  },
  'cross-hospitality': {
    icon: Coffee,
    shortTag: 'Hotel & Resort Management',
    entranceBadge: 'NCHMCT JEE / Direct Allotment',
    searchAliases: ['Hospitality', 'Hotel Management', 'BHM', 'Tourism', 'Catering']
  }
};

// Frontend informational overview for structural-only 'c10' node
export const C10_STRUCTURAL_DETAIL = {
  id: 'c10',
  isStructuralOnly: true,
  category: 'STAGE 0 • FOUNDATION',
  title: 'Class 10 / SSLC (Secondary Education)',
  description: 'Secondary School Leaving Certificate (SSLC / Class 10) is the foundational stage for high school students in Karnataka. From here, students can choose to explore 2-Year Pre-University Courses (PUC Academic), 3-Year Polytechnic Engineering Diplomas (DTE Technical), or 1-2 Year ITI Vocational Trades (DET Skill Certification).',
  duration: '10th Foundation',
  options: [
    {
      id: 'opt-puc-overview',
      option_name: '2-Year Pre-University Course (PUC)',
      stream_or_code: 'PUC Academic',
      description: 'Academic pre-university stream under Karnataka DPUE board. Primary route to university degrees in Science, Commerce, and Arts.',
      eligibility: 'Class 10 / SSLC Pass'
    },
    {
      id: 'opt-diploma-overview',
      option_name: '3-Year Polytechnic Diploma (DTE)',
      stream_or_code: 'Polytechnic',
      description: 'Practical technical engineering diploma under Directorate of Technical Education Karnataka. Enables direct 2nd-year B.E lateral entry via DCET.',
      eligibility: 'Class 10 Pass with Min 35% in Science & Math'
    },
    {
      id: 'opt-iti-overview',
      option_name: '1-2 Year ITI Vocational Trades (DET)',
      stream_or_code: 'Vocational ITI',
      description: 'Job-ready vocational trade training under Department of Employment & Training Karnataka. Leads to NTC certification and apprenticeships.',
      eligibility: 'Class 10 / SSLC Pass'
    }
  ],
  milestones: [
    {
      id: 'ms-c10-1',
      step_number: 1,
      title: 'Complete Class 10 / SSLC Examination',
      description: 'Pass the 10th standard board exams conducted by KSEAB / CBSE / ICSE.',
      key_action: 'Obtain SSLC Marks Card & Board Transfer Certificate'
    },
    {
      id: 'ms-c10-2',
      step_number: 2,
      title: 'Choose Post-10th Education Direction',
      description: 'Select between PUC academic streams, Polytechnic engineering diploma, or ITI vocational trade training based on your career interests.',
      key_action: 'Apply for Admissions on DPUE / DTE / DET Counseling Portal'
    }
  ]
};

/**
 * Builds a search index from API pathways and presentation aliases.
 */
export const buildSearchIndex = (apiPathways) => {
  const index = [];

  apiPathways.forEach((pathway) => {
    const meta = PRESENTATION_METADATA[pathway.id] || {};
    const aliases = meta.searchAliases || [];

    // Index main pathway title
    index.push({
      term: pathway.title,
      type: 'pathway',
      pathwayId: pathway.id,
      pathway: pathway,
      subtitle: `${pathway.category} • ${pathway.education_level}`
    });

    // Index presentation aliases
    aliases.forEach((alias) => {
      index.push({
        term: alias,
        type: 'alias',
        pathwayId: pathway.id,
        pathway: pathway,
        subtitle: `Keyword for ${pathway.title}`
      });
    });

    // Index individual option names inside pathway
    if (pathway.options && Array.isArray(pathway.options)) {
      pathway.options.forEach((opt) => {
        index.push({
          term: opt.option_name,
          type: 'option',
          pathwayId: pathway.id,
          option: opt,
          pathway: pathway,
          subtitle: `Option in ${pathway.title}`
        });

        if (opt.stream_or_code) {
          index.push({
            term: opt.stream_or_code,
            type: 'code',
            pathwayId: pathway.id,
            option: opt,
            pathway: pathway,
            subtitle: `Code in ${pathway.title}`
          });
        }
      });
    }

    // Index milestones key actions
    if (pathway.milestones && Array.isArray(pathway.milestones)) {
      pathway.milestones.forEach((ms) => {
        if (ms.key_action) {
          index.push({
            term: ms.key_action,
            type: 'milestone',
            pathwayId: pathway.id,
            pathway: pathway,
            subtitle: `Milestone Action in ${pathway.title}`
          });
        }
      });
    }
  });

  return index;
};

/**
 * Determines default initial structural node ID based on student profile.
 */
export const getInitialNodeFromProfile = (profile) => {
  if (!profile || !profile.current_level) {
    return 'c10'; // Class 10 start
  }

  const cleanLevel = profile.current_level.trim();
  const cleanStream = (profile.stream || '').trim().toLowerCase();

  if (cleanLevel === 'Class 8' || cleanLevel === 'Class 9' || cleanLevel === 'Class 10') {
    return 'c10';
  }

  if (cleanLevel.includes('PUC')) {
    if (cleanStream === 'commerce') return 'puc-commerce';
    if (cleanStream === 'arts') return 'puc-arts';
    return 'puc-science';
  }

  if (cleanLevel.includes('Polytechnic') || cleanLevel.includes('Diploma')) {
    return 'dip-family-comp';
  }

  if (cleanLevel.includes('ITI')) {
    return 'iti-family-elec';
  }

  return 'c10';
};

/**
 * Builds breadcrumb trail from target pathway ID.
 */
export const getBreadcrumbTrail = (targetId, apiPathwaysMap) => {
  const trail = [];
  let currentId = targetId;
  const visited = new Set();

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);

    if (STRUCTURAL_HIERARCHY[currentId]) {
      const struct = STRUCTURAL_HIERARCHY[currentId];
      const apiObj = apiPathwaysMap[currentId];
      trail.unshift({
        id: currentId,
        label: apiObj ? apiObj.title : struct.label,
        stage: struct.stage,
        isStructural: true
      });
      currentId = struct.parent;
    } else if (currentId === 'c10') {
      trail.unshift({
        id: 'c10',
        label: 'Class 10 / SSLC',
        stage: 'SSLC',
        isStructural: true
      });
      break;
    } else {
      const apiObj = apiPathwaysMap[currentId];
      if (apiObj) {
        trail.unshift({
          id: currentId,
          label: apiObj.title,
          stage: 'Choice Direction',
          isStructural: false
        });
        currentId = apiObj.parent_id || 'puc-science-pcmb';
      } else {
        break;
      }
    }
  }

  return trail;
};
