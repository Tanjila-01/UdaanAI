import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AdminLayout from '../../components/layout/AdminLayout';
import {
  getPathwaysApi,
  getPathwayDetailApi
} from '../../api/client';
import EducationPathwayMap, { getVisualNodeId } from '../../components/product/EducationPathwayMap';
import PathwayChoiceExplorer from '../../components/product/PathwayChoiceExplorer';
import PathwayDetailPanel from '../../components/product/PathwayDetailPanel';
import PathwayBreadcrumb from '../../components/product/PathwayBreadcrumb';
import PathwaySearch from '../../components/product/PathwaySearch';
import {
  STREAM_COMBINATIONS_MAPPING,
  BRANCH_CHOICE_MAPPING,
  STRUCTURAL_HIERARCHY,
  getCanonicalPathwayId,
  C10_STRUCTURAL_DETAIL
} from '../../utils/pathwayAdapter';
import { normalizeApiError } from '../../utils/errorHandler';
import {
  Compass,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Eye
} from 'lucide-react';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

export const AdminPathwayPreviewPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [pathways, setPathways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Progressive Explorer State
  const [selectedStructuralNodeId, setSelectedStructuralNodeId] = useState('puc-science');
  const [selectedCombinationId, setSelectedCombinationId] = useState(null);
  const [selectedCareerDirectionId, setSelectedCareerDirectionId] = useState(null);
  const [selectedOptionId, setSelectedOptionId] = useState(null);

  // Detail view state
  const [selectedPathwayDetail, setSelectedPathwayDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const listRequestIdRef = useRef(0);
  const detailRequestIdRef = useRef(0);
  const isMountedRef = useRef(true);

  // Lookup map for fast pathway retrieval by ID
  const apiPathwaysMap = useMemo(() => {
    const map = {};
    pathways.forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [pathways]);

  // Helper to resolve deep hierarchy for search / deep-links
  const resolvePathwayHierarchy = useCallback((pathwayId) => {
    if (!pathwayId) return;

    if (pathwayId === 'c10') {
      setSelectedStructuralNodeId('c10');
      setSelectedCombinationId(null);
      setSelectedCareerDirectionId(null);
      return;
    }

    if (
      pathwayId === 'puc-science' ||
      pathwayId === 'puc-commerce' ||
      pathwayId === 'puc-arts' ||
      pathwayId.startsWith('dip-') ||
      pathwayId.startsWith('iti-') ||
      pathwayId === 'c10-puc' ||
      pathwayId === 'c10-diploma' ||
      pathwayId === 'c10-iti'
    ) {
      const visualNode = getVisualNodeId(pathwayId);
      setSelectedStructuralNodeId(visualNode);
      setSelectedCombinationId(null);
      setSelectedCareerDirectionId(null);
      return;
    }

    if (BRANCH_CHOICE_MAPPING[pathwayId]) {
      const parentStream = STRUCTURAL_HIERARCHY[pathwayId]?.parent || getVisualNodeId(pathwayId);
      setSelectedStructuralNodeId(parentStream);
      setSelectedCombinationId(pathwayId);
      setSelectedCareerDirectionId(null);
      return;
    }

    const structParent = STRUCTURAL_HIERARCHY[pathwayId]?.parent || 'puc-science-pcmb';
    const grandParentStream = STRUCTURAL_HIERARCHY[structParent]?.parent || getVisualNodeId(structParent);

    setSelectedStructuralNodeId(grandParentStream);
    setSelectedCombinationId(structParent);
    setSelectedCareerDirectionId(pathwayId);
  }, []);

  // Update query parameter without triggering unnecessary re-renders
  const updateUrlPathway = useCallback((id) => {
    const currentParams = new URLSearchParams(location.search);
    if (currentParams.get('pathway_id') !== id) {
      navigate({ search: `?pathway_id=${encodeURIComponent(id)}` }, { replace: true });
    }
  }, [location.search, navigate]);

  // Sync URL query parameters on mount and when location.search changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const pathwayIdParam = params.get('pathway_id') || params.get('id') || params.get('node');

    if (pathwayIdParam) {
      resolvePathwayHierarchy(pathwayIdParam);
    }
  }, [location.search, resolvePathwayHierarchy]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch all pathways
  const fetchPathways = useCallback(async () => {
    const requestId = ++listRequestIdRef.current;
    const isCancelled = () => {
      return !isMountedRef.current || requestId !== listRequestIdRef.current;
    };

    setLoading(true);
    setError(null);
    try {
      const data = await getPathwaysApi();
      if (isCancelled()) return;

      setPathways(data.pathways || []);

      const params = new URLSearchParams(window.location.search);
      const targetId = params.get('pathway_id') || params.get('id') || params.get('node');
      if (targetId) {
        resolvePathwayHierarchy(targetId);
      }
    } catch (err) {
      if (isCancelled()) return;
      setError(normalizeApiError(err, 'Failed to load pathways from server.'));
      setPathways([]);
    } finally {
      if (!isCancelled()) {
        setLoading(false);
      }
    }
  }, [resolvePathwayHierarchy]);

  useEffect(() => {
    fetchPathways();
  }, [fetchPathways]);

  // Determine current active Choice Explorer level pathways
  const currentChoicePathways = useMemo(() => {
    if (selectedCombinationId && BRANCH_CHOICE_MAPPING[selectedCombinationId]) {
      const ids = BRANCH_CHOICE_MAPPING[selectedCombinationId];
      return ids.map((id) => apiPathwaysMap[id]).filter(Boolean);
    } else {
      const ids = STREAM_COMBINATIONS_MAPPING[selectedStructuralNodeId] || [];
      return ids.map((id) => apiPathwaysMap[id]).filter(Boolean);
    }
  }, [selectedStructuralNodeId, selectedCombinationId, apiPathwaysMap]);

  // Determine parent context object for Choice Explorer header copy
  const parentContextPathway = useMemo(() => {
    if (selectedCombinationId) {
      return apiPathwaysMap[selectedCombinationId] || { id: selectedCombinationId, title: 'Combination' };
    }
    return apiPathwaysMap[selectedStructuralNodeId] || { id: selectedStructuralNodeId, title: 'Selected Stream' };
  }, [selectedStructuralNodeId, selectedCombinationId, apiPathwaysMap]);

  // Load pathway detail safely
  const loadPathwayDetail = useCallback(async (canonicalId) => {
    if (!canonicalId) {
      detailRequestIdRef.current++;
      setSelectedPathwayDetail(C10_STRUCTURAL_DETAIL);
      setDetailLoading(false);
      setDetailError(null);
      return;
    }

    const requestId = ++detailRequestIdRef.current;
    const isCancelled = () => {
      return !isMountedRef.current || requestId !== detailRequestIdRef.current;
    };

    setDetailLoading(true);
    setDetailError(null);

    try {
      const detailData = await getPathwayDetailApi(canonicalId);
      if (isCancelled()) return;

      setSelectedPathwayDetail(detailData);
      setDetailError(null);
    } catch (err) {
      if (isCancelled()) return;

      setDetailError(normalizeApiError(err, 'Failed to load pathway details.'));
      setSelectedPathwayDetail(null);
    } finally {
      if (!isCancelled()) {
        setDetailLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const activeId = selectedCareerDirectionId || selectedCombinationId || selectedStructuralNodeId;
    if (!activeId) return;

    const canonicalId = getCanonicalPathwayId(activeId);
    loadPathwayDetail(canonicalId);
  }, [selectedCareerDirectionId, selectedCombinationId, selectedStructuralNodeId, loadPathwayDetail]);

  const handleSelectSearchResult = ({ pathwayId, option }) => {
    resolvePathwayHierarchy(pathwayId);
    updateUrlPathway(pathwayId);

    if (option) {
      setSelectedOptionId(option.id);
    } else {
      setSelectedOptionId(null);
    }

    const explorerContainer = document.getElementById('admin-preview-explorer');
    if (explorerContainer) {
      explorerContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSelectChoiceDirection = (chosenId) => {
    setSelectedOptionId(null);
    if (selectedCombinationId) {
      setSelectedCareerDirectionId(chosenId);
      updateUrlPathway(chosenId);
    } else {
      if (BRANCH_CHOICE_MAPPING[chosenId]) {
        setSelectedCombinationId(chosenId);
        setSelectedCareerDirectionId(null);
        updateUrlPathway(chosenId);
      } else {
        setSelectedCareerDirectionId(chosenId);
        updateUrlPathway(chosenId);
      }
    }
  };

  const handleSelectBreadcrumbNode = (nodeId) => {
    setSelectedOptionId(null);
    resolvePathwayHierarchy(nodeId);
    updateUrlPathway(nodeId);
  };

  const handleResetView = () => {
    setSelectedStructuralNodeId('puc-science');
    setSelectedCombinationId(null);
    setSelectedCareerDirectionId(null);
    setSelectedOptionId(null);
    updateUrlPathway('puc-science');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Top Header Banner with Pathway preview badge & clear return link */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <Badge variant="primary" size="sm" className="bg-teal-50 text-[#005F60] border-teal-200">
                  <Eye className="w-3 h-3 mr-1" />
                  Pathway preview
                </Badge>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Read-Only Mode
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight mt-1.5">
                Education Pathway Catalog Preview
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Preview standard Karnataka education pathways, branch options, and milestones without student profile context.
              </p>
            </div>

            <Link to="/admin">
              <Button
                variant="outline"
                size="sm"
                className="font-bold text-slate-700 hover:text-slate-900 border-slate-300"
                leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
              >
                Back to Admin Dashboard
              </Button>
            </Link>
          </div>

          {/* Search bar */}
          <PathwaySearch
            apiPathways={pathways}
            onSelectResult={handleSelectSearchResult}
          />
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-4 animate-pulse">
            <div className="h-6 bg-slate-200 rounded w-1/4"></div>
            <div className="h-24 bg-slate-100 rounded-xl"></div>
            <div className="h-24 bg-slate-100 rounded-xl"></div>
          </div>
        )}

        {/* Error Banner */}
        {!loading && error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-rose-900">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-rose-600 flex-shrink-0" />
              <div>
                <h3 className="font-extrabold text-sm">Unable to Fetch Pathways</h3>
                <p className="text-xs text-rose-700 mt-0.5">{error}</p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={fetchPathways}
              className="bg-rose-600 hover:bg-rose-700 text-white"
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Main Content Layout */}
        {!loading && !error && pathways.length > 0 && (
          <div id="admin-preview-explorer" className="space-y-5">
            {/* Journey Breadcrumb */}
            <PathwayBreadcrumb
              selectedPathwayId={selectedCareerDirectionId || selectedCombinationId || selectedStructuralNodeId}
              apiPathwaysMap={apiPathwaysMap}
              onSelectNode={handleSelectBreadcrumbNode}
              onResetView={handleResetView}
              studentLevel={null}
            />

            {/* 2-Column Desktop Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Side: Structural Map + Progressive Choice Explorer */}
              <div className="lg:col-span-7 xl:col-span-8 space-y-5 min-w-0">
                <EducationPathwayMap
                  selectedNodeId={selectedStructuralNodeId}
                  onSelectNode={(nodeId) => {
                    setSelectedStructuralNodeId(nodeId);
                    setSelectedCombinationId(null);
                    setSelectedCareerDirectionId(null);
                    setSelectedOptionId(null);
                    updateUrlPathway(nodeId);
                  }}
                  studentProfile={null}
                  recommendations={null}
                />

                {currentChoicePathways.length > 0 && (
                  <PathwayChoiceExplorer
                    parentContextPathway={parentContextPathway}
                    choicePathways={currentChoicePathways}
                    selectedDirectionId={selectedCareerDirectionId || selectedCombinationId}
                    onSelectDirection={handleSelectChoiceDirection}
                    recommendations={null}
                    isCombinationStep={Boolean(selectedCombinationId)}
                  />
                )}
              </div>

              {/* Right Side: Interactive Details Panel (Read-only, no onSelectGoal) */}
              <div className="lg:col-span-5 xl:col-span-4 sticky top-24">
                <PathwayDetailPanel
                  detail={selectedPathwayDetail}
                  loading={detailLoading}
                  error={detailError}
                  onRetry={() => {
                    const activeId = selectedCareerDirectionId || selectedCombinationId || selectedStructuralNodeId;
                    const canonicalId = getCanonicalPathwayId(activeId);
                    loadPathwayDetail(canonicalId);
                  }}
                  onSelectGoal={null}
                  recommendations={null}
                  selectedOptionId={selectedOptionId}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPathwayPreviewPage;
