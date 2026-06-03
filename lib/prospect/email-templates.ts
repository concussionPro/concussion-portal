import type { EmailTemplate, Discipline, ProspectClinic } from './types'
import { dominantDiscipline, teamBreakdownString, teamTotal, clinicalCount } from './pricing'

/**
 * Discipline-aware T1 opening line. Single sentence — sets context fast.
 */
/**
 * Each variant is a complete HTML block: lead sentence + 3 dot-points.
 * Token replacement happens on the merged HTML at substitution time.
 */
const STANDARD_POINTS = `<ul class="points">
  <li>AHPRA-compliant protocols your whole team can run with confidence</li>
  <li>Concussion-specific neuro-assessment — VOMS, oculomotor, BESS, cervical, SCAT6/SCOAT6</li>
  <li>Evidence-based care anchored in the 2026 AIS/SMA + Amsterdam consensus</li>
</ul>`

const T1_OPENING_VARIANTS: Record<Discipline, string> = {
  physiotherapists: `<p class="lead">From diagnosis to discharge — become the concussion hub for {city}.</p>${STANDARD_POINTS}`,
  osteopaths: `<p class="lead">From diagnosis to discharge — become the concussion hub for {city}.</p>${STANDARD_POINTS}`,
  generalPractitioners: `<p class="lead">From diagnosis to discharge — become the concussion hub for {city}.</p>${STANDARD_POINTS}`,
  sportsMedicineDoctors: `<p class="lead">From diagnosis to discharge — become the concussion hub for {city}.</p>${STANDARD_POINTS}`,
  exercisePhys: `<p class="lead">From diagnosis to discharge — become the concussion hub for {city}.</p>${STANDARD_POINTS}`,
  myotherapists: `<p class="lead">From diagnosis to discharge — become the concussion hub for {city}.</p>${STANDARD_POINTS}`,
  remedialMassage: `<p class="lead">From diagnosis to discharge — become the concussion hub for {city}.</p>${STANDARD_POINTS}`,
  practiceManager: `<p class="lead">From diagnosis to discharge — become the concussion hub for {city}.</p>${STANDARD_POINTS}`,
  admin: `<p class="lead">From diagnosis to discharge — become the concussion hub for {city}.</p>${STANDARD_POINTS}`,
}

/**
 * Regional variant — for clinics in towns where the nearest concussion-trained
 * clinic is 200km+ away. "I'll come to you" is the lead, not "be the local hub."
 */
const T1_REGIONAL_OPENING =
  'Most concussion CPD requires your team to travel to {nearest_metro} and spend the night. I\'m based in Byron Bay — I\'ll bring the full-day training to {city}.'

/**
 * Network variant — for multi-clinic groups (3+ locations). Frames as a
 * network-wide deal, not a single-site send.
 */
const T1_NETWORK_OPENING =
  'Saw your team page — {network_size} locations across {region} is the kind of network that benefits from one trained clinical model rolled out everywhere, not a piecemeal CPD spend.'

