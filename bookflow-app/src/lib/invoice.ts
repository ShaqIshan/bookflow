import type { Booking, Profile } from "./types";
import { balanceDue } from "./types";
import { fmtDayShort, fmtTimeRange } from "./dates";
import { fmtRM } from "./money";

/** Brand colours (print-safe RGB) */
const EMERALD: [number, number, number] = [14, 92, 74]; // #0E5C4A
const INK: [number, number, number] = [29, 27, 25]; // #1d1b19
const MUTED: [number, number, number] = [138, 132, 120]; // #8A8478
const PAPER: [number, number, number] = [250, 247, 242]; // #FAF7F2
const AMBER: [number, number, number] = [131, 84, 0]; // #835400

export interface InvoicePdf {
  blob: Blob;
  filename: string;
}

/**
 * Renders a clean A4 invoice for a booking. jsPDF is imported lazily so the
 * ~300KB library never slows down normal app loading.
 */
export async function generateInvoicePdf(
  booking: Booking,
  profile: Profile,
  invoiceNo: string,
): Promise<InvoicePdf> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth(); // 595
  const M = 48; // page margin
  const owed = balanceDue(booking);
  const inv = profile.invoice;

  // ── Header band ─────────────────────────────────────────
  doc.setFillColor(...EMERALD);
  doc.rect(0, 0, W, 110, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(profile.businessName || "BookFlow", M, 52);
  doc.setFontSize(26);
  doc.text("INVOICE", W - M, 52, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(170, 241, 217); // primary-fixed mint
  doc.text(invoiceNo, W - M, 70, { align: "right" });
  const contactBits = [inv.phone, inv.regNo ? `Reg: ${inv.regNo}` : ""].filter(Boolean);
  if (contactBits.length > 0) {
    doc.text(contactBits.join("   ·   "), M, 72);
  }
  if (inv.address) {
    const addr = doc.splitTextToSize(inv.address.replace(/\n+/g, ", "), W / 2);
    doc.text(addr.slice(0, 2), M, 88);
  }

  // ── Meta row ────────────────────────────────────────────
  let y = 150;
  doc.setTextColor(...MUTED);
  doc.setFontSize(9);
  doc.text("BILLED TO", M, y);
  doc.text("ISSUED", W - M - 150, y);
  doc.text("EVENT DATE", W - M, y, { align: "right" });
  y += 16;
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(booking.clientName, M, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(fmtDayShort(new Date().toISOString().slice(0, 10)), W - M - 150, y);
  doc.text(fmtDayShort(booking.date), W - M, y, { align: "right" });
  if (booking.phone) {
    y += 15;
    doc.setTextColor(...MUTED);
    doc.text(`+${booking.phone}`, M, y);
  }

  // ── Line item table ─────────────────────────────────────
  y += 36;
  doc.setFillColor(...PAPER);
  doc.rect(M, y, W - M * 2, 26, "F");
  doc.setTextColor(...MUTED);
  doc.setFontSize(9);
  doc.text("DESCRIPTION", M + 12, y + 17);
  doc.text("AMOUNT", W - M - 12, y + 17, { align: "right" });
  y += 26 + 22;

  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(booking.title, M + 12, y);
  doc.text(fmtRM(booking.total), W - M - 12, y, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...MUTED);
  const detailLines = [
    booking.service,
    `${fmtDayShort(booking.date)}${booking.startTime ? ` · ${fmtTimeRange(booking.startTime, booking.endTime)}` : ""}`,
    booking.venue ?? "",
  ].filter(Boolean);
  detailLines.forEach((line) => {
    y += 15;
    doc.text(line, M + 12, y);
  });
  y += 20;
  doc.setDrawColor(230, 226, 222);
  doc.line(M, y, W - M, y);

  // ── Totals ──────────────────────────────────────────────
  const labelX = W - M - 170;
  const valueX = W - M - 12;
  y += 26;
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text("Subtotal", labelX, y);
  doc.setTextColor(...INK);
  doc.text(fmtRM(booking.total), valueX, y, { align: "right" });
  y += 18;
  doc.setTextColor(...MUTED);
  doc.text("Paid to date", labelX, y);
  doc.setTextColor(...INK);
  doc.text(`- ${fmtRM(booking.paid)}`, valueX, y, { align: "right" });
  y += 10;
  doc.line(labelX, y, W - M, y);
  y += 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  if (owed > 0) {
    doc.setTextColor(...AMBER);
    doc.text("Balance due", labelX, y);
    doc.text(fmtRM(owed), valueX, y, { align: "right" });
    if (booking.deposit > booking.paid) {
      y += 15;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...MUTED);
      doc.text(`(includes deposit of ${fmtRM(booking.deposit)})`, valueX, y, {
        align: "right",
      });
    }
  } else {
    doc.setTextColor(...EMERALD);
    doc.text("PAID IN FULL", labelX, y);
    doc.text(fmtRM(0), valueX, y, { align: "right" });
  }

  // ── Payment note ────────────────────────────────────────
  y += 40;
  if (inv.payNote) {
    const noteLines = doc.splitTextToSize(inv.payNote, W - M * 2 - 24);
    const boxH = 34 + noteLines.length * 13;
    doc.setFillColor(...PAPER);
    doc.setDrawColor(230, 226, 222);
    doc.roundedRect(M, y, W - M * 2, boxH, 6, 6, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...EMERALD);
    doc.text("PAYMENT DETAILS", M + 12, y + 18);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...INK);
    doc.setFontSize(9.5);
    doc.text(noteLines, M + 12, y + 33);
    y += boxH + 24;
  }

  // ── Footer ──────────────────────────────────────────────
  const footY = doc.internal.pageSize.getHeight() - 56;
  doc.setDrawColor(230, 226, 222);
  doc.line(M, footY - 16, W - M, footY - 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...INK);
  doc.text(`Thank you for booking with ${profile.businessName || "us"}!`, M, footY);
  doc.setTextColor(...MUTED);
  doc.setFontSize(8);
  doc.text(`Generated with BookFlow · ${invoiceNo}`, W - M, footY, { align: "right" });

  const safeClient = booking.clientName.replace(/[^\w-]+/g, "-").slice(0, 24);
  const filename = `${invoiceNo}-${safeClient}.pdf`;
  return { blob: doc.output("blob"), filename };
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
