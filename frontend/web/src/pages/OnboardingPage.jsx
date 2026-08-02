import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createProfileApi } from '../api/client';
import Navbar from '../components/Navbar';
import { 
  GraduationCap, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  AlertCircle, 
  BookOpen, 
  Building2, 
  MapPin, 
  Sparkles,
  Layers,
  Wrench,
  Compass
} from 'lucide-react';

const KARNATAKA_DISTRICTS = [
  'Bagalkot', 'Ballari', 'Belagavi', 'Bengaluru Rural', 'Bengaluru Urban', 
  'Bidar', 'Chamarajanagar', 'Chikkamagaluru', 'Chikkaballapur', 'Chitradurga', 
  'Dakshina Kannada', 'Davanagere', 'Dharwad', 'Gadag', 'Hassan', 
  'Haveri', 'Kalaburagi', 'Kodagu', 'Kolar', 'Koppal', 
  'Mandya', 'Mysuru', 'Raichur', 'Ramanagara', 'Shivamogga', 
  'Tumakuru', 'Udupi', 'Uttara Kannada', 'Vijayanagara', 'Yadgir'
];

const EDUCATION_LEVELS = [
  { id: 'Class 8', label: 'Class 8', category: 'School', description: 'Karnataka State Board / SSLC 8th Standard' },
  { id: 'Class 9', label: 'Class 9', category: 'School', description: 'Karnataka State Board / SSLC 9th Standard' },
  { id: 'Class 10', label: 'Class 10', category: 'School', description: 'Karnataka SSLC Board Exam Year' },
  { id: 'PUC 1', label: 'PUC 1', category: 'Pre-University', description: '1st Year Pre-University College (11th)' },
  { id: 'PUC 2', label: 'PUC 2', category: 'Pre-University', description: '2nd Year Pre-University College (12th)' },
  { id: 'Diploma', label: 'Diploma', category: 'Polytechnic', description: 'Polytechnic Engineering & Technical Diploma' },
  { id: 'ITI', label: 'ITI', category: 'Vocational', description: 'Industrial Training Institute Vocational Trade' }
];

const PUC_STREAMS = [
  { id: 'Science', label: 'Science', desc: 'PCMB, PCMC, PCME, PCBH' },
  { id: 'Commerce', label: 'Commerce', desc: 'CEBA, SEBA, HEBA, BSBA' },
  { id: 'Arts', label: 'Arts / Humanities', desc: 'HEPS, HEGE, EGAS' }
];

const DIPLOMA_BRANCHES = [
  'Computer Science & Engineering',
  'Civil Engineering',
  'Mechanical Engineering',
  'Electrical & Electronics Engineering',
  'Electronics & Communication',
  'Information Technology',
  'Mechatronics',
  'Other Diploma Branch'
];

const ITI_TRADES = [
  'Electrician',
  'Fitter',
  'Mechanic Motor Vehicle',
  'Electronic Mechanic',
  'Turner / Machinist',
  'Welder',
  'COPA (Computer Operator)',
  'Other ITI Trade'
];

