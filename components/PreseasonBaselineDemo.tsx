'use client'

import { useEffect, useState } from 'react'

/**
 * Self-contained visual showcase of the athlete baseline flow.
 * NOT the real SCAT6 test (that lives at /preseason/b/[code]) — this is a
 * Loom-style auto-playing walkthrough that crossfades through 5 frames.
 * No backend calls.
 */

const CHAPTERS = ['Start', 'Symptoms', 'Memory', 'Concentration', 'Report sent']
const PER = 3200 // ms per frame
const FADE = 480 // crossfade duration ms
const N = CHAPTERS.length

const ACCENT = '#0d9488'

function fmt(sec: number) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return m + ':' + String(s).padStart(2, '0')
}

function dots(val: number) {
  return Array.from({ length: 7 }, (_, i) => (i <= val ? ACCENT : '#e2e8f0'))
}

const SYMPTOM_ROWS = [
  { label: 'Headache', v: 1 },
  { label: 'Dizziness', v: 0 },
  { label: 'Fatigue / low energy', v: 2 },
  { label: 'Sensitivity to light', v: 0 },
]

const WORDS = ['Apple', 'Carpet', 'Saddle', 'Bubble', 'Anchor', 'Lemon', 'Insect', 'Candle', 'Paper', 'River']
const RECALLED = [0, 1, 2, 4, 6, 8]

const MONTHS = [
  { l: 'Dec', on: true },
  { l: 'Nov', on: true },
  { l: 'Oct', on: true },
  { l: 'Sep', on: false },
  { l: 'Aug', on: false },
  { l: 'Jul', on: false },
]

