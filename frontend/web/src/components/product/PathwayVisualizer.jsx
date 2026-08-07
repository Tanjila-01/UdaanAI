import React, { useState } from 'react';
import { cn } from '../../utils/cn';
import CareerNode from './CareerNode';
import Tag from '../ui/Tag';
import { GraduationCap, BookOpen, ArrowRight, Sparkles } from 'lucide-react';

/**
 * Reusable PathwayVisualizer component for interactive education branch navigation (Class 10 -> PUC / Diploma / ITI).
 */
export const PathwayVisualizer = ({ className }) => {
  const [activeBranch, setActiveBranch] = useState('PUC');

  const branches = [
    {
      id: 'PUC',
      title: 'Pre-University College (PUC)',
      duration: '2 Years (11th & 12th)',
      description: 'Academic stream preparation for university degrees (Engineering, Medicine, Commerce, Law, Pure Sciences).',
      subTracks: ['Science (PCMB/PCMC)', 'Commerce (CEBA/SEBA)', 'Arts & Humanities'],
      skills: ['Physics', 'Mathematics', 'Economics', 'Computer Science'],
    },
    {
      id: 'Diploma',
      title: 'Polytechnic Diploma',
      duration: '3 Years (Practical Technical)',
      description: 'Hands-on technical engineering education with direct 2nd-year B.Tech lateral entry upon completion.',
      subTracks: ['Computer Science & Eng', 'Electronics & Comm', 'Mechanical & Automation'],
      skills: ['Programming', 'CAD Design', 'Circuit Design', 'Robotics'],
    },
    {
      id: 'ITI',
      title: 'ITI Vocational Trades',
      duration: '1 - 2 Years (Skill Certification)',
      description: 'Job-oriented industrial trade training under NCVT certification for early technical career entry.',
      subTracks: ['Electrician Trade', 'Electronic Mechanic', 'Fitter & Machinist'],
      skills: ['Electrical Wiring', 'Hardware Repair', 'Industrial Assembly'],
    },
  ];

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {/* Branch Selection Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/80 rounded-xl border border-slate-200/60">
        {branches.map((branch) => (
          <button
            key={branch.id}
            type="button"
            onClick={() => setActiveBranch(branch.id)}
            className={cn(
              'px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer select-none',
              activeBranch === branch.id
                ? 'bg-[#005F60] text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
            )}
          >
            {branch.title}
          </button>
        ))}
      </div>

      {/* Grid of Career Nodes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {branches.map((branch) => (
          <CareerNode
            key={branch.id}
            id={branch.id}
            title={branch.title}
            duration={branch.duration}
            description={branch.description}
            subTracks={branch.subTracks}
            skills={branch.skills}
            isSelected={activeBranch === branch.id}
            onSelect={() => setActiveBranch(branch.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default PathwayVisualizer;
