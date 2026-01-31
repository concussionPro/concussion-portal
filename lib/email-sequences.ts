/**
 * Email Nurture Sequences
 * 14-day automated sequences to convert free users to paid
 */

export const SCAT_MASTERY_SEQUENCE = [
  {
    day: 0,
    subject: '🎉 Your FREE SCAT6/SCOAT6 Mastery Course is Ready',
    template: (name: string, loginLink: string) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background: #f8fafc; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); padding: 40px 24px; text-align: center; }
            .header h1 { margin: 0; color: white; font-size: 28px; font-weight: 700; }
            .content { padding: 32px 24px; }
            .button { display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: 600; margin: 24px 0; }
            .footer { padding: 24px; text-align: center; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; }
            .highlight { background: #dbeafe; padding: 16px; border-radius: 8px; border-left: 4px solid #2563eb; margin: 16px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to SCAT Mastery!</h1>
            </div>
            <div class="content">
              <h2 style="margin-top: 0;">Hi ${name},</h2>
              <p>Your FREE 2-hour SCAT6/SCOAT6 Mastery course is ready. Get 100% confident for your next concussion assessment.</p>

              <div class="highlight">
                <strong>What you'll master in 2 hours:</strong><br>
                ✓ Step-by-step SCAT6 & SCOAT6 administration<br>
                ✓ Red flag recognition that avoids medicolegal risk<br>
                ✓ When to use which tool (most GPs get this wrong)<br>
                ✓ Clinical toolkit: referral templates, RTP forms<br>
                ✓ 2 AHPRA-aligned CPD hours + certificate
              </div>

              <center>
                <a href="${loginLink}" class="button">
                  Start Course Now →
                </a>
              </center>

              <p style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                <strong>Quick question:</strong> What's your biggest challenge with concussion management right now?<br>
                Just reply to this email - I read every message.
              </p>

              <p style="color: #64748b;">
                - Zac<br>
                <em style="font-size: 14px;">Founder, Concussion Education Australia</em>
              </p>
            </div>
            <div class="footer">
              <p><strong>Concussion Education Australia</strong></p>
              <p>zac@concussion-education-australia.com</p>
            </div>
          </div>
        </body>
      </html>
    `,
  },
  {
    day: 2,
    subject: '⚠️ 40% of GPs Make This SCAT6 Mistake',
    template: (name: string, loginLink: string) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background: #f8fafc; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #dc2626 0%, #ea580c 100%); padding: 40px 24px; text-align: center; }
            .header h1 { margin: 0; color: white; font-size: 28px; font-weight: 700; }
            .content { padding: 32px 24px; }
            .button { display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: 600; margin: 24px 0; }
            .warning { background: #fef3c7; padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 16px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Common SCAT6 Mistake</h1>
            </div>
            <div class="content">
              <h2 style="margin-top: 0;">Hi ${name},</h2>
              <p>Have you started the SCAT Mastery course yet?</p>

              <p>I need to share something urgent:</p>

              <div class="warning">
                <strong>40% of Australian GPs use SCAT6 at the wrong time.</strong><br><br>
                They use it for Day 7+ office assessments when they should use SCOAT6.<br><br>
                This is below standard of care under AHPRA guidelines.
              </div>

              <p><strong>The fix is simple:</strong></p>
              <p>SCAT6 = 0-72 hours (sideline/acute)<br>
              SCOAT6 = Day 3-30 (office follow-up)</p>

              <p>Module 1 of your free course covers this in detail.</p>

              <center>
                <a href="${loginLink}" class="button">
                  Watch Module 1 (8 mins) →
                </a>
              </center>

              <p style="margin-top: 32px;">
                See you inside,<br>
                - Zac
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  },
  {
    day: 5,
    subject: '📊 Your Practice Could Be Seeing 4-8 Concussions/Month',
    template: (name: string, upgradeLink: string) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background: #f8fafc; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #16a34a 0%, #059669 100%); padding: 40px 24px; text-align: center; }
            .header h1 { margin: 0; color: white; font-size: 28px; font-weight: 700; }
            .content { padding: 32px 24px; }
            .button { display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: 600; margin: 24px 0; }
            .stats { background: #dcfce7; padding: 20px; border-radius: 8px; margin: 16px 0; }
            .stat { display: inline-block; text-align: center; width: 45%; margin: 10px 2%; }
            .stat-number { font-size: 32px; font-weight: 700; color: #16a34a; }
            .stat-label { font-size: 14px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💰 Hidden Revenue Stream</h1>
            </div>
            <div class="content">
              <h2 style="margin-top: 0;">Hi ${name},</h2>
              <p>Quick question: How many concussion patients did you see last month?</p>

              <p><strong>Most GPs say 0-2.</strong></p>

              <p>But here's the thing: They're missing 4-8 concussions/month because patients don't know to come in.</p>

              <div class="stats">
                <div class="stat">
                  <div class="stat-number">1 in 5</div>
                  <div class="stat-label">Athletes have undiagnosed concussion</div>
                </div>
                <div class="stat">
                  <div class="stat-number">$180-350</div>
                  <div class="stat-label">Per concussion consult (multiple visits)</div>
                </div>
              </div>

              <p><strong>What if you could attract 5-10 concussion patients/month?</strong></p>

              <p>That's $900-3,500/month in additional revenue. Just from being known as "the concussion expert" in your area.</p>

              <p>The full Comprehensive Concussion Course shows you exactly how to:</p>
              <ul>
                <li>Position yourself as the local concussion expert</li>
                <li>Get referrals from sporting clubs (they're desperate for local GPs)</li>
                <li>Handle complex cases with confidence (BESS, VOMS, RTL protocols)</li>
                <li>Reduce medicolegal risk with proper documentation</li>
              </ul>

              <p><strong>20 CPD hours + practical training = $490/year</strong></p>
              <p>That's $24.50/hour vs $75 at conferences.</p>

              <center>
                <a href="${upgradeLink}" class="button">
                  View Full Course Details →
                </a>
              </center>

              <p style="margin-top: 32px;">
                Questions? Just reply - happy to help.<br><br>
                - Zac
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  },
  {
    day: 7,
    subject: '🎁 Special Offer: $99 Off Full Course (Expires Tonight)',
    template: (name: string, upgradeLink: string) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background: #f8fafc; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #dc2626 0%, #ea580c 100%); padding: 40px 24px; text-align: center; }
            .header h1 { margin: 0; color: white; font-size: 28px; font-weight: 700; }
            .content { padding: 32px 24px; }
            .button { display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #dc2626 0%, #ea580c 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: 600; margin: 24px 0; }
            .urgent { background: #fef3c7; padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 16px 0; text-align: center; }
            .price { font-size: 48px; font-weight: 700; color: #dc2626; }
            .old-price { font-size: 24px; text-decoration: line-through; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎁 $99 Off - Expires Tonight</h1>
            </div>
            <div class="content">
              <h2 style="margin-top: 0;">Hi ${name},</h2>
              <p>You completed the free SCAT Mastery course. Nice work.</p>

              <p>Because you finished it, I'm offering you <strong>$99 off the full Comprehensive Concussion Course</strong> - but only until midnight tonight.</p>

              <div style="text-align: center; margin: 32px 0;">
                <div class="old-price">$490/year</div>
                <div class="price">$391/year</div>
                <p style="color: #64748b;">Use code: <strong style="color: #dc2626;">SCAT99</strong></p>
              </div>

              <div class="urgent">
                ⏰ <strong>Offer expires: 11:59 PM AEST tonight</strong>
              </div>

              <p><strong>What you get:</strong></p>
              <ul>
                <li>20 AHPRA CPD hours (vs 2 in free course)</li>
                <li>Advanced modules: BESS, VOMS, RTL protocols</li>
                <li>100+ real case studies</li>
                <li>Quarterly live Q&A with specialists</li>
                <li>Private peer forum (1,200+ clinicians)</li>
                <li>Certificate of completion</li>
              </ul>

              <center>
                <a href="${upgradeLink}?code=SCAT99" class="button">
                  Claim $99 Off (Expires Tonight) →
                </a>
              </center>

              <p style="margin-top: 32px;">
                Questions before midnight? Reply to this email.<br><br>
                - Zac
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  },
  {
    day: 10,
    subject: '📚 Case Study: 16yo Rugby Player, Delayed Symptoms',
    template: (name: string, upgradeLink: string) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background: #f8fafc; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); padding: 40px 24px; text-align: center; }
            .header h1 { margin: 0; color: white; font-size: 28px; font-weight: 700; }
            .content { padding: 32px 24px; }
            .button { display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: 600; margin: 24px 0; }
            .case { background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 16px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📚 Real Case Study</h1>
            </div>
            <div class="content">
              <h2 style="margin-top: 0;">Hi ${name},</h2>
              <p>Want to see how the full course helps with complex cases?</p>

              <div class="case">
                <strong>Case:</strong> 16yo male rugby player<br>
                <strong>Presentation:</strong> Day 5 post-collision, "felt fine" at first, now headache + foggy<br>
                <strong>Parents:</strong> "He seems fine, just wants to play Saturday"<br>
                <strong>Coach:</strong> "Finals are this weekend, we need him"
              </div>

              <p><strong>The challenge:</strong></p>
              <ul>
                <li>Delayed symptom onset (missed by parents and coach)</li>
                <li>Pressure to clear for finals</li>
                <li>Potential medicolegal risk if you get it wrong</li>
              </ul>

              <p><strong>What would you do?</strong></p>

              <p>In the full course, Module 6 walks through this exact scenario:</p>
              <ul>
                <li>Red flags to look for with delayed onset</li>
                <li>How to handle coach/parent pressure (scripts included)</li>
                <li>Documentation that protects you legally</li>
                <li>When to refer to specialist vs manage yourself</li>
              </ul>

              <p>Plus 99 more real cases like this.</p>

              <center>
                <a href="${upgradeLink}" class="button">
                  Access 100+ Case Studies →
                </a>
              </center>

              <p style="margin-top: 32px;">
                - Zac
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  },
  {
    day: 14,
    subject: '🏆 Last Chance: Join 3,247 Clinicians',
    template: (name: string, upgradeLink: string) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background: #f8fafc; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 40px 24px; text-align: center; }
            .header h1 { margin: 0; color: white; font-size: 28px; font-weight: 700; }
            .content { padding: 32px 24px; }
            .button { display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: 600; margin: 24px 0; }
            .testimonial { background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 16px 0; font-style: italic; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏆 Final Email</h1>
            </div>
            <div class="content">
              <h2 style="margin-top: 0;">Hi ${name},</h2>
              <p>This is my last email about upgrading to the full course.</p>

              <p>I hope the free SCAT Mastery content was helpful.</p>

              <p>If you're ready to take your concussion management to the next level, 3,247 Australian clinicians are already inside the full course.</p>

              <div class="testimonial">
                "I've been a GP for 15 years and never felt confident with concussion. This course changed that. I now get 5-8 referrals/month from local sporting clubs."<br>
                <strong>- Dr. Sarah M., Melbourne</strong>
              </div>

              <p><strong>What's included:</strong></p>
              <ul>
                <li>20 AHPRA CPD hours</li>
                <li>Advanced assessment protocols (BESS, VOMS)</li>
                <li>100+ real case studies</li>
                <li>Return-to-play & return-to-learn frameworks</li>
                <li>Quarterly live Q&A sessions</li>
                <li>Private clinician community</li>
              </ul>

              <p><strong>$490/year = $24.50 per CPD hour</strong><br>
              (vs $75/hour at conferences)</p>

              <center>
                <a href="${upgradeLink}" class="button">
                  Join 3,247 Clinicians →
                </a>
              </center>

              <p style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                If you have questions or need help, just reply to this email.<br><br>
                Otherwise, enjoy the free SCAT Mastery content - you'll stay on my newsletter for new updates and case studies.<br><br>
                All the best,<br>
                - Zac
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  },
]
