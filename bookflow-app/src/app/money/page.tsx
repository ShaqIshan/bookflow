"use client";

import { useMemo, useState } from "react";
import { useBookFlow } from "@/lib/store";
import type { CostRate } from "@/lib/types";
import {
  bookingsWithBalance,
  fmtRM,
  fmtRMCompact,
  monthCosts,
  monthRevenue,
  revenueHistory,
  totalStillOwed,
} from "@/lib/money";
import AppShell from "@/components/AppShell";
import Gate from "@/components/Gate";
import Icon from "@/components/Icon";
import Sheet from "@/components/Sheet";
import ChaseList from "@/components/ChaseList";

export default function MoneyPage() {
  return (
    <Gate>
      <AppShell active="money">
        <MoneyScreen />
      </AppShell>
    </Gate>
  );
}

function MoneyScreen() {
  const bookings = useBookFlow((s) => s.bookings);
  const costRates = useBookFlow((s) => s.costRates);
  const setCostRate = useBookFlow((s) => s.setCostRate);
  const businessName = useBookFlow((s) => s.profile.businessName);

  const [chaseOpen, setChaseOpen] = useState(false);
  const [editRate, setEditRate] = useState<CostRate | null>(null);
  const [rateInput, setRateInput] = useState("");

  const now = useMemo(() => new Date(), []);
  const revenue = monthRevenue(bookings, now);
  const costs = monthCosts(bookings, now);
  const net = revenue - costs;
  const owed = totalStillOwed(bookings);
  const chase = useMemo(() => bookingsWithBalance(bookings), [bookings]);
  const history = useMemo(() => revenueHistory(bookings, 6, now), [bookings, now]);
  const maxRevenue = Math.max(...history.map((p) => p.revenue), 1);

  return (
    <>
      <header className="mb-stack-gap-lg">
        <h2 className="font-heading text-display-lg-mobile md:text-display-lg text-on-surface tracking-tight">
          Money
        </h2>
      </header>

      <div className="flex flex-col gap-stack-gap-lg max-w-md md:max-w-none mx-auto w-full">
        {/* Hero stats */}
        <section className="bg-surface rounded-card p-5 shadow-ambient flex flex-col gap-stack-gap-md">
          <div>
            <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
              This Month
            </p>
            <p className="text-stat-lg text-primary">{fmtRM(revenue)}</p>
          </div>
          <hr className="border-t border-surface-variant w-full my-1" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
                Net
              </p>
              <p className="font-heading text-headline-sm text-on-surface">{fmtRM(net)}</p>
            </div>
            <div>
              <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
                Still owed
              </p>
              <p className="font-heading text-headline-sm text-secondary">{fmtRM(owed)}</p>
            </div>
          </div>
        </section>

        {/* Deposit tracker */}
        {chase.length > 0 && (
          <section className="bg-secondary-container/10 rounded-card p-5 flex flex-col gap-stack-gap-md border border-secondary-container/30 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-secondary-container/20 rounded-full blur-2xl" />
            <div className="relative z-10 flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-heading text-display-md text-on-surface">
                    {chase.length} payment{chase.length > 1 ? "s" : ""} to chase
                  </h3>
                  <p className="text-stat-lg text-secondary mt-1">{fmtRM(owed)}</p>
                </div>
                <span className="w-10 h-10 rounded-full bg-secondary-container/30 flex items-center justify-center">
                  <Icon name="hourglass_top" fill className="text-secondary" />
                </span>
              </div>
              <button
                onClick={() => setChaseOpen(true)}
                className="mt-2 w-full bg-secondary text-on-secondary text-label-md rounded-btn py-3.5 flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shadow-sm hover:opacity-90"
              >
                <Icon name="send" size={18} />
                Send reminders
              </button>
            </div>
          </section>
        )}

        {/* Revenue chart */}
        <section className="bg-surface rounded-card p-5 shadow-ambient flex flex-col gap-stack-gap-md">
          <h3 className="font-heading text-display-md text-on-surface mb-2">Revenue</h3>
          <div className="h-40 flex items-end justify-between gap-2 pt-4 border-b border-surface-variant pb-2 relative">
            <div className="absolute top-4 left-0 w-full border-t border-surface-variant/50 border-dashed" />
            <div className="absolute top-1/2 left-0 w-full border-t border-surface-variant/50 border-dashed" />
            {history.map((point, i) => {
              const isCurrent = i === history.length - 1;
              const h = Math.max(4, Math.round((point.revenue / maxRevenue) * 100));
              return (
                <div key={point.key} className="flex flex-col items-center gap-2 z-10 flex-1 h-full justify-end">
                  <div
                    className={`w-full rounded-t-md relative group transition-all duration-500 ${
                      isCurrent
                        ? "bg-primary shadow-[0_4px_10px_rgba(0,67,52,0.3)]"
                        : "bg-primary/25 hover:bg-primary/45"
                    }`}
                    style={{ height: `${h}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface text-label-md px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {fmtRMCompact(point.revenue)}
                    </div>
                  </div>
                  <span
                    className={`text-label-md ${
                      isCurrent ? "text-primary font-bold" : "text-on-surface-variant"
                    }`}
                  >
                    {point.label}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Cost breakdown */}
        <section className="bg-surface rounded-card p-5 shadow-ambient flex flex-col gap-stack-gap-md mb-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-heading text-display-md text-on-surface">Cost Breakdown</h3>
            <span className="text-label-md text-muted-ink">Tap to edit</span>
          </div>
          <div className="flex flex-col gap-4">
            {costRates.map((rate, i) => (
              <div key={rate.id}>
                {i > 0 && <div className="h-px bg-surface-variant/50 ml-16 mb-4" />}
                <button
                  onClick={() => {
                    setEditRate(rate);
                    setRateInput(String(rate.amount));
                  }}
                  className="flex items-center gap-4 group w-full text-left"
                >
                  <span className="w-12 h-12 rounded-full bg-surface-variant flex items-center justify-center text-on-surface-variant group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors">
                    <Icon name={rate.icon} />
                  </span>
                  <span className="flex-1 text-body-md text-on-surface font-semibold">
                    {rate.label}
                  </span>
                  <span className="text-right">
                    <span className="block text-body-md text-on-surface">
                      {fmtRM(rate.amount)}
                    </span>
                    <span className="block text-label-md text-on-surface-variant">
                      {rate.unit}
                    </span>
                  </span>
                </button>
              </div>
            ))}
          </div>
          <p className="text-body-sm text-muted-ink border-t border-surface-variant/60 pt-3">
            Net this month = {fmtRM(revenue)} booked − {fmtRM(costs)} estimated costs.
          </p>
        </section>
      </div>

      {/* Chase sheet */}
      <Sheet open={chaseOpen} onClose={() => setChaseOpen(false)} title="Send reminders">
        <ChaseList bookings={chase} businessName={businessName} />
      </Sheet>

      {/* Edit cost rate sheet */}
      <Sheet
        open={Boolean(editRate)}
        onClose={() => setEditRate(null)}
        title={editRate ? `Edit ${editRate.label.toLowerCase()} rate` : ""}
      >
        {editRate && (
          <div className="flex flex-col gap-stack-gap-md">
            <label className="block">
              <span className="text-label-md text-muted-ink uppercase block mb-1.5">
                Amount (RM {editRate.unit})
              </span>
              <input
                value={rateInput}
                onChange={(e) => setRateInput(e.target.value)}
                inputMode="decimal"
                autoFocus
                className="w-full bg-surface border border-outline-variant rounded-btn px-4 py-3.5 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </label>
            <button
              onClick={() => {
                const n = parseFloat(rateInput);
                if (Number.isFinite(n) && n >= 0) {
                  setCostRate(editRate.id, Math.round(n * 100) / 100);
                  setEditRate(null);
                }
              }}
              className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary text-label-md py-4 rounded-btn shadow-md hover:opacity-90 transition-opacity"
            >
              <Icon name="check" size={20} />
              Save rate
            </button>
          </div>
        )}
      </Sheet>
    </>
  );
}
