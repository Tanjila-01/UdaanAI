import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  getAdminWorkshopRequestsApi,
  markWorkshopContactedApi,
  scheduleWorkshopApi,
  updateWorkshopScheduleApi,
  completeWorkshopApi,
  cancelWorkshopApi,
} from '../../api/client';
import AdminLayout from '../../components/layout/AdminLayout';
import {
  Search,
  Filter,
  X,
  Phone,
  Mail,
  Calendar,
  Clock,
  MapPin,
  Building2,
  Users,
  CheckCircle2,
  AlertCircle,
  CalendarCheck,
  AlertTriangle,
  XCircle,
  PhoneCall,
  Sparkles,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

const KARNATAKA_DISTRICTS = [
  'Bagalkot', 'Ballari', 'Belagavi', 'Bengaluru Rural', 'Bengaluru Urban',
  'Bidar', 'Chamarajanagar', 'Chikkaballapur', 'Chikkamagaluru', 'Chitradurga',
  'Dakshina Kannada', 'Davanagere', 'Dharwad', 'Gadag', 'Hassan',
  'Haveri', 'Kalaburagi', 'Kodagu', 'Kolar', 'Koppal',
  'Mandya', 'Mysuru', 'Raichur', 'Ramanagara', 'Shivamogga',
  'Tumakuru', 'Udupi', 'Uttara Kannada', 'Vijayanagara', 'Yadgir'
];

export const AdminRequestsPage = () => {
  const location = useLocation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [modeFilter, setModeFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Request for Detail Drawer
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Modals inside drawer
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  // Scheduling form state
  const [scheduleForm, setScheduleForm] = useState({
    date: '',
    time: '10:30',
    duration_minutes: 90,
    mode: 'offline',
    venue_or_meeting_link: '',
    assigned_facilitator: '',
    internal_notes: '',
  });

  // Completion form state
  const [completeForm, setCompleteForm] = useState({
    actual_attendance: '',
    feedback_score: '',
    completion_notes: '',
  });

  // Cancellation form state
  const [cancelReason, setCancelReason] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminWorkshopRequestsApi({
        status: statusFilter,
        district: districtFilter,
        mode: modeFilter,
        search: searchTerm,
      });
      setRequests(res);

      // Handle ?open=request_id query param
      const searchParams = new URLSearchParams(location.search);
      const openId = searchParams.get('open');
      if (openId && res) {
        const found = res.find((r) => r.id === openId);
        if (found) setSelectedRequest(found);
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, districtFilter, modeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRequests();
  };

  const handleOpenDrawer = (req) => {
    setSelectedRequest(req);
    setActionError(null);
    if (req.schedule) {
      const dt = new Date(req.schedule.scheduled_start);
      const yyyy = dt.getFullYear();
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const dd = String(dt.getDate()).padStart(2, '0');
      const hh = String(dt.getHours()).padStart(2, '0');
      const min = String(dt.getMinutes()).padStart(2, '0');

      setScheduleForm({
        date: `${yyyy}-${mm}-${dd}`,
        time: `${hh}:${min}`,
        duration_minutes: req.schedule.duration_minutes || 90,
        mode: req.schedule.mode || 'offline',
        venue_or_meeting_link: req.schedule.venue_or_meeting_link || '',
        assigned_facilitator: req.schedule.assigned_facilitator || '',
        internal_notes: req.schedule.internal_notes || '',
      });
    } else {
      setScheduleForm({
        date: req.preferred_date || '',
        time: '10:30',
        duration_minutes: 90,
        mode: req.preferred_mode || 'offline',
        venue_or_meeting_link: '',
        assigned_facilitator: '',
        internal_notes: '',
      });
    }
  };

  // --- Operational Actions ---

  const handleMarkContacted = async () => {
    if (!selectedRequest) return;
    try {
      setActionLoading(true);
      setActionError(null);
      const updated = await markWorkshopContactedApi(selectedRequest.id);
      setSelectedRequest(updated);
      setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Failed to update request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;
    try {
      setActionLoading(true);
      setActionError(null);

      // Convert local date + time to ISO-8601 string
      const isoDatetime = new Date(`${scheduleForm.date}T${scheduleForm.time}:00`).toISOString();

      const payload = {
        scheduled_start: isoDatetime,
        duration_minutes: parseInt(scheduleForm.duration_minutes, 10),
        mode: scheduleForm.mode,
        venue_or_meeting_link: scheduleForm.venue_or_meeting_link,
        assigned_facilitator: scheduleForm.assigned_facilitator || null,
        internal_notes: scheduleForm.internal_notes || null,
      };

      let updated;
      if (selectedRequest.schedule) {
        updated = await updateWorkshopScheduleApi(selectedRequest.id, payload);
      } else {
        updated = await scheduleWorkshopApi(selectedRequest.id, payload);
      }

      setSelectedRequest(updated);
      setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setIsScheduleModalOpen(false);
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Failed to schedule workshop.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;
    try {
      setActionLoading(true);
      setActionError(null);
      const payload = {
        actual_attendance: completeForm.actual_attendance ? parseInt(completeForm.actual_attendance, 10) : null,
        feedback_score: completeForm.feedback_score ? parseFloat(completeForm.feedback_score) : null,
        completion_notes: completeForm.completion_notes || null,
      };
      const updated = await completeWorkshopApi(selectedRequest.id, payload);
      setSelectedRequest(updated);
      setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setIsCompleteModalOpen(false);
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Failed to complete workshop.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;
    try {
      setActionLoading(true);
      setActionError(null);
      const updated = await cancelWorkshopApi(selectedRequest.id, {
        cancellation_reason: cancelReason,
      });
      setSelectedRequest(updated);
      setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setIsCancelModalOpen(false);
      setCancelReason('');
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Failed to cancel request.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'NEW':
        return <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold">NEW</span>;
      case 'CONTACTED':
        return <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-bold">CONTACTED</span>;
      case 'SCHEDULED':
        return <span className="bg-teal-50 text-[#005F60] border border-teal-200 px-2 py-0.5 rounded text-[10px] font-bold">SCHEDULED</span>;
      case 'COMPLETED':
        return <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">COMPLETED</span>;
      case 'CANCELLED':
        return <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold">CANCELLED</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">{status}</span>;
    }
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
            <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">Workshop Requests</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Review incoming school applications, follow up with coordinators, and manage scheduling.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchRequests}
            className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-colors self-start sm:self-auto"
          >
            Refresh List
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search institution, contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#005F60]"
              />
            </form>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#005F60]"
              >
                <option value="ALL">Status: All Requests</option>
                <option value="NEW">Status: NEW Only</option>
                <option value="CONTACTED">Status: CONTACTED Only</option>
                <option value="SCHEDULED">Status: SCHEDULED Only</option>
                <option value="COMPLETED">Status: COMPLETED Only</option>
                <option value="CANCELLED">Status: CANCELLED Only</option>
              </select>
            </div>

            {/* District Filter */}
            <div>
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#005F60]"
              >
                <option value="ALL">District: All Karnataka</option>
                {KARNATAKA_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Mode Filter */}
            <div>
              <select
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#005F60]"
              >
                <option value="ALL">Mode: All Delivery Modes</option>
                <option value="offline">Offline (In-Person)</option>
                <option value="online">Online (Virtual)</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center space-x-3 text-rose-800 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Requests Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading requests pipeline...</div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-700">No requests found</p>
              <p className="text-[11px] text-slate-400">Try adjusting your filters or search criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200/60 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Institution</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">District</th>
                    <th className="py-3.5 px-4">Mode</th>
                    <th className="py-3.5 px-4">Students</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Submitted</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.map((req) => (
                    <tr
                      key={req.id}
                      onClick={() => handleOpenDrawer(req)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{req.institution_name}</div>
                        <div className="text-[11px] text-slate-500">{req.contact_name}</div>
                      </td>
                      <td className="py-3.5 px-4 capitalize text-slate-600 font-medium">
                        {req.institution_type?.replace('_', ' ')}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{req.district}</td>
                      <td className="py-3.5 px-4">
                        <span className="capitalize px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                          {req.preferred_mode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{req.student_count}</td>
                      <td className="py-3.5 px-4">{getStatusBadge(req.status)}</td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">{formatDate(req.created_at)}</td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleOpenDrawer(req)}
                          className="text-xs font-bold text-[#005F60] hover:text-[#004D4E] bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center space-x-1"
                        >
                          <span>Open</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SLIDE-OVER REQUEST DETAIL DRAWER */}
      {/* ========================================================================= */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-2xs animate-in fade-in duration-100">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 overflow-y-auto animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div>
              <div className="bg-slate-900 text-white p-6 flex items-start justify-between border-b border-slate-800 sticky top-0 z-10">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    {getStatusBadge(selectedRequest.status)}
                    <span className="text-xs text-slate-400">ID: {selectedRequest.id.substring(0, 8)}</span>
                  </div>
                  <h2 className="text-lg font-extrabold text-white leading-tight">
                    {selectedRequest.institution_name}
                  </h2>
                  <p className="text-xs text-slate-300 capitalize mt-0.5">
                    {selectedRequest.institution_type?.replace('_', ' ')} • {selectedRequest.district}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {actionError && (
                <div className="m-4 bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start space-x-2 text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* Drawer Content */}
              <div className="p-6 space-y-6 text-xs text-slate-700">
                {/* Coordinator Details */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Coordinator Information
                  </div>
                  <div className="font-bold text-sm text-slate-950">{selectedRequest.contact_name}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <a
                      href={`tel:${selectedRequest.contact_phone}`}
                      className="flex items-center space-x-2 p-2 rounded-xl bg-white border border-slate-200 text-slate-800 hover:border-[#005F60] transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#005F60]" />
                      <span className="font-semibold">{selectedRequest.contact_phone}</span>
                    </a>
                    <a
                      href={`mailto:${selectedRequest.contact_email}`}
                      className="flex items-center space-x-2 p-2 rounded-xl bg-white border border-slate-200 text-slate-800 hover:border-[#005F60] transition-colors truncate"
                    >
                      <Mail className="w-3.5 h-3.5 text-[#005F60] shrink-0" />
                      <span className="font-semibold truncate">{selectedRequest.contact_email}</span>
                    </a>
                  </div>
                </div>

                {/* Session Requirements */}
                <div className="space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Workshop Requirements
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-slate-400 text-[10px] font-bold">Estimated Audience</div>
                      <div className="font-extrabold text-sm text-slate-900 mt-0.5">
                        {selectedRequest.student_count} Students
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-slate-400 text-[10px] font-bold">Delivery Mode</div>
                      <div className="font-extrabold text-sm text-slate-900 mt-0.5 capitalize">
                        {selectedRequest.preferred_mode}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400 text-[10px] font-bold mb-1.5">Requested Topics</div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedRequest.preferred_topics.map((t) => (
                        <span
                          key={t}
                          className="bg-teal-50 text-[#005F60] border border-teal-200 px-2 py-1 rounded-md font-bold text-[10px] capitalize"
                        >
                          {t.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>

                  {selectedRequest.preferred_date && (
                    <div>
                      <div className="text-slate-400 text-[10px] font-bold">Target Preferred Date</div>
                      <div className="font-semibold text-slate-800">{formatDate(selectedRequest.preferred_date)}</div>
                    </div>
                  )}

                  {selectedRequest.city && (
                    <div>
                      <div className="text-slate-400 text-[10px] font-bold">City / Town</div>
                      <div className="font-semibold text-slate-800">{selectedRequest.city}</div>
                    </div>
                  )}

                  {selectedRequest.message && (
                    <div>
                      <div className="text-slate-400 text-[10px] font-bold">Coordinator Message / Campus Notes</div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed italic">
                        "{selectedRequest.message}"
                      </div>
                    </div>
                  )}
                </div>

                {/* Schedule Information (If already scheduled or completed) */}
                {selectedRequest.schedule && (
                  <div className="bg-teal-50/50 border border-teal-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#005F60]">
                        Confirmed Workshop Schedule
                      </div>
                      <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                        Active Schedule
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 font-bold block text-[10px]">Session Start</span>
                        <span className="font-bold text-slate-900">
                          {formatDateTime(selectedRequest.schedule.scheduled_start)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-bold block text-[10px]">Duration</span>
                        <span className="font-semibold text-slate-800">
                          {selectedRequest.schedule.duration_minutes || 90} Minutes
                        </span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-500 font-bold block text-[10px]">Venue / Link</span>
                        <span className="font-semibold text-slate-900 break-all">
                          {selectedRequest.schedule.venue_or_meeting_link}
                        </span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-500 font-bold block text-[10px]">Facilitator</span>
                        <span className="font-semibold text-slate-900">
                          {selectedRequest.schedule.assigned_facilitator || 'To be assigned'}
                        </span>
                      </div>
                      {selectedRequest.schedule.internal_notes && (
                        <div className="sm:col-span-2">
                          <span className="text-slate-500 font-bold block text-[10px]">Internal Notes</span>
                          <span className="text-slate-700 italic">{selectedRequest.schedule.internal_notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Completion Audit (If completed) */}
                {selectedRequest.status === 'COMPLETED' && selectedRequest.schedule && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                      Delivered Session Audit
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-500 font-bold text-[10px] block">Actual Attendance</span>
                        <span className="font-extrabold text-sm text-slate-950">
                          {selectedRequest.schedule.actual_attendance ?? '—'} Students
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-bold text-[10px] block">Feedback Rating</span>
                        <span className="font-extrabold text-sm text-slate-950">
                          {selectedRequest.schedule.feedback_score ? `${selectedRequest.schedule.feedback_score} / 5.0` : '—'}
                        </span>
                      </div>
                      {selectedRequest.schedule.completion_notes && (
                        <div className="col-span-2 text-slate-700 italic pt-1">
                          "{selectedRequest.schedule.completion_notes}"
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Cancellation Audit (If cancelled) */}
                {selectedRequest.status === 'CANCELLED' && (
                  <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Cancellation Record
                    </div>
                    <p className="text-slate-800 font-semibold">{selectedRequest.cancellation_reason}</p>
                    <p className="text-[10px] text-slate-500">Cancelled on: {formatDateTime(selectedRequest.cancelled_at)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Operational Actions Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-2 justify-end sticky bottom-0">
              {selectedRequest.status === 'NEW' && (
                <>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleMarkContacted}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-2 rounded-xl text-xs transition-colors flex items-center space-x-1.5"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Mark Contacted</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsScheduleModalOpen(true)}
                    className="bg-[#005F60] hover:bg-[#004D4E] text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors flex items-center space-x-1.5 shadow-xs"
                  >
                    <CalendarCheck className="w-3.5 h-3.5" />
                    <span>Schedule Workshop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCancelModalOpen(true)}
                    className="text-slate-600 hover:text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-xl text-xs font-bold transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}

              {selectedRequest.status === 'CONTACTED' && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsScheduleModalOpen(true)}
                    className="bg-[#005F60] hover:bg-[#004D4E] text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors flex items-center space-x-1.5 shadow-xs"
                  >
                    <CalendarCheck className="w-3.5 h-3.5" />
                    <span>Schedule Workshop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCancelModalOpen(true)}
                    className="text-slate-600 hover:text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-xl text-xs font-bold transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}

              {selectedRequest.status === 'SCHEDULED' && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsScheduleModalOpen(true)}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-3 py-2 rounded-xl text-xs transition-colors"
                  >
                    Edit Schedule
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCompleteModalOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors flex items-center space-x-1.5 shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Completed</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCancelModalOpen(true)}
                    className="text-slate-600 hover:text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-xl text-xs font-bold transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}

              {(selectedRequest.status === 'COMPLETED' || selectedRequest.status === 'CANCELLED') && (
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-2 rounded-xl text-xs transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCHEDULE WORKSHOP DIALOG */}
      {/* ========================================================================= */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <CalendarCheck className="w-5 h-5 text-[#005F60]" />
                <h3 className="font-extrabold text-base text-slate-900">
                  {selectedRequest?.schedule ? 'Update Confirmed Schedule' : 'Schedule Workshop'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Session Date *</label>
                  <input
                    type="date"
                    required
                    value={scheduleForm.date}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#005F60]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Start Time (Local) *</label>
                  <input
                    type="time"
                    required
                    value={scheduleForm.time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#005F60]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    min="15"
                    max="480"
                    value={scheduleForm.duration_minutes}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, duration_minutes: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#005F60]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Mode *</label>
                  <select
                    value={scheduleForm.mode}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, mode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#005F60]"
                  >
                    <option value="offline">Offline (In-Person Campus)</option>
                    <option value="online">Online (Virtual Meeting)</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {scheduleForm.mode === 'online' ? 'Meeting Link (Zoom / Meet) *' : 'Venue / Campus Address *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={scheduleForm.mode === 'online' ? 'https://meet.google.com/xyz' : 'School Main Auditorium'}
                  value={scheduleForm.venue_or_meeting_link}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, venue_or_meeting_link: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#005F60]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Assigned Facilitator / Speaker</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. K. Srinivas"
                  value={scheduleForm.assigned_facilitator}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, assigned_facilitator: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#005F60]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Internal Preparation Notes</label>
                <textarea
                  rows="2"
                  placeholder="Auditorium key, slides uploaded, Kannada speaker requested..."
                  value={scheduleForm.internal_notes}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, internal_notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#005F60]"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-[#005F60] hover:bg-[#004D4E] text-white font-extrabold px-5 py-2 rounded-xl shadow-xs disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Confirm Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* COMPLETE WORKSHOP DIALOG */}
      {/* ========================================================================= */}
      {isCompleteModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-base text-slate-900">Complete Workshop</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCompleteModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCompleteSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Actual Student Attendance</label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 215"
                  value={completeForm.actual_attendance}
                  onChange={(e) => setCompleteForm({ ...completeForm, actual_attendance: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Overall Feedback Score (1.0 – 5.0)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  placeholder="e.g. 4.8"
                  value={completeForm.feedback_score}
                  onChange={(e) => setCompleteForm({ ...completeForm, feedback_score: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Completion Notes / Session Highlights</label>
                <textarea
                  rows="3"
                  placeholder="Key takeaways, student feedback, followup requested..."
                  value={completeForm.completion_notes}
                  onChange={(e) => setCompleteForm({ ...completeForm, completion_notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCompleteModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-2 rounded-xl shadow-xs disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Mark Completed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CANCEL REQUEST DIALOG */}
      {/* ========================================================================= */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                <h3 className="font-extrabold text-base text-slate-900">Cancel Workshop Request</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCancelSubmit} className="space-y-3 text-xs">
              <p className="text-slate-600">
                This request will be marked as CANCELLED. All historical details will remain in the database for audit.
              </p>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Reason for Cancellation *</label>
                <textarea
                  rows="3"
                  required
                  placeholder="e.g. School exams scheduled; coordinator requested deferral to next semester."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-rose-600"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 font-bold"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !cancelReason.trim()}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-5 py-2 rounded-xl shadow-xs disabled:opacity-50"
                >
                  {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminRequestsPage;
