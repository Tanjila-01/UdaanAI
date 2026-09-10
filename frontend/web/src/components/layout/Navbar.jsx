import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAccountAction } from '../../utils/accountActions';
import { Send, LogOut, User as UserIcon, Shield, LayoutDashboard, Menu, X, ArrowRight } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

/**
 * Modern, minimal Navbar component for Udaan AI public and marketing pages.
 * Accurately reflects auth states (Guest, Incomplete Student, Complete Student, Admin).
 */
export const Navbar = () => {
  const { user, profile, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const accountAction = getAccountAction(user, profile, loading);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Curated public navigation anchors mapped directly to homepage sections
  const navLinks = [
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pathways', href: '#pathways' },
    { label: 'Workshops', href: '#workshops' },
    { label: 'For Schools', href: '#school-invitation' },
  ];

  const handleNavClick = (e, href) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      setMobileMenuOpen(false);

      const targetId = href.replace('#', '');

      if (location.pathname !== '/') {
        navigate('/' + href);
        setTimeout(() => {
          const element = document.getElementById(targetId);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 150);
        return;
      }

      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs py-2.5'
          : 'bg-white/90 backdrop-blur-xs py-3.5 border-b border-slate-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left: Brand Logo & Tagline */}
        <Link to="/" className="flex items-center space-x-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-[#005F60] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
            <Send className="w-4 h-4 text-white animate-paper-plane" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-lg tracking-tight text-slate-900">
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

        {/* Center: Curated Public Section Anchors */}
        <nav className="hidden lg:flex items-center space-x-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 backdrop-blur-xs">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-800 hover:text-[#005F60] hover:bg-white transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#005F60] outline-none"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right: Focused Actions (Reflecting Exact Session State) */}
        <div className="hidden sm:flex items-center space-x-2.5 min-w-[200px] justify-end">
          {accountAction.isLoading ? (
            <div className="h-9 w-32 bg-slate-100 animate-pulse rounded-xl" aria-label="Loading session" />
          ) : user ? (
            <>
              <Link to={accountAction.destination}>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={accountAction.isAdmin ? <Shield className="w-3.5 h-3.5" /> : <LayoutDashboard className="w-3.5 h-3.5" />}
                  className="bg-[#005F60] hover:bg-[#004D4E] text-white font-bold"
                >
                  {accountAction.label}
                </Button>
              </Link>

              <div className="flex items-center space-x-1.5 text-xs bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg text-slate-800 font-bold">
                <UserIcon className="w-3.5 h-3.5 text-[#005F60]" />
                <span className="truncate max-w-[120px]">{user.full_name || user.email}</span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-rose-600 hover:bg-rose-50 px-2"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm" className="font-bold text-slate-800 hover:text-[#005F60]">
                  Login
                </Button>
              </Link>
              <Link to={accountAction.destination}>
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-[#E06D14] hover:bg-[#C2580E] text-white shadow-2xs font-extrabold"
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  {accountAction.label}
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-lg text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#005F60] outline-none"
          aria-label="Toggle Navigation Menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-4 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
              Navigation
            </span>
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="px-3 py-2 rounded-lg text-xs font-bold text-slate-800 hover:bg-teal-50 hover:text-[#005F60] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
              Account
            </span>
            {accountAction.isLoading ? (
              <div className="h-10 w-full bg-slate-100 animate-pulse rounded-lg" />
            ) : user ? (
              <div className="space-y-2">
                <Link
                  to={accountAction.destination}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-lg bg-[#005F60] text-white text-xs font-bold shadow-xs flex items-center justify-center space-x-2"
                >
                  {accountAction.isAdmin ? <Shield className="w-4 h-4" /> : <LayoutDashboard className="w-4 h-4" />}
                  <span>{accountAction.label}</span>
                </Link>
                <div className="flex items-center justify-between px-2 pt-1 text-xs text-slate-600 font-medium">
                  <span className="truncate max-w-[200px]">{user.full_name || user.email}</span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-rose-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to={accountAction.destination}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 rounded-lg bg-[#E06D14] text-white text-xs font-bold hover:bg-[#C2580E] transition-colors shadow-2xs"
                >
                  {accountAction.label}
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
