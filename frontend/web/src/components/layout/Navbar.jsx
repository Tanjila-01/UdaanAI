import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAccountAction } from '../../utils/accountActions';
import { Send, LogOut, User as UserIcon, Shield, LayoutDashboard, Menu, X, ArrowRight } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import ThemeToggle from '../ThemeToggle';

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
          ? 'bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs'
          : 'bg-white/90 backdrop-blur-xs border-b border-slate-100'
      }`}
    >
      <div className="max-w-7xl mx-auto h-16 lg:h-[72px] px-4 sm:px-6 lg:px-8 flex items-center gap-6">
        {/* Left: Brand Logo & Tagline */}
        <Link to="/" className="flex shrink-0 items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-[#005F60] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
            <Send className="w-4 h-4 text-white animate-paper-plane" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-lg tracking-tight text-slate-900">
                Udaan AI
              </span>
              <span className="hidden sm:block">
                <Badge variant="primary" size="sm">Karnataka</Badge>
              </span>
            </div>
            <span className="hidden sm:block text-[10px] text-[#005F60] font-semibold tracking-wide">
              Explore Today. Build Tomorrow.
            </span>
          </div>
        </Link>

        {/* Center: Curated Public Section Anchors */}
        <nav aria-label="Main navigation" className="hidden xl:flex flex-1 items-center justify-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="px-3 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap text-slate-600 hover:text-[#005F60] hover:bg-slate-50 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#005F60] outline-none"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right: Focused Actions (Reflecting Exact Session State) */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <div className="hidden md:flex items-center gap-2">
            {accountAction.isLoading ? (
              <div className="h-9 w-32 bg-slate-100 animate-pulse rounded-xl" aria-label="Loading session" />
            ) : user ? (
              <>
                <Link to={accountAction.destination}>
                  <Button
                    variant="primary"
                    size="md"
                    leftIcon={accountAction.isAdmin ? <Shield className="w-3.5 h-3.5" /> : <LayoutDashboard className="w-3.5 h-3.5" />}
                    className="h-10 bg-[#005F60] hover:bg-[#004D4E] text-white font-semibold whitespace-nowrap"
                  >
                    {accountAction.label}
                  </Button>
                </Link>

                <div title={user.full_name || user.email} className="hidden xl:flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  <UserIcon className="w-4 h-4" aria-hidden="true" />
                  <span className="sr-only">{user.full_name || user.email}</span>
                </div>

                <Button
                  variant="ghost"
                  size="md"
                  onClick={handleLogout}
                  className="h-10 w-10 p-0 text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="md" className="h-10 font-semibold text-slate-600 hover:text-[#005F60]">
                    Login
                  </Button>
                </Link>
                <Link to={accountAction.destination}>
                  <Button
                    variant="secondary"
                    size="md"
                    className="h-10 bg-[#E06D14] hover:bg-[#C2580E] text-white shadow-2xs font-semibold whitespace-nowrap"
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    {accountAction.label}
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Toggle Button */}
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#005F60] outline-none"
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="public-mobile-navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div id="public-mobile-navigation" className="xl:hidden max-h-[calc(100dvh-72px)] overflow-y-auto bg-white border-b border-slate-200 px-4 sm:px-6 pt-3 pb-6 space-y-4 shadow-lg">
          <div className="flex flex-col space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
              Navigation
            </span>
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="px-3 py-3 rounded-lg text-sm font-semibold text-slate-800 hover:bg-teal-50 hover:text-[#005F60] transition-colors"
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
