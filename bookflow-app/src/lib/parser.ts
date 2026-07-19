/**
 * The hero feature: paste a raw WhatsApp enquiry → structured booking draft.
 *
 * Rule-based extraction tuned for Malaysian SME enquiries — mixed
 * English/Malay, casual formats ("26hb Ogos", "8 malam", "rm300 depo").
 * Everything it finds is a *draft*: the user reviews and confirms.
 */

export type ParsedField =
  | "clientName"
  | "phone"
  | "date"
  | "startTime"
  | "endTime"
  | "venue"
  | "service"
  | "total"
  | "deposit"
  | "eventType";

export interface ParsedBooking {
  clientName?: string;
  phone?: string;
  /** ISO "YYYY-MM-DD" */
  date?: string;
  /** 24h "HH:mm" */
  startTime?: string;
  endTime?: string;
  venue?: string;
  service?: string;
  eventType?: string;
  title?: string;
  total?: number;
  deposit?: number;
  detected: ParsedField[];
}

interface ParseOptions {
  referenceDate?: Date;
  services?: string[];
}

const MONTHS: Record<string, number> = {
  jan: 1, januari: 1, january: 1,
  feb: 2, februari: 2, february: 2,
  mac: 3, mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5, mei: 5,
  jun: 6, june: 6,
  jul: 7, julai: 7, july: 7,
  aug: 8, ogos: 8, ogo: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  okt: 10, oct: 10, oktober: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, dis: 12, disember: 12, december: 12,
};

const WEEKDAYS: Record<string, number> = {
  sunday: 0, sun: 0, ahad: 0,
  monday: 1, mon: 1, isnin: 1,
  tuesday: 2, tue: 2, tues: 2, selasa: 2,
  wednesday: 3, wed: 3, rabu: 3,
  thursday: 4, thu: 4, thur: 4, thurs: 4, khamis: 4,
  friday: 5, fri: 5, jumaat: 5,
  saturday: 6, sat: 6, sabtu: 6,
};

const EVENT_TYPES: [RegExp, string][] = [
  [/\b(wedding|kahwin|nikah|walimah|perkahwinan|sanding)\b/i, "Wedding"],
  [/\b(engagement|tunang|bertunang)\b/i, "Engagement"],
  [/\b(birthday|bday|besday|hari\s?jadi|harijadi)\b/i, "Birthday"],
  [/\b(annual\s?dinner|corporate|company|d&d|dnd|gala|town\s?hall)\b/i, "Corporate Dinner"],
  [/\b(launch(ing)?|grand\s?opening|opening|pelancaran)\b/i, "Launch Event"],
  [/\b(graduation|convo|konvo)\b/i, "Graduation"],
  [/\b(open\s?house|openhouse|raya)\b/i, "Open House"],
  [/\b(party|celebration|majlis)\b/i, "Party"],
];

