"use client";

import { useState } from "react";
import type { Metadata } from "next";

const SERVICES = [
  "SIEM Incident Response",
  "Security as a Service",
  "Network Security",
  "Threat Intelligence",
  "Silent Edge Deployment",
  "Threat Assessment (free)",
  "Other",
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", service: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    await new Promise((r) => setTimeout(r, 800));
    setSending(false);
    setSent(true);
  }

  return (
    <>
      {/* Header */}
      <section style={{ padding: "5rem 2rem 3rem", maxWidth: 1280, margin: "0 auto" }}>
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: "9px",
            letterSpacing: "0.15em",
            color: "var(--accent)",
            textTransform: "uppercase",
            marginBottom: "0.75rem",
          }}
        >
          [ CONTACT ]
        </div>
        <h1
          style={{
            fontFamily: "var(--mono)",
            fontSize: "clamp(1.75rem, 4vw, 3rem)",
            fontWeight: 800,
            color: "var(--fg)",
            margin: "0 0 0.75rem",
            letterSpacing: "-0.02em",
          }}
        >
          Talk to an operator.
        </h1>
        <p
          style={{
            fontFamily: "var(--mono)",
            fontSize: "12px",
            color: "var(--muted)",
            lineHeight: 1.8,
            margin: 0,
          }}
        >
          No sales team. The person who reads this message is the person who will work your account.
        </p>
      </section>

      <section
        style={{
          padding: "0 2rem 6rem",
          maxWidth: 1280,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 420px",
          gap: "4rem",
          alignItems: "start",
        }}
      >
        {/* Form */}
        {sent ? (
          <div className="terminal-card">
            <div className="terminal-card-header">
              <span className="dot" />
              <span>message.sent</span>
            </div>
            <div className="terminal-card-body" style={{ padding: "2.5rem 1.5rem" }}>
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: "11px",
                  color: "var(--sev-ok)",
                  marginBottom: "1rem",
                }}
              >
                ✓ MESSAGE RECEIVED
              </div>
              <p
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: "12px",
                  color: "var(--muted)",
                  lineHeight: 1.8,
                  margin: 0,
                }}
              >
                An operator will respond within 4 business hours. For active incidents, call{" "}
                <span style={{ color: "var(--fg)" }}>+27 77 416 7672</span> directly.
              </p>
            </div>
          </div>
        ) : (
          <div className="terminal-card">
            <div className="terminal-card-header">
              <span className="dot" />
              <span>contact.form ~ % ./send-message</span>
            </div>
            <div className="terminal-card-body">
              <form
                onSubmit={handleSubmit}
                style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  {[
                    { id: "name", label: "Full Name", type: "text", placeholder: "John Doe" },
                    { id: "company", label: "Company", type: "text", placeholder: "Acme Corp" },
                  ].map((f) => (
                    <div key={f.id}>
                      <label
                        htmlFor={f.id}
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
                        {f.label}
                      </label>
                      <input
                        id={f.id}
                        type={f.type}
                        required
                        placeholder={f.placeholder}
                        value={form[f.id as keyof typeof form]}
                        onChange={(e) => setForm((p) => ({ ...p, [f.id]: e.target.value }))}
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
                          boxSizing: "border-box",
                        }}
                        onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                        onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                      />
                    </div>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  {[
                    { id: "email", label: "Email", type: "email", placeholder: "you@company.com" },
                    { id: "phone", label: "Phone (optional)", type: "tel", placeholder: "+1 555 000 0000" },
                  ].map((f) => (
                    <div key={f.id}>
                      <label
                        htmlFor={f.id}
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
                        {f.label}
                      </label>
                      <input
                        id={f.id}
                        type={f.type}
                        required={f.id === "email"}
                        placeholder={f.placeholder}
                        value={form[f.id as keyof typeof form]}
                        onChange={(e) => setForm((p) => ({ ...p, [f.id]: e.target.value }))}
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
                          boxSizing: "border-box",
                        }}
                        onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                        onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label
                    htmlFor="service"
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
                    Service Interest
                  </label>
                  <select
                    id="service"
                    value={form.service}
                    onChange={(e) => setForm((p) => ({ ...p, service: e.target.value }))}
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
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                  >
                    <option value="">Select a service...</option>
                    {SERVICES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="message"
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
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    required
                    placeholder="Describe your environment and what you need covered..."
                    value={form.message}
                    onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
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
                      resize: "vertical",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="btn btn-accent"
                  style={{ justifyContent: "center" }}
                >
                  {sending ? "TRANSMITTING..." : "./send-message --secure ◢"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Contact details sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="terminal-card">
            <div className="terminal-card-header">
              <span className="dot" />
              <span>contact.details</span>
            </div>
            <div className="terminal-card-body" style={{ lineHeight: 2.2 }}>
              {[
                { label: "Email", value: "accounts@shelinfosec.com", color: "var(--accent)" },
                { label: "Phone", value: "+27 77 416 7672", color: "var(--fg)" },
                { label: "City", value: "Cape Town, South Africa", color: "var(--muted)" },
                { label: "Address", value: "80 Chapman Ave, Mountainside", color: "var(--muted)" },
              ].map((c) => (
                <div key={c.label} style={{ fontFamily: "var(--mono)", fontSize: "10px" }}>
                  <div style={{ color: "var(--muted)", fontSize: "9px", letterSpacing: "0.08em", textTransform: "uppercase" }}>{c.label}</div>
                  <div style={{ color: c.color }}>{c.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="terminal-card">
            <div className="terminal-card-header">
              <span className="dot" />
              <span>response.sla</span>
            </div>
            <div className="terminal-card-body">
              {[
                { label: "General enquiry", sla: "< 4 business hours" },
                { label: "Active incident", sla: "Immediate — call direct" },
                { label: "Threat assessment", sla: "Booked within 48h" },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: "10px",
                    borderBottom: "1px solid var(--border)",
                    padding: "0.5rem 0",
                  }}
                >
                  <div style={{ color: "var(--muted)", marginBottom: "0.125rem" }}>{s.label}</div>
                  <div style={{ color: "var(--sev-ok)" }}>{s.sla}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
