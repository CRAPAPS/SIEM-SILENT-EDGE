"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { AccentProvider, ACCENTS, useAccent } from "./accent";

function SiteLogo({ size = 40 }: { size?: number }) {
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <div className="site-logo-ring-outer" />
      <div className="site-logo-ring-inner" />
      <span className="site-logo-corner site-logo-corner-tl" />
      <span className="site-logo-corner site-logo-corner-tr" />
      <span className="site-logo-corner site-logo-corner-bl" />
      <span className="site-logo-corner site-logo-corner-br" />
      <div className="site-logo-img">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/shel-logo.jpg" alt="SHEL infosec" />
      </div>
    </div>
  );
}

const NAV_LINKS = [
  { href: "/",           label: "home" },
  { href: "/services",   label: "services" },
  { href: "/silent-edge",label: "silent-edge" },
  { href: "/store",      label: "store" },
  { href: "/news",       label: "news" },
  { href: "/our-story",  label: "our-story" },
  { href: "/contact",    label: "contact" },
];

function useClock() {
  const [t, setT] = useState("");
  useEffect(() => {
    const tick = () => setT(new Date().toTimeString().slice(0, 8));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

function MarketingHeader() {
  const pathname = usePathname();
  const clock = useClock();
  const { accent, setAccent } = useAccent();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const bdr = "rgba(244,246,245,0.08)";
  const muted = "rgba(244,246,245,0.5)";

  return (
    <>
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "#050607" }}>
        {/* ── SOC command bar ── */}
        <div style={{
          fontFamily: "var(--mono)", fontSize: "10.5px", letterSpacing: "1.5px",
          borderBottom: `1px solid ${bdr}`, padding: "8px clamp(20px, 5vw, 48px)",
          display: "flex", gap: "clamp(12px, 2vw, 24px)", color: muted, background: "#0a0c0e",
          alignItems: "center", overflowX: "hidden",
        }}>
          {/* SOC metrics — hidden on mobile, only swatches remain */}
          <span className="soc-hide-mobile" style={{ flexShrink: 0 }}>
            <span style={{ color: "var(--accent)", marginRight: 6 }}>●</span>
            SOC_STATUS <span style={{ color: "var(--fg)" }}>GREEN</span>
          </span>
          <span className="soc-hide-tablet" style={{ flexShrink: 0 }}>UPTIME <span style={{ color: "var(--fg)" }}>99.998%</span></span>
          <span className="soc-hide-tablet" style={{ flexShrink: 0 }}>MTTR <span style={{ color: "var(--fg)" }}>00:04:12</span></span>
          <span className="soc-hide-mobile" style={{ flexShrink: 0 }}>EVENTS/DAY <span style={{ color: "var(--fg)" }}>14.2M</span></span>
          <span className="soc-hide-tablet" style={{ marginLeft: "auto", flexShrink: 0 }}>CAPE_TOWN · UTC+2</span>
          <span className="soc-hide-mobile" style={{ flexShrink: 0 }}>◐ {clock}</span>
          {/* Accent swatches — always visible, push right on mobile via CSS */}
          <span className="soc-swatches" style={{
            display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
            paddingLeft: 16, borderLeft: `1px solid ${bdr}`,
          }}>
            <span style={{ color: muted, marginRight: 4, fontSize: "10px" }}>THEME</span>
            {ACCENTS.map((o) => (
              <button key={o.v} onClick={() => setAccent(o.v)} title={o.name} style={{
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

        {/* ── CLI nav ── */}
        <nav style={{
          padding: "14px clamp(20px, 5vw, 48px)", display: "flex", alignItems: "center", gap: "clamp(12px, 2vw, 24px)",
          borderBottom: `1px solid ${bdr}`,
        }}>
          {/* Logo */}
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
            <SiteLogo size={40} />
            <div style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, letterSpacing: 2, color: "var(--fg)" }}>
              SHEL<span style={{ color: muted }}>/infosec</span>
            </div>
          </Link>

          {/* Desktop nav links */}
          <div className="nav-links" style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: 1, marginLeft: 8 }}>
            {NAV_LINKS.map((n) => {
              const active = pathname === n.href;
              return (
                <Link key={n.href} href={n.href} style={{
                  color: active ? "var(--fg)" : muted, textDecoration: "none",
                  padding: "6px 10px", borderRadius: 2,
                  background: active ? "rgba(255,255,255,0.04)" : "transparent",
                  whiteSpace: "nowrap",
                }}>
                  {n.label}
                </Link>
              );
            })}
          </div>

          {/* Desktop CTAs */}
          <div className="nav-ctas" style={{ marginLeft: "auto" }}>
            <Link href="/login" className="nav-login" style={{
              fontFamily: "var(--mono)", fontSize: 11,
              background: "transparent", color: muted,
              border: `1px solid ${bdr}`, padding: "8px 14px",
              textDecoration: "none", whiteSpace: "nowrap",
            }}>
              ./login
            </Link>
            <Link href="/contact" style={{
              fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "1.5px", fontWeight: 700,
              background: "var(--accent)", color: "#001a10",
              padding: "8px 16px", textDecoration: "none",
              whiteSpace: "nowrap", boxShadow: "0 0 24px var(--a44)",
            }}>
              ./get-protection ◢
            </Link>
          </div>

          {/* Hamburger (mobile only) */}
          <button className="nav-hamburger" onClick={() => setMenuOpen(!menuOpen)} style={{
            background: "transparent", border: `1px solid ${bdr}`,
            color: "var(--fg)", padding: "8px 12px", cursor: "pointer",
            fontFamily: "var(--mono)", fontSize: 13, flexShrink: 0,
          }}>
            {menuOpen ? "✕" : "☰"}
          </button>
        </nav>
      </header>

      {/* ── Mobile menu overlay ── */}
      <div className={`mobile-menu${menuOpen ? " open" : ""}`}>
        {/* Top row: logo + close */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <SiteLogo size={48} />
            <div style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, letterSpacing: 2, color: "var(--fg)" }}>
              SHEL<span style={{ color: "var(--accent)" }}>/infosec</span>
            </div>
          </div>
          <button onClick={() => setMenuOpen(false)} style={{
            background: "transparent", border: "none", color: "var(--fg)",
            fontSize: 22, cursor: "pointer", padding: 4,
          }}>✕</button>
        </div>

        {/* Nav links */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          {NAV_LINKS.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setMenuOpen(false)} style={{
              fontFamily: "var(--mono)", fontSize: 24, fontWeight: 700,
              color: pathname === n.href ? "var(--accent)" : "var(--fg)",
              textDecoration: "none", padding: "12px 0",
              borderBottom: "1px solid rgba(244,246,245,0.06)",
              letterSpacing: 1,
            }}>
              {n.label}
            </Link>
          ))}
        </nav>

        {/* Mobile CTAs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 40 }}>
          <Link href="/contact" onClick={() => setMenuOpen(false)} style={{
            fontFamily: "var(--mono)", fontSize: 14, fontWeight: 700, letterSpacing: "1.5px",
            background: "var(--accent)", color: "#001a10",
            padding: "16px 24px", textDecoration: "none", textAlign: "center",
          }}>
            ./get-protection ◢
          </Link>
          <Link href="/login" onClick={() => setMenuOpen(false)} style={{
            fontFamily: "var(--mono)", fontSize: 13, color: "var(--muted)",
            border: "1px solid rgba(244,246,245,0.08)", padding: "14px 24px",
            textDecoration: "none", textAlign: "center",
          }}>
            ./login
          </Link>
        </div>

        {/* Accent swatches in mobile menu */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 32, paddingTop: 20, borderTop: "1px solid rgba(244,246,245,0.08)" }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "1.5px" }}>THEME</span>
          {ACCENTS.map((o) => (
            <button key={o.v} onClick={() => { setAccent(o.v); }} title={o.name} style={{
              width: 28, height: 28, borderRadius: 4, padding: 0, cursor: "pointer",
              background: o.v,
              border: o.v.toLowerCase() === accent.toLowerCase()
                ? "2px solid var(--fg)"
                : "2px solid transparent",
            }} />
          ))}
        </div>
      </div>
    </>
  );
}

