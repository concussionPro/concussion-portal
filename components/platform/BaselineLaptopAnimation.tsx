'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

/**
 * Rendered laptop swiping through REAL baseline-flow screens (owner: "it
 * should be animated on a desktop the same way sst is animated on a watch").
 * Each frame is an actual capture of the /preseason athlete flow — athlete
 * info → symptom scale → cognitive test → delayed recall → report. Not a
 * mockup. Same swipe mechanism as the watch (explicit pixel widths).
 */

const FRAMES = [
  { src: '/instruments/baseline-flow2/1.png', label: 'Athlete details' },
  { src: '/instruments/baseline-flow2/2.png', label: 'Symptom scale' },
  { src: '/instruments/baseline-flow2/3.png', label: 'Cognitive test' },
  { src: '/instruments/baseline-flow2/4.png', label: 'Delayed recall' },
  { src: '/instruments/baseline-flow2/5.png', label: 'Report' },
]
const N = FRAMES.length
const HOLD_MS = 2600
const SCREEN_W = 360
const SCREEN_H = 225 // 16:10

export function BaselineLaptopAnimation() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % N), HOLD_MS)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="flex w-full max-w-[440px] flex-col items-center gap-4">
      <div className="w-full">
        {/* lid / screen */}
        <div className="rounded-t-[16px] bg-gradient-to-b from-slate-700 to-slate-900 p-[10px] shadow-[0_24px_50px_-18px_rgba(22,36,63,.5)]">
          <div className="overflow-hidden rounded-[8px] bg-white">
            {/* browser chrome */}
            <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-100 px-3 py-2">
              <span className="h-[8px] w-[8px] rounded-full bg-red-300" />
              <span className="h-[8px] w-[8px] rounded-full bg-amber-300" />
              <span className="h-[8px] w-[8px] rounded-full bg-emerald-300" />
              <span className="mx-auto rounded bg-white px-2.5 py-[3px] font-mono text-[9px] text-slate-400">
                /preseason/b/YOURCODE
              </span>
            </div>
            {/* swiping viewport */}
            <div className="relative overflow-hidden bg-white" style={{ width: '100%', height: SCREEN_H }}>
              <div
                className="flex h-full transition-transform duration-[620ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={{ transform: `translateX(-${i * 100}%)` }}
              >
                {FRAMES.map((f) => (
                  <div key={f.src} className="h-full w-full flex-none" style={{ minWidth: '100%' }}>
                    <Image
                      src={f.src}
                      alt={`Pre-season baseline — ${f.label}`}
                      width={SCREEN_W}
                      height={SCREEN_H}
                      className="block h-full w-full object-cover object-top"
                      priority
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* base / hinge */}
        <div className="mx-auto h-[10px] w-full rounded-b-[12px] rounded-t-[2px] bg-gradient-to-b from-slate-300 to-slate-400 shadow-[0_8px_16px_-6px_rgba(51,65,85,.45)]">
          <span className="mx-auto block h-[3px] w-[14%] rounded-b-[3px] bg-slate-400" />
        </div>
      </div>

      {/* stage dots + caption */}
      <div className="flex items-center gap-1.5">
        {FRAMES.map((f, idx) => (
          <button
            key={f.src}
            type="button"
            aria-label={f.label}
            onClick={() => setI(idx)}
            className="h-1.5 rounded-full transition-all"
            style={{ width: idx === i ? 18 : 6, background: idx === i ? '#0d9488' : 'rgba(148,163,184,0.5)' }}
          />
        ))}
      </div>
      <p className="m-0 text-[12px] font-semibold text-[#16243f]">
        {FRAMES[i].label}
        <span className="text-slate-400"> — on any computer, ~5 min</span>
      </p>
    </div>
  )
}
