import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  NOT_ANSWERED,
  notAnswered,
  percentOrNotAnswered,
} from '@/lib/preseason/report-format'

/**
 * A pre-season baseline is the reference every future post-injury comparison is
 * measured against. A field the athlete never answered must never be reported
 * as a clinical value — that is a fabricated record, not a gap.
 *
 * Two fields used to arrive pre-answered and were printed as fact:
 *   previousConcussions seeded '0'   → "no previous concussions" (the single
 *                                      strongest risk factor, fabricated)
 *   feelNormalPercent   seeded '100' → "100% of normal" (a fabricated
 *                                      asymptomatic reference)
 *
 * These tests pin the behaviour so neither default can come back.
 */
const FORM = join(process.cwd(), 'app/preseason/b/[code]/page.tsx')
const formSource = readFileSync(FORM, 'utf8')

describe('preseason baseline — unanswered fields are never fabricated', () => {
  describe('report rendering', () => {
    it('prints an unanswered value as "Not answered", not as a number', () => {
      expect(notAnswered('')).toBe(NOT_ANSWERED)
      expect(notAnswered('   ')).toBe(NOT_ANSWERED)
      expect(notAnswered(undefined)).toBe(NOT_ANSWERED)
      expect(notAnswered(null)).toBe(NOT_ANSWERED)
    })

    it('still prints a genuine 0 as 0 — a real answer is not a blank', () => {
      // Older clients and offline-queued submissions still send the old
      // pre-filled defaults; those must render as the numbers they are.
      expect(notAnswered('0')).toBe('0')
      expect(notAnswered('3')).toBe('3')
    })

    it('prints an unanswered percentage as "Not answered", never "100%" or a bare "%"', () => {
      expect(percentOrNotAnswered('')).toBe(NOT_ANSWERED)
      expect(percentOrNotAnswered(undefined)).toBe(NOT_ANSWERED)
      // The pre-fix code interpolated the raw value, so a blank printed as "%".
      expect(percentOrNotAnswered('')).not.toContain('%')
    })

    it('still prints a genuine percentage, including 100 and 0', () => {
      expect(percentOrNotAnswered('100')).toBe('100%')
      expect(percentOrNotAnswered('0')).toBe('0%')
      expect(percentOrNotAnswered('65')).toBe('65%')
    })
  })

  describe('form defaults', () => {
    it('does not seed previousConcussions with a fabricated 0', () => {
      expect(formSource).not.toMatch(/useState\(['"]0['"]\)[^\n]*\n?\s*(?=.*previousConcussions)/)
      expect(formSource).toContain("const [previousConcussions, setPreviousConcussions] = useState('')")
    })

    it('does not seed feelNormalPercent with a fabricated 100', () => {
      expect(formSource).toContain("const [feelNormalPercent, setFeelNormalPercent] = useState('')")
      expect(formSource).not.toContain("useState('100')")
    })

    it('keeps the 22-item symptom scale UNRATED by default', () => {
      expect(formSource).toContain('new Array(22).fill(UNRATED)')
    })

    it('bumps DRAFT_VERSION so older drafts cannot restore the old defaults as answers', () => {
      const m = formSource.match(/const DRAFT_VERSION = (\d+)/)
      expect(m).not.toBeNull()
      expect(Number(m![1])).toBeGreaterThanOrEqual(3)
    })

    it('gives the feel-normal slider an explicit unanswered state', () => {
      // A range input has no null position, so the UI must say so in words
      // rather than let a parked thumb read as an answer.
      expect(formSource).toMatch(/Not answered — move the slider/)
      expect(formSource).toMatch(/aria-valuetext=\{feelNormalPercent === '' \? 'Not answered'/)
    })

    it('does not collapse a cleared percentage box back to 0', () => {
      expect(formSource).toMatch(/if \(raw\.trim\(\) === ''\) \{ setFeelNormalPercent\(''\); return \}/)
    })
  })
})
