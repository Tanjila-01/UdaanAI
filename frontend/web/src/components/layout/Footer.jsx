import React, { useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAccountAction } from '../../utils/accountActions';
import WorkshopRequestModal from '../product/WorkshopRequestModal';
import { Mail, Sparkles, ShieldCheck } from 'lucide-react';

/**
 * Reusable Footer layout component adhering to Udaan AI Design Tokens.
 * Features:
 * - Clean brand identity with Karnataka focus & verified inquiry channel
 * - 3 structured navigation groups (Explore, For Institutions, Account)
 * - Standard legal bar with genuine Privacy Policy and Terms of Service routes
 * - Session-aware account destinations via getAccountAction
 * - Native link behavior preserving modifier keys (Ctrl/Cmd/Shift)
 * - Touch-accessible links (min-h-[44px])
 * - Workshop modal integration with zero duplication on HomePage
 */
export const Footer = ({ onRequestWorkshop }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const accountAction = getAccountAction(user, profile, loading);

  // Standalone fallback modal state when Footer is used outside HomePage
  const [internalWorkshopOpen, setInternalWorkshopOpen] = useState(false);
  const workshopButtonRef = useRef(null);

  const handleWorkshopClick = (e) => {
    if (onRequestWorkshop) {
      onRequestWorkshop(e);
    } else {
      setInternalWorkshopOpen(true);
    }
  };

  const handleAnchorClick = (e, hash) => {
    // Preserve normal link behaviors for modifier keys and non-primary clicks (Ctrl/Cmd/Shift/Alt or right click)
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }

    const targetId = hash.replace('#', '');
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      Boolean(window.matchMedia('(prefers-reduced-motion: reduce)')?.matches);
    const behavior = prefersReducedMotion ? 'auto' : 'smooth';

    if (location.pathname === '/') {
      e.preventDefault();
      if (location.hash !== hash) {
        navigate({ pathname: '/', hash });
      }
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior });
      }
    }
  };

  const linkClasses =
    'inline-flex items-center min-h-[44px] py-1.5 text-xs text-slate-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-md';

  return (
    <footer className="relative bg-slate-950 text-slate-300 pt-12 pb-8 border-t border-slate-800/90 overflow-hidden">
      {/* Top subtle ambient glow line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#005F60]/60 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Main Grid: Standard 5-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 pb-10 border-b border-slate-800/80">
          
          {/* Col 1 & 2: Brand Information */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2 flex flex-col items-start gap-4">
            <Link
              to="/"
              aria-label="Udaan AI Home"
              className="inline-flex items-center space-x-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-xl"
            >
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-700/80 flex items-center justify-center p-1 shrink-0 group-hover:scale-105 transition-transform overflow-hidden shadow-xs">
                <img src="/logo-mark.png" alt="Udaan AI" className="w-full h-full object-contain" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl text-white tracking-tight">
                  Udaan AI
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-teal-950 text-teal-300 border border-teal-800/80 rounded-full">
                  Karnataka
                </span>
              </div>
            </Link>

            <p className="text-xs text-slate-300 leading-relaxed max-w-sm font-medium">
              Helping Karnataka students explore education options, understand their interests, and plan their next steps.
            </p>

            {/* Inquiries email badge */}
            <a
              href="mailto:connect.udaanai@gmail.com"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-800/90 px-3.5 py-2 rounded-xl border border-slate-800 transition-all group shadow-2xs"
            >
              <Mail className="w-3.5 h-3.5 text-teal-400 group-hover:scale-110 transition-transform" />
              <span>connect.udaanai@gmail.com</span>
            </a>
          </div>

          {/* Col 3: Explore */}
          <div className="col-span-1 flex flex-col gap-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Explore
            </h3>
            <ul className="flex flex-col text-xs font-medium">
              <li>
                <Link
                  to="/#how-it-works"
                  onClick={(e) => handleAnchorClick(e, '#how-it-works')}
                  className={linkClasses}
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  to="/#pathways"
                  onClick={(e) => handleAnchorClick(e, '#pathways')}
                  className={linkClasses}
                >
                  Explore Pathways
                </Link>
              </li>
              <li>
                <Link
                  to="/#udaan-ai"
                  onClick={(e) => handleAnchorClick(e, '#udaan-ai')}
                  className={linkClasses}
                >
                  Udaan AI
                </Link>
              </li>
              <li>
                <Link
                  to="/#workshops"
                  onClick={(e) => handleAnchorClick(e, '#workshops')}
                  className={linkClasses}
                >
                  Workshop Topics
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className={linkClasses}
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className={linkClasses}
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: For Institutions */}
          <div className="col-span-1 flex flex-col gap-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              For Institutions
            </h3>
            <ul className="flex flex-col text-xs font-medium">
              <li>
                <Link
                  to="/#school-invitation"
                  onClick={(e) => handleAnchorClick(e, '#school-invitation')}
                  className={linkClasses}
                >
                  For Schools &amp; Colleges
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  ref={workshopButtonRef}
                  onClick={handleWorkshopClick}
                  className={`${linkClasses} cursor-pointer text-left`}
                >
                  Request a Workshop
                </button>
              </li>
            </ul>
          </div>

          {/* Col 5: Account */}
          <div className="col-span-1 flex flex-col gap-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Account
            </h3>
            <ul className="flex flex-col text-xs font-medium">
              {accountAction.isLoading ? (
                <li className="min-h-[44px] flex items-center">
                  <span className="text-xs text-slate-400 italic">
                    Checking session...
                  </span>
                </li>
              ) : accountAction.isGuest ? (
                <>
                  <li>
                    <Link
                      to={accountAction.destination || '/register'}
                      className={linkClasses}
                    >
                      {accountAction.label}
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/login"
                      className={linkClasses}
                    >
                      Sign In
                    </Link>
                  </li>
                </>
              ) : (
                <li>
                  <Link
                    to={accountAction.destination || '/dashboard'}
                    className={linkClasses}
                  >
                    {accountAction.label}
                  </Link>
                </li>
              )}
            </ul>
          </div>

        </div>

        {/* Standard Website Bottom Bar: Copyright & Legal */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-2 text-center sm:text-left">
            <span>© {new Date().getFullYear()} Udaan AI. All rights reserved.</span>
            <span className="hidden sm:inline text-slate-700">•</span>
            <span className="text-slate-500">Karnataka Student Career Guidance</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 text-xs">
            <Link
              to="/privacy"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              to="/contact"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Contact
            </Link>
          </div>
        </div>

      </div>

      {/* Reusable Workshop Request Modal for standalone usage outside HomePage */}
      {!onRequestWorkshop && internalWorkshopOpen && (
        <WorkshopRequestModal
          isOpen={internalWorkshopOpen}
          onClose={() => {
            setInternalWorkshopOpen(false);
            setTimeout(() => {
              workshopButtonRef.current?.focus();
            }, 0);
          }}
          initialTopic="career_guidance"
        />
      )}
    </footer>
  );
};

export default Footer;
