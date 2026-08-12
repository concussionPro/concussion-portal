// Application Configuration
// Centralized constants for URLs, dates, and settings

export const CONFIG = {
  // External URLs
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com',
  SHOP_URL: '/pricing', // Portal checkout — no longer links to Squarespace
  CONTACT_EMAIL: 'zac@concussion-education-australia.com',

  // Course Details
  COURSE: {
    TOTAL_MODULES: 8,
    // CPD TOTALS DIFFER BY BODY — this is a RULING, not a bug. The SAME shared
    // OA RE-RATED the practical day to 8 hrs on 2026-07-30 (Dominic Buchta,
    // cpd@osteopathy.org.au: "I've updated the course page to show 16 hours")
    // — aligning with ESSA's assessment. BOTH streams are now 16 CPD
    // (8 online + 8 practical). Sweep done same day; never hardcode these.
    TOTAL_CPD_POINTS: 16,
    ONLINE_CPD_POINTS: 8,
    IN_PERSON_CPD_POINTS: 8,
    // CRM (EP stream) total under ESSA's ruling — a STATED fact, not derived
    // arithmetic (was ONLINE_CPD_POINTS * 2 in three surfaces, which read as
    // coincidence and invited "fixing" the CCM/CRM asymmetry).
    CRM_TOTAL_CPD_POINTS: 16,
    // Derived below (see 'SELF-DERIVED CLAIM STRINGS'), not a literal — an
    // object literal cannot reference its own fields while it is being built.
    CPD_BADGE_TEXT: '',
    PRICE_ONLINE: 497,
    // PRICING MODEL (owner decision 2026-07-02):
    // PRICE_REGULAR ($1,400) is the sticker/standard price. It is only ever
    // CHARGED in the final EARLY_BIRD_DAYS_BEFORE window of a confirmed,
    // scheduled workshop. Everyone who buys BEFORE their city's date launches
    // (status 'collecting'/'completed'-awaiting-next-round) — or after launch
    // but outside the final window — pays PRICE_EARLY_BIRD ($1,190).
    // The Complete Course is buyable at ANY time for ANY city: the buyer
    // nominates a city, lands in the Ready-to-Train pipeline, and a date
    // launches when the city hits CONFIRMATION_THRESHOLD.
    // ACL discipline: $1,400 must remain a REAL price (genuinely charged in
    // the final window) — never present $1,190 as a discount off a price
    // that is never charged. Use isEarlyBirdForLocation()/workshopPriceFor().
    PRICE_REGULAR: 1400,
    PRICE_EARLY_BIRD: 1190,
    // SCAT6 completion code — dollar amount must match the Stripe coupon.
    SCAT_DISCOUNT_AUD: 50,
    // Reference+Toolkit ("book") owner credit, applied server-side at checkout
    // to online-only / full-course. The SAME number has to drive the price the
    // /pricing cards show and the discount lib/stripe.ts subtracts from the
    // line item — they were two independent literals, so a change to one shipped
    // a page quoting a price the buyer would not be charged.
    BUNDLE_OWNER_DISCOUNT_AUD: 100,
    // International (USD) — CRM course + first year on the platform, with the
    // annual renewal covering the concussion-update module + platform access.
    // Consumed by lib/stripe.ts (international-online checkout) and the
    // /acsm + /pricing-international offer cards — keep them in lockstep.
    PRICE_INTERNATIONAL: 347,
    RENEWAL_INTERNATIONAL: 99,
    SAVINGS: 210,
    // Concussion Hub Pack — clinic-tier offer for cold outreach.
    // 5 online seats + branded clinical docs + admin pack + 30min consult.
    PRICE_CLINIC_HUB_PACK: 1497,
    CLINIC_HUB_SEATS_INCLUDED: 5,
    // Per-clinician seat ADDED beyond the 5 included. Large clinics that
    // want their whole 10-20 person team trained pay marginal per-seat
    // online access. Priced well below standalone individual ($497) since
    // they're already a Hub Pack customer, but high enough that the unit
    // economics work — Zac's online delivery cost is ~$0 per seat but the
    // perceived value tracks team size.
    PRICE_CLINIC_HUB_EXTRA_SEAT: 497,
    // Per-clinician workshop upgrade for Hub Pack customers: a hub member
    // joins a PUBLIC workshop date for this price. Set at $600 = ~50% of the
    // $1,190 solo complete-course price — the clinic already paid for the
    // online bundle, so this is the marginal in-person seat only, at roughly
    // half what a solo clinician pays to attend (owner 2026-07-08).
    PRICE_CLINIC_WORKSHOP_UPGRADE: 600,
    SCAT_MASTERY_CPD_POINTS: 1,
    SCAT_MASTERY_MODULES: 3,
    PROMO_CODE: 'SCAT6',
  },

  // Training Locations & Dates
  // status: 'collecting' = accepting purchases, tracking toward threshold
  //         'confirmed'  = admin set date + venue after threshold hit
  //         'completed'  = workshop has happened
  LOCATIONS: {
    // hasRunWorkshop: a PAST round has already run in this city (its attendees
    // are alumni), independent of `status` which governs the NEXT round. Sydney
    // (Mar 7 2026) and Byron Bay (Nov 22 2025) have both run and are now
    // collecting for their next round — so they must count as alumni-eligible
    // even while `status='collecting'`. See workshop-alumni.completedWorkshopSlugs.
    SYDNEY: {
      city: 'Sydney',
      slug: 'sydney',
      date: '',
      dateObj: null as Date | null,
      status: 'collecting' as 'collecting' | 'confirmed' | 'closed' | 'completed',
      hasRunWorkshop: true, // ran Sydney 7 Mar 2026
    },
    BYRON_BAY: {
      city: 'Byron Bay',
      slug: 'byron-bay',
      date: '',
      dateObj: null as Date | null,
      status: 'collecting' as 'collecting' | 'confirmed' | 'closed' | 'completed',
      hasRunWorkshop: true, // ran Byron Bay 22 Nov 2025
    },
    ADELAIDE: {
      city: 'Adelaide',
      slug: 'adelaide',
      date: '',
      dateObj: null as Date | null,
      status: 'collecting' as 'collecting' | 'confirmed' | 'closed' | 'completed',
      hasRunWorkshop: false,
    },
    WA: {
      city: 'Perth (WA)',
      slug: 'wa',
      date: '',
      dateObj: null as Date | null,
      status: 'collecting' as 'collecting' | 'confirmed' | 'closed' | 'completed',
      hasRunWorkshop: false,
    },
    MELBOURNE: {
      city: 'Melbourne',
      slug: 'melbourne',
      date: 'Saturday 13 June 2026',
      dateObj: new Date('2026-06-13T08:00:00+10:00') as Date | null,
      // 'completed' (2026-06-15): workshop RAN on 13 June (its third Melbourne
      // round, after Oct 25 2025 and Feb 7 2026). Paid attendees are alumni —
      // full-course + workshop_location='melbourne'. Warm base for Level 2.
      status: 'completed' as 'collecting' | 'confirmed' | 'closed' | 'completed',
      hasRunWorkshop: true, // ran Melbourne Oct 25 '25, Feb 7 '26, Jun 13 '26
    },
  },

  // Workshop Capacity & Threshold
  WORKSHOP: {
    CAPACITY_PER_COURSE: 12,
    // STANDING CADENCE COMMITMENT (owner): a practical day runs EVERY QUARTER.
    // This is the answer to "if I buy online, will the day ever actually
    // happen?" — the objection that makes a browser register instead of buy.
    //
    // It lives here rather than in copy because the copy that carried it named
    // specific unsecured dates ("Melbourne on 31 October") and had to be pulled
    // on 2026-08-10. The COMMITMENT is true and standing; the DATES are only
    // true once a venue is booked and CONFIG.LOCATIONS carries them. Surfaces
    // state the cadence from here, and name a date only when one is confirmed.
    RUNS_PER_QUARTER: 1,
    CONFIRMATION_THRESHOLD: 8,    // paid registrants needed to confirm a date
    LEAD_TIME_WEEKS: 6,           // weeks of notice after threshold hit
    // Early bird ($1,190) closes this many days before a CONFIRMED workshop
    // date — the final window is charged at PRICE_REGULAR ($1,400). For
    // cities with no launched date (collecting / completed awaiting next
    // round), early bird is ALWAYS active (owner decision 2026-07-02).
    EARLY_BIRD_DAYS_BEFORE: 14,
    // Current-round enrolment scoping (per location slug). getEnrollmentCount()
    // only counts full-course users created on/after this date so attendees of
    // past rounds (e.g. Q1 2026 workshops) don't consume seats/capacity for the
    // active round. Melbourne 13 June 2026 round: demand capture ran through
    // 2026 before the date was confirmed (2026-04-18), so the round opens at
    // the start of 2026. Update when the next round is announced.
    // Values are AUSTRALIAN EASTERN calendar dates — resolve them with
    // roundStartInstant() / roundStartSqlInstant() below, never `new Date(str)`
    // and never by handing the bare string to Postgres.
    ROUND_START: {
      melbourne: '2026-01-01',
      // Sydney ran 7 Mar 2026, Byron Bay ran 22 Nov 2025 — scope each next round
      // to AFTER its last completed round so past alumni don't consume next-round
      // seats/threshold. Bump these when the next Syd/BB dates are announced.
      sydney: '2026-03-08',
      'byron-bay': '2025-11-23',
    } as Record<string, string>,
    Q1_COMPLETED: true,           // Q1 2026 workshops ran — used for social proof
  },

  // Workshop venue partnerships — Rydges Melbourne for the Jun 13 2026 workshop
  VENUE_BENEFITS: {
    MELBOURNE: {
      hotelName: 'Rydges Melbourne',
      hotelAddress: '186 Exhibition St, Melbourne CBD',
      bookingUrl: 'https://www.rydges.com/accommodation/melbourne-vic/melbourne/',
      accommodationDiscountPct: 25,
      accommodationCode: 'CEA25',            // Update when Rydges confirms the actual code
      parkingConferenceRate: 45,             // $/day, enter before 10am, exit by 6pm
      parkingOvernightRate: 60,              // $/night for hotel guests
    },
  },

  // Social Proof — real numbers only, updated manually
  SOCIAL_PROOF: {
    SCAT_FORM_DOWNLOADS: 500,
    WORKSHOP_REGISTRATIONS: 15,   // Total people registered for next round
  },

  // SEO Metadata
  SEO: {
    SITE_NAME: 'Concussion Education Australia',
    SITE_URL: 'https://portal.concussion-education-australia.com',
    TWITTER_HANDLE: '@ConcussionEduAU',
    OG_IMAGE: 'https://portal.concussion-education-australia.com/og-image.jpg',
    // ENDORSEMENT SCOPE — this string is the metadata FALLBACK for the whole
    // site (app/layout.tsx uses it for description, og:description and
    // twitter:description), so it renders on routes that have no business
    // carrying it. Rendered check 2026-08-06: /acsm, /cep-uk and
    // /concussion-rehab-mastery — all Concussion Rehab Mastery surfaces — were
    // serving "Endorsed by Osteopathy Australia" as their twitter:description,
    // and /concussion-rehab-mastery as its og:description too. OA endorses CCM
    // only; CRM is the ESSA stream. The JSON-LD Organization node had already
    // been fixed for exactly this reason (see lib/schema-markup.ts) — the meta
    // tags one layer up had not.
    //
    // So the endorsement names the course it belongs to. Then the sentence
    // stays true wherever the fallback lands.
    // Derived below, for the same reason as CPD_BADGE_TEXT.
    DESCRIPTION: '',
  },

  // ESSA accreditation — FORMAL TERMS from the accreditation letter
  // (27 Jul 2026, Steve Irwin, PD Coordinator). Single source for the number,
  // validity and the MANDATED statement wording. Rules from the letter:
  //  - unlimited deliveries during the period, provided the PDO changes <20%
  //    (formatting, reference updates and minor corrections are fine);
  //  - presenter change requires CV + letter to the PD Committee;
  //  - ESSA may revoke if delivery differs from the application;
  //  - EXPIRES 24 Jul 2027 — re-accredit BEFORE then or every ESSA claim
  //    portal-wide goes false (flip ESSA_ACCREDITED off if lapsed).
  ESSA_ACCREDITATION: {
    NUMBER: 'PDNF26077',
    ONLINE_POINTS: 8,
    PRACTICAL_POINTS: 8,
    VALID_UNTIL: '2027-07-24',
    /** ESSA's mandated statement — use verbatim with the points filled in. */
    statement(points: number): string {
      return `The ESSA Professional Development Committee certifies that this Professional Development offering meets the criteria for ${points} Continuing Professional Development (CPD) Points.`
    },
  },

  // SST Trainer iOS app — the ONLY canonical store link. Renders nowhere until
  // FEATURES.SST_IOS_APP_LIVE flips true on Apple approval.
  SST_APP_STORE_URL: 'https://apps.apple.com/au/app/id6792171738',
  // TestFlight PUBLIC link — the pre-store native-iOS path for patients
  // (Safari has no Web Bluetooth, so live HR on iPhone needs the native app).
  // Public link created 2026-07-27. Surfaces are CLINICIAN-FACING only
  // (welcome email + clinic card), keeping the clinician-led posture; all of
  // them auto-retire in favour of the App Store link once SST_IOS_APP_LIVE
  // flips.
  SST_TESTFLIGHT_URL: 'https://testflight.apple.com/join/9YmTFQW9',

  // Feature Flags
  FEATURES: {
    /**
     * The RESEARCH consent block inside SST intake. Default FALSE.
     *
     * The clinical covariates (injury date, age band, sex) collect regardless —
     * they change how a clinician reads a threshold and are justifiable under
     * the existing quality-assurance framing. Only the research consent question
     * is gated, because showing it before an ethics committee has approved the
     * wording produces consent no journal will accept.
     *
     * Flip to true the day the HREC approves. Nothing else needs to change.
     */
    SST_RESEARCH_CONSENT_LIVE: true,
    // POTS / long-COVID exertion-intolerance pathway (owner, 2026-08-12):
    // enables the condition selector + DSQ-PEM screening step + orthostatic
    // (NASA lean) instrument. Enable quietly — no marketing copy changes ride
    // this flag; concussion remains the default pathway everywhere.
    SST_POTS_PATHWAY_LIVE: true,
    SHOW_COUNTDOWN: true,
    SHOW_SPOTS_REMAINING: true,
    SHOW_SOCIAL_PROOF: true,
    // ESSA accreditation for the CRM (EP) stream. FALSE until the certificate
    // is actually granted. Controls EVERY ESSA claim on the EP landing + hub +
    // nurture: when false → "designed to ESSA CPD standards · accreditation
    // pending" and NEVER "accredited"; when true → "ESSA-accredited · 8 ESSA
    // CPD points". Flip to true ONLY on real approval. Bundled to the client
    // (not secret). This is the one switch that takes the EP stream live.
    // GRANTED 2026-07-24, letter received 2026-07-27 — ESSA accredited CRM
    // (Concussion Rehab Mastery), 8 online + 8 practical = 16 CPDs. Official
    // "ESSA Accredited PD" lockup (rebrand pack, 27 Jul 2026) in
    // public/essa-accredited-pd.png (+ -white variant for dark backgrounds).
    // Formal terms in CONFIG.ESSA_ACCREDITATION below.
    ESSA_ACCREDITED: true,
    // CPD Tracker — PARKED (owner 2026-08-03: "park this for now. hide/remove
    // any public page"). Build is complete and live-tested (P1 + credential
    // file, commits 9633c52/db91770); flipping this true restores the
    // /clinical-testing tile, the records page and the /api/cpd/* routes.
    // Data (registrations/activities/evidence) persists while parked.
    CPD_TRACKER_LIVE: false,
    /**
     * Arms the SST included-period renewal prompt.
     *
     * OFF until two things are true (2026-08-06):
     *  1. Zac has read the email copy — it goes to real clinics, several of
     *     them alumni, and the ask is money.
     *  2. `included_until` is backfilled. Measured today: 26 clinics, ZERO
     *     with a date. The column exists and new provisioning stamps it, but
     *     every existing clinic predates the field, so an armed prompt would
     *     reach nobody — the same "mechanism exists, reach is zero" failure as
     *     the $50 discount, which sent 22 emails in its lifetime.
     * Flipping this true without the backfill is a no-op, not a send.
     */
    SST_RENEWAL_PROMPT_LIVE: false,
    // International CRM live commerce: online-only, geo-priced checkout, the
    // bundled platform, and the year-2 renewal subscription.
    // LIVE 2026-07-26 — the three STRIPE_SST_*_PRICE_ID vars now hold real
    // Price ids, which is what the renewal depends on. instrumentation.ts
    // refuses to boot production with this true and those unset/malformed, so
    // the "sells, but never schedules a renewal" failure can't recur.
    // See /api/crm/checkout-international + handleCrmPurchase.
    CRM_INTERNATIONAL_LIVE: true,
    // Whether a CCM purchase provisions the bundled clinical platform
    // (SST Trainer + Baseline) for the buyer.
    //
    // SPLIT OUT of CRM_INTERNATIONAL_LIVE 2026-07-26. One flag was gating two
    // unrelated things, so the homepage's "Included with your enrolment —
    // enrol and your clinic code activates both instruments" was withheld from
    // every CCM buyer by a switch named for an international CRM launch. That
    // is the promise on the flagship product; it should never have depended on
    // an unrelated market going live.
    //
    // Buyers land on the 3-patient trial cap: the cap now lifts only where a
    // renewal subscription exists (lib/sst-trainer/bundle.ts), and CCM does not
    // carry one. The free platform year is deliberate; free forever is not.
    CCM_PLATFORM_BUNDLE_LIVE: true,
    // SST Trainer iOS app — Apple ID 6792171738, v1.0 submitted ~18 Jul 2026,
    // WAITING FOR REVIEW as of 27 Jul (release set to automatic-on-approval).
    // Flip TRUE the day Apple approves. While false, no App Store badge or
    // link renders anywhere — same discipline as every other unheld claim.
    SST_IOS_APP_LIVE: false,
    // ACSM Approved Provider status for the CRM (the US$600 application).
    // FALSE until the approval letter arrives. Same discipline as ESSA: while
    // false, /acsm may state HOURS of learning (verifiable) but must never
    // claim CECs — a credit currency is not ours to assert until ACSM grants it.
    // Flip to true AND set ACSM_CEC_HOURS from the approval letter, which is the
    // number ACSM specifies (do not infer it from our own hours count).
    ACSM_ACCREDITED: false,
    /** CECs named in the ACSM approval letter. Null until one exists. */
    ACSM_CEC_HOURS: null as number | null,
    // HPCSA (South Africa) CEU accreditation of the CRM. FALSE until the
    // accreditation number is issued. HARD COMPLIANCE GATE: since 1 Nov 2024 no
    // SA practitioner may enrol in a CPD activity before it is accredited, the
    // fee is non-refundable, and there is NO retrospective remedy — so SA (ZA)
    // buyers must be BLOCKED from the CRM checkout until this is true (enforced
    // server-side in create-checkout, displayed as "register interest" on /hpcsa
    // and /pricing-international). Flip to true ONLY when the CEU number issues.
    HPCSA_ACCREDITED: false,
  },
}