const BASE_HTML_STYLE = `
  body { margin:0; padding:0; background:#eef2f6; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; color:#0f172a; -webkit-font-smoothing:antialiased; }
  .wrap { max-width: 600px; margin: 0 auto; padding: 24px 12px; }
  .card { background: #ffffff; border-radius: 20px; padding: 28px 26px 24px; border: 1px solid #e2e8f0; box-shadow: 0 10px 30px -10px rgba(15,23,42,0.12), 0 2px 6px -2px rgba(15,23,42,0.06); }
  p { font-size: 15px; line-height: 1.55; margin: 0 0 12px; color: #1a2332; }
  .lead { font-size: 16px; font-weight: 700; line-height: 1.4; margin: 4px 0 10px; color: #0f172a; }
  ul.points { margin: 4px 0 16px; padding: 0; list-style: none; }
  ul.points li { font-size: 14.5px; line-height: 1.5; color: #1a2332; padding: 4px 0 4px 22px; position: relative; }
  ul.points li::before { content: ""; position: absolute; left: 4px; top: 13px; width: 6px; height: 6px; border-radius: 3px; background: #0d7377; }
  .bento { width: 100%; border-collapse: separate; border-spacing: 10px 0; margin: 18px -10px 6px; }
  .stat { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 22px 22px 24px; vertical-align: top; width: 33.33%; text-align: left; box-shadow: 0 10px 24px -10px rgba(15,23,42,0.18), 0 2px 6px -2px rgba(15,23,42,0.06); position: relative; }
  .stat.teal { background: linear-gradient(180deg, #ffffff 0%, #f0fdfa 100%); border-left: 4px solid #14b8a6; }
  .stat.amber { background: linear-gradient(180deg, #ffffff 0%, #fffbeb 100%); border-left: 4px solid #f59e0b; }
  .stat.indigo { background: linear-gradient(180deg, #ffffff 0%, #eef2ff 100%); border-left: 4px solid #6366f1; }
  .stat .headline { display: block; line-height: 1; margin-bottom: 14px; }
  .stat .num { font-size: 44px; font-weight: 800; letter-spacing: -0.035em; line-height: 1; }
  .stat.teal .num { color: #0a5a5e; }
  .stat.amber .num { color: #b45309; }
  .stat.indigo .num { color: #4338ca; }
  .stat .unit { font-size: 15px; font-weight: 700; margin-left: 5px; letter-spacing: -0.01em; }
  .stat.teal .unit { color: #0a5a5e; }
  .stat.amber .unit { color: #b45309; }
  .stat.indigo .unit { color: #4338ca; }
  .stat .sub { font-size: 13px; color: #475569; line-height: 1.5; display: block; font-weight: 500; }
  .cta { display: inline-block; background: linear-gradient(135deg, #0d7377 0%, #0a5a5e 100%); color: #ffffff !important; padding: 16px 30px; border-radius: 12px; font-weight: 700; text-decoration: none; font-size: 15px; margin: 16px 0 4px; box-shadow: 0 8px 16px -6px rgba(13,115,119,0.45), 0 2px 4px -1px rgba(15,23,42,0.08); letter-spacing: 0.01em; }
  .secondary { display: block; font-size: 13px; color: #64748b; margin-top: 6px; }
  .secondary a { color: #0a5a5e; font-weight: 600; }
  .preview-img { display: block; width: 100%; max-width: 100%; height: auto; border-radius: 14px; border: 1px solid #e2e8f0; margin: 14px 0 6px; box-shadow: 0 16px 36px -16px rgba(15,23,42,0.25), 0 4px 10px -4px rgba(15,23,42,0.1); }
  .sig { font-size: 12px; color: #64748b; margin-top: 20px; padding-top: 14px; border-top: 1px solid #eef2f6; line-height: 1.55; }
  .sig strong { color: #0f172a; font-size: 13px; }
  .unsub { font-size: 11px; color: #cbd5e1; margin-top: 12px; }
  .unsub a { color: #94a3b8; text-decoration: underline; }
  @media only screen and (max-width: 480px) {
    .wrap { padding: 16px 8px !important; }
    .card { padding: 22px 20px !important; border-radius: 18px !important; }
    .bento { display: block !important; border-spacing: 0 !important; margin: 12px 0 4px !important; }
    .stat { display: block !important; width: 100% !important; box-sizing: border-box !important; margin-bottom: 10px !important; }
    .cta { display: block !important; text-align: center; padding: 16px 20px !important; }
    p, .lead { font-size: 16px !important; }
    .stat .v { font-size: 28px !important; }
  }
`

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    slug: 'initial',
    // Short, question-form, location-personalised. Research benchmark: questions
    // hit ~46% open vs ~21% statements; <50 chars stays visible on mobile.
    // Variants rotate per-send for A/B (subjectVariant column on prospect).
    subjectTemplate: '{subject_variant}',
    /**
     * Visual T1 — HTML email. Short text + bento stats + dashboard screenshot
     * + one CTA. The text-only fallback (used by plain-text email clients)
     * appears via Resend's automatic plain-text conversion. We pass `text`
     * as the structured body so subject merging still works server-side.
     */
    bodyTemplate: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${BASE_HTML_STYLE}</style></head>
