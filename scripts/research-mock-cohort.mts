/**
 * MOCK COHORT — exercises the whole research pipeline before real data exists.
 *
 * Generates a synthetic cohort in the EXACT shape `researchExtract()` returns,
 * runs it through the analysis engine, and renders the paper. Nothing here
 * touches the database: it is a pipeline test, not a seed script. Writing
 * fabricated rows into `sst_clinic_sessions` would put fake clinical data one
 * schema-change away from a real report, so it is deliberately not offered.
 *
 * WHAT IT IS FOR
 *   1. proving the extract → analysis → manuscript path works end to end
 *   2. sizing the study (how many participants for a given effect)
 *   3. letting the statistician see the analysis-ready table before recruitment
 *
 * WHAT IT IS NOT FOR
 *   Any number produced here is fabricated. The manuscript renderer stamps
 *   SYNTHETIC DATA on every output built from it, and that stamp is not
 *   optional — a simulated effect size pasted into a grant application or a
 *   pitch deck would be research misconduct.
 *
 * THE GENERATIVE MODEL is deliberately a MODEST true effect: flare probability
 * rises with time-above-band but is far from deterministic, plus a participant
 * random intercept so some people flare easily and others never do. That
 * clustering is the point — it is what makes the naive pooled analysis
 * overstate significance, and running it here demonstrates why the mixed model
 * is required rather than merely asserting it.
 *
 *   npx tsx scripts/research-mock-cohort.mts [participants] [seed]
 */

import type { ResearchRow } from '../lib/sst-trainer/patient-registry'
import type { AnalysisResult } from '../lib/sst-trainer/analysis'

/**
 * Loaded dynamically with a CommonJS-interop fallback. tsx transpiles these
 * modules to CJS, and cjs-module-lexer does not always re-expose their named
 * exports (it gives up on the manuscript's large template literal), so a static
 * `import { x }` throws "does not provide an export named". Reading through
 * `default` when the named binding is absent works under both module systems.
 */
async function load<T = Record<string, unknown>>(spec: string): Promise<T> {
  const m = (await import(spec)) as Record<string, unknown>
  return ((m.default && typeof m.default === 'object' && !('__esModule' in m) ? m.default : m) ?? m) as T
}

const { runAnalysis } = await load<{ runAnalysis: (r: ResearchRow[]) => AnalysisResult }>(
  '../lib/sst-trainer/analysis',
)
const { renderManuscript } = await load<{
  renderManuscript: (r: AnalysisResult, o?: { synthetic?: boolean; title?: string }) => string
}>('../lib/sst-trainer/manuscript')

