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
  ChevronRight
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
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        
        {/* Header Bar */}
        <Header 
          onMenuClick={() => setIsSidebarOpen(true)}
          onEditProfileClick={() => setIsEditDrawerOpen(true)}
        />

        {/* Dashboard Main Container */}
        <main className="p-4 sm:p-6 md:p-8 max-w-5xl w-full mx-auto space-y-6 flex-1">
          
          {/* SECTION 1: WELCOME HEADER */}
          <section className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
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
                      Discover your strengths and interests
                    </h2>
                    <p className="text-xs sm:text-sm text-teal-100/90 font-medium leading-relaxed">
                      Complete your Career Discovery Assessment to understand which education and career directions may suit you.
                    </p>
                  </>
                ) : !isGoalSelected ? (
                  <>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      Explore options that fit you
                    </h2>
                    <p className="text-xs sm:text-sm text-teal-100/90 font-medium leading-relaxed">
                      Your assessment shows strong alignment with <span className="font-extrabold text-white underline decoration-[#F97316]">{assessmentResult.primary_stream_recommendation}</span>. Explore pathways that match your interests and goals.
                    </p>
                  </>
                ) : !isRoadmapStarted ? (
                  <>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      Build your career roadmap
                    </h2>
                    <p className="text-xs sm:text-sm text-teal-100/90 font-medium leading-relaxed">
                      Your active goal: <span className="font-extrabold text-white underline decoration-[#F97316]">{activeGoal.goal_title}</span>
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      Continue your roadmap
                    </h2>
                    <p className="text-xs sm:text-sm text-teal-100/90 font-medium leading-relaxed">
                      Continue working through the milestones for your selected goal.
                    </p>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!isAssessmentComplete) navigate('/assessment?mode=take');
                  else if (!isGoalSelected) navigate('/pathways');
                  else navigate('/my-roadmap');
                }}
                className="bg-[#F97316] hover:bg-orange-500 text-white font-black text-xs px-6 py-3.5 rounded-xl transition-all shadow-md flex items-center space-x-2 shrink-0 cursor-pointer"
              >
                <span>
                  {!isAssessmentComplete ? 'Start Assessment →' : !isGoalSelected ? 'Explore Pathways →' : !isRoadmapStarted ? 'View My Roadmap →' : 'Continue Roadmap →'}
                </span>
              </button>
            </div>
          </section>

          {/* SECTION 3: YOUR PROGRESS OVERVIEW */}
          <section className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#005F60] flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Your Progress</span>
              </h3>
            </div>

            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 py-2">
              {/* Step 1: Profile */}
              <div className="flex items-center space-x-3 w-full md:w-auto">
                <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center font-extrabold shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">Profile</span>
                  <span className="font-extrabold text-[#0F172A] text-xs">Complete</span>
                </div>
              </div>

              <div className="hidden md:block flex-1 h-0.5 bg-slate-200"></div>

              {/* Step 2: Assessment */}
              <div className="flex items-center space-x-3 w-full md:w-auto">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold shrink-0 border ${
                  isAssessmentComplete 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}>
                  {isAssessmentComplete ? <Check className="w-4 h-4" /> : <span className="text-xs">2</span>}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">Assessment</span>
                  <span className={`font-extrabold text-xs ${isAssessmentComplete ? 'text-[#0F172A]' : 'text-slate-500'}`}>
                    {isAssessmentComplete ? 'Completed' : 'Pending'}
                  </span>
                </div>
              </div>

              <div className={`hidden md:block flex-1 h-0.5 ${isAssessmentComplete ? 'bg-slate-200' : 'bg-slate-100'}`}></div>

              {/* Step 3: Career Direction */}
              <div className="flex items-center space-x-3 w-full md:w-auto">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold shrink-0 border ${
                  isAssessmentComplete 
                    ? 'bg-teal-50 border-teal-200 text-[#005F60]' 
                    : 'bg-slate-50 border-slate-200 text-slate-300'
                }`}>
                  {isAssessmentComplete ? <Check className="w-4 h-4" /> : <span className="text-xs">3</span>}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">Career Direction</span>
                  <span className={`font-extrabold text-xs ${isAssessmentComplete ? 'text-[#0F172A]' : 'text-slate-400'}`}>
                    {isAssessmentComplete ? 'Available' : 'Locked'}
                  </span>
                </div>
              </div>

              <div className={`hidden md:block flex-1 h-0.5 ${isAssessmentComplete ? 'bg-slate-200' : 'bg-slate-100'}`}></div>

              {/* Step 4: Goal */}
              <div className="flex items-center space-x-3 w-full md:w-auto">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold shrink-0 border ${
                  isGoalSelected 
                    ? 'bg-teal-50 border-teal-200 text-[#005F60]' 
                    : 'bg-slate-50 border-slate-200 text-slate-300'
                }`}>
                  {isGoalSelected ? <Check className="w-4 h-4" /> : <span className="text-xs">4</span>}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">Goal</span>
                  <span className={`font-extrabold text-xs ${isGoalSelected ? 'text-[#0F172A]' : 'text-slate-400'}`}>
                    {isGoalSelected ? 'Selected' : 'Not selected'}
                  </span>
                </div>
              </div>

              <div className={`hidden md:block flex-1 h-0.5 ${isGoalSelected ? 'bg-slate-200' : 'bg-slate-100'}`}></div>

              {/* Step 5: Roadmap */}
              <div className="flex items-center space-x-3 w-full md:w-auto">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold shrink-0 border ${
                  isGoalSelected 
                    ? 'bg-orange-50 border-orange-200 text-[#F97316]' 
                    : 'bg-slate-50 border-slate-200 text-slate-300'
                }`}>
                  {isGoalSelected ? <span className="text-xs">✓</span> : <span className="text-xs">5</span>}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">Roadmap</span>
                  <span className={`font-extrabold text-xs ${isGoalSelected ? 'text-[#F97316]' : 'text-slate-400'}`}>
                    {isGoalSelected ? `In progress (${activeGoal?.progress?.percentage}%)` : 'Not started'}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 4: YOUR STRENGTHS & INTERESTS */}
          <section className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
              <div>
                <div className="inline-flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-wider bg-teal-50 text-[#005F60] px-2.5 py-0.5 rounded-full border border-teal-200 mb-1">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Your Strengths & Interests</span>
                </div>
                <h3 className="text-lg font-black text-[#0F172A] tracking-tight">
                  Career Guidance Summary
                </h3>
              </div>
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
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-[#F8FAF8] border border-slate-200/60 rounded-xl space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Primary Direction</span>
                    <span className="font-extrabold text-[#005F60] text-xs block">
                      {assessmentResult.primary_stream_recommendation}
                    </span>
                  </div>

                  <div className="p-4 bg-[#F8FAF8] border border-slate-200/60 rounded-xl space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Suggested Career Area</span>
                    <span className="font-extrabold text-[#F97316] text-xs block">
                      {assessmentResult.top_career_match}
                    </span>
                  </div>

                  {assessmentResult.secondary_stream_recommendation && (
                    <div className="p-4 bg-[#F8FAF8] border border-slate-200/60 rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Also Worth Exploring</span>
                      <span className="font-extrabold text-slate-700 text-xs block">
                        {assessmentResult.secondary_stream_recommendation}
                      </span>
                    </div>
                  )}

                  <div className="p-4 bg-[#F8FAF8] border border-slate-200/60 rounded-xl space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Strongest Assessment Area</span>
                    <span className="font-extrabold text-slate-700 text-xs block">
                      {getStrongestDimension(assessmentResult.dimension_scores) || 'Science'}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => navigate('/assessment')}
                    className="text-[#005F60] hover:underline font-extrabold text-xs cursor-pointer"
                  >
                    Review Assessment
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/pathways')}
                    className="text-[#005F60] hover:underline font-extrabold text-xs flex items-center space-x-1 cursor-pointer"
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
                  <h4 className="font-extrabold text-sm text-amber-900">Discover what fits you</h4>
                  <p className="text-xs text-amber-800/90 max-w-xl">
                    Take our short assessment to discover subjects and career areas aligned with your interests and academic background.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/assessment?mode=take')}
                  className="bg-[#005F60] hover:bg-teal-800 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
                >
                  Discover your strengths
                </button>
              </div>
            )}
          </section>

          {/* SECTION 5: CAREER GOAL */}
          <section className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
              <div>
                <div className="inline-flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-wider bg-orange-50 text-[#F97316] px-2.5 py-0.5 rounded-full border border-orange-200 mb-1">
                  <Target className="w-3.5 h-3.5" />
                  <span>{isGoalSelected ? 'Your Active Goal' : 'Career Goal'}</span>
                </div>
                <h3 className="text-lg font-black text-[#0F172A] tracking-tight">
                  {isGoalSelected ? 'Selected Pathway Track' : 'Choose a career direction'}
                </h3>
              </div>
              {isGoalSelected && (
                <button
                  type="button"
                  onClick={() => navigate('/pathways')}
                  className="text-xs font-bold text-[#005F60] hover:underline cursor-pointer"
                >
                  Change goal
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-base font-black text-[#0F172A]">{activeGoal.goal_title}</h4>
                    <div className="text-xs text-slate-600 space-y-0.5">
                      <div>
                        <span className="font-bold text-slate-500">Pathway:</span>{' '}
                        <span className="font-extrabold text-[#005F60]">{activeGoal.pathway_title}</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-500">Education Stage:</span>{' '}
                        <span className="font-extrabold text-slate-700">{profile?.current_level || 'Class 10'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-[#F97316] bg-orange-50 border border-orange-200 px-3 py-1 rounded-full inline-block">
                      {activeGoal.progress?.percentage || 0}% Complete
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-[#005F60] to-[#F97316] h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(activeGoal.progress?.percentage || 0, 100)}%` }}
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
                    className="bg-[#005F60] hover:bg-teal-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <span>View My Roadmap</span>
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
                  <p className="text-xs text-slate-600">
                    You haven't selected a career goal yet.
                  </p>
                  <p className="text-xs text-slate-500">
                    Explore education and career pathways based on your interests and academic background.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/pathways')}
                  className="bg-[#005F60] hover:bg-teal-800 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs inline-flex items-center space-x-1.5 cursor-pointer"
                >
                  <span>Explore Pathways</span>
                </button>
              </div>
            )}
          </section>

          {/* SECTION 6: ACADEMIC PROFILE */}
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
