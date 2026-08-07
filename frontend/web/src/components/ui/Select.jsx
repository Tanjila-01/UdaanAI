import React, { useId } from 'react';
import { cn } from '../../utils/cn';
import { ChevronDown } from 'lucide-react';

/**
 * Reusable Select dropdown component.
 *
 * @param {Object} props
 * @param {string} [props.label]
 * @param {Array<{value: string, label: string}>} [props.options=[]]
 * @param {string} [props.error]
 * @param {string} [props.helperText]
 * @param {string} [props.className]
 */
export const Select = React.forwardRef(({
  label,
  options = [],
  error,
  helperText,
  className,
  id: customId,
  disabled,
  children,
  ...props
}, ref) => {
  const generatedId = useId();
  const selectId = customId || generatedId;

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-semibold text-slate-700 tracking-tight"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          className={cn(
            'w-full h-10 pl-3.5 pr-10 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 appearance-none transition-all duration-200 focus:outline-none focus:border-[#005F60] focus:ring-2 focus:ring-[#005F60]/20 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed cursor-pointer',
            error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20',
            className
          )}
          {...props}
        >
          {children || options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="absolute right-3 text-slate-400 pointer-events-none flex items-center justify-center">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {error ? (
        <p className="text-xs text-rose-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
});

Select.displayName = 'Select';
export default Select;
