import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateMyProfileApi } from '../api/client';
import { X, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

const KARNATAKA_DISTRICTS = [
  'Bagalkot', 'Ballari', 'Belagavi', 'Bengaluru Rural', 'Bengaluru Urban', 
  'Bidar', 'Chamarajanagar', 'Chikkamagaluru', 'Chikkaballapur', 'Chitradurga', 
  'Dakshina Kannada', 'Davanagere', 'Dharwad', 'Gadag', 'Hassan', 
  'Haveri', 'Kalaburagi', 'Kodagu', 'Kolar', 'Koppal', 
  'Mandya', 'Mysuru', 'Raichur', 'Ramanagara', 'Shivamogga', 
  'Tumakuru', 'Udupi', 'Uttara Kannada', 'Vijayanagara', 'Yadgir'
];

const EditProfileDrawer = ({ isOpen, onClose }) => {
  const { profile, refreshProfile } = useAuth();

  const [formData, setFormData] = useState({
    current_level: 'Class 10',
    class_or_year: '10th Standard',
    board: 'Karnataka State Board (SSLC)',
    stream: '',
    diploma_branch: '',
    iti_trade: '',
    institution_name: '',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    preferred_language: 'English',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        current_level: profile.current_level || 'Class 10',
        class_or_year: profile.class_or_year || '10th Standard',
        board: profile.board || 'Karnataka State Board (SSLC)',
        stream: profile.stream || '',
        diploma_branch: profile.diploma_branch || '',
        iti_trade: profile.iti_trade || '',
        institution_name: profile.institution_name || '',
        district: profile.district || 'Bengaluru Urban',
        state: profile.state || 'Karnataka',
        preferred_language: profile.preferred_language || 'English',
      });
    }
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const handleLevelChange = (newLevel) => {
    let boardDefault = formData.board;
    let classOrYear = formData.class_or_year;

    if (newLevel === 'Class 8' || newLevel === 'Class 9' || newLevel === 'Class 10') {
      boardDefault = 'Karnataka State Board (SSLC)';
      classOrYear = `${newLevel} Standard`;
    } else if (newLevel.startsWith('PUC')) {
      boardDefault = 'Karnataka Pre-University Education';
      classOrYear = newLevel === 'PUC 1' ? '1st Year PUC' : '2nd Year PUC';
    } else if (newLevel === 'Diploma') {
      boardDefault = 'Directorate of Technical Education (DTE Karnataka)';
      classOrYear = 'Diploma Polytechnic';
    } else if (newLevel === 'ITI') {
      boardDefault = 'Department of Employment and Training (DET Karnataka)';
      classOrYear = 'ITI Vocational';
    }

    setFormData({
      ...formData,
      current_level: newLevel,
      class_or_year: classOrYear,
      board: boardDefault,
      stream: newLevel.startsWith('PUC') ? (formData.stream || 'Science') : '',
      diploma_branch: newLevel === 'Diploma' ? (formData.diploma_branch || 'Computer Science & Engineering') : '',
      iti_trade: newLevel === 'ITI' ? (formData.iti_trade || 'Electrician') : '',
    });
  };

  const handleChange = (e) => {
    if (e.target.name === 'current_level') {
      handleLevelChange(e.target.value);
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      await updateMyProfileApi({
        current_level: formData.current_level,
        class_or_year: formData.class_or_year,
        board: formData.board,
        stream: formData.current_level.startsWith('PUC') ? (formData.stream || null) : null,
        diploma_branch: formData.current_level === 'Diploma' ? (formData.diploma_branch || null) : null,
        iti_trade: formData.current_level === 'ITI' ? (formData.iti_trade || null) : null,
        institution_name: formData.institution_name,
        district: formData.district,
        state: formData.state || 'Karnataka',
        preferred_language: formData.preferred_language,
      });
      await refreshProfile();
      setSuccessMsg('Profile updated & normalized successfully in database!');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1100);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to update student profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between border-l border-slate-200">
        
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-[#F8FAF8]">
          <div>
            <h2 className="text-lg font-black text-[#0F172A]">Edit Academic Profile</h2>
            <p className="text-xs text-slate-500">Update school, level, or district in database</p>
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

          <div>
            <label className="block font-bold text-[#0F172A] mb-1">Education Level</label>
            <select
              name="current_level"
              value={formData.current_level}
              onChange={handleChange}
              className="w-full bg-[#F8FAF8] border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#005F60]"
            >
              <option value="Class 8">Class 8</option>
              <option value="Class 9">Class 9</option>
              <option value="Class 10">Class 10</option>
              <option value="PUC 1">PUC 1</option>
              <option value="PUC 2">PUC 2</option>
              <option value="Diploma">Diploma</option>
              <option value="ITI">ITI</option>
            </select>
          </div>

          {formData.current_level.startsWith('PUC') && (
            <div>
              <label className="block font-bold text-[#0F172A] mb-1">PUC Academic Stream *</label>
              <select
                name="stream"
                value={formData.stream}
                onChange={handleChange}
                className="w-full bg-[#F8FAF8] border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#005F60]"
              >
                <option value="Science">Science</option>
                <option value="Commerce">Commerce</option>
                <option value="Arts">Arts / Humanities</option>
              </select>
            </div>
          )}

          {formData.current_level === 'Diploma' && (
            <div>
              <label className="block font-bold text-[#0F172A] mb-1">Diploma Branch *</label>
              <input
                type="text"
                name="diploma_branch"
                value={formData.diploma_branch}
                onChange={handleChange}
                placeholder="e.g. Computer Science & Engineering"
                className="w-full bg-[#F8FAF8] border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#005F60]"
              />
            </div>
          )}

          {formData.current_level === 'ITI' && (
            <div>
              <label className="block font-bold text-[#0F172A] mb-1">ITI Trade *</label>
              <input
                type="text"
                name="iti_trade"
                value={formData.iti_trade}
                onChange={handleChange}
                placeholder="e.g. Electrician / Fitter"
                className="w-full bg-[#F8FAF8] border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#005F60]"
              />
            </div>
          )}

          <div>
            <label className="block font-bold text-[#0F172A] mb-1">Board / Curriculum</label>
            <input
              type="text"
              name="board"
              required
              value={formData.board}
              onChange={handleChange}
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
            <label className="block font-bold text-[#0F172A] mb-1">Preferred Language</label>
            <select
              name="preferred_language"
              value={formData.preferred_language}
              onChange={handleChange}
              className="w-full bg-[#F8FAF8] border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#005F60]"
            >
              <option value="English">English</option>
              <option value="Kannada">Kannada</option>
            </select>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#005F60] hover:bg-teal-800 text-white font-extrabold py-3 rounded-xl transition-all shadow-md text-xs flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving to Database...' : 'Save Updated Profile'}</span>
            </button>
          </div>
        </form>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 bg-[#F8FAF8] text-center text-[11px] text-slate-500">
          Udaan AI — Student Profile Persistence
        </div>

      </div>
    </div>
  );
};

export default EditProfileDrawer;
