'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

/**
 * Rendered Apple Watch swiping through REAL SST Trainer app screens (owner
 * 2026-07-06: "use real screenshot … make the screenshots yourself"). Each
 * frame is an actual watchOS simulator capture driven through the flow via a
 * DEBUG screen-override built into the app — band → safety → graded test
 * (live HR) → pre-session symptom check → recovery trajectory. Not mockups.
 *
 * watch5 is the CURRENT capture set. watch/, watch2/, watch3/ and watch4/ are
 * superseded and referenced by nothing (watch2 is a byte-for-byte copy of
 * watch3; watch5 is watch4 with only 3-test re-captured).
 *
 * LABEL ACCURACY (asset-currency sweep 2026-08-06): 4-training.png was labelled
 * "Train live", but the capture — in every one of the five sets — is the
 * "Before you start / Set a baseline / How bad are your symptoms right now?"
 * screen, i.e. the pre-session symptom check, not a live training screen. The
 * label doubles as the alt text and the caption under the watch, so it asserted
 * something the picture does not show. The live-HR claim is carried by frame 3
 * (Minute 1 of 12 · 83 bpm), which genuinely shows it.
 */

const FRAMES = [
  { src: '/instruments/watch5/1-band.png', label: 'Your band' },
  { src: '/instruments/watch5/2-safety.png', label: 'Safety check' },
  { src: '/instruments/watch5/3-test.png', label: 'Graded test' },
  { src: '/instruments/watch5/4-training.png', label: 'Symptom check' },
  { src: '/instruments/watch5/5-progress.png', label: 'Recovery' },
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
        <div className="relative -my-1 rounded-[40px] bg-gradient-to-b from-slate-400 via-slate-600 to-slate-900 p-[5px] shadow-[0_28px_60px_-20px_rgba(0,0,0,.8)]">
          <span className="absolute -right-[6px] top-[60px] h-[28px] w-[8px] rounded-[3px] bg-gradient-to-b from-slate-300 via-slate-500 to-slate-600" />
          <span className="absolute -right-[4px] top-[102px] h-[36px] w-[5px] rounded-[2.5px] bg-gradient-to-b from-slate-500 to-slate-700" />
          {/* Screen. Captures are pre-padded with black top/bottom margins
              (416×604), so the viewport just matches that aspect (200×290)
              with object-cover — the content sits centered with a comfortable
              black bezel and the rounded corners only ever clip black. */}
          <div className="rounded-[34px] bg-black p-[6px]">
            <div className="relative h-[264px] w-[200px] overflow-hidden rounded-[18px] bg-black">
              <div
                className="flex h-full transition-transform duration-[620ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={{ transform: `translateX(-${i * 200}px)` }}
              >
                {FRAMES.map((f) => (
                  <div key={f.src} className="h-full w-[200px] flex-none">
                    <Image
                      src={f.src}
                      alt={`SST Trainer — ${f.label}`}
                      width={200}
                      height={264}
                      className="block h-full w-full object-cover"
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
