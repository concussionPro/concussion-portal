import { describe, it, expect } from 'vitest'
import { parseSquarespaceEmail } from '@/lib/squarespace-email-parser'

const SS_FOOTER = `

Manage Submissions

Does this submission look like spam? Report it here.`

function body(fields: Record<string, string>): string {
  const lines = ['Sent via form submission from Concussion Education Australia', '']
  for (const [k, v] of Object.entries(fields)) {
    lines.push(`${k}: ${v}`)
  }
  return lines.join('\n') + SS_FOOTER
}

describe('parseSquarespaceEmail — city resolution by form name', () => {
  it('routes Sydney form to sydney', () => {
    const r = parseSquarespaceEmail({
      subject: 'New Form Submission - Sydney',
      bodyText: body({ Name: 'Jane Smith', Email: 'jane@example.com, accepts marketing: true' }),
    })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.payload.city).toBe('sydney')
  })

  it('routes Melbourne form to melbourne', () => {
    const r = parseSquarespaceEmail({
      subject: 'Melbourne — New Form Submission',
      bodyText: body({ Name: 'Callum Hogan', Email: 'callum.m.hogan@gmail.com, accepts marketing: true' }),
    })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.payload.city).toBe('melbourne')
  })

  it('routes Byron Bay form to byron-bay', () => {
    const r = parseSquarespaceEmail({
      subject: 'New Form Submission - Byron Bay',
      bodyText: body({ Name: 'Sam Lee', Email: 'sam@example.com' }),
    })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.payload.city).toBe('byron-bay')
  })

  it('routes WA form to wa', () => {
    const r = parseSquarespaceEmail({
      subject: 'New Form Submission - WA',
      bodyText: body({ Name: 'Tom H', Email: 'tomh@wchphysionorthbeach.com.au', Location: 'North Beach' }),
    })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.payload.city).toBe('wa')
  })

  it('routes SA form to adelaide', () => {
    const r = parseSquarespaceEmail({
      subject: 'New Form Submission - SA',
      bodyText: body({ Name: 'Pat Doe', Email: 'pat@example.com' }),
    })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.payload.city).toBe('adelaide')
  })
})

describe('parseSquarespaceEmail — combined SA / WA form', () => {
  it('uses State=Western Australia to route to wa', () => {
    const r = parseSquarespaceEmail({
      subject: 'New Form Submission - SA / WA',
      bodyText: body({
        Name: 'Natasha P',
        Email: 'natasha@perthsportsphysio.com, accepts marketing: true',
        State: 'Western Australia',
      }),
    })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.payload.city).toBe('wa')
  })

  it('uses State=South Australia to route to adelaide', () => {
    const r = parseSquarespaceEmail({
      subject: 'SA / WA',
      bodyText: body({
        Name: 'Casey M',
        Email: 'casey@example.com',
        State: 'South Australia',
      }),
    })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.payload.city).toBe('adelaide')
  })

  it('falls back to Location keyword (Perth) when State is missing', () => {
    const r = parseSquarespaceEmail({
      subject: 'SA / WA',
      bodyText: body({
        Name: 'Avery K',
        Email: 'avery@example.com',
        Location: 'Perth, WA',
      }),
    })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.payload.city).toBe('wa')
  })

  it('falls back to Location keyword (Adelaide) when State is missing', () => {
    const r = parseSquarespaceEmail({
      subject: 'SA / WA',
      bodyText: body({
        Name: 'Rae T',
        Email: 'rae@example.com',
        Location: 'Adelaide CBD',
      }),
    })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.payload.city).toBe('adelaide')
  })

  it('fails with diagnostic when SA / WA form has no State and ambiguous Location', () => {
    const r = parseSquarespaceEmail({
      subject: 'SA / WA',
      bodyText: body({
        Name: 'Quinn R',
        Email: 'quinn@example.com',
        Location: 'somewhere in the country',
      }),
    })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.error).toMatch(/Could not resolve city/)
      expect(r.diagnostic.extractedEmail).toBe('quinn@example.com')
    }
  })
})

describe('parseSquarespaceEmail — error paths', () => {
  it('fails when email is missing', () => {
    const r = parseSquarespaceEmail({
      subject: 'New Form Submission - Sydney',
      bodyText: body({ Name: 'No Email' }),
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/email/i)
  })

  it('fails when email is malformed', () => {
    const r = parseSquarespaceEmail({
      subject: 'New Form Submission - Sydney',
      bodyText: body({ Name: 'Bad Email', Email: 'not-an-email' }),
    })
    expect(r.ok).toBe(false)
  })

  it('fails when name is missing or too short', () => {
    const r = parseSquarespaceEmail({
      subject: 'New Form Submission - Sydney',
      bodyText: body({ Email: 'someone@example.com' }),
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/name/i)
  })

  it('fails with diagnostic when form name is unknown', () => {
    const r = parseSquarespaceEmail({
      subject: 'New Form Submission - Quarterly Newsletter Signup',
      bodyText: body({ Name: 'Reader', Email: 'reader@example.com' }),
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/Could not resolve city/)
  })

  it('returns diagnostic info on every failure path for ops triage', () => {
    const r = parseSquarespaceEmail({ subject: 'Weird Subject', bodyText: 'totally not a Squarespace email' })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.diagnostic.subject).toBe('Weird Subject')
      expect(r.diagnostic.extractedEmail).toBe(null)
    }
  })
})

describe('parseSquarespaceEmail — field extraction', () => {
  it('lowercases the email', () => {
    const r = parseSquarespaceEmail({
      subject: 'New Form Submission - Sydney',
      bodyText: body({ Name: 'Mixed Case', Email: 'MixEd@CASE.com' }),
    })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.payload.email).toBe('mixed@case.com')
  })

  it('strips the "accepts marketing: true" suffix from email field', () => {
    const r = parseSquarespaceEmail({
      subject: 'New Form Submission - Sydney',
      bodyText: body({ Name: 'Marketer', Email: 'opt@in.com, accepts marketing: true' }),
    })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.payload.email).toBe('opt@in.com')
  })

  it('captures acceptsMarketing flag when present', () => {
    const r = parseSquarespaceEmail({
      subject: 'New Form Submission - Sydney',
      bodyText: body({ Name: 'Yes', Email: 'yes@example.com, accepts marketing: true' }),
    })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.payload.acceptsMarketing).toBe(true)
  })

  it('preserves rawLocation and rawState on the success payload for audit', () => {
    const r = parseSquarespaceEmail({
      subject: 'SA / WA',
      bodyText: body({
        Name: 'Audit Me',
        Email: 'audit@example.com',
        State: 'Western Australia',
        Location: 'Subiaco',
      }),
    })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.payload.rawState).toBe('Western Australia')
      expect(r.payload.rawLocation).toBe('Subiaco')
    }
  })

  it('truncates absurdly long names at 100 chars', () => {
    const r = parseSquarespaceEmail({
      subject: 'New Form Submission - Sydney',
      bodyText: body({ Name: 'A'.repeat(500), Email: 'long@example.com' }),
    })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.payload.name.length).toBe(100)
  })

  it('sets source to squarespace-email-router for downstream attribution', () => {
    const r = parseSquarespaceEmail({
      subject: 'New Form Submission - Sydney',
      bodyText: body({ Name: 'Sourced', Email: 'source@example.com' }),
    })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.payload.source).toBe('squarespace-email-router')
  })
})
