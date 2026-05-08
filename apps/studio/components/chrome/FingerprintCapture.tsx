"use client";

import { useFingerprint } from "@/lib/fingerprint";

export function FingerprintCapture() {
  useFingerprint();
  return null;
}
