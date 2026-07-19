import type { Booking } from "./types";
import { todayISO } from "./dates";

export type ImportedBooking = Omit<Booking, "id" | "createdAt" | "source">;

export interface ImportResult {
  bookings: ImportedBooking[];
  skipped: number;
}

/**
 * "Import from Google Sheets" — the pragmatic version: select your rows in
 * Sheets/Excel, copy, and paste. Handles tab- or comma-separated rows, with
 * or without a header row.
 *
 * Recognised headers: date, client/name, title/event, venue/location,
 * total/price, deposit, paid, phone, service, notes.
 * Without headers, columns are assumed: date · client · title · venue · total · deposit · paid
 */
export function parseSheetPaste(text: string, defaultService: string): ImportResult {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { bookings: [], skipped: 0 };

  const delimiter = lines[0].includes("\t") ? "\t" : ",";
  const rows = lines.map((l) => l.split(delimiter).map((c) => c.trim()));

  const HEADER_MAP: Record<string, keyof ImportedBooking | "ignore"> = {
    date: "date",
    tarikh: "date",
    client: "clientName",
    name: "clientName",
    nama: "clientName",
    customer: "clientName",
    title: "title",
    event: "title",
    booking: "title",
    majlis: "title",
    venue: "venue",
    location: "venue",
    tempat: "venue",
    total: "total",
    price: "total",
    harga: "total",
    amount: "total",
    deposit: "deposit",
    depo: "deposit",
    paid: "paid",
    dibayar: "paid",
    phone: "phone",
    tel: "phone",
    whatsapp: "phone",
    service: "service",
    pakej: "service",
    package: "service",
    notes: "notes",
    nota: "notes",
    remarks: "notes",
  };

  let columnKeys: (keyof ImportedBooking | "ignore")[] | null = null;
  let dataRows = rows;

  const headerHits = rows[0].filter((c) => HEADER_MAP[c.toLowerCase()]).length;
  if (headerHits >= 2) {
    columnKeys = rows[0].map((c) => HEADER_MAP[c.toLowerCase()] ?? "ignore");
    dataRows = rows.slice(1);
  }

  const defaultOrder: (keyof ImportedBooking)[] = [
    "date",
    "clientName",
    "title",
    "venue",
    "total",
    "deposit",
    "paid",
  ];

  const today = todayISO();
  const bookings: ImportedBooking[] = [];
  let skipped = 0;

  for (const row of dataRows) {
    const raw: Partial<Record<keyof ImportedBooking, string>> = {};
    row.forEach((cell, i) => {
      const key = columnKeys ? columnKeys[i] : defaultOrder[i];
      if (key && key !== "ignore" && cell) raw[key as keyof ImportedBooking] = cell;
    });

    const date = normaliseDate(raw.date ?? "");
    if (!date) {
      skipped++;
      continue;
    }
    const total = money(raw.total);
    const deposit = money(raw.deposit);
    const paid = money(raw.paid);
    const clientName = raw.clientName || raw.title || "Client";
    const title = raw.title || `${clientName} — Booking`;

    bookings.push({
      title,
      clientName,
      phone: raw.phone ? raw.phone.replace(/[^\d+]/g, "") : undefined,
      service: raw.service || defaultService,
      date,
      venue: raw.venue || undefined,
      total,
      deposit,
      paid,
      notes: raw.notes || undefined,
      status: date < today ? "completed" : paid > 0 ? "confirmed" : "pending",
    });
  }

  return { bookings, skipped };
}

function money(v?: string): number {
  if (!v) return 0;
  const n = parseFloat(v.replace(/rm/i, "").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/** Accepts "2026-07-26", "26/7/2026", "26/7", "26-07-26". */
function normaliseDate(v: string): string | undefined {
  const s = v.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^([0-3]?\d)[\/\-.]([01]?\d)(?:[\/\-.](\d{2,4}))?$/);
  if (!m) return undefined;
  const day = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  if (day < 1 || day > 31 || month < 1 || month > 12) return undefined;
  let year = m[3] ? parseInt(m[3], 10) : new Date().getFullYear();
  if (year < 100) year += 2000;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
