import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Send, LogOut, User as UserIcon, LayoutDashboard, Menu, X, ChevronRight } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

/**
 * Modern, minimal Navbar component for Udaan AI public and marketing pages.
 * Enforces single clear primary CTA, clean wayfinding section anchors,
 * and responsive mobile drawer.
 */
export const Navbar = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Curated public navigation anchors mapped directly to homepage sections
  const navLinks = [
    { label: 'Pathways', href: '#pathways' },
    { label: 'How It Works', href: '#how-it-works' },
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
          ? 'bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs py-3' 
          : 'bg-white/80 backdrop-blur-xs py-4 border-b border-slate-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Left: Brand Logo & Tagline */}
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

        {/* Center: Curated Public Section Anchors */}
        <nav className="hidden lg:flex items-center space-x-1 bg-slate-100/90 p-1.5 rounded-xl border border-slate-200/80 backdrop-blur-xs">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="px-4 py-1.5 rounded-lg text-xs font-bold text-slate-800 hover:text-[#005F60] hover:bg-white transition-all cursor-pointer"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right: Focused Actions (One Clear Primary Action) */}
        <div className="hidden sm:flex items-center space-x-3">
          {user ? (
            <>
              <Link to={profile ? "/dashboard" : "/onboarding"}>
                <Button variant="primary" size="sm" leftIcon={<LayoutDashboard className="w-4 h-4" />}>
                  Dashboard
                </Button>
              </Link>

              <div className="flex items-center space-x-2 text-xs bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-800 font-bold">
                <UserIcon className="w-3.5 h-3.5 text-[#005F60]" />
                <span className="truncate max-w-[120px]">{user.full_name}</span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-rose-600 hover:bg-rose-50"
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
              <Link to="/register">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="bg-[#E06D14] hover:bg-[#C2580E] text-white shadow-2xs font-extrabold"
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-lg text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
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
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3.5 py-1">
              Navigation
            </span>
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="px-3.5 py-2.5 rounded-lg text-xs font-bold text-slate-800 hover:bg-teal-50 hover:text-[#005F60] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
              Account
            </span>
            {user ? (
              <Link
                to={profile ? "/dashboard" : "/onboarding"}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-lg bg-[#005F60] text-white text-xs font-bold shadow-xs flex items-center justify-center space-x-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Go to Dashboard</span>
              </Link>
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
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 rounded-lg bg-[#E06D14] text-white text-xs font-bold hover:bg-[#C2580E] transition-colors shadow-2xs"
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
