'use client'

import { useState } from 'react'
import { InfographicFrame } from './InfographicFrame'

/**
 * ANIMATED: cerebral autoregulation, and the plateau that concussion flattens.
 *
 * Placed in CCM M1, CRM M1 and CRM M4 — including the SSTAE module, where it is
 * the mechanistic justification for the whole intervention.
 *
 * WHY MOTION. Autoregulation is a RELATIONSHIP: perfusion held flat while
 * pressure swings. A static curve shows the shape but not the behaviour, and the
 * behaviour is the point — a healthy brain absorbs a pressure change, an injured
 * one passes it straight through to flow. Dragging pressure and watching flow
 * either hold or follow demonstrates in three seconds what the text spends four
 * paragraphs on.
 *
 * The learner drives the pressure. That is deliberate: discovering that the
 * curve stops protecting them is more durable than being told it does.
 */

const MAP_MIN = 40
const MAP_MAX = 160
const PLATEAU_LO = 60
const PLATEAU_HI = 150

/** Healthy: flow held near 100% across the plateau, falling off outside it. */
function healthyFlow(map: number): number {
  if (map < PLATEAU_LO) return Math.max(20, 100 - (PLATEAU_LO - map) * 2.0)
  if (map > PLATEAU_HI) return Math.min(190, 100 + (map - PLATEAU_HI) * 2.4)
  return 100
}

/**
 * Impaired: the plateau narrows and flattens toward pressure-passivity — flow
 * tracks pressure almost linearly, which is why position change and exertion
 * both provoke symptoms.
 */
function impairedFlow(map: number): number {
  const linear = 100 + (map - 90) * 0.85
  return Math.max(18, Math.min(190, linear))
}

export function CbfAutoregulationAnimated() {
  const [map, setMap] = useState(90)
  const [impaired, setImpaired] = useState(false)

  const flow = impaired ? impairedFlow(map) : healthyFlow(map)
  const W = 100
  const H = 52

  const curve = (fn: (m: number) => number) => {
    const pts: string[] = []
    for (let m = MAP_MIN; m <= MAP_MAX; m += 2) {
      const x = ((m - MAP_MIN) / (MAP_MAX - MAP_MIN)) * W
      const y = H - (fn(m) / 190) * H
      pts.push(`${pts.length ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`)
    }
    return pts.join(' ')
  }

  const cx = ((map - MAP_MIN) / (MAP_MAX - MAP_MIN)) * W
  const cy = H - (flow / 190) * H
  const deviation = Math.abs(flow - 100)

  return (
    <InfographicFrame
      eyebrow="Pathophysiology"
      title="Cerebral blood-flow autoregulation"
      caption="A healthy brain holds perfusion flat while blood pressure swings. After concussion the plateau narrows and flow starts tracking pressure — which is why standing up, and exerting, both provoke symptoms."
      ariaLabel="Interactive graph of cerebral blood flow against mean arterial pressure. In the healthy state, flow stays at 100 percent across a plateau from roughly 60 to 150 millimetres of mercury. In the impaired state the plateau is lost and flow rises and falls almost linearly with pressure."
    >
      <div className="flex flex-col gap-4">
        <div className="flex gap-2" role="group" aria-label="Autoregulation state">
          {[
            { k: false, label: 'Healthy autoregulation' },
            { k: true, label: 'After concussion' },
          ].map(({ k, label }) => (
            <button
              key={String(k)}
              type="button"
              onClick={() => setImpaired(k)}
              aria-pressed={impaired === k}
              className={[
                'flex-1 rounded-lg px-3 py-2 text-[13px] font-bold transition-colors',
                impaired === k
                  ? k ? 'bg-[#a0522d] text-white' : 'bg-[#0d7377] text-white'
                  : 'bg-white text-[#4a6a6e] ring-1 ring-[#cfe3e4] hover:ring-[#0d7377]',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-[#dcebeb] bg-white p-3">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 168 }} preserveAspectRatio="none">
            {/* the reference plateau — where flow SHOULD sit */}
            <line x1="0" y1={H - (100 / 190) * H} x2={W} y2={H - (100 / 190) * H}
                  stroke="#c9dcdc" strokeWidth="0.4" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
            {!impaired && (
              <rect
                x={((PLATEAU_LO - MAP_MIN) / (MAP_MAX - MAP_MIN)) * W} y="0"
                width={((PLATEAU_HI - PLATEAU_LO) / (MAP_MAX - MAP_MIN)) * W} height={H}
                fill="rgba(13,115,119,0.07)"
              />
            )}
            <path d={curve(impaired ? impairedFlow : healthyFlow)} fill="none"
                  stroke={impaired ? '#a0522d' : '#0d7377'} strokeWidth="1.8"
                  vectorEffect="non-scaling-stroke" style={{ transition: 'stroke 250ms' }} />
            <line x1={cx} y1="0" x2={cx} y2={H} stroke="#8fa5a6" strokeWidth="0.4"
                  strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
            <circle cx={cx} cy={cy} r="1.6" fill={impaired ? '#a0522d' : '#0d7377'} />
          </svg>

          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-[12px] tabular-nums text-[#4a6a6e]">
            <span>Mean arterial pressure <strong className="text-[#16282b]">{map}</strong> mmHg</span>
            <span>
              Cerebral blood flow{' '}
              <strong className={deviation > 12 ? 'text-[#a0522d]' : 'text-[#0d7377]'}>
                {Math.round(flow)}%
              </strong>
            </span>
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-[#4a6a6e]">
            Drag to change blood pressure — stand up, exert, lie down
          </span>
          <input
            type="range" min={MAP_MIN} max={MAP_MAX} value={map}
            onChange={(e) => setMap(Number(e.target.value))}
            className="w-full accent-[#0d7377]"
            aria-label="Mean arterial pressure in millimetres of mercury"
          />
        </label>

        <p
          className={[
            'm-0 rounded-lg px-3.5 py-2.5 text-[13px] leading-relaxed transition-colors',
            impaired
              ? 'border border-[#e0c3ad] bg-[#fbf0e8] text-[#6b3a1c]'
              : 'border border-[#cfe3e4] bg-[#f2f9f9] text-[#2c5457]',
          ].join(' ')}
        >
          {impaired ? (
            <>
              <strong>Pressure-passive.</strong> The plateau is gone — flow now follows pressure
              almost linearly. Every postural change and every increase in workload is transmitted
              straight through to cerebral perfusion, which is the mechanism underneath exercise
              intolerance and the reason dose has to be measured rather than estimated.
            </>
          ) : (
            <>
              <strong>Held flat.</strong> Across roughly 60–150 mmHg, resistance vessels dilate and
              constrict to keep perfusion constant. The brain is insulated from ordinary swings in
              blood pressure — standing, walking, exerting.
            </>
          )}
        </p>
      </div>
    </InfographicFrame>
  )
}
