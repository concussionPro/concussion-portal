/**
 * SST report GENERATOR — produces real, attachable PDFs from the report skins.
 *
 * WHY: the skins (lib/sst-trainer/reports/skins.ts) + the renderer
 * (lib/sst-trainer/reports/render.ts) are built and type-clean, but there was
 * no way to actually EMIT a file. This standalone script builds a realistic
 * SAMPLE concussion episode, runs it through the genuinely-shippable skins, and
 * writes branded HTML + print-to-PDF for each into ~/Documents/CEA_2026/sst-reports/.
 * Founder can attach the PDFs to outreach as concrete "this is the artefact your
 * clinic gets" proof.
 *
 * ISOLATION: nothing here is wired into a route/page/cron. It reads the pure
 * report modules and the pure protocol engine only. No DB, no network beyond the
 * local headless-Chrome print. Run:
 *
 *   node scripts/generate-sst-reports.mjs
 *
 * (Node's native TypeScript support loads the .ts report modules via dynamic
 * import; no build step or tsx needed.)
 *
 * SHIPPABLE skins emitted:
 *   - medicolegal record  → defensible clinical audit trail
 *   - gp-report           → referrer letter data attachment
 *   - acc884              → DRAFT ONLY (real ACC884 v2 field order is UNVERIFIED;
 *                           carries a visible "DRAFT — pending ACC884 v2 field
 *                           mapping" banner + watermark so it can never be sent as-is)
 */

import { mkdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { chromium } from 'playwright'

// The report modules are TypeScript; a `.mjs` entry cannot statically link a
// `.ts` module under Node's native TS support, but dynamic import() resolves it
// cleanly. Loaded here at top level (this file is an ES module).
const { computePrescription } = await import('../lib/sst-trainer/protocol.ts')
const { acc884, gpReport, medicolegalRecord } = await import('../lib/sst-trainer/reports/skins.ts')
const { renderReportContentToHtml } = await import('../lib/sst-trainer/reports/render.ts')

const OUT_DIR = join(homedir(), 'Documents', 'CEA_2026', 'sst-reports')
const DAY = 86_400_000

// ── build a realistic SAMPLE concussion episode ──────────────────────────────
// A 24yo rugby player, 8-week supervised SSTAE episode. Starts with a low
// measured threshold (prolonged-recovery risk), improves across four graded
// re-tests, and clears on the final exhaustion-limited re-test (recovered
// exercise tolerance). Sessions include the events that make a defensible
// audit trail: a stop-rule trigger, an unverified (manual) session, and a
// next-day flare with the one-use override.

const now = Date.now()
const episodeStart = now - 56 * DAY

// Serial graded tests (PersistedTest[]) — the measured-HRt spine.
const thresholdHistory = [
  { at: episodeStart, interpretation: 'physiologic', hrt: 118, thresholdStage: 4, modality: 'treadmill', restingSymptomScore: 3 },
  { at: episodeStart + 14 * DAY, interpretation: 'physiologic', hrt: 132, thresholdStage: 6, modality: 'treadmill', restingSymptomScore: 2 },
  { at: episodeStart + 35 * DAY, interpretation: 'physiologic', hrt: 148, thresholdStage: 9, modality: 'treadmill', restingSymptomScore: 1 },
  { at: episodeStart + 54 * DAY, interpretation: 'no-intolerance', hrt: null, thresholdStage: null, modality: 'treadmill', restingSymptomScore: 0 },
]

// Current prescription — anchored to the second measured threshold (132 bpm),
// which sits just under the validated <135 bpm prolonged-recovery cutoff, so the
// clinician prognostic note is exercised. Resting HR 70 → ΔHR 62 (>50).
const prescription = { ...computePrescription(132, 'concussion', { restingHr: 70 }), createdAt: episodeStart + 14 * DAY }

// Latest re-test interpretation (recovered on the final graded test).
const latestTest = {
  hrtFound: false,
  hrt: null,
  thresholdStage: null,
  interpretation: 'no-intolerance',
  message:
    'On the most recent graded re-test the patient reached volitional exhaustion (RPE >17) without provoking symptoms above the resting baseline. Measured exercise tolerance has recovered on objective criteria; interpret alongside clinical assessment and any code-of-sport stand-down requirements.',
}

// Training sessions (PersistedSession[]) — verified clean runs, one stop-rule
// event, one manual/unverified session, one next-day flare with override.
const mkSession = (offsetDay, o) => ({
  at: episodeStart + offsetDay * DAY,
  date: new Date(episodeStart + offsetDay * DAY).toISOString().slice(0, 10),
  avgHeartRate: o.avg,
  peakHeartRate: o.peak,
  preSymptom: o.pre,
  peakSymptom: o.peak_sx,
  completedMinutes: o.mins,
  hrVerified: o.verified,
  verifiedReadingPct: o.verified ? 96 : 0,
  symptomLimited: o.stop ?? false,
  overrodeStop: o.override ?? false,
  nextDayFlare: o.flare ?? false,
  endFeel: o.endFeel ?? 'same',
})

const sessions = [
  mkSession(2, { avg: 104, peak: 116, pre: 2, peak_sx: 3, mins: 20, verified: true, endFeel: 'same' }),
  mkSession(4, { avg: 108, peak: 118, pre: 2, peak_sx: 2, mins: 20, verified: true, endFeel: 'better' }),
  // Stop-rule: a >=2-point symptom rise ended the session early.
  mkSession(7, { avg: 110, peak: 124, pre: 2, peak_sx: 5, mins: 11, verified: true, stop: true, endFeel: 'worse' }),
  // Next-day flare reported; patient had used their one continue-override.
  mkSession(9, { avg: 106, peak: 120, pre: 3, peak_sx: 5, mins: 16, verified: true, override: true, flare: true, endFeel: 'worse' }),
  mkSession(16, { avg: 118, peak: 130, pre: 1, peak_sx: 2, mins: 20, verified: true, endFeel: 'same' }),
  // Manual/unverified session — must be flagged, excluded from progression evidence.
  mkSession(19, { avg: 120, peak: 132, pre: 1, peak_sx: 1, mins: 20, verified: false, endFeel: 'same' }),
  mkSession(23, { avg: 124, peak: 138, pre: 1, peak_sx: 1, mins: 20, verified: true, endFeel: 'better' }),
  mkSession(30, { avg: 128, peak: 142, pre: 0, peak_sx: 1, mins: 22, verified: true, endFeel: 'same' }),
  mkSession(38, { avg: 132, peak: 148, pre: 0, peak_sx: 0, mins: 22, verified: true, endFeel: 'better' }),
  mkSession(45, { avg: 136, peak: 152, pre: 0, peak_sx: 0, mins: 24, verified: true, endFeel: 'same' }),
]

const patient = {
  firstName: 'Jordan',
  lastName: 'Fielding',
  dob: '2001-03-18',
  diagnosis: 'Sport-related concussion (S06.0)',
}

const clinician = { name: 'Zac Lewis', credential: 'Osteopath, B.Sc(Clin.Sci), M.Ost' }
const goals = [
  { id: 'g1', label: 'Return to full contact rugby training without symptom provocation', status: 'in-progress' },
  { id: 'g2', label: 'Complete 20-minute aerobic session at prescribed band, symptom-clean', status: 'achieved' },
  { id: 'g3', label: 'Tolerate screen/cognitive load for a full work shift', status: 'in-progress' },
]

/** @param {'AU'|'NZ'|'INTL'} jurisdiction */
const baseInput = (jurisdiction) => ({
  jurisdiction,
  patient,
  clinician,
  prescription,
  latestTest,
  thresholdHistory,
  sessions,
  goals,
  episode: { startedAt: new Date(episodeStart).toISOString(), reportedAt: new Date(now).toISOString() },
})

// ── the reports to emit ──────────────────────────────────────────────────────
const CLINIC = 'Concussion Education Australia — supervising clinic'

const reports = [
  {
    slug: 'medicolegal-record',
    content: medicolegalRecord(baseInput('AU')),
    opts: { clinicName: CLINIC },
  },
  {
    slug: 'gp-report',
    content: gpReport(baseInput('AU')),
    opts: { clinicName: CLINIC },
  },
  {
    slug: 'acc884-DRAFT',
    content: acc884(baseInput('NZ')),
    opts: {
      clinicName: CLINIC,
      draftBanner: 'DRAFT — pending ACC884 v2 field mapping. Field order & wording are UNVERIFIED against the current ACC884 form. Not for submission.',
      footerNote: 'This ACC884 rendering is a DRAFT scaffold; verify every field against ACC’s current ACC884 v2 form before any use.',
    },
  },
]

// ── render + print ───────────────────────────────────────────────────────────
async function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  const browser = await chromium.launch()
  const page = await browser.newPage()
  const written = []

  for (const r of reports) {
    const html = renderReportContentToHtml(r.content, r.opts)
    const htmlPath = join(OUT_DIR, `sst-${r.slug}-sample.html`)
    const pdfPath = join(OUT_DIR, `sst-${r.slug}-sample.pdf`)
    await writeFile(htmlPath, html, 'utf8')
    await page.setContent(html, { waitUntil: 'networkidle' })
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '14mm', bottom: '14mm', left: '12mm', right: '12mm' },
    })
    written.push({ htmlPath, pdfPath })
  }

  await browser.close()

  console.log(`\nSST sample reports written to: ${OUT_DIR}\n`)
  for (const w of written) {
    console.log(`  HTML  ${w.htmlPath}`)
    console.log(`  PDF   ${w.pdfPath}`)
  }
  console.log('\nNote: acc884 output is a watermarked DRAFT — field mapping unverified.\n')
}

main().catch((err) => {
  console.error('generate-sst-reports failed:', err)
  process.exit(1)
})
