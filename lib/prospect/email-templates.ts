import type { EmailTemplate, Discipline, ProspectClinic } from './types'
import { dominantDiscipline, teamBreakdownString, teamTotal, clinicalCount } from './pricing'

/**
 * Discipline-aware T1 opening line. Single sentence — sets context fast.
 */
const T1_OPENING_VARIANTS: Record<Discipline, string> = {
  physiotherapists:
    'Did you catch the 2024 AIS/SMA/ACSEP/APA concussion guidelines? Physios are now explicitly named as "appropriately trained" providers for the mandatory 21-day return-to-play clearance — but most clinics aren\'t structurally set up to deliver the protocol they\'re nominated to clear.',
  osteopaths:
    'The 2024 AIS/SMA/ACSEP/APA guidelines locked in a mandatory 21-day RTP stand-down for community sport concussion — and most multi-disc clinics aren\'t set up to deliver the structured clearance protocol that flows from it.',
  generalPractitioners:
    'The 2024 AIS/SMA/ACSEP/APA concussion guidelines name GPs explicitly as RTP clearance providers under the new mandatory 21-day stand-down — but 60% of AU GPs still report undertraining in the structured pathway (RACGP 2023).',
  sportsMedicineDoctors:
    'The 2024 AIS/SMA/ACSEP/APA concussion guidelines made you the diagnostic + RTP-clearance hub under a mandatory 21-day stand-down — most cases on the {region} are still routing through ED and primary care first.',
  exercisePhys:
    'The 2024 AIS guidelines extended the mandatory community-sport stand-down to 21 days — and the sub-symptom-threshold aerobic progression that drives RTP clearance is the EP-led half most clinics don\'t deliver.',
  myotherapists:
    'The 2024 AIS guidelines locked in a 21-day mandatory RTP stand-down with structured clearance — multi-disc clinics with manual-therapy depth are positioned to own the pathway, but most still refer it out.',
  remedialMassage:
    'The 2024 AIS guidelines locked in a 21-day mandatory RTP stand-down with structured clearance — multi-disc clinics with manual-therapy depth are positioned to own the pathway, but most still refer it out.',
  practiceManager:
    'The 2024 AIS/SMA/ACSEP/APA guidelines mandate a 21-day RTP stand-down with structured clearance — multi-clinician practices are positioned to capture the pathway, but most still refer the cases out.',
  admin:
    'The 2024 AIS/SMA/ACSEP/APA guidelines mandate a 21-day RTP stand-down with structured clearance — multi-clinician practices are positioned to capture the pathway, but most still refer the cases out.',
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
  p { font-size: 15px; line-height: 1.6; margin: 0 0 14px; color: #1a2332; }
  .bento { width: 100%; border-collapse: separate; border-spacing: 8px 0; margin: 14px -8px 4px; }
  .stat { background: linear-gradient(180deg, #ffffff 0%, #f8fafc 70%, #f1f5f9 100%); border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px 14px; vertical-align: top; width: 33.33%; box-shadow: inset 0 -1px 0 rgba(15,23,42,0.04), 0 2px 4px -2px rgba(15,23,42,0.06); text-align: left; }
  .stat .v { font-size: 24px; font-weight: 800; color: #0a5a5e; line-height: 1.05; letter-spacing: -0.02em; }
  .stat .l { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 5px; font-weight: 700; line-height: 1.35; }
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
    .stat { display: block !important; width: 100% !important; box-sizing: border-box !important; margin-bottom: 8px !important; }
    .cta { display: block !important; text-align: center; padding: 16px 20px !important; }
    p { font-size: 16px !important; }
    .stat .v { font-size: 22px !important; }
  }
`

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    slug: 'initial',
    subjectTemplate: '{clinic_short_name} · 2024 AIS guidelines just made you a named concussion RTP clearance provider',
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
      <p>{opening_line} I built a private dashboard for {clinic_short_name} — sample module, fillable templates, your team's pricing.</p>

      <a href="{portal_url}"><img src="{og_image_url}" alt="{clinic_short_name} preview dashboard" class="preview-img" width="548" height="288" /></a>

      <table class="bento" role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td class="stat"><div class="v">21 days</div><div class="l">Mandatory community-sport RTP stand-down (AIS 2024)</div></td>
        <td class="stat"><div class="v">Named</div><div class="l">Physios + GPs explicitly listed as clearance providers</div></td>
        <td class="stat"><div class="v">14 CPD</div><div class="l">OA endorsed · the protocol to deliver it</div></td>
      </tr></table>

      <a href="{portal_url}" class="cta">Open {clinic_short_name} Dashboard →</a>
      <span class="secondary">Or book 30 min: <a href="https://cal.com/zac-lewis-so8zjs/30min">cal.com/zac-lewis-so8zjs</a></span>

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
    city: clinic.city,
    contact_first_name: clinic.contactFirstName,
    contact_full_name: clinic.contactFullName,
    team_breakdown: teamBreakdownString(clinic.team),
    team_total: String(teamTotal(clinic.team)),
    opening_line: opening,
    portal_url: htmlEncodeUrl(portalUrl),
    access_key: clinic.accessKey,
    slug: clinic.slug,
    unsubscribe_link_only: htmlEncodeUrl(unsubscribeLinkOnly),
    nearest_metro: nearestMetro,
    og_image_url: htmlEncodeUrl(ogImageUrl),
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
