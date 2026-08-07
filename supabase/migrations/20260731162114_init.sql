-- Gonzalo Zuazo Properties — panel admin
-- Esquema inicial: usuarios, leads, call_logs, scrape_runs, do_not_call, settings.

-- =========================================================================
-- usuarios: perfil de aplicación 1:1 con auth.users
-- =========================================================================
create table usuarios (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  full_name  text,
  role       text not null default 'admin' check (role in ('admin')),
  created_at timestamptz not null default now()
);

alter table usuarios enable row level security;

create policy "authenticated full access" on usuarios
  for all to authenticated using (true) with check (true);

-- Alta automática de la fila espejo cuando se crea un usuario en Supabase Auth.
create function handle_new_user()
returns trigger as $$
begin
  insert into usuarios (id, email) values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- =========================================================================
-- settings: fila única de configuración (id fijo = 1)
-- =========================================================================
create table settings (
  id                        smallint primary key default 1 check (id = 1),
  calling_hours_start       time not null default '10:00',
  calling_hours_end         time not null default '19:00',
  calling_days              int[] not null default '{1,2,3,4,5}', -- 1=lunes .. 7=domingo (ISO)
  timezone                  text not null default 'Europe/Madrid',
  max_call_attempts         int not null default 3,
  min_hours_between_attempts int not null default 24,
  retell_agent_id           text,
  retell_from_number        text,
  scrape_search_url         text,
  scrape_schedule_cron      text not null default '0 8 * * *',
  dial_schedule_cron        text not null default '*/15 * * * *',
  is_dialing_enabled        boolean not null default false,
  is_scraping_enabled       boolean not null default false,
  updated_at                timestamptz not null default now()
);

insert into settings (id) values (1);

alter table settings enable row level security;

create policy "authenticated full access" on settings
  for all to authenticated using (true) with check (true);

-- =========================================================================
-- leads: anuncios de Idealista (particulares) y su estado de calificación
-- =========================================================================
create table leads (
  id                     uuid primary key default gen_random_uuid(),
  idealista_property_code text not null unique,
  source_url             text,
  address                text,
  price                  numeric,
  size_m2                numeric,
  rooms                  int,
  owner_name             text,
  phone_raw              text,
  phone_e164             text,
  seller_type            text,

  status                 text not null default 'nuevo lead'
                           check (status in ('nuevo lead', 'en duda', 'interesado', 'no interesado')),

  call_attempts          int not null default 0,
  last_call_at           timestamptz,
  next_eligible_call_at  timestamptz,

  meeting_requested      boolean not null default false,
  meeting_notes          text,

  raw_scrape_data        jsonb,

  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index leads_status_idx on leads (status);
create index leads_phone_e164_idx on leads (phone_e164);

-- Índice parcial de elegibilidad: acelera la query del worker que busca
-- leads listos para llamar (status activo + hora de reintento vencida + tiene teléfono).
create index leads_eligibility_idx on leads (status, next_eligible_call_at)
  where phone_e164 is not null;

alter table leads enable row level security;

create policy "authenticated full access" on leads
  for all to authenticated using (true) with check (true);

create function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger leads_set_updated_at
  before update on leads
  for each row execute function set_updated_at();

-- =========================================================================
-- call_logs: historial de llamadas Retell por lead
-- =========================================================================
create table call_logs (
  id                   uuid primary key default gen_random_uuid(),
  lead_id              uuid not null references leads (id) on delete cascade,
  retell_call_id       text unique,
  attempt_number       int not null,

  transcript           text,
  transcript_json      jsonb,
  recording_url        text,

  call_successful      boolean,
  user_sentiment       text,
  custom_analysis      jsonb,
  resulting_status     text,

  raw_webhook_payload  jsonb,

  started_at           timestamptz,
  ended_at             timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index call_logs_lead_id_idx on call_logs (lead_id);

alter table call_logs enable row level security;

create policy "authenticated full access" on call_logs
  for all to authenticated using (true) with check (true);

create trigger call_logs_set_updated_at
  before update on call_logs
  for each row execute function set_updated_at();

-- =========================================================================
-- scrape_runs: historial de ejecuciones del actor de Apify
-- =========================================================================
create table scrape_runs (
  id                     uuid primary key default gen_random_uuid(),
  apify_run_id           text unique not null,
  status                 text not null default 'pending'
                           check (status in ('pending', 'running', 'succeeded', 'failed', 'aborted')),

  leads_created          int not null default 0,
  leads_updated          int not null default 0,
  leads_skipped_agency   int not null default 0,
  leads_skipped_invalid  int not null default 0,

  error_message          text,

  started_at             timestamptz,
  finished_at             timestamptz,
  created_at             timestamptz not null default now()
);

alter table scrape_runs enable row level security;

create policy "authenticated full access" on scrape_runs
  for all to authenticated using (true) with check (true);

-- =========================================================================
-- do_not_call: lista de exclusión (manual o por petición del propietario)
-- =========================================================================
create table do_not_call (
  id          uuid primary key default gen_random_uuid(),
  phone_e164  text not null unique,
  reason      text,
  created_at  timestamptz not null default now()
);

alter table do_not_call enable row level security;

create policy "authenticated full access" on do_not_call
  for all to authenticated using (true) with check (true);
