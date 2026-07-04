'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

/**
 * Self-contained visual showcase of the SST Trainer patient flow — the
 * /sst-trainer landing hero, matching the Loom-style auto-playing walkthrough
 * on /preseason (PreseasonBaselineDemo): crossfading frames, chapter tabs,
 * progress bar, viewport-paused timer, reduced-motion freeze.
 *
 * NOT the real app (that's the rest of /sst-trainer) — no engine, no backend.
 * Frames mirror the REAL screens:
 *   0 Welcome            (clinic code confirmed + goal)
 *   1 Safety check       (red-flag checklist + symptom baseline)
 *   2 Graded test        (live HR, per-minute symptom score)
 *   3 Your band          (measured HRt → 80–90% training band)
 *   4 Train live         (countdown, in-band zone, time-in-band)
 *   5 Progress           (clean sessions step the band up; synced to clinic)
 */

const CHAPTERS = ['Welcome', 'Safety', 'Graded test', 'Your band', 'Train live', 'Progress']
const PER = 3300
const FADE = 480
const N = CHAPTERS.length

// real app accent palette (SstOnboarding / shell)
const ACCENT = '#3c7681'
const ACCENT_SOFT = '#e7f2f3'
const NAVY = '#16243f'
const GREEN = '#3c7a1f'

function fmt(sec: number) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return m + ':' + String(s).padStart(2, '0')
}

const CARD =
  'rounded-[14px] border border-white/70 bg-white/85 px-3.5 py-3 shadow-[0_10px_30px_-18px_rgba(60,118,129,.45)] backdrop-blur'

function PhoneHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-2 text-center">
      <p className="m-0 text-[12.5px] font-extrabold leading-tight" style={{ color: NAVY }}>
        {title}
      </p>
      <p className="m-0 mt-0.5 text-[8.5px] leading-tight text-slate-500">{sub}</p>
    </div>
  )
}

function BandBar({ pos }: { pos: number }) {
  // pos 0-100 marker along under → in-band → over
  return (
    <div className="relative mt-1.5 h-[10px] overflow-hidden rounded-full">
      <div className="absolute inset-0 flex">
        <span className="h-full flex-1" style={{ background: '#dbeafe' }} />
        <span className="h-full flex-[1.4]" style={{ background: '#dcfce7' }} />
        <span className="h-full flex-1" style={{ background: '#ffedd5' }} />
      </div>
      <span
        className="absolute top-1/2 h-[14px] w-[3px] -translate-y-1/2 rounded-full"
        style={{ left: `${pos}%`, background: NAVY }}
      />
    </div>
  )
}

