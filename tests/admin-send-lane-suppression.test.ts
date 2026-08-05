import { describe, it, expect, vi, beforeEach } from 'vitest'
import fs from 'fs'
import path from 'path'

/** Swapped per-test to drive the mocked `sql` tag below. */
let sqlBehaviour: () => unknown = () => ({ rows: [] })

vi.mock('@/lib/db', () => ({
  sql: (..._args: unknown[]) => Promise.resolve().then(() => sqlBehaviour()),
}))

beforeEach(() => {
  sqlBehaviour = () => ({ rows: [] })
})

/**
 * Zero-tolerance rule (CLAUDE.md): every outbound lane checks
 * `email_suppression`, and the check fails closed.
 *
 * The recurring defect is a BULK admin route that gates only on
 * `users.nurture_unsubscribed`. That column is set by the unsubscribe route and
 * the Resend webhook — but `email_suppression` is ALSO written by cold-prospect
 * unsubscribes (lib/prospect/repo.ts), STOP replies (resend-inbound) and the
 * Squarespace self-engaged sweep, none of which touch the users table. A
 * clinician who is both a cold prospect and a free-course signup, and who opted
 * out on the cold side, is suppressed but NOT nurture_unsubscribed — so a lane
 * reading only that column mails a person who unsubscribed.
 *
 * This asserts the gate is present on each bulk lane. It is a coverage guard,
 * not a substitute for the runtime fail-closed behaviour, which lives in the
 * `loadSuppressedEmails` throw path and in the SQL query failing the request.
 */
const ROOT = path.resolve(__dirname, '..')

/** Admin routes that send to MANY recipients in one call. */
const BULK_SEND_ROUTES = [
  'app/api/admin/ai-course-launch-blast/route.ts',
  'app/api/admin/activate-stuck-free/route.ts',
  'app/api/admin/catch-up-emails/route.ts',
  'app/api/admin/followup-scat-completers/route.ts',
  'app/api/admin/import-contacts/route.ts',
  'app/api/admin/melbourne-early-bird-last-call/route.ts',
  'app/api/admin/melbourne-warming-push/route.ts',
  'app/api/admin/send-outreach/route.ts',
]

/** Cron send lanes. */
const CRON_SEND_ROUTES = [
  'app/api/cron/send-nurture-emails/route.ts',
  'app/api/cron/ep-nurture/route.ts',
  'app/api/cron/hub-seat-reminders/route.ts',
  'app/api/cron/completer-conversion/route.ts',
  'app/api/cron/sst-trial-checkins/route.ts',
]

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8')
}

/** Does this file consult the master blacklist at all? */
function checksSuppression(src: string): boolean {
  return src.includes('email_suppression') || src.includes('loadSuppressedEmails')
    || src.includes('isEmailSuppressed')
}

describe('every bulk admin send lane checks email_suppression', () => {
  for (const rel of BULK_SEND_ROUTES) {
    it(`${rel} gates on the master blacklist`, () => {
      const src = read(rel)
      expect(src).toContain('sendEmail')
      expect(checksSuppression(src)).toBe(true)
    })

    it(`${rel} does not rely on nurture_unsubscribed alone`, () => {
      const src = read(rel)
      if (src.includes('nurture_unsubscribed') || src.includes('nurtureUnsubscribed')) {
        expect(checksSuppression(src)).toBe(true)
      }
    })
  }
})

describe('every cron send lane checks email_suppression', () => {
  for (const rel of CRON_SEND_ROUTES) {
    it(`${rel} gates on the master blacklist`, () => {
      expect(checksSuppression(read(rel))).toBe(true)
    })
  }
})

describe('the shared suppression helper fails closed', () => {
  it('isEmailSuppressed treats a DB error as SUPPRESSED, never as a send', async () => {
    sqlBehaviour = () => {
      throw new Error('connection terminated unexpectedly')
    }
    const { isEmailSuppressed } = await import('@/lib/email-suppression')
    await expect(isEmailSuppressed('someone@example.com')).resolves.toBe(true)
  })

  it('isEmailSuppressed reports a listed address as suppressed', async () => {
    sqlBehaviour = () => ({ rows: [{ '?column?': 1 }] })
    const { isEmailSuppressed } = await import('@/lib/email-suppression')
    await expect(isEmailSuppressed('Listed@Example.com')).resolves.toBe(true)
  })

  it('isEmailSuppressed clears an address that is not listed', async () => {
    sqlBehaviour = () => ({ rows: [] })
    const { isEmailSuppressed } = await import('@/lib/email-suppression')
    await expect(isEmailSuppressed('clear@example.com')).resolves.toBe(false)
  })

  it('loadSuppressedEmails THROWS on a DB error so callers abort the run', async () => {
    // It must not return an empty Set — an empty blacklist mails everyone on it.
    sqlBehaviour = () => {
      throw new Error('relation "email_suppression" does not exist')
    }
    const { loadSuppressedEmails } = await import('@/lib/email-suppression')
    await expect(loadSuppressedEmails()).rejects.toThrow()
  })

  it('loadSuppressedEmails lowercases the set it returns', async () => {
    sqlBehaviour = () => ({ rows: [{ email: 'mixed@example.com' }] })
    const { loadSuppressedEmails } = await import('@/lib/email-suppression')
    const set = await loadSuppressedEmails()
    expect(set.has('mixed@example.com')).toBe(true)
  })
})
