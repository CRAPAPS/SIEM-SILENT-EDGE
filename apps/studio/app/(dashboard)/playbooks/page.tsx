"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

type Playbook = {
  id: string;
  name: string;
  incident_type: string;
  trigger_tags: string[];
  steps: { order: number; title: string; description: string; action?: string }[];
  is_active: boolean;
  version: number;
  created_by: string | null;
};

export default function PlaybooksPage() {
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Playbook | null>(null);
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    supabase
      .from("playbooks")
      .select("id,name,incident_type,trigger_tags,steps,is_active,version,created_by")
      .order("incident_type")
      .then(({ data }) => {
        setPlaybooks(data ?? []);
        setLoading(false);
      });
  }, []);

  const DEMO_STEPS: { order: number; title: string; description: string; action?: string }[] = [
    { order: 1, title: "TRIAGE", description: "Confirm alert is not a false positive. Check source, host context, and indicator reputation." },
    { order: 2, title: "CONTAIN", description: "Isolate the affected host via SentinelOne disconnect or network segmentation.", action: "!isolate [hostname]" },
    { order: 3, title: "INVESTIGATE", description: "Pull process tree, network connections, and file activity from EDR. Map to MITRE ATT&CK." },
    { order: 4, title: "ERADICATE", description: "Remove malicious artifacts. Patch exploited vulnerability. Rotate compromised credentials." },
    { order: 5, title: "RECOVER", description: "Restore host from clean backup. Re-enable network connectivity. Monitor for 24h." },
    { order: 6, title: "DOCUMENT", description: "Update alert status to resolved. File incident report. Update threat intel." },
  ];

  const displaySteps = selected?.steps?.length ? selected.steps : DEMO_STEPS;

  return (
    <div style={{ display: "flex", height: "calc(100vh - 40px - 2rem)", gap: "1rem", overflow: "hidden" }}>
      {/* Left: Playbook List */}
      <div style={{ width: 320, flexShrink: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ marginBottom: "1rem" }}>
          <h1 style={{ fontFamily: "var(--mono)", fontSize: "20px", fontWeight: 700, color: "var(--fg)", margin: 0 }}>
            PLAYBOOKS
          </h1>
          <p style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)", margin: "2px 0 0", letterSpacing: "0.06em" }}>
            INCIDENT RESPONSE RUNBOOKS
          </p>
        </div>

        <div className="terminal-card" style={{ flex: 1, overflow: "auto" }}>
          {loading ? (
            <div style={{ padding: "1.5rem", fontFamily: "var(--mono)", fontSize: "11px", color: "var(--muted)", textAlign: "center" }}>
              LOADING...
            </div>
          ) : playbooks.length === 0 ? (
            <div style={{ padding: "1.5rem" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)", marginBottom: "1rem" }}>
                NO PLAYBOOKS CREATED YET
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--muted)", lineHeight: 1.6, opacity: 0.6 }}>
                Create incident response runbooks to guide analysts through standard procedures.
              </div>
              {/* Show a demo skeleton */}
              {["RANSOMWARE RESPONSE", "PHISHING INVESTIGATION", "BRUTE FORCE LOCKDOWN", "DATA EXFILTRATION", "INSIDER THREAT"].map((name) => (
                <div
                  key={name}
                  onClick={() => setSelected({
                    id: name, name, incident_type: name.split(" ")[0].toLowerCase(),
                    trigger_tags: [], steps: [], is_active: true, version: 1, created_by: null
                  })}
                  style={{
                    padding: "0.75rem",
                    marginTop: "0.5rem",
                    background: selected?.id === name ? "var(--bg-3)" : "var(--bg-2)",
                    borderLeft: `2px solid ${selected?.id === name ? "var(--accent)" : "var(--border)"}`,
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontFamily: "var(--mono)", fontSize: "10px", fontWeight: 600, color: "var(--fg)" }}>{name}</div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "8px", color: "var(--muted)", marginTop: 2, letterSpacing: "0.06em" }}>
                    6 STEPS · ACTIVE
                  </div>
                </div>
              ))}
            </div>
          ) : (
            playbooks.map((pb) => (
              <div
                key={pb.id}
                onClick={() => { setSelected(pb); setActiveStep(null); }}
                style={{
                  padding: "0.75rem 1rem",
                  borderBottom: "1px solid var(--border)",
                  background: selected?.id === pb.id ? "var(--bg-3)" : undefined,
                  borderLeft: `2px solid ${selected?.id === pb.id ? "var(--accent)" : "transparent"}`,
                  cursor: "pointer",
                }}
              >
                <div style={{ fontFamily: "var(--mono)", fontSize: "11px", fontWeight: 600, color: "var(--fg)" }}>
                  {pb.name}
                </div>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: 4, alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "8px", color: "var(--muted)", letterSpacing: "0.06em" }}>
                    {pb.incident_type.toUpperCase()} · v{pb.version} · {pb.steps?.length ?? 0} STEPS
                  </span>
                  <span style={{
                    fontFamily: "var(--mono)", fontSize: "8px", letterSpacing: "0.06em",
                    color: pb.is_active ? "var(--sev-ok)" : "var(--muted)",
                  }}>
                    {pb.is_active ? "● ACTIVE" : "○ INACTIVE"}
                  </span>
                </div>
                {pb.trigger_tags?.length > 0 && (
                  <div style={{ marginTop: 4, display: "flex", gap: 3, flexWrap: "wrap" }}>
                    {pb.trigger_tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontFamily: "var(--mono)", fontSize: "7px", letterSpacing: "0.08em",
                          padding: "1px 4px", border: "1px solid var(--border)",
                          color: "var(--muted)", borderRadius: "1px",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right: Playbook Steps */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {selected ? (
          <>
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: "16px", fontWeight: 700, color: "var(--fg)" }}>
                {selected.name}
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--muted)", marginTop: 2, letterSpacing: "0.06em" }}>
                {selected.incident_type.toUpperCase()} · v{selected.version}
                {activeStep !== null && (
                  <span style={{ color: "var(--accent)", marginLeft: "1rem" }}>
                    STEP {activeStep + 1} / {displaySteps.length} ACTIVE
                  </span>
                )}
              </div>
            </div>

            <div className="terminal-card" style={{ flex: 1, overflow: "auto", padding: "1.25rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {displaySteps.map((step, i) => {
                  const isActive = activeStep === i;
                  const isDone = activeStep !== null && i < activeStep;
                  return (
                    <div
                      key={i}
                      onClick={() => setActiveStep(isActive ? null : i)}
                      style={{
                        display: "flex", gap: "1rem", cursor: "pointer",
                        padding: "0.875rem",
                        background: isActive ? "var(--bg-3)" : "var(--bg-2)",
                        border: `1px solid ${isActive ? "var(--accent)" : isDone ? "rgba(0,226,138,0.3)" : "var(--border)"}`,
                        borderRadius: "2px",
                        transition: "border-color 0.15s",
                      }}
                    >
                      {/* Step number */}
                      <div
                        style={{
                          width: 28, height: 28, borderRadius: "2px",
                          background: isActive ? "var(--accent)" : isDone ? "rgba(0,226,138,0.15)" : "var(--bg-3)",
                          border: `1px solid ${isActive ? "var(--accent)" : isDone ? "var(--sev-ok)" : "var(--border)"}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontFamily: "var(--mono)", fontSize: "11px", fontWeight: 700,
                          color: isActive ? "#fff" : isDone ? "var(--sev-ok)" : "var(--muted)",
                          flexShrink: 0,
                        }}
                      >
                        {isDone ? "✓" : step.order}
                      </div>
                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "var(--mono)", fontSize: "11px", fontWeight: 700, color: isActive ? "var(--fg)" : "var(--muted)", letterSpacing: "0.04em" }}>
                          {step.title}
                        </div>
                        {(isActive || !activeStep) && (
                          <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)", marginTop: 4, lineHeight: 1.6 }}>
                            {step.description}
                          </div>
                        )}
                        {step.action && isActive && (
                          <div style={{
                            marginTop: "0.5rem", fontFamily: "var(--mono)", fontSize: "9px",
                            color: "var(--sev-warn)", letterSpacing: "0.06em",
                            padding: "3px 6px", border: "1px solid rgba(255,170,0,0.3)", display: "inline-block",
                          }}>
                            ◢ {step.action}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Navigation */}
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
                {activeStep === null ? (
                  <button
                    onClick={() => setActiveStep(0)}
                    style={{
                      fontFamily: "var(--mono)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em",
                      padding: "8px 20px", border: "none", background: "var(--accent)", color: "#fff",
                      cursor: "pointer", borderRadius: "2px",
                    }}
                  >
                    ◢ BEGIN RESPONSE
                  </button>
                ) : (
                  <>
                    {activeStep > 0 && (
                      <button
                        onClick={() => setActiveStep((s) => (s ?? 1) - 1)}
                        style={{
                          fontFamily: "var(--mono)", fontSize: "10px", letterSpacing: "0.06em",
                          padding: "6px 16px", border: "1px solid var(--border)", background: "var(--bg-2)",
                          color: "var(--muted)", cursor: "pointer", borderRadius: "2px",
                        }}
                      >
                        ← PREV
                      </button>
                    )}
                    {activeStep < displaySteps.length - 1 ? (
                      <button
                        onClick={() => setActiveStep((s) => (s ?? 0) + 1)}
                        style={{
                          fontFamily: "var(--mono)", fontSize: "10px", letterSpacing: "0.06em",
                          padding: "6px 16px", border: "none", background: "var(--accent)", color: "#fff",
                          cursor: "pointer", borderRadius: "2px",
                        }}
                      >
                        NEXT STEP →
                      </button>
                    ) : (
                      <button
                        onClick={() => setActiveStep(null)}
                        style={{
                          fontFamily: "var(--mono)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em",
                          padding: "6px 16px", border: "none", background: "var(--sev-ok)", color: "#000",
                          cursor: "pointer", borderRadius: "2px",
                        }}
                      >
                        ✓ MARK COMPLETE
                      </button>
                    )}
                    <button
                      onClick={() => setActiveStep(null)}
                      style={{
                        fontFamily: "var(--mono)", fontSize: "10px", letterSpacing: "0.06em",
                        padding: "6px 12px", border: "1px solid var(--border)", background: "var(--bg-2)",
                        color: "var(--muted)", cursor: "pointer", borderRadius: "2px", marginLeft: "auto",
                      }}
                    >
                      RESET
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="terminal-card" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: "32px", color: "var(--border)", marginBottom: "1rem" }}>◈</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--muted)" }}>
                SELECT A PLAYBOOK TO VIEW STEPS
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
