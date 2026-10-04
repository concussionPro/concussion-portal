import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import {
  GMAIL_BATCH_PER_TICK,
  GMAIL_DAILY_CAP,
  GMAIL_DOMAIN_GAP_MS,
  GMAIL_GLOBAL_GAP_MS,
  allowedWhilePaused,
  dueApproved,
  lastSentByDomain,
  markFailed,
  markSent,
  recordReply,
  sentAwaitingReply,
  sentTodayCount,
} from '@/lib/gmail/outbox'
import { gmailConfigured, gmailSend, gmailThreadMessages, isReplyFromOtherSide } from '@/lib/gmail/client'
import { isEmailSuppressed } from '@/lib/email-suppression'

/**
 * Gmail outbox cron — the ONLY thing that sends on the warm lane.
 *
 * Every tick: (1) release due APPROVED rows with random gaps, per-domain
 * spacing and the daily cap; (2) read recent sent threads for replies and
 * record them so every sequence stops for that person.
 *
 * Gates, in order: cron secret → Gmail configured → row approved → recipient
 * not suppressed → (pause on ⇒ recipient must be one of Zac's own addresses).
 * The marketing pause does NOT stop this cron, because the pause exists to
 * stop machine mail to customers while the pipe is proven — and proving the
 * pipe means sending to ourselves.
 */
export const dynamic = 'force-dynamic'
export const maxAge = 0

function authorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const header = request.headers.get('authorization') || ''
  const expected = `Bearer ${secret}`
  if (header.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(header), Buffer.from(expected))
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function GET(request: Request) {
  try {
    const prodUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || ''
    if (prodUrl && !prodUrl.includes('concussion-education-australia.com')) {
      return NextResponse.json({ skipped: true, reason: 'Not primary project' })
    }
    if (!authorised(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!gmailConfigured()) return NextResponse.json({ skipped: true, reason: 'gmail not configured' })

    const paused = process.env.MARKETING_EMAILS_PAUSED === 'true'
    const summary = { sent: 0, held: 0, skipped: 0, failed: 0, replies: 0, cap: GMAIL_DAILY_CAP, paused }

    // ── 1. release due approved rows ─────────────────────────────────────
    const already = await sentTodayCount()
    const room = Math.max(0, GMAIL_DAILY_CAP - already)
    const batch = Math.min(room, GMAIL_BATCH_PER_TICK)
    const domainLast = await lastSentByDomain()
    const due = batch > 0 ? await dueApproved(batch * 3) : []
    let released = 0
    let nextGlobal = Date.now()
    for (const row of due) {
      if (released >= batch) break
      if (paused && !allowedWhilePaused(row.recipient)) { summary.held++; continue }
      if (await isEmailSuppressed(row.recipient)) {
        await markFailed(row.id, 'suppressed')
        summary.skipped++
        continue
      }
      const domain = row.recipient.split('@')[1] || ''
      const domainReady = (domainLast.get(domain) || 0) + GMAIL_DOMAIN_GAP_MS
      const at = Math.max(nextGlobal, domainReady)
      const wait = at - Date.now()
      if (wait > 4 * 60_000) { summary.held++; continue } // this domain goes next tick
      if (wait > 0) await sleep(wait)
      try {
        const r = await gmailSend({ to: row.recipient, subject: row.subject, text: row.text, html: row.html || undefined })
        await markSent(row.id, r.id, r.threadId)
        summary.sent++
        released++
        domainLast.set(domain, Date.now())
        nextGlobal = Date.now() + GMAIL_GLOBAL_GAP_MS * (0.5 + Math.random())
      } catch (err) {
        await markFailed(row.id, err instanceof Error ? err.message : String(err))
        summary.failed++
      }
    }

    // ── 2. reply detection ───────────────────────────────────────────────
    for (const row of await sentAwaitingReply()) {
      try {
        const msgs = await gmailThreadMessages(row.gmail_thread_id as string)
        const reply = msgs.find((m) => isReplyFromOtherSide(m.from))
        if (reply) {
          const at = reply.internalDate ? new Date(reply.internalDate) : new Date()
          if (await recordReply(row, at, reply.snippet)) summary.replies++
        }
      } catch (err) {
        console.error(`[gmail] reply check failed for outbox ${row.id}:`, err instanceof Error ? err.message : err)
      }
    }

    console.log('[gmail-outbox]', JSON.stringify(summary))
    return NextResponse.json(summary)
  } catch (err) {
    console.error('[gmail-outbox] run failed:', err)
    return NextResponse.json({ error: 'run failed' }, { status: 500 })
  }
}
