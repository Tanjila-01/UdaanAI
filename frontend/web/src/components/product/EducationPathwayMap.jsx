import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Compass, 
  ZoomIn, 
  ZoomOut,
  Maximize2,
  RotateCcw,
  Sparkles,
  ChevronRight
} from 'lucide-react';

// Comprehensive mapping between API pathway IDs and structural visual map node IDs
export const PATHWAY_ID_TO_NODE_MAP = {
  'c10-puc': 'puc',
  'c10-diploma': 'diploma',
  'c10-iti': 'iti',
  'puc-science': 'puc-science',
  'puc-commerce': 'puc-commerce',
  'puc-arts': 'puc-arts',
  'puc-science-pcmb': 'puc-science',
  'puc-science-pcmc': 'puc-science',
  'puc-science-pcme': 'puc-science',
  'puc-commerce-fin': 'puc-commerce',
  'puc-arts-hum': 'puc-arts',
  'dip-family-comp': 'dip-family-comp',
  'dip-family-elec': 'dip-family-elec',
  'dip-family-mech': 'dip-family-mech',
  'dip-family-civil': 'dip-family-civil',
  'iti-family-elec': 'iti-family-elec',
  'iti-family-mech': 'iti-family-mech',
  'iti-family-comp': 'iti-family-comp',

  // Choice direction pathways map to their structural stream parent
  'puc-science-med': 'puc-science',
  'puc-science-ayush': 'puc-science',
  'puc-science-pure': 'puc-science',
  'puc-science-allied': 'puc-science',
  'puc-science-pharm': 'puc-science',
  'puc-science-agri': 'puc-science',
  'puc-science-vet': 'puc-science',
  'puc-science-eng': 'puc-science',
  'puc-science-comp': 'puc-science',
  'puc-science-arch': 'puc-science',
  'puc-science-cse-careers': 'puc-science',
  'puc-commerce-ca': 'puc-commerce',
  'puc-arts-media': 'puc-arts',
  'puc-arts-bsw': 'puc-arts',
  'puc-arts-edu': 'puc-arts',
  'cross-law': 'puc-arts',
  'cross-design': 'puc-arts',
  'cross-hospitality': 'puc-commerce'
};

export const getVisualNodeId = (pathwayId) => {
  if (!pathwayId) return null;
  return PATHWAY_ID_TO_NODE_MAP[pathwayId] || pathwayId;
};

