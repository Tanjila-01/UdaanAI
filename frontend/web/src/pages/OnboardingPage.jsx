import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createProfileApi } from '../api/client';
import Navbar from '../components/Navbar';
import { BookOpen, MapPin, Building, GraduationCap, ArrowRight, AlertCircle } from 'lucide-react';

const KARNATAKA_DISTRICTS = [
  'Bagalkot', 'Ballari', 'Belagavi', 'Bengaluru Rural', 'Bengaluru Urban', 
  'Bidar', 'Chamarajanagar', 'Chikkamagaluru', 'Chikkaballapur', 'Chitradurga', 
  'Dakshina Kannada', 'Davanagere', 'Dharwad', 'Gadag', 'Hassan', 
  'Haveri', 'Kalaburagi', 'Kodagu', 'Kolar', 'Koppal', 
  'Mandya', 'Mysuru', 'Raichur', 'Ramanagara', 'Shivamogga', 
  'Tumakuru', 'Udupi', 'Uttara Kannada', 'Vijayanagara', 'Yadgir'
];

const BOARDS = [
  'Karnataka State Board (SSLC)',
  'Karnataka Pre-University Education (State PUC)',
  'CBSE (Central Board of Secondary Education)',
  'ICSE (Council for the Indian School Certificate Examinations)',
  'Other / Technical Board'
];

const LEVELS = [
  { level: 'Class 8', class_or_year: '8th Standard' },
  { level: 'Class 9', class_or_year: '9th Standard' },
  { level: 'Class 10', class_or_year: '10th Standard (SSLC)' },
  { level: 'Class 11', class_or_year: '1st Year PUC' },
  { level: 'Class 12', class_or_year: '2nd Year PUC' },
];

const OnboardingPage = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    current_level: 'Class 10',
    class_or_year: '10th Standard (SSLC)',
    board: 'Karnataka State Board (SSLC)',
    institution_name: '',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    preferred_language: 'English',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (profile && profile.is_complete) {
      navigate('/dashboard');
    } else if (profile) {
      setFormData({
        current_level: profile.current_level || 'Class 10',
        class_or_year: profile.class_or_year || '10th Standard (SSLC)',
        board: profile.board || 'Karnataka State Board (SSLC)',
        institution_name: profile.institution_name || '',
        district: profile.district || 'Bengaluru Urban',
        state: profile.state || 'Karnataka',
        preferred_language: profile.preferred_language || 'English',
      });
    }
  }, [profile, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLevelChange = (e) => {
    const selectedLevel = LEVELS.find((l) => l.level === e.target.value);
    setFormData({
      ...formData,
      current_level: selectedLevel.level,
      class_or_year: selectedLevel.class_or_year,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await createProfileApi({
        full_name: user?.full_name,
        current_level: formData.current_level,
        class_or_year: formData.class_or_year,
        board: formData.board,
        institution_name: formData.institution_name,
        district: formData.district,
        state: formData.state,
        preferred_language: formData.preferred_language,
      });
      await refreshProfile();
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to save student profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <Navbar />

      <main className="max-w-2xl w-full mx-auto px-4 py-12 flex-1 flex flex-col justify-center">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 text-xs font-semibold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Step 2 of 2: Academic Profile Setup</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">Welcome, {user?.full_name}!</h1>
            <p className="text-sm text-slate-400">
              Please complete your academic profile so Udaan AI can personalize career pathways and post-Class 10 guidance for you.
            </p>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-start space-x-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Current Class / Grade</label>
                <select
                  name="current_level"
                  value={formData.current_level}
                  onChange={handleLevelChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  {LEVELS.map((lvl) => (
                    <option key={lvl.level} value={lvl.level}>
                      {lvl.level} ({lvl.class_or_year})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Education Board</label>
                <select
                  name="board"
                  value={formData.board}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  {BOARDS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">School / College Name</label>
              <input
                type="text"
                name="institution_name"
                required
                value={formData.institution_name}
                onChange={handleChange}
                placeholder="e.g. Government High School, Malleshwaram"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">District (Karnataka)</label>
                <select
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  {KARNATAKA_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Preferred Language</label>
                <select
                  name="preferred_language"
                  value={formData.preferred_language}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="English">English</option>
                  <option value="Kannada">Kannada</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/30 text-sm flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? 'Saving Profile...' : 'Complete Profile & Launch Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-500">
        Udaan AI — Student Onboarding
      </footer>
    </div>
  );
};

export default OnboardingPage;
