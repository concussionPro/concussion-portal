import { describe, it, expect } from 'vitest'
import { QUIZ_QUESTIONS, gradeQuiz, PASS_MARK } from '@/lib/ai-course/quiz'

describe('AI course quiz — grading', () => {
  it('has exactly 10 questions', () => {
    expect(QUIZ_QUESTIONS.length).toBe(10)
  })

  it('every question has a valid correctIndex within bounds', () => {
    for (const q of QUIZ_QUESTIONS) {
      expect(q.correctIndex).toBeGreaterThanOrEqual(0)
      expect(q.correctIndex).toBeLessThan(q.options.length)
    }
  })

  it('every question has a rationale (non-empty)', () => {
    for (const q of QUIZ_QUESTIONS) {
      expect(q.rationale.length).toBeGreaterThan(20)
    }
  })

  it('pass mark is 8/10', () => {
    expect(PASS_MARK).toBe(8)
  })

  it('grades a perfect submission as passed with score 10', () => {
    const submission = {
      answers: QUIZ_QUESTIONS.map((q) => ({ questionId: q.id, selectedIndex: q.correctIndex })),
    }
    const r = gradeQuiz(submission)
    expect(r.passed).toBe(true)
    expect(r.score).toBe(10)
    expect(r.feedback.every((f) => f.correct)).toBe(true)
  })

  it('grades an all-wrong submission as failed with score 0', () => {
    const submission = {
      answers: QUIZ_QUESTIONS.map((q) => ({
        questionId: q.id,
        selectedIndex: (q.correctIndex + 1) % q.options.length,
      })),
    }
    const r = gradeQuiz(submission)
    expect(r.passed).toBe(false)
    expect(r.score).toBe(0)
  })

  it('grades a borderline submission (exactly 8/10) as passed', () => {
    const submission = {
      answers: QUIZ_QUESTIONS.map((q, i) => ({
        questionId: q.id,
        selectedIndex: i < 8 ? q.correctIndex : (q.correctIndex + 1) % q.options.length,
      })),
    }
    const r = gradeQuiz(submission)
    expect(r.passed).toBe(true)
    expect(r.score).toBe(8)
  })

  it('grades a 7/10 submission as failed (one mark below)', () => {
    const submission = {
      answers: QUIZ_QUESTIONS.map((q, i) => ({
        questionId: q.id,
        selectedIndex: i < 7 ? q.correctIndex : (q.correctIndex + 1) % q.options.length,
      })),
    }
    const r = gradeQuiz(submission)
    expect(r.passed).toBe(false)
    expect(r.score).toBe(7)
  })

  it('treats missing answers as wrong (does not throw)', () => {
    const r = gradeQuiz({ answers: [] })
    expect(r.passed).toBe(false)
    expect(r.score).toBe(0)
    expect(r.feedback.length).toBe(10)
  })

  it('returns feedback for every question', () => {
    const r = gradeQuiz({ answers: [] })
    for (const q of QUIZ_QUESTIONS) {
      const fb = r.feedback.find((f) => f.questionId === q.id)
      expect(fb).toBeDefined()
      expect(fb?.correctIndex).toBe(q.correctIndex)
      expect(fb?.rationale).toBeTruthy()
    }
  })

  it('Q1 enforces de-identification before consumer-tier use', () => {
    const q1 = QUIZ_QUESTIONS.find((q) => q.id === 'q1-pii-tier-c')
    expect(q1).toBeDefined()
    expect(q1!.options[q1!.correctIndex]).toMatch(/de-identif/i)
  })

  it('Q4 places clinical responsibility on the clinician (not the vendor)', () => {
    const q4 = QUIZ_QUESTIONS.find((q) => q.id === 'q4-clinician-responsibility')
    expect(q4).toBeDefined()
    expect(q4!.options[q4!.correctIndex]).toMatch(/clinician/i)
    expect(q4!.options[q4!.correctIndex]).not.toMatch(/vendor/i)
  })

  it('Q6 documentation answer includes both AI use AND clinician verification', () => {
    const q6 = QUIZ_QUESTIONS.find((q) => q.id === 'q6-documentation-requirement')
    expect(q6).toBeDefined()
    const correct = q6!.options[q6!.correctIndex]
    expect(correct).toMatch(/AI/i)
    expect(correct).toMatch(/review|verified/i)
  })

  it('Q7 TGA answer flags treatment/prevention claims, not factual descriptions', () => {
    const q7 = QUIZ_QUESTIONS.find((q) => q.id === 'q7-tga-supplement-claim')
    expect(q7).toBeDefined()
    expect(q7!.options[q7!.correctIndex]).toMatch(/treat|prevent/i)
  })

  it('all-zero submission does not pass even if correctIndex is 0 for some questions', () => {
    const submission = {
      answers: QUIZ_QUESTIONS.map((q) => ({ questionId: q.id, selectedIndex: 0 })),
    }
    const r = gradeQuiz(submission)
    expect(r.passed).toBe(false)
  })
})
