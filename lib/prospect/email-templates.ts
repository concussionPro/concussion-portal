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

      <a href="{portal_image_url}"><img src="{og_image_url}" alt="{clinic_short_name} preview dashboard" class="preview-img" width="548" height="288" /></a>

      {stats_block}

      {offer_block}

      <a href="{portal_url}" class="cta">See the {clinic_short_name} preview →</a>
      <span class="secondary">15 min fit-check · <a href="{cal_booking_url}">book 30 min on cal.com</a> · or <a href="{scat_pack_url}">grab the free SCAT6/SCOAT6 pack now</a></span>

      <p style="margin: 20px 0 8px; font-size: 12px; color: #0a5a5e; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 700;">Multidisciplinary integration</p>
      <table class="role-bento" role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td class="role"><span class="role-name">Osteo / Physio / Chiro</span><span class="role-covers">Diagnosis · case management · cervicogenic</span></td>
        <td class="role"><span class="role-name">Physio / EP</span><span class="role-covers">Return to play · sub-threshold aerobic</span></td>
        <td class="role"><span class="role-name">Myo / RMT</span><span class="role-covers">Soft tissue · inflammation</span></td>
        <td class="role"><span class="role-name">Admin</span><span class="role-covers">GP letters · NDIS · schools</span></td>
      </tr></table>

      <div class="sig">
        <strong>Zac Lewis, Osteopath</strong> · AHPRA-registered · Founder, CEA
        <br><span style="font-size: 11px; color: #94a3b8;">Speaker · Osteopathy Australia conference circuit</span>
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

      <ul class="points" style="margin: 14px 0 14px;">
        <li><strong>5 clinicians online</strong> — your team trained in their own time (additional seats $497 ea)</li>
        <li><strong>Branded clinical docs</strong> — GP letters, NDIS framework, school sport intake, RTP tracking, capability one-pager, all with {clinic_short_name}'s logo</li>
        <li><strong>Admin pack</strong> — billing codes, intake workflow, discharge documentation</li>
        <li><strong>$497/clinician workshop upgrade</strong> when you want hands-on credentials</li>
      </ul>

      {followup_price_block}
      <p style="margin: 0 0 14px; font-size: 14.5px; line-height: 1.55; color: #1a2332;">
        Most clinics that engage take the call first — 15 minutes, no slides, just whether the program fits your team's caseload.
      </p>

      <a href="{cal_booking_url}" class="cta">Book 15 min on cal.com →</a>
      <span class="secondary">Or grab the free SCAT6/SCOAT6 pack to use right now: <a href="{scat_pack_url}">{base_url_short}/scat-mastery</a></span>

      <div class="sig"><strong>Zac Lewis, Osteopath</strong> · Founder, CEA · <span style="color: #94a3b8;">Speaker · OA conference circuit</span></div>
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
      <p>Last note from me on the Concussion Hub Pack. If the timing isn't right, all good — most clinics that engage circle back when their next concussion case shows up. The {clinic_short_name} preview stays open:</p>

      <a href="{portal_url}" class="cta">Open {clinic_short_name} preview →</a>
      <span class="secondary">Free SCAT6/SCOAT6 pack also still available: <a href="{scat_pack_url}">{base_url_short}/scat-mastery</a></span>

      {followup_price_block}
      <p style="margin-top: 18px; font-size: 14px; color: #475569; line-height: 1.55;">
        Whenever you're ready: book 15 min <a href="{cal_booking_url}" style="color: #0a5a5e;">on cal.com</a>.
      </p>

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
    const headerLine = isEnterprise
      ? `<strong>On-site training for the full team at ${clinic.shortName}.</strong> Full-day program, your entire clinical team trained together, same protocol across every site of your network.`
      : `<strong>On-site cohort training at ${clinic.shortName}.</strong> Full-day program: ${recoCohort.clinicians} of your clinicians trained together, same protocol across the team, immediate application to your concussion caseload.`
    // Email is the hook, not the brochure. Details on the call.
    const invitingNote = isInvitingBucket
      ? ` Invite 1-3 referrers to fill the cohort if needed.`
      : ''
    offerBlock = `<p style="margin: 18px 0 16px; font-size: 14.5px; line-height: 1.55; color: #1a2332;">
        ${headerLine}${invitingNote}
      </p>`
  } else {
    // Small / medium clinic — Hub Pack pitch
    statsBlock = `<table class="bento" role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td class="stat teal">
          <span class="headline"><span class="num">5</span><span class="unit"> clinicians</span></span>
          <span class="sub">Whole team online · in own time</span>
        </td>
        <td class="stat amber">
          <span class="headline"><span class="num">14</span><span class="unit"> CPD</span></span>
          <span class="sub">OA endorsed · per clinician</span>
        </td>
        <td class="stat indigo">
          <span class="headline"><span class="num">Day 1</span></span>
          <span class="sub">Branded clinical docs ready</span>
        </td>
      </tr></table>`
    // T1 doesn't disclose price for small clinics either. Pricing is on
    // the dashboard — gates on engagement.
    offerBlock = `<p style="margin: 18px 0 16px; font-size: 14.5px; line-height: 1.55; color: #1a2332;">
        <strong>Concussion Hub Pack for ${clinic.shortName}.</strong> Your team online + clinic-branded clinical pack + launch playbook. Optional in-person workshop seats. Pricing + breakdown on the ${clinic.shortName} dashboard.
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
  const safeCity = hasUnknownCity ? 'your area' : clinic.city
  const safeRegion = hasUnknownRegion ? 'your region' : clinic.region

  // Region phrasing — single source of truth for "for {region_phrase}" copy.
  // Some regions need the definite article to sound natural ("the Gold Coast"),
  // others don't ("Brisbane"). Anything unmapped falls back to the city
  // (which itself falls back to 'your area' if also unknown).
  const regionPhrase = hasUnknownRegion
    ? safeCity
    : (naturalRegionPhrase(clinic.region) ?? safeCity)

  // ─── Engagement-aware followup variant (T2/T3) ──────────────────────────
  // T2 subject + intro reference what the prospect did (or didn't do) with
  // T1. T2 gates the price-reveal: if they engaged (opened/clicked T1, i.e.
  // they've seen the dashboard), include price in body. If no engagement,
  // keep pushing to dashboard. T3 always discloses — last touch, no upside
  // to withholding. Bot/scanner clicks are filtered upstream so SafeLinks
  // pre-fetches don't trigger "saw you take a look" variants.
  const engagement = options.priorEngagement ?? 'none'
  const discloseFollowupPrice = template.slug === 'final' || engagement !== 'none'
  let followupSubject: string
  let followupIntro: string
  if (engagement === 'clicked') {
    followupSubject = `Saw ${clinic.shortName} took a look — quick follow-up`
    followupIntro = `<p>Following up — saw ${clinic.shortName} opened the preview after my last note. Anything stand out? Happy to walk through what fits your team on a 15-min call, or hand over the free SCAT pack if it's more useful right now.</p>`
  } else if (engagement === 'opened') {
    followupSubject = `Re: Concussion hub — quick check`
    followupIntro = `<p>Following up — wanted to check the last note got through. Quick recap on what's in this for ${clinic.shortName}:</p>`
  } else {
    followupSubject = `Re: Concussion hub for ${safeCity}`
    followupIntro = `<p>Following up — quick recap on the Concussion Hub Pack for ${clinic.shortName}:</p>`
  }
  if (isOnSiteTarget) {
    if (engagement === 'clicked') {
      followupIntro = `<p>Following up — saw ${clinic.shortName} opened the preview after my last note. Anything stand out? Happy to walk through what an on-site cohort day at ${clinic.shortName} would actually look like, or hand over the free SCAT pack if it's more useful right now.</p>`
    } else if (engagement === 'opened') {
      followupIntro = `<p>Following up — wanted to check the last note got through. Quick recap on what an on-site cohort day at ${clinic.shortName} would cover:</p>`
    } else {
      followupIntro = `<p>Following up — quick recap on the on-site cohort training for ${clinic.shortName}:</p>`
    }
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

  openingBlock = openingBlock
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
  const calBookingUrl = `https://cal.com/zac-lewis-so8zjs/30min?${utmFor('book')}`
  // SCAT pack lead magnet — UTM-tagged so we can attribute downstream
  // free-signups + paid conversions back to the cold-outreach SCAT path.
  const scatPackUrl = `${baseUrl}/scat-mastery?${utmFor('scat_pack')}&prospect=${clinic.slug}`
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

  const variables: Record<string, string | undefined> = {
    base_url: baseUrl,
    clinic_name: clinic.name,
    clinic_short_name: clinic.shortName,
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
    scat_pack_url: htmlEncodeUrl(scatPackUrl),
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
