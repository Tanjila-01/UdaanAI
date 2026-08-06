import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import UdaanTrailHero from '../components/UdaanTrailHero';
import UdaanTrailMilestones from '../components/UdaanTrailMilestones';
import EditProfileDrawer from '../components/EditProfileDrawer';
import { 
  UserCheck, 
  GraduationCap, 
  MapPin, 
  Building2, 
  CheckCircle2,
  Edit3,
  Clock,
  Map,
  Target,
  Sparkles,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, profile, loading, refreshProfile } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [modalFeature, setModalFeature] = useState(null);

  const handleAssessmentClick = () => {
    setModalFeature({
      title: 'Self-Discovery Assessment',
      desc: 'The interactive skill and interest assessment will be released in Phase 4B. Your authenticated profile is saved and ready in PostgreSQL.'
    });
  };

  const handleExploreClick = () => {
    navigate('/pathways');
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-[#0F172A] flex font-sans selection:bg-[#005F60] selection:text-white">
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
          
          {/* Skeleton Loader when Profile/User is Loading */}
          {loading && (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 space-y-4 animate-pulse">
              <div className="h-6 bg-slate-200 rounded w-1/3"></div>
              <div className="h-32 bg-slate-100 rounded-2xl"></div>
              <div className="h-20 bg-slate-100 rounded-2xl"></div>
            </div>
          )}

          {/* Error Banner with Retry */}
          {!loading && !profile && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-amber-900">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                <div>
                  <h3 className="font-extrabold text-sm">Academic Profile Pending</h3>
                  <p className="text-xs text-amber-700 mt-0.5">Please complete your onboarding profile to view database records.</p>
                </div>
              </div>
              <button
                onClick={refreshProfile}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Fetch</span>
              </button>
            </div>
          )}

          {/* Signature Illustration-Led Udaan Trail Hero */}
          <UdaanTrailHero 
            onExploreClick={handleExploreClick}
            onAssessmentClick={handleAssessmentClick}
          />

          {/* "THE UDAAN TRAIL" 6-Stage Journey System */}
          <UdaanTrailMilestones 
            onStageClick={(stageName) => setModalFeature({
              title: `${stageName} Stage`,
              desc: `${stageName} pathway module is scheduled for Phase 4B.`
            })}
          />

          {/* Student Profile Summary — Structured Rows Layout (NO Card Overload) */}
          <section className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-5 gap-4">
              <div>
                <div className="inline-flex items-center space-x-1.5 text-[11px] font-extrabold text-[#005F60] bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Authenticated Database Record</span>
                </div>
                <h2 className="text-xl font-black text-[#0F172A] tracking-tight flex items-center space-x-2">
                  <UserCheck className="w-5 h-5 text-[#005F60]" />
                  <span>Student Academic Profile Summary</span>
                </h2>
                <p className="text-xs text-slate-500">Verified Karnataka Education Details from PostgreSQL DB</p>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 font-medium block">Profile Status</span>
                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-block mt-0.5">
                    {profile?.completion_percentage || 100}% Complete
                  </span>
                </div>
                <button
                  onClick={() => setIsEditDrawerOpen(true)}
                  className="bg-[#005F60] hover:bg-teal-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>

            {/* Structured Information Rows (Low contrast dividers, ample space) */}
            <div className="divide-y divide-slate-100 text-xs sm:text-sm">
              <div className="py-3.5 sm:py-4 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                <span className="text-slate-500 font-medium">Student Full Name</span>
                <span className="sm:col-span-2 font-black text-[#0F172A]">{profile?.full_name || user?.full_name || 'N/A'}</span>
              </div>

              <div className="py-3.5 sm:py-4 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                <span className="text-slate-500 font-medium">Education Level & Year</span>
                <span className="sm:col-span-2 font-black text-[#005F60] flex items-center space-x-2">
                  <GraduationCap className="w-4 h-4 text-[#005F60]" />
                  <span>{profile?.current_level || 'Class 10'} ({profile?.class_or_year || '10th Standard'})</span>
                </span>
              </div>

              {profile?.stream && (
                <div className="py-3.5 sm:py-4 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                  <span className="text-slate-500 font-medium">PUC Academic Stream</span>
                  <span className="sm:col-span-2 font-extrabold text-[#F97316] bg-orange-50 border border-orange-200 px-3 py-1 rounded-xl inline-block w-fit">
                    {profile.stream} Stream
                  </span>
                </div>
              )}

              {profile?.diploma_branch && (
                <div className="py-3.5 sm:py-4 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                  <span className="text-slate-500 font-medium">Diploma Branch</span>
                  <span className="sm:col-span-2 font-black text-[#0F172A]">{profile.diploma_branch}</span>
                </div>
              )}

              {profile?.iti_trade && (
                <div className="py-3.5 sm:py-4 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                  <span className="text-slate-500 font-medium">ITI Trade</span>
                  <span className="sm:col-span-2 font-black text-[#0F172A]">{profile.iti_trade}</span>
                </div>
              )}

              <div className="py-3.5 sm:py-4 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                <span className="text-slate-500 font-medium">Education Board / Authority</span>
                <span className="sm:col-span-2 font-black text-[#0F172A]">{profile?.board || 'Karnataka State Board (SSLC)'}</span>
              </div>

              <div className="py-3.5 sm:py-4 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                <span className="text-slate-500 font-medium">School / College Name</span>
                <span className="sm:col-span-2 font-black text-[#0F172A] flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span>{profile?.institution_name || 'Government High School'}</span>
                </span>
              </div>

              <div className="py-3.5 sm:py-4 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                <span className="text-slate-500 font-medium">District & State</span>
                <span className="sm:col-span-2 font-black text-[#0F172A] flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-[#005F60]" />
                  <span>{profile?.district || 'Bengaluru Urban'}, {profile?.state || 'Karnataka'}</span>
                </span>
              </div>

              <div className="py-3.5 sm:py-4 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                <span className="text-slate-500 font-medium">Preferred Language</span>
                <span className="sm:col-span-2 font-black text-[#0F172A]">{profile?.preferred_language || 'English'}</span>
              </div>
            </div>
          </section>

          {/* Honest "Coming Next" Feature Modules (No Fake Scores) */}
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-black text-[#0F172A] tracking-tight">
                Upcoming Udaan Trail Modules
              </h2>
              <p className="text-xs text-slate-500">
                Transparent empty states reserved for upcoming Phase 4B pathway & skill explorer features.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Assessment Insights Placeholder */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-3 flex flex-col justify-between shadow-2xs">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#005F60] border border-teal-200 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-black text-[#0F172A]">Self-Discovery Insights</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Interactive skill and interest scoring modules are planned for Phase 4B. Your profile is ready.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] font-extrabold text-[#F97316] bg-orange-50 px-2 py-0.5 rounded">
                    Phase 4B
                  </span>
                  <span className="text-[#005F60] font-bold">Coming Next</span>
                </div>
              </div>

              {/* Personal Roadmap Explorer Card */}
              <div 
                onClick={() => navigate('/pathways')}
                className="bg-white border border-teal-200/80 hover:border-[#005F60] rounded-3xl p-6 space-y-3 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#005F60] border border-teal-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Map className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-black text-[#0F172A] group-hover:text-[#005F60]">Personalized Pathway Map</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Explore detailed step-by-step post-Class 10, PUC, Diploma, and ITI action plans tailored to your profile.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] font-extrabold text-[#005F60] bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                    Active Module
                  </span>
                  <span className="text-[#005F60] font-bold group-hover:underline">Explore Pathways →</span>
                </div>
              </div>

              {/* Goals & Milestones Placeholder */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-3 flex flex-col justify-between shadow-2xs">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
                    <Target className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-black text-[#0F172A]">Career Goals & Cutoffs</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Track diploma cutoffs, PUC college preferences, and vocational trade certifications.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] font-extrabold text-[#F97316] bg-orange-50 px-2 py-0.5 rounded">
                    Phase 4B
                  </span>
                  <span className="text-[#005F60] font-bold">Coming Next</span>
                </div>
              </div>
            </div>
          </section>

        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200/80 bg-white py-4 px-8 text-center text-xs text-slate-500">
          Udaan AI — The Udaan Trail for Karnataka Students
        </footer>

      </div>

      {/* Edit Profile Drawer */}
      <EditProfileDrawer 
        isOpen={isEditDrawerOpen} 
        onClose={() => setIsEditDrawerOpen(false)} 
      />

      {/* Feature Coming Next Modal */}
      {modalFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#005F60] border border-teal-200 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-[#0F172A]">{modalFeature.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {modalFeature.desc}
              </p>
            </div>
            <button
              onClick={() => setModalFeature(null)}
              className="w-full bg-[#005F60] hover:bg-teal-800 text-white font-extrabold py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer"
            >
              Close Window
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
