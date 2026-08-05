/**
 * Hub Pack keys: ONE key per payment, even under a concurrent webhook retry.
 *
 * A retry minting a SECOND key means two codes, two welcome emails and double
 * the seats the clinic paid for. The 2026-08-05 fix guarded that with a
 * SELECT-then-INSERT on stripe_session_id — a time-of-check/time-of-use window
 * that BOTH concurrent deliveries pass, which is exactly the case Stripe
 * retries produce (Vercel can run two instances of the same event in parallel).
 *
 * The guard is now the database: a partial unique index on stripe_session_id,
 * an `ON CONFLICT DO NOTHING` insert, and a re-read of the winner's code.
 *
 * This suite drives the real createCourseHub against a fake `sql` that models
 * the unique index, and interleaves two callers so both clear the SELECT before
 * either INSERTs.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

type Row = { code: string; stripe_session_id: string | null }

const db = {
  hubs: [] as Row[],
  /** Set true once the index-creation statement has been seen. */
  indexCreated: false,
}

/**
 * Minimal tagged-template SQL good enough for course-hub.ts. Anything it does
 * not recognise is a no-op returning zero rows, which is what the CREATE TABLE
 * / ALTER TABLE preamble wants.
 */
function fakeSql(strings: TemplateStringsArray, ...values: unknown[]) {
  const text = strings.join('?').replace(/\s+/g, ' ').trim()

  if (/CREATE UNIQUE INDEX .*uniq_course_hub_session/i.test(text)) {
    db.indexCreated = true
    return Promise.resolve({ rows: [] })
  }

  if (/^SELECT code FROM course_hubs WHERE stripe_session_id/i.test(text)) {
    const sid = values[0] as string
    const hit = db.hubs.find((h) => h.stripe_session_id === sid)
    return Promise.resolve({ rows: hit ? [{ code: hit.code }] : [] })
  }

  if (/^INSERT INTO course_hubs/i.test(text)) {
    const code = values[0] as string
    const sid = (values[5] ?? null) as string | null
    const onConflictDoNothing = /ON CONFLICT DO NOTHING/i.test(text)
    const wouldViolate =
      db.indexCreated && sid !== null && db.hubs.some((h) => h.stripe_session_id === sid)
    if (wouldViolate) {
      if (onConflictDoNothing) return Promise.resolve({ rows: [] })
      return Promise.reject(
        new Error('duplicate key value violates unique constraint "uniq_course_hub_session"'),
      )
    }
    db.hubs.push({ code, stripe_session_id: sid })
    return Promise.resolve({ rows: /RETURNING code/i.test(text) ? [{ code }] : [] })
  }

  return Promise.resolve({ rows: [] })
}

vi.mock('@/lib/db', () => ({ sql: fakeSql }))
vi.mock('@vercel/postgres', () => ({ sql: fakeSql }))

beforeEach(() => {
  // `indexCreated` is deliberately NOT reset: course-hub memoises its
  // ensure-tables preamble per process, exactly as production does after the
  // first cold-start call, so the index exists for every later request.
  db.hubs = []
})

describe('createCourseHub is idempotent per Stripe session', () => {
  it('a SEQUENTIAL retry returns the SAME code and creates no second row', async () => {
    const { createCourseHub } = await import('@/lib/course-hub')
    const args = { ownerEmail: 'Owner@Clinic.com', clinicianSeats: 5, stripeSessionId: 'cs_test_retry' }
    const first = await createCourseHub(args)
    const second = await createCourseHub(args)
    expect(second).toBe(first)
    expect(db.hubs).toHaveLength(1)
  })

  it('two CONCURRENT deliveries of the same session yield ONE key', async () => {
    const { createCourseHub } = await import('@/lib/course-hub')
    const args = { ownerEmail: 'owner@clinic.com', clinicianSeats: 8, stripeSessionId: 'cs_test_race' }
    // Promise.all interleaves at every await, so both callers run their
    // idempotency SELECT before either INSERT lands — the exact TOCTOU window.
    const [a, b] = await Promise.all([createCourseHub(args), createCourseHub(args)])
    expect(db.hubs).toHaveLength(1)
    expect(a).toBe(b)
    expect(a).toBe(db.hubs[0].code)
  })

  it('the OLD select-then-insert loses this race (proof the test is not vacuous)', async () => {
    // The shipped 2026-08-05 guard, transcribed: SELECT, then INSERT with no
    // ON CONFLICT. Same fake database, same interleaving.
    async function legacyCreateCourseHub(stripeSessionId: string, code: string) {
      const { rows: prior } = (await fakeSql(
        ['SELECT code FROM course_hubs WHERE stripe_session_id = ', ' LIMIT 1'] as unknown as TemplateStringsArray,
        stripeSessionId,
      )) as { rows: { code: string }[] }
      if (prior[0]) return prior[0].code
      await fakeSql(
        ['INSERT INTO course_hubs (code, owner_email, clinic_name, clinician_seats, admin_seats, stripe_session_id) VALUES (', ',', ',', ',', ',', ')'] as unknown as TemplateStringsArray,
        code, 'o@c.com', null, 5, 3, stripeSessionId,
      )
      return code
    }
    const results = await Promise.all([
      legacyCreateCourseHub('cs_legacy', 'CEA-AAAA-0001'),
      legacyCreateCourseHub('cs_legacy', 'CEA-BBBB-0002'),
    ]).catch(() => null)
    // Either two rows were written, or the raw INSERT threw on the index —
    // both are "the old code cannot survive this", and neither is what
    // createCourseHub does now.
    expect(results === null || db.hubs.length === 2).toBe(true)
  })

  it('distinct payments still get distinct keys', async () => {
    const { createCourseHub } = await import('@/lib/course-hub')
    const a = await createCourseHub({ ownerEmail: 'a@c.com', clinicianSeats: 5, stripeSessionId: 'cs_a' })
    const b = await createCourseHub({ ownerEmail: 'b@c.com', clinicianSeats: 5, stripeSessionId: 'cs_b' })
    expect(a).not.toBe(b)
    expect(db.hubs).toHaveLength(2)
  })
})
