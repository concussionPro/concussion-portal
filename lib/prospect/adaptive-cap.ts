/**
 * Adaptive daily cap for cold-outreach cron.
 *
 * Replaces the static PROSPECT_CRON_DAILY_CAP env var with a data-driven
 * cap that ramps up when cold outreach is clean and throttles down when
 * cold complaints or bounces spike. Designed to maximise throughput while
 * defending shared sending-identity reputation.
 *
 * TWO signal windows:
 *
 *   A) 30-day TOTAL domain (CEA project, all channels) — safety net only.
 *      Catches catastrophic reputation events that would block Gmail/Yahoo
 *      delivery regardless of which channel caused them.
 *      Triggers:
 *        total complaint >= 0.30% (Gmail red line) → BLOCK (cap=0)
 *        total bounce    >= 5%                     → BLOCK
 *
 *   B) 7-day COLD-only (cross-referenced via prospect_outreach_log
 *      resend_email_ids) — primary ramp signal. What cold outreach has
 *      actually done recently, not a 30-day average that includes
 *      historical nurture complaints unrelated to cold.
 *      Triggers:
 *        cold complaint >= 1.0% → THROTTLE (cap=3)
 *        cold bounce    >= 8%   → THROTTLE (cap=3)
 *        cold complaint >= 0.5% → HOLD     (cap=5)
 *
 * Ramp ladder (BOTH gates clear — per Zac 2026-06-08, domain proven clean
 * over 612 sends; tiers bumped to drain the queue faster):
 *   - cold_sends_7d <   5  →  cap = 20   (Day-1 baseline)
 *   - cold_sends_7d <  30  →  cap = 35   (Week 1)
 *   - cold_sends_7d <  80  →  cap = 50   (Week 2)
 *   - cold_sends_7d < 200  →  cap = 75   (Week 3)
 *   - cold_sends_7d ≥ 200  →  cap = 100  (ceiling — split identity past this)
 *
 * Test-mode previews (audit_key contains ':test:') go to Zac's inbox, not
 * prospects — they're excluded from cold_sends_7d so previewing templates
 * can't inflate the ramp signal.
 *
 * PROSPECT_CRON_CAP_OVERRIDE env can force a cap for one-off events.
 * Adaptive value is always computed and logged either way.
 */
import { sql } from '@/lib/db'

export interface CapDecision {
  cap: number
  reason: string
  metrics: {
    // 30-day total domain (safety net)
    totalSends30d: number
    totalComplaintRate30d: number
    totalBounceRate30d: number
    // 7-day cold-only (primary signal)
    coldSends7d: number
    coldComplaints7d: number
    coldBounces7d: number
    coldComplaintRate7d: number
    coldBounceRate7d: number
  }
  envOverride: number | null
}

