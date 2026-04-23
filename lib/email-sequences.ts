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

import { CONFIG } from '@/lib/config'
import { escapeHtml } from '@/lib/resend-client'

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
      <center><a href="${utm(loginLink, 'post_purchase_day3', 'continue_course')}" class="cta-btn">Continue Your Course</a></center>
      <p class="ps">P.S. Your course has lifetime access — no pressure, but momentum matters. Clinicians who finish within the first two weeks report the highest confidence gains.</p>
      <div class="sig">Zac</div>
    `),
  },
  // DAY 7 - Midpoint Motivation
  {
    day: 7,
    subject: 'You\'re halfway to 8 CPD points',
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
      <p>Complete all 8 modules and you'll earn your <strong>8 CPD point certificate</strong> — automatically generated and ready to download.</p>
      <center><a href="${utm(loginLink, 'post_purchase_day7', 'keep_going')}" class="cta-btn">Keep Going</a></center>
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
      <center><a href="${utm(loginLink, 'post_purchase_day14', 'continue_course')}" class="cta-btn">Continue Your Course</a></center>
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
      <p>Quick reminder: once you complete all 8 modules, your <strong>8 CPD point certificate</strong> is automatically generated and ready to download from your dashboard.</p>
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
    template: (name: string) => emailShell(`
      <h2>Hi${name ? ` ${escapeHtml(name.split(' ')[0])}` : ''},</h2>
      <p>Looks like you started enrolling in the Concussion Management course but didn't finish.</p>
      <p>No worries — your spot is still available. If you ran into a technical issue or had questions, just reply to this email.</p>
      <center><a href="${utm('https://portal.concussion-education-australia.com/pricing', 'abandoned_1h', 'complete_enrolment')}" class="cta-btn">Complete Your Enrolment</a></center>
      <div class="callout">
        <strong>What you'll get:</strong><br><br>
        &#8226; 8 online modules with lifetime access<br>
        &#8226; 8 AHPRA-aligned CPD points (14 with workshop)<br>
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
    template: (name: string) => emailShell(`
      <h2>Hi${name ? ` ${escapeHtml(name.split(' ')[0])}` : ''},</h2>
      <p>I wanted to follow up in case you had questions about the course.</p>
      <p>Here's what clinicians ask most often:</p>
      <p><strong>"Is this relevant for physios/GPs/exercise physiologists?"</strong><br>
      Yes — the curriculum covers SCAT6, VOMS, BESS, and return-to-play protocols used across all allied health disciplines. It's endorsed by Osteopathy Australia but designed for any clinician managing concussion.</p>
      <p><strong>"How long does it take?"</strong><br>
      The 8 online modules take approximately 8 hours total. Most clinicians complete them across a few sittings. You have lifetime access, so there's no rush.</p>
      <p><strong>"What if I want to add the workshop later?"</strong><br>
      Start with the online course ($${CONFIG.COURSE.PRICE_ONLINE}) and upgrade to include the hands-on workshop later — you'll only pay the difference.</p>
      <center><a href="${utm('https://portal.concussion-education-australia.com/pricing', 'abandoned_24h', 'view_options')}" class="cta-btn">View Course Options</a></center>
      <div class="sig">Zac</div>
    `),
  },
  // Email 3 — 72 hours after abandonment (final)
  {
    hoursAfter: 72,
    subject: 'Last note from me about the course',
    template: (name: string) => emailShell(`
      <h2>Hi${name ? ` ${escapeHtml(name.split(' ')[0])}` : ''},</h2>
      <p>This is the last email I'll send about this. I don't want to be pushy — but I also don't want you to miss out if the timing just wasn't right.</p>
      <p>If cost is a factor: the <strong>online-only option at $${CONFIG.COURSE.PRICE_ONLINE}</strong> gives you the full 8-module course with 8 CPD points. You can always add the workshop later.</p>
      <p>If you have specific questions, just reply — I'm happy to chat.</p>
      <center><a href="${utm('https://portal.concussion-education-australia.com/pricing', 'abandoned_72h', 'enrol_now')}" class="cta-btn">Enrol Now</a></center>
      <p class="ps">P.S. If you decided this course isn't for you, no hard feelings. The free SCAT6 Mastery course and SCAT6 forms are yours to keep.</p>
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
    template: (name: string, workshopCity: string, workshopDate: string) => emailShell(`
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
      <center><a href="${utm('https://portal.concussion-education-australia.com/login', 'workshop_7d', 'complete_modules')}" class="cta-btn">Complete Your Online Modules</a></center>
      <div class="sig">Zac</div>
    `),
  },
  // 1 day before workshop
  {
    daysBefore: 1,
    subject: 'Tomorrow\'s workshop — everything you need to know',
    template: (name: string, workshopCity: string, workshopDate: string) => emailShell(`
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
      <p>You'll earn <strong>6 additional CPD points</strong> (for a total of 14) upon completion.</p>
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
    subject: 'Have you tried Module 1 yet?',
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
      <p style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0;">If you're finding the free course useful, the full Concussion Management course covers VOMS, BESS, return-to-play protocols, and rehabilitation by phenotype &mdash; 8 modules, 8 CPD points.</p>
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
      <center><a href="${utm(upgradeLink + (upgradeLink.includes('?') ? '&' : '?') + 'promo=' + CONFIG.COURSE.PROMO_CODE, 'scat_mastery_day10', 'promo_code')}" class="cta-btn">Claim Your $50 Off &mdash; $${CONFIG.COURSE.PRICE_ONLINE - 50}</a></center>
      <div class="sig">
        Zac Lewis<br>
        Concussion Education Australia
      </div>
    `),
  },

  // WEEK 3 (Day 14) - Introduce full course: 14 CPD points breakdown
  {
    day: 14,
    subject: '14 CPD points — here\'s the full breakdown',
    template: (name: string, upgradeLink: string) => emailShell(`
      <h2>Hi ${escapeHtml(name.split(' ')[0])},</h2>
      <p>The free SCAT6 Mastery course covers the essentials. If you want to go deeper, here's what the full Concussion Management course covers:</p>
      <p><strong>8 online modules (8 CPD points):</strong></p>
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
      <p><strong>+ Full-day hands-on workshop (6 CPD points):</strong></p>
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
      <p style="text-align: center; font-size: 13px; color: #64748b; margin-top: 4px;">Online from $${CONFIG.COURSE.PRICE_ONLINE} &middot; Online + workshop from $${CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString('en-AU')}</p>
      <div class="sig">Zac</div>
    `),
  },

  // WEEK 5 (Day 28) - Last chance promo with hard 72h deadline
  {
    day: 28,
    subject: 'Last chance — $50 off expires this week',
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
          <td style="padding: 14px 16px;"><strong>Online Course</strong><br><span style="font-size: 13px; color: #64748b;">8 modules &middot; 8 CPD points &middot; Lifetime access</span></td>
          <td style="padding: 14px 16px; text-align: right; font-weight: 700; white-space: nowrap;"><s style="color:#94a3b8;">$${CONFIG.COURSE.PRICE_ONLINE}</s> $${CONFIG.COURSE.PRICE_ONLINE - 50}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9; background: #f0fdfa;">
          <td style="padding: 14px 16px;"><strong>Complete Course</strong><br><span style="font-size: 13px; color: #64748b;">Online + workshop &middot; 14 CPD points</span></td>
          <td style="padding: 14px 16px; text-align: right; font-weight: 700; white-space: nowrap;">$${CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString('en-AU')}</td>
        </tr>
      </table>
      <center><a href="${utm(upgradeLink + (upgradeLink.includes('?') ? '&' : '?') + 'promo=' + CONFIG.COURSE.PROMO_CODE, 'scat_mastery_day28', 'last_chance')}" class="cta-btn">Claim $50 Off Before It Expires</a></center>
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
      <p>This is the last email in this series. I hope the SCAT forms and free course have been useful in your practice.</p>
      <p>If you're still considering the full course, here's the summary:</p>
      <ul>
        <li><strong>Online Course ($${CONFIG.COURSE.PRICE_ONLINE}):</strong> 8 modules, 8 CPD points, lifetime access</li>
        <li><strong>Complete Course ($${CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString('en-AU')}):</strong> Online + full-day workshop, 14 CPD points</li>
      </ul>
      <p>Both include the clinical toolkit, reference repository, and digital certificate.</p>
      ${nextWorkshopCallout()}
      <center><a href="${utm(upgradeLink, 'scat_mastery_day42', 'choose_option')}" class="cta-btn">Choose Your Option</a></center>
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
    <p style="text-align: center; font-size: 13px; color: #64748b; margin-top: 4px;">$${CONFIG.COURSE.PRICE_ONLINE} &middot; 8 online modules &middot; 8 CPD points &middot; Lifetime access</p>
    ${nextWorkshopCallout()}
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
    template: (name: string, city: string, count: number, threshold: number) => {
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
    template: (name: string, city: string, count: number, threshold: number) => {
      const remaining = threshold - count
      return emailShell(`
        <h2>Hi ${escapeHtml(name.split(' ')[0])},</h2>
        <p>Your workshop city update:</p>
        <div class="callout">
          <strong>${city}:</strong> ${count} of ${threshold} spots filled — ${remaining > 0 ? `${remaining} more needed` : 'threshold reached!'}<br>
        </div>
        <p>Have you started the online modules? Clinicians who complete them before the workshop report the highest confidence gains in their practice.</p>
        <center><a href="${utm('https://portal.concussion-education-australia.com/login', 'workshop_momentum_d14', 'continue')}" class="cta-btn">Continue Your Modules</a></center>
        <div class="sig">Zac</div>
      `)
    },
  },
  {
    day: 21,
    subject: (city: string, count: number, remaining: number) =>
      `${city}: ${count} registered — ${remaining} more to confirm your date`,
    template: (name: string, city: string, count: number, threshold: number) => {
      const remaining = threshold - count
      return emailShell(`
        <h2>Hi ${escapeHtml(name.split(' ')[0])},</h2>
        <p>${city} progress: <strong>${count} of ${threshold}</strong> spots filled${remaining > 0 ? ` — ${remaining} more to go` : ''}.</p>
        <p>If you know anyone who'd benefit from hands-on concussion training, send them our way:</p>
        <center><a href="${utm('https://portal.concussion-education-australia.com/pricing', 'workshop_momentum_d21', 'share')}" class="cta-secondary">Share the Course</a></center>
        <div class="sig">Zac</div>
      `)
    },
  },
  {
    day: 28,
    subject: (city: string, count: number, remaining: number) =>
      `${city}: ${count} registered — ${remaining} more to confirm your date`,
    template: (name: string, city: string, count: number, threshold: number) => {
      const remaining = threshold - count
      return emailShell(`
        <h2>Hi ${escapeHtml(name.split(' ')[0])},</h2>
        <p>Month check-in: <strong>${city}</strong> has <strong>${count} of ${threshold}</strong> registrants${remaining > 0 ? ` — ${remaining} more to lock in a date` : ' — date confirmation coming soon'}.</p>
        <p>Every new registrant brings your workshop closer. Share with colleagues who manage concussions:</p>
        <center><a href="${utm('https://portal.concussion-education-australia.com/pricing', 'workshop_momentum_d28', 'share')}" class="cta-secondary">Share with a Colleague</a></center>
        <div class="sig">Zac</div>
      `)
    },
  },
  {
    day: 58,
    subject: (city: string, count: number, remaining: number) =>
      `Final check-in — ${city} needs ${remaining} more to lock in a date`,
    template: (name: string, city: string, count: number, threshold: number) => {
      const remaining = threshold - count
      return emailShell(`
        <h2>Hi ${escapeHtml(name.split(' ')[0])},</h2>
        <p>This is my last update on workshop numbers. ${city} has <strong>${count} of ${threshold}</strong> registrants${remaining > 0 ? ` — ${remaining} more needed to confirm a date` : ''}.</p>
        <p>If you have colleagues who'd benefit from this training, now's the time to let them know. Early bird pricing is still active for ${city}.</p>
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
  template: (name: string, city: string, date: string) => emailShell(`
    <h2>Great news, ${escapeHtml(name.split(' ')[0])}!</h2>
    <p>Your workshop date has been confirmed:</p>
    <div class="callout">
      <strong>${city}</strong><br>
      <strong>Date:</strong> ${date}<br>
      <strong>Time:</strong> 8:00 AM — 4:00 PM<br><br>
      Venue details will follow in a separate email.
    </div>
    <p>Make sure you've completed your online modules before the workshop — they're the foundation for everything we'll practise hands-on.</p>
    <center><a href="${utm('https://portal.concussion-education-australia.com/login', 'workshop_confirmed', 'complete_modules')}" class="cta-btn">Complete Your Modules</a></center>
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
  template: (name: string, city: string, date: string, venue?: string) => emailShell(`
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
    <center><a href="${utm('https://portal.concussion-education-australia.com/login', 'workshop_logistics_6w', 'complete_modules')}" class="cta-btn">Complete Your Online Modules</a></center>
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
      <p>The next workshop is confirmed &mdash; Melbourne, Saturday 13 June 2026 at Rydges Exhibition St. Add the hands-on day anytime to cap off your 14 CPD points.</p>
      ${nextWorkshopCallout()}
      <center><a href="${utm(upgradeLink, 'upgrade_nudge', 'see_workshop')}" class="cta-btn">See Workshop Options</a></center>
      <p style="font-size: 13px; color: #64748b; text-align: center;">6 extra CPD points · Small group (max 12) · Upgrade anytime</p>
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
    <p>Just a quick check-in — I noticed you haven't logged into ConcussionPro recently.</p>
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
  subject: 'Your free SCAT6 training is still waiting',
  template: (name: string, loginLink: string) => emailShell(`
    <h2>Hi ${escapeHtml(name.split(' ')[0])},</h2>
    <p>You signed up for the free SCAT6 Mastery course a week ago but haven't started yet.</p>
    <p>No pressure — Module 1 takes about 20 minutes and you can pick up where you left off any time.</p>
    <div class="callout">
      <strong>What's waiting for you:</strong><br><br>
      &#8226; 3 modules covering SCAT6 and SCOAT6 essentials<br>
      &#8226; Clinical case studies and scenario-based quiz<br>
      &#8226; Digital SCAT6 and SCOAT6 forms with PDF export<br><br>
      Self-paced &middot; ~1 hour total &middot; Free
    </div>
    <center><a href="${utm(loginLink, 'free_reengagement_day7', 'start_now')}" class="cta-btn">Start Module 1 — It Takes 20 Minutes</a></center>
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
    <p style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0;">Once you've earned your SCAT6 Mastery certificate, the full Concussion Management course takes your skills further — 8 modules covering VOMS, BESS, return-to-play protocols, and rehabilitation by phenotype. 8 additional CPD points.</p>
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
        &#8226; ${CONFIG.COURSE.ONLINE_CPD_POINTS} AHPRA-aligned CPD points and a certificate<br>
        &#8226; Optional Melbourne workshop for hands-on practice (6 more CPD points)
      </div>
      <center><a href="${utm(pricingLink, 'ref_upgrade_d9', 'bundle_credit')}" class="cta-btn">See Your Discounted Price</a></center>
      <p class="ps">P.S. The credit doesn't expire — but early-bird workshop pricing does (${escapeHtml(CONFIG.WORKSHOP.EARLY_BIRD_DEADLINE)}).</p>
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
        <li>You don't need CPD points this cycle</li>
        <li>You rarely see concussion cases — the text is a reliable desk reference</li>
      </ul>
      <p><strong>The course pays back quickly if:</strong></p>
      <ul>
        <li>You've read the VOMS chapter and still aren't sure if you're <em>doing</em> it right (most common)</li>
        <li>You need CPD points and want them in one structured block</li>
        <li>You want the confidence of watching it done before attempting it yourself</li>
      </ul>
      <p>With the A$100 bundle credit, the online course is <strong>A$${CONFIG.COURSE.PRICE_ONLINE - 100}</strong> — about the cost of one private consult. Full course (online + Melbourne workshop) drops to <strong>A$${CONFIG.COURSE.PRICE_EARLY_BIRD - 100}</strong> at early-bird pricing.</p>
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

export const ALMOST_DONE_EMAIL = {
  subject: "You're one module away from your certificate",
  template: (name: string, loginLink: string) => emailShell(`
    <h2>Hi ${escapeHtml(name.split(' ')[0])},</h2>
    <p>You've completed <strong>7 of 8 modules</strong> — you're one module away from earning your 8 CPD point certificate.</p>
    <p>You've already done the hard work. The final module takes about 60 minutes, and once you finish, your certificate is generated automatically and ready to download from your dashboard.</p>
    <div class="callout">
      <strong>What you've achieved so far:</strong><br><br>
      &#8226; Concussion pathophysiology and diagnostic frameworks<br>
      &#8226; SCAT6 administration and clinical assessment tools<br>
      &#8226; Return-to-play, work, and school protocols<br>
      &#8226; Rehabilitation strategies by concussion phenotype<br><br>
      <strong>One module left</strong> — finish it and your 8 AHPRA-aligned CPD points are locked in.
    </div>
    <center><a href="${utm(loginLink, 'almost_done', 'finish_last_module')}" class="cta-btn">Finish Your Last Module</a></center>
    <p>You're so close. Don't leave your certificate on the table.</p>
    <div class="sig">
      Zac Lewis<br>
      Concussion Education Australia
    </div>
  `),
}
