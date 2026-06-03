import type { EmailTemplate, Discipline, ProspectClinic } from './types'
import { dominantDiscipline, teamBreakdownString, teamTotal, clinicalCount } from './pricing'

/**
 * Discipline-aware T1 opening line. Single sentence — sets context fast.
 */
const T1_OPENING_VARIANTS: Record<Discipline, string> = {
  osteopaths:
    '{osteo_count} osteopaths means you can run a serious concussion program — diagnosis through return-to-play.',
  physiotherapists:
    '{physio_count} physios working sideline and return-to-play means concussion cases are on the books regularly.',
  generalPractitioners:
    'Primary-care practices managing concussion locally need the diagnostic side tight and the referral pathway clear.',
  sportsMedicineDoctors:
    'Sports medicine is the centre of concussion decisions on the {region} — your team is positioned to own it.',
  exercisePhys:
    'EP-led concussion rehab — sub-symptom-threshold aerobic, vestibular progression — is the underbuilt half of recovery.',
  myotherapists:
    'Multi-disc clinics with strong manual-therapy depth are the right home for a coordinated concussion pathway.',
  remedialMassage:
    'Multi-disc clinics with strong manual-therapy depth are the right home for a coordinated concussion pathway.',
  practiceManager:
    'A multi-disc clinic the size of {clinic_short_name} has the team composition concussion management is designed for.',
  admin:
    'A multi-disc clinic the size of {clinic_short_name} has the team composition concussion management is designed for.',
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
  body { margin:0; padding:0; background:#f8fafc; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; color:#1a2332; }
  .wrap { max-width: 600px; margin: 0 auto; padding: 32px 16px; }
  .card { background: #ffffff; border-radius: 16px; padding: 24px; border: 1px solid #e2e8f0; }
  h1 { font-size: 24px; line-height: 1.2; margin: 0 0 12px; font-weight: 800; letter-spacing: -0.01em; color: #0a5a5e; }
  p { font-size: 15px; line-height: 1.55; margin: 0 0 14px; color: #1a2332; }
  .muted { color: #64748b; font-size: 13px; }
  .bento { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 16px 0; }
  .stat { background: #f1f5f9; border-radius: 10px; padding: 12px 14px; }
  .stat .v { font-size: 18px; font-weight: 800; color: #0a5a5e; line-height: 1.1; }
  .stat .l { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 4px; font-weight: 600; }
  .cta { display: inline-block; background: #0d7377; color: #ffffff; padding: 14px 28px; border-radius: 10px; font-weight: 700; text-decoration: none; font-size: 15px; margin: 16px 0; }
  .cta:hover { background: #0a5a5e; }
  .secondary { display: block; font-size: 13px; color: #475569; margin-top: 12px; }
  .secondary a { color: #0a5a5e; }
  .preview-img { display: block; width: 100%; max-width: 568px; height: auto; border-radius: 12px; border: 1px solid #e2e8f0; margin: 16px 0; }
  .sig { font-size: 13px; color: #475569; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; line-height: 1.5; }
  .sig strong { color: #1a2332; }
  .unsub { font-size: 11px; color: #94a3b8; margin-top: 12px; }
  .unsub a { color: #94a3b8; text-decoration: underline; }
`

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    slug: 'initial',
    subjectTemplate: '{clinic_short_name} concussion training — {region}',
    /**
     * Visual T1 — HTML email. Short text + bento stats + dashboard screenshot
     * + one CTA. The text-only fallback (used by plain-text email clients)
     * appears via Resend's automatic plain-text conversion. We pass `text`
     * as the structured body so subject merging still works server-side.
     */
    bodyTemplate: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>${BASE_HTML_STYLE}</style></head>
<body>
  <div class="wrap">
    <div class="card">
      <p>Hi {contact_first_name},</p>
      <p>{opening_line}</p>

      <div class="bento">
        <div class="stat"><div class="v">14</div><div class="l">CPD hrs · OA endorsed</div></div>
        <div class="stat"><div class="v">8 modules</div><div class="l">Online + on-site at your clinic</div></div>
        <div class="stat"><div class="v">A$1,000</div><div class="l">Per clinician on-site (vs A$1,400 public)</div></div>
        <div class="stat"><div class="v">1 day</div><div class="l">Whole team trained together</div></div>
      </div>

      <a href="{portal_url}"><img src="{og_image_url}" alt="{clinic_short_name} preview portal" class="preview-img" width="568" height="298" /></a>

      <p style="font-size:13px;color:#475569;">A private preview portal for {clinic_short_name} — sample module, fillable templates, pricing for your team size.</p>

      <a href="{portal_url}" class="cta">Open your preview →</a>
      <span class="secondary">Or book 20 min: <a href="https://cal.com/zac-lewis-so8zjs/30min">cal.com/zac-lewis-so8zjs</a></span>

      <div class="sig">
        <strong>Zac Lewis, Osteopath</strong> · B.Clin.Sci., M.Ost.Med.<br/>
        AHPRA-registered · Founder, Concussion Education Australia<br/>
        Worked with national + professional ice-hockey leagues in NZ &amp; Canada
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
<html><head><meta charset="utf-8"><style>${BASE_HTML_STYLE}</style></head>
<body>
  <div class="wrap">
    <div class="card">
      <p>Hi {contact_first_name},</p>
      <p>Following up on my note from last week. Two things worth the 5-minute skim even if a cohort isn't right for {clinic_short_name} this year:</p>

      <div class="bento">
        <div class="stat"><div class="v">Module 1</div><div class="l">Free trial · interactive quiz</div></div>
        <div class="stat"><div class="v">140+</div><div class="l">Peer-reviewed references</div></div>
      </div>

      <a href="{portal_url}"><img src="{og_image_url}" alt="{clinic_short_name} preview portal" class="preview-img" width="568" height="298" /></a>

      <a href="{portal_url}" class="cta">Open your preview →</a>
      <span class="secondary">Or book 20 min: <a href="https://cal.com/zac-lewis-so8zjs/30min">cal.com/zac-lewis-so8zjs</a></span>

      <div class="sig"><strong>Zac Lewis, Osteopath</strong> · Founder, Concussion Education Australia</div>
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

  let opening: string
  if (options.networkVariant) {
    opening = T1_NETWORK_OPENING
      .replace(/\{network_size\}/g, String(options.networkVariant.networkSize))
      .replace(/\{region\}/g, clinic.region)
  } else if (options.regionalVariant) {
    opening = T1_REGIONAL_OPENING
      .replace(/\{nearest_metro\}/g, nearestMetro)
      .replace(/\{city\}/g, clinic.city)
  } else {
    opening = template.openingVariants[discipline]
      .replace(/\{clinic_short_name\}/g, clinic.shortName)
      .replace(/\{region\}/g, clinic.region)
      .replace(/\{osteo_count\}/g, String(clinic.team.osteopaths))
      .replace(/\{physio_count\}/g, String(clinic.team.physiotherapists))
      .replace(/\{ep_count\}/g, String(clinic.team.exercisePhys))
  }

  const portalUrl = `${baseUrl}/p/${clinic.slug}?k=${clinic.accessKey}`
  const unsubscribeLinkOnly = `${baseUrl}/api/prospect/unsubscribe?t=${unsubscribeToken}`

  // Build OG image URL with FULL query-string payload so the image renders
  // even when the prospect isn't in the DB (sample sends, previews). The
  // route prefers DB lookup by slug, falls back to query params if not found.
  const ogParams = new URLSearchParams({
    slug: clinic.slug,
    name: clinic.shortName,
    city: clinic.city,
    state: clinic.state,
    region: clinic.region,
    breakdown: teamBreakdownString(clinic.team),
    clinical: String(clinicalCount(clinic.team)),
  })
  const ogImageUrl = `${baseUrl}/api/prospect/og-image?${ogParams.toString()}`

  const variables: Record<string, string | undefined> = {
    base_url: baseUrl,
    clinic_name: clinic.name,
    clinic_short_name: clinic.shortName,
    region: clinic.region,
    city: clinic.city,
    contact_first_name: clinic.contactFirstName,
    contact_full_name: clinic.contactFullName,
    team_breakdown: teamBreakdownString(clinic.team),
    team_total: String(teamTotal(clinic.team)),
    opening_line: opening,
    portal_url: portalUrl,
    access_key: clinic.accessKey,
    slug: clinic.slug,
    unsubscribe_link_only: unsubscribeLinkOnly,
    nearest_metro: nearestMetro,
    og_image_url: ogImageUrl,
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
