'use client'

import { useState } from 'react'
import { HeartPulse, ShieldCheck, Info, Clock } from 'lucide-react'

/**
 * SST Trainer — measured-HRt recovery-trajectory instrument.
 *
 * This is the wedge made visible: serial MEASURED heart-rate threshold (HRt)
 * over time, NOT a symptom-score curve (that's what CCMI/Sway track). It is
 * built to embody the three disciplines locked in docs/sst-publications:
 *
 *  SPEC 1 — provenance per point. Every plotted point carries its source tier
 *    (paired sensor > camera-PPG) and signal-quality. Lower-accuracy sources
 *    are shown as such, never hidden. Integrity-not-accuracy: provenance is
 *    surfaced so the clinician interprets with it, not around it.
 *
 *  SPEC 2 — measured-threshold, NOT recovery-verdict. The curve is labelled as
 *    a physiological trend the clinician interprets; it makes no claim to
 *    predict or guarantee recovery.
 *
 *  SPEC 3 — clinician-gated points only. The curve renders ONLY verified,
 *    clinician-gated graded-test measurements. An ungated/unverified reading is
 *    never plotted — it's excluded and counted. This is the visible enforcement
 *    of the safety line (the provocative graded test stays behind a clinician);
 *    if the curve could plot an ungated point it would normalise ungated
 *    testing, the exact failure mode. Gated-by-construction, like progression
 *    is verified-by-construction.
 */

export type TrajectoryPoint = {
  date: string // ISO or display string
  hrt: number | null
  /** measurement source — 'bluetooth' = paired sensor, 'camera' = camera-PPG, 'manual' = entered */
  source?: 'bluetooth' | 'camera' | 'manual' | string
  /** the reading came from a live, signal-quality-passed source (fail-closed engine) */
  verified?: boolean
  /** the graded test that produced it was clinician-gated (clinic-code / clinician-overseen) */
  gated?: boolean
  interpretation?: string | null
  /** newer app versions tag threshold results with an eventType (e.g. 'red-flag', 'aborted') */
  eventType?: string | null
  /** test modality — treadmill / bike / walk (absent on old rows) */
  modality?: string | null
  /** % of readings during the test that were live-signal-verified (absent on old rows) */
  verifiedReadingPct?: number | null
  /**
   * Distinct minutes of the graded ramp recorded by this test. The exhaustion
   * arm returns the clearance-grade 'no-intolerance' from a ramp of ANY length,
   * so the exercise dose has to travel with the finding. 0/absent on rows whose
   * stage table was not stored — never guessed.
   */
  stagesRecorded?: number | null
}

/** Source accuracy tier — strap/paired sensor is most accurate; camera-PPG has
 *  known exercise error; manual is not a live measurement. Surfaced, not hidden. */
function tier(source?: string): { label: string; cls: string; dot: string; accurate: boolean } {
  if (source === 'bluetooth') return { label: 'Paired sensor', cls: 'text-emerald-700 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', accurate: true }
  if (source === 'camera') return { label: 'Camera-PPG', cls: 'text-amber-700 bg-amber-50 border-amber-200', dot: 'bg-amber-500', accurate: false }
  return { label: 'Manual', cls: 'text-slate-600 bg-slate-50 border-slate-200', dot: 'bg-slate-400', accurate: false }
}

