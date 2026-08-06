/**
 * THINGS THAT FAIL WITHOUT SAYING SO.
 *
 * Four classes from the 2026-08 sweep that share one property: when they
 * break, every surface still reports success. Nothing goes red, no alert
 * fires, and the only way anyone finds out is a human reading the code —
 * which is exactly the loop these tests exist to end.
 *
 *  1. A SEND HELPER THAT REPORTS SUCCESS WITH NO TRANSPORT (6d46b3ca).
 *     sendEmail returned TRUE when RESEND_API_KEY was missing, so one wrong
 *     Vercel env var turned the entire email system into a no-op reporting
 *     100% success: /api/send-magic-link answers "check your email",
 *     /api/sst/start answers "your clinic code is on its way", the
 *     certificate route answers "emailed successfully". Class-wide: NO send
 *     helper may report success when there is no transport.
 *  2. A CRON SCHEDULED AT A ROUTE THAT ISN'T THERE (89f206c6 verified 20
 *     entries by hand; a crashing cron shipped in 925d8b5f). A cron pointed
 *     at a path with no route file gets a 404 from Vercel every night
 *     forever, and the lane it drives simply stops. Class-wide: every
 *     vercel.json schedule resolves to a real route handler.
 *  3. A RATE LIMIT THAT COLLAPSES ONTO ONE BUCKET (86b0bbde). getClientIp
 *     mis-detected 9 of the 15 Cloudflare ranges — JS `&` returns a SIGNED
 *     int32, so every network whose first octet is >= 128 compared negative
 *     against positive and never matched. getClientIp then returned the
 *     Cloudflare EDGE address, so login, magic-link, checkout and sst/start
 *     limits all keyed on one shared proxy IP. Class-wide: EVERY published
 *     range, not the one that was noticed.
 *  4. A CERTIFICATE PRINTING A LITERAL CPD FIGURE (2bc52018). The online CRM
 *     certificate printed 8 as a hardcoded literal. It happened to be right;
 *     that is precisely how '14 CPD' survived the 2026-07-30 OA re-rate on
 *     three other surfaces, and an online certificate carrying the 16-point
 *     TOTAL would give a practical-day attendee two documents claiming 24
 *     between them. Class-wide: no certificate builder writes a literal.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { CONFIG } from '@/lib/config'
import { getClientIp } from '@/lib/get-client-ip'
import {
  getSCATCertificateData,
  getOnlineCourseCertificateData,
  getCrmCertificateData,
  getFullCourseCertificateData,
  getRecognitionReferralCertificateData,
} from '@/lib/certificate'

const ROOT = path.resolve(__dirname, '..')
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8')
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

// ===========================================================================
// 1. NO SEND HELPER REPORTS SUCCESS WITH NO TRANSPORT
// ===========================================================================

describe('a send helper never reports success when there is no transport', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('RESEND_API_KEY', '')
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('in PRODUCTION with no API key, sendEmail returns false', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const { sendEmail, getResend } = await import('@/lib/resend-client')
    expect(getResend(), 'no key means no client').toBeNull()
    await expect(
      sendEmail({ to: 'buyer@example.com', subject: 'Your certificate', html: '<p>x</p>' }),
      'returning true here is what made ~35 call sites lie to the customer',
    ).resolves.toBe(false)
  })

  it('in PRODUCTION with no API key, sendEmailWithAttachment returns false too', async () => {
    // The tax invoice rides this one. Same class, second door.
    vi.stubEnv('NODE_ENV', 'production')
    const { sendEmailWithAttachment } = await import('@/lib/resend-client')
    await expect(
      sendEmailWithAttachment({
        to: 'buyer@example.com',
        subject: 'Tax invoice',
        html: '<p>x</p>',
        attachments: [{ filename: 'invoice.pdf', content: 'AAAA' }],
      }),
    ).resolves.toBe(false)
  })

  it('outside production the console-only path is honest success (rule stays satisfiable)', async () => {
    // In dev/test "logged instead of sent" IS the intended behaviour. Without
    // this the fix would just be "always return false", which breaks local work.
    vi.stubEnv('NODE_ENV', 'development')
    const { sendEmail } = await import('@/lib/resend-client')
    await expect(
      sendEmail({ to: 'dev@example.com', subject: 'x', html: '<p>x</p>' }),
    ).resolves.toBe(true)
  })

  it('every transport helper routes its unconfigured path through one decision', () => {
    // Class-wide: a THIRD helper added later must not re-invent `return true`.
    // The transport helpers are the ones that branch on a null Resend client;
    // the copy wrappers above them (sendMagicLinkEmail etc.) just delegate.
    const src = strip(read('lib/resend-client.ts'))
    const transports = [...src.matchAll(/export async function (\w+)\s*\([\s\S]{0,600}?\{/g)]
      .map((m) => m[1])
      .filter((name) => {
        const start = src.indexOf(`export async function ${name}`)
        const next = src.indexOf('\nexport ', start + 1)
        const body = src.slice(start, next === -1 ? undefined : next)
        return /!getResend\(\)/.test(body)
      })
    expect(transports.length, 'found the transport helpers').toBeGreaterThanOrEqual(2)
    for (const name of transports) {
      const start = src.indexOf(`export async function ${name}`)
      const next = src.indexOf('\nexport ', start + 1)
      const body = src.slice(start, next === -1 ? undefined : next)
      const unconfiguredBranch = body.slice(body.indexOf('!getResend()'), body.indexOf('try {'))
      expect(
        unconfiguredBranch,
        `${name} must decide its unconfigured return through unconfiguredSendResult(), not a bare literal`,
      ).toContain('unconfiguredSendResult')
      expect(
        unconfiguredBranch,
        `${name} reports success with no transport — that is the whole defect`,
      ).not.toMatch(/return true/)
    }
  })
})

// ===========================================================================
// 2. EVERY SCHEDULED CRON RESOLVES TO A REAL ROUTE
// ===========================================================================

describe('every vercel.json cron schedule resolves to a real route handler', () => {
  const vercel = JSON.parse(read('vercel.json')) as {
    crons?: Array<{ path: string; schedule: string }>
  }

  it('the config actually carries schedules (guards the guard)', () => {
    expect(vercel.crons?.length, 'no crons parsed — the assertion below would be vacuous').toBeGreaterThan(10)
  })

  it.each((vercel.crons ?? []).map((c) => [c.path, c.schedule]))(
    '%s has a route file',
    (cronPath) => {
      const dir = path.join(ROOT, 'app', cronPath.replace(/^\//, ''))
      const handler = ['route.ts', 'route.tsx'].map((f) => path.join(dir, f)).find(fs.existsSync)
      expect(
        handler,
        `${cronPath} is scheduled but has no handler — Vercel 404s it nightly and the lane silently stops`,
      ).toBeTruthy()
      // A cron route must actually export a GET; Vercel calls it with GET.
      expect(strip(fs.readFileSync(handler!, 'utf8'))).toMatch(/export\s+(?:async\s+)?function\s+GET|export\s+const\s+GET/)
    },
  )

  it('every cron schedule is a well-formed 5-field expression', () => {
    for (const c of vercel.crons ?? []) {
      expect(c.schedule.trim().split(/\s+/), `${c.path}: "${c.schedule}"`).toHaveLength(5)
    }
  })

  it('WOULD catch a schedule pointing at nothing (negative control)', () => {
    const dead = '/api/cron/this-route-does-not-exist'
    expect(fs.existsSync(path.join(ROOT, 'app', dead.replace(/^\//, ''), 'route.ts'))).toBe(false)
  })
})

// ===========================================================================
// 3. EVERY CLOUDFLARE RANGE IS WALKED PAST, NOT JUST THE LOW ONES
// ===========================================================================

/**
 * One address inside each published Cloudflare IPv4 range. The nine marked
 * HIGH-BIT are the ones the signed-int32 comparison could never match, so a
 * regression there is invisible to a test that only samples 103.x/104.x.
 */
