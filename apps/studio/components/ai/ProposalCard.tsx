"use client";

import { useState } from "react";

interface Proposal {
  id?: string;
  title: string;
  risk: string;
  summary: string;
  scriptType: string;
  script: string;
}

const RISK_COLOR: Record<string, string> = {
  critical: "var(--sev-crit)",
  high:     "var(--sev-alert)",
  medium:   "var(--sev-warn)",
  low:      "var(--sev-ok)",
};

export function ProposalCard({ proposal, onAction }: { proposal: Proposal; onAction?: (status: "approved" | "rejected") => void }) {
  const [status, setStatus] = useState<"pending" | "approved" | "rejected" | "executing">("pending");
  const [error, setError] = useState<string | null>(null);

  async function handleApprove() {
    if (!proposal.id) return;
    setStatus("executing");
    try {
      const res = await fetch(`/api/proposals/${proposal.id}/approve`, { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      setStatus("approved");
      onAction?.("approved");
    } catch (e) {
      setError(String(e));
      setStatus("pending");
    }
  }

  async function handleReject() {
    if (!proposal.id) return;
    try {
      await fetch(`/api/proposals/${proposal.id}/reject`, { method: "POST" });
      setStatus("rejected");
      onAction?.("rejected");
    } catch {
      setStatus("rejected");
    }
  }

  const riskColor = RISK_COLOR[proposal.risk] ?? "var(--sev-warn)";

  return (
    <div style={{
      border: `1px solid ${riskColor}`,
      background: "var(--bg-3)",
      marginTop: 12,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Top bar */}
      <div style={{
        background: `${riskColor}22`,
        borderBottom: `1px solid ${riskColor}44`,
        padding: "6px 12px",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.1em", color: riskColor }}>
          ◢ PROPOSAL
        </span>
        <span style={{
          fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.08em",
          background: riskColor, color: "#000", padding: "1px 5px",
        }}>
          {proposal.risk.toUpperCase()}
        </span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700, color: "var(--fg)", marginLeft: 4 }}>
          {proposal.title}
        </span>
      </div>

      <div style={{ padding: "10px 12px" }}>
        {/* Summary */}
        <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 10px" }}>
          {proposal.summary}
        </p>

        {/* Script block */}
        {proposal.script && (
          <div style={{ marginBottom: 12 }}>
            <div style={{
              fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.1em",
              color: "var(--muted)", marginBottom: 4,
            }}>
              SCRIPT · {proposal.scriptType.toUpperCase()}
            </div>
            <pre style={{
              fontFamily: "var(--mono)", fontSize: 10, lineHeight: 1.6,
              background: "#020304", border: "1px solid var(--border)",
              padding: "8px 10px", margin: 0, overflowX: "auto",
              color: "var(--sev-ok)", whiteSpace: "pre-wrap", wordBreak: "break-all",
            }}>
              {proposal.script}
            </pre>
          </div>
        )}

        {/* Status / actions */}
        {status === "pending" && (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleApprove}
              style={{
                fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.1em",
                background: "var(--accent)", color: "#001a10", border: "none",
                padding: "6px 14px", cursor: "pointer", fontWeight: 700,
              }}
            >
              AUTHORIZE EXECUTION ◢
            </button>
            <button
              onClick={handleReject}
              style={{
                fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.1em",
                background: "transparent", color: "var(--sev-alert)",
                border: "1px solid var(--sev-alert)", padding: "6px 14px", cursor: "pointer",
              }}
            >
              REJECT
            </button>
          </div>
        )}

        {status === "executing" && (
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--sev-warn)", letterSpacing: "0.08em" }}>
            ◌ EXECUTING...
          </div>
        )}

        {status === "approved" && (
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--sev-ok)", letterSpacing: "0.08em" }}>
            ✓ EXECUTED — AUDIT LOG CREATED
          </div>
        )}

        {status === "rejected" && (
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--sev-alert)", letterSpacing: "0.08em" }}>
            ✕ REJECTED
          </div>
        )}

        {error && (
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--sev-crit)", marginTop: 4 }}>
            ERROR: {error}
          </div>
        )}
      </div>
    </div>
  );
}
