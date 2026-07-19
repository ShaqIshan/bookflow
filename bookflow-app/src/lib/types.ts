export type TemplateId =
  | "photo-booth"
  | "barber"
  | "aircon"
  | "tuition"
  | "rental"
  | "custom";

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

export type BookingSource = "whatsapp" | "manual" | "seed";

export interface Booking {
  id: string;
  /** Display title, e.g. "Aisha & Faiz Wedding" */
  title: string;
  clientName: string;
  phone?: string;
  service: string;
  /** ISO local date, e.g. "2026-07-26" */
  date: string;
  /** 24h "HH:mm" */
  startTime?: string;
  endTime?: string;
  venue?: string;
  total: number;
  deposit: number;
  /** Amount actually received so far */
  paid: number;
  /** Estimated cost to deliver this booking (fuel, workers, materials) */
  cost?: number;
  status: BookingStatus;
  notes?: string;
  source: BookingSource;
  rawMessage?: string;
  createdAt: string;
}

export interface CostRate {
  id: string;
  label: string;
  icon: string;
  amount: number;
  /** e.g. "/ km", "/ event", "/ print" */
  unit: string;
}

export interface Profile {
  onboarded: boolean;
  templateId: TemplateId;
  businessName: string;
  ownerName: string;
  /** True while the demo sample data is loaded */
  seeded: boolean;
}

export type PaymentState =
  | "paid" // fully paid
  | "deposit-paid" // deposit received, balance later
  | "deposit-pending" // nothing received yet
  | "overdue"; // event passed with money still owed

/** Derive the money state of a booking relative to a reference day. */
export function paymentState(b: Booking, todayISO: string): PaymentState {
  if (b.total > 0 && b.paid >= b.total) return "paid";
  if (b.date < todayISO && b.status !== "cancelled") return "overdue";
  if (b.paid > 0) return "deposit-paid";
  return "deposit-pending";
}

export const PAYMENT_LABEL: Record<PaymentState, string> = {
  paid: "Paid",
  "deposit-paid": "Deposit paid",
  "deposit-pending": "Deposit pending",
  overdue: "Balance overdue",
};

export function balanceDue(b: Booking): number {
  return Math.max(0, b.total - b.paid);
}
