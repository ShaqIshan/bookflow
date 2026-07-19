/** Local-timezone date helpers. Dates are stored as ISO "YYYY-MM-DD" strings. */

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function addMonths(d: Date, months: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + months, 1);
}

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const MONTH_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** "Sat 26 Jul" */
export function fmtDayShort(iso: string): string {
  const d = fromISODate(iso);
  return `${DAY_SHORT[d.getDay()]} ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
}

/** "Sunday, July 26" */
export function fmtDayLong(iso: string): string {
  const d = fromISODate(iso);
  return `${DAY_LONG[d.getDay()]}, ${MONTH_LONG[d.getMonth()]} ${d.getDate()}`;
}

/** "Friday, 21 July" — dashboard header style */
export function fmtHeaderDate(d: Date): string {
  return `${DAY_LONG[d.getDay()]}, ${d.getDate()} ${MONTH_LONG[d.getMonth()]}`;
}

/** "July 2026" */
export function fmtMonthYear(d: Date): string {
  return `${MONTH_LONG[d.getMonth()]} ${d.getFullYear()}`;
}

/** "Jul" */
export function fmtMonthShort(d: Date): string {
  return MONTH_SHORT[d.getMonth()];
}

/** "7:00 PM" from "19:00" */
export function fmtTime(hhmm?: string): string {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** "7:00 PM – 11:30 PM" or just start */
export function fmtTimeRange(start?: string, end?: string): string {
  if (!start) return "";
  return end ? `${fmtTime(start)} – ${fmtTime(end)}` : fmtTime(start);
}

export function isSameMonth(iso: string, ref: Date): boolean {
  const d = fromISODate(iso);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

/** "YYYY-MM" bucket key */
export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

export interface CalendarCell {
  iso: string;
  day: number;
  inMonth: boolean;
}

/** Full weeks covering a month, starting Sunday (matches the prototype grid). */
export function calendarGrid(year: number, month: number): CalendarCell[] {
  const first = new Date(year, month, 1);
  const start = addDays(first, -first.getDay());
  const cells: CalendarCell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = addDays(start, i);
    cells.push({ iso: toISODate(d), day: d.getDate(), inMonth: d.getMonth() === month });
  }
  // Trim a fully out-of-month trailing week
  const lastRowStart = 35;
  if (cells.slice(lastRowStart).every((c) => !c.inMonth)) {
    return cells.slice(0, lastRowStart);
  }
  return cells;
}

/** Days until (negative = past). Compares calendar days, not hours. */
export function daysUntil(iso: string, from: Date = new Date()): number {
  const target = fromISODate(iso).getTime();
  const ref = fromISODate(toISODate(from)).getTime();
  return Math.round((target - ref) / 86_400_000);
}

/** "In 3 days" / "Today" / "Tomorrow" / "2 days ago" */
export function relativeDayLabel(iso: string, from: Date = new Date()): string {
  const n = daysUntil(iso, from);
  if (n === 0) return "Today";
  if (n === 1) return "Tomorrow";
  if (n === -1) return "Yesterday";
  if (n > 1) return `In ${n} days`;
  return `${-n} days ago`;
}
