import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { 
  UserCheck, 
  GraduationCap, 
  MapPin, 
  Building, 
  BookOpen, 
  Compass, 
  Sparkles, 
  Lock, 
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';

const DashboardPage = () => {
  const { user, profile } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-indigo-900/40 via-slate-900 to-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Phase 2 Authenticated Student Session</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">
              Welcome back, {user?.full_name || 'Student'}!
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl">
              Your Udaan AI student profile foundation is active. Explore your verified academic details below.
            </p>
          </div>

          <Link
            to="/onboarding"
            className="inline-flex items-center space-x-2 text-xs font-semibold px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors self-start md:self-center"
          >
            <GraduationCap className="w-4 h-4 text-indigo-400" />
            <span>Edit Profile</span>
          </Link>
        </div>

        {/* Profile Completion & Details Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-indigo-400" />
                <span>Student Academic Profile Summary</span>
              </h2>
              <p className="text-xs text-slate-400">Verified Karnataka Education Pathway Inputs</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Profile Completion</span>
                <span className="text-sm font-extrabold text-emerald-400">
                  {profile?.completion_percentage || 0}% Complete
                </span>
              </div>
              <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-emerald-400">
                {profile?.completion_percentage || 0}%
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-950 rounded-full h-3 p-0.5 border border-slate-800 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${profile?.completion_percentage || 0}%` }}
            ></div>
          </div>

          {/* Profile Data Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-1">
              <span className="text-xs text-slate-500 font-medium">Current Grade / Level</span>
              <div className="text-base font-bold text-white flex items-center space-x-2">
                <GraduationCap className="w-4 h-4 text-indigo-400" />
                <span>{profile?.current_level || 'N/A'}</span>
              </div>
              <span className="text-xs text-slate-400 block">{profile?.class_or_year}</span>
            </div>

            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-1">
              <span className="text-xs text-slate-500 font-medium">Education Board</span>
              <div className="text-base font-bold text-white flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-violet-400" />
                <span className="truncate">{profile?.board || 'N/A'}</span>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-1">
              <span className="text-xs text-slate-500 font-medium">Institution Name</span>
              <div className="text-base font-bold text-white flex items-center space-x-2">
                <Building className="w-4 h-4 text-amber-400" />
                <span className="truncate">{profile?.institution_name || 'N/A'}</span>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-1">
              <span className="text-xs text-slate-500 font-medium">District & State</span>
              <div className="text-base font-bold text-white flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>{profile?.district || 'N/A'}, {profile?.state || 'Karnataka'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Future Phase Placeholders */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-white">Upcoming Career Exploration Modules</h2>
            <p className="text-xs text-slate-400">Features to be unlocked in future development phases</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Self-Discovery Assessments */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 space-y-4 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                  <Compass className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex items-center space-x-1">
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>Phase 3 — Coming Soon</span>
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-300">Self-Discovery Assessments</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Interest, personality, skill, and learning-style assessment question banks & scoring outputs.
                </p>
              </div>
            </div>

            {/* Card 2: AI Career Guidance */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 space-y-4 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex items-center space-x-1">
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>Phase 3 — Coming Soon</span>
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-300">AI Career Intelligence</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Personalized career compatibility scoring, stream recommendations, and AI career insights.
                </p>
              </div>
            </div>

            {/* Card 3: Career Roadmaps & Path Explorer */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 space-y-4 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex items-center space-x-1">
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>Phase 4 — Coming Soon</span>
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-300">Your Path After Class 10</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Interactive explorer for PUC, Diploma, ITI, and vocational routes in Karnataka.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-500">
        Udaan AI — Student Dashboard Shell
      </footer>
    </div>
  );
};

export default DashboardPage;
