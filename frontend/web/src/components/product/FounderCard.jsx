import React from 'react';
import Badge from '../ui/Badge';
import { Github } from 'lucide-react';

export const FounderCard = ({ founder }) => {
  const { name, role, image, fallbackImage, alt, description, socials } = founder;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-all duration-200 flex flex-col justify-between h-full group">
      <div className="flex flex-col items-center text-center">
        {/* Profile Image Container with fallback and aspect-ratio preservation */}
        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden mb-4 bg-slate-100 border border-slate-200/80 shadow-2xs shrink-0 group-hover:scale-[1.02] transition-transform duration-200">
          <img
            src={image || fallbackImage}
            alt={alt}
            onError={(e) => {
              if (fallbackImage && e.currentTarget.src !== fallbackImage) {
                e.currentTarget.src = fallbackImage;
              }
            }}
            className="w-full h-full object-cover object-center block"
            loading="lazy"
          />
        </div>

        {/* Name & Role */}
        <h3 className="text-base sm:text-lg font-extrabold text-slate-950 tracking-tight mb-1">
          {name}
        </h3>
        <Badge variant="primary" size="sm" className="mb-3 text-[11px] font-semibold bg-teal-50 text-[#005F60] border-teal-200">
          {role}
        </Badge>

        {/* Description */}
        <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-xs">
          {description}
        </p>
      </div>

      {/* Verified Social Links (Only rendered if non-null and verified) */}
      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-center min-h-[36px]">
        {socials?.github ? (
          <a
            href={socials.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${name}'s GitHub Profile`}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005F60]"
          >
            <Github className="w-4 h-4" aria-hidden="true" />
          </a>
        ) : (
          <span className="text-[11px] text-slate-400 font-medium tracking-wide">
            Udaan AI Core Team
          </span>
        )}
      </div>
    </div>
  );
};

export default FounderCard;
