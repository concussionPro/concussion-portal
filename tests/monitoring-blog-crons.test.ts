/**
 * Monitoring + publish-scheduled-blog crons — failure visibility.
 *
 * Covers the audited fixes:
 *  5. Monitoring: a check that throws becomes an 'alert' finding (so a dead
 *     Postgres can't report "all checks passed"); a failed alert email → 500
 *  9. Blog cron: low-schedule warning in the response + reminder email;
 *     email failure returns 500 instead of a silent ok:false 200
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const sendEmailMock = vi.hoisted(() =>
  vi.fn(async (_options: { to: string; subject: string; html: string }) => true)
)

vi.mock('@/lib/resend-client', () => ({
  sendEmail: sendEmailMock,
  escapeHtml: (s: string) => s,
}))

vi.mock('@/lib/db', () => ({
  sql: async () => {
    throw new Error('Postgres is down')
  },
}))

vi.mock('@/lib/stripe', () => ({
  getStripe: () => {
    throw new Error('Stripe unavailable')
  },
}))

const blogState = vi.hoisted(() => ({
  schedule: [] as Array<{ slug: string; title: string; publishAt: string; draftStatus: string }>,
  overdue: [] as Array<{ slug: string; title: string; publishAt: string; draftStatus: string; notes?: string }>,
}))

vi.mock('@/lib/blog-schedule', () => ({
  get BLOG_SCHEDULE() {
    return blogState.schedule
  },
  getOverduePosts: () => blogState.overdue,
  getNextScheduledPost: () => null,
}))

import { GET as monitoringGET } from '@/app/api/cron/monitoring/route'
import { GET as blogGET } from '@/app/api/cron/publish-scheduled-blog/route'
import { NextRequest } from 'next/server'

function cronRequest(url: string): NextRequest {
  return new NextRequest(url, {
    headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
  })
}

beforeEach(() => {
  sendEmailMock.mockReset()
  sendEmailMock.mockResolvedValue(true)
  process.env.CRON_SECRET = 'test-secret'
  delete process.env.VERCEL_PROJECT_PRODUCTION_URL
  blogState.schedule = []
  blogState.overdue = []
})

describe('monitoring cron failure visibility', () => {
  it('reports every thrown check as an alert instead of "all checks passed"', async () => {
    const res = await monitoringGET(cronRequest('http://localhost/api/cron/monitoring'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.alerts).toBe(5) // all 5 checks threw → 5 alert findings
    expect(sendEmailMock).toHaveBeenCalledTimes(1)
    const emailArgs = sendEmailMock.mock.calls[0][0]
    expect(emailArgs.subject).toContain('alert')
    expect(emailArgs.html).toContain('Monitoring check failed')
  })

  it('returns 500 when the alert email itself fails to send', async () => {
    sendEmailMock.mockResolvedValue(false)

    const res = await monitoringGET(cronRequest('http://localhost/api/cron/monitoring'))
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
  })
})

describe('publish-scheduled-blog cron', () => {
  const futurePost = (slug: string, daysAhead: number) => ({
    slug,
    title: `Post ${slug}`,
    publishAt: new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString(),
    draftStatus: 'not-started',
  })
  const overduePost = {
    slug: 'overdue-post',
    title: 'Overdue Post',
    publishAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    draftStatus: 'not-started',
  }

  it('warns loudly when the schedule is running dry (no overdue posts)', async () => {
    blogState.schedule = [futurePost('a', 7)] // only 1 upcoming
    const res = await blogGET(cronRequest('http://localhost/api/cron/publish-scheduled-blog'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.warning).toContain('RUNNING DRY')
  })

  it('includes the low-schedule warning in the reminder email', async () => {
    blogState.schedule = [futurePost('a', 7)]
    blogState.overdue = [overduePost]

    const res = await blogGET(cronRequest('http://localhost/api/cron/publish-scheduled-blog'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.warning).toContain('RUNNING DRY')
    const emailArgs = sendEmailMock.mock.calls[0][0]
    expect(emailArgs.html).toContain('RUNNING DRY')
  })

  it('does not warn when the schedule has plenty of runway', async () => {
    blogState.schedule = [futurePost('a', 7), futurePost('b', 14), futurePost('c', 21)]
    const res = await blogGET(cronRequest('http://localhost/api/cron/publish-scheduled-blog'))
    const body = await res.json()

    expect(body.warning).toBeUndefined()
  })

  it('returns 500 when the reminder email fails (cron run shows failed)', async () => {
    blogState.schedule = [futurePost('a', 7), futurePost('b', 14), futurePost('c', 21)]
    blogState.overdue = [overduePost]
    sendEmailMock.mockResolvedValue(false)

    const res = await blogGET(cronRequest('http://localhost/api/cron/publish-scheduled-blog'))
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.ok).toBe(false)
  })
})
