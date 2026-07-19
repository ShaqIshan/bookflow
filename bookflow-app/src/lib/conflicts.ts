import type { Booking } from "./types";

function minutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Assume a 3-hour slot when no end time is given (typical event setup). */
const DEFAULT_DURATION_MIN = 180;

export interface ConflictQuery {
  date?: string;
  startTime?: string;
  endTime?: string;
  excludeId?: string;
}

/**
 * Double-booking guard: other active bookings on the same date whose time
 * ranges overlap (or where either side has no time — same-day is enough to
 * warn). Warnings only — one crew can sometimes do two gigs a day, so the
 * user always has the final say.
 */
export function findConflicts(bookings: Booking[], q: ConflictQuery): Booking[] {
  if (!q.date) return [];
  return bookings.filter((b) => {
    if (b.status === "cancelled") return false;
    if (q.excludeId && b.id === q.excludeId) return false;
    if (b.date !== q.date) return false;
    if (!q.startTime || !b.startTime) return true;
    const aStart = minutes(q.startTime);
    const aEnd = q.endTime ? minutes(q.endTime) : aStart + DEFAULT_DURATION_MIN;
    const bStart = minutes(b.startTime);
    const bEnd = b.endTime ? minutes(b.endTime) : bStart + DEFAULT_DURATION_MIN;
    return aStart < bEnd && bStart < aEnd;
  });
}
