"use client";

import { useEffect } from "react";
import { BASE_PATH } from "@/lib/basePath";

/** Registers the offline-cache service worker (production only). */
export default function SwRegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV === "production" &&
      typeof navigator !== "undefined" &&
      "serviceWorker" in navigator
    ) {
      navigator.serviceWorker.register(`${BASE_PATH}/sw.js`).catch(() => {
        // Offline support is progressive enhancement — never block the app
      });
    }
  }, []);
  return null;
}
