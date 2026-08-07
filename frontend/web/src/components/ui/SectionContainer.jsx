import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Standardized Section Container enforcing whitespace rhythm.
 *
 * @param {Object} props
 * @param {'default' | 'muted' | 'white' | 'dark'} [props.bg='default']
 * @param {'sm' | 'md' | 'lg'} [props.spacing='md']
 * @param {string} [props.className]
 * @param {React.ReactNode} props.children
 */
export const SectionContainer = ({
  bg = 'default',
  spacing = 'md',
  className,
  children,
  id,
  ...props
}) => {
  const backgrounds = {
    default: 'bg-slate-50',
    muted: 'bg-slate-100/70 border-y border-slate-200/60',
    white: 'bg-white border-y border-slate-100',
    dark: 'bg-slate-900 text-white',
  };

  const spacings = {
    sm: 'py-10 md:py-14',
    md: 'py-16 md:py-24',
    lg: 'py-20 md:py-32',
  };

  return (
    <section
      id={id}
      className={cn(backgrounds[bg], spacings[spacing], className)}
      {...props}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </section>
  );
};

export default SectionContainer;
