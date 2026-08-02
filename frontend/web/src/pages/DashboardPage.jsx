import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import MountainHero from '../components/MountainHero';
import CareerJourneyPath from '../components/CareerJourneyPath';
import EditProfileDrawer from '../components/EditProfileDrawer';
import { 
  UserCheck, 
  GraduationCap, 
  MapPin, 
  Building2, 
  BookOpen, 
  Compass, 
  Sparkles, 
  Lock, 
  CheckCircle2,
  Edit3,
  Clock,
  Map,
  Target
} from 'lucide-react';

const DashboardPage = () => {
  const { user, profile } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

  const [activeModalFeature, setActiveModalFeature] = useState(null);

  const handleAssessmentClick = () => {
    setActiveModalFeature({
      title: 'AI Assessment',
      desc: 'The interactive AI skill, interest, and personality assessment will be available in a future phase of Udaan AI. Your profile is ready!'
    });
  };

  const handleExploreClick = () => {
    setActiveModalFeature({
      title: 'Explore Careers',
      desc: 'Karnataka SSLC, PUC, Diploma, and ITI pathway explorer directory is coming in Phase 4!'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans selection:bg-teal-700 selection:text-white">
      {/* Left Navigation Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        
        {/* Top Header */}
        <Header 
          onMenuClick={() => setIsSidebarOpen(true)}
          onEditProfileClick={() => setIsEditDrawerOpen(true)}
        />

        {/* Dashboard Content Container */}
        <main className="p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-8 flex-1">
          
          {/* Signature Animated Mountain Hero */}
          <MountainHero 
            onExploreClick={handleExploreClick}
            onAssessmentClick={handleAssessmentClick}
          />

          {/* Connected Career Journey Flow */}
          <CareerJourneyPath 
            onStepClick={(title) => setActiveModalFeature({ title, desc: `${title} guidance module will be unlocked in Phase 4!` })}
          />

          {/* Student Profile Summary — Structured Rows Layout (NO Card Overload) */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
              <div>
                <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Authenticated Database Record</span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
                  <UserCheck className="w-5 h-5 text-teal-800" />
                  <span>Student Academic Profile Summary</span>
                </h2>
                <p className="text-xs text-slate-500">Verified Karnataka Education Details from PostgreSQL DB</p>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 font-medium block">Profile Status</span>
                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-block mt-0.5">
                    {profile?.completion_percentage || 100}% Completed
                  </span>
                </div>
                <button
                  onClick={() => setIsEditDrawerOpen(true)}
                  className="bg-teal-800 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm flex items-center space-x-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>

            {/* Structured Information Rows (Dividers, Clean Space) */}
            <div className="divide-y divide-slate-100 text-xs sm:text-sm">
              <div className="py-3 sm:py-4 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                <span className="text-slate-500 font-medium">Full Name</span>
                <span className="sm:col-span-2 font-bold text-slate-900">{profile?.full_name || user?.full_name || 'N/A'}</span>
              </div>

              <div className="py-3 sm:py-4 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                <span className="text-slate-500 font-medium">Education Level & Year</span>
                <span className="sm:col-span-2 font-bold text-teal-900 flex items-center space-x-2">
                  <GraduationCap className="w-4 h-4 text-teal-700" />
                  <span>{profile?.current_level || 'Class 10'} ({profile?.class_or_year || '10th Standard'})</span>
                </span>
              </div>

              {profile?.stream && (
                <div className="py-3 sm:py-4 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                  <span className="text-slate-500 font-medium">PUC Academic Stream</span>
                  <span className="sm:col-span-2 font-bold text-orange-800 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-lg inline-block w-fit">
                    {profile.stream} Stream
                  </span>
                </div>
              )}

              {profile?.diploma_branch && (
                <div className="py-3 sm:py-4 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                  <span className="text-slate-500 font-medium">Diploma Branch</span>
                  <span className="sm:col-span-2 font-bold text-slate-900">{profile.diploma_branch}</span>
                </div>
              )}

              {profile?.iti_trade && (
                <div className="py-3 sm:py-4 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                  <span className="text-slate-500 font-medium">ITI Trade</span>
                  <span className="sm:col-span-2 font-bold text-slate-900">{profile.iti_trade}</span>
                </div>
              )}

              <div className="py-3 sm:py-4 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                <span className="text-slate-500 font-medium">Education Board / Authority</span>
                <span className="sm:col-span-2 font-bold text-slate-900">{profile?.board || 'Karnataka State Board (SSLC)'}</span>
              </div>

              <div className="py-3 sm:py-4 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                <span className="text-slate-500 font-medium">School / College Name</span>
                <span className="sm:col-span-2 font-bold text-slate-900 flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span>{profile?.institution_name || 'Government High School'}</span>
                </span>
              </div>

              <div className="py-3 sm:py-4 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                <span className="text-slate-500 font-medium">District & State</span>
                <span className="sm:col-span-2 font-bold text-slate-900 flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-teal-700" />
                  <span>{profile?.district || 'Bengaluru Urban'}, {profile?.state || 'Karnataka'}</span>
                </span>
              </div>

              <div className="py-3 sm:py-4 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                <span className="text-slate-500 font-medium">Preferred Language</span>
                <span className="sm:col-span-2 font-bold text-slate-900">{profile?.preferred_language || 'English'}</span>
              </div>
            </div>
          </section>

          {/* Polished Future Feature Placeholders (No Fake Scores) */}
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Upcoming Career Modules
              </h2>
              <p className="text-xs text-slate-500">
                Polished empty states reserved for Phase 4 AI Assessment & Pathway Explorer.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Assessment Insights Placeholder */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 relative overflow-hidden flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900">Assessment Insights</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Complete your interactive assessment in Phase 4 to unlock personalized skill scoring & career domain matches.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-bold text-slate-400 flex items-center space-x-1">
                    <Lock className="w-3.5 h-3.5 text-orange-500" />
                    <span>Phase 4 Unlocks</span>
                  </span>
                  <span className="text-teal-800 font-bold">Coming Soon</span>
                </div>
              </div>

              {/* Personalized Roadmap Placeholder */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 relative overflow-hidden flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-800 border border-orange-200 flex items-center justify-center">
                    <Map className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900">Personalized Roadmap</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Your custom step-by-step post-Class 10 or PUC action plan will generate here after assessment completion.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-bold text-slate-400 flex items-center space-x-1">
                    <Lock className="w-3.5 h-3.5 text-orange-500" />
                    <span>Phase 4 Unlocks</span>
                  </span>
                  <span className="text-teal-800 font-bold">Coming Soon</span>
                </div>
              </div>

              {/* Goals & Milestones Placeholder */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 relative overflow-hidden flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
                    <Target className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900">Career Goals & Milestones</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Track entrance exams, diploma cutoffs, PUC college preferences, and skill certifications.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-bold text-slate-400 flex items-center space-x-1">
                    <Lock className="w-3.5 h-3.5 text-orange-500" />
                    <span>Phase 4 Unlocks</span>
                  </span>
                  <span className="text-teal-800 font-bold">Coming Soon</span>
                </div>
              </div>
            </div>
          </section>

        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white py-4 px-8 text-center text-xs text-slate-500">
          Udaan AI — AI-Powered Future Skills & Path Explorer for Karnataka Students
        </footer>

      </div>

      {/* Edit Profile Drawer */}
      <EditProfileDrawer 
        isOpen={isEditDrawerOpen} 
        onClose={() => setIsEditDrawerOpen(false)} 
      />

      {/* Feature Coming Soon Modal */}
      {activeModalFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-800 border border-teal-200 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">{activeModalFeature.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {activeModalFeature.desc}
              </p>
            </div>
            <button
              onClick={() => setActiveModalFeature(null)}
              className="w-full bg-teal-800 hover:bg-teal-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md shadow-teal-800/20"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
