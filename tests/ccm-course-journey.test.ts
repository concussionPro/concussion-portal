import { describe, it, expect } from 'vitest'
import { getAllModules } from '../data/modules'
import { verifyModuleQuiz } from '../lib/quiz-verify'
import { CONFIG } from '../lib/config'
import {
  getOnlineCourseCertificateData,
  getFullCourseCertificateData,
  getSCATCertificateData,
  generateCertificatePDF,
} from '../lib/certificate'
import {
  mergeProgress,
  parseStoredProgress,
  quizPassThreshold,
  reconcileLoadedProgress,
  type ModuleProgress,
} from '../contexts/ProgressContext'

/**
 * THE CCM JOURNEY — the flagship $497/$1,190 product with real paying
 * customers. Every case here is a defect a paying clinician would experience
 * silently: lost work, a certificate that will not issue, a step that renders
 * the wrong section.
 */

const CCM = getAllModules()

function progressEntry(overrides: Partial<ModuleProgress> & { moduleId: number }): ModuleProgress {
  return {
    completed: false,
    quizScore: null,
    quizTotalQuestions: null,
    quizCompleted: false,
    quizAnswers: null,
    quizSubmittedAt: null,
    quizAttempts: 0,
    quizAttemptHistory: null,
    startedAt: null,
    completedAt: null,
    activeStudyMinutes: 0,
    lastActiveAt: null,
    ...overrides,
  }
}

describe('CCM progress merge never loses a clinician’s work', () => {
  // The load path used to READ localStorage only to decide whether to show a
  // "restored" banner, then overwrite it with the server snapshot. Any save
  // that never reached the server — an offline study session, a 500 that
  // outlived the retry schedule — was destroyed on the next page load.
  it('keeps local-only completions the server has never seen', () => {
    const local = {
      3: progressEntry({
        moduleId: 3,
        completed: true,
        completedAt: new Date('2026-08-01T10:00:00Z'),
        quizCompleted: true,
        quizScore: 11,
        quizTotalQuestions: 12,
        quizAnswers: { 'm3-q1': 0 },
      }),
    }
    const server = {
      3: progressEntry({ moduleId: 3, startedAt: new Date('2026-07-30T10:00:00Z') }),
    }

    // The real load path: fresh store + localStorage + the server snapshot.
    const merged = reconcileLoadedProgress({}, local, server)

    expect(merged[3].completed).toBe(true)
    expect(merged[3].quizScore).toBe(11)
    expect(merged[3].quizAnswers).toEqual({ 'm3-q1': 0 })
  })

  it('takes the server copy when the server is further along', () => {
    const local = { 5: progressEntry({ moduleId: 5, startedAt: new Date('2026-08-01T10:00:00Z') }) }
    const server = {
      5: progressEntry({
        moduleId: 5,
        completed: true,
        quizCompleted: true,
        quizScore: 9,
        quizTotalQuestions: 10,
        quizAnswers: { 'm5-q1': 2 },
      }),
    }

    const merged = reconcileLoadedProgress({}, local, server)

    expect(merged[5].completed).toBe(true)
    expect(merged[5].quizAnswers).toEqual({ 'm5-q1': 2 })
  })

  it('a stale second tab can never downgrade a completed module', () => {
    const finished = { 1: progressEntry({ moduleId: 1, completed: true, quizCompleted: true, quizScore: 13, quizTotalQuestions: 15 }) }
    const staleTab = { 1: progressEntry({ moduleId: 1 }) }

    expect(mergeProgress(finished, staleTab)[1].completed).toBe(true)
    expect(mergeProgress(staleTab, finished)[1].completed).toBe(true)
  })

  it('keeps in-flight progress made while the load was still running', () => {
    // markModuleStarted fires within a second of mount, before the fetch
    // resolves. The server snapshot must not erase it.
    const inFlight = { 4: progressEntry({ moduleId: 4, startedAt: new Date('2026-08-02T09:00:00Z') }) }
    const merged = reconcileLoadedProgress(inFlight, null, { 4: progressEntry({ moduleId: 4 }) })
    expect(merged[4].startedAt).toBeInstanceOf(Date)
  })

  it('falls back to the local copy alone when the server load fails', () => {
    const local = { 7: progressEntry({ moduleId: 7, completed: true }) }
    expect(reconcileLoadedProgress({}, local, null)[7].completed).toBe(true)
  })

  it('seeds every CCM module id even with nothing stored anywhere', () => {
    const merged = reconcileLoadedProgress({}, null, null)
    for (let id = 1; id <= 8; id++) expect(merged[id]?.moduleId).toBe(id)
  })

  it('parses a stored blob without losing the attempt record', () => {
    // Pre-2026-08 rows carry no attempt counter; a completed quiz must read as
    // at least one attempt, never "never sat".
    const parsed = parseStoredProgress({
      '2': { quizCompleted: true, quizScore: 9, quizTotalQuestions: 11 } as unknown as ModuleProgress,
    })
    expect(parsed[2].quizAttempts).toBe(1)
  })
})

