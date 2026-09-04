import React from 'react';
import { 
  Info, 
  ShieldCheck, 
  Award, 
  Layers, 
  CheckCircle2, 
  Target, 
  Check, 
  Clock, 
  Sparkles, 
  AlertCircle,
  BookOpen,
  Compass
} from 'lucide-react';
import { PRESENTATION_METADATA } from '../../utils/pathwayAdapter';

const PathwayDetailPanel = ({
  detail,
  loading,
  error,
  onRetry,
  onSelectGoal,
  recommendations,
  selectedOptionId
}) => {
  if (loading) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 animate-pulse font-sans">
        <div className="h-5 bg-slate-200 rounded w-1/3"></div>
        <div className="h-7 bg-slate-200 rounded w-3/4"></div>
        <div className="h-20 bg-slate-100 rounded-2xl"></div>
        <div className="h-32 bg-slate-100 rounded-2xl"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 space-y-3 text-rose-900 font-sans">
        <div className="flex items-center space-x-2 font-bold text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600" />
          <span>Error Loading Detail</span>
        </div>
        <p className="text-xs text-rose-700">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="bg-rose-600 text-white text-xs font-extrabold px-3.5 py-1.5 rounded-xl cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-3xl p-8 text-center text-slate-400 space-y-3 font-sans">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#005F60] flex items-center justify-center mx-auto">
          <BookOpen className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-extrabold text-slate-700">Explore Education Directions</h4>
        <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
          Select any node on the map or choice direction card to view complete options, entrance routes, and milestones.
        </p>
      </div>
    );
  }

  const meta = PRESENTATION_METADATA[detail.id] || {};

  // Check recommendation match
  let recItem = null;
  if (recommendations && recommendations.recommendations) {
    recItem = recommendations.recommendations.find(r => r.pathway_id === detail.id);
  }

  // Consolidated eligibility
  const firstElig = detail.options?.find(o => o.eligibility)?.eligibility;

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xs font-sans max-h-[780px] overflow-y-auto">
      
      {/* 1. Header Badge & Title */}
      <div className="border-b border-slate-100 pb-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-100 text-[#005F60]">
            {detail.category || 'CAREER DIRECTION'}
          </span>

          {detail.duration && (
            <span className="inline-flex items-center gap-1 text-[10px] font-black text-[#F97316] bg-orange-50 border border-orange-200/80 px-2.5 py-0.5 rounded-md">
              <Clock className="w-3 h-3 text-[#F97316]" />
              <span>{detail.duration}</span>
            </span>
          )}
        </div>

        <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
          {detail.title}
        </h2>

        {recItem && (
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/80 rounded-xl p-3 text-xs space-y-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#F97316]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Recommended Match ({recItem.match_score}%)</span>
            </span>
            {recItem.reasons && recItem.reasons.length > 0 && (
              <p className="text-[11px] text-slate-700 font-semibold leading-relaxed">
                {recItem.reasons[0]}
              </p>
            )}
          </div>
        )}
      </div>

      {/* 2. Overview / Description */}
      <div className="space-y-1.5">
        <h3 className="text-[10px] font-black uppercase tracking-wider text-[#005F60] flex items-center gap-1">
          <Info className="w-3.5 h-3.5" />
          <span>What is this?</span>
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed font-semibold">
          {detail.description}
        </p>
      </div>

      {/* 3. Eligibility & Entrance Routes */}
      {(firstElig || meta.entranceBadge) && !detail.isStructuralOnly && (
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2 text-xs">
          {firstElig && (
            <div className="space-y-0.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Eligibility Prerequisite</span>
              </span>
              <p className="text-[11px] font-bold text-slate-700">
                {firstElig}
              </p>
            </div>
          )}

          {meta.entranceBadge && (
            <div className="pt-2 border-t border-slate-200/60 space-y-0.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-600" />
                <span>Entrance / Admission Route</span>
              </span>
              <p className="text-[11px] font-extrabold text-amber-900">
                {meta.entranceBadge}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 4. Available Streams / Branches Options */}
      {detail.options && detail.options.length > 0 && (
        <div className="space-y-2.5">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-[#005F60] flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Available Streams & Branches ({detail.options.length})</span>
          </h3>

          <div className="space-y-2">
            {detail.options.map((opt) => {
              const isOptionHighlighted = selectedOptionId === opt.id;

              return (
                <div 
                  key={opt.id}
                  className={`border rounded-xl p-3 space-y-1 text-xs transition-all ${
                    isOptionHighlighted
                      ? 'bg-teal-50/70 border-[#005F60] ring-2 ring-[#005F60]/20 shadow-xs'
                      : 'bg-[#F8FAF8] border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                      {opt.option_name}
                      {isOptionHighlighted && (
                        <span className="text-[9px] font-black uppercase tracking-wider text-[#005F60] bg-teal-100 px-1.5 py-0.5 rounded">
                          SEARCH MATCH
                        </span>
                      )}
                    </span>
                    {opt.stream_or_code && (
                      <span className="text-[9px] font-mono font-black text-[#005F60] bg-teal-100/80 px-2 py-0.5 rounded">
                        {opt.stream_or_code}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    {opt.description}
                  </p>
                  {onSelectGoal && !detail.isStructuralOnly && (
                    <div className="pt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => onSelectGoal(detail, opt)}
                        className="bg-orange-50 hover:bg-orange-100 text-[#F97316] border border-orange-200 font-extrabold text-[10px] px-2.5 py-1 rounded-lg transition-all inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Target className="w-3 h-3" />
                        <span>Choose Option Goal</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Step-by-Step Action Milestones */}
      {detail.milestones && detail.milestones.length > 0 && (
        <div className="space-y-3 pt-1">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-[#F97316] flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            <span>Action Milestones ({detail.milestones.length})</span>
          </h3>

          <div className="space-y-2.5">
            {detail.milestones.map((ms) => (
              <div key={ms.id} className="flex items-start gap-2.5 text-xs bg-[#F8FAF8] border border-slate-200/80 rounded-xl p-3">
                <div className="w-6 h-6 rounded-full bg-[#005F60] text-white flex items-center justify-center font-black text-[11px] shrink-0">
                  {ms.step_number}
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-extrabold text-slate-900 text-xs">
                    {ms.title}
                  </h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {ms.description}
                  </p>
                  {ms.key_action && (
                    <div className="pt-1 text-[10px] font-bold text-[#005F60] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-[#005F60]" />
                      <span>Action: {ms.key_action}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Primary Goal CTA Button (Omitted for structural-only 'c10' node) */}
      {onSelectGoal && !detail.isStructuralOnly && (
        <div className="pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => onSelectGoal(detail, null)}
            className="w-full bg-[#005F60] hover:bg-teal-800 text-white font-black py-3 px-4 rounded-2xl text-xs transition-all shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Target className="w-4 h-4 text-[#F97316]" />
            <span>Choose This Direction</span>
          </button>
        </div>
      )}

      {/* Structural Guidance Hint for c10 */}
      {detail.isStructuralOnly && (
        <div className="pt-3 border-t border-slate-100 text-center">
          <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#005F60] bg-teal-50 border border-teal-200/80 px-3 py-2 rounded-xl">
            <Compass className="w-4 h-4 text-[#F97316]" />
            <span>Select a route from the map to explore career goals</span>
          </div>
        </div>
      )}

    </div>
  );
};

export default PathwayDetailPanel;
