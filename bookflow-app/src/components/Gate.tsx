"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBookFlow, useHydrated } from "@/lib/store";
import { BASE_PATH } from "@/lib/basePath";

/**
 * Wraps every in-app screen: waits for the persisted store to hydrate,
 * and sends first-time visitors to onboarding.
 */
export default function Gate({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const onboarded = useBookFlow((s) => s.profile.onboarded);
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !onboarded) router.replace("/");
  }, [hydrated, onboarded, router]);

  if (!hydrated || !onboarded) return <Splash />;
  return <>{children}</>;
}

export function Splash() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-4 bg-background">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${BASE_PATH}/icons/icon.svg`}
        alt="BookFlow"
        className="w-16 h-16 animate-pulse"
      />
      <span className="font-heading text-display-md text-primary font-bold tracking-tight">
        BookFlow
      </span>
    </div>
  );
}
