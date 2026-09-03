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

/**
 * NON-ADMIN marketing/lifecycle send paths. The two lists above only ever
 * covered admin + cron, so the entire webhook tree and every public lead-magnet
 * route sat outside CI — and all of them were sending unchecked:
 *
 *  - the Stripe webhook's payment-recovery and abandoned-checkout emails gated
 *    ONLY on users.nurture_unsubscribed, which is useless here because a failed
 *    or abandoned checkout usually has NO users row at all, and both guards
 *    additionally `catch { proceed }` (fail OPEN);
 *  - the Squarespace form webhook created an account and started the nurture
 *    sequence off an unauthenticated third-party payload;
 *  - the certificate completion upsell failed open the same way;
 *  - every public Day-0 lead magnet re-entered a suppressed clinician into
 *    marketing the moment any form was filled in with their address.
 *
 * Transactional paths (magic links, receipts, certificates, clinical alerts)
 * are deliberately NOT listed — those must still reach a suppressed address.
 */
const MARKETING_SEND_PATHS = [
  'app/api/webhooks/stripe/route.ts',
  'app/api/webhooks/squarespace/route.ts',
  'app/api/certificate/route.ts',
  'app/api/test/send-nurture/route.ts',
  'app/api/signup-free/route.ts',
  'app/api/signup-squarespace/route.ts',
  'app/api/email-gate/route.ts',
  'app/api/ep-lead/route.ts',
  'app/api/intl-syllabus/route.ts',
  'app/api/lead-magnet/ai-safety-checklist/route.ts',
  'app/api/lead-magnet/ppcs-waitlist/route.ts',
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

describe('webhook + public marketing send paths check email_suppression', () => {
  for (const rel of MARKETING_SEND_PATHS) {
    it(`${rel} gates on the master blacklist`, () => {
      expect(checksSuppression(read(rel))).toBe(true)
    })

    it(`${rel} does not rely on nurture_unsubscribed alone`, () => {
      const src = read(rel)
      if (src.includes('nurture_unsubscribed') || src.includes('nurtureUnsubscribed')) {
        expect(checksSuppression(src)).toBe(true)
      }
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

/**
 * DIRECTORY WALK — the part that is actually load-bearing.
 *
 * Everything above iterates HARDCODED path arrays, and those arrays are exactly
 * the files the commit that wrote them had already fixed. A test that only
 * checks the routes you just fixed cannot tell you about the route you missed:
 * this suite was fully green while app/api/lead-magnet/team-training-inquiry
 * (the THIRD route in a directory whose other two it does list),
 * app/api/preseason/register, app/api/register-interest and
 * app/api/talk-request were all mailing suppressed addresses.
 *
 * So: walk app/api/** ourselves. Any route that can send mail must either
 * consult the master blacklist or be named below with a reason. Adding a new
 * mailing route now fails CI until someone makes that call explicitly.
 */
const API_ROOT = path.join(ROOT, 'app/api')

function walkRoutes(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walkRoutes(full, out)
    else if (/^route\.tsx?$/.test(entry.name)) out.push(path.relative(ROOT, full))
  }
  return out
}

/** Does this file send mail at all (directly or via the shared client)? */
function sendsMail(src: string): boolean {
  return /\bsendEmail\s*\(/.test(src)
    || /\bsendEmailWithAttachment\s*\(/.test(src)
    || /resend\.emails\.send/.test(src)
    || /api\.resend\.com\/emails/.test(src)
}

/**
 * Routes that may mail a suppressed address, each for a stated reason.
 * TRANSACTIONAL = the recipient paid for or requested this specific thing and
 * withholding it breaks their access. INTERNAL = only ever mails Zac.
 * Nothing here may carry a `sequence` tag or List-Unsubscribe headers.
 */
const MAY_MAIL_SUPPRESSED: Record<string, string> = {
  // --- internal: alerts to the operator, never to a contact ---
  // The recipient is hardcoded to zac@concussion-education-australia.com. It is
  // an outage alert about the paid product, not a message to any customer, so
  // there is no contact whose unsubscribe could be violated. Added 2026-08-06,
  // when this guard correctly caught the route the day it was written.
  'app/api/cron/synthetic-journey/route.ts': 'internal — outage alert to the operator only, hardcoded recipient',

  // --- transactional: access, money, clinical ---
  'app/api/admin/create-user/route.ts': 'transactional — operator-created account + its login link',
  // Buyer explicitly types their own address to receive their own Stripe
  // checkout URL (hospital-network redirect rescue, 2026-09-03). Strictly a
  // self-service transactional send: one recipient, one checkout.stripe.com
  // link, no marketing content — the same class as a receipt.
  'app/api/checkout-link-email/route.ts': 'transactional — buyer self-requests their own checkout link',
  'app/api/admin/resend-purchase-welcome/route.ts': 'transactional — replaces a paid buyer’s magic link',
  'app/api/admin/tax-invoice/send/route.ts': 'transactional — ATO tax invoice for a completed purchase',
  'app/api/clinical-testing/clinic/route.ts': 'transactional — clinic provisioning + access code',
  'app/api/platform/founding/route.ts': 'transactional — clinic code and hub link; doubles as link recovery',
  'app/api/preseason/submit/route.ts': 'transactional — the athlete’s own baseline result',
  'app/api/sst/start/route.ts': 'transactional — trial clinic code + magic login',
  // --- internal: recipient is always CONFIG.CONTACT_EMAIL ---
  'app/api/admin/send-gp-report-sample/route.ts': 'internal — sample to Zac',
  'app/api/admin/send-portal-preview/route.ts': 'internal — preview to Zac',
  'app/api/admin/send-prospect-brief/route.ts': 'internal — brief to Zac',
  'app/api/admin/send-sample-pitch/route.ts': 'internal — sample to Zac',
  'app/api/admin/send-sample-partner-pitch/route.ts': 'internal — sample to Zac',
  'app/api/admin/send-sst-sequence-preview/route.ts': 'internal — preview to Zac',
  'app/api/admin/system-health/route.ts': 'internal — health alert to Zac',
  'app/api/admin/test-emails/route.ts': 'internal — admin-key gated test harness',
  'app/api/prospect/[token]/track/route.ts': 'internal — engagement alert to Zac',
  'app/api/cron/ai-course-content-refresh/route.ts': 'internal — owner digest',
  'app/api/cron/analytics-review/route.ts': 'internal — owner digest',
  'app/api/cron/daily-outreach-report/route.ts': 'internal — owner digest',
  'app/api/cron/lead-scoring/route.ts': 'internal — owner digest',
  'app/api/cron/monitoring/route.ts': 'internal — owner digest',
  'app/api/cron/publish-scheduled-blog/route.ts': 'internal — owner digest',
  'app/api/cron/video-link-check/route.ts': 'internal — owner digest',
}

describe('EVERY mailing route under app/api is accounted for', () => {
  const mailing = walkRoutes(API_ROOT).filter((rel) => sendsMail(read(rel))).sort()

  it('finds a non-trivial number of mailing routes (the walk itself works)', () => {
    expect(mailing.length).toBeGreaterThan(30)
  })

  for (const rel of mailing) {
    it(`${rel} checks suppression or is an explicit exception`, () => {
      const guarded = checksSuppression(read(rel))
      const exempt = rel in MAY_MAIL_SUPPRESSED
      if (!guarded && !exempt) {
        throw new Error(
          `${rel} can send email but never consults email_suppression.\n` +
          'Either gate the send on isEmailSuppressed(), or add it to ' +
          'MAY_MAIL_SUPPRESSED with the reason it is transactional/internal.'
        )
      }
      expect(guarded || exempt).toBe(true)
    })
  }

  it('the exception list has no stale entries', () => {
    const all = new Set(walkRoutes(API_ROOT))
    for (const rel of Object.keys(MAY_MAIL_SUPPRESSED)) {
      expect(all.has(rel), `${rel} is exempted but no longer exists`).toBe(true)
    }
  })

  it('no route exempted as TRANSACTIONAL carries bulk-mail markers', () => {
    // One-Click unsubscribe headers mean the code itself considers the send
    // bulk — which disqualifies it from a "transactional" exemption. This is
    // how app/api/ready-to-train was caught: a logged-in buyer's city
    // nomination confirmation, shipped with List-Unsubscribe and no blacklist
    // check, because being authenticated was mistaken for consent.
    //
    // INTERNAL routes are deliberately not checked: a preview or sample of a
    // marketing email sent to Zac legitimately contains the header, because it
    // is a copy of the real thing.
    for (const [rel, reason] of Object.entries(MAY_MAIL_SUPPRESSED)) {
      if (!reason.startsWith('transactional')) continue
      expect(
        /List-Unsubscribe/i.test(read(rel)),
        `${rel} is exempted as transactional but sets List-Unsubscribe — it is a marketing lane`
      ).toBe(false)
    }
  })
})

/**
 * The inverse failure mode: over-suppression. A transactional path that bails
 * on the blacklist locks a paying customer out of what they bought. Two were
 * shipped that way and are fixed above; these lock the fix in.
 */
describe('suppression never blocks access, only marketing', () => {
  it('signup-free sets the session cookie even for a suppressed address', () => {
    const src = read('app/api/signup-free/route.ts')
    const guard = src.indexOf('isEmailSuppressed(email)')
    const cookie = src.indexOf("response.cookies.set('session'")
    expect(guard).toBeGreaterThan(-1)
    expect(cookie).toBeGreaterThan(-1)
    // the guard must NOT return before the cookie is issued
    expect(src.slice(guard, cookie)).not.toMatch(/return NextResponse\.json\([^)]*suppressed/)
  })

  it('clinical-testing/team grants the SST entitlement outside the suppression branch', () => {
    const src = read('app/api/clinical-testing/team/route.ts')
    const grant = src.indexOf('grantSstEntitlement(')
    const guard = src.indexOf('FROM email_suppression')
    expect(grant).toBeGreaterThan(-1)
    expect(guard).toBeGreaterThan(-1)
    expect(grant, 'the seat entitlement must be granted before the send-lane check').toBeLessThan(guard)
  })
})