// ---------------------------------------------------------------------------
// SELF-DERIVED CLAIM STRINGS.
//
// Both of these state a CPD rating and an endorsement, and both were literals
// carrying "16" and "Endorsed by Osteopathy Australia" inside the very file
// that defines the canonical numbers. A re-rate would have updated
// TOTAL_CPD_POINTS and left the sentence beside it saying something else —
// which is precisely how 14 survived the 2026-07-30 re-rate on eight surfaces.
//
// Assigned after the literal is built because an object literal cannot
// reference its own fields mid-construction. Same pattern as the ESSA expiry
// enforcement below; no call site changes.
// ---------------------------------------------------------------------------
CONFIG.COURSE.CPD_BADGE_TEXT =
  `Up to ${CONFIG.COURSE.TOTAL_CPD_POINTS} CPD hours - AHPRA Aligned. ` +
  `Concussion Clinical Mastery is endorsed by Osteopathy Australia.`

// ENDORSEMENT SCOPE — this is the metadata FALLBACK for the whole site
// (app/layout.tsx uses it for description, og:description AND
// twitter:description), so it renders on routes that have no business carrying
// it. Rendered check 2026-08-06: /acsm, /cep-uk and /concussion-rehab-mastery —
// all Concussion Rehab Mastery surfaces — were serving "Endorsed by Osteopathy
// Australia" as their twitter:description, and the CRM flagship as its
// og:description too. OA endorses CCM only; CRM is the ESSA stream. The JSON-LD
// Organization node had already been scoped for exactly this reason
// (lib/schema-markup.ts) — the meta tags one layer up had not.
//
// So the endorsement names the course it belongs to, and the sentence stays
// true wherever the fallback lands.
CONFIG.SEO.DESCRIPTION =
  `AHPRA-aligned concussion CPD from Concussion Education Australia. ` +
  `SCAT6, VOMS, BESS mastery. Our flagship Concussion Clinical Mastery — ` +
  `${CONFIG.COURSE.TOTAL_MODULES} online modules (${CONFIG.COURSE.ONLINE_CPD_POINTS} CPD hours) ` +
  `+ optional practical day (up to ${CONFIG.COURSE.TOTAL_CPD_POINTS} CPD hours) — ` +
  `is endorsed by Osteopathy Australia; Concussion Rehab Mastery is accredited ` +
  `by ESSA for exercise physiologists.`

