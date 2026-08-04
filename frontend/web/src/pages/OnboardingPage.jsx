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

  useEffect(() => {
    if (profile && profile.is_complete) {
      navigate('/dashboard');
    } else if (profile) {
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
  }, [profile, navigate]);

  const handleLevelSelect = (levelId) => {
    let boardDefault = 'Karnataka State Board (SSLC)';
    let classOrYear = `${levelId} Standard`;
    if (levelId.startsWith('PUC')) {
      boardDefault = 'Karnataka Pre-University Education';
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
      stream: levelId.startsWith('PUC') ? (formData.stream || 'Science') : '',
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
    if (formData.current_level === 'Diploma' && !formData.diploma_branch) {
      setError('Please select your Diploma branch');
      return false;
    }
    if (formData.current_level === 'ITI' && !formData.iti_trade) {
      setError('Please select your ITI trade');
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
        stream: formData.current_level.startsWith('PUC') ? (formData.stream || null) : null,
        diploma_branch: formData.current_level === 'Diploma' ? (formData.diploma_branch || null) : null,
        iti_trade: formData.current_level === 'ITI' ? (formData.iti_trade || null) : null,
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
    <div className="min-h-screen bg-[#F8FAF8] text-[#0F172A] flex flex-col justify-between selection:bg-[#005F60] selection:text-white font-sans">
      <Navbar />

      <main className="max-w-4xl w-full mx-auto px-4 py-8 flex-1">
        {/* Title Section */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center space-x-2 text-xs font-extrabold px-3 py-1 rounded-full bg-teal-50 text-[#005F60] border border-teal-200">
            <Compass className="w-3.5 h-3.5 text-[#005F60]" />
            <span>The Udaan Trail — Onboarding Stage 1 & 2</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight">
            Welcome to Udaan AI, <span className="text-[#005F60]">{user?.full_name || 'Student'}</span>!
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
            Setup your education stage and institution context to personalize your post-Class 10 and PUC pathway map.
          </p>
        </div>

        {/* Step Progress Trail Bar */}
        <div className="mb-10 max-w-2xl mx-auto">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0"></div>
            <div 
              className="absolute top-1/2 left-0 h-0.5 bg-[#005F60] -translate-y-1/2 transition-all duration-300 z-0"
              style={{ width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%' }}
            ></div>

            <div className="relative z-10 flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs transition-colors ${
                currentStep >= 1 ? 'bg-[#005F60] text-white shadow-md' : 'bg-slate-200 text-slate-600'
              }`}>
                1
              </div>
              <span className={`text-xs mt-2 font-bold ${currentStep === 1 ? 'text-[#005F60]' : 'text-slate-500'}`}>
                Education Level
              </span>
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs transition-colors ${
                currentStep >= 2 ? 'bg-[#005F60] text-white shadow-md' : 'bg-slate-200 text-slate-600'
              }`}>
                2
              </div>
              <span className={`text-xs mt-2 font-bold ${currentStep === 2 ? 'text-[#005F60]' : 'text-slate-500'}`}>
                School & District
              </span>
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs transition-colors ${
                currentStep >= 3 ? 'bg-[#005F60] text-white shadow-md' : 'bg-slate-200 text-slate-600'
              }`}>
                3
              </div>
              <span className={`text-xs mt-2 font-bold ${currentStep === 3 ? 'text-[#005F60]' : 'text-slate-500'}`}>
                Profile Review
              </span>
            </div>
          </div>
        </div>

        {/* Error Feedback Alert */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6 bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start space-x-2.5 text-rose-800 text-xs shadow-2xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
            <span className="font-bold">{error}</span>
          </div>
        )}

        {/* Form Step Container */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-xs max-w-3xl mx-auto space-y-8">
          
          {/* STEP 1: EDUCATION LEVEL SELECTOR */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-[#0F172A] flex items-center space-x-2">
                  <GraduationCap className="w-5 h-5 text-[#005F60]" />
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
                      className={`text-left p-4 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-teal-50/80 border-[#005F60] ring-2 ring-[#005F60]/20 text-[#0F172A] shadow-xs'
                          : 'bg-[#F8FAF8] border-slate-200/80 hover:border-teal-300 text-slate-800 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                          isSelected ? 'bg-[#005F60] text-white' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {level.category}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-[#005F60]" />}
                      </div>
                      <h3 className="font-black text-base text-[#0F172A]">{level.label}</h3>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">{level.description}</p>
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={handleNext}
                  className="bg-[#005F60] hover:bg-teal-800 text-white font-extrabold px-6 py-3 rounded-xl transition-all shadow-md text-sm flex items-center space-x-2 cursor-pointer"
                >
                  <span>Continue to Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: ACADEMIC DETAILS & CONDITIONAL INPUTS */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-[#0F172A] flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-[#005F60]" />
                  <span>Academic Details for {formData.current_level}</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Tell us about your institution, board, and location in Karnataka.
                </p>
              </div>

              <div className="space-y-4">
                {/* Conditional PUC Stream Selector */}
                {formData.current_level.startsWith('PUC') && (
                  <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-2xl space-y-3">
                    <label className="block text-xs font-black text-[#F97316]">
                      Select Your PUC Academic Stream *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {PUC_STREAMS.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, stream: s.id })}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            formData.stream === s.id
                              ? 'bg-[#F97316] text-white border-[#F97316] shadow-sm font-bold'
                              : 'bg-white text-slate-800 border-orange-200 hover:border-orange-400 text-xs'
                          }`}
                        >
                          <div className="font-extrabold text-sm">{s.label}</div>
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
                    <label className="block text-xs font-bold text-[#0F172A] mb-1">Diploma Branch *</label>
                    <select
                      name="diploma_branch"
                      value={formData.diploma_branch}
                      onChange={handleChange}
                      className="w-full bg-[#F8FAF8] border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:border-[#005F60]"
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
                    <label className="block text-xs font-bold text-[#0F172A] mb-1">ITI Trade *</label>
                    <select
                      name="iti_trade"
                      value={formData.iti_trade}
                      onChange={handleChange}
                      className="w-full bg-[#F8FAF8] border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:border-[#005F60]"
                    >
                      {ITI_TRADES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Board / Curriculum */}
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">Education Board / Authority</label>
                  <input
                    type="text"
                    name="board"
                    required
                    value={formData.board}
                    onChange={handleChange}
                    className="w-full bg-[#F8FAF8] border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:border-[#005F60]"
                  />
                </div>

                {/* School / College Name */}
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">School / College / Institution Name *</label>
                  <input
                    type="text"
                    name="institution_name"
                    required
                    value={formData.institution_name}
                    onChange={handleChange}
                    placeholder="e.g. Government High School, Malleshwaram"
                    className="w-full bg-[#F8FAF8] border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:border-[#005F60]"
                  />
                </div>

                {/* District & Preferred Language */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#0F172A] mb-1">District (Karnataka) *</label>
                    <select
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      className="w-full bg-[#F8FAF8] border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:border-[#005F60]"
                    >
                      {KARNATAKA_DISTRICTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0F172A] mb-1">Preferred Language</label>
                    <select
                      name="preferred_language"
                      value={formData.preferred_language}
                      onChange={handleChange}
                      className="w-full bg-[#F8FAF8] border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:border-[#005F60]"
                    >
                      <option value="English">English</option>
                      <option value="Kannada">Kannada</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-xl flex items-center space-x-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="bg-[#005F60] hover:bg-teal-800 text-white font-extrabold px-6 py-3 rounded-xl transition-all shadow-md text-sm flex items-center space-x-2 cursor-pointer"
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
                <h2 className="text-xl font-black text-[#0F172A] flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-[#005F60]" />
                  <span>Review Your Profile Before Saving</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Ensure your details are accurate to enable tailored career path suggestions.
                </p>
              </div>

              <div className="bg-[#F8FAF8] border border-slate-200/80 rounded-2xl p-5 divide-y divide-slate-200 text-xs">
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Student Name:</span>
                  <span className="font-extrabold text-[#0F172A]">{user?.full_name}</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Education Level:</span>
                  <span className="font-extrabold text-[#005F60] bg-teal-100/70 px-2.5 py-0.5 rounded-md">{formData.current_level} ({formData.class_or_year})</span>
                </div>
                {formData.current_level.startsWith('PUC') && formData.stream && (
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-slate-500 font-medium">PUC Stream:</span>
                    <span className="font-extrabold text-[#F97316] bg-orange-100 px-2.5 py-0.5 rounded-md">{formData.stream}</span>
                  </div>
                )}
                {formData.current_level === 'Diploma' && formData.diploma_branch && (
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Diploma Branch:</span>
                    <span className="font-bold text-[#0F172A]">{formData.diploma_branch}</span>
                  </div>
                )}
                {formData.current_level === 'ITI' && formData.iti_trade && (
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-slate-500 font-medium">ITI Trade:</span>
                    <span className="font-bold text-[#0F172A]">{formData.iti_trade}</span>
                  </div>
                )}
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Education Board:</span>
                  <span className="font-bold text-[#0F172A]">{formData.board}</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Institution Name:</span>
                  <span className="font-bold text-[#0F172A]">{formData.institution_name}</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">District & State:</span>
                  <span className="font-bold text-[#0F172A]">{formData.district}, {formData.state}</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Preferred Language:</span>
                  <span className="font-bold text-[#0F172A]">{formData.preferred_language}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={loading}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-xl flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Edit Details</span>
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-[#F97316] hover:bg-orange-500 text-white font-black px-8 py-3 rounded-xl transition-all shadow-md shadow-[#F97316]/30 text-sm flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
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
        Udaan AI — Student Pathway Onboarding
      </footer>
    </div>
  );
};

export default OnboardingPage;
