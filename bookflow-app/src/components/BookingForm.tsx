"use client";

import { useState } from "react";
import type { Booking } from "@/lib/types";
import type { ParsedField } from "@/lib/parser";
import { useBookFlow } from "@/lib/store";
import { getTemplate } from "@/lib/templates";
import { findConflicts } from "@/lib/conflicts";
import { fmtTimeRange, todayISO } from "@/lib/dates";
import Icon from "./Icon";

export interface BookingFormValues {
  title: string;
  clientName: string;
  phone?: string;
  service: string;
  date: string;
  startTime?: string;
  endTime?: string;
  venue?: string;
  total: number;
  deposit: number;
  paid: number;
  cost?: number;
  notes?: string;
}

interface BookingFormProps {
  initial?: Partial<Booking>;
  detected?: ParsedField[];
  submitLabel: string;
  showPaid?: boolean;
  /** Booking id to ignore in double-booking checks (when editing) */
  excludeId?: string;
  onSubmit: (values: BookingFormValues) => void;
}

function Label({
  text,
  auto,
  htmlFor,
}: {
  text: string;
  auto?: boolean;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-label-md text-muted-ink uppercase flex items-center gap-1.5 mb-1.5"
    >
      {text}
      {auto && (
        <span className="normal-case tracking-normal inline-flex items-center gap-0.5 bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
          <Icon name="auto_awesome" size={11} />
          auto
        </span>
      )}
    </label>
  );
}

const inputCls =
  "w-full bg-surface border border-outline-variant rounded-btn px-4 py-3 text-body-md text-on-surface placeholder:text-muted-ink/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";

