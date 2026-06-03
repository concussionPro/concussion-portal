/**
 * One-shot script — sends a cold-outreach T1 sample to Zac's inbox using
 * a REAL P1 prospect's data (POGO Physio, Gold Coast). Treats it as if
 * it were going to the live prospect but redirects To: → Zac for review.
 *
 * Run: npx tsx scripts/send-real-clinic-sample.ts
 */
import { config } from 'dotenv'
config({ path: '.env.local' })
import { Resend } from 'resend'
import { EMAIL_TEMPLATES, mergeTemplate } from '../lib/prospect/email-templates'
import type { ProspectClinic } from '../lib/prospect/types'

// P1 #1 — first prospect on the target list. Real public-record details.
const POGO_PHYSIO: ProspectClinic = {
  id: 0,
  slug: 'pogo-physio',
  accessKey: 'pg9k2a',
  name: 'POGO Physio',
  shortName: 'POGO Physio',
  city: 'Burleigh Heads',
  state: 'QLD',
  region: 'Gold Coast',
  contactFirstName: 'Brad',
  contactFullName: 'Brad Beer',
  contactEmail: 'brad@pogophysio.com.au',
  contactRole: 'Founder & Principal Physiotherapist',
  contactDiscipline: 'physiotherapists',
  clinicWebsiteUrl: 'https://pogophysio.com.au',
  team: {
    osteopaths: 0,
    physiotherapists: 12,
    generalPractitioners: 0,
    sportsMedicineDoctors: 0,
    exercisePhys: 2,
    myotherapists: 0,
    remedialMassage: 0,
    practiceManager: 1,
    admin: 2,
  },
  localTargets: [],
  travelBand: 'within-2hr',
  travelSurcharge: 0,
  cohortRecommendation: 'recommended',
  status: 'approved',
  researchSource: 'manual',
  validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
  createdAt: new Date(),
  updatedAt: new Date(),
}

async function main() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('RESEND_API_KEY missing in env')
    process.exit(1)
  }

  const zacInbox = process.env.ZAC_INBOX ?? 'zac@concussion-education-australia.com'
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://portal.concussion-education-australia.com'

  const template = EMAIL_TEMPLATES.find((t) => t.slug === 'initial')!
  const { subject, body } = mergeTemplate(template, POGO_PHYSIO, baseUrl, 'sample-pgphys-2026-06-03')

  console.log('--- RENDERED EMAIL ---')
  console.log('Subject:', subject)
  console.log()
  console.log(body)
  console.log('--- SENDING TO:', zacInbox, '---')

  const resend = new Resend(apiKey)
  const result = await resend.emails.send({
    from: 'Zac Lewis <partnerships@concussion-education-australia.com>',
    to: zacInbox,
    replyTo: 'zac@concussion-education-australia.com',
    subject: `[SAMPLE · POGO Physio · T1] ${subject}`,
    text: body,
    headers: {
      'List-Unsubscribe':
        '<https://portal.concussion-education-australia.com/api/prospect/unsubscribe?t=sample>, <mailto:unsubscribe@concussion-education-australia.com>',
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      'List-ID': 'prospect-outreach.concussion-education-australia.com',
      Precedence: 'bulk',
      'X-Mailer': 'ConcussionPro Outreach Sample',
    },
    tags: [
      { name: 'category', value: 'sample-pitch' },
      { name: 'clinic', value: 'pogo-physio' },
      { name: 'template', value: 'initial' },
    ],
  })

  if (result.error) {
    console.error('Send failed:', result.error)
    process.exit(1)
  }
  console.log('\n✅ Sent. Resend email id:', result.data?.id)
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
