"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useBookFlow } from "@/lib/store";
import type { Booking } from "@/lib/types";
import {
  calendarGrid,
  fmtDayLong,
  fmtMonthYear,
  fmtTimeRange,
  todayISO,
} from "@/lib/dates";
import { fmtRM } from "@/lib/money";
import AppShell from "@/components/AppShell";
import Gate from "@/components/Gate";
import Icon from "@/components/Icon";
import StatusChip from "@/components/StatusChip";
import EmptyState from "@/components/EmptyState";
import BookingDetailSheet from "@/components/BookingDetailSheet";

const WEEKDAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

export default function CalendarPage() {
  return (
    <Gate>
      <AppShell active="calendar">
        <CalendarScreen />
      </AppShell>
    </Gate>
  );
}

function CalendarScreen() {
  const bookings = useBookFlow((s) => s.bookings);
  const today = todayISO();
  const now = new Date();

  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState(today);
  const [openId, setOpenId] = useState<string | null>(null);

  const active = useMemo(
    () => bookings.filter((b) => b.status !== "cancelled"),
    [bookings],
  );

  /** date → "confirmed" (emerald) | "pending" (amber) */
  const dayDots = useMemo(() => {
    const map = new Map<string, "confirmed" | "pending">();
    for (const b of active) {
      const pending = b.paid === 0;
      const existing = map.get(b.date);
      if (existing === "pending") continue;
      map.set(b.date, pending ? "pending" : "confirmed");
    }
    return map;
  }, [active]);

  const cells = calendarGrid(viewYear, viewMonth);
  const dayBookings = active
    .filter((b) => b.date === selected)
    .sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""));
  const open = bookings.find((b) => b.id === openId) ?? null;

  function shiftMonth(delta: number) {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }

  function jumpToToday() {
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setSelected(today);
  }

  const viewingCurrentMonth =
    viewYear === now.getFullYear() && viewMonth === now.getMonth();

  return (
    <>
      <header className="mb-stack-gap-lg flex items-end justify-between">
        <h2 className="font-heading text-display-lg-mobile md:text-display-lg text-on-surface">
          Schedule
        </h2>
        {!viewingCurrentMonth && (
          <button
            onClick={jumpToToday}
            className="text-label-md text-primary hover:opacity-80 transition-opacity pb-1"
          >
            Today
          </button>
        )}
      </header>

      {/* Calendar card */}
      <section className="bg-surface rounded-xl shadow-ambient p-5 flex flex-col gap-6 mb-stack-gap-lg">
        <div className="flex justify-between items-center">
          <h3 className="font-heading text-headline-sm text-on-surface">
            {fmtMonthYear(new Date(viewYear, viewMonth, 1))}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => shiftMonth(-1)}
              className="w-10 h-10 rounded-full flex items-center justify-center border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-low transition-colors"
              aria-label="Previous month"
            >
              <Icon name="chevron_left" size={20} />
            </button>
            <button
              onClick={() => shiftMonth(1)}
              className="w-10 h-10 rounded-full flex items-center justify-center border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-low transition-colors"
              aria-label="Next month"
            >
              <Icon name="chevron_right" size={20} />
            </button>
          </div>
        </div>

        <div>
          <div className="grid grid-cols-7 mb-4">
            {WEEKDAY_INITIALS.map((d, i) => (
              <div key={i} className="text-center text-label-md text-muted-ink">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-3">
            {cells.map((cell) => {
              const dot = dayDots.get(cell.iso);
              const isSelected = cell.iso === selected;
              const isToday = cell.iso === today;
              return (
                <div key={cell.iso} className="flex justify-center">
                  <button
                    onClick={() => setSelected(cell.iso)}
                    className={`w-10 h-10 flex items-center justify-center rounded-full relative text-body-md transition-colors ${
                      isSelected
                        ? "bg-primary text-on-primary shadow-md"
                        : cell.inMonth
                          ? `text-on-surface hover:bg-surface-container-low cursor-pointer ${
                              isToday ? "font-bold text-primary ring-1 ring-primary/40" : ""
                            }`
                          : "text-muted-ink opacity-50"
                    }`}
                  >
                    {cell.day}
                    {dot && (
                      <span
                        className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
                          isSelected
                            ? "bg-white"
                            : dot === "confirmed"
                              ? "bg-primary"
                              : "bg-secondary-container"
                        }`}
                      />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 pt-4 border-t border-outline-variant/30 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-body-sm text-on-surface-variant">Confirmed</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary-container" />
            <span className="text-body-sm text-on-surface-variant">Pending</span>
          </div>
        </div>
      </section>

      {/* Day agenda */}
      <section className="flex flex-col gap-stack-gap-md">
        <h3 className="font-heading text-headline-sm text-on-surface px-1">
          {fmtDayLong(selected)}
        </h3>
        {dayBookings.length === 0 ? (
          <EmptyState
            message="No bookings this day."
            icon="event_available"
            action={
              selected >= today ? (
                <Link
                  href={`/add?date=${selected}`}
                  className="text-label-md text-primary hover:opacity-80"
                >
                  Add a booking for this date →
                </Link>
              ) : undefined
            }
          />
        ) : (
          dayBookings.map((b: Booking) => (
            <article
              key={b.id}
              className="bg-surface rounded-card shadow-ambient p-5 flex flex-col gap-4 border border-outline-variant/10"
            >
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <h4 className="font-heading text-headline-sm text-on-surface truncate">
                    {b.title}
                  </h4>
                  <p className="text-body-sm text-muted-ink mt-1">{b.service}</p>
                </div>
                <StatusChip booking={b} />
              </div>
              <div className="flex flex-col gap-2">
                {b.startTime && (
                  <div className="flex items-center gap-3 text-on-surface-variant">
                    <Icon name="schedule" size={20} className="text-primary" />
                    <span className="text-body-md">
                      {fmtTimeRange(b.startTime, b.endTime)}
                    </span>
                  </div>
                )}
                {b.venue && (
                  <div className="flex items-center gap-3 text-on-surface-variant">
                    <Icon name="location_on" size={20} className="text-primary" />
                    <span className="text-body-md">{b.venue}</span>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-outline-variant/20">
                <div className="flex items-center gap-2 text-on-surface">
                  <Icon name="payments" size={20} className="text-muted-ink" />
                  <span className="text-body-md font-medium">{fmtRM(b.total)}</span>
                </div>
                <button
                  onClick={() => setOpenId(b.id)}
                  className="text-label-md text-primary hover:opacity-80 transition-opacity"
                >
                  View Details
                </button>
              </div>
            </article>
          ))
        )}
      </section>

      <BookingDetailSheet booking={open} onClose={() => setOpenId(null)} />
    </>
  );
}