// Structural Nodes Layout Definition
export const STRUCTURAL_NODES = {
  // Stage 0: Foundation
  'c10': { 
    id: 'c10', 
    label: 'Class 10 / SSLC', 
    subLabel: 'Secondary Completion',
    stage: 0,
    type: 'root', 
    color: '#005F60', 
    pathwayId: null 
  },
  
  // Stage 1: Main Routes
  'puc': { 
    id: 'puc', 
    label: 'PUC (11th & 12th)', 
    subLabel: 'Pre-University Academic',
    parentId: 'c10', 
    stage: 1,
    type: 'route', 
    color: '#005F60', 
    pathwayId: 'c10-puc' 
  },
  'diploma': { 
    id: 'diploma', 
    label: 'Polytechnic Diploma', 
    subLabel: '3-Year Technical DTE',
    parentId: 'c10', 
    stage: 1,
    type: 'route', 
    color: '#0EA5E9', 
    pathwayId: 'c10-diploma' 
  },
  'iti': { 
    id: 'iti', 
    label: 'ITI Vocational Trades', 
    subLabel: '1-2 Year Vocational Skills',
    parentId: 'c10', 
    stage: 1,
    type: 'route', 
    color: '#F59E0B', 
    pathwayId: 'c10-iti' 
  },

  // Stage 2: Streams & Discipline Families
  // PUC Streams
  'puc-science': { 
    id: 'puc-science', 
    label: 'Science Stream', 
    subLabel: 'STEM & Medical Foundations',
    parentId: 'puc', 
    stage: 2,
    type: 'stream', 
    color: '#005F60', 
    pathwayId: 'puc-science' 
  },
  'puc-commerce': { 
    id: 'puc-commerce', 
    label: 'Commerce Stream', 
    subLabel: 'Business, Finance & Trade',
    parentId: 'puc', 
    stage: 2,
    type: 'stream', 
    color: '#005F60', 
    pathwayId: 'puc-commerce' 
  },
  'puc-arts': { 
    id: 'puc-arts', 
    label: 'Arts & Humanities', 
    subLabel: 'Social Sciences, Media & Law',
    parentId: 'puc', 
    stage: 2,
    type: 'stream', 
    color: '#005F60', 
    pathwayId: 'puc-arts' 
  },

  // Diploma Families
  'dip-family-comp': { 
    id: 'dip-family-comp', 
    label: 'Computing & Digital', 
    subLabel: 'Software & Cloud Networks',
    parentId: 'diploma', 
    stage: 2,
    type: 'family', 
    color: '#0EA5E9', 
    pathwayId: 'dip-family-comp' 
  },
  'dip-family-elec': { 
    id: 'dip-family-elec', 
    label: 'Electrical & Electronics', 
    subLabel: 'IoT, Circuits & Power Grid',
    parentId: 'diploma', 
    stage: 2,
    type: 'family', 
    color: '#0EA5E9', 
    pathwayId: 'dip-family-elec' 
  },
  'dip-family-mech': { 
    id: 'dip-family-mech', 
    label: 'Mechanical & Auto', 
    subLabel: 'CAD, Robotics & Engines',
    parentId: 'diploma', 
    stage: 2,
    type: 'family', 
    color: '#0EA5E9', 
    pathwayId: 'dip-family-mech' 
  },
  'dip-family-civil': { 
    id: 'dip-family-civil', 
    label: 'Civil & Infrastructure', 
    subLabel: 'Surveying & Smart Structures',
    parentId: 'diploma', 
    stage: 2,
    type: 'family', 
    color: '#0EA5E9', 
    pathwayId: 'dip-family-civil' 
  },

  // ITI Trades
  'iti-family-elec': { 
    id: 'iti-family-elec', 
    label: 'Electrical ITI Trades', 
    subLabel: 'Industrial Wiring & Motors',
    parentId: 'iti', 
    stage: 2,
    type: 'family', 
    color: '#F59E0B', 
    pathwayId: 'iti-family-elec' 
  },
  'iti-family-mech': { 
    id: 'iti-family-mech', 
    label: 'Mechanical & Fitter', 
    subLabel: 'Precision Lathe & Fabrication',
    parentId: 'iti', 
    stage: 2,
    type: 'family', 
    color: '#F59E0B', 
    pathwayId: 'iti-family-mech' 
  },
  'iti-family-comp': { 
    id: 'iti-family-comp', 
    label: 'COPA & Office ITI', 
    subLabel: 'Data & Digital Operations',
    parentId: 'iti', 
    stage: 2,
    type: 'family', 
    color: '#F59E0B', 
    pathwayId: 'iti-family-comp' 
  }
};

