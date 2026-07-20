"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useBookFlow } from "@/lib/store";
import { BASE_PATH } from "@/lib/basePath";
import { getTemplate } from "@/lib/templates";
import { bookingsWithBalance } from "@/lib/money";
import ChaseList from "./ChaseList";
import Icon from "./Icon";
import Sheet from "./Sheet";
import { InvoiceDetailsFields } from "./InvoiceFlow";
import { EMPTY_INVOICE_DETAILS } from "@/lib/types";

export type TabId = "home" | "bookings" | "calendar" | "money";

const TABS: { id: TabId; href: string; icon: string; label: string }[] = [
  { id: "home", href: "/home", icon: "home", label: "Home" },
  { id: "bookings", href: "/bookings", icon: "event_available", label: "Bookings" },
  { id: "calendar", href: "/calendar", icon: "calendar_month", label: "Calendar" },
  { id: "money", href: "/money", icon: "payments", label: "Money" },
];

interface AppShellProps {
  /** Which bottom tab is active; "add" flattens the centre FAB so it can't
      collide with the Add screen's sticky confirm bar. */
  active?: TabId | "add";
  children: React.ReactNode;
}

export default function AppShell({ active, children }: AppShellProps) {
  const router = useRouter();
  const profile = useBookFlow((s) => s.profile);
  const bookings = useBookFlow((s) => s.bookings);
  const clearSampleData = useBookFlow((s) => s.clearSampleData);
  const resetAll = useBookFlow((s) => s.resetAll);
  const [bizOpen, setBizOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const chase = bookingsWithBalance(bookings).filter((b) => b.status !== "cancelled");
  const initials =
    (profile.businessName || "BookFlow")
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "BF";

  const template = getTemplate(profile.templateId);

  return (
    <div className="min-h-dvh">
      {/* ── Mobile top bar ─────────────────────────────── */}
      <header className="md:hidden sticky top-0 z-40 bg-background flex justify-between items-center px-container-margin py-4">
        <button
          onClick={() => setBizOpen(true)}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          aria-label="Business settings"
        >
          <span className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-body-sm font-semibold">
            {initials}
          </span>
          <span className="font-heading text-display-md text-primary font-bold tracking-tight">
            BookFlow
          </span>
        </button>
        <button
          onClick={() => setNotifOpen(true)}
          className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant transition-colors text-primary"
          aria-label="Notifications"
        >
          <Icon name="notifications" size={24} />
          {chase.length > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-secondary-container border-2 border-background" />
          )}
        </button>
      </header>

      {/* ── Desktop sidebar ────────────────────────────── */}
      <nav className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 bg-surface border-r border-outline-variant/30 py-8 px-6 z-40">
        <div className="mb-10 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${BASE_PATH}/icons/icon.svg`} alt="" className="w-8 h-8" />
          <span className="font-heading text-display-md text-primary tracking-tight font-bold">
            BookFlow
          </span>
        </div>
        <Link
          href="/add"
          className="mb-8 flex items-center justify-center gap-2 bg-primary text-on-primary text-label-md py-3.5 rounded-btn shadow-md hover:opacity-90 transition-opacity"
        >
          <Icon name="add" size={20} />
          New booking
        </Link>
        <div className="flex flex-col gap-2">
          {TABS.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                active === tab.id
                  ? "bg-primary-container text-on-primary-container font-medium"
                  : "text-on-surface-variant hover:bg-surface-container-low"
              }`}
            >
              <Icon name={tab.icon} fill={active === tab.id} />
              <span className="text-body-md">{tab.label}</span>
            </Link>
          ))}
        </div>
        <div className="mt-auto flex items-center gap-2">
          <button
            onClick={() => setBizOpen(true)}
            className="flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-container-low transition-colors text-left min-w-0"
          >
            <span className="w-9 h-9 shrink-0 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-body-sm font-semibold">
              {initials}
            </span>
            <span className="min-w-0">
              <span className="block text-body-sm font-semibold text-on-surface truncate">
                {profile.businessName || "Your business"}
              </span>
              <span className="block text-label-md text-muted-ink truncate">
                {template.label}
              </span>
            </span>
          </button>
          <button
            onClick={() => setNotifOpen(true)}
            className="relative w-10 h-10 shrink-0 flex items-center justify-center rounded-full hover:bg-surface-variant transition-colors text-on-surface-variant"
            aria-label="Notifications"
          >
            <Icon name="notifications" size={22} />
            {chase.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-secondary-container border-2 border-surface" />
            )}
          </button>
        </div>
      </nav>

      {/* ── Content ────────────────────────────────────── */}
      <main className="md:ml-64 pb-28 md:pb-12">
        <div className="mx-auto w-full max-w-2xl px-container-margin pt-2 md:pt-10">
          {children}
        </div>
      </main>

      {/* ── Mobile bottom nav with centre FAB ──────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-gutter pb-safe bg-surface/85 backdrop-blur-md shadow-[0_-4px_15px_rgba(22,21,19,0.06)] h-20">
        {TABS.slice(0, 2).map((tab) => (
          <TabButton key={tab.id} tab={tab} active={active === tab.id} />
        ))}
        {active === "add" ? (
          <div className="flex flex-col items-center justify-center w-16 h-16 text-primary">
            <span className="w-11 h-11 rounded-full bg-primary text-on-primary flex items-center justify-center mb-1">
              <Icon name="add" size={24} />
            </span>
            <span className="text-label-md">Add</span>
          </div>
        ) : (
          <div className="w-14 relative flex justify-center h-full">
            <Link
              href="/add"
              aria-label="Add booking"
              className="bg-primary text-on-primary rounded-full w-14 h-14 absolute -top-7 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform"
            >
              <Icon name="add" size={28} />
            </Link>
            <span className="text-label-md text-muted-ink absolute bottom-2.5">Add</span>
          </div>
        )}
        {TABS.slice(2).map((tab) => (
          <TabButton key={tab.id} tab={tab} active={active === tab.id} />
        ))}
      </nav>

      {/* ── Business / settings sheet ──────────────────── */}
      <Sheet open={bizOpen} onClose={() => setBizOpen(false)} title="Your business">
        <BusinessSettings
          onClearSample={() => {
            clearSampleData();
          }}
          onReset={() => {
            if (!confirmReset) {
              setConfirmReset(true);
              setTimeout(() => setConfirmReset(false), 3500);
              return;
            }
            resetAll();
            setBizOpen(false);
            setConfirmReset(false);
            router.push("/");
          }}
          confirmReset={confirmReset}
        />
      </Sheet>

      {/* ── Notifications sheet ────────────────────────── */}
      <Sheet open={notifOpen} onClose={() => setNotifOpen(false)} title="To chase">
        <ChaseList bookings={chase} businessName={profile.businessName} />
      </Sheet>
    </div>
  );
}

function TabButton({
  tab,
  active,
}: {
  tab: { id: TabId; href: string; icon: string; label: string };
  active: boolean;
}) {
  return (
    <Link
      href={tab.href}
      className={`flex flex-col items-center justify-center w-16 h-16 transition-colors ${
        active ? "text-primary" : "text-muted-ink hover:text-primary"
      }`}
    >
      <Icon name={tab.icon} fill={active} size={24} className="mb-1" />
      <span className="text-label-md">{tab.label}</span>
    </Link>
  );
}

/** Collapsible editor for the business details printed on PDF invoices. */
function InvoiceDetailsSection() {
  const invoice = useBookFlow((s) => s.profile.invoice) ?? EMPTY_INVOICE_DETAILS;
  const setInvoiceDetails = useBookFlow((s) => s.setInvoiceDetails);
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-surface-variant pt-4 mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-1 text-left"
      >
        <span className="flex items-center gap-2 text-body-md font-semibold text-on-surface">
          <Icon name="picture_as_pdf" size={20} className="text-primary" />
          Invoice details
        </span>
        <Icon name={open ? "expand_less" : "expand_more"} size={22} className="text-muted-ink" />
      </button>
      {open && (
        <div className="pt-3">
          <InvoiceDetailsFields value={invoice} onChange={setInvoiceDetails} />
        </div>
      )}
    </div>
  );
}

/** Download every booking as a CSV — the user's data is theirs, always. */
function ExportCsvButton() {
  const bookings = useBookFlow((s) => s.bookings);

  function exportCsv() {
    const esc = (v: string | number | undefined) =>
      `"${String(v ?? "").replace(/"/g, '""')}"`;
    const header =
      "date,client,title,service,venue,start,end,total,deposit,paid,status,phone,notes";
    const rows = [...bookings]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((b) =>
        [
          b.date,
          b.clientName,
          b.title,
          b.service,
          b.venue,
          b.startTime,
          b.endTime,
          b.total,
          b.deposit,
          b.paid,
          b.status,
          b.phone,
          b.notes,
        ]
          .map(esc)
          .join(","),
      );
    const blob = new Blob([[header, ...rows].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookflow-bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={exportCsv}
      disabled={bookings.length === 0}
      className="w-full flex items-center justify-center gap-2 border border-outline-variant text-on-surface-variant text-label-md py-3.5 rounded-btn hover:bg-surface-container-low transition-colors disabled:opacity-40"
    >
      <Icon name="download" size={18} />
      Export bookings (CSV for Sheets/Excel)
    </button>
  );
}

