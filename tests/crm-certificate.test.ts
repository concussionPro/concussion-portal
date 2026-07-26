import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { getCrmCertificateData } from '@/lib/certificate'
import { verifyModuleQuiz } from '@/lib/quiz-verify'
import { epModules } from '@/data/ep-modules'

/**
 * CRM CERTIFICATE PATH — built 2026-07-27, the day the ESSA listing went live.
 *
 * A paying CRM buyer completing all 8 EP modules must receive a REAL
 * ESSA-accredited CPD certificate (8 points online). Before this existed the
 * EP dashboard promised "your certificate is on its way" with no delivery
 * path, and the certificate API's only preview-tier types were the free ones.
 *
 * These tests pin the invariants that made the path wrong twice already:
 * CRM buyers carry access_level 'preview', and EP progress lives at 201-208.
 */

const root = join(__dirname, '..')
const read = (p: string) => readFileSync(join(root, p), 'utf8')

describe('CRM certificate data', () => {
  const data = getCrmCertificateData('Test EP', 'ep@example.com', new Date('2026-07-27'))

  it('is the 8-point ESSA online certificate, typed crm-online', () => {
    expect(data.cpdPoints).toBe(8)
    expect(data.courseType).toBe('crm-online')
    expect(data.courseTitle).toBe('Concussion Rehab Mastery')
  })

  it('has 3-5 learning outcomes (BOC/ESSA promotional-material convention)', () => {
    expect(data.learningOutcomes.length).toBeGreaterThanOrEqual(3)
    expect(data.learningOutcomes.length).toBeLessThanOrEqual(5)
  })
})

describe('certificate PDF claims stay stream-correct', () => {
  const src = read('lib/certificate.ts')

  it('OA endorsement is never printed on the CRM certificate', () => {
    // The OA gate must not include crm-online.
    const gate = src.match(/const isOaEndorsed = ([^\n]+)/)?.[1] ?? ''
    expect(gate).not.toContain('crm')
  })

  it('ESSA accreditation line prints ONLY for crm-online', () => {
    expect(src).toMatch(/courseType === 'crm-online'[\s\S]{0,200}Accredited by Exercise & Sports Science Australia/)
  })

  it('CRM certificate ids carry their own prefix', () => {
    expect(src).toMatch(/'crm-online' \? 'CRM'/)
  })
})

describe('EP quiz verification (server-side answer key)', () => {
  const m201 = epModules.find((m) => m.id === 201)!

  it('knows the EP answer keys at the NAMESPACED ids 201-208', () => {
    for (const m of epModules) {
      const v = verifyModuleQuiz(m.id, null)
      // no-answers (key exists) — NOT no-quiz-data (key missing)
      expect(v.reason, `module ${m.id}`).toBe('no-answers')
    }
  })

  it('passes a perfect score', () => {
    const answers = Object.fromEntries(m201.quiz!.map((q) => [q.id, q.correctAnswer]))
    expect(verifyModuleQuiz(201, answers).ok).toBe(true)
  })

  it('holds EP modules to the 80% pass mark, not the flagship 75%', () => {
    const quiz = m201.quiz!
    // Answer exactly 75%-ish: wrong on just over 20% of questions.
    const wrongCount = Math.ceil(quiz.length * 0.25)
    const answers = Object.fromEntries(
      quiz.map((q, i) => [q.id, i < wrongCount ? (q.correctAnswer + 1) % 4 : q.correctAnswer]),
    )
    const v = verifyModuleQuiz(201, answers)
    expect(v.score / v.total).toBeLessThan(0.8)
    expect(v.ok).toBe(false)
  })
})

describe('certificate API serves the CRM stream', () => {
  const route = read('app/api/certificate/route.ts')

  it('gates the crm type on course_purchases ownership, never access_level', () => {
    expect(route).toMatch(/courseType === 'crm' && !\(await userOwnsCrm\(/)
  })

  it('checks completion at the namespaced ids 201-208', () => {
    expect(route).toContain('[201, 202, 203, 204, 205, 206, 207, 208]')
  })

  it('the CRM cert email never falls into the free-tier CCM pitch', () => {
    // The crm branch must be checked BEFORE the accessLevel switch.
    expect(route).toMatch(/opts\.courseType === 'crm' \? `/)
  })
})

describe('EP dashboard delivers the certificate', () => {
  const dash = read('app/ep-course/dashboard/page.tsx')

  it('links the real certificate endpoint on completion', () => {
    expect(dash).toContain('/api/certificate?type=crm')
  })

  it('admits CRM owners (ownsCrm), not just non-preview access levels', () => {
    expect(dash).toMatch(/accessLevel === 'preview' && !data\.user\.ownsCrm/)
  })
})
