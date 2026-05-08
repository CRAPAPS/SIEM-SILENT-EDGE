"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ProposalActions({ proposalId }: { proposalId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function act(action: "approve" | "reject") {
    setLoading(true);
    await fetch(`/api/proposals/${proposalId}/${action}`, { method: "POST" });
    router.refresh();
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", gap: 6 }}>
      <button
        onClick={() => act("approve")}
        disabled={loading}
        style={{
          fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.08em",
          background: "var(--accent)", color: "#001a10", border: "none",
          padding: "4px 10px", cursor: loading ? "not-allowed" : "pointer", fontWeight: 700,
        }}
      >
        AUTHORIZE ◢
      </button>
      <button
        onClick={() => act("reject")}
        disabled={loading}
        style={{
          fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.08em",
          background: "transparent", color: "var(--sev-alert)",
          border: "1px solid var(--sev-alert)", padding: "4px 8px",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        REJECT
      </button>
    </div>
  );
}
