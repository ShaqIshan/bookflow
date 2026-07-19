import type { Booking } from "./types";
import { balanceDue } from "./types";
import { addMonths, fmtMonthShort, isSameMonth, monthKey, toISODate } from "./dates";

/** "RM 1,800" */
export function fmtRM(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  const opts =
    Number.isInteger(rounded)
      ? { maximumFractionDigits: 0 }
      : { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  return `RM ${rounded.toLocaleString("en-MY", opts)}`;
}

/** "RM 5.9k" for chart tooltips */
export function fmtRMCompact(n: number): string {
  if (n >= 1000) return `RM ${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return `RM ${Math.round(n)}`;
}

export function activeBookings(bookings: Booking[]): Booking[] {
  return bookings.filter((b) => b.status !== "cancelled");
}

/** Booked value (sum of totals) for the month containing `ref`. */
export function monthRevenue(bookings: Booking[], ref: Date): number {
  return activeBookings(bookings)
    .filter((b) => isSameMonth(b.date, ref))
    .reduce((sum, b) => sum + b.total, 0);
}

export function monthBookingCount(bookings: Booking[], ref: Date): number {
  return activeBookings(bookings).filter((b) => isSameMonth(b.date, ref)).length;
}

export function monthCosts(bookings: Booking[], ref: Date): number {
  return activeBookings(bookings)
    .filter((b) => isSameMonth(b.date, ref))
    .reduce((sum, b) => sum + (b.cost ?? 0), 0);
}

/** Money not yet collected across every active booking. */
export function totalStillOwed(bookings: Booking[]): number {
  return activeBookings(bookings).reduce((sum, b) => sum + balanceDue(b), 0);
}

export function bookingsWithBalance(bookings: Booking[]): Booking[] {
  return activeBookings(bookings)
    .filter((b) => balanceDue(b) > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export interface MonthPoint {
  key: string;
  label: string;
  revenue: number;
}

/** Revenue per month for the last `count` months, oldest first. */
export function revenueHistory(
  bookings: Booking[],
  count = 6,
  ref: Date = new Date(),
): MonthPoint[] {
  const points: MonthPoint[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const m = addMonths(ref, -i);
    const key = monthKey(toISODate(m));
    const revenue = activeBookings(bookings)
      .filter((b) => monthKey(b.date) === key)
      .reduce((sum, b) => sum + b.total, 0);
    points.push({ key, label: fmtMonthShort(m), revenue });
  }
  return points;
}
