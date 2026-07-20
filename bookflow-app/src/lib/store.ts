"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useSyncExternalStore } from "react";
import type { Booking, CostRate, InvoiceDetails, Profile, TemplateId } from "./types";
import { EMPTY_INVOICE_DETAILS } from "./types";
import { getTemplate } from "./templates";
import { buildSeedBookings, newId } from "./seed";

interface BookFlowState {
  profile: Profile;
  bookings: Booking[];
  costRates: CostRate[];

  completeOnboarding: (
    templateId: TemplateId,
    businessName: string,
    ownerName: string,
    withSampleData: boolean,
  ) => void;
  addBooking: (draft: Omit<Booking, "id" | "createdAt">) => Booking;
  updateBooking: (id: string, patch: Partial<Booking>) => void;
  deleteBooking: (id: string) => void;
  setCostRate: (id: string, amount: number) => void;
  setInvoiceDetails: (details: InvoiceDetails) => void;
  markInvoicePromptDone: () => void;
  /** Returns the booking's invoice number, assigning the next one if new. */
  assignInvoiceNo: (bookingId: string) => string;
  clearSampleData: () => void;
  resetAll: () => void;
}

const EMPTY_PROFILE: Profile = {
  onboarded: false,
  templateId: "photo-booth",
  businessName: "",
  ownerName: "",
  seeded: false,
  invoice: EMPTY_INVOICE_DETAILS,
  invoiceSeq: 1,
  invoicePromptDone: false,
};

export const useBookFlow = create<BookFlowState>()(
  persist(
    (set, get) => ({
      profile: EMPTY_PROFILE,
      bookings: [],
      costRates: getTemplate("photo-booth").costRates,

      completeOnboarding: (templateId, businessName, ownerName, withSampleData) =>
        set(() => ({
          profile: {
            ...EMPTY_PROFILE,
            onboarded: true,
            templateId,
            businessName: businessName || getTemplate(templateId).label,
            ownerName: ownerName || "there",
            seeded: withSampleData,
          },
          costRates: getTemplate(templateId).costRates,
          bookings: withSampleData ? buildSeedBookings() : [],
        })),

      addBooking: (draft) => {
        const booking: Booking = {
          ...draft,
          id: newId(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ bookings: [...s.bookings, booking] }));
        return booking;
      },

      updateBooking: (id, patch) =>
        set((s) => ({
          bookings: s.bookings.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        })),

      deleteBooking: (id) =>
        set((s) => ({ bookings: s.bookings.filter((b) => b.id !== id) })),

      setCostRate: (id, amount) =>
        set((s) => ({
          costRates: s.costRates.map((r) => (r.id === id ? { ...r, amount } : r)),
        })),

      setInvoiceDetails: (details) =>
        set((s) => ({
          profile: { ...s.profile, invoice: details, invoicePromptDone: true },
        })),

      markInvoicePromptDone: () =>
        set((s) => ({ profile: { ...s.profile, invoicePromptDone: true } })),

      assignInvoiceNo: (bookingId) => {
        const existing = get().bookings.find((b) => b.id === bookingId)?.invoiceNo;
        if (existing) return existing;
        const seq = get().profile.invoiceSeq;
        const invoiceNo = `INV-${new Date().getFullYear()}-${String(seq).padStart(3, "0")}`;
        set((s) => ({
          profile: { ...s.profile, invoiceSeq: seq + 1 },
          bookings: s.bookings.map((b) => (b.id === bookingId ? { ...b, invoiceNo } : b)),
        }));
        return invoiceNo;
      },

      clearSampleData: () =>
        set((s) => ({
          bookings: s.bookings.filter((b) => b.source !== "seed"),
          profile: { ...s.profile, seeded: false },
        })),

      resetAll: () =>
        set(() => ({
          profile: EMPTY_PROFILE,
          bookings: [],
          costRates: getTemplate("photo-booth").costRates,
        })),
    }),
    {
      name: "bookflow-store-v1",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      // Older persisted profiles predate the invoice fields — patch them in.
      migrate: (persisted) => {
        const s = persisted as Partial<BookFlowState> | undefined;
        if (s?.profile) {
          s.profile = {
            ...EMPTY_PROFILE,
            ...s.profile,
            invoice: { ...EMPTY_INVOICE_DETAILS, ...(s.profile.invoice ?? {}) },
          };
        }
        return s as BookFlowState;
      },
    },
  ),
);

/**
 * True once the client has mounted and the persisted store is safe to read.
 * Screens render a calm skeleton until then to avoid hydration mismatches.
 */
const emptySubscribe = () => () => {};
export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true, // client snapshot
    () => false, // server snapshot (prerendered HTML)
  );
}
