"use client";

export default function GeoIntError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        fontFamily: "var(--mono)",
        padding: "2rem",
        color: "var(--sev-crit, #ff2222)",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          color: "var(--muted)",
          letterSpacing: "0.1em",
          marginBottom: "0.5rem",
        }}
      >
        GEOINT // ERROR BOUNDARY
      </div>
      <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "1rem" }}>
        {error.message || "Unknown error"}
      </div>
      {error.digest && (
        <div
          style={{
            fontSize: "9px",
            color: "var(--muted)",
            marginBottom: "0.75rem",
          }}
        >
          DIGEST: {error.digest}
        </div>
      )}
      <pre
        style={{
          fontSize: "9px",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          color: "var(--muted)",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          padding: "0.75rem",
          borderRadius: "3px",
          marginBottom: "1rem",
          maxHeight: "60vh",
          overflow: "auto",
        }}
      >
        {error.stack ?? "No stack trace available"}
      </pre>
      <button
        onClick={reset}
        style={{
          fontFamily: "var(--mono)",
          fontSize: "10px",
          letterSpacing: "0.08em",
          background: "transparent",
          border: "1px solid var(--border)",
          color: "var(--accent)",
          padding: "4px 14px",
          cursor: "pointer",
        }}
      >
        RETRY
      </button>
    </div>
  );
}
