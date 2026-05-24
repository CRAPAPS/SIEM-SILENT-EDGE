"use client";

import { useEffect, useRef, useState } from "react";

type UnitID = "osint-unit" | "redteam-unit";
type UnitStatus = "running" | "paused" | "stopped" | "not_found" | "unknown";

interface LabUnit {
  id: UnitID;
  status: UnitStatus;
  startedAt?: string;
}

interface Run {
  id: string;
  unit_id: string;
  tool_name: string;
  target: string;
  status: string;
  started_at: string;
  completed_at?: string;
}

interface Finding {
  id: string;
  ioc_type: string;
  ioc_value: string;
  source_tool: string;
  confidence?: number;
  geo_country?: string;
  created_at: string;
}

interface Props {
  recentRuns: Run[];
  recentFindings: Finding[];
  isAdmin: boolean;
}

const STATUS_COLOR: Record<string, string> = {
  running: "var(--sev-ok)",
  paused: "var(--sev-warn)",
  stopped: "var(--muted)",
  not_found: "var(--muted)",
  unknown: "var(--muted)",
};

const IOC_BADGE: Record<string, string> = {
  ip: "#3d7eff",
  domain: "var(--accent)",
  email: "var(--sev-warn)",
  url: "var(--sev-medium)",
  hash: "var(--sev-alert)",
  port: "var(--muted)",
  geo: "var(--sev-ok)",
};

