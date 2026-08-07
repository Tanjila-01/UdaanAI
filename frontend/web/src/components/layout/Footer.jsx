import React from 'react';
import { Link } from 'react-router-dom';
import { Send, ShieldCheck, MapPin } from 'lucide-react';
import Badge from '../ui/Badge';

/**
 * Reusable Footer layout component adhering to Udaan AI Design Tokens.
 */
export const Footer = () => {
  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          
          {/* Col 1: Brand Information */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-[#005F60] flex items-center justify-center text-white">
                <Send className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">
                Udaan AI
              </span>
              <Badge variant="primary" size="sm">
                Karnataka
              </Badge>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
              AI-powered Career Exploration & Pathway Guidance Platform helping Karnataka students discover education pathways, future careers, and structured roadmaps.
            </p>

            <div className="flex items-center gap-2 text-xs text-slate-300 pt-1">
              <MapPin className="w-3.5 h-3.5 text-[#005F60]" />
              <span>Bengaluru, Karnataka, India</span>
            </div>
          </div>

          {/* Col 2: Target Education Streams */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Education Streams
            </h4>
            <ul className="flex flex-col gap-2.5 text-xs text-slate-300 font-medium">
              <li><a href="#pathways" className="hover:text-white transition-colors">Class 8–10 (SSLC)</a></li>
              <li><a href="#pathways" className="hover:text-white transition-colors">PUC Science (PCMB/PCMC)</a></li>
              <li><a href="#pathways" className="hover:text-white transition-colors">PUC Commerce (CEBA)</a></li>
              <li><a href="#pathways" className="hover:text-white transition-colors">Polytechnic Diploma</a></li>
              <li><a href="#pathways" className="hover:text-white transition-colors">ITI Vocational Trades</a></li>
            </ul>
          </div>

          {/* Col 3: Navigation */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Navigation
            </h4>
            <ul className="flex flex-col gap-2.5 text-xs text-slate-300 font-medium">
              <li><a href="#hero" className="hover:text-white transition-colors">Home</a></li>
              <li><a href="#pathways" className="hover:text-white transition-colors">Explore Pathways</a></li>
              <li><a href="#workshops" className="hover:text-white transition-colors">Career Workshops</a></li>
              <li><a href="#resources" className="hover:text-white transition-colors">Student Resources</a></li>
              <li><a href="#about" className="hover:text-white transition-colors">About Udaan AI</a></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Student Login</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Register Account</Link></li>
            </ul>
          </div>

          {/* Col 4: Trust & Academic Standard */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#005F60]" />
              <span>Academic Standards</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Aligned with KSEEB state board, DTE Karnataka polytechnic curriculum, and NCVT trade standards. Career guidance is advisory to empower informed student decisions.
            </p>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Udaan AI. All rights reserved.</p>
          <div className="flex items-center gap-6 text-slate-300 font-medium">
            <a href="#privacy" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#terms" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#support" className="hover:text-white transition-colors">Help & Support</a>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
