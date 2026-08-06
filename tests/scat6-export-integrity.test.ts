import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * SCAT6 flat-PDF exporter behaviour.
 *
 * The drawing helpers are stubbed so the test asserts WHAT the exporter puts
 * on the page (and where) without needing pdf-lib, a browser or the 9-page
 * template. The rule under test: an untouched or skipped subtest must print a
 * "not administered" dash and NO item marks — never a 0, and never a mark in
 * the "0" / "No" column.
 */

const calls = {
  text: [] as Array<{ page: number; x: number; y: number; text: string }>,
  circles: [] as Array<{ page: number; x: number; y: number }>,
  dashes: [] as Array<{ page: number; x: number; y: number }>,
  checks: [] as Array<{ page: number; x: number; y: number }>,
}

vi.mock('@/app/scat-forms/shared/utils/pdf-draw-helpers', async importOriginal => {
  const actual = await importOriginal<typeof import('@/app/scat-forms/shared/utils/pdf-draw-helpers')>()
  const pageIndex = (page: unknown) => (page as { __index: number }).__index
  return {
    ...actual,
    loadFlatPDF: vi.fn(async () => ({
      getPages: () => Array.from({ length: 9 }, (_, i) => ({ __index: i })),
    })),
    embedStandardFonts: vi.fn(async () => ({ font: { __font: true }, fontBold: { __font: true } })),
    savePDFAndDownload: vi.fn(async () => {}),
    drawText: vi.fn((page: unknown, x: number, y: number, text: string) => {
      if (!text && text !== '0') return
      calls.text.push({ page: pageIndex(page), x, y, text: String(text) })
    }),
    drawWrappedText: vi.fn((page: unknown, x: number, y: number, text: string) => {
      if (!text) return 0
      calls.text.push({ page: pageIndex(page), x, y, text: String(text) })
      return y
    }),
    drawFilledCircle: vi.fn((page: unknown, x: number, y: number) => {
      calls.circles.push({ page: pageIndex(page), x, y })
    }),
    drawCheckmark: vi.fn((page: unknown, x: number, y: number) => {
      calls.checks.push({ page: pageIndex(page), x, y })
    }),
    drawNotAdministered: vi.fn((page: unknown, x: number, y: number) => {
      calls.dashes.push({ page: pageIndex(page), x, y })
    }),
    drawYesNo: vi.fn((page: unknown, yesX: number, noX: number, y: number, value: boolean | null) => {
      if (value === null || value === undefined) return
      calls.circles.push({ page: pageIndex(page), x: value ? yesX : noX, y: y + 3 })
    }),
  }
})

const { exportSCAT6ToFlatPDF } = await import('@/app/scat-forms/shared/utils/scat6-pdf-flat')
const { getDefaultSCAT6FormData } = await import('@/app/scat-forms/shared/types/scat6.types')
type SCAT6FormData = import('@/app/scat-forms/shared/types/scat6.types').SCAT6FormData

// Score-box coordinates the exporter writes to (see scat6-pdf-flat.ts).
const BOX = {
  symptomCountBottom: { page: 3, x: 167, y: 78 },
  symptomSeverity: { page: 3, x: 390, y: 77 },
  orientation: { page: 4, x: 423, y: 547 },
  immediateMemory: { page: 4, x: 216, y: 113 },
  digits: { page: 5, x: 429, y: 391 },
  months: { page: 5, x: 122, y: 254 },
  concentration: { page: 5, x: 217, y: 228 },
  mBessDouble: { page: 6, x: 137, y: 671 },
  mBessTotal: { page: 6, x: 137, y: 614 },
  delayedRecall: { page: 7, x: 208, y: 248 },
  cognitiveTotal: { page: 7, x: 130, y: 116 },
}

const at = (box: { page: number; x: number; y: number }) =>
  calls.text.find(c => c.page === box.page && c.x === box.x && c.y === box.y)
const dashedAt = (box: { page: number; x: number; y: number }) =>
  calls.dashes.some(c => c.page === box.page && c.x === box.x && c.y === box.y)

async function run(formData: SCAT6FormData) {
  calls.text = []
  calls.circles = []
  calls.dashes = []
  calls.checks = []
  await exportSCAT6ToFlatPDF(formData, 'test.pdf')
}

