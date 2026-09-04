import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { 
  getPathwaysApi, 
  getPathwayDetailApi, 
  createStudentGoalApi,
  getLatestRecommendationsApi
} from '../api/client';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import EditProfileDrawer from '../components/EditProfileDrawer';
import EducationPathwayMap, { PATHWAY_ID_TO_NODE_MAP, getVisualNodeId } from '../components/product/EducationPathwayMap';
import PathwayChoiceExplorer from '../components/product/PathwayChoiceExplorer';
import PathwayDetailPanel from '../components/product/PathwayDetailPanel';
import PathwayBreadcrumb from '../components/product/PathwayBreadcrumb';
import PathwaySearch from '../components/product/PathwaySearch';
import { 
  STREAM_COMBINATIONS_MAPPING, 
  BRANCH_CHOICE_MAPPING, 
  getInitialNodeFromProfile,
  STRUCTURAL_HIERARCHY,
  getCanonicalPathwayId,
  C10_STRUCTURAL_DETAIL
} from '../utils/pathwayAdapter';

export { PATHWAY_ID_TO_NODE_MAP, getVisualNodeId };
import { 
  Compass, 
  ArrowLeft, 
  RefreshCw, 
  AlertCircle, 
  Info,
  Target,
  ArrowRight,
  Loader2
} from 'lucide-react';

const PathwaysPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, loading: authLoading } = useAuth();
  const { isCollapsed } = useSidebar();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

  const [recommendations, setRecommendations] = useState(null);
  const [recsLoading, setRecsLoading] = useState(true);

  // Sync query parameters
  const targetPathwayIdRef = useRef(null);

  const [pathways, setPathways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Progressive Explorer State
  const [selectedStructuralNodeId, setSelectedStructuralNodeId] = useState('c10');
  const [selectedCombinationId, setSelectedCombinationId] = useState(null);
  const [selectedCareerDirectionId, setSelectedCareerDirectionId] = useState(null);
  const [selectedOptionId, setSelectedOptionId] = useState(null);

  // Detail view state
  const [selectedPathwayDetail, setSelectedPathwayDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  // Goal confirmation modal state
  const [goalModalData, setGoalModalData] = useState(null);
  const [submittingGoal, setSubmittingGoal] = useState(false);
  const [goalError, setGoalError] = useState(null);

  // Build lookup map for fast pathway retrieval by ID
  const apiPathwaysMap = useMemo(() => {
    const map = {};
    pathways.forEach(p => {
      map[p.id] = p;
    });
    return map;
  }, [pathways]);

  // Set initial starting position based on student profile once loaded
  useEffect(() => {
    if (profile) {
      const initialNode = getInitialNodeFromProfile(profile);
      setSelectedStructuralNodeId(initialNode);
      setSelectedCombinationId(null);
      setSelectedCareerDirectionId(null);
      setSelectedOptionId(null);
    }
  }, [profile]);

  // Helper to resolve deep hierarchy for search / deep-links
  const resolvePathwayHierarchy = (pathwayId) => {
    if (!pathwayId) return;

    // Check if it's 'c10'
    if (pathwayId === 'c10') {
      setSelectedStructuralNodeId('c10');
      setSelectedCombinationId(null);
      setSelectedCareerDirectionId(null);
      return;
    }

    // Check if it's a structural stream node (e.g. puc-science, dip-family-comp)
    if (pathwayId === 'puc-science' || pathwayId === 'puc-commerce' || pathwayId === 'puc-arts' || pathwayId.startsWith('dip-') || pathwayId.startsWith('iti-') || pathwayId === 'c10-puc' || pathwayId === 'c10-diploma' || pathwayId === 'c10-iti') {
      const visualNode = getVisualNodeId(pathwayId);
      setSelectedStructuralNodeId(visualNode);
      setSelectedCombinationId(null);
      setSelectedCareerDirectionId(null);
      return;
    }

    // Check if it's a combination node (e.g. puc-science-pcmb)
    if (BRANCH_CHOICE_MAPPING[pathwayId]) {
      const parentStream = STRUCTURAL_HIERARCHY[pathwayId]?.parent || getVisualNodeId(pathwayId);
      setSelectedStructuralNodeId(parentStream);
      setSelectedCombinationId(pathwayId);
      setSelectedCareerDirectionId(null);
      return;
    }

    // It's a specific career direction (e.g. puc-science-med)
    const structParent = STRUCTURAL_HIERARCHY[pathwayId]?.parent || 'puc-science-pcmb';
    const grandParentStream = STRUCTURAL_HIERARCHY[structParent]?.parent || getVisualNodeId(structParent);

    setSelectedStructuralNodeId(grandParentStream);
    setSelectedCombinationId(structParent);
    setSelectedCareerDirectionId(pathwayId);
  };

  // Sync URL query parameters if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const pathwayIdParam = params.get('pathway_id') || params.get('id');

    if (pathwayIdParam) {
      targetPathwayIdRef.current = pathwayIdParam;
      resolvePathwayHierarchy(pathwayIdParam);
    }
  }, [location.search]);

  // Fetch recommendations once authenticated
  useEffect(() => {
    if (authLoading) return;
    const fetchRecommendations = async () => {
      setRecsLoading(true);
      try {
        const recRes = await getLatestRecommendationsApi();
        setRecommendations(recRes || null);
      } catch (err) {
        if (err?.response?.status === 404 || err?.response?.status === 401) {
          setRecommendations(null);
        } else {
          console.error('Failed to load recommendations:', err);
        }
      } finally {
        setRecsLoading(false);
      }
    };
    fetchRecommendations();
  }, [authLoading]);

  // Fetch all pathways
  const fetchPathways = async (shouldCancel = () => false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPathwaysApi();
      if (shouldCancel()) return;

      setPathways(data.pathways || []);

      if (data.pathways && data.pathways.length > 0) {
        const targetId = targetPathwayIdRef.current;
        if (targetId) {
          resolvePathwayHierarchy(targetId);
        }
        targetPathwayIdRef.current = null;
      }
    } catch (err) {
      if (shouldCancel()) return;
      setError(err.response?.data?.detail || err.message || 'Failed to load pathways from server.');
      setPathways([]);
    } finally {
      if (!shouldCancel()) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (authLoading) return;
    let isCancelled = false;
    fetchPathways(() => isCancelled);
    return () => { isCancelled = true; };
  }, [authLoading]);

  // Determine current active Choice Explorer level pathways
  const currentChoicePathways = useMemo(() => {
    if (selectedCombinationId && BRANCH_CHOICE_MAPPING[selectedCombinationId]) {
      const ids = BRANCH_CHOICE_MAPPING[selectedCombinationId];
      return ids.map(id => apiPathwaysMap[id]).filter(Boolean);
    } else {
      const ids = STREAM_COMBINATIONS_MAPPING[selectedStructuralNodeId] || [];
      return ids.map(id => apiPathwaysMap[id]).filter(Boolean);
    }
  }, [selectedStructuralNodeId, selectedCombinationId, apiPathwaysMap]);

  // Determine parent context object for Choice Explorer header copy
  const parentContextPathway = useMemo(() => {
    if (selectedCombinationId) {
      return apiPathwaysMap[selectedCombinationId] || { id: selectedCombinationId, title: 'Combination' };
    }
    return apiPathwaysMap[selectedStructuralNodeId] || { id: selectedStructuralNodeId, title: 'Selected Stream' };
  }, [selectedStructuralNodeId, selectedCombinationId, apiPathwaysMap]);

  // Safe detail data resolution (bypasses backend fetch for structural-only 'c10' node)
  useEffect(() => {
    const activeId = selectedCareerDirectionId || selectedCombinationId || selectedStructuralNodeId;
    if (!activeId) return;

    const canonicalId = getCanonicalPathwayId(activeId);

    // If canonicalId is null (e.g. for 'c10'), render local structural overview without backend fetch
    if (!canonicalId) {
      setSelectedPathwayDetail(C10_STRUCTURAL_DETAIL);
      setDetailLoading(false);
      setDetailError(null);
      return;
    }

    let isSubscribed = true;
    const fetchDetail = async () => {
      setDetailLoading(true);
      setDetailError(null);
      try {
        const detailData = await getPathwayDetailApi(canonicalId);
        if (isSubscribed) {
          setSelectedPathwayDetail(detailData);
        }
      } catch (err) {
        if (isSubscribed) {
          const fallback = apiPathwaysMap[canonicalId];
          if (fallback) {
            setSelectedPathwayDetail(fallback);
          } else {
            setDetailError(err.response?.data?.detail || err.message || 'Failed to load pathway details.');
            setSelectedPathwayDetail(null);
          }
        }
      } finally {
        if (isSubscribed) {
          setDetailLoading(false);
        }
      }
    };

    fetchDetail();
    return () => { isSubscribed = false; };
  }, [selectedCareerDirectionId, selectedCombinationId, selectedStructuralNodeId, apiPathwaysMap]);

  // Search Navigation Handler (Exploration Only - DOES NOT open Goal Modal)
  const handleSelectSearchResult = ({ pathwayId, option }) => {
    resolvePathwayHierarchy(pathwayId);

    if (option) {
      setSelectedOptionId(option.id);
    } else {
      setSelectedOptionId(null);
    }

    // Scroll smoothly to explorer container
    const explorerContainer = document.getElementById('hybrid-explorer-container');
    if (explorerContainer) {
      explorerContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Handle Choice Card Selection in Choice Explorer
  const handleSelectChoiceDirection = (chosenId) => {
    setSelectedOptionId(null);
    if (selectedCombinationId) {
      setSelectedCareerDirectionId(chosenId);
    } else {
      if (BRANCH_CHOICE_MAPPING[chosenId]) {
        setSelectedCombinationId(chosenId);
        setSelectedCareerDirectionId(null);
      } else {
        setSelectedCareerDirectionId(chosenId);
      }
    }
  };

  // Handle Breadcrumb Segment Click
  const handleSelectBreadcrumbNode = (nodeId) => {
    setSelectedOptionId(null);
    resolvePathwayHierarchy(nodeId);
  };

  // Primary Page Reset Action
  const handleResetView = () => {
    const initialNode = getInitialNodeFromProfile(profile);
    setSelectedStructuralNodeId(initialNode);
    setSelectedCombinationId(null);
    setSelectedCareerDirectionId(null);
    setSelectedOptionId(null);
  };

  // Explicit Goal Entry Point (Triggered ONLY from PathwayDetailPanel CTAs)
  const handleOpenGoalModal = (pathway, option = null) => {
    const realPathway = pathways.find(p => p.id === pathway.id || p.id === pathway.pathwayId);
    if (!realPathway) {
      console.warn("Target pathway has no database backing:", pathway);
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

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-[#0F172A] flex font-sans selection:bg-[#005F60] selection:text-white">
      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* Main Container */}
      <div className={`flex-1 ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'} transition-all duration-200 ease-in-out flex flex-col min-w-0`}>
        
        {/* Top Header */}
        <Header 
          onMenuClick={() => setIsSidebarOpen(true)}
          onEditProfileClick={() => setIsEditDrawerOpen(true)}
        />

        <main className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-5 flex-1">
          
          {/* Top Page Banner & Search Area */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="inline-flex items-center space-x-2 text-[11px] font-bold text-[#005F60] bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200 mb-1.5">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Karnataka Student Hybrid Pathway Explorer</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
                  Career & Education Pathways
                </h1>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Structured SSLC, PUC, Polytechnic Diploma, and ITI trade routes under Karnataka Education Board.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center space-x-2 text-xs font-extrabold text-slate-600 hover:text-[#005F60] bg-[#F8FAF8] hover:bg-teal-50 border border-slate-200 hover:border-teal-200 px-3.5 py-2 rounded-xl transition-all self-start sm:self-auto cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Dashboard</span>
              </button>
            </div>

            {/* Global Index Search Bar */}
            <PathwaySearch 
              apiPathways={pathways}
              onSelectResult={handleSelectSearchResult}
            />

            {/* Context message if recommendations missing */}
            {!recsLoading && (!recommendations || !recommendations.recommendations || recommendations.recommendations.length === 0) && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start space-x-3 text-amber-900 text-xs">
                <Info className="w-4 h-4 text-[#F97316] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold block text-xs text-amber-950">
                    Personalized Guidance Suggestion
                  </span>
                  <p className="text-amber-800 text-[11px] leading-relaxed font-semibold">
                    Take the career assessment to highlight personalized recommendations in your choice explorer.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Loading Skeleton */}
          {loading && (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 space-y-4 animate-pulse">
              <div className="h-6 bg-slate-200 rounded w-1/4"></div>
              <div className="h-20 bg-slate-100 rounded-2xl"></div>
              <div className="h-20 bg-slate-100 rounded-2xl"></div>
            </div>
          )}

          {/* Error Banner */}
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
                type="button"
                onClick={fetchPathways}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Fetch</span>
              </button>
            </div>
          )}

          {/* Main Content Layout (Simplified Hybrid Explorer) */}
          {!loading && !error && pathways.length > 0 && (
            <div id="hybrid-explorer-container" className="space-y-5">
              
              {/* Journey Breadcrumb Trail */}
              <PathwayBreadcrumb
                selectedPathwayId={selectedCareerDirectionId || selectedCombinationId || selectedStructuralNodeId}
                apiPathwaysMap={apiPathwaysMap}
                onSelectNode={handleSelectBreadcrumbNode}
                onResetView={handleResetView}
                studentLevel={profile?.current_level}
              />

              {/* 2-Column Desktop Grid Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                
                {/* Left Side: Structural Map + Progressive Choice Explorer */}
                <div className="lg:col-span-7 xl:col-span-8 space-y-5 min-w-0">
                  
                  {/* Simplified 3-Column SVG Structural Map */}
                  <EducationPathwayMap
                    selectedNodeId={selectedStructuralNodeId}
                    onSelectNode={(nodeId) => {
                      setSelectedStructuralNodeId(nodeId);
                      setSelectedCombinationId(null);
                      setSelectedCareerDirectionId(null);
                      setSelectedOptionId(null);
                    }}
                    studentProfile={profile}
                    recommendations={recommendations}
                  />

                  {/* Progressive Choice Explorer */}
                  {currentChoicePathways.length > 0 && (
                    <PathwayChoiceExplorer
                      parentContextPathway={parentContextPathway}
                      choicePathways={currentChoicePathways}
                      selectedDirectionId={selectedCareerDirectionId || selectedCombinationId}
                      onSelectDirection={handleSelectChoiceDirection}
                      recommendations={recommendations}
                      isCombinationStep={!!selectedCombinationId}
                    />
                  )}
                </div>

                {/* Right Side: Interactive Details Panel */}
                <div className="lg:col-span-5 xl:col-span-4 sticky top-5">
                  <PathwayDetailPanel
                    detail={selectedPathwayDetail}
                    loading={detailLoading}
                    error={detailError}
                    onRetry={() => {
                      const activeId = selectedCareerDirectionId || selectedCombinationId || selectedStructuralNodeId;
                      const canonicalId = getCanonicalPathwayId(activeId);
                      if (canonicalId) getPathwayDetailApi(canonicalId).then(setSelectedPathwayDetail);
                    }}
                    onSelectGoal={(pathway, option) => handleOpenGoalModal(pathway, option)}
                    recommendations={recommendations}
                    selectedOptionId={selectedOptionId}
                  />
                </div>

              </div>

            </div>
          )}

        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200/80 bg-white py-3.5 px-8 text-center text-xs text-slate-500 mt-6">
          Udaan AI — Simplified Hybrid Karnataka Student Pathway Explorer
        </footer>
      </div>

      {/* Edit Profile Drawer */}
      <EditProfileDrawer 
        isOpen={isEditDrawerOpen} 
        onClose={() => setIsEditDrawerOpen(false)} 
      />

      {/* Goal Confirmation Modal (Opened ONLY by explicit goal CTAs inside PathwayDetailPanel) */}
      {goalModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 font-sans">
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

export default PathwaysPage;
