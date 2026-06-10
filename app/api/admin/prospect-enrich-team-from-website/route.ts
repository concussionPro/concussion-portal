/**
 * POST /api/admin/prospect-enrich-team-from-website
 *
 * Scrapes each prospect clinic's website /team /our-team /about /people
 * pages (homepage last — single-page sites are common for small clinics)
 * to extract a real clinician headcount. Replaces the placeholder
 * team={physiotherapists:4} that Apollo imports default to — 97% of
 * sendable prospects have this fictitious 4 which buckets them all
 * into T2 (Hub Pack) regardless of whether they're a solo practice or
 * a 20-clinician network.
 *
 * Team size determines:
 *   - Outreach tier: T1 (on-site $8-10k) / T2 (Hub Pack $1.5k) / T3 (solo)
 *   - Email template branch: hubPackPriceFor(team) routes between Hub
 *     Pack pitch and on-site pitch
 *   - Deal value estimate in B2B Outreach dashboard
 *
 * Detection heuristic:
 *   1. Try the fixed candidate paths in order ('' = homepage tried last).
 *   2. extractTeam() combines independent person-name signals (JSON-LD
 *      Person blocks, name lines with clinical-role proximity, profile
 *      links, staff-card CSS classes, img alt text), dedupes names, and
 *      excludes obvious admin-only staff where titles are detectable.
 *   3. If no fixed path yields a result, follow up to 3 team-ish links
 *      discovered on the pages we already fetched (e.g. Shopify sites
 *      keep the team at /pages/our-team) — every hop re-runs the SSRF
 *      guard via fetchPage.
 *
 * Result tagged in notes as [team-enriched=N/source-page/yyyy-mm-dd]
 * so re-runs skip already-enriched prospects. Unenrichable rows are
 * tagged [team-enrich-checked=no-team-found/yyyy-mm-dd] (or no-website)
 * so the selection query stops re-examining the same dead rows every
 * batch (override both with ?reenrich=true).
 *
 * Body: {
 *   dryRun?: boolean (default true)
 *   limit?: number (default 30, max 100 — scraping is slow)
 *   reenrich?: boolean (default false)
 * }
 */
import { NextRequest, NextResponse } from 'next/server'
import { lookup } from 'node:dns/promises'
import net from 'node:net'
import { sql } from '@/lib/db'
import { isAdminRequest } from '@/lib/require-admin'

export const runtime = 'nodejs'
export const maxDuration = 300

const TEAM_PAGE_CANDIDATES = [
  '/team',
  '/our-team',
  '/our-people',
  '/staff',
  '/clinicians',
  '/practitioners',
  '/our-practitioners',
  '/meet-the-team',
  '/about',
  '/about-us',
  // Homepage LAST — single-page sites (very common for small physio clinics)
  // put the whole team on the homepage and 404 every dedicated path above.
  '',
]

// Clinician role keywords — used to attribute name-matches to actual clinical
// staff (vs receptionists, practice managers, etc) and to infer the dominant
// discipline. Disciplines without a dedicated bucket in the team JSONB
// (chiro, podiatry, dietetics, psychology) fold into the physiotherapists
// bucket — the bucket only labels the dominant discipline; the count is what
// drives tiering.
const ROLE_KEYWORDS: Array<{ pattern: RegExp; role: string }> = [
  { pattern: /\bphysiotherapists?\b|\bphysios?\b|\bphysiotherapy\b/i, role: 'physiotherapists' },
  { pattern: /\bosteopaths?\b|\bosteopathy\b/i, role: 'osteopaths' },
  { pattern: /\bsports?\s*(?:physician|doctor|medicine)\b/i, role: 'sportsMedicineDoctors' },
  { pattern: /\bexercise\s*physiolog|\baccredited\s*exercise|\bEP\b/i, role: 'exercisePhys' },
  { pattern: /\bchiropractors?\b|\bchiros?\b|\bchiropractic\b/i, role: 'physiotherapists' },
  { pattern: /\bmyotherapists?\b|\bmyotherapy\b/i, role: 'myotherapists' },
  { pattern: /\bremedial\s*massage\b|\bmassage\s*therapists?\b/i, role: 'remedialMassage' },
  { pattern: /\bgeneral\s*practitioners?\b|\bGP\b/, role: 'generalPractitioners' },
  { pattern: /\bpodiatrists?\b|\bpodiatry\b/i, role: 'physiotherapists' },
  { pattern: /\bdietitians?\b|\bdieticians?\b/i, role: 'physiotherapists' },
  { pattern: /\bpsychologists?\b/i, role: 'physiotherapists' },
]

