'use client'

import { useEffect, useRef, useState } from 'react'
import { InfographicFrame } from './InfographicFrame'

/**
 * ANIMATED: the graded test becoming a prescription.
 *
 * Replaces the static `hrt-to-prescription.png` at three placements (CCM M7,
 * CRM M3, CRM M4). The static image can show the finished chart; it cannot show
 * the thing that actually needs teaching — that the training band DOES NOT EXIST
 * until the symptom threshold fires. Drawing the band only after the
 * termination event is the whole pedagogical point, and it is why this is motion
 * rather than a picture.
 *
 * Every number is protocol data, not illustration: one-minute stages, the
 * 3-point provocation rule that defines symptom-limited termination, and the
 * 80–90% band. Nothing here is generated or approximated.
 *
 * Canvas rather than hand-authored SVG paths: the traces are computed from the
 * stage table, so changing the protocol changes the drawing.
 */

const REST_SYM = 2
const PROVOCATION_RISE = 3
const STAGES = [
  { min: 0, hr: 95, sym: 2 },
  { min: 1, hr: 104, sym: 2 },
  { min: 2, hr: 112, sym: 2 },
  { min: 3, hr: 119, sym: 2 },
  { min: 4, hr: 125, sym: 3 },
  { min: 5, hr: 130, sym: 3 },
  { min: 6, hr: 134, sym: 3 },
  { min: 7, hr: 137, sym: 4 },
  { min: 8, hr: 140, sym: 4 },
  { min: 9, hr: 142, sym: 5 }, // rise of 3 from rest → symptom-limited
] as const

const HRT = 142
const BAND_LO = Math.round(HRT * 0.8)
const BAND_HI = Math.round(HRT * 0.9)
const LAST = STAGES.length - 1

