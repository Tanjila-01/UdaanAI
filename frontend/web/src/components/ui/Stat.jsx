import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Reusable Stat component for displaying key platform metrics.
 *
 * @param {Object} props
 * @param {string} props.label
 * @param {string | number} props.value
 * @param {string} [props.subtitle]
 * @param {React.ReactNode} [props.icon]
 * @param {string} [props.trend]
 * @param {boolean} [props.positiveTrend=true]
 * @param {string} [props.className]
 */
export const Stat = ({
  label,
  value,
  subtitle,
  icon,
  trend,
  positiveTrend = true,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs flex flex-col justify-between gap-3',
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </span>
        {icon && (
          <div className="p-2 rounded-lg bg-teal-50 text-[#005F60]">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              'text-xs font-bold px-1.5 py-0.5 rounded',
              positiveTrend
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-rose-50 text-rose-700'
            )}
          >
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-slate-500">{subtitle}</p>
      )}
    </div>
  );
};

export default Stat;