function fmtDate(d: string) {
  const t = Date.parse(d)
  if (Number.isNaN(t)) return d
  return new Date(t).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

/** Collapse the app's namespaced eventTypes ('threshold-red-flag',
 *  'test-aborted', …) and bare interpretation values onto one vocabulary. */
function pointKind(p: TrajectoryPoint): string {
  const raw = (p.interpretation ?? p.eventType ?? '').toLowerCase().trim()
  if (raw === 'threshold-red-flag') return 'red-flag'
  if (raw === 'threshold-no-intolerance') return 'no-intolerance'
  if (raw === 'threshold-physiologic') return 'physiologic'
  if (raw === 'test-aborted') return 'aborted'
  return raw
}

/** Human label for a threshold test that produced no measurable HRt. */
function nonMeasurableLabel(p: TrajectoryPoint): { label: string; cls: string } {
  const kind = pointKind(p)
  if (kind === 'red-flag') return { label: 'red flag — test stopped', cls: 'text-red-700 bg-red-50 border-red-200' }
  if (kind === 'red-flag-cleared') return { label: 'red-flag hold cleared', cls: 'text-slate-600 bg-slate-50 border-slate-200' }
  if (kind === 'no-intolerance') return { label: 'no intolerance — exhaustion without provocation', cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
  if (kind === 'aborted') return { label: 'test aborted', cls: 'text-amber-700 bg-amber-50 border-amber-200' }
  if (kind === 'invalid') return { label: 'invalid — not enough data', cls: 'text-slate-600 bg-slate-50 border-slate-200' }
  return { label: 'no HRt recorded', cls: 'text-slate-600 bg-slate-50 border-slate-200' }
}

export function SstTrajectory({ points }: { points: TrajectoryPoint[] }) {
  const [mountedAt] = useState(() => Date.now())
  // SPEC 3 — only verified, clinician-gated, PAIRED-SENSOR measurements are
  // plottable. Camera-PPG is invalid during exercise (documented launch-review
  // ruling) and a graded test IS exercise — so a camera-derived HRt never
  // joins the recovery trajectory, however it's badged. It is surfaced in the
  // excluded ledger with its reason, never silently dropped. Manual entry is
  // not a live measurement and is excluded for the same reason.
  const plottable = points.filter((p) => p.hrt != null && p.verified === true && p.gated === true && p.source === 'bluetooth')
  // Readings WITH an HRt that fail the trajectory rule — listed with reasons.
  const lowerTier = points.filter((p) => p.hrt != null && !(p.verified === true && p.gated === true && p.source === 'bluetooth'))
  // Split the exclusions honestly: a test WITHOUT a measurable HRt
  // (no-intolerance / red-flag / aborted / invalid) is a clinical event, not an
  // integrity failure — list it in the ledger. Only readings that HAVE an HRt
  // but failed the verified/gated gate count as excluded readings.
  const nonMeasurable = points.filter((p) => p.hrt == null)
  const excluded = lowerTier.length

  // Re-test cadence hint — serial measurement is the whole instrument. Based on
  // the newest test of ANY kind; suppressed once the patient has recovered
  // (no-intolerance) or is red-flagged (medical review, not a re-test).
  const newestTs = points
    .map((p) => Date.parse(p.date))
    .filter((n) => !Number.isNaN(n))
    .reduce((a, b) => Math.max(a, b), 0)
  // Wall-clock read ONCE per mount, not on every render — calling Date.now()
  // during render is impure and makes "days since test" depend on when React
  // happens to re-render. A re-test cadence can't meaningfully cross a day
  // boundary mid-view.
  const daysSinceTest = newestTs > 0 ? Math.floor((mountedAt - newestTs) / 86_400_000) : null
  const latestKind = [...points].reverse().find((p) => p.interpretation || p.eventType)
  const latestState = latestKind ? pointKind(latestKind) : null
  const retestDue = daysSinceTest != null && daysSinceTest >= 14 && latestState !== 'no-intolerance' && latestState !== 'red-flag'

  const hrts = plottable.map((p) => p.hrt as number)
  const min = hrts.length ? Math.min(...hrts) : 0
  const max = hrts.length ? Math.max(...hrts) : 0
  // pad the y-range so a flat-ish line isn't pinned to the edges
  const lo = Math.max(0, min - 8)
  const hi = max + 8
  const span = Math.max(1, hi - lo)

  // Chart geometry — a labelled instrument, not floating dots: value labels
  // above each point, dates on the x-axis, bpm gridlines, soft area fill.
  const W = 560
  const H = 176
  const padL = 34
  const padR = 16
  const padT = 24
  const padB = 26
  const innerW = W - padL - padR
  const innerH = H - padT - padB
  const xy = (p: TrajectoryPoint, i: number) => {
    const x = plottable.length === 1 ? W / 2 : padL + (i / (plottable.length - 1)) * innerW
    const y = padT + (1 - ((p.hrt as number) - lo) / span) * innerH
    return { x, y }
  }
  const pts = plottable.map((p, i) => ({ ...xy(p, i), p }))
  const path = pts.map((q, i) => `${i === 0 ? 'M' : 'L'} ${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(' ')
  const areaPath = pts.length > 1
    ? `${path} L ${pts[pts.length - 1].x.toFixed(1)} ${(H - padB).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(H - padB).toFixed(1)} Z`
    : ''
  const gridVals = [lo + 4, (lo + hi) / 2, hi - 4].map((v) => Math.round(v))
  const gy = (v: number) => padT + (1 - (v - lo) / span) * innerH
  const latest = plottable[plottable.length - 1]
  const first = plottable[0]
  const delta = latest && first ? (latest.hrt as number) - (first.hrt as number) : null

  return (
    <div className="glass-premium rounded-2xl p-5 sm:p-6">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
        <h3 className="text-sm font-bold text-foreground">Measured HR-threshold over time</h3>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
          <ShieldCheck className="w-3 h-3" /> paired sensor · clinician-gated
        </span>
      </div>
      {/* SPEC 2 (a trend to interpret, NOT a recovery verdict) now rides in the
          footnote under the chart — as a lead paragraph it was the third
          integrity statement before any data (2026-08-11 design pass). */}
      <div className="mb-3" />

      {retestDue && (
        <div className="mb-4 flex items-start gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-2">
          <Clock className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] font-semibold text-amber-800 leading-snug">
            Re-test due — last measured {daysSinceTest} days ago
          </p>
        </div>
      )}

      {plottable.length === 0 ? (
        <p className="text-xs text-muted-foreground leading-relaxed py-6 text-center">
          No verified, clinician-gated threshold tests yet. The curve plots a point only when a graded test is
          administered under your clinic code with a live paired-sensor reading.
        </p>
      ) : (
        <>
          {/* Latest stat — in-flow, not floating in dead space */}
          <div className="flex items-baseline justify-end gap-2 mb-1">
            <span className="text-xl font-bold tabular-nums text-foreground leading-none">{latest?.hrt}<span className="text-[11px] font-medium text-muted-foreground"> bpm latest</span></span>
            {delta != null && delta !== 0 && (
              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${delta > 0 ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'}`}>
                {delta > 0 ? '+' : ''}{delta} since first
              </span>
            )}
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible" role="img" aria-label="Measured HRt trajectory">
            {/* bpm gridlines */}
            {gridVals.map((v) => (
              <g key={v}>
                <line x1={padL} x2={W - padR} y1={gy(v)} y2={gy(v)} stroke="#e2e8f0" strokeWidth={1} strokeDasharray="3 4" />
                <text x={padL - 6} y={gy(v) + 3} textAnchor="end" fontSize={8.5} fill="#94a3b8">{v}</text>
              </g>
            ))}
            {/* soft area under the trend */}
            {areaPath && <path d={areaPath} fill="var(--accent)" opacity={0.06} />}
            {/* trend line */}
            {pts.length > 1 && <path d={path} fill="none" stroke="var(--accent)" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" opacity={0.75} />}
            {/* points: value above, date below, latest emphasised */}
            {pts.map((q, i) => {
              const isLast = i === pts.length - 1
              return (
                <g key={i}>
                  {isLast && <circle cx={q.x} cy={q.y} r={8} fill="none" stroke="var(--accent)" strokeWidth={1.25} opacity={0.45} />}
                  <circle cx={q.x} cy={q.y} r={4.5} fill="var(--accent)" stroke="white" strokeWidth={1.5} />
                  <text x={q.x} y={q.y - 10} textAnchor="middle" fontSize={isLast ? 12 : 10.5} fontWeight={700} fill="#0f172a">{q.p.hrt}</text>
                  <text x={q.x} y={H - 8} textAnchor="middle" fontSize={9} fill="#94a3b8">{fmtDate(q.p.date)}</text>
                </g>
              )
            })}
          </svg>

          {/* provenance + SPEC 2 in one footnote — the per-point detail lives
              ON the chart, and the trend-not-verdict framing belongs with the
              data it qualifies, not above it */}
          <div className="mt-2 flex items-start gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0 mt-px text-emerald-600" />
            <span>
              {plottable.length} graded test{plottable.length === 1 ? '' : 's'} plotted — all paired-sensor,
              clinician-gated. A measured trend to interpret with clinical judgment, not a recovery verdict.
            </span>
          </div>
        </>
      )}

      {/* Threshold tests that produced no measurable HRt (no-intolerance /
          red-flag / aborted / invalid) — clinical events, listed not plotted */}
      {nonMeasurable.length > 0 && (
        <div className={`space-y-1 ${plottable.length ? 'mt-3 pt-3 border-t border-black/5' : 'mt-1'}`}>
          {nonMeasurable.map((q, i) => {
            const lbl = nonMeasurableLabel(q)
            return (
              <div key={i} className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-300" />
                <span className="text-muted-foreground w-12 flex-shrink-0">{fmtDate(q.date)}</span>
                <span className="font-mono text-muted-foreground/70 w-14 flex-shrink-0">— bpm</span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${lbl.cls}`}>{lbl.label}</span>
                {q.modality && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border bg-slate-50 border-slate-200 text-slate-600 capitalize">{q.modality}</span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* SPEC 3 — excluded readings are ITEMISED with their reason, never
          silently dropped and never drawn on the line. */}
      {lowerTier.length > 0 && (
        <div className={`space-y-1 ${plottable.length || nonMeasurable.length ? 'mt-3 pt-3 border-t border-black/5' : 'mt-1'}`}>
          {lowerTier.map((q, i) => {
            const why =
              q.source === 'camera'
                ? 'camera-PPG — invalid during exercise; not plotted'
                : q.source === 'manual'
                  ? 'manual entry — not a live measurement; not plotted'
                  : !q.gated
                    ? 'not clinician-gated; not plotted'
                    : 'unverified signal; not plotted'
            return (
              <div key={i} className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[11px] opacity-80">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-300" />
                <span className="text-muted-foreground w-12 flex-shrink-0">{fmtDate(q.date)}</span>
                <span className="font-mono text-muted-foreground w-14 flex-shrink-0 line-through decoration-slate-300">{q.hrt} bpm</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border bg-slate-50 border-slate-200 text-slate-500">{why}</span>
              </div>
            )
          })}
          <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-2">
            <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
            <p className="text-[10.5px] text-slate-500 leading-snug">
              The trajectory plots paired-sensor, clinician-gated graded tests only. Excluded readings are
              listed above with their reason — surfaced, never drawn.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
