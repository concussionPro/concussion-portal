/**
 * Regression suite for the CCM progress retention merge.
 *
 * The loss this locks down (found 2026-08-05 adversarially, against the fix in
 * 89f206c6): POST /api/progress is a full overwrite, and the retention pass
 * chose whole ENTRIES — it protected a stored entry only when the incoming one
 * was a zero-progress default. But `markModuleStarted` stamps `startedAt` on
 * mount, so a second tab sitting on the same module always carries a "real"
 * entry, passed the guard, and REPLACED the completion the first tab had just
 * recorded. localStorage is origin-shared, so the local copy went with it.
 */
import { describe, it, expect } from 'vitest'
import { mergeProgressEntry, retainStoredProgress, hasRealProgress } from '@/lib/progress-merge'
import { mergeProgress, parseStoredProgress, reconcileLoadedProgress } from '@/contexts/ProgressContext'

const T0 = '2026-08-05T09:00:00.000Z'
const T1 = '2026-08-05T09:30:00.000Z'

const mod = (id: number, o: Record<string, unknown> = {}) => ({
  moduleId: id, completed: false, quizScore: null, quizTotalQuestions: null,
  quizCompleted: false, quizAnswers: null, quizSubmittedAt: null, quizAttempts: 0,
  quizAttemptHistory: null, startedAt: null, completedAt: null,
  activeStudyMinutes: 0, lastActiveAt: null, ...o,
})
const seed = () => {
  const m: Record<string, Record<string, unknown>> = {}
  for (let i = 1; i <= 8; i++) m[i] = mod(i)
  for (let i = 101; i <= 104; i++) m[i] = mod(i)
  for (let i = 201; i <= 208; i++) m[i] = mod(i)
  return m
}
const completed = (id: number) => mod(id, {
  startedAt: T0, lastActiveAt: T1, activeStudyMinutes: 12, completed: true, completedAt: T1,
  quizCompleted: true, quizScore: 9, quizTotalQuestions: 10, quizSubmittedAt: T1, quizAttempts: 1,
  quizAttemptHistory: [{ at: T1, score: 9, total: 10 }],
})
/** The stale second tab: same module OPEN, not finished. */
const staleOpen = (id: number) => mod(id, { startedAt: T0, lastActiveAt: T1, activeStudyMinutes: 5 })

/** What POST persists, given the stored row and the incoming map. */
const persist = (stored: Record<string, unknown> | null, incoming: Record<string, unknown>) =>
  retainStoredProgress(JSON.parse(JSON.stringify(incoming)), stored) as Record<string, Record<string, unknown>>

