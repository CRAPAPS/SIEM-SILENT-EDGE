export interface GeoDevice {
  id: string;
  hostname: string;
  deviceType: "workstation" | "server" | "mobile" | "network" | "unknown";
  lat: number;
  lon: number;
  riskScore: number;
  isOnline: boolean;
  orgId: string;
  orgName?: string;
  fingerprintId?: string;
  lastSeen?: string;
}

export interface ThreatArc {
  id: string;
  sourceLat: number;
  sourceLon: number;
  targetLat: number;
  targetLon: number;
  severity: "info" | "low" | "medium" | "high" | "critical";
  label?: string;
  alertId?: string;
}

export interface DevicePoint {
  lat: number;
  lon: number;
  size: number;
  color: string;
  device: GeoDevice;
  label: string;
}
