import React, { useState, useRef } from 'react';
import { 
  Compass, 
  ZoomIn, 
  ZoomOut
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
  if (!pathwayId) return 'c10';
  return PATHWAY_ID_TO_NODE_MAP[pathwayId] || pathwayId;
};

// Simplified 3-Column Structural Nodes Layout Definition (14 Nodes Total)
export const STRUCTURAL_NODES = {
  // Column 0: Foundation
  'c10': { 
    id: 'c10', 
    label: 'Class 10 / SSLC', 
    subLabel: 'Secondary Completion',
    col: 0, row: 2.2, 
    type: 'root', 
    color: '#005F60', 
    pathwayId: null 
  },
  
  // Column 1: Main Routes
  'puc': { 
    id: 'puc', 
    label: 'PUC (11th & 12th)', 
    subLabel: 'Pre-University Academic',
    parentId: 'c10', 
    col: 1, row: 1.0, 
    type: 'route', 
    color: '#005F60', 
    pathwayId: 'c10-puc' 
  },
  'diploma': { 
    id: 'diploma', 
    label: 'Polytechnic Diploma', 
    subLabel: '3-Year Technical DTE',
    parentId: 'c10', 
    col: 1, row: 2.5, 
    type: 'route', 
    color: '#0EA5E9', 
    pathwayId: 'c10-diploma' 
  },
  'iti': { 
    id: 'iti', 
    label: 'ITI Vocational Trades', 
    subLabel: '1-2 Year Vocational Skills',
    parentId: 'c10', 
    col: 1, row: 3.8, 
    type: 'route', 
    color: '#F59E0B', 
    pathwayId: 'c10-iti' 
  },

  // Column 2: Streams & Discipline Families (Graph Endpoints)
  'puc-science': { 
    id: 'puc-science', 
    label: 'Science Stream', 
    subLabel: 'STEM Foundations',
    parentId: 'puc', 
    col: 2, row: 0.6, 
    type: 'stream', 
    color: '#005F60', 
    pathwayId: 'puc-science' 
  },
  'puc-commerce': { 
    id: 'puc-commerce', 
    label: 'Commerce Stream', 
    subLabel: 'Business & Finance',
    parentId: 'puc', 
    col: 2, row: 1.2, 
    type: 'stream', 
    color: '#005F60', 
    pathwayId: 'puc-commerce' 
  },
  'puc-arts': { 
    id: 'puc-arts', 
    label: 'Arts & Humanities', 
    subLabel: 'Social Sciences & Law',
    parentId: 'puc', 
    col: 2, row: 1.8, 
    type: 'stream', 
    color: '#005F60', 
    pathwayId: 'puc-arts' 
  },

  'dip-family-comp': { 
    id: 'dip-family-comp', 
    label: 'Computing & Digital', 
    subLabel: 'Software & Networks',
    parentId: 'diploma', 
    col: 2, row: 2.2, 
    type: 'family', 
    color: '#0EA5E9', 
    pathwayId: 'dip-family-comp' 
  },
  'dip-family-elec': { 
    id: 'dip-family-elec', 
    label: 'Electrical & Electronics', 
    subLabel: 'IoT & Power Grid',
    parentId: 'diploma', 
    col: 2, row: 2.7, 
    type: 'family', 
    color: '#0EA5E9', 
    pathwayId: 'dip-family-elec' 
  },
  'dip-family-mech': { 
    id: 'dip-family-mech', 
    label: 'Mechanical & Auto', 
    subLabel: 'CAD & Robotics',
    parentId: 'diploma', 
    col: 2, row: 3.2, 
    type: 'family', 
    color: '#0EA5E9', 
    pathwayId: 'dip-family-mech' 
  },
  'dip-family-civil': { 
    id: 'dip-family-civil', 
    label: 'Civil & Infrastructure', 
    subLabel: 'Surveying & Structural',
    parentId: 'diploma', 
    col: 2, row: 3.7, 
    type: 'family', 
    color: '#0EA5E9', 
    pathwayId: 'dip-family-civil' 
  },

  'iti-family-elec': { 
    id: 'iti-family-elec', 
    label: 'Electrical ITI Trades', 
    subLabel: 'Wiring & Motors',
    parentId: 'iti', 
    col: 2, row: 4.1, 
    type: 'family', 
    color: '#F59E0B', 
    pathwayId: 'iti-family-elec' 
  },
  'iti-family-mech': { 
    id: 'iti-family-mech', 
    label: 'Mechanical & Fitter', 
    subLabel: 'Lathe & Fabrication',
    parentId: 'iti', 
    col: 2, row: 4.6, 
    type: 'family', 
    color: '#F59E0B', 
    pathwayId: 'iti-family-mech' 
  },
  'iti-family-comp': { 
    id: 'iti-family-comp', 
    label: 'COPA & Office ITI', 
    subLabel: 'Digital Operations',
    parentId: 'iti', 
    col: 2, row: 5.1, 
    type: 'family', 
    color: '#F59E0B', 
    pathwayId: 'iti-family-comp' 
  }
};

