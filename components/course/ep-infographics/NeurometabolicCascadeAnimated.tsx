'use client'

import { useEffect, useRef, useState } from 'react'
import { InfographicFrame } from './InfographicFrame'

/**
 * ANIMATED: the neurometabolic cascade, and the energy crisis it produces.
 *
 * Placed in CCM M1 and CRM M1 — the modules that open each course, and the
 * heaviest pure-text stretch in either (CRM M1 alone is ~7,800 words).
 *
 * WHY MOTION. The cascade is the one concept in the course where the ORDER and
 * the OVERLAP are the content: potassium efflux triggers the pump response,
 * which consumes the glucose, at the same moment perfusion is falling. A static
 * four-panel diagram shows the stages but flattens the timing — and the timing
 * is precisely why the injured brain is energy-starved rather than merely
 * damaged.
 *
 * The demand/supply gap is drawn as two curves diverging, because the gap
 * between them IS the clinical problem and the reason exertion is tolerated
 * poorly. Step through, or play it end to end.
 */

const STAGES = [
  {
    n: 1,
    title: 'Ionic flux',
    body: 'Mechanical force stretches axons. Potassium floods out of the cell, glutamate is released, and the membrane depolarises indiscriminately.',
    demand: 0.34,
    supply: 0.96,
  },
  {
    n: 2,
    title: 'The pumps fire',
    body: 'Sodium–potassium pumps work furiously to restore the gradient. This is ATP-dependent, so glucose consumption spikes — hyperglycolysis.',
    demand: 0.92,
    supply: 0.88,
  },
  {
    n: 3,
    title: 'Calcium influx',
    body: 'Calcium accumulates inside the cell and impairs mitochondria. The organelle that makes ATP is now compromised exactly when ATP demand has peaked.',
    demand: 0.86,
    supply: 0.52,
  },
  {
    n: 4,
    title: 'Perfusion falls',
    body: 'Cerebral blood flow drops and autoregulation is impaired — supply falls further while demand is still elevated.',
    demand: 0.72,
    supply: 0.34,
  },
  {
    n: 5,
    title: 'The energy crisis',
    body: 'A brain that needs more fuel than it can deliver. This window is why exertion provokes symptoms, and why dosing exercise below the threshold works rather than resting entirely.',
    demand: 0.63,
    supply: 0.38,
  },
] as const

export function NeurometabolicCascadeAnimated() {
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!playing) return
    if (idx >= STAGES.length - 1) { setPlaying(false); return }
    timer.current = setTimeout(() => setIdx((i) => i + 1), 2100)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [playing, idx])

  const play = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIdx(STAGES.length - 1); return
    }
    setIdx(0); setPlaying(true)
  }

  const s = STAGES[idx]
  const gap = Math.max(0, s.demand - s.supply)

  // Curves are drawn from the stage table, so editing the physiology edits the
  // drawing — no hand-authored path data to fall out of step.
  const path = (key: 'demand' | 'supply') => {
    const w = 100, h = 46
    return STAGES.map((st, i) => {
      const x = (i / (STAGES.length - 1)) * w
      const y = h - st[key] * h
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    }).join(' ')
  }
  const clip = ((idx + 1) / STAGES.length) * 100

  return (
    <InfographicFrame
      eyebrow="Module 1 · Pathophysiology"
      title="The neurometabolic cascade"
      caption="Energy demand spikes at the moment the machinery that supplies it is failing. The gap between the two curves is the reason exertion provokes symptoms."
      ariaLabel="Five-stage animation. Stage 1 ionic flux: demand low, supply intact. Stage 2 the pumps fire: demand spikes to near maximum. Stage 3 calcium influx impairs mitochondria: supply falls sharply while demand stays high. Stage 4 perfusion falls: supply drops further. Stage 5 the energy crisis: demand remains above supply, the window in which exertion provokes symptoms."
    >
      <div className="flex flex-col gap-4">
        <div className="relative w-full overflow-hidden rounded-lg border border-[#dcebeb] bg-white p-3">
          <svg viewBox="0 0 100 46" className="w-full" style={{ height: 150 }} preserveAspectRatio="none">
            <defs>
              <clipPath id="ncReveal"><rect x="0" y="0" width={clip} height="46" /></clipPath>
              <linearGradient id="ncGap" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c2683f" stopOpacity="0.30" />
                <stop offset="100%" stopColor="#c2683f" stopOpacity="0.04" />
              </linearGradient>
            </defs>
            <g clipPath="url(#ncReveal)">
              <path d={`${path('demand')} L100,46 L0,46 Z`} fill="url(#ncGap)" />
              <path d={path('supply')} fill="none" stroke="#0d7377" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
              <path d={path('demand')} fill="none" stroke="#c2683f" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
            </g>
          </svg>
          <div className="mt-1.5 flex flex-wrap gap-4 text-[11px] text-[#4a6a6e]">
            <span className="inline-flex items-center gap-1.5">
              <i className="inline-block h-[3px] w-3 rounded-sm bg-[#c2683f]" /> ATP demand
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="inline-block h-[3px] w-3 rounded-sm bg-[#0d7377]" /> Energy supply
            </span>
            <span className="ml-auto font-bold tabular-nums text-[#a0522d]">
              deficit {Math.round(gap * 100)}%
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {STAGES.map((st, i) => (
            <button
              key={st.n}
              type="button"
              onClick={() => { setPlaying(false); setIdx(i) }}
              aria-pressed={i === idx}
              className={[
                'flex-1 rounded-lg px-2 py-1.5 text-[11px] font-bold transition-colors',
                i === idx
                  ? 'bg-[#0d7377] text-white'
                  : i < idx
                    ? 'bg-[#dbeceb] text-[#2c5457]'
                    : 'bg-white text-[#7d9598] ring-1 ring-[#e0eded]',
              ].join(' ')}
            >
              {st.n}
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-[#cfe3e4] bg-[#f5fafa] px-3.5 py-3">
          <p className="m-0 text-[13px] font-bold text-[#0d7377]">
            {s.n}. {s.title}
          </p>
          <p className="m-0 mt-1 text-[13px] leading-relaxed text-[#2c5457]">{s.body}</p>
        </div>

        <button
          type="button"
          onClick={play}
          disabled={playing}
          className="self-start rounded-lg bg-[#0d7377] px-4 py-2 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {playing ? 'Playing…' : idx === STAGES.length - 1 ? 'Play again' : 'Play the cascade'}
        </button>
      </div>
    </InfographicFrame>
  )
}
