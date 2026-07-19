import { describe, expect, it } from "vitest";
import { parseWhatsAppMessage } from "./parser";

const REF = new Date(2026, 6, 19); // Sun 19 Jul 2026
const SERVICES = [
  "Photo Booth",
  "360 Video Booth",
  "Roaming Photographer",
  "Full Day Coverage",
];

describe("parseWhatsAppMessage", () => {
  it("parses a full English wedding enquiry", () => {
    const p = parseWhatsAppMessage(
      "Hi! I'd like to book a photo booth for our wedding on 26/7, 7pm-11.30pm at Setia City Convention Centre. Aisha & Faiz. Total RM1800 with deposit RM500 ok? My number 012-345 6789. - Aisha",
      { referenceDate: REF, services: SERVICES },
    );
    expect(p.date).toBe("2026-07-26");
    expect(p.startTime).toBe("19:00");
    expect(p.endTime).toBe("23:30");
    expect(p.venue).toContain("Setia City Convention Centre");
    expect(p.total).toBe(1800);
    expect(p.deposit).toBe(500);
    expect(p.phone).toBe("60123456789");
    expect(p.eventType).toBe("Wedding");
    expect(p.title).toBe("Aisha & Faiz Wedding");
    expect(p.service).toBe("Photo Booth");
    expect(p.clientName).toBe("Aisha");
  });

  it("parses a Malay enquiry with hb date and malam time", () => {
    const p = parseWhatsAppMessage(
      "Salam, nak tanya photobooth utk majlis kahwin 26hb Ogos kat Dewan Seri Melati Shah Alam, 8 malam. Harga pakej RM950? Deposit rm300 boleh? Saya Farhan 013-222 3333",
      { referenceDate: REF, services: SERVICES },
    );
    expect(p.date).toBe("2026-08-26");
    expect(p.startTime).toBe("20:00");
    expect(p.venue).toContain("Dewan Seri Melati");
    expect(p.total).toBe(950);
    expect(p.deposit).toBe(300);
    expect(p.clientName).toBe("Farhan");
    expect(p.phone).toBe("60132223333");
    expect(p.eventType).toBe("Wedding");
  });

  it("resolves relative dates like tomorrow", () => {
    const p = parseWhatsAppMessage("Can you do tomorrow 3pm? Birthday party at my condo", {
      referenceDate: REF,
    });
    expect(p.date).toBe("2026-07-20");
    expect(p.startTime).toBe("15:00");
    expect(p.eventType).toBe("Birthday");
  });

  it("resolves weekday references", () => {
    // REF is Sunday 19 Jul; "next friday" → Fri 31 Jul (following week)
    const p = parseWhatsAppMessage(
      "Our annual dinner is next friday at One World Hotel PJ, 8pm to 11pm. Budget RM1500. This is Melissa from Tech Sdn Bhd, 016-888 2211",
      { referenceDate: REF, services: SERVICES },
    );
    expect(p.date).toBe("2026-07-31");
    expect(p.startTime).toBe("20:00");
    expect(p.endTime).toBe("23:00");
    expect(p.clientName).toBe("Melissa");
    expect(p.eventType).toBe("Corporate Dinner");
    expect(p.venue).toContain("One World Hotel");
  });

  it("rolls dd/mm without year into next year when in the past", () => {
    const dec = new Date(2026, 11, 20); // 20 Dec 2026
    const p = parseWhatsAppMessage("book for 5/1 please, 10am", { referenceDate: dec });
    expect(p.date).toBe("2027-01-05");
  });

  it("handles 24h times", () => {
    const p = parseWhatsAppMessage("Event tarikh 3/8 masa 19:00 kat KL Convention Centre", {
      referenceDate: REF,
    });
    expect(p.date).toBe("2026-08-03");
    expect(p.startTime).toBe("19:00");
  });

  it("picks the largest non-deposit amount as total", () => {
    const p = parseWhatsAppMessage(
      "Package A RM800, Package B RM1200. Deposit RM400 to lock the date.",
      { referenceDate: REF },
    );
    expect(p.total).toBe(1200);
    expect(p.deposit).toBe(400);
  });

  it("computes end time from a duration", () => {
    const p = parseWhatsAppMessage("photobooth 2 hours starting 4pm on 1/8", {
      referenceDate: REF,
      services: SERVICES,
    });
    expect(p.startTime).toBe("16:00");
    expect(p.endTime).toBe("18:00");
  });

  it("normalises +60 phone formats", () => {
    const p = parseWhatsAppMessage("call me +60 12-345 6789", { referenceDate: REF });
    expect(p.phone).toBe("60123456789");
  });

  it("returns empty result without crashing on junk", () => {
    const p = parseWhatsAppMessage("ok thanks 👍", { referenceDate: REF });
    expect(p.detected).toHaveLength(0);
  });

  it("detects venue from a Venue: label", () => {
    const p = parseWhatsAppMessage(
      "Booking for graduation\nVenue: Sunway Resort Hotel\nDate: 10/8\nTime: 2pm",
      { referenceDate: REF },
    );
    expect(p.venue).toBe("Sunway Resort Hotel");
    expect(p.date).toBe("2026-08-10");
    expect(p.startTime).toBe("14:00");
    expect(p.eventType).toBe("Graduation");
  });

  it("detects 360 booth service", () => {
    const p = parseWhatsAppMessage("do you have 360 booth for 15/8?", {
      referenceDate: REF,
      services: SERVICES,
    });
    expect(p.service).toBe("360 Video Booth");
  });
});
