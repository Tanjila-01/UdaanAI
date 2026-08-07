import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

/**
 * Reusable Button component adhering to Udaan AI Design Tokens with high-contrast text and focus rings.
 */
export const Button = React.forwardRef(({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  children,
  type = 'button',
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005F60] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98] select-none cursor-pointer';

  const variants = {
    primary: 'bg-[#005F60] hover:bg-[#004D4E] text-white shadow-xs hover:shadow-sm border border-transparent',
    secondary: 'bg-[#E06D14] hover:bg-[#C2580E] text-white shadow-xs hover:shadow-sm border border-transparent',
    outline: 'bg-white hover:bg-slate-50 text-slate-800 hover:text-slate-950 border border-slate-300 hover:border-slate-400 shadow-xs',
    ghost: 'bg-transparent hover:bg-slate-100/80 text-slate-800 hover:text-slate-950 border border-transparent',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs border border-transparent',
  };

  const sizes = {
    sm: 'h-8 px-3.5 text-xs gap-1.5 rounded-lg',
    md: 'h-10 px-4.5 text-sm gap-2 rounded-lg',
    lg: 'h-12 px-6 text-base gap-2.5 rounded-xl',
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
      ) : leftIcon ? (
        <span className="shrink-0">{leftIcon}</span>
      ) : null}

      <span>{children}</span>

      {!isLoading && rightIcon && (
        <span className="shrink-0">{rightIcon}</span>
      )}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
