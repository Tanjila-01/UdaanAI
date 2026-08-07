import React from 'react';
import { cn } from '../../utils/cn';
import Badge from '../ui/Badge';

/**
 * Reusable SectionHeader component for page sections.
 *
 * @param {Object} props
 * @param {string} [props.badge]
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {'left' | 'center' | 'right'} [props.align='left']
 * @param {string} [props.className]
 */
export const SectionHeader = ({
  badge,
  title,
  description,
  align = 'left',
  className,
  children,
  ...props
}) => {
  const alignments = {
    left: 'text-left items-start',
    center: 'text-center items-center mx-auto',
    right: 'text-right items-end ml-auto',
  };

  return (
    <div
      className={cn(
        'flex flex-col gap-3 mb-10 max-w-3xl',
        alignments[align],
        className
      )}
      {...props}
    >
      {badge && (
        <Badge variant="primary" dot size="sm">
          {badge}
        </Badge>
      )}

      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
        {title}
      </h2>

      {description && (
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
          {description}
        </p>
      )}

      {children}
    </div>
  );
};

export default SectionHeader;
