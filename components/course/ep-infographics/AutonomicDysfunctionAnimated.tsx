'use client'

import { useEffect, useRef, useState } from 'react'
import { InfographicFrame } from './InfographicFrame'

/**
 * ANIMATED: the sympathovagal shift that produces exercise intolerance.
 *
 * Five placements (CCM M7; CRM M1, M2, M4, M7) — the most-used infographic in
 * either course, which is why it is second in the queue after
 * hrt-to-prescription.
 *
 * WHY MOTION. The teaching point is a CHANGE OF STATE: the same three signals
 * (sympathetic drive, vagal tone, heart-rate variability) look one way in a
 * healthy autonomic system and another after concussion. A static image must
 * show both side by side and let the reader do the comparison; an animated
 * transition does the comparison for them, which is the entire reason the
 * concept is hard to convey in text.
 *
 * The learner drives the toggle. Autonomy matters here — being able to flip
 * back and forth is what makes the difference legible, and it is not something
 * a rendered video could offer.
 */

type State = 'healthy' | 'concussed'

const SIGNALS = [
  {
    key: 'symp',
    label: 'Sympathetic drive',
    healthy: 0.42,
    concussed: 0.82,
    note: 'Rises and stays elevated — the system sits switched on.',
  },
  {
    key: 'vagal',
    label: 'Vagal (parasympathetic) tone',
    healthy: 0.68,
    concussed: 0.28,
    note: 'Withdrawn. The brake comes off before the accelerator does anything.',
  },
  {
    key: 'hrv',
    label: 'Heart-rate variability',
    healthy: 0.74,
    concussed: 0.31,
    note: 'Falls with vagal tone — the measurable signature of the shift.',
  },
  {
    key: 'baro',
    label: 'Baroreflex sensitivity',
    healthy: 0.7,
    concussed: 0.35,
    note: 'Blunted, so blood pressure and heart rate respond sluggishly to position and load.',
  },
] as const

export function AutonomicDysfunctionAnimated() {
  const [state, setState] = useState<State>('healthy')
  const [vals, setVals] = useState<number[]>(SIGNALS.map((s) => s.healthy))
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const target = SIGNALS.map((s) => (state === 'healthy' ? s.healthy : s.concussed))
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVals(target)
      return
    }
    const from = vals.slice()
    const t0 = performance.now()
    const DUR = 750
    const step = (now: number) => {
      const k = Math.min((now - t0) / DUR, 1)
      // easeOutCubic — the physiological shift settles rather than snaps
      const e = 1 - Math.pow(1 - k, 3)
      setVals(from.map((f, i) => f + (target[i] - f) * e))
      if (k < 1) rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const concussed = state === 'concussed'

  return (
    <InfographicFrame
      eyebrow="Pathophysiology"
      title="Autonomic dysfunction after concussion"
      caption="Sympathetic drive rises, vagal tone withdraws, and heart-rate variability falls with it. This is why a patient can be symptom-free at rest and intolerant the moment load is applied."
      ariaLabel="Interactive comparison. In a healthy autonomic system, sympathetic drive is moderate, vagal tone and heart-rate variability are high, and baroreflex sensitivity is intact. After concussion, sympathetic drive rises sharply while vagal tone, heart-rate variability and baroreflex sensitivity all fall."
    >
      <div className="flex flex-col gap-4">
        <div className="flex gap-2" role="group" aria-label="Autonomic state">
          {(['healthy', 'concussed'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setState(s)}
              aria-pressed={state === s}
              className={[
                'flex-1 rounded-lg px-3 py-2 text-[13px] font-bold transition-colors',
                state === s
                  ? s === 'healthy'
                    ? 'bg-[#0d7377] text-white'
                    : 'bg-[#a0522d] text-white'
                  : 'bg-white text-[#4a6a6e] ring-1 ring-[#cfe3e4] hover:ring-[#0d7377]',
              ].join(' ')}
            >
              {s === 'healthy' ? 'Healthy autonomic system' : 'After concussion'}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {SIGNALS.map((sig, i) => {
            const v = vals[i]
            const worse = concussed
              ? sig.key === 'symp' ? v > sig.healthy : v < sig.healthy
              : false
            return (
              <div key={sig.key} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[12.5px] font-semibold text-[#16282b]">{sig.label}</span>
                  <span
                    className={[
                      'text-[11px] font-bold tabular-nums',
                      worse ? 'text-[#a0522d]' : 'text-[#0d7377]',
                    ].join(' ')}
                  >
                    {Math.round(v * 100)}%
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#e6eeee]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${v * 100}%`,
                      background: worse ? '#a0522d' : '#0d7377',
                      transition: 'background 300ms ease',
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <p
          className={[
            'rounded-lg px-3.5 py-2.5 text-[13px] leading-relaxed transition-colors',
            concussed
              ? 'border border-[#e0c3ad] bg-[#fbf0e8] text-[#6b3a1c]'
              : 'border border-[#cfe3e4] bg-[#f2f9f9] text-[#2c5457]',
          ].join(' ')}
        >
          {concussed ? (
            <>
              <strong>Switched on, and unable to modulate.</strong> The accelerator is depressed and
              the brake has been removed. Resting heart rate can look unremarkable while the response
              to load is completely disordered — which is exactly why a resting examination misses
              this, and a graded exertion test finds it.
            </>
          ) : (
            <>
              <strong>Balanced and responsive.</strong> Vagal tone dominates at rest, variability is
              high, and the baroreflex adjusts heart rate and blood pressure moment to moment as
              position and load change.
            </>
          )}
        </p>
      </div>
    </InfographicFrame>
  )
}
