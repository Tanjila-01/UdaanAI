import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Award, 
  Layers,
  BookOpen
} from 'lucide-react';
import { PRESENTATION_METADATA } from '../../utils/pathwayAdapter';

const PathwayChoiceExplorer = ({
  parentContextPathway,
  choicePathways = [],
  selectedDirectionId,
  onSelectDirection,
  recommendations,
  isCombinationStep = false
}) => {
  if (!parentContextPathway) return null;

  // Build recommendation lookup set
  const recMap = {};
  if (recommendations && recommendations.recommendations) {
    recommendations.recommendations.forEach((item) => {
      recMap[item.pathway_id] = item;
    });
  }

  // Dynamic context-specific header copy
  let headerCopy = "Select a direction to explore courses, eligibility, entrance routes, and step-by-step milestones.";
  if (!isCombinationStep && parentContextPathway.id === 'puc-science') {
    headerCopy = "Choose a PUC Science combination to see where it can lead.";
  } else if (!isCombinationStep && parentContextPathway.id === 'puc-commerce') {
    headerCopy = "Choose a PUC Commerce track to explore specialized career choices.";
  } else if (!isCombinationStep && parentContextPathway.id === 'puc-arts') {
    headerCopy = "Choose an Arts & Humanities combination to see available degree paths.";
  } else if (isCombinationStep) {
    headerCopy = "Select a career direction to explore courses, eligibility, entrance routes, and step-by-step milestones.";
  } else if (parentContextPathway.id?.startsWith('dip-') || parentContextPathway.id?.startsWith('iti-')) {
    headerCopy = "Select a specialized technical program or career progression.";
  }

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 font-sans">
      
      {/* Explorer Header */}
      <div className="border-b border-slate-100 pb-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#005F60] bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/80 mb-1">
            <Layers className="w-3.5 h-3.5 text-[#F97316]" />
            <span>CHOICE EXPLORER • {parentContextPathway.title?.toUpperCase()}</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            Where can this take you?
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed font-medium">
            {headerCopy}
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-[11px] font-extrabold text-slate-600 self-start sm:self-auto shrink-0">
          <span className="text-[#005F60] font-black">{choicePathways.length}</span> Available Choices
        </div>
      </div>

      {/* Choice Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-3.5">
        {choicePathways.map((pathway) => {
          const meta = PRESENTATION_METADATA[pathway.id] || {};
          const IconComponent = meta.icon || BookOpen;
          const isSelected = selectedDirectionId === pathway.id;
          const recItem = recMap[pathway.id];

          // Sample featured options from API pathway
          const sampleOptions = (pathway.options || []).slice(0, 3);

          return (
            <div
              key={pathway.id}
              onClick={() => onSelectDirection(pathway.id)}
              className={`group relative border rounded-2xl p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 ${
                isSelected
                  ? 'bg-gradient-to-b from-teal-50/90 to-white border-[#005F60] ring-2 ring-[#005F60]/20 shadow-sm transform -translate-y-0.5'
                  : 'bg-white hover:bg-slate-50/80 border-slate-200/90 hover:border-teal-300 shadow-2xs hover:shadow-xs'
              }`}
            >
              {/* Top Bar: Icon, Badges & Title */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-[#005F60] text-white shadow-xs'
                      : 'bg-teal-50 text-[#005F60] group-hover:bg-[#005F60] group-hover:text-white'
                  }`}>
                    <IconComponent className="w-4.5 h-4.5" />
                  </div>

                  {recItem && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-2xs">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>{recItem.match_label === 'High' ? 'RECOMMENDED' : 'GOOD MATCH'}</span>
                    </span>
                  )}
                </div>

                <div>
                  {meta.shortTag && (
                    <span className="text-[9.5px] font-black uppercase tracking-wider text-[#005F60] block">
                      {meta.shortTag}
                    </span>
                  )}
                  <h3 className="font-black text-sm text-slate-900 group-hover:text-[#005F60] transition-colors leading-snug">
                    {pathway.title}
                  </h3>
                </div>

                <p className="text-[11.5px] text-slate-600 line-clamp-2 leading-relaxed font-normal">
                  {pathway.description}
                </p>
              </div>

              {/* Entrance Badge & Options */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                {meta.entranceBadge && (
                  <div className="inline-flex items-center gap-1.5 text-[9.5px] font-extrabold text-amber-900 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md">
                    <Award className="w-3 h-3 text-amber-600 shrink-0" />
                    <span>{meta.entranceBadge}</span>
                  </div>
                )}

                {sampleOptions.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {sampleOptions.map((opt) => (
                      <span 
                        key={opt.id || opt.option_name}
                        className="text-[9.5px] font-bold text-slate-700 bg-slate-100 border border-slate-200/60 px-1.5 py-0.5 rounded-md"
                      >
                        {opt.option_name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Action Indicator */}
              <div className="pt-1 flex items-center justify-between text-[11px] font-black">
                <span className={isSelected ? 'text-[#005F60]' : 'text-slate-500 group-hover:text-[#005F60]'}>
                  {isSelected ? 'Viewing Details' : (!isCombinationStep ? 'Explore Choices' : 'Select Direction')}
                </span>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                  isSelected 
                    ? 'bg-[#005F60] text-white' 
                    : 'bg-slate-100 text-slate-600 group-hover:bg-[#005F60] group-hover:text-white'
                }`}>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};

export default PathwayChoiceExplorer;
