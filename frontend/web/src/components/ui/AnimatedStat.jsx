import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';

/**
 * AnimatedStat component that counts up numbers when scrolled into view.
 */
export const AnimatedStat = ({
  numericValue,
  suffix = '',
  label,
  subtitle,
  trend,
  icon,
  className
}) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const statRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (statRef.current) {
      observer.observe(statRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let start = 0;
    const end = parseInt(numericValue, 10);
    if (isNaN(end)) return;

    const duration = 1600; // ms
    const startTime = performance.now();

    const step = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quad
      const easeProgress = 1 - (1 - progress) * (1 - progress);
      setCount(Math.floor(easeProgress * (end - start) + start));

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };

    requestAnimationFrame(step);
  }, [isVisible, numericValue]);

  return (
    <div
      ref={statRef}
      className={cn(
        'group bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:shadow-md hover:border-[#005F60]/40 transition-all duration-300 flex flex-col justify-between gap-4 cursor-default relative overflow-hidden',
        className
      )}
    >
      {/* Top accent glow on hover */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#005F60] to-[#E06D14] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          {label}
        </span>
        {icon && (
          <div className="p-2.5 rounded-xl bg-teal-50 text-[#005F60] group-hover:scale-110 group-hover:bg-[#005F60] group-hover:text-white [&_svg]:text-current [&_svg]:transition-colors transition-all duration-300">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight font-mono">
          {isVisible ? count.toLocaleString() : '0'}
          {suffix}
        </span>
        {trend && (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-[#004D4E] border border-teal-200/60">
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-slate-700 font-medium leading-normal border-t border-slate-100 pt-3">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default AnimatedStat;
