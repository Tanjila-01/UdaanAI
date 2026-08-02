import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, LogOut, User as UserIcon, LayoutDashboard } from 'lucide-react';

const Navbar = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-9 h-9 rounded-xl bg-teal-800 flex items-center justify-center text-white shadow-md shadow-teal-800/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-black text-xl tracking-tight text-slate-900">
              Udaan AI
            </span>
            <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-bold uppercase tracking-wider">
              Karnataka Platform
            </span>
          </div>
        </Link>

        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <Link
                to={profile ? "/dashboard" : "/onboarding"}
                className="flex items-center space-x-2 text-xs font-bold px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-teal-700" />
                <span>Dashboard</span>
              </Link>
              <div className="flex items-center space-x-2 text-xs bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full text-slate-700">
                <UserIcon className="w-3.5 h-3.5 text-teal-700" />
                <span className="font-bold text-slate-900">{user.full_name}</span>
                {profile && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-100 text-teal-900 font-semibold">
                    {profile.current_level}
                  </span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-xs font-bold px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-xs font-bold px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-700 text-white shadow-sm transition-all"
              >
                Register as Student
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
