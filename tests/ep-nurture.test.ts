/**
 * EP (Exercise Physiologist) lead nurture — Concussion Rehabilitation Mastery.
 *
 * Covers:
 *  - stage-window selection in the cron (Day 3/7/14/21 by account age, catch-up
 *    window, day-0 skip, unsubscribe / suppression / wrong-source exclusion)
 *  - TRUTH GATE: with the real CONFIG.FEATURES.ESSA_ACCREDITED flag FALSE, no
 *    template says "ESSA-accredited", and no template describes the online
 *    line as "14 CPD".
 *
 * Only I/O deps are mocked — the real EP_NURTURE_SEQUENCE and real CONFIG are
 * exercised so the ESSA branch is verified against production copy.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EP_NURTURE_SEQUENCE } from '@/lib/email-sequences'
import { CONFIG } from '@/lib/config'

interface SqlCall {
  text: string
  values: unknown[]
}

const state = vi.hoisted(() => ({
  sqlCalls: [] as SqlCall[],
  suppressionRows: [] as Array<{ email: string }>,
  suppressionThrows: false, // simulate email_suppression read failure (fail closed)
  auditExists: false, // INSERT ... ON CONFLICT → rowCount 0 when already sent
}))

vi.mock('@/lib/db', () => ({
  sql: async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const text = strings.join('$')
    state.sqlCalls.push({ text, values })
    if (text.includes('FROM email_suppression')) {
      if (state.suppressionThrows) throw new Error('db down')
      return { rows: state.suppressionRows, rowCount: state.suppressionRows.length }
    }
    if (text.includes('INSERT INTO email_audit_log')) {
      return { rows: [], rowCount: state.auditExists ? 0 : 1 }
    }
    return { rows: [], rowCount: 0 }
  },
}))

const sendEmailMock = vi.hoisted(() =>
  vi.fn(async (_options: { to: string; subject: string; html: string }) => true),
)

vi.mock('@/lib/resend-client', () => ({
  sendEmail: sendEmailMock,
  escapeHtml: (s: string) => s,
}))

const loadUsersMock = vi.hoisted(() => vi.fn(async (): Promise<unknown[]> => []))

vi.mock('@/lib/users', () => ({
  loadUsers: loadUsersMock,
}))

vi.mock('@/app/api/unsubscribe/route', () => ({
  generateUnsubscribeToken: () => 'tok123',
}))

vi.mock('@/lib/require-admin', () => ({
  isAdminRequest: () => false,
}))

vi.mock('@/lib/email-scheduler', () => ({
  EmailScheduler: class {
    next() {
      return '2026-07-10T22:15:00Z'
    }
  },
}))

import { GET } from '@/app/api/cron/ep-nurture/route'

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString()
}

function makeRequest(): Request {
  return new Request('http://localhost/api/cron/ep-nurture', {
    headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
  })
}

function epUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ep1',
    email: 'ep@example.com',
    name: 'Jordan Smith',
    accessLevel: 'preview',
    createdAt: daysAgo(3),
    nurtureUnsubscribed: false,
    signupSource: 'ep-course',
    ...overrides,
  }
}

function subjectForDay(day: number): string {
  const stage = EP_NURTURE_SEQUENCE.find((s) => s.day === day)
  if (!stage) throw new Error(`no EP stage for day ${day}`)
  return stage.subject
}

describe('ep-nurture cron — stage-window selection', () => {
  beforeEach(() => {
    state.sqlCalls.length = 0
    state.suppressionRows = []
    state.suppressionThrows = false
    state.auditExists = false
    sendEmailMock.mockReset()
    sendEmailMock.mockResolvedValue(true)
    loadUsersMock.mockReset()
    loadUsersMock.mockResolvedValue([])
    process.env.CRON_SECRET = 'test-secret'
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL
  })

  it.each([
    [3, 3],
    [7, 7],
    [14, 14],
    [21, 21],
    [5, 3], // inside Day-3 catch-up window
    [16, 14], // inside Day-14 catch-up window
  ])('account age %i days → sends Day %i email', async (age, expectedDay) => {
    loadUsersMock.mockResolvedValue([epUser({ createdAt: daysAgo(age) })])

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(body.emailsSent).toBe(1)
    expect(sendEmailMock).toHaveBeenCalledTimes(1)
    expect(sendEmailMock.mock.calls[0][0]).toMatchObject({ subject: subjectForDay(expectedDay) })
  })

  it('does not send before Day 3 (Day-0 is the capture form)', async () => {
    loadUsersMock.mockResolvedValue([epUser({ createdAt: daysAgo(1) })])

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(body.emailsSent).toBe(0)
    expect(sendEmailMock).not.toHaveBeenCalled()
  })

  it('skips a gap between windows (age 6 matches no stage)', async () => {
    loadUsersMock.mockResolvedValue([epUser({ createdAt: daysAgo(6) })])

    const res = await GET(makeRequest())
    expect((await res.json()).emailsSent).toBe(0)
  })

  it('uses the audit key ep_nurture_day{N}_{userId}', async () => {
    loadUsersMock.mockResolvedValue([epUser({ createdAt: daysAgo(7) })])

    await GET(makeRequest())
    const inserts = state.sqlCalls.filter((c) => c.text.includes('INSERT INTO email_audit_log'))
    expect(inserts.some((c) => c.values.includes('ep_nurture_day7_ep1'))).toBe(true)
  })

  it('skips non-ep-course leads', async () => {
    loadUsersMock.mockResolvedValue([epUser({ signupSource: 'free-course' })])

    expect((await GET(makeRequest()).then((r) => r.json())).emailsSent).toBe(0)
    expect(sendEmailMock).not.toHaveBeenCalled()
  })

  it('honours nurture_unsubscribed', async () => {
    loadUsersMock.mockResolvedValue([epUser({ nurtureUnsubscribed: true })])

    expect((await GET(makeRequest()).then((r) => r.json())).emailsSent).toBe(0)
    expect(sendEmailMock).not.toHaveBeenCalled()
  })

  it('skips suppressed addresses', async () => {
    state.suppressionRows = [{ email: 'ep@example.com' }]
    loadUsersMock.mockResolvedValue([epUser()])

    expect((await GET(makeRequest()).then((r) => r.json())).emailsSent).toBe(0)
    expect(sendEmailMock).not.toHaveBeenCalled()
  })

  it('aborts (fail closed) if email_suppression cannot be read', async () => {
    state.suppressionThrows = true
    loadUsersMock.mockResolvedValue([epUser()])

    const res = await GET(makeRequest())
    expect(res.status).toBe(503)
    expect(sendEmailMock).not.toHaveBeenCalled()
  })

  it('does not double-send an already-sent stage (audit dedupe)', async () => {
    state.auditExists = true
    loadUsersMock.mockResolvedValue([epUser({ createdAt: daysAgo(7) })])

    expect((await GET(makeRequest()).then((r) => r.json())).emailsSent).toBe(0)
    expect(sendEmailMock).not.toHaveBeenCalled()
  })

  it('rolls back the audit row when a send fails', async () => {
    sendEmailMock.mockResolvedValue(false)
    loadUsersMock.mockResolvedValue([epUser({ createdAt: daysAgo(3) })])

    const res = await GET(makeRequest())
    expect((await res.json()).emailsSent).toBe(0)
    const rollbacks = state.sqlCalls.filter((c) => c.text.includes('DELETE FROM email_audit_log WHERE audit_key'))
    expect(rollbacks).toHaveLength(1)
    expect(rollbacks[0].values).toContain('ep_nurture_day3_ep1')
  })

  it('rejects an unauthorized request', async () => {
    const res = await GET(new Request('http://localhost/api/cron/ep-nurture'))
    expect(res.status).toBe(401)
  })
})

describe('EP nurture templates — ESSA truth gate (flag FALSE)', () => {
  const rendered = EP_NURTURE_SEQUENCE.map((s) =>
    s.template('Jordan Smith', 'https://portal.test/concussion-rehab-mastery'),
  )

  it('runs with ESSA_ACCREDITED = false (precondition)', () => {
    expect(CONFIG.FEATURES.ESSA_ACCREDITED).toBe(false)
  })

  it('has exactly four touches on Days 3, 7, 14, 21', () => {
    expect(EP_NURTURE_SEQUENCE.map((s) => s.day)).toEqual([3, 7, 14, 21])
  })

  it('no template claims "ESSA-accredited" while accreditation is pending', () => {
    for (const html of rendered) {
      expect(html).not.toContain('ESSA-accredited')
      expect(html).toContain('accreditation pending')
    }
  })

  it('no template describes the online line as "14 CPD"', () => {
    for (const html of rendered) {
      expect(html).not.toContain('14 CPD')
    }
  })

  it('every touch has one CTA to the EP landing and a subject with no link', () => {
    for (const stage of EP_NURTURE_SEQUENCE) {
      const html = stage.template('Jordan Smith', 'https://portal.test/concussion-rehab-mastery')
      const ctas = html.match(/class="cta-btn"/g) || []
      expect(ctas).toHaveLength(1)
      expect(html).toContain('concussion-rehab-mastery')
      expect(stage.subject).not.toMatch(/https?:\/\//)
      expect(stage.subject.toLowerCase()).not.toContain('free')
    }
  })
})