// Any clinical-title signal — union of the bucket patterns plus generic
// clinician markers ("Dr ", "doctor", "clinical director").
const CLINICAL_RE = new RegExp(
  ROLE_KEYWORDS.map((r) => r.pattern.source).join('|') +
    String.raw`|\bdr\.?\s|\bdoctors?\b|\bclinical\s+director\b|\borthopaedic\s+surgeons?\b|\brheumatologists?\b`,
  'i',
)

// Obvious admin-only titles — excluded from the clinician count when detectable.
const ADMIN_RE =
  /\breception(?:ist)?s?\b|\bpractice\s+manager|\boffice\s+manager|\badministrat|\badmin\b|\bfront\s+desk\b|\baccounts?\s+(?:manager|officer|team)\b|\bbook[- ]?keep|\bcustomer\s+(?:service|care)\b|\bmarketing\b|\boperations\s+manager\b/i

// "This page is about the team" marker — gates inclusion of names whose role
// titles are NOT detectable (total people on a team page is an acceptable
// proxy for team size when we can't tell clinical from admin).
const TEAM_MARKER_RE =
  /\bmeet\s+(?:the|our)\s+team\b|\bour\s+team\b|\bthe\s+team\b|\bour\s+(?:staff|people|practitioners|clinicians|therapists)\b|\bteam\s+members?\b/i

// Words that disqualify a candidate "person name" line — service names, page
// chrome, places, days, body parts. Keeps "Dance Physio" / "Hope Island" /
// "Book Online" out of the name set.
const NAME_STOPWORDS = new Set(
  (
    'about contact team meet our your the and for with services service clinic clinics clinical ' +
    'physio physios physiotherapy physiotherapist physiotherapists osteopathy osteopath osteopaths ' +
    'chiropractic chiropractor chiropractors massage remedial exercise exercises physiology ' +
    'physiologist physiologists pilates podiatry podiatrist psychology psychologist dietetics ' +
    'dietitian dietician myotherapy myotherapist sports sport medicine medical health healthcare ' +
    'allied injury injuries pain treatment treatments therapy therapies therapist therapists rehab ' +
    'rehabilitation recovery assessment assessments book bookings booking online now home blog news ' +
    'article articles faq faqs privacy policy terms opening hours open days today monday tuesday ' +
    'wednesday thursday friday saturday sunday street road avenue drive suite level island bay beach ' +
    'park club clubs centre center group fitness gym training performance class classes program ' +
    'programs programme women womens men mens kids children paediatric dry needling running walking ' +
    'careers location locations email phone call join login cart checkout shop search view more read ' +
    'learn back neck knee shoulder hip foot ankle spine spinal headache headaches migraine migraines ' +
    'vertigo dizziness concussion appointment appointments enquire enquiry welcome accreditations ' +
    'associations affiliates partners sponsored gyms studios businesses personal trainers coaches ' +
    'overview availability filter office staff member members practitioner practitioners clinician ' +
    'clinicians reception admin administration manager director principal practice acupuncture ' +
    'nutrition wellness wellbeing january february march april june july august september october ' +
    'november december menu main close scroll skip content top cookie cookies necessary settings ' +
    'enabled always ndis dva medicare hicaps workcover dysfunction disorder disorders condition ' +
    'conditions syndrome technique techniques prescription intervention surgical surgery ' +
    'professional bike energy muscle nerve facial geriatric orthotic orthotics provider providers ' +
    'participants passion care tips tennis golf rugby soccer netball basketball cricket swimming ' +
    'hockey rowing junior senior water polo yoga photography athletic athletics greyhounds panthers ' +
    'giants melbourne sydney brisbane perth adelaide canberra hobart darwin newcastle penrith ' +
    'toowoomba wollongong geelong cairns townsville facebook instagram twitter linkedin youtube ' +
    'tiktok funding accepted amazon books preventative ' +
    // pronouns / aux words — kill "What We Do" / "Who We Treat" page headings
    'we what where who when why how is are do does did you they them this that it its us'
  ).split(/\s+/),
)

