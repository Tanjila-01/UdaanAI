import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAccountAction } from '../../utils/accountActions';
import { LogOut, Shield, LayoutDashboard, Menu, X, ArrowRight, ChevronDown } from 'lucide-react';
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
  const [navMenuOpen, setNavMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const navMenuRef = useRef(null);
  const navButtonRef = useRef(null);
  const accountMenuRef = useRef(null);
  const accountButtonRef = useRef(null);

  const accountAction = getAccountAction(user, profile, loading);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile navigation menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setNavMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle outside click and Escape key dismissal with focus restoration
  useEffect(() => {
    if (!navMenuOpen && !accountMenuOpen) return;

    const handleClickOutside = (event) => {
      if (
        navMenuOpen &&
        navMenuRef.current &&
        !navMenuRef.current.contains(event.target) &&
        navButtonRef.current &&
        !navButtonRef.current.contains(event.target)
      ) {
        setNavMenuOpen(false);
      }

      if (
        accountMenuOpen &&
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target) &&
        accountButtonRef.current &&
        !accountButtonRef.current.contains(event.target)
      ) {
        setAccountMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (accountMenuOpen) {
          setAccountMenuOpen(false);
          accountButtonRef.current?.focus();
        }
        if (navMenuOpen) {
          setNavMenuOpen(false);
          navButtonRef.current?.focus();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [navMenuOpen, accountMenuOpen]);

  const toggleNavMenu = () => {
    setNavMenuOpen((prev) => {
      if (!prev) setAccountMenuOpen(false);
      return !prev;
    });
  };

  const toggleAccountMenu = () => {
    setAccountMenuOpen((prev) => {
      if (!prev) setNavMenuOpen(false);
      return !prev;
    });
  };

  const handleLogout = async () => {
    setNavMenuOpen(false);
    setAccountMenuOpen(false);
    await logout();
    navigate('/login');
  };

  const getInitials = (u) => {
    if (!u) return 'U';
    const name = u.full_name || u.name;
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (u.email) {
      return u.email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getRoleLabel = (role) => {
    if (!role) return 'Student';
    if (role.toLowerCase() === 'admin') return 'Admin';
    return role.charAt(0).toUpperCase() + role.slice(1);
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
      setNavMenuOpen(false);

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
          <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center p-1 group-hover:scale-105 transition-transform overflow-hidden">
            <img src="/logo-mark.png" alt="Udaan AI" className="w-full h-full object-contain" />
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

        {/* Center: Curated Public Section Anchors (Inline on desktop) */}
        <nav aria-label="Main navigation" className="hidden lg:flex flex-1 items-center justify-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap text-slate-600 hover:text-[#005F60] hover:bg-slate-50 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#005F60] outline-none"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right Controls: Consistent 8–12px gaps and 40–44px control heights */}
        <div className="ml-auto flex shrink-0 items-center gap-2.5">
          {accountAction.isLoading ? (
            <div className="h-10 w-28 bg-slate-100 animate-pulse rounded-xl" aria-label="Loading session" />
          ) : user ? (
            <>
              {/* 1. Dashboard Button (Desktop & Tablet) */}
              <Link to={accountAction.destination} className="hidden md:inline-flex">
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={accountAction.isAdmin ? <Shield className="w-3.5 h-3.5" /> : <LayoutDashboard className="w-3.5 h-3.5" />}
                  className="h-10 bg-[#005F60] hover:bg-[#004D4E] text-white font-semibold whitespace-nowrap"
                >
                  {accountAction.label}
                </Button>
              </Link>

              {/* 2. Theme Toggle */}
              <ThemeToggle />

              {/* 3. Account Menu Button & Dropdown (Available at every width) */}
              <div className="relative">
                <button
                  ref={accountButtonRef}
                  type="button"
                  onClick={toggleAccountMenu}
                  aria-haspopup="menu"
                  aria-expanded={accountMenuOpen}
                  aria-controls="user-account-menu"
                  aria-label={`Account menu for ${user.full_name || user.email}`}
                  className={`inline-flex items-center gap-1.5 h-10 pl-1 pr-2 rounded-full border transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#005F60] ${
                    accountMenuOpen
                      ? 'border-[#005F60] bg-teal-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-[#005F60] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
                    {getInitials(user)}
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                      accountMenuOpen ? 'rotate-180 text-[#005F60]' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>

                {accountMenuOpen && (
                  <div
                    id="user-account-menu"
                    ref={accountMenuRef}
                    role="menu"
                    aria-label="Account options"
                    style={{ width: 'min(280px, calc(100vw - 32px))' }}
                    className="absolute right-0 top-full mt-2.5 z-50 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl p-3 flex flex-col gap-1"
                  >
                    {/* Signed-in user details */}
                    <div className="px-3 py-2 flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-sm text-slate-900 truncate">
                          {user.full_name || user.name || 'User'}
                        </span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase bg-teal-50 text-[#005F60] border border-teal-200/60 shrink-0">
                          {getRoleLabel(user.role)}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 truncate" title={user.email}>
                        {user.email}
                      </span>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-slate-100 my-1" role="separator" />

                    {/* Sign Out */}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 h-10 px-3 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500 outline-none w-full text-left"
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Guest Controls */}
              <div className="hidden md:flex items-center gap-2.5">
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
              </div>

              {/* Theme Toggle */}
              <ThemeToggle />
            </>
          )}

          {/* Mobile Navigation Trigger and Anchored Compact Panel */}
          <div className="relative lg:hidden">
            <button
              ref={navButtonRef}
              type="button"
              onClick={toggleNavMenu}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#005F60] outline-none"
              aria-label="Toggle Navigation Menu"
              aria-expanded={navMenuOpen}
              aria-controls="public-mobile-navigation"
            >
              {navMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {navMenuOpen && (
              <div
                id="public-mobile-navigation"
                ref={navMenuRef}
                style={{ width: 'min(360px, calc(100vw - 32px))' }}
                className="absolute right-0 top-full mt-2.5 z-50 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl p-4 flex flex-col gap-3 max-h-[calc(100dvh-88px)] overflow-y-auto"
              >
                <nav aria-label="Mobile navigation links" className="flex flex-col gap-1">
                  {navLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      onClick={(e) => handleNavClick(e, link.href)}
                      className="flex items-center h-[44px] px-3.5 rounded-xl text-sm font-semibold text-slate-700 hover:text-[#005F60] hover:bg-slate-50 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#005F60] outline-none"
                    >
                      {link.label}
                    </a>
                  ))}
                </nav>

                {/* Mobile actions when not visible in header */}
                {user ? (
                  <div className="md:hidden pt-3 border-t border-slate-100 flex flex-col gap-2">
                    <Link
                      to={accountAction.destination}
                      onClick={() => setNavMenuOpen(false)}
                      className="flex items-center justify-center gap-2 h-[44px] w-full px-4 rounded-xl bg-[#005F60] hover:bg-[#004D4E] text-white text-sm font-semibold shadow-xs transition-colors"
                    >
                      {accountAction.isAdmin ? <Shield className="w-4 h-4" /> : <LayoutDashboard className="w-4 h-4" />}
                      <span>{accountAction.label}</span>
                    </Link>
                  </div>
                ) : (
                  <div className="md:hidden pt-3 border-t border-slate-100 flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        to="/login"
                        onClick={() => setNavMenuOpen(false)}
                        className="flex items-center justify-center h-[44px] rounded-xl bg-slate-100 text-slate-800 text-sm font-semibold hover:bg-slate-200 transition-colors"
                      >
                        Login
                      </Link>
                      <Link
                        to={accountAction.destination}
                        onClick={() => setNavMenuOpen(false)}
                        className="flex items-center justify-center h-[44px] rounded-xl bg-[#E06D14] text-white text-sm font-semibold hover:bg-[#C2580E] transition-colors shadow-2xs"
                      >
                        {accountAction.label}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

