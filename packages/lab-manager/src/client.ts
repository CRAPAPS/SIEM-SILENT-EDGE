import type { AgenticManager, LabFinding, LabUnit, SpiderfootResult, TaskResult, UnitID } from "./types.js";

export class LabManagerClient implements AgenticManager {
  private baseUrl: string;
  private secret: string;

  constructor(baseUrl: string, secret: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.secret = secret;
  }

  private headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.secret}`,
    };
  }

  async wakeUnit(unitID: UnitID): Promise<void> {
    const res = await fetch(`${this.baseUrl}/units/${unitID}/wake`, {
      method: "POST",
      headers: this.headers(),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`Wake failed: ${await res.text()}`);
  }

  async executeTask(unitID: UnitID, script: string): Promise<TaskResult> {
    const res = await fetch(`${this.baseUrl}/units/${unitID}/execute`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ script }),
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) throw new Error(`Execute failed: ${await res.text()}`);
    return res.json() as Promise<TaskResult>;
  }

  async suspendUnit(unitID: UnitID): Promise<void> {
    const res = await fetch(`${this.baseUrl}/units/${unitID}/suspend`, {
      method: "POST",
      headers: this.headers(),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`Suspend failed: ${await res.text()}`);
  }

  async getStatus(unitID?: UnitID): Promise<LabUnit[]> {
    const res = await fetch(`${this.baseUrl}/status`, {
      headers: this.headers(),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`Status failed: ${await res.text()}`);
    const all = (await res.json()) as LabUnit[];
    return unitID ? all.filter((u) => u.id === unitID) : all;
  }
}

export function createLabManager(): LabManagerClient {
  const baseUrl = process.env.LAB_GATEWAY_URL;
  const secret = process.env.LAB_GATEWAY_SECRET;
  if (!baseUrl || !secret) {
    throw new Error("LAB_GATEWAY_URL or LAB_GATEWAY_SECRET not configured");
  }
  return new LabManagerClient(baseUrl, secret);
}

// ── SpiderFoot output parser ─────────────────────────────────

const SF_TYPE_MAP: Record<string, LabFinding["ioc_type"]> = {
  IP_ADDRESS: "ip",
  IPV6_ADDRESS: "ip",
  NETBLOCK_OWNER: "ip",
  INTERNET_NAME: "domain",
  EMAILADDR: "email",
  URL_FORM: "url",
  URL_STATIC: "url",
  HASH: "hash",
  GEOINFO: "geo",
};

export function parseSpiderfootOutput(stdout: string): LabFinding[] {
  try {
    const raw = JSON.parse(stdout) as SpiderfootResult[];
    if (!Array.isArray(raw)) return [];
    return raw.flatMap((item) => {
      const ioc_type = SF_TYPE_MAP[item.type];
      if (!ioc_type) return [];
      const value = String(item.data ?? "").trim();
      if (!value) return [];
      return [
        {
          ioc_type,
          ioc_value: value,
          confidence: typeof item.confidence === "number" ? item.confidence / 100 : 0.5,
          source_tool: "spiderfoot",
          metadata: { sf_type: item.type, module: item.module },
        } satisfies LabFinding,
      ];
    });
  } catch {
    return [];
  }
}
