import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import EditProfileDrawer from '../components/EditProfileDrawer';
import StudentJourneyNavigator from '../components/StudentJourneyNavigator';
import { 
  getMyLatestAssessmentResultApi, 
  getMyStudentGoalApi,
  getLatestRecommendationsApi
} from '../api/client';
import { 
  UserCheck, 
  GraduationCap, 
  MapPin, 
  Building2, 
  CheckCircle2,
  Edit3,
  Target,
  Sparkles,
  ArrowRight,
  Compass,
  Check
} from 'lucide-react';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, profile, loading: profileLoading } = useAuth();
  const { isCollapsed } = useSidebar();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

  // Independent state management for API resiliency
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [assessmentLoading, setAssessmentLoading] = useState(true);

  const [activeGoal, setActiveGoal] = useState(null);
  const [goalLoading, setGoalLoading] = useState(true);

  const [recommendations, setRecommendations] = useState(null);
  const [recsLoading, setRecsLoading] = useState(true);

  const loadRecommendations = async () => {
    setRecsLoading(true);
    try {
      const res = await getLatestRecommendationsApi();
      setRecommendations(res);
    } catch (err) {
      setRecommendations(null);
    } finally {
      setRecsLoading(false);
    }
  };

  const loadAssessmentData = async () => {
    setAssessmentLoading(true);
    try {
      const res = await getMyLatestAssessmentResultApi();
      setAssessmentResult(res);
    } catch (err) {
      setAssessmentResult(null);
    } finally {
      setAssessmentLoading(false);
    }
  };

  const loadGoalData = async () => {
    setGoalLoading(true);
    try {
      const goal = await getMyStudentGoalApi();
      setActiveGoal(goal);
    } catch (err) {
      setActiveGoal(null);
    } finally {
      setGoalLoading(false);
    }
  };

  useEffect(() => {
    loadAssessmentData();
    loadGoalData();
    loadRecommendations();
  }, []);

  // Time-of-day greeting helper
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Student first name extraction
  const fullName = profile?.full_name || user?.full_name || 'Student';
  const firstName = fullName.trim().split(' ')[0] || 'Student';

  // Derived state flags (Constraint 12: isCurrentAssessmentComplete vs historical)
  const hasHistoricalAssessment = Boolean(assessmentResult);
  const isCurrentAssessmentComplete = Boolean(assessmentResult && assessmentResult.is_current === true);
  const isAssessmentPending = Boolean(hasHistoricalAssessment && !isCurrentAssessmentComplete);
  const isGoalSelected = Boolean(activeGoal);
  const isRoadmapStarted = isGoalSelected && (activeGoal?.progress?.completed > 0);

  // Compact Academic Context String
  const academicContextStr = [
    profile?.current_level || 'Class 10',
    profile?.stream ? `${profile.stream} Stream` : null,
    profile?.diploma_branch || null,
    profile?.iti_trade || null,
    profile?.state || 'Karnataka',
  ].filter(Boolean).join(' • ');

  // Helper to find the strongest dimension
  const getStrongestDimension = (scores) => {
    if (!scores || typeof scores !== 'object') return null;
    let maxDim = null;
    let maxScore = -Infinity;
    for (const [dim, val] of Object.entries(scores)) {
      if (val > maxScore) {
        maxScore = val;
        maxDim = dim;
      }
    }
    if (!maxDim) return null;
    return maxDim.charAt(0).toUpperCase() + maxDim.slice(1);
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-[#0F172A] flex font-sans selection:bg-[#005F60] selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* Main Content Viewport */}
      <div className={`flex-1 ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'} transition-all duration-200 ease-in-out flex flex-col min-w-0`}>
        
        {/* Header Bar */}
        <Header 
          onMenuClick={() => setIsSidebarOpen(true)}
          onEditProfileClick={() => setIsEditDrawerOpen(true)}
        />

        {/* Dashboard Main Container */}
        <main className="p-4 sm:p-6 max-w-5xl w-full mx-auto space-y-5 flex-1">
          
          {/* SECTION 1: WELCOME HEADER */}
          <section className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="inline-flex items-center space-x-2 text-xs font-bold text-[#005F60] bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>{academicContextStr}</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
                  {getGreeting()}, <span className="text-[#005F60]">{firstName}</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Here's what you can work on today.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 2: PRIMARY FOCUS / YOUR NEXT STEP BANNER */}
          <section className="bg-gradient-to-r from-teal-900 via-[#005F60] to-teal-950 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-teal-800/60 relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-widest text-teal-300 bg-teal-950/70 px-3 py-0.5 rounded-full border border-teal-700/60">
                  <Sparkles className="w-3 h-3 text-[#F97316]" />
                  <span>Your next step</span>
                </div>

                {!hasHistoricalAssessment ? (
                  <>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight font-sans">
                      Discover your strengths and interests
                    </h2>
                    <p className="text-xs sm:text-sm text-teal-100/90 font-medium leading-relaxed font-sans">
                      Complete your Career Discovery Assessment to understand which education and career directions may suit you.
                    </p>
                  </>
                ) : !isGoalSelected ? (
                  <>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight font-sans">
                      Explore options that fit you
                    </h2>
                    <p className="text-xs sm:text-sm text-teal-100/90 font-medium leading-relaxed font-sans">
                      Your assessment shows alignment with <span className="font-extrabold text-white underline decoration-[#F97316]">{assessmentResult.primary_stream_recommendation || 'recommended pathways'}</span>. Explore pathways that match your interests and goals.
                    </p>
                  </>
                ) : !isRoadmapStarted ? (
                  <>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight font-sans">
                      Build your career roadmap
                    </h2>
                    <p className="text-xs sm:text-sm text-teal-100/90 font-medium leading-relaxed font-sans">
                      Your active goal:<br />
                      <span className="font-extrabold text-white underline decoration-[#F97316]">{activeGoal.goal_title}</span>
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight font-sans">
                      Continue your roadmap
                    </h2>
                    <p className="text-xs sm:text-sm text-teal-100/90 font-medium leading-relaxed font-sans">
                      Continue working through the milestones for your selected goal.
                    </p>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!hasHistoricalAssessment) navigate('/assessment?mode=take');
                  else if (!isGoalSelected) navigate('/pathways');
                  else navigate('/my-roadmap');
                }}
                className="bg-[#F97316] hover:bg-orange-500 text-white font-black text-xs px-6 py-3.5 rounded-xl transition-all shadow-md flex items-center space-x-2 shrink-0 cursor-pointer font-sans"
              >
                <span>
                  {!hasHistoricalAssessment ? 'Start Assessment →' : !isGoalSelected ? 'Explore Pathways →' : !isRoadmapStarted ? 'View My Roadmap →' : 'Continue Roadmap →'}
                </span>
              </button>
            </div>
          </section>

          {/* SECTION 3: YOUR STUDENT JOURNEY NAVIGATOR */}
          <StudentJourneyNavigator
            profile={profile}
            assessmentResult={assessmentResult}
            activeGoal={activeGoal}
            recommendations={recommendations}
            academicContextStr={academicContextStr}
            onEditProfile={() => setIsEditDrawerOpen(true)}
            onNavigate={(path) => navigate(path)}
          />

          {/* SECTION 4: YOUR STRENGTHS & INTERESTS */}
          <section className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
              <div>
                <div className="inline-flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-wider bg-teal-50 text-[#005F60] px-2.5 py-0.5 rounded-full border border-teal-200 mb-1 font-sans">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Your Strengths & Interests</span>
                </div>
                <h3 className="text-lg font-black text-[#0F172A] tracking-tight font-sans">
                  Career Guidance Summary
                </h3>
              </div>
            </div>

            {/* Assessment Loading Skeleton */}
            {assessmentLoading && (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                <div className="h-10 bg-slate-200/60 rounded-xl"></div>
              </div>
            )}

            {/* Assessment Completed Screen */}
            {!assessmentLoading && assessmentResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 py-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider font-sans">Primary Direction</span>
                    <span className="font-extrabold text-[#005F60] text-sm block font-sans">
                      {assessmentResult.primary_stream_recommendation}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider font-sans">Suggested Career Area</span>
                    <span className="font-extrabold text-[#F97316] text-sm block font-sans">
                      {assessmentResult.top_career_match}
                    </span>
                  </div>

                  {assessmentResult.secondary_stream_recommendation && (
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider font-sans">Also Worth Exploring</span>
                      <span className="font-extrabold text-slate-700 text-sm block font-sans">
                        {assessmentResult.secondary_stream_recommendation}
                      </span>
                    </div>
                  )}

                  <div className="space-y-0.5 flex items-end">
                    <span className="text-xs font-bold text-slate-500 font-sans">
                      Strongest assessment area:{' '}
                      <span className="font-extrabold text-slate-800 font-sans">
                        {getStrongestDimension(assessmentResult.dimension_scores) || 'Science'}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => navigate('/assessment')}
                    className="text-[#005F60] hover:underline font-extrabold text-xs cursor-pointer font-sans"
                  >
                    Review Assessment
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/pathways')}
                    className="text-[#005F60] hover:underline font-extrabold text-xs flex items-center space-x-1 cursor-pointer font-sans"
                  >
                    <span>Explore Options</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Assessment Incomplete Banner */}
            {!assessmentLoading && !assessmentResult && (
              <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-amber-950">
                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="font-extrabold text-sm text-amber-900 font-sans">Discover what fits you</h4>
                  <p className="text-xs text-amber-800/90 max-w-xl font-sans">
                    Take our Career Discovery Assessment to discover subjects and career areas aligned with your interests and academic background.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/assessment?mode=take')}
                  className="bg-[#005F60] hover:bg-teal-800 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer font-sans"
                >
                  Discover your strengths
                </button>
              </div>
            )}
          </section>

          {/* SECTION 4.5: RECOMMENDED DIRECTIONS */}
          <section className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
              <div>
                <div className="inline-flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-wider bg-teal-50 text-[#005F60] px-2.5 py-0.5 rounded-full border border-teal-200 mb-1 font-sans">
                  <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
                  <span>Suggested Pathways</span>
                </div>
                <h3 className="text-lg font-black text-[#0F172A] tracking-tight font-sans">
                  Your Recommended Directions
                </h3>
              </div>
            </div>

            {/* Loading state */}
            {recsLoading && (
              <div className="space-y-3 animate-pulse">
                <div className="h-14 bg-slate-100 rounded-2xl"></div>
                <div className="h-14 bg-slate-100 rounded-2xl"></div>
              </div>
            )}

            {/* Student has NOT completed assessment */}
            {!recsLoading && !assessmentResult && (
              <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-amber-950 font-sans">
                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="font-extrabold text-sm text-amber-900">Discover directions that fit your interests</h4>
                  <p className="text-xs text-amber-800/90 max-w-xl">
                    Take the career discovery assessment to view personalized career and education pathway recommendations.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/assessment?mode=take')}
                  className="bg-[#005F60] hover:bg-teal-800 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
                >
                  Take Career Assessment
                </button>
              </div>
            )}

            {/* Assessment complete but recommendation list is empty */}
            {!recsLoading && assessmentResult && (!recommendations || !recommendations.recommendations || recommendations.recommendations.length === 0) && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-800 font-sans">
                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="font-extrabold text-sm text-slate-900">Assessment Complete</h4>
                  <p className="text-xs text-slate-600 max-w-xl">
                    Your assessment is complete. We’re still expanding pathway guidance for your current academic level.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/pathways')}
                  className="bg-[#005F60] hover:bg-teal-800 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
                >
                  Explore All Pathways
                </button>
              </div>
            )}

            {/* Recommendations exist */}
            {!recsLoading && assessmentResult && recommendations && recommendations.recommendations && recommendations.recommendations.length > 0 && (
              <div className="space-y-4 font-sans">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {recommendations.recommendations.map((rec) => {
                    const badgeColor = rec.match_label === 'High' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : rec.match_label === 'Good' 
                      ? 'bg-teal-50 text-teal-700 border-teal-200' 
                      : 'bg-slate-50 text-slate-600 border-slate-200';

                    return (
                      <div 
                        key={rec.pathway_id} 
                        className="bg-white border border-slate-200 hover:border-[#005F60]/50 rounded-2xl p-4 flex flex-col justify-between shadow-2xs transition-all space-y-3"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${badgeColor}`}>
                              {rec.match_label} ({rec.match_score}%)
                            </span>
                            <span className="text-[10px] font-extrabold text-slate-400">Rank #{rec.rank}</span>
                          </div>
                          
                          <h4 className="font-black text-[#0F172A] text-sm tracking-tight leading-tight line-clamp-1">
                            {rec.pathway_title}
                          </h4>

                          {rec.reasons && rec.reasons.length > 0 && (
                            <p className="text-[11px] text-slate-500 leading-relaxed font-semibold line-clamp-2">
                              {rec.reasons[0]}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => navigate(`/pathways?pathway_id=${encodeURIComponent(rec.pathway_id)}`)}
                          className="w-full bg-[#005F60] hover:bg-teal-800 text-white font-extrabold text-xs py-2.5 px-3 rounded-xl transition-all shadow-3xs flex items-center justify-center space-x-1.5 cursor-pointer"
                        >
                          <span>Explore Pathway</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {recommendations.disclaimer && (
                  <p className="text-[10px] text-slate-400 font-semibold leading-normal pt-2 border-t border-slate-100 italic">
                    Disclaimer: {recommendations.disclaimer}
                  </p>
                )}
              </div>
            )}
          </section>

          {/* SECTION 5: CAREER GOAL */}
          <section className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
              <div>
                <div className="inline-flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-wider bg-orange-50 text-[#F97316] px-2.5 py-0.5 rounded-full border border-orange-200 mb-1 font-sans">
                  <Target className="w-3.5 h-3.5" />
                  <span>{isGoalSelected ? 'YOUR ACTIVE GOAL' : 'TARGET GOAL'}</span>
                </div>
                <h3 className="text-lg font-black text-[#0F172A] tracking-tight font-sans">
                  {isGoalSelected ? activeGoal.goal_title : 'Choose a career direction'}
                </h3>
              </div>
              {isGoalSelected && (
                <button
                  type="button"
                  onClick={() => navigate('/pathways')}
                  className="text-xs font-bold text-slate-500 hover:text-[#005F60] hover:underline cursor-pointer font-sans"
                >
                  Change goal
                </button>
              )}
            </div>

            {/* Goal Loading Skeleton */}
            {goalLoading && (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                <div className="h-10 bg-slate-200/60 rounded-xl"></div>
              </div>
            )}

            {/* Active Goal State */}
            {!goalLoading && activeGoal && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 py-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider font-sans">Pathway</span>
                    <span className="font-extrabold text-[#005F60] text-sm block font-sans">
                      {activeGoal.pathway_title}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider font-sans">Education Stage</span>
                    <span className="font-extrabold text-slate-700 text-sm block font-sans">
                      {profile?.current_level || 'Class 10'}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                    <span className="font-sans">Milestone Progress</span>
                    <span className="text-[#F97316] font-sans">{activeGoal.progress?.percentage || 0}% Complete</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                    <div 
                      className="bg-gradient-to-r from-[#005F60] to-[#F97316] h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(activeGoal.progress?.percentage || 0, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-slate-600">
                    <span className="font-bold text-[#005F60] font-sans">Next milestone: </span>
                    <span className="font-sans">
                      {activeGoal.milestones?.find(m => m.status === 'AVAILABLE')?.title || 'Check roadmap for next step'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate('/my-roadmap')}
                    className="bg-[#005F60] hover:bg-teal-800 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer font-sans"
                  >
                    <span>View My Roadmap</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* No Active Goal Empty State */}
            {!goalLoading && !activeGoal && (
              <div className="py-6 text-center space-y-4 max-w-md mx-auto">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#F97316] border border-orange-200/80 flex items-center justify-center mx-auto">
                  <Target className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-700 font-sans">
                    You haven't selected a career goal yet.
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    Explore education and career pathways based on your interests and academic background.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/pathways')}
                  className="bg-[#005F60] hover:bg-teal-800 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs inline-flex items-center space-x-1.5 cursor-pointer font-sans"
                >
                  <span>Explore Pathways</span>
                </button>
              </div>
            )}
          </section>

          {/* SECTION 6: ACADEMIC PROFILE */}
          <section className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div>
                <div className="inline-flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-wider bg-teal-50 text-[#005F60] px-2.5 py-0.5 rounded-full border border-teal-200 mb-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Academic details</span>
                </div>
                <h3 className="text-lg font-black text-[#0F172A] tracking-tight">
                  Your academic profile
                </h3>
              </div>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 bg-[#F8FAF8] border border-slate-200/70 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Student name</span>
                <span className="font-black text-[#0F172A] text-sm block">
                  {profile?.full_name || user?.full_name || 'N/A'}
                </span>
              </div>

              <div className="p-3.5 bg-[#F8FAF8] border border-slate-200/70 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Education level & year</span>
                <span className="font-black text-[#005F60] text-sm block flex items-center space-x-1.5">
                  <GraduationCap className="w-4 h-4 text-[#005F60]" />
                  <span>{profile?.current_level || 'Class 10'} ({profile?.class_or_year || '10th Standard'})</span>
                </span>
              </div>

              {profile?.stream && (
                <div className="p-3.5 bg-[#F8FAF8] border border-slate-200/70 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">PUC stream</span>
                  <span className="font-black text-[#F97316] text-sm block">
                    {profile.stream} Stream
                  </span>
                </div>
              )}

              {profile?.diploma_branch && (
                <div className="p-3.5 bg-[#F8FAF8] border border-slate-200/70 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Diploma branch</span>
                  <span className="font-black text-[#0F172A] text-sm block">
                    {profile.diploma_branch}
                  </span>
                </div>
              )}

              {profile?.iti_trade && (
                <div className="p-3.5 bg-[#F8FAF8] border border-slate-200/70 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">ITI trade</span>
                  <span className="font-black text-[#0F172A] text-sm block">
                    {profile.iti_trade}
                  </span>
                </div>
              )}

              <div className="p-3.5 bg-[#F8FAF8] border border-slate-200/70 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Education board</span>
                <span className="font-extrabold text-[#0F172A] text-xs block">
                  {profile?.board || 'Karnataka State Board (SSLC)'}
                </span>
              </div>

              <div className="p-3.5 bg-[#F8FAF8] border border-slate-200/70 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">School / College</span>
                <span className="font-extrabold text-[#0F172A] text-xs block flex items-center space-x-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{profile?.institution_name || 'Government High School'}</span>
                </span>
              </div>

              <div className="p-3.5 bg-[#F8FAF8] border border-slate-200/70 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">District & State</span>
                <span className="font-extrabold text-[#0F172A] text-xs block flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#005F60] shrink-0" />
                  <span>{profile?.district || 'Bengaluru Urban'}, {profile?.state || 'Karnataka'}</span>
                </span>
              </div>

              <div className="p-3.5 bg-[#F8FAF8] border border-slate-200/70 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Preferred language</span>
                <span className="font-extrabold text-[#0F172A] text-xs block">
                  {profile?.preferred_language || 'English'}
                </span>
              </div>
            </div>
          </section>

        </main>
      </div>

      {/* Edit Profile Drawer */}
      <EditProfileDrawer 
        isOpen={isEditDrawerOpen} 
        onClose={() => setIsEditDrawerOpen(false)} 
      />
    </div>
  );
};

export default DashboardPage;
