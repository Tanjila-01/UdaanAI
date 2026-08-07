import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Reusable Divider component.
 *
 * @param {Object} props
 * @param {'horizontal' | 'vertical'} [props.orientation='horizontal']
 * @param {string} [props.label]
 * @param {string} [props.className]
 */
export const Divider = ({
  orientation = 'horizontal',
  label,
  className,
  ...props
}) => {
  if (orientation === 'vertical') {
    return (
      <div
        className={cn('w-px bg-slate-200 self-stretch my-1', className)}
        role="separator"
        aria-orientation="vertical"
        {...props}
      />
    );
  }

  if (label) {
    return (
      <div className={cn('relative flex items-center my-6', className)} {...props}>
        <div className="flex-grow border-t border-slate-200" />
        <span className="shrink-0 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">
          {label}
        </span>
        <div className="flex-grow border-t border-slate-200" />
      </div>
    );
  }

  return (
    <hr
      className={cn('border-t border-slate-200/80 my-6 w-full', className)}
      {...props}
    />
  );
};

export default Divider;
