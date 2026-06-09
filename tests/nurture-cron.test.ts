/**
 * Nurture email cron — send-failure rollback, transactional workshop
 * emails, weekly cap counting, and catch-up windows.
 *
 * Covers the audited fixes in app/api/cron/send-nurture-emails/route.ts:
 *  1. Failed sends roll back the email_audit_log dedupe row (retry next run)
 *  3. Workshop prep/logistics ignore the marketing unsubscribe; only a
 *     permanent email_suppression entry blocks them
 *  4. Weekly cap counts 'delivered' events (webhook never writes 'sent')
 * 10. Missed cron day → catch-up window instead of permanent skip
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

interface SqlCall {
  text: string
  values: unknown[]
}

const state = vi.hoisted(() => ({
  sqlCalls: [] as SqlCall[],
  suppressionRows: [] as Array<{ email: string }>,
}))

vi.mock('@/lib/db', () => ({
  sql: async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const text = strings.join('$')
    state.sqlCalls.push({ text, values })
    if (text.includes('SELECT 1 FROM email_audit_log')) {
      // Day-0 welcome already sent — skip the catch-up branch
      return { rows: [{ exists: 1 }], rowCount: 1 }
    }
    if (text.includes('INSERT INTO email_audit_log')) {
      return { rows: [], rowCount: 1 } // not previously sent
    }
    if (text.includes('FROM email_suppression')) {
      return { rows: state.suppressionRows, rowCount: state.suppressionRows.length }
    }
    return { rows: [], rowCount: 0 }
  },
}))

const sendEmailMock = vi.hoisted(() =>
  vi.fn(async (_options: { to: string; subject: string; html: string }) => true)
)

vi.mock('@/lib/resend-client', () => ({
  sendEmail: sendEmailMock,
  escapeHtml: (s: string) => s,
}))

const loadUsersMock = vi.hoisted(() => vi.fn(async (): Promise<unknown[]> => []))

vi.mock('@/lib/users', () => ({
  loadUsers: loadUsersMock,
  getEnrollmentCount: async () => 3,
}))

vi.mock('@/app/api/unsubscribe/route', () => ({
  generateUnsubscribeToken: () => 'tok123',
}))

vi.mock('@/lib/magic-link-jwt', () => ({
  generateMagicLinkJWT: () => 'https://portal.test/login',
}))

vi.mock('@/lib/email-scheduler', () => ({
  EmailScheduler: class {
    next() {
      return '2026-06-10T22:30:00Z'
    }
  },
}))

// Workshop confirmed ~30h out → daysUntilWorkshop = 1 (the "tomorrow" prep email)
vi.mock('@/lib/config', () => ({
  CONFIG: {
    LOCATIONS: {
      MELBOURNE: {
        city: 'Melbourne',
        slug: 'melbourne',
        date: 'Sat 13 June 2026',
        dateObj: new Date(Date.now() + 30 * 60 * 60 * 1000),
        status: 'confirmed',
      },
    },
    WORKSHOP: { CONFIRMATION_THRESHOLD: 10 },
    CONTACT_EMAIL: 'zac@test.local',
  },
}))

const tpl = vi.hoisted(
  () =>
    (..._args: unknown[]) =>
      '<p>Body</p><a href="{{unsubscribe_url}}">u</a>'
)

vi.mock('@/lib/email-sequences', () => ({
  SCAT_MASTERY_SEQUENCE: [
    { day: 0, subject: 'SCAT Day 0', template: tpl },
    { day: 3, subject: 'SCAT Day 3', template: tpl },
    { day: 7, subject: 'SCAT Day 7', template: tpl },
  ],
  POST_PURCHASE_SEQUENCE: [
    { day: 1, subject: 'PP Day 1', accessLevels: ['online-only', 'full-course'], template: tpl },
  ],
  ABANDONED_CHECKOUT_SEQUENCE: [{ hoursAfter: 1, subject: 'AC 1', template: tpl }],
  PRE_WORKSHOP_SEQUENCE: [
    { daysBefore: 7, subject: 'Prep 7d', template: tpl },
    { daysBefore: 1, subject: 'Prep 1d', template: tpl },
  ],
  ONLINE_UPGRADE_SEQUENCE: [],
  REENGAGEMENT_EMAIL: { subject: 'Reengage', template: tpl },
  WORKSHOP_RESERVATION_EMAIL: { subject: 'Reservation', template: tpl },
  WORKSHOP_MOMENTUM_EMAILS: [],
  WORKSHOP_LOGISTICS_EMAIL: { daysBefore: 42, subject: 'Logistics', template: tpl },
  ALMOST_DONE_EMAIL: { subject: 'Almost done', template: tpl },
  SCAT_COMPLETION_UPSELL: { subject: 'Upsell', template: tpl },
  FREE_USER_REENGAGEMENT: { subject: 'Free reengage', template: tpl },
  FREE_LOGGED_IN_NO_PROGRESS: { subject: 'No progress', template: tpl },
  SCAT_DAY10_ENGAGEMENT: { subject: 'D10 engagement', template: tpl },
  FREE_ALMOST_DONE: { subject: 'Free almost done', template: tpl },
  REFERENCE_UPGRADE_SEQUENCE: [],
  PAID_NO_PROGRESS_NUDGE: { day: 0, subject: 'Paid nudge', template: tpl },
  AI_SAFETY_CHECKLIST_DAY3: { subject: 'AI 3', template: tpl },
  AI_SAFETY_CHECKLIST_DAY7: { subject: 'AI 7', template: tpl },
  AI_SAFETY_CHECKLIST_DAY14: { subject: 'AI 14', template: tpl },
}))

import { GET } from '@/app/api/cron/send-nurture-emails/route'

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString()
}

function makeRequest(): Request {
  return new Request('http://localhost/api/cron/send-nurture-emails', {
    headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
  })
}

function previewUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'u1',
    email: 'preview@example.com',
    name: 'Test User',
    accessLevel: 'preview',
    createdAt: daysAgo(3),
    lastLoginAt: daysAgo(1),
    nurtureUnsubscribed: false,
    ...overrides,
  }
}

function fullCourseUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'u2',
    email: 'fullcourse@example.com',
    name: 'Workshop User',
    accessLevel: 'full-course',
    createdAt: daysAgo(30),
    lastLoginAt: daysAgo(1),
    nurtureUnsubscribed: false,
    workshopLocation: 'melbourne',
    ...overrides,
  }
}

function sqlCalls(fragment: string): SqlCall[] {
  return state.sqlCalls.filter((c) => c.text.includes(fragment))
}

describe('send-nurture-emails cron', () => {
  beforeEach(() => {
    state.sqlCalls.length = 0
    state.suppressionRows = []
    sendEmailMock.mockReset()
    sendEmailMock.mockResolvedValue(true)
    loadUsersMock.mockReset()
    loadUsersMock.mockResolvedValue([])
    process.env.CRON_SECRET = 'test-secret'
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL
  })

  it('counts a successful send and writes no audit rollback', async () => {
    loadUsersMock.mockResolvedValue([previewUser()])

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(body.emailsSent).toBe(1)
    expect(sendEmailMock).toHaveBeenCalledTimes(1)
    expect(sendEmailMock.mock.calls[0][0]).toMatchObject({ subject: 'SCAT Day 3' })
    expect(sqlCalls('DELETE FROM email_audit_log')).toHaveLength(0)
  })

  it('rolls back the audit row and does not count a failed send', async () => {
    loadUsersMock.mockResolvedValue([previewUser()])
    sendEmailMock.mockResolvedValue(false)

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(body.emailsSent).toBe(0)
    const rollbacks = sqlCalls('DELETE FROM email_audit_log WHERE audit_key')
    expect(rollbacks).toHaveLength(1)
    expect(rollbacks[0].values).toContain('scat_day3_u1')
  })

  it('catch-up window sends a missed step (audit key stays per-step)', async () => {
    // Day-3 email missed; user is now 4 days old → still inside the window
    loadUsersMock.mockResolvedValue([previewUser({ createdAt: daysAgo(4) })])

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(body.emailsSent).toBe(1)
    expect(sendEmailMock.mock.calls[0][0]).toMatchObject({ subject: 'SCAT Day 3' })
    // Dedupe key is the STEP day, not the calendar day
    const inserts = sqlCalls('INSERT INTO email_audit_log').filter((c) =>
      c.values.some((v) => String(v).startsWith('scat_day'))
    )
    expect(inserts[0].values).toContain('scat_day3_u1')
  })

  it('sends workshop prep to a nurture-unsubscribed attendee (operational email)', async () => {
    loadUsersMock.mockResolvedValue([fullCourseUser({ nurtureUnsubscribed: true })])

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(body.emailsSent).toBe(1)
    expect(sendEmailMock).toHaveBeenCalledTimes(1)
    expect(sendEmailMock.mock.calls[0][0]).toMatchObject({ subject: 'Prep 1d' })
  })

  it('skips workshop prep only when the address is permanently suppressed', async () => {
    state.suppressionRows = [{ email: 'fullcourse@example.com' }]
    loadUsersMock.mockResolvedValue([fullCourseUser({ nurtureUnsubscribed: true })])

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(body.emailsSent).toBe(0)
    expect(sendEmailMock).not.toHaveBeenCalled()
  })

  it('weekly cap counts delivered events (not just the never-written sent type)', async () => {
    await GET(makeRequest())

    const capQueries = sqlCalls("event_type IN ('sent', 'delivered')")
    expect(capQueries).toHaveLength(1)
    expect(capQueries[0].text).toContain('FROM email_events')
  })
})