export default function BookingForm({
  initial,
  detected = [],
  submitLabel,
  showPaid = false,
  excludeId,
  onSubmit,
}: BookingFormProps) {
  const bookings = useBookFlow((s) => s.bookings);
  const templateId = useBookFlow((s) => s.profile.templateId);
  const template = getTemplate(templateId);
  const services = [...template.services];
  if (initial?.service && !services.includes(initial.service)) {
    services.unshift(initial.service);
  }

  const [title, setTitle] = useState(initial?.title ?? "");
  const [clientName, setClientName] = useState(initial?.clientName ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [service, setService] = useState(initial?.service ?? template.defaultService);
  const [date, setDate] = useState(initial?.date ?? "");
  const [startTime, setStartTime] = useState(initial?.startTime ?? "");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "");
  const [venue, setVenue] = useState(initial?.venue ?? "");
  const [total, setTotal] = useState(initial?.total != null ? String(initial.total) : "");
  const [deposit, setDeposit] = useState(
    initial?.deposit != null && initial.deposit !== 0 ? String(initial.deposit) : "",
  );
  const [paid, setPaid] = useState(initial?.paid != null ? String(initial.paid) : "0");
  const [cost, setCost] = useState(initial?.cost != null ? String(initial.cost) : "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [depositPaid, setDepositPaid] = useState(
    initial?.paid != null && initial.paid > 0,
  );
  const [error, setError] = useState("");
  const [moreOpen, setMoreOpen] = useState(Boolean(initial?.cost || initial?.notes));

  const has = (f: ParsedField) => detected.includes(f);

  function num(v: string): number {
    const n = parseFloat(v.replace(/,/g, ""));
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const finalTitle = title.trim() || (clientName.trim() ? `${clientName.trim()} — Booking` : "");
    if (!finalTitle) {
      setError("Give the booking a name — or at least the client's name.");
      return;
    }
    if (!date) {
      setError("Pick a date for the booking.");
      return;
    }
    setError("");
    const depositNum = num(deposit);
    const paidNum = showPaid ? num(paid) : depositPaid ? depositNum : 0;
    onSubmit({
      title: finalTitle,
      clientName: clientName.trim() || finalTitle,
      phone: phone.trim() || undefined,
      service,
      date,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      venue: venue.trim() || undefined,
      total: num(total),
      deposit: depositNum,
      paid: paidNum,
      cost: cost ? num(cost) : undefined,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-stack-gap-md" noValidate>
      <div>
        <Label text="Booking title" auto={Boolean(initial?.title) && detected.length > 0} htmlFor="bf-title" />
        <input
          id="bf-title"
          className={inputCls}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Aisha & Faiz Wedding"
        />
      </div>

      <div className="grid grid-cols-2 gap-gutter">
        <div>
          <Label text="Client" auto={has("clientName")} htmlFor="bf-client" />
          <input
            id="bf-client"
            className={inputCls}
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Name"
          />
        </div>
        <div>
          <Label text="WhatsApp no." auto={has("phone")} htmlFor="bf-phone" />
          <input
            id="bf-phone"
            className={inputCls}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="012-345 6789"
            inputMode="tel"
          />
        </div>
      </div>

      <div>
        <Label text="Service" auto={has("service")} htmlFor="bf-service" />
        <div className="relative">
          <select
            id="bf-service"
            className={`${inputCls} appearance-none pr-10`}
            value={service}
            onChange={(e) => setService(e.target.value)}
          >
            {services.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <Icon
            name="expand_more"
            size={20}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-ink pointer-events-none"
          />
        </div>
      </div>

      <div>
        <Label text="Date" auto={has("date")} htmlFor="bf-date" />
        <input
          id="bf-date"
          type="date"
          className={inputCls}
          value={date}
          min={showPaid ? undefined : "2020-01-01"}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-gutter">
        <div>
          <Label text="Start" auto={has("startTime")} htmlFor="bf-start" />
          <input
            id="bf-start"
            type="time"
            className={inputCls}
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>
        <div>
          <Label text="End" auto={has("endTime")} htmlFor="bf-end" />
          <input
            id="bf-end"
            type="time"
            className={inputCls}
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label text="Venue" auto={has("venue")} htmlFor="bf-venue" />
        <input
          id="bf-venue"
          className={inputCls}
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          placeholder="e.g. Setia City Convention Centre"
        />
      </div>

      <div className="grid grid-cols-2 gap-gutter">
        <div>
          <Label text="Total (RM)" auto={has("total")} htmlFor="bf-total" />
          <input
            id="bf-total"
            className={inputCls}
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            placeholder="0"
            inputMode="decimal"
          />
        </div>
        <div>
          <Label text="Deposit (RM)" auto={has("deposit")} htmlFor="bf-deposit" />
          <input
            id="bf-deposit"
            className={inputCls}
            value={deposit}
            onChange={(e) => setDeposit(e.target.value)}
            placeholder="0"
            inputMode="decimal"
          />
        </div>
      </div>

      {showPaid ? (
        <div>
          <Label text="Paid so far (RM)" htmlFor="bf-paid" />
          <input
            id="bf-paid"
            className={inputCls}
            value={paid}
            onChange={(e) => setPaid(e.target.value)}
            placeholder="0"
            inputMode="decimal"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setDepositPaid(!depositPaid)}
          className={`flex items-center gap-3 rounded-btn border px-4 py-3.5 transition-colors text-left ${
            depositPaid
              ? "border-primary bg-primary/5 text-primary"
              : "border-outline-variant bg-surface text-on-surface-variant"
          }`}
        >
          <Icon name={depositPaid ? "check_circle" : "radio_button_unchecked"} fill={depositPaid} size={22} />
          <span className="text-body-md">
            Deposit already received
            {depositPaid && deposit && (
              <span className="block text-body-sm text-primary/80">
                RM {deposit} will be recorded as paid
              </span>
            )}
          </span>
        </button>
      )}

      <button
        type="button"
        onClick={() => setMoreOpen(!moreOpen)}
        className="flex items-center gap-1 text-body-sm text-muted-ink hover:text-on-surface transition-colors self-start"
      >
        <Icon name={moreOpen ? "expand_less" : "expand_more"} size={18} />
        {moreOpen ? "Less" : "More — cost & notes"}
      </button>

      {moreOpen && (
        <>
          <div>
            <Label text="Estimated cost (RM)" htmlFor="bf-cost" />
            <input
              id="bf-cost"
              className={inputCls}
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="Fuel, workers, materials…"
              inputMode="decimal"
            />
          </div>
          <div>
            <Label text="Notes" htmlFor="bf-notes" />
            <textarea
              id="bf-notes"
              className={`${inputCls} min-h-20 resize-y`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Backdrop colour, parking info, special requests…"
            />
          </div>
        </>
      )}

      {(() => {
        const conflicts = findConflicts(bookings, {
          date: date || undefined,
          startTime: startTime || undefined,
          endTime: endTime || undefined,
          excludeId,
        });
        if (conflicts.length === 0) return null;
        const c = conflicts[0];
        return (
          <p className="text-body-sm text-on-surface bg-secondary-container/15 border border-secondary-container/40 rounded-btn px-4 py-3 flex items-start gap-2.5">
            <Icon name="warning" size={18} className="text-secondary mt-0.5 shrink-0" />
            <span>
              Heads up — <span className="font-semibold">{c.title}</span> is already booked
              on this date
              {c.startTime && ` (${fmtTimeRange(c.startTime, c.endTime)})`}. You can still
              save if your crew can cover both.
            </span>
          </p>
        );
      })()}

      {error && (
        <p className="text-body-sm text-error bg-error-container/40 rounded-btn px-4 py-3">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary text-label-md py-4 rounded-btn shadow-md hover:opacity-90 transition-opacity active:scale-[0.98]"
      >
        <Icon name="check" size={20} />
        {submitLabel}
      </button>
      {!date && (
        <button
          type="button"
          onClick={() => setDate(todayISO())}
          className="text-body-sm text-muted-ink hover:text-primary transition-colors self-center -mt-2"
        >
          Set date to today
        </button>
      )}
    </form>
  );
}
