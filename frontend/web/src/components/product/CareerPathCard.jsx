import React from 'react';
import { cn } from '../../utils/cn';
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import Badge from '../ui/Badge';
import Tag from '../ui/Tag';
import Button from '../ui/Button';
import { TrendingUp, Briefcase, ChevronRight, DollarSign } from 'lucide-react';

/**
 * Reusable CareerPathCard component summarizing career profiles and prospects.
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {string} props.category
 * @param {string} props.salaryRange
 * @param {string} props.growthRate
 * @param {string} props.description
 * @param {Array<string>} [props.requiredEducation=[]]
 * @param {Array<string>} [props.topSkills=[]]
 * @param {Function} [props.onExplore]
 * @param {string} [props.className]
 */
export const CareerPathCard = ({
  title,
  category,
  salaryRange,
  growthRate,
  description,
  requiredEducation = [],
  topSkills = [],
  onExplore,
  className,
  ...props
}) => {
  return (
    <Card hoverable className={cn('flex flex-col justify-between h-full', className)} {...props}>
      <CardHeader>
        <div className="flex items-center justify-between gap-2 mb-1">
          <Badge variant="primary" size="sm">
            {category}
          </Badge>
          {growthRate && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <TrendingUp className="w-3 h-3" />
              {growthRate}
            </span>
          )}
        </div>

        <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="my-2 flex flex-col gap-3">
        {salaryRange && (
          <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs">
            <Briefcase className="w-4 h-4 text-[#005F60] shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Estimated Salary</span>
              <span className="font-bold text-slate-900">{salaryRange}</span>
            </div>
          </div>
        )}

        {topSkills.length > 0 && (
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Core Skills Needed:
            </span>
            <div className="flex flex-wrap gap-1">
              {topSkills.map((skill, i) => (
                <Tag key={i} className="text-[10px] py-0.5 px-2">
                  {skill}
                </Tag>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          variant="outline"
          size="sm"
          fullWidth
          onClick={onExplore}
          rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
        >
          View Career Pathway
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CareerPathCard;