export async function computeAdaptiveCap(): Promise<CapDecision> {
  // ── A. 30-day total domain (safety net) ──
  const { rows: domain30 } = await sql<{
    emails: number
    complaints: number
    bounces: number
  }>`
    WITH per_email AS (
      SELECT
        email_id,
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

  const d = domain30[0] || { emails: 0, complaints: 0, bounces: 0 }
  const totalComplaintRate30d = d.emails > 0 ? d.complaints / d.emails : 0
  const totalBounceRate30d = d.emails > 0 ? d.bounces / d.emails : 0

  // ── B. 7-day cold-only — join email_events to prospect_outreach_log via
  // resend_email_id. Excludes sentinel rows (resend_email_id NULL).
  const { rows: cold7 } = await sql<{
    sends: number
    complaints: number
    bounces: number
  }>`
    WITH cold_sent AS (
      SELECT resend_email_id
      FROM prospect_outreach_log
      WHERE sent_at >= NOW() - INTERVAL '7 days'
        AND resend_email_id IS NOT NULL
        AND audit_key NOT LIKE '%:test:%'
    ),
    cold_events AS (
      SELECT
        ee.email_id,
        MAX(CASE WHEN ee.event_type = 'complained' THEN 1 ELSE 0 END) AS complained,
        MAX(CASE WHEN ee.event_type = 'bounced'    THEN 1 ELSE 0 END) AS bounced
      FROM email_events ee
      JOIN cold_sent cs ON cs.resend_email_id = ee.email_id
      GROUP BY ee.email_id
    ),
    cold_send_count AS (
      SELECT COUNT(*)::int AS n FROM cold_sent
    )
    SELECT
      (SELECT n FROM cold_send_count)            AS sends,
      COALESCE(SUM(complained), 0)::int          AS complaints,
      COALESCE(SUM(bounced), 0)::int             AS bounces
    FROM cold_events
  `

  const c = cold7[0] || { sends: 0, complaints: 0, bounces: 0 }
  const coldComplaintRate7d = c.sends > 0 ? c.complaints / c.sends : 0
  const coldBounceRate7d = c.sends > 0 ? c.bounces / c.sends : 0

  // ── C. Decision ──
  let cap = 8
  let reason = 'baseline (clean)'

  // Min sample size for cold-only rate triggers. Below this, a single
  // bounce on a small sample (e.g. 2 of 22 = 9%) statistically dominates
  // and throttles us unfairly. Require ≥50 cold sends in 7d before the
  // bounce/complaint rate signals kick in.
  const MIN_COLD_SENDS_FOR_RATE_TRIGGERS = 50

  // Safety net: 30-day total domain catastrophes (these ALWAYS apply
  // regardless of cold sample size — they're about the whole sending
  // identity, not just cold).
  if (totalComplaintRate30d >= 0.0030) {
    cap = 0
    reason = `BLOCK: 30d total complaint ${(totalComplaintRate30d * 100).toFixed(2)}% >= 0.30% (Gmail red line)`
  } else if (totalBounceRate30d >= 0.05) {
    cap = 0
    reason = `BLOCK: 30d total bounce ${(totalBounceRate30d * 100).toFixed(2)}% >= 5% (list quality risk)`
  // Cold-specific reputation collapse (require min sample size).
  } else if (c.sends >= MIN_COLD_SENDS_FOR_RATE_TRIGGERS && coldComplaintRate7d >= 0.010) {
    cap = 3
    reason = `THROTTLE: cold complaint 7d ${(coldComplaintRate7d * 100).toFixed(2)}% >= 1.0% (n=${c.sends})`
  } else if (c.sends >= MIN_COLD_SENDS_FOR_RATE_TRIGGERS && coldBounceRate7d >= 0.08) {
    cap = 3
    reason = `THROTTLE: cold bounce 7d ${(coldBounceRate7d * 100).toFixed(2)}% >= 8% (n=${c.sends})`
  } else if (c.sends >= MIN_COLD_SENDS_FOR_RATE_TRIGGERS && coldComplaintRate7d >= 0.005) {
    cap = 5
    reason = `HOLD: cold complaint 7d ${(coldComplaintRate7d * 100).toFixed(2)}% >= 0.5% (n=${c.sends})`
  } else {
    // Either clean OR sample-too-small to read — ramp by 7-day cold volume.
    // Per Zac 2026-06-08: domain proven clean over 612 sends (1.14% bounce,
    // 0.33% complain — the 0.33% was a CSRF unsubscribe bug now fixed, not a
    // list quality issue). Ramp tiers bumped to drain the 881-queue faster.
    // 881 ÷ 75/day ≈ 18-22 BD; 881 ÷ 100/day ≈ 13-17 BD.
    if (c.sends < 5) {
      cap = 20
      reason = `RAMP-DAY1 (baseline 20): cold_sends_7d=${c.sends}`
    } else if (c.sends < 30) {
      cap = 35
      reason = `RAMP-WK1 (35): cold_sends_7d=${c.sends}`
    } else if (c.sends < 80) {
      cap = 50
      reason = `RAMP-WK2 (50): cold_sends_7d=${c.sends}`
    } else if (c.sends < 200) {
      cap = 75
      reason = `RAMP-WK3 (75): cold_sends_7d=${c.sends}`
    } else {
      cap = 100
      reason = `CEILING (100): cold_sends_7d=${c.sends} — split sending identity before raising further`
    }
  }

  // Env override — operators can force a cap for one-off events.
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
      totalSends30d: d.emails,
      totalComplaintRate30d,
      totalBounceRate30d,
      coldSends7d: c.sends,
      coldComplaints7d: c.complaints,
      coldBounces7d: c.bounces,
      coldComplaintRate7d,
      coldBounceRate7d,
    },
    envOverride,
  }
}
