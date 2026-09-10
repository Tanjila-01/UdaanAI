import React, { useState, useEffect, useRef } from 'react';
import { getAdminWorkshopRequestsApi, getWorkshopFeedbackLinkApi } from '../../api/client';
import { normalizeApiError } from '../../utils/errorHandler';
import AdminLayout from '../../components/layout/AdminLayout';
import {
  CheckCircle2,
  Calendar,
  Users,
  Star,
  Search,
  Building2,
  X,
  AlertTriangle,
  ChevronRight,
  Copy,
  Check,
} from 'lucide-react';

const KARNATAKA_DISTRICTS = [
  'Bagalkot', 'Ballari', 'Belagavi', 'Bengaluru Rural', 'Bengaluru Urban',
  'Bidar', 'Chamarajanagar', 'Chikkaballapur', 'Chikkamagaluru', 'Chitradurga',
  'Dakshina Kannada', 'Davanagere', 'Dharwad', 'Gadag', 'Hassan',
  'Haveri', 'Kalaburagi', 'Kodagu', 'Kolar', 'Koppal',
  'Mandya', 'Mysuru', 'Raichur', 'Ramanagara', 'Shivamogga',
  'Tumakuru', 'Udupi', 'Uttara Kannada', 'Vijayanagara', 'Yadgir'
];

