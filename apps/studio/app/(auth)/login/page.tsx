"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      const next = searchParams.get("next") ?? "/dashboard";
      router.push(next);
      router.refresh();
    });
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        padding: "1rem",
      }}
    >
      <div className="terminal-card" style={{ width: "100%", maxWidth: "400px" }}>
        <div className="terminal-card-header">
          <span className="dot" />
          <span>analyst@soc-01 ~ % ./authenticate</span>
        </div>

        <div className="terminal-card-body">
          <div
            style={{
              marginBottom: "1.5rem",
              fontFamily: "var(--mono)",
              fontSize: "11px",
              color: "var(--muted)",
              lineHeight: 1.7,
            }}
          >
            <span style={{ color: "var(--sev-ok)" }}>●</span> SOC_STATUS OPERATIONAL
            <br />
            <span style={{ color: "var(--muted)" }}>
              CLEARANCE REQUIRED — IDENTIFY YOURSELF
            </span>
          </div>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label
                htmlFor="email"
                style={{
                  display: "block",
                  fontFamily: "var(--mono)",
                  fontSize: "9px",
                  letterSpacing: "0.1em",
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  marginBottom: "0.375rem",
                }}
              >
                Operator ID (email)
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={{
                  width: "100%",
                  background: "var(--bg-3)",
                  border: "1px solid var(--border)",
                  borderRadius: "2px",
                  padding: "0.5rem 0.75rem",
                  fontFamily: "var(--mono)",
                  fontSize: "12px",
                  color: "var(--fg)",
                  outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                style={{
                  display: "block",
                  fontFamily: "var(--mono)",
                  fontSize: "9px",
                  letterSpacing: "0.1em",
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  marginBottom: "0.375rem",
                }}
              >
                Auth Token (password)
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{
                  width: "100%",
                  background: "var(--bg-3)",
                  border: "1px solid var(--border)",
                  borderRadius: "2px",
                  padding: "0.5rem 0.75rem",
                  fontFamily: "var(--mono)",
                  fontSize: "12px",
                  color: "var(--fg)",
                  outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>

            {error && (
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: "11px",
                  color: "var(--sev-alert)",
                  padding: "0.5rem 0.75rem",
                  background: "rgba(255, 81, 85, 0.08)",
                  border: "1px solid rgba(255, 81, 85, 0.2)",
                  borderRadius: "2px",
                }}
              >
                ✗ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="btn btn-accent"
              style={{ justifyContent: "center", marginTop: "0.5rem" }}
            >
              {isPending ? "AUTHENTICATING..." : "./login --secure ◢"}
            </button>
          </form>

          <div
            style={{
              marginTop: "1.5rem",
              fontFamily: "var(--mono)",
              fontSize: "11px",
              color: "rgba(244, 246, 245, 0.2)",
            }}
          >
            root@shel ~ %{" "}
            <span className="animate-blink" style={{ color: "var(--accent)" }}>
              ▋
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: "1.5rem",
          fontFamily: "var(--mono)",
          fontSize: "9px",
          letterSpacing: "0.08em",
          color: "rgba(244, 246, 245, 0.15)",
          textAlign: "center",
        }}
      >
        SHEL INFOSEC · SILENT EDGE PLATFORM · AUTHORIZED ACCESS ONLY
      </div>
    </main>
  );
}
