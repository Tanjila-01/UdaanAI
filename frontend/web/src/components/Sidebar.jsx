import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  Clock
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showComingNext, setShowComingNext] = useState(false);
  const [comingNextTitle, setComingNextTitle] = useState('');

  const navItems = [
    { label: 'Udaan Trail Home', icon: Home, path: '/dashboard' },
    { label: 'Explore Pathways', icon: Compass, path: '/pathways' },
    { label: 'Self-Discovery', icon: Sparkles, path: '#', feature: 'Skill & Interest Assessment', badge: 'Phase 4B' },
    { label: 'Learning Modules', icon: BookOpen, path: '#', feature: 'Future Skills Learning Paths' },
    { label: 'My Career Roadmap', icon: Map, path: '/my-roadmap' },
    { label: 'Student Goals', icon: Target, path: '#', feature: 'Goal Milestone Tracker' },
    { label: 'Saved Careers', icon: Bookmark, path: '#', feature: 'Bookmarked Pathways' },
    { label: 'Government Info', icon: FolderOpen, path: '#', feature: 'Karnataka Scholarship & Institution Info' },
  ];

  const handleNavClick = (item) => {
    if (item.path && item.path !== '#') {
      navigate(item.path);
      if (onClose) onClose();
    } else if (item.feature) {
      setComingNextTitle(item.feature);
      setShowComingNext(true);
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
      <aside className={`fixed top-0 bottom-0 left-0 w-64 bg-white border-r border-slate-200/80 z-50 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6">
          {/* Logo & Tagline */}
          <div className="flex items-center justify-between px-2">
            <Link to="/dashboard" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-2xl bg-[#005F60] flex items-center justify-center text-white shadow-md shadow-[#005F60]/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-black text-xl tracking-tight text-[#0F172A] block">
                  Udaan AI
                </span>
                <span className="text-[10px] text-[#005F60] font-extrabold uppercase tracking-wider block">
                  The Udaan Trail
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
              const isSelected = location.pathname === item.path;

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleNavClick(item)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-teal-50 text-[#005F60] border border-teal-200/80 shadow-2xs'
                      : 'text-slate-600 hover:bg-[#F8FAF8] hover:text-[#0F172A]'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-[#005F60]' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-100 text-[#F97316] font-mono font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Info & Sign Out */}
        <div className="p-4 border-t border-slate-100 bg-[#F8FAF8] space-y-3">
          <div className="px-3 py-2 rounded-xl bg-teal-50/80 border border-teal-100 text-[11px] text-[#005F60] flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-[#005F60] animate-pulse"></div>
            <span className="font-extrabold">Karnataka Student Edition</span>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-50 transition-colors border border-rose-200/60 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Honest Coming Next Modal */}
      {showComingNext && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#005F60] border border-teal-200 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-extrabold tracking-wider bg-orange-100 text-[#F97316] px-2 py-0.5 rounded">
                Coming Next in Phase 4B
              </span>
              <h3 className="text-lg font-black text-[#0F172A]">{comingNextTitle}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                This pathway exploration feature is actively scheduled for the next development sprint. Your authenticated student profile is complete and saved in PostgreSQL.
              </p>
            </div>
            <button
              onClick={() => setShowComingNext(false)}
              className="w-full bg-[#005F60] hover:bg-teal-800 text-white font-extrabold py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer"
            >
              Understand & Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
