/**
 * POST /api/admin/send-sample-pitch
 *
 * Renders the T1 cold outreach template against a sample prospect (POGO
 * Physio by default) and sends it to Zac's inbox via Resend. No DB write,
 * no signoff gate — explicit sample for content review.
 *
 * Body (optional): { discipline?: 'osteopaths' | 'physiotherapists' | 'generalPractitioners' | 'sportsMedicineDoctors' | 'exercisePhys' }
 * Default: physiotherapists (the dominant cold-outreach segment)
 *
 * Auth: admin header / cookie.
 */
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { isAdminRequest } from '@/lib/require-admin'
import { EMAIL_TEMPLATES, mergeTemplate } from '@/lib/prospect/email-templates'
import type { ProspectClinic, Discipline } from '@/lib/prospect/types'

const SAMPLE_CLINIC_BASE: Omit<ProspectClinic, 'contactDiscipline' | 'team'> = {
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
  contactRole: 'Principal Physiotherapist',
  clinicWebsiteUrl: 'https://pogophysio.com.au',
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

const SAMPLE_TEAMS: Record<Discipline, { team: ProspectClinic['team']; contactDiscipline: Discipline }> = {
  physiotherapists: {
    contactDiscipline: 'physiotherapists',
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
  },
  osteopaths: {
    contactDiscipline: 'osteopaths',
    team: {
      osteopaths: 9,
      physiotherapists: 0,
      generalPractitioners: 0,
      sportsMedicineDoctors: 0,
      exercisePhys: 3,
      myotherapists: 2,
      remedialMassage: 2,
      practiceManager: 1,
      admin: 2,
    },
  },
  generalPractitioners: {
    contactDiscipline: 'generalPractitioners',
    team: {
      osteopaths: 0,
      physiotherapists: 3,
      generalPractitioners: 6,
      sportsMedicineDoctors: 0,
      exercisePhys: 1,
      myotherapists: 0,
      remedialMassage: 0,
      practiceManager: 1,
      admin: 2,
    },
  },
  sportsMedicineDoctors: {
    contactDiscipline: 'sportsMedicineDoctors',
    team: {
      osteopaths: 1,
      physiotherapists: 4,
      generalPractitioners: 0,
      sportsMedicineDoctors: 3,
      exercisePhys: 2,
      myotherapists: 0,
      remedialMassage: 0,
      practiceManager: 1,
      admin: 2,
    },
  },
  exercisePhys: {
    contactDiscipline: 'exercisePhys',
    team: {
      osteopaths: 0,
      physiotherapists: 2,
      generalPractitioners: 0,
      sportsMedicineDoctors: 0,
      exercisePhys: 8,
      myotherapists: 0,
      remedialMassage: 0,
      practiceManager: 1,
      admin: 2,
    },
  },
  myotherapists: {
    contactDiscipline: 'myotherapists',
    team: {
      osteopaths: 2, physiotherapists: 2, generalPractitioners: 0, sportsMedicineDoctors: 0,
      exercisePhys: 1, myotherapists: 4, remedialMassage: 2, practiceManager: 1, admin: 1,
    },
  },
  remedialMassage: {
    contactDiscipline: 'remedialMassage',
    team: {
      osteopaths: 2, physiotherapists: 2, generalPractitioners: 0, sportsMedicineDoctors: 0,
      exercisePhys: 1, myotherapists: 2, remedialMassage: 4, practiceManager: 1, admin: 1,
    },
  },
  practiceManager: {
    contactDiscipline: 'practiceManager',
    team: {
      osteopaths: 0, physiotherapists: 8, generalPractitioners: 0, sportsMedicineDoctors: 0,
      exercisePhys: 2, myotherapists: 0, remedialMassage: 0, practiceManager: 1, admin: 2,
    },
  },
  admin: {
    contactDiscipline: 'admin',
    team: {
      osteopaths: 0, physiotherapists: 8, generalPractitioners: 0, sportsMedicineDoctors: 0,
      exercisePhys: 2, myotherapists: 0, remedialMassage: 0, practiceManager: 1, admin: 2,
    },
  },
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { discipline?: Discipline; templateSlug?: 'initial' | 'followup' | 'final' }
  try {
    body = await req.json().catch(() => ({}))
  } catch {
    body = {}
  }

  const discipline: Discipline = body.discipline ?? 'physiotherapists'
  const templateSlug = body.templateSlug ?? 'initial'

  const setup = SAMPLE_TEAMS[discipline]
  const clinic: ProspectClinic = {
    ...SAMPLE_CLINIC_BASE,
    contactDiscipline: setup.contactDiscipline,
    team: setup.team,
  }

  const template = EMAIL_TEMPLATES.find((t) => t.slug === templateSlug)
  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://portal.concussion-education-australia.com'
  const { subject, html, text } = mergeTemplate(template, clinic, baseUrl, 'sample-token')

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json({
      ok: false,
      error: 'RESEND_API_KEY not configured — returning rendered content only',
      subject,
      html,
      text,
    })
  }

  const resend = new Resend(apiKey)
  const zacInbox = process.env.ZAC_INBOX ?? 'zac@concussion-education-australia.com'
  const finalSubject = `[SAMPLE · ${discipline} · ${templateSlug}] ${subject}`

  try {
    const result = await resend.emails.send({
      from: 'Zac Lewis <partnerships@concussion-education-australia.com>',
      to: zacInbox,
      replyTo: 'zac@concussion-education-australia.com',
      subject: finalSubject,
      html,
      text,
      headers: {
        'List-Unsubscribe': `<${baseUrl}/api/prospect/unsubscribe?t=sample>, <mailto:unsubscribe@concussion-education-australia.com>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'List-ID': 'prospect-outreach.concussion-education-australia.com',
        Precedence: 'bulk',
        'X-Mailer': 'ConcussionPro Outreach Sample',
      },
      tags: [
        { name: 'category', value: 'sample-pitch' },
        { name: 'discipline', value: discipline },
        { name: 'template', value: templateSlug },
      ],
    })
    if (result.error) {
      return NextResponse.json({ ok: false, error: 'Resend send failed', detail: result.error }, { status: 502 })
    }
    return NextResponse.json({
      ok: true,
      resendEmailId: result.data?.id,
      sentTo: zacInbox,
      subject: finalSubject,
      textPreview: text.slice(0, 600) + '…',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: 'Resend exception', detail: message }, { status: 502 })
  }
}
