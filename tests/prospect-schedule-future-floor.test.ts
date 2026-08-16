import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'

/**
 * INCIDENT LOCK — cold engine dark 2026-08-12 → 2026-08-17.
 *
 * Resend rejects any scheduled_at that is not strictly in the future
 * (422 validation_error). The engine's first stagger slot was runStart
 * itself, which is already the past by the time the API call lands, so the
 * head send of every cron run failed and the run produced zero deliveries
 * for 5 days — silently, because the failure path releases the audit key
 * and returns 200.
 *
 * This lock pins the future floor on the scheduled_at computation. If the
 * stagger is ever rewritten, the first slot must remain strictly in the
 * future — keep a positive constant offset ahead of the cursor.
 */
describe('cold engine scheduled_at future floor', () => {
  it('first stagger slot is scheduled strictly in the future', () => {
    const src = readFileSync(
      path.join(__dirname, '..', 'lib', 'prospect', 'process-scheduled.ts'),
      'utf8',
    )
    const line = src.split('\n').find((l) => l.includes('const scheduledAtIso'))
    expect(line, 'scheduledAtIso computation missing').toBeTruthy()
    // runStart + <positive constant> + cursor — the constant is the floor.
    expect(line).toMatch(/runStart \+ \d[\d_]* \+ staggerCursorMs/)
  })
})
