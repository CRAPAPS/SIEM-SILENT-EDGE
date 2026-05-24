"use client";

export default function PortalBillingPage() {
  const services = [
    { name: "Endpoint Detection & Response (EDR)", tier: "MANAGED", status: "ACTIVE" },
    { name: "Security Operations Centre (SOC)", tier: "24/7 MONITORING", status: "ACTIVE" },
    { name: "Threat Intelligence Feed", tier: "ENTERPRISE", status: "ACTIVE" },
    { name: "Vulnerability Management", tier: "CONTINUOUS", status: "ACTIVE" },
    { name: "Incident Response Retainer", tier: "ON-CALL", status: "ACTIVE" },
    { name: "Compliance Reporting", tier: "MONTHLY", status: "ACTIVE" },
  ];

  return (
    <div className="page-content">
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--muted)", letterSpacing: "0.1em", marginBottom: "0.25rem" }}>
          CLIENT PORTAL // ACCOUNT & BILLING
        </div>
        <h1 style={{ fontFamily: "var(--mono)", fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>BILLING</h1>
      </div>

      <section style={{ marginBottom: "2rem" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
          [ ACTIVE SERVICES ]
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--mono)", fontSize: "11px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["SERVICE", "TIER", "STATUS"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "0.4rem 0.6rem", color: "var(--muted)", fontSize: "9px", letterSpacing: "0.08em", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {services.map((svc) => (
                <tr key={svc.name} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "0.5rem 0.6rem", fontWeight: 600 }}>{svc.name}</td>
                  <td style={{ padding: "0.5rem 0.6rem", color: "var(--muted)", fontSize: "9px", letterSpacing: "0.06em" }}>{svc.tier}</td>
                  <td style={{ padding: "0.5rem 0.6rem" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "8px", color: "#00e28a", letterSpacing: "0.1em" }}>● {svc.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
          [ INVOICES ]
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px", padding: "2rem", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--muted)", marginBottom: "0.75rem" }}>
            INVOICE PORTAL COMING SOON
          </div>
          <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--muted)", lineHeight: 1.8, opacity: 0.6 }}>
            Invoices and payment history will be available here.<br />
            For billing enquiries please contact your account manager directly.
          </div>
        </div>
      </section>

      <section>
        <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
          [ ACCOUNT MANAGER ]
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px", padding: "1.25rem" }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: "13px", fontWeight: 700, color: "var(--fg)", marginBottom: "0.5rem" }}>
            SHEL INFOSEC
          </div>
          <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)", lineHeight: 1.9 }}>
            <div>Managed Security Services Provider</div>
            <div>
              <a href="mailto:SIEM@shelinfosec.com" style={{ color: "var(--accent)", textDecoration: "none" }}>
                SIEM@shelinfosec.com
              </a>
            </div>
            <div>shelinfosec.com</div>
          </div>
        </div>
      </section>
    </div>
  );
}
