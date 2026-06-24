/**
 * SST Trainer subscription store — ISOLATED from the course `users` table.
 *
 * The SST in-dashboard app is a recurring subscription (monthly/annual). Access
 * is granted by an active row in `sst_subscriptions` (see
 * scripts/sql/sst-subscriptions.sql). App-store users (free, clinic-code) never
 * touch this table — this is purely the paid in-dashboard tier.
 *
 * Kept deliberately separate from lib/users.ts so SST billing can never affect
 * the live one-time course-access path.
 */
import { sql } from '@/lib/db'
import crypto from 'crypto'

export type SstPlan = 'monthly' | 'annual'

export interface SstSubscription {
  id: string
  email: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  plan?: SstPlan
  status: string
  currentPeriodEnd?: string
  cancelAtPeriodEnd: boolean
}

/** Stripe statuses that grant access to the in-dashboard SST app. */
const ACTIVE_STATUSES = new Set(['active', 'trialing', 'past_due'])

function mapRow(row: Record<string, unknown>): SstSubscription {
  return {
    id: row.id as string,
    email: row.email as string,
    stripeCustomerId: (row.stripe_customer_id as string) || undefined,
    stripeSubscriptionId: (row.stripe_subscription_id as string) || undefined,
    plan: (row.plan as SstPlan) || undefined,
    status: row.status as string,
    currentPeriodEnd: row.current_period_end ? new Date(row.current_period_end as string).toISOString() : undefined,
    cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
  }
}

/** True if the email currently has an active paid SST subscription. */
export async function hasActiveSstAccess(email: string): Promise<boolean> {
  if (!email) return false
  const { rows } = await sql`
    SELECT status FROM sst_subscriptions
    WHERE lower(email) = lower(${email})
    ORDER BY updated_at DESC
    LIMIT 1
  `
  if (!rows.length) return false
  return ACTIVE_STATUSES.has(rows[0].status as string)
}

export async function getSstSubscriptionByEmail(email: string): Promise<SstSubscription | null> {
  const { rows } = await sql`
    SELECT * FROM sst_subscriptions
    WHERE lower(email) = lower(${email})
    ORDER BY updated_at DESC
    LIMIT 1
  `
  return rows.length ? mapRow(rows[0]) : null
}

/**
 * Upsert a subscription from a Stripe webhook event. Keyed on
 * stripe_subscription_id so repeated webhook deliveries are idempotent.
 */
export async function upsertSstSubscription(data: {
  email: string
  stripeCustomerId?: string
  stripeSubscriptionId: string
  plan?: SstPlan
  status: string
  currentPeriodEnd?: Date | null
  cancelAtPeriodEnd?: boolean
}): Promise<void> {
  const id = crypto.randomUUID()
  await sql`
    INSERT INTO sst_subscriptions
      (id, email, stripe_customer_id, stripe_subscription_id, plan, status, current_period_end, cancel_at_period_end, created_at, updated_at)
    VALUES (
      ${id}, ${data.email}, ${data.stripeCustomerId || null}, ${data.stripeSubscriptionId},
      ${data.plan || null}, ${data.status},
      ${data.currentPeriodEnd ? data.currentPeriodEnd.toISOString() : null},
      ${data.cancelAtPeriodEnd ?? false}, now(), now()
    )
    ON CONFLICT (stripe_subscription_id) DO UPDATE SET
      email                = EXCLUDED.email,
      stripe_customer_id   = COALESCE(EXCLUDED.stripe_customer_id, sst_subscriptions.stripe_customer_id),
      plan                 = COALESCE(EXCLUDED.plan, sst_subscriptions.plan),
      status               = EXCLUDED.status,
      current_period_end   = EXCLUDED.current_period_end,
      cancel_at_period_end = EXCLUDED.cancel_at_period_end,
      updated_at           = now()
  `
}