// ---------------------------------------------------------------------------
// ESSA EXPIRY ENFORCEMENT.
//
// ~40 public surfaces gate their ESSA claim on CONFIG.FEATURES.ESSA_ACCREDITED.
// The accreditation EXPIRES 2027-07-24, and until now nothing connected the
// expiry date to the flag — so on 2027-07-25 every one of those surfaces would
// keep asserting "ESSA-accredited (No. PDNF26077)" until a human remembered to
// flip a boolean. A lapsed-accreditation claim is the same regulatory defect as
// a never-held one.
//
// Flipping the flag off here means the surfaces fall back to the "designed to
// ESSA CPD standards · accreditation pending" copy they already carry, with no
// call-site changes. Re-accreditation = bump VALID_UNTIL.
// ---------------------------------------------------------------------------
if (
  Date.now() >
  new Date(`${CONFIG.ESSA_ACCREDITATION.VALID_UNTIL}T23:59:59+10:00`).getTime()
) {
  CONFIG.FEATURES.ESSA_ACCREDITED = false
}

export type LocationKey = keyof typeof CONFIG.LOCATIONS
export type Location = LocationKey
export type LocationConfig = typeof CONFIG.LOCATIONS[LocationKey]
export type LocationStatus = 'collecting' | 'confirmed' | 'closed' | 'completed'

