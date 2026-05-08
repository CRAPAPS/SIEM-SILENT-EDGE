"use client";

import { useEffect } from "react";

export function useFingerprint() {
  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const FingerprintJS = await import("@fingerprintjs/fingerprintjs");
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        if (cancelled) return;

        await fetch("/api/fingerprint", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            visitorId: result.visitorId,
            confidence: result.confidence.score,
          }),
        });
      } catch {
        // Silent — fingerprinting is non-critical
      }
    }

    run();
    return () => { cancelled = true; };
  }, []);
}
