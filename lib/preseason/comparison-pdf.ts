import { jsPDF } from 'jspdf'

/**
 * Serial-comparison PDF for an athlete's pre-season concussion baselines.
 *
 * Designed as a polished sibling of the single-test SCAT6 report generated in
 * app/api/preseason/submit/route.ts — same jsPDF setup, same teal brand colour
 * (RGB 91,154,166 = #5b9aa6), same addText / checkPage / drawLine helper shapes
 * and the same SCORE SUMMARY table styling — but re-imagined as an at-a-glance
 * trajectory matrix so a clinician can immediately see where the athlete has
 * improved, stayed stable, or declined across repeated tests.
 */

export interface ComparisonTest {
  testNumber: number
  date: string              // ISO submitted_at
  symptomCount: number      // /22   — LOWER is better
  symptomSeverity: number   // /132  — LOWER is better
  cognitiveScore: number    // raw total
  cognitiveMax: number      // 30 or 50 (varies by test format)
  orientation?: number        // /5   — HIGHER better (undefined for legacy tests)
  immediateMemory?: number    // raw  — HIGHER better
  immediateMemoryMax?: number
  concentration?: number      // /5   — HIGHER better
  delayedRecall?: number      // /10  — HIGHER better
  oculomotorProvoked?: number // /4   — LOWER better (count of exercises that provoked symptoms)
}

type TrendStatus = 'improved' | 'declined' | 'stable' | 'none'
type MetricGroup = 'symptoms' | 'cognition' | 'oculomotor'

interface Metric {
  section: 'SYMPTOMS' | 'COGNITIVE' | 'OCULOMOTOR'
  group: MetricGroup
  label: string
  direction: 'lower' | 'higher'
  /**
   * "Stable" band — a first→latest change with absolute magnitude <= threshold
   * (measured in the SAME units that `cmp` returns) is treated as no real
   * movement. Thresholds are picked per-metric to match each scale:
   *   - Symptom Count    /22   → 1 point   (small scale)
   *   - Symptom Severity /132  → 3 points  (wide scale, per the spec hint)
   *   - Total Cognitive (normalised score/max as a 0–1 fraction) → 0.05  (5 percentage points)
   *   - Orientation      /5    → 1 point
   *   - Immediate Memory raw   → 1 point   (assumed same scale across an athlete's serial tests)
   *   - Concentration    /5    → 1 point
   *   - Delayed Recall   /10   → 1 point
   *   - Oculomotor       /4    → 1 point
   */
  threshold: number
  /** Comparison value used for trend maths; undefined = no value for this test (legacy). */
  cmp: (t: ComparisonTest) => number | undefined
  /** Cell display string; '—' when the underlying value is missing. */
  display: (t: ComparisonTest) => string
}

const TEAL: [number, number, number] = [91, 154, 166]
const GREEN: [number, number, number] = [22, 163, 74]
const AMBER: [number, number, number] = [217, 119, 6]
const RED: [number, number, number] = [220, 38, 38]
const GREY: [number, number, number] = [150, 150, 150]

const TREND_COLOR: Record<TrendStatus, [number, number, number]> = {
  improved: GREEN,
  declined: RED,
  stable: AMBER,
  none: GREY,
}

const TREND_WORD: Record<TrendStatus, string> = {
  improved: 'Improved',
  declined: 'Declined',
  stable: 'Stable',
  none: '—',
}

function fmtShort(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso || '—'
  return d.toLocaleDateString('en-AU', { day: '2-digit', month: 'short' })
}