export function LabConsole({ recentRuns, recentFindings, isAdmin }: Props) {
  const [units, setUnits] = useState<LabUnit[]>([
    { id: "osint-unit", status: "unknown" },
    { id: "redteam-unit", status: "unknown" },
  ]);
  const [selectedUnit, setSelectedUnit] = useState<UnitID>("osint-unit");
  const [script, setScript] = useState("");
  const [tool, setTool] = useState("manual");
  const [target, setTarget] = useState("");
  const [output, setOutput] = useState("");
  const [executing, setExecuting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [runs, setRuns] = useState<Run[]>(recentRuns);
  const [findings, setFindings] = useState<Finding[]>(recentFindings);
  const outputRef = useRef<HTMLPreElement>(null);

  // Poll unit status on mount and every 15s
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/lab");
        const json = await res.json() as { units?: LabUnit[]; configured?: boolean };
        if (json.units && json.units.length > 0) setUnits(json.units);
      } catch {
        // Gateway may be offline — keep last known state
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 15_000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const sendAction = async (action: "wake" | "suspend" | "execute") => {
    if (action === "execute" && !script.trim()) return;
    setActionLoading(action);
    if (action === "execute") {
      setExecuting(true);
      setOutput("[ executing... ]\n");
    }

    try {
      const res = await fetch(`/api/lab/${selectedUnit}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          script: action === "execute" ? script : undefined,
          tool,
          target: target || undefined,
        }),
      });
      const data = await res.json() as {
        stdout?: string;
        stderr?: string;
        exitCode?: number;
        status?: string;
        error?: string;
        ok?: boolean;
      };

      if (action === "execute") {
        const out = [
          data.stdout ?? "",
          data.stderr ? `[STDERR]\n${data.stderr}` : "",
          `\n[ exit ${data.exitCode ?? "?"} ]`,
        ]
          .filter(Boolean)
          .join("\n");
        setOutput(out);
      }

      if (action === "wake" || action === "suspend") {
        // Refresh status
        const statusRes = await fetch("/api/lab");
        const statusJson = await statusRes.json() as { units?: LabUnit[] };
        if (statusJson.units) setUnits(statusJson.units);
      }
    } catch (err) {
      setOutput(`[ error: ${String(err)} ]`);
    } finally {
      setActionLoading(null);
      setExecuting(false);
    }
  };

  const unitStatus = (id: UnitID) =>
    units.find((u) => u.id === id)?.status ?? "unknown";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Unit Status Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {(["osint-unit", "redteam-unit"] as UnitID[]).map((unitId) => {
          const status = unitStatus(unitId);
          const isSelected = selectedUnit === unitId;
          return (
            <button
              key={unitId}
              onClick={() => setSelectedUnit(unitId)}
              style={{
                background: isSelected ? "var(--surface)" : "transparent",
                border: `1px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                borderRadius: "4px",
                padding: "1rem 1.25rem",
                cursor: "pointer",
                textAlign: "left",
                transition: "border-color 0.15s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: STATUS_COLOR[status] ?? "var(--muted)",
                    boxShadow: status === "running" ? `0 0 6px ${STATUS_COLOR[status]}` : "none",
                  }}
                />
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--fg)",
                    textTransform: "uppercase",
                  }}
                >
                  {unitId}
                </span>
              </div>
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: "10px",
                  color: STATUS_COLOR[status] ?? "var(--muted)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                {status}
              </div>
            </button>
          );
        })}
      </div>

      {/* Unit Controls */}
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <button
          onClick={() => sendAction("wake")}
          disabled={actionLoading !== null}
          className="btn-primary"
          style={{ fontSize: "11px", padding: "6px 16px" }}
        >
          {actionLoading === "wake" ? "WAKING..." : "WAKE UNIT"}
        </button>
        <button
          onClick={() => sendAction("suspend")}
          disabled={actionLoading !== null}
          className="btn-secondary"
          style={{ fontSize: "11px", padding: "6px 16px" }}
        >
          {actionLoading === "suspend" ? "SUSPENDING..." : "SUSPEND UNIT"}
        </button>
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: "10px",
            color: "var(--muted)",
            marginLeft: "auto",
          }}
        >
          TARGET: {selectedUnit.toUpperCase()}
        </span>
      </div>

      {/* Task Dispatch */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "4px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "0.625rem 1rem",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            gap: "1rem",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontFamily: "var(--mono)",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.06em",
              color: "var(--muted)",
            }}
          >
            TASK DISPATCH
          </span>
          <input
            value={tool}
            onChange={(e) => setTool(e.target.value)}
            placeholder="tool (e.g. spiderfoot, nmap)"
            style={{
              fontFamily: "var(--mono)",
              fontSize: "11px",
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: "3px",
              color: "var(--fg)",
              padding: "3px 8px",
              width: "160px",
            }}
          />
          <input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="target ip / domain"
            style={{
              fontFamily: "var(--mono)",
              fontSize: "11px",
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: "3px",
              color: "var(--fg)",
              padding: "3px 8px",
              width: "180px",
            }}
          />
        </div>
        <textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          placeholder={`# Script runs inside ${selectedUnit}\n# Example: nmap -sV 192.168.1.0/24 -oN /output/scan.txt`}
          rows={6}
          style={{
            fontFamily: "var(--mono)",
            fontSize: "12px",
            background: "transparent",
            border: "none",
            color: "var(--fg)",
            padding: "0.75rem 1rem",
            width: "100%",
            resize: "vertical",
            outline: "none",
            display: "block",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              sendAction("execute");
            }
          }}
        />
        <div
          style={{
            padding: "0.5rem 1rem",
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontFamily: "var(--mono)",
              fontSize: "10px",
              color: "var(--muted)",
            }}
          >
            Ctrl+Enter to execute
          </span>
          <button
            onClick={() => sendAction("execute")}
            disabled={executing || !script.trim()}
            className="btn-primary"
            style={{ fontSize: "11px", padding: "6px 20px" }}
          >
            {executing ? "EXECUTING..." : "EXECUTE"}
          </button>
        </div>
      </div>

      {/* Output Console */}
      {output && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "0.5rem 1rem",
              borderBottom: "1px solid var(--border)",
              fontFamily: "var(--mono)",
              fontSize: "10px",
              color: "var(--muted)",
              letterSpacing: "0.06em",
            }}
          >
            STDOUT / STDERR
          </div>
          <pre
            ref={outputRef}
            style={{
              fontFamily: "var(--mono)",
              fontSize: "11px",
              color: "var(--sev-ok)",
              padding: "0.75rem 1rem",
              margin: 0,
              overflowY: "auto",
              maxHeight: "360px",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
            }}
          >
            {output}
          </pre>
        </div>
      )}

      {/* Recent Runs */}
      {runs.length > 0 && (
        <div>
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "var(--muted)",
              marginBottom: "0.5rem",
            }}
          >
            RECENT RUNS
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            {runs.map((run) => (
              <div
                key={run.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "100px 80px 1fr 80px 80px",
                  gap: "0.75rem",
                  alignItems: "center",
                  padding: "0.5rem 0.75rem",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "3px",
                  fontFamily: "var(--mono)",
                  fontSize: "11px",
                }}
              >
                <span style={{ color: "var(--accent)" }}>{run.unit_id}</span>
                <span style={{ color: "var(--muted)" }}>{run.tool_name}</span>
                <span
                  style={{
                    color: "var(--fg)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {run.target}
                </span>
                <span
                  style={{
                    color:
                      run.status === "completed"
                        ? "var(--sev-ok)"
                        : run.status === "failed"
                          ? "var(--sev-alert)"
                          : "var(--sev-warn)",
                  }}
                >
                  {run.status.toUpperCase()}
                </span>
                <span style={{ color: "var(--muted)", fontSize: "10px" }}>
                  {new Date(run.started_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Findings */}
      {findings.length > 0 && (
        <div>
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "var(--muted)",
              marginBottom: "0.5rem",
            }}
          >
            RECENT FINDINGS
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            {findings.map((f) => (
              <div
                key={f.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "64px 1fr 100px 60px 60px",
                  gap: "0.75rem",
                  alignItems: "center",
                  padding: "0.5rem 0.75rem",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "3px",
                  fontFamily: "var(--mono)",
                  fontSize: "11px",
                }}
              >
                <span
                  style={{
                    color: IOC_BADGE[f.ioc_type] ?? "var(--muted)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    fontSize: "10px",
                  }}
                >
                  {f.ioc_type}
                </span>
                <span
                  style={{
                    color: "var(--fg)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {f.ioc_value}
                </span>
                <span style={{ color: "var(--muted)" }}>{f.source_tool}</span>
                <span style={{ color: "var(--muted)", fontSize: "10px" }}>
                  {f.geo_country ?? "—"}
                </span>
                <span style={{ color: "var(--muted)", fontSize: "10px" }}>
                  {f.confidence != null ? `${Math.round(f.confidence * 100)}%` : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
