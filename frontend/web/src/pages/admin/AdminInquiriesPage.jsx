import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { getAdminInquiriesApi, updateAdminInquiryStatusApi } from '../../api/client';
import { normalizeApiError } from '../../utils/errorHandler';
import {
  Search,
  Mail,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  CheckCheck,
  User,
  Calendar,
  Filter,
} from 'lucide-react';

export const AdminInquiriesPage = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchInquiries = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminInquiriesApi(statusFilter === 'ALL' ? null : statusFilter);
      setInquiries(Array.isArray(data) ? data : []);
    } catch (err) {
      const normalized = normalizeApiError(err);
      setError(normalized.message || 'Unable to load contact inquiries. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [statusFilter]);

  const handleStatusChange = async (inquiryId, newStatus) => {
    setUpdatingId(inquiryId);
    try {
      const updated = await updateAdminInquiryStatusApi(inquiryId, newStatus);
      setInquiries((prev) =>
        prev.map((item) => (item.id === inquiryId ? { ...item, status: updated.status } : item))
      );
    } catch (err) {
      const normalized = normalizeApiError(err);
      alert(normalized.message || 'Failed to update inquiry status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Metrics computation
  const metrics = useMemo(() => {
    const total = inquiries.length;
    const newCount = inquiries.filter((i) => i.status === 'NEW').length;
    const contactedCount = inquiries.filter((i) => i.status === 'CONTACTED').length;
    const resolvedCount = inquiries.filter((i) => i.status === 'RESOLVED').length;
    return { total, newCount, contactedCount, resolvedCount };
  }, [inquiries]);

  // Filter inquiries by search query
  const filteredInquiries = useMemo(() => {
    if (!searchQuery.trim()) return inquiries;
    const q = searchQuery.toLowerCase();
    return inquiries.filter(
      (item) =>
        item.name?.toLowerCase().includes(q) ||
        item.email?.toLowerCase().includes(q) ||
        item.subject?.toLowerCase().includes(q) ||
        item.message?.toLowerCase().includes(q)
    );
  }, [inquiries, searchQuery]);

  const formatDate = (isoString) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Kolkata',
      }).format(date);
    } catch {
      return isoString;
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                Contact Inquiries
              </h1>
              <span className="bg-teal-50 text-[#005F60] border border-teal-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
                Live Submissions
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Review and reply to general inquiries sent from the public website contact form.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchInquiries}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-2xs self-start sm:self-auto cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#005F60]' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Metrics Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Received</div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{metrics.total}</div>
          </div>
          <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200/80 shadow-2xs">
            <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">New / Unhandled</div>
            <div className="text-2xl sm:text-3xl font-black text-amber-900 mt-1">{metrics.newCount}</div>
          </div>
          <div className="bg-sky-50/70 p-5 rounded-2xl border border-sky-200/80 shadow-2xs">
            <div className="text-xs font-bold text-sky-800 uppercase tracking-wider">Contacted</div>
            <div className="text-2xl sm:text-3xl font-black text-sky-900 mt-1">{metrics.contactedCount}</div>
          </div>
          <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200/80 shadow-2xs">
            <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Resolved</div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-900 mt-1">{metrics.resolvedCount}</div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#005F60]"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            {['ALL', 'NEW', 'CONTACTED', 'RESOLVED'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === tab
                    ? 'bg-white text-[#005F60] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {tab === 'ALL' ? 'All Inquiries' : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Inquiries Content Area */}
        {loading && inquiries.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <RefreshCw className="w-8 h-8 text-[#005F60] animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">Loading inquiries from database...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-rose-50 rounded-2xl border border-rose-200">
            <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-rose-900">{error}</p>
            <button
              type="button"
              onClick={fetchInquiries}
              className="mt-4 bg-rose-600 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-rose-700"
            >
              Try Again
            </button>
          </div>
        ) : filteredInquiries.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No Inquiries Found</h3>
            <p className="text-xs text-slate-500 mt-1">
              {searchQuery ? 'No results matched your search query.' : 'There are currently no inquiries in this category.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInquiries.map((inquiry) => {
              const mailtoUrl = `mailto:${inquiry.email}?subject=${encodeURIComponent(
                `Re: ${inquiry.subject} (Udaan AI)`
              )}&body=${encodeURIComponent(
                `Hi ${inquiry.name},\n\nThank you for reaching out to Udaan AI regarding: "${inquiry.subject}".\n\n\n---\nOriginal Message:\n"${inquiry.message}"\n\nBest regards,\nUdaan AI Team\nconnect.udaanai@gmail.com`
              )}`;

              const isNew = inquiry.status === 'NEW';
              const isContacted = inquiry.status === 'CONTACTED';
              const isResolved = inquiry.status === 'RESOLVED';

              return (
                <div
                  key={inquiry.id}
                  className={`bg-white rounded-2xl border transition-all p-5 sm:p-6 shadow-2xs ${
                    isNew ? 'border-amber-300 ring-1 ring-amber-200/70' : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                            isNew
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : isContacted
                              ? 'bg-sky-50 text-sky-800 border-sky-300'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          {inquiry.status}
                        </span>

                        <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(inquiry.created_at)}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-extrabold text-slate-950 tracking-tight pt-1">
                        {inquiry.subject}
                      </h3>
                    </div>

                    {/* Sender Info Pill */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 sm:text-right shrink-0">
                      <div className="text-xs font-bold text-slate-900 flex sm:justify-end items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#005F60]" />
                        <span>{inquiry.name}</span>
                      </div>
                      <a
                        href={`mailto:${inquiry.email}`}
                        className="text-[11px] font-semibold text-[#005F60] hover:underline flex sm:justify-end items-center gap-1 mt-0.5"
                      >
                        <Mail className="w-3 h-3" />
                        <span>{inquiry.email}</span>
                      </a>
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 my-3 text-xs sm:text-sm text-slate-800 leading-relaxed font-normal whitespace-pre-wrap">
                    {inquiry.message}
                  </div>

                  {/* Actions Row */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    {/* Reply Action */}
                    <a
                      href={mailtoUrl}
                      className="inline-flex items-center gap-2 bg-[#005F60] hover:bg-[#004D4E] text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors shadow-2xs"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Reply via connect.udaanai@gmail.com</span>
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </a>

                    {/* Status Toggle Actions */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">Update Status:</span>

                      {inquiry.status !== 'CONTACTED' && (
                        <button
                          type="button"
                          disabled={updatingId === inquiry.id}
                          onClick={() => handleStatusChange(inquiry.id, 'CONTACTED')}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg border border-sky-300 text-sky-800 hover:bg-sky-50 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Mark Contacted
                        </button>
                      )}

                      {inquiry.status !== 'RESOLVED' && (
                        <button
                          type="button"
                          disabled={updatingId === inquiry.id}
                          onClick={() => handleStatusChange(inquiry.id, 'RESOLVED')}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-800 hover:bg-emerald-50 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Mark Resolved</span>
                        </button>
                      )}

                      {inquiry.status === 'RESOLVED' && (
                        <button
                          type="button"
                          disabled={updatingId === inquiry.id}
                          onClick={() => handleStatusChange(inquiry.id, 'NEW')}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Reopen
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminInquiriesPage;
