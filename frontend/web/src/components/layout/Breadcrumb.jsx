import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Reusable Breadcrumb navigation component.
 *
 * @param {Object} props
 * @param {Array<{label: string, href?: string}>} props.items
 * @param {boolean} [props.showHome=true]
 * @param {string} [props.className]
 */
export const Breadcrumb = ({
  items = [],
  showHome = true,
  className,
  ...props
}) => {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center space-x-1.5 text-xs text-slate-500', className)}
      {...props}
    >
      {showHome && (
        <>
          <Link
            to="/"
            className="inline-flex items-center gap-1 hover:text-[#005F60] transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          {items.length > 0 && (
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          )}
        </>
      )}

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={item.label}>
            {isLast || !item.href ? (
              <span className="font-semibold text-slate-900 truncate max-w-[200px]">
                {item.label}
              </span>
            ) : (
              <Link
                to={item.href}
                className="hover:text-[#005F60] transition-colors truncate max-w-[200px]"
              >
                {item.label}
              </Link>
            )}

            {!isLast && (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;