function BusinessSettings({
  onClearSample,
  onReset,
  confirmReset,
}: {
  onClearSample: () => void;
  onReset: () => void;
  confirmReset: boolean;
}) {
  const profile = useBookFlow((s) => s.profile);
  const updateProfile = useBookFlow.setState;
  const template = getTemplate(profile.templateId);
  const sampleCount = useBookFlow((s) => s.bookings.filter((b) => b.source === "seed").length);

  return (
    <div className="flex flex-col gap-stack-gap-md">
      <label className="block">
        <span className="text-label-md text-muted-ink uppercase block mb-1.5">
          Business name
        </span>
        <input
          value={profile.businessName}
          onChange={(e) =>
            updateProfile((s) => ({ profile: { ...s.profile, businessName: e.target.value } }))
          }
          className="w-full bg-surface border border-outline-variant rounded-btn px-4 py-3 text-body-md text-on-surface focus:outline-none focus:border-primary"
          placeholder="e.g. Snap Moments Photobooth"
        />
      </label>
      <label className="block">
        <span className="text-label-md text-muted-ink uppercase block mb-1.5">Your name</span>
        <input
          value={profile.ownerName}
          onChange={(e) =>
            updateProfile((s) => ({ profile: { ...s.profile, ownerName: e.target.value } }))
          }
          className="w-full bg-surface border border-outline-variant rounded-btn px-4 py-3 text-body-md text-on-surface focus:outline-none focus:border-primary"
          placeholder="e.g. Danish"
        />
      </label>
      <div className="flex items-center gap-3 bg-surface rounded-btn p-4 shadow-ambient">
        <span className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <Icon name={template.icon} fill size={22} />
        </span>
        <div>
          <p className="text-body-md font-semibold text-on-surface">{template.label}</p>
          <p className="text-label-md text-muted-ink">Business template</p>
        </div>
      </div>

      <InvoiceDetailsSection />

      <div className="border-t border-surface-variant pt-4 mt-2 flex flex-col gap-stack-gap-sm">
        <ExportCsvButton />
        {sampleCount > 0 && (
          <button
            onClick={onClearSample}
            className="w-full flex items-center justify-center gap-2 border border-outline-variant text-on-surface-variant text-label-md py-3.5 rounded-btn hover:bg-surface-container-low transition-colors"
          >
            <Icon name="cleaning_services" size={18} />
            Remove sample data ({sampleCount} bookings)
          </button>
        )}
        <button
          onClick={onReset}
          className={`w-full flex items-center justify-center gap-2 text-label-md py-3.5 rounded-btn transition-colors ${
            confirmReset
              ? "bg-error text-on-error"
              : "border border-error/40 text-error hover:bg-error-container/30"
          }`}
        >
          <Icon name="restart_alt" size={18} />
          {confirmReset ? "Tap again to erase everything" : "Start over"}
        </button>
      </div>
    </div>
  );
}
