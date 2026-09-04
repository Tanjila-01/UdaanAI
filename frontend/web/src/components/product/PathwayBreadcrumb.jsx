import React from 'react';
import { ChevronRight, MapPin, RefreshCw, Compass } from 'lucide-react';
import { getBreadcrumbTrail } from '../../utils/pathwayAdapter';

const PathwayBreadcrumb = ({ 
  selectedPathwayId, 
  apiPathwaysMap, 
  onSelectNode, 
  onResetView,
  studentLevel 
}) => {
  const trail = getBreadcrumbTrail(selectedPathwayId, apiPathwaysMap);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl px-4 py-3 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs font-sans">
      
      {/* Journey Trail */}
      <div className="flex flex-wrap items-center gap-1.5 min-w-0">
        <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#005F60] bg-teal-50 border border-teal-200/80 px-2 py-0.5 rounded-md shrink-0">
          <MapPin className="w-3 h-3 text-[#F97316]" />
          <span>YOU ARE HERE</span>
        </div>

        <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

        {trail.map((item, index) => {
          const isLast = index === trail.length - 1;
          return (
            <React.Fragment key={`${item.id}-${index}`}>
              {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
              
              <button
                type="button"
                onClick={() => onSelectNode(item.id)}
                className={`font-bold transition-all px-2 py-1 rounded-md text-left truncate max-w-[200px] cursor-pointer ${
                  isLast 
                    ? 'bg-[#005F60] text-white shadow-xs font-black' 
                    : 'text-slate-600 hover:text-[#005F60] hover:bg-slate-100'
                }`}
                title={item.label}
              >
                {item.label}
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* Reset View Button */}
      <button
        type="button"
        onClick={onResetView}
        className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-slate-600 hover:text-[#005F60] bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0"
        title="Reset view to your profile starting point"
      >
        <RefreshCw className="w-3 h-3 text-[#005F60]" />
        <span>Reset Start View</span>
      </button>
    </div>
  );
};

export default PathwayBreadcrumb;
