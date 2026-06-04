/**
 * Adaptive daily cap for cold-outreach cron.
 *
 * Replaces the static PROSPECT_CRON_DAILY_CAP env var with a data-driven
 * cap that ramps up when deliverability is clean and throttles down when
 * complaints or bounces spike. Domain reputation is shared with nurture +
 * transactional mail, so cold-outreach volume has to step DOWN if its
 * complaints start poisoning the whole sending identity.
 *
 * Decision logic (rolling 30 day window, CEA project only):
 *
 *   complaint_rate (= complaints / sends across ALL channels):
 *     >= 0.30%   → BLOCK (cap = 0). Domain at Gmail/Yahoo deferral risk.
 *     >= 0.20%   → THROTTLE (cap = 3).
 *     >= 0.10%   → HOLD (cap = 5).
 *     <  0.10%   → eligible to ramp.
 *
 *   bounce_rate (= hard bounces / sends):
 *     >= 5%      → BLOCK (cap = 0). List quality is wrecked.
 *     >= 2%      → HOLD (cap = 5).
 *     <  2%      → eligible to ramp.
 *
 * Ramp ladder (only applied when BOTH gates clear):
 *   - cold_sends_last_7d < 10  →  cap = 5   (Week 1 baseline)
 *   - cold_sends_last_7d < 25  →  cap = 8   (Week 2)
 *   - cold_sends_last_7d < 50  →  cap = 12  (Week 3)
 *   - cold_sends_last_7d >= 50 →  cap = 15  (Week 4+ ceiling — past this
 *                                 split sending identity to subdomain)
 *
 * Operators can override via env (PROSPECT_CRON_CAP_OVERRIDE) but the
 * adaptive value is always computed and logged so we can audit decisions.
 */
import { sql } from '@/lib/db'

export interface CapDecision {
  cap: number
  reason: string
  metrics: {
    complaintRate: number
    bounceRate: number
    totalSends30d: number
    coldSends7d: number
  }
  envOverride: number | null
}

export async function computeAdaptiveCap(): Promise<CapDecision> {
  // 1. Rolling 30-day domain-wide deliverability metrics (CEA project).
  //    Dedupe to per-email (an open event firing twice doesn't double-count).
  const { rows: domain30 } = await sql<{
    emails: number
    complaints: number
    bounces: number
  }>`
    WITH per_email AS (
      SELECT
        email_id,
        MAX(CASE WHEN event_type = 'delivered'  THEN 1 ELSE 0 END) AS delivered,
        MAX(CASE WHEN event_type = 'complained' THEN 1 ELSE 0 END) AS complained,
        MAX(CASE WHEN event_type = 'bounced'    THEN 1 ELSE 0 END) AS bounced
      FROM email_events
      WHERE created_at >= NOW() - INTERVAL '30 days'
        AND COALESCE(project, 'cea') = 'cea'
      GROUP BY email_id
    )
    SELECT
      COUNT(*)::int                    AS emails,
      COALESCE(SUM(complained), 0)::int AS complaints,
      COALESCE(SUM(bounced), 0)::int    AS bounces
    FROM per_email
  `

  const m = domain30[0] || { emails: 0, complaints: 0, bounces: 0 }
  const complaintRate = m.emails > 0 ? m.complaints / m.emails : 0
  const bounceRate = m.emails > 0 ? m.bounces / m.emails : 0

  // 2. Cold-only volume in the last 7 days — drives the ramp ladder.
  // Cold outreach is tagged sequence=null + has a prospect-id tag (we'd need
  // to join email_events with prospect_outreach_log). Cheap proxy: count
  // prospect_outreach_log rows.
  const { rows: cold7Rows } = await sql<{ cold_sends_7d: number }>`
    SELECT COUNT(*)::int AS cold_sends_7d
    FROM prospect_outreach_log
    WHERE sent_at >= NOW() - INTERVAL '7 days'
  `
  const coldSends7d = cold7Rows[0]?.cold_sends_7d ?? 0

  // 3. Determine cap.
  let cap = 5
  let reason = 'baseline'

  if (complaintRate >= 0.0030) {
    cap = 0
    reason = `BLOCK: complaint_rate ${(complaintRate * 100).toFixed(2)}% >= 0.30% (Gmail red line)`
  } else if (bounceRate >= 0.05) {
    cap = 0
    reason = `BLOCK: bounce_rate ${(bounceRate * 100).toFixed(2)}% >= 5% (list quality risk)`
  } else if (complaintRate >= 0.0020) {
    cap = 3
    reason = `THROTTLE: complaint_rate ${(complaintRate * 100).toFixed(2)}% >= 0.20%`
  } else if (complaintRate >= 0.0010 || bounceRate >= 0.02) {
    cap = 5
    reason = `HOLD: complaint_rate ${(complaintRate * 100).toFixed(2)}% or bounce_rate ${(bounceRate * 100).toFixed(2)}% near threshold`
  } else {
    // Clean — ramp by 7-day cold volume.
    if (coldSends7d < 10) {
      cap = 5
      reason = `RAMP wk1: cold_sends_7d=${coldSends7d} < 10`
    } else if (coldSends7d < 25) {
      cap = 8
      reason = `RAMP wk2: cold_sends_7d=${coldSends7d}`
    } else if (coldSends7d < 50) {
      cap = 12
      reason = `RAMP wk3: cold_sends_7d=${coldSends7d}`
    } else {
      cap = 15
      reason = `CEILING wk4+: cold_sends_7d=${coldSends7d} (split sending identity before raising)`
    }
  }

  // 4. Env override — operators can force a cap (e.g. during a known event
  // that would spike complaints unfairly). Logged so it's auditable.
  const overrideRaw = process.env.PROSPECT_CRON_CAP_OVERRIDE
  const envOverride = overrideRaw != null ? parseInt(overrideRaw, 10) : null
  if (envOverride != null && !isNaN(envOverride) && envOverride >= 0) {
    cap = envOverride
    reason = `${reason} (overridden by PROSPECT_CRON_CAP_OVERRIDE=${envOverride})`
  }

  return {
    cap,
    reason,
    metrics: {
      complaintRate,
      bounceRate,
      totalSends30d: m.emails,
      coldSends7d,
    },
    envOverride,
  }
}
