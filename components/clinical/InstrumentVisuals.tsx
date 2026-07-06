'use client'

import Image from 'next/image'

/**
 * The Clinical Testing device visuals — REAL product screenshots framed as
 * devices (owner: "replace the bento with an actual watch … then a laptop";
 * hand-drawn mockups kept reading as blobs). The watch image is a live
 * capture of the SST watchOS app (simulator, real state: band 114–128,
 * ceiling 142); the laptop image is the live /preseason/b/DEMO00 athlete
 * flow. Re-capture via simctl / Playwright when the apps change.
 */

export function SstWatchVisual() {
  return (
    <div className="relative flex h-full min-h-[250px] flex-col items-center justify-center overflow-hidden rounded-xl bg-[#0d1830] py-5">
      <span className="absolute left-3 top-2.5 z-20 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">
        The real app — on their wrist
      </span>
      {/* ambient glow */}
      <div className="absolute h-48 w-48 rounded-full bg-teal-400/[0.08] blur-3xl" />

      {/* strap – case (real screenshot) – strap, one connected column */}
      <div className="relative z-10 mt-3 flex flex-col items-center">
        <div className="h-[26px] w-[72px] rounded-t-[12px] bg-gradient-to-b from-[#2b3a57] to-[#1d2b47]" />
        <div className="relative -mt-[1px] rounded-[36px] bg-gradient-to-b from-slate-500 via-slate-700 to-slate-800 p-[3px] shadow-[0_18px_40px_-14px_rgba(0,0,0,.85)]">
          {/* crown + side button */}
          <span className="absolute -right-[6px] top-[30px] h-[22px] w-[8px] rounded-[3px] bg-gradient-to-b from-slate-300 via-slate-500 to-slate-600" />
          <span className="absolute -right-[4px] top-[62px] h-[28px] w-[5px] rounded-[2.5px] bg-gradient-to-b from-slate-500 to-slate-700" />
          {/* the actual watch app — screenshot bg is black, so it melds into the case */}
          <div className="overflow-hidden rounded-[33px] bg-black">
            <Image
              src="/instruments/sst-watch-screen.png"
              alt="SST Trainer running on an Apple Watch — today's training band 114–128 bpm"
              width={138}
              height={162}
              className="block h-[162px] w-[138px] object-cover"
            />
          </div>
        </div>
        <div className="-mt-[1px] h-[26px] w-[72px] rounded-b-[12px] bg-gradient-to-t from-[#2b3a57] to-[#1d2b47]" />
      </div>
    </div>
  )
}

export function BaselineLaptopVisual() {
  return (
    <div className="relative flex h-full min-h-[290px] flex-col items-center justify-end overflow-hidden rounded-xl bg-gradient-to-b from-[#eef4f4] to-[#dde8e8] pt-9">
      <span className="absolute right-3 top-2.5 z-20 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">
        The real test — any computer · ~5 min
      </span>

      {/* screen: browser chrome + the actual athlete flow */}
      <div className="relative z-10 w-[82%] overflow-hidden rounded-t-[10px] border border-b-0 border-slate-300 bg-white shadow-[0_16px_34px_-16px_rgba(51,65,85,.55)]">
        <div className="flex items-center gap-1 border-b border-slate-200 bg-slate-100 px-2 py-[5px]">
          <span className="h-[6px] w-[6px] rounded-full bg-red-300" />
          <span className="h-[6px] w-[6px] rounded-full bg-amber-300" />
          <span className="h-[6px] w-[6px] rounded-full bg-emerald-300" />
          <span className="mx-auto rounded bg-white px-2 py-[2px] font-mono text-[7px] text-slate-400">
            /preseason/b/YOURCODE
          </span>
        </div>
        <Image
          src="/instruments/baseline-flow/1.png"
          alt="Pre-season SCAT6 baseline — athlete self-completing step 1 of 6 on a laptop"
          width={560}
          height={200}
          className="block h-[228px] w-full object-cover object-top"
        />
      </div>
      {/* deck */}
      <div className="relative z-10 h-[10px] w-[94%] rounded-b-[9px] rounded-t-[2px] bg-gradient-to-b from-slate-200 to-slate-300 shadow-[0_6px_14px_-6px_rgba(51,65,85,.4)]">
        <span className="absolute left-1/2 top-0 h-[3px] w-[13%] -translate-x-1/2 rounded-b-[3px] bg-slate-300" />
      </div>
    </div>
  )
}

/** Kept for call-site compatibility — the image-based visuals need no keyframes. */
export function InstrumentKeyframes() {
  return null
}
