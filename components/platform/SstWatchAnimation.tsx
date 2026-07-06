'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

/**
 * Rendered Apple Watch swiping through REAL SST Trainer app screens (owner
 * 2026-07-06: "use real screenshot … make the screenshots yourself"). Each
 * frame is an actual watchOS simulator capture driven through the flow via a
 * DEBUG screen-override built into the app — band → safety → graded test
 * (live HR) → training → recovery trajectory. Not mockups.
 */

const FRAMES = [
  { src: '/instruments/watch/1-band.png', label: 'Your band' },
  { src: '/instruments/watch/2-safety.png', label: 'Safety check' },
  { src: '/instruments/watch/3-test.png', label: 'Graded test' },
  { src: '/instruments/watch/4-training.png', label: 'Train live' },
  { src: '/instruments/watch/5-progress.png', label: 'Recovery' },
]
const N = FRAMES.length
const HOLD_MS = 2600

export function SstWatchAnimation() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % N), HOLD_MS)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        {/* top strap */}
        <div className="mx-auto h-8 w-[104px] rounded-t-[18px] bg-gradient-to-b from-[#2b3a57] to-[#1d2b47]" />
        {/* metal case */}
        <div className="relative -my-1 rounded-[50px] bg-gradient-to-b from-slate-400 via-slate-600 to-slate-900 p-[4px] shadow-[0_28px_60px_-20px_rgba(0,0,0,.8)]">
          <span className="absolute -right-[6px] top-[60px] h-[28px] w-[8px] rounded-[3px] bg-gradient-to-b from-slate-300 via-slate-500 to-slate-600" />
          <span className="absolute -right-[4px] top-[102px] h-[36px] w-[5px] rounded-[2.5px] bg-gradient-to-b from-slate-500 to-slate-700" />
          {/* black OLED bezel — the padding insets the capture so its content
              never touches the rounded corners (this was the clipping bug) */}
          <div className="rounded-[48px] bg-black p-[9px]">
            {/* Taller than the 416:496 capture so it letterboxes with black
                top/bottom (the OLED bezel) — nothing gets cut by the corners. */}
            <div className="relative flex h-[280px] w-[208px] items-center overflow-hidden rounded-[38px] bg-black">
              <div
                className="flex h-full transition-transform duration-[620ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={{ width: `${N * 100}%`, transform: `translateX(-${(i * 100) / N}%)` }}
              >
                {FRAMES.map((f) => (
                  <div key={f.src} style={{ width: `${100 / N}%` }} className="relative h-full">
                    <Image
                      src={f.src}
                      alt={`SST Trainer — ${f.label}`}
                      width={191}
                      height={228}
                      className="block h-full w-full object-contain"
                      priority
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* bottom strap */}
        <div className="mx-auto h-8 w-[104px] rounded-b-[18px] bg-gradient-to-t from-[#2b3a57] to-[#1d2b47]" />
      </div>

      {/* stage dots */}
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
        <span className="text-slate-400"> — on the watch they already own</span>
      </p>
    </div>
  )
}
