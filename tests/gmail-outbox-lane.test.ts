import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { buildMime, encodeHeader, isReplyFromOtherSide, textToSimpleHtml, GMAIL_SENDER } from '@/lib/gmail/client'
import { allowedWhilePaused, GMAIL_DAILY_CAP } from '@/lib/gmail/outbox'

describe('gmail warm lane', () => {
  it('the outbox cron only ever releases APPROVED rows and checks suppression before sending', () => {
    const src = readFileSync('app/api/cron/gmail-outbox/route.ts', 'utf8')
    expect(src).toContain('dueApproved(')
    expect(src.indexOf('isEmailSuppressed(')).toBeLessThan(src.indexOf('gmailSend('))
    expect(src).toContain("process.env.MARKETING_EMAILS_PAUSED === 'true'")
    expect(src).toContain('allowedWhilePaused(')
  })
  it('dueApproved selects status = approved only', () => {
    const src = readFileSync('lib/gmail/outbox.ts', 'utf8')
    expect(src).toMatch(/WHERE status = 'approved' AND \(not_before IS NULL OR not_before <= NOW\(\)\)/)
    expect(src).toContain("input.status ?? 'draft'") // rows are born draft
  })
  it('while paused only Zac\'s own addresses pass', () => {
    expect(allowedWhilePaused('zac@concussion-education-australia.com')).toBe(true)
    expect(allowedWhilePaused('Z.Lew87@gmail.com')).toBe(true)
    expect(allowedWhilePaused('tylerbell99@outlook.com')).toBe(false)
  })
  it('daily cap is a real ceiling far below the Workspace limit', () => {
    expect(GMAIL_DAILY_CAP).toBeGreaterThan(0)
    expect(GMAIL_DAILY_CAP).toBeLessThanOrEqual(500)
  })
  it('MIME is from zac@, plain text first, no list or tracking headers', () => {
    const mime = buildMime({ to: 'a@b.com', subject: 'Melbourne practical day — Saturday 7 November', text: 'Hi — plain.', html: '<p>Hi — plain.</p>' })
    expect(mime).toContain(`<${GMAIL_SENDER}>`)
    expect(mime.indexOf('text/plain')).toBeLessThan(mime.indexOf('text/html'))
    expect(mime).not.toMatch(/List-Unsubscribe|X-Entity-Ref-ID|Precedence: bulk/i)
    expect(mime).toContain('Subject: =?UTF-8?B?') // em dash → encoded header
  })
  it('derived HTML is Gmail-compose shaped: div per line, <div><br></div> blanks, link clickable, markup escaped', () => {
    const h = textToSimpleHtml('Hi Zac,\n\nLine one <b>\n\nhttps://portal.concussion-education-australia.com/melbourne\n\nZac')
    expect(h.startsWith('<div dir="ltr">')).toBe(true)
    expect((h.match(/<div><br><\/div>/g) || []).length).toBe(3)
    expect(h).toContain('<div>Hi Zac,</div>')
    expect(h).toContain('&lt;b&gt;')
    expect(h).toContain('<a href="https://portal.concussion-education-australia.com/melbourne">')
    expect(h).not.toMatch(/style=|font-size|margin/)
  })
  it('header encoding leaves ASCII alone', () => {
    expect(encodeHeader('Plain subject')).toBe('Plain subject')
  })
  it('a message not from zac@ is a reply', () => {
    expect(isReplyFromOtherSide('Trina Quintos <trina@essa.org.au>')).toBe(true)
    expect(isReplyFromOtherSide('Zac Lewis <zac@concussion-education-australia.com>')).toBe(false)
  })
})
