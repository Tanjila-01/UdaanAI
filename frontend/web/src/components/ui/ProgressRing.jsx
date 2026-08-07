import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Reusable Circular ProgressRing component.
 *
 * @param {Object} props
 * @param {number} props.value - 0 to 100
 * @param {number} [props.size=64]
 * @param {number} [props.strokeWidth=6]
 * @param {string} [props.className]
 */
export const ProgressRing = ({
  value = 0,
  size = 64,
  strokeWidth = 6,
  className,
  children,
  ...props
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      {...props}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200"
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-[#005F60] transition-all duration-500 ease-out"
          fill="transparent"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-800">
        {children !== undefined ? children : `${Math.round(clampedValue)}%`}
      </div>
    </div>
  );
};

export default ProgressRing;
