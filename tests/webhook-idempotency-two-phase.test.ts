/**
 * Stripe webhook idempotency — TWO-PHASE CLAIM.
 *
 * The old guard was one-phase: INSERT the event id before the handler, DELETE
 * it in the catch. That is only safe for failures the catch can observe. It is
 * NOT safe for the ways a serverless function actually dies mid-fulfilment —
 * the 60s maxDuration timeout, an OOM kill, an instance reclaim — because none
 * of those run the catch. The claim row survived, every Stripe retry matched
 * it and returned "duplicate → 200", and a PAID buyer was left with no account,
 * no course row, no welcome email, and nothing anywhere saying so.
 *
 * The contract these tests lock:
 *   1. A completed event is skipped on redelivery (the original guarantee).
 *   2. A claim that never completed and is OLDER than any live attempt is
 *      re-claimed and REPROCESSED (crash recovery).
 *   3. A claim that never completed and is YOUNG is genuinely in flight —
 *      answer non-2xx so Stripe retries later, never 200 for work that may
 *      never finish.
 *   4. A handler throw still releases the claim for an immediate retry.
 *
 * Drives the real POST handler against a fake `sql` that models the table.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type Stripe from 'stripe'

process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'

type Claim = { event_id: string; event_type: string; processed_at: number; completed_at: number | null }

const db = { claims: [] as Claim[] }

const NOW = () => Date.now()

vi.mock('@/lib/db', () => ({
  sql: async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const text = strings.join('?').replace(/\s+/g, ' ').trim()

    if (/^ALTER TABLE processed_webhook_events/i.test(text)) return { rows: [], rowCount: 0 }
    if (/^UPDATE processed_webhook_events SET completed_at = processed_at/i.test(text)) {
      // backfill of pre-migration rows — none in these tests
      return { rows: [], rowCount: 0 }
    }
    if (/^INSERT INTO processed_webhook_events/i.test(text)) {
      const [id, type] = values as [string, string]
      if (db.claims.some((c) => c.event_id === id)) return { rows: [], rowCount: 0 }
      db.claims.push({ event_id: id, event_type: type, processed_at: NOW(), completed_at: null })
      return { rows: [{ event_id: id }], rowCount: 1 }
    }
    if (/^SELECT completed_at FROM processed_webhook_events/i.test(text)) {
      const hit = db.claims.find((c) => c.event_id === values[0])
      return { rows: hit ? [{ completed_at: hit.completed_at }] : [], rowCount: hit ? 1 : 0 }
    }
    if (/^UPDATE processed_webhook_events SET processed_at = now\(\)/i.test(text)) {
      const [id, mins] = values as [string, number]
      const hit = db.claims.find((c) => c.event_id === id)
      const stale = hit && hit.completed_at === null && hit.processed_at < NOW() - mins * 60_000
      if (!stale) return { rows: [], rowCount: 0 }
      hit!.processed_at = NOW()
      return { rows: [{ event_id: id }], rowCount: 1 }
    }
    if (/^UPDATE processed_webhook_events SET completed_at = now\(\)/i.test(text)) {
      const hit = db.claims.find((c) => c.event_id === values[0])
      if (hit) hit.completed_at = NOW()
      return { rows: [], rowCount: hit ? 1 : 0 }
    }
    if (/^DELETE FROM processed_webhook_events/i.test(text)) {
      db.claims = db.claims.filter((c) => c.event_id !== values[0])
      return { rows: [], rowCount: 1 }
    }
    return { rows: [], rowCount: 0 }
  },
}))

// `checkout.session.async_payment_failed` is the cheapest event in the switch —
// it logs and returns — so these tests exercise the idempotency machinery
// itself rather than any one product's fulfilment. The throw hook stands in for
// a fulfilment failure.
vi.mock('@/lib/stripe', () => ({
  constructWebhookEvent: (body: string) => JSON.parse(body) as Stripe.Event,
  sstPlanPriceId: () => null,
  getStripe: () => ({}),
  redactStripeSecrets: (s: string) => s,
  CheckoutUnavailableError: class extends Error {},
}))

// Everything the route imports for fulfilment — none of it should run for the
// event type under test, but the module graph must resolve.
vi.mock('@/lib/sst-trainer/clinic-registry', () => ({
  setSstClinicPlan: vi.fn(), getSstClinicByEmail: vi.fn(), getSstClinicStripeSubscription: vi.fn(),
}))
vi.mock('@/lib/sst-trainer/bundle', () => ({ provisionPlatformForBuyer: vi.fn() }))
vi.mock('@/lib/users', () => ({
  createUser: vi.fn(), findUserByEmail: vi.fn(), markBookPurchased: vi.fn(), getEnrollmentCount: vi.fn(),
}))
vi.mock('@/lib/resend-client', () => ({
  sendEmail: vi.fn(async () => true), sendMagicLinkEmail: vi.fn(), sendPostPurchaseLoginEmail: vi.fn(),
  sendHubOwnerWelcomeEmail: vi.fn(), escapeHtml: (s: string) => s,
}))
vi.mock('@/lib/email-suppression', () => ({ isEmailSuppressed: vi.fn(async () => false) }))
vi.mock('@/lib/course-hub', () => ({
  createCourseHub: vi.fn(), redeemHubSeat: vi.fn(), revokeHub: vi.fn(),
  hubSeatsForDeclaredCount: () => 5, HUB_ADMIN_SEATS: 3,
}))
vi.mock('@/lib/magic-link-jwt', () => ({ createMagicToken: () => 'tok', NURTURE_TTL_MS: 1000 }))
vi.mock('@/app/api/unsubscribe/route', () => ({ generateUnsubscribeToken: () => 'unsub' }))
vi.mock('@/lib/course-purchases', () => ({ recordCoursePurchase: vi.fn() }))
vi.mock('@/lib/course-certificates', () => ({ revokeCourseCertificates: vi.fn(async () => []) }))
vi.mock('@/lib/ai-course/access', () => ({ enrolUser: vi.fn(), unenrolUser: vi.fn() }))
vi.mock('@/lib/ai-course/provider-catalogue', () => ({ findCourse: () => null }))

import { POST } from '@/app/api/webhooks/stripe/route'
import { NextRequest } from 'next/server'

function deliver(eventId: string, type = 'checkout.session.async_payment_failed') {
  const body = JSON.stringify({ id: eventId, type, data: { object: { id: 'cs_test_1' } } })
  return POST(
    new NextRequest('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      body,
      headers: { 'stripe-signature': 'sig' },
    }),
  )
}

describe('Stripe webhook two-phase idempotency', () => {
  beforeEach(() => {
    db.claims = []
  })

  it('first delivery processes and marks the claim COMPLETE', async () => {
    const res = await deliver('evt_1')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ received: true })
    expect(db.claims).toHaveLength(1)
    expect(db.claims[0].completed_at).not.toBeNull()
  })

  it('redelivery of a COMPLETED event is skipped', async () => {
    await deliver('evt_2')
    const res = await deliver('evt_2')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ received: true, duplicate: true })
  })

  it('a YOUNG unfinished claim is treated as in-flight — non-2xx so Stripe retries', async () => {
    // Another instance claimed it a second ago and has not finished.
    db.claims.push({ event_id: 'evt_3', event_type: 'x', processed_at: NOW() - 1_000, completed_at: null })
    const res = await deliver('evt_3')
    expect(res.status).toBe(409)
    // Critically NOT a 200: a 200 here tells Stripe the work is done when the
    // in-flight attempt may still die.
    expect(res.status).not.toBe(200)
  })

  it('a STALE unfinished claim (crashed attempt) is re-claimed and REPROCESSED', async () => {
    // The shape a lambda timeout leaves behind: claimed, never completed.
    db.claims.push({ event_id: 'evt_4', event_type: 'x', processed_at: NOW() - 10 * 60_000, completed_at: null })
    const res = await deliver('evt_4')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ received: true })
    // And it is now marked done, so the NEXT retry is a true duplicate.
    expect(db.claims[0].completed_at).not.toBeNull()
    const again = await deliver('evt_4')
    expect(await again.json()).toEqual({ received: true, duplicate: true })
  })

  it('a completed claim is never re-run just because it is old', async () => {
    db.claims.push({
      event_id: 'evt_5', event_type: 'x',
      processed_at: NOW() - 90 * 24 * 60 * 60_000,
      completed_at: NOW() - 90 * 24 * 60 * 60_000,
    })
    const res = await deliver('evt_5')
    expect(await res.json()).toEqual({ received: true, duplicate: true })
  })

  it('a handler failure releases the claim entirely so the retry reprocesses', async () => {
    // A dispute event with a null object throws inside handleDisputeCreated.
    const failing = () =>
      POST(
        new NextRequest('http://localhost/api/webhooks/stripe', {
          method: 'POST',
          body: JSON.stringify({ id: 'evt_6', type: 'charge.dispute.created', data: { object: null } }),
          headers: { 'stripe-signature': 'sig' },
        }),
      )
    const res = await failing()
    expect(res.status).toBe(500)
    // The claim must be GONE, not left behind as a row a retry would read as a
    // duplicate. This is the immediate-retry path the crash path cannot use.
    expect(db.claims.find((c) => c.event_id === 'evt_6')).toBeUndefined()

    // Prove the retry is genuinely re-entered rather than skipped.
    const retry = await deliver('evt_6')
    expect(await retry.json()).toEqual({ received: true })
  })
})
