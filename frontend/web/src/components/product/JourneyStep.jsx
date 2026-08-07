import React from 'react';
import { cn } from '../../utils/cn';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import Badge from '../ui/Badge';

/**
 * Reusable JourneyStep component displaying individual milestones in student's roadmap.
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {string} props.subtitle
 * @param {'completed' | 'active' | 'upcoming'} [props.status='upcoming']
 * @param {React.ReactNode} [props.icon]
 * @param {string} [props.className]
 */
export const JourneyStep = ({
  title,
  subtitle,
  status = 'upcoming',
  icon,
  className,
  ...props
}) => {
  const isCompleted = status === 'completed';
  const isActive = status === 'active';

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 bg-white',
        isCompleted && 'border-emerald-200 bg-emerald-50/30',
        isActive && 'border-[#005F60] ring-1 ring-[#005F60]/20 shadow-xs',
        status === 'upcoming' && 'border-slate-200 text-slate-500 opacity-80',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-xs',
          isCompleted && 'bg-emerald-500 text-white',
          isActive && 'bg-[#005F60] text-white',
          status === 'upcoming' && 'bg-slate-100 text-slate-400 border border-slate-300'
        )}
      >
        {isCompleted ? (
          <CheckCircle2 className="w-5 h-5" />
        ) : icon ? (
          icon
        ) : (
          <Circle className="w-4 h-4" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-slate-900 truncate">{title}</h4>
        <p className="text-xs text-slate-500 truncate">{subtitle}</p>
      </div>

      <Badge
        variant={isCompleted ? 'success' : isActive ? 'primary' : 'neutral'}
        size="sm"
      >
        {isCompleted ? 'Done' : isActive ? 'In Progress' : 'Upcoming'}
      </Badge>
    </div>
  );
};

export default JourneyStep;