const EducationPathwayMap = ({
  selectedNodeId = 'puc-science',
  onSelectNode,
  studentProfile,
  recommendations
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Compact 3-Column SVG Viewport Configuration
  const width = 820;
  const height = 400;
  const colWidth = 270;
  const rowHeight = 68;
  const startX = 60;
  const startY = 28;

  const getNodePos = (node) => {
    return {
      x: startX + node.col * colWidth,
      y: startY + node.row * rowHeight
    };
  };

  // Active ancestry trail
  const activeTrailSet = new Set();
  let curr = STRUCTURAL_NODES[selectedNodeId] || STRUCTURAL_NODES[getVisualNodeId(selectedNodeId)];
  while (curr) {
    activeTrailSet.add(curr.id);
    curr = STRUCTURAL_NODES[curr.parentId];
  }

  const handleZoom = (delta) => {
    setZoomLevel(prev => Math.min(Math.max(0.8, prev + delta), 1.3));
  };

  const handleMouseDown = (e) => {
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

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-4 shadow-xs flex flex-col space-y-2.5 font-sans select-none">
      
      {/* Header & Zoom Toolbar (No diagonal expand icon, no duplicate reset) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2.5">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-xl bg-teal-50 text-[#005F60] border border-teal-200/80 flex items-center justify-center font-black">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-black text-xs sm:text-sm text-slate-900 leading-none">
              Structural Education Map
            </h3>
            <span className="text-[10px] text-slate-500 font-semibold">
              Click a stream or family to explore choices below
            </span>
          </div>
        </div>

        {/* Toolbar: ONLY Zoom In & Zoom Out */}
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={() => handleZoom(0.1)}
            className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleZoom(-0.1)}
            className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SVG Canvas Box (Compact 3-Column Height) */}
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="relative bg-slate-50/70 border border-slate-200/80 rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing h-[340px] flex items-center justify-center"
      >
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-full transition-transform duration-100 ease-out"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})`,
            transformOrigin: 'center center'
          }}
        >
          {/* Column Header Titles */}
          <text x={startX + 0 * colWidth} y={18} className="text-[10px] font-black fill-slate-400 uppercase tracking-wider text-anchor-start">
            STAGE 0 • FOUNDATION
          </text>
          <text x={startX + 1 * colWidth} y={18} className="text-[10px] font-black fill-slate-400 uppercase tracking-wider text-anchor-start">
            STAGE 1 • MAIN ROUTES
          </text>
          <text x={startX + 2 * colWidth} y={18} className="text-[10px] font-black fill-slate-400 uppercase tracking-wider text-anchor-start">
            STAGE 2 • STREAMS & FAMILIES
          </text>

          {/* Smooth Bezier Connectors */}
          <g className="connectors">
            {Object.values(STRUCTURAL_NODES).map((node) => {
              if (!node.parentId) return null;
              const parent = STRUCTURAL_NODES[node.parentId];
              if (!parent) return null;

              const posFrom = getNodePos(parent);
              const posTo = getNodePos(node);
              const isTrailActive = activeTrailSet.has(node.id) && activeTrailSet.has(parent.id);

              const dx = (posTo.x - posFrom.x) * 0.5;
              const pathD = `M ${posFrom.x + 95} ${posFrom.y} C ${posFrom.x + 95 + dx} ${posFrom.y}, ${posTo.x - dx} ${posTo.y}, ${posTo.x - 10} ${posTo.y}`;

              return (
                <path
                  key={`line-${parent.id}-${node.id}`}
                  d={pathD}
                  fill="none"
                  stroke={isTrailActive ? '#005F60' : '#CBD5E1'}
                  strokeWidth={isTrailActive ? 3.2 : 1.6}
                  strokeDasharray={isTrailActive ? 'none' : '4 4'}
                  className="transition-all duration-300"
                />
              );
            })}
          </g>

          {/* SVG Nodes */}
          <g className="nodes">
            {Object.values(STRUCTURAL_NODES).map((node) => {
              const pos = getNodePos(node);
              const visualSelected = getVisualNodeId(selectedNodeId);
              const isSelected = visualSelected === node.id;
              const isInTrail = activeTrailSet.has(node.id);

              return (
                <g 
                  key={node.id} 
                  transform={`translate(${pos.x}, ${pos.y})`}
                  tabIndex={0}
                  role="button"
                  aria-label={`Explore ${node.label}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectNode) onSelectNode(node.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (onSelectNode) onSelectNode(node.id);
                    }
                  }}
                  className="cursor-pointer group outline-none focus-visible:ring-2 focus-visible:ring-[#005F60] focus-visible:ring-offset-2 rounded-xl"
                >
                  {/* Outer Glow for Selected Node */}
                  {isSelected && (
                    <rect
                      x="-6"
                      y="-20"
                      width="192"
                      height="40"
                      rx="14"
                      fill="#005F60"
                      fillOpacity="0.12"
                      stroke="#005F60"
                      strokeWidth="2"
                    />
                  )}

                  {/* Main Node Pill */}
                  <rect
                    x="0"
                    y="-16"
                    width="180"
                    height="32"
                    rx="10"
                    fill={isSelected ? '#005F60' : (isInTrail ? '#F8FAF8' : '#FFFFFF')}
                    stroke={isSelected ? '#005F60' : (isInTrail ? '#005F60' : '#E2E8F0')}
                    strokeWidth={isSelected || isInTrail ? 2 : 1}
                    className="transition-all duration-200 shadow-2xs group-hover:stroke-[#005F60] group-hover:shadow-xs"
                  />

                  {/* Node Circle Badge */}
                  <circle
                    cx="16"
                    cy="0"
                    r="8"
                    fill={isSelected ? '#FFFFFF' : node.color}
                  />

                  {/* Inner Dot */}
                  <circle
                    cx="16"
                    cy="0"
                    r="3.5"
                    fill={isSelected ? '#005F60' : '#FFFFFF'}
                  />

                  {/* Label Text */}
                  <text
                    x="30"
                    y="-2"
                    className={`text-[10.5px] font-black transition-colors ${
                      isSelected ? 'fill-white' : 'fill-slate-900 group-hover:fill-[#005F60]'
                    }`}
                  >
                    {node.label}
                  </text>

                  {/* SubLabel Text */}
                  <text
                    x="30"
                    y="9"
                    className={`text-[8.5px] font-extrabold ${
                      isSelected ? 'fill-teal-100' : 'fill-slate-400'
                    }`}
                  >
                    {node.subLabel}
                  </text>
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
