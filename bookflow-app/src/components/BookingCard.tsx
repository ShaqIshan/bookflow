import type { Booking } from "@/lib/types";
import { fmtDayShort, fmtTime } from "@/lib/dates";
import { fmtRM } from "@/lib/money";
import Icon from "./Icon";
import StatusChip from "./StatusChip";

interface BookingCardProps {
  booking: Booking;
  onClick?: () => void;
}

export default function BookingCard({ booking, onClick }: BookingCardProps) {
  const when = booking.startTime
    ? `${fmtDayShort(booking.date)}, ${fmtTime(booking.startTime)}`
    : fmtDayShort(booking.date);

  return (
    <article
      onClick={onClick}
      className={`bg-surface rounded-card p-5 shadow-ambient border border-surface-variant/50 text-left w-full transition-transform ${
        onClick ? "cursor-pointer active:scale-[0.99] hover:border-outline-variant" : ""
      }`}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div className="flex justify-between items-start gap-3 mb-3">
        <div className="min-w-0">
          <h4 className="font-heading text-headline-sm text-on-surface mb-1">
            {booking.title}
          </h4>
          <p className="text-body-sm text-muted-ink">{booking.service}</p>
        </div>
        <StatusChip booking={booking} />
      </div>
      <div className="grid grid-cols-1 gap-2 mb-4">
        <div className="flex items-center gap-2 text-on-surface-variant text-body-sm">
          <Icon name="calendar_today" size={18} />
          {when}
        </div>
        {booking.venue && (
          <div className="flex items-center gap-2 text-on-surface-variant text-body-sm">
            <Icon name="location_on" size={18} />
            <span className="truncate">{booking.venue}</span>
          </div>
        )}
      </div>
      <div className="pt-4 border-t border-surface-variant flex justify-between items-center">
        <span className="text-label-md text-muted-ink uppercase">Total</span>
        <span className="text-body-md font-semibold text-on-surface">
          {fmtRM(booking.total)}
        </span>
      </div>
    </article>
  );
}
