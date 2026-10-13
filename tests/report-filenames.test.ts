import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

/**
 * THE FILENAME IS THE BP INTEGRATION.
 *
 * Bp Premier imports correspondence through Bulk Document Import: it reads a
 * FOLDER of PDFs and allocates each to a patient record by matching the name
 * in the filename. There is no cloud API to call (BP is on-premise SQL Server)
 * and secure messaging means an HL7 vendor. So the cheapest path from "report
 * generated" to "report in the patient's record" is a filename BP can file —
 * point the browser's download directory at the BDI folder and import a batch.
 *
 * Shape: SURNAME_Firstname_DOC-TYPE_YYYY-MM-DD.pdf
 */
const gp = readFileSync('app/api/sst/gp-report/route.ts', 'utf8')
const rep = readFileSync('app/api/sst/report/route.ts', 'utf8')

describe('every issued PDF is filable without being renamed', () => {
  it('surname leads, because that is what BP matches on', () => {
    for (const [name, src] of [['gp-report', gp], ['report', rep]] as const) {
      expect(src, name).toContain("parts[parts.length - 1]")
      expect(src, name).toContain('.toUpperCase()')
    }
  })

  it('underscore separated — BDI splits on them', () => {
    expect(gp).toContain(".join('_')")
    expect(rep).toContain(".join('_')")
  })

  it('carries a date so a second report does not overwrite the first', () => {
    for (const [name, src] of [['gp-report', gp], ['report', rep]] as const) {
      expect(src, name).toContain("new Date().toISOString().slice(0, 10)")
    }
  })

  it('no longer ships the old unfilable names', () => {
    expect(gp).not.toContain('sst-episode-report-${patientLabel')
    expect(rep).not.toMatch(/const slug = `\$\{skin\}-\$\{patientLabel/)
  })

  it('a single-word patient label still produces a valid filename', () => {
    // parts.length === 1 falls back to that word rather than an empty surname
    expect(gp).toContain("parts.length > 1 ? parts[parts.length - 1] : parts[0] || 'patient'")
  })
})
