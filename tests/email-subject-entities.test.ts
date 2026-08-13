/**
 * Subjects are PLAIN TEXT — mail clients never decode HTML entities there.
 *
 * "The one time I&rsquo;ll mention the course" reached the completer batch
 * verbatim (queued 2026-08-09, caught in the Resend dashboard 2026-08-14).
 * The 2026-08-10 deliverability fix decoded entities in BODIES (htmlToText)
 * but subjects were never covered. Two locks:
 *
 *  1. Static: no subject literal anywhere in lib/ may contain an HTML entity —
 *     write the real character.
 *  2. Boundary: decodeSubjectEntities() (applied in sendEmail AND
 *     sendEmailWithAttachment, which every send path funnels through) renders
 *     a template mistake correctly anyway.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { decodeSubjectEntities } from '@/lib/resend-client'

const ENTITY = /&(?:[a-z]+|#\d+);/i
// subject: '...'  |  subject: "..."  |  subject: `...` (no interpolation scan)
const SUBJECT_LITERAL = /subject\s*:\s*(['"`])((?:(?!\1).)*)\1/g

function tsFilesUnder(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) out.push(...tsFilesUnder(p))
    else if (/\.tsx?$/.test(name)) out.push(p)
  }
  return out
}

describe('email subject entity hygiene', () => {
  it('no subject literal in lib/ contains an HTML entity', () => {
    const offenders: string[] = []
    let scanned = 0
    for (const file of tsFilesUnder(join(process.cwd(), 'lib'))) {
      const src = readFileSync(file, 'utf8')
      for (const m of src.matchAll(SUBJECT_LITERAL)) {
        scanned++
        if (ENTITY.test(m[2])) offenders.push(`${file}: ${m[2]}`)
      }
    }
    // Non-vacuous: the sequences file alone defines dozens of subjects — if
    // the scan stops finding them, the guard is scanning nothing.
    expect(scanned).toBeGreaterThan(20)
    expect(offenders).toEqual([])
  })

  it('boundary decode fixes the exact regression', () => {
    expect(decodeSubjectEntities('The one time I&rsquo;ll mention the course'))
      .toBe('The one time I’ll mention the course')
  })

  it('decodes the entity families templates actually use', () => {
    expect(decodeSubjectEntities('A &mdash; B &ndash; C&hellip; &ldquo;D&rdquo; &quot;E&quot; F&#8217;s &amp; G'))
      .toBe('A — B – C… “D” "E" F’s & G')
    // &amp; decodes LAST so an intentionally escaped entity is not
    // double-decoded: "&amp;rsquo;" legitimately means the literal text
    // "&rsquo;" and must stay that way.
    expect(decodeSubjectEntities('I&amp;rsquo;ll')).toBe('I&rsquo;ll')
  })

  it('leaves clean subjects untouched', () => {
    const s = 'Module 1 done — two short ones left'
    expect(decodeSubjectEntities(s)).toBe(s)
  })
})
