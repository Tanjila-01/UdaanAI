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
    class_or_year: '10th Standard (SSLC)',
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
        stream: formData.stream || null,
        diploma_branch: formData.diploma_branch || null,
        iti_trade: formData.iti_trade || null,
        institution_name: formData.institution_name,
        district: formData.district,
        state: formData.state || 'Karnataka',
        preferred_language: formData.preferred_language,
      });
      await refreshProfile();
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between border-l border-slate-200">
        
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Edit Academic Profile</h2>
            <p className="text-xs text-slate-500">Update your school, level, or district</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start space-x-2 text-rose-800">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center space-x-2 text-emerald-800 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">Education Level</label>
            <select
              name="current_level"
              value={formData.current_level}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-700"
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
              <label className="block font-bold text-slate-700 mb-1">PUC Stream</label>
              <select
                name="stream"
                value={formData.stream}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-700"
              >
                <option value="Science">Science</option>
                <option value="Commerce">Commerce</option>
                <option value="Arts">Arts / Humanities</option>
              </select>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">Board / Curriculum</label>
            <input
              type="text"
              name="board"
              required
              value={formData.board}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-700"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">School / College Name</label>
            <input
              type="text"
              name="institution_name"
              required
              value={formData.institution_name}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-700"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">District (Karnataka)</label>
            <select
              name="district"
              value={formData.district}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-700"
            >
              {KARNATAKA_DISTRICTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Preferred Language</label>
            <select
              name="preferred_language"
              value={formData.preferred_language}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-700"
            >
              <option value="English">English</option>
              <option value="Kannada">Kannada</option>
            </select>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-800 hover:bg-teal-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-md text-xs flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving Changes...' : 'Save Updated Profile'}</span>
            </button>
          </div>
        </form>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-center text-[11px] text-slate-500">
          Udaan AI — Student Profile Management
        </div>

      </div>
    </div>
  );
};

export default EditProfileDrawer;
