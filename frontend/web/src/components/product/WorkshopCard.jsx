import React from 'react';
import { cn } from '../../utils/cn';
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { Building2, CheckCircle2, ArrowRight } from 'lucide-react';

/**
 * Reusable WorkshopCard component for workshops Udaan AI can arrange for schools and colleges.
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {string} [props.topic] - Alias for description
 * @param {string[]} [props.focusAreas] - Bullet highlights of what students will learn
 * @param {string} [props.deliveryMode] - Format information (e.g. "In-Person Campus or Virtual")
 * @param {string} [props.badgeText='School & College Workshop']
 * @param {string} [props.actionLabel='Request this Workshop']
 * @param {Function} [props.onRequest] - Callback to open institutional request form
 * @param {Function} [props.onRegister] - Backward-compatible alias for onRequest
 * @param {string} [props.className]
 */
export const WorkshopCard = ({
  title,
  description,
  topic,
  focusAreas = [],
  deliveryMode = 'In-Person Campus or Virtual',
  badgeText = 'School & College Workshop',
  actionLabel = 'Request this Workshop',
  onRequest,
  onRegister,
  className,
  ...props
}) => {
  const contentDescription = description || topic;
  const handleAction = onRequest || onRegister;

  return (
    <Card hoverable className={cn('flex flex-col justify-between h-full border-slate-200/90 shadow-xs', className)} {...props}>
      <CardHeader>
        <div className="flex items-center justify-between gap-2 mb-2">
          <Badge variant="primary" size="sm" className="bg-teal-50 text-[#005F60] border-teal-200">
            {badgeText}
          </Badge>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500">
            <Building2 className="w-3 h-3 text-[#005F60]" />
            <span>For Institutions</span>
          </span>
        </div>
        <CardTitle className="text-base sm:text-lg font-extrabold text-slate-950">{title}</CardTitle>
        {contentDescription && (
          <CardDescription className="text-xs text-slate-600 font-medium leading-relaxed mt-1">
            {contentDescription}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="my-2">
        {focusAreas.length > 0 && (
          <div className="space-y-1.5 mb-3">
            {focusAreas.map((area, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#005F60] shrink-0" />
                <span>{area}</span>
              </div>
            ))}
          </div>
        )}

        <div className="py-2.5 px-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 flex items-center justify-between">
          <span className="font-bold text-slate-700">Delivery format:</span>
          <span className="font-medium text-[#005F60]">{deliveryMode}</span>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          variant="primary"
          size="sm"
          fullWidth
          onClick={handleAction}
          className="bg-[#005F60] hover:bg-[#004D4E] text-white font-bold"
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
        >
          {actionLabel}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default WorkshopCard;
