import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Reusable Linear ProgressBar component.
 *
 * @param {Object} props
 * @param {number} props.value - 0 to 100
 * @param {string} [props.label]
 * @param {boolean} [props.showPercentage=false]
 * @param {'sm' | 'md' | 'lg'} [props.size='md']
 * @param {'primary' | 'secondary' | 'success'} [props.variant='primary']
 * @param {string} [props.className]
 */
export const ProgressBar = ({
  value = 0,
  label,
  showPercentage = false,
  size = 'md',
  variant = 'primary',
  className,
  ...props
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const fills = {
    primary: 'bg-[#005F60]',
    secondary: 'bg-[#E06D14]',
    success: 'bg-emerald-500',
  };

  return (
    <div className={cn('w-full flex flex-col gap-1.5', className)} {...props}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          {label && <span>{label}</span>}
          {showPercentage && <span className="text-slate-500">{Math.round(clampedValue)}%</span>}
        </div>
      )}

      <div className={cn('w-full bg-slate-200 rounded-full overflow-hidden', heights[size])}>
        <div
          className={cn('h-full transition-all duration-500 ease-out rounded-full', fills[variant])}
          style={{ width: `${clampedValue}%` }}
          role="progressbar"
          aria-valuenow={clampedValue}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
