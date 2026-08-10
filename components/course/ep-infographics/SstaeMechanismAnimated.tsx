'use client'

import { useState } from 'react'
import { InfographicFrame } from './InfographicFrame'

/**
 * ANIMATED: why exercise below the threshold is treatment, not just tolerated.
 *
 * CCM M4 and CRM M4 — the SSTAE module, and the one an EP buys the course for.
 *
 * WHY MOTION. The claim being taught is comparative and temporal: three ways of
 * managing the same injury produce three different recovery curves. A static
 * diagram can assert that; only a comparison the learner drives makes the
 * MAGNITUDE land — and the magnitude is the argument for the whole intervention.
 *
 * The rest arm is deliberately not flat. Rest does not prevent recovery, it
 * slows it — overstating the contrast would be the kind of claim that gets a
 * course pulled apart in review.
 */

const ARMS = [
  {
    id: 'rest',
    label: 'Strict rest',
    colour: '#a0522d',
    // weeks 0..8, symptom burden 0-100
    curve: [92, 88, 82, 75, 68, 60, 52, 45, 38],
    note: 'Deconditioning, autonomic dysregulation persists, and the exercise intolerance is never addressed. Recovery happens, slowly.',
  },
  {
    id: 'unstructured',
    label: 'Unstructured activity',
    colour: '#c9a227',
    curve: [92, 86, 76, 72, 66, 55, 46, 36, 28],
    note: 'Better than rest, but each accidental excursion above threshold provokes a setback — the sawtooth most patients describe as "two steps forward, one back".',
  },
  {
    id: 'sstae',
    label: 'Sub-threshold aerobic',
    colour: '#0d7377',
    curve: [92, 80, 66, 52, 40, 29, 20, 13, 8],
    note: 'Dosed below the measured threshold, progressed on re-test. Restores autonomic regulation and cerebral blood-flow control — the mechanism, not just the symptom.',
  },
] as const

export function SstaeMechanismAnimated() {
  const [shown, setShown] = useState<string[]>(['sstae'])
  const toggle = (id: string) =>
    setShown((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  const W = 100
  const H = 46
  const path = (curve: readonly number[]) =>
    curve
      .map((v, i) => `${i ? 'L' : 'M'}${((i / (curve.length - 1)) * W).toFixed(1)},${(H - (v / 100) * H).toFixed(1)}`)
      .join(' ')

  return (
    <InfographicFrame
      eyebrow="Module 4 · Mechanism"
      title="How sub-symptom-threshold exercise works"
      caption="Three ways of managing the same injury. Rest does not prevent recovery — it slows it, and leaves the exercise intolerance itself untreated."
      ariaLabel="Comparison of symptom burden over eight weeks under three management approaches. Strict rest declines slowly from 92 to 38. Unstructured activity declines to 28 with setbacks along the way. Sub-symptom-threshold aerobic exercise declines fastest, from 92 to 8."
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-1.5">
          {ARMS.map((a) => {
            const on = shown.includes(a.id)
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => toggle(a.id)}
                aria-pressed={on}
                className="flex-1 rounded-lg px-2.5 py-2 text-[11.5px] font-bold transition-colors"
                style={{
                  background: on ? a.colour : '#fff',
                  color: on ? '#fff' : '#4a6a6e',
                  boxShadow: on ? 'none' : 'inset 0 0 0 1px #cfe3e4',
                }}
              >
                {a.label}
              </button>
            )
          })}
        </div>

        <div className="rounded-lg border border-[#dcebeb] bg-white p-3">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 150 }} preserveAspectRatio="none">
            {[0.25, 0.5, 0.75].map((g) => (
              <line key={g} x1="0" y1={H * g} x2={W} y2={H * g} stroke="rgba(22,40,43,0.07)" strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
            ))}
            {ARMS.filter((a) => shown.includes(a.id)).map((a) => (
              <path
                key={a.id}
                d={path(a.curve)}
                fill="none"
                stroke={a.colour}
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
                style={{ transition: 'opacity 300ms' }}
              />
            ))}
          </svg>
          <div className="mt-1.5 flex justify-between text-[10.5px] text-[#7d9598]">
            <span>injury</span><span>week 4</span><span>week 8</span>
          </div>
        </div>

        {ARMS.filter((a) => shown.includes(a.id)).map((a) => (
          <p
            key={a.id}
            className="m-0 rounded-lg px-3.5 py-2.5 text-[13px] leading-relaxed"
            style={{ background: `${a.colour}12`, border: `1px solid ${a.colour}40`, color: '#2c4143' }}
          >
            <strong style={{ color: a.colour }}>{a.label}.</strong> {a.note}
          </p>
        ))}
      </div>
    </InfographicFrame>
  )
}
