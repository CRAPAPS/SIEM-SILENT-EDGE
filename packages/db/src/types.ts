/**
 * Supabase database type definitions for the Silent Edge Platform.
 *
 * After setting up the Supabase project and running migrations, replace this
 * file with the auto-generated types:
 *
 *   npx supabase gen types typescript --project-id <project-ref> > packages/db/src/types.ts
 *
 * The stub below is enough to satisfy TypeScript until real types are generated.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Role = "admin" | "analyst" | "client";
export type Severity = "info" | "low" | "medium" | "high" | "critical";
export type AlertStatus = "open" | "investigating" | "contained" | "resolved" | "false_positive";
export type Provider = "sentinelone" | "ninjaone" | "bitdefender";
export type DeviceType = "workstation" | "server" | "network" | "mobile" | "unknown";
export type OrgTier = "standard" | "pro" | "enterprise";
export type OrgStatus = "active" | "suspended" | "trial";

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          tier: OrgTier;
          status: OrgStatus;
          contract_start: string | null;
          contract_end: string | null;
          monthly_rate: number | null;
          meta: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["organizations"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["organizations"]["Insert"]>;
      };
      profiles: {
        Row: {
          id: string;
          organization_id: string | null;
          display_name: string | null;
          role: Role;
          avatar_url: string | null;
          last_seen_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      alerts: {
        Row: {
          id: string;
          organization_id: string;
          device_id: string | null;
          source: Provider | "manual" | "system";
          source_alert_id: string | null;
          severity: Severity;
          title: string;
          description: string | null;
          category: string | null;
          technique_id: string | null;
          technique_name: string | null;
          indicator_type: string | null;
          indicator_value: string | null;
          host: string | null;
          host_ip: string | null;
          status: AlertStatus;
          assigned_to: string | null;
          acknowledged_at: string | null;
          resolved_at: string | null;
          resolution_note: string | null;
          playbook_id: string | null;
          ai_summary: string | null;
          ai_mitigation: string | null;
          ai_confidence: number | null;
          raw_data: Json;
          occurred_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["alerts"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["alerts"]["Insert"]>;
      };
      devices: {
        Row: {
          id: string;
          organization_id: string;
          ninja_id: string;
          hostname: string;
          display_name: string | null;
          device_type: DeviceType | null;
          os: string | null;
          os_version: string | null;
          ip_address: string | null;
          mac_address: string | null;
          location: string | null;
          risk_score: number;
          risk_factors: Json;
          is_online: boolean;
          last_seen_at: string | null;
          raw_data: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["devices"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["devices"]["Insert"]>;
      };
      playbooks: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          incident_type: string;
          trigger_tags: string[];
          steps: Json;
          is_active: boolean;
          version: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["playbooks"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["playbooks"]["Insert"]>;
      };
      audit_logs: {
        Row: {
          id: number;
          organization_id: string | null;
          actor_id: string | null;
          actor_email: string | null;
          action: string;
          target_type: string | null;
          target_id: string | null;
          before_state: Json | null;
          after_state: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["audit_logs"]["Row"], "id" | "created_at">;
        Update: never;
      };
      vector_documents: {
        Row: {
          id: string;
          organization_id: string | null;
          source_file: string;
          chunk_index: number;
          content: string;
          embedding: number[] | null;
          metadata: Json;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["vector_documents"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["vector_documents"]["Insert"]>;
      };
      system_metrics: {
        Row: {
          id: string;
          organization_id: string | null;
          metric_name: string;
          metric_value: number | null;
          metric_text: string | null;
          recorded_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["system_metrics"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["system_metrics"]["Insert"]>;
      };
      api_credentials: {
        Row: {
          id: string;
          organization_id: string;
          provider: Provider;
          encrypted_key: string;
          encrypted_secret: string | null;
          base_url: string | null;
          is_active: boolean;
          last_synced_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["api_credentials"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["api_credentials"]["Insert"]>;
      };
      service_records: {
        Row: {
          id: string;
          organization_id: string;
          record_type: "invoice" | "credit" | "adjustment";
          period_start: string;
          period_end: string;
          amount: number;
          status: "pending" | "paid" | "overdue" | "cancelled";
          invoice_ref: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["service_records"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["service_records"]["Insert"]>;
      };
    };
    Functions: {
      match_documents: {
        Args: {
          query_embedding: number[];
          match_threshold?: number;
          match_count?: number;
          org_id?: string | null;
        };
        Returns: {
          id: string;
          content: string;
          source_file: string;
          chunk_index: number;
          metadata: Json;
          similarity: number;
        }[];
      };
      get_alert_stats: {
        Args: { p_org_id?: string | null };
        Returns: {
          total_open: number;
          critical_open: number;
          high_open: number;
          resolved_24h: number;
          avg_ttr_mins: number;
        }[];
      };
    };
    Enums: {};
  };
}
