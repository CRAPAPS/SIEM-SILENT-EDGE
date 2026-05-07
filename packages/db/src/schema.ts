import { z } from "zod";

/**
 * Silent Edge Standard Alert — the canonical normalized format.
 * All three providers (SentinelOne, Bitdefender, NinjaOne) map INTO this.
 * Edge Functions validate inbound payloads against this schema before upsert.
 */
export const SilentEdgeAlertSchema = z.object({
  source: z.enum(["sentinelone", "bitdefender", "manual", "system"]),
  source_alert_id: z.string(),
  severity: z.enum(["info", "low", "medium", "high", "critical"]),
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  technique_id: z.string().optional(),
  technique_name: z.string().optional(),
  indicator_type: z.string().optional(),
  indicator_value: z.string().optional(),
  host: z.string().optional(),
  host_ip: z.string().ip().optional(),
  occurred_at: z.string().datetime(),
  raw_data: z.record(z.unknown()),
});

export type SilentEdgeAlert = z.infer<typeof SilentEdgeAlertSchema>;

/**
 * Severity normalization maps.
 * Converts provider-native severity values → Silent Edge Standard.
 */
export const SENTINELONE_SEVERITY_MAP: Record<string, SilentEdgeAlert["severity"]> = {
  critical: "critical",
  high:     "high",
  medium:   "medium",
  low:      "low",
  info:     "info",
  none:     "info",
};

export const BITDEFENDER_SEVERITY_MAP = (score: number): SilentEdgeAlert["severity"] => {
  if (score >= 9) return "critical";
  if (score >= 7) return "high";
  if (score >= 4) return "medium";
  if (score >= 1) return "low";
  return "info";
};