function MarketingFooter() {
  return (
    <footer style={{ borderTop: "1px solid var(--border)", background: "var(--bg-2)", color: "var(--fg)" }}>
      <div className="mkt-pad" style={{ paddingTop: 40, paddingBottom: 28 }}>
        <div className="mkt-footer-grid">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <SiteLogo size={44} />
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "1.5px", color: "var(--accent)" }}>SHEL / INFOSEC</div>
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, maxWidth: 280 }}>
              Managed cybersecurity services.<br />Cape Town · operating globally.
            </div>
          </div>

          <div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "1.5px", color: "var(--muted)", marginBottom: 10 }}>CONTACT</div>
            <div style={{ fontSize: 13, lineHeight: 1.8 }}>accounts@shelinfosec.com</div>
            <div style={{ fontSize: 13, lineHeight: 1.8 }}>+27 77 416 7672</div>
          </div>

          <div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "1.5px", color: "var(--muted)", marginBottom: 10 }}>ADDRESS</div>
            <div style={{ fontSize: 13, lineHeight: 1.6 }}>80 Chapman Ave<br />Mountainside, Cape Town<br />South Africa 7151</div>
          </div>

          <div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "1.5px", color: "var(--muted)", marginBottom: 10 }}>LINKS</div>
            {[
              { href: "/services",      label: "Services" },
              { href: "/silent-edge",   label: "Silent Edge" },
              { href: "/store",         label: "Store" },
              { href: "/privacy-policy",label: "Privacy Policy" },
              { href: "/terms",         label: "Terms of Service" },
            ].map((l) => (
              <div key={l.href} style={{ fontSize: 13, lineHeight: 1.8 }}>
                <Link href={l.href} style={{ color: "var(--muted)", textDecoration: "none" }}>{l.label}</Link>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          borderTop: "1px solid var(--border)", paddingTop: 18,
          display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8,
          fontSize: 11, fontFamily: "var(--mono)", color: "var(--muted)", letterSpacing: "0.5px",
        }}>
          <span>© 2026 SHEL INFOSEC — ALL RIGHTS RESERVED</span>
          <span>Silent Edge Platform · v4.2.1</span>
        </div>
      </div>
    </footer>
  );
}

function Inner({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <MarketingHeader />
      <main style={{ flex: 1 }}>{children}</main>
      <MarketingFooter />
    </div>
  );
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <AccentProvider>
      <Inner>{children}</Inner>
    </AccentProvider>
  );
}
