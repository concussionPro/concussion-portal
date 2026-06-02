-- Cold outreach engine — DB schema for Vercel Postgres.
-- Run via: psql $POSTGRES_URL -f lib/prospect/schema.sql
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS prospect_clinics (
  id                SERIAL PRIMARY KEY,
  slug              TEXT NOT NULL UNIQUE,
  access_key        TEXT NOT NULL,
  name              TEXT NOT NULL,
  short_name        TEXT NOT NULL,
  city              TEXT NOT NULL,
  state             TEXT NOT NULL,
  region            TEXT NOT NULL,
  contact_first_name TEXT NOT NULL,
  contact_full_name TEXT NOT NULL,
  contact_email     TEXT NOT NULL,
  contact_role      TEXT,
  contact_discipline TEXT NOT NULL,
  clinic_website_url TEXT NOT NULL,
  team              JSONB NOT NULL,
  local_targets     JSONB NOT NULL DEFAULT '[]'::jsonb,
  travel_band       TEXT NOT NULL,
  travel_surcharge  INTEGER NOT NULL DEFAULT 0,
  cohort_recommendation TEXT NOT NULL DEFAULT 'recommended',
  status            TEXT NOT NULL DEFAULT 'researching',
  research_source   TEXT NOT NULL DEFAULT 'manual',
  valid_until       TIMESTAMPTZ NOT NULL,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prospect_clinics_status ON prospect_clinics (status);
CREATE INDEX IF NOT EXISTS idx_prospect_clinics_state  ON prospect_clinics (state);

CREATE TABLE IF NOT EXISTS prospect_outreach_log (
  id                SERIAL PRIMARY KEY,
  clinic_id         INTEGER NOT NULL REFERENCES prospect_clinics(id) ON DELETE CASCADE,
  template_slug     TEXT NOT NULL,
  email_subject     TEXT NOT NULL,
  email_body        TEXT NOT NULL,
  sent_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resend_email_id   TEXT,
  opened_count      INTEGER NOT NULL DEFAULT 0,
  clicked_count     INTEGER NOT NULL DEFAULT 0,
  replied_at        TIMESTAMPTZ,
  reply_text        TEXT,
  reply_sentiment   TEXT,
  audit_key         TEXT NOT NULL UNIQUE  -- e.g. 'outreach:<slug>:<template>' for idempotency
);

CREATE INDEX IF NOT EXISTS idx_prospect_outreach_log_clinic_id ON prospect_outreach_log (clinic_id);
CREATE INDEX IF NOT EXISTS idx_prospect_outreach_log_resend    ON prospect_outreach_log (resend_email_id);

-- Suppression list — never send to these addresses again.
CREATE TABLE IF NOT EXISTS email_suppression (
  email             TEXT PRIMARY KEY,
  reason            TEXT NOT NULL,     -- 'unsubscribed' | 'hard-bounce' | 'complained' | 'manual'
  source            TEXT,              -- e.g. 'webhook:bounce', 'prospect-id:42'
  suppressed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Per-template signoff gate. Production sends FAIL if the matching row's
-- signed_off_at is null. Insert one row per template slug on first deploy.
CREATE TABLE IF NOT EXISTS email_template_signoff (
  slug              TEXT PRIMARY KEY,
  signed_off_at     TIMESTAMPTZ,
  signed_off_by     TEXT,
  notes             TEXT
);

INSERT INTO email_template_signoff (slug) VALUES
  ('initial'), ('followup'), ('final')
ON CONFLICT (slug) DO NOTHING;

-- Portal view tracking (engagement signal — Zac knows when to call)
CREATE TABLE IF NOT EXISTS prospect_portal_views (
  id                SERIAL PRIMARY KEY,
  clinic_id         INTEGER NOT NULL REFERENCES prospect_clinics(id) ON DELETE CASCADE,
  viewer_ip         TEXT,
  user_agent        TEXT,
  section_visited   TEXT NOT NULL,  -- 'landing' | 'learning' | 'module-1' | 'references' | 'toolkit' | 'pricing'
  duration_seconds  INTEGER,
  viewed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prospect_portal_views_clinic ON prospect_portal_views (clinic_id);
CREATE INDEX IF NOT EXISTS idx_prospect_portal_views_when   ON prospect_portal_views (viewed_at DESC);
