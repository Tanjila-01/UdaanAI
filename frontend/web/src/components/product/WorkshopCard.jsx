import React from 'react';
import { cn } from '../../utils/cn';
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { Calendar, Clock, MapPin, Users, ArrowRight } from 'lucide-react';

/**
 * Reusable WorkshopCard component for Karnataka career orientation webinars and skill bootcamps.
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {string} props.topic
 * @param {string} props.date
 * @param {string} props.time
 * @param {string} props.location - e.g. "Virtual / Zoom" or "Bengaluru"
 * @param {string} props.speakerName
 * @param {string} props.speakerRole
 * @param {number} [props.seatsLeft]
 * @param {string} [props.badgeText='Live Session']
 * @param {Function} [props.onRegister]
 * @param {string} [props.className]
 */
export const WorkshopCard = ({
  title,
  topic,
  date,
  time,
  location,
  speakerName,
  speakerRole,
  seatsLeft,
  badgeText = 'Live Orientation',
  onRegister,
  className,
  ...props
}) => {
  return (
    <Card hoverable className={cn('flex flex-col justify-between h-full', className)} {...props}>
      <CardHeader>
        <div className="flex items-center justify-between gap-2 mb-1">
          <Badge variant="secondary" size="sm">
            {badgeText}
          </Badge>
          {seatsLeft !== undefined && (
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {seatsLeft} seats remaining
            </span>
          )}
        </div>
        <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
        <CardDescription>{topic}</CardDescription>
      </CardHeader>

      <CardContent className="my-2">
        <div className="flex flex-col gap-2 py-3 px-3.5 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-[#005F60] shrink-0" />
            <span className="font-medium">{date}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[#005F60] shrink-0" />
            <span>{time}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-[#005F60] shrink-0" />
            <span>{location}</span>
          </div>
        </div>

        {(speakerName || speakerRole) && (
          <div className="mt-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-teal-100 text-[#005F60] flex items-center justify-center font-bold text-xs shrink-0">
              {speakerName ? speakerName.charAt(0) : 'S'}
            </div>
            <div className="flex flex-col text-xs">
              <span className="font-bold text-slate-900">{speakerName}</span>
              <span className="text-slate-500 text-[11px]">{speakerRole}</span>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          variant="primary"
          size="sm"
          fullWidth
          onClick={onRegister}
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
        >
          Reserve Free Seat
        </Button>
      </CardFooter>
    </Card>
  );
};

export default WorkshopCard;
