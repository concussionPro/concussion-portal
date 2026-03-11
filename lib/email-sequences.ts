/**
 * Email Nurture Sequences
 *
 * 18-day automated sequence: Free SCAT forms -> Free SCAT course -> Paid CPD course
 *
 * Strategy:
 * - Lead magnet delivery first (65% open, 20-28% CTR)
 * - Value before ask: 3 value emails before any paid mention
 * - Progressive commitment: download -> free course -> paid course
 * - Single CTA per email, action-verb buttons
 * - 3-5 day spacing for B2B/healthcare
 * - Osteopathy Australia endorsement as authority signal
 * - No emoji in subject lines (higher open for professionals)
 * - Plain-text feel with minimal HTML (higher engagement)
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
  // DAY 0 - Lead Magnet Delivery
  {
    day: 0,
    subject: 'Your SCAT6 and SCOAT6 forms are ready',
    template: (name: string, loginLink: string) => emailShell(`
      <h2>Hi ${name},</h2>
      <p>Here are your fillable SCAT6 and SCOAT6 assessment forms &mdash; ready to use in your next patient encounter.</p>
      <center><a href="${utm('https://portal.concussion-education-australia.com/scat6-download', 'scat_mastery_day0', 'download_forms')}" class="cta-btn">Download Your SCAT6 Forms</a></center>
      <div class="callout">
        <strong>What's included:</strong><br><br>
        &#8226; Fillable SCAT6 PDF (sideline / acute assessment, 0&ndash;72hrs)<br>
        &#8226; Fillable SCOAT6 PDF (office follow-up, Day 3&ndash;30)<br>
        &#8226; Child SCAT6 for paediatric patients<br><br>
        All forms are based on the 2023 Amsterdam Consensus Statement.
      </div>
      <p><strong>Quick clinical tip:</strong> One of the most common mistakes is using SCAT6 for office follow-ups when SCOAT6 is the correct tool after 72 hours.</p>
      <p>I'll follow up in a few days with a free resource that walks you through administering each form step by step.</p>
      <div class="sig">
        Zac Lewis<br>
        Founder, Concussion Education Australia<br>
        <a href="mailto:zac@concussion-education-australia.com">zac@concussion-education-australia.com</a>
      </div>
      <p class="ps">P.S. Hit reply if you have questions about any of the forms &mdash; I read every message.</p>
    `),
  },

  // DAY 3 - Clinical Value: When to use SCAT6 vs SCOAT6
  {
    day: 3,
    subject: 'SCAT6 or SCOAT6 — which one and when',
    template: (name: string, loginLink: string) => emailShell(`
      <h2>Hi ${name},</h2>
      <p>Have you had a chance to use the SCAT6 forms yet?</p>
      <p>Here's the clinical distinction that trips up most practitioners:</p>
      <div class="callout-warn">
        <strong>SCAT6</strong> is validated for sideline and acute assessment within 72 hours of injury.<br><br>
        <strong>SCOAT6</strong> is the correct tool for office-based follow-up from Day 3 onwards.<br><br>
        Using the wrong tool at the wrong time falls below the expected standard of care under the 2023 Consensus guidelines.
      </div>
      <p>Knowing <em>which</em> form to use is just the starting point. Knowing <em>how</em> to interpret the results is what separates a confident clinician from one second-guessing themselves.</p>
      <p>That's exactly what our <strong>free 2-hour SCAT Mastery course</strong> covers:</p>
      <ul>
        <li>Step-by-step SCAT6 and SCOAT6 administration</li>
        <li>Red flag recognition and when to escalate</li>
        <li>Clinical decision flowcharts you can reference in practice</li>
        <li>2 AHPRA-aligned CPD points upon completion</li>
      </ul>
      <center><a href="${utm(loginLink, 'scat_mastery_day3', 'start_free_course')}" class="cta-btn">Start the Free SCAT Course</a></center>
      <p style="text-align: center; font-size: 13px; color: #64748b; margin-top: 4px;">2 hours &middot; Self-paced &middot; Free &middot; Includes CPD certificate</p>
      <div class="sig">Zac</div>
    `),
  },

  // DAY 7 - Free Course Nudge + Case Teaser
  {
    day: 7,
    subject: 'Would you clear this patient to play Saturday?',
    template: (name: string, loginLink: string) => emailShell(`
      <h2>Hi ${name},</h2>
      <p>Quick scenario:</p>
      <div style="background: #f8fafc; padding: 18px 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 16px 0; font-size: 14px;">
        <strong>16-year-old male rugby player</strong><br>
        Day 5 post-collision. &ldquo;Felt fine&rdquo; initially. Now reports intermittent headache and trouble concentrating in class.<br><br>
        <strong>Parents:</strong> &ldquo;He seems fine &mdash; he wants to play this weekend.&rdquo;<br>
        <strong>Coach:</strong> &ldquo;Finals are Saturday. He passed the sideline check.&rdquo;
      </div>
      <p>What would you do? Clear him? Bench him? What documentation protects you if something goes wrong?</p>
      <p>This exact scenario comes up in the free SCAT Mastery course &mdash; and the clinical reasoning behind the right decision is worth the 8 minutes it takes to work through.</p>
      <center><a href="${utm(loginLink, 'scat_mastery_day7', 'case_study')}" class="cta-btn">Work Through This Case</a></center>
      <p class="ps">P.S. If you've already started the course, keep going &mdash; the later modules on red flags and documentation are where the real confidence comes from.</p>
      <div class="sig">Zac</div>
    `),
  },

  // DAY 10 - Bridge: What free users are missing
  {
    day: 10,
    subject: "What the free course doesn't cover",
    template: (name: string, upgradeLink: string) => emailShell(`
      <h2>Hi ${name},</h2>
      <p>The free SCAT Mastery course gives you a solid foundation. But there's a reason we built the full Comprehensive Concussion Management course &mdash; and why <strong>Osteopathy Australia</strong> endorsed it for CPD.</p>
      <p><strong>Here's what the free course doesn't cover:</strong></p>
      <ol>
        <li><strong>VOMS (Vestibular/Ocular Motor Screening)</strong> &mdash; the assessment most clinicians don't know how to perform but should be using in every follow-up</li>
        <li><strong>BESS (Balance Error Scoring System)</strong> &mdash; hands-on balance assessment with specific scoring criteria</li>
        <li><strong>Return-to-play and return-to-learn protocols</strong> &mdash; the step-by-step frameworks schools and clubs need from you</li>
        <li><strong>Paediatric management</strong> &mdash; children recover differently, and the protocols are distinct from adults</li>
        <li><strong>Medicolegal documentation</strong> &mdash; pre-built referral templates, clearance letters, and RTP forms that protect your practice</li>
      </ol>
      <div class="callout">
        <span class="badge">Endorsed by Osteopathy Australia</span><br>
        The full course provides <strong>14 AHPRA-aligned CPD points</strong> (8 online + 6 hands-on workshop).
      </div>
      <center><a href="${utm(upgradeLink, 'scat_mastery_day10', 'full_course_details')}" class="cta-btn">See Full Course Details</a></center>
      <div class="sig">Zac Lewis<br>Founder, Concussion Education Australia</div>
    `),
  },

  // DAY 14 - Authority + Social Proof
  {
    day: 14,
    subject: 'Why this training is endorsed for CPD',
    template: (name: string, upgradeLink: string) => emailShell(`
      <h2>Hi ${name},</h2>
      <p>You might wonder what sets this course apart from other concussion CPD options in Australia.</p>
      <p>Three things:</p>
      <p><strong>1. It's the only course with hands-on assessment training.</strong><br>
      Most CPD is a 1&ndash;2 hour webinar. Our full-day workshop has you physically administering SCAT6, VOMS, and BESS under supervision.</p>
      <p><strong>2. Built for all allied health clinicians — endorsed by Osteopathy Australia.</strong><br>
      Physiotherapists, osteopaths, chiropractors, sports medicine doctors, GPs, and exercise physiologists all use these assessment tools. The curriculum is designed for any clinician managing concussion.</p>
      <p><strong>3. You get a complete clinical documentation system.</strong><br>
      Referral templates, return-to-play letters, clearance forms, and a searchable repository of 130+ clinical references.</p>
      <div style="background: #f8fafc; padding: 18px 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0; font-size: 14px;">
        <em>&ldquo;The VOMS and BESS training was exceptional. I couldn't find this level of practical instruction anywhere else in Australia.&rdquo;</em><br>
        <strong style="color: #475569;">&mdash; Physiotherapist</strong>
      </div>
      <center><a href="${utm(upgradeLink, 'scat_mastery_day14', 'view_pricing')}" class="cta-btn">View Pricing and Options</a></center>
      <p style="text-align: center; font-size: 13px; color: #64748b; margin-top: 4px;">Online from $${CONFIG.COURSE.PRICE_ONLINE} AUD &middot; Complete course from $${CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString()} AUD (online + hands-on workshop)</p>
      <div class="sig">Zac</div>
    `),
  },

  // DAY 18 - Final CTA
  {
    day: 18,
    subject: 'Your concussion CPD options — final summary',
    template: (name: string, upgradeLink: string) => emailShell(`
      <h2>Hi ${name},</h2>
      <p>This is the last email in this series. I hope the free SCAT forms and course content have been useful.</p>
      <p>If you're considering the full course, here's a clear summary:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
        <tr style="border-bottom: 2px solid #e2e8f0; background: #f8fafc;">
          <td style="padding: 12px 16px; font-weight: 700;">Option</td>
          <td style="padding: 12px 16px; font-weight: 700; text-align: right;">Price</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 14px 16px;"><strong>Online Course</strong><br><span style="font-size: 13px; color: #64748b;">8 modules &middot; 8 CPD points &middot; Lifetime access</span></td>
          <td style="padding: 14px 16px; text-align: right; font-weight: 700; white-space: nowrap;">$${CONFIG.COURSE.PRICE_ONLINE} AUD</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9; background: #f0fdfa;">
          <td style="padding: 14px 16px;"><strong>Complete Course</strong> <span style="font-size: 11px; background: #d97706; color: white; padding: 2px 8px; border-radius: 10px; font-weight: 600;">RECOMMENDED</span><br><span style="font-size: 13px; color: #64748b;">Online + full-day workshop &middot; 14 CPD points</span></td>
          <td style="padding: 14px 16px; text-align: right; font-weight: 700; white-space: nowrap;">$${CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString()} AUD</td>
        </tr>
      </table>
      <p><strong>Every option includes:</strong></p>
      <ul>
        <li>Lifetime access to all online modules</li>
        <li>Clinical Toolkit (referral templates, RTP forms, clearance letters)</li>
        <li>Reference Repository (130+ curated articles)</li>
        <li>Digital certificate of completion</li>
        <li>AHPRA-aligned CPD points, endorsed by Osteopathy Australia</li>
      </ul>
      <center><a href="${utm(upgradeLink, 'scat_mastery_day18', 'choose_option')}" class="cta-btn">Choose Your Option</a></center>
      <p style="font-size: 14px; color: #475569; margin-top: 20px;">Questions about which option is right for you? Just reply to this email.</p>
      <div class="sig">
        <p>Questions? Just reply to this email &mdash; I'm always happy to help.</p>
        <p>All the best,<br>Zac Lewis<br>Founder, Concussion Education Australia<br><a href="mailto:zac@concussion-education-australia.com">zac@concussion-education-australia.com</a></p>
      </div>
      <p class="ps">P.S. You'll stay on our newsletter for clinical updates and new case studies. No more sales emails after this one.</p>
    `),
  },
]

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
