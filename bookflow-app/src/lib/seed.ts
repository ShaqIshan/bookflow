import type { Booking } from "./types";
import { addDays, toISODate } from "./dates";

let counter = 0;
export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `bf-${Date.now()}-${counter++}`;
}

interface SeedSpec {
  offsetDays: number;
  title: string;
  clientName: string;
  phone?: string;
  service: string;
  startTime?: string;
  endTime?: string;
  venue?: string;
  total: number;
  deposit: number;
  paid: number;
  cost?: number;
  notes?: string;
}

/**
 * Sample bookings so the prototype opens looking alive. Dates are relative to
 * "today" at seed time, so the demo is always current. Names and venues carry
 * over from the design mockups (Aisha & Faiz, Tech Sdn Bhd, Dania…).
 */
const UPCOMING: SeedSpec[] = [
  {
    offsetDays: 2,
    title: "Syarikat Maju Annual Dinner",
    clientName: "Puan Lina",
    phone: "60175552211",
    service: "Photo Booth",
    startTime: "20:00",
    endTime: "23:00",
    venue: "Holiday Villa Subang",
    total: 1000,
    deposit: 300,
    paid: 0,
    cost: 210,
  },
  {
    offsetDays: 7,
    title: "Aisha & Faiz Wedding",
    clientName: "Aisha",
    phone: "60123456789",
    service: "Photo Booth",
    startTime: "19:00",
    endTime: "23:30",
    venue: "Setia City Convention Centre",
    total: 1800,
    deposit: 500,
    paid: 500,
    cost: 320,
    notes: "Unlimited prints package. Gold backdrop requested.",
  },
  {
    offsetDays: 13,
    title: "Tech Sdn Bhd — Corporate Dinner",
    clientName: "Melissa",
    phone: "60168882211",
    service: "360 Video Booth",
    startTime: "20:00",
    endTime: "23:00",
    venue: "One World Hotel, PJ",
    total: 1500,
    deposit: 400,
    paid: 0,
    cost: 280,
  },
  {
    offsetDays: 15,
    title: "Dania's 21st Birthday",
    clientName: "Dania",
    phone: "60192223344",
    service: "Photo Booth",
    startTime: "16:00",
    endTime: "19:00",
    venue: "Private residence, USJ 9",
    total: 950,
    deposit: 300,
    paid: 300,
    cost: 190,
  },
];

const RECENT: SeedSpec[] = [
  {
    offsetDays: -4,
    title: "Hana & Imran Wedding",
    clientName: "Hana",
    phone: "60134445566",
    service: "Full Day Coverage",
    startTime: "11:00",
    endTime: "16:00",
    venue: "Ideal Convention Centre, Shah Alam",
    total: 1200,
    deposit: 400,
    paid: 1200,
    cost: 260,
  },
  {
    offsetDays: -9,
    title: "Mira's Graduation Party",
    clientName: "Mira",
    phone: "60127778899",
    service: "Photo Booth",
    startTime: "14:00",
    endTime: "17:00",
    venue: "Sunway Resort Hotel",
    total: 750,
    deposit: 250,
    paid: 750,
    cost: 170,
  },
  {
    offsetDays: -13,
    title: "KL Mini Fest Booth",
    clientName: "Encik Zaid",
    phone: "60113334455",
    service: "Photo Booth",
    startTime: "10:00",
    endTime: "18:00",
    venue: "Publika, Solaris Dutamas",
    total: 850,
    deposit: 250,
    paid: 250,
    cost: 240,
    notes: "Balance to be settled after event — follow up!",
  },
];

