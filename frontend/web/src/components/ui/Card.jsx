import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Minimal Card component with subcomponents.
 */
export const Card = ({ className, hoverable = false, children, ...props }) => {
  return (
    <div
      className={cn(
        'bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs transition-all duration-200',
        hoverable && 'hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ className, children, ...props }) => (
  <div className={cn('flex flex-col gap-1.5 mb-4', className)} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ className, children, ...props }) => (
  <h3 className={cn('text-lg font-bold text-slate-900 tracking-tight', className)} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ className, children, ...props }) => (
  <p className={cn('text-sm text-slate-500 leading-relaxed', className)} {...props}>
    {children}
  </p>
);

export const CardContent = ({ className, children, ...props }) => (
  <div className={cn('flex-1', className)} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ className, children, ...props }) => (
  <div className={cn('mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-4', className)} {...props}>
    {children}
  </div>
);

export default Card;
