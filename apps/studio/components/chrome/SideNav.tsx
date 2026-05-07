"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "./dashboard",  href: "/dashboard" },
  { label: "./alerts",     href: "/alerts" },
  { label: "./devices",    href: "/devices" },
  { label: "./geoint",     href: "/geoint" },
  { label: "./playbooks",  href: "/playbooks" },
  { label: "./business",   href: "/business" },
  { label: "./reports",    href: "/business/reports" },
];

const ADMIN_ITEMS: NavItem[] = [
  { label: "./admin",      href: "/admin",    adminOnly: true },
  { label: "./audit",      href: "/admin/audit", adminOnly: true },
  { label: "./settings",   href: "/settings" },
];

interface SideNavProps {
  role?: "admin" | "analyst" | "client";
  userEmail?: string;
}

export function SideNav({ role, userEmail }: SideNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

  return (
    <nav className="sidenav">
      <div style={{ padding: "0 1.25rem 1rem", marginBottom: "0.5rem" }}>
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "0.04em",
            color: "var(--fg)",
          }}
        >
          SILENT/EDGE
        </div>
        {userEmail && (
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: "9px",
              color: "var(--muted)",
              marginTop: "2px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {userEmail}
          </div>
        )}
      </div>

      <div style={{ height: "1px", background: "var(--border)", margin: "0 0 0.75rem" }} />

      <div className="sidenav-section">SOC</div>
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`sidenav-item${isActive(item.href) ? " active" : ""}`}
        >
          {item.label}
        </Link>
      ))}

      {role === "admin" && (
        <>
          <div style={{ height: "1px", background: "var(--border)", margin: "0.75rem 0" }} />
          <div className="sidenav-section">ADMIN</div>
          {ADMIN_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidenav-item${isActive(item.href) ? " active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      <div style={{ height: "1px", background: "var(--border)", margin: "0 0 0.75rem" }} />

      <form action="/api/auth/signout" method="POST">
        <button type="submit" className="sidenav-item" style={{ color: "var(--sev-alert)" }}>
          ./logout
        </button>
      </form>
    </nav>
  );
}
