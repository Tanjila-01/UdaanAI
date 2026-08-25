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
  BookOpen
} from 'lucide-react';
import { cn } from '../../utils/cn';

// Pre-defined static visual coordinate offsets and metadata for all stations/nodes
const SKELETON_NODES = {
  'c10': { id: 'c10', label: 'Class 10 / SSLC', col: 0, row: 3, type: 'root', color: '#64748B', isCareer: false, desc: 'Starting stage for all high school students in Karnataka.' },
  
  // Level 1: Routes
  'puc': { id: 'puc', label: 'PUC (11th & 12th)', parentId: 'c10', col: 1, row: 1.5, type: 'route', color: '#005F60', isCareer: false, desc: '2-year Pre-University Course academic stream, preparing for general and professional university degrees.' },
  'diploma': { id: 'diploma', label: 'Polytechnic Diploma', parentId: 'c10', col: 1, row: 3.5, type: 'route', color: '#0EA5E9', isCareer: false, desc: '3-year practical engineering technical program leading to early employment or direct 2nd-year B.E lateral entry.' },
  'iti': { id: 'iti', label: 'ITI Trades', parentId: 'c10', col: 1, row: 5, type: 'route', color: '#10B981', isCareer: false, desc: '1-to-2 year skill-focused vocational trade certificates targeting quick industry entry and apprenticeships.' },
  
  // Level 2: Streams & Trades
  'puc-science': { id: 'puc-science', label: 'Science Stream', parentId: 'puc', col: 2, row: 0.8, type: 'stream', color: '#005F60', isCareer: false, desc: 'Focused on Physics, Chemistry, Maths, Biology, and Computer electives. Leads to STEM and medical fields.' },
  'puc-commerce': { id: 'puc-commerce', label: 'Commerce Stream', parentId: 'puc', col: 2, row: 1.6, type: 'stream', color: '#F97316', isCareer: false, desc: 'Focused on Accountancy, Business, Economics, and Statistics. Ideal for financial, corporate management, and CA tracks.' },
  'puc-arts': { id: 'puc-arts', label: 'Arts & Humanities', parentId: 'puc', col: 2, row: 2.3, type: 'stream', color: '#8B5CF6', isCareer: false, desc: 'Focused on History, Economics, Political Science, and Sociology. Leads to civil services, law, journalism, and public services.' },
  
  'dip-cse': { id: 'dip-cse', label: 'Diploma CS & IT', parentId: 'diploma', col: 2, row: 3, type: 'branch', color: '#0EA5E9', isCareer: false, desc: 'Practical software engineering, database, web development, and networking diploma.' },
  'dip-ece': { id: 'dip-ece', label: 'Diploma ECE / EEE', parentId: 'diploma', col: 2, row: 3.5, type: 'branch', color: '#0EA5E9', isCareer: false, desc: 'Practical electrical circuits, IoT, microcontrollers, and communication systems diploma.' },
  'dip-mech': { id: 'dip-mech', label: 'Diploma Mech / Civil', parentId: 'diploma', col: 2, row: 4, type: 'branch', color: '#0EA5E9', isCareer: false, desc: 'Practical workshop mechanical processes, building drawings, surveying, and machine CAD design.' },

  'iti-elec': { id: 'iti-elec', label: 'Electrician Trade', parentId: 'iti', col: 2, row: 4.6, type: 'trade', color: '#10B981', isCareer: false, desc: 'Practical home and industrial electrical wiring, power generation and drives repair.' },
  'iti-fit': { id: 'iti-fit', label: 'Fitter / Turner Trade', parentId: 'iti', col: 2, row: 5.1, type: 'trade', color: '#10B981', isCareer: false, desc: 'Industrial machinery components precision machining, bench fitting, and lathe tools.' },
  'iti-copa': { id: 'iti-copa', label: 'COPA Trade', parentId: 'iti', col: 2, row: 5.6, type: 'trade', color: '#10B981', isCareer: false, desc: 'Computer Operator and Programming Assistant trade certificate covering basic IT tools, databases, and web.' },

  // Level 3: Subject combinations & intermediate milestones
  'puc-science-pcmb': { id: 'puc-science-pcmb', label: 'PCMB Comb.', parentId: 'puc-science', col: 3, row: 0.4, type: 'combination', color: '#005F60', isCareer: false, desc: 'Physics, Chemistry, Mathematics, Biology combination. Opens up medical, pharmacy, and biological science paths.' },
  'puc-science-pcmc': { id: 'puc-science-pcmc', label: 'PCMC Comb.', parentId: 'puc-science', col: 3, row: 0.8, type: 'combination', color: '#005F60', isCareer: false, desc: 'Physics, Chemistry, Mathematics, Computer Science combination. The standard route for B.E/B.Tech and software tracks.' },
  'puc-science-pcme': { id: 'puc-science-pcme', label: 'PCME Comb.', parentId: 'puc-science', col: 3, row: 1.2, type: 'combination', color: '#005F60', isCareer: false, desc: 'Physics, Chemistry, Mathematics, Electronics combination. Direct route for electrical hardware, microcontrollers, and IoT B.E.' },
  
  'puc-commerce-ceba': { id: 'puc-commerce-ceba', label: 'CEBA Comb.', parentId: 'puc-commerce', col: 3, row: 1.6, type: 'combination', color: '#F97316', isCareer: false, desc: 'Computer Application, Economics, Business, Accountancy. Merges financial skills with programming frameworks.' },
  'puc-commerce-seba': { id: 'puc-commerce-seba', label: 'SEBA Comb.', parentId: 'puc-commerce', col: 3, row: 2, type: 'combination', color: '#F97316', isCareer: false, desc: 'Statistics, Economics, Business, Accountancy. Focuses on statistical analytics, actuarial science, and financial audits.' },
  
  'puc-arts-heps': { id: 'puc-arts-heps', label: 'HEPS Comb.', parentId: 'puc-arts', col: 3, row: 2.3, type: 'combination', color: '#8B5CF6', isCareer: false, desc: 'History, Economics, Political Science, Sociology. Strong base for civil services (UPSC/KPSC) and social law.' },

  'dip-prog-he': { id: 'dip-prog-he', label: 'DCET Lateral Entry', parentId: 'dip-cse', col: 3, row: 3.2, type: 'milestone', color: '#0EA5E9', isCareer: false, desc: 'Karnataka Diploma CET exam enables eligible candidates direct entry into 2nd year B.E / B.Tech.' },
  'iti-prog-dip': { id: 'iti-prog-dip', label: 'Diploma Progression', parentId: 'iti-elec', col: 3, row: 4.8, type: 'milestone', color: '#10B981', isCareer: false, desc: 'Advanced vocational training or direct admission to polytechnic diploma streams.' },

  // Level 4: Higher education families
  'he-eng': { id: 'he-eng', label: 'Engineering & Tech', parentId: 'puc-science-pcmc', col: 4, row: 0.8, type: 'family', color: '#005F60', isCareer: false, desc: 'Professional B.E / B.Tech engineering families. Unlocks CSE, IS, ECE, Mechanical, and Civil specialities.' },
  'he-med': { id: 'he-med', label: 'Medicine & Health', parentId: 'puc-science-pcmb', col: 4, row: 0.1, type: 'family', color: '#D946EF', isCareer: false, desc: 'Medical clinical sciences (MBBS, BDS, alternate therapy BAMS) requiring competitive NEET-UG rank.' },
  'he-pure': { id: 'he-pure', label: 'Pure Sciences (B.Sc)', parentId: 'puc-science-pcmb', col: 4, row: 0.4, type: 'family', color: '#A855F7', isCareer: false, desc: 'Basic science degree streams (B.Sc Physics, Math, Chemistry, Biotech, Microbiology). Paths to research.' },
  'he-pharm': { id: 'he-pharm', label: 'Pharmacy (B.Pharm)', parentId: 'puc-science-pcmb', col: 4, row: 1.2, type: 'family', color: '#10B981', isCareer: false, desc: 'Study of formulations, compounding, drugs research, quality controls, and pharma stores management.' },
  'he-agri': { id: 'he-agri', label: 'Agri-Sciences', parentId: 'puc-science-pcmb', col: 4, row: 1.5, type: 'family', color: '#84CC16', isCareer: false, desc: 'B.Sc Agriculture, forestry, agricultural technology, and crop sciences in state universities.' },
  
  'he-biz': { id: 'he-biz', label: 'Biz & Accounting', parentId: 'puc-commerce-ceba', col: 4, row: 1.8, type: 'family', color: '#F97316', isCareer: false, desc: 'Commerce and business undergraduate programs: B.Com, BBA, B.Com Honours.' },
  'he-arts': { id: 'he-arts', label: 'Humanities & Media', parentId: 'puc-arts-heps', col: 4, row: 2.3, type: 'family', color: '#8B5CF6', isCareer: false, desc: 'Liberal arts degrees (B.A. Economics, History) and media/communication channels.' },

  // Cross-stream Opportunities (Multiple parents)
  'he-law': { id: 'he-law', label: 'Law Degrees (5-Yr)', parentId: 'puc-arts-heps', col: 4, row: 3.5, type: 'cross-stream', color: '#EC4899', isCareer: false, desc: 'Integrated professional law programs (BA LLB, BBA LLB, B.Com LLB) under KSLU or National Law Schools.' },
  'he-design': { id: 'he-design', label: 'Design & Creative', parentId: 'puc-science', col: 4, row: 4.2, type: 'cross-stream', color: '#F43F5E', isCareer: false, desc: 'Visual graphics, product model layout design, UI/UX interaction screens, animation, and fine arts.' },
  'he-hospitality': { id: 'he-hospitality', label: 'Hospitality & Tourism', parentId: 'puc-commerce', col: 4, row: 5, type: 'cross-stream', color: '#06B6D4', isCareer: false, desc: 'Professional 4-year BHM (Hotel Management) or travel agency operations.' },

  // Level 5: Specific Courses/Specializations
  'cse': { id: 'cse', label: 'CSE / AI & ML', parentId: 'he-eng', col: 5, row: 0.6, type: 'course', color: '#005F60', isCareer: false, desc: 'Computer Science, Artificial Intelligence, Data Engineering, Software Architecture.' },
  'ece': { id: 'ece', label: 'ECE / Embedded', parentId: 'he-eng', col: 5, row: 1, type: 'course', color: '#005F60', isCareer: false, desc: 'Electronics & Communication, VLSI designs, embedded microcontrollers, IoT devices.' },
  'mbbs': { id: 'mbbs', label: 'MBBS / BDS Clinical', parentId: 'he-med', col: 5, row: 0, type: 'course', color: '#D946EF', isCareer: false, desc: 'Professional clinical medicine & dental sciences programs.' },
  'bsc': { id: 'bsc', label: 'B.Sc / Bio-Science', parentId: 'he-pure', col: 5, row: 0.3, type: 'course', color: '#A855F7', isCareer: false, desc: 'Undergraduate science degree specialities (Physics, Math, Bio-tech).' },
  
  'bcom': { id: 'bcom', label: 'B.Com / BBA', parentId: 'he-biz', col: 5, row: 1.6, type: 'course', color: '#F97316', isCareer: false, desc: 'Standard business and finance undergraduate qualifications.' },
  'ca': { id: 'ca', label: 'CA / CS Certification', parentId: 'he-biz', col: 5, row: 2, type: 'professional-course', color: '#E11D48', isCareer: false, desc: 'Chartered Accountancy statutory certification route. Covers audits, taxation, laws, and company secretary rules.' },
  
  'ba-llb': { id: 'ba-llb', label: 'BA / BBA LL.B', parentId: 'he-law', col: 5, row: 3.5, type: 'course', color: '#EC4899', isCareer: false, desc: 'Integrated 5-year legal degree program.' },
  'ui-ux': { id: 'ui-ux', label: 'Product / UI UX', parentId: 'he-design', col: 5, row: 4.2, type: 'course', color: '#F43F5E', isCareer: false, desc: 'Digital interfaces, mockups, design thinking, and product layout models.' },

  // Level 6: Careers
  'software-dev': { id: 'software-dev', label: 'Software Engineer', parentId: 'cse', col: 6, row: 0.6, type: 'career', color: '#005F60', isCareer: true, desc: 'Build frontend apps, backend microservices, configure databases, and cloud scripts.', salary: '₹4.5L - ₹14L' },
  'doctor': { id: 'doctor', label: 'Practicing Doctor', parentId: 'mbbs', col: 6, row: 0, type: 'career', color: '#D946EF', isCareer: true, desc: 'Hospital clinical diagnosis, health practitioner, surgery consultant, or research fields.', salary: '₹8.0L - ₹25L' },
  'cfo': { id: 'cfo', label: 'Chartered Accountant', parentId: 'ca', col: 6, row: 2, type: 'career', color: '#E11D48', isCareer: true, desc: 'Corporate tax audits, legal financial filings, investment strategy analyst.', salary: '₹6.5L - ₹20L' },
  'lawyer': { id: 'lawyer', label: 'Advocate / Lawyer', parentId: 'ba-llb', col: 6, row: 3.5, type: 'career', color: '#EC4899', isCareer: true, desc: 'Litigation advocacy, corporate counsel advisor, judiciary administrative fields.', salary: '₹4.0L - ₹15L' },
  'designer': { id: 'designer', label: 'UI/UX Designer', parentId: 'ui-ux', col: 6, row: 4.2, type: 'career', color: '#F43F5E', isCareer: true, desc: 'User flows mapper, application screen prototype builder, usability auditor.', salary: '₹4.2L - ₹12L' }
};

