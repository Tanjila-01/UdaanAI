import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Home, 
  Compass, 
  Sparkles, 
  BookOpen, 
  Map, 
  Target, 
  Bookmark, 
  FolderOpen, 
  LogOut, 
  X, 
  Menu,
  Clock,
  ChevronRight
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { logout } = useAuth();
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [comingSoonTitle, setComingSoonTitle] = useState('');

  const navItems = [
    { label: 'Home', icon: Home, path: '/dashboard', active: true },
    { label: 'Explore Careers', icon: Compass, path: '#', feature: 'Career Explorer' },
    { label: 'AI Assessment', icon: Sparkles, path: '#', feature: 'AI Skill & Interest Assessment', badge: 'Phase 4' },
    { label: 'Learning Paths', icon: BookOpen, path: '#', feature: 'Future Skills Courses' },
    { label: 'Roadmap', icon: Map, path: '#', feature: 'Path After Class 10' },
    { label: 'Goals', icon: Target, path: '#', feature: 'Student Milestones' },
    { label: 'Saved Careers', icon: Bookmark, path: '#', feature: 'Bookmarked Pathways' },
    { label: 'Resources', icon: FolderOpen, path: '#', feature: 'Karnataka Scholarship & Govt Info' },
  ];

  const handleNavClick = (item) => {
    if (item.feature) {
      setComingSoonTitle(item.feature);
      setShowComingSoon(true);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar Container */}
      <aside className={`fixed top-0 bottom-0 left-0 w-64 bg-white border-r border-slate-200 z-50 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6">
          {/* Logo & Tagline */}
          <div className="flex items-center justify-between px-2">
            <Link to="/dashboard" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-teal-800 flex items-center justify-center text-white shadow-md shadow-teal-800/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-slate-900 block">
                  Udaan AI
                </span>
                <span className="text-[10px] text-teal-800 font-bold uppercase tracking-wider block">
                  Discover. Plan. Achieve.
                </span>
              </div>
            </Link>
            <button 
              onClick={onClose}
              className="lg:hidden text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="h-px bg-slate-100 my-2"></div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isSelected = item.active;

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleNavClick(item)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-teal-50 text-teal-900 border border-teal-200/80 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-teal-800' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-mono font-semibold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Logout & User State */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
          <div className="px-2 py-1.5 rounded-lg bg-teal-50/60 border border-teal-100 text-[11px] text-teal-900 flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-teal-600 animate-pulse"></div>
            <span className="font-semibold">Karnataka Student Edition</span>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-50 transition-colors border border-rose-200/60"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Feature Coming Soon Modal */}
      {showComingSoon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-800 border border-teal-200 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">{comingSoonTitle}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                This feature will be available in an upcoming phase of Udaan AI. Your profile and education details are saved and ready.
              </p>
            </div>
            <button
              onClick={() => setShowComingSoon(false)}
              className="w-full bg-teal-800 hover:bg-teal-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md shadow-teal-800/20"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
