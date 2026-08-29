import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, 
  Layers, 
  Award, 
  Target, 
  CheckCircle2, 
  Info, 
  HelpCircle, 
  ChevronRight, 
  Check, 
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  MapPin,
  Lock,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { cn } from '../../utils/cn';

// Pre-defined static visual structures for all stations/nodes
// Pre-defined static visual structures for all stations/nodes
const SKELETON_NODES = {
  'c10': { id: 'c10', label: 'Class 10 / SSLC', col: 0, row: 3, type: 'root', color: '#005F60', isCareer: false, desc: 'Starting stage for all high school students in Karnataka.', pathwayId: null },
  
  // Level 1: Routes
  'puc': { id: 'puc', label: 'PUC (11th & 12th)', parentId: 'c10', col: 1, row: 1.5, type: 'route', color: '#005F60', isCareer: false, desc: '2-year Pre-University Course academic stream, preparing for general and professional university degrees.', pathwayId: 'c10-puc' },
  'diploma': { id: 'diploma', label: 'Polytechnic Diploma', parentId: 'c10', col: 1, row: 3.5, type: 'route', color: '#0EA5E9', isCareer: false, desc: '3-year practical engineering technical program leading to early employment or direct 2nd-year B.E lateral entry.', pathwayId: 'c10-diploma' },
  'iti': { id: 'iti', label: 'ITI Trades', parentId: 'c10', col: 1, row: 5, type: 'route', color: '#10B981', isCareer: false, desc: '1-to-2 year skill-focused vocational trade certificates targeting quick industry entry and apprenticeships.', pathwayId: 'c10-iti' },
  
  // Level 2: Streams & Trades
  'puc-science': { id: 'puc-science', label: 'Science Stream', parentId: 'puc', col: 2, row: 0.8, type: 'stream', color: '#005F60', isCareer: false, desc: 'Focused on Physics, Chemistry, Maths, Biology, and Computer electives. Leads to STEM and medical fields.', pathwayId: 'puc-science' },
  'puc-commerce': { id: 'puc-commerce', label: 'Commerce Stream', parentId: 'puc', col: 2, row: 1.6, type: 'stream', color: '#F97316', isCareer: false, desc: 'Focused on Accountancy, Business, Economics, and Statistics. Ideal for financial, corporate management, and CA tracks.', pathwayId: 'puc-commerce' },
  'puc-arts': { id: 'puc-arts', label: 'Arts & Humanities', parentId: 'puc', col: 2, row: 2.3, type: 'stream', color: '#8B5CF6', isCareer: false, desc: 'Focused on History, Economics, Political Science, and Sociology. Leads to civil services, law, journalism, and public services.', pathwayId: 'puc-arts' },
  
  'dip-cse': { id: 'dip-cse', label: 'Diploma CS & IT', parentId: 'diploma', col: 2, row: 3, type: 'branch', color: '#0EA5E9', isCareer: false, desc: 'Practical software engineering, database, web development, and networking diploma.', pathwayId: 'c10-diploma', optionName: 'Computer Science & Engineering Diploma' },
  'dip-ece': { id: 'dip-ece', label: 'Diploma ECE / EEE', parentId: 'diploma', col: 2, row: 3.5, type: 'branch', color: '#0EA5E9', isCareer: false, desc: 'Practical electrical circuits, IoT, microcontrollers, and communication systems diploma.', pathwayId: 'c10-diploma', optionName: 'Electronics & Communication Diploma' },
  'dip-mech': { id: 'dip-mech', label: 'Diploma Mech / Civil', parentId: 'diploma', col: 2, row: 4, type: 'branch', color: '#0EA5E9', isCareer: false, desc: 'Practical workshop mechanical processes, building drawings, surveying, and machine CAD design.', pathwayId: 'c10-diploma', optionName: 'Mechanical Engineering Diploma' },

  'iti-elec': { id: 'iti-elec', label: 'Electrician Trade', parentId: 'iti', col: 2, row: 4.6, type: 'trade', color: '#10B981', isCareer: false, desc: 'Practical home and industrial electrical wiring, power generation and drives repair.', pathwayId: 'c10-iti', optionName: 'Electrician Trade' },
  'iti-fit': { id: 'iti-fit', label: 'Fitter / Turner Trade', parentId: 'iti', col: 2, row: 5.1, type: 'trade', color: '#10B981', isCareer: false, desc: 'Industrial machinery components precision machining, bench fitting, and lathe tools.', pathwayId: 'c10-iti', optionName: 'Fitter / Turner Trade' },
  'iti-copa': { id: 'iti-copa', label: 'COPA Trade', parentId: 'iti', col: 2, row: 5.6, type: 'trade', color: '#10B981', isCareer: false, desc: 'Computer Operator and Programming Assistant trade certificate covering basic IT tools, databases, and web.', pathwayId: 'c10-iti', optionName: 'COPA (Computer Operator & Programming Assistant)' },

  // Level 3: Subject combinations & intermediate milestones
  'puc-science-pcmb': { id: 'puc-science-pcmb', label: 'PCMB Comb.', parentId: 'puc-science', col: 3, row: 0.4, type: 'combination', color: '#005F60', isCareer: false, desc: 'Physics, Chemistry, Mathematics, Biology combination. Opens up medical, pharmacy, and biological science paths.', pathwayId: 'puc-science-pcmb' },
  'puc-science-pcmc': { id: 'puc-science-pcmc', label: 'PCMC Comb.', parentId: 'puc-science', col: 3, row: 0.8, type: 'combination', color: '#005F60', isCareer: false, desc: 'Physics, Chemistry, Mathematics, Computer Science combination. The standard route for B.E/B.Tech and software tracks.', pathwayId: 'puc-science-pcmc' },
  'puc-science-pcme': { id: 'puc-science-pcme', label: 'PCME Comb.', parentId: 'puc-science', col: 3, row: 1.2, type: 'combination', color: '#005F60', isCareer: false, desc: 'Physics, Chemistry, Mathematics, Electronics combination. Direct route for electrical hardware, microcontrollers, and IoT B.E.', pathwayId: 'puc-science-pcme' },
  
  'puc-commerce-ceba': { id: 'puc-commerce-ceba', label: 'CEBA Comb.', parentId: 'puc-commerce', col: 3, row: 1.6, type: 'combination', color: '#F97316', isCareer: false, desc: 'Computer Application, Economics, Business, Accountancy. Merges financial skills with programming frameworks.', pathwayId: 'puc-commerce', optionName: 'CEBA (Computer Science, Economics, Business, Accountancy)' },
  'puc-commerce-seba': { id: 'puc-commerce-seba', label: 'SEBA Comb.', parentId: 'puc-commerce', col: 3, row: 2, type: 'combination', color: '#F97316', isCareer: false, desc: 'Statistics, Economics, Business, Accountancy. Focuses on statistical analytics, actuarial science, and financial audits.', pathwayId: 'puc-commerce', optionName: 'SEBA (Statistics, Economics, Business, Accountancy)' },
  
  'puc-arts-heps': { id: 'puc-arts-heps', label: 'HEPS Comb.', parentId: 'puc-arts', col: 3, row: 2.3, type: 'combination', color: '#8B5CF6', isCareer: false, desc: 'History, Economics, Political Science, Sociology. Strong base for civil services (UPSC/KPSC) and social law.', pathwayId: 'puc-arts', optionName: 'HEPS (History, Economics, Political Science, Sociology)' },

  'dip-prog-he': { id: 'dip-prog-he', label: 'DCET Lateral Entry', parentId: 'dip-cse', col: 3, row: 3.2, type: 'milestone', color: '#0EA5E9', isCareer: false, desc: 'Karnataka Diploma CET exam enables eligible candidates direct entry into 2nd year B.E / B.Tech.', pathwayId: null },
  'iti-prog-dip': { id: 'iti-prog-dip', label: 'Diploma Progression', parentId: 'iti-elec', col: 3, row: 4.8, type: 'milestone', color: '#10B981', isCareer: false, desc: 'Advanced vocational training or direct admission to polytechnic diploma streams.', pathwayId: null },

  // Level 4: Higher education families
  'he-eng': { id: 'he-eng', label: 'Engineering & Tech', parentId: 'puc-science-pcmc', col: 4, row: 0.8, type: 'family', color: '#005F60', isCareer: false, desc: 'Professional B.E / B.Tech engineering families. Unlocks CSE, IS, ECE, Mechanical, and Civil specialities.', pathwayId: 'puc-science-eng' },
  'he-med': { id: 'he-med', label: 'Medicine & Health', parentId: 'puc-science-pcmb', col: 4, row: 0.1, type: 'family', color: '#D946EF', isCareer: false, desc: 'Medical clinical sciences (MBBS, BDS, alternate therapy BAMS) requiring competitive NEET-UG rank.', pathwayId: 'puc-science-med' },
  'he-pure': { id: 'he-pure', label: 'Pure Sciences (B.Sc)', parentId: 'puc-science-pcmb', col: 4, row: 0.4, type: 'family', color: '#A855F7', isCareer: false, desc: 'Basic science degree streams (B.Sc Physics, Math, Chemistry, Biotech, Microbiology). Paths to research.', pathwayId: 'puc-science-pure' },
  'he-pharm': { id: 'he-pharm', label: 'Pharmacy (B.Pharm)', parentId: 'puc-science-pcmb', col: 4, row: 1.2, type: 'family', color: '#10B981', isCareer: false, desc: 'Study of formulations, compounding, drugs research, quality controls, and pharma stores management.', pathwayId: 'puc-science-pharm' },
  'he-agri': { id: 'he-agri', label: 'Agri-Sciences', parentId: 'puc-science-pcmb', col: 4, row: 1.5, type: 'family', color: '#84CC16', isCareer: false, desc: 'B.Sc Agriculture, forestry, agricultural technology, and crop sciences in state universities.', pathwayId: 'puc-science-agri' },
  
  'he-biz': { id: 'he-biz', label: 'Biz & Accounting', parentId: 'puc-commerce-ceba', col: 4, row: 1.8, type: 'family', color: '#F97316', isCareer: false, desc: 'Commerce and business undergraduate programs: B.Com, BBA, B.Com Honours.', pathwayId: 'puc-commerce-fin' },
  'he-arts': { id: 'he-arts', label: 'Humanities & Media', parentId: 'puc-arts-heps', col: 4, row: 2.3, type: 'family', color: '#8B5CF6', isCareer: false, desc: 'Liberal arts degrees (B.A. Economics, History) and media/communication channels.', pathwayId: 'puc-arts-hum' },
  'he-law': { id: 'he-law', label: 'Law Degrees (5-Yr)', parentId: 'puc-arts-heps', col: 4, row: 3.5, type: 'cross-stream', color: '#EC4899', isCareer: false, desc: 'Integrated professional law programs (BA LLB, BBA LLB, B.Com LLB) under KSLU or National Law Schools.', pathwayId: 'cross-law' },
  'he-design': { id: 'he-design', label: 'Design & Creative', parentId: 'puc-science', col: 4, row: 4.2, type: 'cross-stream', color: '#F43F5E', isCareer: false, desc: 'Visual graphics, product model layout design, UI/UX interaction screens, animation, and fine arts.', pathwayId: 'cross-design' },
  'he-hospitality': { id: 'he-hospitality', label: 'Hospitality & Tourism', parentId: 'puc-commerce', col: 4, row: 5, type: 'cross-stream', color: '#06B6D4', isCareer: false, desc: 'Professional 4-year BHM (Hotel Management) or travel agency operations.', pathwayId: 'cross-hospitality' },

  // Level 5: Specific Courses/Specializations
  'cse': { id: 'cse', label: 'CSE / AI & ML', parentId: 'he-eng', col: 5, row: 0.6, type: 'course', color: '#005F60', isCareer: false, desc: 'Computer Science, Artificial Intelligence, Data Engineering, Software Architecture.', pathwayId: 'puc-science-eng', optionName: 'Computer Science & Engineering (CSE / AI & ML / Data Science)' },
  'ece': { id: 'ece', label: 'ECE / Embedded', parentId: 'he-eng', col: 5, row: 1, type: 'course', color: '#005F60', isCareer: false, desc: 'Electronics & Communication, VLSI designs, embedded microcontrollers, IoT devices.', pathwayId: 'puc-science-eng', optionName: 'Electronics & Communication Engineering (ECE / Embedded / VLSI)' },
  'mbbs': { id: 'mbbs', label: 'MBBS / BDS Clinical', parentId: 'he-med', col: 5, row: 0, type: 'course', color: '#D946EF', isCareer: false, desc: 'Professional clinical medicine & dental sciences programs.', pathwayId: 'puc-science-med', optionName: 'MBBS / BDS Clinical Professional' },
  'bsc': { id: 'bsc', label: 'B.Sc / Bio-Science', parentId: 'he-pure', col: 5, row: 0.3, type: 'course', color: '#A855F7', isCareer: false, desc: 'Undergraduate science degree specialities (Physics, Math, Bio-tech).', pathwayId: 'puc-science-pure', optionName: 'B.Sc (Physics / Math / Computer Science / Statistics)' },
  
  'bcom': { id: 'bcom', label: 'B.Com / BBA', parentId: 'he-biz', col: 5, row: 1.6, type: 'course', color: '#F97316', isCareer: false, desc: 'Standard business and finance undergraduate qualifications.', pathwayId: 'puc-commerce-fin', optionName: 'Bachelor of Commerce (B.Com / B.Com Honours)' },
  'ca': { id: 'ca', label: 'CA / CS Certification', parentId: 'he-biz', col: 5, row: 2, type: 'professional-course', color: '#E11D48', isCareer: false, desc: 'Chartered Accountancy statutory certification route. Covers audits, taxation, laws, and company secretary rules.', pathwayId: 'puc-commerce-fin', optionName: 'Chartered Accountancy (CA) / CS / CMA Professional Track' },
  
  'ba-llb': { id: 'ba-llb', label: 'BA / BBA LL.B', parentId: 'he-law', col: 5, row: 3.5, type: 'course', color: '#EC4899', isCareer: false, desc: 'Integrated 5-year legal degree program.', pathwayId: 'cross-law', optionName: 'BA LL.B (Integrated Bachelor of Arts & Law)' },
  'ui-ux': { id: 'ui-ux', label: 'Product / UI UX', parentId: 'he-design', col: 5, row: 4.2, type: 'course', color: '#F43F5E', isCareer: false, desc: 'Digital interfaces, mockups, design thinking, and product layout models.', pathwayId: 'cross-design', optionName: 'Product Design / UI & UX Design' },

  // Level 6: Careers
  'software-dev': { id: 'software-dev', label: 'Software Engineer', parentId: 'cse', col: 6, row: 0.6, type: 'career', color: '#005F60', isCareer: true, desc: 'Build frontend apps, backend microservices, configure databases, and cloud scripts.', salary: '₹4.5L - ₹14L', pathwayId: 'puc-science-cse-careers', optionName: 'Software Development / Software Engineering' },
  'doctor': { id: 'doctor', label: 'Practicing Doctor', parentId: 'mbbs', col: 6, row: 0, type: 'career', color: '#D946EF', isCareer: true, desc: 'Hospital clinical diagnosis, health practitioner, surgery consultant, or research fields.', salary: '₹8.0L - ₹25L', pathwayId: 'puc-science-med', optionName: 'MBBS / BDS Clinical Professional' },
  'cfo': { id: 'cfo', label: 'Chartered Accountant', parentId: 'ca', col: 6, row: 2, type: 'career', color: '#E11D48', isCareer: true, desc: 'Corporate tax audits, legal financial filings, investment strategy analyst.', salary: '₹6.5L - ₹20L', pathwayId: 'puc-commerce-fin', optionName: 'Chartered Accountancy (CA) / CS / CMA Professional Track' },
  'lawyer': { id: 'lawyer', label: 'Advocate / Lawyer', parentId: 'ba-llb', col: 6, row: 3.5, type: 'career', color: '#EC4899', isCareer: true, desc: 'Litigation advocacy, corporate counsel advisor, judiciary administrative fields.', salary: '₹4.0L - ₹15L', pathwayId: 'cross-law', optionName: 'BA LL.B (Integrated Bachelor of Arts & Law)' },
  'designer': { id: 'designer', label: 'UI/UX Designer', parentId: 'ui-ux', col: 6, row: 4.2, type: 'career', color: '#F43F5E', isCareer: true, desc: 'User flows mapper, application screen prototype builder, usability auditor.', salary: '₹4.2L - ₹12L', pathwayId: 'cross-design', optionName: 'Product Design / UI & UX Design' }
};


