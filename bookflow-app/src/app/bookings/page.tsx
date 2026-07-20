"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useBookFlow } from "@/lib/store";
import type { Booking } from "@/lib/types";
import { balanceDue } from "@/lib/types";
import { todayISO } from "@/lib/dates";
import { fmtRM } from "@/lib/money";
import AppShell from "@/components/AppShell";
import Gate from "@/components/Gate";
import Icon from "@/components/Icon";
import BookingListCard from "@/components/BookingListCard";
import EmptyState from "@/components/EmptyState";
import BookingDetailSheet from "@/components/BookingDetailSheet";
import { useInvoiceFlow } from "@/components/InvoiceFlow";

type Filter = "all" | "upcoming" | "pending" | "past";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "upcoming", label: "Upcoming" },
  { id: "pending", label: "Deposit pending" },
  { id: "past", label: "Past" },
];

export default function BookingsPage() {
  return (
    <Gate>
      <AppShell active="bookings">
        <BookingsScreen />
      </AppShell>
    </Gate>
  );
}

function BookingsScreen() {
  const bookings = useBookFlow((s) => s.bookings);
  const businessName = useBookFlow((s) => s.profile.businessName);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [editOnOpen, setEditOnOpen] = useState(false);
  const [toast, setToast] = useState("");

  const today = todayISO();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = bookings.filter((b) => b.status !== "cancelled");
    if (filter === "upcoming") list = list.filter((b) => b.date >= today);
    if (filter === "past") list = list.filter((b) => b.date < today);
    if (filter === "pending") list = list.filter((b) => balanceDue(b) > 0 && b.paid === 0);
    if (q) {
      list = list.filter((b) =>
        [b.title, b.clientName, b.venue, b.service, b.notes, b.date]
          .filter(Boolean)
          .some((f) => (f as string).toLowerCase().includes(q)),
      );
    }
    return list;
  }, [bookings, query, filter, today]);

  const upcoming = filtered
    .filter((b) => b.date >= today)
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        (a.startTime ?? "").localeCompare(b.startTime ?? ""),
    );
  const past = filtered.filter((b) => b.date < today).sort((a, b) => b.date.localeCompare(a.date));
  const totalValue = filtered.reduce((sum, b) => sum + b.total, 0);

  const open = bookings.find((b) => b.id === openId) ?? null;
  const showSections = filter === "all" || query.trim() !== "";

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }

  const { runInvoice, invoiceSheet } = useInvoiceFlow(flash);

  function openDetail(id: string, edit: boolean) {
    setEditOnOpen(edit);
    setOpenId(id);
  }

  function renderCard(b: Booking) {
    return (
      <BookingListCard
        key={b.id}
        booking={b}
        businessName={businessName}
        onOpen={() => openDetail(b.id, false)}
        onEdit={() => openDetail(b.id, true)}
        onInvoice={() => runInvoice(b)}
      />
    );
  }

  return (
    <>
      <section className="mb-stack-gap-md">
        <h2 className="font-heading text-display-lg-mobile md:text-display-lg text-on-surface">
          Bookings
        </h2>
      </section>

      {/* Search */}
      <div className="relative mb-stack-gap-md">
        <Icon
          name="search"
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-ink"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search client, venue, date…"
          className="w-full h-12 bg-surface border border-outline-variant/30 rounded-btn pl-12 pr-10 text-body-md text-on-surface placeholder:text-muted-ink focus:outline-none focus:ring-1 focus:ring-primary shadow-[0_2px_8px_rgba(22,21,19,0.02)] transition-all"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-muted-ink hover:bg-surface-variant"
            aria-label="Clear search"
          >
            <Icon name="close" size={18} />
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-container-margin px-container-margin scrollbar-hide mb-stack-gap-md md:mx-0 md:px-0">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`h-10 px-5 rounded-full text-label-md shrink-0 transition-colors ${
              filter === f.id
                ? "bg-primary text-on-primary"
                : "bg-surface text-on-surface border border-outline-variant/30 hover:bg-surface-container"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Count + value strip */}
      <div className="flex justify-between items-center mb-stack-gap-md px-1">
        <span className="text-label-md text-muted-ink">
          Showing {filtered.length} booking{filtered.length === 1 ? "" : "s"}
        </span>
        <span className="font-heading text-headline-sm text-primary">{fmtRM(totalValue)}</span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          message={
            query
              ? `Nothing matches "${query}".`
              : filter === "pending"
                ? "No deposits waiting — nice."
                : "No bookings here yet."
          }
          icon={query ? "search_off" : "event_available"}
          action={
            !query && (
              <Link href="/add" className="text-label-md text-primary hover:opacity-80">
                Add a booking →
              </Link>
            )
          }
        />
      ) : (
        <div className="flex flex-col gap-stack-gap-lg">
          {(filter === "past" ? [] : upcoming).length > 0 && (
            <section>
              {showSections && (
                <h3 className="font-heading text-headline-sm text-on-surface mb-stack-gap-md">
                  Upcoming
                </h3>
              )}
              <div className="flex flex-col gap-stack-gap-md md:grid md:grid-cols-2">
                {upcoming.map(renderCard)}
              </div>
            </section>
          )}
          {filter !== "upcoming" && past.length > 0 && (
            <section>
              {showSections && (
                <h3 className="font-heading text-headline-sm text-on-surface mb-stack-gap-md">
                  Past
                </h3>
              )}
              <div className="flex flex-col gap-stack-gap-md md:grid md:grid-cols-2">
                {past.map(renderCard)}
              </div>
            </section>
          )}
        </div>
      )}

      {toast && (
        <p className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[80] text-body-sm text-on-primary bg-primary-container rounded-full py-2.5 px-5 shadow-lg animate-fade-in whitespace-nowrap">
          {toast}
        </p>
      )}

      {invoiceSheet}

      <BookingDetailSheet
        key={`${openId}-${editOnOpen}`}
        booking={open}
        initialEditing={editOnOpen}
        onClose={() => {
          setOpenId(null);
          setEditOnOpen(false);
        }}
      />
    </>
  );
}