export function SstTrainerDemo() {
  const [t, setT] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)

  const prefersReduced = useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia('(prefers-reduced-motion: reduce)')
      m.addEventListener('change', cb)
      return () => m.removeEventListener('change', cb)
    },
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false,
  )

  useEffect(() => {
    if (prefersReduced) return
    let iv: ReturnType<typeof setInterval> | null = null
    const start = () => {
      if (iv == null) iv = setInterval(() => setT((s) => s + 90), 90)
    }
    const stop = () => {
      if (iv != null) {
        clearInterval(iv)
        iv = null
      }
    }
    const el = rootRef.current
    let io: IntersectionObserver | null = null
    if (el && typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()), {
        threshold: 0.01,
      })
      io.observe(el)
    } else {
      start()
    }
    return () => {
      stop()
      io?.disconnect()
    }
  }, [prefersReduced])

  const total = PER * N
  const tt = (prefersReduced ? 4 * PER + 1500 : t) % total
  const fi = Math.floor(tt / PER)
  const tif = tt % PER
  const prev = (fi - 1 + N) % N

  const op = (i: number) =>
    i === fi ? Math.min(1, tif / FADE) : i === prev ? Math.max(0, 1 - tif / FADE) : 0
  const z = (i: number) => (i === fi ? 3 : i === prev ? 2 : 1)

  const progressPct = ((tt / total) * 100).toFixed(1) + '%'
  const timeLabel = fmt(tt / 1000) + ' / ' + fmt(total / 1000)
  const cursorOp = fi === 0 ? 1 : 0

  // the live HR ticks within the training frame so the number feels alive
  const liveHr = 119 + Math.floor((tt % 900) / 300)

  const frameStyle = (i: number): React.CSSProperties => ({
    position: 'absolute',
    inset: 0,
    opacity: op(i),
    zIndex: z(i),
    pointerEvents: 'none',
    transition: 'opacity .2s linear',
  })

  return (
    <div ref={rootRef} className="w-full max-w-[640px]">
      <style>{`
        @keyframes sst-loomcursor{0%,100%{transform:scale(1);opacity:.9}50%{transform:scale(.82);opacity:1}}
        @keyframes sst-loomring{0%{transform:scale(.7);opacity:.7}100%{transform:scale(2.1);opacity:0}}
        @keyframes sst-recblink{0%,100%{opacity:1}50%{opacity:.25}}
        @keyframes sst-heart{0%,100%{transform:scale(1)}14%{transform:scale(1.18)}28%{transform:scale(1)}}
      `}</style>

      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_40px_80px_-30px_rgba(15,23,42,.4),0_12px_28px_-16px_rgba(15,23,42,.18)]">
        {/* header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-[18px] py-[13px]">
          <div className="flex items-center gap-[9px]">
            <span className="flex items-center gap-1.5 rounded-full bg-red-100 px-[9px] py-1 text-[10px] font-bold leading-none tracking-[0.06em] text-red-600">
              <span
                className="h-[7px] w-[7px] rounded-full bg-red-600"
                style={{ animation: 'sst-recblink 1.4s ease-in-out infinite' }}
              />
              DEMO
            </span>
            <span className="text-[13px] font-semibold leading-none text-slate-700">
              Patient app · walkthrough
            </span>
          </div>
          <span
            className="text-[12px] font-medium leading-none text-slate-400 tabular-nums"
            style={{ fontFamily: 'var(--font-space), monospace' }}
          >
            {timeLabel}
          </span>
        </div>

        {/* stage — phone frame (the trainer is phone-first) */}
        <div
          className="relative flex items-center justify-center p-[22px]"
          style={{ height: 430, background: 'radial-gradient(120% 90% at 50% 0%, #edf5f5, #e2e8f0)' }}
        >
          <div className="relative h-full w-[236px] overflow-hidden rounded-[26px] border-[6px] border-slate-900 bg-white shadow-[0_22px_44px_-20px_rgba(15,23,42,.55)]">
            {/* status bar + notch */}
            <div className="relative z-[6] flex h-[22px] items-center justify-center bg-white">
              <span className="h-[13px] w-[74px] rounded-b-[9px] bg-slate-900" />
            </div>

            <div
              className="relative"
              style={{ height: 'calc(100% - 22px)', background: 'linear-gradient(175deg, rgba(60,118,129,.06) 0%, #f8fafb 42%)' }}
            >
              {/* FRAME 0: WELCOME */}
              <div style={frameStyle(0)} className="flex flex-col px-3 py-2.5">
                <PhoneHeader title="Sub-Symptom Threshold Trainer" sub="Symptom-guided exercise rehab — with your clinician" />
                <div className={CARD}>
                  <p className="m-0 text-[8.5px] font-bold uppercase tracking-[0.06em] text-slate-400">Clinic code</p>
                  <div className="mt-1 flex items-center justify-between rounded-[9px] border-[1.5px] px-2 py-[7px]" style={{ borderColor: ACCENT }}>
                    <span className="text-[12px] font-bold tracking-[0.14em]" style={{ color: NAVY, fontFamily: 'var(--font-space), monospace' }}>
                      NC4X2A
                    </span>
                    <span className="text-[9px] font-bold" style={{ color: GREEN }}>✓ Northcote Sports Med</span>
                  </div>
                </div>
                <div className={CARD + ' mt-2'}>
                  <p className="m-0 mb-1 text-[8.5px] font-bold uppercase tracking-[0.06em] text-slate-400">Working back to</p>
                  <div className="grid grid-cols-3 gap-1">
                    {['Sport', 'Work', 'Study'].map((g) => (
                      <span
                        key={g}
                        className="rounded-[8px] py-[6px] text-center text-[9px] font-semibold"
                        style={g === 'Sport' ? { background: ACCENT, color: '#fff' } : { background: '#fff', color: '#3b4f52', boxShadow: 'inset 0 0 0 1px #d4e0e1' }}
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
                <div
                  className="mt-auto rounded-[10px] py-[9px] text-center text-[10.5px] font-bold text-white"
                  style={{ background: NAVY }}
                >
                  Continue
                </div>
              </div>

              {/* FRAME 1: SAFETY CHECK */}
              <div style={frameStyle(1)} className="flex flex-col px-3 py-2.5">
                <PhoneHeader title="Safety check" sub="Before every test and session" />
                <div className={CARD}>
                  {['Worsening headache', 'Repeated vomiting', 'Slurred speech'].map((f) => (
                    <div key={f} className="flex items-center gap-1.5 py-[3px]">
                      <span className="h-[10px] w-[10px] rounded-full border-[1.5px] border-slate-300" />
                      <span className="text-[9.5px] text-slate-600">{f}</span>
                    </div>
                  ))}
                  <p className="m-0 mt-1 text-[8.5px] font-semibold" style={{ color: GREEN }}>
                    ✓ None of these today
                  </p>
                </div>
                <div className={CARD + ' mt-2 text-center'}>
                  <p className="m-0 text-[8.5px] text-slate-500">How bad are your symptoms right now?</p>
                  <p className="m-0 text-[24px] font-extrabold leading-tight" style={{ color: ACCENT }}>1</p>
                  <p className="m-0 text-[8.5px] font-bold" style={{ color: ACCENT }}>Mild</p>
                </div>
                <div className="mt-auto rounded-[10px] py-[9px] text-center text-[10.5px] font-bold text-white" style={{ background: ACCENT }}>
                  Start the graded test
                </div>
              </div>

              {/* FRAME 2: GRADED TEST */}
              <div style={frameStyle(2)} className="flex flex-col px-3 py-2.5">
                <PhoneHeader title="Graded test · minute 4" sub="One symptom score every minute" />
                <div className={CARD + ' text-center'}>
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-[15px]" style={{ animation: 'sst-heart 1s ease-in-out infinite' }}>❤️</span>
                    <span className="text-[34px] font-extrabold leading-none" style={{ color: NAVY, fontFamily: 'var(--font-space), monospace' }}>
                      128
                    </span>
                    <span className="text-[9px] text-slate-400">bpm live</span>
                  </div>
                  <p className="m-0 mt-1 text-[8.5px] text-slate-500">from your watch — Garmin, Polar, WHOOP or a strap</p>
                </div>
                <div className={CARD + ' mt-2 text-center'}>
                  <p className="m-0 text-[8.5px] text-slate-500">Symptoms this minute</p>
                  <p className="m-0 text-[22px] font-extrabold leading-tight" style={{ color: ACCENT }}>2</p>
                  <p className="m-0 text-[8.5px] font-bold" style={{ color: ACCENT }}>Mild</p>
                </div>
                <div className="mt-auto rounded-[10px] py-[9px] text-center text-[10.5px] font-bold text-white" style={{ background: ACCENT }}>
                  Log minute 4
                </div>
              </div>

              {/* FRAME 3: YOUR BAND */}
              <div style={frameStyle(3)} className="flex flex-col px-3 py-2.5">
                <PhoneHeader title="Your threshold" sub="Where your symptoms actually begin" />
                <div className={CARD + ' text-center'}>
                  <p className="m-0 text-[8.5px] text-slate-500">Measured at minute 6</p>
                  <p className="m-0 text-[32px] font-extrabold leading-none text-red-600" style={{ fontFamily: 'var(--font-space), monospace' }}>
                    142
                  </p>
                  <p className="m-0 text-[8.5px] text-slate-400">bpm — your HRt</p>
                </div>
                <div className={CARD + ' mt-2 text-center'}>
                  <p className="m-0 text-[8.5px] text-slate-500">Train at 80–90% of it</p>
                  <p className="m-0 text-[26px] font-extrabold leading-tight" style={{ color: GREEN, fontFamily: 'var(--font-space), monospace' }}>
                    114–128
                  </p>
                  <p className="m-0 text-[8.5px] text-slate-500">bpm · 20 min · most days</p>
                </div>
                <p className="mt-auto text-center text-[8px] leading-snug text-slate-400">
                  Measured, not estimated from your age — synced to Northcote Sports Med
                </p>
              </div>

              {/* FRAME 4: TRAIN LIVE */}
              <div style={frameStyle(4)} className="flex flex-col px-3 py-2.5">
                <PhoneHeader title="Session · 14:32 left" sub="Stay in the green band" />
                <div className={CARD + ' text-center'}>
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-[15px]" style={{ animation: 'sst-heart .9s ease-in-out infinite' }}>❤️</span>
                    <span className="text-[36px] font-extrabold leading-none" style={{ color: GREEN, fontFamily: 'var(--font-space), monospace' }}>
                      {liveHr}
                    </span>
                  </div>
                  <p className="m-0 mt-0.5 text-[9.5px] font-bold" style={{ color: GREEN }}>In band</p>
                  <BandBar pos={54} />
                  <div className="mt-0.5 flex justify-between text-[7.5px] text-slate-400">
                    <span>under</span>
                    <span>114–128</span>
                    <span>over</span>
                  </div>
                </div>
                <div className={CARD + ' mt-2'}>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-500">Time in band</span>
                    <span className="text-[11px] font-extrabold" style={{ color: NAVY }}>82%</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[9px] text-slate-500">Symptoms</span>
                    <span className="text-[11px] font-extrabold" style={{ color: GREEN }}>steady</span>
                  </div>
                </div>
                <p className="mt-auto text-center text-[8px] leading-snug text-slate-400">
                  Feel worse? A 2-point rise stops the session safely.
                </p>
              </div>

              {/* FRAME 5: PROGRESS */}
              <div style={frameStyle(5)} className="flex flex-col px-3 py-2.5">
                <PhoneHeader title="Ready to progress" sub="Verified sessions move you forward" />
                <div className={CARD}>
                  {['Tue · clean · verified', 'Thu · clean · verified', 'Sat · clean · verified'].map((s) => (
                    <div key={s} className="flex items-center gap-1.5 py-[3px]">
                      <span className="flex h-[12px] w-[12px] items-center justify-center rounded-full text-[8px] text-white" style={{ background: GREEN }}>
                        ✓
                      </span>
                      <span className="text-[9.5px] text-slate-600">{s}</span>
                    </div>
                  ))}
                </div>
                <div className={CARD + ' mt-2 text-center'}>
                  <p className="m-0 text-[8.5px] text-slate-500">New band</p>
                  <p className="m-0 text-[24px] font-extrabold leading-tight" style={{ color: GREEN, fontFamily: 'var(--font-space), monospace' }}>
                    118–133
                  </p>
                  <p className="m-0 text-[8.5px] text-slate-500">stepping up as you recover</p>
                </div>
                <p className="mt-auto text-center text-[8px] leading-snug text-slate-400">
                  Your whole trajectory is on your clinician&rsquo;s dashboard.
                </p>
              </div>
            </div>

            {/* loom cursor (frame 0, over Continue) */}
            <div
              className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2"
              style={{ top: '87%', opacity: cursorOp, transition: 'opacity .4s ease' }}
            >
              <span
                className="absolute h-[34px] w-[34px] rounded-full"
                style={{ left: -3, top: -3, background: 'rgba(60,118,129,.45)', animation: 'sst-loomring 1.3s ease-out infinite' }}
              />
              <span
                className="block h-7 w-7 rounded-full border-[3px] border-white bg-slate-900 shadow-[0_4px_10px_rgba(0,0,0,.3)]"
                style={{ animation: 'sst-loomcursor 1.3s ease-in-out infinite' }}
              />
            </div>
          </div>
        </div>

        {/* control bar */}
        <div className="flex items-center gap-[14px] border-t border-slate-100 bg-white px-[18px] py-[14px]">
          <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full" style={{ background: ACCENT }}>
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
        <div className="flex gap-[6px] bg-white px-[18px] pb-4">
          {CHAPTERS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => setT(i * PER + 520)}
              className="flex flex-1 cursor-pointer flex-col gap-[5px] border-none bg-transparent p-0"
            >
              <span className="h-[3px] rounded-[2px] transition-colors" style={{ background: i <= fi ? ACCENT : '#e2e8f0' }} />
              <span className="text-left text-[8.5px] font-semibold leading-[1.1] transition-colors" style={{ color: i === fi ? '#0f172a' : '#94a3b8' }}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
