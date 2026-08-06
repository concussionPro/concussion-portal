/**
 * COURSE DELIVERY / STUDENT ACCOUNT regression suite (2026-08-06 lane B sweep).
 *
 * Each block pins a defect that was live, found by USING the product rather
 * than reading it:
 *
 *  1. SECTION CHECKPOINT NEVER RESTORED. CourseModulePage's save effect and its
 *     restore effect both fire in the commit where `module` first becomes
 *     non-null, and React runs effects in declaration order — so the save wrote
 *     "0" over the stored checkpoint microseconds before the restore read it.
 *     "Continue where you left off" resumed at step 1 every time, in BOTH
 *     courses. Proven with Playwright: step 4/17 → reload → 1/17.
 *
 *  2. CRM CPD REPORTED AS A MODULE COUNT. CCM's modules are 1 CPD hour each so
 *     the count and the hours coincide and the bug was invisible there. CRM
 *     module points are 1 / 0.5 / 1.5 / 1.5 / 1 / 1 / 1 / 0.5, so /learning told
 *     a CRM buyer "2 / 8 ESSA CPD Points" when they had earned 1.5 — and
 *     disagreed with /ep-course/dashboard and with the certificate.
 *
 *  3. CCM-ONLY ENTITLEMENTS PROMISED TO CRM BUYERS. A CRM buyer is a paying
 *     customer whose access_level is 'preview'. /settings called that
 *     `isPaidUser` and printed "FULL ACCESS" against the Clinical Toolkit and
 *     the Reference Repository — both of which lib/toolkit-access.ts and
 *     /references refuse them — and offered "ADD WORKSHOP →" to /upgrade, which
 *     redirects every 'preview' user to the CCM /pricing page.
 *
 *  4. CERTIFICATE CTA THAT SWALLOWS THE SERVER'S REASON. /api/certificate
 *     re-verifies every quiz from the stored answers before issuing a CPD
 *     document and names the module to retake. A bare <a href> navigated the
 *     tab to raw JSON; a generic catch rendered "Certificate email failed — you
 *     can still download it below" when the DOWNLOAD was what failed.
 *
 *  5. EP PASS MARK. CRM passes at 80%, CCM at 75%. Executed against the real
 *     server verifier and the real course data, not asserted from source.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { epModules } from '@/data/ep-modules'
import { verifyModuleQuiz } from '@/lib/quiz-verify'
import { CONFIG } from '@/lib/config'

const ROOT = join(__dirname, '..')
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8')
/** Source with comments removed — a rationale comment naming the old bug must
 *  not read as the bug still being present. */
const code = (rel: string) =>
  read(rel)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')

describe('1. section checkpoint survives a reload', () => {
  const src = code('components/course/CourseModulePage.tsx')

  it('the checkpoint WRITE is gated on the restore having run for this key', () => {
    // The write must not be unconditional — that is the whole bug.
    expect(src).toMatch(/restoredForKeyRef\.current === checkpointKey\s*\)\s*{\s*\n\s*localStorage\.setItem\(checkpointKey/)
  })

  it('the restore arms the ref for the CURRENT checkpointKey, not a boolean', () => {
    // Keyed, so client-side module→module navigation (where currentSectionIndex
    // still holds the previous module's step) re-arms rather than writing the
    // old step under the new key.
    expect(src).toMatch(/restoredForKeyRef\.current = checkpointKey/)
    expect(src).toMatch(/checkpointKey\]\)/)
  })
})

describe('2. CRM CPD is summed from module points, never the module count', () => {
  it('the EP module points sum to the advertised online CPD total', () => {
    const total = epModules.reduce((s, m) => s + m.points, 0)
    expect(total).toBe(CONFIG.COURSE.ONLINE_CPD_POINTS)
  })

  it('EP module points are NOT all 1 — so a module count is a wrong CPD figure', () => {
    // Guards the assumption that made this bug invisible on the CCM side.
    expect(epModules.some((m) => m.points !== 1)).toBe(true)
  })

  it('/learning derives the CPD tile from points, not from streamCompleted', () => {
    const src = code('app/learning/page.tsx')
    expect(src).toMatch(/const crmCpd = epModulesMeta/)
    expect(src).toMatch(/\$\{streamCpd\} \/ \$\{CONFIG\.COURSE\.ONLINE_CPD_POINTS\}/)
    // the old shape — a module count rendered under a CPD label — must be gone
    expect(src).not.toMatch(/CPD[\s\S]{0,400}?\$\{streamCompleted\}/)
  })
})

