import React from 'react';
import { Compass, Sparkles, ArrowRight, Flag, Sun, MapPin } from 'lucide-react';

const UdaanTrailHero = ({ onExploreClick, onAssessmentClick }) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#004D4E] via-[#005F60] to-[#0F172A] text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-teal-800/40 my-6">
      {/* Background Soft Atmospheric Glows */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-96 h-96 bg-[#F97316]/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left Column: Text & CTAs */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center space-x-2 text-xs font-extrabold px-3.5 py-1.5 rounded-full bg-teal-500/20 text-teal-200 border border-teal-400/30 backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-[#F97316]" />
            <span>The Udaan Trail — Karnataka Student Pathway</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Discover Your Path. <br className="hidden sm:inline" />
            <span className="text-[#F97316] underline decoration-[#F97316]/40 underline-offset-8">
              Achieve Your Dream.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-200 max-w-xl leading-relaxed">
            Navigate your education journey from Class 8–10 and PUC to Diploma, ITI, and higher skill careers in Karnataka.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              onClick={onExploreClick}
              className="inline-flex items-center space-x-2 bg-[#F97316] hover:bg-orange-500 text-white px-6 py-3.5 rounded-xl font-extrabold text-sm transition-all shadow-lg shadow-[#F97316]/30 hover:scale-102 cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>Explore Pathways</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onAssessmentClick}
              className="inline-flex items-center space-x-2 bg-teal-800/80 hover:bg-teal-700/80 text-teal-100 border border-teal-600/50 px-6 py-3.5 rounded-xl font-bold text-sm transition-colors backdrop-blur-md cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-teal-300" />
              <span>Self-Discovery Assessment</span>
            </button>
          </div>
        </div>

        {/* Right Column: Custom SVG "The Udaan Trail" Landscape */}
        <div className="lg:col-span-5 relative flex justify-center items-center">
          <style>{`
            @keyframes floatCloud {
              0%, 100% { transform: translateX(0px); }
              50% { transform: translateX(16px); }
            }
            @keyframes waveFlag {
              0%, 100% { transform: rotate(0deg); }
              50% { transform: rotate(6deg); }
            }
            @keyframes pulseTrailNode {
              0%, 100% { transform: scale(1); opacity: 0.8; }
              50% { transform: scale(1.25); opacity: 1; }
            }

            .anim-cloud-slow { animation: floatCloud 9s ease-in-out infinite; }
            .anim-flag-wave { animation: waveFlag 3.5s ease-in-out infinite; transform-origin: bottom left; }
            .anim-node-pulse { animation: pulseTrailNode 2.5s ease-in-out infinite; transform-origin: center; }

            @media (prefers-reduced-motion: reduce) {
              .anim-cloud-slow, .anim-flag-wave, .anim-node-pulse {
                animation: none !important;
              }
            }
          `}</style>

          <svg 
            viewBox="0 0 500 400" 
            className="w-full max-w-md h-auto drop-shadow-2xl overflow-visible"
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Atmospheric Sun / Glow */}
            <circle cx="420" cy="65" r="32" fill="#F97316" opacity="0.25" className="anim-node-pulse" />
            <circle cx="420" cy="65" r="20" fill="#F97316" opacity="0.45" />

            {/* Drifting Sky Clouds */}
            <g className="anim-cloud-slow" opacity="0.7">
              <path d="M50 85 Q65 70 85 80 Q105 65 125 80 Q135 85 135 95 L50 95 Z" fill="#CCFBF1" opacity="0.25" />
              <path d="M280 55 Q295 40 315 50 Q335 35 355 50 Q365 55 365 65 L280 65 Z" fill="#CCFBF1" opacity="0.3" />
            </g>

            {/* Background Rolling Hills & Mountains */}
            <polygon points="30,330 150,170 270,330" fill="#0A4C4C" opacity="0.5" />
            <polygon points="210,330 350,130 470,330" fill="#043838" opacity="0.7" />

            {/* Main Summit Peak */}
            <polygon points="90,360 250,100 410,360" fill="#005F60" />
            <polygon points="250,100 310,185 410,360" fill="#004D4E" opacity="0.75" />

            {/* Summit Peak Cap */}
            <polygon points="250,100 220,140 250,135 280,140" fill="#2DD4BF" opacity="0.9" />

            {/* Summit Warm Orange Achievement Flag */}
            <g transform="translate(250, 95)">
              <line x1="0" y1="0" x2="0" y2="-28" stroke="#F97316" strokeWidth="3" strokeLinecap="round" />
              <path 
                d="M0 -28 L22 -18 L0 -8 Z" 
                fill="#F97316" 
                className="anim-flag-wave"
              />
              <circle cx="0" cy="-28" r="3.5" fill="#FFF" />
            </g>

            {/* "The Udaan Trail" Winding Path */}
            <path 
              d="M75 375 C 135 365, 155 315, 205 285 C 245 255, 215 195, 250 105" 
              stroke="#F97316" 
              strokeWidth="4" 
              strokeDasharray="7 5"
              fill="none" 
              opacity="0.9"
            />

            {/* Milestone Trail Nodes */}
            <circle cx="105" cy="360" r="5.5" fill="#2DD4BF" />
            <circle cx="165" cy="305" r="6" fill="#2DD4BF" />
            <circle cx="220" cy="250" r="7" fill="#F97316" className="anim-node-pulse" />

            {/* Foreground Landscape */}
            <path d="M0 380 Q 150 335 300 375 Q 420 345 500 385 L500 400 L0 400 Z" fill="#032D2D" />

            {/* Student Traveler figure */}
            <g transform="translate(95, 330)">
              <circle cx="10" cy="5" r="5" fill="#F97316" />
              <path d="M10 10 L10 24 M5 16 L15 16 M10 24 L5 34 M10 24 L15 34" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
              <rect x="3" y="12" width="5" height="10" rx="2" fill="#2DD4BF" />
            </g>
          </svg>
        </div>

      </div>
    </section>
  );
};

export default UdaanTrailHero;
