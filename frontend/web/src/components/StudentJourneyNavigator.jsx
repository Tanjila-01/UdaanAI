import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  UserCheck, 
  Sparkles, 
  Compass, 
  Target, 
  Route, 
  ArrowRight, 
  Edit3, 
  Lock 
} from 'lucide-react';

/**
 * StudentJourneyNavigator
 * 
 * Persistent SaaS-style Student Journey Rail for Udaan AI dashboard.
 * 5 interactive stations along a subtle continuous horizontal journey rail:
 * 1. Profile (UserCheck)
 * 2. Assessment (Sparkles)
 * 3. Career Direction (Compass)
 * 4. Goal (Target)
 * 5. Roadmap (Route)
 * 
 * Design Principles:
 * - Quiet background rail connecting stations without dominating
 * - Stations sit around/above the rail with semantic Lucide icons (no stepper circles)
 * - Deterministic auto-selection with manual session selection preservation
 * - Historical state visibility ("Previous result", "Existing goal") without fake locking
 * - Subtle status indicators (teal text, warm-orange accent dot for ready/current)
 * - Single contextual detail panel carrying clear explanations and primary CTAs
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
  
  const hasHistoricalAssessment = Boolean(assessmentResult);
  const isCurrentAssessmentComplete = Boolean(assessmentResult && assessmentResult.is_current === true);
  const isAssessmentPending = Boolean(hasHistoricalAssessment && !isCurrentAssessmentComplete);

  const isGoalSelected = Boolean(activeGoal);
  const hasRecommendations = Boolean(recommendations?.recommendations && recommendations.recommendations.length > 0);
  const recommendationsCount = recommendations?.recommendations?.length || 0;

  // Roadmap milestone completion evaluation
  const milestoneCompletedCount = activeGoal?.progress?.completed ?? 0;
  const milestoneTotalCount = activeGoal?.progress?.total ?? 0;
  const hasMilestoneData = Boolean(activeGoal?.progress && milestoneTotalCount > 0);
  const isRoadmapComplete = isGoalSelected && hasMilestoneData && milestoneCompletedCount === milestoneTotalCount;

  // Deterministic state priority:
  // 1. Profile incomplete → Profile
  // 2. Current assessment incomplete → Assessment
  // 3. Assessment complete but career direction unavailable → Career Direction
  // 4. Recommendations available but no goal → Goal
  // 5. Goal exists and roadmap available → Roadmap
  const currentStageId = useMemo(() => {
    if (!isProfileComplete) return 'profile';
    if (!isCurrentAssessmentComplete) return 'assessment';
    if (!hasRecommendations && !isGoalSelected) return 'direction';
    if (!isGoalSelected) return 'goal';
    return 'roadmap';
  }, [isProfileComplete, isCurrentAssessmentComplete, hasRecommendations, isGoalSelected]);

  // Selected stage state (auto-selects by priority, preserves manual selection during session)
  const [selectedStageId, setSelectedStageId] = useState(currentStageId);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const stationRefs = useRef({});

  // Sync default selection if data loads asynchronously and user hasn't manually clicked
  useEffect(() => {
    if (!hasUserInteracted) {
      setSelectedStageId(currentStageId);
    }
  }, [currentStageId, hasUserInteracted]);

  // Stage selection handler
  const handleStageSelect = (stageId) => {
    setHasUserInteracted(true);
    setSelectedStageId(stageId);

    // Smooth scroll into view on mobile if needed
    if (stationRefs.current[stageId]) {
      stationRefs.current[stageId].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  };

  // Construct stages data
  const stages = useMemo(() => {
    // 1. Profile
    const profileStatus = isProfileComplete ? 'Complete' : 'In progress';
    const profileVisual = isProfileComplete ? 'COMPLETED' : 'CURRENT';

    // 2. Assessment
    let assessmentStatus = 'Locked';
    let assessmentVisual = 'LOCKED';
    if (isCurrentAssessmentComplete) {
      assessmentStatus = 'Complete';
      assessmentVisual = 'COMPLETED';
    } else if (isAssessmentPending) {
      assessmentStatus = 'Ready';
      assessmentVisual = 'READY';
    } else if (isProfileComplete) {
      assessmentStatus = 'Ready';
      assessmentVisual = 'READY';
    }

    // 3. Career Direction
    let directionStatus = 'Locked';
    let directionVisual = 'LOCKED';
    if (!hasHistoricalAssessment) {
      directionStatus = 'Locked';
      directionVisual = 'LOCKED';
    } else if (isAssessmentPending) {
      directionStatus = 'Previous result';
      directionVisual = 'HISTORICAL';
    } else if (isGoalSelected) {
      directionStatus = 'Complete';
      directionVisual = 'COMPLETED';
    } else {
      directionStatus = 'Available';
      directionVisual = 'AVAILABLE';
    }

    // 4. Goal
    let goalStatus = 'Locked';
    let goalVisual = 'LOCKED';
    if (!hasHistoricalAssessment) {
      goalStatus = 'Locked';
      goalVisual = 'LOCKED';
    } else if (isGoalSelected && isAssessmentPending) {
      goalStatus = 'Existing goal';
      goalVisual = 'HISTORICAL';
    } else if (isGoalSelected) {
      goalStatus = 'Selected';
      goalVisual = 'SELECTED';
    } else {
      goalStatus = 'Available';
      goalVisual = 'AVAILABLE';
    }

    // 5. Roadmap
    let roadmapStatus = 'Waiting';
    let roadmapVisual = 'LOCKED';
    if (!isGoalSelected) {
      roadmapStatus = 'Waiting';
      roadmapVisual = 'LOCKED';
    } else if (isRoadmapComplete) {
      roadmapStatus = 'Complete';
      roadmapVisual = 'COMPLETED';
    } else {
      roadmapStatus = 'In progress';
      roadmapVisual = 'IN_PROGRESS';
    }

    return [
      {
        id: 'profile',
        stageNumber: 1,
        title: 'Profile',
        shortTitle: 'Profile',
        icon: UserCheck,
        statusText: profileStatus,
        visualState: profileVisual,
        isCurrent: currentStageId === 'profile',
      },
      {
        id: 'assessment',
        stageNumber: 2,
        title: 'Assessment',
        shortTitle: 'Assessment',
        icon: Sparkles,
        statusText: assessmentStatus,
        visualState: assessmentVisual,
        isCurrent: currentStageId === 'assessment',
      },
      {
        id: 'direction',
        stageNumber: 3,
        title: 'Career Direction',
        shortTitle: 'Direction',
        icon: Compass,
        statusText: directionStatus,
        visualState: directionVisual,
        isCurrent: currentStageId === 'direction',
      },
      {
        id: 'goal',
        stageNumber: 4,
        title: 'Goal',
        shortTitle: 'Goal',
        icon: Target,
        statusText: goalStatus,
        visualState: goalVisual,
        isCurrent: currentStageId === 'goal',
      },
      {
        id: 'roadmap',
        stageNumber: 5,
        title: 'Roadmap',
        shortTitle: 'Roadmap',
        icon: Route,
        statusText: roadmapStatus,
        visualState: roadmapVisual,
        isCurrent: currentStageId === 'roadmap',
      },
    ];
  }, [
    isProfileComplete,
    isCurrentAssessmentComplete,
    isAssessmentPending,
    hasHistoricalAssessment,
    isGoalSelected,
    isRoadmapComplete,
    currentStageId,
  ]);

  const selectedStage = stages.find((s) => s.id === selectedStageId) || stages[0];

  // Calculate subtle continuous background rail progress
  const currentStageIndex = stages.findIndex((s) => s.id === currentStageId);
  const railProgressPercent = Math.max(0, Math.min(100, (currentStageIndex / (stages.length - 1)) * 100));

  // Contextual detail panel content
  const getContextualPanelData = () => {
    switch (selectedStageId) {
      case 'profile':
        return {
          title: `Profile · ${isProfileComplete ? 'Complete' : 'In progress'}`,
          badge: isProfileComplete ? 'Complete' : 'In progress',
          badgeStyle: isProfileComplete 
            ? 'bg-teal-50 text-teal-800 border-teal-200' 
            : 'bg-amber-50 text-amber-800 border-amber-200',
          description: isProfileComplete
            ? 'Your academic profile is set up with your current educational level and location.'
            : 'Complete your student profile so Udaan AI can provide accurate, level-appropriate guidance.',
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
        if (isCurrentAssessmentComplete) {
          return {
            title: 'Career Discovery Assessment · Complete',
            badge: 'Complete',
            badgeStyle: 'bg-teal-50 text-teal-800 border-teal-200',
            description: 'Your Career Discovery Assessment is complete and is being used to identify suitable education and career directions.',
            contextChip: assessmentResult?.primary_stream_recommendation 
              ? `Recommended Stream: ${assessmentResult.primary_stream_recommendation}`
              : 'Interests & Aptitudes Analyzed',
            primaryCta: {
              label: 'View Assessment Results',
              icon: ArrowRight,
              onClick: () => onNavigate('/assessment'),
            },
          };
        } else if (isAssessmentPending) {
          return {
            title: 'Career Discovery Assessment · Ready',
            badge: 'Ready',
            badgeStyle: 'bg-orange-50 text-[#F97316] border-orange-200 font-bold',
            description: `Your ${profile?.current_level || 'current level'} assessment is ready. Complete it to refresh your career directions. Your previous assessment results remain saved.`,
            contextChip: `${profile?.current_level || 'Current Level'} Career Discovery`,
            primaryCta: {
              label: 'Take Assessment',
              icon: ArrowRight,
              onClick: () => onNavigate('/assessment?mode=take'),
            },
          };
        } else {
          return {
            title: 'Career Discovery Assessment · Ready',
            badge: 'Ready',
            badgeStyle: 'bg-orange-50 text-[#F97316] border-orange-200 font-bold',
            description: 'Take our Career Discovery Assessment to discover subjects and career areas aligned with your interests and academic background.',
            contextChip: '15 quick discovery questions',
            primaryCta: {
              label: 'Take Assessment',
              icon: ArrowRight,
              onClick: () => onNavigate('/assessment?mode=take'),
            },
          };
        }

      case 'direction':
        if (!hasHistoricalAssessment) {
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
        } else if (isAssessmentPending) {
          return {
            title: 'Career Direction · Previous result',
            badge: 'Previous Result',
            badgeStyle: 'bg-slate-100 text-slate-700 border-slate-200',
            description: 'These career directions are based on your previous assessment. You can review them now or take your new assessment to view updated directions.',
            contextChip: recommendationsCount > 0 
              ? `${recommendationsCount} previous recommendation${recommendationsCount === 1 ? '' : 's'} available` 
              : null,
            primaryCta: {
              label: 'Explore Pathways',
              icon: ArrowRight,
              onClick: () => onNavigate('/pathways'),
            },
          };
        } else {
          return {
            title: `Career Direction · ${isGoalSelected ? 'Complete' : 'Available'}`,
            badge: isGoalSelected ? 'Complete' : 'Available',
            badgeStyle: isGoalSelected 
              ? 'bg-teal-50 text-teal-800 border-teal-200' 
              : 'bg-slate-100 text-slate-700 border-slate-200',
            description: 'Explore education and career pathways tailored to your strengths and assessment profile.',
            contextChip: recommendationsCount > 0 
              ? `${recommendationsCount} recommended pathway${recommendationsCount === 1 ? '' : 's'} available` 
              : 'Explore curriculum options & pathways',
            primaryCta: {
              label: 'Explore Pathways',
              icon: ArrowRight,
              onClick: () => onNavigate('/pathways'),
            },
          };
        }

      case 'goal':
        if (!hasHistoricalAssessment) {
          return {
            title: 'Goal · Locked',
            badge: 'Locked',
            badgeStyle: 'bg-slate-100 text-slate-500 border-slate-200',
            description: 'Unlock goal selection by completing your Career Discovery Assessment first.',
            contextChip: null,
            primaryCta: {
              label: 'Take Assessment',
              icon: ArrowRight,
              onClick: () => onNavigate('/assessment?mode=take'),
            },
          };
        } else if (isGoalSelected && isAssessmentPending) {
          return {
            title: 'Goal · Existing goal',
            badge: 'Existing Goal',
            badgeStyle: 'bg-teal-50 text-[#005F60] border-teal-200 font-bold',
            dynamicHeading: activeGoal.goal_title,
            description: 'This goal was selected from your previous assessment. You can continue with it or explore updated directions.',
            contextChip: activeGoal.pathway_title ? `Pathway: ${activeGoal.pathway_title}` : null,
            primaryCta: {
              label: 'View Goal',
              icon: ArrowRight,
              onClick: () => onNavigate('/my-roadmap'),
            },
            secondaryAction: {
              label: 'Explore Directions',
              onClick: () => onNavigate('/pathways'),
            },
          };
        } else if (isGoalSelected) {
          return {
            title: 'Goal · Selected',
            badge: 'Selected',
            badgeStyle: 'bg-teal-50 text-[#005F60] border-teal-200 font-bold',
            dynamicHeading: activeGoal.goal_title,
            description: 'This is your currently active education direction.',
            contextChip: activeGoal.pathway_title ? `Pathway: ${activeGoal.pathway_title}` : null,
            primaryCta: {
              label: 'View Roadmap',
              icon: ArrowRight,
              onClick: () => onNavigate('/my-roadmap'),
            },
            secondaryAction: {
              label: 'Change Direction',
              onClick: () => onNavigate('/pathways'),
            },
          };
        } else {
          return {
            title: 'Goal · Available',
            badge: 'Ready to Choose',
            badgeStyle: 'bg-slate-100 text-slate-700 border-slate-200',
            description: 'Choose a target education or career stream to generate your step-by-step roadmap.',
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
            description: 'Select a career goal to begin your milestone roadmap.',
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
              ? 'bg-teal-50 text-teal-800 border-teal-200' 
              : 'bg-orange-50 text-[#F97316] border-orange-200 font-bold',
            description: 'Work through actionable milestones, skills, and exams for your target direction.',
            contextChip: hasMilestoneData 
              ? `${milestoneCompletedCount} of ${milestoneTotalCount} milestones completed` 
              : null,
            primaryCta: {
              label: isRoadmapComplete ? 'View Completed Roadmap' : 'Continue Roadmap',
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

  // Keyboard navigation support
  const handleKeyDown = (e, stageId) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleStageSelect(stageId);
    }
  };

  return (
    <section 
      aria-label="Student Journey"
      className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4 font-sans"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center space-x-2">
          <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-400 font-sans">
            Your Student Journey
          </h3>
          <span className="text-[11px] text-slate-400 font-normal">
            • Explore each stage
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODERN JOURNEY RAIL TRACK                                                 */}
      {/* ========================================================================= */}
      <div className="relative py-1">
        {/* Subtle continuous 2px background rail (desktop & tablet) */}
        <div 
          aria-hidden="true" 
          className="hidden md:block absolute top-[23px] left-[10%] right-[10%] h-[2px] bg-slate-200 pointer-events-none z-0"
        >
          <div 
            className="h-full bg-[#005F60] transition-all duration-300"
            style={{ width: `${railProgressPercent}%` }}
          />
        </div>

        {/* 5 Interactive Stations */}
        <div 
          role="tablist" 
          aria-label="Student Journey Stations" 
          className="relative z-10 flex md:grid md:grid-cols-5 gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory py-1"
        >
          {stages.map((stage) => {
            const isSelected = stage.id === selectedStageId;
            const StageIcon = stage.icon;
            const isCurrentOrReady = stage.visualState === 'CURRENT' || stage.visualState === 'READY';
            const isCompleted = stage.visualState === 'COMPLETED';
            const isHistorical = stage.visualState === 'HISTORICAL';
            const isLocked = stage.visualState === 'LOCKED';

            return (
              <button
                key={stage.id}
                ref={(el) => { stationRefs.current[stage.id] = el; }}
                type="button"
                role="tab"
                id={`journey-station-${stage.id}`}
                aria-selected={isSelected}
                aria-current={stage.isCurrent ? 'step' : undefined}
                aria-controls="journey-context-panel"
                tabIndex={0}
                onClick={() => handleStageSelect(stage.id)}
                onKeyDown={(e) => handleKeyDown(e, stage.id)}
                className={`group relative flex flex-col items-center text-center p-2 rounded-xl transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#005F60] focus-visible:ring-offset-2 flex-shrink-0 min-w-[92px] md:min-w-0 snap-center ${
                  isSelected
                    ? 'bg-teal-50/60 shadow-2xs'
                    : 'bg-transparent hover:bg-teal-50/30'
                }`}
              >
                {/* Station Icon Surface (sits directly on/around the quiet rail) */}
                <div 
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center relative transition-all duration-200 transform-gpu ${
                    isSelected
                      ? 'bg-white border-2 border-[#005F60] text-[#005F60] shadow-xs'
                      : isCurrentOrReady
                      ? 'bg-white border-2 border-[#005F60] text-[#005F60] shadow-2xs group-hover:border-[#005F60] group-hover:-translate-y-0.5 group-hover:shadow-xs'
                      : isCompleted
                      ? 'bg-white border border-teal-300/90 text-[#005F60] shadow-2xs group-hover:border-[#005F60] group-hover:-translate-y-0.5 group-hover:shadow-xs'
                      : isHistorical
                      ? 'bg-white border border-slate-300 text-teal-800/80 shadow-2xs group-hover:border-[#005F60] group-hover:-translate-y-0.5 group-hover:shadow-xs'
                      : isLocked
                      ? 'bg-slate-50 border border-slate-200 text-slate-400 group-hover:border-slate-300 group-hover:-translate-y-0.5'
                      : 'bg-white border border-slate-300 text-slate-600 shadow-2xs group-hover:border-[#005F60] group-hover:-translate-y-0.5 group-hover:shadow-xs'
                  }`}
                >
                  <StageIcon className={`w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0 transition-colors duration-200 ${
                    isLocked 
                      ? 'text-slate-400 group-hover:text-slate-500' 
                      : isCurrentOrReady || isCompleted || isSelected 
                      ? 'text-[#005F60]' 
                      : 'text-slate-600 group-hover:text-[#005F60]'
                  }`} />

                  {/* Warm-orange accent dot for current/ready station */}
                  {isCurrentOrReady && (
                    <span 
                      aria-hidden="true" 
                      className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#F97316] ring-2 ring-white" 
                    />
                  )}
                </div>

                {/* Stage Title */}
                <span 
                  className={`text-xs sm:text-[13px] tracking-tight mt-2 truncate max-w-full transition-colors duration-200 ${
                    isSelected || isCurrentOrReady
                      ? 'font-black text-[#005F60]'
                      : isCompleted
                      ? 'font-bold text-slate-800 group-hover:text-[#005F60]'
                      : isHistorical
                      ? 'font-semibold text-slate-700 group-hover:text-[#005F60]'
                      : isLocked
                      ? 'font-medium text-slate-400 group-hover:text-slate-600'
                      : 'font-semibold text-slate-700 group-hover:text-[#005F60]'
                  }`}
                >
                  <span className="hidden sm:inline">{stage.title}</span>
                  <span className="sm:hidden">{stage.shortTitle}</span>
                </span>

                {/* Small Contextual Status */}
                <span 
                  className={`text-[10px] tracking-tight mt-0.5 truncate max-w-full transition-colors duration-200 ${
                    isCurrentOrReady
                      ? 'font-bold text-[#F97316]'
                      : isCompleted
                      ? 'font-medium text-teal-700'
                      : isHistorical
                      ? 'font-medium text-slate-500'
                      : isLocked
                      ? 'font-normal text-slate-400'
                      : 'font-normal text-slate-500'
                  }`}
                >
                  {stage.statusText}
                </span>

                {/* Restrained Active Station Indicator (connects to detail panel) */}
                <span 
                  aria-hidden="true" 
                  className={`w-5 h-0.5 rounded-full mt-2 transition-all duration-200 ${
                    isSelected ? 'bg-[#005F60]' : 'bg-transparent'
                  }`} 
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CONTEXTUAL DETAIL PANEL (CARRIES EXPLANATION AND ACTION)                  */}
      {/* ========================================================================= */}
      {panelData && (
        <div 
          id="journey-context-panel"
          role="region"
          aria-live="polite"
          aria-labelledby={`journey-station-${selectedStage.id}`}
          className="bg-[#F8FAF9] border border-teal-100 rounded-xl p-3.5 sm:p-4 text-slate-800 transition-all duration-150"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            {/* Context Content */}
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center space-x-1.5 text-xs font-black text-slate-900">
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
                <div className="pt-0.5">
                  <span className="inline-flex items-center space-x-1.5 text-[11px] font-semibold text-teal-900 bg-white border border-teal-200/80 px-2.5 py-0.5 rounded-md shadow-2xs">
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
                  className="bg-[#005F60] hover:bg-teal-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-2xs flex items-center space-x-1.5 cursor-pointer font-sans"
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
