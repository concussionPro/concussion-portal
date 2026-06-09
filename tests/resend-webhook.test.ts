/**
 * Resend webhook — bounce classification + project scoping.
 *
 * Verifies the two audited fixes:
 *  1. Only PERMANENT bounces suppress (transient bounces log the event row only)
 *  2. Only CEA-project events mutate users.nurture_unsubscribed / email_suppression
 *     (the Resend account is shared with byronwebstudio)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

interface SqlCall {
  text: string
  values: unknown[]
}

const sqlCalls: SqlCall[] = []

vi.mock('@/lib/db', () => ({
  sql: async (strings: TemplateStringsArray, ...values: unknown[]) => {
    sqlCalls.push({ text: strings.join('$'), values })
    return { rows: [], rowCount: 0 }
  },
}))

import { POST } from '@/app/api/webhooks/resend/route'
import { NextRequest } from 'next/server'

function makeEvent(opts: {
  type: string
  from: string
  to: string
  bounce?: { type: string; subType?: string }
}) {
  return {
    type: opts.type,
    created_at: new Date().toISOString(),
    data: {
      email_id: 'em_test_1',
      from: opts.from,
      to: [opts.to],
      subject: 'Test subject',
      created_at: new Date().toISOString(),
      ...(opts.bounce ? { bounce: opts.bounce } : {}),
    },
  }
}

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/webhooks/resend', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

const CEA_FROM = 'Concussion Education Australia <zac@concussion-education-australia.com>'
const BYRON_FROM = 'Byron Web Studio <hello@byronwebstudio.com.au>'

function calls(fragment: string): SqlCall[] {
  return sqlCalls.filter((c) => c.text.includes(fragment))
}

describe('Resend webhook bounce + project handling', () => {
  beforeEach(() => {
    sqlCalls.length = 0
    // No RESEND_WEBHOOK_SECRET → signature verification skipped (dev/test mode)
    delete process.env.RESEND_WEBHOOK_SECRET
  })

  it('transient bounce logs the event row but does NOT suppress', async () => {
    const res = await POST(
      makeRequest(
        makeEvent({
          type: 'email.bounced',
          from: CEA_FROM,
          to: 'Full.Mailbox@example.com',
          bounce: { type: 'Transient', subType: 'MailboxFull' },
        })
      )
    )
    expect(res.status).toBe(200)

    // Event row stored with the bounce type
    const inserts = calls('INSERT INTO email_events')
    expect(inserts).toHaveLength(1)
    expect(inserts[0].values).toContain('transient')

    // No suppression / unsubscribe mutation
    expect(calls('UPDATE users SET nurture_unsubscribed')).toHaveLength(0)
    expect(calls('INSERT INTO email_suppression')).toHaveLength(0)
  })

  it('permanent bounce on a CEA send suppresses + unsubscribes', async () => {
    const res = await POST(
      makeRequest(
        makeEvent({
          type: 'email.bounced',
          from: CEA_FROM,
          to: 'gone@example.com',
          bounce: { type: 'Permanent', subType: 'General' },
        })
      )
    )
    expect(res.status).toBe(200)

    expect(calls('UPDATE users SET nurture_unsubscribed')).toHaveLength(1)
    const suppressions = calls('INSERT INTO email_suppression')
    expect(suppressions).toHaveLength(1)
    expect(suppressions[0].text).toContain('hard-bounce')
  })

  it('permanent bounce on a byronwebstudio send does NOT mutate CEA state', async () => {
    const res = await POST(
      makeRequest(
        makeEvent({
          type: 'email.bounced',
          from: BYRON_FROM,
          to: 'gone@example.com',
          bounce: { type: 'Permanent', subType: 'General' },
        })
      )
    )
    expect(res.status).toBe(200)

    // Event row still logged, tagged with its project
    const inserts = calls('INSERT INTO email_events')
    expect(inserts).toHaveLength(1)
    expect(inserts[0].values).toContain('byronwebstudio')

    expect(calls('UPDATE users SET nurture_unsubscribed')).toHaveLength(0)
    expect(calls('INSERT INTO email_suppression')).toHaveLength(0)
  })

  it('complaint on a CEA send suppresses globally', async () => {
    const res = await POST(
      makeRequest(makeEvent({ type: 'email.complained', from: CEA_FROM, to: 'angry@example.com' }))
    )
    expect(res.status).toBe(200)

    expect(calls('UPDATE users SET nurture_unsubscribed')).toHaveLength(1)
    const suppressions = calls('INSERT INTO email_suppression')
    expect(suppressions).toHaveLength(1)
    expect(suppressions[0].text).toContain('complained')
  })

  it('complaint on a byronwebstudio send does NOT mutate CEA state', async () => {
    const res = await POST(
      makeRequest(makeEvent({ type: 'email.complained', from: BYRON_FROM, to: 'angry@example.com' }))
    )
    expect(res.status).toBe(200)

    expect(calls('UPDATE users SET nurture_unsubscribed')).toHaveLength(0)
    expect(calls('INSERT INTO email_suppression')).toHaveLength(0)
    // Event row still logged
    expect(calls('INSERT INTO email_events')).toHaveLength(1)
  })
})
