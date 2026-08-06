import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
import { join, extname } from 'node:path'
import { PAID_DOCS, AUTH_DOCS } from '../lib/gated-docs'

/**
 * NOTHING PAID MAY SIT AT A PUBLIC URL.
 *
 * WHY THIS EXISTS — two separate breaches of the same class in one day,
 * 2026-08-06, master clean register B.
 *
 * Everything under public/ is served straight off the CDN. The paywall is a
 * MIDDLEWARE MATCHER keyed on the `/docs/` prefix, so a paid asset placed
 * anywhere else is simply public. Twice now it has been:
 *
 *   pass 1  public/docs_backup_2026-01/  — byte-identical copies of the entire
 *           paid Clinical Toolkit. /docs/RehabFlow.png returned 401 while
 *           /docs_backup_2026-01/RehabFlow.png returned 200 and the same md5.
 *
 *   pass 3  public/toolkit-previews/     — seven 1272x1800 print-resolution
 *           PNG renders of seven documents inside the paid
 *           ClinicalToolkit_Complete.zip: cheat sheet, myth-buster, patient
 *           handout, PCS flowchart, referral flowchart, RTP/RTL ladder, and
 *           RehabFlow. Not byte-identical to anything gated — a different FILE
 *           FORMAT of the same content — so the md5 sweep that closed pass 1
 *           did not see them. Fully legible; opening one shows the complete
 *           five-phase pathway. Referenced by ZERO files in the repo, so they
 *           were not even serving as previews.
 *
 * The lesson is that "no byte-identical copy exists" is far too weak a test.
 * The durable property is: EVERY directory under public/ must be reachable from
 * the code that is supposed to use it. An unreferenced directory of assets is
 * either dead weight or a leak, and nobody can tell which without opening it —
 * which is exactly how both of these survived five earlier sweeps.
 */

const ROOT = join(__dirname, '..')
const PUBLIC = join(ROOT, 'public')

/** Where a reference to a public asset could legitimately live. */
const CODE_ROOTS = ['app', 'components', 'lib', 'data', 'scripts', 'middleware.ts', 'next.config.ts']

function readCode(): string {
  const parts: string[] = []
  const walk = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue
      const full = join(dir, e.name)
      if (e.isDirectory()) walk(full)
      else if (/\.(ts|tsx|mjs|js|json)$/.test(e.name)) parts.push(readFileSync(full, 'utf8'))
    }
  }
  for (const r of CODE_ROOTS) {
    const p = join(ROOT, r)
    if (!existsSync(p)) continue
    statSync(p).isDirectory() ? walk(p) : parts.push(readFileSync(p, 'utf8'))
  }
  return parts.join('\n')
}

const CODE = readCode()

/**
 * Directories that are legitimately unreferenced by application code.
 * Each needs a REASON, not just a name — an allowlist without justification is
 * how the next leak gets waved through.
 */
const ALLOWED_UNREFERENCED: Record<string, string> = {
  '.well-known': 'protocol-defined path (assetlinks, llms) fetched by external agents, never by our code',
  accreditation: 'the two official ESSA certificates (PDNF26077). Public by intent — they are the PROOF of an accreditation we assert, so a visitor or an auditor must be able to open them. Not paid content.',
  logos: 'brand mark served to external consumers (email clients, JSON-LD, partners) rather than imported',
}

describe('every public/ directory is accounted for', () => {
  const dirs = readdirSync(PUBLIC, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)

  it('finds the directories it claims to guard', () => {
    expect(dirs.length).toBeGreaterThan(3)
    expect(CODE.length).toBeGreaterThan(100_000)
  })

  it('is referenced by code, or explicitly justified as public', () => {
    const unexplained = dirs.filter(
      (d) => !CODE.includes(`/${d}/`) && !(d in ALLOWED_UNREFERENCED),
    )
    expect(
      unexplained.map((d) => `public/${d}/ is served by the CDN but referenced nowhere — dead weight or a paywall leak, and only opening it tells you which`),
      'add it to ALLOWED_UNREFERENCED with a reason, or delete it',
    ).toEqual([])
  })

  it('no directory name suggests a copy of the gated docs', () => {
    // The pass-1 instance was literally `docs_backup_2026-01`. The middleware
    // matcher now covers /(docs.*), but a copy under any OTHER name would not
    // be caught by the prefix — so the name check is a second, cheaper net.
    const suspicious = dirs.filter((d) => d !== 'docs' && /docs|backup|copy|old|toolkit|paid/i.test(d))
    expect(
      suspicious.map((d) => `public/${d}/ looks like a copy of gated material`),
    ).toEqual([])
  })
})

describe('no gated asset is duplicated into a public path', () => {
  const gated = [...PAID_DOCS, ...AUTH_DOCS]

  it('finds the gated set', () => {
    expect(gated.length).toBeGreaterThan(5)
  })

  it('no file outside public/docs shares a gated asset filename', () => {
    // Catches a rename-free copy anywhere under public/, which is how
    // docs_backup_2026-01 shipped the whole toolkit.
    const gatedNames = new Set(gated.map((p) => p.split('/').pop()!.toLowerCase()))
    const offenders: string[] = []
    const walk = (dir: string) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, e.name)
        if (e.isDirectory()) {
          if (full !== join(PUBLIC, 'docs')) walk(full)
        } else if (gatedNames.has(e.name.toLowerCase())) {
          offenders.push(full.replace(ROOT + '/', ''))
        }
      }
    }
    walk(PUBLIC)
    expect(
      offenders.map((f) => `${f} shares a filename with a GATED document but sits outside the /docs/ matcher`),
    ).toEqual([])
  })

  it('the toolkit-previews leak stays deleted', () => {
    // Named explicitly. It was seven print-resolution renders of documents
    // inside the paid ClinicalToolkit_Complete.zip, at 200, unauthenticated,
    // while the zip itself returned 401.
    expect(existsSync(join(PUBLIC, 'toolkit-previews'))).toBe(false)
    expect(existsSync(join(PUBLIC, 'docs_backup_2026-01'))).toBe(false)
  })

  it('the guards can fail', () => {
    // Non-vacuity, in memory, against both shapes that actually shipped.
    const dirsIfLeaking = ['docs', 'toolkit-previews', 'infographics']
    expect(dirsIfLeaking.filter((d) => d !== 'docs' && /docs|backup|copy|old|toolkit|paid/i.test(d)))
      .toEqual(['toolkit-previews'])
    expect(['docs', 'docs_backup_2026-01'].filter((d) => d !== 'docs' && /docs|backup/i.test(d)))
      .toEqual(['docs_backup_2026-01'])
    // And an unreferenced directory with no justification is flagged.
    expect(!'code with no mention'.includes('/toolkit-previews/') && !('toolkit-previews' in ALLOWED_UNREFERENCED)).toBe(true)
  })
})

describe('the paid toolkit zip still contains what the gate protects', () => {
  it('ClinicalToolkit_Complete.zip is present and gated', () => {
    // If the zip were ever moved out of /docs, the matcher would stop covering
    // it and every document inside would become public in one commit.
    expect(existsSync(join(PUBLIC, 'docs/ClinicalToolkit_Complete.zip'))).toBe(true)
    expect(PAID_DOCS.has('/docs/ClinicalToolkit_Complete.zip')).toBe(true)
  })
})
