export const SPECIALIST_SYSTEM_PROMPT = `You are the Silent Edge AI Specialist — the intelligence core of the SHEL INFOSEC SOC platform.

Persona: Cyber-noir SOC operator. Precise, tactical, no wasted words. Not a chatbot.

Output format (always):
- [ SECTION ] for headers
- • for bullet points
- MITRE technique IDs in ALL CAPS (e.g., T1059.001 COMMAND_AND_SCRIPTING_INTERPRETER)
- Severity in uppercase: CRITICAL / HIGH / MEDIUM / LOW / INFO
- End every response with a suggested action prefixed with ◢

Standards you operate by:
- NIST SP 800-53r5 control families
- MITRE ATT&CK Enterprise framework
- SABSA enterprise security architecture
- CompTIA CySA+ incident response methodology
- Lockheed Martin Cyber Kill Chain

When analyzing logs or alerts, always:
1. Identify the MITRE tactic and technique
2. Assess the Kill Chain phase
3. Check NIST controls that apply
4. Propose a proportionate response

Knowledge base context from retrieved SHEL INFOSEC documents follows.`;

export const LOG_ANALYSIS_PROMPT = `You are the Silent Edge Log Analysis Engine (Gemini mode).
Task: Analyze the following log data for security events, anomalies, and threat indicators.
Return a structured JSON report with: events[], anomalies[], mitre_techniques[], severity_summary, recommended_actions[].
Be exhaustive — process every line.`;

export const SPECIALIST_TOOLS = [
  {
    name: "isolate_host",
    description:
      "Immediately isolate a host from the network via SentinelOne. Use when active compromise or C2 beacon is confirmed.",
    input_schema: {
      type: "object",
      properties: {
        hostname: { type: "string", description: "The hostname or device ID to isolate" },
        reason: { type: "string", description: "Reason for isolation (logged to audit trail)" },
      },
      required: ["hostname", "reason"],
    },
  },
  {
    name: "get_device_context",
    description: "Retrieve full device profile from NinjaOne plus last 10 alerts for a hostname.",
    input_schema: {
      type: "object",
      properties: {
        hostname: { type: "string" },
      },
      required: ["hostname"],
    },
  },
  {
    name: "dispatch_playbook",
    description: "Retrieve and initiate a response playbook for a specific incident type.",
    input_schema: {
      type: "object",
      properties: {
        incident_type: {
          type: "string",
          enum: [
            "ransomware",
            "phishing",
            "c2-beacon",
            "brute-force",
            "data-exfil",
            "privilege-escalation",
            "lateral-movement",
            "insider-threat",
          ],
        },
        org_id: { type: "string" },
      },
      required: ["incident_type", "org_id"],
    },
  },
  {
    name: "analyze_logs",
    description:
      "Route a large log file (100k+ lines) to Gemini for deep analysis. Returns structured threat report.",
    input_schema: {
      type: "object",
      properties: {
        log_content: { type: "string", description: "Raw log content to analyze" },
        log_source: {
          type: "string",
          enum: ["sentinelone", "ninjaone", "bitdefender", "windows_event", "syslog", "firewall"],
        },
      },
      required: ["log_content", "log_source"],
    },
  },
  {
    name: "geofence_alert",
    description: "Check if a known device fingerprint is connecting from an unexpected geolocation.",
    input_schema: {
      type: "object",
      properties: {
        fingerprint_id: { type: "string" },
        current_lat: { type: "number" },
        current_lon: { type: "number" },
        org_id: { type: "string" },
      },
      required: ["fingerprint_id", "current_lat", "current_lon", "org_id"],
    },
  },
] as const;
