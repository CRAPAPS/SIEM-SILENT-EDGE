export type UnitID = "osint-unit" | "redteam-unit";
export type UnitStatus = "running" | "paused" | "stopped" | "not_found";

export interface LabUnit {
  id: UnitID;
  status: UnitStatus;
  startedAt?: string;
  lastTask?: string;
}

export interface TaskResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  outputPath?: string;
}

export interface AgenticManager {
  wakeUnit(unitID: UnitID): Promise<void>;
  executeTask(unitID: UnitID, script: string): Promise<TaskResult>;
  suspendUnit(unitID: UnitID): Promise<void>;
  getStatus(unitID?: UnitID): Promise<LabUnit[]>;
}

export interface LabFinding {
  ioc_type: "ip" | "domain" | "email" | "url" | "hash" | "port" | "geo";
  ioc_value: string;
  confidence?: number;
  source_tool: string;
  geo_lat?: number;
  geo_lon?: number;
  geo_country?: string;
  metadata?: Record<string, unknown>;
}

export interface SpiderfootResult {
  type: string;
  data: string;
  module: string;
  confidence?: number;
  last_seen?: string;
}