/**
 * Is the $1,190 early-bird rate active for this city? (Pure — safe on client
 * and server; the server charge in lib/stripe.ts uses this same function.)
 *
 *  - No city / unknown city / 'collecting' / 'completed' (awaiting next
 *    round): TRUE — everyone who buys before a date launches pays $1,190.
 *  - 'confirmed' with a future date: TRUE until EARLY_BIRD_DAYS_BEFORE days
 *    out, then FALSE (the final window is charged at PRICE_REGULAR $1,400).
 *  - 'confirmed' with a past date (admin hasn't flipped to completed yet):
 *    TRUE — the purchase is a nomination for the next round.
 */
export function isEarlyBirdForLocation(locationSlug?: string | null): boolean {
  const loc = locationSlug
    ? Object.values(CONFIG.LOCATIONS).find((l) => l.slug === locationSlug)
    : undefined
  if (!loc || loc.status !== 'confirmed' || !loc.dateObj) return true
  const dateMs = loc.dateObj.getTime()
  if (dateMs < Date.now()) return true // past date = next-round nomination
  const closeMs = dateMs - CONFIG.WORKSHOP.EARLY_BIRD_DAYS_BEFORE * 24 * 60 * 60 * 1000
  return Date.now() < closeMs
}

// ---------------------------------------------------------------------------
// Round-start boundary — ONE instant for JS and SQL.
//
// CONFIG.WORKSHOP.ROUND_START holds bare 'YYYY-MM-DD' strings. `new Date(str)`
// parses those as UTC midnight, and the same bare string handed to Postgres is
// resolved against the SERVER's TimeZone setting — so the boundary meant either
// 00:00 UTC (= 10 or 11am Sydney) or something else entirely depending on a
// database setting nothing in this repo pins. Either way it was never the thing
// the business means: a round starts at midnight in Australia.
//
// Both sides now go through roundStartInstant(), which resolves the calendar
// date to Australian Eastern midnight and yields an absolute instant. JS
// compares milliseconds; SQL is handed that instant as an explicit-UTC ISO
// string, which no server setting can reinterpret. The window in which the seat
// counter and the alumni classifier could disagree is closed.
//
// Australia/Sydney covers every city that has a ROUND_START (Melbourne, Sydney,
// Byron Bay — all AEST/AEDT) and matches both the analytics day-bucketing and
// the +10:00 literals on CONFIG.LOCATIONS dateObj. A future Adelaide (+9:30) or
// Perth (+8) round would shift the boundary by ≤2h — sub-day, so it cannot move
// a buyer between rounds unless they purchased within hours of the cutover.
// ---------------------------------------------------------------------------
const AU_EASTERN_TZ = 'Australia/Sydney'

