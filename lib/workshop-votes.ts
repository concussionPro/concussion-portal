/**
 * Workshop date votes — one-click demand sensing from the date-announce email.
 *
 * The blast carries per-recipient HMAC-signed links ("I'd come to Melbourne —
 * Sat 31 Oct"); one GET records a named vote. Venues are booked on REAL fill
 * signal instead of hope (owner ask 2026-07-27: "click to nominate their
 * date/location again so i can see potential fill numbers").
 *
 * Distinct table — NOT workshop_interest — so the Ready-to-Train interest
 * lists stay clean; votes render in their own admin panel. Idempotent per
 * (email, city): re-clicks update the timestamp, never duplicate. 'none' is a
 * legitimate city value ("none of these dates work") — a negative signal is
 * still a signal.
 */
import crypto from 'crypto'
import { sql } from './db'

export const VOTE_CITIES = ['melbourne', 'byron-bay', 'sydney', 'none'] as const
export type VoteCity = (typeof VOTE_CITIES)[number]

function secret(): string {
  const s = process.env.SESSION_SECRET || process.env.MAGIC_LINK_SECRET
  if (!s) throw new Error('SESSION_SECRET or MAGIC_LINK_SECRET must be set')
  return s
}

/** Signature binds email+city so a link can't be replayed for another city/person. */
export function voteToken(email: string, city: string): string {
  return crypto
    .createHmac('sha256', secret())
    .update(`workshop-vote:${email.trim().toLowerCase()}:${city}`)
    .digest('hex')
    .slice(0, 24)
}

export function verifyVoteToken(email: string, city: string, token: string): boolean {
  const expected = voteToken(email, city)
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token))
  } catch {
    return false
  }
}

async function ensureTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS workshop_date_votes (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      city TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'date-blast',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (email, city)
    )
  `
}

export async function recordVote(args: { email: string; city: VoteCity; source: string }): Promise<void> {
  await ensureTable()
  const email = args.email.trim().toLowerCase()
  await sql`
    INSERT INTO workshop_date_votes (email, city, source)
    VALUES (${email}, ${args.city}, ${args.source})
    ON CONFLICT (email, city) DO UPDATE SET created_at = NOW(), source = EXCLUDED.source
  `
}

export interface DateVote {
  email: string
  city: string
  source: string
  created_at: string
}

export async function listVotes(): Promise<DateVote[]> {
  await ensureTable()
  const { rows } = await sql`
    SELECT email, city, source, created_at FROM workshop_date_votes ORDER BY created_at DESC
  `
  return rows as DateVote[]
}
