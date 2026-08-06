import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import EditProfileDrawer from '../components/EditProfileDrawer';
import { 
  Sparkles, 
  Compass, 
  Target, 
  Map, 
  Lock, 
  UserCheck, 
  GraduationCap, 
  Building2, 
  MapPin, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Info
} from 'lucide-react';

const MyCareerRoadmapPage = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

  const roadmapStages = [
    {
      step: 1,
      title: 'Discover Yourself',
      desc: 'Understand your interests, strengths, learning preferences, and career potential.',
      icon: Sparkles,
      status: 'upcoming',
      statusText: 'Pending Assessment',
      badgeColor: 'bg-orange-100 text-[#F97316] border-orange-200',
    },
    {
      step: 2,
      title: 'Choose a Career Direction',
      desc: 'Explore career options and select the direction you want to work toward.',
      icon: Compass,
      status: 'locked',
      statusText: 'Locked Stage',
      badgeColor: 'bg-slate-100 text-slate-500 border-slate-200',
    },
    {
      step: 3,
      title: 'Set Your First Goal',
      desc: 'Define a meaningful academic, skill, or career goal.',
      icon: Target,
      status: 'locked',
      statusText: 'Locked Stage',
      badgeColor: 'bg-slate-100 text-slate-500 border-slate-200',
    },
    {
      step: 4,
      title: 'Unlock Your Personalized Roadmap',
      desc: 'Your future roadmap will bring together milestones, skills, projects, exams, and progress.',
      icon: Map,
      status: 'locked',
      statusText: 'Locked Stage',
      badgeColor: 'bg-slate-100 text-slate-500 border-slate-200',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-[#0F172A] flex font-sans selection:bg-[#005F60] selection:text-white">
      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        
        {/* Header */}
        <Header 
          onMenuClick={() => setIsSidebarOpen(true)}
          onEditProfileClick={() => setIsEditDrawerOpen(true)}
        />

        <main className="p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6 flex-1">
          
          {/* Header Banner */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="inline-flex items-center space-x-1.5 text-[10px] uppercase font-extrabold tracking-wider bg-orange-100 text-[#F97316] px-2.5 py-0.5 rounded-full border border-orange-200 mb-2">
                  <Sparkles className="w-3 h-3 text-[#F97316]" />
                  <span>YOUR PERSONAL JOURNEY</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
                  My Career Roadmap
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Build a focused action plan around your interests, career direction, academic stage, and future goals.
                </p>
              </div>

              {/* Secondary Navigation CTA */}
              <button
                onClick={() => navigate('/pathways')}
                className="inline-flex items-center space-x-2 bg-[#005F60] hover:bg-teal-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs self-start sm:self-auto cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>Explore Education Pathways</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Profile Context Bar */}
            <div className="bg-[#F8FAF8] border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#005F60] border border-teal-200 flex items-center justify-center font-black text-sm flex-shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-black text-sm text-[#0F172A]">
                      {profile?.full_name || user?.full_name || 'Authenticated Student'}
                    </span>
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Profile Active
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center space-x-1 font-bold text-[#005F60]">
                      <GraduationCap className="w-3.5 h-3.5 text-[#005F60]" />
                      <span>{profile?.current_level || 'Class 10'} ({profile?.class_or_year || '10th Standard'})</span>
                    </span>
                    {profile?.stream && (
                      <span className="font-extrabold text-[#F97316] bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md">
                        {profile.stream} Stream
                      </span>
                    )}
                    {profile?.institution_name && (
                      <span className="flex items-center space-x-1 text-slate-600">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{profile.institution_name}</span>
                      </span>
                    )}
                    {profile?.district && (
                      <span className="flex items-center space-x-1 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-[#005F60]" />
                        <span>{profile.district}, {profile?.state || 'Karnataka'}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right text-[11px] text-slate-500 border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-5 flex md:flex-col items-center md:items-end justify-between">
                <span>Data Verified in PostgreSQL</span>
                <span className="font-mono font-bold text-[#005F60]">Karnataka Student DB</span>
              </div>
            </div>
          </div>

          {/* Honest Status Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex items-start space-x-3.5 text-amber-900 text-xs">
            <Info className="w-5 h-5 text-[#F97316] flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-extrabold block text-sm text-amber-950">
                Personalized Roadmap Setup Framework
              </span>
              <p className="text-amber-800 leading-relaxed">
                Your personalized action plan will bring together milestones, exams, skill requirements, and progress tracking as Self-Discovery scoring and goal selection modules roll out in upcoming Udaan AI phases.
              </p>
            </div>
          </div>

          {/* Vertical Progress Path Container */}
          <section className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-extrabold text-[#0F172A] tracking-tight">
                Roadmap Foundation Stages
              </h2>
              <p className="text-xs text-slate-500">
                Complete these foundational steps to unlock your personalized career roadmap.
              </p>
            </div>

            {/* Vertical Progress Timeline */}
            <div className="relative space-y-6 before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-slate-200 before:z-0">
              {roadmapStages.map((st) => {
                const Icon = st.icon;
                const isUpcoming = st.status === 'upcoming';

                return (
                  <div key={st.step} className="relative z-10 flex items-start space-x-4 group">
                    {/* Stage Circle Number / Icon */}
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs flex-shrink-0 shadow-xs ring-4 ring-white transition-transform group-hover:scale-105 ${
                      isUpcoming 
                        ? 'bg-[#F97316] text-white shadow-md shadow-[#F97316]/20' 
                        : 'bg-slate-200 text-slate-500'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Stage Details Card */}
                    <div className={`p-5 rounded-2xl border flex-1 space-y-2 transition-all ${
                      isUpcoming
                        ? 'bg-orange-50/40 border-orange-200/80 text-[#0F172A]'
                        : 'bg-[#F8FAF8] border-slate-200/70 text-slate-600'
                    }`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-white border border-slate-200 text-[#005F60]">
                            Stage {st.step}
                          </span>
                          <h3 className="font-extrabold text-sm text-[#0F172A]">
                            {st.title}
                          </h3>
                        </div>

                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${st.badgeColor} flex items-center space-x-1`}>
                          {isUpcoming ? (
                            <Clock className="w-3 h-3 text-[#F97316]" />
                          ) : (
                            <Lock className="w-3 h-3 text-slate-400" />
                          )}
                          <span>{st.statusText}</span>
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {st.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Bar with Primary Disabled/Upcoming CTA & Secondary Link */}
            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                <button
                  disabled
                  className="w-full sm:w-auto bg-slate-200 text-slate-400 font-extrabold py-3 px-6 rounded-xl text-xs flex items-center justify-center space-x-2 cursor-not-allowed"
                >
                  <Sparkles className="w-4 h-4 text-slate-400" />
                  <span>Start with Self-Discovery</span>
                </button>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#F97316] bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-md text-center">
                  Available in the next Udaan AI phase
                </span>
              </div>

              <button
                onClick={() => navigate('/pathways')}
                className="w-full sm:w-auto text-[#005F60] hover:text-teal-900 font-extrabold text-xs flex items-center justify-center space-x-1 hover:underline cursor-pointer"
              >
                <span>Browse Pathways Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </section>

        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200/80 bg-white py-4 px-8 text-center text-xs text-slate-500 mt-8">
          Udaan AI — My Career Roadmap Foundation
        </footer>
      </div>

      {/* Edit Profile Drawer */}
      <EditProfileDrawer 
        isOpen={isEditDrawerOpen} 
        onClose={() => setIsEditDrawerOpen(false)} 
      />
    </div>
  );
};

export default MyCareerRoadmapPage;
