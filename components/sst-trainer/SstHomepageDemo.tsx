'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

/**
 * Loom-style auto-playing product tour for the SST Trainer homepage.
 *
 * Ported from the design-tool DCLogic export (SST Homepage.dc.html). Converts
 * the 90ms setInterval `state.t` ticker into React (useState + useEffect),
 * pausing on prefers-reduced-motion and when scrolled off-screen — mirroring
 * components/PreseasonBaselineDemo.tsx.
 *
 * Five crossfading chapters render on a smartwatch stage:
 *   0 Your daily home   1 Find your threshold   2 Your training band
 *   3 Live, in-band     4 Progress
 */

const CHAPTERS = ['Your daily home', 'Find your threshold', 'Your training band', 'Live, in-band', 'Progress']
const PER = 3200 // ms per chapter
const FADE = 480 // crossfade duration ms
const N = CHAPTERS.length

// ── geometry helpers (ported verbatim from the DCLogic builders) ─────────────
function pt(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180
  return [cx + r * Math.sin(a), cy - r * Math.cos(a)]
}
function arc(cx: number, cy: number, r: number, d0: number, d1: number): string {
  const p0 = pt(cx, cy, r, d0)
  const p1 = pt(cx, cy, r, d1)
  const large = Math.abs(d1 - d0) > 180 ? 1 : 0
  return `M ${p0[0]} ${p0[1]} A ${r} ${r} 0 ${large} 1 ${p1[0]} ${p1[1]}`
}

// progress ring (Find your threshold) — frac fixed at 0.72 in the design
function RingEl({ frac }: { frac: number }) {
  const cx = 120,
    cy = 120,
    R = 94
  return (
    <svg viewBox="0 0 240 240" width="100%" height="100%" style={{ display: 'block' }}>
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#dde7e7" strokeWidth={11} />
      <path
        d={arc(cx, cy, R, 0, Math.min(359.9, frac * 360))}
        fill="none"
        stroke="#5b9aa6"
        strokeWidth={11}
        strokeLinecap="round"
      />
    </svg>
  )
}

// HR gauge with training band + red ceiling tick + needle (Live, in-band)
function GaugeEl() {
  const cx = 118,
    cy = 118,
    R = 90
  const lo = 124,
    up = 140,
    hr = 131,
    min = lo - 30,
    max = up + 30
  const A = (v: number) => {
    const c = Math.max(min, Math.min(max, v))
    return -135 + ((c - min) / (max - min)) * 270
  }
  const seg = (a: number, b: number, col: string, w: number, key: string) => (
    <path key={key} d={arc(cx, cy, R, a, b)} fill="none" stroke={col} strokeWidth={w} strokeLinecap="round" />
  )
  const na = A(hr),
    np = pt(cx, cy, R, na),
    ni = pt(cx, cy, R - 22, na)
  const ma = A(up),
    m1 = pt(cx, cy, R + 5, ma),
    m2 = pt(cx, cy, R + 14, ma)
  return (
    <svg viewBox="0 0 236 222" width="100%" height="100%" style={{ display: 'block' }}>
      {seg(-135, 135, '#dde7e7', 11, 'tr')}
      {seg(A(lo), A(up), '#5b9aa6', 13, 'bd')}
      <line x1={m1[0]} y1={m1[1]} x2={m2[0]} y2={m2[1]} stroke="#d2463a" strokeWidth={2.5} strokeLinecap="round" />
      <line x1={ni[0]} y1={ni[1]} x2={np[0]} y2={np[1]} stroke="#5b9aa6" strokeWidth={3} strokeLinecap="round" />
      <circle cx={np[0]} cy={np[1]} r={8} fill="#fff" stroke="#5b9aa6" strokeWidth={4} />
    </svg>
  )
}

