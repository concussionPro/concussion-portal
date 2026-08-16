/**
 * Stagger nurture email sends to protect domain reputation.
 *
 * Default cron behaviour was blasting every eligible email in <30 seconds:
 * 9 emails to a mix of Gmail / Hotmail / Yahoo all timestamped within the
 * same minute reads to inbox providers as automated marketing — exactly
 * the pattern they rate-limit, throttle to Promotions, or downgrade to
 * Updates. Sender reputation suffers, deliverability drops, real emails
 * end up in spam.
 *
 * Resend supports `scheduled_at` per email — the email is queued at our
 * end immediately, but Resend doesn't dispatch to the recipient's inbox
 * provider until the scheduled time. That lets us spread a batch across
 * an hour without keeping the cron alive that long.
 *
 * Strategy:
 *   1. Spread the batch across ~30-45 minutes (global spacing avg 30s).
 *   2. Per recipient-domain throttle: don't dispatch >1 to a single
 *      domain (gmail.com, hotmail.com, etc.) within 90 seconds. Inbox
 *      providers track sender→domain bursts.
 *   3. Random jitter ±20s so timestamps don't form an obviously regular
 *      pattern.
 *   4. Hard cap each schedule to within 4 hours of now (Resend doesn't
 *      hold sends much longer than that anyway).
 *
 * Transactional sends (post-purchase welcome, magic-link request from
 * /login, admin manual blasts) bypass this — they should fire ASAP.
 * Cron loops are the only callers that need the staggering.
 */

const GLOBAL_SPACING_MS = 30_000          // 30s average gap between any two sends
const DOMAIN_SPACING_MS = 90_000          // 90s minimum gap per recipient domain
const JITTER_MS = 20_000                  // ±20s random jitter
const MAX_OFFSET_MS = 4 * 60 * 60 * 1000  // never schedule more than 4h out

export class EmailScheduler {
  private domainNext = new Map<string, number>()
  private globalNext: number
  private readonly startMs: number
  private readonly globalSpacingMs: number
  private readonly domainSpacingMs: number

  constructor(
    startMs: number = Date.now(),
    // Overridable per lane (owner 2026-08-16: 30s "not large enough" for the
    // Q4 blast) — defaults unchanged for every existing caller.
    opts: { globalSpacingMs?: number; domainSpacingMs?: number } = {},
  ) {
    this.startMs = startMs
    this.globalNext = startMs
    this.globalSpacingMs = opts.globalSpacingMs ?? GLOBAL_SPACING_MS
    this.domainSpacingMs = opts.domainSpacingMs ?? DOMAIN_SPACING_MS
  }

  /** Returns an ISO datetime string for the `scheduled_at` field of a Resend send. */
  next(recipientEmail: string): string {
    const domain = recipientEmail.split('@')[1]?.toLowerCase() || 'unknown'
    const now = Date.now()
    const domainPrev = this.domainNext.get(domain) || 0

    // Base time: respect both global and per-domain backoff
    const base = Math.max(this.globalNext, domainPrev, now)
    // Jitter ±JITTER_MS/2 so consecutive sends aren't on round-second boundaries
    const jitter = (Math.random() - 0.5) * JITTER_MS
    let scheduled = base + jitter

    // Hard cap so we never schedule absurdly far out
    const maxAllowed = this.startMs + MAX_OFFSET_MS
    if (scheduled > maxAllowed) scheduled = maxAllowed
    // Floor at "now + 5s" — Resend rejects send times in the past
    if (scheduled < now + 5_000) scheduled = now + 5_000

    // Advance both pointers past this send. Each GAP is a fresh random draw
    // in [0.5x, 1.5x] of the configured spacing (owner 2026-08-16: "gaps also
    // have to be random durations not the same") — same mean, no fixed cadence
    // for a filter to fingerprint. Applies to every lane; means unchanged.
    this.globalNext = base + this.globalSpacingMs * (0.5 + Math.random())
    this.domainNext.set(domain, base + this.domainSpacingMs * (0.5 + Math.random()))

    return new Date(scheduled).toISOString()
  }
}
