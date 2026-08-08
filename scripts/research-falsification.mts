/**
 * FALSIFICATION HARNESS — does the pipeline DETECT signal, or MANUFACTURE it?
 *
 * The mock cohort was generated with a dose-response built in, and the analysis
 * duly found a dose-response. That demonstrates only that the code executes.
 * A pipeline is trustworthy only if it returns NOTHING when there is nothing
 * there, and returns the WRONG-WAY answer when the truth is wrong-way.
 *
 * Four scenarios, each with a known ground truth and a pass condition:
 *
 *   null        flare independent of exposure   → no gradient, CIs overlap
 *   reversed    more excursion → FEWER flares   → gradient must invert
 *   threshold   penalty only beyond 5 min       → flat to 5 min, then a jump
 *   confounded  sicker patients get LESS dose   → must show the SPURIOUS
 *               protective effect, proving the marginal analysis cannot
 *               control confounding by indication and must not be the primary
 *
 * The confounded scenario is the important one. It is designed to FAIL in a
 * specific way: if the marginal table shows exercise looking protective when
 * the generative truth is that it does nothing, that is the confounding-by-
 * indication problem made visible, and it is the reason the primary analysis
 * has to be within-person rather than the between-person table.
 *
 *   npx tsx scripts/research-falsification.mts
 */

import type { ResearchRow } from '../lib/sst-trainer/patient-registry'
import type { AnalysisResult } from '../lib/sst-trainer/analysis'

async function load<T = Record<string, unknown>>(spec: string): Promise<T> {
  const m = (await import(spec)) as Record<string, unknown>
  return ((m.default && typeof m.default === 'object' && !('__esModule' in m) ? m.default : m) ?? m) as T
}
const { runAnalysis } = await load<{ runAnalysis: (r: ResearchRow[]) => AnalysisResult }>(
  '../lib/sst-trainer/analysis',
)

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Scenario = 'null' | 'reversed' | 'threshold' | 'confounded'

function generate(scenario: Scenario, n: number, seed: number): ResearchRow[] {
  const rnd = mulberry32(seed)
  const rows: ResearchRow[] = []
  for (let p = 0; p < n; p++) {
    const researchRef = `mock-${String(p).padStart(4, '0')}-0000-0000-000000000000`
    const frailty = rnd() * 0.28
    // Confounded scenario: severity drives BOTH how much a clinician lets them
    // do AND their flare rate. Exposure carries no causal effect at all.
    const severity = rnd()
    let hrt = 120 + Math.floor(rnd() * 35)
    let day = 5 + Math.floor(rnd() * 25)
    const nSessions = 8 + Math.floor(rnd() * 16)

    for (let s = 0; s < nSessions; s++) {
      const u = rnd()
      let secondsAbove =
        u < 0.55 ? 0
        : u < 0.75 ? Math.floor(rnd() * 60)
        : u < 0.88 ? 60 + Math.floor(rnd() * 60)
        : u < 0.96 ? 120 + Math.floor(rnd() * 180)
        : 300 + Math.floor(rnd() * 600)

      if (scenario === 'confounded') {
        // Sicker patients are held near the band; healthier ones roam.
        secondsAbove = Math.round(secondsAbove * (1 - severity))
      }

      let pFlare: number
      switch (scenario) {
        case 'null':
          pFlare = frailty + 0.15                       // exposure irrelevant
          break
        case 'reversed':
          pFlare = Math.max(0.02, frailty + 0.30 - 0.30 * (1 - Math.exp(-secondsAbove / 420)))
          break
        case 'threshold':
          pFlare = frailty + 0.12 + (secondsAbove > 300 ? 0.35 : 0)
          break
        case 'confounded':
          pFlare = frailty + 0.55 * severity            // severity only, NOT dose
          break
      }
      pFlare = Math.min(0.95, Math.max(0.01, pFlare))
      const nextDayFlare = rnd() < pFlare

      const totalSecs = 20 * 60
      const secondsIn = Math.max(0, totalSecs - secondsAbove - Math.floor(rnd() * 240))
      rows.push({
        researchRef, ageBand: '25-34', sex: 'female',
        condition: 'concussion', daysSinceInjury: day,
        hrtBpm: hrt, bandLow: Math.round(hrt * 0.8), bandHigh: Math.round(hrt * 0.9),
        sessionType: 'training',
        payload: {
          secondsAbove, secondsIn,
          secondsBelow: Math.max(0, totalSecs - secondsIn - secondsAbove),
          verifiedReadingPct: rnd() > 0.12 ? 82 + Math.floor(rnd() * 18) : Math.floor(rnd() * 70),
          ...(rnd() > 0.14 ? { nextDayFlare } : {}),
          preSymptom: Math.floor(rnd() * 3),
        },
      })
      day += 1 + Math.floor(rnd() * 3)
      hrt = Math.min(190, hrt + 1.5 + rnd() * 2)
    }
  }
  return rows
}

