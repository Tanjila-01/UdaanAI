import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Send, ArrowLeft, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

/**
 * Dedicated AuthHeader component for Authentication and Onboarding pages.
 * Provides clean brand identity and contextual switch actions without public marketing nav clutter.
 */
export const AuthHeader = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const isLogin = location.pathname === '/login';
  const isRegister = location.pathname === '/register';
  const isOnboarding = location.pathname === '/onboarding';

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs py-3.5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Left: Brand Logo linking to Homepage */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-[#005F60] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
            <Send className="w-5 h-5 text-white animate-paper-plane" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                Udaan AI
              </span>
              <Badge variant="primary" size="sm">
                Karnataka
              </Badge>
            </div>
            <span className="text-[10px] text-[#005F60] font-extrabold tracking-wider block">
              Explore Today. Build Tomorrow.
            </span>
          </div>
        </Link>

        {/* Right: Focused Contextual Actions */}
        <div className="flex items-center space-x-3">
          {isLogin && (
            <div className="flex items-center space-x-2">
              <span className="hidden sm:inline text-xs text-slate-500 font-semibold">
                Don't have an account?
              </span>
              <Link to="/register">
                <Button variant="primary" size="sm" className="bg-[#005F60] hover:bg-[#004D4E]">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}

          {isRegister && (
            <div className="flex items-center space-x-2">
              <span className="hidden sm:inline text-xs text-slate-500 font-semibold">
                Already have an account?
              </span>
              <Link to="/login">
                <Button variant="ghost" size="sm" className="font-bold text-[#005F60] hover:bg-teal-50">
                  Sign In
                </Button>
              </Link>
            </div>
          )}

          {isOnboarding && (
            <div className="flex items-center space-x-3">
              {user && (
                <div className="flex items-center space-x-2 text-xs bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-800 font-bold">
                  <UserIcon className="w-3.5 h-3.5 text-[#005F60]" />
                  <span className="truncate max-w-[120px]">{user.full_name}</span>
                </div>
              )}
              <Link to="/">
                <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                  Back to Home
                </Button>
              </Link>
            </div>
          )}

          {!isLogin && !isRegister && !isOnboarding && (
            <Link to="/">
              <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Home
              </Button>
            </Link>
          )}
        </div>

      </div>
    </header>
  );
};

export default AuthHeader;
