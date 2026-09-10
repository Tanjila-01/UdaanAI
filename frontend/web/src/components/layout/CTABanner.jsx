import React from 'react';
import { cn } from '../../utils/cn';
import Button from '../ui/Button';
import { Compass, ArrowRight } from 'lucide-react';

/**
 * Clean, compact CTABanner component for Udaan AI closing section.
 * Designed with balanced typography, restrained padding, and clear action hierarchy.
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {string} props.description
 * @param {string} [props.primaryCtaText]
 * @param {Function} [props.onPrimaryCtaClick]
 * @param {string} [props.secondaryCtaText]
 * @param {Function} [props.onSecondaryCtaClick]
 * @param {string} [props.className]
 */
export const CTABanner = ({
  title,
  description,
  primaryCtaText = 'Explore Pathways',
  onPrimaryCtaClick,
  secondaryCtaText,
  onSecondaryCtaClick,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'relative bg-[#005F60] rounded-2xl p-6 sm:p-8 text-white shadow-sm border border-teal-800/40 overflow-hidden',
        className
      )}
      {...props}
    >
      <div className="max-w-3xl flex flex-col gap-3">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-teal-200">
          <Compass className="w-3.5 h-3.5 text-teal-300" />
          <span>Karnataka Education Guidance</span>
        </div>

        <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-snug">
          {title}
        </h2>

        <p className="text-xs sm:text-sm text-teal-100/90 leading-relaxed font-medium max-w-2xl">
          {description}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          {primaryCtaText && (
            <Button
              variant="secondary"
              size="md"
              onClick={onPrimaryCtaClick}
              className="bg-[#E06D14] hover:bg-[#C2580E] text-white font-bold px-5 h-10 text-xs sm:text-sm shadow-xs"
              rightIcon={<ArrowRight className="w-4 h-4 text-white" />}
            >
              {primaryCtaText}
            </Button>
          )}

          {secondaryCtaText && (
            <button
              type="button"
              onClick={onSecondaryCtaClick}
              className="h-10 px-4 rounded-xl font-bold text-xs sm:text-sm text-teal-100 hover:text-white bg-white/10 hover:bg-white/15 border border-white/20 transition-colors cursor-pointer flex items-center justify-center"
            >
              {secondaryCtaText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CTABanner;
