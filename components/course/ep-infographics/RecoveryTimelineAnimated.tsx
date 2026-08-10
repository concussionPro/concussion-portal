'use client'

import { useState } from 'react'
import { InfographicFrame } from './InfographicFrame'

/**
 * ANIMATED: the recovery distribution — and where "normal" stops.
 *
 * CCM M2, CRM M1.
 *
 * WHY MOTION. The number every patient asks for is "how long", and the honest
 * answer is a DISTRIBUTION, not a figure. A static curve gets read as an
 * average and the average gets quoted back to patients as a promise. Dragging a
 * day marker and watching the proportion recovered climb makes the spread the
 * subject rather than the mean — and shows the reader exactly where their
 * patient sits rather than whether they are "late".
 *
 * Percentages are illustrative of the shape reported in the literature, not
 * exact figures from one cohort, and the caption says so. A precise-looking
 * number here would be quoted as fact.
 */

// Cumulative proportion recovered by day — adult pattern, deliberately coarse.
const POINTS: Array<[number, number]> = [
  [0, 0], [7, 22], [14, 48], [21, 66], [28, 78], [42, 87], [60, 92], [90, 96],
]

function recoveredBy(day: number): number {
  for (let i = 1; i < POINTS.length; i++) {
    const [d0, v0] = POINTS[i - 1]
    const [d1, v1] = POINTS[i]
    if (day <= d1) return v0 + ((day - d0) / (d1 - d0)) * (v1 - v0)
  }
  return 96
}

export function RecoveryTimelineAnimated() {
  const [day, setDay] = useState(14)
  const pct = recoveredBy(day)
  const W = 100, H = 40
  const path = POINTS.map(([d, v], i) => `${i ? 'L' : 'M'}${((d / 90) * W).toFixed(1)},${(H - (v / 100) * H).toFixed(1)}`).join(' ')
  const x = (day / 90) * W
  const persistent = day >= 28

  return (
    <InfographicFrame
      eyebrow="Recognition"
      title="How long recovery actually takes"
      caption="A distribution, not a number. Proportions illustrate the shape reported across cohorts rather than exact figures from any one of them."
      ariaLabel="Interactive recovery curve. Cumulative proportion recovered rises steeply through the first three weeks and flattens after four. Roughly a fifth remain symptomatic at four weeks, which is the threshold at which persistent symptoms are described."
    >
      <div className="flex flex-col gap-3">
        <div className="rounded-lg border border-[#dcebeb] bg-white p-3">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 138 }} preserveAspectRatio="none">
            <rect x={(28 / 90) * W} y="0" width={W - (28 / 90) * W} height={H} fill="rgba(160,82,45,0.06)" />
            <path d={`${path} L${W},${H} L0,${H} Z`} fill="rgba(13,115,119,0.10)" />
            <path d={path} fill="none" stroke="#0d7377" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            <line x1={x} y1="0" x2={x} y2={H} stroke="#16282b" strokeWidth="0.5" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
            <circle cx={x} cy={H - (pct / 100) * H} r="1.6" fill="#0d7377" />
          </svg>
          <div className="mt-1.5 flex justify-between text-[10.5px] text-[#7d9598]">
            <span>injury</span><span>4 weeks</span><span>3 months</span>
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="flex items-baseline justify-between text-[12px] font-semibold text-[#4a6a6e]">
            <span>Days since injury</span>
            <span className="text-[15px] font-bold tabular-nums text-[#16282b]">{day}</span>
          </span>
          <input
            type="range" min={0} max={90} value={day}
            onChange={(e) => setDay(Number(e.target.value))}
            className="w-full accent-[#0d7377]"
            aria-label="Days since injury"
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-[#cfe3e4] bg-[#f2f9f9] px-3 py-2.5 text-center">
            <p className="m-0 text-[10px] font-bold uppercase tracking-[0.12em] text-[#0d7377]">Recovered</p>
            <p className="m-0 text-[22px] font-extrabold tabular-nums text-[#0d7377]">{Math.round(pct)}%</p>
          </div>
          <div className="rounded-lg border border-[#e0c3ad] bg-[#fbf0e8] px-3 py-2.5 text-center">
            <p className="m-0 text-[10px] font-bold uppercase tracking-[0.12em] text-[#a0522d]">Still symptomatic</p>
            <p className="m-0 text-[22px] font-extrabold tabular-nums text-[#a0522d]">{Math.round(100 - pct)}%</p>
          </div>
        </div>

        <p
          className="m-0 rounded-lg px-3.5 py-2.5 text-[13px] leading-relaxed transition-colors"
          style={
            persistent
              ? { background: '#fbf0e8', border: '1px solid #e0c3ad', color: '#6b3a1c' }
              : { background: '#f2f9f9', border: '1px solid #cfe3e4', color: '#2c5457' }
          }
        >
          {persistent ? (
            <>
              <strong>Past four weeks.</strong> This is where persistent symptoms are described — and
              where a phenotype assessment stops being optional. The curve is nearly flat from here,
              so time alone is no longer doing the work.
            </>
          ) : (
            <>
              <strong>Inside the steep part.</strong> Most recovery happens here, which is exactly why
              early sub-threshold exercise matters — and why &ldquo;they got better&rdquo; is weak
              evidence that any particular thing worked.
            </>
          )}
        </p>
      </div>
    </InfographicFrame>
  )
}
