import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * DAILY CHECK-INS MUST HAVE A CLINICIAN READER.
 *
 * WHY THIS EXISTS (2026-09-11). From the check-in's ship date until today,
 * sst_daily_checkins was written by /api/sst/checkin and read by NOTHING.
 * Patients answered a symptom question every day believing their clinician
 * could see it; the clinician's first sight of a bad week was the next
 * appointment. MSCC flagged it in their 08-11 meeting, and it is the weak
 * point of the "clinician makes every decision" regulatory posture — data
 * collected that the treating clinician cannot act on.
 *
 * This locks the pair: the WRITE path and the READ path must both touch the
 * table. A refactor that drops the roster's check-in query silently re-orphans
 * the data — the write keeps succeeding, the patient keeps answering, and
 * nothing tells anybody the clinician went blind again.
 */

const ROOT = join(__dirname, '..')
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8')

describe('daily check-ins reach the clinician', () => {
  it('the patient write path stores check-ins', () => {
    const registry = read('lib/sst-trainer/patient-registry.ts')
    expect(registry).toMatch(/INSERT INTO sst_daily_checkins/)
  })

  it('the clinic roster reads them back', () => {
    const roster = read('app/api/sst/clinic-sessions/route.ts')
    expect(roster, 'roster no longer queries sst_daily_checkins — the clinician is blind to check-ins again').toMatch(
      /FROM sst_daily_checkins/,
    )
    expect(roster, 'roster query must stay guarded: a clinic with no check-ins yet has no table').toMatch(
      /catch \{ \/\* table not yet created/,
    )
    expect(roster, 'the per-patient payload lost its checkins field').toMatch(/checkins: p\.patientCode/)
  })

  it('the hub renders the strip descriptively — data, not derived advice', () => {
    const hub = read('app/clinical-hub/page.tsx')
    expect(hub).toMatch(/Daily check-ins/)
    // The strip must never grow software-generated clinical direction: the
    // TGA position rests on the clinician making every decision. Rendering
    // the trend is fine; telling the clinician what to do about it is not.
    for (const banned of [/[Rr]educe the band/, /[Ss]top training/, /[Ii]ncrease (?:the )?dose/]) {
      expect(hub, `check-in strip appears to give clinical advice (${banned})`).not.toMatch(banned)
    }
  })

  it('a check-in is never counted as a delivered session', () => {
    // The registry docblock carries the rule; the roster must not merge
    // check-ins into `sessions` (they attach as their own field).
    const roster = read('app/api/sst/clinic-sessions/route.ts')
    expect(roster).not.toMatch(/trainings\.push\([^)]*checkin/i)
  })
})

describe('cap prompts fire on both sides of the limit', () => {
  // notifyPlanFull covers the refusal; notifyApproachingCap covers the LAST
  // successful admission before it. Losing either half silently reverts the
  // upgrade prompt to failure-moment-only, which is the defect it replaced.
  const src = readFileSync(join(ROOT, 'app/api/sst/session/route.ts'), 'utf8')

  it('the approaching-cap nudge exists and checks suppression before the audit key', () => {
    const fn = src.slice(src.indexOf('async function notifyApproachingCap'))
    expect(fn.length).toBeGreaterThan(100)
    const supIdx = fn.indexOf('email_suppression')
    const keyIdx = fn.indexOf('INSERT INTO email_audit_log')
    expect(supIdx).toBeGreaterThan(-1)
    expect(keyIdx).toBeGreaterThan(-1)
    // Suppression BEFORE the key claim — the 2026-08-06 planfull lesson: a
    // burned key with no email means a month of silence.
    expect(supIdx).toBeLessThan(keyIdx)
  })

  it('it fires on the admission that reaches cap-1, paid plans only', () => {
    expect(src).toMatch(/usage\.plan === 'active' && !usage\.pendingActivation && usage\.cap != null && usage\.patientCount \+ 1 === usage\.cap/)
  })

  it('a failed send releases the month key', () => {
    const fn = src.slice(src.indexOf('async function notifyApproachingCap'))
    expect(fn).toMatch(/if \(!sent\) await sql`DELETE FROM email_audit_log/)
  })
})
