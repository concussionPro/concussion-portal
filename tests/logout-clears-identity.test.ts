/**
 * LOGOUT MUST CLEAR THE BROWSER'S IDENTITY (2026-08-06).
 *
 * The server's /api/auth/logout clears cookies. It cannot touch localStorage,
 * and two identity-bearing keys lived there:
 *
 *   cea_user_email — written by /auth/verify on every magic-link login and
 *     attached as `user_email` to EVERY subsequent analytics event
 *     (lib/analytics.ts). Sign-out left it behind, so on a shared clinic
 *     front-desk machine — the normal case for this audience — the NEXT
 *     person's entire anonymous browsing session was written into
 *     analytics_events under the PREVIOUS clinician's email address. A privacy
 *     defect, not just dirty data.
 *
 *   login_redirect — a stashed gated destination (app/login/page.tsx). A stale
 *     one sends the next sign-in to a page the new user may not be entitled
 *     to, so their first act after logging in is a bounce.
 *
 * `clearIdentity()` had been exported by lib/analytics.ts with NO caller
 * anywhere in the codebase. This bug existed precisely because nothing
 * asserted it, so the assertion is the fix that keeps it fixed: every surface
 * that calls POST /api/auth/logout must clear both keys.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const ROOT = join(__dirname, '..')

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next' || entry.startsWith('.')) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.tsx?$/.test(entry)) out.push(full)
  }
  return out
}

/** Every client file that signs the user out. */
function logoutSurfaces(): Array<{ path: string; src: string }> {
  const files = [...walk(join(ROOT, 'app')), ...walk(join(ROOT, 'components'))]
  return files
    .map((path) => ({ path, src: readFileSync(path, 'utf8') }))
    .filter(({ src }) => /['"`]\/api\/auth\/logout['"`]/.test(src))
}

describe('sign-out clears the browser-held identity', () => {
  const surfaces = logoutSurfaces()

  it('finds the known logout surfaces', () => {
    const rel = surfaces.map((s) => s.path.replace(ROOT + '/', '')).sort()
    // The three sign-out buttons a real user can reach.
    expect(rel).toContain('app/settings/page.tsx')
    expect(rel).toContain('components/dashboard/Sidebar.tsx')
    expect(rel).toContain('components/SiteNav.tsx')
  })

  it.each(logoutSurfaces().map((s) => s.path.replace(ROOT + '/', '')))(
    '%s calls clearIdentity() on logout',
    (rel) => {
      const src = readFileSync(join(ROOT, rel), 'utf8')
      expect(src).toMatch(/\bclearIdentity\s*\(\s*\)/)
      // and imports it rather than shadowing a local no-op
      expect(src).toMatch(/import\s*\{[^}]*\bclearIdentity\b[^}]*\}\s*from\s*['"]@\/lib\/analytics['"]/)
    },
  )

  it.each(logoutSurfaces().map((s) => s.path.replace(ROOT + '/', '')))(
    '%s clears the stale login_redirect stash on logout',
    (rel) => {
      const src = readFileSync(join(ROOT, rel), 'utf8')
      expect(src).toMatch(/removeItem\(\s*['"]login_redirect['"]\s*\)/)
    },
  )

  it('lib/analytics still exports clearIdentity and it removes the identity key', () => {
    const src = readFileSync(join(ROOT, 'lib/analytics.ts'), 'utf8')
    expect(src).toMatch(/export function clearIdentity\(\)/)
    expect(src).toMatch(/const IDENTITY_KEY = 'cea_user_email'/)
    expect(src).toMatch(/removeItem\(IDENTITY_KEY\)/)
  })
})