// Responsive placement calculation based on viewport dimensions
const computeCoordinates = (width, height) => {
  const coords = {};
  const W = width || 800;
  const H = height || 500;
  
  // 1. Root node: Class 10 / SSLC (centered vertically, 18% from left edge)
  const rootX = W * 0.18;
  const rootY = H * 0.5;
  coords['c10'] = { x: rootX, y: rootY };
  
  // 2. Level 1: Routes (PUC, Diploma, ITI)
  const colWidth = Math.min(160, W * 0.22);
  const x1 = rootX + colWidth;
  const ySpacing1 = Math.min(85, H * 0.18); // Compact vertical spacing
  coords['puc'] = { x: x1, y: rootY - ySpacing1 };
  coords['diploma'] = { x: x1, y: rootY };
  coords['iti'] = { x: x1, y: rootY + ySpacing1 };
  
  // 3. Level 2: Streams & Specialty Branches
  const x2 = x1 + colWidth;
  const ySpacing2 = Math.min(65, H * 0.14);
  
  // Under PUC (Science, Commerce, Arts)
  coords['puc-science'] = { x: x2, y: coords['puc'].y - ySpacing2 };
  coords['puc-commerce'] = { x: x2, y: coords['puc'].y };
  coords['puc-arts'] = { x: x2, y: coords['puc'].y + ySpacing2 };
  
  // Under Diploma (CS, EC, Mech)
  const ySpacingDip = Math.min(35, H * 0.08);
  coords['dip-cse'] = { x: x2, y: coords['diploma'].y - ySpacingDip };
  coords['dip-ece'] = { x: x2, y: coords['diploma'].y };
  coords['dip-mech'] = { x: x2, y: coords['diploma'].y + ySpacingDip };
  
  // Under ITI (Electrician, Fitter, COPA)
  coords['iti-elec'] = { x: x2, y: coords['iti'].y - ySpacingDip };
  coords['iti-fit'] = { x: x2, y: coords['iti'].y };
  coords['iti-copa'] = { x: x2, y: coords['iti'].y + ySpacingDip };
  
  // 4. Level 3: Subject combinations & progressions
  const x3 = x2 + colWidth;
  
  // Under Science
  coords['puc-science-pcmb'] = { x: x3, y: coords['puc-science'].y - 25 };
  coords['puc-science-pcmc'] = { x: x3, y: coords['puc-science'].y };
  coords['puc-science-pcme'] = { x: x3, y: coords['puc-science'].y + 25 };
  
  // Under Commerce
  coords['puc-commerce-ceba'] = { x: x3, y: coords['puc-commerce'].y - 20 };
  coords['puc-commerce-seba'] = { x: x3, y: coords['puc-commerce'].y + 20 };
  
  // Under Arts
  coords['puc-arts-heps'] = { x: x3, y: coords['puc-arts'].y };
  
  // Under Diploma CS / EC / Mech
  coords['dip-prog-he'] = { x: x3, y: coords['dip-cse'].y };
  coords['iti-prog-dip'] = { x: x3, y: coords['iti-elec'].y };
  
  // 5. Level 4: Higher education families
  const x4 = x3 + colWidth;
  
  // From PCMB
  coords['he-med'] = { x: x4, y: coords['puc-science-pcmb'].y - 30 };
  coords['he-pure'] = { x: x4, y: coords['puc-science-pcmb'].y };
  coords['he-pharm'] = { x: x4, y: coords['puc-science-pcmb'].y + 30 };
  coords['he-agri'] = { x: x4, y: coords['puc-science-pcmb'].y + 60 };
  
  // From PCMC / PCME / DCET
  coords['he-eng'] = { x: x4, y: coords['puc-science-pcmc'].y };
  coords['he-design'] = { x: x4, y: coords['puc-science-pcmc'].y + 40 };
  coords['he-hospitality'] = { x: x4, y: coords['puc-science-pcmc'].y + 80 };
  
  // From CEBA / SEBA
  coords['he-biz'] = { x: x4, y: coords['puc-commerce-ceba'].y };
  
  // From HEPS
  coords['he-arts'] = { x: x4, y: coords['puc-arts-heps'].y };
  coords['he-law'] = { x: x4, y: coords['puc-arts-heps'].y + 40 };
  
  // 6. Level 5: Courses
  const x5 = x4 + colWidth;
  coords['cse'] = { x: x5, y: coords['he-eng'].y - 20 };
  coords['ece'] = { x: x5, y: coords['he-eng'].y + 20 };
  coords['mbbs'] = { x: x5, y: coords['he-med'].y };
  coords['bsc'] = { x: x5, y: coords['he-pure'].y };
  coords['bcom'] = { x: x5, y: coords['he-biz'].y - 15 };
  coords['ca'] = { x: x5, y: coords['he-biz'].y + 15 };
  coords['ba-llb'] = { x: x5, y: coords['he-law'].y };
  coords['ui-ux'] = { x: x5, y: coords['he-design'].y };
  
  // 7. Level 6: Careers
  const x6 = x5 + colWidth;
  coords['software-dev'] = { x: x6, y: coords['cse'].y };
  coords['doctor'] = { x: x6, y: coords['mbbs'].y };
  coords['cfo'] = { x: x6, y: coords['ca'].y };
  coords['lawyer'] = { x: x6, y: coords['ba-llb'].y };
  coords['designer'] = { x: x6, y: coords['ui-ux'].y };

  return coords;
};