const CF_SAMPLES: Array<[string, string]> = [
  ['173.245.48.5', 'HIGH-BIT'],
  ['103.21.244.5', 'low'],
  ['103.22.200.5', 'low'],
  ['103.31.4.5', 'low'],
  ['141.101.64.5', 'HIGH-BIT'],
  ['108.162.192.5', 'low'],
  ['190.93.240.5', 'HIGH-BIT'],
  ['188.114.96.5', 'HIGH-BIT'],
  ['197.234.240.5', 'HIGH-BIT'],
  ['198.41.128.5', 'HIGH-BIT'],
  ['162.158.0.5', 'HIGH-BIT'],
  ['104.16.0.5', 'low'],
  ['104.24.0.5', 'low'],
  ['172.64.0.5', 'HIGH-BIT'],
  ['131.0.72.5', 'HIGH-BIT'],
]

const req = (headers: Record<string, string>) => ({
  headers: { get: (n: string) => headers[n.toLowerCase()] ?? null },
})

describe('IP-keyed rate limits key on the client, never the Cloudflare edge', () => {
  it.each(CF_SAMPLES)('%s (%s) is recognised as Cloudflare and walked past', (cfIp) => {
    // The real shape: Cloudflare's edge prepended to the client's address.
    expect(
      getClientIp(req({ 'x-forwarded-for': `${cfIp}, 203.0.113.9` })),
      'returning the edge IP collapses every rate-limit bucket onto one proxy',
    ).toBe('203.0.113.9')
    expect(getClientIp(req({ 'cf-connecting-ip': cfIp, 'x-forwarded-for': '203.0.113.9' }))).toBe('203.0.113.9')
  })

  it('covers every published range (guards the guard)', () => {
    const declared = [...read('lib/get-client-ip.ts').matchAll(/ipToInt\('([\d.]+)'\)/g)].map((m) => m[1])
    expect(declared.length, 'CF_RANGES parsed').toBeGreaterThan(10)
    expect(
      CF_SAMPLES.length,
      'a range was added to lib/get-client-ip.ts without a sample here — the new one is untested',
    ).toBe(declared.length)
    // …and the high-bit ones (first octet >= 128) are the regression surface.
    expect(CF_SAMPLES.filter(([, k]) => k === 'HIGH-BIT').length).toBe(
      declared.filter((ip) => Number(ip.split('.')[0]) >= 128).length,
    )
  })

  it('a real client address is never mistaken for the edge (rule stays satisfiable)', () => {
    expect(getClientIp(req({ 'cf-connecting-ip': '203.0.113.9' }))).toBe('203.0.113.9')
    expect(getClientIp(req({ 'x-forwarded-for': '1.2.3.4' }))).toBe('1.2.3.4')
    expect(getClientIp(req({}))).toBe('unknown')
  })
})

