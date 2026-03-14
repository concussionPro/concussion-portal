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
      <h2>Welcome aboard, ${name.split(' ')[0]}!</h2>
      <p>Your Concussion Management course is ready and waiting. Students who start within the first 48 hours are <strong>3x more likely to complete the full course</strong>.</p>
      <p>Module 1 takes about 25 minutes and covers the foundational neuroscience of concussion — the framework everything else builds on.</p>
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
      <h2>Hi ${name.split(' ')[0]},</h2>
      <p>Just checking in — have you had a chance to get started?</p>
      <p>The first 3 modules cover the clinical foundations:</p>
      <ol>
        <li><strong>Module 1:</strong> Concussion neuroscience and pathophysiology</li>
        <li><strong>Module 2:</strong> SCAT6 sideline assessment</li>
        <li><strong>Module 3:</strong> SCOAT6 office-based follow-up</li>
      </ol>
      <p>Most clinicians complete all 3 in a single sitting (about 90 minutes). By the end you'll be confident with both the sideline and office assessment tools.</p>
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
      <h2>Hi ${name.split(' ')[0]},</h2>
      <p>One week in — how's it going? Whether you've completed 1 module or 5, you're making progress.</p>
      <p>The modules coming up are where clinicians tell me they get the most practical value:</p>
      <ul>
        <li><strong>Module 5 — VOMS:</strong> The vestibular/ocular motor screen most clinicians haven't been trained to perform</li>
        <li><strong>Module 6 — BESS:</strong> Balance assessment with specific scoring criteria</li>
        <li><strong>Module 7 — Return-to-Play:</strong> The step-by-step protocols schools and clubs need from you</li>
      </ul>
      <p>Complete all 8 modules and you'll earn your <strong>8 CPD point certificate</strong> — automatically generated and ready to download.</p>
      <center><a href="${utm(loginLink, 'post_purchase_day7', 'keep_going')}" class="cta-btn">Keep Going</a></center>
      <div class="sig">Zac</div>
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
      <h2>Hi${name ? ` ${name.split(' ')[0]}` : ''},</h2>
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
      <h2>Hi${name ? ` ${name.split(' ')[0]}` : ''},</h2>
      <p>I wanted to follow up in case you had questions about the course.</p>
      <p>Here's what clinicians ask most often:</p>
      <p><strong>"Is this relevant for physios/GPs/exercise physiologists?"</strong><br>
      Yes — the curriculum covers SCAT6, VOMS, BESS, and return-to-play protocols used across all allied health disciplines. It's endorsed by Osteopathy Australia but designed for any clinician managing concussion.</p>
      <p><strong>"How long does it take?"</strong><br>
      The 8 online modules take about 6-8 hours total. Most clinicians complete them across 2-3 sittings. You have lifetime access, so there's no rush.</p>
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
      <h2>Hi${name ? ` ${name.split(' ')[0]}` : ''},</h2>
      <p>This is the last email I'll send about this. I don't want to be pushy — but I also don't want you to miss out if the timing just wasn't right.</p>
      <p>If cost is a factor: the <strong>online-only option at $${CONFIG.COURSE.PRICE_ONLINE}</strong> gives you the full 8-module course with 8 CPD points. You can always add the workshop later.</p>
      <p>If you have specific questions, just reply — I'm happy to chat.</p>
      <center><a href="${utm('https://portal.concussion-education-australia.com/pricing', 'abandoned_72h', 'enrol_now')}" class="cta-btn">Enrol Now</a></center>
      <p class="ps">P.S. If you decided this course isn't for you, no hard feelings. The free SCAT Mastery course and SCAT6 forms are yours to keep.</p>
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
      <h2>Hi ${name.split(' ')[0]},</h2>
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
      <p>Venue details and parking info will be in your final reminder email the day before.</p>
      <center><a href="${utm('https://portal.concussion-education-australia.com/login', 'workshop_7d', 'complete_modules')}" class="cta-btn">Complete Your Online Modules</a></center>
      <div class="sig">Zac</div>
    `),
  },
  // 1 day before workshop
  {
    daysBefore: 1,
    subject: 'Tomorrow\'s workshop — everything you need to know',
    template: (name: string, workshopCity: string, workshopDate: string) => emailShell(`
      <h2>See you tomorrow, ${name.split(' ')[0]}!</h2>
      <p>Your concussion workshop in <strong>${workshopCity}</strong> is tomorrow (<strong>${workshopDate}</strong>).</p>
      <div class="callout">
        <strong>Workshop details:</strong><br><br>
        &#8226; <strong>Time:</strong> 9:00 AM — 4:00 PM<br>
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
    subject: 'Start Module 1 now — your SCAT6 training is ready',
    template: (name: string, loginLink: string) => emailShell(`
      <h2>Hi ${name},</h2>
      <p>Your free SCAT Mastery course is ready. Module 1 takes about 20 minutes and covers the foundations of SCAT6 administration &mdash; the framework everything else builds on.</p>
      <center><a href="${utm('https://portal.concussion-education-australia.com/modules/101', 'scat_mastery_day0', 'start_module1')}" class="cta-btn">Start Module 1 Now</a></center>
      <div class="callout">
        <strong>What you'll learn in the free course:</strong><br><br>
        &#8226; Step-by-step SCAT6 and SCOAT6 administration<br>
        &#8226; When to use SCAT6 vs SCOAT6 (the distinction most clinicians get wrong)<br>
        &#8226; Red flag recognition and escalation criteria<br>
        &#8226; 2 AHPRA-aligned CPD points upon completion<br><br>
        5 modules &middot; ~2 hours total &middot; Self-paced &middot; Free
      </div>
      <p>Your fillable SCAT6 and SCOAT6 forms are also waiting for you in the <a href="${utm('https://portal.concussion-education-australia.com/scat6-download', 'scat_mastery_day0', 'download_forms')}">downloads section</a>.</p>
      <div class="sig">
        Zac Lewis<br>
        Founder, Concussion Education Australia<br>
        <a href="mailto:zac@concussion-education-australia.com">zac@concussion-education-australia.com</a>
      </div>
    `),
  },

  // WEEK 1 (Day 3) - Complete free course nudge
  {
    day: 3,
    subject: 'Did you finish SCAT Mastery?',
    template: (name: string, loginLink: string) => emailShell(`
      <h2>Hi ${name.split(' ')[0]},</h2>
      <p>Just checking in &mdash; have you had a chance to work through the free SCAT Mastery course?</p>
      <p>It takes about 2 hours and covers:</p>
      <ul>
        <li>Step-by-step SCAT6 and SCOAT6 administration</li>
        <li>When to use SCAT6 vs SCOAT6 (the distinction most clinicians get wrong)</li>
        <li>Red flag recognition and escalation criteria</li>
        <li>2 AHPRA-aligned CPD points upon completion</li>
      </ul>
      <center><a href="${utm(loginLink, 'scat_mastery_day3', 'continue_course')}" class="cta-btn">Continue the Course</a></center>
      <p style="text-align: center; font-size: 13px; color: #64748b; margin-top: 4px;">2 hours &middot; Self-paced &middot; Free &middot; Includes CPD certificate</p>
      <div class="sig">Zac</div>
    `),
  },

  // WEEK 2 (Day 7) - Clinical case study for credibility
  {
    day: 7,
    subject: 'Would you clear this patient to play Saturday?',
    template: (name: string, loginLink: string) => emailShell(`
      <h2>Hi ${name.split(' ')[0]},</h2>
      <p>Quick scenario:</p>
      <div style="background: #f8fafc; padding: 18px 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 16px 0; font-size: 14px;">
        <strong>16-year-old male rugby player</strong><br>
        Day 5 post-collision. &ldquo;Felt fine&rdquo; initially. Now reports intermittent headache and trouble concentrating in class.<br><br>
        <strong>Parents:</strong> &ldquo;He seems fine &mdash; he wants to play this weekend.&rdquo;<br>
        <strong>Coach:</strong> &ldquo;Finals are Saturday. He passed the sideline check.&rdquo;
      </div>
      <p>What would you do? Clear him? Bench him? What documentation protects you if something goes wrong?</p>
      <p>This exact scenario comes up in the SCAT Mastery course &mdash; and the clinical reasoning behind the right decision is worth the 8 minutes it takes to work through.</p>
      <center><a href="${utm(loginLink, 'scat_mastery_day7', 'case_study')}" class="cta-btn">Work Through This Case</a></center>
      <div class="sig">Zac</div>
    `),
  },

  // WEEK 3 (Day 14) - Introduce full course: 14 CPD points breakdown
  {
    day: 14,
    subject: '14 CPD points — here\'s the full breakdown',
    template: (name: string, upgradeLink: string) => emailShell(`
      <h2>Hi ${name.split(' ')[0]},</h2>
      <p>The free SCAT Mastery course earns you 2 CPD points. If you're looking for more, here's what the full Concussion Management course covers:</p>
      <p><strong>8 online modules (8 CPD points):</strong></p>
      <ol>
        <li>Concussion pathophysiology</li>
        <li>SCAT6 sideline assessment</li>
        <li>SCOAT6 office-based follow-up</li>
        <li>VOMS &mdash; the vestibular/ocular motor screen most clinicians haven't been trained on</li>
        <li>BESS &mdash; balance assessment with specific scoring criteria</li>
        <li>Paediatric concussion management</li>
        <li>Return-to-play and return-to-learn protocols</li>
        <li>Clinical documentation and medicolegal considerations</li>
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
      <center><a href="${utm(upgradeLink, 'scat_mastery_day14', 'see_course')}" class="cta-btn">See Full Course</a></center>
      <p style="text-align: center; font-size: 13px; color: #64748b; margin-top: 4px;">Online from $${CONFIG.COURSE.PRICE_ONLINE} &middot; Online + workshop from $${CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString()}</p>
      <div class="sig">Zac</div>
    `),
  },

  // WEEK 5 (Day 28) - Early bird reminder + social proof
  {
    day: 28,
    subject: 'Early bird pricing closes soon',
    template: (name: string, upgradeLink: string) => emailShell(`
      <h2>Hi ${name.split(' ')[0]},</h2>
      <p>Quick note &mdash; early bird pricing is currently active for all workshop cities while dates are being confirmed by demand.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
        <tr style="border-bottom: 2px solid #e2e8f0; background: #f8fafc;">
          <td style="padding: 12px 16px; font-weight: 700;">Option</td>
          <td style="padding: 12px 16px; font-weight: 700; text-align: right;">Early Bird</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 14px 16px;"><strong>Online Course</strong><br><span style="font-size: 13px; color: #64748b;">8 modules &middot; 8 CPD points &middot; Lifetime access</span></td>
          <td style="padding: 14px 16px; text-align: right; font-weight: 700; white-space: nowrap;">$${CONFIG.COURSE.PRICE_ONLINE}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9; background: #f0fdfa;">
          <td style="padding: 14px 16px;"><strong>Complete Course</strong><br><span style="font-size: 13px; color: #64748b;">Online + workshop &middot; 14 CPD points</span></td>
          <td style="padding: 14px 16px; text-align: right; font-weight: 700; white-space: nowrap;">$${CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString()}</td>
        </tr>
      </table>
      <p>Both options include lifetime access, the clinical toolkit (referral templates, RTP forms, clearance letters), and an AHPRA-aligned CPD certificate.</p>
      <center><a href="${utm(upgradeLink, 'scat_mastery_day28', 'view_pricing')}" class="cta-btn">View Pricing</a></center>
      <p class="ps">P.S. You can start with the online course and upgrade to include the workshop later &mdash; you'll only pay the difference.</p>
      <div class="sig">Zac</div>
    `),
  },

  // WEEK 7 (Day 42) - Final email, then stop
  {
    day: 42,
    subject: 'Your concussion CPD options — final summary',
    template: (name: string, upgradeLink: string) => emailShell(`
      <h2>Hi ${name.split(' ')[0]},</h2>
      <p>This is the last email in this series. I hope the SCAT forms and free course have been useful in your practice.</p>
      <p>If you're still considering the full course, here's the summary:</p>
      <ul>
        <li><strong>Online Course ($${CONFIG.COURSE.PRICE_ONLINE}):</strong> 8 modules, 8 CPD points, lifetime access</li>
        <li><strong>Complete Course ($${CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString()}):</strong> Online + full-day workshop, 14 CPD points</li>
      </ul>
      <p>Both include the clinical toolkit, reference repository, and digital certificate.</p>
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

// ─── Workshop Threshold Sequences ────────────────────────────────────────────

/**
 * Workshop Reservation Email — Day 1 after full-course purchase
 * Replaces generic Day 1 onboarding for full-course users.
 */
export const WORKSHOP_RESERVATION_EMAIL = {
  day: 1,
  subject: 'Your spot is reserved — here\'s what happens next',
  template: (name: string, loginLink: string, city: string, count: number, threshold: number) => emailShell(`
    <h2>Welcome aboard, ${name.split(' ')[0]}!</h2>
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
        <h2>Hi ${name.split(' ')[0]},</h2>
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
        <h2>Hi ${name.split(' ')[0]},</h2>
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
        <h2>Hi ${name.split(' ')[0]},</h2>
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
        <h2>Hi ${name.split(' ')[0]},</h2>
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
        <h2>Hi ${name.split(' ')[0]},</h2>
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
    <h2>Great news, ${name.split(' ')[0]}!</h2>
    <p>Your workshop date has been confirmed:</p>
    <div class="callout">
      <strong>${city}</strong><br>
      <strong>Date:</strong> ${date}<br>
      <strong>Time:</strong> 9:00 AM — 4:00 PM<br><br>
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
export const WORKSHOP_LOGISTICS_EMAIL = {
  daysBefore: 42,
  subject: 'Your workshop is 6 weeks away — what to know',
  template: (name: string, city: string, date: string, venue?: string) => emailShell(`
    <h2>Hi ${name.split(' ')[0]},</h2>
    <p>Your concussion workshop in <strong>${city}</strong> is 6 weeks away (<strong>${date}</strong>).</p>
    <div class="callout">
      <strong>Workshop details:</strong><br><br>
      &#8226; <strong>Date:</strong> ${date}<br>
      &#8226; <strong>Time:</strong> 9:00 AM — 4:00 PM<br>
      ${venue ? `&#8226; <strong>Venue:</strong> ${venue}<br>` : '&#8226; <strong>Venue:</strong> Details to follow<br>'}
      &#8226; <strong>What to bring:</strong> Laptop/tablet, comfortable clothes, pen<br>
      &#8226; <strong>Lunch:</strong> Provided
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
      <h2>Hi ${name},</h2>
      <p>You're a week into the course — how's it going?</p>
      <p>By now you've likely worked through the concussion pathophysiology and diagnostic assessment modules. That's the foundation that most CPD courses stop at.</p>
      <p>What makes this training different is the practical component. The full-day workshop lets you:</p>
      <ul>
        <li>Physically administer a SCAT6 on a real subject with expert feedback</li>
        <li>Practice VOMS and BESS scoring — the assessments clinicians find hardest to learn from text alone</li>
        <li>Work through clinical scenarios with other clinicians</li>
      </ul>
      <p>Workshop dates are being finalised now. If you'd like to add the hands-on day, you can upgrade at any time.</p>
      <center><a href="${upgradeLink}" class="cta-btn">See Workshop Options</a></center>
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
    <h2>Hi ${name},</h2>
    <p>Just a quick check-in — I noticed you haven't logged into ConcussionPro recently.</p>
    <p>Your modules are still there, ready when you are. Most clinicians find it easiest to do one module per sitting (about 45–60 minutes each).</p>
    <div class="callout">
      <strong>Quick tip:</strong> Modules 3 and 6 are the most clinically actionable — they cover practical assessment protocols and return-to-play frameworks you can use immediately.
    </div>
    <center><a href="${loginLink}" class="cta-btn">Continue Your Course</a></center>
    <div class="sig">Zac</div>
  `),
}