const OnboardingPage = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
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

  useEffect(() => {
    if (profile && profile.is_complete) {
      navigate('/dashboard');
    } else if (profile) {
      setFormData({
        current_level: profile.current_level || 'Class 10',
        class_or_year: profile.class_or_year || '10th Standard (SSLC)',
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
  }, [profile, navigate]);

  const handleLevelSelect = (levelId) => {
    let boardDefault = 'Karnataka State Board (SSLC)';
    let classOrYear = `${levelId} Standard`;
    if (levelId.startsWith('PUC')) {
      boardDefault = 'Karnataka Pre-University Education (State PUC)';
      classOrYear = levelId === 'PUC 1' ? '1st Year PUC' : '2nd Year PUC';
    } else if (levelId === 'Diploma') {
      boardDefault = 'Directorate of Technical Education (DTE Karnataka)';
      classOrYear = 'Diploma Polytechnic';
    } else if (levelId === 'ITI') {
      boardDefault = 'Department of Employment and Training (DET Karnataka)';
      classOrYear = 'ITI Vocational';
    }

    setFormData({
      ...formData,
      current_level: levelId,
      class_or_year: classOrYear,
      board: boardDefault,
      stream: levelId.startswith?.('PUC') ? (formData.stream || 'Science') : '',
      diploma_branch: levelId === 'Diploma' ? (formData.diploma_branch || 'Computer Science & Engineering') : '',
      iti_trade: levelId === 'ITI' ? (formData.iti_trade || 'Electrician') : '',
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateStep1 = () => {
    if (!formData.current_level) {
      setError('Please select your current education level');
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep2 = () => {
    if (!formData.institution_name.trim()) {
      setError('Please enter your school or college name');
      return false;
    }
    if (!formData.district) {
      setError('Please select your district in Karnataka');
      return false;
    }
    if (formData.current_level.startsWith('PUC') && !formData.stream) {
      setError('Please select your PUC stream (Science, Commerce, or Arts)');
      return false;
    }
    setError(null);
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handlePrev = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(1, prev - 1));
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
        stream: formData.stream || null,
        diploma_branch: formData.diploma_branch || null,
        iti_trade: formData.iti_trade || null,
        institution_name: formData.institution_name,
        district: formData.district,
        state: formData.state || 'Karnataka',
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-teal-700 selection:text-white font-sans">
      <Navbar />

      <main className="max-w-4xl w-full mx-auto px-4 py-8 flex-1">
        {/* Header Title Section */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center space-x-2 text-xs font-bold px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
            <Compass className="w-3.5 h-3.5 text-teal-700" />
            <span>Student Career Onboarding</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Welcome to Udaan AI, <span className="text-teal-800">{user?.full_name || 'Student'}</span>!
          </h1>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            Let's personalize your career exploration journey, roadmaps, and Karnataka education pathway options.
          </p>
        </div>

        {/* Step Progress Bar */}
        <div className="mb-10 max-w-2xl mx-auto">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0"></div>
            <div 
              className="absolute top-1/2 left-0 h-0.5 bg-teal-700 -translate-y-1/2 transition-all duration-300 z-0"
              style={{ width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%' }}
            ></div>

            <div className="relative z-10 flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                currentStep >= 1 ? 'bg-teal-800 text-white shadow-md' : 'bg-slate-200 text-slate-600'
              }`}>
                1
              </div>
              <span className={`text-xs mt-2 font-medium ${currentStep === 1 ? 'text-teal-800 font-bold' : 'text-slate-500'}`}>
                Education Level
              </span>
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                currentStep >= 2 ? 'bg-teal-800 text-white shadow-md' : 'bg-slate-200 text-slate-600'
              }`}>
                2
              </div>
              <span className={`text-xs mt-2 font-medium ${currentStep === 2 ? 'text-teal-800 font-bold' : 'text-slate-500'}`}>
                School & District
              </span>
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                currentStep >= 3 ? 'bg-teal-800 text-white shadow-md' : 'bg-slate-200 text-slate-600'
              }`}>
                3
              </div>
              <span className={`text-xs mt-2 font-medium ${currentStep === 3 ? 'text-teal-800 font-bold' : 'text-slate-500'}`}>
                Profile Review
              </span>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6 bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start space-x-2.5 text-rose-800 text-xs shadow-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Step Content Container */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-sm max-w-3xl mx-auto space-y-8">
          
          {/* STEP 1: EDUCATION LEVEL SELECTOR */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                  <GraduationCap className="w-5 h-5 text-teal-700" />
                  <span>Select Your Current Education Level</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Choose the class or technical route you are currently enrolled in within Karnataka.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {EDUCATION_LEVELS.map((level) => {
                  const isSelected = formData.current_level === level.id;
                  return (
                    <button
                      key={level.id}
                      type="button"
                      onClick={() => handleLevelSelect(level.id)}
                      className={`text-left p-4 rounded-xl border transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-teal-50/70 border-teal-700 ring-2 ring-teal-700/20 text-teal-950 shadow-sm'
                          : 'bg-slate-50/60 border-slate-200 hover:border-teal-300 text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          isSelected ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {level.category}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-teal-700" />}
                      </div>
                      <h3 className="font-extrabold text-base text-slate-900">{level.label}</h3>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">{level.description}</p>
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={handleNext}
                  className="bg-teal-800 hover:bg-teal-700 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-md shadow-teal-800/20 text-sm flex items-center space-x-2"
                >
                  <span>Continue to Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: EDUCATION DETAILS & CONDITIONAL INPUTS */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-teal-700" />
                  <span>Academic Details for {formData.current_level}</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Tell us about your institution, board, and location in Karnataka.
                </p>
              </div>

              <div className="space-y-4">
                {/* Conditional PUC Stream Selector */}
                {formData.current_level.startsWith('PUC') && (
                  <div className="p-4 bg-orange-50/60 border border-orange-200 rounded-xl space-y-3">
                    <label className="block text-xs font-bold text-orange-950">
                      Select Your PUC Stream *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {PUC_STREAMS.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, stream: s.id })}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            formData.stream === s.id
                              ? 'bg-orange-600 text-white border-orange-600 shadow-sm font-bold'
                              : 'bg-white text-slate-800 border-orange-200 hover:border-orange-400 text-xs'
                          }`}
                        >
                          <div className="font-bold text-sm">{s.label}</div>
                          <div className={`text-[10px] mt-0.5 ${formData.stream === s.id ? 'text-orange-100' : 'text-slate-500'}`}>
                            {s.desc}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conditional Diploma Branch Selector */}
                {formData.current_level === 'Diploma' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Diploma Branch *</label>
                    <select
                      name="diploma_branch"
                      value={formData.diploma_branch}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-teal-700"
                    >
                      {DIPLOMA_BRANCHES.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Conditional ITI Trade Selector */}
                {formData.current_level === 'ITI' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ITI Trade *</label>
                    <select
                      name="iti_trade"
                      value={formData.iti_trade}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-teal-700"
                    >
                      {ITI_TRADES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Board / Curriculum */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Education Board / Authority</label>
                  <input
                    type="text"
                    name="board"
                    required
                    value={formData.board}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-teal-700"
                  />
                </div>

                {/* School / College Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">School / College / Institution Name *</label>
                  <input
                    type="text"
                    name="institution_name"
                    required
                    value={formData.institution_name}
                    onChange={handleChange}
                    placeholder="e.g. Government High School, Malleshwaram"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-teal-700"
                  />
                </div>

                {/* District & Preferred Language */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">District (Karnataka) *</label>
                    <select
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-teal-700"
                    >
                      {KARNATAKA_DISTRICTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Language</label>
                    <select
                      name="preferred_language"
                      value={formData.preferred_language}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-teal-700"
                    >
                      <option value="English">English</option>
                      <option value="Kannada">Kannada</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-xl flex items-center space-x-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="bg-teal-800 hover:bg-teal-700 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-md shadow-teal-800/20 text-sm flex items-center space-x-2"
                >
                  <span>Review Profile</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PROFILE REVIEW & SUBMIT */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-teal-700" />
                  <span>Review Your Profile Before Saving</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Ensure your details are accurate to enable tailored career path suggestions.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 divide-y divide-slate-200 text-xs">
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Student Name:</span>
                  <span className="font-bold text-slate-900">{user?.full_name}</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Education Level:</span>
                  <span className="font-bold text-teal-900 bg-teal-100/70 px-2 py-0.5 rounded">{formData.current_level} ({formData.class_or_year})</span>
                </div>
                {formData.stream && (
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-slate-500 font-medium">PUC Stream:</span>
                    <span className="font-bold text-orange-800 bg-orange-100 px-2 py-0.5 rounded">{formData.stream}</span>
                  </div>
                )}
                {formData.diploma_branch && (
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Diploma Branch:</span>
                    <span className="font-bold text-slate-900">{formData.diploma_branch}</span>
                  </div>
                )}
                {formData.iti_trade && (
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-slate-500 font-medium">ITI Trade:</span>
                    <span className="font-bold text-slate-900">{formData.iti_trade}</span>
                  </div>
                )}
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Education Board:</span>
                  <span className="font-bold text-slate-900">{formData.board}</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Institution Name:</span>
                  <span className="font-bold text-slate-900">{formData.institution_name}</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">District & State:</span>
                  <span className="font-bold text-slate-900">{formData.district}, {formData.state}</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Preferred Language:</span>
                  <span className="font-bold text-slate-900">{formData.preferred_language}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={loading}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-xl flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Edit Details</span>
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-orange-600 hover:bg-orange-500 text-white font-extrabold px-8 py-3 rounded-xl transition-all shadow-md shadow-orange-600/30 text-sm flex items-center space-x-2 disabled:opacity-50"
                >
                  <span>{loading ? 'Saving Profile to Database...' : 'Complete & Launch Dashboard'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200">
        Udaan AI — Karnataka Student Career Platform
      </footer>
    </div>
  );
};

export default OnboardingPage;
