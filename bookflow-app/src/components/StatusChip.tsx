import type { Booking } from "@/lib/types";
import { PAYMENT_LABEL, paymentState } from "@/lib/types";
import { todayISO } from "@/lib/dates";

interface ChipStyle {
  chip: string;
  dot: string;
}

const STYLES: Record<string, ChipStyle> = {
  paid: { chip: "bg-primary/10 text-primary", dot: "bg-primary" },
  "paid-settled": {
    chip: "bg-surface-variant text-on-surface-variant",
    dot: "bg-on-surface-variant",
  },
  "deposit-paid": { chip: "bg-primary/10 text-primary", dot: "bg-primary" },
  "deposit-pending": {
    chip: "bg-secondary-container/20 text-secondary",
    dot: "bg-secondary",
  },
  overdue: { chip: "bg-tertiary/10 text-tertiary", dot: "bg-tertiary" },
  cancelled: {
    chip: "bg-surface-variant text-on-surface-variant",
    dot: "bg-on-surface-variant",
  },
};

export default function StatusChip({ booking }: { booking: Booking }) {
  let key: string;
  let label: string;
  if (booking.status === "cancelled") {
    key = "cancelled";
    label = "Cancelled";
  } else {
    const state = paymentState(booking, todayISO());
    // A fully-paid past booking is "done" — quiet neutral, not loud emerald
    key = state === "paid" && booking.date < todayISO() ? "paid-settled" : state;
    label = PAYMENT_LABEL[state];
  }
  const style = STYLES[key];
  return (
    <span
      className={`shrink-0 px-3 py-1 rounded-full text-label-md flex items-center gap-1.5 ${style.chip}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {label}
    </span>
  );
}
