/**
 * Gmail outbox — the queue for the WARM lane.
 *
 * Every warm email is a ROW first. Rows are born `draft`; only `approved` rows
 * are ever sent, and only by the gmail-outbox cron. Zac's rule
 * (2026-10-04): "no send until I sign off on copy" — approval is the send
 * gate, and nothing in this module sends.
 *
 * Gmail has no scheduled send, so the random-gap stagger lives here: the cron
 * releases due rows a few at a time with per-domain spacing, under a hard
 * daily ceiling so a bug can never burn zac@'s reputation.
 */
import { sql } from '@/lib/db'

export type OutboxStatus = 'draft' | 'approved' | 'sent' | 'failed' | 'cancelled'

export interface OutboxRow {
  id: number
  recipient: string
  subject: string
  text: string
  html: string | null
  sequence: string | null
  audit_key: string | null
  status: OutboxStatus
  not_before: string | null
  created_at: string
  sent_at: string | null
  gmail_message_id: string | null
  gmail_thread_id: string | null
  replied_at: string | null
  error: string | null
}

/** Hard ceiling per UTC day. Workspace allows 2,000; we never need more than this. */
export const GMAIL_DAILY_CAP = Number(process.env.GMAIL_DAILY_CAP || 100)
/** Average spacing between sends (random 0.5–1.5×) and the per-domain minimum. */
export const GMAIL_GLOBAL_GAP_MS = 45_000
export const GMAIL_DOMAIN_GAP_MS = 120_000
/** Rows released per cron tick — keeps one invocation well inside its timeout. */
export const GMAIL_BATCH_PER_TICK = 8

let ensured = false
export async function ensureGmailOutbox(): Promise<void> {
  if (ensured) return
  await sql`CREATE TABLE IF NOT EXISTS gmail_outbox (
    id BIGSERIAL PRIMARY KEY,
    recipient TEXT NOT NULL,
    subject TEXT NOT NULL,
    text TEXT NOT NULL,
    html TEXT,
    sequence TEXT,
    audit_key TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'draft',
    not_before TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    gmail_message_id TEXT,
    gmail_thread_id TEXT,
    replied_at TIMESTAMPTZ,
    error TEXT
  )`
  await sql`CREATE INDEX IF NOT EXISTS gmail_outbox_status_idx ON gmail_outbox (status, not_before)`
  await sql`CREATE TABLE IF NOT EXISTS gmail_replies (
    id BIGSERIAL PRIMARY KEY,
    recipient TEXT NOT NULL,
    outbox_id BIGINT,
    gmail_thread_id TEXT,
    replied_at TIMESTAMPTZ NOT NULL,
    snippet TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (gmail_thread_id)
  )`
  ensured = true
}

export interface EnqueueInput {
  to: string
  subject: string
  text: string
  html?: string | null
  sequence?: string | null
  /** Idempotency key — same key never creates a second row. */
  auditKey?: string | null
  /** Born approved only when the template itself has been signed off. */
  status?: Extract<OutboxStatus, 'draft' | 'approved'>
  notBefore?: Date | null
}

/** Insert a row. Returns the id, or null when the audit key already exists. */
export async function enqueueGmail(input: EnqueueInput): Promise<number | null> {
  await ensureGmailOutbox()
  const { rows } = await sql<{ id: number }>`
    INSERT INTO gmail_outbox (recipient, subject, text, html, sequence, audit_key, status, not_before)
    VALUES (${input.to.trim().toLowerCase()}, ${input.subject}, ${input.text}, ${input.html ?? null},
            ${input.sequence ?? null}, ${input.auditKey ?? null}, ${input.status ?? 'draft'}, ${input.notBefore ? input.notBefore.toISOString() : null})
    ON CONFLICT (audit_key) DO NOTHING
    RETURNING id`
  return rows[0]?.id ?? null
}

export async function approveGmail(ids: number[]): Promise<number> {
  await ensureGmailOutbox()
  if (!ids.length) return 0
  const { rowCount } = await sql`UPDATE gmail_outbox SET status = 'approved' WHERE id IN (SELECT jsonb_array_elements_text(${JSON.stringify(ids)}::jsonb)::bigint) AND status = 'draft'`
  return rowCount ?? 0
}

export async function cancelGmail(ids: number[]): Promise<number> {
  await ensureGmailOutbox()
  if (!ids.length) return 0
  const { rowCount } = await sql`UPDATE gmail_outbox SET status = 'cancelled' WHERE id IN (SELECT jsonb_array_elements_text(${JSON.stringify(ids)}::jsonb)::bigint) AND status IN ('draft','approved')`
  return rowCount ?? 0
}

