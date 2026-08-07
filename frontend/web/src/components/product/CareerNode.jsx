import React from 'react';
import { cn } from '../../utils/cn';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Tag from '../ui/Tag';
import { BookOpen, Clock, CheckCircle2, ChevronRight, GraduationCap } from 'lucide-react';

/**
 * Reusable CareerNode component displaying education stream branch details.
 *
 * @param {Object} props
 * @param {string} props.id
 * @param {string} props.title
 * @param {string} props.duration
 * @param {string} props.description
 * @param {Array<string>} [props.skills=[]]
 * @param {Array<string>} [props.subTracks=[]]
 * @param {boolean} [props.isSelected=false]
 * @param {Function} [props.onSelect]
 * @param {string} [props.className]
 */
export const CareerNode = ({
  id,
  title,
  duration,
  description,
  skills = [],
  subTracks = [],
  isSelected = false,
  onSelect,
  className,
  ...props
}) => {
  return (
    <div
      onClick={onSelect}
      className={cn(
        'bg-white border rounded-xl p-5 shadow-xs transition-all duration-200 cursor-pointer relative overflow-hidden',
        isSelected
          ? 'border-[#005F60] ring-2 ring-[#005F60]/20 shadow-md'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-sm',
        className
      )}
      {...props}
    >
      {isSelected && (
        <div className="absolute top-0 right-0 bg-[#005F60] text-white px-2.5 py-0.5 rounded-bl-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          <span>Active Node</span>
        </div>
      )}

      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-teal-50 text-[#005F60] shrink-0">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900 leading-snug">{title}</h4>
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#005F60]" />
              {duration}
            </span>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed my-3">
        {description}
      </p>

      {subTracks.length > 0 && (
        <div className="mb-3">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
            Key Specializations:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {subTracks.map((track, i) => (
              <span key={i} className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                {track}
              </span>
            ))}
          </div>
        </div>
      )}

      {skills.length > 0 && (
        <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1">
          {skills.map((skill, i) => (
            <Tag key={i} className="text-[10px] py-0.5 px-2">
              {skill}
            </Tag>
          ))}
        </div>
      )}
    </div>
  );
};

export default CareerNode;
