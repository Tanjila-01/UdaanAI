import React from 'react';
import { cn } from '../../utils/cn';
import { X } from 'lucide-react';

/**
 * Reusable Tag component.
 *
 * @param {Object} props
 * @param {boolean} [props.interactive=false]
 * @param {boolean} [props.active=false]
 * @param {Function} [props.onRemove]
 * @param {string} [props.className]
 * @param {React.ReactNode} props.children
 */
export const Tag = ({
  interactive = false,
  active = false,
  onRemove,
  className,
  children,
  onClick,
  ...props
}) => {
  return (
    <span
      onClick={interactive ? onClick : undefined}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium border transition-all duration-150 select-none',
        active
          ? 'bg-[#005F60] text-white border-[#005F60] shadow-2xs'
          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50',
        interactive && 'cursor-pointer active:scale-95',
        className
      )}
      {...props}
    >
      <span>{children}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:text-rose-500 rounded p-0.5 transition-colors cursor-pointer"
          aria-label="Remove tag"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
};

export default Tag;
