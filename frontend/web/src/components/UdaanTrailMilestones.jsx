import React from 'react';
import { Search, UserCheck, Compass, BookOpen, Target, CheckCircle2, ChevronRight } from 'lucide-react';

const UdaanTrailMilestones = ({ onStageClick }) => {
  const trailStages = [
    {
      stage: 1,
      name: 'Discover',
      tag: 'Education Level',
      desc: 'Identify current academic stage (SSLC, PUC, Diploma, ITI)',
      icon: Search,
      status: 'completed',
      route: '/dashboard',
    },
    {
      stage: 2,
      name: 'Understand Yourself',
      tag: 'Aptitude & Stream',
      desc: 'Take aptitude assessment & discover stream recommendations',
      icon: UserCheck,
      status: 'active',
      route: '/assessment',
    },
    {
      stage: 3,
      name: 'Explore Possibilities',
      tag: 'Path Explorer',
      desc: 'Discover SSLC, PUC Streams, Diploma & ITI trades',
      icon: Compass,
      status: 'upcoming',
      route: '/pathways',
    },
    {
      stage: 4,
      name: 'Build Skills',
      tag: 'Competencies',
      desc: 'Identify foundational skills & exam requirements',
      icon: BookOpen,
      status: 'upcoming',
      route: '/my-roadmap',
    },
    {
      stage: 5,
      name: 'Choose a Direction',
      tag: 'Track Selection',
      desc: 'Select preferred stream, institution, and career track',
      icon: Target,
      status: 'upcoming',
      route: '/my-roadmap',
    },
    {
      stage: 6,
      name: 'Achieve Your Goal',
      tag: 'Career Entry',
      desc: 'Higher education entry & future career milestones',
      icon: CheckCircle2,
      status: 'upcoming',
      route: '/my-roadmap',
    },
  ];

  return (
    <section className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 my-8 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-5 mb-6 gap-3">
        <div>
          <div className="inline-flex items-center space-x-2 text-[11px] font-bold text-[#005F60] bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#005F60]"></span>
            <span>Guided 6-Stage Journey System</span>
          </div>
          <h2 className="text-xl font-extrabold text-[#0F172A] tracking-tight">
            The Udaan Trail
          </h2>
          <p className="text-xs text-slate-500">
            Step-by-step career development framework from Class 8 through Class 12 & technical education.
          </p>
        </div>

        <span className="text-xs font-bold text-[#F97316] bg-orange-50 border border-orange-200 px-3.5 py-1 rounded-full self-start sm:self-auto">
          Stage 2 Active
        </span>
      </div>

      {/* Grid Trail Nodes (Full-width responsive flow, avoid card overload) */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {trailStages.map((s) => {
          const Icon = s.icon;
          const isActive = s.status === 'active';
          const isCompleted = s.status === 'completed';

          return (
            <button
              key={s.stage}
              type="button"
              onClick={() => onStageClick(s.route || s.name)}
              className={`text-left p-4 rounded-2xl border transition-all flex flex-col justify-between group cursor-pointer ${
                isActive
                  ? 'bg-orange-50/70 border-[#F97316]/50 ring-2 ring-[#F97316]/20 text-[#0F172A] shadow-xs'
                  : isCompleted
                  ? 'bg-teal-50/40 border-teal-200/80 text-slate-800'
                  : 'bg-[#F8FAF8] border-slate-200/60 hover:border-teal-300 text-slate-600 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-3 w-full">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition-transform group-hover:scale-105 ${
                  isActive
                    ? 'bg-[#F97316] text-white shadow-md shadow-[#F97316]/30'
                    : isCompleted
                    ? 'bg-[#005F60] text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                  isActive
                    ? 'bg-[#F97316] text-white'
                    : isCompleted
                    ? 'bg-teal-100 text-[#005F60]'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  Stage {s.stage}
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-xs text-[#0F172A] group-hover:text-[#005F60] leading-snug">
                  {s.name}
                </h3>
                <span className="text-[10px] text-slate-400 font-medium block mt-0.5">{s.tag}</span>
                <p className="text-[11px] text-slate-500 mt-1.5 leading-tight line-clamp-2">
                  {s.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default UdaanTrailMilestones;