export function PreseasonBaselineDemo() {
  const [t, setT] = useState(0)

  useEffect(() => {
    const iv = setInterval(() => setT((s) => s + 90), 90)
    return () => clearInterval(iv)
  }, [])

  const total = PER * N
  const tt = t % total
  const fi = Math.floor(tt / PER)
  const tif = tt % PER
  const prev = (fi - 1 + N) % N

  const op = (i: number) =>
    i === fi ? Math.min(1, tif / FADE) : i === prev ? Math.max(0, 1 - tif / FADE) : 0
  const z = (i: number) => (i === fi ? 3 : i === prev ? 2 : 1)

  const progressPct = ((tt / total) * 100).toFixed(1) + '%'
  const timeLabel = fmt(tt / 1000) + ' / ' + fmt(total / 1000)
  const cursorOp = fi === 0 ? 1 : 0

  const frameStyle = (i: number): React.CSSProperties => ({
    position: 'absolute',
    inset: 0,
    opacity: op(i),
    zIndex: z(i),
    pointerEvents: 'none',
    transition: 'opacity .2s linear',
  })

  return (
    <div className="w-full max-w-[640px]">
      <style>{`
        @keyframes pb-loomcursor{0%,100%{transform:scale(1);opacity:.9}50%{transform:scale(.82);opacity:1}}
        @keyframes pb-loomring{0%{transform:scale(.7);opacity:.7}100%{transform:scale(2.1);opacity:0}}
        @keyframes pb-recblink{0%,100%{opacity:1}50%{opacity:.25}}
      `}</style>

      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_40px_80px_-30px_rgba(15,23,42,.4),0_12px_28px_-16px_rgba(15,23,42,.18)]">
        {/* header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-[18px] py-[13px]">
          <div className="flex items-center gap-[9px]">
            <span className="flex items-center gap-1.5 rounded-full bg-red-100 px-[9px] py-1 text-[10px] font-bold leading-none tracking-[0.06em] text-red-600">
              <span
                className="h-[7px] w-[7px] rounded-full bg-red-600"
                style={{ animation: 'pb-recblink 1.4s ease-in-out infinite' }}
              />
              DEMO
            </span>
            <span className="text-[13px] font-semibold leading-none text-slate-700">
              Athlete baseline · walkthrough
            </span>
          </div>
          <span
            className="text-[12px] font-medium leading-none text-slate-400 tabular-nums"
            style={{ fontFamily: 'var(--font-space), monospace' }}
          >
            {timeLabel}
          </span>
        </div>

        {/* stage */}
        <div
          className="relative flex items-center justify-center p-[22px]"
          style={{ height: 398, background: 'radial-gradient(120% 90% at 50% 0%, #f0fdfa, #e2e8f0)' }}
        >
          {/* desktop browser window */}
          <div className="relative h-full w-full overflow-hidden rounded-xl border border-slate-300 bg-white shadow-[0_22px_44px_-20px_rgba(15,23,42,.5)]">
            {/* browser chrome */}
            <div className="flex h-9 items-center gap-3 border-b border-[#d3dbe3] bg-slate-200 px-[13px]">
              <span className="flex flex-none gap-1.5">
                <span className="h-[11px] w-[11px] rounded-full bg-red-400" />
                <span className="h-[11px] w-[11px] rounded-full bg-amber-400" />
                <span className="h-[11px] w-[11px] rounded-full bg-emerald-400" />
              </span>
              <span
                className="mx-auto flex max-w-[380px] flex-1 items-center justify-center gap-[7px] rounded-lg bg-white px-3 py-1.5 text-[10.5px] font-medium leading-none text-slate-500"
                style={{ fontFamily: 'var(--font-space), monospace' }}
              >
                <span className="inline-block h-2.5 w-2 rounded-[2px] border-[1.5px] border-slate-400" />
                portal.concussion-education-australia.com/preseason
              </span>
              <span className="w-[34px] flex-none" />
            </div>

            {/* web app */}
            <div className="relative bg-slate-50" style={{ height: 'calc(100% - 36px)' }}>
              {/* app top bar */}
              <div className="absolute left-0 right-0 top-0 z-[6] flex items-center justify-between border-b border-[#eef2f6] bg-white px-6 py-[11px]">
                <div className="flex items-center gap-[9px]">
                  <span
                    className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-[7px] text-[11px] font-extrabold leading-none text-white"
                    style={{ background: ACCENT }}
                  >
                    CE
                  </span>
                  <span className="text-[12px] font-bold leading-tight text-teal-700">
                    Pre-season baseline · SCAT6
                  </span>
                </div>
                <span className="text-[11px] font-semibold leading-none text-slate-500">
                  Maya Thompson · Northcote U16
                </span>
              </div>

              {/* content region (frames) */}
              <div className="absolute bottom-0 left-0 right-0" style={{ top: 49 }}>
                {/* FRAME 0: START */}
                <div
                  style={frameStyle(0)}
                  className="flex flex-col items-center justify-center gap-3 px-10 py-[18px] text-center"
                >
                  <span className="text-[11px] font-bold uppercase leading-none tracking-[0.06em] text-teal-700">
                    Pre-season baseline
                  </span>
                  <h2 className="m-0 max-w-[390px] text-[27px] font-extrabold leading-[1.1] tracking-[-0.025em]">
                    Let&apos;s set your baseline, Maya.
                  </h2>
                  <p className="m-0 max-w-[390px] text-[13.5px] leading-[1.5] text-slate-500">
                    Takes about 5 minutes. Answer honestly — this is your healthy &quot;normal&quot;.
                  </p>
                  <div className="mt-1 flex w-full max-w-[430px] gap-[11px]">
                    {[
                      { k: 'Athlete', v: 'Maya Thompson' },
                      { k: 'Club', v: 'Northcote U16' },
                    ].map((c) => (
                      <div
                        key={c.k}
                        className="flex-1 rounded-xl border-[1.5px] border-slate-200 bg-white px-[13px] py-[11px] text-left"
                      >
                        <span className="text-[9px] font-medium uppercase leading-none tracking-[0.06em] text-slate-400">
                          {c.k}
                        </span>
                        <div className="mt-[3px] text-[14px] font-semibold leading-tight">{c.v}</div>
                      </div>
                    ))}
                  </div>
                  <div
                    className="mt-[5px] rounded-[13px] px-11 py-[14px] text-[14px] font-bold leading-none text-white"
                    style={{ background: ACCENT, boxShadow: '0 12px 24px -10px rgba(13,148,136,.8)' }}
                  >
                    Begin baseline
                  </div>
                </div>

                {/* FRAME 1: SYMPTOMS */}
                <div style={frameStyle(1)} className="flex flex-col gap-2.5 px-10 py-5">
                  <div className="flex items-baseline justify-between">
                    <h2 className="m-0 text-[20px] font-extrabold leading-[1.1] tracking-[-0.02em]">
                      Rate each symptom, 0–6
                    </h2>
                    <span className="text-[11px] font-bold leading-none text-teal-700">STEP 1 OF 6</span>
                  </div>
                  <p className="m-0 text-[12px] leading-[1.4] text-slate-500">
                    How you feel right now, at your healthy baseline.
                  </p>
                  <div className="mt-0.5 grid grid-cols-2 gap-[9px]">
                    {SYMPTOM_ROWS.map((r) => (
                      <div
                        key={r.label}
                        className="flex items-center justify-between rounded-[11px] border border-[#eef2f6] bg-white px-[14px] py-[11px]"
                      >
                        <span className="text-[13px] font-semibold leading-none">{r.label}</span>
                        <div className="flex gap-[5px]">
                          {dots(r.v).map((bg, i) => (
                            <span key={i} className="h-3.5 w-3.5 rounded-full" style={{ background: bg }} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-auto flex items-center gap-[13px]">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-[3px] bg-slate-200">
                      <div className="h-full w-[17%] rounded-[3px]" style={{ background: ACCENT }} />
                    </div>
                    <span
                      className="rounded-[9px] px-5 py-[9px] text-[12px] font-bold leading-none text-white"
                      style={{ background: ACCENT }}
                    >
                      Continue
                    </span>
                  </div>
                </div>

                {/* FRAME 2: IMMEDIATE MEMORY */}
                <div style={frameStyle(2)} className="flex flex-col gap-2.5 px-10 py-5">
                  <div className="flex items-baseline justify-between">
                    <h2 className="m-0 text-[20px] font-extrabold leading-[1.1] tracking-[-0.02em]">
                      Remember these 10 words
                    </h2>
                    <span className="text-[11px] font-bold leading-none text-teal-700">STEP 3 OF 6</span>
                  </div>
                  <p className="m-0 text-[12px] leading-[1.4] text-slate-500">
                    Read them, then select the ones you recall.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2.5">
                    {WORDS.map((w, i) => {
                      const on = RECALLED.includes(i)
                      return (
                        <span
                          key={w}
                          className="rounded-[11px] border-[1.5px] px-[17px] py-[11px] text-[14px] font-semibold leading-none"
                          style={{
                            borderColor: on ? ACCENT : '#e2e8f0',
                            background: on ? ACCENT : '#fff',
                            color: on ? '#fff' : '#475569',
                          }}
                        >
                          {w}
                        </span>
                      )
                    })}
                  </div>
                  <div className="mt-auto flex items-center gap-[13px]">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-[3px] bg-slate-200">
                      <div className="h-full w-1/2 rounded-[3px]" style={{ background: ACCENT }} />
                    </div>
                    <span className="text-[11px] font-semibold leading-none text-slate-400">6 / 10 recalled</span>
                  </div>
                </div>

                {/* FRAME 3: CONCENTRATION */}
                <div style={frameStyle(3)} className="flex flex-col gap-2.5 px-10 py-5">
                  <div className="flex items-baseline justify-between">
                    <h2 className="m-0 text-[20px] font-extrabold leading-[1.1] tracking-[-0.02em]">
                      Months in reverse
                    </h2>
                    <span className="text-[11px] font-bold leading-none text-teal-700">STEP 4 OF 6</span>
                  </div>
                  <p className="m-0 text-[12px] leading-[1.4] text-slate-500">
                    Select the months from December back to January.
                  </p>
                  <div className="mt-0.5 flex items-center gap-[9px] rounded-[11px] bg-slate-900 px-4 py-[13px]">
                    <span
                      className="text-[15px] font-bold leading-none tracking-[0.05em] text-white"
                      style={{ fontFamily: 'var(--font-space), sans-serif' }}
                    >
                      Dec · Nov · Oct · Sep
                    </span>
                    <span className="ml-auto h-[19px] w-[9px] rounded-[2px]" style={{ background: ACCENT }} />
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {MONTHS.map((m) => (
                      <span
                        key={m.l}
                        className="rounded-[10px] border-[1.5px] py-[13px] text-center text-[13px] font-semibold leading-none"
                        style={{
                          borderColor: m.on ? ACCENT : '#e2e8f0',
                          background: m.on ? '#ccfbf1' : '#fff',
                          color: m.on ? '#0f766e' : '#475569',
                        }}
                      >
                        {m.l}
                      </span>
                    ))}
                  </div>
                  <div className="mt-auto h-1.5 overflow-hidden rounded-[3px] bg-slate-200">
                    <div className="h-full w-[67%] rounded-[3px]" style={{ background: ACCENT }} />
                  </div>
                </div>

                {/* FRAME 4: REPORT SENT */}
                <div
                  style={frameStyle(4)}
                  className="flex flex-col items-center justify-center gap-3 px-10 py-5 text-center"
                >
                  <span
                    className="inline-flex h-[68px] w-[68px] items-center justify-center rounded-full text-[34px] font-bold leading-none"
                    style={{ background: '#ccfbf1', color: ACCENT }}
                  >
                    ✓
                  </span>
                  <h2 className="mb-0 mt-0.5 text-[25px] font-extrabold leading-[1.1] tracking-[-0.02em]">
                    Baseline complete
                  </h2>
                  <p className="m-0 text-[13px] leading-[1.5] text-slate-500">
                    Nice work, Maya. Your SCAT6 baseline is set.
                  </p>
                  <div className="mt-0.5 flex items-center gap-3 rounded-[14px] border-[1.5px] border-slate-200 bg-white px-[18px] py-[13px] text-left">
                    <span className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-[9px] bg-red-100 text-[11px] font-extrabold leading-none text-red-600">
                      PDF
                    </span>
                    <div>
                      <div className="text-[13.5px] font-bold leading-tight">Report emailed to your clinic</div>
                      <div className="mt-0.5 text-[11.5px] leading-tight text-slate-400">
                        Northcote Sports Med · stored for re-test
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* loom cursor (visible on frame 0, over Begin) */}
              <div
                className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2"
                style={{ top: '80%', opacity: cursorOp, transition: 'opacity .4s ease' }}
              >
                <span
                  className="absolute h-[34px] w-[34px] rounded-full"
                  style={{
                    left: -3,
                    top: -3,
                    background: 'rgba(13,148,136,.45)',
                    animation: 'pb-loomring 1.3s ease-out infinite',
                  }}
                />
                <span
                  className="block h-7 w-7 rounded-full border-[3px] border-white bg-slate-900 shadow-[0_4px_10px_rgba(0,0,0,.3)]"
                  style={{ animation: 'pb-loomcursor 1.3s ease-in-out infinite' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* control bar */}
        <div className="flex items-center gap-[14px] border-t border-slate-100 bg-white px-[18px] py-[14px]">
          <span
            className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full"
            style={{ background: ACCENT }}
          >
            <span className="ml-0.5 block h-0 w-0 border-y-[6px] border-l-[10px] border-y-transparent border-l-white" />
          </span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-[3px] bg-slate-200">
            <div className="h-full rounded-[3px]" style={{ width: progressPct, background: ACCENT }} />
          </div>
          <span
            className="whitespace-nowrap text-[11px] font-medium leading-none text-slate-400 tabular-nums"
            style={{ fontFamily: 'var(--font-space), monospace' }}
          >
            {timeLabel}
          </span>
        </div>

        {/* chapter tabs */}
        <div className="flex gap-[7px] bg-white px-[18px] pb-4">
          {CHAPTERS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => setT(i * PER + 520)}
              className="flex flex-1 cursor-pointer flex-col gap-[5px] border-none bg-transparent p-0"
            >
              <span
                className="h-[3px] rounded-[2px] transition-colors"
                style={{ background: i <= fi ? ACCENT : '#e2e8f0' }}
              />
              <span
                className="text-left text-[9px] font-semibold leading-[1.1] transition-colors"
                style={{ color: i === fi ? '#0f172a' : '#94a3b8' }}
              >
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
