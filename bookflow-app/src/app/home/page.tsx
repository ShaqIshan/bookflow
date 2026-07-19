"use client";

import { useState } from "react";
import Link from "next/link";
import { useBookFlow } from "@/lib/store";
import type { Booking } from "@/lib/types";
import { fmtHeaderDate, todayISO } from "@/lib/dates";
import { fmtRM, monthBookingCount, monthRevenue, totalStillOwed } from "@/lib/money";
import AppShell from "@/components/AppShell";
import Gate from "@/components/Gate";
import Icon from "@/components/Icon";
import StatCard from "@/components/StatCard";
import BookingCard from "@/components/BookingCard";
import EmptyState from "@/components/EmptyState";
import BookingDetailSheet from "@/components/BookingDetailSheet";

export default function HomePage() {
  return (
    <Gate>
      <AppShell active="home">
        <HomeScreen />
      </AppShell>
    </Gate>
  );
}

function HomeScreen() {
  const profile = useBookFlow((s) => s.profile);
  const bookings = useBookFlow((s) => s.bookings);
  const [openId, setOpenId] = useState<string | null>(null);

  const now = new Date();
  const today = todayISO();
  const active = bookings.filter((b) => b.status !== "cancelled");
  const todays = active
    .filter((b) => b.date === today)
    .sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""));
  const upcoming = active
    .filter((b) => b.date > today)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.startTime ?? "").localeCompare(b.startTime ?? ""))
    .slice(0, 3);

  const open = bookings.find((b) => b.id === openId) ?? null;

  return (
    <>
      {/* Greeting */}
      <section className="mb-stack-gap-lg">
        <h2 className="font-heading text-display-lg-mobile md:text-display-lg text-on-surface mb-1">
          Hi, {profile.ownerName || "there"} 👋
        </h2>
        <p className="text-body-md text-muted-ink">{fmtHeaderDate(now)}</p>
      </section>

      {/* Stat rail */}
      <section className="flex gap-4 overflow-x-auto pb-4 -mx-container-margin px-container-margin snap-x scrollbar-hide mb-stack-gap-lg md:mx-0 md:px-0 md:overflow-visible">
        <StatCard label="Revenue" value={fmtRM(monthRevenue(bookings, now))} tone="primary" />
        <StatCard label="Bookings" value={String(monthBookingCount(bookings, now))} minWidth={120} />
        <StatCard label="Still owed" value={fmtRM(totalStillOwed(bookings))} tone="secondary" minWidth={160} />
      </section>

      {/* Quick paste prompt — the hero feature, one tap away */}
      <section className="mb-stack-gap-lg">
        <Link
          href="/add"
          className="bg-primary-container text-on-primary-container rounded-card p-5 shadow-sm border border-primary-container/20 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform"
        >
          <span className="flex items-center gap-3">
            <span className="w-10 h-10 shrink-0 rounded-full bg-primary/20 flex items-center justify-center">
              <Icon name="content_paste" className="text-on-primary-container" />
            </span>
            <span className="text-body-md font-semibold text-on-primary">
              Paste a WhatsApp message to add a booking
            </span>
          </span>
          <Icon name="arrow_forward" className="text-on-primary-container shrink-0" />
        </Link>
      </section>

      {/* Today */}
      <section className="mb-stack-gap-lg">
        <h3 className="font-heading text-headline-sm text-on-surface mb-stack-gap-md">Today</h3>
        {todays.length === 0 ? (
          <EmptyState message="Nothing on today — enjoy the breather." />
        ) : (
          <div className="flex flex-col gap-stack-gap-md">
            {todays.map((b) => (
              <BookingCard key={b.id} booking={b} onClick={() => setOpenId(b.id)} />
            ))}
          </div>
        )}
      </section>

      {/* Coming up */}
      <section className="mb-stack-gap-lg">
        <div className="flex items-center justify-between mb-stack-gap-md">
          <h3 className="font-heading text-headline-sm text-on-surface">Coming up</h3>
          <Link
            href="/bookings"
            className="text-label-md text-primary hover:opacity-80 transition-opacity"
          >
            View all
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <EmptyState
            message="No upcoming bookings yet."
            icon="event_upcoming"
            action={
              <Link href="/add" className="text-label-md text-primary hover:opacity-80">
                Add your first booking →
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col gap-stack-gap-md">
            {upcoming.map((b: Booking) => (
              <BookingCard key={b.id} booking={b} onClick={() => setOpenId(b.id)} />
            ))}
          </div>
        )}
      </section>

      <BookingDetailSheet booking={open} onClose={() => setOpenId(null)} />
    </>
  );
}
