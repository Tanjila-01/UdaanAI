import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, LogOut, User as UserIcon, LayoutDashboard, Compass, BookOpen, Layers, PhoneCall, ChevronRight, Menu, X } from 'lucide-react';

const Navbar = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { label: 'About', href: '#about' },
    { label: 'Explore Pathways', href: '#pathways' },
    { label: 'Workshops', href: '#workshops' },
    { label: 'Constellation', href: '#constellation' },
    { label: 'AI Companion', href: '#ai-companion' },
    { label: 'Resources', href: '#resources' },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/85 backdrop-blur-xl border-b border-slate-200/80 shadow-xs py-3' 
        : 'bg-transparent py-4'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Left: Brand Logo & Tagline */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-2xl bg-[#005F60] flex items-center justify-center text-white shadow-md shadow-[#005F60]/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-black text-xl tracking-tight text-[#0F172A]">
                Udaan AI
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-teal-50 text-[#005F60] border border-teal-200 font-extrabold uppercase tracking-wider">
                Karnataka
              </span>
            </div>
            <span className="text-[10px] text-[#005F60] font-extrabold tracking-wider block">
              Explore Today. Build Tomorrow.
            </span>
          </div>
        </Link>

        {/* Center: Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-1 bg-slate-100/60 p-1.5 rounded-2xl border border-slate-200/60 backdrop-blur-sm">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-[#005F60] hover:bg-white transition-all shadow-2xs hover:shadow-xs"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right: Actions */}
        <div className="hidden sm:flex items-center space-x-3">
          {user ? (
            <>
              <Link
                to={profile ? "/dashboard" : "/onboarding"}
                className="flex items-center space-x-2 text-xs font-extrabold px-4 py-2.5 rounded-xl bg-[#005F60] hover:bg-teal-800 text-white shadow-md shadow-[#005F60]/20 transition-all cursor-pointer"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-white" />
                <span>Go to Dashboard</span>
              </Link>
              <div className="flex items-center space-x-2 text-xs bg-[#F8FAF8] border border-slate-200 px-3.5 py-1.5 rounded-full text-slate-700">
                <UserIcon className="w-3.5 h-3.5 text-[#005F60]" />
                <span className="font-bold text-[#0F172A]">{user.full_name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-xs font-bold px-4 py-2.5 rounded-xl text-slate-700 hover:text-[#005F60] hover:bg-slate-100 transition-all cursor-pointer"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center space-x-1.5 text-xs font-extrabold px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white shadow-md shadow-[#F97316]/25 hover:scale-102 transition-all cursor-pointer"
              >
                <span>Sign Up</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-3 shadow-xl">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-[#005F60]"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="pt-3 border-t border-slate-100 flex flex-col space-y-2">
            {user ? (
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl bg-[#005F60] text-white text-xs font-bold"
              >
                Go to Dashboard
              </Link>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 rounded-xl bg-[#F97316] text-white text-xs font-bold"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;

