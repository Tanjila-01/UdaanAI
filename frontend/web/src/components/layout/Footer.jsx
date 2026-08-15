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
          <div className="lg:col-span-1 flex flex-col gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-[#005F60] flex items-center justify-center text-white">
                <Send className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">
                Udaan AI
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              AI-powered career exploration platform helping Karnataka students discover verified education routes, future careers, and structured roadmaps.
            </p>

            <div className="flex items-center gap-2 text-xs text-slate-300 pt-1">
              <MapPin className="w-3.5 h-3.5 text-[#005F60]" />
              <span>Bengaluru, Karnataka</span>
            </div>
          </div>

          {/* Col 2: Explore */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Explore
            </h4>
            <ul className="flex flex-col gap-2.5 text-xs text-slate-300 font-medium">
              <li><a href="#pathways" className="hover:text-white transition-colors">Explore Pathways</a></li>
              <li><a href="#capabilities" className="hover:text-white transition-colors">Career Exploration</a></li>
              <li><a href="#workshops" className="hover:text-white transition-colors">Workshops</a></li>
              <li><a href="#about" className="hover:text-white transition-colors">About Udaan AI</a></li>
            </ul>
          </div>

          {/* Col 3: For Students */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              For Students
            </h4>
            <ul className="flex flex-col gap-2.5 text-xs text-slate-300 font-medium">
              <li><Link to="/register" className="hover:text-white transition-colors">Start Your Journey</Link></li>
              <li><a href="#pathways" className="hover:text-white transition-colors">Explore Pathways</a></li>
              <li><a href="#roadmap" className="hover:text-white transition-colors">Career Roadmap</a></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Student Login</Link></li>
            </ul>
          </div>

          {/* Col 4: For Institutions */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              For Institutions
            </h4>
            <ul className="flex flex-col gap-2.5 text-xs text-slate-300 font-medium">
              <li><a href="#school-invitation" className="hover:text-white transition-colors">Register Your Institution</a></li>
              <li><a href="#workshops" className="hover:text-white transition-colors">Register for Workshop</a></li>
            </ul>
          </div>

          {/* Col 5: Trust & Governance */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#005F60]" />
              <span>Trust & Governance</span>
            </h4>
            <ul className="flex flex-col gap-2.5 text-xs text-slate-300 font-medium">
              <li><a href="#privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#terms" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#support" className="hover:text-white transition-colors">Support</a></li>
            </ul>
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
