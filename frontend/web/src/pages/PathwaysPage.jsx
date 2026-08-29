import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getPathwaysApi, 
  getPathwayDetailApi, 
  createStudentGoalApi,
  getLatestRecommendationsApi
} from '../api/client';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import EditProfileDrawer from '../components/EditProfileDrawer';
import EducationPathwayMap from '../components/product/EducationPathwayMap';
import { 
  Compass, 
  ArrowLeft, 
  GraduationCap, 
  Sparkles, 
  Filter, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  BookOpen, 
  Clock, 
  Layers, 
  Award, 
  Info,
  HelpCircle,
  MapPin,
  Check,
  Target,
  ArrowRight,
  Loader2
} from 'lucide-react';

const normalizeEducationLevel = (lvl) => {
  if (!lvl) return 'ALL';
  const clean = lvl.trim();
  if (clean === 'PUC 1' || clean === 'PUC 2' || clean === 'PUC') return 'PUC';
  return clean;
};

// Documented helper mapping backend pathway IDs to visual tree node IDs.
// This decouples the visual tree structure from the backend database catalog IDs.
export const PATHWAY_ID_TO_NODE_MAP = {
  'puc-science-eng': 'puc-science',
  'puc-commerce-fin': 'puc-commerce',
  'puc-arts-hum': 'puc-arts',
  'c10-diploma': 'diploma',
  'c10-iti': 'iti'
};

export const getVisualNodeId = (pathwayId) => {
  if (!pathwayId) return null;
  const cleanId = pathwayId.trim().toLowerCase();
  return PATHWAY_ID_TO_NODE_MAP[cleanId] || cleanId;
};

const PathwaysPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, loading: authLoading } = useAuth();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

  const [recommendations, setRecommendations] = useState(null);
  const [recsLoading, setRecsLoading] = useState(true);

  // Sync query parameters (e.g. from top search bar navigation)
  const targetPathwayIdRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const pathwayIdParam = params.get('pathway_id') || params.get('id');

    if (pathwayIdParam) {
      targetPathwayIdRef.current = pathwayIdParam;
      setSelectedPathwayId(pathwayIdParam);
    }
  }, [location.search]);

  // Fetch recommendations once authenticated
  useEffect(() => {
    if (authLoading) return;
    const fetchRecommendations = async () => {
      setRecsLoading(true);
      try {
        const recRes = await getLatestRecommendationsApi();
        setRecommendations(recRes);
      } catch (err) {
        console.error('Failed to load recommendations:', err);
      } finally {
        setRecsLoading(false);
      }
    };
    fetchRecommendations();
  }, [authLoading]);

  const [pathways, setPathways] = useState([]);
  const [totalPathways, setTotalPathways] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Detail view state
  const [selectedPathwayId, setSelectedPathwayId] = useState(null);
  const [selectedPathwayDetail, setSelectedPathwayDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  // Goal confirmation modal state
  const [goalModalData, setGoalModalData] = useState(null);
  const [submittingGoal, setSubmittingGoal] = useState(false);
  const [goalError, setGoalError] = useState(null);

  const getEducationStageLabel = (pathway, option) => {
    if (!option) {
      return profile?.current_level || pathway.education_level || 'Class 10';
    }
    if (pathway.id === 'c10-diploma') return 'Class 10 → Diploma';
    if (pathway.id === 'c10-iti') return 'Class 10 → ITI';
    if (pathway.id === 'c10-puc') return 'Class 10 → PUC';
    if (pathway.id.startsWith('puc-science') || pathway.id.startsWith('puc-commerce') || pathway.id.startsWith('puc-arts')) {
      return 'PUC → Specialization';
    }
    return `${pathway.education_level || 'PUC'} → Option`;
  };

  const handleOpenGoalModal = (pathway, option = null) => {
    const realPathway = pathways.find(p => p.id === pathway.id || (pathway.pathwayId && p.id === pathway.pathwayId));
    if (!realPathway) {
      console.warn("Target node is visual-only or has no database backing:", pathway);
      return;
    }
    setGoalError(null);
    setGoalModalData({ pathway: realPathway, option });
  };

  const handleConfirmGoal = async () => {
    if (!goalModalData?.pathway) return;
    setSubmittingGoal(true);
    setGoalError(null);
    try {
      await createStudentGoalApi(
        goalModalData.pathway.id,
        goalModalData.option ? goalModalData.option.id : null
      );
      setGoalModalData(null);
      navigate('/my-roadmap');
    } catch (err) {
      console.error('Failed to create goal:', err);
      const rawDetail = err.response?.data?.detail;
      const userMessage = (rawDetail && typeof rawDetail === 'string' && rawDetail !== 'Not Found')
        ? rawDetail
        : "We couldn't save your career goal. Please try again.";
      setGoalError(userMessage);
    } finally {
      setSubmittingGoal(false);
    }
  };

  // Fetch pathways with optional cancellation check to ignore stale responses
  const fetchPathways = async (shouldCancel = () => false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPathwaysApi(); // Fetch all pathways for tree construction
      if (shouldCancel()) return;

      setPathways(data.pathways || []);
      setTotalPathways(data.total || 0);

      if (data.pathways && data.pathways.length > 0) {
        const targetId = targetPathwayIdRef.current || selectedPathwayId;
        const found = data.pathways.find(p => p.id === targetId);
        if (found) {
          setSelectedPathwayId(found.id);
        } else {
          setSelectedPathwayId(data.pathways[0].id);
        }
        targetPathwayIdRef.current = null;
      } else {
        setSelectedPathwayId(null);
      }
    } catch (err) {
      if (shouldCancel()) return;
      setError(err.response?.data?.detail || err.message || 'Failed to load pathways from server.');
      setPathways([]);
      setTotalPathways(0);
    } finally {
      if (!shouldCancel()) {
        setLoading(false);
      }
    }
  };

  // Trigger fetch once session is ready
  useEffect(() => {
    if (authLoading) return;

    let isCancelled = false;
    fetchPathways(() => isCancelled);

    return () => {
      isCancelled = true;
    };
  }, [authLoading]);

  // Fetch single pathway detail
  const fetchPathwayDetail = async (id) => {
    setSelectedPathwayId(id);
    setDetailLoading(true);
    setDetailError(null);
    try {
      const detailData = await getPathwayDetailApi(id);
      setSelectedPathwayDetail(detailData);
    } catch (err) {
      setDetailError(err.response?.data?.detail || err.message || 'Failed to load pathway details.');
      setSelectedPathwayDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-[#0F172A] flex font-sans selection:bg-[#005F60] selection:text-white">
      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* Main Container */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        
        {/* Top Header */}
        <Header 
          onMenuClick={() => setIsSidebarOpen(true)}
          onEditProfileClick={() => setIsEditDrawerOpen(true)}
        />

        <main className="p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6 flex-1">
          
          {/* Top Breadcrumb & Page Banner */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="inline-flex items-center space-x-2 text-[11px] font-bold text-[#005F60] bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200 mb-2">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Karnataka Education Pathway Explorer</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
                  Career & Education Pathways
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Structured SSLC, PUC, Polytechnic Diploma, and ITI trade routes under Karnataka Board.
                </p>
              </div>

              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center space-x-2 text-xs font-extrabold text-slate-600 hover:text-[#005F60] bg-[#F8FAF8] hover:bg-teal-50 border border-slate-200 hover:border-teal-200 px-4 py-2.5 rounded-xl transition-all self-start sm:self-auto cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </button>
            </div>

            {/* Context message to take assessment if recommendations are missing */}
            {!recsLoading && (!recommendations || !recommendations.recommendations || recommendations.recommendations.length === 0) && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start space-x-3 text-amber-900 text-xs">
                <Info className="w-5 h-5 text-[#F97316] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold block text-sm text-amber-950">
                    Personalized Guidance Suggestion
                  </span>
                  <p className="text-amber-800 mt-0.5 leading-relaxed font-semibold">
                    Take the career assessment to see personalised pathway suggestions highlighted in your explorer.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Loading Skeleton State */}
          {loading && (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 space-y-4 animate-pulse">
              <div className="h-6 bg-slate-200 rounded w-1/4"></div>
              <div className="h-24 bg-slate-100 rounded-2xl"></div>
              <div className="h-24 bg-slate-100 rounded-2xl"></div>
            </div>
          )}

          {/* Error Banner with Retry */}
          {!loading && error && (
            <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-rose-900">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-6 h-6 text-rose-600 flex-shrink-0" />
                <div>
                  <h3 className="font-extrabold text-sm">Unable to Fetch Pathways</h3>
                  <p className="text-xs text-rose-700 mt-0.5">{error}</p>
                </div>
              </div>
              <button
                onClick={fetchPathways}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Fetch</span>
              </button>
            </div>
          )}

          {/* Intentional Empty State for Unseeded/Unmatched Filters */}
          {!loading && !error && pathways.length === 0 && (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 text-[#F97316] border border-orange-200 flex items-center justify-center mx-auto">
                <HelpCircle className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-lg font-black text-[#0F172A]">No Specific Pathways Found</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  No pathways are currently seeded for <span className="font-extrabold text-[#005F60]">{selectedLevel === 'ALL' ? 'selected level' : selectedLevel}</span> {selectedStream !== 'ALL' ? `with ${selectedStream} stream` : ''}.
                </p>
                <p className="text-xs text-slate-400">
                  Select <button onClick={() => { setSelectedLevel('Class 10'); setSelectedStream('ALL'); }} className="text-[#005F60] font-bold underline cursor-pointer">Class 10</button> or <button onClick={() => { setSelectedLevel('PUC'); setSelectedStream('Science'); }} className="text-[#005F60] font-bold underline cursor-pointer">PUC Science</button> to explore active Karnataka pathways.
                </p>
              </div>
              <button
                onClick={() => { setSelectedLevel('ALL'); setSelectedStream('ALL'); }}
                className="bg-[#005F60] hover:bg-teal-800 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center space-x-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Filters to All</span>
              </button>
            </div>
          )}

          {/* Main Content Layout: Interactive visual metro-style map */}
          {!loading && !error && pathways.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-6 shadow-sm">
              <EducationPathwayMap 
                mode="FullExplorer" 
                pathwaysData={pathways} 
                onSelectGoal={(pathway, option) => handleOpenGoalModal(pathway, option)}
                studentProfile={{
                  current_level: profile?.current_level,
                  stream: profile?.stream,
                  class_or_year: profile?.class_or_year
                }}
                recommendations={recommendations}
                initialSelectedNodeId={getVisualNodeId(selectedPathwayId)}
              />
            </div>
          )}

        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200/80 bg-white py-4 px-8 text-center text-xs text-slate-500 mt-8">
          Udaan AI — Karnataka Student Pathway Explorer
        </footer>
      </div>

      {/* Edit Profile Drawer */}
      <EditProfileDrawer 
        isOpen={isEditDrawerOpen} 
        onClose={() => setIsEditDrawerOpen(false)} 
      />

      {/* Goal Confirmation Modal */}
      {goalModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#005F60] border border-teal-200 flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#0F172A]">Confirm Your Career Goal</h3>
                <p className="text-xs text-slate-500">Persist your selected direction to track milestones</p>
              </div>
            </div>

            {goalError && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{goalError}</span>
              </div>
            )}

            <div className="bg-[#F8FAF8] border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Target Goal</span>
                <span className="font-extrabold text-[#005F60]">
                  {goalModalData.option ? goalModalData.option.option_name : goalModalData.pathway.title}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Education Pathway</span>
                <span className="font-extrabold text-[#0F172A]">{goalModalData.pathway.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Education Stage</span>
                <span className="font-extrabold text-[#F97316]">{getEducationStageLabel(goalModalData.pathway, goalModalData.option)}</span>
              </div>
              {goalModalData.option?.eligibility && (
                <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-600">
                  <span className="font-bold block text-slate-700 mb-0.5">Eligibility Requirement:</span>
                  <span>{goalModalData.option.eligibility}</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setGoalModalData(null)}
                disabled={submittingGoal}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmGoal}
                disabled={submittingGoal}
                className="flex-1 bg-[#005F60] hover:bg-teal-800 text-white font-extrabold py-2.5 rounded-xl text-xs transition-all shadow-md flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                {submittingGoal ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Setting Goal...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Set Goal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component for rendering Pathway Detail (Options & Step Milestones)
const PathwayDetailView = ({ detail, loading, error, onRetry, onSelectGoal }) => {
  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-8 space-y-4 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/2"></div>
        <div className="h-20 bg-slate-100 rounded-2xl"></div>
        <div className="h-32 bg-slate-100 rounded-2xl"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 space-y-3 text-rose-900">
        <div className="flex items-center space-x-2 font-bold text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600" />
          <span>Error Loading Detail</span>
        </div>
        <p className="text-xs text-rose-700">{error}</p>
        <button
          onClick={onRetry}
          className="bg-rose-600 text-white text-xs font-extrabold px-3 py-1.5 rounded-xl cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-3xl p-8 text-center text-slate-400 space-y-2">
        <Compass className="w-8 h-8 mx-auto text-slate-300" />
        <p className="text-xs font-bold">Select a pathway from the list to view options & milestones</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
      {/* Top Header */}
      <div className="border-b border-slate-100 pb-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded bg-teal-100 text-[#005F60]">
            {detail.category}
          </span>
          {detail.duration && (
            <span className="text-xs font-extrabold text-[#F97316] bg-orange-50 border border-orange-200 px-3 py-1 rounded-full">
              {detail.duration}
            </span>
          )}
        </div>

        <h2 className="text-xl font-black text-[#0F172A] tracking-tight">
          {detail.title}
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          {detail.description}
        </p>

        {onSelectGoal && (
          <button
            onClick={() => onSelectGoal(detail, null)}
            className="w-full bg-[#005F60] hover:bg-teal-800 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer mt-1"
          >
            <Target className="w-4 h-4 text-[#F97316]" />
            <span>Select {detail.title} as My Active Goal</span>
          </button>
        )}
      </div>

      {/* Available Branches / Options Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#005F60] flex items-center space-x-1.5">
          <Layers className="w-4 h-4" />
          <span>Available Streams & Branches ({detail.options?.length || 0})</span>
        </h3>

        <div className="grid grid-cols-1 gap-3">
          {detail.options?.map((opt) => (
            <div 
              key={opt.id}
              className="bg-[#F8FAF8] border border-slate-200/80 rounded-2xl p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-[#0F172A]">
                  {opt.option_name}
                </span>
                {opt.stream_or_code && (
                  <span className="text-[10px] font-mono font-extrabold text-[#005F60] bg-teal-100/80 px-2 py-0.5 rounded">
                    {opt.stream_or_code}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 leading-normal">
                {opt.description}
              </p>
              {opt.eligibility && (
                <div className="pt-1 text-[11px] text-slate-600 font-medium flex items-center space-x-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Eligibility: {opt.eligibility}</span>
                </div>
              )}
              {onSelectGoal && (
                <div className="pt-1">
                  <button
                    onClick={() => onSelectGoal(detail, opt)}
                    className="bg-orange-50 hover:bg-orange-100 text-[#F97316] border border-orange-200 font-extrabold text-xs px-3 py-1.5 rounded-xl transition-all inline-flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Target className="w-3.5 h-3.5" />
                    <span>Choose {opt.option_name} Goal</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Numbered Udaan Trail Milestone Action Steps */}
      <div className="space-y-4 pt-2">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#F97316] flex items-center space-x-1.5">
          <Award className="w-4 h-4" />
          <span>Step-by-Step Udaan Action Trail ({detail.milestones?.length || 0})</span>
        </h3>

        <div className="relative space-y-4 before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200 before:z-0">
          {detail.milestones?.map((ms) => (
            <div key={ms.id} className="relative z-10 flex items-start space-x-3.5 group">
              <div className="w-7 h-7 rounded-full bg-[#005F60] text-white flex items-center justify-center font-extrabold text-xs flex-shrink-0 shadow-xs ring-4 ring-white">
                {ms.step_number}
              </div>

              <div className="bg-[#F8FAF8] border border-slate-200/80 rounded-2xl p-4 flex-1 space-y-1">
                <h4 className="font-extrabold text-xs text-[#0F172A]">
                  {ms.title}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {ms.description}
                </p>
                {ms.key_action && (
                  <div className="pt-1.5 text-[11px] font-bold text-[#005F60] flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#005F60]" />
                    <span>Action: {ms.key_action}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PathwaysPage;