beforeEach(() => {
  calls.text = []
  calls.circles = []
  calls.dashes = []
  calls.checks = []
})

describe('SCAT6 export — an untouched form', () => {
  it('dashes every score box instead of printing a number', async () => {
    await run(getDefaultSCAT6FormData())
    Object.entries(BOX).forEach(([name, box]) => {
      expect(dashedAt(box), `${name} should print the not-administered mark`).toBe(true)
      expect(at(box), `${name} must not print a number`).toBeUndefined()
    })
  })

  /**
   * (390, 503) is NOT a symptom-total box. Rendering a populated export of
   * SCAT6_Flat.pdf at 300 dpi shows that coordinate falling inside the form's
   * own printed field on page 4 (BJSM 2023;57:625):
   *
   *   "Time elapsed since suspected injury: [____] mins/hours/days"
   *
   * The exporter used to draw the symptom COUNT there, so a record with 18
   * symptoms read "18 mins/hours/days" since the injury — a timeline nobody
   * entered. This form does not collect time-elapsed, so the field stays blank.
   * The symptom totals have their own boxes at the foot of the page.
   */
  it('leaves the form\'s "time elapsed since injury" field untouched', async () => {
    const fd = getDefaultSCAT6FormData()
    fd.symptoms.headaches = 4
    await run(fd)
    const timeElapsed = { page: 3, x: 390, y: 503 }
    expect(at(timeElapsed)).toBeUndefined()
    expect(dashedAt(timeElapsed)).toBe(false)
  })

  it('marks nothing on the 22-item symptom scale', async () => {
    await run(getDefaultSCAT6FormData())
    // Symptom rows live on page index 3 between y=137 and y=393.
    const symptomMarks = calls.circles.filter(c => c.page === 3 && c.y >= 137 && c.y <= 393)
    expect(symptomMarks).toHaveLength(0)
  })

  /**
   * Rendered evidence (SCAT6_Flat.pdf page 5, BJSM 2023;57:626, "Step 3:
   * Cognitive Screening"): with ONLY "Word list used: A" ticked, the export
   * marked the "0" column for all ten words in all three trials, printed
   * "0 0 0" as the trial totals and filled the printed box "Immediate Memory
   * Score [__] of 30" with 0 — a record of profound amnesia in an athlete who
   * was never read a single word. Choosing a list is setup, not a trial.
   */
  it('does not score immediate memory from a word-list choice alone', async () => {
    await run({ ...getDefaultSCAT6FormData(), wordListUsed: 'A' })
    expect(dashedAt(BOX.immediateMemory)).toBe(true)
    expect(at(BOX.immediateMemory)).toBeUndefined()
    // no "0" circles down the trial columns
    expect(calls.circles.filter(c => c.page === 4)).toHaveLength(0)
  })

  it('marks nothing in the orientation, memory or delayed-recall item columns', async () => {
    await run(getDefaultSCAT6FormData())
    expect(calls.circles.filter(c => c.page === 4)).toHaveLength(0)
    expect(calls.circles.filter(c => c.page === 7)).toHaveLength(0)
  })

  it('answers no medical-history question', async () => {
    await run(getDefaultSCAT6FormData())
    const historyMarks = calls.circles.filter(c => c.page === 3 && c.y >= 590 && c.y <= 645)
    expect(historyMarks).toHaveLength(0)
  })

  it('leaves the three serial-assessment columns empty', async () => {
    await run(getDefaultSCAT6FormData())
    expect(calls.text.filter(c => c.page === 8)).toHaveLength(0)
  })
})