const EducationPathwayMap = ({
  selectedNodeId = null,
  onSelectNode,
  studentProfile,
  recommendations,
  compactMobile = false
}) => {
  // Viewport navigation state (Center View modifies pan/zoom without changing selections)
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Local selection state by stage
  // Stage 0: Always 'c10'
  // Stage 1: 'puc' | 'diploma' | 'iti' | null
  // Stage 2: stream/family ID | null
  const [selectedByStage, setSelectedByStage] = useState({
    0: 'c10',
    1: null,
    2: null
  });

  // Synchronize incoming prop `selectedNodeId` with internal stage selections
  useEffect(() => {
    if (!selectedNodeId || selectedNodeId === 'c10') {
      setSelectedByStage({
        0: 'c10',
        1: null,
        2: null
      });
      return;
    }

    const visualId = getVisualNodeId(selectedNodeId);
    const node = STRUCTURAL_NODES[visualId];

    if (!node) {
      setSelectedByStage({
        0: 'c10',
        1: null,
        2: null
      });
      return;
    }

    if (node.stage === 1) {
      setSelectedByStage({
        0: 'c10',
        1: node.id,
        2: null
      });
    } else if (node.stage === 2) {
      setSelectedByStage({
        0: 'c10',
        1: node.parentId,
        2: node.id
      });
    }
  }, [selectedNodeId]);

  // Viewport Configuration
  const svgWidth = 880;
  const svgHeight = 400;
  const cardWidth = 216;
  const cardHeight = 44;

  // Horizontal column anchor coordinates
  const colX = {
    0: 44,
    1: 330,
    2: 618
  };

  // Determine active Stage 1 route
  const activeStage1Id = selectedByStage[1];
  const activeStage2Id = selectedByStage[2];

  // Progressive visibility calculation
  // Stage 0: Always visible
  // Stage 1: Always visible
  // Stage 2: ONLY visible if a Stage 1 route is selected
  const visibleStage2Nodes = useMemo(() => {
    if (!activeStage1Id) return [];
    return Object.values(STRUCTURAL_NODES).filter(n => n.parentId === activeStage1Id);
  }, [activeStage1Id]);

  const isStage2Visible = visibleStage2Nodes.length > 0;

  // Fit the visible columns, including headings and card outlines.
  const visibleWidth = isStage2Visible ? svgWidth : colX[1] + cardWidth + 44;

  useEffect(() => {
    setPan({ x: 0, y: 0 });
    setZoomLevel(1);
  }, [activeStage1Id]);

  // Dynamic layout calculator based on visible nodes per column
  // Rather than static crowded coordinates, Y positions are calculated
  // with balanced spacing around parent routes to prevent overlaps, clipping, and large empty voids.
  const nodePositions = useMemo(() => {
    const posMap = {};

    // Stage 0: Class 10 / SSLC centered vertically in canvas
    posMap['c10'] = {
      x: colX[0],
      y: 200
    };

    // Stage 1: PUC, Diploma, ITI evenly balanced
    posMap['puc'] = {
      x: colX[1],
      y: 98
    };
    posMap['diploma'] = {
      x: colX[1],
      y: 200
    };
    posMap['iti'] = {
      x: colX[1],
      y: 302
    };

    // Stage 2: Dynamically spaced around the selected Stage 1 route
    if (isStage2Visible) {
      const count = visibleStage2Nodes.length;
      const parentPos = posMap[activeStage1Id] || { y: 200 };
      
      // Dynamic vertical step based on child count
      const gap = count >= 4 ? 66 : 74;
      const totalSpan = (count - 1) * gap;
      
      // Keep cards comfortably within canvas boundaries
      const minCenter = 56 + totalSpan / 2;
      const maxCenter = 344 - totalSpan / 2;
      const clampedCenter = Math.max(minCenter, Math.min(maxCenter, parentPos.y));
      const startY = clampedCenter - totalSpan / 2;

      visibleStage2Nodes.forEach((child, idx) => {
        posMap[child.id] = {
          x: colX[2],
          y: Math.round(startY + idx * gap)
        };
      });
    }

    return posMap;
  }, [activeStage1Id, isStage2Visible, visibleStage2Nodes]);

  // Set of node IDs currently on the active ancestry trail
  const activeTrailSet = useMemo(() => {
    const set = new Set();
    set.add('c10');
    if (activeStage1Id) set.add(activeStage1Id);
    if (activeStage2Id) set.add(activeStage2Id);
    return set;
  }, [activeStage1Id, activeStage2Id]);

  // Active selected node ID is the deepest selected node in the trail
  const currentActiveNodeId = activeStage2Id || activeStage1Id || 'c10';

  // Node selection handler with progressive reveal rules
  const handleSelectNode = (nodeId) => {
    const node = STRUCTURAL_NODES[nodeId];
    if (!node) return;

    if (node.stage === 0) {
      // Clicking Class 10 / SSLC returns to the initial state:
      // Clear selections and descendants beyond Stage 0, collapsing Stage 2
      setSelectedByStage({
        0: 'c10',
        1: null,
        2: null
      });
      if (onSelectNode) onSelectNode('c10');

      return;
    }

    if (node.stage === 1) {
      // Clicking a Stage 1 route reveals only its immediate children.
      // Switching routes clears all selections and descendants beyond Stage 1.
      setSelectedByStage({
        0: 'c10',
        1: node.id,
        2: null
      });
      if (onSelectNode) onSelectNode(node.id);

      return;
    }

    if (node.stage === 2) {
      // Clicking a Stage 2 node selects it as the active leaf
      setSelectedByStage({
        0: 'c10',
        1: node.parentId,
        2: node.id
      });
      if (onSelectNode) onSelectNode(node.id);
    }
  };

  // Center View: Adjusts zoom and pan to default without resetting pathway selections
  const handleCenterView = () => {
    setPan({ x: 0, y: 0 });
    setZoomLevel(1);
  };

  // Zoom controls
  const handleZoom = (delta) => {
    const maxZoom = containerRef.current?.clientWidth < 640 ? 4 : 1.4;
    setZoomLevel(prev => Math.min(Math.max(0.75, Math.round((prev + delta) * 10) / 10), maxZoom));
  };

  // Mouse drag pan handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
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

  // Touch drag pan handlers for mobile screens
  const touchStartRef = useRef({ x: 0, y: 0 });
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX - pan.x, y: touch.clientY - pan.y };
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPan({ x: touch.clientX - touchStartRef.current.x, y: touch.clientY - touchStartRef.current.y });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Connector calculation for all visible links
  const connectors = useMemo(() => {
    const lines = [];

    // Stage 0 -> Stage 1 links (c10 to puc, diploma, iti)
    const stage1Nodes = ['puc', 'diploma', 'iti'];
    const p0 = nodePositions['c10'];

    if (p0) {
      stage1Nodes.forEach(childId => {
        const p1 = nodePositions[childId];
        if (!p1) return;

        const isTrail = activeTrailSet.has('c10') && activeTrailSet.has(childId);
        const childNode = STRUCTURAL_NODES[childId];
        const x1 = p0.x + cardWidth;
        const y1 = p0.y;
        const x2 = p1.x;
        const y2 = p1.y;
        const dx = (x2 - x1) * 0.5;
        const pathD = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

        lines.push({
          id: `line-c10-${childId}`,
          fromId: 'c10',
          toId: childId,
          pathD,
          x1, y1, x2, y2,
          isTrail,
          color: childNode.color
        });
      });
    }

    // Stage 1 -> Stage 2 links (ONLY for the selected Stage 1 route to visible immediate children)
    if (isStage2Visible && activeStage1Id) {
      const parentPos = nodePositions[activeStage1Id];
      const parentNode = STRUCTURAL_NODES[activeStage1Id];

      if (parentPos) {
        visibleStage2Nodes.forEach(child => {
          const childPos = nodePositions[child.id];
          if (!childPos) return;

          const isTrail = activeTrailSet.has(activeStage1Id) && activeTrailSet.has(child.id);
          const x1 = parentPos.x + cardWidth;
          const y1 = parentPos.y;
          const x2 = childPos.x;
          const y2 = childPos.y;
          const dx = (x2 - x1) * 0.5;
          const pathD = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

          lines.push({
            id: `line-${activeStage1Id}-${child.id}`,
            fromId: activeStage1Id,
            toId: child.id,
            pathD,
            x1, y1, x2, y2,
            isTrail,
            color: parentNode.color
          });
        });
      }
    }

    return lines;
  }, [nodePositions, activeTrailSet, isStage2Visible, activeStage1Id, visibleStage2Nodes]);

  // List of all currently visible nodes
  const visibleNodeList = useMemo(() => {
    const list = [STRUCTURAL_NODES['c10'], STRUCTURAL_NODES['puc'], STRUCTURAL_NODES['diploma'], STRUCTURAL_NODES['iti']];
    if (isStage2Visible) {
      list.push(...visibleStage2Nodes);
    }
    return list;
  }, [isStage2Visible, visibleStage2Nodes]);

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-3 sm:p-4 shadow-xs flex flex-col space-y-2.5 font-sans select-none transition-colors duration-200">
      
      {/* Header & Zoom Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2.5">
        
        {/* Title, Compass & Short Instruction */}
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-teal-50 text-[#005F60] border border-teal-200/80 flex items-center justify-center font-black shrink-0">
            <Compass className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="font-black text-xs sm:text-sm text-slate-900 leading-none truncate">
                Structural Education Map
              </h3>
              {activeStage1Id && (
                <button
                  type="button"
                  onClick={() => handleSelectNode('c10')}
                  className="inline-flex items-center space-x-1 text-[10px] font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200/70 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                  title="Collapse branches and return to initial Class 10 view"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Reset to Class 10</span>
                </button>
              )}
            </div>
            {/* Required Instruction */}
            <p className="text-[11px] text-slate-500 font-medium leading-tight truncate mt-0.5">
              Select a route to explore your next steps.
            </p>
          </div>
        </div>

        {/* Toolbar Controls: Zoom In, Zoom Out, and Center View */}
        <div className="flex items-center space-x-1.5 shrink-0">
          <button
            type="button"
            onClick={handleCenterView}
            className="h-7 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center space-x-1 text-[11px] font-bold transition-colors cursor-pointer"
            title="Center View (adjust zoom & position without collapsing branches)"
            aria-label="Center View"
          >
            <Maximize2 className="w-3 h-3 text-slate-600" />
            <span className="hidden sm:inline">Center View</span>
          </button>
          
          <button
            type="button"
            onClick={() => handleZoom(0.15)}
            className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => handleZoom(-0.15)}
            className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SVG Canvas Box */}
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative bg-slate-50/70 border border-slate-200/80 rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing ${
          compactMobile ? "h-[260px] sm:h-[320px] lg:h-[370px]" : "h-[340px] sm:h-[380px] lg:h-[410px]"
        } flex items-center justify-center transition-colors duration-200`}
      >
        <svg 
          viewBox={`0 0 ${visibleWidth} ${svgHeight}`} 
          className="w-full h-full transition-transform duration-150 ease-out motion-reduce:transition-none"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})`,
            transformOrigin: 'center center'
          }}
        >
          <defs>
            {/* Theme & Animation Styles */}
            <style>{`
              @media (prefers-reduced-motion: reduce) {
                .animated-path, .animated-node, .branch-enter {
                  transition: none !important;
                  animation: none !important;
                }
              }
              .map-node:focus-visible {
                outline: none;
              }
              .map-node:focus-visible .node-card {
                stroke-width: 2.5px;
                stroke: #005F60 !important;
                filter: drop-shadow(0 0 6px rgba(0,95,96,0.35));
              }
              .branch-enter {
                animation: fadeInSlide 0.28s ease-out forwards;
              }
              @keyframes fadeInSlide {
                from { opacity: 0; transform: translateX(-14px); }
                to { opacity: 1; transform: translateX(0); }
              }
              :root[data-theme="dark"] .map-card-unselected {
                fill: #172334 !important;
                stroke: #334155 !important;
              }
              :root[data-theme="dark"] .map-card-trail {
                fill: #193338 !important;
                stroke: #005F60 !important;
              }
              :root[data-theme="dark"] .map-text-primary {
                fill: #E5EDF5 !important;
              }
              :root[data-theme="dark"] .map-text-sub {
                fill: #94A3B8 !important;
              }
              :root[data-theme="dark"] .map-header-text {
                fill: #94A3B8 !important;
              }
              :root[data-theme="dark"] .map-connector-inactive {
                stroke: #334155 !important;
              }
              :root[data-theme="dark"] .map-pin-inactive {
                fill: #475569 !important;
              }
            `}</style>
          </defs>

          {/* ========================================================= */}
          {/* STAGE COLUMN HEADERS (Stage 2 header revealed ONLY on click) */}
          {/* ========================================================= */}
          <g className="column-headers">
            <text 
              x={colX[0]} 
              y={22} 
              className="text-[10px] font-black fill-slate-400 map-header-text uppercase tracking-wider text-anchor-start"
            >
              STAGE 0 • FOUNDATION
            </text>
            
            <text 
              x={colX[1]} 
              y={22} 
              className="text-[10px] font-black fill-slate-400 map-header-text uppercase tracking-wider text-anchor-start"
            >
              STAGE 1 • MAIN ROUTES
            </text>

            {/* Revealed only when a Stage 1 route is clicked */}
            {isStage2Visible && (
              <text 
                x={colX[2]} 
                y={22} 
                className="text-[10px] font-black fill-[#005F60] map-header-text uppercase tracking-wider text-anchor-start transition-opacity duration-300"
              >
                {activeStage1Id === 'puc' 
                  ? 'STAGE 2 • PUC STREAMS' 
                  : activeStage1Id === 'diploma' 
                    ? 'STAGE 2 • DIPLOMA FAMILIES' 
                    : 'STAGE 2 • VOCATIONAL TRADES'}
              </text>
            )}
          </g>

          {/* ========================================================= */}
          {/* SMOOTH CURVED CONNECTORS */}
          {/* ========================================================= */}
          <g className="connectors">
            {connectors.map((c) => {
              return (
                <g key={c.id}>
                  {/* Glowing halo for active ancestry path */}
                  {c.isTrail && (
                    <path
                      d={c.pathD}
                      fill="none"
                      stroke={c.color}
                      strokeWidth={7}
                      strokeOpacity={0.18}
                      strokeLinecap="round"
                      className="animated-path transition-all duration-300"
                    />
                  )}

                  {/* Main connector curve */}
                  <path
                    d={c.pathD}
                    fill="none"
                    stroke={c.isTrail ? c.color : '#CBD5E1'}
                    strokeWidth={c.isTrail ? 3.0 : 1.6}
                    strokeDasharray={c.isTrail ? 'none' : '4 4'}
                    strokeLinecap="round"
                    className={`animated-path transition-all duration-300 ${c.isTrail ? '' : 'map-connector-inactive'}`}
                  />

                  {/* Anchor origin and destination pin dots */}
                  <circle
                    cx={c.x1}
                    cy={c.y1}
                    r={c.isTrail ? 3.5 : 2.5}
                    fill={c.isTrail ? c.color : '#94A3B8'}
                    className={`transition-all duration-300 ${c.isTrail ? '' : 'map-pin-inactive'}`}
                  />
                  <circle
                    cx={c.x2}
                    cy={c.y2}
                    r={c.isTrail ? 3.5 : 2.5}
                    fill={c.isTrail ? c.color : '#94A3B8'}
                    className={`transition-all duration-300 ${c.isTrail ? '' : 'map-pin-inactive'}`}
                  />
                </g>
              );
            })}
          </g>

          {/* ========================================================= */}
          {/* PROGRESSIVE CARDS & NODES */}
          {/* ========================================================= */}
          <g className="nodes">
            {visibleNodeList.map((node) => {
              const pos = nodePositions[node.id];
              if (!pos) return null;

              const isDirectlySelected = currentActiveNodeId === node.id;
              const isInAncestryTrail = activeTrailSet.has(node.id);
              const isRouteBranch = node.stage === 1;
              const isExpandedRoute = isRouteBranch && activeStage1Id === node.id;

              // Node pill styling
              const routeColor = node.color || '#005F60';

              return (
                <g 
                  key={node.id} 
                  transform={`translate(${pos.x}, ${pos.y})`}
                  tabIndex={0}
                  role="button"
                  aria-label={`Explore ${node.label}${isDirectlySelected ? ', selected' : ''}`}
                  aria-expanded={node.stage === 0 ? Boolean(activeStage1Id) : isRouteBranch ? isExpandedRoute : undefined}
                  aria-selected={isDirectlySelected}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectNode(node.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectNode(node.id);
                    }
                  }}
                  className="map-node cursor-pointer group outline-none select-none"
                >
                  {/* Animate inside the positioned group so CSS transforms cannot replace its SVG translation. */}
                  <g className={node.stage === 2 ? 'branch-enter' : undefined}>
                  {/* Selected Outer Glow Pill */}
                  {isDirectlySelected && (
                    <rect
                      x="-5"
                      y="-26"
                      width={cardWidth + 10}
                      height={cardHeight + 8}
                      rx="16"
                      fill={routeColor}
                      fillOpacity="0.14"
                      stroke={routeColor}
                      strokeWidth="2"
                      className="animated-node transition-all duration-300"
                    />
                  )}

                  {/* Main Node Card Pill */}
                  <rect
                    x="0"
                    y="-22"
                    width={cardWidth}
                    height={cardHeight}
                    rx="12"
                    fill={isDirectlySelected ? routeColor : isInAncestryTrail ? '#F8FAF8' : '#FFFFFF'}
                    stroke={isDirectlySelected ? routeColor : isInAncestryTrail ? routeColor : '#E2E8F0'}
                    strokeWidth={isDirectlySelected || isInAncestryTrail ? 2 : 1}
                    className={`node-card transition-all duration-200 shadow-2xs group-hover:stroke-[#005F60] group-hover:shadow-xs ${
                      isDirectlySelected ? '' : (isInAncestryTrail ? 'map-card-trail' : 'map-card-unselected')
                    }`}
                  />

                  {/* Route Accent Badge Circle */}
                  <circle
                    cx="18"
                    cy="0"
                    r="8.5"
                    fill={isDirectlySelected ? '#FFFFFF' : routeColor}
                    className="transition-all duration-200"
                  />

                  {/* Inner Status Indicator Dot */}
                  <circle
                    cx="18"
                    cy="0"
                    r="3.5"
                    fill={isDirectlySelected ? routeColor : '#FFFFFF'}
                    className="transition-all duration-200"
                  />

                  {/* Primary Label */}
                  <text
                    x="34"
                    y="-3"
                    className={`text-[11.5px] font-black transition-colors ${
                      isDirectlySelected ? 'fill-white' : 'fill-slate-900 map-text-primary group-hover:fill-[#005F60]'
                    }`}
                  >
                    {node.label}
                  </text>

                  {/* Subtitle / Metadata Label */}
                  <text
                    x="34"
                    y="10"
                    className={`text-[9px] font-bold ${
                      isDirectlySelected ? 'fill-white/85' : 'fill-slate-400 map-text-sub'
                    }`}
                  >
                    {node.subLabel}
                  </text>

                  {/* Branch Expansion Cue Indicator for Stage 1 Routes */}
                  {isRouteBranch && (
                    <g transform={`translate(${cardWidth - 20}, -4)`}>
                      <circle
                        cx="4"
                        cy="4"
                        r="8"
                        fill={isExpandedRoute ? (isDirectlySelected ? 'rgba(255,255,255,0.2)' : routeColor) : '#F1F5F9'}
                        className="transition-colors duration-200"
                      />
                      <path
                        d="M 2 1 L 6 4 L 2 7"
                        fill="none"
                        stroke={isExpandedRoute ? '#FFFFFF' : '#64748B'}
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transition-colors duration-200"
                      />
                    </g>
                  )}
                  </g>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

    </div>
  );
};

export default EducationPathwayMap;