/** Australian Eastern UTC offset in minutes at an instant — 600 (AEST) / 660 (AEDT). */
function auEasternOffsetMinutes(at: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: AU_EASTERN_TZ, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(at).reduce<Record<string, string>>((acc, p) => { acc[p.type] = p.value; return acc }, {})
  const asUtc = Date.UTC(
    Number(parts.year), Number(parts.month) - 1, Number(parts.day),
    Number(parts.hour) % 24, Number(parts.minute), Number(parts.second),
  )
  return Math.round((asUtc - at.getTime()) / 60_000)
}

/**
 * The instant a city's current round opened: 00:00 Australian Eastern on its
 * ROUND_START date. Null when the city has no round start configured (callers
 * must fail safe — see lib/workshop-alumni.ts).
 */
export function roundStartInstant(locationSlug?: string | null): Date | null {
  const dateKey = locationSlug ? CONFIG.WORKSHOP.ROUND_START[locationSlug] : undefined
  if (!dateKey) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey.trim())
  if (!m) return null
  const [, y, mo, d] = m
  const utcMidnight = Date.UTC(Number(y), Number(mo) - 1, Number(d))
  // Two passes so a date sitting on a DST changeover resolves to the offset in
  // force AT the local midnight, not the offset of the UTC-midnight guess.
  let ts = utcMidnight
  for (let i = 0; i < 2; i++) ts = utcMidnight - auEasternOffsetMinutes(new Date(ts)) * 60_000
  return new Date(ts)
}