describe('CCM module structure supports the section stepper', () => {
  it('every module has parts whose sectionIds are a permutation of its sections', () => {
    for (const m of CCM) {
      expect(m.parts?.length, `module ${m.id} has no parts`).toBeGreaterThan(0)
      const fromParts = (m.parts ?? []).flatMap((p) => p.sectionIds)
      const actual = m.sections.map((s) => s.id)
      expect(
        [...fromParts].sort(),
        `module ${m.id}: parts do not cover its sections exactly once — a step would render the wrong content or none`,
      ).toEqual([...actual].sort())
    }
  })

  it('every module’s parts cover every quiz question exactly once', () => {
    for (const m of CCM) {
      const fromParts = (m.parts ?? []).flatMap((p) => p.quizIds)
      const actual = m.quiz.map((q) => q.id)
      expect(
        [...fromParts].sort(),
        `module ${m.id}: a quiz question sits in no part, so it can never be answered — and the submit gate demands every question`,
      ).toEqual([...actual].sort())
    }
  })

  // THE MODULE 1 BUG. Parts list sectionIds in READING order, which is not the
  // array order for module 1 (`learning-objectives` before `myths-intro`). The
  // renderer used to recover the section by COUNTING preceding content steps —
  // so the stepper label and the rendered section diverged. The step now
  // carries its own sectionIndex; this asserts the two orders genuinely differ,
  // i.e. that the counting shortcut is not safe to reintroduce.
  it('reading order and array order really do diverge, so steps must carry their section index', () => {
    const divergent = CCM.filter((m) => {
      const fromParts = (m.parts ?? []).flatMap((p) => p.sectionIds)
      return JSON.stringify(fromParts) !== JSON.stringify(m.sections.map((s) => s.id))
    })
    expect(divergent.map((m) => m.id)).toContain(1)
  })

  it('resolving a step by its section index yields the section named on the step', () => {
    for (const m of CCM) {
      for (const part of m.parts ?? []) {
        for (const sectionId of part.sectionIds) {
          const sIdx = m.sections.findIndex((s) => s.id === sectionId)
          expect(sIdx, `module ${m.id}: part references unknown section '${sectionId}'`).toBeGreaterThanOrEqual(0)
          // label built from module.sections[sIdx] === section rendered from the same index
          expect(m.sections[sIdx].id).toBe(sectionId)
        }
      }
    }
  })
})