<body>
  <div class="wrap">
    <div class="card">
      <p>Hi {contact_first_name},</p>
      {opening_block}

      <a href="{portal_url}"><img src="{og_image_url}" alt="{clinic_short_name} preview dashboard" class="preview-img" width="548" height="288" /></a>

      <table class="bento" role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td class="stat teal">
          <span class="headline"><span class="num">1</span><span class="unit"> day</span></span>
          <span class="sub">On-site, your clinic, whole multi-disc team, real cases</span>
        </td>
        <td class="stat amber">
          <span class="headline"><span class="num">8</span><span class="unit"> modules</span></span>
          <span class="sub">SCAT6 · SCOAT6 · VOMS · oculomotor · BESS · cervical · RTP + toolkit</span>
        </td>
        <td class="stat indigo">
          <span class="headline"><span class="num">14</span><span class="unit"> CPD</span></span>
          <span class="sub">CEA · OA endorsed · per clinician · AHPRA-aligned</span>
        </td>
      </tr></table>

      <a href="{portal_url}" class="cta">Open {clinic_short_name} Dashboard →</a>
      <span class="secondary">Or book 30 min: <a href="https://cal.com/zac-lewis-so8zjs/30min">cal.com/zac-lewis-so8zjs</a></span>

      <p style="margin: 22px 0 0; font-size: 13px; color: #64748b; line-height: 1.55;">CEA delivers the full system on-site — clinical training (physios, EPs, osteos), admin SOPs, document templates (GP letters, sideline cards, NDIS, RTP plans), and marketing + referral assets to anchor your clinic as the local GP, school + club concussion authority.</p>

      <div class="sig">
        <strong>Zac Lewis, Osteopath</strong> · AHPRA-registered · Founder, CEA
      </div>

      <div class="unsub">Reply STOP or <a href="{unsubscribe_link_only}">unsubscribe one-click</a></div>
    </div>
  </div>