function toISO(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function isValidDay(d: number, m: number): boolean {
  return d >= 1 && d <= 31 && m >= 1 && m <= 12;
}

/** Resolve a day/month (optional year) to a sensible ISO date near the reference. */
function resolveDate(day: number, month: number, year: number | undefined, ref: Date): string {
  let y = year;
  if (y !== undefined && y < 100) y += 2000;
  if (y === undefined) {
    y = ref.getFullYear();
    const candidate = new Date(y, month - 1, day);
    // Enquiries are about the future — if it looks >45 days in the past, roll a year forward
    const diffDays = (candidate.getTime() - ref.getTime()) / 86_400_000;
    if (diffDays < -45) y += 1;
  }
  return toISO(y, month, day);
}

function extractPhone(text: string): string | undefined {
  const m = text.match(/(?:\+?6\s?0|0)\s?1[0-9][\s-]?\d{3,4}[\s-]?\d{4}\b/);
  if (!m) return undefined;
  let digits = m[0].replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "6" + digits;
  return digits;
}

interface MoneyHit {
  amount: number;
  /** Up to 24 chars immediately before the amount */
  before: string;
  /** Up to 16 chars immediately after the amount */
  after: string;
}

function extractMoney(text: string): { total?: number; deposit?: number } {
  const hits: MoneyHit[] = [];
  const re = /\brm\s*\.?\s*(\d[\d,]*(?:\.\d{1,2})?)\s*(k\b)?/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    let amount = parseFloat(m[1].replace(/,/g, ""));
    if (m[2]) amount *= 1000;
    hits.push({
      amount,
      before: text.slice(Math.max(0, m.index - 24), m.index).toLowerCase(),
      after: text.slice(m.index + m[0].length, m.index + m[0].length + 16).toLowerCase(),
    });
  }
  if (hits.length === 0) return {};

  // Deposit keyword right before ("deposit RM500") or immediately after ("RM500 depo ok?")
  const isDeposit = (h: MoneyHit) =>
    /\b(deposit|depo|dp|booking\s?fee|bayar\s?dulu|cengkeram)\b[^a-z]*$/.test(h.before) ||
    /^\s*(?:as\s+|for\s+)?(?:deposit|depo|dp|booking\s?fee)\b/.test(h.after);
  const isTotal = (h: MoneyHit) =>
    /\b(total|price|harga|package|pakej|charge|rate|cost|quote|budget)\b/.test(h.before);

  const deposits = hits.filter(isDeposit);
  const nonDeposits = hits.filter((h) => !isDeposit(h));

  let deposit = deposits.length > 0 ? deposits[0].amount : undefined;
  let total: number | undefined;
  const totalTagged = nonDeposits.filter(isTotal);
  if (totalTagged.length > 0) {
    total = Math.max(...totalTagged.map((h) => h.amount));
  } else if (nonDeposits.length > 0) {
    total = Math.max(...nonDeposits.map((h) => h.amount));
  }
  // A lone "deposit rm300" message: keep total unknown rather than guessing
  if (total !== undefined && deposit !== undefined && deposit > total) {
    // e.g. "total rm500, deposit rm800" is nonsense — trust the bigger as total
    [total, deposit] = [deposit, total];
  }
  return { total, deposit };
}

function extractDate(lower: string, ref: Date): string | undefined {
  // Relative words first
  if (/\b(today|hari\s?ini|harini|tonight|malam\s?ini|mlm\s?ni)\b/.test(lower)) {
    return toISO(ref.getFullYear(), ref.getMonth() + 1, ref.getDate());
  }
  if (/\b(tomorrow|tmrw|esok|bsk|besok)\b/.test(lower)) {
    const d = new Date(ref);
    d.setDate(d.getDate() + 1);
    return toISO(d.getFullYear(), d.getMonth() + 1, d.getDate());
  }
  if (/\blusa\b/.test(lower)) {
    const d = new Date(ref);
    d.setDate(d.getDate() + 2);
    return toISO(d.getFullYear(), d.getMonth() + 1, d.getDate());
  }

  // "26/7", "26-7-2026", "26.07" (skip if it's part of a time like 7.30pm)
  const dm = lower.match(
    /\b([0-3]?\d)\s*[\/\-.]\s*([01]?\d)(?:\s*[\/\-.]\s*(\d{2,4}))?\b(?!\s*(?:am|pm|pagi|petang|ptg|malam|mlm))/,
  );
  if (dm) {
    const day = parseInt(dm[1], 10);
    const month = parseInt(dm[2], 10);
    if (isValidDay(day, month)) {
      return resolveDate(day, month, dm[3] ? parseInt(dm[3], 10) : undefined, ref);
    }
  }

  // "26 July", "26hb Ogos 2026", "26th aug"
  const monthNames = Object.keys(MONTHS).join("|");
  const dMon = lower.match(
    new RegExp(`\\b([0-3]?\\d)(?:st|nd|rd|th|hb)?\\s+(${monthNames})\\b\\.?\\s*(\\d{4})?`),
  );
  if (dMon) {
    const day = parseInt(dMon[1], 10);
    const month = MONTHS[dMon[2]];
    if (isValidDay(day, month)) {
      return resolveDate(day, month, dMon[3] ? parseInt(dMon[3], 10) : undefined, ref);
    }
  }

  // "July 26"
  const monD = lower.match(
    new RegExp(`\\b(${monthNames})\\s+([0-3]?\\d)(?:st|nd|rd|th|hb)?\\b(?:\\s*,?\\s*(\\d{4}))?`),
  );
  if (monD) {
    const day = parseInt(monD[2], 10);
    const month = MONTHS[monD[1]];
    if (isValidDay(day, month)) {
      return resolveDate(day, month, monD[3] ? parseInt(monD[3], 10) : undefined, ref);
    }
  }

  // "this saturday", "next friday", "sabtu ni", bare weekday
  const weekdayNames = Object.keys(WEEKDAYS).join("|");
  const wd = lower.match(new RegExp(`\\b(this|next)?\\s*(${weekdayNames})\\b(\\s*(ni|ini|depan))?`));
  if (wd) {
    const target = WEEKDAYS[wd[2]];
    const isNext = wd[1] === "next" || wd[4] === "depan";
    let delta = (target - ref.getDay() + 7) % 7;
    if (delta === 0) delta = isNext ? 7 : 0;
    else if (isNext && delta < 7) delta += 7;
    const d = new Date(ref);
    d.setDate(d.getDate() + delta);
    return toISO(d.getFullYear(), d.getMonth() + 1, d.getDate());
  }

  return undefined;
}