/**
 * Same boundary, as an explicit-UTC ISO string for SQL parameters. Never pass
 * the bare 'YYYY-MM-DD' to Postgres — that is the divergence this exists to
 * remove.
 */
export function roundStartSqlInstant(locationSlug?: string | null): string | null {
  return roundStartInstant(locationSlug)?.toISOString() ?? null
}

/** Complete Course price for a city under the early-bird model (AUD). */
export function workshopPriceFor(locationSlug?: string | null): number {
  return isEarlyBirdForLocation(locationSlug)
    ? CONFIG.COURSE.PRICE_EARLY_BIRD
    : CONFIG.COURSE.PRICE_REGULAR
}

/**
 * Workshop-upgrade price for an online-only owner.
 *
 * ALWAYS the early-bird difference, for EVERY city, at EVERY time (owner,
 * 2026-08-10: "all online buyers get to upgrade for the early bird price").
 *
 * This used to derive from workshopPriceFor(city), so once a city's early bird
 * closed — 14 days before its confirmed date — the same upgrade jumped from
 * $693 to $903 depending on which city the buyer picked. Three things were
 * wrong with that:
 *
 *  - It contradicted the promise. "Start online, upgrade whenever you like,
 *    your upgrade never expires" is the whole reason the online course is safe
 *    to buy. A price that silently rises 30% two weeks before each date makes
 *    that promise false exactly when someone acts on it.
 *  - It was internally inconsistent. `upgradePriceFor(null)` returns the
 *    early-bird difference, so the checkout-success page and the nomination
 *    campaign quoted $693 while /upgrade quoted the city-dependent figure. Same
 *    customer, two prices, decided by which page they happened to land on.
 *  - It punished the behaviour the funnel is built to encourage. The online
 *    course is the practical's pipeline; charging more to convert late is
 *    backwards.
 *
 * PRICE_REGULAR still means something: it is charged on a DIRECT Complete
 * Course purchase inside the final EARLY_BIRD_DAYS_BEFORE window. That keeps
 * $1,400 a real price (ACL — never present $1,190 as a discount off a price
 * that is never charged) without taxing the upgrade path.
 *
 * The location parameter is retained so call sites need no change and the
 * signature stays honest about what it is pricing.
 */
