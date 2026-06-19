'use client'

import { useEffect, useState } from 'react'

/**
 * Self-contained visual showcase of the athlete pre-season baseline flow.
 * NOT the real SCAT6 test (that lives at /preseason/b/[code]) — this is a
 * Loom-style auto-playing walkthrough that crossfades through frames.
 * No backend calls, no real form state.
 *
 * Frames mirror the REAL screens of app/preseason/b/[code]/page.tsx:
 *   0 Athlete Information      (Step 1 of 6 — Athlete Background)
 *   1 Symptom Evaluation       (Step 2 of 6)
 *   2 Immediate Memory         (Step 3 of 6 — Cognitive Screening)
 *   3 Months in Reverse        (Step 3 of 6 — Cognitive Screening)
 *   4 Oculomotor Screening     (Step 4 of 6)
 *   5 Delayed Recall           (Step 5 of 6)
 *   6 All Sections Complete    (Step 6 of 6 — Score Summary)
 * Real flow has 6 numbered steps (totalSteps = 6); the two cognitive frames
 * both live inside Step 3, matching the real sub-step tabs.
 */

// chapter tabs — accurate to the represented real sections, in order
const CHAPTERS = ['Athlete info', 'Symptoms', 'Memory', 'Months', 'Oculomotor', 'Recall', 'Report']
const PER = 3300 // ms per frame
const FADE = 480 // crossfade duration ms
const N = CHAPTERS.length

// real app accent (globals.css --accent)
const ACCENT = '#0d7377'
const BTN_BG = `linear-gradient(135deg, ${ACCENT} 0%, #0b6165 100%)`

// which real numbered step each frame belongs to + its section name
const FRAME_STEP: { step: number; section: string }[] = [
  { step: 1, section: 'Athlete Background' },
  { step: 2, section: 'Symptom Evaluation' },
  { step: 3, section: 'Cognitive Screening' },
  { step: 3, section: 'Cognitive Screening' },
  { step: 4, section: 'Oculomotor Screening' },
  { step: 5, section: 'Delayed Recall' },
  { step: 6, section: 'Score Summary' },
]

function fmt(sec: number) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return m + ':' + String(s).padStart(2, '0')
}

// Step 2 — real 22-symptom 0–6 scale; representative subset of the real names
const SYMPTOM_ROWS: { label: string; v: number }[] = [
  { label: 'Headache', v: 1 },
  { label: 'Pressure in head', v: 0 },
  { label: 'Neck pain', v: 0 },
  { label: 'Nausea or vomiting', v: 0 },
  { label: 'Dizziness', v: 1 },
  { label: 'Blurred vision', v: 0 },
  { label: 'Balance problems', v: 0 },
  { label: 'Sensitivity to light', v: 2 },
]
const SYMPTOM_COUNT = SYMPTOM_ROWS.filter((r) => r.v > 0).length // shown as X/22
const SYMPTOM_SEV = SYMPTOM_ROWS.reduce((a, r) => a + r.v, 0) // shown as Y/132

// Step 3 Months in Reverse — shuffled chips (real shuffles so they can't be read in order)
const MONTHS_SHUFFLED = ['Mar', 'Aug', 'Dec', 'Jun', 'Oct', 'Jan', 'Nov', 'May', 'Feb', 'Sep', 'Jul', 'Apr']
const MONTHS_TAPPED = new Set(['Dec', 'Nov', 'Oct']) // tapped Dec→Nov→Oct so far (3/12)

// Step 5 Delayed Recall — real word-list A targets + distractors, shuffled
const RECALL_POOL = [
  'Jacket', 'Lemon', 'Pepper', 'Cotton', 'Insect', 'Dollar',
  'Honey', 'Mirror', 'Candle', 'Saddle', 'Anchor', 'Arrow',
  'Sugar', 'Movie', 'Monkey',
]
const RECALLED = new Set(['Jacket', 'Pepper', 'Cotton', 'Dollar', 'Mirror', 'Anchor']) // 6 selected