describe('CCM quizzes are passable and pass at 75%, verified server-side', () => {
  it('every module has a quiz — a module with none can never be completed', () => {
    for (const m of CCM) {
      expect(m.quiz.length, `module ${m.id} has no quiz, so canMarkModuleComplete can never be true`).toBeGreaterThan(0)
      for (const q of m.quiz) {
        expect(q.options.length, `module ${m.id} question ${q.id} has no options`).toBeGreaterThan(1)
        expect(q.correctAnswer, `module ${m.id} question ${q.id}: correctAnswer out of range`).toBeGreaterThanOrEqual(0)
        expect(q.correctAnswer).toBeLessThan(q.options.length)
      }
    }
  })

  it('the flagship threshold is 75%', () => {
    expect(quizPassThreshold(1)).toBe(0.75)
    expect(quizPassThreshold(8)).toBe(0.75)
  })

  it('a full-marks answer sheet verifies for every module', () => {
    for (const m of CCM) {
      const answers = Object.fromEntries(m.quiz.map((q) => [q.id, q.correctAnswer]))
      const v = verifyModuleQuiz(m.id, answers)
      expect(v.ok, `module ${m.id} failed server verification on a perfect sheet`).toBe(true)
      expect(v.score).toBe(m.quiz.length)
    }
  })

  it('verification is computed from the answers, not trusted from the client', () => {
    const m = CCM[0]
    // Deliberately wrong on every question — the client could claim any score.
    const wrong = Object.fromEntries(
      m.quiz.map((q) => [q.id, (q.correctAnswer + 1) % q.options.length]),
    )
    expect(verifyModuleQuiz(m.id, wrong).ok).toBe(false)
    // No stored answers at all → fail closed, never "assume they passed".
    expect(verifyModuleQuiz(m.id, null).ok).toBe(false)
    expect(verifyModuleQuiz(m.id, {}).ok).toBe(false)
  })

  it('sits exactly on the 75% boundary correctly', () => {
    const m = CCM.find((x) => x.id === 1)!
    const needed = Math.ceil(m.quiz.length * 0.75)
    const sheet = (correctCount: number) =>
      Object.fromEntries(
        m.quiz.map((q, i) => [q.id, i < correctCount ? q.correctAnswer : (q.correctAnswer + 1) % q.options.length]),
      )
    expect(verifyModuleQuiz(m.id, sheet(needed)).ok).toBe(true)
    expect(verifyModuleQuiz(m.id, sheet(needed - 1)).ok).toBe(false)
  })
})

describe('CCM certificate figures come from CONFIG, never a literal', () => {
  const cert = getOnlineCourseCertificateData('Test Clinician', 'test@example.com', new Date('2026-08-01'))

  it('the online certificate carries the configured online CPD hours', () => {
    expect(cert.cpdPoints).toBe(CONFIG.COURSE.ONLINE_CPD_POINTS)
  })

  it('the full-course certificate carries the configured total', () => {
    const full = getFullCourseCertificateData('Test Clinician', 'test@example.com', new Date('2026-08-01'))
    expect(full.cpdPoints).toBe(CONFIG.COURSE.TOTAL_CPD_POINTS)
  })

  it('the SCAT certificate carries the configured SCAT hours', () => {
    const scat = getSCATCertificateData('Test Clinician', 'test@example.com', new Date('2026-08-01'))
    expect(scat.cpdPoints).toBe(CONFIG.COURSE.SCAT_MASTERY_CPD_POINTS)
  })

  it('the module count quoted on the certificate matches the course', () => {
    expect(cert.courseDescription).toContain(`${CONFIG.COURSE.TOTAL_MODULES}-module`)
    expect(CCM.length).toBe(CONFIG.COURSE.TOTAL_MODULES)
  })

  it('issues a PDF with a stable, prefixed certificate id', () => {
    const a = generateCertificatePDF(cert)
    const b = generateCertificatePDF(cert)
    expect(a.certificateId).toBe(b.certificateId)
    expect(a.certificateId).toMatch(/^CEA-ONL-2026-[0-9A-F]{8}$/)
    expect(a.pdfBuffer.length).toBeGreaterThan(1000)
  })

  it('honours an id already on record so a re-issue keeps the shared verify link', () => {
    const reissued = generateCertificatePDF({ ...cert, certificateId: 'CEA-ONL-2026-DEADBEEF' })
    expect(reissued.certificateId).toBe('CEA-ONL-2026-DEADBEEF')
  })
})
