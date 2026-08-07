import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Reusable Badge component with enhanced high-contrast text ratios for WCAG 2.1 AA compliance.
 */
export const Badge = ({
  variant = 'neutral',
  size = 'md',
  dot = false,
  className,
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-bold rounded-full tracking-tight transition-colors select-none';

  const variants = {
    primary: 'bg-teal-50 text-[#004D4E] border border-teal-300',
    secondary: 'bg-orange-50 text-[#C2580E] border border-orange-300',
    success: 'bg-emerald-50 text-emerald-800 border border-emerald-300',
    warning: 'bg-amber-50 text-amber-900 border border-amber-300',
    error: 'bg-rose-50 text-rose-800 border border-rose-300',
    info: 'bg-blue-50 text-blue-800 border border-blue-300',
    neutral: 'bg-slate-100 text-slate-800 border border-slate-300',
  };

  const dotColors = {
    primary: 'bg-[#005F60]',
    secondary: 'bg-[#E06D14]',
    success: 'bg-emerald-600',
    warning: 'bg-amber-600',
    error: 'bg-rose-600',
    info: 'bg-blue-600',
    neutral: 'bg-slate-600',
  };

  const sizes = {
    sm: 'px-2.5 py-0.5 text-[11px] gap-1.5',
    md: 'px-3 py-1 text-xs gap-1.5',
  };

  return (
    <span
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])} />
      )}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
