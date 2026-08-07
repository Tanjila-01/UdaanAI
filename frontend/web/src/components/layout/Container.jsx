import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Standardized Container wrapper for centering content.
 *
 * @param {Object} props
 * @param {'sm' | 'md' | 'lg' | 'xl' | 'full'} [props.size='xl']
 * @param {string} [props.className]
 * @param {React.ReactNode} props.children
 */
export const Container = ({
  size = 'xl',
  className,
  children,
  ...props
}) => {
  const sizes = {
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <div
      className={cn(
        'mx-auto px-4 sm:px-6 lg:px-8 w-full',
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Container;