// Calculate initial framing so W*0.25 is Class 10, fitting PUC, Diploma, ITI
const getInitialFraming = (W, H) => {
  const isMobile = window.innerWidth < 768;
  const initialZoom = isMobile ? 0.6 : 1.0;
  const rootX = W * 0.18;
  const initialPanX = isMobile ? 20 : (W * 0.25 - rootX * initialZoom);
  const initialPanY = isMobile ? 50 : 0;
  return {
    zoom: initialZoom,
    pan: { x: initialPanX, y: initialPanY }
  };
};

export const EducationPathwayMap = ({
  mode = 'FullExplorer',
  pathwaysData = [],
  onSelectGoal = null,    // Callback function when user chooses a goal
  studentProfile = null,   // Logged-in student profile for recommendations
  recommendations = null,
  initialSelectedNodeId = null
}) => {
  const [selectedNode, setSelectedNode] = useState('c10');
  const [activePath, setActivePath] = useState(['c10']);

  // Handle initial node selection matching URL query parameter or student profile stage
  useEffect(() => {
    if (initialSelectedNodeId) {
      setSelectedNode(initialSelectedNodeId);
      return;
    }

    if (studentProfile) {
      const level = studentProfile.current_level;
      const stream = studentProfile.stream;

      if (level === 'PUC' || level === 'PUC 1' || level === 'PUC 2') {
        if (stream === 'Science') setSelectedNode('puc-science');
        else if (stream === 'Commerce') setSelectedNode('puc-commerce');
        else if (stream === 'Arts') setSelectedNode('puc-arts');
        else setSelectedNode('puc');
      } else if (level === 'Diploma') {
        setSelectedNode('diploma');
      } else if (level === 'ITI') {
        setSelectedNode('iti');
      } else {
        setSelectedNode('c10');
      }
    }
  }, [studentProfile, initialSelectedNodeId]);
  
  // Pan and Zoom states
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 30, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const hasInitializedRef = useRef(false);

  // ResizeObserver to track container width & height dynamically
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width: width || 800, height: height || 500 });
      }
    });
    
    resizeObserver.observe(containerRef.current);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Compute node coordinates based on dynamic dimensions
  const coords = computeCoordinates(dimensions.width, dimensions.height);

  // Apply responsive initial framing once container dimensions are measured
  useEffect(() => {
    if (dimensions.width > 100 && !hasInitializedRef.current) {
      const framing = getInitialFraming(dimensions.width, dimensions.height);
      setZoom(framing.zoom);
      setPan(framing.pan);
      hasInitializedRef.current = true;
    }
  }, [dimensions.width, dimensions.height]);

  // Sync active path with selected node parent nodes recursively
  useEffect(() => {
    const path = [];
    let currentId = selectedNode;
    while (currentId) {
      path.unshift(currentId);
      currentId = SKELETON_NODES[currentId]?.parentId;
    }
    setActivePath(path);
  }, [selectedNode]);

  // Determine node visibility based on progressive disclosure
  const isNodeVisible = (nodeId) => {
    const node = SKELETON_NODES[nodeId];
    if (!node) return false;
    
    // Root node is always visible
    if (node.id === 'c10') return true;
    
    // Level 1 nodes are always visible
    if (node.parentId === 'c10') return true;
    
    // A node is visible if its parent is in the active path
    return activePath.includes(node.parentId);
  };

  // Determine if a node should look faded
  const isNodeFaded = (nodeId) => {
    const node = SKELETON_NODES[nodeId];
    if (!node) return true;
    if (!isNodeVisible(nodeId)) return true;
    
    const isSelectedOrParent = activePath.includes(nodeId);
    const isDirectChild = node.parentId === selectedNode;
    
    return !isSelectedOrParent && !isDirectChild;
  };

  // Draw connection S-curves (Metro Line style)
  const drawConnector = (parentId, childId) => {
    const parent = SKELETON_NODES[parentId];
    const child = SKELETON_NODES[childId];
    if (!parent || !child) return null;
    
    const start = coords[parentId];
    const end = coords[childId];
    if (!start || !end) return null;
    
    const isLineActive = activePath.includes(parentId) && activePath.includes(childId);
    const isLineFaded = !isLineActive && (!activePath.includes(parentId) || selectedNode !== parentId);

    // Bezier control points for smooth horizontal S-curves
    const controlX1 = start.x + (end.x - start.x) / 2;
    const controlY1 = start.y;
    const controlX2 = start.x + (end.x - start.x) / 2;
    const controlY2 = end.y;

    const pathData = `M ${start.x} ${start.y} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${end.x} ${end.y}`;
    
    return (
      <g key={`link-${parentId}-${childId}`} className="transition-all duration-300">
        {isLineActive && (
          <path
            d={pathData}
            fill="none"
            stroke={child.color}
            strokeWidth="8"
            strokeOpacity="0.18"
            strokeLinecap="round"
          />
        )}
        <path
          d={pathData}
          fill="none"
          stroke={isLineActive ? child.color : '#E2E8F0'}
          strokeWidth={isLineActive ? '3.5' : '2'}
          strokeDasharray={child.type === 'cross-stream' ? '4 4' : 'none'}
          strokeOpacity={isLineFaded ? '0.25' : '1'}
          className="transition-all duration-300"
        />
      </g>
    );
  };

  // Map Navigation Controllers
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 1.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.45));
  
  // Reset restores Selected Node to Class 10, visible nodes to level 1, and initial camera framing
  const handleReset = () => {
    setSelectedNode('c10');
    const framing = getInitialFraming(dimensions.width, dimensions.height);
    setZoom(framing.zoom);
    setPan(framing.pan);
  };

  // Fit View fits current visible nodes
  const handleFitView = () => {
    const visibleIds = Object.keys(SKELETON_NODES).filter(id => isNodeVisible(id));
    if (visibleIds.length === 0) return;
    
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    
    visibleIds.forEach(id => {
      const coord = coords[id];
      if (coord) {
        if (coord.x < minX) minX = coord.x;
        if (coord.x > maxX) maxX = coord.x;
        if (coord.y < minY) minY = coord.y;
        if (coord.y > maxY) maxY = coord.y;
      }
    });
    
    const margin = 50;
    const boxW = (maxX - minX) || 100;
    const boxH = (maxY - minY) || 100;
    
    const containerW = dimensions.width;
    const containerH = dimensions.height;
    
    let newZoom = Math.min((containerW - margin * 2) / boxW, (containerH - margin * 2) / boxH);
    newZoom = Math.max(0.45, Math.min(newZoom, 1.3));
    
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    setZoom(newZoom);
    setPan({
      x: containerW / 2 - centerX * newZoom,
      y: containerH / 2 - centerY * newZoom
    });
  };

  // Mouse drag pan handlers
  const handleMouseDown = (e) => {
    if (e.target.tagName === 'circle' || e.target.tagName === 'text' || e.target.closest('button')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch drag pan handlers
  const handleTouchStart = (e) => {
    if (e.target.tagName === 'circle' || e.target.tagName === 'text') return;
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setPan({ x: touch.clientX - dragStart.x, y: touch.clientY - dragStart.y });
  };

  // Merge database pathway info matching this node id
  const getMergedNodeDetails = () => {
    const staticNode = SKELETON_NODES[selectedNode];
    if (!staticNode) return null;

    const matchedPathway = staticNode.pathwayId
      ? pathwaysData.find(p => p.id.toLowerCase() === staticNode.pathwayId.toLowerCase())
      : null;

    let matchedOption = null;
    if (matchedPathway && staticNode.optionName) {
      matchedOption = matchedPathway.options?.find(opt => opt.option_name === staticNode.optionName);
    }

    const rec = recommendations?.recommendations?.find(r => r.pathway_id === matchedPathway?.id);

    return {
      ...staticNode,
      duration: matchedPathway?.duration || staticNode.duration || '',
      category: matchedPathway?.category || staticNode.category || '',
      description: matchedOption?.description || matchedPathway?.description || staticNode.desc,
      eligibility: matchedOption?.eligibility || null,
      options: matchedPathway?.options || [],
      milestones: matchedPathway?.milestones || [],
      originalPathway: matchedPathway,
      originalOption: matchedOption,
      pathwayOptionId: matchedOption?.id || null,
      recommendation: rec
    };
  };

  const details = getMergedNodeDetails();

  // Highlight recommended nodes based on actual recommendations first
  const isRecommended = (nodeId) => {
    const node = SKELETON_NODES[nodeId];
    if (!node) return false;

    if (node.pathwayId && recommendations?.recommendations) {
      return recommendations.recommendations.some(r => r.pathway_id === node.pathwayId);
    }

    // Fallback to profile guessing if recommendations not loaded
    if (!studentProfile) return false;

    if (nodeId === 'puc' && studentProfile.current_level?.includes('Class 10')) return true;
    if (nodeId === 'puc-science' && studentProfile.stream === 'Science') return true;
    if (nodeId === 'puc-commerce' && studentProfile.stream === 'Commerce') return true;
    if (nodeId === 'puc-arts' && studentProfile.stream === 'Arts') return true;
    
    if (nodeId === 'puc-science-pcmc' && studentProfile.stream === 'Science' && studentProfile.class_or_year?.includes('PCMC')) return true;
    if (nodeId === 'puc-science-pcmb' && studentProfile.stream === 'Science' && studentProfile.class_or_year?.includes('PCMB')) return true;
    
    return false;
  };

  return (
    <div className="w-full flex flex-col gap-3.5 font-sans">
      
      {/* 1. Breadcrumbs Bar */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-2xl text-[11px] font-extrabold text-slate-500 shadow-3xs overflow-x-auto">
        <span className="text-[#005F60] font-black uppercase tracking-wider flex items-center gap-1 shrink-0">
          <Compass className="w-3.5 h-3.5" />
          <span>Explorer Trail:</span>
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        
        {activePath.map((nodeId, idx) => {
          const node = SKELETON_NODES[nodeId];
          if (!node) return null;
          const isLast = idx === activePath.length - 1;
          
          return (
            <React.Fragment key={nodeId}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
              <button
                type="button"
                onClick={() => setSelectedNode(nodeId)}
                className={cn(
                  "hover:underline focus:outline-none transition-all cursor-pointer",
                  isLast ? "text-[#F97316] font-black" : "text-slate-700 font-bold"
                )}
              >
                {node.label}
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* Main split display: Map (8 cols) and Details (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* 2. Visual Metro Map Canvas (8 cols on desktop) */}
        <div className="lg:col-span-8 flex flex-col gap-2">
          
          {/* Controls Bar */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#005F60]" />
              <span>Drag canvas or click nodes to navigate</span>
            </span>
            
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-3xs">
              <button 
                type="button" 
                onClick={handleZoomIn} 
                title="Zoom In"
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button 
                type="button" 
                onClick={handleZoomOut} 
                title="Zoom Out"
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button 
                type="button" 
                onClick={handleFitView} 
                title="Fit to Selected Node"
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button 
                type="button" 
                onClick={handleReset} 
                title="Reset to Class 10 State"
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition cursor-pointer border-l border-slate-100 pl-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* SVG Map Container (viewport-aware clamped height) */}
          <div 
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
            className="w-full border border-slate-200/80 rounded-3xl overflow-hidden relative shadow-inner cursor-grab active:cursor-grabbing select-none"
            style={{ 
              height: 'clamp(460px, 58vh, 620px)',
              backgroundColor: '#F8FAF8' 
            }}
          >
            {/* Visual indicators */}
            <div className="absolute bottom-4 left-4 bg-white/95 border border-slate-200/90 rounded-2xl p-2.5 shadow-sm z-10 space-y-1 pointer-events-none text-[9px] font-bold text-slate-700">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#005F60]" />
                <span>Science / PUC / Root</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#F97316]" />
                <span>Commerce Stream</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />
                <span>Arts Stream</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#0EA5E9]" />
                <span>Polytechnic Diploma</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                <span>ITI Trade</span>
              </div>
            </div>

            {/* SVG Visualizer */}
            <svg className="w-full h-full" style={{ pointerEvents: 'auto' }}>
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2E8F0" strokeWidth="0.5" strokeOpacity="0.4" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`} className="transition-transform duration-75">
                
                {/* A. DRAW BACKDROP CONNECTING S-CURVES */}
                {Object.values(SKELETON_NODES).map((node) => {
                  if (node.parentId && isNodeVisible(node.id)) {
                    return drawConnector(node.parentId, node.id);
                  }
                  return null;
                })}

                {/* B. DRAW METRO STATION NODES */}
                {Object.values(SKELETON_NODES).map((node) => {
                  if (!isNodeVisible(node.id)) return null;

                  const coord = coords[node.id] || { x: 100, y: 100 };
                  const isSelected = selectedNode === node.id;
                  const isFaded = isNodeFaded(node.id);
                  const hasRecommendation = isRecommended(node.id);

                  return (
                    <g 
                      key={node.id} 
                      transform={`translate(${coord.x}, ${coord.y})`}
                      onClick={() => setSelectedNode(node.id)}
                      className={cn(
                        "cursor-pointer group transition-all duration-300",
                        isFaded ? "opacity-35 hover:opacity-75" : "opacity-100"
                      )}
                    >
                      {/* Active outer pulse glow */}
                      {isSelected && (
                        <circle 
                          r="18" 
                          fill="none" 
                          stroke={node.color} 
                          strokeWidth="3.5" 
                          strokeOpacity="0.35"
                          className="animate-pulse"
                        />
                      )}

                      {/* Recommended outer dotted ring */}
                      {hasRecommendation && !isSelected && (
                        <circle
                          r="16"
                          fill="none"
                          stroke="#F97316"
                          strokeWidth="2"
                          strokeDasharray="2.5 1.5"
                        />
                      )}

                      {/* Outer station ring */}
                      <circle 
                        r="12.5" 
                        fill="#FFFFFF" 
                        stroke={isSelected ? '#F97316' : node.color} 
                        strokeWidth={isSelected ? '4' : '2.5'} 
                        className="transition-all duration-200 shadow-sm"
                      />

                      {/* Inner core waypoint */}
                      <circle 
                        r="5.5" 
                        fill={isSelected ? '#F97316' : node.color} 
                        className="transition-all duration-200"
                      />

                      {/* Node label text */}
                      <text
                        y="26"
                        textAnchor="middle"
                        className={cn(
                          "text-[10px] font-black tracking-tight select-none pointer-events-none fill-slate-700 transition-all duration-200",
                          isSelected ? "fill-teal-900 font-extrabold scale-105" : ""
                        )}
                      >
                        {node.label}
                      </text>

                      {/* YOU ARE HERE indicator for Class 10 (Deep Teal color) */}
                      {node.id === 'c10' && (
                        <g transform="translate(0, -24)">
                          <rect
                            x="-30"
                            y="-8"
                            width="60"
                            height="16"
                            rx="5"
                            fill="#005F60"
                            className="shadow-sm"
                          />
                          <text
                            y="3"
                            textAnchor="middle"
                            fill="#FFFFFF"
                            className="text-[8px] font-black uppercase tracking-wider"
                          >
                            You Are Here
                          </text>
                        </g>
                      )}

                      {/* Recommended badge */}
                      {hasRecommendation && (
                        <g transform="translate(0, -24)">
                          <rect
                            x="-32"
                            y="-8"
                            width="64"
                            height="16"
                            rx="5"
                            fill="#F97316"
                            className="shadow-sm"
                          />
                          <text
                            y="3"
                            textAnchor="middle"
                            fill="#FFFFFF"
                            className="text-[7.5px] font-black uppercase tracking-wider"
                          >
                            Recommended
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>
        </div>

        {/* 3. Station Detail Information Panel (4 cols on desktop, content-driven height) */}
        <div className="lg:col-span-4 lg:sticky lg:top-24">
          {details ? (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-4 max-h-[570px] overflow-y-auto">
              
              {/* Header Title */}
              <div className="border-b border-slate-100 pb-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider bg-teal-50 border border-teal-200 text-[#005F60] px-2 py-0.5 rounded-md">
                    {details.category || 'Station Details'}
                  </span>
                  {details.duration && (
                    <span className="text-[10px] font-extrabold text-[#F97316] bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                      {details.duration}
                    </span>
                  )}
                </div>
                
                <h3 className="text-base font-black text-[#0F172A] tracking-tight leading-tight">
                  {details.label}
                </h3>
                
                <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                  {details.description}
                </p>

                {details.isCareer && (
                  <div className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200 font-bold">
                    <span>Target Salary:</span>
                    <span className="text-[#F97316] font-black">{details.salary}</span>
                  </div>
                )}
              </div>

              {/* Why this may suit you (Recommendation Context) */}
              {details.recommendation && (
                <div className="bg-teal-50/60 border border-teal-100 rounded-2xl p-3.5 space-y-2 text-xs">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#005F60] flex items-center gap-1.5 font-sans">
                    <Sparkles className="w-3.5 h-3.5 text-[#F97316] shrink-0" />
                    <span>Recommended for you ({details.recommendation.match_score}% - {details.recommendation.match_label})</span>
                  </span>
                  <div className="space-y-1">
                    <p className="text-[11px] font-extrabold text-teal-900 font-sans">Why this may suit you:</p>
                    <ul className="list-disc list-inside text-[11px] text-slate-600 font-semibold space-y-1 font-sans">
                      {details.recommendation.reasons?.map((reason, idx) => (
                        <li key={idx} className="leading-snug">{reason}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Set Active Goal Action Button */}
              {mode === 'FullExplorer' && onSelectGoal && details.pathwayId && (
                <button
                  type="button"
                  onClick={() => onSelectGoal(details.originalPathway || details, details.originalOption || null)}
                  className="w-full bg-[#005F60] hover:bg-teal-800 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer mt-1 font-sans"
                >
                  <Target className="w-4 h-4 text-[#F97316]" />
                  <span>{details.recommendation || details.originalOption ? 'Choose This Direction' : `Select ${details.label} Goal`}</span>
                </button>
              )}

              {/* Choices list */}
              {details.options.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[9px] uppercase font-black tracking-wider text-[#005F60] flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Options in Route ({details.options.length})</span>
                  </h4>
                  
                  <div className="space-y-2">
                    {details.options.map((opt) => (
                      <div 
                        key={opt.id || opt.option_name}
                        className="bg-[#F8FAF8] border border-slate-200/80 rounded-xl p-3 space-y-1 transition-all hover:bg-white hover:border-[#005F60]/50"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-extrabold text-xs text-slate-900 leading-snug">
                            {opt.option_name}
                          </span>
                          {opt.stream_or_code && (
                            <span className="text-[8px] font-mono font-black text-[#005F60] bg-teal-100/60 px-1 py-0.5 rounded">
                              {opt.stream_or_code}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 leading-normal font-semibold">
                          {opt.description}
                        </p>
                        {opt.eligibility && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-600 font-bold">
                            <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>Eligibility: {opt.eligibility}</span>
                          </span>
                        )}

                        {mode === 'FullExplorer' && onSelectGoal && (
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => onSelectGoal(details.originalPathway || details, opt)}
                              className="inline-flex items-center gap-1 bg-orange-50 hover:bg-orange-100 text-[#F97316] border border-orange-200 font-extrabold text-[9px] px-2 py-1 rounded-lg transition cursor-pointer"
                            >
                              <Target className="w-3 h-3" />
                              <span>Set as My Active Goal</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Milestones steps */}
              {details.milestones.length > 0 && (
                <div className="space-y-2.5 pt-1">
                  <h4 className="text-[9px] uppercase font-black tracking-wider text-[#F97316] flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    <span>Action Trail ({details.milestones.length} Steps)</span>
                  </h4>
                  
                  <div className="relative space-y-2 before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200/80 before:z-0">
                    {details.milestones.map((ms) => (
                      <div key={ms.id || ms.step_number} className="relative z-10 flex items-start gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-[#005F60] text-white flex items-center justify-center font-black text-[10px] shrink-0 shadow-xs ring-4 ring-white">
                          {ms.step_number}
                        </div>
                        
                        <div className="bg-[#F8FAF8] border border-slate-200/80 rounded-xl p-2.5 flex-1 space-y-0.5">
                          <h5 className="font-extrabold text-[10px] text-slate-800">
                            {ms.title}
                          </h5>
                          <p className="text-[11px] text-slate-500 leading-normal font-semibold">
                            {ms.description}
                          </p>
                          {ms.key_action && (
                            <span className="inline-flex items-center gap-1 text-[9px] text-[#005F60] font-black pt-0.5">
                              <CheckCircle2 className="w-3 h-3 text-[#005F60]" />
                              <span>Action: {ms.key_action}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Public mode login trigger */}
              {mode === 'PublicPreview' && (
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => onSelectGoal && onSelectGoal()}
                    className="w-full bg-[#005F60] hover:bg-teal-800 text-white font-extrabold py-2 px-3 rounded-xl text-xs transition-all shadow-xs flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <span>Log In to Personalize Route</span>
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              )}

            </div>
          ) : (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 text-center text-slate-400 space-y-2">
              <Compass className="w-7 h-7 mx-auto text-slate-300" />
              <p className="text-xs font-bold">Select any node on the left map to explore its milestones and options.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default EducationPathwayMap;
