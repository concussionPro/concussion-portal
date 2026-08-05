/**
 * The master blacklist — `email_suppression`.
 *
 * It is populated from MORE sources than `users.nurture_unsubscribed`:
 * Resend hard bounces + complaints (app/api/webhooks/resend), STOP replies
 * (app/api/webhooks/resend-inbound), cold-prospect unsubscribes
 * (lib/prospect/repo.ts `suppress`), the Squarespace self-engaged sweep, and
 * `unsubscribeUser`. Anything that reads ONLY `users.nurture_unsubscribed`
 * therefore misses a real unsubscribe — most commonly a clinician who is both
 * a cold prospect and a free-course signup, who opted out on the cold side.
 *
 * Every send lane checks this table, and every check FAILS CLOSED: on a DB
 * error we treat the address as suppressed rather than send. Unsubs are
 * zero-tolerance.
 */
import { sql } from '@/lib/db'

/**
 * Is this single address on the master blacklist?
 * FAIL CLOSED — a DB error returns `true` (skip the send).
 */
export async function isEmailSuppressed(email: string): Promise<boolean> {
  try {
    // trim() as well as toLowerCase(): several callers hand us an address taken
    // straight from a request body without format validation (the Squarespace
    // webhook's arbitrary form fields, the admin test-send route), and a single
    // trailing space would otherwise miss the row and send. LOWER() on the
    // stored column too — the table is plain TEXT with no lowercase constraint,
    // so a mixed-case row from a manual insert or an import must still match.
    const { rows } = await sql`
      SELECT 1 FROM email_suppression
      WHERE LOWER(TRIM(email)) = ${email.trim().toLowerCase()} LIMIT 1
    `
    return rows.length > 0
  } catch (err) {
    console.error(
      `[suppression] check failed for ${email.slice(0, 3)}*** — treating as suppressed (fail closed):`,
      err,
    )
    return true
  }
}

/**
 * The whole blacklist as a lowercased Set, for loops that would otherwise do
 * one query per recipient.
 *
 * THROWS on a DB error — the caller must abort the run rather than proceed
 * with an empty set (an empty set would mail every suppressed address).
 */
export async function loadSuppressedEmails(): Promise<Set<string>> {
  const { rows } = await sql<{ email: string }>`
    SELECT LOWER(email) AS email FROM email_suppression
  `
  return new Set(rows.map((r) => r.email))
}