</body></html>`,
    openingVariants: T1_OPENING_VARIANTS,
    signedOffAt: null,
    signedOffBy: null,
  },
  {
    slug: 'followup',
    subjectTemplate: 'Re: {clinic_short_name} concussion training — {region}',
    bodyTemplate: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${BASE_HTML_STYLE}</style></head>
<body>
  <div class="wrap">
    <div class="card">
      <p>Hi {contact_first_name},</p>
      <p>Following up — preview dashboard for {clinic_short_name} is still live:</p>

      <a href="{portal_url}"><img src="{og_image_url}" alt="{clinic_short_name} preview dashboard" class="preview-img" width="548" height="288" /></a>

      <table class="bento" role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td class="stat"><div class="v">Module 1</div><div class="l">Free trial · 30 min</div></td>
        <td class="stat"><div class="v">140+</div><div class="l">Peer-reviewed refs</div></td>
        <td class="stat"><div class="v">14 CPD</div><div class="l">OA endorsed</div></td>
      </tr></table>

      <a href="{portal_url}" class="cta">Open dashboard →</a>
      <span class="secondary">Or book 30 min: <a href="https://cal.com/zac-lewis-so8zjs/30min">cal.com/zac-lewis-so8zjs</a></span>

      <div class="sig"><strong>Zac Lewis, Osteopath</strong> · Founder, CEA</div>
      <div class="unsub">Reply STOP or <a href="{unsubscribe_link_only}">unsubscribe one-click</a></div>
    </div>
  </div>
</body></html>`,
    openingVariants: T1_OPENING_VARIANTS,
    signedOffAt: null,
    signedOffBy: null,
  },
  {
    slug: 'final',
    subjectTemplate: 'Closing the loop — {clinic_short_name}',
    bodyTemplate: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>${BASE_HTML_STYLE}</style></head>
<body>
  <div class="wrap">
    <div class="card">
      <p>Hi {contact_first_name},</p>
      <p>Last note from me. If the timing isn't right, all good — most regional clinics that engage circle back 6-12 months later. The preview portal stays open if you'd rather just browse the materials:</p>
      <a href="{portal_url}" class="cta">Open preview →</a>
      <div class="sig"><strong>Zac Lewis, Osteopath</strong> · Founder, Concussion Education Australia</div>
      <div class="unsub">Reply STOP or <a href="{unsubscribe_link_only}">unsubscribe one-click</a></div>
    </div>
  </div>
</body></html>`,
    openingVariants: T1_OPENING_VARIANTS,
    signedOffAt: null,
    signedOffBy: null,
  },
]

/**
 * Merge a clinic's data into a template. Returns { subject, html, text }
 * so Resend can send the HTML body with a plain-text fallback.
 *
 * Pass `regionalVariant=true` to use the "I'll come to you" opening for
 * underserved regional clinics. Pass `networkVariant={size}` to use the
 * multi-clinic-network opener for groups (3+ locations).
 */
export function mergeTemplate(
  template: EmailTemplate,
  clinic: ProspectClinic,
  baseUrl: string,
  unsubscribeToken: string,
  options: {
    regionalVariant?: boolean
    networkVariant?: { networkSize: number; nearestMetro?: string }
    nearestMetro?: string
  } = {},
): { subject: string; html: string; text: string } {
  const discipline = clinic.contactDiscipline
  const nearestMetro = options.nearestMetro ?? options.networkVariant?.nearestMetro ?? 'Sydney or Brisbane'

  // Pick the discipline-aware HTML opening (lead + bullets). Regional and
  // network variants override the lead + first/third bullets with their angle.
  let openingBlock = template.openingVariants[discipline] ?? template.openingVariants.physiotherapists

  // Subject-line variants (research-backed: short, question, location-personalised, <50 chars).
  // Pick deterministically from slug so the same prospect always gets the same
  // variant on retries; rotates across the prospect cohort for A/B insight.
  const subjectVariants = [
    `Concussion hub for ${clinic.city}?`,
    `${clinic.city}'s concussion pathway?`,
    `Become ${clinic.city}'s concussion authority?`,
    `2026 RTP clearance for ${clinic.shortName}?`,
  ]
  const variantIdx = clinic.slug.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % subjectVariants.length
  const subjectVariant = subjectVariants[variantIdx]

  if (options.networkVariant) {
    openingBlock = `<p class="lead">${options.networkVariant.networkSize} locations across ${clinic.region} — one trained model rolls out everywhere.</p>
<ul class="points">
  <li>21-day RTP stand-down — now mandatory community sport (AIS 2024)</li>
  <li>Physios + GPs explicitly named as clearance providers</li>
  <li>Network rollout: one curriculum, one protocol, every clinic</li>
</ul>`
  } else if (options.regionalVariant) {
    openingBlock = `<p class="lead">I'm based in Byron Bay — I'll bring the full-day training to ${clinic.city}.</p>
<ul class="points">
  <li>No travel to ${nearestMetro} — your clinic, your cases, your whole team in one day</li>
  <li>2024 AIS/SMA: 21-day RTP stand-down now mandatory community sport</li>
  <li>Most concussion CPD requires team travel to ${nearestMetro} + overnight stays</li>
</ul>`
  }

  // Region phrasing — single source of truth for "for {region_phrase}" copy.
  // Some regions need the definite article to sound natural ("the Gold Coast"),
  // others don't ("Brisbane"). Anything unmapped falls back to {city} which
  // always works (every clinic has a city). Better to use the city than emit
  // grammatically wrong copy.
  const regionPhrase = naturalRegionPhrase(clinic.region) ?? clinic.city

  openingBlock = openingBlock
    .replace(/\{clinic_short_name\}/g, clinic.shortName)
    .replace(/\{region_phrase\}/g, regionPhrase)
    .replace(/\{region\}/g, clinic.region)
    .replace(/\{city\}/g, clinic.city)
    .replace(/\{nearest_metro\}/g, nearestMetro)

  const portalUrl = `${baseUrl}/p/${clinic.slug}?k=${clinic.accessKey}`
  const unsubscribeLinkOnly = `${baseUrl}/api/prospect/unsubscribe?t=${unsubscribeToken}`

  // Build OG image URL with FULL query-string payload so the image renders
  // even when the prospect isn't in the DB (sample sends, previews). The
  // route prefers DB lookup by slug, falls back to query params if not found.
  // Cache-bust pinned to the current deploy SHA. Bumps once per deploy and
  // stays stable across sends — that lets Vercel CDN + Gmail's proxy serve
  // the cached PNG from the second send onwards instead of re-running
  // microlink every time. Falls back to a daily bucket if SHA missing.
  const deployVersion =
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ?? new Date().toISOString().slice(0, 10)
  const ogParams = new URLSearchParams({
    slug: clinic.slug,
    v: deployVersion,
  })
  const ogImageUrl = `${baseUrl}/api/prospect/og-image?${ogParams.toString()}`

  // HTML-encode `&` → `&amp;` for any URL going inside an HTML attribute.
  // Email clients (Gmail, Outlook) parse `src="...&..."` strictly — raw `&`
  // truncates the URL after the first param. Plain-text fallback uses the
  // raw URL (htmlToPlainText decodes &amp; back to &).
  const htmlEncodeUrl = (u: string) => u.replace(/&/g, '&amp;')

  const variables: Record<string, string | undefined> = {
    base_url: baseUrl,
    clinic_name: clinic.name,
    clinic_short_name: clinic.shortName,
    region: clinic.region,
    region_phrase: regionPhrase,
    city: clinic.city,
    contact_first_name: clinic.contactFirstName,
    contact_full_name: clinic.contactFullName,
    team_breakdown: teamBreakdownString(clinic.team),
    team_total: String(teamTotal(clinic.team)),
    opening_block: openingBlock,
    portal_url: htmlEncodeUrl(portalUrl),
    access_key: clinic.accessKey,
    slug: clinic.slug,
    unsubscribe_link_only: htmlEncodeUrl(unsubscribeLinkOnly),
    nearest_metro: nearestMetro,
    og_image_url: htmlEncodeUrl(ogImageUrl),
    subject_variant: subjectVariant,
  }

  const subject = mergeVariables(template.subjectTemplate, variables)
  const html = mergeVariables(template.bodyTemplate, variables)
  const text = htmlToPlainText(html)
  return { subject, html, text }
}

