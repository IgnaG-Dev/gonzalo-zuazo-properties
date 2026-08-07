export type LeadStatus = "nuevo lead" | "en duda" | "interesado" | "no interesado";

export type PropertyFeatures = {
  hasSwimmingPool?: boolean;
  hasTerrace?: boolean;
  hasAirConditioning?: boolean;
  hasBoxRoom?: boolean;
  hasGarden?: boolean;
};

export type Lead = {
  id: string;
  idealista_property_code: string;
  source_url: string | null;
  address: string | null;
  price: number | null;
  size_m2: number | null;
  rooms: number | null;
  owner_name: string | null;
  phone_raw: string | null;
  phone_e164: string | null;
  seller_type: string | null;
  status: LeadStatus;
  call_attempts: number;
  last_call_at: string | null;
  next_eligible_call_at: string | null;
  meeting_requested: boolean;
  meeting_notes: string | null;
  raw_scrape_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  /** Datos de la propiedad en sí (sección "Inmobiliarios") — antes se descartaban. */
  photos: string[];
  description: string | null;
  bathrooms: number | null;
  floor: string | null;
  property_type: string | null;
  has_lift: boolean | null;
  exterior: boolean | null;
  features: PropertyFeatures | null;
}

export type CallLog = {
  id: string;
  lead_id: string;
  retell_call_id: string | null;
  attempt_number: number;
  transcript: string | null;
  transcript_json: unknown;
  recording_url: string | null;
  call_successful: boolean | null;
  user_sentiment: string | null;
  custom_analysis: Record<string, unknown> | null;
  resulting_status: LeadStatus | null;
  raw_webhook_payload: Record<string, unknown> | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ScrapeRunStatus = "pending" | "running" | "succeeded" | "failed" | "aborted";

export type ScrapeRun = {
  id: string;
  apify_run_id: string;
  status: ScrapeRunStatus;
  leads_created: number;
  leads_updated: number;
  leads_skipped_agency: number;
  leads_skipped_invalid: number;
  error_message: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export type DoNotCallEntry = {
  id: string;
  phone_e164: string;
  reason: string | null;
  created_at: string;
}

export type Settings = {
  id: 1;
  calling_hours_start: string; // "HH:MM:SS"
  calling_hours_end: string;
  calling_days: number[]; // ISO weekday, 1=lunes .. 7=domingo
  timezone: string;
  max_call_attempts: number;
  min_hours_between_attempts: number;
  retell_agent_id: string | null;
  retell_from_number: string | null;
  /** @deprecated el input real del actor usa scrape_location_id/scrape_location_name, no una URL. */
  scrape_search_url: string | null;
  scrape_location_id: string | null;
  scrape_location_name: string | null;
  scrape_num_pages: number;
  /** '' = cualquier momento, 'Y' = últimas 48h, 'W' = última semana, 'M' = último mes. */
  scrape_since_date: "" | "Y" | "W" | "M";
  scrape_schedule_cron: string;
  dial_schedule_cron: string;
  is_dialing_enabled: boolean;
  is_scraping_enabled: boolean;
  updated_at: string;
}

/** Tablas de la base de datos, usado para tipar el cliente Supabase genérico. */
export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: "admin";
          created_at: string;
        };
        Insert: { id: string; email: string; full_name?: string | null; role?: "admin"; created_at?: string };
        Update: Partial<{
          id: string;
          email: string;
          full_name: string | null;
          role: "admin";
          created_at: string;
        }>;
        Relationships: [];
      };
      leads: {
        Row: Lead;
        Insert: Partial<Lead> & { idealista_property_code: string };
        Update: Partial<Lead>;
        Relationships: [];
      };
      call_logs: {
        Row: CallLog;
        Insert: Partial<CallLog> & { lead_id: string; attempt_number: number };
        Update: Partial<CallLog>;
        Relationships: [];
      };
      scrape_runs: {
        Row: ScrapeRun;
        Insert: Partial<ScrapeRun> & { apify_run_id: string };
        Update: Partial<ScrapeRun>;
        Relationships: [];
      };
      do_not_call: {
        Row: DoNotCallEntry;
        Insert: Partial<DoNotCallEntry> & { phone_e164: string };
        Update: Partial<DoNotCallEntry>;
        Relationships: [];
      };
      settings: {
        Row: Settings;
        Insert: Partial<Settings>;
        Update: Partial<Settings>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
