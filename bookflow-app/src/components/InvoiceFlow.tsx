"use client";

import { useState } from "react";
import type { Booking, InvoiceDetails } from "@/lib/types";
import { EMPTY_INVOICE_DETAILS } from "@/lib/types";
import { useBookFlow } from "@/lib/store";
import { downloadBlob, generateInvoicePdf } from "@/lib/invoice";
import Icon from "./Icon";
import Sheet from "./Sheet";

const inputCls =
  "w-full bg-surface border border-outline-variant rounded-btn px-4 py-3 text-body-md text-on-surface placeholder:text-muted-ink/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";

/** The editable business-details fields printed on every invoice. */
export function InvoiceDetailsFields({
  value,
  onChange,
}: {
  value: InvoiceDetails;
  onChange: (v: InvoiceDetails) => void;
}) {
  return (
    <div className="flex flex-col gap-stack-gap-md">
      <label className="block">
        <span className="text-label-md text-muted-ink uppercase block mb-1.5">
          Business phone
        </span>
        <input
          className={inputCls}
          value={value.phone}
          onChange={(e) => onChange({ ...value, phone: e.target.value })}
          placeholder="012-345 6789"
          inputMode="tel"
        />
      </label>
      <label className="block">
        <span className="text-label-md text-muted-ink uppercase block mb-1.5">
          Business address <span className="normal-case">(optional)</span>
        </span>
        <textarea
          className={`${inputCls} min-h-16 resize-y`}
          value={value.address}
          onChange={(e) => onChange({ ...value, address: e.target.value })}
          placeholder="12, Jalan Contoh 3/4, 40000 Shah Alam"
        />
      </label>
      <label className="block">
        <span className="text-label-md text-muted-ink uppercase block mb-1.5">
          SSM / registration no. <span className="normal-case">(optional)</span>
        </span>
        <input
          className={inputCls}
          value={value.regNo}
          onChange={(e) => onChange({ ...value, regNo: e.target.value })}
          placeholder="202601234567 (003456789-X)"
        />
      </label>
      <label className="block">
        <span className="text-label-md text-muted-ink uppercase block mb-1.5">
          How clients pay you
        </span>
        <textarea
          className={`${inputCls} min-h-16 resize-y`}
          value={value.payNote}
          onChange={(e) => onChange({ ...value, payNote: e.target.value })}
          placeholder="Maybank 1234 5678 9012 (Your Business Name) · TnG 012-345 6789"
        />
        <span className="text-body-sm text-muted-ink block mt-1.5">
          Shown on the invoice so clients know exactly where to send the deposit
          or balance.
        </span>
      </label>
    </div>
  );
}

interface PendingInvoice {
  booking: Booking;
  andThen?: () => void;
}

/**
 * One hook for "give me this booking's invoice PDF".
 * - First ever use: asks for business details once (skippable), then remembers.
 * - On phones: opens the native share sheet with the PDF attached (→ WhatsApp).
 * - Elsewhere: downloads the PDF.
 * Render `invoiceSheet` once in the page; call `runInvoice(booking)` anywhere.
 */
export function useInvoiceFlow(onToast?: (msg: string) => void) {
  const profile = useBookFlow((s) => s.profile);
  const assignInvoiceNo = useBookFlow((s) => s.assignInvoiceNo);
  const setInvoiceDetails = useBookFlow((s) => s.setInvoiceDetails);
  const markInvoicePromptDone = useBookFlow((s) => s.markInvoicePromptDone);
  const [pending, setPending] = useState<PendingInvoice | null>(null);
  const [draft, setDraft] = useState<InvoiceDetails>(EMPTY_INVOICE_DETAILS);

  const detailsKnown =
    profile.invoicePromptDone ||
    Object.values(profile.invoice ?? EMPTY_INVOICE_DETAILS).some((v) => v.trim() !== "");

  async function generate(booking: Booking) {
    const invoiceNo = assignInvoiceNo(booking.id);
    const { blob, filename } = await generateInvoicePdf(
      booking,
      useBookFlow.getState().profile,
      invoiceNo,
    );
    const file = new File([blob], filename, { type: "application/pdf" });
    // Phones/tablets get the native share sheet (→ WhatsApp with the PDF
    // attached); desktop browsers get a straight download.
    const isMobile =
      typeof navigator !== "undefined" &&
      /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
    if (isMobile && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: filename });
        onToast?.("Invoice shared ✓");
        return;
      } catch {
        // user closed the share sheet — fall through to a download
      }
    }
    downloadBlob(blob, filename);
    onToast?.("Invoice PDF downloaded ✓");
  }

  function runInvoice(booking: Booking, andThen?: () => void) {
    if (!detailsKnown) {
      setDraft({ ...EMPTY_INVOICE_DETAILS, ...(profile.invoice ?? {}) });
      setPending({ booking, andThen });
      return;
    }
    void generate(booking).then(() => andThen?.());
  }

  function finishSheet(save: boolean) {
    if (!pending) return;
    if (save) setInvoiceDetails(draft);
    else markInvoicePromptDone();
    const { booking, andThen } = pending;
    setPending(null);
    void generate(booking).then(() => andThen?.());
  }

  const invoiceSheet = (
    <Sheet
      open={Boolean(pending)}
      onClose={() => setPending(null)}
      title="Set up your invoice"
    >
      <div className="flex flex-col gap-stack-gap-md">
        <p className="text-body-sm text-on-surface-variant -mt-1">
          One-time setup — these details appear on every invoice you send. Edit
          them anytime from your business settings (tap your avatar).
        </p>
        <InvoiceDetailsFields value={draft} onChange={setDraft} />
        <button
          onClick={() => finishSheet(true)}
          className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary text-label-md py-4 rounded-btn shadow-md hover:opacity-90 transition-opacity"
        >
          <Icon name="picture_as_pdf" size={20} />
          Save &amp; create invoice
        </button>
        <button
          onClick={() => finishSheet(false)}
          className="text-body-sm text-muted-ink hover:text-on-surface transition-colors self-center py-1"
        >
          Skip — create a plain invoice
        </button>
      </div>
    </Sheet>
  );

  return { runInvoice, invoiceSheet };
}
