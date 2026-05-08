"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ProposalCard } from "./ProposalCard";

interface ProposalData {
  id?: string;
  title: string;
  risk: string;
  summary: string;
  scriptType: string;
  script: string;
}

interface Message {
  type: "user" | "specialist" | "tool" | "proposal" | "error";
  text: string;
  proposal?: ProposalData;
}

interface SpecialistPanelProps {
  open: boolean;
  onClose: () => void;
  alertId?: string;
  deviceId?: string;
  contextLabel?: string;
}

export function SpecialistPanel({ open, onClose, alertId, deviceId, contextLabel }: SpecialistPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    { type: "specialist", text: "[ SILENT EDGE SPECIALIST — ONLINE ]\n\nAegis, I\'m ready. Send an alert ID, paste indicators, or ask anything. Use !isolate <hostname> to request immediate isolation." },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = useCallback(async () => {
    const query = input.trim();
    if (!query || streaming) return;
    setInput("");
    setMessages((prev) => [...prev, { type: "user", text: query }]);
    setStreaming(true);

    // Add placeholder for streaming response
    const streamIdx = messages.length + 1;
    setMessages((prev) => [...prev, { type: "specialist", text: "" }]);

    try {
      const res = await fetch("/api/specialist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, alertId, deviceId }),
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const dec    = new TextDecoder();
      let buffer   = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += dec.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6)) as {
              text?: string;
              proposal?: ProposalData;
              done?: boolean;
              error?: string;
            };

            if (data.text) {
              setMessages((prev) => {
                const updated = [...prev];
                updated[streamIdx] = { type: "specialist", text: (updated[streamIdx]?.text ?? "") + data.text };
                return updated;
              });
            }

            if (data.proposal) {
              setMessages((prev) => [
                ...prev,
                { type: "proposal", text: "", proposal: data.proposal },
              ]);
            }

            if (data.error) {
              setMessages((prev) => [...prev, { type: "error", text: data.error! }]);
            }
          } catch {
            // malformed SSE line — skip
          }
        }
      }
    } catch (e) {
      setMessages((prev) => [...prev, { type: "error", text: `CONNECTION ERROR: ${String(e)}` }]);
    } finally {
      setStreaming(false);
    }
  }, [input, streaming, messages.length, alertId, deviceId]);

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 199,
          background: "rgba(5,6,7,0.6)",
        }}
      />

      {/* Panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: "clamp(340px, 38vw, 520px)",
        zIndex: 200,
        background: "var(--bg-2)",
        borderLeft: "1px solid var(--border)",
        display: "flex", flexDirection: "column",
        boxShadow: "-4px 0 40px rgba(0,0,0,0.6)",
      }}>
        {/* Header */}
        <div style={{
          borderBottom: "1px solid var(--border)",
          padding: "10px 14px",
          display: "flex", alignItems: "center", gap: 10,
          background: "var(--bg-3)", flexShrink: 0,
        }}>
          <span style={{ color: "var(--accent)", fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em" }}>
            ◢ SPECIALIST
          </span>
          {contextLabel && (
            <span style={{
              fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.08em",
              background: "var(--bg-2)", border: "1px solid var(--border)",
              color: "var(--muted)", padding: "2px 7px",
            }}>
              {contextLabel}
            </span>
          )}
          <button
            onClick={onClose}
            style={{
              marginLeft: "auto", background: "transparent", border: "none",
              color: "var(--muted)", fontSize: 16, cursor: "pointer", padding: "2px 6px",
              fontFamily: "var(--mono)",
            }}
          >
            ✕
          </button>
        </div>

        {/* Message log */}
        <div
          ref={scrollRef}
          style={{
            flex: 1, overflowY: "auto", padding: "12px 14px",
            display: "flex", flexDirection: "column", gap: 12,
          }}
        >
          {messages.map((msg, i) => (
            <div key={i}>
              {msg.type === "user" && (
                <div style={{ textAlign: "right" }}>
                  <span style={{
                    display: "inline-block",
                    background: "var(--bg-3)", border: "1px solid var(--border)",
                    fontFamily: "var(--mono)", fontSize: 11, color: "var(--fg)",
                    padding: "6px 10px", maxWidth: "85%", textAlign: "left",
                    whiteSpace: "pre-wrap", wordBreak: "break-word",
                  }}>
                    <span style={{ color: "var(--accent)", marginRight: 6 }}>AEGIS ▸</span>
                    {msg.text}
                  </span>
                </div>
              )}

              {msg.type === "specialist" && msg.text && (
                <div>
                  <pre style={{
                    fontFamily: "var(--mono)", fontSize: 11, lineHeight: 1.65,
                    color: "var(--fg)", whiteSpace: "pre-wrap", wordBreak: "break-word",
                    margin: 0, background: "transparent",
                  }}>
                    {msg.text}
                    {streaming && i === messages.length - 1 && (
                      <span style={{ color: "var(--accent)", animation: "blink 1s step-end infinite" }}>█</span>
                    )}
                  </pre>
                </div>
              )}

              {msg.type === "tool" && (
                <div style={{
                  background: "rgba(255,170,0,0.08)", border: "1px solid rgba(255,170,0,0.25)",
                  padding: "6px 10px", fontFamily: "var(--mono)", fontSize: 10,
                  color: "var(--sev-warn)", letterSpacing: "0.06em",
                }}>
                  {msg.text}
                </div>
              )}

              {msg.type === "proposal" && msg.proposal && (
                <ProposalCard proposal={msg.proposal} />
              )}

              {msg.type === "error" && (
                <div style={{
                  fontFamily: "var(--mono)", fontSize: 10, color: "var(--sev-crit)",
                  background: "rgba(255,34,34,0.08)", border: "1px solid rgba(255,34,34,0.2)",
                  padding: "6px 10px",
                }}>
                  {msg.text}
                </div>
              )}
            </div>
          ))}

          {streaming && messages[messages.length - 1]?.type !== "specialist" && (
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)" }}>
              ◌ SPECIALIST PROCESSING...
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{
          borderTop: "1px solid var(--border)",
          padding: "10px 14px",
          background: "var(--bg-3)", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--accent)", flexShrink: 0, paddingBottom: 4 }}>◢</span>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask the Specialist or type !isolate <hostname>..."
              disabled={streaming}
              rows={2}
              style={{
                flex: 1, background: "var(--bg-2)", border: "1px solid var(--border)",
                color: "var(--fg)", fontFamily: "var(--mono)", fontSize: 11,
                padding: "6px 8px", resize: "none", outline: "none",
                lineHeight: 1.5, borderRadius: 0,
              }}
            />
            <button
              onClick={send}
              disabled={streaming || !input.trim()}
              style={{
                background: streaming ? "var(--bg-3)" : "var(--accent)",
                color: streaming ? "var(--muted)" : "#001a10",
                border: "none", padding: "6px 12px",
                fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.08em",
                cursor: streaming ? "not-allowed" : "pointer",
                fontWeight: 700, flexShrink: 0, alignSelf: "stretch",
              }}
            >
              {streaming ? "..." : "SEND"}
            </button>
          </div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--muted)", marginTop: 4, letterSpacing: "0.04em" }}>
            Enter to send · Shift+Enter for newline · Audit-logged
          </div>
        </div>
      </div>
    </>
  );
}