export function upgradePriceFor(_locationSlug?: string | null): number {
  return CONFIG.COURSE.PRICE_EARLY_BIRD - CONFIG.COURSE.PRICE_ONLINE
}

/**
 * Cities whose NEXT round is live for the nurture crons, in CONFIG.LOCATIONS
 * declaration order.
 *
 * app/api/cron/send-nurture-emails gates every post-purchase workshop lane on
 * this status: the Day-1 reservation email and the momentum sequence require
 * 'collecting', the pre-workshop logistics/reminder lane requires 'confirmed'.
 * A seat holder nominated into a 'completed' (or 'closed') city matches none of
 * them and is silently dropped from all three.
 */
export function openNominationLocations(): LocationConfig[] {
  return Object.values(CONFIG.LOCATIONS).filter(
    (loc) => loc.status === 'collecting' || loc.status === 'confirmed'
  )
}

/**
 * The city slug a picker may PRE-SELECT for a buyer who touches nothing.
 *
 * Any city stays selectable — a 'completed' city is still nominatable for its
 * next round — but the default must never be one the nurture crons ignore.
 * Null when no city is open, in which case the picker must force an explicit
 * choice rather than nominate silently.
 */
export function defaultNominationCity(): string | null {
  return openNominationLocations()[0]?.slug ?? null
}

/**
 * SST Trainer / Clinical Testing plans — the LIVE model (owner 2026-08-05).
 *
 * Priced on NEW PATIENTS PER CALENDAR MONTH, not seats: clinicians are
 * UNLIMITED on every paid tier. Caps here mirror TIER_MONTHLY_PATIENT_CAP in
 * lib/sst-trainer/clinic-registry (null = unlimited); amounts mirror the Stripe
 * recurring prices behind the STRIPE_SST_*_PRICE_ID slots (see SST_PLANS in
 * lib/stripe — the var NAMES are historical and do not match the tier names).
 * Stripe stays the billing source of truth, this is the source for DISPLAY.
 *
 * The retired FOUNDING model ("founding terms locked for good") lived here as
 * SST_PRICING and had no consumers. Founding pricing is not sold — do not
 * reintroduce it on any surface.
 */
/** Free-trial allowance: distinct patients a clinic may run before it must
 *  subscribe. Usage-based, not time-based (owner 2026-07-06). Lives here (not
 *  in clinic-registry, which pulls in the DB/KV clients) so client components
 *  can render the number without dragging server code into the bundle;
 *  clinic-registry re-exports it as TRIAL_PATIENT_CAP. */
export const SST_TRIAL_PATIENT_CAP = 3

