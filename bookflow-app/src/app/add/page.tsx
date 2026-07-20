"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useBookFlow } from "@/lib/store";
import type { Booking } from "@/lib/types";
import { getTemplate } from "@/lib/templates";
import {
  EXAMPLE_MESSAGES,
  parseWhatsAppMessage,
  type ParsedBooking,
} from "@/lib/parser";
import { findConflicts } from "@/lib/conflicts";
import { bookingConfirmationMessage, waLink } from "@/lib/wa";
import { fmtDayShort, fmtTime, fmtTimeRange } from "@/lib/dates";
import { fmtRM } from "@/lib/money";
import AppShell from "@/components/AppShell";
import Gate from "@/components/Gate";
import Icon from "@/components/Icon";
import BookingForm, { type BookingFormValues } from "@/components/BookingForm";
import StatusChip from "@/components/StatusChip";
import { useInvoiceFlow } from "@/components/InvoiceFlow";

type Mode = "paste" | "review" | "edit" | "manual" | "saved";

export default function AddPage() {
  return (
    <Gate>
      <AppShell active="add">
        <Suspense fallback={null}>
          <AddScreen />
        </Suspense>
      </AppShell>
    </Gate>
  );
}

/** TSV row ready to paste into a Google Sheet (date · client · title · venue · total · deposit · paid · phone). */
function sheetRow(b: Booking): string {
  return [
    b.date,
    b.clientName,
    b.title,
    b.venue ?? "",
    b.total,
    b.deposit,
    b.paid,
    b.phone ?? "",
  ].join("\t");
}

function DetectedRow({
  icon,
  label,
  value,
  strong,
  missing,
}: {
  icon: string;
  label: string;
  value?: string;
  strong?: boolean;
  missing?: string;
}) {
  return (
    <div className="flex gap-3">
      <Icon name={icon} size={22} className="text-muted-ink mt-0.5" />
      <div className="min-w-0">
        <span className="text-label-md text-muted-ink block mb-1">{label}</span>
        {value ? (
          <span
            className={`text-body-md text-on-surface block ${strong ? "font-semibold" : ""}`}
          >
            {value}
          </span>
        ) : (
          <span className="text-body-md text-secondary block">{missing ?? "—"}</span>
        )}
      </div>
    </div>
  );
}

function AddScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillDate = searchParams.get("date") ?? undefined;

  const templateId = useBookFlow((s) => s.profile.templateId);
  const businessName = useBookFlow((s) => s.profile.businessName);
  const bookings = useBookFlow((s) => s.bookings);
  const addBooking = useBookFlow((s) => s.addBooking);
  const template = getTemplate(templateId);

  const [mode, setMode] = useState<Mode>("paste");
  const [raw, setRaw] = useState("");
  const [parsed, setParsed] = useState<ParsedBooking | null>(null);
  const [exampleIdx, setExampleIdx] = useState(0);
  const [saved, setSaved] = useState<Booking | null>(null);
  const [depositPaid, setDepositPaid] = useState(false);
  const [depositInput, setDepositInput] = useState("");
  const [sheetCopy, setSheetCopy] = useState(true);
  const [sheetCopied, setSheetCopied] = useState(false);
  const [hint, setHint] = useState("");
  const [attachInvoice, setAttachInvoice] = useState(false);
  const { runInvoice, invoiceSheet } = useInvoiceFlow();

  function runParse() {
    if (!raw.trim()) return;
    const p = parseWhatsAppMessage(raw, { services: template.services });
    setParsed(p);
    setDepositPaid(false);
    setDepositInput(p.deposit != null ? String(p.deposit) : "");
    setHint("");
    setMode("review");
  }

  function tryExample() {
    const msg = EXAMPLE_MESSAGES[exampleIdx % EXAMPLE_MESSAGES.length];
    setExampleIdx((i) => i + 1);
    setRaw(msg);
  }

  async function finalise(values: BookingFormValues, source: "whatsapp" | "manual") {
    const booking = addBooking({
      ...values,
      status: values.paid > 0 ? "confirmed" : "pending",
      source,
      rawMessage: source === "whatsapp" ? raw : undefined,
    });
    setSaved(booking);
    setSheetCopied(false);
    if (sheetCopy) {
      try {
        await navigator.clipboard.writeText(sheetRow(booking));
        setSheetCopied(true);
      } catch {
        // clipboard unavailable — quietly skip
      }
    }
    setMode("saved");
  }

  /** Fast path: confirm straight from the detected card. */
  function confirmFromReview() {
    if (!parsed) return;
    const date = parsed.date ?? prefillDate;
    if (!date) {
      setHint("We couldn't find a date in the message — add it below, then save.");
      setMode("edit");
      return;
    }
    const depositAmount = parseFloat(depositInput.replace(/,/g, "")) || 0;
    const clientName = parsed.clientName ?? parsed.title ?? "Client";
    void finalise(
      {
        title: parsed.title ?? `${clientName} — Booking`,
        clientName,
        phone: parsed.phone,
        service: parsed.service ?? template.defaultService,
        date,
        startTime: parsed.startTime,
        endTime: parsed.endTime,
        venue: parsed.venue,
        total: parsed.total ?? 0,
        deposit: depositAmount,
        paid: depositPaid ? depositAmount : 0,
      },
      "whatsapp",
    );
  }

  function resetAllState() {
    setRaw("");
    setParsed(null);
    setSaved(null);
    setHint("");
    setSheetCopied(false);
    setMode("paste");
  }

  const detectedCount = parsed?.detected.length ?? 0;
  const reviewDate = parsed?.date ?? prefillDate;
  const conflicts = findConflicts(bookings, {
    date: reviewDate,
    startTime: parsed?.startTime,
    endTime: parsed?.endTime,
  });

  const formInitial = parsed
    ? {
        title: parsed.title,
        clientName: parsed.clientName,
        phone: parsed.phone,
        service: parsed.service ?? template.defaultService,
        date: parsed.date ?? prefillDate,
        startTime: parsed.startTime,
        endTime: parsed.endTime,
        venue: parsed.venue,
        total: parsed.total,
        deposit: parsed.deposit,
        paid: depositPaid ? parseFloat(depositInput.replace(/,/g, "")) || 0 : 0,
      }
    : undefined;

  return (
    <div className={`max-w-md mx-auto md:max-w-lg ${mode === "review" ? "pb-44 md:pb-0" : ""}`}>
      {/* Screen header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-heading text-display-lg-mobile text-on-surface">
          {mode === "saved" ? "Saved!" : "Add a booking"}
        </h2>
        <button
          onClick={() => router.push("/home")}
          className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-colors"
          aria-label="Close"
        >
          <Icon name="close" size={24} />
        </button>
      </div>

      {mode === "paste" && (
        <div className="flex flex-col gap-stack-gap-md mt-2">
          <p className="text-body-md text-on-surface-variant">
            Paste the client&apos;s WhatsApp message — BookFlow fills in the booking
            for you.
          </p>

          <div className="relative">
            <textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder={`e.g. "Hi! Nak book photobooth 26/7 kat Setia City Convention, 7pm. Berapa harga? — Aisha 012-345 6789"`}
              className="w-full min-h-52 bg-surface border-2 border-dashed border-outline-variant rounded-card px-5 py-4 text-body-md text-on-surface placeholder:text-muted-ink/60 focus:outline-none focus:border-primary focus:border-solid transition-colors resize-y"
            />
            {!raw && (
              <div className="absolute bottom-4 right-4 pointer-events-none text-muted-ink/50">
                <Icon name="content_paste" size={22} />
              </div>
            )}
          </div>

          <button
            onClick={runParse}
            disabled={!raw.trim()}
            className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary text-label-md py-4 rounded-btn shadow-md hover:opacity-90 transition-opacity active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon name="auto_awesome" size={20} />
            Turn it into a booking
          </button>

          <div className="flex items-center justify-between">
            <button
              onClick={tryExample}
              className="flex items-center gap-1.5 text-body-sm text-muted-ink hover:text-primary transition-colors py-2"
            >
              <Icon name="magic_button" size={18} />
              Try an example
            </button>
            <button
              onClick={() => setMode("manual")}
              className="flex items-center gap-1.5 text-body-sm text-muted-ink hover:text-primary transition-colors py-2"
            >
              <Icon name="edit_note" size={18} />
              Enter manually instead
            </button>
          </div>
        </div>
      )}

      {mode === "review" && parsed && (
        <div className="flex flex-col gap-stack-gap-md">
          <p className="text-body-sm text-on-surface-variant -mt-1 mb-1">
            We filled this in for you — double-check and save.
          </p>

          {/* Detected card */}
          <div className="bg-surface rounded-card p-stack-gap-md shadow-ambient">
            <div className="flex items-center justify-between mb-4 border-b border-surface-variant pb-3">
              <span className="text-label-md text-primary bg-primary/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Icon name="auto_awesome" size={14} />
                {detectedCount > 0 ? `Detected ${detectedCount} details` : "Nothing detected"}
              </span>
              <button
                onClick={() => setMode("edit")}
                className="text-primary text-label-md hover:opacity-80 px-1 py-1"
              >
                EDIT
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <DetectedRow
                icon="person"
                label="Client name"
                value={parsed.clientName}
                missing="Not caught — tap EDIT"
              />
              <DetectedRow
                icon="camera_alt"
                label="Service"
                value={
                  parsed.service
                    ? parsed.eventType
                      ? `${parsed.service} — ${parsed.eventType}`
                      : parsed.service
                    : (parsed.eventType ?? template.defaultService)
                }
              />
              <div className="grid grid-cols-2 gap-4">
                <DetectedRow
                  icon="calendar_today"
                  label="Date"
                  value={reviewDate ? fmtDayShort(reviewDate) : undefined}
                  missing="Add date"
                />
                <DetectedRow
                  icon="schedule"
                  label="Time"
                  value={
                    parsed.startTime
                      ? parsed.endTime
                        ? fmtTimeRange(parsed.startTime, parsed.endTime)
                        : fmtTime(parsed.startTime)
                      : undefined
                  }
                />
              </div>
              <DetectedRow icon="location_on" label="Venue" value={parsed.venue} />
              <div className="grid grid-cols-2 gap-4">
                <DetectedRow
                  icon="payments"
                  label="Price"
                  value={parsed.total != null ? fmtRM(parsed.total) : undefined}
                  strong
                />
                <DetectedRow
                  icon="call"
                  label="Phone"
                  value={parsed.phone ? `+${parsed.phone}` : undefined}
                />
              </div>
            </div>
          </div>

          {/* Double-booking warning */}
          {conflicts.length > 0 && (
            <div className="bg-secondary-container/15 border border-secondary-container/40 rounded-btn px-4 py-3 flex items-start gap-3">
              <Icon name="warning" size={20} className="text-secondary mt-0.5" />
              <p className="text-body-sm text-on-surface">
                You already have{" "}
                <span className="font-semibold">{conflicts[0].title}</span> on this date
                {conflicts[0].startTime && ` (${fmtTimeRange(conflicts[0].startTime, conflicts[0].endTime)})`}
                . Double-check before confirming.
              </p>
            </div>
          )}

          {/* Deposit status */}
          <div>
            <span className="text-label-md text-muted-ink block mb-2 px-1">
              Deposit Status
            </span>
            <div className="bg-surface-variant p-1 rounded-2xl flex">
              <button
                onClick={() => setDepositPaid(false)}
                className={`flex-1 py-3 text-center rounded-xl text-body-sm font-semibold transition-colors ${
                  !depositPaid
                    ? "bg-surface text-on-surface shadow-sm"
                    : "text-muted-ink hover:text-on-surface"
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setDepositPaid(true)}
                className={`flex-1 py-3 text-center rounded-xl text-body-sm font-semibold transition-colors ${
                  depositPaid
                    ? "bg-surface text-on-surface shadow-sm"
                    : "text-muted-ink hover:text-on-surface"
                }`}
              >
                Paid
              </button>
            </div>
            {depositPaid && (
              <div className="flex items-center gap-2 mt-3 px-1">
                <span className="text-body-sm text-on-surface-variant shrink-0">
                  Amount received (RM)
                </span>
                <input
                  value={depositInput}
                  onChange={(e) => setDepositInput(e.target.value)}
                  inputMode="decimal"
                  placeholder="0"
                  className="flex-1 bg-surface border border-outline-variant rounded-btn px-3 py-2 text-body-md text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
            )}
          </div>

          <button
            onClick={() => setMode("paste")}
            className="flex items-center gap-1.5 text-body-sm text-muted-ink hover:text-on-surface transition-colors self-center py-1"
          >
            <Icon name="arrow_back" size={18} />
            Back to the message
          </button>

          {/* Sticky confirm bar (in-flow on desktop) */}
          <div className="fixed bottom-20 left-0 w-full bg-background/90 backdrop-blur-sm px-container-margin py-4 border-t border-surface-variant z-40 md:static md:bg-transparent md:border-0 md:px-0 md:py-0 md:backdrop-blur-none">
            <label className="flex items-center gap-2 mb-3 px-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={sheetCopy}
                onChange={(e) => setSheetCopy(e.target.checked)}
                className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary bg-surface accent-[#004334]"
              />
              <span className="text-body-sm text-on-surface">
                Also save to Google Sheet
                <span className="text-muted-ink"> (copies a ready row)</span>
              </span>
            </label>
            <button
              onClick={confirmFromReview}
              className="w-full bg-primary text-on-primary text-body-md font-semibold h-12 rounded-btn flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
            >
              Confirm &amp; Save
            </button>
          </div>
        </div>
      )}

      {mode === "edit" && parsed && (
        <div className="flex flex-col gap-stack-gap-md mt-2">
          {hint && (
            <p className="text-body-sm text-on-surface bg-secondary-container/15 border border-secondary-container/40 rounded-btn px-4 py-3">
              {hint}
            </p>
          )}
          <BookingForm
            initial={formInitial}
            detected={parsed.detected}
            submitLabel="Save booking"
            onSubmit={(v) => void finalise(v, "whatsapp")}
          />
          <button
            onClick={() => {
              setHint("");
              setMode("review");
            }}
            className="flex items-center gap-1.5 text-body-sm text-muted-ink hover:text-on-surface transition-colors self-center py-2"
          >
            <Icon name="arrow_back" size={18} />
            Back to summary
          </button>
        </div>
      )}

      {mode === "manual" && (
        <div className="flex flex-col gap-stack-gap-md mt-2">
          <BookingForm
            initial={prefillDate ? { date: prefillDate } : undefined}
            submitLabel="Save booking"
            onSubmit={(v) => void finalise(v, "manual")}
          />
          <button
            onClick={() => setMode("paste")}
            className="flex items-center gap-1.5 text-body-sm text-muted-ink hover:text-on-surface transition-colors self-center py-2"
          >
            <Icon name="content_paste" size={18} />
            Paste a WhatsApp message instead
          </button>
        </div>
      )}

      {mode === "saved" && saved && (
        <div className="flex flex-col gap-stack-gap-md items-stretch">
          <div className="flex flex-col items-center py-6">
            <span className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Icon name="check_circle" fill size={36} />
            </span>
            <p className="text-body-md text-on-surface-variant text-center">
              Booking saved — one less thing to re-type.
            </p>
            {sheetCopied && (
              <p className="mt-2 text-body-sm text-primary bg-primary/10 rounded-full py-1.5 px-4 flex items-center gap-1.5">
                <Icon name="table_chart" size={16} />
                Sheet row copied — paste it into your Google Sheet
              </p>
            )}
          </div>

          <article className="bg-surface rounded-card p-5 shadow-ambient border border-surface-variant/50">
            <div className="flex justify-between items-start gap-3 mb-3">
              <div className="min-w-0">
                <h4 className="font-heading text-headline-sm text-on-surface mb-1">
                  {saved.title}
                </h4>
                <p className="text-body-sm text-muted-ink">{saved.service}</p>
              </div>
              <StatusChip booking={saved} />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center gap-2 text-on-surface-variant text-body-sm">
                <Icon name="calendar_today" size={18} />
                {fmtDayShort(saved.date)}
                {saved.startTime && ` · ${fmtTimeRange(saved.startTime, saved.endTime)}`}
              </div>
              {saved.venue && (
                <div className="flex items-center gap-2 text-on-surface-variant text-body-sm">
                  <Icon name="location_on" size={18} />
                  {saved.venue}
                </div>
              )}
              <div className="flex items-center gap-2 text-on-surface-variant text-body-sm">
                <Icon name="payments" size={18} />
                {fmtRM(saved.total)}
                {saved.deposit > 0 && ` · deposit ${fmtRM(saved.deposit)}`}
              </div>
            </div>
          </article>

          {saved.phone && (
            <>
              <button
                onClick={() => {
                  const note = attachInvoice
                    ? "\n\n📎 Sending the invoice PDF along with this."
                    : "";
                  const url = waLink(
                    saved.phone!,
                    bookingConfirmationMessage(saved, businessName) + note,
                  );
                  if (attachInvoice) {
                    runInvoice(saved, () => window.open(url, "_blank", "noopener"));
                  } else {
                    window.open(url, "_blank", "noopener");
                  }
                }}
                className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary text-label-md py-4 rounded-btn shadow-md hover:opacity-90 transition-opacity"
              >
                <Icon name="send" size={18} />
                Send confirmation on WhatsApp
              </button>
              <button
                onClick={() => setAttachInvoice(!attachInvoice)}
                className="flex items-center gap-2.5 -mt-2 px-1 self-center text-body-sm text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <Icon
                  name={attachInvoice ? "check_box" : "check_box_outline_blank"}
                  size={20}
                  className={attachInvoice ? "text-primary" : ""}
                />
                Attach the invoice PDF too
              </button>
            </>
          )}
          <div className="grid grid-cols-2 gap-gutter">
            <button
              onClick={resetAllState}
              className="flex items-center justify-center gap-2 border border-primary text-primary text-label-md py-3.5 rounded-btn hover:bg-primary/5 transition-colors"
            >
              <Icon name="add" size={18} />
              Add another
            </button>
            <Link
              href="/bookings"
              className="flex items-center justify-center gap-2 border border-outline-variant text-on-surface-variant text-label-md py-3.5 rounded-btn hover:bg-surface-container-low transition-colors"
            >
              <Icon name="list_alt" size={18} />
              View bookings
            </Link>
          </div>
        </div>
      )}
      {invoiceSheet}
    </div>
  );
}
