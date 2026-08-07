import React from 'react';
import { cn } from '../../utils/cn';
import Button from '../ui/Button';
import { Send, ArrowRight } from 'lucide-react';

/**
 * Reusable CTABanner component with paper plane flight motif.
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
  primaryCtaText = 'Get Started Today',
  onPrimaryCtaClick,
  secondaryCtaText,
  onSecondaryCtaClick,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'relative bg-gradient-to-br from-[#005F60] to-[#004D4E] rounded-3xl p-8 sm:p-12 text-white shadow-xl overflow-hidden border border-teal-700/50',
        className
      )}
      {...props}
    >
      {/* Background paper plane guidance motif */}
      <div className="absolute right-6 top-6 opacity-10 pointer-events-none animate-paper-plane">
        <Send className="w-48 h-48 text-white" />
      </div>

      <div className="relative z-10 max-w-2xl flex flex-col gap-4">
        <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-teal-200">
          <Send className="w-3.5 h-3.5 text-orange-400" />
          <span>Karnataka Career Guidance</span>
        </span>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
          {title}
        </h2>

        <p className="text-sm sm:text-base text-teal-50/90 leading-relaxed">
          {description}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          {primaryCtaText && (
            <Button
              variant="secondary"
              size="lg"
              onClick={onPrimaryCtaClick}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {primaryCtaText}
            </Button>
          )}

          {secondaryCtaText && (
            <Button
              variant="outline"
              size="lg"
              onClick={onSecondaryCtaClick}
              className="bg-transparent text-white border-white/30 hover:bg-white/10 hover:border-white/50"
            >
              {secondaryCtaText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CTABanner;
