import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import EditProfileDrawer from '../components/EditProfileDrawer';
import { 
  getMyLatestAssessmentResultApi, 
  getPathwaysApi,
  getMyStudentGoalApi,
  completeMilestoneApi
} from '../api/client';
import { 
  Sparkles, 
  Compass, 
  Target, 
  UserCheck, 
  GraduationCap, 
  Building2, 
  MapPin, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  RefreshCw,
  Loader2,
  BookOpen,
  Lock,
  Check
} from 'lucide-react';

const MyCareerRoadmapPage = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { isCollapsed } = useSidebar();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [pathways, setPathways] = useState([]);
  const [studentGoal, setStudentGoal] = useState(null);
  const [completingMilestoneId, setCompletingMilestoneId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resAssessment, resPathways, resGoal] = await Promise.all([
        getMyLatestAssessmentResultApi().catch(() => null),
        getPathwaysApi({
          education_level: profile?.current_level || 'Class 10',
          stream: profile?.stream || '',
        }).catch(() => ({ pathways: [] })),
        getMyStudentGoalApi().catch(() => null),
      ]);

      setAssessmentResult(resAssessment);
      setPathways(resPathways?.pathways || []);
      setStudentGoal(resGoal);
    } catch (err) {
      console.error('Failed to load roadmap data:', err);
      setError('Unable to load career roadmap data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [profile]);

  const handleCompleteMilestone = async (milestoneId) => {
    setCompletingMilestoneId(milestoneId);
    try {
      const updatedGoal = await completeMilestoneApi(milestoneId);
      setStudentGoal(updatedGoal);
    } catch (err) {
      console.error('Failed to complete milestone:', err);
    } finally {
      setCompletingMilestoneId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-[#0F172A] flex font-sans selection:bg-[#005F60] selection:text-white">
      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* Main Content Area */}
      <div className={`flex-1 ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'} transition-all duration-200 ease-in-out flex flex-col min-w-0`}>
        
        {/* Header */}
        <Header 
          onMenuClick={() => setIsSidebarOpen(true)}
          onEditProfileClick={() => setIsEditDrawerOpen(true)}
        />

        <main className="p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6 flex-1">
          
          {/* Header Banner */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="inline-flex items-center space-x-1.5 text-[10px] uppercase font-extrabold tracking-wider bg-orange-100 text-[#F97316] px-2.5 py-0.5 rounded-full border border-orange-200 mb-2">
                  <Sparkles className="w-3 h-3 text-[#F97316]" />
                  <span>YOUR CAREER PLAN</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
                  My Career Roadmap & Milestones
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Track progress towards your target career goal and complete milestone action steps.
                </p>
              </div>

              {/* Secondary Navigation CTA */}
              <button
                onClick={() => navigate('/pathways')}
                className="inline-flex items-center space-x-2 bg-[#005F60] hover:bg-teal-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs self-start sm:self-auto cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>Explore Education Pathways</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Profile Context Bar */}
            <div className="bg-[#F8FAF8] border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#005F60] border border-teal-200 flex items-center justify-center font-black text-sm flex-shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-black text-sm text-[#0F172A]">
                      {profile?.full_name || user?.full_name || 'Student'}
                    </span>
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Profile Active
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center space-x-1 font-bold text-[#005F60]">
                      <GraduationCap className="w-3.5 h-3.5 text-[#005F60]" />
                      <span>{profile?.current_level || 'Class 10'} ({profile?.class_or_year || '10th Standard'})</span>
                    </span>
                    {profile?.stream && (
                      <span className="font-extrabold text-[#F97316] bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md">
                        {profile.stream} Stream
                      </span>
                    )}
                    {profile?.institution_name && (
                      <span className="flex items-center space-x-1 text-slate-600">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{profile.institution_name}</span>
                      </span>
                    )}
                    {profile?.district && (
                      <span className="flex items-center space-x-1 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-[#005F60]" />
                        <span>{profile.district}, {profile?.state || 'Karnataka'}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-8 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#005F60] animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Loading active career goal and milestone progress...</p>
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 flex items-center justify-between gap-4 text-rose-900 text-xs">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={loadData}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {!loading && (
            <>
              {/* Active Student Goal Section */}
              {studentGoal ? (
                <section className="bg-gradient-to-r from-teal-900 via-[#005F60] to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-teal-700/50 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-teal-700/60 pb-5">
                    <div className="space-y-1">
                      <div className="inline-flex items-center space-x-1.5 text-[11px] font-extrabold uppercase tracking-widest text-teal-300 bg-teal-950/60 px-3 py-0.5 rounded-full border border-teal-700/60">
                        <Target className="w-3.5 h-3.5 text-[#F97316]" />
                        <span>Active Career Goal</span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        {studentGoal.goal_title}
                      </h2>
                      <p className="text-xs sm:text-sm text-teal-100/90 font-medium">
                        Pathway: <span className="font-extrabold text-white">{studentGoal.pathway_title}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => navigate('/pathways')}
                      className="bg-teal-800/80 hover:bg-teal-800 text-teal-100 border border-teal-600 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all self-start sm:self-auto cursor-pointer"
                    >
                      Change Goal
                    </button>
                  </div>

                  {/* Calculated Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-teal-200">
                        Overall Milestone Progress
                      </span>
                      <span className="font-black text-white bg-teal-950/80 px-3 py-1 rounded-full border border-teal-700/80">
                        {studentGoal.progress.completed} / {studentGoal.progress.total} Completed ({studentGoal.progress.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-teal-950/60 rounded-full h-3 p-0.5 border border-teal-700/60 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-[#F97316] to-amber-400 h-full rounded-full transition-all duration-500 shadow-sm"
                        style={{ width: `${Math.min(studentGoal.progress.percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </section>
              ) : (
                /* Empty State when no active goal exists */
                <section className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#F97316] border border-orange-200 flex items-center justify-center mx-auto">
                    <Target className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 max-w-md mx-auto">
                    <h2 className="text-xl font-black text-[#0F172A]">No Active Career Goal Set</h2>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Select a career direction from the Pathways Catalog to initialize your personalized milestone tracker.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/pathways')}
                    className="bg-[#005F60] hover:bg-teal-800 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition-all shadow-md inline-flex items-center space-x-2 cursor-pointer"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Explore Pathways & Set Goal</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </section>
              )}

              {/* Milestone Progress Timeline */}
              {studentGoal && studentGoal.milestones && studentGoal.milestones.length > 0 && (
                <section className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
                  <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-extrabold text-[#0F172A] tracking-tight">
                        Milestone Action Checklist
                      </h2>
                      <p className="text-xs text-slate-500">
                        Mark milestones as completed to unlock next steps and advance your career plan.
                      </p>
                    </div>
                    <span className="text-xs font-extrabold text-[#005F60] bg-teal-50 border border-teal-200 px-3 py-1 rounded-full self-start sm:self-auto">
                      Sequential Progression
                    </span>
                  </div>

                  <div className="relative space-y-6 before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-slate-200 before:z-0">
                    {studentGoal.milestones.map((m) => {
                      const isCompleted = m.status === 'COMPLETED';
                      const isAvailable = m.status === 'AVAILABLE';
                      const isCompleting = completingMilestoneId === m.id;

                      return (
                        <div key={m.id} className="relative z-10 flex items-start space-x-4 group">
                          {/* Step Number / Icon */}
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs flex-shrink-0 shadow-xs ring-4 ring-white transition-transform group-hover:scale-105 ${
                            isCompleted
                              ? 'bg-emerald-600 text-white'
                              : isAvailable
                              ? 'bg-[#F97316] text-white shadow-md shadow-[#F97316]/20'
                              : 'bg-slate-200 text-slate-500'
                          }`}>
                            {isCompleted ? <Check className="w-5 h-5" /> : isAvailable ? <BookOpen className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                          </div>

                          {/* Details Card */}
                          <div className={`p-5 rounded-2xl border flex-1 space-y-3 transition-all ${
                            isCompleted
                              ? 'bg-emerald-50/40 border-emerald-200/80 text-[#0F172A]'
                              : isAvailable
                              ? 'bg-orange-50/40 border-orange-200/80 text-[#0F172A]'
                              : 'bg-[#F8FAF8] border-slate-200/70 text-slate-500'
                          }`}>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-white border border-slate-200 text-[#005F60]">
                                  Step {m.step_number}
                                </span>
                                <h3 className="font-extrabold text-sm text-[#0F172A]">
                                  {m.title}
                                </h3>
                              </div>

                              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border flex items-center space-x-1 ${
                                isCompleted
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                  : isAvailable
                                  ? 'bg-orange-100 text-[#F97316] border-orange-200'
                                  : 'bg-slate-100 text-slate-500 border-slate-200'
                              }`}>
                                {isCompleted ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                    <span>Completed</span>
                                  </>
                                ) : isAvailable ? (
                                  <>
                                    <Clock className="w-3 h-3 text-[#F97316]" />
                                    <span>Available</span>
                                  </>
                                ) : (
                                  <>
                                    <Lock className="w-3 h-3 text-slate-400" />
                                    <span>Locked</span>
                                  </>
                                )}
                              </span>
                            </div>

                            <p className="text-xs text-slate-600 leading-relaxed">
                              {m.description}
                            </p>

                            {m.key_action && (
                              <div className="text-[11px] font-medium text-slate-500 bg-white/80 border border-slate-200/60 rounded-xl p-2.5 inline-block">
                                <span className="font-bold text-[#005F60]">Key Action: </span>
                                {m.key_action}
                              </div>
                            )}

                            {/* Mark Complete CTA for AVAILABLE milestones */}
                            {isAvailable && (
                              <div className="pt-1">
                                <button
                                  onClick={() => handleCompleteMilestone(m.id)}
                                  disabled={isCompleting}
                                  className="bg-[#005F60] hover:bg-teal-800 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-xs inline-flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                                >
                                  {isCompleting ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      <span>Updating Progress...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Mark Complete</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </>
          )}

        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200/80 bg-white py-4 px-8 text-center text-xs text-slate-500 mt-8">
          Udaan AI — Student Career Roadmap & Milestone Progress
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

export default MyCareerRoadmapPage;
