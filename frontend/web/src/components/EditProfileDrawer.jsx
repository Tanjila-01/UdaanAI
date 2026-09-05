import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateMyProfileApi, updateMyAcademicStageApi } from '../api/client';
import { X, Save, AlertCircle, CheckCircle2, GraduationCap, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';

const KARNATAKA_DISTRICTS = [
  'Bagalkot', 'Ballari', 'Belagavi', 'Bengaluru Rural', 'Bengaluru Urban', 
  'Bidar', 'Chamarajanagar', 'Chikkamagaluru', 'Chikkaballapur', 'Chitradurga', 
  'Dakshina Kannada', 'Davanagere', 'Dharwad', 'Gadag', 'Hassan', 
  'Haveri', 'Kalaburagi', 'Kodagu', 'Kolar', 'Koppal', 
  'Mandya', 'Mysuru', 'Raichur', 'Ramanagara', 'Shivamogga', 
  'Tumakuru', 'Udupi', 'Uttara Kannada', 'Vijayanagara', 'Yadgir'
];

const DIPLOMA_BRANCHES = [
  'Computer Science & Engineering',
  'Electronics & Communication Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical & Electronics Engineering',
  'Information Science & Technology',
  'Automobile Engineering',
  'Mechatronics Engineering',
  'Other Diploma Branch'
];

const ITI_TRADES = [
  'Electrician',
  'Fitter',
  'COPA (Computer Operator & Programming Assistant)',
  'Electronic Mechanic',
  'Mechanic Motor Vehicle (MMV)',
  'Welder',
  'Turner / Machinist',
  'Solar Technician',
  'Other ITI Trade'
];

const EditProfileDrawer = ({ isOpen, onClose }) => {
  const { profile, refreshProfile } = useAuth();

  // General profile form fields (safe for standard update)
  const [formData, setFormData] = useState({
    full_name: '',
    institution_name: '',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    preferred_language: 'English',
  });

  // Modal state for deliberate Academic Stage update
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [stageFormData, setStageFormData] = useState({
    current_level: 'Class 10',
    class_or_year: '10th Standard',
    board: 'Karnataka State Board (SSLC)',
    stream: 'Science',
    diploma_branch: 'Computer Science & Engineering',
    iti_trade: 'Electrician',
  });

  const [loading, setLoading] = useState(false);
  const [stageLoading, setStageLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stageError, setStageError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [stageSuccessMsg, setStageSuccessMsg] = useState(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        institution_name: profile.institution_name || '',
        district: profile.district || 'Bengaluru Urban',
        state: profile.state || 'Karnataka',
        preferred_language: profile.preferred_language || 'English',
      });

      setStageFormData({
        current_level: profile.current_level || 'Class 10',
        class_or_year: profile.class_or_year || '10th Standard',
        board: profile.board || 'Karnataka State Board (SSLC)',
        stream: profile.stream || 'Science',
        diploma_branch: profile.diploma_branch || 'Computer Science & Engineering',
        iti_trade: profile.iti_trade || 'Electrician',
      });
    }
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleStageLevelChange = (newLevel) => {
    let boardDefault = stageFormData.board;
    let classOrYear = stageFormData.class_or_year;

    if (newLevel === 'Class 8' || newLevel === 'Class 9' || newLevel === 'Class 10') {
      boardDefault = 'Karnataka State Board (SSLC)';
      classOrYear = `${newLevel.split(' ')[1]}th Standard`;
    } else if (newLevel.startsWith('PUC')) {
      boardDefault = 'Karnataka Pre-University Education';
      classOrYear = newLevel === 'PUC 1' ? '1st Year PUC' : '2nd Year PUC';
    } else if (newLevel === 'Diploma') {
      boardDefault = 'Directorate of Technical Education (DTE Karnataka)';
      classOrYear = '1st Year Diploma';
    } else if (newLevel === 'ITI') {
      boardDefault = 'Department of Employment and Training (DET Karnataka)';
      classOrYear = '1st Year ITI';
    }

    setStageFormData({
      ...stageFormData,
      current_level: newLevel,
      class_or_year: classOrYear,
      board: boardDefault,
    });
  };

  // 1. Standard profile submit: rejects academic fields by only sending safe metadata
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      await updateMyProfileApi({
        full_name: formData.full_name,
        institution_name: formData.institution_name,
        district: formData.district,
        state: formData.state || 'Karnataka',
        preferred_language: formData.preferred_language,
      });
      await refreshProfile();
      setSuccessMsg('Profile details updated successfully!');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to update student profile');
    } finally {
      setLoading(false);
    }
  };

  // 2. Deliberate academic stage update
  const handleStageSubmit = async (e) => {
    e.preventDefault();
    setStageError(null);
    setStageSuccessMsg(null);
    setStageLoading(true);

    try {
      const payload = {
        current_level: stageFormData.current_level,
        class_or_year: stageFormData.class_or_year,
        board: stageFormData.board,
        stream: stageFormData.current_level.startsWith('PUC') ? stageFormData.stream : null,
        diploma_branch: stageFormData.current_level === 'Diploma' ? stageFormData.diploma_branch : null,
        iti_trade: stageFormData.current_level === 'ITI' ? stageFormData.iti_trade : null,
      };

      await updateMyAcademicStageApi(payload);
      await refreshProfile();
      setStageSuccessMsg('Academic stage updated! New level assessment is now assigned.');
      setTimeout(() => {
        setStageSuccessMsg(null);
        setIsStageModalOpen(false);
      }, 1300);
    } catch (err) {
      setStageError(err.response?.data?.detail || err.message || 'Failed to update academic stage');
    } finally {
      setStageLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between border-l border-slate-200">
        
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-[#F8FAF8]">
          <div>
            <h2 className="text-lg font-black text-[#0F172A]">Student Profile</h2>
            <p className="text-xs text-slate-500">Edit general details or manage education stage</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start space-x-2 text-rose-800 font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center space-x-2 text-emerald-800 font-extrabold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Academic Status Card (Read-only + Dedicated Update Action) */}
          <div className="bg-gradient-to-br from-emerald-50/60 to-teal-50/40 border border-emerald-200/70 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-[#005F60] text-white flex items-center justify-center">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Academic Status</span>
                  <span className="font-extrabold text-sm text-[#0F172A]">
                    {profile?.current_level || 'Class 10'}
                    {profile?.stream ? ` • ${profile.stream}` : ''}
                    {profile?.diploma_branch ? ` • ${profile.diploma_branch}` : ''}
                    {profile?.iti_trade ? ` • ${profile.iti_trade}` : ''}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-600 space-y-1 mb-3 pt-1 border-t border-emerald-200/50">
              <div className="flex justify-between">
                <span className="text-slate-500">Board:</span>
                <span className="font-semibold text-slate-700">{profile?.board || 'Karnataka State Board (SSLC)'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Year / Class:</span>
                <span className="font-semibold text-slate-700">{profile?.class_or_year || '10th Standard'}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsStageModalOpen(true)}
              className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-white border border-emerald-300 text-emerald-800 font-bold text-xs hover:bg-emerald-100/50 transition-colors shadow-2xs cursor-pointer"
            >
              <span>Update Education Stage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <label className="block font-bold text-[#0F172A] mb-1">Full Name</label>
            <input
              type="text"
              name="full_name"
              required
              value={formData.full_name}
              onChange={handleChange}
              placeholder="e.g. Student Name"
              className="w-full bg-[#F8FAF8] border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#005F60]"
            />
          </div>

          <div>
            <label className="block font-bold text-[#0F172A] mb-1">School / College Name</label>
            <input
              type="text"
              name="institution_name"
              required
              value={formData.institution_name}
              onChange={handleChange}
              placeholder="e.g. Government PU College / High School"
              className="w-full bg-[#F8FAF8] border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#005F60]"
            />
          </div>

          <div>
            <label className="block font-bold text-[#0F172A] mb-1">District (Karnataka)</label>
            <select
              name="district"
              value={formData.district}
              onChange={handleChange}
              className="w-full bg-[#F8FAF8] border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#005F60]"
            >
              {KARNATAKA_DISTRICTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-[#0F172A] mb-1">State</label>
            <input
              type="text"
              name="state"
              disabled
              value={formData.state}
              className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block font-bold text-[#0F172A] mb-1">Preferred Language</label>
            <select
              name="preferred_language"
              value={formData.preferred_language}
              onChange={handleChange}
              className="w-full bg-[#F8FAF8] border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#005F60]"
            >
              <option value="English">English</option>
              <option value="Kannada">Kannada</option>
              <option value="Hindi">Hindi</option>
            </select>
          </div>
        </form>

        {/* Drawer Footer */}
        <div className="p-6 border-t border-slate-200 bg-[#F8FAF8] flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-200 transition-colors cursor-pointer text-xs"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-[#005F60] text-white font-extrabold hover:bg-[#004D40] transition-colors flex items-center space-x-2 shadow-sm cursor-pointer text-xs disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving...' : 'Save Profile'}</span>
          </button>
        </div>

      </div>

      {/* Deliberate Academic Stage Update Confirmation Dialog */}
      {isStageModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
            
            <div className="p-6 border-b border-slate-100 bg-[#F8FAF8] flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#005F60] text-white flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#0F172A]">Update Education Stage</h3>
                  <p className="text-xs text-slate-500">Transitions your academic decision stage safely</p>
                </div>
              </div>
              <button
                onClick={() => setIsStageModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStageSubmit} className="p-6 space-y-4 text-xs">
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3.5 flex items-start space-x-2.5 text-amber-900">
                <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <span className="font-bold block">Academic Safety Policy</span>
                  Updating your education stage assigns the appropriate career discovery assessment for your level. 
                  Your historical assessments, recommendations, and active goals will remain safe in your profile.
                </div>
              </div>

              {stageError && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start space-x-2 text-rose-800 font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
                  <span>{stageError}</span>
                </div>
              )}

              {stageSuccessMsg && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center space-x-2 text-emerald-800 font-extrabold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{stageSuccessMsg}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-[#0F172A] mb-1">New Education Level *</label>
                <select
                  value={stageFormData.current_level}
                  onChange={(e) => handleStageLevelChange(e.target.value)}
                  className="w-full bg-[#F8FAF8] border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#005F60]"
                >
                  <option value="Class 8">Class 8 (Middle School)</option>
                  <option value="Class 9">Class 9 (High School)</option>
                  <option value="Class 10">Class 10 (SSLC)</option>
                  <option value="PUC 1">PUC 1 (1st Year Pre-University)</option>
                  <option value="PUC 2">PUC 2 (2nd Year Pre-University)</option>
                  <option value="Diploma">Polytechnic Diploma</option>
                  <option value="ITI">ITI Vocational Trades</option>
                </select>
              </div>

              {stageFormData.current_level.startsWith('PUC') && (
                <div>
                  <label className="block font-bold text-[#0F172A] mb-1">PUC Academic Stream *</label>
                  <select
                    value={stageFormData.stream}
                    onChange={(e) => setStageFormData({ ...stageFormData, stream: e.target.value })}
                    className="w-full bg-[#F8FAF8] border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#005F60]"
                  >
                    <option value="Science">Science (PCMB / PCMC / PCME)</option>
                    <option value="Commerce">Commerce (CEBA / SEBA)</option>
                    <option value="Arts">Arts / Humanities (HEPS / EGAS)</option>
                  </select>
                </div>
              )}

              {stageFormData.current_level === 'Diploma' && (
                <div>
                  <label className="block font-bold text-[#0F172A] mb-1">Diploma Branch *</label>
                  <select
                    value={stageFormData.diploma_branch}
                    onChange={(e) => setStageFormData({ ...stageFormData, diploma_branch: e.target.value })}
                    className="w-full bg-[#F8FAF8] border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#005F60]"
                  >
                    {DIPLOMA_BRANCHES.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              )}

              {stageFormData.current_level === 'ITI' && (
                <div>
                  <label className="block font-bold text-[#0F172A] mb-1">ITI Trade *</label>
                  <select
                    value={stageFormData.iti_trade}
                    onChange={(e) => setStageFormData({ ...stageFormData, iti_trade: e.target.value })}
                    className="w-full bg-[#F8FAF8] border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#005F60]"
                  >
                    {ITI_TRADES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-[#0F172A] mb-1">Board / Department Authority</label>
                <input
                  type="text"
                  value={stageFormData.board}
                  onChange={(e) => setStageFormData({ ...stageFormData, board: e.target.value })}
                  className="w-full bg-[#F8FAF8] border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#005F60]"
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStageModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={stageLoading}
                  className="px-5 py-2 rounded-xl bg-[#005F60] text-white font-extrabold hover:bg-[#004D40] transition-colors flex items-center space-x-2 shadow-sm cursor-pointer text-xs disabled:opacity-50"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>{stageLoading ? 'Updating Stage...' : 'Confirm Stage Change'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default EditProfileDrawer;