export function HrtToPrescriptionAnimated() {
  const cvRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const progRef = useRef(0)
  const [playing, setPlaying] = useState(false)
  const [done, setDone] = useState(false)
  const [readout, setReadout] = useState({ min: 0, hr: 95, sym: 2 })

  useEffect(() => {
    const cv = cvRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    const M = { l: 54, r: 18, t: 20, b: 40 }
    let W = 0
    let H = 0

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = cv.clientWidth
      H = Math.round(W * 0.5)
      cv.width = W * dpr
      cv.height = H * dpr
      cv.style.height = `${H}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const xOf = (m: number) => M.l + (m / LAST) * (W - M.l - M.r)
    const yHr = (hr: number) => M.t + (1 - (hr - 80) / 80) * (H - M.t - M.b)
    const ySym = (s: number) => M.t + (1 - s / 10) * (H - M.t - M.b)

    const draw = () => {
      const p = progRef.current
      ctx.clearRect(0, 0, W, H)

      // The band is DERIVED — it may only appear once the threshold exists.
      if (p >= LAST) {
        ctx.fillStyle = 'rgba(13,115,119,0.13)'
        ctx.fillRect(M.l, yHr(BAND_HI), W - M.l - M.r, yHr(BAND_LO) - yHr(BAND_HI))
        ctx.strokeStyle = '#0d7377'
        ctx.setLineDash([4, 4])
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(M.l, yHr(BAND_HI)); ctx.lineTo(W - M.r, yHr(BAND_HI))
        ctx.moveTo(M.l, yHr(BAND_LO)); ctx.lineTo(W - M.r, yHr(BAND_LO))
        ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = '#0d7377'
        ctx.font = '600 11px ui-sans-serif,system-ui,sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(`Train here — ${BAND_LO}–${BAND_HI} bpm`, M.l + 8, yHr(BAND_HI) - 6)
      }

      ctx.strokeStyle = 'rgba(22,40,43,0.08)'
      ctx.lineWidth = 1
      ctx.font = '500 10.5px ui-sans-serif,system-ui,sans-serif'
      ctx.fillStyle = '#6b8588'
      for (let hr = 90; hr <= 160; hr += 10) {
        const y = yHr(hr)
        ctx.beginPath(); ctx.moveTo(M.l, y); ctx.lineTo(W - M.r, y); ctx.stroke()
        ctx.textAlign = 'right'; ctx.fillText(String(hr), M.l - 8, y + 3.5)
      }
      ctx.textAlign = 'center'
      for (let m = 0; m <= LAST; m++) ctx.fillText(String(m), xOf(m), H - M.b + 17)
      ctx.fillText('minutes into the test', (M.l + W - M.r) / 2, H - M.b + 33)

      const shown = STAGES.filter((s) => s.min <= p)
      const frac = p % 1
      const nxt = STAGES[Math.floor(p) + 1]
      const trace = (key: 'hr' | 'sym', yFn: (n: number) => number) => {
        const pts = shown.map((s) => ({ x: xOf(s.min), y: yFn(s[key]) }))
        if (nxt && frac > 0) {
          const a = STAGES[Math.floor(p)]
          pts.push({ x: xOf(a.min + frac), y: yFn(a[key] + (nxt[key] - a[key]) * frac) })
        }
        return pts
      }

      const sp = trace('sym', ySym)
      if (sp.length > 1) {
        ctx.strokeStyle = '#d79a3a'; ctx.lineWidth = 2; ctx.setLineDash([5, 4])
        ctx.beginPath(); sp.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)))
        ctx.stroke(); ctx.setLineDash([])
      }
      const hp = trace('hr', yHr)
      if (hp.length > 1) {
        ctx.strokeStyle = '#0d7377'; ctx.lineWidth = 2.6; ctx.lineJoin = 'round'
        ctx.beginPath(); hp.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)))
        ctx.stroke()
      }
      hp.forEach((q) => { ctx.fillStyle = '#0d7377'; ctx.beginPath(); ctx.arc(q.x, q.y, 2.8, 0, 7); ctx.fill() })

      if (p >= LAST) {
        const x = xOf(LAST); const y = yHr(HRT)
        ctx.strokeStyle = '#d79a3a'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3])
        ctx.beginPath(); ctx.moveTo(x, M.t); ctx.lineTo(x, H - M.b); ctx.stroke(); ctx.setLineDash([])
        ctx.fillStyle = '#d79a3a'; ctx.beginPath(); ctx.arc(x, y, 5.5, 0, 7); ctx.fill()
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 2.2, 0, 7); ctx.fill()
        ctx.fillStyle = '#a06a1c'; ctx.font = '700 11.5px ui-sans-serif,system-ui,sans-serif'
        ctx.textAlign = 'right'; ctx.fillText(`HRt ${HRT} bpm`, x - 10, y - 9)
      }
    }

    const tick = () => {
      progRef.current = Math.min(progRef.current + 0.05, LAST)
      const i = Math.min(Math.floor(progRef.current), LAST)
      setReadout({ min: i, hr: STAGES[i].hr, sym: STAGES[i].sym })
      draw()
      if (progRef.current >= LAST) { setPlaying(false); setDone(true); return }
      rafRef.current = requestAnimationFrame(tick)
    }

    ;(cv as HTMLCanvasElement & { __start?: () => void }).__start = () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        progRef.current = LAST
        setReadout({ min: LAST, hr: STAGES[LAST].hr, sym: STAGES[LAST].sym })
        setDone(true); draw(); return
      }
      progRef.current = 0; setDone(false); setPlaying(true); tick()
    }

    const onResize = () => { size(); draw() }
    size(); draw()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const start = () => {
    const cv = cvRef.current as (HTMLCanvasElement & { __start?: () => void }) | null
    cv?.__start?.()
  }

  const provoked = readout.sym - REST_SYM >= PROVOCATION_RISE

  return (
    <InfographicFrame
      eyebrow="Assessment → Prescription"
      title="How a graded test becomes a training band"
      caption="Workload rises one minute at a time. The moment symptoms rise 3 points above rest, the test stops — and the heart rate at that instant is the number every session is dosed from."
      ariaLabel="Animated chart. Heart rate and symptom score rise across ten one-minute treadmill stages. At minute 9 the symptom score reaches 5, three points above the resting score of 2, terminating the test. The heart rate at that point, 142 bpm, is the threshold. A training band is then drawn at 80 to 90 percent of it, 114 to 128 bpm."
    >
      <div className="flex flex-col gap-3">
        <canvas ref={cvRef} className="w-full rounded-lg" />

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={start}
            disabled={playing}
            className="rounded-lg bg-[#0d7377] px-4 py-2 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {playing ? 'Running…' : done ? 'Run again' : 'Run the test'}
          </button>

          <span className="ml-auto flex items-center gap-3 text-[12.5px] tabular-nums text-[#4a6a6e]">
            <span><strong className="text-[#16282b]">{readout.min}</strong> min</span>
            <span><strong className="text-[#0d7377]">{readout.hr}</strong> bpm</span>
            <span className={provoked ? 'font-bold text-[#a06a1c]' : ''}>
              symptoms <strong>{readout.sym}</strong>/10
            </span>
          </span>
        </div>

        {done && (
          <p className="rounded-lg border border-[#e4cfa4] bg-[#fbf2e1] px-3.5 py-2.5 text-[13px] leading-relaxed text-[#5c4415]">
            <strong>Symptom-limited at minute 9.</strong> Threshold {HRT} bpm → train at{' '}
            <strong>{BAND_LO}–{BAND_HI} bpm</strong>. Two athletes the same age can threshold 30 bpm
            apart — a percentage of predicted maximum would have dosed both of them wrong.
          </p>
        )}
      </div>
    </InfographicFrame>
  )
}