function fmtFull(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso || '—'
  return d.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** First→latest change across all tests that actually carry the value. */
function computeTrend(metric: Metric, tests: ComparisonTest[]): TrendStatus {
  const real = tests.filter(t => metric.cmp(t) !== undefined)
  if (real.length < 2) return 'none'
  const first = metric.cmp(real[0])!
  const last = metric.cmp(real[real.length - 1])!
  const change = last - first
  if (Math.abs(change) <= metric.threshold) return 'stable'
  const improved = metric.direction === 'lower' ? change < 0 : change > 0
  return improved ? 'improved' : 'declined'
}

function buildMetrics(): Metric[] {
  const opt = (v: number | undefined): string => (v === undefined || v === null ? '—' : `${v}`)
  return [
    // ── SYMPTOMS (lower = better) ──
    {
      section: 'SYMPTOMS', group: 'symptoms', label: 'Symptom Count (/22)',
      direction: 'lower', threshold: 1,
      cmp: t => t.symptomCount,
      display: t => `${t.symptomCount}`,
    },
    {
      section: 'SYMPTOMS', group: 'symptoms', label: 'Symptom Severity (/132)',
      direction: 'lower', threshold: 3,
      cmp: t => t.symptomSeverity,
      display: t => `${t.symptomSeverity}`,
    },
    // ── COGNITIVE (higher = better) ──
    {
      section: 'COGNITIVE', group: 'cognition', label: 'Total Cognitive',
      direction: 'higher', threshold: 0.05,
      // Normalise by score/max so tests with different formats (30 vs 50) compare fairly.
      cmp: t => (t.cognitiveMax > 0 ? t.cognitiveScore / t.cognitiveMax : undefined),
      display: t => `${t.cognitiveScore}/${t.cognitiveMax}`,
    },
    {
      section: 'COGNITIVE', group: 'cognition', label: 'Orientation (/5)',
      direction: 'higher', threshold: 1,
      cmp: t => t.orientation,
      display: t => opt(t.orientation),
    },
    {
      section: 'COGNITIVE', group: 'cognition', label: 'Immediate Memory',
      direction: 'higher', threshold: 1,
      cmp: t => t.immediateMemory,
      display: t => (t.immediateMemory === undefined || t.immediateMemory === null)
        ? '—'
        : (t.immediateMemoryMax ? `${t.immediateMemory}/${t.immediateMemoryMax}` : `${t.immediateMemory}`),
    },
    {
      section: 'COGNITIVE', group: 'cognition', label: 'Concentration (/5)',
      direction: 'higher', threshold: 1,
      cmp: t => t.concentration,
      display: t => opt(t.concentration),
    },
    {
      section: 'COGNITIVE', group: 'cognition', label: 'Delayed Recall (/10)',
      direction: 'higher', threshold: 1,
      cmp: t => t.delayedRecall,
      display: t => opt(t.delayedRecall),
    },
    // ── OCULOMOTOR (lower = better) ──
    {
      section: 'OCULOMOTOR', group: 'oculomotor', label: 'Exercises Provoked (/4)',
      direction: 'lower', threshold: 1,
      cmp: t => t.oculomotorProvoked,
      display: t => (t.oculomotorProvoked === undefined || t.oculomotorProvoked === null)
        ? '—'
        : `${t.oculomotorProvoked}/4`,
    },
  ]
}

export function generateComparisonPdf(opts: {
  clinicName: string
  athleteName: string
  athleteMeta?: { sport?: string; team?: string; dob?: string; sex?: string }
  tests: ComparisonTest[]   // chronological (oldest first), length >= 2
}): Buffer {
  const { clinicName, athleteName, athleteMeta = {}, tests } = opts

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const contentWidth = pageWidth - 2 * margin
  let y = 20

  const addText = (
    text: string,
    x: number,
    currentY: number,
    o?: { fontSize?: number; fontStyle?: string; maxWidth?: number },
  ) => {
    doc.setFontSize(o?.fontSize || 10)
    doc.setFont('helvetica', o?.fontStyle || 'normal')
    doc.text(text, x, currentY, { maxWidth: o?.maxWidth || contentWidth })
  }

  const checkPage = (needed: number) => {
    if (y + needed > 275) {
      doc.addPage()
      y = 20
    }
  }

  const drawLine = () => {
    doc.setDrawColor(200)
    doc.line(margin, y, pageWidth - margin, y)
    y += 5
  }

  const metrics = buildMetrics()
  const trends = new Map<Metric, TrendStatus>()
  for (const m of metrics) trends.set(m, computeTrend(m, tests))

  // ── Column selection: keep the matrix on one page width ──
  // <=4 tests → show all. >4 → first, previous, latest (+ note the hidden middle).
  let columns = tests
  let hiddenNote = ''
  if (tests.length > 4) {
    columns = [tests[0], tests[tests.length - 2], tests[tests.length - 1]]
    const hidden = tests.length - columns.length
    hiddenNote = `+${hidden} earlier test${hidden !== 1 ? 's' : ''} not shown (showing first, previous & latest)`
  }

  // ── Trend marker (vector glyph + coloured word) ──
  const drawTrend = (x: number, yy: number, status: TrendStatus) => {
    const c = TREND_COLOR[status]
    doc.setFillColor(c[0], c[1], c[2])
    if (status === 'improved') {
      doc.triangle(x, yy - 1, x + 3.4, yy - 1, x + 1.7, yy - 4, 'F')
    } else if (status === 'declined') {
      doc.triangle(x, yy - 3.6, x + 3.4, yy - 3.6, x + 1.7, yy - 0.6, 'F')
    } else if (status === 'stable') {
      doc.rect(x, yy - 2.6, 3.4, 1.3, 'F')
    }
    doc.setTextColor(c[0], c[1], c[2])
    addText(TREND_WORD[status], status === 'none' ? x : x + 5, yy, { fontSize: 8, fontStyle: 'bold' })
    doc.setTextColor(0, 0, 0)
  }

  // ── Title block (teal) ──
  doc.setFillColor(...TEAL)
  doc.rect(0, 0, pageWidth, 40, 'F')
  doc.setTextColor(255, 255, 255)
  addText('Pre-Season Baseline — Serial Comparison', margin, 14, { fontSize: 16, fontStyle: 'bold' })
  addText(athleteName || 'Unknown Athlete', margin, 23, { fontSize: 12, fontStyle: 'bold' })
  const genDate = new Date().toLocaleDateString('en-AU', { dateStyle: 'long' })
  addText(`${clinicName}  ·  Generated ${genDate}`, margin, 30, { fontSize: 9 })
  const rangeStr = `${tests.length} tests  ·  ${fmtFull(tests[0].date)} → ${fmtFull(tests[tests.length - 1].date)}`
  addText(rangeStr, margin, 36, { fontSize: 9 })
  doc.setTextColor(0, 0, 0)
  y = 50

  // ── Athlete info line ──
  addText(
    `Athlete: ${athleteName || '—'}   ·   Sport: ${athleteMeta.sport || '—'}   ·   Team: ${athleteMeta.team || '—'}   ·   Sex: ${athleteMeta.sex || '—'}   ·   DOB: ${athleteMeta.dob || '—'}`,
    margin, y, { fontSize: 9 },
  )
  y += 10

  // ── Top-line interpretation banner ──
  const groupName: Record<MetricGroup, string> = {
    symptoms: 'Symptoms',
    cognition: 'Cognition',
    oculomotor: 'Oculomotor',
  }
  const bannerParts: { label: string; color: [number, number, number] }[] = []
  for (const group of ['symptoms', 'cognition', 'oculomotor'] as MetricGroup[]) {
    const groupMetrics = metrics.filter(m => m.group === group)
    let improved = 0
    let declined = 0
    let withData = 0
    for (const m of groupMetrics) {
      const s = trends.get(m)!
      if (s === 'none') continue
      withData++
      if (s === 'improved') improved++
      else if (s === 'declined') declined++
    }
    if (withData === 0) continue // e.g. legacy tests with no oculomotor data
    let word: string
    let color: [number, number, number]
    if (improved > declined) { word = 'improving'; color = GREEN }
    else if (declined > improved) { word = 'declining'; color = RED }
    else { word = 'stable'; color = AMBER }
    bannerParts.push({ label: `${groupName[group]} ${word}`, color })
  }

  checkPage(24)
  const bannerTop = y
  doc.setFillColor(245, 248, 250)
  doc.setDrawColor(...TEAL)
  doc.rect(margin, bannerTop, contentWidth, 17, 'FD')
  addText('OVERALL TRAJECTORY  (first vs latest test)', margin + 3, bannerTop + 6, { fontSize: 8, fontStyle: 'bold' })
  // Render coloured group statements inline.
  doc.setFontSize(10)
  let bx = margin + 3
  const sep = '    ·    '
  bannerParts.forEach((part, idx) => {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(part.color[0], part.color[1], part.color[2])
    doc.text(part.label, bx, bannerTop + 13)
    bx += doc.getTextWidth(part.label)
    if (idx < bannerParts.length - 1) {
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(130, 130, 130)
      doc.text(sep, bx, bannerTop + 13)
      bx += doc.getTextWidth(sep)
    }
  })
  doc.setTextColor(0, 0, 0)
  y = bannerTop + 17 + 8

  // ── Comparison matrix geometry ──
  const labelW = 52
  const trendW = 30
  const testsAreaW = contentWidth - labelW - trendW
  const nCols = columns.length
  const colW = testsAreaW / nCols
  const labelX = margin + 2
  const testX = (i: number) => margin + labelW + i * colW + 1
  const trendX = margin + labelW + testsAreaW + 2

  // Matrix header (teal)
  checkPage(20)
  doc.setFillColor(...TEAL)
  doc.rect(margin, y - 4, contentWidth, 13, 'F')
  doc.setTextColor(255, 255, 255)
  addText('METRIC', labelX, y, { fontSize: 8, fontStyle: 'bold' })
  columns.forEach((t, i) => {
    addText(`Test #${t.testNumber}`, testX(i), y, { fontSize: 7.5, fontStyle: 'bold' })
    addText(fmtShort(t.date), testX(i), y + 5, { fontSize: 7 })
  })
  addText('TREND', trendX, y, { fontSize: 8, fontStyle: 'bold' })
  doc.setTextColor(0, 0, 0)
  y += 14

  // Rows grouped by section
  let rowIdx = 0
  let currentSection = ''
  for (const m of metrics) {
    if (m.section !== currentSection) {
      currentSection = m.section
      checkPage(9)
      doc.setFillColor(235, 242, 244)
      doc.rect(margin, y - 4, contentWidth, 7, 'F')
      doc.setTextColor(...TEAL)
      addText(m.section, labelX, y, { fontSize: 8.5, fontStyle: 'bold' })
      doc.setTextColor(0, 0, 0)
      y += 8
      rowIdx = 0
    }

    checkPage(8)
    if (rowIdx % 2 === 1) {
      doc.setFillColor(248, 250, 251)
      doc.rect(margin, y - 4, contentWidth, 6.5, 'F')
    }
    addText(m.label, labelX, y, { fontSize: 8 })
    columns.forEach((t, i) => {
      addText(m.display(t), testX(i), y, { fontSize: 8 })
    })
    drawTrend(trendX, y, trends.get(m)!)
    y += 6.5
    rowIdx++
  }

  y += 2
  if (hiddenNote) {
    doc.setTextColor(120, 120, 120)
    addText(hiddenNote, labelX, y, { fontSize: 7 })
    doc.setTextColor(0, 0, 0)
    y += 6
  }

  // ── Legend ──
  checkPage(12)
  drawLine()
  doc.setFontSize(7.5)
  let lx = labelX
  const legendItems: { word: string; color: [number, number, number] }[] = [
    { word: 'Improved', color: GREEN },
    { word: 'Stable', color: AMBER },
    { word: 'Declined', color: RED },
  ]
  legendItems.forEach((it, idx) => {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(it.color[0], it.color[1], it.color[2])
    doc.text(it.word, lx, y)
    lx += doc.getTextWidth(it.word) + 8
    if (idx < legendItems.length - 1) {
      doc.setTextColor(130, 130, 130)
      doc.setFont('helvetica', 'normal')
      doc.text('·', lx - 4, y)
    }
  })
  doc.setTextColor(120, 120, 120)
  doc.setFont('helvetica', 'normal')
  doc.text('  Stable = change within the metric threshold. Direction-of-better is per metric (symptoms & oculomotor: lower; cognitive: higher).', lx, y)
  doc.setTextColor(0, 0, 0)
  y += 10

  // ── Footer disclaimer ──
  checkPage(20)
  doc.setFillColor(245, 248, 250)
  doc.rect(margin, y - 3, contentWidth, 10, 'F')
  addText(
    'Comparison of self-administered baselines — interpret in clinical context; not a diagnosis.',
    margin + 3, y + 3, { fontSize: 7.5, fontStyle: 'bold' },
  )
  y += 14

  doc.setTextColor(...TEAL)
  doc.setFontSize(9)
  doc.text('Powered by Concussion Education Australia — concussion-education-australia.com', margin, y)

  // ── Page numbers ──
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, 290, { align: 'center' })
  }

  return Buffer.from(doc.output('arraybuffer'))
}
