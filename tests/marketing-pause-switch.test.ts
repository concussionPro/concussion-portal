import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'

// MARKETING_EMAILS_PAUSED=true must short-circuit every marketing cron before
// any send. Transactional routes are deliberately NOT on this list.
const MARKETING_CRONS = [
  'app/api/cron/send-nurture-emails/route.ts',
  'app/api/cron/ep-nurture/route.ts',
  'app/api/cron/hub-seat-reminders/route.ts',
]

describe('marketing pause switch', () => {
  for (const f of MARKETING_CRONS) {
    it(`${f} returns before sending when MARKETING_EMAILS_PAUSED=true`, () => {
      const src = readFileSync(f, 'utf8')
      const handler = src.indexOf('export async function GET')
      expect(handler).toBeGreaterThan(-1)
      const body = src.slice(handler)
      const guardAt = body.indexOf("process.env.MARKETING_EMAILS_PAUSED === 'true'")
      expect(guardAt).toBeGreaterThan(-1)
      // imports sit above the handler; only calls inside it count as sends
      const firstSend = body.search(/sendEmail\(|new EmailScheduler\(|scheduler\.(add|enqueue|schedule)\(/)
      expect(firstSend === -1 || guardAt < firstSend).toBe(true)
    })
  }
})
