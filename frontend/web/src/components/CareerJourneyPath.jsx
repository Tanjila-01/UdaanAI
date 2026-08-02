import React from 'react';
import { Compass, Search, Map, Target, CheckCircle2 } from 'lucide-react';

const CareerJourneyPath = ({ onStepClick }) => {
  const steps = [
    {
      number: 1,
      title: 'Discover Yourself',
      desc: 'Assess interests, skills & preferred subjects',
      icon: Search,
      status: 'current', // current milestone
    },
    {
      number: 2,
      title: 'Explore Careers',
      desc: 'Karnataka PUC, Diploma, ITI & Skill routes',
      icon: Compass,
      status: 'next',
    },
    {
      number: 3,
      title: 'Build Your Roadmap',
      desc: 'Step-by-step post-Class 10 action plan',
      icon: Map,
      status: 'upcoming',
    },
    {
      number: 4,
      title: 'Achieve Your Goals',
      desc: 'Higher studies, exams & career entry',
      icon: Target,
      status: 'upcoming',
    },
  ];

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 my-6 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-6">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
            Your Guided Career Journey
          </h2>
          <p className="text-xs text-slate-500">
            Four step-by-step milestones from Class 8–12 toward your career goals.
          </p>
        </div>
        <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full self-start sm:self-auto mt-2 sm:mt-0">
          Step 1 of 4 Active
        </span>
      </div>

      {/* Horizontal Connected Timeline */}
      <div className="relative py-4">
        {/* Connecting Line Behind Circles */}
        <div className="hidden md:block absolute top-1/2 left-12 right-12 h-1 bg-slate-200 -translate-y-1/2 z-0"></div>
        <div className="hidden md:block absolute top-1/2 left-12 w-1/4 h-1 bg-orange-500 -translate-y-1/2 z-0"></div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
          {steps.map((step) => {
            const Icon = step.icon;
            const isCurrent = step.status === 'current';

            return (
              <button
                key={step.number}
                type="button"
                onClick={() => onStepClick(step.title)}
                className={`text-left p-4 rounded-xl border transition-all flex flex-col justify-between group ${
                  isCurrent
                    ? 'bg-orange-50/60 border-orange-300 ring-2 ring-orange-500/20 text-slate-900 shadow-sm'
                    : 'bg-slate-50/40 border-slate-200 hover:border-teal-300 text-slate-700 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-transform group-hover:scale-105 ${
                    isCurrent
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                      : 'bg-teal-800 text-white'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded ${
                    isCurrent ? 'bg-orange-100 text-orange-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    Milestone {step.number}
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-teal-900">
                    {step.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    {step.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CareerJourneyPath;
