/**
 * Tests for the deal-type tier classification (lib/prospect/pricing.ts)
 * and the prospect-approve bulk-action body validator.
 *
 * The tier boundaries are the canonical send-priority split:
 *   on-site    : clinical >= 8   (min 8 to run an on-site day — Zac 2026-06-18)
 *   hub-pack   : clinical 2-7
 *   individual : clinical <= 1
 * Keep in lockstep with the SQL CASE in lib/prospect/process-scheduled.ts.
 */
import { describe, it, expect } from 'vitest'
import { dealTypeFor, dealTypeForClinicalCount, clinicalCount } from '@/lib/prospect/pricing'
import type { ClinicTeam } from '@/lib/prospect/types'
import { validateApproveRequest } from '@/app/api/admin/prospect-approve/route'

function team(overrides: Partial<ClinicTeam> = {}): ClinicTeam {
  return {
    osteopaths: 0,
    physiotherapists: 0,
    chiropractors: 0,    generalPractitioners: 0,
    sportsMedicineDoctors: 0,
    exercisePhys: 0,
    myotherapists: 0,
    remedialMassage: 0,
    practiceManager: 0,
    admin: 0,
    ...overrides,
  }
}

describe('dealTypeForClinicalCount — boundary values', () => {
  it('classifies 0 and 1 clinical as individual', () => {
    expect(dealTypeForClinicalCount(0)).toBe('individual')
    expect(dealTypeForClinicalCount(1)).toBe('individual')
  })

  it('classifies 2 clinical as hub-pack (lower boundary)', () => {
    expect(dealTypeForClinicalCount(2)).toBe('hub-pack')
  })

  it('classifies 6 and 7 clinical as hub-pack (upper boundary — on-site needs 8)', () => {
    expect(dealTypeForClinicalCount(5)).toBe('hub-pack')
    expect(dealTypeForClinicalCount(6)).toBe('hub-pack')
    expect(dealTypeForClinicalCount(7)).toBe('hub-pack')
  })

  it('classifies 8 clinical as on-site (lower boundary)', () => {
    expect(dealTypeForClinicalCount(8)).toBe('on-site')
  })

  it('classifies 21 clinical as on-site (enterprise stays on-site)', () => {
    expect(dealTypeForClinicalCount(21)).toBe('on-site')
  })
})

describe('dealTypeFor — derives from clinicalCount over the 7 clinical keys', () => {
  it('1 osteo → individual', () => {
    expect(dealTypeFor(team({ osteopaths: 1 }))).toBe('individual')
  })

  it('1 osteo + 1 physio → hub-pack (boundary 2)', () => {
    expect(dealTypeFor(team({ osteopaths: 1, physiotherapists: 1 }))).toBe('hub-pack')
  })

  it('5 spread across clinical disciplines → hub-pack (boundary 5)', () => {
    const t = team({ osteopaths: 1, physiotherapists: 1, generalPractitioners: 1, exercisePhys: 1, remedialMassage: 1 })
    expect(clinicalCount(t)).toBe(5)
    expect(dealTypeFor(t)).toBe('hub-pack')
  })

  it('7 across clinical keys → hub-pack (on-site needs 8)', () => {
    const t = team({ sportsMedicineDoctors: 1, myotherapists: 2, physiotherapists: 3, chiropractors: 1 })
    expect(clinicalCount(t)).toBe(7)
    expect(dealTypeFor(t)).toBe('hub-pack')
  })

  it('8 across clinical keys (incl. chiro) → on-site (boundary 8)', () => {
    const t = team({ sportsMedicineDoctors: 1, myotherapists: 2, physiotherapists: 3, chiropractors: 2 })
    expect(clinicalCount(t)).toBe(8)
    expect(dealTypeFor(t)).toBe('on-site')
  })

  it('ignores practiceManager + admin (non-clinical)', () => {
    // 1 clinical + 8 admin staff is still an individual pitch
    expect(dealTypeFor(team({ osteopaths: 1, practiceManager: 3, admin: 5 }))).toBe('individual')
    // 5 clinical + admin padding never tips into on-site
    expect(dealTypeFor(team({ physiotherapists: 5, practiceManager: 2, admin: 2 }))).toBe('hub-pack')
  })

  it('21 clinical → on-site', () => {
    expect(dealTypeFor(team({ physiotherapists: 21 }))).toBe('on-site')
  })
})

describe('validateApproveRequest — prospect-approve body validation', () => {
  it('accepts a valid approve payload', () => {
    const r = validateApproveRequest({ ids: [1, 2, 3], action: 'approve' })
    expect(r).toEqual({ ok: true, value: { ids: [1, 2, 3], action: 'approve' } })
  })

  it('accepts a valid archive payload and dedupes ids', () => {
    const r = validateApproveRequest({ ids: [7, 7, 9], action: 'archive' })
    expect(r).toEqual({ ok: true, value: { ids: [7, 9], action: 'archive' } })
  })

  it('rejects unknown actions', () => {
    expect(validateApproveRequest({ ids: [1], action: 'delete' }).ok).toBe(false)
  })

  it('rejects missing / empty / non-array ids', () => {
    expect(validateApproveRequest({ action: 'approve' }).ok).toBe(false)
    expect(validateApproveRequest({ ids: [], action: 'approve' }).ok).toBe(false)
    expect(validateApproveRequest({ ids: '1,2', action: 'approve' }).ok).toBe(false)
  })

  it('rejects non-integer, negative, and string ids', () => {
    expect(validateApproveRequest({ ids: [1.5], action: 'approve' }).ok).toBe(false)
    expect(validateApproveRequest({ ids: [-1], action: 'approve' }).ok).toBe(false)
    expect(validateApproveRequest({ ids: [0], action: 'approve' }).ok).toBe(false)
    expect(validateApproveRequest({ ids: ['1'], action: 'approve' }).ok).toBe(false)
    expect(validateApproveRequest({ ids: [NaN], action: 'approve' }).ok).toBe(false)
  })

  it('caps at 500 ids per call', () => {
    const ids500 = Array.from({ length: 500 }, (_, i) => i + 1)
    expect(validateApproveRequest({ ids: ids500, action: 'approve' }).ok).toBe(true)
    expect(validateApproveRequest({ ids: [...ids500, 501], action: 'approve' }).ok).toBe(false)
  })

  it('rejects non-object bodies', () => {
    expect(validateApproveRequest(null).ok).toBe(false)
    expect(validateApproveRequest([1, 2]).ok).toBe(false)
    expect(validateApproveRequest('approve').ok).toBe(false)
  })
})
