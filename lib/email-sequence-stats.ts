/**
 * Nurture-sequence stats helpers.
 *
 * email_audit_log is the source of truth for SENDS (audit rows are rolled
 * back on failed sends, so rows ≈ real sends). It only stores
 * (audit_key, sent_at) — the sequence is derivable from the audit_key
 * prefix written by app/api/cron/send-nurture-emails (and the one-off
 * admin blast endpoints). This module maps audit keys → the same
 * `sequence` tag values that the Resend webhook stores on email_events,
 * so audit-log send counts can be joined against delivered/opened/clicked
 * engagement per sequence.
 *
 * Keep the prefix list in sync with the audit keys written in:
 *   - app/api/cron/send-nurture-emails/route.ts
 *   - app/api/admin/* blast endpoints (melbourne, ai-course, etc.)
 */

/** Ordered prefix → sequence-tag mapping. First match wins. */
export const AUDIT_KEY_SEQUENCE_PREFIXES: ReadonlyArray<readonly [prefix: string, sequence: string]> = [
  ['scat_completion_upsell_', 'scat-completion-upsell'],
  ['scat_day10_engagement_', 'scat-mastery'],
  ['scat_day', 'scat-mastery'],
  ['onboard_day', 'post-purchase'],
  ['workshop_reservation_', 'workshop-reservation'],
  ['workshop_logistics_', 'workshop-logistics'],
  ['pre_workshop_', 'pre-workshop'],
  ['workshop_momentum_', 'workshop-momentum'],
  ['upgrade_day', 'online-upgrade'],
  ['reengagement_', 'reengagement'],
  ['free_almost_done_', 'free-almost-done'],
  ['almost_done_', 'almost-done'],
  ['ref_upgrade_', 'reference-upgrade'],
  ['ai_checklist_', 'ai-safety-checklist'],
  ['melbourne_eb_last_call_', 'melbourne-early-bird'],
  ['melbourne_warming_', 'melbourne-warming'],
  ['ai_course_launch_', 'ai-course-launch'],
  ['followup_scat_', 'scat-followup'],
  ['catch_up_', 'catch-up'],
] as const

/**
 * Map an email_audit_log.audit_key to its sequence tag.
 * Returns '(other)' for keys that don't match a known nurture prefix
 * (e.g. certificates, one-off transactional audit rows).
 */
export function sequenceFromAuditKey(auditKey: string): string {
  for (const [prefix, sequence] of AUDIT_KEY_SEQUENCE_PREFIXES) {
    if (auditKey.startsWith(prefix)) return sequence
  }
  return '(other)'
}

/**
 * True when the audit key marks a TEST / preview send (goes to Zac's
 * inbox, not a real recipient). Test rows must be excluded from every
 * business metric. Matches both the prospect-outreach convention
 * (`...:test:...`) and `_test_` / `test:` markers used by admin preview
 * endpoints.
 */
export function isTestAuditKey(auditKey: string): boolean {
  return auditKey.includes(':test:') || auditKey.includes('_test_') || auditKey.startsWith('test:')
}

/**
 * SQL CASE expression (Postgres) mirroring sequenceFromAuditKey, for use
 * inside aggregate queries over email_audit_log. Column name is
 * interpolated as a literal identifier — pass a trusted constant only.
 */
export function sequenceFromAuditKeySql(column = 'audit_key'): string {
  const cases = AUDIT_KEY_SEQUENCE_PREFIXES
    .map(([prefix, sequence]) => `WHEN ${column} LIKE '${prefix}%' THEN '${sequence}'`)
    .join('\n        ')
  return `CASE\n        ${cases}\n        ELSE '(other)'\n      END`
}
