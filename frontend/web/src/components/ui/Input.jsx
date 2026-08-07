import React, { useId } from 'react';
import { cn } from '../../utils/cn';

/**
 * Reusable Input component with label, helper, error, and success states.
 *
 * @param {Object} props
 * @param {string} [props.label]
 * @param {string} [props.error]
 * @param {boolean | string} [props.success]
 * @param {string} [props.helperText]
 * @param {React.ReactNode} [props.leftIcon]
 * @param {React.ReactNode} [props.rightIcon]
 * @param {string} [props.className]
 */
export const Input = React.forwardRef(({
  label,
  error,
  success,
  helperText,
  leftIcon,
  rightIcon,
  className,
  id: customId,
  disabled,
  type = 'text',
  ...props
}, ref) => {
  const generatedId = useId();
  const inputId = customId || generatedId;

  const isSuccess = Boolean(success);
  const successMessage = typeof success === 'string' ? success : null;

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-slate-700 tracking-tight"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center justify-center">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          disabled={disabled}
          className={cn(
            'w-full h-10 px-3.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:outline-none focus:border-[#005F60] focus:ring-2 focus:ring-[#005F60]/20 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20',
            isSuccess && !error && 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/20',
            className
          )}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3 text-slate-400 flex items-center justify-center">
            {rightIcon}
          </div>
        )}
      </div>

      {error ? (
        <p className="text-xs text-rose-600 font-medium">{error}</p>
      ) : successMessage ? (
        <p className="text-xs text-emerald-600 font-medium">{successMessage}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
