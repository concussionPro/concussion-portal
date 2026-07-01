'use client'

import { HeartPulse, ShieldCheck, Info } from 'lucide-react'

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

export function SstTrajectory({ points }: { points: TrajectoryPoint[] }) {
  // SPEC 3 — only verified, clinician-gated, real measurements are plottable.
  const plottable = points.filter((p) => p.hrt != null && p.verified === true && p.gated === true)
  const excluded = points.length - plottable.length

  const hrts = plottable.map((p) => p.hrt as number)
  const min = hrts.length ? Math.min(...hrts) : 0
  const max = hrts.length ? Math.max(...hrts) : 0
  // pad the y-range so a flat-ish line isn't pinned to the edges
  const lo = Math.max(0, min - 8)
  const hi = max + 8
  const span = Math.max(1, hi - lo)

  const W = 280
  const H = 96
  const padX = 10
  const innerW = W - padX * 2
  const xy = (p: TrajectoryPoint, i: number) => {
    const x = plottable.length === 1 ? W / 2 : padX + (i / (plottable.length - 1)) * innerW
    const y = H - 8 - ((p.hrt as number) - lo) / span * (H - 24)
    return { x, y }
  }
  const pts = plottable.map((p, i) => ({ ...xy(p, i), p }))
  const path = pts.map((q, i) => `${i === 0 ? 'M' : 'L'} ${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(' ')
  const latest = plottable[plottable.length - 1]
  const first = plottable[0]
  const delta = latest && first ? (latest.hrt as number) - (first.hrt as number) : null

  return (
    <div className="glass-premium rounded-2xl p-5 sm:p-6">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
        <div className="flex items-center gap-2">
          <HeartPulse className="w-[18px] h-[18px] text-[var(--accent)]" strokeWidth={1.8} />
          <h3 className="text-sm font-bold text-foreground">Measured HR-threshold over time</h3>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
          <ShieldCheck className="w-3 h-3" /> verified · clinician-gated
        </span>
      </div>
      {/* SPEC 2 — a trend to interpret, NOT a recovery verdict */}
      <p className="text-[11px] text-muted-foreground leading-snug mb-4">
        Serial <strong>measured</strong> HRt — not a symptom score and not a recovery verdict. A rising threshold
        suggests improving exercise tolerance; interpret with your clinical judgment.
      </p>

      {plottable.length === 0 ? (
        <p className="text-xs text-muted-foreground leading-relaxed py-6 text-center">
          No verified, clinician-gated threshold tests yet. The curve plots a point only when a graded test is
          administered under your clinic code with a live, signal-quality-passed reading.
        </p>
      ) : (
        <>
          <div className="flex items-end gap-3">
            <svg viewBox={`0 0 ${W} ${H}`} className="flex-1 w-full overflow-visible" role="img" aria-label="Measured HRt trajectory">
              {/* connecting trend line */}
              {pts.length > 1 && <path d={path} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={0.5} />}
              {/* points coloured by source tier (SPEC 1) */}
              {pts.map((q, i) => {
                const t = tier(q.p.source)
                return (
                  <g key={i}>
                    <circle cx={q.x} cy={q.y} r={4.5} className={t.accurate ? 'fill-emerald-500' : 'fill-amber-500'} stroke="white" strokeWidth={1.5} />
                    {!t.accurate && <circle cx={q.x} cy={q.y} r={7.5} className="fill-none stroke-amber-400" strokeWidth={1} strokeDasharray="2 2" />}
                  </g>
                )
              })}
            </svg>
            <div className="flex flex-col items-end flex-shrink-0">
              <span className="text-2xl font-bold tabular-nums text-foreground leading-none">{latest?.hrt}<span className="text-xs font-medium text-muted-foreground"> bpm</span></span>
              <span className="text-[10px] text-muted-foreground">latest HRt</span>
              {delta != null && delta !== 0 && (
                <span className={`text-[11px] font-semibold mt-1 ${delta > 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {delta > 0 ? '+' : ''}{delta} bpm since first
                </span>
              )}
            </div>
          </div>

          {/* per-point provenance ledger (SPEC 1) */}
          <div className="mt-4 space-y-1">
            {pts.map((q, i) => {
              const t = tier(q.p.source)
              return (
                <div key={i} className="flex items-center gap-2 text-[11px]">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${t.dot}`} />
                  <span className="text-muted-foreground w-12 flex-shrink-0">{fmtDate(q.p.date)}</span>
                  <span className="font-mono font-semibold text-foreground w-14 flex-shrink-0">{q.p.hrt} bpm</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${t.cls}`}>{t.label}</span>
                  {!t.accurate && <span className="text-[10px] text-amber-600">lower accuracy — exercise PPG error</span>}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* SPEC 3 — excluded ungated/unverified readings are surfaced, never silently dropped */}
      {excluded > 0 && (
        <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-2">
          <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
          <p className="text-[10.5px] text-slate-500 leading-snug">
            {excluded} reading{excluded === 1 ? '' : 's'} excluded — not from a verified, clinician-gated graded test.
            The trajectory only plots provenance-verified, clinician-overseen measurements.
          </p>
        </div>
      )}
    </div>
  )
}
