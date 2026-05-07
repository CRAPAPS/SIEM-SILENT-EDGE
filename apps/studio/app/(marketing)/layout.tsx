"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/silent-edge", label: "Silent Edge" },
  { href: "/store", label: "Store" },
  { href: "/news", label: "News" },
  { href: "/our-story", label: "Our Story" },
  { href: "/contact", label: "Contact" },
];

function MarketingNav() {
  const pathname = usePathname();

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: "rgba(5,6,7,0.92)",
        borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 2rem",
          height: 56,
          display: "flex",
          alignItems: "center",
          gap: "2.5rem",
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none", flexShrink: 0 }}>
          <span
            style={{
              fontFamily: "var(--mono)",
              fontSize: "13px",
              fontWeight: 700,
              color: "var(--fg)",
              letterSpacing: "0.04em",
            }}
          >
            SHEL<span style={{ color: "var(--accent)" }}>/</span>infosec
          </span>
        </Link>

        {/* SOC pulse */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontFamily: "var(--mono)",
            fontSize: "9px",
            color: "var(--sev-ok)",
            letterSpacing: "0.08em",
          }}
        >
          <span style={{ fontSize: 8 }}>●</span> SOC LIVE
        </div>

        {/* Nav links */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.75rem",
            marginLeft: "auto",
          }}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                fontFamily: "var(--mono)",
                fontSize: "11px",
                letterSpacing: "0.06em",
                color:
                  pathname === link.href
                    ? "var(--fg)"
                    : "rgba(244,246,245,0.45)",
                textDecoration: "none",
                transition: "color 0.15s",
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTAs */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
          <Link
            href="/login"
            style={{
              fontFamily: "var(--mono)",
              fontSize: "11px",
              color: "rgba(244,246,245,0.45)",
              textDecoration: "none",
              letterSpacing: "0.06em",
            }}
          >
            Login →
          </Link>
          <Link
            href="/contact"
            className="btn btn-accent"
            style={{ fontSize: "10px", padding: "0.4rem 1rem" }}
          >
            Get Protection ◢
          </Link>
        </div>
      </div>
    </header>
  );
}

function MarketingFooter() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border)",
        background: "var(--bg-2)",
        padding: "3rem 2rem 2rem",
        marginTop: "auto",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            gap: "2rem",
            marginBottom: "2.5rem",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--fg)",
                marginBottom: "0.75rem",
              }}
            >
              SHEL<span style={{ color: "var(--accent)" }}>/</span>infosec
            </div>
            <p
              style={{
                fontFamily: "var(--mono)",
                fontSize: "10px",
                color: "var(--muted)",
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              Operators. Not resellers.
              <br />
              Cape Town · Global
            </p>
          </div>

          <div>
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: "9px",
                letterSpacing: "0.1em",
                color: "var(--muted)",
                textTransform: "uppercase",
                marginBottom: "0.75rem",
              }}
            >
              Platform
            </div>
            {[
              { href: "/services", label: "Services" },
              { href: "/silent-edge", label: "Silent Edge" },
              { href: "/store", label: "Store" },
              { href: "/login", label: "SOC Console" },
            ].map((l) => (
              <div key={l.href} style={{ marginBottom: "0.375rem" }}>
                <Link
                  href={l.href}
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: "11px",
                    color: "rgba(244,246,245,0.4)",
                    textDecoration: "none",
                  }}
                >
                  {l.label}
                </Link>
              </div>
            ))}
          </div>

          <div>
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: "9px",
                letterSpacing: "0.1em",
                color: "var(--muted)",
                textTransform: "uppercase",
                marginBottom: "0.75rem",
              }}
            >
              Company
            </div>
            {[
              { href: "/our-story", label: "Our Story" },
              { href: "/news", label: "News" },
              { href: "/contact", label: "Contact" },
              { href: "/privacy-policy", label: "Privacy Policy" },
              { href: "/terms", label: "Terms of Service" },
            ].map((l) => (
              <div key={l.href} style={{ marginBottom: "0.375rem" }}>
                <Link
                  href={l.href}
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: "11px",
                    color: "rgba(244,246,245,0.4)",
                    textDecoration: "none",
                  }}
                >
                  {l.label}
                </Link>
              </div>
            ))}
          </div>

          <div>
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: "9px",
                letterSpacing: "0.1em",
                color: "var(--muted)",
                textTransform: "uppercase",
                marginBottom: "0.75rem",
              }}
            >
              Contact
            </div>
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: "11px",
                color: "rgba(244,246,245,0.4)",
                lineHeight: 2,
              }}
            >
              <div>accounts@shelinfosec.com</div>
              <div>+27 77 416 7672</div>
              <div style={{ marginTop: "0.5rem", fontSize: "10px" }}>
                80 Chapman Ave
                <br />
                Mountainside, Cape Town
                <br />
                South Africa 7151
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid var(--border)",
            paddingTop: "1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontFamily: "var(--mono)",
              fontSize: "9px",
              color: "rgba(244,246,245,0.2)",
              letterSpacing: "0.08em",
            }}
          >
            © {new Date().getFullYear()} SHEL INFOSEC · AUTHORIZED ACCESS ONLY
          </span>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <span style={{ fontSize: 8, color: "var(--sev-ok)" }}>●</span>
            <span
              style={{
                fontFamily: "var(--mono)",
                fontSize: "9px",
                color: "rgba(244,246,245,0.2)",
                letterSpacing: "0.06em",
              }}
            >
              SOC OPERATIONAL · 99.998% UPTIME
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <MarketingNav />
      <main style={{ flex: 1, paddingTop: 56 }}>{children}</main>
      <MarketingFooter />
    </div>
  );
}