// peak-HR vs ceiling trend chart (Progress)
function TrendEl() {
  const W = 232,
    H = 70,
    padT = 8,
    padB = 10
  const peaks = [128, 134, 137, 139],
    lo = 124,
    up = 140
  const minV = lo - 8,
    maxV = up + 8
  const X = (i: number) => 6 + (i * (W - 12)) / (peaks.length - 1)
  const Y = (v: number) => padT + (1 - (v - minV) / (maxV - minV)) * (H - padT - padB)
  const yc = Y(up)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
      <rect x={0} y={yc} width={W} height={Math.max(0, Y(lo) - yc)} fill="#5b9aa6" opacity={0.09} />
      <line x1={0} y1={yc} x2={W} y2={yc} stroke="#d2463a" strokeWidth={1.5} strokeDasharray="4 4" opacity={0.7} />
      <path
        d={peaks.map((v, i) => `${i ? 'L' : 'M'} ${X(i)} ${Y(v)}`).join(' ')}
        fill="none"
        stroke="#5b9aa6"
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {peaks.map((v, i) => (
        <circle key={i} cx={X(i)} cy={Y(v)} r={4} fill="#5b9aa6" stroke="#fff" strokeWidth={2} />
      ))}
    </svg>
  )
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return m + ':' + String(s).padStart(2, '0')
}

