import type { EmailTemplate, Discipline, ProspectClinic } from './types'
import { dominantDiscipline, teamBreakdownString, teamTotal, clinicalCount, hubPackPriceFor, computePricing } from './pricing'

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

// {hub_phrase} is rendered as either "for {city}" (location known) or
// "for concussion management" (location unknown — the "local hub for
// concussion management" framing per Zac). Single substitution keeps
// the lead sentence reading cleanly either way.
const T1_OPENING_VARIANTS: Record<Discipline, string> = {
  physiotherapists: `<p class="lead">From diagnosis to discharge — become the concussion hub {hub_phrase}.</p>${STANDARD_POINTS}`,
  osteopaths: `<p class="lead">From diagnosis to discharge — become the concussion hub {hub_phrase}.</p>${STANDARD_POINTS}`,
  generalPractitioners: `<p class="lead">From diagnosis to discharge — become the concussion hub {hub_phrase}.</p>${STANDARD_POINTS}`,
  sportsMedicineDoctors: `<p class="lead">From diagnosis to discharge — become the concussion hub {hub_phrase}.</p>${STANDARD_POINTS}`,
  exercisePhys: `<p class="lead">From diagnosis to discharge — become the concussion hub {hub_phrase}.</p>${STANDARD_POINTS}`,
  myotherapists: `<p class="lead">From diagnosis to discharge — become the concussion hub {hub_phrase}.</p>${STANDARD_POINTS}`,
  remedialMassage: `<p class="lead">From diagnosis to discharge — become the concussion hub {hub_phrase}.</p>${STANDARD_POINTS}`,
  practiceManager: `<p class="lead">From diagnosis to discharge — become the concussion hub {hub_phrase}.</p>${STANDARD_POINTS}`,
  admin: `<p class="lead">From diagnosis to discharge — become the concussion hub {hub_phrase}.</p>${STANDARD_POINTS}`,
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
  .role-bento { width: 100%; border-collapse: separate; border-spacing: 6px 0; margin: 4px -6px 6px; }
  .role { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; vertical-align: top; width: 25%; text-align: left; }
  .role-name { font-size: 11px; font-weight: 800; color: #0a5a5e; letter-spacing: 0.04em; display: block; }
  .role-covers { font-size: 11px; color: #64748b; line-height: 1.35; display: block; margin-top: 3px; font-weight: 500; }
  @media only screen and (max-width: 480px) {
    .role-bento { display: block !important; border-spacing: 0 !important; margin: 6px 0 4px !important; }
    .role { display: inline-block !important; width: calc(50% - 8px) !important; margin: 0 4px 6px 0 !important; box-sizing: border-box !important; vertical-align: top; }
  }
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

      <p style="margin: 6px 0 14px; padding: 9px 12px; background: #f0fdfa; border-left: 3px solid #0a5a5e; border-radius: 4px; font-size: 13px; color: #0a5a5e; line-height: 1.5;">
        <strong>Osteopathy Australia endorsed</strong> · 14 CPD hours AHPRA-aligned · delivered by an AHPRA-registered osteopath who's spent a decade on concussion at the elite-sport end.
      </p>

      <a href="{portal_image_url}"><img src="{og_image_url}" alt="{clinic_short_name} preview dashboard" class="preview-img" width="548" height="288" /></a>

      {stats_block}

      {offer_block}

      <a href="{portal_url}" class="cta">See the {clinic_short_name} preview →</a>
      <span class="secondary"><a href="{cal_booking_url}">Or book a 15-min discovery call</a></span>

      <p style="margin: 20px 0 8px; font-size: 12px; color: #0a5a5e; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 700;">Multidisciplinary integration</p>
      <table class="role-bento" role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td class="role"><span class="role-name">Osteo / Physio / Chiro</span><span class="role-covers">Diagnosis · case management · cervicogenic</span></td>
        <td class="role"><span class="role-name">Physio / EP</span><span class="role-covers">Return to play · sub-threshold aerobic</span></td>
        <td class="role"><span class="role-name">Myo / RMT</span><span class="role-covers">Soft tissue · inflammation</span></td>
        <td class="role"><span class="role-name">Admin</span><span class="role-covers">GP letters · NDIS · schools</span></td>
      </tr></table>

      <div class="sig">
        <strong>Zac Lewis, Osteopath</strong> · AHPRA-registered · Founder, CEA
        <br><span style="font-size: 11px; color: #94a3b8;">Speaker · Osteopathy Australia conferences</span>
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
    subjectTemplate: '{followup_subject}',
    bodyTemplate: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${BASE_HTML_STYLE}</style></head>
<body>
  <div class="wrap">
    <div class="card">
      <p>Hi {contact_first_name},</p>
      {followup_intro}

      <a href="{portal_image_url}"><img src="{og_image_url}" alt="{clinic_short_name} preview" class="preview-img" width="548" height="288" /></a>

      {followup_bullets}

      {followup_price_block}
      {followup_cta_block}

      <div class="sig"><strong>Zac Lewis, Osteopath</strong> · Founder, CEA · <span style="color: #94a3b8;">Speaker · OA conferences</span></div>
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
    subjectTemplate: 'In case you were still weighing this up — {clinic_short_name}',
    // T3 = warm "just in case" recap, sent 14 BD after T2 (research-backed
    // final-touch window per HubSpot/Salesloft/Outreach.io). Helpful tone
    // outperforms aggressive closes 3-4x in reply rate. By this point
    // theyve had T1 (pitch + SCAT pack footnote) and T2 (free intake
    // flowchart as headline). No new gift - this is a quiet recap of the
    // options theyve already seen, in case timing wasnt right earlier.
    // {followup_price_block} always discloses price at T3.
    bodyTemplate: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>${BASE_HTML_STYLE}</style></head>
<body>
  <div class="wrap">
    <div class="card">
      <p>Hi {contact_first_name},</p>
      <p>No urgency from my end at all — but I wanted to drop a quick recap in case {clinic_short_name} was still weighing this up. Sometimes the timing for a CPD decision lands on the third look, not the first.</p>

      <p style="margin: 12px 0 14px; font-size: 14px; color: #1a2332; line-height: 1.55;">Two ways the program can land:</p>

      <ul style="margin: 0 0 14px; padding: 0 0 0 18px; font-size: 13.5px; color: #1a2332; line-height: 1.6;">
        <li style="margin-bottom: 8px;"><strong>Online Hub Pack</strong> — your team trained in their own time, lifetime access, clinic-branded clinical pack. Best fit for self-paced teams.</li>
        <li><strong>On-site cohort day</strong> — full day at {clinic_short_name}, hands-on with the whole team, on a Saturday that suits. Best fit for 6+ clinicians.</li>
      </ul>

      {followup_price_block}

      <p style="margin: 12px 0 14px; padding: 8px 12px; background: #f0fdfa; border-left: 3px solid #0a5a5e; border-radius: 4px; font-size: 12.5px; color: #0a5a5e; line-height: 1.5;">
        Osteopathy Australia endorsed · 14 CPD hours · AHPRA-aligned.
      </p>

      <p style="margin: 14px 0 10px; font-size: 13.5px; color: #1a2332; line-height: 1.55;">Easiest way to figure out which one fits is a 15-min chat — no pressure, just a quick discovery call:</p>

      <a href="{cal_booking_url}" class="cta">Book a 15-min discovery call →</a>
      <span class="secondary">Or revisit the <a href="{portal_url}">{clinic_short_name} preview</a> · reply with a question — I'll answer in writing within a day.</span>

      <p style="margin: 18px 0 0; font-size: 13px; color: #475569; line-height: 1.55;">
        Either way — this is my last scheduled note. No more sequence emails after this. If something changes for {clinic_short_name} down the line (new regulatory update, an AFL ruling, a tricky case), I'm a reply away.
      </p>

      <p style="margin: 12px 0 0; font-size: 13px; color: #475569; line-height: 1.55;">
        Thanks for your time either way, {contact_first_name}.
      </p>

      <div class="sig">
        <strong>Zac Lewis, Osteopath</strong> · AHPRA-registered · Founder, Concussion Education Australia
        <br><span style="font-size: 11px; color: #94a3b8;">Speaker · OA conferences</span>
      </div>
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
    /**
     * Engagement signal from the PREVIOUS template in the sequence.
     * Drives T2/T3 opening variant — references prior engagement when
     * present so the prospect sees a personalised followup, not boilerplate.
     */
    priorEngagement?: 'none' | 'opened' | 'clicked'
  } = {},
): { subject: string; html: string; text: string } {
  const discipline = clinic.contactDiscipline
  const nearestMetro = options.nearestMetro ?? options.networkVariant?.nearestMetro ?? 'Sydney or Brisbane'

  // Pick the discipline-aware HTML opening (lead + bullets). Regional and
  // network variants override the lead + first/third bullets with their angle.
  let openingBlock = template.openingVariants[discipline] ?? template.openingVariants.physiotherapists

  // Match the offer to the prospect. Small/medium clinics (4-10 clinical)
  // get the Hub Pack pitch ($1,497 online + branded docs). Large/enterprise
  // (11+ clinical) get the on-site cohort pitch (Zac comes to the clinic,
  // full team trained in 1 day, $8-15k). Product-target match is the
  // single biggest conversion lever — Google Ads was so bad partly because
  // it pitched the same single-seat course to clinic owners who needed
  // team training.
  const hubPricing = hubPackPriceFor(clinic.team)
  const cohortPricing = computePricing(clinic.team, clinic.travelBand)
  const isOnSiteTarget = hubPricing.recommendedOffer === 'on-site-cohort'

  let statsBlock: string
  let offerBlock: string

  if (isOnSiteTarget) {
    // Large / enterprise clinic — on-site cohort pitch
    const recoCohort = cohortPricing.cohortTiers.find((t) => {
      const reco = clinic.cohortRecommendation
      const name = reco === 'essential' ? 'Essential' : reco === 'full-team' ? 'Full team' : 'Recommended'
      return t.name === name
    })!
    const cohortPriceFormatted = `A$${recoCohort.total.toLocaleString('en-AU')}`
    const isInvitingBucket = hubPricing.bucket === 'inviting'
    const isEnterprise = hubPricing.bucket === 'enterprise'
    statsBlock = `<table class="bento" role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td class="stat teal">
          <span class="headline"><span class="num">1</span><span class="unit"> day</span></span>
          <span class="sub">On-site at ${clinic.shortName}</span>
        </td>
        <td class="stat amber">
          <span class="headline"><span class="num">${recoCohort.clinicians}</span><span class="unit"> clinicians</span></span>
          <span class="sub">${isEnterprise ? 'Full-team cohort' : recoCohort.name + ' cohort'} · trained together</span>
        </td>
        <td class="stat indigo">
          <span class="headline"><span class="num">14</span><span class="unit"> CPD</span></span>
          <span class="sub">OA endorsed · per clinician</span>
        </td>
      </tr></table>`
    // T1 doesn't disclose price — that's gated on portal-view engagement.
    // Price + cohort breakdown lives on the dashboard. T2 unlocks price in
    // copy IF the prospect has clicked through and seen the product.
    // Product = CPD hours. Per person. 14 hrs per clinician, OA endorsed,
    // AHPRA-aligned. Dont multiply across the team — that misrepresents
    // the deliverable. The team-size + one-day-delivery are HOW it's
    // delivered, not what they get.
    const headerLine = isEnterprise
      ? `<strong>14 CPD hours per clinician — Osteopathy Australia endorsed, AHPRA-aligned.</strong> Delivered to ${clinic.shortName}'s full ${recoCohort.clinicians}-clinician team in one day, on-site. Concussion-specific: VOMS, oculomotor, BESS, cervical, SCAT6/SCOAT6 — hands-on practice, not a webinar. No staggered scheduling, no clinicians out of the clinic for weeks getting separate courses.`
      : `<strong>14 CPD hours per clinician — Osteopathy Australia endorsed, AHPRA-aligned.</strong> Delivered to ${clinic.shortName}'s ${recoCohort.clinicians}-clinician team in one day, on-site. Concussion-specific: VOMS, oculomotor, BESS, cervical, SCAT6/SCOAT6 — hands-on, applied to your caseload immediately.`
    // Email is the hook, not the brochure. Details on the call.
    const invitingNote = isInvitingBucket
      ? ` Invite 1-3 referrers to fill the cohort if needed.`
      : ''
    offerBlock = `<p style="margin: 18px 0 16px; font-size: 14.5px; line-height: 1.55; color: #1a2332;">
        ${headerLine}${invitingNote}
      </p>`
  } else {
    // Small / medium clinic — Hub Pack pitch.
    //
    // Hub Pack actual scope (per Zac 2026-06-08): up to 5 clinicians + admin
    // access. The bento reflects the ACTUAL offer ceiling, not the clinic's
    // raw clinical headcount — overstating the included seats would be a
    // misrepresentation. If the clinic happens to be ≤5 clinicians we show
    // their exact count; if they're between 6 and on-site threshold we show
    // "5 clinicians + admin" to set the right expectation. Extra seats ($497
    // each) get mentioned in the followup body.
    const rawClinical = clinicalCount(clinic.team) || 4
    const hubSeatCount = Math.min(rawClinical, 5)
    statsBlock = `<table class="bento" role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td class="stat teal">
          <span class="headline"><span class="num">${hubSeatCount}</span><span class="unit"> clinician${hubSeatCount === 1 ? '' : 's'} + admin</span></span>
          <span class="sub">All of ${clinic.shortName}'s team trained${rawClinical > 5 ? ` · extra seats $497 ea` : ''}</span>
        </td>
        <td class="stat amber">
          <span class="headline"><span class="num">~8</span><span class="unit"> hrs</span></span>
          <span class="sub">Admin work handed to your team · pre-built referrals + intake</span>
        </td>
        <td class="stat indigo">
          <span class="headline"><span class="num">14</span><span class="unit"> CPD</span></span>
          <span class="sub">OA endorsed · per clinician</span>
        </td>
      </tr></table>`
    // T1 doesn't disclose price for small clinics either. Pricing is on
    // the dashboard — gates on engagement.
    offerBlock = `<p style="margin: 18px 0 16px; font-size: 14.5px; line-height: 1.55; color: #1a2332;">
        <strong>14 CPD hours per clinician — Osteopathy Australia endorsed, AHPRA-aligned.</strong> ${clinic.shortName}'s ${hubSeatCount} clinicians + admin, completed online at each clinician's own pace — no time off the clinical schedule. Includes the clinic-branded admin pack (pre-built referrals, intake, RTP clearance docs auto-filling with ${clinic.shortName}'s details).
      </p>`
  }

  // Subject-line variants (research-backed: short, question, location-personalised, <50 chars).
  // Pick deterministically from slug so the same prospect always gets the same
  // variant on retries; rotates across the prospect cohort for A/B insight.
  // Mix of statements + capability-style questions (no possessives, no salesy
  // "Become" framing). Capability questions prompt self-reflection without
  // being pushy: "Are you positioned to..." reads as professional curiosity.
  // Filter out variants that reference unverified data BEFORE picking. The
  // sweep importer defaults city to 'Unknown' when Apollo doesn't populate
  // it — that variant must NEVER ship as "Concussion hub for Unknown".
  // Same defence for shortName containing 'Unknown' (paranoid — shouldn't
  // happen but the data is messy).
  const hasUnknownCity = !clinic.city || /unknown/i.test(clinic.city)
  const hasUnknownShortName = !clinic.shortName || /unknown/i.test(clinic.shortName)
  const allVariants: Array<{ subject: string; refs: 'city' | 'shortName' | 'none' }> = [
    { subject: `Concussion hub for ${clinic.city}`, refs: 'city' },
    { subject: `Multidisciplinary concussion protocol · ${clinic.shortName}`, refs: 'shortName' },
    { subject: `Are you positioned to manage concussion cases?`, refs: 'none' },
    { subject: `Is ${clinic.shortName} ready for the 2026 RTP standard?`, refs: 'shortName' },
  ]
  const subjectVariants = allVariants
    .filter((v) => !(v.refs === 'city' && hasUnknownCity))
    .filter((v) => !(v.refs === 'shortName' && hasUnknownShortName))
    .map((v) => v.subject)
  // Belt-and-braces: if every variant got filtered out (extremely degraded
  // data), fall through to the discipline-agnostic capability question
  // which never references clinic fields.
  if (subjectVariants.length === 0) subjectVariants.push('Are you positioned to manage concussion cases?')
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

  // Safe location substitution: if Apollo gave us 'Unknown' (or empty) for
  // city/region — which happens for ~95% of the bulk import — substitute
  // a neutral phrase so the email never ships "concussion hub for Unknown".
  // hasUnknownCity already declared above at the subject-variant filter;
  // reuse it here.
  const hasUnknownRegion = !clinic.region || /unknown/i.test(clinic.region)
  // Location fallback — per Zac: when city/region can't be recovered,
  // drop the geographic frame entirely and pitch as "local hub for
  // concussion management". Custom (with city/region) is the ideal,
  // this is the graceful fallback that still ships clean copy.
  const safeCity = hasUnknownCity ? 'your area' : clinic.city
  const safeRegion = hasUnknownRegion ? 'your region' : clinic.region
  const locationUnknown = hasUnknownCity && hasUnknownRegion

  // Region phrasing — single source of truth for "for {region_phrase}" copy.
  // Some regions need the definite article to sound natural ("the Gold Coast"),
  // others don't ("Brisbane"). Anything unmapped falls back to the city
  // (which itself falls back to 'your area' if also unknown).
  const regionPhrase = hasUnknownRegion
    ? safeCity
    : (naturalRegionPhrase(clinic.region) ?? safeCity)

  // ─── T2 followup variant — TWO FREE TOOLS, NO TRACKING ACKNOWLEDGMENT ──
  // 2026-06-08 rewrite (v3): T2 leads with TWO genuinely useful free tools
  // the prospect can deploy this week:
  //   1. Free SCAT mastery mini-course - the 1-hr CPD-eligible refresher
  //   2. Free pre-season baseline testing tool - athletes self-administer
  //      SCAT6 baselines remotely (huge for sports teams + school clinics)
  //
  // No tracking ack in subject or intro. Pitch follows the value drop.
  // All variants end with a discovery-call CTA (per Zac 2026-06-08).
  const engagement = options.priorEngagement ?? 'none'
  const discloseFollowupPrice = template.slug === 'final' || engagement !== 'none'
  // Subject variants — deliberately avoid the word "free" (major spam-filter
  // trigger that tanks inbox placement for clinical-CPD bulk sends).
  // Resource still genuinely free in the body; we just dont shout it in
  // the subject. Rotate by clinic-hash so the same clinic always gets the
  // same variant on retries.
  const t2Variants: string[] = [
    `${clinic.shortName} online cognitive baseline testing + SCAT mini-course`,
    `Two new clinical tools for ${clinic.shortName}: SCAT refresher + baseline testing`,
    `Baseline testing tool for ${clinic.shortName} - no setup, no cost`,
  ]
  const t2Idx = clinic.slug.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % t2Variants.length
  const followupSubject = t2Variants[t2Idx]
  // Intro = lead with the two free tools, no engagement reference.
  let followupIntro: string
  if (isOnSiteTarget) {
    followupIntro = `<p>Quick follow-up — wanted to share two free tools that pair well with the on-site cohort day for ${clinic.shortName}:</p>
      <p style="margin: 10px 0; padding: 10px 12px; background: #f0fdfa; border-radius: 6px; font-size: 13.5px; line-height: 1.55;">
        <strong>1. Free SCAT mastery mini-course</strong> — 1-hr CPD-eligible refresher (SCAT6, SCOAT6, oculomotor, BESS). Anyone on your team can take it free: <a href="{scat_pack_url}">{base_url_short}/scat-mastery</a>
      </p>
      <p style="margin: 10px 0; padding: 10px 12px; background: #f0fdfa; border-radius: 6px; font-size: 13.5px; line-height: 1.55;">
        <strong>2. Pre-season baseline testing — free</strong> — athletes self-administer their SCAT6 baseline remotely. No appointment, no setup on your end. Massive head-start if a concussion happens mid-season: <a href="{preseason_url}">{base_url_short}/preseason</a>
      </p>
      <p style="margin: 14px 0 0;">Both are genuinely free, no upsell trap. If they're useful and you want the bigger picture for ${clinic.shortName}, a full on-site cohort day is the next step:</p>`
  } else {
    followupIntro = `<p>Quick follow-up — wanted to share two free tools ${clinic.shortName} can use this week, no strings:</p>
      <p style="margin: 10px 0; padding: 10px 12px; background: #f0fdfa; border-radius: 6px; font-size: 13.5px; line-height: 1.55;">
        <strong>1. Free SCAT mastery mini-course</strong> — 1-hr CPD-eligible refresher (SCAT6, SCOAT6, oculomotor, BESS). Anyone on your team can take it free: <a href="{scat_pack_url}">{base_url_short}/scat-mastery</a>
      </p>
      <p style="margin: 10px 0; padding: 10px 12px; background: #f0fdfa; border-radius: 6px; font-size: 13.5px; line-height: 1.55;">
        <strong>2. Pre-season baseline testing — free</strong> — your athletes self-administer their SCAT6 baseline remotely. No appointment, no setup on your end. Massive head-start when a concussion happens: <a href="{preseason_url}">{base_url_short}/preseason</a>
      </p>
      <p style="margin: 14px 0 0;">Both genuinely free. If they fit how ${clinic.shortName} runs, the Hub Pack is the rest of the picture (protocols, GP letters, RTP tracking):</p>`
  }

  let followupPriceBlock = ''
  if (discloseFollowupPrice) {
    if (isOnSiteTarget) {
      const recoCohortFp = cohortPricing.cohortTiers.find((t) => {
        const reco = clinic.cohortRecommendation
        const name = reco === 'essential' ? 'Essential' : reco === 'full-team' ? 'Full team' : 'Recommended'
        return t.name === name
      })!
      const cohortPriceFormatted = `A$${recoCohortFp.total.toLocaleString('en-AU')}`
      followupPriceBlock = `<p style="margin: 0 0 12px; font-size: 14px; color: #1a2332; line-height: 1.55;">
        <strong>${cohortPriceFormatted}</strong> for ${recoCohortFp.clinicians} clinicians, full-day on-site at ${clinic.shortName}. Includes lifetime online access for everyone in the cohort.
      </p>`
    } else {
      followupPriceBlock = `<p style="margin: 0 0 12px; font-size: 14px; color: #1a2332; line-height: 1.55;">
        <strong>$1,497 Hub Pack</strong> — your team online + clinic-branded clinical pack + launch playbook. Workshop upgrades $497/clinician if you want hands-on credentials too.
      </p>`
    }
  } else {
    followupPriceBlock = `<p style="margin: 0 0 12px; font-size: 14px; color: #475569; line-height: 1.55;">
      Pricing + cohort breakdown lives on the ${clinic.shortName} dashboard.
    </p>`
  }

  // Hub phrase — substitutes into "become the concussion hub {hub_phrase}".
  //   Known location:   "for Sunshine Coast"  → "become the concussion hub for Sunshine Coast"
  //   Unknown location: "for your caseload"   → "become the concussion hub for your caseload"
  // The unknown variant reads as intentional positioning, not as a fallback.
  const hubPhrase = locationUnknown ? `for your caseload` : `for ${safeCity}`

  openingBlock = openingBlock
    .replace(/\{hub_phrase\}/g, hubPhrase)
    .replace(/\{clinic_short_name\}/g, clinic.shortName)
    .replace(/\{region_phrase\}/g, regionPhrase)
    .replace(/\{region\}/g, safeRegion)
    .replace(/\{city\}/g, safeCity)
    .replace(/\{nearest_metro\}/g, nearestMetro)

  // ─── UTM tagging ─────────────────────────────────────────────────────
  // Every outbound link in the email gets utm_source/medium/campaign/content
  // so we can attribute portal-views, Cal bookings, and downstream conversions
  // back to specific prospect cohorts. utm_term distinguishes which link
  // inside the email the recipient clicked (hero image vs CTA vs book link).
  const utmBase = new URLSearchParams({
    utm_source: 'outreach',
    utm_medium: 'email',
    utm_campaign: `concussion_hub_${clinic.priorityWave?.toLowerCase() ?? 'wave'}`,
    utm_content: clinic.slug,
  })
  const utmFor = (term: string) => {
    const p = new URLSearchParams(utmBase)
    p.set('utm_term', term)
    return p.toString()
  }
  const portalUrl = `${baseUrl}/p/${clinic.slug}?k=${clinic.accessKey}&${utmFor('cta')}`
  const portalImageUrl = `${baseUrl}/p/${clinic.slug}?k=${clinic.accessKey}&${utmFor('hero')}`
  // Pivoted 2026-06-08: cal.com link had 4 clicks → 0 bookings over 60 days.
  // Off-site calendar friction was killing conversion. Route the CTA through
  // the in-portal /talk form instead — pre-fills the prospect's name/email/
  // clinic from URL params, captures intent in 30 seconds, emails Zac
  // directly. Cal embed lives below the form as a self-serve fallback for
  // people who'd rather pick a slot themselves. Name="calBookingUrl" kept
  // for diff hygiene — the URL behind it is now /talk.
  const talkParams = new URLSearchParams({
    slug: clinic.slug,
    name: clinic.contactFirstName,
    email: clinic.contactEmail,
    clinic: clinic.shortName ?? clinic.name,
  })
  const calBookingUrl = `${baseUrl}/talk?${talkParams.toString()}&${utmFor('book')}`
  const calWalkthroughUrl = `${baseUrl}/talk?${talkParams.toString()}&${utmFor('walkthrough')}`
  // SCAT pack lead magnet — UTM-tagged so we can attribute downstream
  // free-signups + paid conversions back to the cold-outreach SCAT path.
  const scatPackUrl = `${baseUrl}/scat-mastery?${utmFor('scat_pack')}&prospect=${clinic.slug}`
  // Pre-season baseline testing tool — free self-administered SCAT6 baselines
  // for athletes. T2 lead magnet (2026-06-08): "test your athletes free".
  const preseasonUrl = `${baseUrl}/preseason?${utmFor('preseason')}&prospect=${clinic.slug}`
  // Short version of base URL for display in body copy (no protocol)
  const baseUrlShort = baseUrl.replace(/^https?:\/\//, '')
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

  // ─── Engagement-tier-aware CTA for T2 (followup) ────────────────────────
  // Cold (priorEngagement = 'none'): standard sales CTA + SCAT lead magnet
  // Warm / Hot (opened or clicked T1): walkthrough CTA + reply alt
  //
  // Walkthrough framing converts better for research-mode prospects than
  // "book a sales call" — they've already shown interest by opening or
  // clicking, but most cold-click bailers cite "do I really want a sales
  // call?" as the friction. Walkthrough reframes the same 30 mins as
  // value-led ("show me around the {clinic} preview") rather than pitch.
  //
  // Also surfaces a low-friction reply alternative for the ~50% who'd
  // rather email one question than book any kind of slot.
  let followupCtaBlock: string
  if (engagement === 'none') {
    followupCtaBlock = `
      <p style="margin: 0 0 14px; font-size: 14.5px; line-height: 1.55; color: #1a2332;">
        If the bigger picture is interesting, a 15-min discovery call is the fastest way to see if it fits ${clinic.shortName}.
      </p>
      <a href="${htmlEncodeUrl(calBookingUrl)}" class="cta">Book a 15-min discovery call →</a>
      <span class="secondary">Or reply with a question — I'll answer in writing within a day.</span>`
  } else {
    // Warm/Hot variant — they've already engaged with T1 + the two free
    // tools in T2. Discovery call is the natural next step.
    followupCtaBlock = `
      <a href="${htmlEncodeUrl(calBookingUrl)}" class="cta">Book a 15-min discovery call →</a>
      <span class="secondary">Or reply with one question — I'll answer in writing within a day.</span>`
  }

  // Hub Pack scope (per Zac 2026-06-08): up to 5 clinicians + admin. The
  // followup bullet shows seat count CAPPED at 5 — for clinics with raw
  // clinical count > 5 we say "5 + admin" and note extra seats are $497 ea.
  // Misstating the included seats is a misrepresentation, so always min(raw, 5).
  const rawClinicalCount = clinicalCount(clinic.team) || 4
  const hubSeatCount = Math.min(rawClinicalCount, 5)

  // ── T2 BULLETS · offer-type-aware ──
  // For on-site cohort targets: use REAL clinician count + lead with the
  //   CPD math (N × 14 = total CPD delivered in one day).
  // For Hub Pack targets: cap at 5 + admin scope, lead with CPD math too
  //   but emphasise self-paced + admin pack.
  // Product = CPD hours. All bullets land on that.
  let followupBullets: string
  if (isOnSiteTarget) {
    const recoCohort = cohortPricing.cohortTiers.find((t) => {
      const reco = clinic.cohortRecommendation
      const name = reco === 'essential' ? 'Essential' : reco === 'full-team' ? 'Full team' : 'Recommended'
      return t.name === name
    })!
    followupBullets = `<ul class="points" style="margin: 14px 0 14px;">
      <li><strong>14 CPD hours per clinician — OA endorsed, AHPRA-aligned</strong></li>
      <li><strong>${recoCohort.clinicians} clinicians trained together in one day at ${clinic.shortName}</strong> — hands-on practice with VOMS, oculomotor, BESS, cervical, SCAT6/SCOAT6. No staggered training over months.</li>
      <li><strong>Clinic-branded admin pack included</strong> — pre-built GP referrals, NDIS framework, school sport intake, RTP clearance docs — every form auto-fills with ${clinic.shortName}'s details.</li>
    </ul>`
  } else {
    followupBullets = `<ul class="points" style="margin: 14px 0 14px;">
      <li><strong>14 CPD hours per clinician — OA endorsed, AHPRA-aligned</strong></li>
      <li><strong>${hubSeatCount} clinicians${rawClinicalCount > 5 ? ' (Hub Pack ceiling, extra seats $497 ea)' : ''} + admin</strong> — completed online at each clinician's own pace. No time off the clinical schedule.</li>
      <li><strong>Clinic-branded admin pack included</strong> — pre-built GP referrals, NDIS framework, school sport intake, RTP clearance docs — every form auto-fills with ${clinic.shortName}'s details. $497/clinician workshop upgrade when you want hands-on credentials.</li>
    </ul>`
  }
  const variables: Record<string, string | undefined> = {
    base_url: baseUrl,
    clinic_name: clinic.name,
    clinic_short_name: clinic.shortName,
    clinical_team_count: String(rawClinicalCount),
    hub_seat_count: String(hubSeatCount),
    clinical_team_word: hubSeatCount === 1 ? 'clinician' : 'clinicians',
    region: clinic.region,
    region_phrase: regionPhrase,
    city: clinic.city,
    contact_first_name: safeFirstName(clinic.contactFirstName),
    stats_block: statsBlock,
    offer_block: offerBlock,
    followup_subject: followupSubject,
    followup_intro: followupIntro,
    followup_price_block: followupPriceBlock,
    contact_full_name: clinic.contactFullName,
    team_breakdown: teamBreakdownString(clinic.team),
    team_total: String(teamTotal(clinic.team)),
    opening_block: openingBlock,
    portal_url: htmlEncodeUrl(portalUrl),
    portal_image_url: htmlEncodeUrl(portalImageUrl),
    cal_booking_url: htmlEncodeUrl(calBookingUrl),
    cal_walkthrough_url: htmlEncodeUrl(calWalkthroughUrl),
    followup_cta_block: followupCtaBlock,
    followup_bullets: followupBullets,
    scat_pack_url: htmlEncodeUrl(scatPackUrl),
    preseason_url: htmlEncodeUrl(preseasonUrl),
    base_url_short: baseUrlShort,
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
/**
 * If contact_first_name looks like a job title (Director, Principal, Manager,
 * Owner etc) — which happens when Apollo stuffs a role into the wrong field —
 * fall back to a neutral greeting. Anything resembling "Hi Director,"
 * "Hi Manager," "Hi Unknown," "Hi Owner," etc must NEVER ship.
 */
const TITLE_FIRST_NAME_PATTERN = /^(director|manager|principal|owner|founder|partner|ceo|md|head|chief|admin|reception|practice|clinic|info|unknown|n\/a|na|none|test)$/i

function safeFirstName(raw: string | null | undefined): string {
  const v = (raw ?? '').trim()
  if (!v) return 'there'
  // Multi-word "Job Title" capture (e.g. "Practice Manager")
  if (/^(?:director|manager|principal|owner|founder|partner|head|chief|practice|clinic|admin|reception)(?:\s+\w+)*$/i.test(v)) return 'there'
  if (TITLE_FIRST_NAME_PATTERN.test(v)) return 'there'
  // Names with bracketed roles (e.g. "John (Director)") — strip the role
  const cleaned = v.replace(/\s*\([^)]*\)\s*/g, '').trim()
  if (!cleaned) return 'there'
  if (TITLE_FIRST_NAME_PATTERN.test(cleaned)) return 'there'
  return cleaned
}

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
