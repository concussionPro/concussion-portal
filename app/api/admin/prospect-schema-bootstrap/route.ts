/**
 * POST /api/admin/prospect-schema-bootstrap
 *
 * One-shot endpoint that creates the prospect_* tables in production Postgres.
 * Idempotent — re-runs are safe (CREATE TABLE IF NOT EXISTS + ALTER TABLE ...
 * IF NOT EXISTS for column additions).
 *
 * Use this when /admin/analytics shows "schema-not-applied" status. Avoids
 * needing direct psql access from a local machine.
 *
 * Auth: admin header / cookie.
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { isAdminRequest } from '@/lib/require-admin'

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const log: string[] = []
  const run = async (label: string, fn: () => Promise<unknown>) => {
    try {
      await fn()
      log.push(`✓ ${label}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      log.push(`✗ ${label} — ${msg}`)
      throw err
    }
  }

  try {
    await run('prospect_clinics table', () => sql`
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
      )
    `)
    await run('prospect_clinics.scheduled_send_at column', () => sql`
      ALTER TABLE prospect_clinics ADD COLUMN IF NOT EXISTS scheduled_send_at TIMESTAMPTZ
    `)
    await run('prospect_clinics.next_template_slug column', () => sql`
      ALTER TABLE prospect_clinics ADD COLUMN IF NOT EXISTS next_template_slug TEXT
    `)
    await run('prospect_clinics.priority_wave column', () => sql`
      ALTER TABLE prospect_clinics ADD COLUMN IF NOT EXISTS priority_wave TEXT
    `)
    await run('prospect_clinics.pitch_variant column', () => sql`
      ALTER TABLE prospect_clinics ADD COLUMN IF NOT EXISTS pitch_variant TEXT
    `)
    await run('prospect_clinics.access_key column', () => sql`
      ALTER TABLE prospect_clinics ADD COLUMN IF NOT EXISTS access_key TEXT
    `)
    // Targeted continuity fix — Advanced Health Buderim. The live
    // hand-built proposal site (app/proposals/advanced-health-buderim/
    // _shared.tsx) hardcodes ACCESS_KEY 'ah2026' in links already in the
    // wild, and /api/toolkit/download validates ?k= against
    // prospect_clinics.access_key. Generic backfills (see
    // ensureSchemaBootstrap in lib/prospect/process-scheduled.ts) derive a
    // DIFFERENT key from the slug, so force the known value — must run even
    // when access_key is already non-null. Idempotent. Slug matched with
    // LIKE because the engine-side slug for this hand-built clinic isn't
    // pinned anywhere in the repo.
    await run('advanced-health ah2026 access_key continuity', () => sql`
      UPDATE prospect_clinics
      SET access_key = 'ah2026'
      WHERE slug LIKE 'advanced-health%'
        AND access_key IS DISTINCT FROM 'ah2026'
    `)
    await run('prospect_clinics.replied_at column', () => sql`
      ALTER TABLE prospect_clinics ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ
    `)
    await run('prospect_clinics.reply_text column', () => sql`
      ALTER TABLE prospect_clinics ADD COLUMN IF NOT EXISTS reply_text TEXT
    `)
    await run('prospect_clinics verification columns', async () => {
      await sql`ALTER TABLE prospect_clinics ADD COLUMN IF NOT EXISTS verification_status TEXT`
      await sql`ALTER TABLE prospect_clinics ADD COLUMN IF NOT EXISTS verification_result TEXT`
      await sql`ALTER TABLE prospect_clinics ADD COLUMN IF NOT EXISTS verification_score INTEGER`
      await sql`ALTER TABLE prospect_clinics ADD COLUMN IF NOT EXISTS verification_role BOOLEAN`
      await sql`ALTER TABLE prospect_clinics ADD COLUMN IF NOT EXISTS verification_accept_all BOOLEAN`
      await sql`ALTER TABLE prospect_clinics ADD COLUMN IF NOT EXISTS verification_webmail BOOLEAN`
      await sql`ALTER TABLE prospect_clinics ADD COLUMN IF NOT EXISTS verification_disposable BOOLEAN`
      await sql`ALTER TABLE prospect_clinics ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ`
    })
    await run('idx_prospect_clinics_status', () => sql`
      CREATE INDEX IF NOT EXISTS idx_prospect_clinics_status ON prospect_clinics (status)
    `)
    await run('idx_prospect_clinics_state', () => sql`
      CREATE INDEX IF NOT EXISTS idx_prospect_clinics_state ON prospect_clinics (state)
    `)
    await run('idx_prospect_clinics_scheduled', () => sql`
      CREATE INDEX IF NOT EXISTS idx_prospect_clinics_scheduled ON prospect_clinics (scheduled_send_at) WHERE scheduled_send_at IS NOT NULL
    `)

    await run('prospect_outreach_log table', () => sql`
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
        audit_key         TEXT NOT NULL UNIQUE
      )
    `)
    // Self-optimizing subject engine: stable, clinic-agnostic key of the
    // subject VARIANT used on each send (e.g. 'name', 'city', 'capability_q').
    // The optimizer scores variants on real engagement via this column.
    await run('prospect_outreach_log.subject_key column', () => sql`
      ALTER TABLE prospect_outreach_log ADD COLUMN IF NOT EXISTS subject_key TEXT
    `)
    await run('idx_prospect_outreach_log_subject_key', () => sql`
      CREATE INDEX IF NOT EXISTS idx_prospect_outreach_log_subject_key ON prospect_outreach_log (template_slug, subject_key)
    `)
    await run('idx_prospect_outreach_log_clinic_id', () => sql`
      CREATE INDEX IF NOT EXISTS idx_prospect_outreach_log_clinic_id ON prospect_outreach_log (clinic_id)
    `)
    await run('idx_prospect_outreach_log_resend', () => sql`
      CREATE INDEX IF NOT EXISTS idx_prospect_outreach_log_resend ON prospect_outreach_log (resend_email_id)
    `)

    await run('email_suppression table', () => sql`
      CREATE TABLE IF NOT EXISTS email_suppression (
        email             TEXT PRIMARY KEY,
        reason            TEXT NOT NULL,
        source            TEXT,
        suppressed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    await run('email_template_signoff table', () => sql`
      CREATE TABLE IF NOT EXISTS email_template_signoff (
        slug              TEXT PRIMARY KEY,
        signed_off_at     TIMESTAMPTZ,
        signed_off_by     TEXT,
        notes             TEXT
      )
    `)
    await run('seed signoff rows', () => sql`
      INSERT INTO email_template_signoff (slug)
      VALUES ('initial'), ('followup'), ('final')
      ON CONFLICT (slug) DO NOTHING
    `)

    // email_events is normally created by scripts/add-email-events-table.ts;
    // CREATE IF NOT EXISTS here keeps the user_agent ALTER below safe on a
    // fresh database too.
    await run('email_events table', () => sql`
      CREATE TABLE IF NOT EXISTS email_events (
        id SERIAL PRIMARY KEY,
        email_id TEXT NOT NULL,
        recipient TEXT NOT NULL,
        event_type TEXT NOT NULL,
        subject TEXT,
        sequence TEXT,
        day TEXT,
        click_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `)
    await run('email_events.project column', () => sql`
      ALTER TABLE email_events ADD COLUMN IF NOT EXISTS project TEXT
    `)
    // The cron's prior-engagement lookup filters on COALESCE(user_agent,'') —
    // the column was never added by the webhook, and a missing column
    // 42703-aborts the whole send run.
    await run('email_events.user_agent column', () => sql`
      ALTER TABLE email_events ADD COLUMN IF NOT EXISTS user_agent TEXT
    `)

    await run('prospect_portal_views table', () => sql`
      CREATE TABLE IF NOT EXISTS prospect_portal_views (
        id                SERIAL PRIMARY KEY,
        clinic_id         INTEGER NOT NULL REFERENCES prospect_clinics(id) ON DELETE CASCADE,
        viewer_ip         TEXT,
        user_agent        TEXT,
        section_visited   TEXT NOT NULL,
        duration_seconds  INTEGER,
        viewed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await run('idx_prospect_portal_views_clinic', () => sql`
      CREATE INDEX IF NOT EXISTS idx_prospect_portal_views_clinic ON prospect_portal_views (clinic_id)
    `)
    await run('idx_prospect_portal_views_when', () => sql`
      CREATE INDEX IF NOT EXISTS idx_prospect_portal_views_when ON prospect_portal_views (viewed_at DESC)
    `)

    return NextResponse.json({ ok: true, log })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, log, error: message }, { status: 500 })
  }
}