// Custom layout configurations for canvas sizes
const COL_WIDTH = 200;
const ROW_HEIGHT = 120;
const PADDING_X = 80;
const PADDING_Y = 80;

const getNodeCoords = (col, row) => {
  return {
    x: PADDING_X + col * COL_WIDTH,
    y: PADDING_Y + row * ROW_HEIGHT
  };
};

const EducationPathwayMap = ({ 
  mode = 'PublicPreview', // 'PublicPreview', 'FullExplorer', 'Personalized'
  pathwaysData = [],       // Dynamic pathways array fetched from backend
  activeGoal = null,      // Current active goal from backend
  onSelectGoal = null,    // Callback function when user chooses a goal
  studentProfile = null   // Logged-in student profile for recommendations
}) => {
  const [selectedNode, setSelectedNode] = useState('c10');
  const [activePath, setActivePath] = useState(['c10']);
  
  // Pan and Zoom states
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 30, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef(null);

  // Clean breadcrumb text based on the active trail
  const getBreadcrumbs = () => {
    return activePath.map(id => SKELETON_NODES[id]?.label || id);
  };

  // Re-adjust coordinates dynamically if a custom link is formed
  useEffect(() => {
    // Sync active path with selected node parent nodes recursively
    const path = [];
    let currentId = selectedNode;
    while (currentId) {
      path.unshift(currentId);
      currentId = SKELETON_NODES[currentId]?.parentId;
    }
    setActivePath(path);
  }, [selectedNode]);

  // Adjust zoom for mobile screen sizes
  useEffect(() => {
    if (window.innerWidth < 768) {
      setZoom(0.5);
      setPan({ x: 10, y: 50 });
    }
  }, []);

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
    
    // If the node is not visible, it shouldn't render at all
    if (!isNodeVisible(nodeId)) return true;
    
    // If we have selected nodes, and this node is not part of the active path,
    // and it is not a direct child of the selected node, fade it
    const isSelectedOrParent = activePath.includes(nodeId);
    const isDirectChild = node.parentId === selectedNode;
    
    return !isSelectedOrParent && !isDirectChild;
  };

  // Helper to draw connection S-curves (Metro Line style)
  const drawConnector = (parentId, childId) => {
    const parent = SKELETON_NODES[parentId];
    const child = SKELETON_NODES[childId];
    if (!parent || !child) return null;
    
    const start = getNodeCoords(parent.col, parent.row);
    const end = getNodeCoords(child.col, child.row);
    
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
        {/* Glow backdrop path for active route */}
        {isLineActive && (
          <path
            d={pathData}
            fill="none"
            stroke={child.color}
            strokeWidth="10"
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
  const handleReset = () => {
    setZoom(window.innerWidth < 768 ? 0.5 : 0.85);
    setPan(window.innerWidth < 768 ? { x: 10, y: 50 } : { x: 30, y: 0 });
  };
  const handleFitView = () => {
    // Fits view on currently selected node
    const node = SKELETON_NODES[selectedNode];
    if (node) {
      const coords = getNodeCoords(node.col, node.row);
      const containerWidth = containerRef.current?.clientWidth || 800;
      const containerHeight = containerRef.current?.clientHeight || 500;
      setPan({
        x: containerWidth / 2 - coords.x * zoom,
        y: containerHeight / 2 - coords.y * zoom
      });
    }
  };

  // Mouse pan handlers
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

  // Touch pan handlers
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

  // Breadcrumb click rollback
  const handleBreadcrumbClick = (id) => {
    setSelectedNode(id);
  };

  // Merge database pathway info matching this node id
  const getMergedNodeDetails = () => {
    const staticNode = SKELETON_NODES[selectedNode];
    if (!staticNode) return null;

    // Look for matching pathway in dynamic database parameters
    const matchedPathway = pathwaysData.find(p => 
      p.id.toLowerCase() === selectedNode.toLowerCase() || 
      (selectedNode === 'puc-science' && p.id === 'puc-science-eng') || 
      (selectedNode === 'puc-commerce' && p.id === 'puc-commerce-fin') ||
      (selectedNode === 'puc-arts' && p.id === 'puc-arts-hum')
    );

    return {
      ...staticNode,
      duration: matchedPathway?.duration || staticNode.duration || '',
      category: matchedPathway?.category || staticNode.category || '',
      description: matchedPathway?.description || staticNode.desc,
      options: matchedPathway?.options || [],
      milestones: matchedPathway?.milestones || [],
      originalPathway: matchedPathway
    };
  };

  const details = getMergedNodeDetails();

  // Highlight recommended nodes based on profile
  const isRecommended = (nodeId) => {
    if (!studentProfile) return false;
    const node = SKELETON_NODES[nodeId];
    if (!node) return false;

    // Match profile stream preference
    if (nodeId === 'puc' && studentProfile.current_level?.includes('Class 10')) return true;
    if (nodeId === 'puc-science' && studentProfile.stream === 'Science') return true;
    if (nodeId === 'puc-commerce' && studentProfile.stream === 'Commerce') return true;
    if (nodeId === 'puc-arts' && studentProfile.stream === 'Arts') return true;
    
    // Deep combination matches
    if (nodeId === 'puc-science-pcmc' && studentProfile.stream === 'Science' && studentProfile.class_or_year?.includes('PCMC')) return true;
    if (nodeId === 'puc-science-pcmb' && studentProfile.stream === 'Science' && studentProfile.class_or_year?.includes('PCMB')) return true;
    
    return false;
  };

  return (
    <div className="w-full flex flex-col gap-6 font-sans">
      
      {/* 1. Breadcrumbs / Current Active Trail */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-4 py-3 rounded-2xl text-[11px] font-extrabold text-slate-500 shadow-3xs overflow-x-auto">
        <span className="text-[#005F60] font-black uppercase tracking-wider flex items-center gap-1 shrink-0">
          <Compass className="w-3.5 h-3.5" />
          <span>Active Explorer Route:</span>
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
                onClick={() => handleBreadcrumbClick(nodeId)}
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

      {/* Main split display: Map Left, Detail Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* 2. Visual Metro Map Canvas (Col span 7) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          
          {/* Controls Bar */}
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#005F60]" />
              <span>Double-click or drag to explore tree</span>
            </span>
            
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-3xs">
              <button 
                type="button" 
                onClick={handleZoomIn} 
                title="Zoom In"
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition cursor-pointer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button 
                type="button" 
                onClick={handleZoomOut} 
                title="Zoom Out"
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition cursor-pointer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button 
                type="button" 
                onClick={handleFitView} 
                title="Fit to Selected Node"
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition cursor-pointer"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button 
                type="button" 
                onClick={handleReset} 
                title="Reset View"
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition cursor-pointer border-l border-slate-100 pl-2"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* SVG Map Container */}
          <div 
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
            className="w-full h-[520px] bg-slate-55 border border-slate-200/80 rounded-3xl overflow-hidden relative shadow-inner cursor-grab active:cursor-grabbing select-none"
            style={{ backgroundColor: '#F8FAF8' }}
          >
            {/* Visual indicators */}
            <div className="absolute top-4 left-4 bg-white/95 border border-slate-200/90 rounded-2xl p-3 shadow-sm z-10 space-y-1.5 pointer-events-none">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#005F60]" />
                <span className="text-[10px] font-black text-slate-700">Science Stream</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#F97316]" />
                <span className="text-[10px] font-black text-slate-700">Commerce Stream</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#8B5CF6]" />
                <span className="text-[10px] font-black text-slate-700">Arts Stream</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#0EA5E9]" />
                <span className="text-[10px] font-black text-slate-700">Polytechnic Diploma</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#10B981]" />
                <span className="text-[10px] font-black text-slate-700">ITI Vocational Trade</span>
              </div>
            </div>

            {/* SVG Visualizer */}
            <svg 
              className="w-full h-full"
              style={{ pointerEvents: 'auto' }}
            >
              {/* Grid backdrop details */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2E8F0" strokeWidth="0.5" strokeOpacity="0.45" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Matrix scale group */}
              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`} className="transition-transform duration-75">
                
                {/* A. DRAW BACKDROP CONNECTION LINES */}
                {Object.values(SKELETON_NODES).map((node) => {
                  if (node.parentId && isNodeVisible(node.id)) {
                    return drawConnector(node.parentId, node.id);
                  }
                  return null;
                })}

                {/* B. DRAW METRO STATION NODES */}
                {Object.values(SKELETON_NODES).map((node) => {
                  if (!isNodeVisible(node.id)) return null;

                  const coords = getNodeCoords(node.col, node.row);
                  const isSelected = selectedNode === node.id;
                  const isFaded = isNodeFaded(node.id);
                  const hasRecommendation = isRecommended(node.id);

                  return (
                    <g 
                      key={node.id} 
                      transform={`translate(${coords.x}, ${coords.y})`}
                      onClick={() => setSelectedNode(node.id)}
                      className={cn(
                        "cursor-pointer group transition-all duration-300",
                        isFaded ? "opacity-35 hover:opacity-70" : "opacity-100"
                      )}
                    >
                      {/* Active Ring Outer glow */}
                      {isSelected && (
                        <circle 
                          r="19" 
                          fill="none" 
                          stroke={node.color} 
                          strokeWidth="3" 
                          className="animate-pulse"
                          strokeOpacity="0.4"
                        />
                      )}

                      {/* Recommend Outer Ring */}
                      {hasRecommendation && !isSelected && (
                        <circle
                          r="17"
                          fill="none"
                          stroke="#F97316"
                          strokeWidth="2.5"
                          strokeDasharray="3 2"
                        />
                      )}

                      {/* Outer station ring */}
                      <circle 
                        r="14" 
                        fill="#FFFFFF" 
                        stroke={isSelected ? '#F97316' : node.color} 
                        strokeWidth={isSelected ? '4' : '2.5'} 
                        className="transition-all duration-200 shadow-sm"
                      />

                      {/* Inner station core point */}
                      <circle 
                        r="6" 
                        fill={isSelected ? '#F97316' : node.color} 
                        className="transition-all duration-200"
                      />

                      {/* Flag Label text */}
                      <text
                        y="30"
                        textAnchor="middle"
                        className={cn(
                          "text-[10px] font-extrabold select-none pointer-events-none transition-all duration-200 fill-slate-800",
                          isSelected ? "fill-[#005F60] font-black scale-105" : ""
                        )}
                      >
                        {node.label}
                      </text>

                      {/* You are Here indicator for Class 10 */}
                      {node.id === 'c10' && (
                        <g transform="translate(0, -28)">
                          {/* Pulsing indicator tag */}
                          <rect
                            x="-32"
                            y="-9"
                            width="64"
                            height="18"
                            rx="6"
                            fill="#F97316"
                            className="shadow-md"
                          />
                          <text
                            y="3"
                            textAnchor="middle"
                            fill="#FFFFFF"
                            className="text-[9px] font-black uppercase tracking-wider"
                          >
                            You Are Here
                          </text>
                        </g>
                      )}

                      {/* Recommended badge indicator */}
                      {hasRecommendation && (
                        <g transform="translate(0, -28)">
                          <rect
                            x="-34"
                            y="-9"
                            width="68"
                            height="18"
                            rx="6"
                            fill="#005F60"
                            className="shadow-sm"
                          />
                          <text
                            y="3"
                            textAnchor="middle"
                            fill="#FFFFFF"
                            className="text-[8px] font-black uppercase tracking-wider"
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

        {/* 3. Station Detail Information Panel (Col span 5) */}
        <div className="lg:col-span-5">
          {details ? (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
              
              {/* Header Title */}
              <div className="border-b border-slate-100 pb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider bg-teal-50 border border-teal-200 text-[#005F60] px-2.5 py-0.5 rounded-md">
                    {details.category || 'Educational Station'}
                  </span>
                  {details.duration && (
                    <span className="text-[10px] font-extrabold text-[#F97316] bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                      {details.duration}
                    </span>
                  )}
                </div>
                
                <h3 className="text-lg font-black text-[#0F172A] tracking-tight">
                  {details.label}
                </h3>
                
                <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                  {details.description}
                </p>

                {details.isCareer && (
                  <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 font-bold">
                    <span>Est. Career Salary:</span>
                    <span className="text-[#F97316] font-black">{details.salary}</span>
                  </div>
                )}
              </div>

              {/* Specific Combinations/Streams options under this selected node */}
              {details.options.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] uppercase font-black tracking-wider text-[#005F60] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Choices Inside This Route ({details.options.length})</span>
                  </h4>
                  
                  <div className="grid grid-cols-1 gap-2.5">
                    {details.options.map((opt) => (
                      <div 
                        key={opt.id || opt.option_name}
                        className="bg-[#F8FAF8] border border-slate-200/80 rounded-xl p-3.5 space-y-1.5 transition-all hover:bg-white hover:border-[#005F60]/50"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-extrabold text-xs text-slate-900 leading-snug">
                            {opt.option_name}
                          </span>
                          {opt.stream_or_code && (
                            <span className="text-[9px] font-mono font-black text-[#005F60] bg-teal-100/60 px-1.5 py-0.5 rounded">
                              {opt.stream_or_code}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 leading-normal font-medium">
                          {opt.description}
                        </p>
                        {opt.eligibility && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-600 font-bold">
                            <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>Eligibility: {opt.eligibility}</span>
                          </span>
                        )}

                        {/* Interactive goal setting in explorer mode */}
                        {mode === 'FullExplorer' && onSelectGoal && (
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => onSelectGoal(details.originalPathway || details, opt)}
                              className="inline-flex items-center gap-1 bg-orange-50 hover:bg-orange-100 text-[#F97316] border border-orange-200 font-extrabold text-[10px] px-2.5 py-1.5 rounded-lg transition"
                            >
                              <Target className="w-3 h-3" />
                              <span>Set as Active Career Goal</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Steps / Milestones Trail if applicable */}
              {details.milestones.length > 0 && (
                <div className="space-y-3.5 pt-2">
                  <h4 className="text-[10px] uppercase font-black tracking-wider text-[#F97316] flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5" />
                    <span>Udaan Preparation Trail ({details.milestones.length} Steps)</span>
                  </h4>
                  
                  <div className="relative space-y-3 before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200/80 before:z-0">
                    {details.milestones.map((ms) => (
                      <div key={ms.id || ms.step_number} className="relative z-10 flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#005F60] text-white flex items-center justify-center font-black text-[10px] shrink-0 shadow-xs ring-4 ring-white">
                          {ms.step_number}
                        </div>
                        
                        <div className="bg-[#F8FAF8] border border-slate-200/80 rounded-xl p-3 flex-1 space-y-1">
                          <h5 className="font-extrabold text-[11px] text-slate-800">
                            {ms.title}
                          </h5>
                          <p className="text-[11px] text-slate-500 leading-normal font-medium">
                            {ms.description}
                          </p>
                          {ms.key_action && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-[#005F60] font-black pt-0.5">
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

              {/* Public preview CTA / Redirect logic */}
              {mode === 'PublicPreview' && (
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => onSelectGoal && onSelectGoal()}
                    className="w-full bg-[#005F60] hover:bg-teal-800 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs transition-all shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <span>Log In to Customize This Pathway</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}

            </div>
          ) : (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-8 text-center text-slate-400 space-y-2">
              <Compass className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-bold">Select any metro station waypoint on the left map to explore its milestones, courses, and jobs.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default EducationPathwayMap;
