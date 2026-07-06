'use client'

import Image from 'next/image'

/**
 * Rendered Apple Watch showing the REAL SST Trainer app (owner 2026-07-06:
 * "use real screenshot for the apple watch"). The screen is an actual
 * watchOS simulator capture of the band home (measured band 114–128, ceiling
 * 142) — not a mockup. Gentle float so it reads as alive without a fake
 * swipe. A caption strip names what the app does across the session.
 */

const CAPTION = ['Measure the threshold', 'Prescribe the band', 'Train live in-band', 'Track recovery']

export function SstWatchAnimation() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="sst-watch-float relative">
        {/* top strap */}
        <div className="mx-auto h-8 w-[96px] rounded-t-[16px] bg-gradient-to-b from-[#2b3a57] to-[#1d2b47]" />
        {/* case */}
        <div className="relative -my-1 rounded-[44px] bg-gradient-to-b from-slate-500 via-slate-700 to-slate-900 p-[5px] shadow-[0_28px_60px_-20px_rgba(0,0,0,.8)]">
          <span className="absolute -right-[7px] top-[54px] h-[26px] w-[9px] rounded-[3px] bg-gradient-to-b from-slate-300 via-slate-500 to-slate-600" />
          <span className="absolute -right-[5px] top-[94px] h-[34px] w-[5px] rounded-[2.5px] bg-gradient-to-b from-slate-500 to-slate-700" />
          {/* real screen — black bg melds into the case */}
          <div className="overflow-hidden rounded-[40px] bg-black">
            <Image
              src="/instruments/sst-watch-band.png"
              alt="SST Trainer on Apple Watch — today's measured training band 114–128 bpm, ceiling 142"
              width={184}
              height={220}
              className="block h-[220px] w-[184px] object-cover"
              priority
            />
          </div>
        </div>
        {/* bottom strap */}
        <div className="mx-auto h-8 w-[96px] rounded-b-[16px] bg-gradient-to-t from-[#2b3a57] to-[#1d2b47]" />
      </div>

      {/* what it does */}
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[12px] font-semibold text-slate-500">
        {CAPTION.map((c, i) => (
          <span key={c} className="flex items-center gap-2">
            {i > 0 && <span className="h-1 w-1 rounded-full bg-slate-300" />}
            {c}
          </span>
        ))}
      </div>

      <style>{`
        .sst-watch-float { animation: sstFloat 4.5s ease-in-out infinite; }
        @keyframes sstFloat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
        @media (prefers-reduced-motion: reduce) { .sst-watch-float { animation: none } }
      `}</style>
    </div>
  )
}
