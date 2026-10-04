import React, { useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAccountAction } from '../../utils/accountActions';
import WorkshopRequestModal from '../product/WorkshopRequestModal';
import {
  Mail,
  Sparkles,
  ArrowUp,
  Copy,
  Check,
  ChevronRight,
  School,
  ShieldCheck,
} from 'lucide-react';

/**
 * Premium Footer layout component adhering to Udaan AI Design Tokens.
 * Features:
 * - High-aesthetic dark glassmorphic design with ambient mesh lighting
 * - Balanced 3 structured navigation groups (Explore, For Institutions, Account)
 * - Informational institutional and student trust cards that eliminate empty space
 * - Interactive verified contact badge with one-click copy & feedback
 * - Operational platform status indicator
 * - Touch-accessible links with smooth micro-interactions (min-h-[44px])
 * - Session-aware account destinations via getAccountAction
 * - Smooth scroll-to-top action with reduced-motion support
 * - Preserves native link behavior for modifier keys (Ctrl/Cmd/Shift)
 * - Complete Workshop modal integration with standalone fallback
 */
export const Footer = ({ onRequestWorkshop }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const accountAction = getAccountAction(user, profile, loading);

  const [copiedEmail, setCopiedEmail] = useState(false);
  const [internalWorkshopOpen, setInternalWorkshopOpen] = useState(false);
  const workshopButtonRef = useRef(null);

  const handleCopyEmail = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText('connect.udaanai@gmail.com');
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2200);
      }
    } catch {
      // Fallback: clipboard permission denied
    }
  };

  const handleWorkshopClick = (e) => {
    if (onRequestWorkshop) {
      onRequestWorkshop(e);
    } else {
      setInternalWorkshopOpen(true);
    }
  };

  const handleScrollToTop = () => {
    if (typeof window !== 'undefined') {
      const prefersReducedMotion =
        typeof window.matchMedia === 'function' &&
        Boolean(window.matchMedia('(prefers-reduced-motion: reduce)')?.matches);
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }
  };

  const handleAnchorClick = (e, hash) => {
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
    'group inline-flex items-center min-h-[44px] py-1 text-xs text-slate-300 hover:text-teal-300 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-md';

  return (
    <footer className="relative bg-slate-950 text-slate-300 pt-8 pb-6 border-t border-slate-800/80 overflow-hidden selection:bg-teal-500/20 selection:text-teal-200">
      {/* Ambient Lighting & Depth Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Top radial gradient light pool */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[340px] bg-gradient-to-b from-teal-500/15 via-[#005F60]/10 to-transparent rounded-full blur-3xl opacity-60" />
        {/* Subtle warm accent glow */}
        <div className="absolute -bottom-24 -right-16 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl" />
        {/* Glowing border accents */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-teal-400/50 to-transparent" />
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-teal-500/20 to-transparent blur-xs" />
        {/* Micro-dot texture overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Main Grid: Standard 5-column layout with balanced content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-7 lg:gap-8 pb-7 border-b border-slate-800/70">
          
          {/* Col 1 & 2: Brand Information (spans 2 columns) */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2 flex flex-col items-start gap-4 pr-0 lg:pr-6">
            <Link
              to="/"
              aria-label="Udaan AI Home"
              className="inline-flex items-center space-x-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-xl"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white to-slate-100 border border-slate-700/80 flex items-center justify-center p-1.5 shrink-0 group-hover:scale-105 group-hover:border-teal-400/50 transition-all duration-200 shadow-sm shadow-teal-950/30">
                <img src="/logo-mark.png" alt="Udaan AI" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xl text-white tracking-tight">
                    Udaan AI
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold bg-teal-950/90 text-teal-300 border border-teal-700/50 rounded-full shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                    Karnataka
                  </span>
                </div>
                <span className="text-[11px] text-teal-400/90 font-medium tracking-wide">
                  Explore Today. Build Tomorrow.
                </span>
              </div>
            </Link>

            <p className="text-xs text-slate-300 leading-relaxed max-w-sm font-medium">
              Helping Karnataka students explore education options, understand their interests, and plan their next steps.
            </p>

            {/* Inquiries email badge with one-click copy */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <a
                href="mailto:connect.udaanai@gmail.com"
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-900/90 hover:bg-slate-800/90 px-3 py-2 rounded-xl border border-slate-800 hover:border-teal-500/40 transition-all duration-150 group shadow-2xs"
              >
                <Mail className="w-3.5 h-3.5 text-teal-400 group-hover:scale-110 transition-transform" />
                <span>connect.udaanai@gmail.com</span>
              </a>

              <button
                type="button"
                onClick={handleCopyEmail}
                aria-label="Copy email to clipboard"
                className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-slate-400 hover:text-teal-300 bg-slate-900/80 hover:bg-slate-800 rounded-xl border border-slate-800/90 hover:border-teal-500/40 transition-all cursor-pointer"
                title="Copy email to clipboard"
              >
                {copiedEmail ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px] text-emerald-400 font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[11px] hidden sm:inline">Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Platform indicator */}
            <div className="inline-flex items-center gap-2 text-[11px] text-slate-500 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
              <span>Built for Karnataka students</span>
            </div>
          </div>

          {/* Col 3: Explore */}
          <div className="col-span-1 flex flex-col gap-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
              Explore
            </h3>
            <ul className="flex flex-col text-xs font-medium space-y-0.5">
              <li>
                <Link
                  to="/#how-it-works"
                  onClick={(e) => handleAnchorClick(e, '#how-it-works')}
                  className={linkClasses}
                >
                  <span className="transition-transform duration-200 group-hover:translate-x-1 flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 text-teal-400/60 group-hover:text-teal-300 transition-colors" />
                    How It Works
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  to="/#pathways"
                  onClick={(e) => handleAnchorClick(e, '#pathways')}
                  className={linkClasses}
                >
                  <span className="transition-transform duration-200 group-hover:translate-x-1 flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 text-teal-400/60 group-hover:text-teal-300 transition-colors" />
                    Explore Pathways
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  to="/#udaan-ai"
                  onClick={(e) => handleAnchorClick(e, '#udaan-ai')}
                  className={linkClasses}
                >
                  <span className="transition-transform duration-200 group-hover:translate-x-1 flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 text-teal-400/60 group-hover:text-teal-300 transition-colors" />
                    Udaan AI
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  to="/#workshops"
                  onClick={(e) => handleAnchorClick(e, '#workshops')}
                  className={linkClasses}
                >
                  <span className="transition-transform duration-200 group-hover:translate-x-1 flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 text-teal-400/60 group-hover:text-teal-300 transition-colors" />
                    Workshop Topics
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className={linkClasses}
                >
                  <span className="transition-transform duration-200 group-hover:translate-x-1 flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 text-teal-400/60 group-hover:text-teal-300 transition-colors" />
                    About Us
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className={linkClasses}
                >
                  <span className="transition-transform duration-200 group-hover:translate-x-1 flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 text-teal-400/60 group-hover:text-teal-300 transition-colors" />
                    Contact Us
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: For Institutions */}
          <div className="col-span-1 flex flex-col gap-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
              For Institutions
            </h3>
            <ul className="flex flex-col text-xs font-medium space-y-0.5 min-h-[90px]">
              <li>
                <Link
                  to="/#school-invitation"
                  onClick={(e) => handleAnchorClick(e, '#school-invitation')}
                  className={linkClasses}
                >
                  <span className="transition-transform duration-200 group-hover:translate-x-1 flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 text-teal-400/60 group-hover:text-teal-300 transition-colors" />
                    For Schools &amp; Colleges
                  </span>
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  ref={workshopButtonRef}
                  onClick={handleWorkshopClick}
                  className={`${linkClasses} cursor-pointer text-left w-full`}
                >
                  <span className="transition-transform duration-200 group-hover:translate-x-1 flex items-center gap-1.5 text-teal-300 font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                    Request a Workshop
                  </span>
                </button>
              </li>
            </ul>

            {/* Institutional Information Card */}
            <div className="mt-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[10.5px] text-slate-400 leading-relaxed shadow-xs min-h-[72px] flex flex-col justify-center">
              <div className="flex items-center gap-1.5 font-semibold text-slate-300 mb-1">
                <School className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Institutional Reach</span>
              </div>
              <p>Career guidance workshops for schools and PU colleges.</p>
            </div>
          </div>

          {/* Col 5: Account */}
          <div className="col-span-1 flex flex-col gap-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
              Account
            </h3>
            <ul className="flex flex-col text-xs font-medium space-y-0.5 min-h-[90px]">
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
                      <span className="transition-transform duration-200 group-hover:translate-x-1 flex items-center gap-1.5">
                        <ChevronRight className="w-3 h-3 text-teal-400/60 group-hover:text-teal-300 transition-colors" />
                        {accountAction.label}
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/login"
                      className={linkClasses}
                    >
                      <span className="transition-transform duration-200 group-hover:translate-x-1 flex items-center gap-1.5">
                        <ChevronRight className="w-3 h-3 text-teal-400/60 group-hover:text-teal-300 transition-colors" />
                        Sign In
                      </span>
                    </Link>
                  </li>
                </>
              ) : (
                <li>
                  <Link
                    to={accountAction.destination || '/dashboard'}
                    className={linkClasses}
                  >
                    <span className="transition-transform duration-200 group-hover:translate-x-1 flex items-center gap-1.5">
                      <ChevronRight className="w-3 h-3 text-teal-400/60 group-hover:text-teal-300 transition-colors" />
                      {accountAction.label}
                    </span>
                  </Link>
                </li>
              )}
            </ul>

            {/* Student Trust & Ethics Card */}
            <div className="mt-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[10.5px] text-slate-400 leading-relaxed shadow-xs min-h-[72px] flex flex-col justify-center">
              <div className="flex items-center gap-1.5 font-semibold text-slate-300 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Student First</span>
              </div>
              <p>Clear guidance focused on student interests and goals.</p>
            </div>
          </div>

        </div>

        {/* Website Bottom Bar: Copyright, Legal & Back to Top */}
        <div className="pt-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-center md:text-left">
            <span>© {new Date().getFullYear()} Udaan AI. All rights reserved.</span>
            <span className="hidden sm:inline text-slate-700">•</span>
            <span className="text-slate-400 font-medium">Karnataka Student Career Guidance</span>
            <span className="hidden lg:inline text-slate-700">•</span>
            <span className="hidden lg:inline text-slate-500">Explore Today. Build Tomorrow.</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 text-xs">
            <Link
              to="/privacy"
              className="text-slate-400 hover:text-white transition-colors py-1"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="text-slate-400 hover:text-white transition-colors py-1"
            >
              Terms of Service
            </Link>
            <Link
              to="/contact"
              className="text-slate-400 hover:text-white transition-colors py-1"
            >
              Contact
            </Link>

            {/* Back to top smooth button */}
            <button
              type="button"
              onClick={handleScrollToTop}
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-teal-300 bg-slate-900/80 hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-800 hover:border-slate-700 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
              title="Scroll to top of page"
              aria-label="Back to top"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold">Top</span>
            </button>
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
