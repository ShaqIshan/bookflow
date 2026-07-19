"use client";

import { useEffect } from "react";
import Icon from "./Icon";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

/** Bottom sheet on mobile, centred modal on desktop. */
export default function Sheet({ open, onClose, title, children }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        aria-label="Close"
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-[2px] cursor-default"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-md max-h-[88dvh] overflow-y-auto bg-background rounded-t-card sm:rounded-card shadow-xl animate-sheet-up pb-safe">
        <div className="sticky top-0 z-10 bg-background px-container-margin pt-3 pb-2">
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-surface-variant sm:hidden" />
          <div className="flex items-center justify-between">
            {title ? (
              <h2 className="font-heading text-headline-sm text-on-surface">{title}</h2>
            ) : (
              <span />
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 -mr-1 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-colors"
              aria-label="Close sheet"
            >
              <Icon name="close" size={22} />
            </button>
          </div>
        </div>
        <div className="px-container-margin pb-8">{children}</div>
      </div>
    </div>
  );
}
