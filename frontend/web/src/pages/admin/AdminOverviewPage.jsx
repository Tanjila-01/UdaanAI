import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAdminWorkshopOverviewApi } from '../../api/client';
import AdminLayout from '../../components/layout/AdminLayout';
import {
  Inbox,
  PhoneCall,
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock,
  MapPin,
  Users,
  Building2,
  Calendar,
  Sparkles,
} from 'lucide-react';

export const AdminOverviewPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminWorkshopOverviewApi();
      setData(res);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load operational overview.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

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
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">Workshop Operations</h1>
              <span className="bg-teal-50 text-[#005F60] border border-teal-200 text-xs font-bold px-2 py-0.5 rounded-md">
                Live
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Manage institution requests, upcoming sessions, and completed workshops.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={fetchOverview}
              className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-colors"
            >
              Refresh Data
            </button>
            <Link
              to="/admin/requests"
              className="text-xs font-bold text-white bg-[#005F60] hover:bg-[#004D4E] px-4 py-2 rounded-xl transition-colors shadow-xs flex items-center space-x-1.5"
            >
              <span>View All Requests</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center space-x-3 text-rose-800 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 4 Compact Operational Metric Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">New Requests</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
                <Inbox className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-950">
              {loading ? '—' : data?.metrics?.new_requests ?? 0}
            </div>
            <div className="text-[11px] font-semibold text-amber-700 mt-1 flex items-center space-x-1">
              <span>● Needs Review</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Contacted</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
                <PhoneCall className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-950">
              {loading ? '—' : data?.metrics?.contacted_requests ?? 0}
            </div>
            <div className="text-[11px] font-semibold text-blue-700 mt-1 flex items-center space-x-1">
              <span>● Follow-up Req.</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Scheduled</span>
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#005F60] border border-teal-200 flex items-center justify-center">
                <CalendarCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-950">
              {loading ? '—' : data?.metrics?.scheduled_workshops ?? 0}
            </div>
            <div className="text-[11px] font-semibold text-[#005F60] mt-1 flex items-center space-x-1">
              <span>{data?.metrics?.upcoming_this_week ?? 0} this week</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Completed</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-950">
              {loading ? '—' : data?.metrics?.completed_workshops ?? 0}
            </div>
            <div className="text-[11px] font-semibold text-emerald-700 mt-1 flex items-center space-x-1">
              <span>All-Time Conducted</span>
            </div>
          </div>
        </div>

        {/* Section 1: Requires Attention (Recent NEW Requests) */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <h2 className="text-sm font-extrabold text-slate-900">Requires Attention</h2>
              <span className="text-xs text-slate-400 font-medium">
                ({data?.recent_new_requests?.length || 0} unreviewed)
              </span>
            </div>
            <Link
              to="/admin/requests?status=NEW"
              className="text-xs font-bold text-[#005F60] hover:underline flex items-center space-x-1"
            >
              <span>View All New</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading incoming requests...</div>
          ) : !data?.recent_new_requests?.length ? (
            <div className="p-8 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-xs font-bold text-slate-700">All new requests have been reviewed!</p>
              <p className="text-[11px] text-slate-400">Fresh institutional submissions will appear here automatically.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200/60 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Institution</th>
                    <th className="py-3 px-4">District</th>
                    <th className="py-3 px-4">Mode</th>
                    <th className="py-3 px-4">Students</th>
                    <th className="py-3 px-4">Submitted</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.recent_new_requests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{req.institution_name}</div>
                        <div className="text-[11px] text-slate-500 capitalize">{req.institution_type?.replace('_', ' ')}</div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">{req.district}</td>
                      <td className="py-3.5 px-4">
                        <span className="capitalize px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                          {req.preferred_mode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{req.student_count}</td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">{formatDate(req.created_at)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/requests?open=${req.id}`)}
                          className="text-xs font-bold text-[#005F60] hover:text-[#004D4E] bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center space-x-1"
                        >
                          <span>Open Request</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section 2: Upcoming Workshops */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-[#005F60]" />
              <h2 className="text-sm font-extrabold text-slate-900">Upcoming Workshops</h2>
              <span className="text-xs text-slate-400 font-medium">
                (Next confirmed sessions)
              </span>
            </div>
            <Link
              to="/admin/scheduled"
              className="text-xs font-bold text-[#005F60] hover:underline flex items-center space-x-1"
            >
              <span>View Full Schedule</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading schedule...</div>
          ) : !data?.upcoming_workshops?.length ? (
            <div className="p-8 text-center space-y-2">
              <CalendarCheck className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-700">No workshops scheduled right now.</p>
              <p className="text-[11px] text-slate-400">Review pending requests to coordinate and schedule upcoming sessions.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200/60 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Institution</th>
                    <th className="py-3 px-4">Mode</th>
                    <th className="py-3 px-4">District</th>
                    <th className="py-3 px-4">Facilitator</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.upcoming_workshops.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatDateTime(w.schedule?.scheduled_start)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{w.institution_name}</td>
                      <td className="py-3.5 px-4">
                        <span className="capitalize px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-[#005F60]">
                          {w.schedule?.mode || w.preferred_mode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{w.district}</td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {w.schedule?.assigned_facilitator || 'To be assigned'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/scheduled?open=${w.id}`)}
                          className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Open
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
    </AdminLayout>
  );
};

export default AdminOverviewPage;