// Step 6 — real "Sections completed" list
const SECTIONS_DONE = [
  'Symptom Evaluation', 'Orientation', 'Immediate Memory',
  'Concentration', 'Delayed Recall', 'Oculomotor Screening',
]

function StepHeader({ frame }: { frame: number }) {
  const { step, section } = FRAME_STEP[frame]
  return (
    <div className="mb-2">
      <div className="mb-[7px] flex items-center gap-[5px]">
        {[1, 2, 3, 4, 5, 6].map((s) => (
          <span
            key={s}
            className="h-[5px] flex-1 rounded-full"
            style={{ background: s <= step ? ACCENT : '#e2e8f0' }}
          />
        ))}
      </div>
      <p className="m-0 text-center text-[10px] font-medium leading-none text-slate-500">
        Step {step} of 6: {section}
      </p>
    </div>
  )
}

// reusable "glass" card look (frosted white on the mesh background)
const CARD =
  'rounded-[16px] border border-white/70 bg-white/80 px-[18px] py-[14px] shadow-[0_10px_30px_-18px_rgba(13,115,119,.4)] backdrop-blur'

// small sub-step tabs used by the real Cognitive Screening step
function CognitiveTabs({ active }: { active: 'Memory' | 'Orientation' | 'Digits' | 'Months' }) {
  return (
    <div className="mb-2.5 flex gap-1">
      {(['Memory', 'Orientation', 'Digits', 'Months'] as const).map((t) => (
        <span
          key={t}
          className="flex-1 rounded-lg py-[6px] text-center text-[10px] font-semibold leading-none"
          style={
            t === active
              ? { background: ACCENT, color: '#fff' }
              : { background: '#f1f5f9', color: '#64748b' }
          }
        >
          {t}
        </span>
      ))}
    </div>
  )
}

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
          style={{ height: 398, background: 'radial-gradient(120% 90% at 50% 0%, #eef9f9, #e2e8f0)' }}
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
                portal.concussion-education-australia.com/preseason/b
              </span>
              <span className="w-[34px] flex-none" />
            </div>

            {/* web app */}
            <div
              className="relative"
              style={{ height: 'calc(100% - 36px)', background: 'linear-gradient(175deg, rgba(13,115,119,.05) 0%, #f8fafb 42%)' }}
            >
              {/* app top bar (real centred Pre-Season Baseline header) */}
              <div className="absolute left-0 right-0 top-0 z-[6] flex items-center justify-between border-b border-[#eef2f6] bg-white/85 px-6 py-[11px] backdrop-blur">
                <div className="flex items-center gap-[9px]">
                  <span
                    className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-[7px] text-[11px] font-extrabold leading-none text-white"
                    style={{ background: ACCENT }}
                  >
                    CE
                  </span>
                  <span className="flex flex-col leading-tight">
                    <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-teal-700">
                      Pre-Season Baseline
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">for Northcote Sports Med</span>
                  </span>
                </div>
                <span
                  className="rounded-lg px-2.5 py-1 text-[10px] font-bold leading-none"
                  style={{ background: 'rgba(13,115,119,.10)', color: ACCENT }}
                >
                  Baseline Test 1 — Maya Thompson
                </span>
              </div>

              {/* content region (frames) */}
              <div className="absolute bottom-0 left-0 right-0" style={{ top: 53 }}>
                {/* FRAME 0: ATHLETE INFORMATION */}
                <div style={frameStyle(0)} className="flex flex-col px-7 py-3">
                  <StepHeader frame={0} />
                  <div className={CARD + ' flex-1'}>
                    <h2 className="m-0 text-[16px] font-extrabold leading-tight tracking-[-0.01em]">
                      Athlete Information
                    </h2>
                    <p className="m-0 mt-0.5 text-[10px] leading-tight text-slate-500">
                      All fields marked * are required for a complete baseline.
                    </p>
                    <div className="mt-2.5 grid grid-cols-2 gap-2">
                      {[
                        { k: 'Full Name *', v: 'Maya Thompson' },
                        { k: 'Date of Birth *', v: '14 / 03 / 2009' },
                        { k: 'Sport *', v: 'AFL' },
                        { k: 'Team / Club *', v: 'Northcote U16' },
                        { k: 'Sex *', v: 'Female' },
                        { k: 'Dominant Hand *', v: 'Right' },
                      ].map((f) => (
                        <div
                          key={f.k}
                          className="rounded-lg border border-slate-200 bg-white px-[11px] py-[7px]"
                        >
                          <span className="text-[8.5px] font-semibold leading-none text-slate-500">{f.k}</span>
                          <div className="mt-[3px] text-[12px] font-medium leading-tight text-slate-800">{f.v}</div>
                        </div>
                      ))}
                    </div>
                    <h3 className="mb-0 mt-3 text-[11px] font-bold leading-none text-slate-700">Concussion History</h3>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-flex h-[15px] w-[15px] flex-none items-center justify-center rounded-[4px] border-[1.5px]" style={{ borderColor: ACCENT, background: ACCENT }}>
                        <span className="block h-[6px] w-[3px] rotate-45 border-b-2 border-r-2 border-white" style={{ marginTop: -2 }} />
                      </span>
                      <span className="text-[11px] leading-none text-slate-600">Diagnosed migraines / headaches?</span>
                    </div>
                  </div>
                </div>

                {/* FRAME 1: SYMPTOM EVALUATION */}
                <div style={frameStyle(1)} className="flex flex-col px-7 py-3">
                  <StepHeader frame={1} />
                  <div className={CARD + ' flex-1'}>
                    <h2 className="m-0 text-[16px] font-extrabold leading-tight tracking-[-0.01em]">
                      Symptom Evaluation
                    </h2>
                    <p className="m-0 mt-0.5 text-[9.5px] leading-tight text-slate-500">
                      Rate each symptom from 0 (none) to 6 (severe) based on how you feel right now.
                    </p>
                    {/* number header row */}
                    <div className="mt-2 flex items-center gap-[3px] pl-[42%]">
                      {[0, 1, 2, 3, 4, 5, 6].map((v) => (
                        <span key={v} className="flex-1 text-center text-[8px] font-bold text-slate-400">{v}</span>
                      ))}
                    </div>
                    <div className="mt-0.5 space-y-[3px]">
                      {SYMPTOM_ROWS.map((r) => (
                        <div key={r.label} className="flex items-center gap-[3px]">
                          <span className="w-[42%] flex-shrink-0 truncate text-[9.5px] leading-none text-slate-700">{r.label}</span>
                          <div className="flex flex-1 gap-[3px]">
                            {[0, 1, 2, 3, 4, 5, 6].map((val) => {
                              const on = r.v === val
                              const zero = on && val === 0
                              return (
                                <span
                                  key={val}
                                  className="flex h-[18px] flex-1 items-center justify-center rounded-[4px] text-[8px] font-bold leading-none"
                                  style={
                                    on
                                      ? zero
                                        ? { background: '#dcfce7', color: '#15803d', boxShadow: 'inset 0 0 0 1px #4ade80' }
                                        : { background: ACCENT, color: '#fff' }
                                      : { background: '#f1f5f9', color: '#94a3b8' }
                                  }
                                >
                                  {val}
                                </span>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* totals */}
                    <div
                      className="mt-2.5 flex justify-between rounded-[10px] px-3 py-2 text-[10px] leading-none"
                      style={{ background: 'rgba(13,115,119,.06)', boxShadow: 'inset 0 0 0 1px rgba(13,115,119,.18)' }}
                    >
                      <span className="text-slate-600">
                        Symptom Number: <strong className="text-slate-900">{SYMPTOM_COUNT}/22</strong>
                      </span>
                      <span className="text-slate-600">
                        Severity Score: <strong className="text-slate-900">{SYMPTOM_SEV}/132</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* FRAME 2: IMMEDIATE MEMORY (Cognitive Screening) */}
                <div style={frameStyle(2)} className="flex flex-col px-7 py-3">
                  <StepHeader frame={2} />
                  <div className={CARD + ' flex-1'}>
                    <CognitiveTabs active="Memory" />
                    <h2 className="m-0 text-[15px] font-extrabold leading-tight tracking-[-0.01em]">
                      Immediate Memory
                    </h2>
                    <p className="m-0 mt-0.5 text-[9.5px] leading-tight text-slate-500">
                      You&apos;ll be shown 10 words, one at a time. After all words are shown, select the ones you remember.
                    </p>
                    {/* word-flash phase */}
                    <div className="mt-2 flex flex-col items-center justify-center rounded-[12px] py-[18px]" style={{ background: 'rgba(13,115,119,.04)' }}>
                      <p className="m-0 text-[9px] font-medium leading-none text-slate-400">Word 4 of 10</p>
                      <div
                        className="mt-2.5 text-[38px] font-bold leading-none tracking-[-0.01em]"
                        style={{ color: ACCENT }}
                      >
                        Cotton
                      </div>
                      <p className="m-0 mt-2.5 text-[9px] leading-none text-slate-400">Remember this word</p>
                    </div>
                  </div>
                </div>

                {/* FRAME 3: MONTHS IN REVERSE (Cognitive Screening) */}
                <div style={frameStyle(3)} className="flex flex-col px-7 py-3">
                  <StepHeader frame={3} />
                  <div className={CARD + ' flex-1'}>
                    <CognitiveTabs active="Months" />
                    <h2 className="m-0 text-[14px] font-extrabold leading-tight tracking-[-0.01em]">
                      Concentration — Months in Reverse
                    </h2>
                    <p className="m-0 mt-0.5 text-[9px] leading-tight text-slate-500">
                      Tap the months in reverse order: December → January. Time to complete is recorded.
                    </p>
                    <div className="mt-1.5 text-center">
                      <p className="m-0 text-[26px] font-bold leading-none tabular-nums" style={{ color: ACCENT, fontFamily: 'var(--font-space), monospace' }}>
                        6.4s
                      </p>
                      <p className="m-0 mt-1 text-[9px] leading-none text-slate-400">3/12 — tap in reverse order</p>
                    </div>
                    <div className="mt-2 grid grid-cols-4 gap-1.5">
                      {MONTHS_SHUFFLED.map((m) => {
                        const tapped = MONTHS_TAPPED.has(m)
                        return (
                          <span
                            key={m}
                            className="rounded-[9px] py-[9px] text-center text-[11px] font-medium leading-none"
                            style={
                              tapped
                                ? { background: 'rgba(13,115,119,.20)', color: 'rgba(13,115,119,.65)' }
                                : { background: 'rgba(255,255,255,.85)', color: '#334155', boxShadow: 'inset 0 0 0 1px #e2e8f0' }
                            }
                          >
                            {m}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* FRAME 4: OCULOMOTOR SCREENING */}
                <div style={frameStyle(4)} className="flex flex-col px-7 py-3">
                  <StepHeader frame={4} />
                  <div className={CARD + ' flex-1'}>
                    <div className="flex items-center justify-between">
                      <h2 className="m-0 text-[15px] font-extrabold leading-tight tracking-[-0.01em]">
                        Horizontal Saccades
                      </h2>
                      <span className="text-[9px] font-medium leading-none text-slate-400">2/5 cycles</span>
                    </div>
                    <p className="m-0 mt-0.5 text-[9.5px] leading-tight text-slate-500">
                      Follow the highlighted dot as it alternates. Keep your head still.
                    </p>
                    {/* dark target box with glowing teal dot (real bg-slate-900 + teal-400) */}
                    <div className="relative mt-2 h-[150px] overflow-hidden rounded-[14px] bg-slate-900">
                      <span className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full" style={{ right: '6%', background: '#334155' }} />
                      <span
                        className="absolute top-1/2 h-9 w-9 -translate-y-1/2 rounded-full"
                        style={{ left: '6%', background: '#2dd4bf', boxShadow: '0 0 24px rgba(45,212,191,.6)' }}
                      />
                    </div>
                  </div>
                </div>

                {/* FRAME 5: DELAYED RECALL */}
                <div style={frameStyle(5)} className="flex flex-col px-7 py-3">
                  <StepHeader frame={5} />
                  <div className={CARD + ' flex-1'}>
                    <h2 className="m-0 text-[16px] font-extrabold leading-tight tracking-[-0.01em]">
                      Delayed Recall
                    </h2>
                    <p className="m-0 mt-0.5 text-[9.5px] leading-tight text-slate-500">
                      Select the words you recall from the memory test earlier.
                    </p>
                    <div className="mt-2 grid grid-cols-3 gap-1.5">
                      {RECALL_POOL.map((w) => {
                        const on = RECALLED.has(w)
                        return (
                          <span
                            key={w}
                            className="rounded-[9px] py-[8px] text-center text-[10.5px] font-medium leading-none"
                            style={
                              on
                                ? { background: ACCENT, color: '#fff' }
                                : { background: 'rgba(255,255,255,.85)', color: '#334155', boxShadow: 'inset 0 0 0 1px #e2e8f0' }
                            }
                          >
                            {w}
                          </span>
                        )
                      })}
                    </div>
                    <div className="mt-2.5 text-center">
                      <span
                        className="inline-block rounded-[10px] px-3 py-1.5 text-[11px] font-bold leading-none"
                        style={{ background: 'rgba(13,115,119,.10)', color: ACCENT, boxShadow: 'inset 0 0 0 2px rgba(13,115,119,.4)' }}
                      >
                        <span className="text-[14px]">6</span>/10 <span className="text-[9px] font-medium opacity-75">selected</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* FRAME 6: ALL SECTIONS COMPLETE (Score Summary) */}
                <div style={frameStyle(6)} className="flex flex-col px-7 py-3">
                  <StepHeader frame={6} />
                  <div className={CARD + ' flex flex-1 flex-col'}>
                    <div className="text-center">
                      <span className="mx-auto inline-flex h-[42px] w-[42px] items-center justify-center rounded-full bg-green-100">
                        <span className="block h-[11px] w-[6px] rotate-45 border-b-[3px] border-r-[3px] border-green-600" style={{ marginTop: -3 }} />
                      </span>
                      <h2 className="m-0 mt-2 text-[16px] font-extrabold leading-tight tracking-[-0.01em]">
                        All Sections Complete
                      </h2>
                      <p className="m-0 mt-1 text-[9.5px] leading-tight text-slate-500">
                        All responses have been recorded. Tap &quot;Submit&quot; to send your baseline report to your clinician.
                      </p>
                    </div>
                    <div className="mt-2.5 rounded-[12px] px-3 py-2.5" style={{ background: 'rgba(13,115,119,.05)' }}>
                      <p className="m-0 mb-1.5 text-[10px] font-semibold leading-none text-slate-700">Sections completed:</p>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                        {SECTIONS_DONE.map((s) => (
                          <div key={s} className="flex items-center gap-1.5 text-[9.5px] leading-none text-slate-500">
                            <span className="block h-[6px] w-[3px] rotate-45 border-b-[2px] border-r-[2px] border-green-600" />
                            <span>{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div
                      className="mt-auto flex items-center justify-center gap-2 rounded-[11px] py-[11px] text-[12px] font-semibold leading-none text-white"
                      style={{ background: BTN_BG, boxShadow: '0 12px 24px -12px rgba(13,115,119,.8)' }}
                    >
                      Send Report to Northcote Sports Med
                      <span className="block h-0 w-0 border-y-[5px] border-l-[8px] border-y-transparent border-l-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* loom cursor (visible on frame 0, over a Next control) */}
              <div
                className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2"
                style={{ top: '86%', opacity: cursorOp, transition: 'opacity .4s ease' }}
              >
                <span
                  className="absolute h-[34px] w-[34px] rounded-full"
                  style={{
                    left: -3,
                    top: -3,
                    background: 'rgba(13,115,119,.45)',
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
        <div className="flex gap-[6px] bg-white px-[18px] pb-4">
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
                className="text-left text-[8.5px] font-semibold leading-[1.1] transition-colors"
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
