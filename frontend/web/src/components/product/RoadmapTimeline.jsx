import React from 'react';
import { cn } from '../../utils/cn';
import { CheckCircle2, Circle, ArrowRight, Clock, Award } from 'lucide-react';
import Badge from '../ui/Badge';

/**
 * Reusable RoadmapTimeline visualizer component.
 *
 * @param {Object} props
 * @param {Array<{stepNumber: number, title: string, description: string, status: 'completed' | 'active' | 'upcoming', tags?: Array<string>}>} props.steps
 * @param {string} [props.className]
 */
export const RoadmapTimeline = ({
  steps = [],
  className,
  ...props
}) => {
  return (
    <div className={cn('relative flex flex-col gap-6 py-2', className)} {...props}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const isCompleted = step.status === 'completed';
        const isActive = step.status === 'active';

        return (
          <div key={index} className="relative flex items-start gap-4 group">
            {/* Timeline Vertical Line */}
            {!isLast && (
              <div
                className={cn(
                  'absolute left-[19px] top-9 bottom-0 w-0.5 transition-colors',
                  isCompleted ? 'bg-[#005F60]' : 'bg-slate-200'
                )}
              />
            )}

            {/* Timeline Node Badge */}
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 z-10 transition-all duration-300',
                isCompleted
                  ? 'bg-[#005F60] text-white shadow-xs'
                  : isActive
                  ? 'bg-[#E06D14] text-white ring-4 ring-orange-100 shadow-sm'
                  : 'bg-slate-100 text-slate-500 border border-slate-300'
              )}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <span>{step.stepNumber || index + 1}</span>
              )}
            </div>

            {/* Timeline Step Content Card */}
            <div
              className={cn(
                'flex-1 bg-white border rounded-xl p-4 sm:p-5 shadow-xs transition-all duration-200',
                isActive
                  ? 'border-orange-300 ring-1 ring-orange-200 bg-orange-50/20'
                  : 'border-slate-200'
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <h4 className="text-sm sm:text-base font-bold text-slate-900">
                  {step.title}
                </h4>
                <Badge
                  variant={isCompleted ? 'success' : isActive ? 'secondary' : 'neutral'}
                  size="sm"
                >
                  {isCompleted ? 'Completed' : isActive ? 'In Progress' : 'Upcoming'}
                </Badge>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                {step.description}
              </p>

              {step.tags && step.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                  {step.tags.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RoadmapTimeline;
