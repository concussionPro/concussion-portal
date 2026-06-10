import { describe, it, expect } from 'vitest'
import { EMAIL_TEMPLATES, mergeTemplate } from '@/lib/prospect/email-templates'
import { preflightClinic } from '@/lib/prospect/preflight'
import type { ProspectClinic, ClinicTeam } from '@/lib/prospect/types'

const T1 = EMAIL_TEMPLATES.find((t) => t.slug === 'initial')!
const T3 = EMAIL_TEMPLATES.find((t) => t.slug === 'final')!

function team(clinical: number): ClinicTeam {
  return {
    osteopaths: 0,
    physiotherapists: clinical,
    generalPractitioners: 0,
    sportsMedicineDoctors: 0,
    exercisePhys: 0,
    myotherapists: 0,
    remedialMassage: 0,
    practiceManager: 1,
    admin: 1,
  }
}

function clinic(overrides: Partial<ProspectClinic>): ProspectClinic {
  return {
    id: 1,
    slug: 'test-clinic',
    shortName: 'Test Clinic',
    contactEmail: 'jane@testclinic.com.au',
    contactFirstName: 'Jane',
    city: 'Ballina',
    state: 'NSW',
    region: 'Northern Rivers',
    team: team(3),
    travelBand: 'A',
    clinicWebsiteUrl: 'https://testclinic.com.au',
    ...overrides,
  } as ProspectClinic
}

describe('size-tier pitch selection (Zac 2026-06-10: large on-site > medium hub > individuals)', () => {
  it('solo clinician (1 clinical) gets the individual course pitch, not the Hub Pack', () => {
    const { html } = mergeTemplate(T1, clinic({ team: team(1) }), 'https://example.com', 'tok')
    expect(html).toContain('Concussion Clinical Mastery')
    expect(html).not.toContain('Hub Pack')
    expect(html).not.toContain('clinic-branded admin pack')
    expect(html).not.toMatch(/on-site/i)
  })

  it('individual pitch never mentions the Melbourne workshop date or stale prices', () => {
    const { html } = mergeTemplate(T1, clinic({ team: team(1) }), 'https://example.com', 'tok')
    expect(html).not.toMatch(/melbourne workshop/i)
    expect(html).not.toMatch(/13 june/i)
    expect(html).not.toContain('1,190')
    expect(html).not.toContain('1190')
  })

  it('medium clinic (2-5 clinical) keeps the Hub Pack pitch', () => {
    for (const n of [2, 5]) {
      const { html } = mergeTemplate(T1, clinic({ team: team(n) }), 'https://example.com', 'tok')
      expect(html).toContain('clinic-branded admin pack')
    }
  })

  it('large clinic (>=6 clinical) gets the on-site cohort pitch', () => {
    for (const n of [6, 8, 21]) {
      const { html } = mergeTemplate(T1, clinic({ team: team(n) }), 'https://example.com', 'tok')
      expect(html).toMatch(/on-site/i)
      expect(html).not.toContain('clinic-branded admin pack')
    }
  })

  it('T3 disclosure shows the online-course price for individuals and Hub Pack for teams', () => {
    const solo = mergeTemplate(T3, clinic({ team: team(1) }), 'https://example.com', 'tok')
    expect(solo.html).toContain('online course')
    expect(solo.html).not.toContain('Hub Pack')
    const medium = mergeTemplate(T3, clinic({ team: team(4) }), 'https://example.com', 'tok')
    expect(medium.html).toContain('Hub Pack')
  })
})

describe('institutional preflight gate (Zac 2026-06-10: unis and hospitals are not targets)', () => {
  const cases: Array<[string, Partial<ProspectClinic>]> = [
    ['hospital in name', { shortName: 'University Hospital Geelong' }],
    ['health network email', { contactEmail: 'jane@monashhealth.org' }],
    ['UK public health email', { contactEmail: 'jane@health.org.uk' }],
    ['edu.au email', { contactEmail: 'jane@unimelb.edu.au' }],
    ['gov.au email', { contactEmail: 'jane@health.nsw.gov.au' }],
    ['edu.au website', { clinicWebsiteUrl: 'https://sport.monash.edu.au/clinic' }],
    ['university in name', { shortName: 'University Sports Medicine Centre' }],
  ]
  for (const [label, overrides] of cases) {
    it(`quarantines: ${label}`, async () => {
      const result = await preflightClinic(clinic(overrides), { verifyEmail: false })
      expect(result.failures.map((f) => f.code)).toContain('institutional_target')
      expect(result.severity).toBe('quarantine')
    })
  }

  it('does NOT flag private clinics with "Health Services" in the name', async () => {
    for (const name of ['Inspire Health Services', 'Minerva Allied Health Services', 'Momentum Physiotherapy & Health Services']) {
      const result = await preflightClinic(clinic({ shortName: name }), { verifyEmail: false })
      expect(result.failures.map((f) => f.code)).not.toContain('institutional_target')
    }
  })
})
