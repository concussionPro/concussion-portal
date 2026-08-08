import { describe, it, expect } from 'vitest'
import {
  generatePatientCode, normalisePatientCode, generateResearchRef,
  INTAKE_FIELDS, INTAKE_FIELDS_ON_NEW_DEVICE,
} from '../lib/sst-trainer/patient-identity'
import { stripIdentifiers } from '../lib/sst-trainer/patient-registry'
import {
  parseSessionResearchFields, RESEARCH_CONSENT_VERSION, daysSinceInjury,
  ageBandFromBirthYear, isValidSymptomScore, MAX_DAYS_SINCE_INJURY,
} from '../lib/sst-trainer/research'

/**
 * These assert the DANGEROUS directions. Every failure mode below either merges
 * two people's clinical records, splits one person's, or enrols someone in
 * research they never agreed to.
 */

describe('patient codes are a safe identity key', () => {
  it('mints 6-char codes from an unambiguous alphabet', () => {
    for (let i = 0; i < 200; i++) {
      const c = generatePatientCode()
      expect(c).toHaveLength(6)
      // No glyph that can be misread as another — these get read aloud in a
      // clinic and typed by someone concussed.
      expect(c).not.toMatch(/[O0I1S5Z2]/)
    }
  })

  it('survives the transcription errors people actually make', () => {
    const c = generatePatientCode()
    expect(normalisePatientCode(c.toLowerCase())).toBe(c)
    expect(normalisePatientCode(` ${c} `)).toBe(c)
    expect(normalisePatientCode(`${c.slice(0, 3)}-${c.slice(3)}`)).toBe(c)
  })

  it('folds ambiguous glyphs onto one member so a typo still lands on the right record', () => {
    // A patient typing O for Q must reach their own record, not nothing.
    expect(normalisePatientCode('QQQQQQ')).toBe(normalisePatientCode('OOOOOO'))
    expect(normalisePatientCode('LLLLLL')).toBe(normalisePatientCode('111111'))
    expect(normalisePatientCode('444444')).toBe(normalisePatientCode('SSSSSS'))
  })

  it('rejects malformed codes as NO identity, never as a wildcard', () => {
    for (const bad of ['', '   ', 'ABC', 'ABCDEFG', '!!!!!!', null, undefined, 42]) {
      expect(normalisePatientCode(bad)).toBe('')
    }
  })

  it('research refs are unique and random, NOT derived from the patient code', () => {
    const refs = new Set(Array.from({ length: 500 }, () => generateResearchRef()))
    expect(refs.size).toBe(500)
    // Derivation would let the clinic — which holds the code list — reverse the
    // pseudonym and re-identify a published row.
    const code = generatePatientCode()
    expect(generateResearchRef()).not.toContain(code)
  })
})

describe('intake is asked once and stays small', () => {
  it('is five fields — anything more belongs to the clinician', () => {
    expect(INTAKE_FIELDS).toHaveLength(5)
  })

  it('asks consent LAST, after the patient has seen what is collected', () => {
    expect(INTAKE_FIELDS[INTAKE_FIELDS.length - 1]).toBe('researchConsent')
  })

  it('a new device asks for the CODE ONLY — demographics already exist server-side', () => {
    expect(INTAKE_FIELDS_ON_NEW_DEVICE).toEqual(['patientCode'])
  })
})

describe('consent cannot be claimed, only granted', () => {
  it('accepts only a real, current consent version', () => {
    expect(parseSessionResearchFields({ researchConsentVersion: RESEARCH_CONSENT_VERSION })
      .researchConsentVersion).toBe(RESEARCH_CONSENT_VERSION)
  })

  it('REJECTS a version that does not exist — that would enrol someone in unseen wording', () => {
    for (const bad of [99, 0, -1, 1.5, '1', true, null, undefined]) {
      expect(parseSessionResearchFields({ researchConsentVersion: bad }).researchConsentVersion).toBeNull()
    }
  })

  it('a payload with no consent field is NOT enrolled', () => {
    expect(parseSessionResearchFields({}).researchConsentVersion).toBeNull()
    expect(parseSessionResearchFields(null).researchConsentVersion).toBeNull()
  })
})

describe('de-identification', () => {
  it('never transmits a date — days-since-injury only, and refuses impossible values', () => {
    const at = new Date('2026-08-09T00:00:00Z')
    expect(daysSinceInjury('2026-08-02T00:00:00Z', at)).toBe(7)
    // Injury "after" the session, and beyond the plausible window: a wrong
    // covariate silently biases a model, a missing one just drops the row.
    expect(daysSinceInjury('2026-09-01T00:00:00Z', at)).toBeNull()
    expect(daysSinceInjury('2000-01-01T00:00:00Z', at)).toBeNull()
    expect(daysSinceInjury('not-a-date', at)).toBeNull()
  })

  it('bands ages rather than storing a birth date', () => {
    const now = new Date('2026-08-09T00:00:00Z')
    expect(ageBandFromBirthYear(2010, now)).toBe('13-17')
    expect(ageBandFromBirthYear(2000, now)).toBe('25-34')
    expect(ageBandFromBirthYear(1960, now)).toBe('65+')
    expect(ageBandFromBirthYear(2020, now)).toBeNull() // under 13, not validated
    expect(ageBandFromBirthYear(1800, now)).toBeNull()
  })

  it('strips every identifier from the free-form payload blob', () => {
    const cleaned = stripIdentifiers({
      patientCode: 'ABC123', patientRef: 'uuid', patientName: 'John Smith',
      clinicCode: 'H5TVXT', email: 'a@b.c', injuryDate: '2026-08-01',
      researchRef: 'leaked', firstName: 'John', homeAddress: '1 X St',
      // the measurements that must SURVIVE
      secondsAbove: 42, nextDayFlare: true, verifiedReadingPct: 91,
    })
    expect(Object.keys(cleaned).sort()).toEqual(['nextDayFlare', 'secondsAbove', 'verifiedReadingPct'])
  })

  it('drops unknown name-shaped keys a future client might add', () => {
    const cleaned = stripIdentifiers({ guardianName: 'x', emailAddress: 'y', birthYear: 1990, hrtBpm: 140 })
    expect(cleaned).toEqual({ hrtBpm: 140 })
  })
})

describe('symptom score is the validated instrument, not the 0-10 single item', () => {
  it('bounds to the SCAT6/PCSS range so a 0-10 item cannot masquerade as it', () => {
    expect(isValidSymptomScore(0)).toBe(true)
    expect(isValidSymptomScore(132)).toBe(true)
    expect(isValidSymptomScore(133)).toBe(false)
    expect(isValidSymptomScore(-1)).toBe(false)
    expect(isValidSymptomScore(6.5)).toBe(false)
  })
})

describe('days-since-injury bound', () => {
  it('caps at two years', () => {
    expect(MAX_DAYS_SINCE_INJURY).toBe(730)
    expect(parseSessionResearchFields({ daysSinceInjury: 731 }).daysSinceInjury).toBeNull()
    expect(parseSessionResearchFields({ daysSinceInjury: 730 }).daysSinceInjury).toBe(730)
    expect(parseSessionResearchFields({ daysSinceInjury: -1 }).daysSinceInjury).toBeNull()
  })
})