/**
 * SST tiers — metered on NEW PATIENTS STARTED PER CALENDAR MONTH, never seats.
 * Clinicians are unlimited on every tier.
 *
 * RESTRUCTURED 2026-08-08 (owner). Two changes from the 2026-08-07 four-tier
 * caseload model, both load-bearing:
 *
 * 1. SEATS ARE NOT METERABLE HERE, so patients are the meter and always will
 *    be. There is no clinician identity anywhere in the product: auth is a
 *    clinic-level code + view_key, `sst_clinic_members` has never held a row,
 *    and `sst_clinic_sessions` carries no member reference. A seat-priced
 *    product would have nothing to count. Patient volume, by contrast, is
 *    self-policing — a ten-clinician practice generates ~10x a solo's volume
 *    and cannot hide on a small plan.
 *
 * 2. NEW STARTS PER MONTH, not active caseload in a rolling 30 days. A
 *    rolling-active cap means the way to free a slot when you are near the cap
 *    is to DISCHARGE SOMEONE EARLY. In a product whose entire thesis is dosed,
 *    monitored, sub-threshold progression, that incentive is unacceptable.
 *    Counting first-session-this-month makes a patient cost the same whether
 *    they finish in three weeks or three months.
 *
 * The prior model also mis-set the magnitudes: caps of 1/5/10 were calibrated
 * as if patient count were a proxy for CLINIC SIZE. It is a proxy for
 * THROUGHPUT, and one clinician can start 15 patients a week — so the old
 * ladder was blown through by a single busy user before a second clinician
 * existed.
 *
 * SEASONALITY is the known weakness of a monthly cap: concussion volume tracks
 * the football season, so a clinic can start 12 in July and 2 in December. The
 * cap therefore FLOATS BOTH WAYS (see clinic-registry): breaching never blocks
 * a patient, two consecutive months over moves a clinic up, two consecutive
 * months under moves it back down. A one-way ratchet would punish a seasonal
 * buyer for one good month.
 *
 * Anchored against what these buyers already pay for their system of record:
 * Cliniko is USD $45/mo for one practitioner and USD $195/mo for 9-12
 * (~A$70 and ~A$300). SST is an adjunct tool for ONE condition, so it sits
 * under the PMS at every rung.
 *
 * Enterprise is QUOTE ONLY and carries no published number — the whole category
 * prices this way (Sway Medical and Complete Concussions are both quote-only),
 * and a printed ceiling would cap the NZ/ACC and occupational-rehab deals,
 * which are negotiated per organisation at an order of magnitude above Pro.
 */
export const SST_TIERS = [
  { plan: 'starter', name: 'Starter', monthlyAud: 49, monthlyPatientCap: 10, popular: false },
  { plan: 'clinic', name: 'Clinic', monthlyAud: 99, monthlyPatientCap: 30, popular: true },
  { plan: 'pro', name: 'Pro', monthlyAud: 199, monthlyPatientCap: 100, popular: false },
  { plan: 'enterprise', name: 'Enterprise', monthlyAud: null, monthlyPatientCap: null, popular: false },
] as const

/**
 * The tier a COURSE ENROLMENT includes for its first year, and the tier the
 * Embodia one-month lane converts onto. Starter — the entry rung.
 *
 * Under the retired model this pointed at SST_TIERS[1] because SST_TIERS[0]
 * ('single') meant ONE active patient and would have cut existing clinics from
 * five to one. That hazard is gone: Starter is now the entry rung at 10 new
 * patients a month, which is strictly more allowance than any legacy tier gave.
 */
export const SST_INCLUDED_TIER = SST_TIERS[0]

export type SstTier = (typeof SST_TIERS)[number]

/** Tiers a customer can actually buy — Enterprise is quote-only, no price. */
export type SstPurchasableTier = Extract<SstTier, { monthlyAud: number }>

/** True when a tier is sold by quote rather than a published price. */
export function isQuoteOnlyTier(tier: SstTier): tier is Extract<SstTier, { monthlyAud: null }> {
  return tier.monthlyAud === null
}

/** Entry price for the Clinical Testing suite (A$/month). Quote-only tiers are
 *  excluded — "from $49" must never be computed off a tier with no price. */
export const SST_TIER_FROM_AUD = Math.min(
  ...SST_TIERS.flatMap((t) => (t.monthlyAud === null ? [] : [t.monthlyAud])),
)

/** Human label for a tier's monthly patient allowance. */
export function sstTierAllowance(tier: SstTier): string {
  return tier.monthlyPatientCap === null
    ? 'Unlimited patients'
    : `Up to ${tier.monthlyPatientCap} new patients a month`
}

/** Calculate Afterpay/Klarna instalment amount (price / 4, rounded up to cents) */
export function afterpayInstalment(price: number): string {
  return (Math.ceil(price / 4 * 100) / 100).toFixed(2)
}
