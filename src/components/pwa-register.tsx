"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // Only register in production builds
    if (process.env.NODE_ENV !== "production") return;

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js");
        // console.log("SW registered");
      } catch (e) {
        // console.warn("SW registration failed", e);
      }
    };

    register();
  }, []);

  return null;
}
