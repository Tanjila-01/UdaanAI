import React, { useState } from 'react';
import { submitWorkshopRequestApi } from '../../api/client';
import { X, CheckCircle2, AlertCircle, Building2, User, Sparkles, Send } from 'lucide-react';

const KARNATAKA_DISTRICTS = [
  'Bagalkot', 'Ballari', 'Belagavi', 'Bengaluru Rural', 'Bengaluru Urban',
  'Bidar', 'Chamarajanagar', 'Chikkaballapur', 'Chikkamagaluru', 'Chitradurga',
  'Dakshina Kannada', 'Davanagere', 'Dharwad', 'Gadag', 'Hassan',
  'Haveri', 'Kalaburagi', 'Kodagu', 'Kolar', 'Koppal',
  'Mandya', 'Mysuru', 'Raichur', 'Ramanagara', 'Shivamogga',
  'Tumakuru', 'Udupi', 'Uttara Kannada', 'Vijayanagara', 'Yadgir'
];

const INSTITUTION_TYPES = [
  { value: 'high_school', label: 'High School (SSLC / Class 8-10)' },
  { value: 'puc_college', label: 'Pre-University College (PUC 1st/2nd Year)' },
  { value: 'polytechnic', label: 'Polytechnic Diploma College' },
  { value: 'iti', label: 'Industrial Training Institute (ITI)' },
  { value: 'degree_college', label: 'Undergraduate Degree College' },
  { value: 'other', label: 'Other Educational Institution' },
];

const TOPIC_OPTIONS = [
  { id: 'career_guidance', label: 'Career Guidance & Stream Selection', desc: 'SSLC to PUC vs Diploma lateral pathways' },
  { id: 'ai_literacy', label: 'AI Literacy & Practical Tools', desc: 'Hands-on intro to everyday AI productivity' },
  { id: 'future_skills', label: 'Future Skills & Emerging Industry Trades', desc: 'Renewable energy, tech trades, logistics' },
  { id: 'polytechnic_vs_puc', label: 'Polytechnic vs PUC Deep Dive', desc: 'Technical hands-on diploma vs 2-yr PU course' },
];

export const WorkshopRequestModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    institution_name: '',
    institution_type: 'high_school',
    district: 'Bengaluru Urban',
    city: '',
    student_count: 100,
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    preferred_mode: 'offline',
    preferred_topics: ['career_guidance'],
    preferred_date: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTopicToggle = (topicId) => {
    setFormData((prev) => {
      const exists = prev.preferred_topics.includes(topicId);
      if (exists) {
        if (prev.preferred_topics.length === 1) return prev; // Keep at least one
        return { ...prev, preferred_topics: prev.preferred_topics.filter((t) => t !== topicId) };
      } else {
        return { ...prev, preferred_topics: [...prev.preferred_topics, topicId] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        ...formData,
        student_count: parseInt(formData.student_count, 10),
        preferred_date: formData.preferred_date || null,
        city: formData.city.trim() || null,
        message: formData.message.trim() || null,
      };
      await submitWorkshopRequestApi(payload);
      setSubmittedSuccess(true);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((d) => d.msg).join(', '));
      } else {
        setError(detail || err.message || 'Failed to submit workshop request. Please verify inputs.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmittedSuccess(false);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#005F60] flex items-center justify-center text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white leading-tight">Request an Institutional Workshop</h2>
              <p className="text-xs text-slate-400">For Karnataka schools, colleges, and polytechnics</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 max-h-[75vh] overflow-y-auto">
          {submittedSuccess ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-teal-50 text-[#005F60] border border-teal-200 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-950">Workshop request received</h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Our team will review your request and contact you using the details provided.
              </p>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="bg-[#005F60] hover:bg-[#004D4E] text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors shadow-sm"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start space-x-2 text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Section 1: Institution Details */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-xs font-extrabold uppercase tracking-wider text-[#005F60]">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>1. Institution Information</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Institution Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="institution_name"
                      required
                      placeholder="e.g. Government Pre-University College, Mysuru"
                      value={formData.institution_name}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#005F60]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Institution Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="institution_type"
                      value={formData.institution_type}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#005F60]"
                    >
                      {INSTITUTION_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Karnataka District <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#005F60]"
                    >
                      {KARNATAKA_DISTRICTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">City / Taluk / Town</label>
                    <input
                      type="text"
                      name="city"
                      placeholder="e.g. Hubballi, Hunsur, Nanjangud"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#005F60]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Expected Student Attendees <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="student_count"
                      min="1"
                      max="5000"
                      required
                      value={formData.student_count}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#005F60]"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Coordinator Contact */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center space-x-2 text-xs font-extrabold uppercase tracking-wider text-[#005F60]">
                  <User className="w-3.5 h-3.5" />
                  <span>2. Coordinator / Principal Contact</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Contact Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="contact_name"
                      required
                      placeholder="e.g. Prof. Anand Kumar"
                      value={formData.contact_name}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#005F60]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="contact_phone"
                      required
                      placeholder="e.g. 9876543210"
                      value={formData.contact_phone}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#005F60]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="contact_email"
                      required
                      placeholder="e.g. principal@school.edu.in"
                      value={formData.contact_email}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#005F60]"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Workshop Preferences */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center space-x-2 text-xs font-extrabold uppercase tracking-wider text-[#005F60]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>3. Session Format & Topics</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Preferred Mode <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="preferred_mode"
                      value={formData.preferred_mode}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#005F60]"
                    >
                      <option value="offline">In-Person Campus Session (Offline)</option>
                      <option value="online">Virtual Session (Zoom / Meet)</option>
                      <option value="hybrid">Hybrid Delivery</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tentative Target Date</label>
                    <input
                      type="date"
                      name="preferred_date"
                      value={formData.preferred_date}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#005F60]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Topics to Cover <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {TOPIC_OPTIONS.map((opt) => {
                      const isChecked = formData.preferred_topics.includes(opt.id);
                      return (
                        <div
                          key={opt.id}
                          onClick={() => handleTopicToggle(opt.id)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start space-x-2 ${
                            isChecked
                              ? 'bg-teal-50/70 border-[#005F60] text-slate-900 font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="mt-0.5 rounded text-[#005F60] focus:ring-[#005F60]"
                          />
                          <div>
                            <div className="text-xs">{opt.label}</div>
                            <div className="text-[10px] text-slate-500 font-normal">{opt.desc}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Special Requirements / Campus Notes (Optional)
                  </label>
                  <textarea
                    name="message"
                    rows="2"
                    placeholder="e.g. Auditorium capacity, projector available, preferred language (Kannada / English)"
                    value={formData.message}
                    onChange={handleChange}
                    maxLength={1000}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#005F60]"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#005F60] hover:bg-[#004D4E] text-white font-extrabold px-6 py-2.5 rounded-xl text-xs transition-all shadow-md flex items-center space-x-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{loading ? 'Submitting...' : 'Submit Workshop Request'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkshopRequestModal;