export async function listGmailOutbox(status?: OutboxStatus, limit = 200): Promise<OutboxRow[]> {
  await ensureGmailOutbox()
  const { rows } = status
    ? await sql<OutboxRow>`SELECT * FROM gmail_outbox WHERE status = ${status} ORDER BY id DESC LIMIT ${limit}`
    : await sql<OutboxRow>`SELECT * FROM gmail_outbox ORDER BY id DESC LIMIT ${limit}`
  return rows
}

/** Sends so far today (UTC) — the daily-cap counter. */
export async function sentTodayCount(): Promise<number> {
  await ensureGmailOutbox()
  const { rows } = await sql<{ n: number }>`SELECT COUNT(*)::int AS n FROM gmail_outbox WHERE status = 'sent' AND sent_at >= DATE_TRUNC('day', NOW())`
  return rows[0]?.n ?? 0
}

/** Approved rows whose not_before has passed, oldest first. */
export async function dueApproved(limit: number): Promise<OutboxRow[]> {
  await ensureGmailOutbox()
  const { rows } = await sql<OutboxRow>`
    SELECT * FROM gmail_outbox
    WHERE status = 'approved' AND (not_before IS NULL OR not_before <= NOW())
    ORDER BY id ASC LIMIT ${limit}`
  return rows
}

/** Last send time per domain, for the per-domain gap (looks back one hour). */
export async function lastSentByDomain(): Promise<Map<string, number>> {
  const { rows } = await sql<{ domain: string; last: string }>`
    SELECT SPLIT_PART(recipient, '@', 2) AS domain, MAX(sent_at) AS last
    FROM gmail_outbox WHERE status = 'sent' AND sent_at > NOW() - INTERVAL '1 hour'
    GROUP BY 1`
  return new Map(rows.map((r) => [r.domain, new Date(r.last).getTime()]))
}

export async function markSent(id: number, messageId: string, threadId: string): Promise<void> {
  await sql`UPDATE gmail_outbox SET status = 'sent', sent_at = NOW(), gmail_message_id = ${messageId}, gmail_thread_id = ${threadId}, error = NULL WHERE id = ${id}`
}

export async function markFailed(id: number, error: string): Promise<void> {
  await sql`UPDATE gmail_outbox SET status = 'failed', error = ${error.slice(0, 500)} WHERE id = ${id}`
}

/** Sent rows worth checking for a reply: threaded, sent in the last 14 days, not yet replied. */
export async function sentAwaitingReply(limit = 60): Promise<OutboxRow[]> {
  await ensureGmailOutbox()
  const { rows } = await sql<OutboxRow>`
    SELECT * FROM gmail_outbox
    WHERE status = 'sent' AND gmail_thread_id IS NOT NULL AND replied_at IS NULL
      AND sent_at > NOW() - INTERVAL '14 days'
    ORDER BY sent_at DESC LIMIT ${limit}`
  return rows
}

export async function recordReply(row: OutboxRow, repliedAt: Date, snippet: string): Promise<boolean> {
  const { rowCount } = await sql`
    INSERT INTO gmail_replies (recipient, outbox_id, gmail_thread_id, replied_at, snippet)
    VALUES (${row.recipient}, ${row.id}, ${row.gmail_thread_id}, ${repliedAt.toISOString()}, ${snippet.slice(0, 300)})
    ON CONFLICT (gmail_thread_id) DO NOTHING`
  await sql`UPDATE gmail_outbox SET replied_at = ${repliedAt.toISOString()} WHERE id = ${row.id}`
  return (rowCount ?? 0) > 0
}

/** Recipients who replied recently — every sequence must skip them. Fail-open (empty set) on error, logged. */
export async function recentRepliers(days = 30): Promise<Set<string>> {
  try {
    await ensureGmailOutbox()
    const { rows } = await sql<{ recipient: string }>`SELECT DISTINCT LOWER(recipient) AS recipient FROM gmail_replies WHERE replied_at > NOW() - (${days} || ' days')::interval`
    return new Set(rows.map((r) => r.recipient))
  } catch (err) {
    console.error('[gmail] recentRepliers failed — treating as none:', err)
    return new Set()
  }
}

/**
 * While MARKETING_EMAILS_PAUSED=true the lane may still deliver to Zac's own
 * addresses, so the pipe can be proven without a customer ever receiving a
 * test. Everything else waits for the pause to lift.
 */
export const GMAIL_SELF_ADDRESSES = new Set([
  'zac@concussion-education-australia.com',
  'info@concussion-education-australia.com',
  'z.lew87@gmail.com',
])
export function allowedWhilePaused(recipient: string): boolean {
  const r = recipient.trim().toLowerCase()
  if (GMAIL_SELF_ADDRESSES.has(r)) return true
  // GMAIL_TEST_ALLOWLIST: comma-separated extra addresses Zac names for a
  // placement test (his own other mailboxes), honoured only while paused.
  const extra = (process.env.GMAIL_TEST_ALLOWLIST || '').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean)
  return extra.includes(r)
}
