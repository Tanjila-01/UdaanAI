import React, { useState, useEffect, useMemo } from 'react';
import { 
  Check, 
  CheckCircle2, 
  UserCheck, 
  Compass, 
  Sparkles, 
  Target, 
  MapPin, 
  ArrowRight, 
  Edit3, 
  Lock 
} from 'lucide-react';

/**
 * StudentJourneyNavigator
 * 
 * Interactive 5-stage UX navigator for Udaan AI dashboard:
 * 1. Profile
 * 2. Assessment
 * 3. Career Direction
 * 4. Goal
 * 5. Roadmap
 * 
 * Features:
 * - Selectable stations with unified structural design
 * - Single contextual detail panel underneath with direct CTAs
 * - Responsive desktop (horizontal) and mobile (compact vertical) layouts
 * - Keyboard accessible (Tab, Enter, Space) with full ARIA semantics
 * - Real application state derivation without hardcoded mock data
 */
const StudentJourneyNavigator = ({
  profile,
  assessmentResult,
  activeGoal,
  recommendations,
  academicContextStr,
  onEditProfile,
  onNavigate,
}) => {
  // Real application state derivations
  const isProfileComplete = Boolean(profile?.current_level || profile?.full_name);
  const isAssessmentComplete = Boolean(assessmentResult);
  const isGoalSelected = Boolean(activeGoal);
  const hasRecommendations = Boolean(recommendations?.recommendations && recommendations.recommendations.length > 0);
  const recommendationsCount = recommendations?.recommendations?.length || 0;

  // Roadmap milestone completion evaluation
  const milestoneCompletedCount = activeGoal?.progress?.completed ?? 0;
  const milestoneTotalCount = activeGoal?.progress?.total ?? 0;
  const hasMilestoneData = Boolean(activeGoal?.progress && milestoneTotalCount > 0);
  const isRoadmapComplete = isGoalSelected && hasMilestoneData && milestoneCompletedCount === milestoneTotalCount;
  const isRoadmapStarted = isGoalSelected && milestoneCompletedCount > 0;

  // Determine the primary active/current stage index & id
  const currentStageId = useMemo(() => {
    if (!isProfileComplete) return 'profile';
    if (!isAssessmentComplete) return 'assessment';
    if (!isGoalSelected) {
      return hasRecommendations ? 'goal' : 'direction';
    }
    return 'roadmap';
  }, [isProfileComplete, isAssessmentComplete, isGoalSelected, hasRecommendations]);

  // Selected stage state (initialized to current stage, updates when data loads unless user manually clicked)
  const [selectedStageId, setSelectedStageId] = useState(currentStageId);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Sync default selection if data arrives asynchronously and student has not explicitly clicked
  useEffect(() => {
    if (!hasUserInteracted) {
      setSelectedStageId(currentStageId);
    }
  }, [currentStageId, hasUserInteracted]);

  // Construct stages data
  const stages = useMemo(() => {
    return [
      {
        id: 'profile',
        stageNumber: 1,
        label: 'Profile',
        icon: UserCheck,
        // Profile is Complete if profile exists
        isCompleted: isProfileComplete,
        isCurrent: currentStageId === 'profile',
        isLocked: false,
        statusText: isProfileComplete ? 'Complete' : 'In progress',
        semanticStatus: isProfileComplete ? 'COMPLETED' : 'CURRENT',
      },
      {
        id: 'assessment',
        stageNumber: 2,
        label: 'Assessment',
        icon: Compass,
        isCompleted: isAssessmentComplete,
        isCurrent: currentStageId === 'assessment',
        isLocked: !isProfileComplete,
        statusText: isAssessmentComplete ? 'Completed' : (isProfileComplete ? 'In progress' : 'Locked'),
        semanticStatus: isAssessmentComplete ? 'COMPLETED' : (isProfileComplete ? 'CURRENT' : 'LOCKED'),
      },
      {
        id: 'direction',
        stageNumber: 3,
        label: 'Career Direction',
        icon: Sparkles,
        // Completed if goal has been chosen; Available if assessment complete; Locked otherwise
        isCompleted: isGoalSelected,
        isCurrent: currentStageId === 'direction',
        isLocked: !isAssessmentComplete,
        statusText: !isAssessmentComplete ? 'Locked' : (isGoalSelected ? 'Complete' : 'Available'),
        semanticStatus: !isAssessmentComplete ? 'LOCKED' : (isGoalSelected ? 'COMPLETED' : 'AVAILABLE'),
      },
      {
        id: 'goal',
        stageNumber: 4,
        label: 'Goal',
        icon: Target,
        // Goal is "Selected" rather than merely complete
        isCompleted: isGoalSelected,
        isCurrent: currentStageId === 'goal',
        isLocked: !isAssessmentComplete,
        statusText: !isAssessmentComplete ? 'Locked' : (isGoalSelected ? 'Selected' : 'Not selected'),
        semanticStatus: !isAssessmentComplete ? 'LOCKED' : (isGoalSelected ? 'SELECTED' : 'AVAILABLE'),
      },
      {
        id: 'roadmap',
        stageNumber: 5,
        label: 'Roadmap',
        icon: MapPin,
        isCompleted: isRoadmapComplete,
        isCurrent: currentStageId === 'roadmap',
        isLocked: !isGoalSelected,
        statusText: !isGoalSelected ? 'Waiting for goal' : (isRoadmapComplete ? 'Complete' : 'In progress'),
        semanticStatus: !isGoalSelected ? 'LOCKED' : (isRoadmapComplete ? 'COMPLETED' : 'CURRENT'),
      },
    ];
  }, [
    isProfileComplete, 
    isAssessmentComplete, 
    isGoalSelected, 
    isRoadmapComplete, 
    currentStageId
  ]);

  const selectedStage = stages.find(s => s.id === selectedStageId) || stages[0];

  // Stage selection handler
  const handleStageSelect = (stageId) => {
    setHasUserInteracted(true);
    setSelectedStageId(stageId);
  };

  // Build contextual detail panel content based on selectedStageId
  const getContextualPanelData = () => {
    switch (selectedStageId) {
      case 'profile':
        return {
          title: `Profile · ${isProfileComplete ? 'Complete' : 'In progress'}`,
          badge: isProfileComplete ? 'Complete' : 'In progress',
          badgeStyle: isProfileComplete 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
            : 'bg-amber-50 text-amber-700 border-amber-200',
          description: isProfileComplete
            ? 'Your student profile is ready and helps Udaan AI understand your current education stage.'
            : 'Complete your academic profile so Udaan AI can provide personalized guidance for your level.',
          contextChip: academicContextStr || `${profile?.current_level || 'Class 10'} • ${profile?.state || 'Karnataka'}`,
          primaryCta: {
            label: 'View / Edit Profile',
            icon: Edit3,
            onClick: () => {
              if (onEditProfile) onEditProfile();
              else onNavigate('/onboarding');
            },
          },
        };

      case 'assessment':
        if (isAssessmentComplete) {
          return {
            title: 'Assessment · Completed',
            badge: 'Completed',
            badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            description: 'Your Career Discovery Assessment is complete and is being used to identify suitable education directions.',
            contextChip: assessmentResult.primary_stream_recommendation 
              ? `Recommended Stream: ${assessmentResult.primary_stream_recommendation}`
              : 'Interests & Aptitude Analyzed',
            primaryCta: {
              label: 'View Assessment Results',
              icon: ArrowRight,
              onClick: () => onNavigate('/assessment'),
            },
          };
        } else {
          return {
            title: 'Assessment · Not completed',
            badge: 'Pending',
            badgeStyle: 'bg-amber-50 text-amber-700 border-amber-200',
            description: 'Take our Career Discovery Assessment to discover subjects and career areas aligned with your interests and academic background.',
            contextChip: '25 quick discovery questions',
            primaryCta: {
              label: 'Take Assessment',
              icon: ArrowRight,
              onClick: () => onNavigate('/assessment?mode=take'),
            },
          };
        }

      case 'direction':
        if (!isAssessmentComplete) {
          return {
            title: 'Career Direction · Locked',
            badge: 'Locked',
            badgeStyle: 'bg-slate-100 text-slate-500 border-slate-200',
            description: 'Complete your Career Discovery Assessment first to unlock personalized career and education directions.',
            contextChip: null,
            primaryCta: {
              label: 'Take Assessment',
              icon: ArrowRight,
              onClick: () => onNavigate('/assessment?mode=take'),
            },
          };
        } else {
          return {
            title: `Career Direction · ${isGoalSelected ? 'Complete' : 'Available'}`,
            badge: isGoalSelected ? 'Complete' : 'Available',
            badgeStyle: isGoalSelected 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-teal-50 text-teal-700 border-teal-200',
            description: 'Explore education and career directions based on your profile and assessment.',
            contextChip: recommendationsCount > 0 
              ? `${recommendationsCount} recommended direction${recommendationsCount === 1 ? '' : 's'} available` 
              : 'Explore curriculum options & pathways',
            primaryCta: {
              label: 'Explore Pathways',
              icon: ArrowRight,
              onClick: () => onNavigate('/pathways'),
            },
          };
        }

      case 'goal':
        if (!isAssessmentComplete) {
          return {
            title: 'Goal · Locked',
            badge: 'Locked',
            badgeStyle: 'bg-slate-100 text-slate-500 border-slate-200',
            description: 'Unlock career goal selection by taking the Career Discovery Assessment first.',
            contextChip: null,
            primaryCta: {
              label: 'Take Assessment',
              icon: ArrowRight,
              onClick: () => onNavigate('/assessment?mode=take'),
            },
          };
        } else if (isGoalSelected) {
          return {
            title: 'Goal · Selected',
            badge: 'Selected',
            badgeStyle: 'bg-teal-50 text-[#005F60] border-teal-200 font-extrabold',
            dynamicHeading: activeGoal.goal_title,
            description: 'This is your currently selected education direction.',
            contextChip: activeGoal.pathway_title ? `Pathway: ${activeGoal.pathway_title}` : null,
            primaryCta: {
              label: 'View Goal / Explore Direction',
              icon: ArrowRight,
              onClick: () => onNavigate('/pathways'),
            },
            secondaryAction: {
              label: 'Change Direction',
              onClick: () => onNavigate('/pathways'),
            },
          };
        } else {
          return {
            title: 'Goal · Not selected',
            badge: 'Ready to Choose',
            badgeStyle: 'bg-amber-50 text-amber-700 border-amber-200',
            description: 'Choose a target education or career goal to start your personalized roadmap.',
            contextChip: recommendationsCount > 0 ? `${recommendationsCount} recommendations ready` : null,
            primaryCta: {
              label: 'Explore Pathways',
              icon: ArrowRight,
              onClick: () => onNavigate('/pathways'),
            },
          };
        }

      case 'roadmap':
        if (!isGoalSelected) {
          return {
            title: 'Roadmap · Waiting for goal',
            badge: 'Waiting for Goal',
            badgeStyle: 'bg-slate-100 text-slate-500 border-slate-200',
            description: 'Select a career direction before your roadmap can begin.',
            contextChip: null,
            primaryCta: {
              label: 'Explore Pathways',
              icon: ArrowRight,
              onClick: () => onNavigate('/pathways'),
            },
          };
        } else {
          return {
            title: `Roadmap · ${isRoadmapComplete ? 'Complete' : 'In progress'}`,
            badge: isRoadmapComplete ? 'Complete' : 'In progress',
            badgeStyle: isRoadmapComplete 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-orange-50 text-[#F97316] border-orange-200 font-extrabold',
            description: 'Continue working through milestones for your selected goal.',
            contextChip: hasMilestoneData 
              ? `${milestoneCompletedCount} of ${milestoneTotalCount} milestones completed` 
              : null,
            primaryCta: {
              label: 'Continue Roadmap',
              icon: ArrowRight,
              onClick: () => onNavigate('/my-roadmap'),
            },
          };
        }

      default:
        return null;
    }
  };

  const panelData = getContextualPanelData();
  const SelectedIcon = selectedStage.icon;

  // Connector calculation helpers
  const getConnectorClass = (idx) => {
    const current = stages[idx];
    const next = stages[idx + 1];
    if (!next) return '';

    if (current.isCompleted && next.isCompleted) {
      return 'bg-[#005F60]';
    }
    if (current.isCompleted && next.isCurrent) {
      return 'bg-gradient-to-r from-[#005F60] to-[#F97316]';
    }
    return 'bg-slate-200';
  };

  const getVerticalConnectorClass = (idx) => {
    const current = stages[idx];
    const next = stages[idx + 1];
    if (!next) return '';

    if (current.isCompleted && next.isCompleted) {
      return 'bg-[#005F60]';
    }
    if (current.isCompleted && next.isCurrent) {
      return 'bg-gradient-to-b from-[#005F60] to-[#F97316]';
    }
    return 'bg-slate-200';
  };

  // Keyboard handler for station button
  const handleKeyDown = (e, stageId) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleStageSelect(stageId);
    }
  };

  // Station indicator rendering (uniform structural design across all 5 stages)
  const renderStationIndicator = (stage) => {
    if (stage.isCurrent) {
      // CURRENT / IN PROGRESS: Slightly larger station, teal outer ring/border, orange center dot
      return (
        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-[#005F60] bg-white flex items-center justify-center shrink-0 shadow-2xs">
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#F97316]" />
        </div>
      );
    }

    if (stage.isCompleted) {
      // COMPLETED: Small teal check station
      return (
        <div className="w-5 h-5 rounded-full bg-teal-50 border border-teal-300 text-[#005F60] flex items-center justify-center shrink-0">
          <Check className="w-3 h-3 stroke-[2.5]" />
        </div>
      );
    }

    // FUTURE / LOCKED: Muted slate station
    return (
      <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 text-slate-400 font-extrabold text-[10px] flex items-center justify-center shrink-0">
        {stage.isLocked ? (
          <Lock className="w-2.5 h-2.5 text-slate-400" />
        ) : (
          stage.stageNumber
        )}
      </div>
    );
  };

  return (
    <section 
      aria-label="Student Journey"
      className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-5 shadow-2xs space-y-4 font-sans"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center space-x-2">
          <h3 className="text-[11px] font-black uppercase tracking-wider text-[#005F60] flex items-center space-x-1.5 font-sans">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#005F60]" />
            <span>Your Student Journey</span>
          </h3>
          <span className="text-[10px] font-medium text-slate-400">
            • Select any station to view details
          </span>
        </div>
        <span className="text-[10px] font-semibold text-slate-400 font-sans">
          Station {selectedStage.stageNumber} of 5
        </span>
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP / TABLET HORIZONTAL TRACK                                         */}
      {/* ========================================================================= */}
      <div 
        role="tablist" 
        aria-label="Journey Stages" 
        className="hidden md:flex items-center justify-between py-1 relative"
      >
        {stages.map((stage, idx) => {
          const isLast = idx === stages.length - 1;
          const isSelected = stage.id === selectedStageId;
          const StageIcon = stage.icon;

          return (
            <React.Fragment key={stage.id}>
              {/* Interactive Station Button */}
              <button
                type="button"
                role="tab"
                id={`journey-station-${stage.id}`}
                aria-selected={isSelected}
                aria-current={isSelected ? 'step' : undefined}
                aria-expanded={isSelected}
                aria-controls="journey-context-panel"
                tabIndex={0}
                onClick={() => handleStageSelect(stage.id)}
                onKeyDown={(e) => handleKeyDown(e, stage.id)}
                className={`group relative flex items-center space-x-2.5 px-3 py-2 rounded-xl transition-all duration-150 cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#005F60] ${
                  isSelected
                    ? 'bg-teal-50/70 border border-[#005F60]/40 ring-1 ring-[#005F60]/30 shadow-2xs'
                    : 'bg-transparent border border-transparent hover:bg-slate-50/80 hover:border-slate-200/70'
                }`}
              >
                {/* Station Circle Indicator */}
                {renderStationIndicator(stage)}

                {/* Station Label & Status */}
                <div className="flex flex-col leading-tight min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span 
                      className={`text-xs truncate transition-colors ${
                        stage.isCurrent 
                          ? 'font-black text-[#0F172A]' 
                          : stage.isCompleted 
                          ? 'font-bold text-slate-700 group-hover:text-slate-900' 
                          : 'font-semibold text-slate-400'
                      }`}
                    >
                      {stage.label}
                    </span>
                    {/* Interactive Icon Indicator */}
                    <StageIcon 
                      className={`w-3 h-3 shrink-0 transition-colors ${
                        isSelected 
                          ? 'text-[#005F60]' 
                          : stage.isCurrent 
                          ? 'text-[#005F60]' 
                          : stage.isCompleted 
                          ? 'text-teal-600/70' 
                          : 'text-slate-300'
                      }`} 
                    />
                  </div>
                  <span 
                    className={`text-[9px] truncate tracking-wider ${
                      stage.isCurrent 
                        ? 'font-black text-[#F97316] uppercase' 
                        : stage.isCompleted 
                        ? 'font-medium text-slate-400' 
                        : 'font-medium text-slate-300'
                    }`}
                  >
                    {stage.statusText}
                  </span>
                </div>

                {/* Subtle selection pointer notch */}
                {isSelected && (
                  <span 
                    aria-hidden="true" 
                    className="absolute -bottom-[17px] left-1/2 -translate-x-1/2 w-0 h-0 border-x-6 border-x-transparent border-t-6 border-t-[#005F60]/40" 
                  />
                )}
              </button>

              {/* Interconnecting Line Segment */}
              {!isLast && (
                <div 
                  aria-hidden="true"
                  className={`flex-1 h-[2px] mx-1 sm:mx-2 rounded-full min-w-[12px] transition-colors duration-300 ${getConnectorClass(idx)}`} 
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* MOBILE COMPACT VERTICAL TRACK                                             */}
      {/* ========================================================================= */}
      <div 
        role="tablist" 
        aria-label="Journey Stages Mobile" 
        className="md:hidden flex flex-col space-y-1 py-1"
      >
        {stages.map((stage, idx) => {
          const isLast = idx === stages.length - 1;
          const isSelected = stage.id === selectedStageId;
          const StageIcon = stage.icon;

          return (
            <div key={stage.id} className="relative flex items-start space-x-3">
              {/* Left Column: Icon + Vertical Connector */}
              <div className="flex flex-col items-center shrink-0">
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => handleStageSelect(stage.id)}
                  className="focus:outline-none cursor-pointer"
                >
                  {renderStationIndicator(stage)}
                </button>

                {!isLast && (
                  <div 
                    aria-hidden="true"
                    className={`w-[2px] h-3.5 my-1 rounded-full transition-colors duration-300 ${getVerticalConnectorClass(idx)}`} 
                  />
                )}
              </div>

              {/* Right Column: Interactive Station Button */}
              <div className="flex-1 pb-1">
                <button
                  type="button"
                  role="tab"
                  id={`journey-station-m-${stage.id}`}
                  aria-selected={isSelected}
                  aria-current={isSelected ? 'step' : undefined}
                  aria-expanded={isSelected}
                  aria-controls="journey-context-panel"
                  tabIndex={0}
                  onClick={() => handleStageSelect(stage.id)}
                  onKeyDown={(e) => handleKeyDown(e, stage.id)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-all text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#005F60] ${
                    isSelected
                      ? 'bg-teal-50/80 border border-[#005F60]/40 ring-1 ring-[#005F60]/30 shadow-2xs'
                      : 'bg-slate-50/50 border border-slate-100 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <span 
                      className={`text-xs truncate ${
                        stage.isCurrent 
                          ? 'font-black text-[#0F172A]' 
                          : stage.isCompleted 
                          ? 'font-bold text-slate-700' 
                          : 'font-semibold text-slate-400'
                      }`}
                    >
                      {stage.label}
                    </span>
                    <StageIcon 
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isSelected 
                          ? 'text-[#005F60]' 
                          : stage.isCurrent 
                          ? 'text-[#005F60]' 
                          : stage.isCompleted 
                          ? 'text-teal-600/70' 
                          : 'text-slate-300'
                      }`} 
                    />
                  </div>

                  <span 
                    className={`text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${
                      stage.isCurrent 
                        ? 'font-black text-[#F97316] bg-orange-50 border border-orange-200/80' 
                        : stage.isCompleted 
                        ? 'font-bold text-slate-500 bg-slate-100' 
                        : 'font-medium text-slate-300'
                    }`}
                  >
                    {stage.statusText}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* INTERACTIVE CONTEXTUAL DETAIL PANEL (ONE PANEL DIRECTLY BELOW TRACK)      */}
      {/* ========================================================================= */}
      {panelData && (
        <div 
          id="journey-context-panel"
          role="region"
          aria-live="polite"
          aria-labelledby={`journey-station-${selectedStage.id}`}
          className="bg-[#F6FAF8] border border-teal-200/80 rounded-xl p-3.5 sm:p-4 text-slate-800 transition-all duration-150 animate-in fade-in-50"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            {/* Context Content */}
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center space-x-1.5 text-xs font-black text-[#0F172A]">
                  <SelectedIcon className="w-3.5 h-3.5 text-[#005F60] shrink-0" />
                  <span>{panelData.title}</span>
                </span>
                {panelData.badge && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${panelData.badgeStyle}`}>
                    {panelData.badge}
                  </span>
                )}
              </div>

              {panelData.dynamicHeading && (
                <div className="text-xs sm:text-sm font-extrabold text-[#005F60] truncate">
                  {panelData.dynamicHeading}
                </div>
              )}

              <p className="text-xs text-slate-600 leading-relaxed max-w-2xl font-normal">
                {panelData.description}
              </p>

              {panelData.contextChip && (
                <div className="pt-1">
                  <span className="inline-flex items-center space-x-1.5 text-[11px] font-bold text-teal-900 bg-white border border-teal-200 px-2.5 py-0.5 rounded-md shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#005F60]" />
                    <span>{panelData.contextChip}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Context Actions */}
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
              {panelData.secondaryAction && (
                <button
                  type="button"
                  onClick={panelData.secondaryAction.onClick}
                  className="text-xs font-bold text-slate-500 hover:text-[#005F60] hover:underline cursor-pointer px-2 py-2 transition-colors"
                >
                  {panelData.secondaryAction.label}
                </button>
              )}

              {panelData.primaryCta && (
                <button
                  type="button"
                  onClick={panelData.primaryCta.onClick}
                  className="bg-[#005F60] hover:bg-teal-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-2xs flex items-center space-x-1.5 cursor-pointer font-sans"
                >
                  <span>{panelData.primaryCta.label}</span>
                  <panelData.primaryCta.icon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default StudentJourneyNavigator;
