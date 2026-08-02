import React from 'react';
import { Compass, Sparkles, ArrowRight, Flag, Sun } from 'lucide-react';

const MountainHero = ({ onExploreClick, onAssessmentClick }) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-teal-950 via-teal-900 to-slate-950 text-white rounded-3xl p-8 sm:p-12 shadow-2xl border border-teal-800/40 my-6">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left Column: Text & CTAs */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center space-x-2 text-xs font-extrabold px-3.5 py-1.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30 backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-orange-400" />
            <span>Karnataka Student Career Platform</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Explore. Plan. <br className="hidden sm:inline" />
            <span className="text-orange-400 underline decoration-orange-500/40 underline-offset-8">
              Achieve Your Dreams.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
            Get AI-powered career insights, personalized roadmaps, and useful resources to build your future after Class 10 and PUC.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              onClick={onExploreClick}
              className="inline-flex items-center space-x-2 bg-orange-600 hover:bg-orange-500 text-white px-6 py-3.5 rounded-xl font-extrabold text-sm transition-all shadow-lg shadow-orange-600/30 hover:scale-102"
            >
              <Compass className="w-4 h-4" />
              <span>Explore Careers</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onAssessmentClick}
              className="inline-flex items-center space-x-2 bg-teal-800/80 hover:bg-teal-700/80 text-teal-100 border border-teal-600/50 px-6 py-3.5 rounded-xl font-bold text-sm transition-colors backdrop-blur-md"
            >
              <Sparkles className="w-4 h-4 text-teal-300" />
              <span>Take AI Assessment</span>
            </button>
          </div>
        </div>

        {/* Right Column: Animated SVG Mountain & Career Journey Scene */}
        <div className="lg:col-span-5 relative flex justify-center items-center">
          <style>{`
            @keyframes floatCloud {
              0%, 100% { transform: translateX(0px); }
              50% { transform: translateX(18px); }
            }
            @keyframes waveFlag {
              0%, 100% { transform: rotate(0deg); }
              50% { transform: rotate(8deg); }
            }
            @keyframes pulseLight {
              0%, 100% { opacity: 0.3; transform: scale(1); }
              50% { opacity: 0.9; transform: scale(1.3); }
            }
            @keyframes moveLeaves {
              0%, 100% { transform: rotate(0deg); }
              50% { transform: rotate(-6deg); }
            }

            .anim-cloud { animation: floatCloud 8s ease-in-out infinite; }
            .anim-flag { animation: waveFlag 3s ease-in-out infinite; transform-origin: bottom left; }
            .anim-pulse { animation: pulseLight 3s ease-in-out infinite; }
            .anim-leaf { animation: moveLeaves 5s ease-in-out infinite; transform-origin: bottom center; }

            @media (prefers-reduced-motion: reduce) {
              .anim-cloud, .anim-flag, .anim-pulse, .anim-leaf {
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
            {/* Sky Background Elements */}
            <circle cx="410" cy="70" r="35" fill="#F97316" opacity="0.2" className="anim-pulse" />
            <circle cx="410" cy="70" r="22" fill="#F97316" opacity="0.4" />

            {/* Drifting Clouds */}
            <g className="anim-cloud" opacity="0.7">
              <path d="M60 90 Q75 75 95 85 Q115 70 135 85 Q145 90 145 100 L60 100 Z" fill="#99F6E4" opacity="0.2" />
              <path d="M290 60 Q305 45 325 55 Q345 40 365 55 Q375 60 375 70 L290 70 Z" fill="#99F6E4" opacity="0.25" />
            </g>

            {/* Layer 1: Background Distant Mountains */}
            <polygon points="40,320 160,160 280,320" fill="#0D5C5C" opacity="0.5" />
            <polygon points="220,320 360,140 480,320" fill="#0A4C4C" opacity="0.6" />

            {/* Layer 2: Main Majestic Summit Mountain */}
            <polygon points="100,350 260,110 420,350" fill="#005F60" />
            <polygon points="260,110 320,195 420,350" fill="#004D4E" opacity="0.7" />

            {/* Mountain Snow Cap / Light Peak */}
            <polygon points="260,110 230,150 260,145 290,150" fill="#2DD4BF" opacity="0.9" />

            {/* Summit Goal Flag (Warm Orange) */}
            <g transform="translate(260, 105)">
              <line x1="0" y1="0" x2="0" y2="-30" stroke="#F97316" strokeWidth="3" strokeLinecap="round" />
              <path 
                d="M0 -30 L22 -20 L0 -10 Z" 
                fill="#F97316" 
                className="anim-flag"
              />
              <circle cx="0" cy="-30" r="3" fill="#FFE4E6" />
            </g>

            {/* Layer 3: Foreground Winding Path */}
            <path 
              d="M80 370 C 140 360, 160 310, 210 280 C 250 250, 220 200, 260 115" 
              stroke="#F97316" 
              strokeWidth="4" 
              strokeDasharray="6 6"
              fill="none" 
              opacity="0.85"
            />

            {/* Winding Path Progress Indicator Nodes */}
            <circle cx="110" cy="355" r="5" fill="#2DD4BF" />
            <circle cx="170" cy="300" r="6" fill="#2DD4BF" />
            <circle cx="225" cy="245" r="7" fill="#F97316" className="anim-pulse" />

            {/* Layer 4: Foreground Landscape Hills */}
            <path d="M0 380 Q 150 330 300 370 Q 420 340 500 380 L500 400 L0 400 Z" fill="#043838" />

            {/* Student Figure Beginning Journey */}
            <g transform="translate(100, 325)">
              {/* Head */}
              <circle cx="10" cy="5" r="5" fill="#F97316" />
              {/* Body */}
              <path d="M10 10 L10 24 M5 16 L15 16 M10 24 L5 34 M10 24 L15 34" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
              {/* Backpack */}
              <rect x="3" y="12" width="5" height="10" rx="2" fill="#2DD4BF" />
            </g>

            {/* Foreground Plants / Leaves */}
            <g className="anim-leaf" transform="translate(40, 350)">
              <path d="M0 25 Q 10 5 20 25" stroke="#2DD4BF" strokeWidth="3" fill="none" />
              <path d="M10 25 Q 20 0 30 25" stroke="#14B8A6" strokeWidth="3" fill="none" />
            </g>
          </svg>
        </div>

      </div>
    </section>
  );
};

export default MountainHero;
