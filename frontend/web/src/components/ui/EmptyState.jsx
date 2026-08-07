import React from 'react';
import { cn } from '../../utils/cn';
import Button from './Button';

/**
 * Reusable EmptyState component.
 *
 * @param {Object} props
 * @param {React.ReactNode} [props.icon]
 * @param {string} props.title
 * @param {string} props.description
 * @param {string} [props.actionLabel]
 * @param {Function} [props.onAction]
 * @param {string} [props.className]
 */
export const EmptyState = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-white border border-dashed border-slate-300 rounded-2xl max-w-md mx-auto',
        className
      )}
      {...props}
    >
      {icon && (
        <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#005F60] flex items-center justify-center mb-4 shadow-2xs">
          {icon}
        </div>
      )}

      <h3 className="text-base font-bold text-slate-900 mb-1">
        {title}
      </h3>

      <p className="text-xs text-slate-500 max-w-xs leading-relaxed mb-6">
        {description}
      </p>

      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}

      {children}
    </div>
  );
};

export default EmptyState;
