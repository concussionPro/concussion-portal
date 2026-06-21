/**
 * RTP Tracker data spine — lazy table creation (idempotent, mirrors the
 * preseason `CREATE TABLE IF NOT EXISTS` pattern), share-code generation, the
 * de-identified registry writer, and the DB-row → engine-`Episode` mapper.
 *
 * The engine in lib/rtp/protocol.ts is the SINGLE SOURCE OF CLINICAL TRUTH —
 * this module only persists/loads the inputs it needs and never re-implements a
 * rule.
 */

import { sql } from '@/lib/db'
import type { Episode, GrtsStage, RtlStage } from '@/lib/rtp/protocol'

// ── Table creation ───────────────────────────────────────────────────────────

let tablesReady = false

/** Create all RTP tables if absent. Idempotent; safe to call on every request. */
export async function ensureRtpTables(): Promise<void> {
  if (tablesReady) return
  await sql`
    CREATE TABLE IF NOT EXISTS rtp_orgs (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'club',
      sport TEXT,
      share_code TEXT UNIQUE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS rtp_athletes (
      id SERIAL PRIMARY KEY,
      org_id INTEGER REFERENCES rtp_orgs(id),
      name TEXT NOT NULL,
      dob TEXT,
      sex TEXT,
      parent_email TEXT,
      share_code TEXT UNIQUE NOT NULL,
      consent JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS rtp_episodes (
      id SERIAL PRIMARY KEY,
      athlete_id INTEGER NOT NULL REFERENCES rtp_athletes(id),
      injury_date TEXT NOT NULL,
      sport TEXT,
      mechanism TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS rtp_pathways (
      id SERIAL PRIMARY KEY,
      episode_id INTEGER NOT NULL REFERENCES rtp_episodes(id),
      grts_stage INTEGER NOT NULL DEFAULT 0,
      rtl_stage INTEGER NOT NULL DEFAULT 0,
      symptom_free_date TEXT,
      stage_entered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      stage_baseline_pcss INTEGER,
      cleared_for_contact BOOLEAN NOT NULL DEFAULT false,
      clearance_id INTEGER
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS rtp_symptom_logs (
      id SERIAL PRIMARY KEY,
      episode_id INTEGER NOT NULL REFERENCES rtp_episodes(id),
      logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      pcss_total INTEGER NOT NULL DEFAULT 0,
      dominant_symptoms JSONB,
      red_flag BOOLEAN NOT NULL DEFAULT false
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS rtp_clearances (
      id SERIAL PRIMARY KEY,
      episode_id INTEGER NOT NULL REFERENCES rtp_episodes(id),
      clinician_name TEXT NOT NULL,
      clinician_email TEXT,
      cleared_for TEXT NOT NULL DEFAULT 'contact training',
      cleared_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      note TEXT
    )
  `
  // De-identified outcome registry — NO PII, ever. Append-only.
  await sql`
    CREATE TABLE IF NOT EXISTS rtp_registry_events (
      id SERIAL PRIMARY KEY,
      sport TEXT,
      age_band TEXT,
      injury_to_return_days INTEGER,
      event_type TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  tablesReady = true
}

// ── Share codes ──────────────────────────────────────────────────────────────

/** 6-char human-friendly code (no I/1/O/0). Mirrors the preseason generator. */
export function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

/** Generate a code that isn't already used in the given table column. */
export async function generateUniqueCode(
  table: 'rtp_orgs' | 'rtp_athletes',
): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt++) {
    const code = generateCode()
    const { rows } =
      table === 'rtp_orgs'
        ? await sql`SELECT 1 FROM rtp_orgs WHERE share_code = ${code} LIMIT 1`
        : await sql`SELECT 1 FROM rtp_athletes WHERE share_code = ${code} LIMIT 1`
    if (rows.length === 0) return code
  }
  throw new Error('Unable to generate a unique share code')
}

// ── De-identified registry ───────────────────────────────────────────────────

/** Coarse age band from a DOB string — de-identification for the registry. */
export function ageBand(dob?: string | null): string {
  if (!dob) return 'unknown'
  const d = new Date(dob)
  if (isNaN(d.getTime())) return 'unknown'
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  if (age < 13) return 'under-13'
  if (age <= 15) return '13-15'
  if (age <= 18) return '16-18'
  return '19-plus'
}

/**
 * Append a de-identified outcome row. NEVER pass PII here — only sport, the
 * coarse age band, an optional injury→event day count, and the event type.
 */
export async function appendRegistryEvent(params: {
  sport?: string | null
  ageBand: string
  injuryToReturnDays?: number | null
  eventType: string
}): Promise<void> {
  try {
    await sql`
      INSERT INTO rtp_registry_events (sport, age_band, injury_to_return_days, event_type)
      VALUES (${params.sport ?? null}, ${params.ageBand}, ${params.injuryToReturnDays ?? null}, ${params.eventType})
    `
  } catch {
    // Registry is best-effort — never block the clinical write on it.
    console.error('RTP registry append failed (non-fatal)')
  }
}

// ── Row → engine Episode ─────────────────────────────────────────────────────

export interface EpisodeRow {
  injury_date: string
  grts_stage: number
  rtl_stage: number
  symptom_free_date: string | null
  stage_entered_at: string | Date
  stage_baseline_pcss: number | null
  cleared_for_contact: boolean
}

/** Map a joined episode+pathway row to the engine's `Episode` shape. */
export function rowToEpisode(r: EpisodeRow): Episode {
  return {
    injuryDate: r.injury_date,
    symptomFreeDate: r.symptom_free_date ?? undefined,
    grtsStage: clampGrts(r.grts_stage),
    rtlStage: clampRtl(r.rtl_stage),
    stageEnteredAt:
      r.stage_entered_at instanceof Date
        ? r.stage_entered_at.toISOString()
        : new Date(r.stage_entered_at).toISOString(),
    stageBaselinePcss: r.stage_baseline_pcss ?? undefined,
    clearedForContact: r.cleared_for_contact === true,
  }
}

export function clampGrts(n: number): GrtsStage {
  return Math.max(0, Math.min(6, Math.round(n))) as GrtsStage
}

export function clampRtl(n: number): RtlStage {
  return Math.max(0, Math.min(4, Math.round(n))) as RtlStage
}

// ── Load the active pathway for an athlete share code ────────────────────────

export interface LoadedPathway {
  athleteId: number
  athleteName: string
  dob: string | null
  sport: string | null
  episodeId: number
  pathwayId: number
  status: string
  episode: Episode
  logs: { loggedAt: string; pcssTotal: number; redFlag: boolean }[]
}

/**
 * Resolve an athlete share code to their most-recent episode, its pathway and
 * the full symptom-log history (oldest-first). Returns null if the code is
 * unknown or has no episode. The engine consumes `episode` + `logs` unchanged.
 */
export async function loadPathwayByCode(code: string): Promise<LoadedPathway | null> {
  const { rows } = await sql`
    SELECT
      a.id AS athlete_id, a.name AS athlete_name, a.dob, a.sex,
      e.id AS episode_id, e.injury_date, e.sport, e.status,
      p.id AS pathway_id, p.grts_stage, p.rtl_stage, p.symptom_free_date,
      p.stage_entered_at, p.stage_baseline_pcss, p.cleared_for_contact
    FROM rtp_athletes a
    JOIN rtp_episodes e ON e.athlete_id = a.id
    JOIN rtp_pathways p ON p.episode_id = e.id
    WHERE a.share_code = ${code.toUpperCase()}
    ORDER BY e.created_at DESC
    LIMIT 1
  `
  if (rows.length === 0) return null
  const r = rows[0]

  const { rows: logRows } = await sql`
    SELECT logged_at, pcss_total, red_flag
    FROM rtp_symptom_logs
    WHERE episode_id = ${r.episode_id}
    ORDER BY logged_at ASC
  `

  return {
    athleteId: r.athlete_id,
    athleteName: r.athlete_name,
    dob: r.dob ?? null,
    sport: r.sport ?? null,
    episodeId: r.episode_id,
    pathwayId: r.pathway_id,
    status: r.status,
    episode: rowToEpisode(r as EpisodeRow),
    logs: logRows.map((l) => ({
      loggedAt: l.logged_at instanceof Date ? l.logged_at.toISOString() : new Date(l.logged_at).toISOString(),
      pcssTotal: Number(l.pcss_total ?? 0),
      redFlag: l.red_flag === true,
    })),
  }
}
