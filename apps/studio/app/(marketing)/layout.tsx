"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const NAV_LINKS = [
  { href: "/", label: "home" },
  { href: "/services", label: "services" },
  { href: "/silent-edge", label: "silent-edge" },
  { href: "/store", label: "store" },
  { href: "/news", label: "news" },
  { href: "/our-story", label: "our-story" },
  { href: "/contact", label: "contact" },
];

const ACCENTS = [
  { name: "Brand blue",   v: "#3d7eff" },
  { name: "Ice",          v: "#5aa9ff" },
  { name: "Signal green", v: "#00e28a" },
  { name: "Alert red",    v: "#ff5155" },
  { name: "Bone",         v: "#e8e8e8" },
];

function useClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toTimeString().slice(0, 8));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function MarketingHeader() {
  const pathname = usePathname();
  const clock = useClock();
  const [accent, setAccent] = useState("#3d7eff");

  useEffect(() => {
    const stored = localStorage.getItem("se-accent");
    if (stored) setAccent(stored);
  }, []);

  const applyAccent = (v: string) => {
    setAccent(v);
    localStorage.setItem("se-accent", v);
    document.documentElement.style.setProperty("--accent", v);
  };

  useEffect(() => {
    document.documentElement.style.setProperty("--accent", accent);
  }, [accent]);

  const border = "rgba(244,246,245,0.08)";
  const muted = "rgba(244,246,245,0.5)";

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 100, background: "#050607" }}>
      {/* SOC command bar */}
      <div style={{
        fontFamily: "var(--mono)", fontSize: 10.5, letterSpacing: 1.5,
        borderBottom: `1px solid ${border}`, padding: "8px 48px",
        display: "flex", gap: 24, color: muted, background: "#0a0c0e",
        alignItems: "center", flexWrap: "wrap",
      }}>
        <span>
          <span style={{ color: accent, marginRight: 6 }}>●</span>
          SOC_STATUS <span style={{ color: "var(--fg)" }}>GREEN</span>
        </span>
        <span>UPTIME <span style={{ color: "var(--fg)" }}>99.998%</span></span>
        <span>MTTR <span style={{ color: "var(--fg)" }}>00:04:12</span></span>
        <span>EVENTS/DAY <span style={{ color: "var(--fg)" }}>14.2M</span></span>
        <span style={{ marginLeft: "auto" }}>CAPE_TOWN · UTC+2</span>
        <span>◐ {clock}</span>
        <span style={{
          display: "flex", alignItems: "center", gap: 6,
          paddingLeft: 16, borderLeft: `1px solid ${border}`, marginLeft: 4,
        }}>
          <span style={{ color: muted, marginRight: 4 }}>THEME</span>
          {ACCENTS.map((o) => (
            <button key={o.v} onClick={() => applyAccent(o.v)} title={o.name} style={{
              width: 14, height: 14, borderRadius: 2, padding: 0, cursor: "pointer",
              background: o.v,
              border: o.v.toLowerCase() === accent.toLowerCase()
                ? "1.5px solid var(--fg)"
                : "1.5px solid transparent",
              boxShadow: o.v.toLowerCase() === accent.toLowerCase()
                ? `0 0 10px ${o.v}88`
                : "none",
            }} />
          ))}
        </span>
      </div>

      {/* CLI nav */}
      <div style={{
        padding: "16px 48px", display: "flex", alignItems: "center",
        gap: 32, borderBottom: `1px solid ${border}`, background: "#050607",
      }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 4, overflow: "hidden",
            border: `1px solid ${border}`, background: "#000", flexShrink: 0,
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/shel-logo.jpg" alt="SHEL infosec" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, letterSpacing: 2, color: "var(--fg)" }}>
            SHEL<span style={{ color: muted }}>/infosec</span>
          </div>
        </Link>

        {/* Nav links */}
        <nav style={{ display: "flex", gap: 2, fontFamily: "var(--mono)", fontSize: 11, letterSpacing: 1, marginLeft: 12 }}>
          {NAV_LINKS.map((n) => {
            const active = pathname === n.href;
            return (
              <Link key={n.href} href={n.href} style={{
                color: active ? "var(--fg)" : muted,
                textDecoration: "none",
                padding: "6px 10px", borderRadius: 2,
                background: active ? "rgba(255,255,255,0.04)" : "transparent",
              }}>
                {n.label}
              </Link>
            );
          })}
        </nav>

        {/* CTAs */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 10, flexShrink: 0 }}>
          <Link href="/login" style={{
            fontFamily: "var(--mono)", fontSize: 11, background: "transparent",
            color: muted, border: `1px solid ${border}`, padding: "8px 14px",
            textDecoration: "none", display: "inline-block",
          }}>
            ./login
          </Link>
          <Link href="/contact" style={{
            fontFamily: "var(--mono)", fontSize: 11, letterSpacing: 1.5, fontWeight: 700,
            background: accent, color: "#001a10", border: "none",
            padding: "8px 16px", textDecoration: "none", display: "inline-block",
            boxShadow: `0 0 24px ${accent}44`,
          }}>
            ./get-protection ◢
          </Link>
        </div>
      </div>
    </header>
  );
}

function MarketingFooter() {
  const border = "rgba(244,246,245,0.08)";
  const muted = "rgba(244,246,245,0.5)";

  return (
    <footer style={{ borderTop: `1px solid ${border}`, padding: "40px 48px 28px", background: "#0a0c0e", color: "var(--fg)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 32, paddingBottom: 32 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 4, overflow: "hidden", border: `1px solid ${border}`, background: "#000" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/shel-logo.jpg" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: 1.5, color: "var(--accent)" }}>SHEL / INFOSEC</div>
          </div>
          <div style={{ fontSize: 13, color: muted, lineHeight: 1.6, maxWidth: 280 }}>
            Managed cybersecurity services. Cape Town · operating globally.
          </div>
        </div>

        <div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: 1.5, color: muted, marginBottom: 10 }}>CONTACT</div>
          <div style={{ fontSize: 13, lineHeight: 1.8 }}>accounts@shelinfosec.com</div>
          <div style={{ fontSize: 13, lineHeight: 1.8 }}>+27 77 416 7672</div>
        </div>

        <div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: 1.5, color: muted, marginBottom: 10 }}>ADDRESS</div>
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>
            80 Chapman Ave<br />Mountainside, Cape Town<br />South Africa 7151
          </div>
        </div>

        <div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: 1.5, color: muted, marginBottom: 10 }}>LINKS</div>
          {[
            { href: "/privacy-policy", label: "Privacy Policy" },
            { href: "/terms", label: "Terms of Service" },
            { href: "/store", label: "Refunds" },
            { href: "/login", label: "SOC Console" },
          ].map((l) => (
            <div key={l.href} style={{ fontSize: 13, lineHeight: 1.8 }}>
              <Link href={l.href} style={{ color: muted, textDecoration: "none" }}>{l.label}</Link>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        borderTop: `1px solid ${border}`, paddingTop: 18,
        display: "flex", justifyContent: "space-between",
        fontSize: 11, fontFamily: "var(--mono)", color: muted, letterSpacing: 0.5,
      }}>
        <span>© 2026 SHEL INFOSEC — ALL RIGHTS RESERVED</span>
        <span>Silent Edge Platform · build {new Date().toISOString().slice(0, 10)}</span>
      </div>
    </footer>
  );
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <MarketingHeader />
      <main style={{ flex: 1 }}>{children}</main>
      <MarketingFooter />
    </div>
  );
}
