"use client";

import type { Booking } from "@/lib/types";
import { paymentState, balanceDue } from "@/lib/types";
import { fmtDayShort, fmtTime, todayISO } from "@/lib/dates";
import { fmtRM } from "@/lib/money";
import { bookingConfirmationMessage, depositReminderMessage, waLink } from "@/lib/wa";
import Icon from "./Icon";
import StatusChip from "./StatusChip";

interface BookingListCardProps {
  booking: Booking;
  businessName: string;
  onOpen: () => void;
  onEdit: () => void;
  onInvoice: () => void;
}

/**
 * Bookings-list card per the corrected mockup: details rows + an action row
 * (edit · invoice · WhatsApp message). Fully-settled past bookings dim.
 */
export default function BookingListCard({
  booking,
  businessName,
  onOpen,
  onEdit,
  onInvoice,
}: BookingListCardProps) {
  const today = todayISO();
  const settled =
    booking.status !== "cancelled" &&
    booking.date < today &&
    paymentState(booking, today) === "paid";

  const when = booking.startTime
    ? `${fmtDayShort(booking.date)} • ${fmtTime(booking.startTime)}`
    : fmtDayShort(booking.date);

  return (
    <article
      className={`bg-surface rounded-card p-4 shadow-ambient border border-surface-variant/50 relative overflow-hidden ${
        settled ? "opacity-80" : ""
      }`}
    >
      <button onClick={onOpen} className="w-full text-left" aria-label={`Open ${booking.title}`}>
        <div className="flex justify-between items-start gap-3 mb-3">
          <div className="min-w-0">
            <h3 className="font-heading text-headline-sm text-on-surface">{booking.title}</h3>
            <p className="text-body-sm text-muted-ink">{booking.service}</p>
          </div>
          <StatusChip booking={booking} />
        </div>
        <div className="flex flex-col gap-2 mb-4 text-body-sm text-on-surface-variant">
          <div className="flex items-center gap-2">
            <Icon name="calendar_today" size={18} className="text-muted-ink" />
            <span>{when}</span>
          </div>
          {booking.venue && (
            <div className="flex items-center gap-2">
              <Icon name="location_on" size={18} className="text-muted-ink" />
              <span className="truncate">{booking.venue}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Icon name="payments" size={18} className="text-muted-ink" />
            <span className="font-semibold text-on-surface">{fmtRM(booking.total)}</span>
            {balanceDue(booking) > 0 && booking.status !== "cancelled" && (
              <span className={booking.date < today ? "text-tertiary" : "text-secondary"}>
                · {fmtRM(balanceDue(booking))} owed
              </span>
            )}
          </div>
        </div>
      </button>
      <div className="flex justify-between items-center pt-3 border-t border-surface-variant/50">
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            title="Edit"
            aria-label="Edit booking"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low text-primary hover:bg-surface-container transition-colors"
          >
            <Icon name="edit" size={20} />
          </button>
          <button
            onClick={onInvoice}
            title="Copy invoice"
            aria-label="Copy invoice"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low text-primary hover:bg-surface-container transition-colors"
          >
            <Icon name="receipt_long" size={20} />
          </button>
        </div>
        {booking.phone && (
          <a
            href={waLink(
              booking.phone,
              balanceDue(booking) > 0 && booking.status !== "cancelled"
                ? depositReminderMessage(booking, businessName)
                : bookingConfirmationMessage(booking, businessName),
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 px-4 rounded-btn bg-primary/5 text-primary text-label-md flex items-center gap-2 hover:bg-primary/10 transition-colors"
          >
            <Icon name="chat" size={18} />
            Message
          </a>
        )}
      </div>
    </article>
  );
}