export function SstHomepageDemo() {
  const [t, setT] = useState(0)
  // The play/pause control is REAL (2026-07-27 — Zac: "play button does
  // nothing"; it was a decorative span). `paused` is the user's pause;
  // `userPlay` is an explicit play that overrides prefers-reduced-motion —
  // an explicit click is stronger user intent than the OS preference.
  const [paused, setPaused] = useState(false)
  const [userPlay, setUserPlay] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // Reduced-motion preference, read without an effect (no hydration mismatch).
  const prefersReduced = useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia('(prefers-reduced-motion: reduce)')
      m.addEventListener('change', cb)
      return () => m.removeEventListener('change', cb)
    },
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false,
  )

  const playing = !paused && (!prefersReduced || userPlay)

  useEffect(() => {
    if (!playing) return

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
      io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()), { threshold: 0.01 })
      io.observe(el)
    } else {
      start()
    }

    return () => {
      stop()
      io?.disconnect()
    }
  }, [playing])

  const total = PER * N
  // Reduced-motion (and no explicit play): freeze on the "Live, in-band" frame
  // (most representative).
  const tt = (prefersReduced && !userPlay ? 3 * PER + 1500 : t) % total
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
    padding: '6px 18px 14px',
    display: 'flex',
    flexDirection: 'column',
    opacity: op(i),
    zIndex: z(i),
    pointerEvents: 'none',
    transition: 'opacity .2s linear',
  })

  const SPACE = 'var(--font-space), "Space Grotesk", monospace'

  return (
    <div
      ref={rootRef}
      className="relative min-w-0 flex-1 basis-[420px] overflow-hidden rounded-3xl border border-[#e2ecec] bg-white"
      style={{
        boxShadow:
          '0 40px 80px -30px rgba(22,40,43,.35),0 12px 28px -16px rgba(22,40,43,.18)',
      }}
    >
      <style>{`
        @keyframes ssth-loomcursor{0%,100%{transform:scale(1);opacity:.9}50%{transform:scale(.82);opacity:1}}
        @keyframes ssth-loomring{0%{transform:scale(.7);opacity:.7}100%{transform:scale(2.1);opacity:0}}
        @keyframes ssth-recblink{0%,100%{opacity:1}50%{opacity:.25}}
      `}</style>

      {/* player top bar */}
      <div className="flex items-center justify-between border-b border-[#eef4f4] px-[18px] py-[13px]">
        <div className="flex items-center gap-[9px]">
          <span className="flex items-center gap-1.5 rounded-full bg-[#fbeae8] px-[9px] py-1 text-[10px] font-bold leading-none tracking-[0.06em] text-[#d2463a]">
            <span
              className="h-[7px] w-[7px] rounded-full bg-[#d2463a]"
              style={{ animation: 'ssth-recblink 1.4s ease-in-out infinite' }}
            />
            DEMO
          </span>
          <span className="text-[13px] font-semibold leading-none text-[#3b4f52]">SST Trainer · product tour</span>
        </div>
        <span className="text-[12px] leading-none text-[#5d7174] tabular-nums" style={{ fontFamily: SPACE }}>
          {timeLabel}
        </span>
      </div>

      {/* stage */}
      <div
        className="relative flex items-center justify-center"
        style={{ height: 486, background: 'radial-gradient(120% 90% at 50% 0%, #e7f2f3, #dbe7e7)' }}
      >
        {/* watch */}
        <div className="relative" style={{ width: 280, height: 340 }}>
          {/* crown + button */}
          <div
            className="absolute"
            style={{ right: -5, top: 120, width: 8, height: 40, borderRadius: 5, background: 'linear-gradient(180deg,#5a6669,#2b3133)' }}
          />
          <div
            className="absolute"
            style={{ right: -4, top: 172, width: 6, height: 52, borderRadius: 4, background: 'linear-gradient(180deg,#4a5557,#252b2d)' }}
          />
          {/* case */}
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 64,
              padding: 11,
              background: 'linear-gradient(148deg,#454f51,#1d2325 55%,#333b3d)',
              boxShadow: '0 22px 44px -18px rgba(20,40,42,.6),inset 0 2px 3px rgba(255,255,255,.18)',
            }}
          >
            {/* screen */}
            <div
              className="relative overflow-hidden"
              style={{ width: '100%', height: '100%', borderRadius: 54, background: '#f4f8f8' }}
            >
              {/* shared status bar */}
              <div className="absolute left-0 right-0 top-0 z-[5] flex items-center justify-between px-5 pb-1.5 pt-[9px]">
                <span className="flex items-center gap-[5px] text-[9px] font-bold leading-none tracking-[0.12em] text-[#5b9aa6]">
                  <span className="inline-block h-[7px] w-[7px] rounded-full border-[1.5px] border-[#5b9aa6]" />
                  SST
                </span>
                <span className="text-[11px] leading-none text-[#16282b]" style={{ fontFamily: SPACE }}>
                  7:32
                </span>
                <span
                  className="relative inline-block"
                  style={{ width: 16, height: 8, border: '1.5px solid #97a7a9', borderRadius: 2 }}
                >
                  <span className="absolute" style={{ inset: 1, right: 4, background: '#5b9aa6', borderRadius: 1 }} />
                </span>
              </div>

              {/* content region */}
              <div className="absolute bottom-0 left-0 right-0" style={{ top: 30 }}>
                {/* FRAME 0: HOME */}
                <div style={{ ...frameStyle(0), gap: 11 }}>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-bold uppercase leading-none tracking-[0.08em] text-[#5b9aa6]">
                      Concussion · Clinic program
                    </span>
                    <span className="text-[22px] font-extrabold leading-[1.05] tracking-[-0.02em]">Good morning</span>
                  </div>
                  <div
                    style={{
                      border: '2px solid #5b9aa6',
                      background: 'linear-gradient(180deg,#eef6f6,#e3f0f1)',
                      borderRadius: 16,
                      padding: '12px 13px',
                    }}
                  >
                    <span className="text-[9px] font-bold uppercase leading-none tracking-[0.06em] text-[#3c7681]">
                      Today&apos;s band
                    </span>
                    <div className="my-[4px] mb-[9px] flex items-baseline gap-[5px]">
                      <span className="text-[30px] leading-none text-[#16282b] font-semibold" style={{ fontFamily: SPACE }}>
                        124–140
                      </span>
                      <span className="text-[11px] font-semibold leading-none text-[#5d7174]">bpm</span>
                    </div>
                    <div className="relative" style={{ height: 9, background: '#d4e3e3', borderRadius: 5 }}>
                      <div className="absolute" style={{ left: '40%', width: '27%', top: 0, bottom: 0, background: '#5b9aa6', borderRadius: 5 }} />
                      <div className="absolute" style={{ left: '91%', top: -3, bottom: -3, width: 2, background: '#16282b' }} />
                    </div>
                  </div>
                  <div
                    className="text-center text-[14px] font-bold leading-none text-white"
                    style={{ borderRadius: 16, padding: 15, background: '#5b9aa6', boxShadow: '0 10px 22px -10px rgba(91,154,166,.9)' }}
                  >
                    Start today&apos;s session
                  </div>
                  <div
                    className="flex items-center justify-between bg-white"
                    style={{ border: '1px solid #dde7e7', borderRadius: 13, padding: '10px 13px' }}
                  >
                    <span className="text-[11px] font-bold leading-none">This week</span>
                    <div className="flex gap-[4px]">
                      <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#5b9aa6' }} />
                      <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#5b9aa6' }} />
                      <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#5b9aa6' }} />
                      <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#5b9aa6' }} />
                      <span style={{ width: 11, height: 11, borderRadius: '50%', border: '1.5px solid #cdd9da' }} />
                      <span style={{ width: 11, height: 11, borderRadius: '50%', border: '1.5px solid #cdd9da' }} />
                    </div>
                  </div>
                </div>

                {/* FRAME 1: TEST */}
                <div style={{ ...frameStyle(1), gap: 12 }}>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-none" style={{ width: 96, height: 96 }}>
                      <RingEl frac={0.72} />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-[8px] font-bold leading-none tracking-[0.12em] text-[#5d7174]">MIN</span>
                        <span className="text-[34px] text-[#16282b] font-semibold" style={{ lineHeight: 0.9, fontFamily: SPACE }}>
                          7
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-semibold uppercase leading-none tracking-[0.05em] text-[#5d7174]">
                        Live heart rate
                      </span>
                      <span className="flex items-baseline gap-[4px]">
                        {/* This IS the threshold minute: symptoms 4 against a rested
                            1/10 is the +3-point PROVOCATION_RISE, and the button below
                            says so. The next frame reports the HRt as 155 bpm at
                            minute 7 and derives the 124–140 band (80–90%) from it, so
                            the live number here has to be that same 155 — it read 139,
                            which contradicted the result screen one frame later. */}
                        <span className="text-[40px] text-[#5b9aa6] font-semibold" style={{ lineHeight: 0.9, fontFamily: SPACE }}>
                          155
                        </span>
                        <span className="text-[10px] font-semibold leading-none text-[#5d7174]">BPM</span>
                      </span>
                      <span className="text-[10px] leading-[1.3] text-[#5d7174]">rested 1/10 · from watch</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold leading-none text-[#3b4f52]">Any of your symptoms now?</span>
                  <div className="flex flex-wrap gap-[6px]">
                    <span className="rounded-full bg-[#5b9aa6] px-3 py-[7px] text-[11px] font-semibold leading-none text-white">
                      Headache
                    </span>
                    <span className="rounded-full px-3 py-[7px] text-[11px] font-semibold leading-none text-[#5d7174]" style={{ border: '1.5px solid #d4e0e1' }}>
                      Dizziness
                    </span>
                    <span className="rounded-full px-3 py-[7px] text-[11px] font-semibold leading-none text-[#5d7174]" style={{ border: '1.5px solid #d4e0e1' }}>
                      Light
                    </span>
                  </div>
                  <div className="flex items-center gap-[9px]">
                    <span className="text-[11px] font-semibold leading-none text-[#3b4f52]">Symptoms</span>
                    <div className="flex flex-1 items-center gap-[3px]">
                      {[true, true, true, true, false, false, false, false].map((on, i) => (
                        <span key={i} className="flex-1" style={{ height: 16, borderRadius: 3, background: on ? '#5b9aa6' : '#d8e4e4' }} />
                      ))}
                    </div>
                    <span className="text-[13px] text-[#3c7681] font-semibold leading-none" style={{ fontFamily: SPACE }}>
                      4
                    </span>
                  </div>
                  <div className="text-center text-[12px] font-bold leading-none text-white" style={{ borderRadius: 13, padding: 13, background: '#3c7681' }}>
                    Log — this reaches your threshold
                  </div>
                </div>

                {/* FRAME 2: RESULT BAND */}
                <div style={{ ...frameStyle(2), gap: 11 }}>
                  <span className="text-[18px] font-extrabold leading-[1.05] tracking-[-0.02em]">Your result</span>
                  <div className="flex items-center justify-between bg-[#eef4f4]" style={{ borderRadius: 14, padding: '11px 14px' }}>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-semibold uppercase leading-[1.2] tracking-[0.06em] text-[#5d7174]">
                        Heart-rate threshold
                      </span>
                      <span className="text-[9px] leading-[1.2] text-[#5d7174]">reached at minute 7</span>
                    </div>
                    <span className="flex items-baseline gap-[3px]">
                      <span className="text-[26px] leading-none font-semibold" style={{ fontFamily: SPACE }}>
                        155
                      </span>
                      <span className="text-[10px] font-semibold leading-none text-[#5d7174]">BPM</span>
                    </span>
                  </div>
                  <div style={{ border: '2px solid #5b9aa6', background: 'linear-gradient(180deg,#eef6f6,#e3f0f1)', borderRadius: 18, padding: 14 }}>
                    <span className="text-[9px] font-bold uppercase leading-none tracking-[0.06em] text-[#3c7681]">
                      Your training band
                    </span>
                    <div className="my-[4px] mb-[11px] flex items-baseline gap-[5px]">
                      <span className="text-[32px] leading-none font-semibold" style={{ fontFamily: SPACE }}>
                        124–140
                      </span>
                      <span className="text-[11px] font-semibold leading-none text-[#5d7174]">bpm</span>
                    </div>
                    <div className="relative" style={{ height: 10, background: '#d4e3e3', borderRadius: 5 }}>
                      <div className="absolute" style={{ left: '40%', width: '27%', top: 0, bottom: 0, background: '#5b9aa6', borderRadius: 5 }} />
                      <div className="absolute" style={{ left: '91%', top: -4, bottom: -4, width: 2, background: '#16282b' }} />
                    </div>
                    <p className="mt-[11px] flex items-center gap-[6px] text-[11px] font-semibold leading-[1.2] text-[#b1392e]">
                      <span
                        className="inline-flex items-center justify-center text-[#d2463a]"
                        style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid #d2463a', fontSize: 9 }}
                      >
                        !
                      </span>
                      Do not exceed 140 bpm.
                    </p>
                  </div>
                </div>

                {/* FRAME 3: LIVE SESSION */}
                <div style={{ ...frameStyle(3), gap: 8, alignItems: 'center' }}>
                  <div
                    className="flex items-center justify-center gap-[6px] self-stretch bg-[#eef4f4] text-[10px] font-semibold leading-none text-[#3c7681]"
                    style={{ borderRadius: 999, padding: '6px 11px' }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#5b9aa6' }} />
                    Target 124–140 bpm · 20 min
                  </div>
                  <div className="relative" style={{ width: 200, height: 190, marginTop: 2 }}>
                    <GaugeEl />
                    <div className="absolute left-0 right-0 flex flex-col items-center" style={{ top: '48%', transform: 'translateY(-50%)' }}>
                      <span className="text-[52px] text-[#5b9aa6] font-semibold" style={{ lineHeight: 0.9, fontFamily: SPACE }}>
                        131
                      </span>
                      <span className="text-[10px] font-semibold leading-none tracking-[0.14em] text-[#5d7174]" style={{ marginTop: -1 }}>
                        BPM
                      </span>
                      <span className="mt-[6px] rounded-full bg-[#e7f2f3] px-3 py-[5px] text-[10px] font-bold leading-none text-[#3c7681]">
                        ● In your band
                      </span>
                    </div>
                  </div>
                </div>

                {/* FRAME 4: PROGRESS */}
                <div style={{ ...frameStyle(4), gap: 10 }}>
                  <span className="text-[17px] font-extrabold leading-[1.05] tracking-[-0.02em]">Your progress</span>
                  <div style={{ border: '2px solid #5b9aa6', background: '#e7f2f3', borderRadius: 14, padding: '11px 13px' }}>
                    <span className="text-[13px] font-extrabold leading-none text-[#3c7681]">↑ Advance</span>
                    <p className="mt-[5px] text-[10.5px] leading-[1.4] text-[#3b4f52]">
                      3 clean sessions — step your ceiling up 5 bpm.
                    </p>
                  </div>
                  <div className="bg-white" style={{ border: '1px solid #dde7e7', borderRadius: 14, padding: 11 }}>
                    <span className="text-[10px] font-bold leading-none text-[#3b4f52]">Peak HR vs ceiling</span>
                    <div className="mt-[6px]">
                      <TrendEl />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* loom cursor (frame 0) */}
          <div
            className="pointer-events-none absolute left-1/2"
            style={{ top: 268, transform: 'translateX(-50%)', opacity: cursorOp, transition: 'opacity .4s ease' }}
          >
            <span
              className="absolute"
              style={{ left: -3, top: -3, width: 34, height: 34, borderRadius: '50%', background: 'rgba(91,154,166,.45)', animation: 'ssth-loomring 1.3s ease-out infinite' }}
            />
            <span
              className="block"
              style={{ width: 28, height: 28, borderRadius: '50%', background: '#16282b', border: '3px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,.3)', animation: 'ssth-loomcursor 1.3s ease-in-out infinite' }}
            />
          </div>
        </div>
      </div>

      {/* player control bar */}
      <div className="flex items-center gap-[14px] border-t border-[#eef4f4] bg-white px-[18px] py-[14px]">
        <button
          type="button"
          aria-label={playing ? 'Pause product tour' : 'Play product tour'}
          onClick={() => {
            if (playing) {
              setPaused(true)
            } else {
              setPaused(false)
              setUserPlay(true) // explicit play overrides prefers-reduced-motion
            }
          }}
          className="flex h-[30px] w-[30px] flex-none cursor-pointer items-center justify-center rounded-full border-none bg-[#5b9aa6] transition-transform hover:scale-105"
        >
          {playing ? (
            <span className="flex gap-[3px]">
              <span className="block h-[10px] w-[3px] rounded-[1px] bg-white" />
              <span className="block h-[10px] w-[3px] rounded-[1px] bg-white" />
            </span>
          ) : (
            <span
              className="block"
              style={{ width: 0, height: 0, borderStyle: 'solid', borderWidth: '6px 0 6px 10px', borderColor: 'transparent transparent transparent #fff', marginLeft: 2 }}
            />
          )}
        </button>
        <div className="h-1.5 flex-1 overflow-hidden rounded-[3px] bg-[#e2ecec]">
          <div className="h-full rounded-[3px] bg-[#5b9aa6]" style={{ width: progressPct }} />
        </div>
        <span className="whitespace-nowrap text-[11px] leading-none text-[#5d7174] tabular-nums" style={{ fontFamily: SPACE }}>
          {timeLabel}
        </span>
      </div>

      {/* chapters */}
      <div className="flex gap-[7px] bg-white px-[18px] pb-4">
        {CHAPTERS.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => {
              setT(i * PER + 520)
              setUserPlay(true) // unfreeze the reduced-motion frame so the seek is visible
            }}
            className="flex flex-1 cursor-pointer flex-col gap-[5px] border-none bg-transparent p-0"
          >
            <span className="h-[3px] rounded-[2px] transition-colors" style={{ background: i <= fi ? '#5b9aa6' : '#dde7e7' }} />
            <span className="text-left text-[9px] font-semibold leading-[1.1] transition-colors" style={{ color: i === fi ? '#16282b' : '#5d7174' }}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
