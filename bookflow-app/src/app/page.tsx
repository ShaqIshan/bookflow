"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBookFlow, useHydrated } from "@/lib/store";
import { TEMPLATES, getTemplate } from "@/lib/templates";
import type { TemplateId } from "@/lib/types";
import { parseSheetPaste, type ImportResult } from "@/lib/importer";
import Icon from "@/components/Icon";
import Sheet from "@/components/Sheet";
import { Splash } from "@/components/Gate";

export default function OnboardingPage() {
  const hydrated = useHydrated();
  const onboarded = useBookFlow((s) => s.profile.onboarded);
  const completeOnboarding = useBookFlow((s) => s.completeOnboarding);
  const addBooking = useBookFlow((s) => s.addBooking);
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [templateId, setTemplateId] = useState<TemplateId>("photo-booth");
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [withSample, setWithSample] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importPreview, setImportPreview] = useState<ImportResult | null>(null);

  useEffect(() => {
    if (hydrated && onboarded) router.replace("/home");
  }, [hydrated, onboarded, router]);

  if (!hydrated || onboarded) return <Splash />;

  function finish(imported?: ImportResult) {
    completeOnboarding(templateId, businessName.trim(), ownerName.trim(), !imported && withSample);
    if (imported) {
      for (const b of imported.bookings) {
        addBooking({ ...b, source: "manual" });
      }
    }
    router.replace("/home");
  }

  function previewImport(text: string) {
    setImportText(text);
    setImportPreview(text.trim() ? parseSheetPaste(text, getTemplate(templateId).defaultService) : null);
  }

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      {/* Top bar */}
      <header className="flex justify-between items-center px-container-margin py-4 sticky top-0 bg-background z-10">
        <div className="w-10">
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-colors"
              aria-label="Back"
            >
              <Icon name="arrow_back" size={24} />
            </button>
          )}
        </div>
        <h1 className="font-heading text-display-md text-primary font-bold tracking-tight">
          BookFlow
        </h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 w-full max-w-md mx-auto px-container-margin py-stack-gap-lg flex flex-col pb-safe">
        {step === 1 ? (
          <>
            <section className="mb-stack-gap-lg">
              <h2 className="font-heading text-display-lg-mobile text-on-surface mb-stack-gap-sm">
                What do you run?
              </h2>
              <p className="text-body-md text-on-surface-variant">
                We&apos;ll set up your bookings to match.
              </p>
            </section>

            <section className="grid grid-cols-2 gap-gutter content-start">
              {TEMPLATES.map((t) => {
                const selected = t.id === templateId;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTemplateId(t.id)}
                    className={`bg-surface rounded-xl p-stack-gap-md flex flex-col items-center justify-center text-center shadow-ambient relative overflow-hidden transition-all active:scale-95 min-h-32 ${
                      selected
                        ? "border-2 border-primary"
                        : "border border-surface-variant hover:border-outline-variant"
                    }`}
                  >
                    {selected && <div className="absolute inset-0 bg-primary/5" />}
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center mb-stack-gap-sm relative z-10 ${
                        selected ? "bg-primary/10 text-primary" : "bg-surface-container text-on-surface-variant"
                      }`}
                    >
                      <Icon name={t.icon} fill={selected} />
                    </div>
                    <span
                      className={`relative z-10 text-body-md ${
                        selected ? "font-semibold text-primary" : "text-on-surface"
                      }`}
                    >
                      {t.label}
                    </span>
                    {selected && (
                      <span className="absolute top-3 right-3 text-primary z-10">
                        <Icon name="check_circle" fill size={18} />
                      </span>
                    )}
                  </button>
                );
              })}
            </section>

            <section className="mt-auto pt-stack-gap-lg pb-6">
              <button
                onClick={() => setImportOpen(true)}
                className="w-full flex items-center justify-center gap-2 border border-primary text-primary text-label-md py-4 rounded-btn mb-stack-gap-sm hover:bg-primary/5 transition-colors active:scale-[0.98]"
              >
                <Icon name="table_chart" size={20} />
                Import from Google Sheets
              </button>
              <button
                onClick={() => setStep(2)}
                className="w-full flex items-center justify-center bg-primary text-on-primary text-label-md py-4 rounded-btn shadow-md hover:opacity-90 transition-opacity active:scale-[0.98]"
              >
                Continue
              </button>
            </section>
          </>
        ) : (
          <>
            <section className="mb-stack-gap-lg">
              <h2 className="font-heading text-display-lg-mobile text-on-surface mb-stack-gap-sm">
                Name your workspace
              </h2>
              <p className="text-body-md text-on-surface-variant">
                This shows up on invoices and WhatsApp messages to clients.
              </p>
            </section>

            <section className="flex flex-col gap-stack-gap-md">
              <label className="block">
                <span className="text-label-md text-muted-ink uppercase block mb-1.5">
                  Business name
                </span>
                <input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder={`e.g. Snap Moments ${getTemplate(templateId).label.split(" ")[0]}`}
                  className="w-full bg-surface border border-outline-variant rounded-btn px-4 py-3.5 text-body-md text-on-surface placeholder:text-muted-ink/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </label>
              <label className="block">
                <span className="text-label-md text-muted-ink uppercase block mb-1.5">
                  Your name
                </span>
                <input
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Danish"
                  className="w-full bg-surface border border-outline-variant rounded-btn px-4 py-3.5 text-body-md text-on-surface placeholder:text-muted-ink/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </label>

              <button
                onClick={() => setWithSample(!withSample)}
                className={`flex items-start gap-3 rounded-btn border px-4 py-3.5 transition-colors text-left ${
                  withSample
                    ? "border-primary bg-primary/5"
                    : "border-outline-variant bg-surface"
                }`}
              >
                <Icon
                  name={withSample ? "check_circle" : "radio_button_unchecked"}
                  fill={withSample}
                  size={22}
                  className={withSample ? "text-primary mt-0.5" : "text-on-surface-variant mt-0.5"}
                />
                <span className="text-body-md text-on-surface">
                  Start with sample bookings
                  <span className="block text-body-sm text-muted-ink mt-0.5">
                    See BookFlow alive on day one — remove them anytime from settings.
                  </span>
                </span>
              </button>
            </section>

            <section className="mt-auto pt-stack-gap-lg pb-6">
              <button
                onClick={() => finish()}
                className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary text-label-md py-4 rounded-btn shadow-md hover:opacity-90 transition-opacity active:scale-[0.98]"
              >
                Let&apos;s go
                <Icon name="arrow_forward" size={18} />
              </button>
            </section>
          </>
        )}
      </main>

      {/* Import sheet */}
      <Sheet open={importOpen} onClose={() => setImportOpen(false)} title="Import from Google Sheets">
        <div className="flex flex-col gap-stack-gap-md">
          <p className="text-body-sm text-on-surface-variant">
            Select your booking rows in Google Sheets or Excel, copy them
            (Ctrl/Cmd&nbsp;+&nbsp;C), and paste below. Columns we understand:
            date · client · title · venue · total · deposit · paid · phone.
          </p>
          <textarea
            value={importText}
            onChange={(e) => previewImport(e.target.value)}
            placeholder={"26/7/2026\tAisha\tWedding\tSetia City\t1800\t500\t500\n1/8/2026\tMelissa\tCorporate Dinner\tOne World Hotel\t1500\t400\t0"}
            className="w-full min-h-36 bg-surface border border-dashed border-outline-variant rounded-btn px-4 py-3.5 text-body-sm text-on-surface font-mono placeholder:text-muted-ink/60 focus:outline-none focus:border-primary resize-y"
          />
          {importPreview && (
            <div
              className={`rounded-btn px-4 py-3 text-body-sm ${
                importPreview.bookings.length > 0
                  ? "bg-primary/10 text-primary"
                  : "bg-secondary/10 text-secondary"
              }`}
            >
              {importPreview.bookings.length > 0 ? (
                <>
                  Found <strong>{importPreview.bookings.length}</strong> booking
                  {importPreview.bookings.length > 1 ? "s" : ""}
                  {importPreview.skipped > 0 && ` (${importPreview.skipped} rows skipped)`}
                  {" — "}
                  {importPreview.bookings
                    .slice(0, 3)
                    .map((b) => b.title)
                    .join(", ")}
                  {importPreview.bookings.length > 3 && "…"}
                </>
              ) : (
                <>No rows recognised yet — check each row starts with a date.</>
              )}
            </div>
          )}
          <button
            disabled={!importPreview || importPreview.bookings.length === 0}
            onClick={() => importPreview && finish(importPreview)}
            className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary text-label-md py-4 rounded-btn shadow-md hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon name="download_done" size={20} />
            Import & start
          </button>
        </div>
      </Sheet>
    </div>
  );
}
