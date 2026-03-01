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

function emailShell(content: string): string {
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
      <a href="https://portal.concussion-education-australia.com" style="color: #94a3b8;">portal.concussion-education-australia.com</a>
    </div>
  </div>
</body>
</html>`
}

export const SCAT_MASTERY_SEQUENCE = [
  // DAY 0 - Lead Magnet Delivery
  {
    day: 0,
    subject: 'Your SCAT6 and SCOAT6 forms are ready',
    template: (name: string, loginLink: string) => emailShell(`
      <h2>Hi ${name},</h2>
      <p>Here are your fillable SCAT6 and SCOAT6 assessment forms &mdash; ready to use in your next patient encounter.</p>
      <center><a href="https://portal.concussion-education-australia.com/scat6-download" class="cta-btn">Download Your SCAT6 Forms</a></center>
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
        <li>2 AHPRA-aligned CPD hours upon completion</li>
      </ul>
      <center><a href="${loginLink}" class="cta-btn">Start the Free SCAT Course</a></center>
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
      <center><a href="${loginLink}" class="cta-btn">Work Through This Case</a></center>
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
        The full course provides up to <strong>14 AHPRA-aligned CPD hours</strong> (8 online + 6 hands-on workshop).
      </div>
      <center><a href="${upgradeLink}" class="cta-btn">See Full Course Details</a></center>
      <div class="sig">Zac Lewis<br>Founder, Concussion Education Australia</div>
    `),
  },

  // DAY 14 - Authority + Social Proof
  {
    day: 14,
    subject: 'Why Osteopathy Australia endorses this training',
    template: (name: string, upgradeLink: string) => emailShell(`
      <h2>Hi ${name},</h2>
      <p>You might wonder what sets this course apart from other concussion CPD options in Australia.</p>
      <p>Three things:</p>
      <p><strong>1. It's the only course with hands-on assessment training.</strong><br>
      Most CPD is a 1&ndash;2 hour webinar. Our full-day workshop has you physically administering SCAT6, VOMS, and BESS under supervision.</p>
      <p><strong>2. Osteopathy Australia reviewed and endorsed it.</strong><br>
      They evaluated our curriculum, clinical methodology, and assessment framework before granting endorsement.</p>
      <p><strong>3. You get a complete clinical documentation system.</strong><br>
      Referral templates, return-to-play letters, clearance forms, and a searchable repository of 145+ clinical references.</p>
      <div style="background: #f8fafc; padding: 18px 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0; font-size: 14px;">
        <em>&ldquo;The VOMS and BESS training was exceptional. I couldn't find this level of practical instruction anywhere else in Australia.&rdquo;</em><br>
        <strong style="color: #475569;">&mdash; Osteopath, Melbourne</strong>
      </div>
      <center><a href="${upgradeLink}" class="cta-btn">View Pricing and Options</a></center>
      <p style="text-align: center; font-size: 13px; color: #64748b; margin-top: 4px;">Online from $497 AUD &middot; Full course from $1,190 AUD &middot; International $299 USD</p>
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
          <td style="padding: 14px 16px;"><strong>Online Course</strong><br><span style="font-size: 13px; color: #64748b;">8 modules &middot; 8 CPD hours &middot; Lifetime access</span></td>
          <td style="padding: 14px 16px; text-align: right; font-weight: 700; white-space: nowrap;">$497 AUD</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9; background: #f0fdfa;">
          <td style="padding: 14px 16px;"><strong>Complete Course</strong> <span style="font-size: 11px; background: #d97706; color: white; padding: 2px 8px; border-radius: 10px; font-weight: 600;">MOST POPULAR</span><br><span style="font-size: 13px; color: #64748b;">Online + full-day workshop &middot; 14 CPD hours</span></td>
          <td style="padding: 14px 16px; text-align: right; font-weight: 700; white-space: nowrap;">$1,190 AUD</td>
        </tr>
        <tr>
          <td style="padding: 14px 16px;"><strong>International Online</strong><br><span style="font-size: 13px; color: #64748b;">8 modules &middot; 8 CPD hours &middot; No workshop</span></td>
          <td style="padding: 14px 16px; text-align: right; font-weight: 700; white-space: nowrap;">$299 USD</td>
        </tr>
      </table>
      <p><strong>Every option includes:</strong></p>
      <ul>
        <li>Lifetime access to all online modules</li>
        <li>Clinical Toolkit (referral templates, RTP forms, clearance letters)</li>
        <li>Reference Repository (145+ curated articles)</li>
        <li>Digital certificate of completion</li>
        <li>AHPRA-aligned CPD hours, endorsed by Osteopathy Australia</li>
      </ul>
      <center><a href="${upgradeLink}" class="cta-btn">Choose Your Option</a></center>
      <p style="font-size: 14px; color: #475569; margin-top: 20px;">You can also start with online ($497) and upgrade to add the workshop later &mdash; just pay the difference.</p>
      <div class="sig">
        <p>Questions? Just reply to this email &mdash; I'm always happy to help.</p>
        <p>All the best,<br>Zac Lewis<br>Founder, Concussion Education Australia<br><a href="mailto:zac@concussion-education-australia.com">zac@concussion-education-australia.com</a></p>
      </div>
      <p class="ps">P.S. You'll stay on our newsletter for clinical updates and new case studies. No more sales emails after this one.</p>
    `),
  },
]