/** Deterministic PRNG — a reproducible cohort is worth more than a random one. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const AGE_BANDS = ['13-17', '18-24', '25-34', '35-49', '50-64', '65+']
const SEXES = ['female', 'male', 'other', 'undisclosed']

function generateCohort(nParticipants: number, seed: number): ResearchRow[] {
  const rnd = mulberry32(seed)
  const rows: ResearchRow[] = []

  for (let p = 0; p < nParticipants; p++) {
    const researchRef = `mock-${String(p).padStart(4, '0')}-0000-0000-000000000000`
    const ageBand = AGE_BANDS[Math.floor(rnd() * AGE_BANDS.length)]
    const sex = SEXES[Math.floor(rnd() * (rnd() < 0.9 ? 2 : SEXES.length))]

    // Participant random intercept: baseline flare propensity varies a lot
    // between people. This is the clustering the mixed model must absorb.
    const frailty = rnd() * 0.28

    let day = 5 + Math.floor(rnd() * 25)          // days post-injury at first session
    let hrt = 120 + Math.floor(rnd() * 35)        // starting threshold
    const nSessions = 8 + Math.floor(rnd() * 16)  // ~8-23 sessions

    for (let s = 0; s < nSessions; s++) {
      const bandLow = Math.round(hrt * 0.8)
      const bandHigh = Math.round(hrt * 0.9)

      // Most sessions stay in band; excursions are right-skewed.
      const u = rnd()
      const secondsAbove =
        u < 0.55 ? 0
        : u < 0.75 ? Math.floor(rnd() * 60)
        : u < 0.88 ? 60 + Math.floor(rnd() * 60)
        : u < 0.96 ? 120 + Math.floor(rnd() * 180)
        : 300 + Math.floor(rnd() * 600)

      const totalSecs = 20 * 60
      const secondsIn = Math.max(0, totalSecs - secondsAbove - Math.floor(rnd() * 240))
      const secondsBelow = Math.max(0, totalSecs - secondsIn - secondsAbove)

      // THE TRUE EFFECT: modest, saturating, and swamped by frailty for many
      // participants. Brief excursions barely move risk; long ones matter.
      const pFlare = Math.min(0.92, frailty + 0.30 * (1 - Math.exp(-secondsAbove / 420)))
      const nextDayFlare = rnd() < pFlare

      // Real cohorts have missing check-ins and unverified sessions.
      const hasCheckin = rnd() > 0.14
      const verifiedReadingPct = rnd() > 0.12 ? 82 + Math.floor(rnd() * 18) : Math.floor(rnd() * 70)

      const preSymptom = Math.floor(rnd() * 3)
      rows.push({
        researchRef, ageBand, sex,
        condition: 'concussion',
        daysSinceInjury: day,
        hrtBpm: hrt, bandLow, bandHigh,
        sessionType: 'training',
        payload: {
          secondsAbove, secondsIn, secondsBelow,
          verifiedReadingPct,
          ...(hasCheckin ? { nextDayFlare } : {}),
          preSymptom,
          peakSymptom: preSymptom + (nextDayFlare ? 2 + Math.floor(rnd() * 3) : Math.floor(rnd() * 2)),
        },
      })

      day += 1 + Math.floor(rnd() * 3)
      // Threshold recovers, faster when not flaring — the trajectory the
      // secondary analysis is about.
      hrt = Math.min(190, hrt + (nextDayFlare ? rnd() * 1.2 : 1.5 + rnd() * 2.5))
    }
  }
  return rows
}

const n = Number(process.argv[2]) || 70
const seed = Number(process.argv[3]) || 42

const rows = generateCohort(n, seed)
const result = runAnalysis(rows)

console.log(`\nSYNTHETIC cohort — ${n} participants, seed ${seed}, ${rows.length} raw session rows\n`)
console.log('COHORT')
console.log('  participants           ', result.cohort.participants)
console.log('  sessions               ', result.cohort.sessions)
console.log('  sessions/participant   ', result.cohort.sessionsPerParticipant.toFixed(1))
console.log('  median days post-injury', result.cohort.medianDaysSinceInjury)
console.log('  overall flare rate     ', (result.cohort.overallFlareRate * 100).toFixed(1) + '%')

console.log('\nANALYSIS SET')
console.log('  included               ', result.set.includedSessions)
console.log('  excluded: no check-in  ', result.set.excludedNoCheckin)
console.log('  excluded: unverified HR', result.set.excludedUnverified)
console.log('  excluded: no zone data ', result.set.excludedNoZoneData)

console.log('\nFLARE RATE BY EXCURSION')
for (const s of result.exposure) {
  const pct = (s.flareRate * 100).toFixed(1).padStart(5)
  const ci = `[${(s.ci95[0] * 100).toFixed(1)}-${(s.ci95[1] * 100).toFixed(1)}]`
  console.log(`  ${s.label.padEnd(12)} n=${String(s.sessions).padStart(4)}  ${pct}%  95% CI ${ci}`)
}

console.log('\nPOWER (to detect a doubling of the in-band flare rate)')
console.log('  naive sessions needed  ', result.power.naiveSessions)
console.log('  design effect (ICC .15)', result.power.designEffect.toFixed(2))
console.log('  clustered sessions     ', result.power.effectiveSessions)
console.log('  PARTICIPANTS REQUIRED  ', result.power.participants)

console.log('\n' + result.clusterWarning + '\n')

const md = renderManuscript(result, { synthetic: true })
const out = process.env.MANUSCRIPT_OUT || '/tmp/sst-manuscript.md'
await (await import('node:fs/promises')).writeFile(out, md)
console.log(`manuscript rendered → ${out}  (${md.split('\n').length} lines)\n`)
