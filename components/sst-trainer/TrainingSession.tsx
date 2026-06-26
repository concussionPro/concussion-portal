'use client'

import { useEffect, useRef, useState } from 'react'
import { SESSION_STOP_RISE, type Prescription, type SessionLog } from '@/lib/sst-trainer/protocol'
import { PrimaryButton, SecondaryButton, SegmentBars, numFont } from './shell'

// ── gauge geometry (ported from the design's trainGaugeEl) ──────────────────
const pt = (cx: number, cy: number, r: number, deg: number): [number, number] => {
  const a = (deg * Math.PI) / 180
  return [cx + r * Math.sin(a), cy - r * Math.cos(a)]
}
const arc = (cx: number, cy: number, r: number, d0: number, d1: number) => {
  const [x0, y0] = pt(cx, cy, r, d0)
  const [x1, y1] = pt(cx, cy, r, d1)
  const large = Math.abs(d1 - d0) > 180 ? 1 : 0
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`
}

function TrainGauge({ lo, up, hr, color }: { lo: number; up: number; hr: number; color: string }) {
  const min = lo - 30
  const max = up + 30
  const cx = 118
  const cy = 120
  const R = 92
  const A = (v: number) => -135 + ((Math.max(min, Math.min(max, v)) - min) / (max - min)) * 270
  const over = hr > up
  const [mx1, my1] = pt(cx, cy, R + 6, A(up))
  const [mx2, my2] = pt(cx, cy, R + 16, A(up))
  const [lx, ly] = pt(cx, cy, R + 27, A(up))
  const [nix, niy] = pt(cx, cy, R - 22, A(hr))
  const [npx, npy] = pt(cx, cy, R, A(hr))
  return (
    <svg viewBox="0 0 236 226" className="block h-full w-full">
      <path d={arc(cx, cy, R, -135, 135)} fill="none" stroke="#dde7e7" strokeWidth={11} strokeLinecap="round" />
      <path d={arc(cx, cy, R, A(lo), A(up))} fill="none" stroke="#5b9aa6" strokeWidth={13} strokeLinecap="round" />
      {over && (
        <path d={arc(cx, cy, R, A(up), A(hr))} fill="none" stroke="#d2463a" strokeWidth={13} strokeLinecap="round" />
      )}
      <line x1={mx1} y1={my1} x2={mx2} y2={my2} stroke="#d2463a" strokeWidth={2.5} strokeLinecap="round" />
      <text x={lx} y={ly + 3} fill="#d2463a" fontSize={9} fontWeight={700} textAnchor="middle">
        MAX
      </text>
      <line x1={nix} y1={niy} x2={npx} y2={npy} stroke={color} strokeWidth={3} strokeLinecap="round" />
      <circle cx={npx} cy={npy} r={8} fill="#fff" stroke={color} strokeWidth={4} />
    </svg>
  )
}

export default function TrainingSession({
  rx,
  onComplete,
  onCancel,
  liveHr = null,
  hrSourceLabel,
  hrStatus = 'manual',
}: {
  rx: Prescription
  onComplete: (log: SessionLog) => void
  onCancel: () => void
  /** live bpm from a paired wearable / camera (null = manual entry) */
  liveHr?: number | null
  /** paired source name, e.g. "Apple Watch" */
  hrSourceLabel?: string
  /** feed state for the live/connecting/manual chip */
  hrStatus?: 'idle' | 'connecting' | 'streaming' | 'manual'
}) {
  const mid = Math.round((rx.lowerBpm + rx.upperBpm) / 2)
  const [preSymptom, setPreSymptom] = useState(0)
  const [currentSymptom, setCurrentSymptom] = useState(0)
  const [peakSymptom, setPeakSymptom] = useState(0)
  const [heartRate, setHeartRate] = useState('')
  const [readings, setReadings] = useState<number[]>([])
  const [elapsed, setElapsed] = useState(0)

  // session clock (counts up while on the screen)
  useEffect(() => {
    const iv = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(iv)
  }, [])

  // Live source drives the gauge; a manual override must stick (not be wiped by
  // the next live emission). Only auto-fill when empty or still showing the last
  // streamed value.
  const lastLiveRef = useRef<string>('')
  useEffect(() => {
    if (typeof liveHr === 'number' && Number.isFinite(liveHr)) {
      const next = String(liveHr)
      setHeartRate((cur) => {
        if (cur === '' || cur === lastLiveRef.current) {
          lastLiveRef.current = next
          return next
        }
        return cur
      })
    }
  }, [liveHr])

  const hrValue = heartRate.trim() === '' ? null : Number(heartRate)
  // Physiologic plausibility cap — a fat-finger must not drive the zone gauge.
  const hrValid = hrValue !== null && Number.isFinite(hrValue) && hrValue >= 30 && hrValue <= 240
  const gaugeHr = hrValid ? (hrValue as number) : mid

  // zone off the live reading
  const zone: 'below' | 'in' | 'over' | 'none' = !hrValid
    ? 'none'
    : (hrValue as number) > rx.upperBpm
      ? 'over'
      : (hrValue as number) < rx.lowerBpm
        ? 'below'
        : 'in'
  const zoneMeta = {
    none: { color: '#7d9092', bg: '#eef4f4', label: 'Enter your heart rate', icon: '●' },
    in: { color: '#5b9aa6', bg: '#e7f2f3', label: 'In your band', icon: '●' },
    over: { color: '#d2463a', bg: '#fbeae8', label: 'Over ceiling — ease off', icon: '▲' },
    below: { color: '#7d9092', bg: '#eef4f4', label: 'Below band — lift a little', icon: '▼' },
  }[zone]

  // SESSION_STOP_RISE rule: stop if symptoms rise >= 2 points from pre-session
  const symptomRise = currentSymptom - preSymptom
  const shouldStop = symptomRise >= SESSION_STOP_RISE

  const updateSymptom = (v: number) => {
    setCurrentSymptom(v)
    setPeakSymptom((p) => Math.max(p, v))
  }

  const logReading = () => {
    if (!hrValid) return
    setReadings((prev) => [...prev, hrValue as number])
  }

  // need at least one HR figure (a logged reading or the live input) or the
  // session is unscored garbage ("avg 0 · peak 0") that pollutes progression.
  const hasHrData = readings.length > 0 || hrValid

  const completeSession = () => {
    if (!hasHrData) return
    const all = readings.length ? readings : hrValid ? [hrValue as number] : []
    const avgHeartRate = all.length ? Math.round(all.reduce((a, b) => a + b, 0) / all.length) : 0
    const peakHeartRate = all.length ? Math.max(...all) : 0
    // record actual time on the screen — never substitute the prescribed target,
    // which would fabricate adherence for a session cut short.
    const completedMinutes = Math.round(elapsed / 60)
    onComplete({
      date: new Date().toLocaleDateString('en-AU', { month: 'short', day: 'numeric' }),
      avgHeartRate,
      peakHeartRate,
      preSymptom,
      peakSymptom: Math.max(peakSymptom, currentSymptom),
      completedMinutes,
    })
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')

  return (
    <section className="flex flex-col gap-3.5 pt-1">
      <div className="flex items-center justify-between">
        <h1 className="m-0 text-[18px] font-extrabold leading-none tracking-[-0.02em]">Session</h1>
        <span className={`text-[11px] text-[#849c9c] ${numFont}`}>
          {mm}:{ss}
        </span>
      </div>

      <div className="flex items-center justify-center gap-1.5 rounded-full bg-[#eef4f4] px-3 py-2 text-[11.5px] font-semibold text-[#3c7681]">
        <span className="h-[7px] w-[7px] rounded-full bg-[#5b9aa6]" />
        Target {rx.lowerBpm}–{rx.upperBpm} bpm · {rx.sessionMinutes} min
      </div>

      {hrStatus === 'streaming' ? (
        <div className="-mt-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#3c7a1f]">
          <span className="inline-block h-[7px] w-[7px] animate-pulse rounded-full bg-[#3c7a1f]" />
          {hrSourceLabel ?? 'Wearable'} · streaming live
        </div>
      ) : hrStatus === 'connecting' ? (
        <div className="-mt-1 text-center text-[11px] text-[#9bafb0]">Connecting {hrSourceLabel ?? 'device'}…</div>
      ) : null}

      {/* hero gauge */}
      <div className="relative mx-auto mt-0.5 h-[226px] w-[236px]">
        <TrainGauge lo={rx.lowerBpm} up={rx.upperBpm} hr={gaugeHr} color={zoneMeta.color} />
        <div className="absolute left-0 right-0 top-1/2 flex -translate-y-[54%] flex-col items-center">
          <span
            className={`text-[60px] leading-[0.9] ${numFont}`}
            style={{ color: zoneMeta.color }}
          >
            {hrValid ? hrValue : '—'}
          </span>
          <span className="-mt-0.5 text-[11px] font-semibold tracking-[0.14em] text-[#9bafb0]">
            BPM
          </span>
          <span
            className="mt-1.5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold tracking-[0.03em]"
            style={{ background: zoneMeta.bg, color: zoneMeta.color }}
          >
            {zoneMeta.icon} {zoneMeta.label}
          </span>
        </div>
      </div>

      {/* live bpm (Web Bluetooth / camera PPG) auto-fills this; manual overrides */}
      <div className="flex items-center gap-2.5">
        <input
          type="number"
          inputMode="numeric"
          value={heartRate}
          onChange={(e) => setHeartRate(e.target.value)}
          placeholder="Heart rate (bpm)"
          className={`flex-1 rounded-[14px] border-[1.5px] border-[#cdd9da] bg-white px-3.5 py-3 text-base text-[#16282b] outline-none focus:border-[#5b9aa6] ${numFont}`}
        />
        <SecondaryButton onClick={logReading} disabled={!hrValid} className="whitespace-nowrap px-4 py-3">
          Log{readings.length > 0 ? ` (${readings.length})` : ''}
        </SecondaryButton>
      </div>

      {/* symptom check */}
      <div className="flex flex-col gap-2.5 border-t border-[#dde7e7] pt-3">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-semibold text-[#3b4f52]">Symptom check now</span>
          <span
            className={`text-[16px] ${numFont}`}
            style={{ color: shouldStop ? '#d79a3a' : '#5b9aa6' }}
          >
            {currentSymptom}
            <span className="text-[11px] text-[#9bafb0]">/10</span>
          </span>
        </div>
        <SegmentBars
          value={currentSymptom}
          onChange={updateSymptom}
          variant="ramp"
          danger={shouldStop}
          ariaLabel="Current symptom level, 0 to 10"
        />
        <div className="flex items-center justify-between">
          <p className="m-0 text-[10.5px] leading-snug text-[#9bafb0]">
            Before you started: {preSymptom}/10
          </p>
          <span className="text-[10.5px] text-[#9bafb0]">adjust ↓</span>
        </div>
        <SegmentBars
          value={preSymptom}
          onChange={setPreSymptom}
          variant="flat"
          ariaLabel="Symptom level before you started, 0 to 10"
        />
      </div>

      {shouldStop && (
        <div className="rounded-[16px] border-[1.5px] border-[#d79a3a] bg-[#fbf2e1] px-3.5 py-3">
          <p className="m-0 text-[13px] font-bold leading-snug text-[#a06a1c]">
            Symptoms rose {symptomRise} points
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-[#8a6320]">
            That&apos;s the stop signal — finish the session here and rest.
          </p>
        </div>
      )}

      {!hasHrData && (
        <p className="m-0 text-center text-[11px] leading-snug text-[#9bafb0]">
          Enter or log at least one heart-rate reading to save this session.
        </p>
      )}

      <div className="flex gap-2.5">
        <SecondaryButton onClick={onCancel} className="flex-1 p-3.5">
          Cancel
        </SecondaryButton>
        <PrimaryButton
          onClick={completeSession}
          disabled={!hasHrData}
          className="flex-[1.4] rounded-[16px]"
        >
          Complete
        </PrimaryButton>
      </div>
    </section>
  )
}