// Quick HTML helper — strip tags, decode common entities, normalise whitespace
function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#0?39;|&apos;|&#8217;|&rsquo;|&#8216;|&lsquo;/gi, "'")
    .replace(/&quot;|&#8220;|&#8221;|&ldquo;|&rdquo;/gi, '"')
    .replace(/&#8211;|&ndash;|&#8212;|&mdash;/gi, '-')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
}

function stripHtml(html: string): string {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim()
}

// Remove non-content noise. Comments/scripts/styles/svg always; the text-line
// signal additionally drops <nav>/<footer> (menus are full of service names).
function cleanHtml(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<iframe\b[\s\S]*?<\/iframe>/gi, ' ')
}

function stripChrome(html: string): string {
  return html.replace(/<nav\b[\s\S]*?<\/nav>/gi, ' ').replace(/<footer\b[\s\S]*?<\/footer>/gi, ' ')
}

// Tag boundaries become line breaks — proximity checks run in TEXT space
// (a name line followed by its role line), which is far tighter than raw-HTML
// char windows on markup-heavy pages.
function htmlToLines(html: string): string[] {
  return decodeEntities(html.replace(/<[^>]+>/g, '\n'))
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

/**
 * Person-name shape: optional Dr/Mr/Mrs/Ms/Prof prefix + 2-4 capitalised
 * words, none of which is a service/page-chrome stopword, an acronym
 * (NDIS, CBD) or a credential string (BHlthSc).
 * Returns the normalised (lowercased, prefix-stripped) name, or null.
 */
function parsePersonName(raw: string): string | null {
  const line = raw.replace(/\s+/g, ' ').trim()
  if (line.length < 5 || line.length > 40) return null
  const stripped = line.replace(/^(?:Dr|Mr|Mrs|Ms|Miss|Prof)\.?\s+/i, '')
  const words = stripped.split(' ')
  if (words.length < 2 || words.length > 4) return null
  for (const w of words) {
    if (!/^[A-Z][A-Za-z'’-]{1,17}$/.test(w)) return null // every word capitalised
    if (w.length >= 3 && w === w.toUpperCase()) return null // acronyms (NDIS, CBD)
    if ((w.slice(1).match(/[A-Z]/g) ?? []).length >= 2) return null // credentials (BHlthSc) — McCormick (1 internal cap) still passes
    if (NAME_STOPWORDS.has(w.toLowerCase().replace(/[^a-z]/g, ''))) return null
  }
  return words.join(' ').toLowerCase()
}

type NameSignal = {
  clinical: Set<string>
  admin: Set<string>
  unknown: Set<string>
  roleHits: Record<string, number>
}

function emptySignal(): NameSignal {
  return { clinical: new Set(), admin: new Set(), unknown: new Set(), roleHits: {} }
}

function tallyRole(textWindow: string, hits: Record<string, number>): string | null {
  for (const { pattern, role } of ROLE_KEYWORDS) {
    if (pattern.test(textWindow)) {
      hits[role] = (hits[role] ?? 0) + 1
      return role
    }
  }
  return null
}

// ── Signal: JSON-LD Person blocks ────────────────────────────────────────────
function jsonLdSignal(html: string): NameSignal {
  const out = emptySignal()
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let m: RegExpExecArray | null
  const walk = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(walk)
      return
    }
    if (!node || typeof node !== 'object') return
    const o = node as Record<string, unknown>
    const type = o['@type']
    const types = Array.isArray(type) ? type : [type]
    if (types.includes('Person') && typeof o.name === 'string' && o.name.trim().length >= 4) {
      const name = parsePersonName(o.name) ?? o.name.replace(/\s+/g, ' ').trim().toLowerCase()
      const job = typeof o.jobTitle === 'string' ? o.jobTitle : ''
      if (job && ADMIN_RE.test(job) && !CLINICAL_RE.test(job)) {
        out.admin.add(name)
      } else if (name.length <= 60) {
        // A schema.org Person on a clinic site is almost always a practitioner
        out.clinical.add(name)
        if (job) tallyRole(job, out.roleHits)
      }
    }
    Object.values(o).forEach(walk)
  }
  while ((m = re.exec(html)) !== null) {
    try {
      walk(JSON.parse(m[1]))
    } catch {
      /* malformed JSON-LD — skip block */
    }
  }
  return out
}

// ── Signal: name lines with clinical-role proximity (text space) ─────────────
// Handles the dominant real-world layouts: heading/accordion-title name
// followed by a title line ("Physiotherapist & Director"), and section
// headings ("Physiotherapists", "Administration Manager") that apply to the
// run of names beneath them.
function textLineSignal(lines: string[]): NameSignal {
  const out = emptySignal()
  const markerIdx: number[] = []
  lines.forEach((l, i) => {
    if (TEAM_MARKER_RE.test(l)) markerIdx.push(i)
  })
  let section: 'clinical' | 'admin' | null = null
  let sectionRole: string | null = null
  let sectionSetAt = -1
  for (let i = 0; i < lines.length; i++) {
    // Sections expire — a role mention in an FAQ must not bleed into sponsor /
    // partner-club name lists further down the page.
    if (section && i - sectionSetAt > 12) {
      section = null
      sectionRole = null
    }
    const line = lines[i]
    const name = parsePersonName(line)
    if (!name) {
      // Short non-name lines that are role titles set the current section
      // (long prose lines mentioning "physiotherapy" do NOT reset it)
      if (line.length <= 60) {
        const isAdmin = ADMIN_RE.test(line)
        const isClin = CLINICAL_RE.test(line)
        if (isClin && !isAdmin) {
          section = 'clinical'
          sectionRole = ROLE_KEYWORDS.find((r) => r.pattern.test(line))?.role ?? null
          sectionSetAt = i
        } else if (isAdmin) {
          section = 'admin'
          sectionRole = null
          sectionSetAt = i
        }
      }
      continue
    }
    // A person's title FOLLOWS their name — check the next lines first; the
    // previous line is only a fallback (it usually belongs to the previous
    // person in tight lists, which would leak their role onto this name).
    const nextWindow = lines.slice(i + 1, i + 4).join(' · ')
    const prevLine = i > 0 ? lines[i - 1] : ''
    const nextAdmin = ADMIN_RE.test(nextWindow)
    const nextClin = CLINICAL_RE.test(nextWindow)
    if (nextAdmin && !nextClin) {
      out.admin.add(name)
    } else if (nextClin) {
      out.clinical.add(name)
      tallyRole(nextWindow, out.roleHits)
    } else if (CLINICAL_RE.test(prevLine) && !ADMIN_RE.test(prevLine)) {
      out.clinical.add(name)
      tallyRole(prevLine, out.roleHits)
    } else if (ADMIN_RE.test(prevLine)) {
      out.admin.add(name)
    } else if (section === 'clinical') {
      out.clinical.add(name)
      if (sectionRole) out.roleHits[sectionRole] = (out.roleHits[sectionRole] ?? 0) + 1
      sectionSetAt = i // consecutive name lists keep the section alive
    } else if (section === 'admin') {
      out.admin.add(name)
      sectionSetAt = i
    } else if (markerIdx.some((mi) => i - mi >= 0 && i - mi <= 8)) {
      // Name right under a "Meet the team" marker with no detectable title —
      // total people on a team page is an acceptable proxy for team size.
      out.unknown.add(name)
    }
  }
  return out
}

// ── Signal: practitioner profile links ───────────────────────────────────────
// Small-clinic sites very commonly list the team ONLY as nav-dropdown links to
// individual profile pages (e.g. hunterphysio.com.au /therapist/<slug>/), so
// this signal intentionally runs on the FULL cleaned HTML including <nav>.
const PROFILE_PATH_RE =
  /(therapist|practitioner|clinician|team|staff|profile|people|chiropractor|osteopath|physio|podiatr|dietitian|massage|doctor|about-)/i

const SLUG_FILLER = new Set(['of', 'in', 'on', 'at', 'to', 'and', 'or', 'the', 'an', 'is', 'for', 'with', 'your', 'my', 'vs', 'by', 'from'])

function nameFromSlug(pathname: string): string | null {
  const seg = pathname
    .split('/')
    .filter(Boolean)
    .pop()
  if (!seg) return null
  const tokens = seg
    .toLowerCase()
    .split(/[-_]+/)
    .filter((t) => /^[a-z]{2,18}$/.test(t))
    .filter((t) => !NAME_STOPWORDS.has(t) && !['dr', 'doctor', 'prof', 'mr', 'mrs', 'ms', 'page', 'pages', 'index', 'html', 'php', 'copy'].includes(t))
  if (tokens.length < 2 || tokens.length > 4) return null
  // A real profile slug is name tokens only — blog slugs leave fillers behind
  // ("the-power-of-exercise-physiology-in-rehabilitation" → "power of in")
  if (tokens.some((t) => SLUG_FILLER.has(t))) return null
  return tokens.join(' ')
}

function profileLinkSignal(cleaned: string): NameSignal {
  const out = emptySignal()
  const aRe = /<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>([\s\S]{0,300}?)<\/a>/gi
  let m: RegExpExecArray | null
  while ((m = aRe.exec(cleaned)) !== null) {
    const href = m[1]
    if (/^(mailto:|tel:|javascript:|#)/i.test(href)) continue
    let pathname: string
    try {
      pathname = new URL(href, 'https://placeholder.local').pathname
    } catch {
      continue
    }
    if (!PROFILE_PATH_RE.test(pathname)) continue
    const text = stripHtml(m[2])
    const name = parsePersonName(text) ?? nameFromSlug(pathname)
    if (!name) continue
    const ctx = `${pathname.replace(/[-_/]+/g, ' ')} ${text}`
    if (ADMIN_RE.test(ctx) && !CLINICAL_RE.test(ctx)) {
      out.admin.add(name)
      continue
    }
    // Link under a team/profile path = team member; titles often aren't in the
    // link itself, so count regardless (total team is an acceptable proxy).
    out.clinical.add(name)
    tallyRole(ctx, out.roleHits)
  }
  return out
}

// ── Signal: staff-card CSS patterns ──────────────────────────────────────────
function staffCardSignal(cleaned: string): NameSignal {
  const out = emptySignal()
  const tagRe = /<[a-z][a-z0-9]*\b[^>]*\bclass=["']([^"']*)["'][^>]*>/gi
  let m: RegExpExecArray | null
  let processed = 0
  while ((m = tagRe.exec(cleaned)) !== null && processed < 300) {
    if (!/(^|[^a-z])(team|staff|member|practitioner|profile|bio)(?![a-z])/i.test(m[1])) continue
    processed++
    const seg = cleaned.slice(m.index, m.index + 700)
    const segLines = htmlToLines(seg)
    const name = segLines.slice(0, 5).map(parsePersonName).find(Boolean) ?? null
    if (!name) continue
    const windowText = stripHtml(seg)
    if (ADMIN_RE.test(windowText) && !CLINICAL_RE.test(windowText)) {
      out.admin.add(name)
      continue
    }
    out.clinical.add(name)
    tallyRole(windowText, out.roleHits)
  }
  return out
}

// ── Signal: image alt text ───────────────────────────────────────────────────
function altTextSignal(cleaned: string): NameSignal {
  const out = emptySignal()
  const altRe = /<img\b[^>]+\balt=["']([^"']{4,90})["']/gi
  let m: RegExpExecArray | null
  while ((m = altRe.exec(cleaned)) !== null) {
    const alt = decodeEntities(m[1])
    // alt is often "Name - Clinic Name" or "Name | Physiotherapist"
    const name = parsePersonName(alt) ?? parsePersonName(alt.split(/[|–—-]/)[0] ?? '')
    if (!name) continue
    const windowText = stripHtml(cleaned.slice(Math.max(0, m.index - 300), m.index + 500))
    if (ADMIN_RE.test(windowText) && !CLINICAL_RE.test(windowText)) {
      out.admin.add(name)
      continue
    }
    if (CLINICAL_RE.test(windowText) || CLINICAL_RE.test(alt)) {
      out.clinical.add(name)
      tallyRole(`${alt} ${windowText}`, out.roleHits)
    } else {
      out.unknown.add(name)
    }
  }
  return out
}

export type TeamExtract = { count: number; role: string; signal: string; names: string[] }

/**
 * Extract clinician count + dominant role from a team-page HTML.
 *
 * Combines independent signals (JSON-LD Person, text-line name+role
 * proximity, profile links, staff-card classes, img alt text), deduping
 * names across all of them — the name-deduped union IS the count, so
 * disagreeing signals can't multiply. Admin-only staff (receptionist,
 * practice manager, ...) are excluded wherever a title is detectable; when
 * no titles are detectable, total people on an explicit team page is an
 * acceptable proxy. Sanity bounds: only counts 1..150 are accepted.
 */
export function extractTeam(html: string): TeamExtract | null {
  const ld = jsonLdSignal(html) // needs raw scripts — run before cleanHtml
  const cleaned = cleanHtml(html)
  const text = textLineSignal(htmlToLines(stripChrome(cleaned)))
  const links = profileLinkSignal(cleaned)
  const cards = staffCardSignal(cleaned)
  const alts = altTextSignal(cleaned)

  const signals = [ld, text, links, cards, alts]
  const adminAll = new Set<string>()
  for (const s of signals) for (const n of s.admin) adminAll.add(n)

  const names = new Set<string>()
  for (const s of signals) for (const n of s.clinical) if (!adminAll.has(n)) names.add(n)

  // Unknown-title names (near a team marker / person-like alt) only count on
  // pages that explicitly present a team — proxy for undetectable titles.
  const hasTeamMarker = TEAM_MARKER_RE.test(stripHtml(cleaned).slice(0, 200000))
  let unknownUsed = 0
  if (hasTeamMarker) {
    for (const s of [text]) {
      for (const n of s.unknown) {
        if (!adminAll.has(n) && !names.has(n)) {
          names.add(n)
          unknownUsed++
        }
      }
    }
  }

  const count = names.size
  if (count < 1 || count > 150) return null // outside sanity bounds → treat as no signal

  const totalRoleHits: Record<string, number> = {}
  for (const s of signals) {
    for (const [k, v] of Object.entries(s.roleHits)) totalRoleHits[k] = (totalRoleHits[k] ?? 0) + v
  }
  const dominantRole =
    Object.entries(totalRoleHits).sort((a, b) => b[1] - a[1])[0]?.[0] || 'physiotherapists'

  return {
    count,
    role: dominantRole,
    signal: `text=${text.clinical.size}/links=${links.clinical.size}/cards=${cards.clinical.size}/ld=${ld.clinical.size}/alt=${alts.clinical.size}/unk=${unknownUsed}`,
    names: [...names].sort(), // observability/debugging — not persisted
  }
}

/**
 * Discover same-host links that look like a dedicated team page but live
 * outside the fixed candidate paths (Shopify /pages/our-team, WP
 * /practitioners/...). Shortest paths first (index pages before profiles).
 */
export function findTeamPageLinks(html: string, pageUrl: string): string[] {
  let base: URL
  try {
    base = new URL(pageUrl)
  } catch {
    return []
  }
  const out = new Set<string>()
  const hrefRe = /\bhref=["']([^"']+)["']/gi
  let m: RegExpExecArray | null
  while ((m = hrefRe.exec(html)) !== null && out.size < 6) {
    const raw = m[1]
    if (/^(mailto:|tel:|javascript:|#)/i.test(raw)) continue
    let u: URL
    try {
      u = new URL(raw, base)
    } catch {
      continue
    }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') continue
    if (u.hostname.replace(/^www\./, '') !== base.hostname.replace(/^www\./, '')) continue
    const path = u.pathname.toLowerCase()
    if (!/(?:^|[/_-])(?:our-)?(team|staff|practitioners?|clinicians?|people|meet-the-team)(?:[/_.-]|$)/.test(path)) continue
    if (/\.(pdf|jpe?g|png|gif|webp|svg|css|js|xml)$/.test(path)) continue
    if (TEAM_PAGE_CANDIDATES.includes(path.replace(/\/$/, ''))) continue // already tried
    u.hash = ''
    u.search = ''
    out.add(u.toString())
  }
  return [...out].sort((a, b) => a.length - b.length)
}

// ── SSRF guard ───────────────────────────────────────────────────────────────
// clinic_website_url comes from the DB (Apollo imports / manual entry) — an
// attacker-controlled or typo'd URL must not let this route reach internal
// services. Require http/https, resolve every hostname and reject private /
// link-local / loopback / metadata ranges, and re-check each redirect hop.

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true
  const [a, b] = parts
  if (a === 0) return true // 0.0.0.0/8
  if (a === 127) return true // loopback 127.0.0.0/8
  if (a === 10) return true // 10.0.0.0/8
  if (a === 172 && b >= 16 && b <= 31) return true // 172.16.0.0/12
  if (a === 192 && b === 168) return true // 192.168.0.0/16
  if (a === 169 && b === 254) return true // link-local + cloud metadata 169.254.0.0/16
  return false
}

export function isPrivateIp(ip: string): boolean {
  const family = net.isIP(ip)
  if (family === 4) return isPrivateIPv4(ip)
  if (family === 6) {
    const lower = ip.toLowerCase()
    if (lower === '::' || lower === '::1') return true // unspecified + loopback
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true // ULA fc00::/7
    if (lower.startsWith('fe8') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')) return true // link-local fe80::/10
    // IPv4-mapped (::ffff:10.0.0.1) — check the embedded IPv4
    const v4 = lower.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/)
    if (v4) return isPrivateIPv4(v4[1])
    return false
  }
  return true // not a valid IP — deny
}

/** True if the URL is http/https and its host resolves only to public IPs. */
export async function isSafeUrl(url: URL): Promise<boolean> {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
  const host = url.hostname.replace(/^\[|\]$/g, '') // strip IPv6 brackets
  if (net.isIP(host)) return !isPrivateIp(host)
  try {
    const addrs = await lookup(host, { all: true })
    if (addrs.length === 0) return false
    return addrs.every((a) => !isPrivateIp(a.address))
  } catch {
    return false
  }
}

const MAX_REDIRECTS = 5

async function fetchPage(url: string): Promise<string | null> {
  try {
    let current = new URL(url)
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      if (!(await isSafeUrl(current))) return null
      const res = await fetch(current, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(8000),
        redirect: 'manual',
      })
      // Follow redirects manually so every hop is re-checked against the guard
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('location')
        if (!location) return null
        current = new URL(location, current)
        continue
      }
      if (!res.ok) return null
      const ct = res.headers.get('content-type') || ''
      if (!ct.includes('html')) return null
      return await res.text()
    }
    return null // too many redirects
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  let body: { dryRun?: boolean; limit?: number; reenrich?: boolean }
  try {
    body = await req.json().catch(() => ({}))
  } catch {
    body = {}
  }
  const dryRun = body.dryRun !== false
  const limit = Math.max(1, Math.min(body.limit ?? 30, 100))
  const reenrich = body.reenrich === true

  const { rows: targets } = await sql<{
    id: number
    short_name: string
    contact_email: string
    clinic_website_url: string
    team: Record<string, number>
  }>`
    SELECT id, short_name, contact_email, clinic_website_url, team
    FROM prospect_clinics
    WHERE status IN ('researching', 'approved', 'opened', 'sent', 'engaged')
      AND clinic_website_url IS NOT NULL
      AND clinic_website_url <> ''
      AND (${reenrich} = TRUE OR (
        COALESCE(notes, '') NOT LIKE '%[team-enriched=%'
        AND COALESCE(notes, '') NOT LIKE '%[team-enrich-checked=%'
      ))
    ORDER BY id
    LIMIT ${limit}
  `

  type Result = {
    id: number
    shortName: string
    websiteTried: string[]
    teamFound: number | null
    roleFound: string | null
    signal?: string
    decision: 'enriched' | 'no-team-found' | 'no-website' | 'dry-enriched'
    note?: string
  }
  const results: Result[] = []
  const today = new Date().toISOString().slice(0, 10)
  let markedChecked = 0

  // Append [team-enrich-checked=...] so the selection query stops re-examining
  // the same unenrichable rows on every batch run.
  const markChecked = async (id: number, outcome: 'no-team-found' | 'no-website') => {
    if (dryRun) return
    const tag = `[team-enrich-checked=${outcome}/${today}]`
    await sql`
      UPDATE prospect_clinics
      SET notes = COALESCE(notes, '') || E'\n' || ${tag}
      WHERE id = ${id}
    `
    markedChecked++
  }

  for (const t of targets) {
    let baseUrl = t.clinic_website_url.trim()
    if (!baseUrl) {
      await markChecked(t.id, 'no-website')
      results.push({ id: t.id, shortName: t.short_name, websiteTried: [], teamFound: null, roleFound: null, decision: 'no-website' })
      continue
    }
    if (!baseUrl.startsWith('http')) baseUrl = `https://${baseUrl}`
    const root = baseUrl.replace(/\/$/, '')
    const tried: string[] = []
    const discovered = new Set<string>()
    let extract: TeamExtract | null = null
    let homepageExtract: TeamExtract | null = null
    let gotAnyHtml = false

    for (const path of TEAM_PAGE_CANDIDATES) {
      const url = root + path
      tried.push(path === '' ? '/' : path)
      const html = await fetchPage(url)
      if (!html) continue
      gotAnyHtml = true
      for (const link of findTeamPageLinks(html, url)) discovered.add(link)
      const e = extractTeam(html)
      if (!e) continue
      if (path === '') {
        // Homepage is the noisiest source (heroes, sponsors) — hold as fallback
        homepageExtract = e
      } else {
        extract = e
        break
      }
    }

    if (!extract) {
      // One-hop discovery: many sites keep the team outside our fixed paths
      // (Shopify /pages/our-team etc). fetchPage re-runs the SSRF guard on
      // every discovered URL. Take the best (max-count) of up to 3 pages so a
      // single-practitioner profile page can't shadow the index page.
      let best: TeamExtract | null = null
      for (const link of [...discovered].slice(0, 3)) {
        tried.push(link)
        const html = await fetchPage(link)
        if (!html) continue
        gotAnyHtml = true
        const e = extractTeam(html)
        if (e && (!best || e.count > best.count)) best = e
      }
      const candidates = [best, homepageExtract].filter((e): e is TeamExtract => e !== null)
      extract = candidates.sort((a, b) => b.count - a.count)[0] ?? null
    }

    if (!extract) {
      const outcome = gotAnyHtml ? 'no-team-found' : 'no-website'
      await markChecked(t.id, outcome)
      results.push({ id: t.id, shortName: t.short_name, websiteTried: tried, teamFound: null, roleFound: null, decision: outcome })
      continue
    }

    // Build new team JSONB. Preserve admin=1 (every clinic has at least one),
    // place the extracted count into the dominant role bucket. Zero out the
    // old placeholder buckets so we don't double-count.
    const newTeam: Record<string, number> = {
      osteopaths: 0,
      physiotherapists: 0,
      generalPractitioners: 0,
      sportsMedicineDoctors: 0,
      exercisePhys: 0,
      myotherapists: 0,
      remedialMassage: 0,
      practiceManager: 0,
      admin: 1,
    }
    newTeam[extract.role] = extract.count

    const noteTag = `[team-enriched=${extract.count}/${extract.role}/${extract.signal}/${today}]`

    if (!dryRun) {
      await sql`
        UPDATE prospect_clinics
        SET team = ${JSON.stringify(newTeam)}::jsonb,
            notes = COALESCE(notes, '') || E'\n' || ${noteTag}
        WHERE id = ${t.id}
      `
    }

    results.push({
      id: t.id,
      shortName: t.short_name,
      websiteTried: tried,
      teamFound: extract.count,
      roleFound: extract.role,
      signal: extract.signal,
      decision: dryRun ? 'dry-enriched' : 'enriched',
    })
  }

  const summary = {
    mode: dryRun ? 'dry-run' : 'applied',
    examined: results.length,
    enriched: results.filter((r) => r.decision === 'enriched' || r.decision === 'dry-enriched').length,
    noTeamFound: results.filter((r) => r.decision === 'no-team-found').length,
    noWebsite: results.filter((r) => r.decision === 'no-website').length,
    // Rows tagged [team-enrich-checked=...] this run (0 in dry-run — nothing written)
    markedChecked,
    // Distribution by extracted team size
    sizeBuckets: results.reduce<Record<string, number>>(
      (acc, r) => {
        if (r.teamFound == null) return acc
        const bucket =
          r.teamFound >= 11 ? '11+ (T1 on-site)' :
          r.teamFound >= 8 ? '8-10 (T1)' :
          r.teamFound >= 6 ? '6-7 (T2 large)' :
          r.teamFound >= 3 ? '3-5 (T2 Hub Pack)' :
          '1-2 (T3 solo)'
        acc[bucket] = (acc[bucket] ?? 0) + 1
        return acc
      },
      {},
    ),
  }

  return NextResponse.json({
    summary,
    results: results.slice(0, 60),
    truncated: results.length > 60,
  })
}
