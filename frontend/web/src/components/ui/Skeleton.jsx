import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Reusable Skeleton loader component.
 *
 * @param {Object} props
 * @param {'text' | 'card' | 'avatar' | 'button'} [props.variant='text']
 * @param {string} [props.className]
 */
export const Skeleton = ({
  variant = 'text',
  className,
  ...props
}) => {
  const variants = {
    text: 'h-4 w-full rounded',
    card: 'h-48 w-full rounded-xl',
    avatar: 'h-10 w-10 rounded-full',
    button: 'h-10 w-28 rounded-lg',
  };

  return (
    <div
      className={cn(
        'bg-slate-200 animate-shimmer',
        variants[variant],
        className
      )}
      {...props}
    />
  );
};

export default Skeleton;