describe('progress retention merge — a save can never move a module backwards', () => {
  it.each([1, 2, 3, 8, 101, 104, 201, 208])(
    'module %i survives a stale tab that had the module OPEN',
    (id) => {
      const tabA = { ...seed(), [id]: completed(id) }
      const tabB = { ...seed(), [id]: staleOpen(id) }

      let row = persist(null, tabA)
      expect(row[id].completed).toBe(true)

      // stale tab's 60-second active-study tick fires its own autosave
      row = persist(row, tabB)
      expect(row[id].completed).toBe(true)
      expect(row[id].quizCompleted).toBe(true)
      expect(row[id].quizScore).toBe(9)
      expect(row[id].completedAt).toBe(T1)
      // and the stale tab's own newer study time is still absorbed
      expect(row[id].activeStudyMinutes).toBe(12)
    },
  )

  it('still protects the original case: stale tab holds a zero-progress default', () => {
    const row = persist(persist(null, { ...seed(), 1: completed(1) }), seed())
    expect(row[1].completed).toBe(true)
  })

  it('carries over history for ids stripped as unentitled (key absent)', () => {
    const stored = { ...seed(), 3: completed(3) }
    const strippedIncoming = { ...seed() }
    delete (strippedIncoming as Record<string, unknown>)['3']
    const row = persist(stored, strippedIncoming)
    expect(row[3].completed).toBe(true)
  })

  it('a genuinely NEW completion from the incoming save is persisted', () => {
    const stored = { ...seed(), 4: staleOpen(4) }
    const row = persist(stored, { ...seed(), 4: completed(4) })
    expect(row[4].completed).toBe(true)
    expect(row[4].quizScore).toBe(9)
  })

  it('the latest quiz submission stays authoritative on a retake', () => {
    const first = mod(5, { startedAt: T0, quizCompleted: true, quizScore: 5, quizTotalQuestions: 10,
      quizSubmittedAt: T0, quizAttempts: 1, quizAnswers: { q1: 0 },
      quizAttemptHistory: [{ at: T0, score: 5, total: 10 }] })
    const retake = mod(5, { startedAt: T0, quizCompleted: true, quizScore: 8, quizTotalQuestions: 10,
      quizSubmittedAt: T1, quizAttempts: 2, quizAnswers: { q1: 2 },
      quizAttemptHistory: [{ at: T1, score: 8, total: 10 }] })
    const merged = mergeProgressEntry(first, retake)
    expect(merged.quizScore).toBe(8)
    expect(merged.quizAnswers).toEqual({ q1: 2 })
    expect(merged.quizAttempts).toBe(2)
    // both attempts survive in the log
    expect(merged.quizAttemptHistory).toHaveLength(2)
  })

  it('startedAt keeps the EARLIEST, lastActiveAt the LATEST', () => {
    const a = mod(6, { startedAt: T1, lastActiveAt: T0 })
    const b = mod(6, { startedAt: T0, lastActiveAt: T1 })
    expect(mergeProgressEntry(a, b).startedAt).toBe(T0)
    expect(mergeProgressEntry(a, b).lastActiveAt).toBe(T1)
  })

  it('is order-independent for the completion flag', () => {
    const a = completed(7)
    const b = staleOpen(7)
    expect(mergeProgressEntry(a, b).completed).toBe(true)
    expect(mergeProgressEntry(b, a).completed).toBe(true)
  })

  it('agrees with the client merge on completion monotonicity', () => {
    const tabA = { ...seed(), 1: completed(1) }
    const tabB = { ...seed(), 1: staleOpen(1) }
    const server = persist(persist(null, tabA), tabB)
    const client = mergeProgress(parseStoredProgress(tabA as never), parseStoredProgress(tabB as never))
    expect(server[1].completed).toBe(client[1].completed)
    expect(server[1].completed).toBe(true)
  })

  it('end to end: the completion survives to the next page load', () => {
    const tabA = { ...seed(), 3: completed(3) }
    const tabB = { ...seed(), 3: staleOpen(3) }
    const server = persist(persist(null, tabA), tabB)
    // localStorage is origin-shared, so the stale tab's map is what is on disk
    const next = reconcileLoadedProgress(
      parseStoredProgress(seed() as never),
      parseStoredProgress(tabB as never),
      parseStoredProgress(server as never),
    )
    expect(next[3].completed).toBe(true)
    expect(next[3].quizCompleted).toBe(true)
  })

  it('hasRealProgress matches the entitlement gate it is shared with', () => {
    expect(hasRealProgress(mod(1))).toBe(false)
    expect(hasRealProgress(mod(1, { completed: true }))).toBe(true)
    expect(hasRealProgress(mod(1, { startedAt: T0 }))).toBe(true)
    expect(hasRealProgress(mod(1, { quizCompleted: true }))).toBe(true)
    expect(hasRealProgress(mod(1, { activeStudyMinutes: 3 }))).toBe(true)
    expect(hasRealProgress(mod(1, { quizAnswers: {} }))).toBe(false)
    expect(hasRealProgress(mod(1, { quizAnswers: { q1: 1 } }))).toBe(true)
  })

  it('tolerates a malformed stored row without throwing away the save', () => {
    const incoming = { ...seed(), 2: completed(2) }
    for (const junk of [null, undefined, {}, { 2: null }, { 2: 'nonsense' }, { 2: 7 }]) {
      const row = persist(junk as never, incoming)
      expect(row[2].completed).toBe(true)
    }
  })
})