interface TimeHit {
  start?: string;
  end?: string;
}

function meridiemToOffset(mer: string | undefined, hour: number): number {
  if (!mer) return hour; // assume as-given (24h)
  const pm = /^(pm|ptg|petang|mlm|malam)$/.test(mer);
  const am = /^(am|pagi)$/.test(mer);
  if (pm && hour < 12) return hour + 12;
  if (am && hour === 12) return 0;
  return hour;
}

function hhmm(h: number, m: number): string {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function extractTime(lower: string): TimeHit {
  const MER = "am|pm|pagi|ptg|petang|mlm|malam";
  // Range: "7pm-11.30pm", "8 - 11 malam", "7:00 to 10:00pm"
  const range = lower.match(
    new RegExp(
      `\\b([01]?\\d|2[0-3])(?:[:.]([0-5]\\d))?\\s*(${MER})?\\s*(?:-|–|—|to|until|till|hingga|sampai|smpi)\\s*([01]?\\d|2[0-3])(?:[:.]([0-5]\\d))?\\s*(${MER})\\b`,
    ),
  );
  if (range) {
    const endMer = range[6];
    const startMer = range[3] ?? endMer; // "7-11pm" → both pm
    let sh = meridiemToOffset(startMer, parseInt(range[1], 10));
    const eh = meridiemToOffset(endMer, parseInt(range[4], 10));
    if (sh > eh && sh - 12 >= 0 && sh - 12 < eh) sh -= 12; // "11am-2pm" style fix
    return {
      start: hhmm(sh, range[2] ? parseInt(range[2], 10) : 0),
      end: hhmm(eh, range[5] ? parseInt(range[5], 10) : 0),
    };
  }

  // Single with meridiem: "8 malam", "7.30pm"
  const single = lower.match(
    new RegExp(`\\b([01]?\\d|2[0-3])(?:[:.]([0-5]\\d))?\\s*(${MER})\\b`),
  );
  if (single) {
    const h = meridiemToOffset(single[3], parseInt(single[1], 10));
    return { start: hhmm(h, single[2] ? parseInt(single[2], 10) : 0) };
  }

  // Bare 24h "19:00" (colon required so dates/prices don't match)
  const h24 = lower.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (h24) {
    return { start: hhmm(parseInt(h24[1], 10), parseInt(h24[2], 10)) };
  }
  return {};
}

function applyDuration(lower: string, hit: TimeHit): TimeHit {
  if (!hit.start || hit.end) return hit;
  const dur = lower.match(/\b(\d{1,2}(?:\.\d)?)\s*(?:hours?|hrs?|jam)\b/);
  if (!dur) return hit;
  const [h, m] = hit.start.split(":").map(Number);
  const minutes = h * 60 + m + Math.round(parseFloat(dur[1]) * 60);
  const endH = Math.floor(minutes / 60) % 24;
  return { ...hit, end: hhmm(endH, minutes % 60) };
}

const VENUE_HINT =
  /\b(hall|hotel|convention|centre|center|resort|residence|residensi|club|dewan|cafe|restaurant|ballroom|garden|villa|mall|suite|arena|stadium|pavilion|publika|kompleks|homestay|kondo|condo|apartment|events?\s?space)\b/i;

function cleanVenue(raw: string): string | undefined {
  let v = raw.trim();
  // Cut trailing clauses that belong to date/time/price
  v = v.split(
    /\s+(?:on|this|next|at|from|pada|pd|utk|untuk|for)\s+(?=\d|jan|feb|mac|mar|apr|may|mei|jun|jul|aug|ogos|sep|okt|oct|nov|dec|dis|mon|tue|wed|thu|fri|sat|sun|isnin|selasa|rabu|khamis|jumaat|sabtu|ahad|tomorrow|esok)/i,
  )[0];
  v = v.replace(/\s*[,.!?;:]+\s*$/, "").trim();
  if (v.length < 3 || v.length > 70) return undefined;
  if (/^\d/.test(v) && !/^\d+[a-z]?\s/i.test(v)) return undefined;
  return v
    .split(/\s+/)
    .map((w) => (w.length > 2 && /^[a-z]/.test(w) ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function extractVenue(original: string): string | undefined {
  const lines = original.split(/\n+/);

  // Explicit label: "Venue: ..." / "Tempat: ..."
  for (const line of lines) {
    const m = line.match(/\b(?:venue|location|lokasi|tempat|place|alamat|address)\s*[:\-]\s*(.+)/i);
    if (m) {
      const v = cleanVenue(m[1]);
      if (v) return v;
    }
  }

  // Prepositional: "at Setia City Convention Centre", "kat Dewan Seri Melati"
  const prepRe = /\b(?:at|kat|dkt|dekat|di)\s+([^,.\n]{3,70})/gi;
  let m: RegExpExecArray | null;
  const candidates: string[] = [];
  while ((m = prepRe.exec(original)) !== null) {
    const cand = m[1].trim();
    // Skip time-ish captures: "at 7pm", "at 19:00"
    if (/^\d{1,2}([:.]\d{2})?\s*(am|pm|pagi|petang|ptg|malam|mlm)?\b/i.test(cand)) continue;
    if (/^(least|the moment|first)/i.test(cand)) continue;
    const v = cleanVenue(cand);
    if (v) candidates.push(v);
  }
  const hinted = candidates.find((c) => VENUE_HINT.test(c));
  if (hinted) return hinted;
  if (candidates.length > 0) return candidates[0];

  // A standalone line that *looks* like a venue
  for (const line of lines) {
    if (VENUE_HINT.test(line) && line.trim().length <= 60 && !/\brm\b/i.test(line)) {
      const v = cleanVenue(line);
      if (v) return v;
    }
  }
  return undefined;
}

function extractName(original: string): string | undefined {
  // "Nama: Farhan" / "Name - Aisha"
  const label = original.match(/\b(?:nama|name)\s*[:\-]\s*([A-Za-z@' .]{2,30})/i);
  if (label) return tidyName(label[1]);

  // "I'm Aisha", "This is Danish", "saya Farhan" — keyword is case-insensitive,
  // but the captured name itself must be capitalised in the original text.
  const introRe = /\b(?:i'?m|i am|this is|saya|name is)\s+/gi;
  let im: RegExpExecArray | null;
  while ((im = introRe.exec(original)) !== null) {
    const rest = original.slice(im.index + im[0].length);
    const nm = rest.match(/^([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/);
    if (nm && !isStopWord(nm[1])) return tidyName(nm[1]);
  }

  const here = original.match(/\b([A-Z][a-z]{2,15})\s+here\b/);
  if (here && !isStopWord(here[1])) return tidyName(here[1]);

  // Trailing signature at the very end, even in a single-line message: "… - Aisha"
  const tail = original.match(/[-–—~]\s*([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s*[.!]?\s*$/);
  if (tail && !isStopWord(tail[1])) return tidyName(tail[1]);

  // Trailing signature: "- Aisha" or a lone short name on the last line
  const lines = original.trim().split(/\n+/);
  const last = lines[lines.length - 1].trim();
  const sig = last.match(/^[-–—~]\s*([A-Za-z][A-Za-z .']{1,25})$/);
  if (sig) return tidyName(sig[1]);
  if (
    lines.length > 1 &&
    /^[A-Z][a-z]+(\s[A-Z][a-z]+)?$/.test(last) &&
    !isStopWord(last) &&
    last.length <= 25
  ) {
    return tidyName(last);
  }
  return undefined;
}

function isStopWord(word: string): boolean {
  return /^(The|This|That|There|Thanks|Thank|Hello|Please|Booking|Total|Deposit|Price|Wedding|Birthday|Tomorrow|Today|Available|Boleh|Nak|Berapa|Macam)$/i.test(
    word.trim().split(/\s/)[0],
  );
}

function tidyName(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function extractEventType(text: string): string | undefined {
  for (const [re, label] of EVENT_TYPES) {
    if (re.test(text)) return label;
  }
  return undefined;
}

function extractService(lower: string, services: string[] | undefined): string | undefined {
  if (/\b360\b/.test(lower) && services?.some((s) => /360/.test(s))) {
    return services.find((s) => /360/.test(s));
  }
  if (services) {
    for (const s of services) {
      const sl = s.toLowerCase();
      if (lower.includes(sl) || lower.includes(sl.replace(/\s+/g, ""))) return s;
    }
  }
  if (/photo\s?booth|photobooth/.test(lower)) return services?.[0] ?? "Photo Booth";
  if (/photographer|photography/.test(lower)) {
    return services?.find((s) => /photograph/i.test(s)) ?? "Photography";
  }
  return undefined;
}

function buildTitle(p: ParsedBooking, original: string): string | undefined {
  // Couple: "Aisha & Faiz" / "Aisha and Faiz" / "Aisha dan Faiz"
  const couple = original.match(/\b([A-Z][a-z]+)\s*(?:&|and|dan)\s*([A-Z][a-z]+)\b/);
  if (couple && p.eventType === "Wedding") {
    return `${couple[1]} & ${couple[2]} Wedding`;
  }
  if (couple && p.eventType === "Engagement") {
    return `${couple[1]} & ${couple[2]} Engagement`;
  }
  if (p.eventType === "Birthday" && p.clientName) {
    return `${p.clientName.split(" ")[0]}'s Birthday`;
  }
  if (p.eventType === "Corporate Dinner") {
    // "ABC Sdn Bhd annual dinner" → grab the company-looking phrase
    const co = original.match(/\b([A-Z][A-Za-z&. ]{2,28}(?:Sdn\s?Bhd|Bhd|Enterprise|Group|Holdings))\b/);
    if (co) return `${co[1].trim()} — Corporate Dinner`;
    return p.clientName ? `${p.clientName} — Corporate Dinner` : "Corporate Dinner";
  }
  if (p.eventType && p.clientName) return `${p.clientName} — ${p.eventType}`;
  if (p.eventType) return p.eventType;
  if (p.clientName) return `${p.clientName} — Booking`;
  return undefined;
}

export function parseWhatsAppMessage(raw: string, opts: ParseOptions = {}): ParsedBooking {
  const ref = opts.referenceDate ?? new Date();
  const original = raw.trim();
  const lower = original.toLowerCase();

  const result: ParsedBooking = { detected: [] };
  if (!original) return result;

  const phone = extractPhone(original);
  if (phone) {
    result.phone = phone;
    result.detected.push("phone");
  }

  const { total, deposit } = extractMoney(original);
  if (total !== undefined) {
    result.total = total;
    result.detected.push("total");
  }
  if (deposit !== undefined) {
    result.deposit = deposit;
    result.detected.push("deposit");
  }

  const date = extractDate(lower, ref);
  if (date) {
    result.date = date;
    result.detected.push("date");
  }

  const time = applyDuration(lower, extractTime(lower));
  if (time.start) {
    result.startTime = time.start;
    result.detected.push("startTime");
  }
  if (time.end) {
    result.endTime = time.end;
    result.detected.push("endTime");
  }

  const venue = extractVenue(original);
  if (venue) {
    result.venue = venue;
    result.detected.push("venue");
  }

  const name = extractName(original);
  if (name) {
    result.clientName = name;
    result.detected.push("clientName");
  }

  const eventType = extractEventType(lower);
  if (eventType) {
    result.eventType = eventType;
    result.detected.push("eventType");
  }

  const service = extractService(lower, opts.services);
  if (service) {
    result.service = service;
    result.detected.push("service");
  }

  result.title = buildTitle(result, original);
  return result;
}

/** Ready-made messages for the "Try an example" button. */
export const EXAMPLE_MESSAGES = [
  `Hi! I'd like to book a photo booth for our wedding on 26/7, 7pm-11.30pm at Setia City Convention Centre. Aisha & Faiz. Total RM1800 with deposit RM500 ok? My number 012-345 6789. - Aisha`,
  `Salam, nak tanya photobooth utk majlis kahwin 26hb Ogos kat Dewan Seri Melati Shah Alam, 8 malam. Harga pakej RM950? Deposit rm300 boleh? Saya Farhan 013-222 3333`,
  `Hello, our company is having an annual dinner next friday at One World Hotel PJ, 8pm to 11pm. Do you provide 360 video booth? Budget around RM1500. This is Melissa from Tech Sdn Bhd, 016-888 2211`,
];
