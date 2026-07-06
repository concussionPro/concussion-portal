'use client'

import { useEffect, useState } from 'react'

/**
 * Rendered Apple Watch that auto-swipes through the SST Trainer app's real
 * screens (owner 2026-07-06: "show the animation on a rendered apple watch
 * that swipes through pages and shows actual functions"). Screens are JSX,
 * not screenshots, so they animate; data mirrors the shipping app (measured
 * band 114–128, ceiling 142, live HR, +2 symptom stop, measured threshold
 * 142, recovery trajectory). Respects prefers-reduced-motion.
 */

const STAGES = ['Welcome', 'Safety', 'Graded test', 'Train live', 'Progress']
const N = STAGES.length
const HOLD_MS = 2800

const teal = '#14b8a6'
const navy = '#0d1830'

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full w-full flex-col px-3 py-3" style={{ background: navy }}>
      {children}
    </div>
  )
}

function Welcome() {
  return (
    <Screen>
      <p className="m-0 text-[10px] font-semibold text-white/90">Welcome back</p>
      <div
        className="mt-2 flex flex-1 flex-col justify-center rounded-2xl px-3 py-3"
        style={{ background: 'rgba(20,184,166,0.10)' }}
      >
        <p className="m-0 text-[8.5px] uppercase tracking-wider text-white/45">Today&apos;s band</p>
        <p className="m-0 text-[26px] font-extrabold leading-none" style={{ color: teal }}>
          114–128
        </p>
        <p className="m-0 mt-0.5 text-[8px] text-white/45">bpm · 20 min · ceiling 142</p>
      </div>
      <div
        className="mt-2 rounded-full py-1.5 text-center text-[10px] font-bold text-white"
        style={{ background: teal }}
      >
        ▶ Start session
      </div>
    </Screen>
  )
}

function Safety() {
  return (
    <Screen>
      <p className="m-0 text-[10px] font-bold text-white">Safety check</p>
      <p className="m-0 text-[7.5px] text-white/45">Before every session</p>
      <div className="mt-1.5 flex flex-1 flex-col gap-1">
        {['Worsening headache', 'Repeated vomiting', 'Slurred speech'].map((s) => (
          <div key={s} className="rounded-lg px-2 py-1 text-[8.5px] text-white/70" style={{ background: 'rgba(255,255,255,0.06)' }}>
            {s}
          </div>
        ))}
      </div>
      <div
        className="mt-1.5 rounded-full py-1.5 text-center text-[9.5px] font-bold text-white"
        style={{ background: '#2f9e44' }}
      >
        ✓ None of these today
      </div>
    </Screen>
  )
}

function GradedTest() {
  return (
    <Screen>
      <p className="m-0 text-[9px] font-bold text-white">Graded test · min 4</p>
      <div className="mt-1 flex items-center gap-1.5">
        <span className="text-[13px]">❤️</span>
        <span className="text-[22px] font-extrabold leading-none text-white">128</span>
        <span className="mb-0.5 self-end text-[7.5px] text-white/45">bpm live</span>
      </div>
      <p className="m-0 mt-0.5 text-[7px] text-white/40">from their watch</p>
      <div className="mt-1.5 flex-1">
        <p className="m-0 text-[8px] text-white/50">Symptoms this minute</p>
        <div className="mt-1 flex items-center justify-between rounded-lg px-2 py-1.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <span className="text-[13px] font-bold text-white/50">−</span>
          <span className="text-[15px] font-extrabold" style={{ color: '#4d94ff' }}>
            2
          </span>
          <span className="text-[13px] font-bold text-white/50">+</span>
        </div>
      </div>
      <div
        className="mt-1.5 rounded-full py-1.5 text-center text-[9px] font-bold text-white"
        style={{ background: teal }}
      >
        Log minute 4
      </div>
    </Screen>
  )
}

function TrainLive() {
  return (
    <Screen>
      <p className="m-0 text-[9px] font-bold text-white">Training · 11:20</p>
      <div className="flex flex-1 flex-col items-center justify-center">
        <div
          className="flex h-[74px] w-[74px] flex-col items-center justify-center rounded-full"
          style={{ border: `3px solid ${teal}`, background: 'rgba(20,184,166,0.08)' }}
        >
          <span className="text-[22px] font-extrabold leading-none text-white">122</span>
          <span className="text-[7px] text-white/50">bpm</span>
        </div>
        <p className="m-0 mt-1.5 text-[9px] font-bold" style={{ color: teal }}>
          In band ✓
        </p>
        <p className="m-0 text-[7.5px] text-white/40">114–128 · ceiling 142</p>
      </div>
    </Screen>
  )
}

