import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import EditProfileDrawer from '../components/EditProfileDrawer';
import { getMyLatestAssessmentResultApi, getMyStudentGoalApi } from '../api/client';
import { 
  UserCheck, 
  GraduationCap, 
  MapPin, 
  Building2, 
  CheckCircle2,
  Edit3,
  Map,
  Target,
  Sparkles,
  ArrowRight,
  Compass,
  Check,
  Clock,
  ChevronRight,
  BookOpen
} from 'lucide-react';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, profile, loading: profileLoading } = useAuth();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

  // Independent state management for API resiliency
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [assessmentLoading, setAssessmentLoading] = useState(true);

  const [activeGoal, setActiveGoal] = useState(null);
  const [goalLoading, setGoalLoading] = useState(true);

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

  // Derived state flags
  const isAssessmentComplete = Boolean(assessmentResult);
  const isGoalSelected = Boolean(activeGoal);

  // Compact Academic Context String
  const academicContextStr = [
    profile?.current_level || 'Class 10',
    profile?.stream ? `${profile.stream} Stream` : null,
    profile?.diploma_branch || null,
    profile?.iti_trade || null,
    profile?.state || 'Karnataka',
  ].filter(Boolean).join(' • ');

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-[#0F172A] flex font-sans selection:bg-[#005F60] selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* Main Content Viewport */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        
        {/* Header Bar */}
        <Header 
          onMenuClick={() => setIsSidebarOpen(true)}
          onEditProfileClick={() => setIsEditDrawerOpen(true)}
        />

        {/* Dashboard Main Container */}
        <main className="p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6 flex-1">
          
          {/* SECTION 1: WELCOME HEADER */}
          <section className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-7 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

              <button
                type="button"
                onClick={() => setIsEditDrawerOpen(true)}
                className="inline-flex items-center space-x-1.5 bg-[#F8FAF8] hover:bg-teal-50 text-slate-700 hover:text-[#005F60] border border-slate-200 hover:border-teal-200 font-extrabold text-xs px-3.5 py-2.5 rounded-xl transition-all self-start sm:self-auto cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit profile</span>
              </button>
            </div>
          </section>

          {/* SECTION 2: PRIMARY FOCUS / YOUR NEXT STEP BANNER */}
          <section className="bg-gradient-to-r from-teal-900 via-[#005F60] to-teal-950 text-white rounded-2xl p-6 sm:p-8 shadow-md border border-teal-800/60 relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-widest text-teal-300 bg-teal-950/70 px-3 py-0.5 rounded-full border border-teal-700/60">
                  <Sparkles className="w-3 h-3 text-[#F97316]" />
                  <span>Your next step</span>
                </div>

                {!isAssessmentComplete ? (
                  <>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      Discover your strengths
                    </h2>
                    <p className="text-xs sm:text-sm text-teal-100/90 font-medium leading-relaxed">
                      Take a short assessment to understand the subjects, activities and career areas that may suit you.
                    </p>
                  </>
                ) : !isGoalSelected ? (
                  <>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      Explore options that fit you
                    </h2>
                    <p className="text-xs sm:text-sm text-teal-100/90 font-medium leading-relaxed">
                      Based on your assessment responses showing alignment with <span className="font-extrabold text-white underline decoration-[#F97316]">{assessmentResult.primary_stream_recommendation}</span>, explore pathways that match your goals.
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      Keep moving toward your goal
                    </h2>
                    <p className="text-xs sm:text-sm text-teal-100/90 font-medium leading-relaxed">
                      You are currently working toward <span className="font-extrabold text-white underline decoration-[#F97316]">{activeGoal.goal_title}</span>. Continue with your next milestone.
                    </p>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!isAssessmentComplete) navigate('/assessment');
                  else if (!isGoalSelected) navigate('/pathways');
                  else navigate('/my-roadmap');
                }}
                className="bg-[#F97316] hover:bg-orange-500 text-white font-black text-xs px-6 py-3.5 rounded-xl transition-all shadow-md flex items-center space-x-2 shrink-0 cursor-pointer"
              >
                <span>
                  {!isAssessmentComplete ? 'Start assessment' : !isGoalSelected ? 'Explore pathways' : 'Continue your plan'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </section>

          {/* SECTION 3: YOUR PROGRESS OVERVIEW */}
          <section className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#005F60] flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Your progress</span>
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
              {/* Profile Status */}
              <div className="bg-[#F8FAF8] border border-slate-200/70 rounded-xl p-3 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Profile</span>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[#0F172A]">Academic Info</span>
                  <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full flex items-center space-x-1">
                    <Check className="w-3 h-3" />
                    <span>Complete</span>
                  </span>
                </div>
              </div>

              {/* Assessment Status */}
              <div className="bg-[#F8FAF8] border border-slate-200/70 rounded-xl p-3 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Assessment</span>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[#0F172A]">Aptitude Test</span>
                  {isAssessmentComplete ? (
                    <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full flex items-center space-x-1">
                      <Check className="w-3 h-3" />
                      <span>Completed</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full">
                      Not completed
                    </span>
                  )}
                </div>
              </div>

              {/* Direction / Insights Status */}
              <div className="bg-[#F8FAF8] border border-slate-200/70 rounded-xl p-3 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Career options</span>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[#0F172A]">Insights</span>
                  {isAssessmentComplete ? (
                    <span className="text-[10px] font-extrabold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-full">
                      Career insights available
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded-full">
                      Locked
                    </span>
                  )}
                </div>
              </div>

              {/* Goal Status */}
              <div className="bg-[#F8FAF8] border border-slate-200/70 rounded-xl p-3 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Goal</span>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[#0F172A]">Target Track</span>
                  {isGoalSelected ? (
                    <span className="text-[10px] font-extrabold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-full">
                      Selected
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-full">
                      Not selected
                    </span>
                  )}
                </div>
              </div>

              {/* Plan / Roadmap Status */}
              <div className="bg-[#F8FAF8] border border-slate-200/70 rounded-xl p-3 space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Plan</span>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[#0F172A]">Roadmap</span>
                  {isGoalSelected ? (
                    <span className="text-[10px] font-extrabold text-orange-800 bg-orange-100/80 px-2 py-0.5 rounded-full">
                      In progress ({activeGoal?.progress?.percentage}%)
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded-full">
                      Not started
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 4: YOUR STRENGTHS & INTERESTS (CAREER INSIGHTS) */}
          <section className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
              <div>
                <div className="inline-flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-wider bg-teal-50 text-[#005F60] px-2.5 py-0.5 rounded-full border border-teal-200 mb-1">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Exploration Guidance</span>
                </div>
                <h3 className="text-lg font-black text-[#0F172A] tracking-tight">
                  Your strengths & interests
                </h3>
              </div>

              {isAssessmentComplete && (
                <button
                  type="button"
                  onClick={() => navigate('/pathways')}
                  className="inline-flex items-center space-x-1.5 text-xs font-extrabold text-[#005F60] hover:underline self-start sm:self-auto cursor-pointer"
                >
                  <span>Explore options</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Assessment Loading Skeleton */}
            {assessmentLoading && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                <div className="h-10 bg-slate-200/60 rounded-xl"></div>
              </div>
            )}

            {/* Assessment Completed Screen */}
            {!assessmentLoading && assessmentResult && (
              <div className="bg-[#F8FAF8] border border-teal-200/80 rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-600">Primary Direction:</span>
                    <span className="text-xs font-black text-[#005F60] bg-teal-100/90 border border-teal-300/80 px-3 py-1 rounded-xl">
                      Your responses show strong alignment with {assessmentResult.primary_stream_recommendation} pathways
                    </span>
                  </div>

                  {assessmentResult.top_career_match && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-xs font-bold text-slate-600">Suggested Career Area:</span>
                      <span className="text-xs font-extrabold text-[#F97316] bg-orange-50 border border-orange-200 px-3 py-0.5 rounded-full">
                        {assessmentResult.top_career_match}
                      </span>
                      {assessmentResult.secondary_stream_recommendation && (
                        <span className="text-xs text-slate-500 font-medium">
                          (Secondary: {assessmentResult.secondary_stream_recommendation})
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {assessmentResult.summary_text || 'These results suggest areas you may want to explore further based on your assessment responses.'}
                </p>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 font-medium italic">
                    These results are guidance tools to explore options, not fixed career decisions.
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate('/assessment')}
                    className="text-[#005F60] hover:underline font-bold text-xs cursor-pointer"
                  >
                    Retake assessment
                  </button>
                </div>
              </div>
            )}

            {/* Assessment Incomplete Banner */}
            {!assessmentLoading && !assessmentResult && (
              <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-amber-950">
                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="font-extrabold text-sm text-amber-900">Discover what fits you</h4>
                  <p className="text-xs text-amber-800/90 max-w-xl">
                    Take our short assessment to discover subjects and career areas aligned with your interests and academic background.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/assessment')}
                  className="bg-[#005F60] hover:bg-teal-800 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
                >
                  Discover your strengths
                </button>
              </div>
            )}
          </section>

          {/* SECTION 5: YOUR CAREER PLAN */}
          <section className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
              <div>
                <div className="inline-flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-wider bg-orange-50 text-[#F97316] px-2.5 py-0.5 rounded-full border border-orange-200 mb-1">
                  <Target className="w-3.5 h-3.5" />
                  <span>Target Goal</span>
                </div>
                <h3 className="text-lg font-black text-[#0F172A] tracking-tight">
                  {isGoalSelected ? 'Your career plan' : 'Choose a career direction'}
                </h3>
              </div>

              {isGoalSelected && (
                <button
                  type="button"
                  onClick={() => navigate('/my-roadmap')}
                  className="inline-flex items-center space-x-1.5 text-xs font-extrabold text-[#005F60] hover:underline self-start sm:self-auto cursor-pointer"
                >
                  <span>View full plan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Goal Loading Skeleton */}
            {goalLoading && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                <div className="h-10 bg-slate-200/60 rounded-xl"></div>
              </div>
            )}

            {/* Active Goal State */}
            {!goalLoading && activeGoal && (
              <div className="bg-[#F8FAF8] border border-slate-200/80 rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Goal</span>
                    <h4 className="text-base font-black text-[#0F172A]">{activeGoal.goal_title}</h4>
                    <p className="text-xs text-slate-500">
                      Pathway: <span className="font-bold text-[#005F60]">{activeGoal.pathway_title}</span>
                    </p>
                  </div>

                  <span className="text-xs font-black text-[#F97316] bg-orange-100/80 px-3 py-1 rounded-full border border-orange-200/80 self-start sm:self-auto">
                    {activeGoal.progress.completed} of {activeGoal.progress.total} Milestones Complete ({activeGoal.progress.percentage}%)
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden border border-slate-300/40">
                    <div 
                      className="bg-gradient-to-r from-[#005F60] to-[#F97316] h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(activeGoal.progress.percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-slate-600">
                    <span className="font-bold text-[#005F60]">Next milestone: </span>
                    <span>
                      {activeGoal.milestones?.find(m => m.status === 'AVAILABLE')?.title || 'Check roadmap for next step'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate('/my-roadmap')}
                    className="bg-[#005F60] hover:bg-teal-800 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-xs flex items-center justify-center space-x-1.5 self-start sm:self-auto cursor-pointer"
                  >
                    <span>Continue your plan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* No Active Goal Empty State */}
            {!goalLoading && !activeGoal && (
              <div className="bg-[#F8FAF8] border border-slate-200/80 rounded-2xl p-6 text-center space-y-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#F97316] border border-orange-200 flex items-center justify-center mx-auto">
                  <Target className="w-5 h-5" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h4 className="font-extrabold text-sm text-[#0F172A]">You haven't selected a career goal yet</h4>
                  <p className="text-xs text-slate-500">
                    Explore education and career pathways based on your interests and academic background.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/pathways')}
                  className="bg-[#005F60] hover:bg-teal-800 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs inline-flex items-center space-x-1.5 cursor-pointer"
                >
                  <Compass className="w-4 h-4" />
                  <span>Explore pathways</span>
                </button>
              </div>
            )}
          </section>

          {/* SECTION 6: QUICK ACTIONS */}
          <section className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#005F60]">
                Quick actions
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <button
                type="button"
                onClick={() => navigate('/assessment')}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-teal-300 bg-[#F8FAF8] hover:bg-teal-50/50 flex items-center justify-between text-slate-700 font-extrabold transition-all group cursor-pointer"
              >
                <div className="flex items-center space-x-2.5">
                  <Sparkles className="w-4 h-4 text-[#005F60]" />
                  <span>Discover your strengths</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#005F60] transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/pathways')}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-teal-300 bg-[#F8FAF8] hover:bg-teal-50/50 flex items-center justify-between text-slate-700 font-extrabold transition-all group cursor-pointer"
              >
                <div className="flex items-center space-x-2.5">
                  <Compass className="w-4 h-4 text-[#005F60]" />
                  <span>Explore pathways</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#005F60] transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/my-roadmap')}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-teal-300 bg-[#F8FAF8] hover:bg-teal-50/50 flex items-center justify-between text-slate-700 font-extrabold transition-all group cursor-pointer"
              >
                <div className="flex items-center space-x-2.5">
                  <Map className="w-4 h-4 text-[#005F60]" />
                  <span>View my plan</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#005F60] transition-colors" />
              </button>
            </div>
          </section>

          {/* SECTION 7: ACADEMIC PROFILE */}
          <section className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
              <div>
                <div className="inline-flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-wider bg-teal-50 text-[#005F60] px-2.5 py-0.5 rounded-full border border-teal-200 mb-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Academic details</span>
                </div>
                <h3 className="text-lg font-black text-[#0F172A] tracking-tight">
                  Your academic profile
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsEditDrawerOpen(true)}
                className="inline-flex items-center space-x-1 bg-[#F8FAF8] hover:bg-teal-50 text-slate-700 hover:text-[#005F60] border border-slate-200 font-extrabold text-xs px-3.5 py-2 rounded-xl transition-all self-start sm:self-auto cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit profile</span>
              </button>
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

        {/* Footer */}
        <footer className="border-t border-slate-200/80 bg-white py-4 px-8 text-center text-xs text-slate-500">
          Udaan AI — Student Career Guidance Dashboard
        </footer>

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