// ===========================================================================
// 4. NO CERTIFICATE PRINTS A LITERAL CPD FIGURE
// ===========================================================================

describe('every certificate derives its CPD figure from CONFIG', () => {
  const NAME = 'Test Clinician'
  const EMAIL = 'test@example.com'
  const WHEN = new Date('2026-08-06')

  it('each builder returns exactly the configured figure for its offering', () => {
    expect(getSCATCertificateData(NAME, EMAIL, WHEN).cpdPoints).toBe(CONFIG.COURSE.SCAT_MASTERY_CPD_POINTS)
    expect(getOnlineCourseCertificateData(NAME, EMAIL, WHEN).cpdPoints).toBe(CONFIG.COURSE.ONLINE_CPD_POINTS)
    expect(getFullCourseCertificateData(NAME, EMAIL, WHEN).cpdPoints).toBe(CONFIG.COURSE.TOTAL_CPD_POINTS)
    expect(getCrmCertificateData(NAME, EMAIL, WHEN).cpdPoints).toBe(CONFIG.ESSA_ACCREDITATION.ONLINE_POINTS)
    // The recognition-referral module carries no CPD award.
    expect(getRecognitionReferralCertificateData(NAME, EMAIL, WHEN).cpdPoints).toBe(0)
  })

  it('the ONLINE CRM certificate is never the 16-point total', () => {
    // The owner's rule: the practical day issues a SEPARATE 8-point
    // certificate, so an online certificate carrying the total gives one
    // attendee two documents claiming 24 points between them.
    const online = getCrmCertificateData(NAME, EMAIL, WHEN).cpdPoints
    const total = CONFIG.ESSA_ACCREDITATION.ONLINE_POINTS + CONFIG.ESSA_ACCREDITATION.PRACTICAL_POINTS
    expect(online).not.toBe(total)
    expect(online + CONFIG.ESSA_ACCREDITATION.PRACTICAL_POINTS).toBe(total)
  })

  it('no builder assigns cpdPoints from a bare number', () => {
    // Class-wide: a sixth certificate added later cannot reintroduce the
    // literal. Zero is allowed — it means "this offering awards no CPD" and
    // is a fact about the offering, not a figure that can drift.
    const src = strip(read('lib/certificate.ts'))
    const literals = [...src.matchAll(/cpdPoints:\s*(\d+)/g)]
      .map((m) => m[0])
      .filter((s) => !/cpdPoints:\s*0\b/.test(s))
    expect(
      literals,
      'derive it from CONFIG — a literal is how "14 CPD" survived the 2026-07-30 re-rate',
    ).toEqual([])
  })

  it('WOULD catch a literal reappearing (negative control)', () => {
    const reintroduced = `
      export function getCrmCertificateData(): CertificateData {
        return { cpdPoints: 16, courseType: 'crm-online' }
      }`
    const literals = [...strip(reintroduced).matchAll(/cpdPoints:\s*(\d+)/g)]
      .map((m) => m[0])
      .filter((s) => !/cpdPoints:\s*0\b/.test(s))
    expect(literals).toEqual(['cpdPoints: 16'])
    // …and the allowed shapes still pass.
    expect(
      [...strip(`{ cpdPoints: CONFIG.ESSA_ACCREDITATION.ONLINE_POINTS }`).matchAll(/cpdPoints:\s*(\d+)/g)],
    ).toEqual([])
  })
})