function Progress() {
  const pts = [118, 126, 134, 142, 152, 165]
  const w = 96, h = 34, min = 110, max = 172
  const x = (i: number) => (i / (pts.length - 1)) * w
  const y = (v: number) => h - ((v - min) / (max - min)) * h
  const poly = pts.map((v, i) => `${x(i).toFixed(0)},${y(v).toFixed(0)}`).join(' ')
  return (
    <Screen>
      <p className="m-0 text-[9px] font-bold text-white">Recovery trajectory</p>
      <p className="m-0 text-[7px] text-white/40">Measured threshold, each test</p>
      <div className="mt-2 flex flex-1 flex-col justify-center">
        <svg viewBox={`0 0 ${w} ${h + 6}`} className="w-full">
          <polyline points={poly} fill="none" stroke={teal} strokeWidth="2" />
          {pts.map((v, i) => (
            <circle key={i} cx={x(i)} cy={y(v)} r="2.2" fill={teal} />
          ))}
        </svg>
        <p className="m-0 mt-1 text-center text-[8px] text-white/55">
          118 → <span className="font-bold text-white">165 bpm</span>
        </p>
      </div>
      <div
        className="rounded-full py-1 text-center text-[8.5px] font-bold text-white"
        style={{ background: '#2f9e44' }}
      >
        Clearance-ready
      </div>
    </Screen>
  )
}

const SCREENS = [Welcome, Safety, GradedTest, TrainLive, Progress]

export function SstWatchAnimation() {
  const [i, setI] = useState(0)

  useEffect(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    const t = setInterval(() => setI((p) => (p + 1) % N), HOLD_MS)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Watch */}
      <div className="relative">
        {/* top strap */}
        <div className="mx-auto h-8 w-[92px] rounded-t-[16px] bg-gradient-to-b from-[#2b3a57] to-[#1d2b47]" />
        {/* case */}
        <div className="relative -my-1 rounded-[42px] bg-gradient-to-b from-slate-500 via-slate-700 to-slate-900 p-[5px] shadow-[0_28px_60px_-20px_rgba(0,0,0,.8)]">
          {/* digital crown + side button */}
          <span className="absolute -right-[7px] top-[52px] h-[26px] w-[9px] rounded-[3px] bg-gradient-to-b from-slate-300 via-slate-500 to-slate-600" />
          <span className="absolute -right-[5px] top-[92px] h-[34px] w-[5px] rounded-[2.5px] bg-gradient-to-b from-slate-500 to-slate-700" />
          {/* screen viewport */}
          <div className="relative h-[216px] w-[176px] overflow-hidden rounded-[38px] bg-black">
            {/* DEMO pill — top-right so it never overlaps a screen title */}
            <span className="pointer-events-none absolute right-2 top-2 z-20 rounded-full bg-red-500/90 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wide text-white">
              ● Demo
            </span>
            {/* swiping track */}
            <div
              className="flex h-full transition-transform duration-[650ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
              style={{ width: `${N * 100}%`, transform: `translateX(-${(i * 100) / N}%)` }}
            >
              {SCREENS.map((S, idx) => (
                <div key={idx} style={{ width: `${100 / N}%` }} className="h-full">
                  <S />
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* bottom strap */}
        <div className="mx-auto h-8 w-[92px] rounded-b-[16px] bg-gradient-to-t from-[#2b3a57] to-[#1d2b47]" />
      </div>

      {/* stage dots */}
      <div className="flex items-center gap-1.5">
        {STAGES.map((s, idx) => (
          <button
            key={s}
            type="button"
            aria-label={s}
            onClick={() => setI(idx)}
            className="h-1.5 rounded-full transition-all"
            style={{
              width: idx === i ? 18 : 6,
              background: idx === i ? teal : 'rgba(148,163,184,0.5)',
            }}
          />
        ))}
      </div>
      <p className="m-0 text-[12px] font-semibold" style={{ color: navy }}>
        {STAGES[i]}
        <span className="text-slate-400"> — on the watch they already own</span>
      </p>
    </div>
  )
}
