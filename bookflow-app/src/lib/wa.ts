import type { Booking } from "./types";
import { balanceDue } from "./types";
import { fmtDayShort, fmtTimeRange } from "./dates";
import { fmtRM } from "./money";

/** Normalise a Malaysian phone number to international digits (60…). */
export function normalisePhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "6" + digits;
  if (!digits.startsWith("6")) digits = "60" + digits;
  return digits;
}

export function waLink(phone: string, text?: string): string {
  const base = `https://wa.me/${normalisePhone(phone)}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function depositReminderMessage(b: Booking, businessName: string): string {
  const owed = balanceDue(b);
  const what = b.paid > 0 ? "balance" : "deposit";
  const amount = b.paid > 0 ? owed : b.deposit > 0 ? b.deposit : owed;
  return (
    `Hi ${b.clientName}! Friendly reminder from ${businessName} 😊\n\n` +
    `Your booking — ${b.title} on ${fmtDayShort(b.date)}` +
    (b.startTime ? ` (${fmtTimeRange(b.startTime, b.endTime)})` : "") +
    ` — is reserved.\n\n` +
    `To confirm, kindly settle the ${what} of ${fmtRM(amount)} when you can. ` +
    `Thank you so much! 🙏`
  );
}

export function bookingConfirmationMessage(b: Booking, businessName: string): string {
  return (
    `Hi ${b.clientName}! This is ${businessName} — your booking is confirmed ✅\n\n` +
    `📌 ${b.title}\n` +
    `🗓 ${fmtDayShort(b.date)}${b.startTime ? `, ${fmtTimeRange(b.startTime, b.endTime)}` : ""}\n` +
    (b.venue ? `📍 ${b.venue}\n` : "") +
    `💰 Total ${fmtRM(b.total)}` +
    (b.deposit > 0 ? ` (deposit ${fmtRM(b.deposit)})` : "") +
    `\n\nSee you there! 🎉`
  );
}

/** Plain-text invoice/receipt, ready to paste or share over WhatsApp. */
export function invoiceText(b: Booking, businessName: string): string {
  const lines = [
    `${businessName.toUpperCase()} — BOOKING SUMMARY`,
    `--------------------------------`,
    `Booking : ${b.title}`,
    `Client  : ${b.clientName}`,
    `Service : ${b.service}`,
    `Date    : ${fmtDayShort(b.date)}`,
  ];
  if (b.startTime) lines.push(`Time    : ${fmtTimeRange(b.startTime, b.endTime)}`);
  if (b.venue) lines.push(`Venue   : ${b.venue}`);
  lines.push(
    `--------------------------------`,
    `Total   : ${fmtRM(b.total)}`,
    `Paid    : ${fmtRM(b.paid)}`,
    `Balance : ${fmtRM(balanceDue(b))}`,
    `--------------------------------`,
    `Thank you for booking with ${businessName}!`,
  );
  return lines.join("\n");
}
