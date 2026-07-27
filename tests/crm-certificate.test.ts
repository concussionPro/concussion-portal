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

describe('CPD totals are body-specific rulings, never equalised', () => {
  it('CCM = 14 (OA: 6-hr day) and CRM = 16 (ESSA: 8-hr day) — same day, different counting rules', async () => {
    const { CONFIG } = await import('@/lib/config')
    expect(CONFIG.COURSE.TOTAL_CPD_POINTS).toBe(14)
    expect(CONFIG.COURSE.CRM_TOTAL_CPD_POINTS).toBe(16)
    expect(CONFIG.COURSE.ONLINE_CPD_POINTS).toBe(8)
    // If OA re-rates the practical day to 8, TOTAL_CPD_POINTS legitimately
    // becomes 16 — update this test WITH the OA paperwork, not before.
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

describe('ESSA accreditation terms (letter of 27 Jul 2026)', () => {
  it('config carries the formal terms as the single source', async () => {
    const { CONFIG } = await import('@/lib/config')
    expect(CONFIG.ESSA_ACCREDITATION.NUMBER).toBe('PDNF26077')
    expect(CONFIG.ESSA_ACCREDITATION.ONLINE_POINTS).toBe(8)
    expect(CONFIG.ESSA_ACCREDITATION.PRACTICAL_POINTS).toBe(8)
    expect(CONFIG.ESSA_ACCREDITATION.VALID_UNTIL).toBe('2027-07-24')
    // ESSA's mandated wording, verbatim with the points substituted.
    expect(CONFIG.ESSA_ACCREDITATION.statement(8)).toBe(
      'The ESSA Professional Development Committee certifies that this Professional Development offering meets the criteria for 8 Continuing Professional Development (CPD) Points.',
    )
  })

  it('the CRM certificate prints the accreditation number and mandated statement', () => {
    const src = read('lib/certificate.ts')
    expect(src).toContain('Accreditation No. PDNF26077 (Online)')
    expect(src).toContain('meets the criteria for 8 Continuing Professional Development (CPD) Points')
  })

  it('accreditation is not yet expired (re-accredit before 24 Jul 2027)', async () => {
    const { CONFIG } = await import('@/lib/config')
    if (CONFIG.FEATURES.ESSA_ACCREDITED) {
      // This test starts failing near expiry by DESIGN — it is the renewal alarm.
      const daysLeft = (new Date(CONFIG.ESSA_ACCREDITATION.VALID_UNTIL).getTime() - Date.now()) / 86_400_000
      expect(daysLeft, 'ESSA accreditation expires within 60 days — start re-accreditation NOW or flip ESSA_ACCREDITED off').toBeGreaterThan(60)
    }
  })
})

describe('PMS plugin (2026-07-27 build) — the rails that keep it safe', () => {
  const tenant = read('lib/sst-trainer/pms/tenant.ts')
  const fileRoute = read('app/api/sst/pms/file/route.ts')
  const connRoute = read('app/api/sst/pms/connection/route.ts')
  const patientsRoute = read('app/api/sst/pms/patients/route.ts')

  it('credentials are stored AES-GCM encrypted, never plaintext', () => {
    expect(tenant).toContain('aes-256-gcm')
    expect(tenant).toMatch(/encryptCred\(args\.apiKey\)/)
  })

  it('every route authorises via code + viewKey', () => {
    for (const src of [fileRoute, connRoute, patientsRoute]) {
      expect(src).toContain('verifyViewKey')
    }
  })

  it('Gensolve writes stay behind the first-partner validation gate', () => {
    expect(tenant).toContain("GENSOLVE_UPLOAD_CONFIRMED === 'true'")
    expect(fileRoute).toMatch(/gensolve' && !gensolveWritesConfirmed\(\)/)
  })

  it('filing enforces the jurisdiction rule like the report viewer', () => {
    expect(fileRoute).toMatch(/acc884' \|\| skin === 'acc885' \? 'NZ' : 'AU'/)
    expect(fileRoute).toContain('getReportSkins(jurisdiction).includes(skin)')
  })

  it('crypto roundtrip works', async () => {
    process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-secret-for-roundtrip'
    const { encryptCred, decryptCred } = await import('@/lib/sst-trainer/pms/tenant')
    const secret = 'MS-abc123-apikey-xyz'
    expect(decryptCred(encryptCred(secret))).toBe(secret)
  })
})