/**
 * Token resolution. Removes any unresolved {placeholders} entirely so the
 * email never ships with raw merge artefacts visible. Whitespace + dangling
 * punctuation cleaned up.
 */
/**
 * Returns the natural sentence form of a region — with article when needed.
 * Only returns a phrase for regions explicitly mapped. Unknown regions
 * return null so the caller can fall back to {city} rather than emit
 * grammatically broken copy. Bias: don't risk it.
 *
 * To extend: add the raw `region` value from prospect_clinics here.
 * Match the actual data in `data/prospect-targets.ts`.
 */
function naturalRegionPhrase(region: string): string | null {
  const phrases: Record<string, string> = {
    'Gold Coast': 'the Gold Coast',
    'Sunshine Coast': 'the Sunshine Coast',
    'Sunshine Coast + Gold Coast': 'the Sunshine Coast + Gold Coast',
    'Northern Rivers': 'the Northern Rivers',
    'Mid North Coast': 'the Mid North Coast',
    'Newcastle / Hunter': 'Newcastle',
    'Canberra / ACT': 'Canberra',
    Brisbane: 'Brisbane',
    Adelaide: 'Adelaide',
    Melbourne: 'Melbourne',
    Sydney: 'Sydney',
    Perth: 'Perth',
    Hobart: 'Hobart',
    Darwin: 'Darwin',
  }
  return phrases[region] ?? null
}

function mergeVariables(str: string, vars: Record<string, string | undefined>): string {
  const replaced = str.replace(/\{([a-z_]+)\}/g, (_m, key) => {
    const value = vars[key]
    if (value && value.trim().length > 0) return value
    return ''
  })
  return replaced
    .replace(/[ \t]+/g, ' ')
    .replace(/\(\s*\)/g, '')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/,\s*([,.])/g, '$1')
    .trim()
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)')
    .replace(/<img [^>]*alt="([^"]*)"[^>]*\/?>/gi, '[$1]')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function previewInitialEmail(
  clinic: ProspectClinic,
  baseUrl: string = 'https://portal.concussion-education-australia.com',
): { subject: string; html: string; text: string } {
  const tpl = EMAIL_TEMPLATES.find((t) => t.slug === 'initial')!
  return mergeTemplate(tpl, clinic, baseUrl, 'preview-token')
}

export { dominantDiscipline }
