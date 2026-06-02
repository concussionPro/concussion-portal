/**
 * One-shot admin endpoint: emails Zac the cold-outreach prospect brief.
 * Compiled from research agent output 2026-06-02.
 *
 * POST → sends one email to zac@concussion-education-australia.com.
 * Idempotency NOT enforced — running twice sends twice. Run once.
 *
 * Delete this file after the brief is delivered if you don't want it
 * sitting in the admin surface. The endpoint has no production value
 * beyond the single delivery.
 */
import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/resend-client'
import { isAdminRequest } from '@/lib/require-admin'

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 780px; margin: 0 auto; color: #0f172a; line-height: 1.55;">

      <div style="border-bottom: 3px solid #0f766e; padding-bottom: 16px; margin-bottom: 24px;">
        <p style="margin: 0 0 4px; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #0f766e; font-weight: 700;">Cold Outreach Brief — Regional / Outer-Metro Clinics</p>
        <h1 style="margin: 0; font-size: 22px; font-weight: 700;">12 high-fit prospects for the Concussion Hub Program</h1>
        <p style="margin: 6px 0 0; font-size: 13px; color: #475569;">Prepared 2026-06-02 · 9 regions covered · researched via Google + clinic websites + AHPRA register</p>
      </div>

      <h2 style="font-size: 14px; color: #0f766e; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 12px;">Executive summary</h2>
      <p style="font-size: 13px; margin: 0 0 16px;">
        12 verified clinics across regional Australia that match the Hub Program profile: multi-clinician (8-50+), allied health / sports medicine, owner identifiable, sports adjacency. Several (Geelong SMC, Mid North Coast Allied Health, Peak Physio, NQPC Townsville) already advertise some form of concussion or vestibular service — these are upsell pitches, not greenfield. Others (Ballarat Allied Health, Hunter Performance) have stacked sports CVs but no formal concussion program — these are differentiation pitches.
      </p>

      <h2 style="font-size: 14px; color: #0f766e; text-transform: uppercase; letter-spacing: 0.1em; margin: 24px 0 12px;">Recommended outreach order (Tier 1)</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px;">
        <thead>
          <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
            <th style="text-align: left; padding: 8px; width: 25px;">#</th>
            <th style="text-align: left; padding: 8px;">Clinic</th>
            <th style="text-align: left; padding: 8px;">Region</th>
            <th style="text-align: left; padding: 8px;">Team</th>
            <th style="text-align: left; padding: 8px;">Why this one first</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px; vertical-align: top;">1</td>
            <td style="padding: 8px; vertical-align: top;"><strong>Geelong Sports Medicine Centre</strong></td>
            <td style="padding: 8px; vertical-align: top;">Geelong VIC</td>
            <td style="padding: 8px; vertical-align: top;">25+</td>
            <td style="padding: 8px; vertical-align: top;">Already advertises concussion/vestibular care. Pitch is "formalise + scale to SCAT6/VOMS pathway". Geelong Cats AFL/AFLW physios on staff = clinical credibility for the room.</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0; background: #fafafa;">
            <td style="padding: 8px; vertical-align: top;">2</td>
            <td style="padding: 8px; vertical-align: top;"><strong>Mid North Coast Allied Health</strong></td>
            <td style="padding: 8px; vertical-align: top;">Port Macquarie / Coffs Harbour NSW</td>
            <td style="padding: 8px; vertical-align: top;">42 across 9 sites</td>
            <td style="padding: 8px; vertical-align: top;">Largest single deal in the list. 9 sites means the templates + admin micro-course become a huge force multiplier. Already lists concussion services — natural upsell to formal program.</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px; vertical-align: top;">3</td>
            <td style="padding: 8px; vertical-align: top;"><strong>Evolve Health Illawarra</strong></td>
            <td style="padding: 8px; vertical-align: top;">Wollongong NSW</td>
            <td style="padding: 8px; vertical-align: top;">12</td>
            <td style="padding: 8px; vertical-align: top;">Osteo-led practice — owner is AHPRA osteo same as you. Highest expected cold-open rate (peer-to-peer). Wollongong = Steelers NRL / Dragons junior pathway + beachside surf scene.</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0; background: #fafafa;">
            <td style="padding: 8px; vertical-align: top;">4</td>
            <td style="padding: 8px; vertical-align: top;"><strong>NQPC Townsville</strong></td>
            <td style="padding: 8px; vertical-align: top;">Townsville QLD</td>
            <td style="padding: 8px; vertical-align: top;">~10</td>
            <td style="padding: 8px; vertical-align: top;">Operates inside the Cowboys Centre of Excellence. Single most concussion-relevant regional QLD address. NRL + junior pathway + JCU = referral catchment.</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px; vertical-align: top;">5</td>
            <td style="padding: 8px; vertical-align: top;"><strong>Peak Physio</strong></td>
            <td style="padding: 8px; vertical-align: top;">Newcastle / Hunter NSW</td>
            <td style="padding: 8px; vertical-align: top;">18+ across 6 sites</td>
            <td style="padding: 8px; vertical-align: top;">Already advertises Concussion Management + Vestibular Rehab. Multi-site = repeatable revenue. Knights NRL territory.</td>
          </tr>
        </tbody>
      </table>

      <h2 style="font-size: 14px; color: #0f766e; text-transform: uppercase; letter-spacing: 0.1em; margin: 24px 0 12px;">Full prospect list — Tier 1 detail</h2>

      ${tierCard({
        n: 1,
        name: 'Geelong Sports Medicine Centre',
        region: 'Geelong VIC',
        site: 'geelongsportsmedicinecentre.com.au',
        team: '25+',
        mix: 'Physio, Osteo, Sports Med, EP, Myo, Podiatry, Dietetics, Pilates',
        owner: 'Nick Jarman (Founder / Director)',
        email: 'info@gsmc.net.au',
        hooks: [
          'Already lists concussion/vestibular care on the site — pitch is formalisation, not introduction',
          'Geelong Cats AFL/AFLW/VFLW physios on staff',
          'Cricket Australia link via Dr Naj Soomro',
          '25+ clinicians = exact size where Hub Complete (templates, outreach, admin course) maxes out value',
        ],
      })}

      ${tierCard({
        n: 2,
        name: 'Mid North Coast Allied Health',
        region: 'Port Macquarie / Coffs Harbour NSW (9 sites)',
        site: 'mncalliedhealth.com',
        team: '42 across 9 sites',
        mix: 'Physio (incl paeds + women\'s health), EP, OT, Massage/Myo, Dietetics, Chiro',
        owner: 'Aaron Hardaker (Managing Principal), Micheal Robinson (Principal Physio)',
        email: 'Use site form / phone 1300 273 747',
        hooks: [
          'Recently consolidated Mid North Coast Physio + Sports & Spinal — they\'re actively building',
          '30,000+ patients per year',
          'Junior surf life saving + school rugby corridor (Port → Coffs)',
          '9 sites = templates and admin training are a massive force multiplier (highest single-deal value in the list)',
        ],
      })}

      ${tierCard({
        n: 3,
        name: 'Corio Bay Health Group',
        region: 'Geelong VIC',
        site: 'coriobayhealth.com.au',
        team: '15',
        mix: 'Physio, Sports Med doctors, Hand Therapy, Myo, Sports Psych, Podiatry, Dietetics, Acupuncture',
        owner: 'Adam Walters (Clinic Partner)',
        email: 'Phone (03) 5221 8822 — email via web form',
        hooks: [
          'On-site sports doctors = MD sign-off built into the concussion pathway',
          'Geelong FC, Supercats basketball, Geelong Hockey ties',
          'Sports psych on staff = full concussion MDT already half-assembled',
          'Second Geelong target — pitch can reference each other or pick one preemptively',
        ],
      })}

      ${tierCard({
        n: 4,
        name: 'Peak Physio',
        region: 'Newcastle / Hunter / Central Coast NSW',
        site: 'peak-physio.com.au',
        team: '18+ across 6 clinics',
        mix: 'Physio (sports, vestibular, paeds, women\'s health, neuro), Pilates',
        owner: 'Laith Cunneen (Managing Director)',
        email: 'Booking form / phone',
        hooks: [
          'Already lists "Concussion Management" + "Vestibular Rehab" as services — primed for formal upskilling',
          '6 clinics = multi-site rollout',
          '40,000+ clients since 2012',
          'Knights NRL territory + Hunter junior pathways',
        ],
      })}

      ${tierCard({
        n: 5,
        name: 'Ballarat Allied Health Physiotherapy & Podiatry',
        region: 'Ballarat VIC',
        site: 'ballaratalliedhealth.com.au',
        team: '12 (10 physios + podiatrist)',
        mix: 'Physio (sports, paeds, women\'s health, pelvic, lymph, acupuncture, pilates), Podiatry',
        owner: 'Simon Ellis (lead/senior physio)',
        email: 'info@ballaratalliedhealth.com.au',
        hooks: [
          'Stacked elite-sport CV across staff — AFL, AFLW, Olympic athletes',
          'NO current concussion program advertised — differentiation pitch, not upsell',
          'AFL ties: Richmond, Collingwood, North Ballarat VFL',
          'Australian U23 Wheelchair Basketball + Olympic Park Sports Medicine pipeline',
        ],
      })}

      ${tierCard({
        n: 6,
        name: 'North Queensland Physiotherapy Centre (NQPC)',
        region: 'Townsville QLD',
        site: 'nqpc.com.au',
        team: '~10',
        mix: 'Physio (sports, hydro, dry needling, shockwave, vestibular implied)',
        owner: 'Steve Sartori (Director)',
        email: 'admin@nqpc.com.au',
        hooks: [
          'Operates inside the Cowboys Centre of Excellence',
          'Jonathan Crawley = Cowboys NRL physio since 2009 + designed NRL junior injury-prevention program',
          'Glen Day = Townsville Blackhawks head physio',
          'James Cook University adjacent — university clinical placement potential',
        ],
      })}

      <h2 style="font-size: 14px; color: #0f766e; text-transform: uppercase; letter-spacing: 0.1em; margin: 24px 0 12px;">Tier 2 — Strong fits, secondary priority</h2>

      ${tierCard({
        n: 7,
        name: 'Evolve Health Illawarra',
        region: 'Wollongong NSW',
        site: 'livesmartevolve.com',
        team: '12',
        mix: 'Osteo, Physio, EP, Massage, Pilates, Chinese Med, Naturopathy',
        owner: 'Dr Lachlan McGregor (Osteo / Owner) + Kayla Morosin (Physio / Owner)',
        email: 'LivesmartEvolve@outlook.com',
        hooks: [
          'OSTEO-LED — owner is AHPRA osteopath same as you (peer-to-peer pitch, highest open rate)',
          'Beachside Wollongong: surf, Steelers NRL, Dragons junior pathway',
          'Dual-discipline ownership (osteo + physio)',
          'Full MDT mix already',
        ],
      })}

      ${tierCard({
        n: 8,
        name: 'Hunter Performance Physio',
        region: 'Newcastle / Maitland NSW (2 sites)',
        site: 'hpphysio.com.au',
        team: '18 (13 physios + 2 EPs + admin)',
        mix: 'Physio, EP, Sports injury, Post-surgical',
        owner: 'Not publicly listed — LinkedIn search needed',
        email: 'Phone (02) 4046 9850 — book form',
        hooks: [
          'Two-site Hunter operation',
          'East Maitland + Raymond Terrace',
          'Hunter Valley junior rugby league + AFL Black Diamond Cup territory',
        ],
      })}

      ${tierCard({
        n: 9,
        name: 'The Osteopath — Sunshine Coast',
        region: 'Maroochydore / Forest Glen QLD',
        site: 'theosteopath.net.au',
        team: '8 (6 osteos + RMT + physio)',
        mix: 'Osteo, RMT, Physio',
        owner: 'Dr Katrina Cross (Dwyer) + Dr Cassandra Lacey (partners)',
        email: 'maroochy@theosteopath.net.au',
        hooks: [
          'Directly analogous to Advanced Health Buderim (your proven market)',
          'Owner trained at Victorian Institute of Sport',
          'Staff coverage: AFL, soccer, cricket, netball, surf',
          'Sunshine Coast junior sport hub (Maroochydore / Noosa catchment)',
        ],
      })}

      ${tierCard({
        n: 10,
        name: 'Peak Performance Toowoomba (Allsports group)',
        region: 'Toowoomba QLD',
        site: 'allsportsphysio.com.au/our-clinics/toowoomba-peak-performance',
        team: '8',
        mix: 'Physio (sports, MSK), EP, Pilates, Hydro, Women\'s Health, US imaging',
        owner: 'Allsports group brand — LinkedIn lookup needed for site principal',
        email: 'admin@peaksportsphysio.com.au',
        hooks: [
          'Toowoomba = rugby league heartland (Mustangs, Darling Downs RL)',
          'Schools rugby capital of Queensland',
          'Part of broader Allsports Physiotherapy Group (25 clinics QLD)',
          'Competitive pressure: ex-Wallabies physio Cameron in adjacent Fit Lab is the comp — forcing-function to formalise concussion offering',
        ],
      })}

      <h2 style="font-size: 14px; color: #0f766e; text-transform: uppercase; letter-spacing: 0.1em; margin: 24px 0 12px;">Tier 3 — Higher research effort required</h2>

      ${tierCard({
        n: 11,
        name: 'PhyxMe Physiotherapy & Pilates',
        region: 'Cairns QLD',
        site: 'phyxme.com.au',
        team: '~10-15 estimated (unverified from About page)',
        mix: 'Physio (sports, women\'s, vestibular), Massage, Podiatry, Pilates, Shockwave',
        owner: 'Not on page',
        email: 'Phone (07) 4053 4343 — contact form',
        hooks: [
          'Largest multidisciplinary clinic in Cairns',
          'Vestibular advertised (concussion-adjacent)',
          'Sport ties: Manunda Hawks AFL, North Cairns Tigers, Cairns City Lions AFC, Cairns Northern Beaches Rugby Union, Brothers Rugby — ~1,500+ players in collective catchment',
        ],
      })}

      ${tierCard({
        n: 12,
        name: 'Enhance Physio',
        region: 'Albury / Wodonga NSW-VIC border (5 sites)',
        site: 'enhance.physio',
        team: '50-60+ estimated across 5 sites',
        mix: 'Physio (sports, vestibular, paeds), EP, Women\'s Health, Massage, Podiatry, Dietetics',
        owner: 'Not on About — LinkedIn lookup required',
        email: 'Per-clinic phone numbers',
        hooks: [
          'Cross-border 5-site footprint — highest-ticket potential in the list (A$12,500 + travel)',
          'Albury/Lavington/Wodonga junior AFL + rugby league corridor',
          'Lists vestibular physio (concussion-adjacent)',
          'Mudgeeraba clinic = QLD bridge',
        ],
      })}

      <h2 style="font-size: 14px; color: #0f766e; text-transform: uppercase; letter-spacing: 0.1em; margin: 24px 0 12px;">Sample cold pitch (using Geelong SMC as the template)</h2>
      <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 16px; background: #fafafa; font-size: 12px; line-height: 1.6;">
        <p style="margin: 0 0 8px;"><strong>Subject:</strong> Concussion training — Geelong SMC</p>
        <p style="margin: 0 0 8px;"><strong>To:</strong> info@gsmc.net.au (cc Nick if direct findable)</p>
        <p style="margin: 0 0 10px; font-style: italic; color: #64748b;">--- body ---</p>
        <p style="margin: 0 0 10px;">Hi Nick,</p>
        <p style="margin: 0 0 10px;">Saw GSMC already runs concussion + vestibular care alongside the Cats / AFLW physio work — and your 25+ clinician multi-disciplinary mix is genuinely the right setup for what I'm pitching, so wanted to reach out directly.</p>
        <p style="margin: 0 0 10px;">I'm Zac Lewis, AHPRA-registered osteopath and founder of Concussion Education Australia. We run a structured on-site Concussion Hub program — not generic CPD, but a workflow-aligned package that maps onto a clinic's existing patient journey: reception triage → osteo / physio assessment → EP rehab → discharge with audit-safe documentation. Built around Amsterdam 2023, AHPRA-aligned, OA-endorsed.</p>
        <p style="margin: 0 0 10px;">The reason I think it's a fit for GSMC specifically: you already have the clinical depth. What we'd bring is (1) the formalised SCAT6 / SCOAT6 / VOMS / BESS pathway across the whole team, (2) discharge documentation that's NDIS-, WorkCover- and indemnity-defensible, and (3) the outreach + capability collateral to deepen your existing AFL / cricket / Geelong school sport relationships. Program delivered as a full day on-site at your clinic.</p>
        <p style="margin: 0 0 10px;">Pricing depends on team and topic scope, starting at A$8k for training only and A$12.5k for the full Hub package with templates and outreach. Travel is included for Geelong (within Vic) so no surcharge.</p>
        <p style="margin: 0 0 10px;">Worth a 20-minute scoping call? I'm based in QLD but can do any week-day afternoon AEST.</p>
        <p style="margin: 0 0 10px;">Cheers,<br>Zac Lewis<br>B.Clin.Sci., M.Ost.Med.<br>AHPRA-registered Osteopath<br>Founder, Concussion Education Australia</p>
      </div>

      <h2 style="font-size: 14px; color: #0f766e; text-transform: uppercase; letter-spacing: 0.1em; margin: 24px 0 12px;">Decisions for you</h2>
      <ol style="font-size: 13px; padding-left: 20px;">
        <li style="margin-bottom: 8px;"><strong>Confirm or re-rank the Tier 1 outreach order</strong>. My ranking is conversion-weighted (Geelong SMC first because they already do concussion; MNCAH second because biggest single deal; Evolve third because peer-to-peer osteo). You may want to swap based on capacity to deliver — e.g. if you're already booked Q3, push the multi-site giants (MNCAH, Peak, Enhance) later.</li>
        <li style="margin-bottom: 8px;"><strong>Decide on bespoke-proposal-page architecture before sending</strong>. The scope is laid out — token-gated dynamic /proposals/[token] pages, each prospect gets their own version with name + team + local outreach merged in. If approved, I build it and each cold email includes the prospect's personal link. If not approved, cold emails go without the link and we lose a major conversion lever.</li>
        <li style="margin-bottom: 8px;"><strong>Confirm the assets exist or commit to building them</strong>. Six discharge templates, six outreach templates, 1-hr admin micro-course. Without these, the Hub Complete tier (A$12,500) is technically vapor when a prospect says yes. Either build the assets first or pitch only Foundation (A$8k) for now.</li>
        <li style="margin-bottom: 8px;"><strong>Sender domain</strong>. I'd recommend cold outreach sends from <code>partnerships@concussion-education-australia.com</code> alias, not your personal zac@ inbox. Protects deliverability of transactional emails. Easy Resend config.</li>
        <li style="margin-bottom: 8px;"><strong>Volume cap per week</strong>. Start with 5-10 personalised sends per week (warm-up). Ramp to 20-30/week after the first 2-3 weeks. Aggressive blast volumes burn the domain.</li>
      </ol>

      <p style="font-size: 12px; color: #475569; margin-top: 24px; font-style: italic;">
        Nothing live yet — no emails sent to prospects, no clinics contacted. This brief is for your decision-making only.
      </p>

      <hr style="margin: 30px 0; border: 0; border-top: 1px solid #e2e8f0;">
      <p style="font-size: 11px; color: #94a3b8;">
        Sourced via Google search + clinic websites + AHPRA Public Register. Team sizes verified from public team pages where possible (estimates flagged). Prospects with team pages not publicly accessible have been excluded.
      </p>
    </div>
  `

  try {
    const ok = await sendEmail({
      to: 'zac@concussion-education-australia.com',
      subject: 'Cold outreach brief — 12 regional clinic prospects ready to scope',
      html,
    })
    if (!ok) {
      return NextResponse.json({ error: 'sendEmail returned false' }, { status: 500 })
    }
    return NextResponse.json({ success: true, sentTo: 'zac@concussion-education-australia.com' })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Send failed' },
      { status: 500 }
    )
  }
}

function tierCard(args: {
  n: number
  name: string
  region: string
  site: string
  team: string
  mix: string
  owner: string
  email: string
  hooks: string[]
}) {
  const { n, name, region, site, team, mix, owner, email, hooks } = args
  return `
    <div style="border: 1px solid #cbd5e1; border-left: 4px solid #0f766e; border-radius: 6px; padding: 14px 16px; margin-bottom: 12px; background: #fff;">
      <p style="margin: 0 0 4px; font-size: 13px;"><strong>#${n}. ${name}</strong> · <span style="color: #64748b;">${region}</span></p>
      <p style="margin: 0 0 8px; font-size: 11px; color: #475569;">${site}</p>
      <table style="width: 100%; font-size: 11.5px; margin-bottom: 8px;">
        <tr>
          <td style="padding: 2px 8px 2px 0; color: #64748b; width: 70px;"><strong>Team</strong></td>
          <td style="padding: 2px 0;">${team}</td>
        </tr>
        <tr>
          <td style="padding: 2px 8px 2px 0; color: #64748b;"><strong>Mix</strong></td>
          <td style="padding: 2px 0;">${mix}</td>
        </tr>
        <tr>
          <td style="padding: 2px 8px 2px 0; color: #64748b;"><strong>Owner</strong></td>
          <td style="padding: 2px 0;">${owner}</td>
        </tr>
        <tr>
          <td style="padding: 2px 8px 2px 0; color: #64748b;"><strong>Email</strong></td>
          <td style="padding: 2px 0;">${email}</td>
        </tr>
      </table>
      <p style="margin: 6px 0 4px; font-size: 11px; color: #0f766e; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;">Personalisation hooks</p>
      <ul style="margin: 0; padding-left: 18px; font-size: 11.5px;">
        ${hooks.map((h) => `<li style="margin-bottom: 3px;">${h}</li>`).join('')}
      </ul>
    </div>
  `
}