/** [monthsAgo, specs] — history so the revenue chart tells a growth story. */
const HISTORY: [number, SeedSpec[]][] = [
  [
    1,
    [
      { offsetDays: 0, title: "Zack & Aina Wedding", clientName: "Aina", service: "Photo Booth", venue: "Dewan Perdana Felda", total: 1600, deposit: 500, paid: 1600, cost: 300, startTime: "19:00", endTime: "23:00" },
      { offsetDays: 6, title: "Delta Sdn Bhd Family Day", clientName: "Farid", service: "Photo Booth", venue: "Taman Tasik Shah Alam", total: 1400, deposit: 400, paid: 1400, cost: 310, startTime: "09:00", endTime: "15:00" },
      { offsetDays: 14, title: "Sofia's Sweet 16", clientName: "Sofia", service: "Photo Booth", venue: "Empire City Damansara", total: 900, deposit: 300, paid: 900, cost: 180, startTime: "15:00", endTime: "18:00" },
      { offsetDays: 20, title: "Roadshow — Mid Valley", clientName: "Jason", service: "360 Video Booth", venue: "Mid Valley Megamall", total: 1300, deposit: 400, paid: 1300, cost: 350, startTime: "10:00", endTime: "20:00" },
    ],
  ],
  [
    2,
    [
      { offsetDays: 2, title: "Iman & Khalis Engagement", clientName: "Iman", service: "Photo Booth", venue: "Kota Damansara", total: 800, deposit: 250, paid: 800, cost: 160, startTime: "16:00", endTime: "19:00" },
      { offsetDays: 10, title: "TechCon KL Booth", clientName: "Priya", service: "360 Video Booth", venue: "KL Convention Centre", total: 2100, deposit: 600, paid: 2100, cost: 420, startTime: "09:00", endTime: "18:00" },
      { offsetDays: 17, title: "Aiman's 30th Birthday", clientName: "Aiman", service: "Photo Booth", venue: "The Club, Bukit Utama", total: 950, deposit: 300, paid: 950, cost: 200, startTime: "20:00", endTime: "23:00" },
    ],
  ],
  [
    3,
    [
      { offsetDays: 4, title: "Nadia & Rizal Nikah", clientName: "Nadia", service: "Photo Booth", venue: "Masjid Wilayah, KL", total: 1100, deposit: 350, paid: 1100, cost: 220, startTime: "10:00", endTime: "14:00" },
      { offsetDays: 15, title: "Elysium Events Gala", clientName: "Carmen", service: "Full Day Coverage", venue: "St Regis KL", total: 1700, deposit: 500, paid: 1700, cost: 330, startTime: "18:00", endTime: "23:30" },
    ],
  ],
  [
    4,
    [
      { offsetDays: 8, title: "Farah & Danish Wedding", clientName: "Farah", service: "Photo Booth", venue: "IDCC Shah Alam", total: 1500, deposit: 450, paid: 1500, cost: 290, startTime: "19:00", endTime: "23:00" },
      { offsetDays: 18, title: "Uni Alumni Night", clientName: "Haziq", service: "Photo Booth", venue: "UiTM Shah Alam", total: 700, deposit: 200, paid: 700, cost: 150, startTime: "19:00", endTime: "22:00" },
    ],
  ],
  [
    5,
    [
      { offsetDays: 5, title: "Emma's Baby Shower", clientName: "Emma", service: "Photo Booth", venue: "Bangsar Village", total: 650, deposit: 200, paid: 650, cost: 140, startTime: "13:00", endTime: "16:00" },
      { offsetDays: 16, title: "Ravi & Deepa Engagement", clientName: "Ravi", service: "Photo Booth", venue: "Setia Alam Community Hall", total: 850, deposit: 250, paid: 850, cost: 175, startTime: "17:00", endTime: "20:00" },
    ],
  ],
];

function make(spec: SeedSpec, date: string, completed: boolean, createdAt: string): Booking {
  return {
    id: newId(),
    title: spec.title,
    clientName: spec.clientName,
    phone: spec.phone,
    service: spec.service,
    date,
    startTime: spec.startTime,
    endTime: spec.endTime,
    venue: spec.venue,
    total: spec.total,
    deposit: spec.deposit,
    paid: spec.paid,
    cost: spec.cost,
    status: completed ? "completed" : spec.paid > 0 ? "confirmed" : "pending",
    notes: spec.notes,
    source: "seed",
    createdAt,
  };
}

export function buildSeedBookings(now: Date = new Date()): Booking[] {
  const createdAt = now.toISOString();
  const bookings: Booking[] = [];

  for (const spec of UPCOMING) {
    bookings.push(make(spec, toISODate(addDays(now, spec.offsetDays)), false, createdAt));
  }
  for (const spec of RECENT) {
    bookings.push(make(spec, toISODate(addDays(now, spec.offsetDays)), true, createdAt));
  }
  for (const [monthsAgo, specs] of HISTORY) {
    const base = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
    for (const spec of specs) {
      const d = addDays(base, spec.offsetDays);
      bookings.push(make(spec, toISODate(d), true, createdAt));
    }
  }
  return bookings.sort((a, b) => a.date.localeCompare(b.date));
}
