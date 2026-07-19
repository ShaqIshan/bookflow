"use client";

import type { Booking } from "@/lib/types";
import { balanceDue } from "@/lib/types";
import { fmtDayShort, todayISO } from "@/lib/dates";
import { fmtRM } from "@/lib/money";
import { depositReminderMessage, waLink } from "@/lib/wa";
import Icon from "./Icon";

interface ChaseListProps {
  bookings: Booking[];
  businessName: string;
}

/** Bookings with money still owed, each with a one-tap WhatsApp reminder. */
export default function ChaseList({ bookings, businessName }: ChaseListProps) {
  if (bookings.length === 0) {
    return (
      <p className="text-body-md text-muted-ink py-6 text-center">
        You&apos;re all caught up ✨
      </p>
    );
  }
  const today = todayISO();
  return (
    <div className="flex flex-col gap-stack-gap-sm">
      <p className="text-body-sm text-muted-ink mb-2">
        {bookings.length} booking{bookings.length > 1 ? "s" : ""} with money still owed —
        a friendly nudge goes a long way.
      </p>
      {bookings.map((b) => (
        <div
          key={b.id}
          className="bg-surface rounded-btn p-4 shadow-ambient flex items-center justify-between gap-3"
        >
          <div className="min-w-0">
            <p className="text-body-md font-semibold text-on-surface truncate">{b.title}</p>
            <p className="text-body-sm text-muted-ink">
              {fmtDayShort(b.date)} ·{" "}
              <span className={b.date < today ? "text-tertiary" : "text-secondary"}>
                {fmtRM(balanceDue(b))} owed
              </span>
            </p>
          </div>
          {b.phone && (
            <a
              href={waLink(b.phone, depositReminderMessage(b, businessName))}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-1.5 bg-secondary text-on-secondary text-label-md px-3.5 py-2.5 rounded-full hover:opacity-90 transition-opacity"
            >
              <Icon name="send" size={16} />
              Remind
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