/** Do the extreme strata's 95% CIs overlap? Non-overlap ⇒ a detected gradient. */
function overlaps(a: [number, number], b: [number, number]) {
  return a[0] <= b[1] && b[0] <= a[1]
}

const N = 200, SEED = 7
const scenarios: Scenario[] = ['null', 'reversed', 'threshold', 'confounded']
let failures = 0

console.log(`\nFALSIFICATION — ${N} synthetic participants per scenario, seed ${SEED}\n`)

for (const sc of scenarios) {
  const r = runAnalysis(generate(sc, N, SEED))
  const inBand = r.exposure[0]
  const longest = r.exposure[r.exposure.length - 1]
  const ratio = inBand.flareRate > 0 ? longest.flareRate / inBand.flareRate : NaN
  const ovl = overlaps(inBand.ci95, longest.ci95)

  console.log(`── ${sc.toUpperCase()}`)
  for (const s of r.exposure) {
    console.log(
      `   ${s.label.padEnd(12)} n=${String(s.sessions).padStart(4)}  ` +
      `${(s.flareRate * 100).toFixed(1).padStart(5)}%  ` +
      `[${(s.ci95[0] * 100).toFixed(1)}–${(s.ci95[1] * 100).toFixed(1)}]`,
    )
  }
  console.log(`   >5min / in-band ratio = ${ratio.toFixed(2)}   CIs overlap: ${ovl}`)

  let pass: boolean, expectation: string
  switch (sc) {
    case 'null':
      expectation = 'no gradient (ratio ≈ 1, CIs overlap)'
      pass = ovl && ratio > 0.75 && ratio < 1.35
      break
    case 'reversed':
      expectation = 'inverted gradient (ratio < 1)'
      pass = ratio < 0.85
      break
    case 'threshold':
      expectation = 'flat below 5 min, jump above'
      pass =
        ratio > 1.5 &&
        overlaps(r.exposure[0].ci95, r.exposure[3].ci95) // 0 vs 2-5min still flat
      break
    case 'confounded':
      expectation = 'SPURIOUS protective effect — marginal analysis is not causal'
      pass = ratio < 1.0
      break
  }
  if (!pass) failures++
  console.log(`   expected: ${expectation}`)
  console.log(`   ${pass ? 'PASS' : '*** FAIL ***'}\n`)
}

console.log(
  failures === 0
    ? 'All scenarios behaved as their ground truth requires.\n' +
      'The CONFOUNDED result is the finding that matters: the marginal table\n' +
      'reports a protective effect that does not exist. The primary analysis\n' +
      'must therefore be within-person (patient fixed effects or lagged\n' +
      'exposure conditioned on prior symptoms) — the marginal strata are\n' +
      'DESCRIPTIVE ONLY and may never carry the inference.\n'
    : `*** ${failures} scenario(s) failed — the pipeline does not faithfully ***\n` +
      `*** recover known ground truth. Do not run it on real data.        ***\n`,
)
process.exit(failures === 0 ? 0 : 1)