describe('3. CCM-only entitlements are not promised to CRM buyers', () => {
  const settings = code('app/settings/page.tsx')

  it('/settings distinguishes "pays us" from "holds CCM"', () => {
    expect(settings).toMatch(/const isCcmPaid =/)
  })

  it('the Clinical Toolkit and Reference rows do not key off isPaidUser', () => {
    // Both rows must consult isCrmOnly / isCcmPaid, never the bare isPaidUser
    // that treats a CRM buyer as a CCM buyer.
    const toolkitRow = settings.slice(
      settings.indexOf('Clinical Toolkit'),
      settings.indexOf('In-Person Workshop'),
    )
    expect(toolkitRow).toMatch(/isCrmOnly/)
    expect(toolkitRow).toMatch(/isCcmPaid/)
    expect(toolkitRow).not.toMatch(/\{isPaidUser \?/)
  })

  it('a CRM buyer is never sent to /upgrade (it redirects preview → CCM /pricing)', () => {
    const workshopRow = settings.slice(settings.indexOf('In-Person Workshop'))
    // The CRM branch must come BEFORE the generic isPaidUser branch.
    expect(workshopRow.indexOf('isCrmOnly')).toBeGreaterThan(-1)
    expect(workshopRow.indexOf('isCrmOnly')).toBeLessThan(workshopRow.indexOf('href="/upgrade"'))
  })

  it('the dashboard bento locks the CCM toolkit/references for a non-CCM tier', () => {
    const bento = code('components/dashboard/BentoGrid.tsx')
    expect(bento).toMatch(/const ccmToolsLocked = !isCcmPaidTier/)
    // and routes a CRM buyer to their OWN stream rather than a locked screen
    expect(bento).toMatch(/crmOnlyTier\s*\?\s*'\/ep-course\/toolkit'/)
    expect(bento).toMatch(/crmOnlyTier \? '\/ep-course\/references' : '\/references'/)
  })
})

describe('4. certificate CTAs surface the server’s own reason', () => {
  it('the EP dashboard downloads via fetch, not a bare link to the API', () => {
    const src = code('app/ep-course/dashboard/page.tsx')
    expect(src).not.toMatch(/href="\/api\/certificate/)
    expect(src).toMatch(/const downloadCertificate = async/)
    expect(src).toMatch(/setCertError\(/)
  })

  it('NextActionCard keeps download failures out of the email-failed message', () => {
    const src = code('components/dashboard/NextActionCard.tsx')
    expect(src).toMatch(/certificateError/)
    // a failed download must no longer set the EMAIL status
    const dl = src.slice(src.indexOf('const handleDownloadCertificate'), src.indexOf('const handleResendCertificate'))
    expect(dl).not.toMatch(/setCertificateStatus\('error'\)/)
    expect(dl).toMatch(/data\?\.error/)
  })

  it('/settings already carries the server reason through (regression guard)', () => {
    const src = read('app/settings/page.tsx')
    expect(src).toMatch(/class CertificateError extends Error/)
    expect(src).toMatch(/throw new CertificateError\(data\?\.error/)
  })
})

describe('5. EP quizzes pass at 80%, verified server-side from stored answers', () => {
  it.each(epModules.map((m) => [m.id, m.quiz.length] as const))(
    'module %i: ceil(80%%) passes, one below fails, empty fails',
    (id, n) => {
      const mod = epModules.find((m) => m.id === id)!
      const need = Math.ceil(n * 0.8)
      const build = (correct: number) =>
        Object.fromEntries(
          mod.quiz.map((q, i) => [
            q.id,
            i < correct ? q.correctAnswer : (q.correctAnswer + 1) % q.options.length,
          ]),
        )
      expect(verifyModuleQuiz(id, build(n)).ok).toBe(true)
      expect(verifyModuleQuiz(id, build(need)).ok).toBe(true)
      expect(verifyModuleQuiz(id, build(need - 1)).ok).toBe(false)
      expect(verifyModuleQuiz(id, {}).ok).toBe(false)
      expect(verifyModuleQuiz(id, null).ok).toBe(false)
    },
  )

  it('a CCM 75% score does NOT pass an EP module where the two differ', () => {
    for (const m of epModules) {
      const n = m.quiz.length
      const at75 = Math.ceil(n * 0.75)
      if (at75 / n >= 0.8) continue // no discriminating case for this length
      const answers = Object.fromEntries(
        m.quiz.map((q, i) => [
          q.id,
          i < at75 ? q.correctAnswer : (q.correctAnswer + 1) % q.options.length,
        ]),
      )
      expect(verifyModuleQuiz(m.id, answers).ok).toBe(false)
    }
  })

  it('every EP module has a quiz whose questions all sit inside a part', () => {
    // A quiz question outside every part.quizIds is unrenderable, and the
    // "answer all N questions" guard then blocks submit forever — the module
    // could never be completed and the buyer would stick at 7/8.
    for (const m of epModules) {
      expect(m.quiz.length).toBeGreaterThan(0)
      if (!m.parts) continue
      const inParts = new Set(m.parts.flatMap((p) => p.quizIds))
      const orphans = m.quiz.map((q) => q.id).filter((id) => !inParts.has(id))
      expect(orphans, `module ${m.id} orphan quiz ids`).toEqual([])
      const sectionIds = new Set(m.parts.flatMap((p) => p.sectionIds))
      const unreachable = m.sections.map((s) => s.id).filter((id) => !sectionIds.has(id))
      expect(unreachable, `module ${m.id} unreachable sections`).toEqual([])
    }
  })
})

describe('6. no hardcoded CPD hours, pass marks or discounts in the course surfaces', () => {
  const files = [
    'components/course/CourseModulePage.tsx',
    'app/learning/page.tsx',
    'app/settings/page.tsx',
    'app/scat-course/page.tsx',
    'components/dashboard/NextActionCard.tsx',
    'app/ep-course/dashboard/page.tsx',
  ]

  it.each(files)('%s does not hardcode the SCAT completion discount', (rel) => {
    expect(code(rel)).not.toMatch(/PRICE_ONLINE\s*-\s*\d+/)
  })

  it.each(files)('%s does not print a literal "N CPD hours" figure', (rel) => {
    const src = code(rel)
    // Allow module-derived values ({module.points} CPD hours) and CONFIG reads;
    // catch bare numeric literals in CPD copy.
    const offenders = [...src.matchAll(/(?<![{.\w])\b(\d+)\s+CPD\s+(?:hours?|points?)/gi)]
      .map((m) => m[0])
      // "1 CPD hour" is the free SCAT course's fixed award, expressed via CONFIG
      // elsewhere; a bare singular in prose is not a course figure.
      .filter((s) => !/^1\s+CPD\s+(hour|point)$/i.test(s))
    expect(offenders).toEqual([])
  })
})
