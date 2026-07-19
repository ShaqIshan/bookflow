"use client";

import { useState } from "react";
import type { Booking } from "@/lib/types";
import { balanceDue } from "@/lib/types";
import { useBookFlow } from "@/lib/store";
import { fmtDayShort, fmtTimeRange, relativeDayLabel, todayISO } from "@/lib/dates";
import { fmtRM } from "@/lib/money";
import {
  bookingConfirmationMessage,
  depositReminderMessage,
  invoiceText,
  waLink,
} from "@/lib/wa";
import Icon from "./Icon";
import Sheet from "./Sheet";
import StatusChip from "./StatusChip";
import BookingForm, { type BookingFormValues } from "./BookingForm";

interface BookingDetailSheetProps {
  booking: Booking | null;
  onClose: () => void;
  /** Open straight into the edit form (remount with a fresh key to apply) */
  initialEditing?: boolean;
}

function InfoRow({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 text-on-surface-variant">
      <Icon name={icon} size={20} className="text-primary mt-0.5" />
      <div className="text-body-md min-w-0">{children}</div>
    </div>
  );
}

export default function BookingDetailSheet({
  booking,
  onClose,
  initialEditing = false,
}: BookingDetailSheetProps) {
  const updateBooking = useBookFlow((s) => s.updateBooking);
  const deleteBooking = useBookFlow((s) => s.deleteBooking);
  const businessName = useBookFlow((s) => s.profile.businessName);
  const [editing, setEditing] = useState(initialEditing);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState("");

  if (!booking) return null;

  const owed = balanceDue(booking);
  const isPast = booking.date < todayISO();
  const cancelled = booking.status === "cancelled";

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }

  function settle(amount: number) {
    if (!booking) return;
    updateBooking(booking.id, {
      paid: amount,
      status: isPast ? "completed" : "confirmed",
    });
    flash(amount >= booking.total ? "Marked as fully paid ✓" : "Deposit recorded ✓");
  }

  function saveEdit(values: BookingFormValues) {
    if (!booking) return;
    updateBooking(booking.id, values);
    setEditing(false);
    flash("Booking updated ✓");
  }

  async function copyInvoice() {
    if (!booking) return;
    try {
      await navigator.clipboard.writeText(invoiceText(booking, businessName));
      flash("Invoice copied — paste it anywhere ✓");
    } catch {
      flash("Couldn't copy — try again");
    }
  }

  return (
    <Sheet
      open={Boolean(booking)}
      onClose={() => {
        setEditing(false);
        setConfirmDelete(false);
        onClose();
      }}
      title={editing ? "Edit booking" : undefined}
    >
      {editing ? (
        <BookingForm
          initial={booking}
          submitLabel="Save changes"
          showPaid
          excludeId={booking.id}
          onSubmit={saveEdit}
        />
      ) : (
        <div className="flex flex-col gap-stack-gap-md">
          {/* Header */}
          <div className="flex justify-between items-start gap-3">
            <div className="min-w-0">
              <h3 className="font-heading text-display-md text-on-surface">{booking.title}</h3>
              <p className="text-body-sm text-muted-ink mt-1">
                {booking.service} · {relativeDayLabel(booking.date)}
              </p>
            </div>
            <StatusChip booking={booking} />
          </div>

          {/* Details */}
          <div className="bg-surface rounded-card p-5 shadow-ambient flex flex-col gap-3">
            <InfoRow icon="calendar_today">
              {fmtDayShort(booking.date)}
              {booking.startTime && (
                <span className="text-on-surface-variant">
                  {" "}
                  · {fmtTimeRange(booking.startTime, booking.endTime)}
                </span>
              )}
            </InfoRow>
            {booking.venue && <InfoRow icon="location_on">{booking.venue}</InfoRow>}
            <InfoRow icon="person">
              {booking.clientName}
              {booking.phone && (
                <span className="block text-body-sm text-muted-ink">+{booking.phone}</span>
              )}
            </InfoRow>
            {booking.notes && <InfoRow icon="sticky_note_2">{booking.notes}</InfoRow>}
          </div>

          {/* Money */}
          <div className="bg-surface rounded-card p-5 shadow-ambient">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-label-md text-muted-ink uppercase mb-1">Total</p>
                <p className="text-headline-sm font-heading text-on-surface">
                  {fmtRM(booking.total)}
                </p>
              </div>
              <div>
                <p className="text-label-md text-muted-ink uppercase mb-1">Deposit</p>
                <p className="text-headline-sm font-heading text-on-surface">
                  {booking.deposit > 0 ? fmtRM(booking.deposit) : "—"}
                </p>
              </div>
              <div>
                <p className="text-label-md text-muted-ink uppercase mb-1">Paid</p>
                <p className="text-headline-sm font-heading text-primary">
                  {fmtRM(booking.paid)}
                </p>
              </div>
              <div>
                <p className="text-label-md text-muted-ink uppercase mb-1">Balance</p>
                <p
                  className={`text-headline-sm font-heading ${
                    owed === 0 ? "text-primary" : isPast ? "text-tertiary" : "text-secondary"
                  }`}
                >
                  {fmtRM(owed)}
                </p>
              </div>
            </div>
          </div>

          {/* Payment actions */}
          {!cancelled && owed > 0 && (
            <div className="grid grid-cols-2 gap-gutter">
              {booking.paid < booking.deposit && (
                <button
                  onClick={() => settle(Math.min(booking.deposit, booking.total))}
                  className="flex items-center justify-center gap-2 bg-primary text-on-primary text-label-md py-3.5 rounded-btn shadow-md hover:opacity-90 transition-opacity"
                >
                  <Icon name="price_check" size={18} />
                  Deposit received
                </button>
              )}
              <button
                onClick={() => settle(booking.total)}
                className={`flex items-center justify-center gap-2 text-label-md py-3.5 rounded-btn transition-colors ${
                  booking.paid < booking.deposit
                    ? "border border-primary text-primary hover:bg-primary/5"
                    : "bg-primary text-on-primary shadow-md hover:opacity-90 col-span-2"
                }`}
              >
                <Icon name="paid" size={18} />
                Mark fully paid
              </button>
            </div>
          )}

          {/* WhatsApp + invoice */}
          <div className="grid grid-cols-2 gap-gutter">
            {booking.phone && !cancelled && (
              <a
                href={waLink(
                  booking.phone,
                  owed > 0
                    ? depositReminderMessage(booking, businessName)
                    : bookingConfirmationMessage(booking, businessName),
                )}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-center gap-2 text-label-md py-3.5 rounded-btn transition-opacity hover:opacity-90 ${
                  owed > 0
                    ? "bg-secondary text-on-secondary shadow-sm"
                    : "border border-primary text-primary"
                }`}
              >
                <Icon name="send" size={18} />
                {owed > 0 ? "Send reminder" : "Send confirmation"}
              </a>
            )}
            <button
              onClick={copyInvoice}
              className={`flex items-center justify-center gap-2 border border-outline-variant text-on-surface-variant text-label-md py-3.5 rounded-btn hover:bg-surface-container-low transition-colors ${
                booking.phone && !cancelled ? "" : "col-span-2"
              }`}
            >
              <Icon name="receipt_long" size={18} />
              Copy invoice
            </button>
          </div>

          {/* Edit / delete */}
          <div className="flex items-center justify-between border-t border-surface-variant pt-4">
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 text-label-md text-primary hover:opacity-80 transition-opacity py-2"
            >
              <Icon name="edit" size={18} />
              Edit details
            </button>
            <button
              onClick={() => {
                if (!confirmDelete) {
                  setConfirmDelete(true);
                  setTimeout(() => setConfirmDelete(false), 3000);
                  return;
                }
                deleteBooking(booking.id);
                onClose();
              }}
              className={`flex items-center gap-1.5 text-label-md py-2 px-3 rounded-full transition-colors ${
                confirmDelete ? "bg-error text-on-error" : "text-error hover:bg-error-container/30"
              }`}
            >
              <Icon name="delete" size={18} />
              {confirmDelete ? "Tap again to delete" : "Delete"}
            </button>
          </div>

          {toast && (
            <p className="text-center text-body-sm text-primary bg-primary/10 rounded-full py-2.5 px-4 animate-fade-in">
              {toast}
            </p>
          )}
        </div>
      )}
    </Sheet>
  );
}
