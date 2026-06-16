/**
 * Conversion re-pace (Zac 2026-06-16).
 *
 * The send engine fires due clinics ordered by scheduled_send_at within tier
 * weights. So "highest-value first" means stamping scheduled_send_at by
 * conversion rank: the best clinic gets the earliest timestamp, fires first;
 * the cap limits daily volume; unsent top clinics stay earliest and fire next
 * day. Runs over ALL sendable ('approved') clinics — verified, so the
 * conversion gate is meaningful — and re-runs cheaply each send so newly
 * promoted clinics slot into the right rank.
 *
 * Pure ordering: it only moves scheduled_send_at to a continuous ranked
 * timeline (earliest = best); the day-level <= TODAY filter still gates which
 * are due, and the adaptive cap still meters volume.
 */
import { sql } from '@/lib/db'
import { conversionScore } from './conversion-score'

interface Row {
  id: number
  city: string | null
  state: string | null
  region: string | null
  clinical: number
  verification_score: number | null
  verification_role: boolean | null
  verification_accept_all: boolean | null
  contact_first_name: string | null
  short_name: string | null
  dwell: number | null
  sessions: number | null
}

/**
 * Rank every 'approved' clinic by conversion score and stamp scheduled_send_at
 * on a ranked timeline (best = earliest). Returns the number re-paced.
 */
export async function repaceApprovedByConversion(): Promise<number> {
  const { rows } = await sql<Row>`
    SELECT p.id, p.city, p.state, p.region, p.contact_first_name, p.short_name,
      p.verification_score, p.verification_role, p.verification_accept_all,
      (COALESCE((p.team->>'osteopaths')::int,0)+COALESCE((p.team->>'physiotherapists')::int,0)
       +COALESCE((p.team->>'generalPractitioners')::int,0)+COALESCE((p.team->>'sportsMedicineDoctors')::int,0)
       +COALESCE((p.team->>'exercisePhys')::int,0)+COALESCE((p.team->>'myotherapists')::int,0)
       +COALESCE((p.team->>'remedialMassage')::int,0)) AS clinical,
      (SELECT MAX(dwell_ms) FROM prospect_portal_views v WHERE v.clinic_id=p.id AND v.interaction_type='exit') AS dwell,
      (SELECT COUNT(DISTINCT date_trunc('day',viewed_at)) FROM prospect_portal_views v WHERE v.clinic_id=p.id) AS sessions
    FROM prospect_clinics p
    WHERE p.status='approved' AND p.next_template_slug='initial'
  `
  if (rows.length === 0) return 0

  const scored = rows
    .map((r) => ({
      id: r.id,
      score: conversionScore({
        city: r.city, state: r.state, region: r.region,
        clinicalCount: Number(r.clinical) || 0,
        verificationScore: r.verification_score,
        hunterRole: r.verification_role ?? false,
        hunterAcceptAll: r.verification_accept_all ?? false,
        maxDwellMs: Number(r.dwell) || 0,
        sessions: Number(r.sessions) || 1,
        contactFirstName: r.contact_first_name,
        shortName: r.short_name,
      }).score,
    }))
    .sort((a, b) => b.score - a.score)

  // Stamp a ranked timeline: best = NOW, each next +1s. All "due today", but the
  // send's ORDER BY scheduled_send_at ASC fires them best-first; the cap meters
  // how many actually go out, and tomorrow the next-best remain earliest.
  const base = Date.now()
  const CHUNK = 500
  for (let i = 0; i < scored.length; i += CHUNK) {
    const chunk = scored.slice(i, i + CHUNK)
    const payload = chunk.map((s, j) => ({ id: s.id, ts: new Date(base + (i + j) * 1000).toISOString() }))
    await sql`
      UPDATE prospect_clinics p
      SET scheduled_send_at = (e->>'ts')::timestamptz, updated_at = NOW()
      FROM jsonb_array_elements(${JSON.stringify(payload)}::jsonb) e
      WHERE p.id = (e->>'id')::int
    `
  }
  return scored.length
}