export const AdminCompletedPage = () => {
  const [completedWorkshops, setCompletedWorkshops] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const [linkState, setLinkState] = useState({});
  const copyingRef = useRef(false);

  const handleCopyFeedbackLink = async (workshop) => {
    if (!workshop || copyingRef.current) return;
    copyingRef.current = true;
    setCopiedId(null);
    setLinkState({ id: workshop.id, loading: true });
    try {
      const result = await getWorkshopFeedbackLinkApi(workshop.id);
      if (!result.feedback_url) throw new Error('No feedback link was returned. Please retry.');
      const url = new URL(result.feedback_url, window.location.origin).href;
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(url);
        setCopiedId(workshop.id);
        setLinkState({ id: workshop.id });
      } catch {
        setLinkState({ id: workshop.id, url });
      }
    } catch (err) {
      setLinkState({ id: workshop.id, error: normalizeApiError(err, 'Could not retrieve feedback link. Please retry.') });
    } finally {
      copyingRef.current = false;
    }
  };

  const renderLinkStatus = (id) => linkState.id !== id ? null : (
    <div className="text-xs mt-2 text-left">
      {linkState.loading && <p role="status">Getting feedback link...</p>}
      {linkState.error && <p role="alert" className="text-red-700">{linkState.error}</p>}
      {linkState.url && <label className="block">Copy this feedback link manually:
        <input aria-label="Feedback link" readOnly value={linkState.url}
          onFocus={(event) => event.target.select()}
          className="block w-full border rounded p-2 mt-1" />
      </label>}
    </div>
  );

  const fetchCompleted = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminWorkshopRequestsApi({
        status: 'COMPLETED',
        district: districtFilter,
        search: searchTerm,
      });
      setCompletedWorkshops(res || []);
    } catch (err) {
      setError(normalizeApiError(err, 'Failed to load completed workshops.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompleted();
  }, [districtFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCompleted();
  };

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      return new Date(isoString).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return '—';
    try {
      return new Date(isoString).toLocaleString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
          <div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">Completed Workshops</h1>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Historical archive of completed sessions, recorded student attendance, and feedback metrics.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchCompleted}
            className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-colors self-start sm:self-auto"
          >
            Refresh Records
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search completed workshops..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#005F60]"
              />
            </form>

            <div>
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#005F60]"
              >
                <option value="ALL">All Districts</option>
                {KARNATAKA_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && !completedWorkshops ? (
          <div
            role="alert"
            className="bg-white border border-rose-200 rounded-2xl p-12 text-center space-y-4 shadow-2xs"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-slate-900">Failed to load completed workshops</h2>
              <p className="text-xs text-rose-700">{error}</p>
            </div>
            <button
              type="button"
              onClick={fetchCompleted}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              <span>Retry</span>
            </button>
          </div>
        ) : (
          <>
            {error && completedWorkshops && (
              <div
                role="alert"
                className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 text-xs shadow-2xs"
              >
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-bold">Showing cached data (data may be stale).</span>
                    <span className="ml-1 text-amber-800">{error}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={fetchCompleted}
                  className="text-xs font-bold text-amber-950 bg-amber-200/80 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors shrink-0 self-start sm:self-auto cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Historical Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
              {loading && !completedWorkshops ? (
                <div className="p-12 text-center text-xs text-slate-400">Loading historical records...</div>
              ) : completedWorkshops?.length === 0 ? (
                <div className="p-12 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No completed workshops yet</p>
                  <p className="text-[11px] text-slate-400">
                    Workshops marked as completed from the Scheduled tab will be archived here.
                  </p>
                </div>
              ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200/60 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Completion Recorded</th>
                    <th className="py-3.5 px-4">Institution</th>
                    <th className="py-3.5 px-4">District</th>
                    <th className="py-3.5 px-4">Mode</th>
                    <th className="py-3.5 px-4">Recorded Attendance</th>
                    <th className="py-3.5 px-4">Rating</th>
                    <th className="py-3.5 px-4">Facilitator</th>
                    <th className="py-3.5 px-4 text-right">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {completedWorkshops.map((w) => (
                    <tr
                      key={w.id}
                      onClick={() => setSelectedWorkshop(w)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatDate(w.schedule?.completed_at || w.schedule?.scheduled_start)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{w.institution_name}</div>
                        <div className="text-[11px] text-slate-500 capitalize">{w.institution_type?.replace('_', ' ')}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{w.district}</td>
                      <td className="py-3.5 px-4">
                        <span className="capitalize px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                          {w.schedule?.mode || w.preferred_mode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-950">
                        {w.schedule?.actual_attendance !== null && w.schedule?.actual_attendance !== undefined
                          ? `${w.schedule.actual_attendance} students`
                          : '—'}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {w.schedule?.feedback_score !== null && w.schedule?.feedback_score !== undefined ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                            <Star className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                            <span>{w.schedule.feedback_score}</span>
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {w.schedule?.assigned_facilitator || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyFeedbackLink(w);
                              }}
                              title="Copy Feedback Link"
                              disabled={!!linkState.loading}
                              className="inline-flex h-11 min-w-[120px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-teal-200 bg-white px-3 text-xs font-semibold text-[#005F60] shadow-sm transition-colors hover:border-teal-400 hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
                            >
                              {copiedId === w.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-700">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>{linkState.loading && linkState.id === w.id ? 'Getting link…' : 'Copy Link'}</span>
                                </>
                              )}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedWorkshop(w);
                            }}
                            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-transparent bg-teal-50 px-3 text-xs font-semibold text-[#005F60] transition-colors hover:bg-teal-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
                          >
                            <span>View Details</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {renderLinkStatus(w.id)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>
    )}
  </div>

      {/* Completed Workshop Audit Drawer */}
      {selectedWorkshop && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-2xs animate-in fade-in duration-100">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 overflow-y-auto animate-in slide-in-from-right duration-200">
            <div>
              <div className="bg-slate-900 text-white p-6 flex items-start justify-between border-b border-slate-800 sticky top-0 z-10">
                <div>
                  <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    Marked Completed
                  </span>
                  <h2 className="text-lg font-extrabold text-white mt-1 leading-tight">
                    {selectedWorkshop.institution_name}
                  </h2>
                  <p className="text-xs text-slate-300 capitalize mt-0.5">
                    {selectedWorkshop.district} • {selectedWorkshop.institution_type?.replace('_', ' ')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedWorkshop(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6 text-xs text-slate-700">
                {/* Metrics Pill */}
                <div className="grid grid-cols-2 gap-3 bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4">
                  <div>
                    <div className="text-[10px] font-bold uppercase text-emerald-800">Recorded Attendance</div>
                    <div className="text-xl font-black text-slate-950 mt-0.5">
                      {selectedWorkshop.schedule?.actual_attendance ?? '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase text-emerald-800">Admin Feedback Rating</div>
                    <div className="text-xl font-black text-slate-950 mt-0.5 flex items-center space-x-1">
                      <Star className="w-4 h-4 fill-amber-500 text-amber-500 inline" />
                      <span>
                        {selectedWorkshop.schedule?.feedback_score !== null && selectedWorkshop.schedule?.feedback_score !== undefined
                          ? `${selectedWorkshop.schedule.feedback_score} / 5.0`
                          : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Coordinator Feedback Section */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Coordinator feedback via shared link
                    </div>
                    {(
                      <button
                        type="button"
                        onClick={() => handleCopyFeedbackLink(selectedWorkshop)}
                        disabled={!!linkState.loading}
                        className="inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-teal-200 bg-white px-4 text-xs font-semibold text-[#005F60] shadow-sm transition-colors hover:border-teal-400 hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
                      >
                        {copiedId === selectedWorkshop.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Copied Link</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>{linkState.loading && linkState.id === selectedWorkshop.id ? 'Getting link…' : 'Copy Feedback Link'}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {renderLinkStatus(selectedWorkshop.id)}
                  {selectedWorkshop.coordinator_feedback?.submitted_at ? (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-base text-slate-900">
                          {selectedWorkshop.coordinator_feedback.rating} / 5
                        </span>
                        <div className="flex text-amber-500">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= selectedWorkshop.coordinator_feedback.rating
                                  ? 'fill-amber-400 text-amber-500'
                                  : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {selectedWorkshop.coordinator_feedback.comments && (
                        <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-800 italic leading-relaxed">
                          "{selectedWorkshop.coordinator_feedback.comments}"
                        </div>
                      )}
                      <div className="text-[11px] text-slate-400">
                        Submitted on {formatDate(selectedWorkshop.coordinator_feedback.submitted_at)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 italic py-1">
                      Awaiting coordinator feedback
                    </div>
                  )}
                </div>

                {/* Session Details */}
                <div className="space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Completed Session Summary
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-slate-400 text-[10px] font-bold">Scheduled Start</div>
                      <div className="font-semibold text-slate-900 mt-0.5">
                        {formatDateTime(selectedWorkshop.schedule?.scheduled_start)}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-slate-400 text-[10px] font-bold">Duration</div>
                      <div className="font-semibold text-slate-900 mt-0.5">
                        {selectedWorkshop.schedule?.duration_minutes || 90} Minutes
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400 text-[10px] font-bold">Assigned Facilitator</div>
                    <div className="font-semibold text-slate-900">{selectedWorkshop.schedule?.assigned_facilitator || '—'}</div>
                  </div>

                  <div>
                    <div className="text-slate-400 text-[10px] font-bold">Venue / Meeting Link</div>
                    <div className="font-semibold text-slate-900 break-all">{selectedWorkshop.schedule?.venue_or_meeting_link}</div>
                  </div>

                  {selectedWorkshop.schedule?.completion_notes && (
                    <div>
                      <div className="text-slate-400 text-[10px] font-bold">Completion Notes</div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 leading-relaxed italic">
                        "{selectedWorkshop.schedule.completion_notes}"
                      </div>
                    </div>
                  )}
                </div>

                {/* Coordinator Details */}
                <div className="space-y-2 pt-4 border-t border-slate-200">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Coordinator Details (Reference)
                  </div>
                  <div className="font-bold text-slate-900">{selectedWorkshop.contact_name}</div>
                  <div className="text-slate-600">
                    Phone: <span className="font-semibold">{selectedWorkshop.contact_phone}</span>
                  </div>
                  <div className="text-slate-600">
                    Email: <span className="font-semibold">{selectedWorkshop.contact_email}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedWorkshop(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-2 rounded-xl text-xs transition-colors"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminCompletedPage;
