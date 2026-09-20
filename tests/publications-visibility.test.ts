import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { CONFIG } from '../lib/config'
import sitemap from '../app/sitemap'
import { publications } from '../lib/publications'

/**
 * /publications VISIBILITY IS ONE FLAG, AND THE STATIC FILE MUST AGREE WITH IT.
 *
 * On 2026-09-20 the page was found live with its "Internal preview" banner
 * showing, linked in the footer and listed in the sitemap, while robots.txt
 * still disallowed it — four surfaces, each hand-edited, each out of step.
 * CONFIG.FEATURES.PUBLICATIONS_PUBLIC now drives the footer link, the sitemap
 * entry, the robots meta and the banner. public/robots.txt is static, so this
 * test is what keeps it honest.
 */
const root = join(__dirname, '..')
const read = (p: string) => readFileSync(join(root, p), 'utf8')
const isPublic: boolean = CONFIG.FEATURES.PUBLICATIONS_PUBLIC

describe('/publications visibility', () => {
  it('robots.txt agrees with the flag', () => {
    const disallowed = /^Disallow:\s*\/publications\s*$/m.test(read('public/robots.txt'))
    expect(disallowed).toBe(!isPublic)
  })

  it('the sitemap lists the page only when public', () => {
    const listed = sitemap().some((e) => e.url.endsWith('/publications'))
    expect(listed).toBe(isPublic)
  })

  it('the footer link and the page robots meta are flag-gated, not hand-written', () => {
    expect(read('components/SiteFooter.tsx')).toMatch(/PUBLICATIONS_PUBLIC\s*&&[\s\S]{0,80}href="\/publications"/)
    expect(read('app/publications/page.tsx')).toMatch(/PUBLICATIONS_PUBLIC \? \{\} : \{ robots: \{ index: false/)
  })

  it('never lists medRxiv as the venue for the narrative review (medRxiv rejects narrative reviews)', () => {
    const review = publications.find((p) => p.id === 'sst-clinical-review')!
    expect(review.venue).not.toMatch(/medrxiv/i)
  })

  it('anything marked published or preprint carries a resolvable link', () => {
    for (const p of publications.filter((x) => x.status === 'published' || x.status === 'preprint')) {
      expect(p.url, p.id).toMatch(/^https:\/\//)
    }
  })
})
