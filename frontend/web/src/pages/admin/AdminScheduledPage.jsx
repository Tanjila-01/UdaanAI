import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  getAdminWorkshopRequestsApi,
  completeWorkshopApi,
  updateWorkshopScheduleApi,
  cancelWorkshopApi,
} from '../../api/client';
import AdminLayout from '../../components/layout/AdminLayout';
import {
  CalendarCheck,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink,
  Edit,
  XCircle,
} from 'lucide-react';

export const AdminScheduledPage = () => {
  const location = useLocation();
  const [scheduledWorkshops, setScheduledWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const [completeForm, setCompleteForm] = useState({
    actual_attendance: '',
    feedback_score: '',
    completion_notes: '',
  });

  const [editForm, setEditForm] = useState({
    date: '',
    time: '',
    duration_minutes: 90,
    mode: 'offline',
    venue_or_meeting_link: '',
    assigned_facilitator: '',
    internal_notes: '',
  });

  const [cancelReason, setCancelReason] = useState('');

  const fetchScheduled = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminWorkshopRequestsApi({ status: 'SCHEDULED' });
      // Sort by scheduled start asc
      const sorted = (res || []).sort((a, b) => {
        const timeA = a.schedule?.scheduled_start ? new Date(a.schedule.scheduled_start).getTime() : 0;
        const timeB = b.schedule?.scheduled_start ? new Date(b.schedule.scheduled_start).getTime() : 0;
        return timeA - timeB;
      });
      setScheduledWorkshops(sorted);

      const searchParams = new URLSearchParams(location.search);
      const openId = searchParams.get('open');
      if (openId && sorted) {
        const found = sorted.find((w) => w.id === openId);
        if (found) handleOpenComplete(found);
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load scheduled workshops.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduled();
  }, []);

  const handleOpenComplete = (workshop) => {
    setSelectedWorkshop(workshop);
    setCompleteForm({
      actual_attendance: workshop.student_count || '',
      feedback_score: '',
      completion_notes: '',
    });
    setActionError(null);
    setIsCompleteModalOpen(true);
  };

  const handleOpenEdit = (workshop) => {
    setSelectedWorkshop(workshop);
    if (workshop.schedule) {
      const dt = new Date(workshop.schedule.scheduled_start);
      const yyyy = dt.getFullYear();
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const dd = String(dt.getDate()).padStart(2, '0');
      const hh = String(dt.getHours()).padStart(2, '0');
      const min = String(dt.getMinutes()).padStart(2, '0');

      setEditForm({
        date: `${yyyy}-${mm}-${dd}`,
        time: `${hh}:${min}`,
        duration_minutes: workshop.schedule.duration_minutes || 90,
        mode: workshop.schedule.mode || 'offline',
        venue_or_meeting_link: workshop.schedule.venue_or_meeting_link || '',
        assigned_facilitator: workshop.schedule.assigned_facilitator || '',
        internal_notes: workshop.schedule.internal_notes || '',
      });
    }
    setActionError(null);
    setIsEditModalOpen(true);
  };

  const handleOpenCancel = (workshop) => {
    setSelectedWorkshop(workshop);
    setCancelReason('');
    setActionError(null);
    setIsCancelModalOpen(true);
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!selectedWorkshop) return;
    try {
      setActionLoading(true);
      setActionError(null);
      const payload = {
        actual_attendance: completeForm.actual_attendance ? parseInt(completeForm.actual_attendance, 10) : null,
        feedback_score: completeForm.feedback_score ? parseFloat(completeForm.feedback_score) : null,
        completion_notes: completeForm.completion_notes || null,
      };
      await completeWorkshopApi(selectedWorkshop.id, payload);
      setIsCompleteModalOpen(false);
      fetchScheduled();
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Failed to complete workshop.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedWorkshop) return;
    try {
      setActionLoading(true);
      setActionError(null);
      const isoDatetime = new Date(`${editForm.date}T${editForm.time}:00`).toISOString();
      const payload = {
        scheduled_start: isoDatetime,
        duration_minutes: parseInt(editForm.duration_minutes, 10),
        mode: editForm.mode,
        venue_or_meeting_link: editForm.venue_or_meeting_link,
        assigned_facilitator: editForm.assigned_facilitator || null,
        internal_notes: editForm.internal_notes || null,
      };
      await updateWorkshopScheduleApi(selectedWorkshop.id, payload);
      setIsEditModalOpen(false);
      fetchScheduled();
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Failed to update schedule.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!selectedWorkshop) return;
    try {
      setActionLoading(true);
      setActionError(null);
      await cancelWorkshopApi(selectedWorkshop.id, { cancellation_reason: cancelReason });
      setIsCancelModalOpen(false);
      fetchScheduled();
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Failed to cancel workshop.');
    } finally {
      setActionLoading(false);
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
              <CalendarCheck className="w-6 h-6 text-[#005F60]" />
              <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">Scheduled Workshops</h1>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Confirmed orientation sessions, facilitator allocations, and completion recording.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchScheduled}
            className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-colors self-start sm:self-auto"
          >
            Refresh Schedule
          </button>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center space-x-3 text-rose-800 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading scheduled agenda...</div>
          ) : scheduledWorkshops.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <CalendarCheck className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-700">No scheduled workshops</p>
              <p className="text-[11px] text-slate-400">
                Go to Workshop Requests to coordinate and schedule new sessions with schools.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200/60 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-4">Institution</th>
                    <th className="py-3.5 px-4">District</th>
                    <th className="py-3.5 px-4">Mode</th>
                    <th className="py-3.5 px-4">Est. Students</th>
                    <th className="py-3.5 px-4">Facilitator</th>
                    <th className="py-3.5 px-4">Venue / Link</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {scheduledWorkshops.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-extrabold text-slate-900 whitespace-nowrap">
                        {formatDateTime(w.schedule?.scheduled_start)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{w.institution_name}</div>
                        <div className="text-[11px] text-slate-500 capitalize">{w.institution_type?.replace('_', ' ')}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{w.district}</td>
                      <td className="py-3.5 px-4">
                        <span className="capitalize px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-[#005F60]">
                          {w.schedule?.mode || w.preferred_mode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{w.student_count}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {w.schedule?.assigned_facilitator || <span className="text-slate-400 italic">Unassigned</span>}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={w.schedule?.venue_or_meeting_link}>
                        {w.schedule?.venue_or_meeting_link}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenComplete(w)}
                            className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg transition-colors shadow-2xs flex items-center space-x-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Complete</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(w)}
                            className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-lg transition-colors"
                            title="Edit Schedule"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenCancel(w)}
                            className="text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"
                            title="Cancel Session"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Complete Workshop Modal */}
      {isCompleteModalOpen && selectedWorkshop && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Mark Workshop Completed</h3>
                  <p className="text-[11px] text-slate-500 truncate max-w-xs">{selectedWorkshop.institution_name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCompleteModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800">
                {actionError}
              </div>
            )}

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
                <label className="block text-slate-700 font-bold mb-1">Feedback Score (0.0 – 5.0, optional)</label>
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
                <label className="block text-slate-700 font-bold mb-1">Completion Notes / Facilitator Comments</label>
                <textarea
                  rows="3"
                  placeholder="Session went smoothly; high interest in lateral diploma entry and AI tools."
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
                  {actionLoading ? 'Saving...' : 'Confirm Completion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Schedule Modal */}
      {isEditModalOpen && selectedWorkshop && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900">Edit Workshop Schedule</h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800">
                {actionError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#005F60]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Start Time (Local) *</label>
                  <input
                    type="time"
                    required
                    value={editForm.time}
                    onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#005F60]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    min="15"
                    max="480"
                    value={editForm.duration_minutes}
                    onChange={(e) => setEditForm({ ...editForm, duration_minutes: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#005F60]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Mode *</label>
                  <select
                    value={editForm.mode}
                    onChange={(e) => setEditForm({ ...editForm, mode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#005F60]"
                  >
                    <option value="offline">Offline (In-Person)</option>
                    <option value="online">Online (Virtual)</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Venue / Link *</label>
                <input
                  type="text"
                  required
                  value={editForm.venue_or_meeting_link}
                  onChange={(e) => setEditForm({ ...editForm, venue_or_meeting_link: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#005F60]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Assigned Facilitator</label>
                <input
                  type="text"
                  value={editForm.assigned_facilitator}
                  onChange={(e) => setEditForm({ ...editForm, assigned_facilitator: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#005F60]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Internal Notes</label>
                <textarea
                  rows="2"
                  value={editForm.internal_notes}
                  onChange={(e) => setEditForm({ ...editForm, internal_notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#005F60]"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-[#005F60] hover:bg-[#004D4E] text-white font-extrabold px-5 py-2 rounded-xl shadow-xs disabled:opacity-50"
                >
                  {actionLoading ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {isCancelModalOpen && selectedWorkshop && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900">Cancel Scheduled Workshop</h3>
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
                Are you sure you want to cancel the workshop for{' '}
                <strong className="text-slate-900">{selectedWorkshop.institution_name}</strong>?
              </p>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Reason for Cancellation *</label>
                <textarea
                  rows="3"
                  required
                  placeholder="e.g. Schedule clash with board exams; institution requested rescheduling."
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

export default AdminScheduledPage;
