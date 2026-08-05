/**
 * Email Nurture Sequences
 *
 * 6-email sequence over 6 weeks: Free SCAT forms -> Free course -> Paid CPD course
 *
 * Strategy:
 * - Max 1 email per week (clinicians are busy)
 * - Value before ask: 3 value emails before paid mention
 * - Progressive commitment: forms -> free course -> paid course
 * - Single CTA per email, action-verb buttons
 * - No emoji in subject lines (higher open for professionals)
 * - Plain-text feel with minimal HTML (higher engagement)
 * - Stop after 6 emails. No more sales emails after that.
 */

import { CONFIG, afterpayInstalment } from '@/lib/config'
import { escapeHtml } from '@/lib/resend-client'
import { signSurveyAnswer } from '@/lib/survey-token'
import { findCourse, getEffectivePrice } from '@/lib/ai-course/provider-catalogue'

/**
 * Truthful AI-course pricing at SEND time, derived from the provider
 * catalogue (single source of truth for launch pricing). Never hardcode a
 * deadline in template copy — these emails fire on rolling day-N schedules,
 * so a fixed date becomes false urgency the day after it passes.
 */
function aiCoursePricing(): { priceLine: string; ctaLabel: string } {
  const course = findCourse('ai-in-clinical-practice')
  const fullPrice = course?.priceAUD ?? 197
  const { price, isEarlyBird } = course
    ? getEffectivePrice(course)
    : { price: fullPrice, isEarlyBird: false }
  const current = price ?? fullPrice
  if (isEarlyBird && course?.earlyBirdEndsAt) {
    const endsAt = new Date(course.earlyBirdEndsAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
    return {
      priceLine: `<strong>Launch price: A$${current}</strong> (regular price A$${fullPrice}). Launch pricing ends ${escapeHtml(endsAt)}.`,
      ctaLabel: `Get it at A$${current} (launch price)`,
    }
  }
  return {
    priceLine: `<strong>A$${current}</strong> &mdash; 2 CPD hours, fully online, certificate on completion.`,
    ctaLabel: `See the course (A$${current})`,
  }
}

/** Append UTM params to a URL. Handles existing query strings. */
function utm(url: string, campaign: string, content?: string): string {
  const sep = url.includes('?') ? '&' : '?'
  let params = `${sep}utm_source=email&utm_medium=email&utm_campaign=${encodeURIComponent(campaign)}`
  if (content) params += `&utm_content=${encodeURIComponent(content)}`
  return url + params
}

const EMAIL_STYLES = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.7; color: #1e293b; background: #f8fafc; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
  .container { max-width: 580px; margin: 0 auto; background: white; }
  .header-bar { height: 4px; background: linear-gradient(90deg, #0d9488, #0ea5e9); }
  .content { padding: 32px 28px; }
  .content p { margin: 0 0 16px; font-size: 15px; }
  .content h2 { margin: 0 0 20px; font-size: 20px; font-weight: 700; color: #0f172a; }
  .content ul, .content ol { padding-left: 20px; margin: 0 0 16px; }
  .content li { margin-bottom: 10px; font-size: 15px; }
  .cta-btn { display: inline-block; padding: 14px 28px; background: #0d9488; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 8px 0 8px; }
  .cta-btn:hover { background: #0f766e; }
  .cta-secondary { display: inline-block; padding: 12px 24px; background: #f0fdfa; color: #0d9488 !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; border: 1px solid #99f6e4; }
  .callout { background: #f0fdfa; padding: 16px 20px; border-radius: 8px; border-left: 3px solid #0d9488; margin: 20px 0; font-size: 14px; }
  .callout-warn { background: #fffbeb; padding: 16px 20px; border-radius: 8px; border-left: 3px solid #d97706; margin: 20px 0; font-size: 14px; }
  .badge { display: inline-block; padding: 4px 12px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 20px; font-size: 12px; font-weight: 600; color: #0369a1; margin-bottom: 16px; }
  .sig { margin-top: 28px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; }
  .footer { padding: 16px 28px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
  .ps { font-size: 13px; color: #64748b; font-style: italic; margin-top: 20px; }
  a { color: #0d9488; }
`

/**
 * Inline HTML callout for the next confirmed workshop.
 * Used in promo/nurture emails, not confirmations. The Rydges accommodation
 * discount is included as a conversion sweetener — hotel perks land as an
 * incentive before purchase, not a thank-you after.
 * Returns empty string when no city is confirmed.
 */
function nextWorkshopCallout(): string {
  const mel = CONFIG.LOCATIONS.MELBOURNE
  if (mel.status !== 'confirmed') return ''
  const r = CONFIG.VENUE_BENEFITS.MELBOURNE
  return `
    <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; padding: 14px 16px; margin: 20px 0;">
      <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; color: #c2410c; text-transform: uppercase; letter-spacing: 0.05em;">Next live workshop</p>
      <p style="margin: 0; font-size: 15px; font-weight: 600; color: #0f172a;">Melbourne &mdash; ${escapeHtml(mel.date)}</p>
      <p style="margin: 2px 0 0; font-size: 13px; color: #475569;">Rydges Melbourne, Exhibition St &middot; 8am&ndash;4pm &middot; catered lunch included</p>
      <p style="margin: 8px 0 0; font-size: 12px; color: #9a3412;"><strong>Travelling in?</strong> Enrolled attendees get ${r.accommodationDiscountPct}% off accommodation at Rydges and access to on-site parking from $${r.parkingConferenceRate}/day.</p>
    </div>
  `
}

function emailShell(content: string, unsubscribeUrl?: string): string {
  const unsub = unsubscribeUrl || '{{unsubscribe_url}}'
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${EMAIL_STYLES}</style>
</head>
<body>
  <div class="container">
    <div class="header-bar"></div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      Concussion Education Australia &middot; Endorsed by Osteopathy Australia<br>
      Melbourne, VIC, Australia<br>
      <a href="https://portal.concussion-education-australia.com?utm_source=email&utm_medium=email&utm_campaign=footer" style="color: #94a3b8;">portal.concussion-education-australia.com</a><br>
      <a href="${unsub}" style="color: #94a3b8; font-size: 11px;">Unsubscribe from this sequence</a>
    </div>
  </div>
</body>
</html>`
}

/**
 * Post-Purchase Onboarding Sequence
 *
 * Sent to paid users (online-only or full-course) after purchase.
 * Goal: Get them to complete their first module within 48 hours (highest correlation with course completion).
 * Triggered by createdAt on users with accessLevel !== 'preview'.
 */
export const POST_PURCHASE_SEQUENCE = [
  // DAY 0 - Welcome + First Module Push (sent by webhook magic link, this is the Day 1 follow-up)
  {
    day: 1,
    subject: 'Your course is ready — start with Module 1',
    accessLevels: ['online-only', 'full-course'] as const,
    template: (name: string, loginLink: string) => emailShell(`
      <h2>Welcome aboard, ${escapeHtml(name.split(' ')[0])}!</h2>
      <p>Your Concussion Management course is ready and waiting. Students who start within the first 48 hours are <strong>3x more likely to complete the full course</strong>.</p>
      <p>Module 1 takes about 75 minutes and covers the foundational neuroscience of concussion — the framework everything else builds on.</p>
      <center><a href="${utm(loginLink, 'post_purchase_day1', 'start_module1')}" class="cta-btn">Start Module 1 Now</a></center>
      <div class="callout">
        <strong>Quick tip:</strong> Each module builds on the previous one. Complete them in order for the best learning experience.
      </div>
      <p>If you have any questions as you work through the course, just hit reply — I read every message.</p>
      <div class="sig">
        Zac Lewis<br>
        Concussion Education Australia
      </div>
    `),
  },
  // DAY 3 - Progress Check
  {
    day: 3,
    subject: 'How are you going with the course?',
    accessLevels: ['online-only', 'full-course'] as const,
    template: (name: string, loginLink: string) => emailShell(`
      <h2>Hi ${escapeHtml(name.split(' ')[0])},</h2>
      <p>Just checking in — have you had a chance to get started?</p>
      <p>The first 3 modules cover the clinical foundations:</p>
      <ol>
        <li><strong>Module 1:</strong> Concussion neuroscience and pathophysiology</li>
        <li><strong>Module 2:</strong> Concussion diagnosis and initial assessment</li>
        <li><strong>Module 3:</strong> Practical assessment and acute concussion management</li>
      </ol>
      <p>Each module takes about 60–90 minutes. By the end of Module 3, you'll have a solid clinical framework for concussion recognition, diagnosis, and acute management.</p>
      <center><a href="${utm(loginLink, 'post_purchase_day3', 'continue_course')}" class="cta-btn">Open Module 1: Concussion Neuroscience</a></center>
      <p class="ps">P.S. Your course has lifetime access — no pressure, but momentum matters. Clinicians who finish within the first two weeks report the highest confidence gains.</p>
      <div class="sig">Zac</div>
    `),
  },
  // DAY 7 - Midpoint Motivation
  {
    day: 7,
    subject: 'You\'re halfway to 8 CPD hours',
    accessLevels: ['online-only', 'full-course'] as const,
    template: (name: string, loginLink: string) => emailShell(`
      <h2>Hi ${escapeHtml(name.split(' ')[0])},</h2>
      <p>One week in — how's it going? Whether you've completed 1 module or 5, you're making progress.</p>
      <p>The modules coming up are where clinicians tell me they get the most practical value:</p>
      <ul>
        <li><strong>Module 5 — Multidisciplinary Management:</strong> Team-based concussion care and the practical approaches most clinicians haven't been trained on</li>
        <li><strong>Module 6 — Return to Play, Work & School:</strong> Staged progression protocols and clearance criteria</li>
        <li><strong>Module 7 — Rehabilitation by Phenotype:</strong> Targeted treatment strategies for each concussion subtype</li>
      </ul>
      <p>Complete all 8 modules and you'll earn your <strong>8 CPD hour certificate</strong> — automatically generated and ready to download.</p>
      <center><a href="${utm(loginLink, 'post_purchase_day7', 'keep_going')}" class="cta-btn">Open Module 5: Multidisciplinary Management</a></center>
      <div class="sig">Zac</div>
    `),
  },
  // DAY 14 - Module 7 Highlight
  {
    day: 14,
    subject: 'The module clinicians say changes their practice',
    accessLevels: ['online-only', 'full-course'] as const,
    template: (name: string, loginLink: string) => emailShell(`
      <h2>Hi ${escapeHtml(name.split(' ')[0])},</h2>
      <p>Two weeks in — wherever you're up to, I wanted to flag <strong>Module 7: Rehabilitation by Phenotype</strong>.</p>
      <p>This is the module clinicians consistently say changed how they manage concussion. Instead of generic "rest and wait," you'll learn targeted protocols for each concussion subtype:</p>
      <ul>
        <li><strong>Vestibular:</strong> VOR exercises, habituation, BPPV repositioning</li>
        <li><strong>Cervicogenic:</strong> C1-C2 mobilisation, deep neck flexor retraining</li>
        <li><strong>Autonomic:</strong> Sub-symptom threshold exercise prescription using the Buffalo Treadmill Test</li>
        <li><strong>Migraine:</strong> Acute and preventive management strategies</li>
      </ul>
      <p>It's the bridge between understanding concussion and actually treating it.</p>
      <center><a href="${utm(loginLink, 'post_purchase_day14', 'continue_course')}" class="cta-btn">Open Module 7: Phenotype Rehab</a></center>
      <div class="sig">Zac</div>
    `),
  },
  // DAY 21 - Completion Push
  {
    day: 21,
    subject: 'Your CPD certificate is waiting',
    accessLevels: ['online-only', 'full-course'] as const,
    template: (name: string, loginLink: string) => emailShell(`
      <h2>Hi ${escapeHtml(name.split(' ')[0])},</h2>
      <p>Quick reminder: once you complete all 8 modules, your <strong>8 CPD hour certificate</strong> is automatically generated and ready to download from your dashboard.</p>
      <p>Each module takes 45-60 minutes. Most clinicians finish over a few sittings — and you have lifetime access, so there's no deadline.</p>
      <p>But if you're close, finishing this week means the material is fresh and ready to apply in clinic.</p>
      <center><a href="${utm(loginLink, 'post_purchase_day21', 'finish_course')}" class="cta-btn">Finish Your Course</a></center>
      <div class="sig">Zac</div>
    `),
  },
  // DAY 30 - Referral Ask
  {
    day: 30,
    subject: 'Know a colleague who manages concussions?',
    accessLevels: ['online-only', 'full-course'] as const,
    template: (name: string, loginLink: string) => emailShell(`
      <h2>Hi ${escapeHtml(name.split(' ')[0])},</h2>
      <p>You've been with the course for a month now. If you've found the content valuable, I have a small ask:</p>
      <p><strong>Do you know a colleague who would benefit from this training?</strong></p>
      <p>Concussion management is one of those areas where most clinicians feel undertrained — and a recommendation from a trusted colleague goes further than any ad I could run.</p>
      <p>If someone comes to mind, you can forward this email or share the link:</p>
      <center><a href="${utm('https://portal.concussion-education-australia.com/pricing', 'post_purchase_day30', 'share')}" class="cta-secondary">Share the Course</a></center>
      <p>Thanks for being part of this community. If you have any feedback on the course, I'd genuinely love to hear it — just reply.</p>
      <div class="sig">
        Zac Lewis<br>
        Concussion Education Australia
      </div>
      <p class="ps">P.S. This is the last onboarding email. You'll only hear from us for clinical updates or workshop logistics going forward.</p>
    `),
  },
]

/**
 * Abandoned Checkout Recovery Sequence
 *
 * Sent to users who started checkout but didn't complete payment.
 * 3-email sequence at specific intervals after abandonment.
 */
export const ABANDONED_CHECKOUT_SEQUENCE = [
  // Email 1 — 1 hour after abandonment
  {
    hoursAfter: 1,
    subject: 'You left something behind',
    // recoveryUrl: Stripe-hosted link that re-opens the exact abandoned
    // checkout (same product/price/discounts, valid 30 days). Falls back to
    // /pricing for sessions created before recovery was enabled.
    template: (name: string, recoveryUrl?: string) => emailShell(`
      <h2>Hi${name ? ` ${escapeHtml(name.split(' ')[0])}` : ''},</h2>
      <p>Looks like you started enrolling in the Concussion Management course but didn't finish.</p>
      <p>No worries — your spot is still available. If you ran into a technical issue or had questions, just reply to this email.</p>
      <center><a href="${recoveryUrl || utm('https://portal.concussion-education-australia.com/pricing', 'abandoned_1h', 'complete_enrolment')}" class="cta-btn">Complete Your Enrolment</a></center>
      <div class="callout">
        <strong>What you'll get:</strong><br><br>
        &#8226; 8 online modules with lifetime access<br>
        &#8226; ${CONFIG.COURSE.ONLINE_CPD_POINTS} AHPRA-aligned CPD hours (${CONFIG.COURSE.TOTAL_CPD_POINTS} with workshop)<br>
        &#8226; Clinical Toolkit: referral templates, RTP forms, clearance letters<br>
        &#8226; Endorsed by Osteopathy Australia
      </div>
      <div class="sig">Zac Lewis<br>Concussion Education Australia</div>
    `),
  },
  // Email 2 — 24 hours after abandonment
  {
    hoursAfter: 24,
    subject: 'Still thinking it over?',
    template: (name: string, recoveryUrl?: string) => emailShell(`
      <h2>Hi${name ? ` ${escapeHtml(name.split(' ')[0])}` : ''},</h2>
      <p>I wanted to follow up in case you had questions about the course.</p>
      <p>Here's what clinicians ask most often:</p>
      <p><strong>"Is this relevant for physios/GPs/exercise physiologists?"</strong><br>
      Yes — the curriculum covers SCAT6, VOMS, BESS, and return-to-play protocols used across all allied health disciplines. It's endorsed by Osteopathy Australia but designed for any clinician managing concussion.</p>
      <p><strong>"How long does it take?"</strong><br>
      The 8 online modules take approximately 8 hours total. Most clinicians complete them across a few sittings. You have lifetime access, so there's no rush.</p>
      <p><strong>"What if I want to add the workshop later?"</strong><br>
      Start with the online course ($${CONFIG.COURSE.PRICE_ONLINE}) and upgrade to include the hands-on workshop later — you'll only pay the difference.</p>
      <center><a href="${recoveryUrl || utm('https://portal.concussion-education-australia.com/pricing', 'abandoned_24h', 'view_options')}" class="cta-btn">View Course Options</a></center>
      <div class="sig">Zac</div>
    `),
  },
  // Email 3 — 72 hours after abandonment (final)
  {
    hoursAfter: 72,
    subject: 'Concussion Clinical Mastery — the details, in one place',
    template: (name: string, recoveryUrl?: string) => emailShell(`
      <h2>Hi${name ? ` ${escapeHtml(name.split(' ')[0])}` : ''},</h2>
      <p>You started enrolling but didn't finish. Here's the course, laid out plainly:</p>
      <ul>
        <li><strong>What it covers:</strong> recognition and red flags, VOMS and BESS, staged return-to-play, and rehab matched to the concussion phenotype.</li>
        <li><strong>Format:</strong> 8 online modules, 8 CPD hours, endorsed by Osteopathy Australia. Lifetime access, self-paced.</li>
        <li><strong>Cost:</strong> $${CONFIG.COURSE.PRICE_ONLINE} online. Add the hands-on workshop any time — you only pay the difference.</li>
        <li><strong>Reimbursement:</strong> tax invoice + CPD certificate included; most clinicians pay $0 out of pocket.</li>
        <li><strong>Guarantee:</strong> 7-day money-back, no questions.</li>
      </ul>
      <center><a href="${recoveryUrl || utm('https://portal.concussion-education-australia.com/pricing', 'abandoned_72h', 'resume')}" class="cta-btn">Finish enrolling</a></center>
      <p class="ps">P.S. The SCAT6 tools and free course are yours to keep regardless.</p>
      <div class="sig">Zac Lewis<br>Concussion Education Australia</div>
    `),
  },
]

/**
 * Pre-Workshop Prep Emails
 *
 * Sent to full-course students before their workshop date.
 * Helps reduce no-shows and builds anticipation.
 */
export const PRE_WORKSHOP_SEQUENCE = [
  // 7 days before workshop
  {
    daysBefore: 7,
    subject: 'Your workshop is one week away — here\'s how to prepare',
    template: (name: string, workshopCity: string, workshopDate: string, loginLink?: string) => emailShell(`
      <h2>Hi ${escapeHtml(name.split(' ')[0])},</h2>
      <p>Your hands-on concussion workshop in <strong>${workshopCity}</strong> is one week away (<strong>${workshopDate}</strong>).</p>
      <p><strong>To get the most from the day, please complete:</strong></p>
      <ol>
        <li>All 8 online modules (the workshop builds directly on this content)</li>
        <li>Review the SCAT6 and SCOAT6 forms — you'll be administering them in person</li>
      </ol>
      <div class="callout">
        <strong>What to bring:</strong><br><br>
        &#8226; Laptop or tablet (for referencing digital materials)<br>
        &#8226; Comfortable clothes (you'll be practising physical assessments)<br>
        &#8226; A pen and your favourite clinical notebook
      </div>
      <p>Final venue directions and parking entrance details are in your day-before reminder email.</p>
      <center><a href="${utm(loginLink || 'https://portal.concussion-education-australia.com/login', 'workshop_7d', 'complete_modules')}" class="cta-btn">Complete Your Online Modules</a></center>
      <div class="sig">Zac</div>
    `),
  },
  // 1 day before workshop
  {
    daysBefore: 1,
    subject: 'Tomorrow\'s workshop — everything you need to know',
    template: (name: string, workshopCity: string, workshopDate: string, _loginLink?: string) => emailShell(`
      <h2>See you tomorrow, ${escapeHtml(name.split(' ')[0])}!</h2>
      <p>Your concussion workshop in <strong>${workshopCity}</strong> is tomorrow (<strong>${workshopDate}</strong>).</p>
      <div class="callout">
        <strong>Workshop details:</strong><br><br>
        &#8226; <strong>Time:</strong> 8:00 AM — 4:00 PM<br>
        &#8226; <strong>Location:</strong> ${workshopCity} (check your booking confirmation for venue address)<br>
        &#8226; <strong>What to bring:</strong> Laptop/tablet, comfortable clothes, pen<br>
        &#8226; <strong>Lunch:</strong> Provided
      </div>
      <p><strong>What we'll cover hands-on:</strong></p>
      <ul>
        <li>SCAT6 administration — paired practice with real-time feedback</li>
        <li>VOMS (Vestibular/Ocular Motor Screening) — the assessment most clinicians haven't been trained on</li>
        <li>BESS (Balance Error Scoring System) — scoring calibration exercises</li>
        <li>Clinical case studies — group discussion and decision-making frameworks</li>
      </ul>
      <p>You'll earn <strong>6 additional CPD hours</strong> (for a total of 14) upon completion.</p>
      <p>Questions? Reply to this email or text me on the day.</p>
      <div class="sig">Zac Lewis<br>Concussion Education Australia</div>
    `),
  },
]

export const SCAT_MASTERY_SEQUENCE = [
  // DAY 0 - Lead Magnet Delivery (forms + course access)
  // NOTE: Day 0 welcome email is sent by signup-free API. Cron skips day 0.
  {
    day: 0,
    subject: 'Module 1 is ready — 20 minutes to confident SCAT6 use',
    template: (name: string, loginLink: string) => emailShell(`
      <p>Hi ${escapeHtml(name.split(' ')[0])},</p>
      <p>Module 1 is ready. It takes about 20 minutes and covers the rule most clinicians get wrong: <strong>when to use SCAT6 vs SCOAT6</strong>.</p>
      <p>Using the wrong tool at the wrong time isn't just poor practice &mdash; it's a failure of standard of care with medicolegal consequences. Module 1 covers the distinction, red flag recognition, and when to refer.</p>
      <center><a href="${utm(loginLink, 'scat_mastery_day0', 'start_module1')}" class="cta-btn">Start Module 1 (20 min)</a></center>
      <div class="callout">
        <strong>What you'll cover:</strong><br><br>
        &#8226; SCAT6 vs SCOAT6 &mdash; which tool, when, and why<br>
        &#8226; Red flags that trigger immediate referral<br>
        &#8226; Medico-legal documentation that protects you
      </div>
      <p>Your fillable SCAT6 and SCOAT6 forms are also ready in the <a href="${utm('https://portal.concussion-education-australia.com/scat-forms', 'scat_mastery_day0', 'download_forms')}">downloads section</a>.</p>
      <p>Questions? Just reply &mdash; I read every message.</p>
      <div class="sig">
        Zac Lewis<br>
        Osteopath &middot; Founder, Concussion Education Australia
      </div>
    `),
  },

  // WEEK 1 (Day 3) - Module 1 nudge (not "did you finish the course")
  {
    day: 3,
    subject: 'The SCAT6-vs-SCOAT6 distinction most clinicians get wrong',
    template: (name: string, loginLink: string) => emailShell(`
      <p>Hi ${escapeHtml(name.split(' ')[0])},</p>
      <p>Quick check &mdash; have you had a chance to start Module 1?</p>
      <p>It takes 20 minutes and covers <strong>the SCAT6 vs SCOAT6 distinction</strong> &mdash; which tool to use, when, and the medicolegal reasons it matters. Most clinicians haven't been taught this explicitly.</p>
      <p>You'll also cover red flag recognition and the three referral triggers every clinician should know before Saturday sport.</p>
      <center><a href="${utm(loginLink, 'scat_mastery_day3', 'start_module1')}" class="cta-btn">Start Module 1 (20 min)</a></center>
      <div class="sig">Zac</div>
    `),
  },

  // WEEK 2 (Day 7) - Clinical case study + full-price upgrade CTA (active users)
  // NOTE: Inactive users (never logged in) get FREE_USER_REENGAGEMENT instead (handled by cron)
  {
    day: 7,
    subject: 'Would you clear this patient to play Saturday?',
    template: (name: string, loginLink: string) => emailShell(`
      <h2>Hi ${escapeHtml(name.split(' ')[0])},</h2>
      <p>Quick scenario:</p>
      <div style="background: #f8fafc; padding: 18px 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 16px 0; font-size: 14px;">
        <strong>16-year-old male rugby player</strong><br>
        Day 5 post-collision. &ldquo;Felt fine&rdquo; initially. Now reports intermittent headache and trouble concentrating in class.<br><br>
        <strong>Parents:</strong> &ldquo;He seems fine &mdash; he wants to play this weekend.&rdquo;<br>
        <strong>Coach:</strong> &ldquo;Finals are Saturday. He passed the sideline check.&rdquo;
      </div>
      <p>What would you do? Clear him? Bench him? What documentation protects you if something goes wrong?</p>
      <p>This exact scenario comes up in the SCAT6 Mastery course &mdash; and the clinical reasoning behind the right decision is worth the 8 minutes it takes to work through.</p>
      <center><a href="${utm(loginLink, 'scat_mastery_day7', 'case_study')}" class="cta-btn">Work Through This Case</a></center>
      <p style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0;">If you're finding the SCAT6 course useful, the full Concussion Management course covers VOMS, BESS, return-to-play protocols, and rehabilitation by phenotype &mdash; 8 modules, 8 CPD hours.</p>
      <center><a href="${utm('https://portal.concussion-education-australia.com/pricing', 'scat_mastery_day7', 'see_course')}" class="cta-secondary">See Full Course &mdash; $${CONFIG.COURSE.PRICE_ONLINE}</a></center>
      <div class="sig">Zac</div>
    `),
  },

  // DAY 10 - Promo code (ONLY sent to users with 3+ modules completed — gated by cron)
  // Users with <3 modules get SCAT_DAY10_ENGAGEMENT instead
  {
    day: 10,
    subject: 'You earned it — here\'s $50 off the full course',
    template: (name: string, upgradeLink: string, expiryDate?: string) => emailShell(`
      <h2>Hi ${escapeHtml(name.split(' ')[0])},</h2>
      <p>You've been working through the SCAT6 Mastery course &mdash; great to see you investing in your concussion knowledge.</p>
      <p>As a thank you, here's <strong>$50 off</strong> the full Concussion Management course:</p>
      <div class="callout-warn">
        <strong>Your code: ${CONFIG.COURSE.PROMO_CODE}</strong><br><br>
        $50 off the online course at checkout.<br><br>
        <strong>Expires: ${expiryDate || 'in 72 hours'}</strong>
      </div>
      <p>The full course picks up where SCAT6 Mastery leaves off &mdash; 8 modules covering concussion pathophysiology, VOMS, BESS, return-to-play protocols, and rehabilitation by phenotype. Plus the option to add a hands-on workshop day.</p>
      <center><a href="${utm(upgradeLink + (upgradeLink.includes('?') ? '&' : '?') + 'promo=' + CONFIG.COURSE.PROMO_CODE, 'scat_mastery_day10', 'promo_code')}" class="cta-btn">Use SCAT6 — A$${CONFIG.COURSE.PRICE_ONLINE - CONFIG.COURSE.SCAT_DISCOUNT_AUD} instead of A$${CONFIG.COURSE.PRICE_ONLINE}</a></center>
      <div class="sig">
        Zac Lewis<br>
        Concussion Education Australia
      </div>
    `),
  },

  // WEEK 3 (Day 14) - Introduce full course: 16 CPD hours breakdown
  {
    day: 14,
    subject: '16 CPD hours — here\'s the full breakdown',
    template: (name: string, upgradeLink: string) => emailShell(`
      <h2>Hi ${escapeHtml(name.split(' ')[0])},</h2>
      <p>The SCAT6 Mastery course covers the essentials. If you want to go deeper, here's what the full Concussion Management course covers:</p>
      <p><strong>8 online modules (8 CPD hours):</strong></p>
      <ol>
        <li>Concussion pathophysiology &mdash; the neurometabolic cascade and mechanisms</li>
        <li>Diagnosis &amp; initial assessment &mdash; SCAT6 and clinical tools</li>
        <li>Practical assessment &amp; acute management &mdash; hands-on clinical skills</li>
        <li>Persistent post-concussive symptoms &amp; long-term management</li>
        <li>Multidisciplinary concussion management &mdash; team-based care</li>
        <li>Return to play, work, and school &mdash; staged progression protocols</li>
        <li>Rehabilitation pathways by phenotype &mdash; targeted treatment strategies</li>
        <li>Legal, ethical, communication &amp; documentation</li>
      </ol>
      <p><strong>+ Full-day hands-on workshop (8 CPD hours):</strong></p>
      <ul>
        <li>Administer SCAT6, VOMS, and BESS on real subjects with expert feedback</li>
        <li>Clinical case discussions with other practitioners</li>
        <li>Small group &mdash; max 12 participants</li>
      </ul>
      <div class="callout">
        <span class="badge">Endorsed by Osteopathy Australia</span><br>
        Designed for physios, osteopaths, chiropractors, GPs, exercise physiologists, and sports medicine doctors.
      </div>
      ${nextWorkshopCallout()}
      <center><a href="${utm(upgradeLink, 'scat_mastery_day14', 'see_course')}" class="cta-btn">See Full Course</a></center>
      <p style="text-align: center; font-size: 13px; color: #64748b; margin-top: 4px;">Online from $${CONFIG.COURSE.PRICE_ONLINE} &middot; Online + workshop $${CONFIG.COURSE.PRICE_REGULAR.toLocaleString('en-AU')}</p>
      <div class="sig">Zac</div>
    `),
  },

  // WEEK 5 (Day 28) - Last chance promo with hard 72h deadline
  {
    day: 28,
    subject: '$50 SCAT discount — closes Friday',
    template: (name: string, upgradeLink: string, expiryDate?: string) => emailShell(`
      <h2>Hi ${escapeHtml(name.split(' ')[0])},</h2>
      <p>This is the last time I'll send this offer.</p>
      <div class="callout-warn">
        <strong>Code: ${CONFIG.COURSE.PROMO_CODE}</strong> &mdash; $50 off the online course<br><br>
        <strong>Expires: ${expiryDate || 'in 72 hours'}</strong>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
        <tr style="border-bottom: 2px solid #e2e8f0; background: #f8fafc;">
          <td style="padding: 12px 16px; font-weight: 700;">Option</td>
          <td style="padding: 12px 16px; font-weight: 700; text-align: right;">Price</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 14px 16px;"><strong>Online Course</strong><br><span style="font-size: 13px; color: #64748b;">8 modules &middot; 8 CPD hours &middot; Lifetime access</span></td>
          <td style="padding: 14px 16px; text-align: right; font-weight: 700; white-space: nowrap;"><s style="color:#94a3b8;">$${CONFIG.COURSE.PRICE_ONLINE}</s> $${CONFIG.COURSE.PRICE_ONLINE - 50}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9; background: #f0fdfa;">
          <td style="padding: 14px 16px;"><strong>Complete Course</strong><br><span style="font-size: 13px; color: #64748b;">Online + workshop &middot; 16 CPD hours</span></td>
          <td style="padding: 14px 16px; text-align: right; font-weight: 700; white-space: nowrap;">$${CONFIG.COURSE.PRICE_REGULAR.toLocaleString('en-AU')}</td>
        </tr>
      </table>
      <center><a href="${utm(upgradeLink + (upgradeLink.includes('?') ? '&' : '?') + 'promo=' + CONFIG.COURSE.PROMO_CODE, 'scat_mastery_day28', 'last_chance')}" class="cta-btn">Use SCAT6 — A$${CONFIG.COURSE.PRICE_ONLINE - CONFIG.COURSE.SCAT_DISCOUNT_AUD} instead of A$${CONFIG.COURSE.PRICE_ONLINE}</a></center>
      ${nextWorkshopCallout()}
      <p class="ps">P.S. You can start with the online course and upgrade to include the workshop later &mdash; you'll only pay the difference.</p>
      <div class="sig">Zac</div>
    `),
  },

  // WEEK 7 (Day 42) - Final email, then stop
  {
    day: 42,
    subject: 'Your concussion CPD options — final summary',
    template: (name: string, upgradeLink: string) => emailShell(`
      <h2>Hi ${escapeHtml(name.split(' ')[0])},</h2>
      <p>Last email in this series — your options for the full course, in one place:</p>
      <ul>
        <li><strong>Online Course ($${CONFIG.COURSE.PRICE_ONLINE}):</strong> 8 modules, 8 CPD hours, lifetime access — the full workflow beyond the SCAT6: VOMS, BESS, staged return-to-play, phenotype-based rehab.</li>
        <li><strong>Complete Course ($${CONFIG.COURSE.PRICE_REGULAR.toLocaleString('en-AU')}):</strong> everything online, plus a hands-on full-day workshop — 16 CPD hours.</li>
      </ul>
      <p>Both include the clinical toolkit, reference repository, and CPD certificate. Tax invoice provided — most clinicians pay $0 out of pocket. 7-day money-back guarantee.</p>
      ${nextWorkshopCallout()}
      <center><a href="${utm(upgradeLink, 'scat_mastery_day42', 'choose_option')}" class="cta-btn">Compare online vs. workshop</a></center>
      <p style="font-size: 14px; color: #475569; margin-top: 20px;">Questions? Just reply &mdash; I read every message.</p>
      <div class="sig">
        Zac Lewis<br>
        Founder, Concussion Education Australia
      </div>
      <p class="ps">P.S. No more sales emails from me after this. You'll only hear from us for clinical updates or resources you've requested.</p>
    `),
  },
]

// ─── Post-Completion Upsell (Highest-Intent Moment) ─────────────────────────

/**
 * Sent after a free-course user completes all 3 SCAT modules.
 * Triggered from POST /api/certificate (immediate) + cron fallback.
 * Uses existing SCAT6 promo code ($50 off).
 */
export const SCAT_COMPLETION_UPSELL = {
  subject: "You've completed SCAT6 Mastery — here's what's next",
  template: (name: string, pricingLink: string) => emailShell(`
    <h2>Congratulations, ${escapeHtml(name.split(' ')[0])}!</h2>
    <p>You've finished the SCAT6 Mastery course &mdash; that puts you ahead of most clinicians when it comes to SCAT6 administration.</p>
    <p>The online course picks up where SCAT6 Mastery leaves off &mdash; 8 modules covering the clinical knowledge you need to confidently manage concussion:</p>
    <ul>
      <li><strong>Concussion pathophysiology</strong> &mdash; the neurometabolic cascade and injury mechanisms</li>
      <li><strong>Persistent post-concussive symptoms</strong> &mdash; when recovery stalls and what to do about it</li>
      <li><strong>Return-to-play, work &amp; school</strong> &mdash; staged protocols, clearance criteria, and the documentation that protects you</li>
      <li><strong>Rehabilitation by phenotype</strong> &mdash; targeted protocols for vestibular, autonomic, migraine, and cervicogenic subtypes</li>
      <li><strong>Legal, ethical &amp; communication</strong> &mdash; medico-legal frameworks for concussion management</li>
    </ul>
    <div class="callout">
      <strong>Your code: ${CONFIG.COURSE.PROMO_CODE}</strong><br><br>
      Use code <strong>${CONFIG.COURSE.PROMO_CODE}</strong> at checkout for $50 off the online modules.
    </div>
    <center><a href="${utm(pricingLink + (pricingLink.includes('?') ? '&' : '?') + 'promo=' + CONFIG.COURSE.PROMO_CODE, 'scat_completion_upsell', 'upgrade_now')}" class="cta-btn">See the Online Course</a></center>
    <p style="text-align: center; font-size: 13px; color: #64748b; margin-top: 4px;">$${CONFIG.COURSE.PRICE_ONLINE} &middot; 8 online modules &middot; 8 CPD hours &middot; Lifetime access</p>
    ${nextWorkshopCallout()}

    <!-- Short specialty courses are launching — capture intent via the poll until they ship -->
    <div style="margin: 32px 0 16px 0; padding-top: 24px; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">
        Or — short specialty courses are launching soon
      </p>
      <p style="margin: 0 0 16px 0; font-size: 14px; color: #475569;">
        We're rolling out short courses (60-90 min, A$97-147) on the topics clinicians ask for most. Vote on what gets built first — voters get 40% off the winner at launch.
      </p>
      <p style="margin: 0; font-size: 13px; color: #475569; text-align: center;">
        <a href="${utm('https://portal.concussion-education-australia.com/courses/poll', 'scat_completion_upsell', 'vote_next_course')}" style="color: #0d9488; font-weight: 600;">Vote on the next CEA course →</a>
      </p>
    </div>

    <p class="ps">P.S. If you want hands-on clinical skills too (VOMS, BESS, SCAT6 administration), you can add the in-person workshop later &mdash; you'll only pay the difference.</p>
    <div class="sig">
      Zac Lewis<br>
      Concussion Education Australia
    </div>
  `),
}

// ─── Workshop Threshold Sequences ────────────────────────────────────────────

/**
 * Workshop Reservation Email — Day 1 after full-course purchase
 * Replaces generic Day 1 onboarding for full-course users.
 */
export const WORKSHOP_RESERVATION_EMAIL = {
  day: 1,
  subject: 'Your spot is reserved — here\'s what happens next',
  template: (name: string, loginLink: string, city: string, count: number, threshold: number) => emailShell(`
    <h2>Welcome aboard, ${escapeHtml(name.split(' ')[0])}!</h2>
    <p>Your spot in <strong>${city}</strong> is reserved. Here's how this works:</p>
    <div class="callout">
      <strong>How workshop dates are confirmed:</strong><br><br>
      We confirm a date once <strong>${threshold} clinicians</strong> are registered per city. ${city} currently has <strong>${count} of ${threshold}</strong> spots filled.<br><br>
      Once the threshold is met, you'll receive at least <strong>6 weeks' notice</strong> before your workshop date.
    </div>
    <p>In the meantime, start your online modules — they're the foundation for the hands-on day:</p>
    <center><a href="${utm(loginLink, 'workshop_reservation_day1', 'start_module1')}" class="cta-btn">Start Module 1 Now</a></center>
    <p><strong>Quick tip:</strong> Students who complete Module 1 in the first 48 hours are 3x more likely to finish the full course.</p>
    <p>Questions? Just reply — I read every message.</p>
    <div class="sig">
      Zac Lewis<br>
      Concussion Education Australia
    </div>
  `),
}

/**
 * Workshop Momentum Emails — Days 7, 14, 21, 28, 58 after full-course purchase
 * Sent while city is still collecting. Stops after Day 58.
 */
export const WORKSHOP_MOMENTUM_EMAILS = [
  {
    day: 7,
    subject: (city: string, count: number, remaining: number) =>
      `${city}: ${count} registered — ${remaining} more to confirm your date`,
    template: (name: string, city: string, count: number, threshold: number, _loginLink?: string) => {
      const remaining = threshold - count
      return emailShell(`
        <h2>Hi ${escapeHtml(name.split(' ')[0])},</h2>
        <p>Quick update on your workshop city:</p>
        <div class="callout">
          <strong>${city}:</strong> ${count} of ${threshold} spots filled — ${remaining > 0 ? `${remaining} more to confirm a date` : 'threshold reached!'}<br>
        </div>
        <p>Know a colleague who manages concussions? Share the course with them — the more clinicians who register, the sooner your date is confirmed.</p>
        <center><a href="${utm('https://portal.concussion-education-australia.com/pricing', 'workshop_momentum_d7', 'share')}" class="cta-secondary">Share with a Colleague</a></center>
        <p>In the meantime, keep working through your modules — they're the foundation for the hands-on day.</p>
        <div class="sig">Zac</div>
      `)
    },
  },
  {
    day: 14,
    subject: (city: string, count: number, remaining: number) =>
      `${city}: ${count} registered — ${remaining} more to confirm your date`,
    template: (name: string, city: string, count: number, threshold: number, loginLink?: string) => {
      const remaining = threshold - count
      return emailShell(`
        <h2>Hi ${escapeHtml(name.split(' ')[0])},</h2>
        <p>Your workshop city update:</p>
        <div class="callout">
          <strong>${city}:</strong> ${count} of ${threshold} spots filled — ${remaining > 0 ? `${remaining} more needed` : 'threshold reached!'}<br>
        </div>
        <p>Have you started the online modules? Clinicians who complete them before the workshop report the highest confidence gains in their practice.</p>
        <center><a href="${utm(loginLink || 'https://portal.concussion-education-australia.com/login', 'workshop_momentum_d14', 'continue')}" class="cta-btn">Continue Your Modules</a></center>
        <div class="sig">Zac</div>
      `)
    },
  },
  {
    day: 21,
    subject: (city: string, _count?: number, _remaining?: number) =>
      `Your ${city} concussion workshop — building the next date`,
    template: (name: string, city: string, _count?: number, _threshold?: number, _loginLink?: string) => {
      return emailShell(`
        <h2>Hi ${escapeHtml(name.split(' ')[0])},</h2>
        <p>Just a note that you're on the list for the next ${city} hands-on concussion workshop — we run these as demand opens up in each city and you'll get plenty of notice once the date's confirmed.</p>
        <p>If you know anyone who'd benefit from hands-on concussion training, send them our way:</p>
        <center><a href="${utm('https://portal.concussion-education-australia.com/pricing', 'workshop_momentum_d21', 'share')}" class="cta-secondary">Share the Course</a></center>
        <div class="sig">Zac</div>
      `)
    },
  },
  {
    day: 28,
    subject: (city: string, _count?: number, _remaining?: number) =>
      `${city} concussion workshop — still on your radar?`,
    template: (name: string, city: string, _count?: number, _threshold?: number, _loginLink?: string) => {
      return emailShell(`
        <h2>Hi ${escapeHtml(name.split(' ')[0])},</h2>
        <p>Month check-in — you're still on the list for the next ${city} hands-on concussion workshop. We confirm dates as demand opens up in each city, and you'll get plenty of notice when yours lands.</p>
        <p>Know a colleague who manages concussions? Send them our way:</p>
        <center><a href="${utm('https://portal.concussion-education-australia.com/pricing', 'workshop_momentum_d28', 'share')}" class="cta-secondary">Share with a Colleague</a></center>
        <div class="sig">Zac</div>
      `)
    },
  },
  {
    day: 58,
    subject: (city: string, count: number, remaining: number) =>
      `Final check-in — ${city} needs ${remaining} more to lock in a date`,
    template: (name: string, city: string, count: number, threshold: number, _loginLink?: string) => {
      const remaining = threshold - count
      return emailShell(`
        <h2>Hi ${escapeHtml(name.split(' ')[0])},</h2>
        <p>This is my last update on workshop numbers. ${city} has <strong>${count} of ${threshold}</strong> registrants${remaining > 0 ? ` — ${remaining} more needed to confirm a date` : ''}.</p>
        <p>If you have colleagues who'd benefit from this training, now's the time to let them know. The A$${CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString('en-AU')} early-bird rate still applies for ${city} — it holds until 14 days before your city's workshop date.</p>
        <center><a href="${utm('https://portal.concussion-education-australia.com/pricing', 'workshop_momentum_d58', 'share')}" class="cta-secondary">Share the Course</a></center>
        <p class="ps">P.S. No more momentum emails from me after this one. You'll hear from us when your city's date is confirmed.</p>
        <div class="sig">Zac Lewis<br>Concussion Education Australia</div>
      `)
    },
  },
]

/**
 * Workshop Confirmed Email — sent once when city hits threshold and admin sets date
 */
export const WORKSHOP_CONFIRMED_EMAIL = {
  subject: 'Your workshop date is confirmed!',
  template: (name: string, city: string, date: string, loginLink?: string) => emailShell(`
    <h2>Great news, ${escapeHtml(name.split(' ')[0])}!</h2>
    <p>Your workshop date has been confirmed:</p>
    <div class="callout">
      <strong>${city}</strong><br>
      <strong>Date:</strong> ${date}<br>
      <strong>Time:</strong> 8:00 AM — 4:00 PM<br><br>
      Venue details will follow in a separate email.
    </div>
    <p>Make sure you've completed your online modules before the workshop — they're the foundation for everything we'll practise hands-on.</p>
    <center><a href="${utm(loginLink || 'https://portal.concussion-education-australia.com/login', 'workshop_confirmed', 'complete_modules')}" class="cta-btn">Complete Your Modules</a></center>
    <div class="sig">Zac Lewis<br>Concussion Education Australia</div>
  `),
}

/**
 * Workshop Logistics Email — 6 weeks before confirmed date
 */
/**
 * Inline HTML block for Rydges Melbourne accommodation + parking benefits.
 * Included in workshop logistics emails for Melbourne attendees. Returns
 * empty string for other cities.
 */
function rydgesBenefitsBlock(city: string): string {
  if (city.toLowerCase() !== 'melbourne') return ''
  const r = CONFIG.VENUE_BENEFITS.MELBOURNE
  return `
    <div class="callout">
      <strong>Travelling in? Venue perks at ${escapeHtml(r.hotelName)}:</strong><br><br>
      &#8226; <strong>${r.accommodationDiscountPct}% off accommodation</strong> — use code <strong>${escapeHtml(r.accommodationCode)}</strong> when booking direct at <a href="${escapeHtml(r.bookingUrl)}">${escapeHtml(r.hotelName.toLowerCase())}</a>. Good for the night before, the night of, or a multi-night stay.<br>
      &#8226; <strong>Secure on-site parking:</strong> $${r.parkingConferenceRate} conference day rate (enter before 10am, exit by 6pm). Overnight guests $${r.parkingOvernightRate}/night.<br>
      &#8226; Car park sits below the hotel with direct access to the event space. Subject to availability.
    </div>
  `
}

export const WORKSHOP_LOGISTICS_EMAIL = {
  daysBefore: 42,
  subject: 'Your workshop is 6 weeks away — what to know',
  template: (name: string, city: string, date: string, venue?: string, loginLink?: string) => emailShell(`
    <h2>Hi ${escapeHtml(name.split(' ')[0])},</h2>
    <p>Your concussion workshop in <strong>${city}</strong> is 6 weeks away (<strong>${date}</strong>).</p>
    <div class="callout">
      <strong>Workshop details:</strong><br><br>
      &#8226; <strong>Date:</strong> ${date}<br>
      &#8226; <strong>Time:</strong> 8:00 AM — 4:00 PM<br>
      ${venue ? `&#8226; <strong>Venue:</strong> ${venue}<br>` : '&#8226; <strong>Venue:</strong> Details to follow<br>'}
      &#8226; <strong>What to bring:</strong> Laptop/tablet, comfortable clothes, pen<br>
      &#8226; <strong>Lunch:</strong> Catered, included
    </div>
    <p><strong>Before the workshop, please complete:</strong></p>
    <ol>
      <li>All 8 online modules (the workshop builds directly on this content)</li>
      <li>Review the SCAT6 and SCOAT6 forms — you'll be administering them in person</li>
    </ol>
    <center><a href="${utm(loginLink || 'https://portal.concussion-education-australia.com/login', 'workshop_logistics_6w', 'complete_modules')}" class="cta-btn">Complete Your Online Modules</a></center>
    <div class="sig">Zac</div>
  `),
}

// ─── Paid User Sequences ─────────────────────────────────────────────────────

/**
 * Sent to online-only users 7 days after purchase.
 * Nudges them to consider the workshop upgrade.
 */
export const ONLINE_UPGRADE_SEQUENCE = [
  {
    day: 7,
    subject: 'How are you finding the modules so far?',
    template: (name: string, upgradeLink: string) => emailShell(`
      <h2>Hi ${escapeHtml(name.split(' ')[0])},</h2>
      <p>You're a week into the course — how's it going?</p>
      <p>By now you've likely worked through the concussion pathophysiology and diagnostic assessment modules. That's the foundation that most CPD courses stop at.</p>
      <p>What makes this training different is the practical component. The full-day workshop lets you:</p>
      <ul>
        <li>Physically administer a SCAT6 on a real subject with expert feedback</li>
        <li>Practice VOMS and BESS scoring — the assessments clinicians find hardest to learn from text alone</li>
        <li>Work through clinical scenarios with other clinicians</li>
      </ul>
      <p>You can lock in the workshop upgrade whenever you're ready &mdash; pay the difference to the A$${CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString('en-AU')} early-bird rate, nominate your city, and your date launches once enough clinicians register there. That caps off your 16 CPD hours.</p>
      ${nextWorkshopCallout()}
      <center><a href="${utm(upgradeLink, 'upgrade_nudge', 'see_workshop')}" class="cta-btn">See Workshop Options</a></center>
      <p style="font-size: 13px; color: #64748b; text-align: center;">6 extra CPD hours · Small group (max 12) · Upgrade anytime</p>
      <div class="sig">Zac</div>
      <p class="ps">P.S. Reply if you have any questions about the modules — I'm always happy to help.</p>
    `),
  },
]

/**
 * Sent to users who haven't logged in for 14+ days after purchase.
 * Re-engagement nudge.
 */
export const REENGAGEMENT_EMAIL = {
  subject: 'Your concussion modules are waiting',
  template: (name: string, loginLink: string) => emailShell(`
    <h2>Hi ${escapeHtml(name.split(' ')[0])},</h2>
    <p>Just a quick check-in — I noticed you haven't logged into your Concussion Education Australia account recently.</p>
    <p>Your modules are still there, ready when you are. Most clinicians find it easiest to do one module per sitting (about 45–60 minutes each).</p>
    <div class="callout">
      <strong>Quick tip:</strong> Modules 3 and 6 are the most clinically actionable — they cover practical assessment skills and return-to-play/work/school protocols you can use immediately.
    </div>
    <center><a href="${utm(loginLink, 'reengagement', 'continue_course')}" class="cta-btn">Continue Your Course</a></center>
    <div class="sig">Zac</div>
  `),
}

// ─── Free User Nurture Variants ─────────────────────────────────────────────

/**
 * FREE_USER_REENGAGEMENT — sent at Day 7 instead of clinical case
 * for preview users who never logged in after signup (ghosters).
 */
export const FREE_USER_REENGAGEMENT = {
  subject: 'The 20-min module on SCAT6 vs SCOAT6',
  template: (name: string, loginLink: string) => emailShell(`
    <h2>Hi ${escapeHtml(name.split(' ')[0])},</h2>
    <p>You signed up for the SCAT6 Mastery course a week ago but haven't started yet.</p>
    <p>No pressure — Module 1 takes about 20 minutes and you can pick up where you left off any time.</p>
    <div class="callout">
      <strong>What's waiting for you:</strong><br><br>
      &#8226; 3 modules covering SCAT6 and SCOAT6 essentials<br>
      &#8226; Clinical case studies and scenario-based quiz<br>
      &#8226; Digital SCAT6 and SCOAT6 forms with PDF export<br><br>
      Self-paced &middot; ~1 hour total
    </div>
    <center><a href="${utm(loginLink, 'free_reengagement_day7', 'start_now')}" class="cta-btn">Start Module 1 — It Takes 20 Minutes</a></center>
    <div class="sig">Zac</div>
  `),
}

/**
 * SCAT_COMPLETER_PERSONAL_FOLLOWUP — second-touch email for preview users
 * who completed all 3 SCAT modules but didn't convert.
 *
 * SCAT_COMPLETION_UPSELL fires immediately on completion and is overtly
 * promotional. It works for same-day converters (Brandyn) but every one
 * of the 9 other completers received it and didn't buy. Sending the
 * same pitch again won't move them.
 *
 * This is a different angle: short, plain-text feel, from Zac directly,
 * single question ('what stopped you?') framed as feedback request rather
 * than another sales push. Replies route directly to Zac and surface the
 * real friction (price, content fit, workshop city, etc.) so we can
 * actually fix the funnel instead of guessing.
 *
 * Cadence: ~14 days after SCAT completion, only if still on preview.
 */
function surveyButton(userId: string, baseUrl: string, answer: string, label: string, sublabel: string): string {
  const t = signSurveyAnswer('scat_completer_followup_v1', userId, answer)
  const href = `${baseUrl}/s/scat-followup?u=${encodeURIComponent(userId)}&a=${answer}&t=${t}`
  return `
    <tr>
      <td style="padding: 6px 0;">
        <a href="${href}" style="display: block; padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; text-decoration: none; color: #0f172a;">
          <span style="font-weight: 700; color: #0d9488; font-size: 14px;">${label}</span>
          <span style="font-size: 14px; color: #475569;"> &mdash; ${sublabel}</span>
        </a>
      </td>
    </tr>
  `
}

export const SCAT_COMPLETER_PERSONAL_FOLLOWUP = {
  subject: 'Quick one — what stopped you?',
  template: (name: string, userId: string, baseUrl: string) => emailShell(`
    <p style="font-size: 15px; margin: 0 0 14px;">Hi ${escapeHtml(name.split(' ')[0])},</p>
    <p style="font-size: 15px; margin: 0 0 14px;">You finished the SCAT6 Mastery course recently &mdash; thanks for working through it.</p>
    <p style="font-size: 15px; margin: 0 0 14px;">I wanted to ask you one thing directly, because the answer helps me make the rest of the course actually useful for clinicians like you.</p>
    <p style="font-size: 15px; margin: 0 0 18px;"><strong>You finished the first part. What stopped you taking the next step?</strong></p>
    <p style="font-size: 14px; color: #475569; margin: 0 0 10px;">Tap the closest one &mdash; one click, no form to fill in:</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; margin: 0 0 18px;">
      ${surveyButton(userId, baseUrl, 'A', 'Price', 'Course is more than I want to spend right now')}
      ${surveyButton(userId, baseUrl, 'B', 'Not sure I need it', "SCAT was useful but the rest doesn't feel relevant to my practice")}
      ${surveyButton(userId, baseUrl, 'C', 'Want the workshop', "Online alone isn't enough — need hands-on, but no date in my city yet")}
      ${surveyButton(userId, baseUrl, 'D', 'Timing', "Interested but not this month")}
      ${surveyButton(userId, baseUrl, 'E', 'Something else', "Tell me — opens a reply")}
    </table>
    <p style="font-size: 14px; color: #475569; margin: 0 0 14px;">No pitch follows. No automated sequence is triggered by this &mdash; we&rsquo;re optimising how we help clinicians upskill, and your answer shapes what we build next.</p>
    <p style="font-size: 14px; margin: 18px 0 0;">Thanks,<br>Zac</p>
    <p style="font-size: 12px; color: #94a3b8; margin: 24px 0 0;">Concussion Education Australia &middot; Melbourne, VIC</p>
  `),
}

// ─── Completer conversion — BEHAVIOUR-triggered (not survey-answer) ──────────
//
// Free-course completers (all 3 SCAT modules, still preview) get ONE targeted
// conversion email chosen by what they DID, not what they said in the survey.
// The survey promises "no automated sequence is triggered by this", so these
// branch off behaviour signals (workshop-interest / pricing-view / neither),
// keeping that promise intact. One email per user, ever (deduped in the cron).

/** Branch 1 — viewed pricing / started checkout but didn't buy. Price/value
 *  objection: restack the value, reinstate the standing $50 code, no fake
 *  scarcity. */
export const COMPLETER_CONVERT_PRICE = {
  subject: 'The concussion course — your $50 code is still active',
  template: (name: string, pricingLink: string) => {
    const discounted = CONFIG.COURSE.PRICE_ONLINE - 50
    return emailShell(`
      <h2>Hi ${escapeHtml(name.split(' ')[0])} — still weighing it up?</h2>
      <p>You finished SCAT6 Mastery and had a look at the full online course. Totally fair to take your time, so here's the honest case for it.</p>
      <p>SCAT6 tells you how to <em>assess</em>. The online course is the part that tells you what to <em>do next</em> — the bit most concussion CPD skips:</p>
      <ul>
        <li><strong>Phenotype-based rehab</strong> — vestibular, autonomic, cervicogenic and migraine subtypes, each with a targeted protocol</li>
        <li><strong>VOMS &amp; BESS</strong> — the assessments that separate a confident clinician from a guessing one</li>
        <li><strong>Return-to-play, work &amp; school</strong> — staged protocols and the documentation that protects you medico-legally</li>
        <li><strong>Persistent symptoms</strong> — when recovery stalls and how to intervene</li>
      </ul>
      <div class="callout">
        <strong>Your code ${CONFIG.COURSE.PROMO_CODE} is still active</strong> — $50 off the online modules brings it to <strong>A$${discounted}</strong> (was A$${CONFIG.COURSE.PRICE_ONLINE}). ${escapeHtml(afterpayInstalment(discounted))}
      </div>
      <center><a href="${utm(pricingLink + (pricingLink.includes('?') ? '&' : '?') + 'promo=' + CONFIG.COURSE.PROMO_CODE, 'completer_convert_price', 'apply_code')}" class="cta-btn">Apply my code &amp; enrol</a></center>
      <p style="text-align: center; font-size: 13px; color: #64748b; margin-top: 4px;">8 online modules &middot; 8 CPD hours &middot; lifetime access &middot; Osteopathy Australia endorsed</p>
      <p class="ps">P.S. Prefer the hands-on day too? You can add the in-person workshop later and only pay the difference.</p>
      <div class="sig">Zac Lewis<br>Concussion Education Australia</div>
    `)
  },
}

/** Branch 2 — completed but never opened pricing. Awareness/relevance: they
 *  may not know what the paid course even adds. */
export const COMPLETER_CONVERT_RELEVANCE = {
  subject: "You've got SCAT6 down — here's what comes after",
  template: (name: string, pricingLink: string) => emailShell(`
    <h2>Nice work finishing SCAT6 Mastery, ${escapeHtml(name.split(' ')[0])}</h2>
    <p>That covers the assessment side. Most clinicians tell us the harder part is what happens <em>after</em> the sideline test — the management and rehab that actually gets someone back to sport, work and school safely.</p>
    <p>That's the whole online course. Eight modules built for exactly that gap:</p>
    <ul>
      <li>Concussion pathophysiology — the neurometabolic cascade in plain clinical terms</li>
      <li>Persistent post-concussive symptoms — recognising and managing the stalled recovery</li>
      <li>Phenotype-specific rehabilitation — vestibular, autonomic, cervicogenic, migraine</li>
      <li>Return-to-play, work &amp; school — staged protocols and defensible documentation</li>
    </ul>
    <center><a href="${utm(pricingLink, 'completer_convert_relevance', 'see_course')}" class="cta-btn">See the online course</a></center>
    <p style="text-align: center; font-size: 13px; color: #64748b; margin-top: 4px;">A$${CONFIG.COURSE.PRICE_ONLINE} &middot; 8 modules &middot; 8 CPD hours &middot; lifetime access &middot; Osteopathy Australia endorsed</p>
    <div class="sig">Zac Lewis<br>Concussion Education Australia</div>
  `),
}

/** Branch 3 — registered workshop interest. Point them at the pathway and let
 *  them start the online pre-work now while their city's date firms up. */
export const COMPLETER_CONVERT_WORKSHOP = {
  subject: 'The hands-on day you registered interest in',
  template: (name: string, pricingLink: string) => emailShell(`
    <h2>Hi ${escapeHtml(name.split(' ')[0])} — you flagged wanting the hands-on day</h2>
    <p>Good instinct: the practical skills (VOMS, BESS, vestibular and cervical assessment on real cases) land far better in person than on a screen.</p>
    <p>Here's how the pathway works:</p>
    <ul>
      <li><strong>8 hours online pre-work</strong> — the full course, done at your own pace (8 CPD hours)</li>
      <li><strong>1 day in person</strong> — the practical skills day (6 more CPD hours)</li>
      <li><strong>= up to 16 CPD hours</strong> total, Osteopathy Australia endorsed</li>
    </ul>
    <p>You're already on the list for your city, so you'll be first to hear when the date is confirmed. In the meantime you can start the online pre-work now — it's the same course either way, and it counts toward the 16 hours.</p>
    <center><a href="${utm(pricingLink, 'completer_convert_workshop', 'start_prework')}" class="cta-btn">Start the online course</a></center>
    <p style="text-align: center; font-size: 13px; color: #64748b; margin-top: 4px;">A$${CONFIG.COURSE.PRICE_ONLINE} online &middot; add the in-person day later for the difference</p>
    <div class="sig">Zac Lewis<br>Concussion Education Australia</div>
  `),
}

/**
 * FREE_LOGGED_IN_NO_PROGRESS — Day 7 for preview users who logged in
 * at least once but completed zero SCAT modules.
 *
 * The existing FREE_USER_REENGAGEMENT targets ghosts (never logged in)
 * with copy that assumes "you signed up but haven't started" — wrong
 * tone for someone who DID get past the magic-link round-trip and
 * landed in the dashboard. They cleared the auth hurdle but bounced
 * before opening Module 1, which is a different problem (UX confusion,
 * intimidation, distraction, etc.) and warrants different copy.
 */
export const FREE_LOGGED_IN_NO_PROGRESS = {
  subject: 'Module 1 is 20 min — here\'s the easiest path back',
  template: (name: string, loginLink: string) => emailShell(`
    <h2>Hi ${escapeHtml(name.split(' ')[0])},</h2>
    <p>I noticed you logged in but didn&rsquo;t end up starting Module 1. Curious — was it the right time, or did something stop you?</p>
    <p>If it was just &ldquo;I&rsquo;ll come back later and forgot&rdquo;, that&rsquo;s normal. Most clinicians who finish the SCAT6 Mastery course end up doing it across two short sittings. Here&rsquo;s the easiest re-entry:</p>
    <div class="callout">
      <strong>Module 1 (20 min):</strong> SCAT6 vs SCOAT6 &mdash; which tool to use, when, and the medicolegal reasons it matters. Most clinicians haven&rsquo;t been taught this distinction explicitly.<br><br>
      You&rsquo;ll come away with: the rule for which tool, three red-flag triggers for immediate referral, and the documentation pattern that protects you.
    </div>
    <center><a href="${utm(loginLink, 'free_logged_in_no_progress_d7', 'open_module1')}" class="cta-btn">Open Module 1 (20 minutes)</a></center>
    <p>If you tried to start it and something didn&rsquo;t work &mdash; broken video, page that wouldn&rsquo;t load, login that bounced &mdash; reply to this email. I&rsquo;ll fix it.</p>
    <div class="sig">Zac</div>
  `),
}

/**
 * SCAT_DAY10_ENGAGEMENT — sent at Day 10 instead of promo code
 * for preview users with fewer than 3 SCAT modules completed.
 * Encourages them to keep going rather than selling too early.
 */
export const SCAT_DAY10_ENGAGEMENT = {
  subject: 'Where did you get up to?',
  template: (name: string, loginLink: string, completedCount: number) => emailShell(`
    <h2>Hi ${escapeHtml(name.split(' ')[0])},</h2>
    <p>You've completed ${completedCount} of 3 modules in the SCAT6 Mastery course${completedCount > 0 ? ' — great start' : ''}.</p>
    <p>The next module picks up right where you left off and takes about 20 minutes.</p>
    <div class="callout">
      <strong>Coming up:</strong><br><br>
      &#8226; Red flag recognition and escalation criteria<br>
      &#8226; SCOAT6 serial monitoring and return-to-play protocols<br>
      &#8226; Clinical case studies with scenario-based decision-making
    </div>
    <center><a href="${utm(loginLink, 'scat_engagement_day10', 'continue_course')}" class="cta-btn">Continue Your Course</a></center>
    <div class="sig">Zac</div>
  `),
}

/**
 * FREE_ALMOST_DONE — sent when a preview user has completed 2 of 3 SCAT modules.
 * One-time nudge to finish the course + upsell.
 */
export const FREE_ALMOST_DONE = {
  subject: "One module left — finish your SCAT6 Mastery course",
  template: (name: string, loginLink: string) => emailShell(`
    <h2>Hi ${escapeHtml(name.split(' ')[0])},</h2>
    <p>You've completed <strong>2 of 3 modules</strong> in the SCAT6 Mastery course. One more to go &mdash; clinical case studies and a scenario-based final quiz.</p>
    <p>The final module takes about 15 minutes. It tests everything you've learned with real clinical scenarios.</p>
    <center><a href="${utm(loginLink, 'free_almost_done', 'finish_last_module')}" class="cta-btn">Finish Your Last Module</a></center>
    <p style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0;">Once you've earned your SCAT6 Mastery certificate, the full Concussion Management course takes your skills further — 8 modules covering VOMS, BESS, return-to-play protocols, and rehabilitation by phenotype. 8 additional CPD hours.</p>
    <center><a href="${utm('https://portal.concussion-education-australia.com/pricing', 'free_almost_done', 'see_full_course')}" class="cta-secondary">See Full Course &mdash; $${CONFIG.COURSE.PRICE_ONLINE}</a></center>
    <div class="sig">Zac</div>
  `),
}

/**
 * "Almost Done" Email — sent when a user has completed 7 of 8 modules.
 * One-time nudge to finish the last module and earn their certificate.
 */
// ─── Reference+Toolkit owners → course upgrade funnel ───────────────────────
// Applies to users with reference_book_purchased_at set AND accessLevel='preview'
// (i.e. they own the book but haven't bought the course). They already get
// A$100 off the course auto-applied at checkout — these emails just remind
// them it's sitting there. Sequence stops if they upgrade to online-only or
// full-course.
export const REFERENCE_UPGRADE_SEQUENCE = [
  {
    day: 2,
    subject: 'Getting the most out of your reference text',
    template: (name: string, pricingLink: string) => emailShell(`
      <h2>Hi ${escapeHtml(name.split(' ')[0])},</h2>
      <p>Hope you've had a chance to open the reference. Most clinicians who buy it tell me the same thing — it's denser than they expected. A quick map of where to start:</p>
      <ul>
        <li><strong>Ch. 1–3</strong> — neuroscience, presentation, red flags. Read first if you see acute injuries.</li>
        <li><strong>Ch. 5 + Clinical Toolkit cheat sheet</strong> — SCAT6 / VOMS in under 15 minutes. Print it.</li>
        <li><strong>Ch. 8 + Toolkit RTP/RTL/RTW ladder</strong> — when you have to write a clearance letter today.</li>
        <li><strong>Ch. 11 (PPCS)</strong> — the chapter I get the most reply-emails about.</li>
      </ul>
      <p>The text was written to stand alone — use it, apply it, see what happens in clinic.</p>
      <p class="ps">P.S. No pitch in this one. Read the book first. I'll check in again in a week.</p>
      <div class="sig">Zac</div>
    `),
  },

  {
    day: 9,
    subject: "You have A$100 credit sitting on your account",
    template: (name: string, pricingLink: string) => emailShell(`
      <h2>Hi ${escapeHtml(name.split(' ')[0])},</h2>
      <p>A week in. Quick heads-up — because you bought the Reference + Toolkit, there's an <strong>A$100 credit</strong> automatically waiting for you on the full course.</p>
      <p>No code to remember. Log in with this email and the discount is already applied at the checkout screen — you'll see the strike-through.</p>
      <div class="callout">
        <strong>What the course adds on top of the text:</strong><br>
        &#8226; 8 video modules with clinical demonstrations (the VOMS and cervical screens especially)<br>
        &#8226; Case-based walkthroughs — watch me reason through real patient presentations<br>
        &#8226; ${CONFIG.COURSE.ONLINE_CPD_POINTS} AHPRA-aligned CPD hours and a certificate<br>
        &#8226; Optional hands-on workshop day &mdash; nominate your city, the date launches when it fills (6 more CPD hours)
      </div>
      <center><a href="${utm(pricingLink, 'ref_upgrade_d9', 'bundle_credit')}" class="cta-btn">See Your Discounted Price</a></center>
      <p class="ps">P.S. The credit doesn't expire — it's tied to your account, not a code.</p>
      <div class="sig">Zac</div>
    `),
  },

  {
    day: 21,
    subject: 'Book vs. course — honest comparison',
    template: (name: string, pricingLink: string) => emailShell(`
      <h2>Hi ${escapeHtml(name.split(' ')[0])},</h2>
      <p>Clinicians ask me this weekly: "I have the book. Do I still need the course?"</p>
      <p>Honest answer — depends on how you learn.</p>
      <p><strong>You're fine with just the reference if:</strong></p>
      <ul>
        <li>You're already confident assessing and happy applying from written protocols</li>
        <li>You don't need CPD hours this cycle</li>
        <li>You rarely see concussion cases — the text is a reliable desk reference</li>
      </ul>
      <p><strong>The course pays back quickly if:</strong></p>
      <ul>
        <li>You've read the VOMS chapter and still aren't sure if you're <em>doing</em> it right (most common)</li>
        <li>You need CPD hours and want them in one structured block</li>
        <li>You want the confidence of watching it done before attempting it yourself</li>
      </ul>
      <p>With the A$100 bundle credit, the online course is <strong>A$${CONFIG.COURSE.PRICE_ONLINE - 100}</strong> — about the cost of one private consult. The full course (online + a hands-on workshop day in your nominated city) drops to <strong>A$${(CONFIG.COURSE.PRICE_REGULAR - 100).toLocaleString('en-AU')}</strong>.</p>
      <center><a href="${utm(pricingLink, 'ref_upgrade_d21', 'comparison')}" class="cta-btn">View Course Options</a></center>
      <div class="sig">Zac</div>
    `),
  },

  {
    day: 35,
    subject: "Last reminder — your A$100 credit is still there",
    template: (name: string, pricingLink: string) => emailShell(`
      <h2>Hi ${escapeHtml(name.split(' ')[0])},</h2>
      <p>Five weeks since you picked up the reference text. Final note from me on the upgrade path, then I'll leave you alone.</p>
      <p>Your A$100 Reference+Toolkit credit is still auto-applied if you ever decide to pick up the course — log in with this email, the discount appears at checkout.</p>
      ${nextWorkshopCallout()}
      <center><a href="${utm(pricingLink, 'ref_upgrade_d35', 'last_reminder')}" class="cta-btn">See Course Options</a></center>
      <p>No more sales emails from me after this one. Happy to keep sending clinical updates if you find them useful.</p>
      <p>If the book's served you and you don't need the course, that's a great outcome too.</p>
      <div class="sig">
        Zac Lewis<br>
        Concussion Education Australia
      </div>
    `),
  },
]

/**
 * Paid customer hasn't done any modules yet.
 *
 * Triggers when a user is paid (online-only / full-course) and has
 * completed 0 of the 8 main course modules N days after purchase. The
 * existing POST_PURCHASE_SEQUENCE assumes they've started — sends
 * "Keep going!" / "You're halfway!" emails to people who never opened
 * Module 1. This is the activation variant: explicit, doesn't pretend
 * they've started, leads with WHY Module 1 specifically matters.
 *
 * Day 3 cadence (chosen empirically: every paid customer in the system
 * right now is at 0/8 progress, average 12 days post-purchase, never
 * activated. Day 3 catches them before momentum dies completely).
 */
export const PAID_NO_PROGRESS_NUDGE = {
  subject: "Quick one — have you opened Module 1 yet?",
  template: (name: string, loginLink: string) => emailShell(`
    <h2>Hi ${escapeHtml(name.split(' ')[0])},</h2>
    <p>You picked up the course a few days ago and your account shows you haven't opened Module 1 yet. No judgment — life gets busy. But quick reason to prioritise it:</p>
    <p><strong>Module 1 is the only module that's a hard prerequisite for the other seven.</strong> It's the neuroscience framework everything else hangs off — the bit where the diagnostic distinctions, the rehab phenotypes, the RTP protocols all start to make sense as one connected system rather than a bunch of unrelated rules.</p>
    <p>It's 75 minutes. You can do it across two sittings. Skip it and Module 2 reads like a different language.</p>
    <center><a href="${utm(loginLink, 'paid_no_progress_d3', 'start_module_1')}" class="cta-btn">Open Module 1</a></center>
    <p>If something's stopping you — login link not working, content too dense, or you bought it and now aren't sure where to start — just reply. I'll sort it.</p>
    <div class="sig">
      Zac Lewis<br>
      Concussion Education Australia
    </div>
    <p class="ps">P.S. Lifetime access means there's no expiry, but momentum compounds — clinicians who finish Module 1 in week 1 are 3× more likely to finish the whole course.</p>
  `),
}

/**
 * MELBOURNE_WORKSHOP_PUSH — one-off broadcast to warming preview leads.
 *
 * Sent via /api/admin/melbourne-warming-push. NOT part of the automated
 * nurture cron — fires only on admin trigger. Idempotent via email_audit_log
 * key `melbourne_push_v1_${userId}`.
 *
 * Audience: preview users with 2+ SCAT modules done, signed up within 90
 * days, not unsubscribed. Goal: convert warming free-completers into
 * Melbourne 13 June 2026 paid attendees while early-bird is live.
 */
/**
 * MELBOURNE_EARLY_BIRD_LAST_CALL — final-24h urgency blast.
 *
 * Sent via /api/admin/melbourne-early-bird-last-call. NOT part of automated
 * nurture — fires only on admin trigger with explicit confirm flag.
 * Idempotent via email_audit_log key `melbourne_eb_last_call_v1_${userId}`.
 *
 * Audience: preview + online-only users with engagement signal (opened or
 * clicked any CEA email in last 60 days). Excludes already-paid Melbourne
 * attendees + unsubscribed + cold non-openers.
 *
 * Goal: convert engaged not-yet-paid users into Melbourne 13 Jun 2026
 * full-course attendees.
 *
 * RETIRED COPY (June 2026): the early-bird window closed 31 May 2026 and
 * this blast already fired. The template below is the truthful post-early-
 * bird version (regular price, no deadline) so an accidental re-trigger
 * can't quote a price we no longer charge or a deadline that has passed.
 */
export const MELBOURNE_EARLY_BIRD_LAST_CALL = {
  subject: 'Melbourne workshop — Saturday 13 June 2026',
  template: (name: string, pricingLink: string) => emailShell(`
    <p>Hi ${escapeHtml(name.split(' ')[0])},</p>
    <p>Quick heads-up since you&rsquo;ve been engaging with our content &mdash; the Melbourne Concussion Clinical Mastery workshop is locked in for <strong>Saturday 13 June 2026, Melbourne CBD (Rydges Exhibition St)</strong>.</p>
    <div class="callout">
      <strong>A$${CONFIG.COURSE.PRICE_REGULAR.toLocaleString('en-AU')} all-in</strong> &mdash; online course + full-day workshop, 16 CPD hours.
    </div>
    <ul>
      <li>16 CPD hours, AHPRA-aligned, Osteopathy Australia endorsed</li>
      <li>Full day, 8am&ndash;4pm, buffet lunch included</li>
      <li>Capped at 12 clinicians for hands-on practice time</li>
      <li>25% off Rydges accommodation for attendees travelling in</li>
    </ul>
    <center><a href="${utm(pricingLink, 'melbourne_eb_last_call_v1', 'enrol')}" class="cta-btn">Full details + enrol</a></center>
    <p>If you have any questions about whether it fits your scope or schedule, just reply.</p>
    <div class="sig">
      Zac<br>
      Concussion Education Australia
    </div>
  `),
}

export const MELBOURNE_WORKSHOP_PUSH = {
  // DEFUSED (2026-07-02, same treatment as MELBOURNE_EARLY_BIRD_LAST_CALL):
  // the 13 June 2026 Melbourne round is COMPLETED and must never be sold
  // again. The template now reads CONFIG.LOCATIONS.MELBOURNE at render time —
  // an accidental re-trigger while Melbourne isn't 'confirmed' renders the
  // truthful nominate-your-city copy with NO date, instead of pitching a
  // workshop that already ran. If a future Melbourne round is confirmed, the
  // dated branch below picks up the new config date automatically.
  subject: 'Concussion Clinical Mastery — Melbourne workshop',
  template: (name: string, pricingLink: string) => {
    const mel = CONFIG.LOCATIONS.MELBOURNE
    if (mel.status !== 'confirmed' || !mel.date) {
      return emailShell(`
    <p>Hi ${escapeHtml(name.split(' ')[0])},</p>
    <p>The hands-on Concussion Clinical Mastery workshop day runs city by city &mdash; you can enrol in the complete course now, nominate Melbourne, and the date launches once enough clinicians register there.</p>
    <ul>
      <li>16 CPD hours (8 online + 8 in-person), AHPRA-aligned, Osteopathy Australia endorsed</li>
      <li>Full day, capped at 12 clinicians for hands-on practice time</li>
      <li><strong>A$${CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString('en-AU')}</strong> early-bird &mdash; it applies now and holds until 14 days before your city&rsquo;s confirmed date (then A$${CONFIG.COURSE.PRICE_REGULAR.toLocaleString('en-AU')})</li>
    </ul>
    <p>The online course on its own is A$${CONFIG.COURSE.PRICE_ONLINE} anytime &mdash; you can upgrade to the full course later by paying the difference to the early-bird rate.</p>
    <center><a href="${utm(pricingLink, 'melbourne_push_v1', 'enrol')}" class="cta-btn">Full details + enrol</a></center>
    <p>Any questions, just reply.</p>
    <div class="sig">
      Zac<br>
      Concussion Education Australia
    </div>
  `)
    }
    return emailShell(`
    <p>Hi ${escapeHtml(name.split(' ')[0])},</p>
    <p>The next Concussion Clinical Mastery workshop in Melbourne is confirmed for <strong>${escapeHtml(mel.date)}</strong>.</p>
    <ul>
      <li>16 CPD hours, AHPRA-aligned, Osteopathy Australia endorsed</li>
      <li>Full day 8am&ndash;4pm, catered lunch included</li>
      <li>Capped at 12 clinicians for hands-on practice time</li>
    </ul>
    <center><a href="${utm(pricingLink, 'melbourne_push_v1', 'enrol')}" class="cta-btn">Full details + enrol</a></center>
    <p>The complete course (online + workshop) is <strong>A$${CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString('en-AU')}</strong> early-bird until 14 days before the workshop, then A$${CONFIG.COURSE.PRICE_REGULAR.toLocaleString('en-AU')}.</p>
    <p>Any questions, just reply.</p>
    <div class="sig">
      Zac<br>
      Concussion Education Australia
    </div>
  `)
  },
}

/**
 * AI_COURSE_LAUNCH_BLAST — one-off broadcast to engaged portal users
 * with the launch-week 50% discount on the AI in Clinical Practice course.
 *
 * Sent via /api/admin/ai-course-launch-blast. NOT part of the automated
 * nurture cron — fires only on admin trigger. Idempotent via
 * email_audit_log key `ai_course_launch_v1_${userId}`.
 *
 * Audience: preview + online-only users who have opened/clicked any CEA
 * email in the last 60 days OR signed up in the last 90 days; not
 * unsubscribed; do not already own the AI course.
 *
 * Goal: convert engaged users into A$99 launch-week buyers (50% off the
 * A$197 regular price). Discount window 2026-06-01 to 2026-06-08.
 */
/**
 * AI_SAFETY_CHECKLIST_SEQUENCE — lead-magnet nurture for clinicians who
 * downloaded the AI Safety Checklist PDF/page.
 *
 * Day 0 (transactional, fired immediately by /api/lead-magnet/ai-safety-checklist):
 *   AI_SAFETY_CHECKLIST_DAY0 — delivers the link, builds trust.
 *
 * Day 3, Day 7, Day 14: value-add nurture, soft-sells the AI in
 * Clinical Practice course. Wired via the existing send-nurture-emails
 * cron — trigger condition: signupSource = 'ai-safety-checklist'.
 */
export const AI_SAFETY_CHECKLIST_DAY0 = {
  subject: 'Your AI Safety Checklist for Allied Health Documentation',
  template: (name: string, checklistLink: string) => emailShell(`
    <p>Hi ${escapeHtml(name.split(' ')[0])},</p>
    <p>Here&rsquo;s the AI Safety Checklist for Allied Health Documentation, as promised.</p>
    <center><a href="${utm(checklistLink, 'ai_checklist_delivery', 'open_checklist')}" class="cta-btn">Open the checklist</a></center>
    <p>What&rsquo;s inside:</p>
    <ul>
      <li>Pre-consult: consent, tool selection, documentation plan</li>
      <li>During-consult: ambient AI scribe checklist, verbal consent script</li>
      <li>Post-consult: note review, audit trail, secure storage</li>
      <li>NDIS-report-specific: templating-flag check, clinical reasoning verification</li>
      <li>AHPRA + Privacy Act mini-cheatsheet</li>
      <li>Tier A / B / C tool reference (Heidi, Lyrebird, ChatGPT, Claude)</li>
    </ul>
    <p>Use it as a 5-minute audit before and after each consult while you&rsquo;re embedding AI into your workflow. If anything in there doesn&rsquo;t apply to your scope of practice, reply and tell me — I&rsquo;ll update the next version.</p>
    <div class="sig">
      Zac<br>
      Concussion Education Australia
    </div>
  `),
}

export const AI_SAFETY_CHECKLIST_DAY3 = {
  subject: 'The 3 most common AI documentation mistakes I see',
  template: (name: string, courseLink: string) => emailShell(`
    <p>Hi ${escapeHtml(name.split(' ')[0])},</p>
    <p>Quick follow-up on the AI Safety Checklist &mdash; the three documentation mistakes I see most often when I review AI-generated allied health notes:</p>
    <ol>
      <li><strong>Templated phrasing recycled across patients.</strong> The NDIA is now flagging this as a fraud-and-assurance trigger. If three of your notes contain the same paragraph structure, you have an audit problem even when the underlying clinical view is correct.</li>
      <li><strong>Missing consent record.</strong> A note that says &ldquo;AI scribe used&rdquo; but doesn&rsquo;t document the patient&rsquo;s explicit verbal consent is unsupportable under AHPRA AI guidelines. The consent line takes 8 seconds to add and prevents the entire problem.</li>
      <li><strong>Pasting personal information into ChatGPT.</strong> Most clinicians don&rsquo;t realise this is an offshore disclosure under Australian Privacy Principle 8. Even one patient name in a prompt creates a notifiable-disclosure risk.</li>
    </ol>
    <p>The full Tier A / B / C framework for choosing AI tools that don&rsquo;t fall into these traps is in the AI in Clinical Practice course.</p>
    <center><a href="${utm(courseLink, 'ai_checklist_day3', 'see_course')}" class="cta-btn">${aiCoursePricing().ctaLabel}</a></center>
    <div class="sig">
      Zac<br>
      Concussion Education Australia
    </div>
  `),
}

export const AI_SAFETY_CHECKLIST_DAY7 = {
  subject: 'Heidi vs Lyrebird vs ChatGPT — which one for your practice?',
  template: (name: string, blogLink: string, courseLink: string) => emailShell(`
    <p>Hi ${escapeHtml(name.split(' ')[0])},</p>
    <p>This week&rsquo;s most-asked question in my inbox: <em>Heidi or Lyrebird for clinical notes?</em></p>
    <p>The short answer: both are healthcare-purpose-built AU scribes (Tier A in the checklist framework). Heidi has wider adoption and broader workflow support; Lyrebird is leaner and works better for solo practitioners. ChatGPT is a different category entirely &mdash; not a scribe, not Privacy Act-compliant by default.</p>
    <p>I wrote up the full comparison &mdash; including the AHPRA + Privacy Act differences and a side-by-side feature table &mdash; here:</p>
    <center><a href="${utm(blogLink, 'ai_checklist_day7', 'read_comparison')}" class="cta-btn">Read: Heidi vs Lyrebird vs ChatGPT</a></center>
    <p>If you want the full Tier A / B / C framework with worked examples for physio, osteo, GP and naturopathy, that&rsquo;s the AI in Clinical Practice course.</p>
    <p>${aiCoursePricing().priceLine}</p>
    <p>&mdash; <a href="${utm(courseLink, 'ai_checklist_day7', 'see_course')}">See the course</a></p>
    <div class="sig">
      Zac<br>
      Concussion Education Australia
    </div>
  `),
}

export const AI_SAFETY_CHECKLIST_DAY14 = {
  // Fires on a rolling day-14 schedule — NEVER hardcode a deadline here.
  // Pricing/urgency derives from the provider catalogue at send time.
  subject: 'AI in Clinical Practice — the full framework behind your checklist',
  template: (name: string, courseLink: string) => emailShell(`
    <p>Hi ${escapeHtml(name.split(' ')[0])},</p>
    <p>Two weeks with the AI Safety Checklist &mdash; if it&rsquo;s earning its place in your workflow, the course is the full framework behind it. 3 CPD hours, 9 modules, certificate.</p>
    <p>${aiCoursePricing().priceLine}</p>
    <center><a href="${utm(courseLink, 'ai_checklist_day14', 'last_chance')}" class="cta-btn">${aiCoursePricing().ctaLabel}</a></center>
    <p>If you&rsquo;ve decided it&rsquo;s not for you, no worries &mdash; you&rsquo;ll stay on the list for future short courses.</p>
    <div class="sig">
      Zac<br>
      Concussion Education Australia
    </div>
  `),
}

export const AI_COURSE_LAUNCH_BLAST = {
  subject: 'AI in clinical practice — launching 17 June (launch pricing for engaged users)',
  template: (name: string, courseLink: string) => emailShell(`
    <p>Hi ${escapeHtml(name.split(' ')[0])},</p>
    <p>Quick heads-up since you&rsquo;ve been engaging with our concussion content — I&rsquo;m launching a new short course on <strong>17 June 2026</strong> that you might find useful.</p>
    <p><strong>AI in Clinical Practice — AHPRA-aligned compliance for clinicians using AI tools.</strong></p>
    <p>It came out of three things I kept seeing:</p>
    <ul>
      <li>AHPRA quietly published their AI guidelines — most clinicians haven&rsquo;t read them</li>
      <li>NDIS is auditing AI-generated allied health reports more aggressively (templated output is now an audit risk)</li>
      <li>Heidi, Lyrebird, Halo and ChatGPT are now in regular clinical use without a clear framework for safe documentation</li>
    </ul>
    <p>The course covers:</p>
    <ul>
      <li>What AHPRA and the Privacy Act actually require when you use AI in patient care</li>
      <li>Tier A/B/C framework for choosing AI tools (healthcare-purpose-built vs general-purpose)</li>
      <li>Heidi vs Lyrebird vs the rest &mdash; when each is the right tool</li>
      <li>Safe documentation workflows that hold up to NDIS and indemnity scrutiny</li>
      <li>When NOT to use AI &mdash; red flags, edge cases, patient consent</li>
    </ul>
    <p>3 CPD hours, fully online, certificate on completion.</p>
    <div class="callout">
      ${aiCoursePricing().priceLine}
    </div>
    <center><a href="${utm(courseLink, 'ai_course_launch_v1', 'reserve')}" class="cta-btn">${aiCoursePricing().ctaLabel}</a></center>
    <p>Reply if you have any questions about whether it fits your scope.</p>
    <div class="sig">
      Zac<br>
      Concussion Education Australia
    </div>
  `),
}

/**
 * Hub Pack seat-uptake reminders (owner-facing).
 *
 * A Hub Pack key dies silently when the buyer never forwards it — the clinic
 * paid for N clinician seats and only the owner's own seat gets used. These
 * two nudges (day 3 + day 10 after purchase, only while claimed < cap) put the
 * forwardable key back in front of the owner. Sent by
 * app/api/cron/hub-seat-reminders, deduped per (key, stage) via
 * email_audit_log, gated on email_suppression (fail closed) like every lane.
 *
 * Copy rules: founder voice, plain, no "free", one job — forward the key.
 */
export const HUB_SEAT_REMINDER_STAGES = [
  { stage: 'day3', minDays: 3 },
  { stage: 'day10', minDays: 10 },
] as const

export type HubSeatReminderStage = (typeof HUB_SEAT_REMINDER_STAGES)[number]['stage']

/**
 * Stages a hub of `ageDays` is old enough for, in send order. The cron sends
 * only the LATEST unsent one (a 12-day-old hub gets the day-10 email, never a
 * stale day-3 catch-up) and marks earlier ones as consumed.
 */
export function eligibleHubReminderStages(ageDays: number): HubSeatReminderStage[] {
  return HUB_SEAT_REMINDER_STAGES.filter((s) => ageDays >= s.minDays).map((s) => s.stage)
}

export const HUB_SEAT_REMINDER_EMAILS: Record<HubSeatReminderStage, {
  subject: (claimed: number, cap: number) => string
  template: (opts: { name: string; claimed: number; cap: number; hubKey: string; redeemUrl: string; clinicName?: string | null }) => string
}> = {
  day3: {
    subject: (claimed, cap) => `Your team's course seats — ${claimed} of ${cap} redeemed`,
    template: ({ name, claimed, cap, hubKey, redeemUrl, clinicName }) => emailShell(`
      <h2>Hi ${escapeHtml(name.split(' ')[0])},</h2>
      <p>Quick status on ${clinicName ? `${escapeHtml(clinicName)}'s` : 'your clinic&rsquo;s'} course access: <strong>${claimed} of ${cap} clinician seats</strong> have been redeemed so far. ${cap - claimed} ${cap - claimed === 1 ? 'seat is' : 'seats are'} still sitting unused.</p>
      <p>Each seat is a full login — all 8 modules, the clinical toolkit and the reference library. Your team redeems their own seat in under a minute:</p>
      <div class="callout">
        <strong>Your team access key:</strong> <span style="font-family: monospace; font-size: 16px; font-weight: 700; letter-spacing: 1px;">${escapeHtml(hubKey)}</span><br><br>
        They redeem it here: <a href="${redeemUrl}">${redeemUrl}</a>
      </div>
      <p><strong>Forward this email to your team</strong> — the key and link above are everything they need.</p>
      <p>If anyone gets stuck redeeming a seat, just reply and I'll sort it directly.</p>
      <div class="sig">
        Zac Lewis<br>
        Concussion Education Australia
      </div>
    `),
  },
  day10: {
    subject: (claimed, cap) => `${cap - claimed} of your clinic's course seats ${cap - claimed === 1 ? 'is' : 'are'} still unclaimed`,
    template: ({ name, claimed, cap, hubKey, redeemUrl, clinicName }) => emailShell(`
      <h2>Hi ${escapeHtml(name.split(' ')[0])},</h2>
      <p>It's been about ten days since you set up ${clinicName ? `${escapeHtml(clinicName)}'s` : 'your clinic&rsquo;s'} team access, and <strong>${claimed} of ${cap} clinician seats</strong> have been redeemed. You've paid for the rest — they're just waiting on a forward.</p>
      <p>The most common reason seats sit unused is simply that the key never made it past the inbox. Here it is again:</p>
      <div class="callout">
        <strong>Your team access key:</strong> <span style="font-family: monospace; font-size: 16px; font-weight: 700; letter-spacing: 1px;">${escapeHtml(hubKey)}</span><br><br>
        Each clinician redeems it once at: <a href="${redeemUrl}">${redeemUrl}</a>
      </div>
      <p><strong>Forward this to your team today</strong> — it takes them under a minute and their CPD hours start counting from Module&nbsp;1.</p>
      <p>You can see exactly who has claimed a seat on your <a href="https://portal.concussion-education-australia.com/dashboard">dashboard</a>. If the team has changed since you bought, or you need a hand, reply here.</p>
      <div class="sig">
        Zac Lewis<br>
        Concussion Education Australia
      </div>
    `),
  },
}

export const ALMOST_DONE_EMAIL = {
  subject: "You're one module away from your certificate",
  template: (name: string, loginLink: string) => emailShell(`
    <h2>Hi ${escapeHtml(name.split(' ')[0])},</h2>
    <p>You've completed <strong>7 of 8 modules</strong> — you're one module away from earning your 8 CPD hour certificate.</p>
    <p>You've already done the hard work. The final module takes about 60 minutes, and once you finish, your certificate is generated automatically and ready to download from your dashboard.</p>
    <div class="callout">
      <strong>What you've achieved so far:</strong><br><br>
      &#8226; Concussion pathophysiology and diagnostic frameworks<br>
      &#8226; SCAT6 administration and clinical assessment tools<br>
      &#8226; Return-to-play, work, and school protocols<br>
      &#8226; Rehabilitation strategies by concussion phenotype<br><br>
      <strong>One module left</strong> — finish it and your 8 AHPRA-aligned CPD hours are locked in.
    </div>
    <center><a href="${utm(loginLink, 'almost_done', 'finish_last_module')}" class="cta-btn">Finish Your Last Module</a></center>
    <p>You're so close. Don't leave your certificate on the table.</p>
    <div class="sig">
      Zac Lewis<br>
      Concussion Education Australia
    </div>
  `),
}

// ─── EP (Exercise Physiologist) Lead Nurture — Concussion Rehabilitation Mastery ──
//
// Sent to leads captured from the ESSA member newsletter burst (signup_source
// 'ep-course'). The capture form sends its own Day-0 confirmation; this
// 4-touch sequence (Day 3 → Day 21) does the follow-up conversion. Fired by
// app/api/cron/ep-nurture/route.ts. One CTA each → the EP landing
// /concussion-rehab-mastery. Plain founder voice.
//
// TRUTH GATE: every ESSA claim reads CONFIG.FEATURES.ESSA_ACCREDITED at send
// time via essaCpdLine(). When the flag is FALSE we say "designed to ESSA CPD
// standards (accreditation pending)" and NEVER "ESSA-accredited". CPD is 8 CPD
// for the online course; 16 hours only WITH the practical day — never 14 for
// the online line.

/**
 * ESSA CPD credential line — the single branch point for every EP email.
 * Reads the live feature flag so we never over-claim accreditation we don't
 * yet hold. Flip CONFIG.FEATURES.ESSA_ACCREDITED to true only on real approval.
 */
function essaCpdLine(): string {
  return CONFIG.FEATURES.ESSA_ACCREDITED
    ? 'ESSA-accredited &middot; 8 ESSA CPD points'
    : 'designed to ESSA CPD standards (accreditation pending)'
}

export const EP_NURTURE_SEQUENCE = [
  // DAY 3 — Scope + guidelines. The hook: SSTAE is the first-line,
  // guideline-endorsed concussion treatment, and it's an aerobic-exercise
  // prescription — squarely in EP scope.
  {
    day: 3,
    subject: "The one concussion treatment that's actually yours",
    template: (name: string, courseLink: string) => emailShell(`
      <p>Hi ${escapeHtml(name.split(' ')[0])},</p>
      <p>You had a look at the Concussion Rehabilitation Mastery course, so here's the part I think matters most to you as an EP.</p>
      <p>Sub-symptom-threshold aerobic exercise (SSTAE) is now the <strong>first-line, guideline-endorsed treatment</strong> for concussion. Not rest. Not "wait and see." The Amsterdam 2023 international consensus put graded aerobic exercise at the front of the pathway.</p>
      <p>Here's the part most clinicians miss: it's an <strong>aerobic-exercise prescription</strong>. Measured threshold, graded progression, load management. That's squarely in your scope &mdash; arguably more yours than anyone else's on the care team.</p>
      <p>This is the one concussion intervention that's actually yours to lead. The course shows you exactly how to deliver it &mdash; ${essaCpdLine()}.</p>
      <center><a href="${utm(courseLink, 'ep_nurture_day3', 'scope_guidelines')}" class="cta-btn">See the EP course</a></center>
      <div class="sig">
        Zac Lewis<br>
        Osteopath &middot; Concussion Education Australia
      </div>
    `),
  },

  // DAY 7 — Turnkey / the tools. Answers the "but how do I actually do it in
  // clinic" objection with the working instruments enrolment includes.
  {
    day: 7,
    subject: 'Walk out and deliver concussion rehab on Monday',
    template: (name: string, courseLink: string) => emailShell(`
      <p>Hi ${escapeHtml(name.split(' ')[0])},</p>
      <p>The most common question I get from EPs about concussion rehab is the honest one: "I understand the theory &mdash; but how do I actually do it in clinic?"</p>
      <p>That's the point of the course. Enrolment isn't just the modules &mdash; it's the working instruments you deliver with:</p>
      <ul>
        <li><strong>The BCTT calculator</strong> &mdash; run the Buffalo test, get a measured heart-rate threshold, and it converts straight into a prescription</li>
        <li><strong>SSTAE session templates</strong> &mdash; graded and ready to hand to the patient</li>
        <li><strong>The phenotype library</strong> &mdash; so you know which presentations are yours to treat and which to refer on</li>
        <li><strong>The document pack</strong> &mdash; NDIS, WorkCover and GP referral/report templates, already written</li>
      </ul>
      <p>The idea is simple: finish the course and you can walk out and deliver concussion rehab the same week. ${essaCpdLine()}.</p>
      <center><a href="${utm(courseLink, 'ep_nurture_day7', 'the_tools')}" class="cta-btn">Walk through the tools</a></center>
      <div class="sig">
        Zac Lewis<br>
        Concussion Education Australia
      </div>
    `),
  },

  // DAY 14 — CPD + reimbursement. Removes the time + cost objections. Online
  // line is 8 CPD — never 14 (16 hours only with the practical day).
  {
    day: 14,
    subject: 'Half your annual CPD, on your own schedule',
    template: (name: string, courseLink: string) => emailShell(`
      <p>Hi ${escapeHtml(name.split(' ')[0])},</p>
      <p>Two practical objections come up with any CPD: the time and the cost. Here's where the EP course lands on both.</p>
      <p><strong>Time.</strong> ${CONFIG.FEATURES.ESSA_ACCREDITED
        ? '8 CPD points, fully online and self-paced &mdash; roughly half your annual ESSA Further-Education requirement in one course'
        : '8 CPD hours, fully online and self-paced &mdash; ESSA CPD-point mapping is pending accreditation'}, done on your schedule rather than a fixed workshop date.</p>
      <p><strong>Cost.</strong> At $${CONFIG.COURSE.PRICE_ONLINE} the online course is employer-reimbursable &mdash; you get a tax invoice and a certificate on completion, so it goes straight to your PD budget.</p>
      <p>${essaCpdLine()}. If you later want the hands-on practical day as well, you can add it and take the total to 16 hours &mdash; but the online course on its own is 8 CPD.</p>
      <center><a href="${utm(courseLink, 'ep_nurture_day14', 'cpd_reimbursement')}" class="cta-btn">See what's included</a></center>
      <div class="sig">
        Zac Lewis<br>
        Concussion Education Australia
      </div>
    `),
  },

  // DAY 21 — Last touch / new service line. Concussion rehab as a
  // referral-worthy service GPs and clinics need someone to deliver.
  {
    day: 21,
    subject: 'The service line GPs are looking for someone to run',
    template: (name: string, courseLink: string) => emailShell(`
      <p>Hi ${escapeHtml(name.split(' ')[0])},</p>
      <p>Last note from me on this.</p>
      <p>Concussion rehab is quietly becoming a referral-worthy service line. GPs and clinics have patients who need graded aerobic rehab and often no one obvious to send them to. The EP who can confidently take that referral becomes the person they call.</p>
      <p>That's the real opportunity here &mdash; not just the CPD, but a service you can offer that most practices can't. The course gives you the protocol, the tools and the documentation to be that EP. ${essaCpdLine()}.</p>
      <p>No pressure, and no more emails from me on this after today. If the timing's right, everything's here:</p>
      <center><a href="${utm(courseLink, 'ep_nurture_day21', 'service_line')}" class="cta-btn">Have a look</a></center>
      <div class="sig">
        Zac Lewis<br>
        Osteopath &middot; Concussion Education Australia
      </div>
    `),
  },
]