describe('SCAT6 export — real findings still reach the record', () => {
  it('prints a fully rated symptom scale without a partial-scale qualifier', async () => {
    const fd = getDefaultSCAT6FormData()
    ;(Object.keys(fd.symptoms) as Array<keyof typeof fd.symptoms>).forEach(k => {
      fd.symptoms[k] = 0
    })
    fd.symptoms.headaches = 6
    await run(fd)
    expect(at(BOX.symptomCountBottom)?.text).toBe('1')
    expect(at(BOX.symptomSeverity)?.text).toBe('6')
    expect(calls.text.some(c => c.text.includes('rated)'))).toBe(false)
  })

  it('prints a genuine 0/5 orientation and marks all five "0" columns', async () => {
    const fd: SCAT6FormData = {
      ...getDefaultSCAT6FormData(),
      orientationMonth: false,
      orientationDate: false,
      orientationDayOfWeek: false,
      orientationYear: false,
      orientationTime: false,
    }
    await run(fd)
    expect(at(BOX.orientation)?.text).toBe('0')
    expect(dashedAt(BOX.orientation)).toBe(false)
    // x=433 is the "0" column; five items marked.
    expect(calls.circles.filter(c => c.page === 4 && c.x === 433)).toHaveLength(5)
  })

  it('prints a perfect 0-error mBESS once all three stances are performed', async () => {
    const fd: SCAT6FormData = {
      ...getDefaultSCAT6FormData(),
      mBessDoubleErrors: 0,
      mBessTandemErrors: 0,
      mBessSingleErrors: 0,
    }
    await run(fd)
    expect(at(BOX.mBessDouble)?.text).toBe('0')
    expect(at(BOX.mBessTotal)?.text).toBe('0')
  })

  it('dashes the mBESS total when only one stance was performed', async () => {
    const fd: SCAT6FormData = { ...getDefaultSCAT6FormData(), mBessDoubleErrors: 3 }
    await run(fd)
    expect(at(BOX.mBessDouble)?.text).toBe('3')
    expect(dashedAt(BOX.mBessTotal)).toBe(true)
    expect(at(BOX.mBessTotal)).toBeUndefined()
  })

  it('records an unrated symptom as blank while scoring the rated ones', async () => {
    const fd = getDefaultSCAT6FormData()
    fd.symptoms.headaches = 5
    fd.symptoms.dizziness = 0
    await run(fd)
    expect(at(BOX.symptomCountBottom)?.text).toBe('1')
    expect(at(BOX.symptomSeverity)?.text).toBe('5')
    // ...and says the scale was only partly rated, so "1 of 22" cannot be read
    // as the athlete denying the other 20 symptoms. One qualifier per printed
    // total box — the form has two (count and severity, at the foot of p4).
    expect(calls.text.filter(c => c.text === '(2/22 rated)')).toHaveLength(2)
    // exactly two marks on the symptom grid — the two rated items
    expect(calls.circles.filter(c => c.page === 3 && c.y >= 137 && c.y <= 393)).toHaveLength(2)
  })

  it('carries the "trials not completed" caveat and its reason onto the record', async () => {
    const fd: SCAT6FormData = {
      ...getDefaultSCAT6FormData(),
      trialsNotCompleted: true,
      trialsNotCompletedReason: 'Could not maintain tandem stance',
    }
    await run(fd)
    expect(calls.circles.some(c => c.page === 7 && c.x === 85 && c.y === 680)).toBe(true)
    expect(calls.text.some(c => c.text === 'Could not maintain tandem stance')).toBe(true)
  })

  it('never prints a cognitive total when a subtest was skipped', async () => {
    const fd: SCAT6FormData = {
      ...getDefaultSCAT6FormData(),
      orientationMonth: true,
      orientationDate: true,
      orientationDayOfWeek: true,
      orientationYear: true,
      orientationTime: true,
      wordListUsed: 'A',
      immediateMemoryTrial1: Array(10).fill(true),
      immediateMemoryTrial2: Array(10).fill(true),
      immediateMemoryTrial3: Array(10).fill(true),
      digitsBackward: 4,
      monthsReverseErrors: 0,
      monthsReverseTime: '18',
      // delayed recall never run
    }
    await run(fd)
    expect(at(BOX.orientation)?.text).toBe('5')
    expect(at(BOX.concentration)?.text).toBe('5')
    expect(dashedAt(BOX.delayedRecall)).toBe(true)
    expect(dashedAt(BOX.cognitiveTotal)).toBe(true)
    expect(at(BOX.cognitiveTotal)).toBeUndefined()
  })

  it('fills a dated follow-up column only where numbers were entered', async () => {
    const fd = getDefaultSCAT6FormData()
    fd.decisionDates.date1 = '2026-08-05'
    fd.decisionDates.symptomNumber1 = 4
    fd.decisionDates.mBessTotal1 = 0
    await run(fd)
    const col = calls.text.filter(c => c.page === 8)
    expect(col.map(c => c.text).sort()).toEqual(['0', '2026-08-05', '4'])
  })
})
