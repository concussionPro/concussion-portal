'use client'

import { useEffect, useRef, useState } from 'react'
import {
  isVerifiedReading,
  sessionVerification,
  SESSION_STOP_RISE,
  type Prescription,
  type SessionLog,
} from '@/lib/sst-trainer/protocol'
import type { HrConnectKind } from './hr-source'
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

/**
 * Zone gauge. Band arc = lower..upper; the red LIMIT tick marks the measured
 * HRt (the do-not-exceed line). `hr === null` renders no needle — a dropped
 * sensor shows dashes, never a frozen number.
 */
function TrainGauge({
  lo,
  up,
  limit,
  hr,
  color,
}: {
  lo: number
  up: number
  limit: number
  hr: number | null
  color: string
}) {
  const min = lo - 30
  const max = Math.max(up, limit) + 20
  const cx = 118
  const cy = 120
  const R = 92
  const A = (v: number) => -135 + ((Math.max(min, Math.min(max, v)) - min) / (max - min)) * 270
  const [mx1, my1] = pt(cx, cy, R + 6, A(limit))
  const [mx2, my2] = pt(cx, cy, R + 16, A(limit))
  const [lx, ly] = pt(cx, cy, R + 27, A(limit))
  return (
    <svg viewBox="0 0 236 226" className="block h-full w-full">
      <path d={arc(cx, cy, R, -135, 135)} fill="none" stroke="#dde7e7" strokeWidth={11} strokeLinecap="round" />
      <path d={arc(cx, cy, R, A(lo), A(up))} fill="none" stroke="#5b9aa6" strokeWidth={13} strokeLinecap="round" />
      {hr !== null && hr > up && (
        <path d={arc(cx, cy, R, A(up), A(hr))} fill="none" stroke={hr >= limit ? '#d2463a' : '#d79a3a'} strokeWidth={13} strokeLinecap="round" />
      )}
      <line x1={mx1} y1={my1} x2={mx2} y2={my2} stroke="#d2463a" strokeWidth={2.5} strokeLinecap="round" />
      <text x={lx} y={ly + 3} fill="#d2463a" fontSize={9} fontWeight={700} textAnchor="middle">
        LIMIT
      </text>
      {hr !== null && (
        <>
          <line
            x1={pt(cx, cy, R - 22, A(hr))[0]}
            y1={pt(cx, cy, R - 22, A(hr))[1]}
            x2={pt(cx, cy, R, A(hr))[0]}
            y2={pt(cx, cy, R, A(hr))[1]}
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
          />
          <circle cx={pt(cx, cy, R, A(hr))[0]} cy={pt(cx, cy, R, A(hr))[1]} r={8} fill="#fff" stroke={color} strokeWidth={4} />
        </>
      )}
    </svg>
  )
}

type Zone = 'none' | 'below' | 'in' | 'over' | 'limit'
type Phase = 'active' | 'stopped' | 'summary'

/** Everything the page needs to sync an abandoned (cancelled) session. */
export interface AbandonInfo {
  elapsedSec: number
  readingCount: number
  preSymptom: number
  currentSymptom: number
}

export default function TrainingSession({
  rx,
  onComplete,
  onCancel,
  liveHr = null,
  hrSourceLabel,
  hrStatus = 'manual',
  hrConnect = 'manual',
}: {
  rx: Prescription
  onComplete: (log: SessionLog) => void
  /** leave WITHOUT a session log — the page syncs this as an abandoned session */
  onCancel: (info: AbandonInfo) => void
  /** live bpm from a paired Bluetooth stream (null = manual entry) */
  liveHr?: number | null
  /** paired source name, e.g. "Polar H10" */
  hrSourceLabel?: string
  /** feed state for the live/connecting/manual chip */
  hrStatus?: 'idle' | 'connecting' | 'streaming' | 'manual'
  /** how the HR source connects — only 'bluetooth' can ever verify a session */
  hrConnect?: HrConnectKind
}) {
  const [phase, setPhase] = useState<Phase>('active')
  const [preSymptom, setPreSymptom] = useState(0)
  const [currentSymptom, setCurrentSymptom] = useState(0)
  const [peakSymptom, setPeakSymptom] = useState(0)
  const [heartRate, setHeartRate] = useState('')
  const [manualLogs, setManualLogs] = useState(0)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [adjustBaseline, setAdjustBaseline] = useState(false)
  const [confirmContinue, setConfirmContinue] = useState(false)
  const [endFeel, setEndFeel] = useState<'same' | 'better' | 'worse' | null>(null)
  const [zoneToast, setZoneToast] = useState<'ease-off' | 'back-in' | null>(null)

  // ── session clock: Date.now()-based countdown, immune to timer throttling ──
  // Start + now live in ONE state cell, only ever written from the interval
  // callback (render stays pure). Until the first ~300ms tick the display
  // simply shows the full prescribed time.
  const totalMs = rx.sessionMinutes * 60_000
  const [clock, setClock] = useState<{ start: number; now: number } | null>(null)
  useEffect(() => {
    if (phase === 'summary') return // freeze the clock on the summary screen
    const iv = setInterval(() => {
      setClock((c) => {
        const now = Date.now()
        return c ? { start: c.start, now } : { start: now, now }
      })
    }, 300)
    return () => clearInterval(iv)
  }, [phase])
  const elapsedMs = clock ? Math.min(clock.now - clock.start, totalMs) : 0
  const remainingMs = clock ? Math.max(0, totalMs - (clock.now - clock.start)) : totalMs

  // ── wake lock: keep the screen alive mid-session; graceful no-op elsewhere ──
  useEffect(() => {
    let sentinel: WakeLockSentinel | null = null
    let cancelled = false
    const acquire = async () => {
      try {
        const wl = (navigator as Navigator & { wakeLock?: WakeLock }).wakeLock
        if (!wl) return
        const s = await wl.request('screen')
        if (cancelled) void s.release().catch(() => {})
        else sentinel = s
      } catch {
        /* unsupported / denied — the screen may sleep, everything still works */
      }
    }
    void acquire()
    const onVis = () => {
      if (document.visibilityState === 'visible') void acquire()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVis)
      try {
        void sentinel?.release().catch(() => {})
      } catch {
        /* already released */
      }
    }
  }, [])

  // Live source drives the gauge; a manual override must stick (not be wiped by
  // the next live emission). Only auto-fill when empty or still showing the last
  // streamed value. STALE-FEED RULE: when the feed drops, CLEAR the field if it
  // still shows the last live value — dashes on the gauge, never a frozen number.
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
    } else {
      setHeartRate((cur) => (cur !== '' && cur === lastLiveRef.current ? '' : cur))
    }
  }, [liveHr])

  const hrValue = heartRate.trim() === '' ? null : Number(heartRate)
  // Physiologic plausibility cap — a fat-finger must not drive the zone gauge.
  const hrValid = hrValue !== null && Number.isFinite(hrValue) && hrValue >= 30 && hrValue <= 240
  const gaugeHr = hrValid ? (hrValue as number) : null

  // zone off the current reading — 'limit' = at/over the measured HRt
  const zone: Zone = !hrValid
    ? 'none'
    : (hrValue as number) >= rx.hrt
      ? 'limit'
      : (hrValue as number) > rx.upperBpm
        ? 'over'
        : (hrValue as number) < rx.lowerBpm
          ? 'below'
          : 'in'
  const zoneMeta = {
    none: { color: '#7d9092', bg: '#eef4f4', label: hrStatus === 'connecting' ? 'Signal dropped — reconnecting' : 'Enter your heart rate', icon: '●' },
    in: { color: '#5b9aa6', bg: '#e7f2f3', label: 'In your band', icon: '●' },
    over: { color: '#d79a3a', bg: '#fbf2e1', label: 'Ease off', icon: '▲' },
    limit: { color: '#d2463a', bg: '#fbeae8', label: 'Stop — over your limit', icon: '▲' },
    below: { color: '#7d9092', bg: '#eef4f4', label: 'Below band — lift a little', icon: '▼' },
  }[zone]

  // ── zone alerts: haptic + visual on band exit AND re-entry ─────────────────
  const prevZoneRef = useRef<Zone>('none')
  useEffect(() => {
    const prev = prevZoneRef.current
    prevZoneRef.current = zone
    if (phase !== 'active') return
    if (zone === prev) return
    if ((zone === 'over' || zone === 'limit') && prev !== 'over' && prev !== 'limit') {
      try {
        navigator.vibrate?.([140, 60, 140]) // strong: you crossed above your band
      } catch { /* no haptics */ }
      setZoneToast('ease-off')
      const t = setTimeout(() => setZoneToast(null), 2500)
      return () => clearTimeout(t)
    }
    if (zone === 'in' && (prev === 'over' || prev === 'limit')) {
      try {
        navigator.vibrate?.(80) // single soft buzz: back in band
      } catch { /* no haptics */ }
      setZoneToast('back-in')
      const t = setTimeout(() => setZoneToast(null), 2000)
      return () => clearTimeout(t)
    }
  }, [zone, phase])

  // ── continuous sampling: time-in-zone + verified readings, 1/sec ───────────
  const readingsRef = useRef<Array<{ bpm: number; verified: boolean }>>([])
  const zoneSecondsRef = useRef({ below: 0, in: 0, above: 0 })
  const latestRef = useRef({ hrValue, hrValid, liveHr, hrStatus, zone })
  useEffect(() => {
    // keep the sampler's view fresh without resetting its interval
    latestRef.current = { hrValue, hrValid, liveHr, hrStatus, zone }
  })
  useEffect(() => {
    if (phase === 'summary') return
    const iv = setInterval(() => {
      const d = latestRef.current
      if (!d.hrValid || d.hrValue === null) return
      readingsRef.current.push({
        bpm: d.hrValue,
        verified: isVerifiedReading(d.hrValue, d.liveHr ?? null, d.hrStatus === 'streaming'),
      })
      if (d.zone === 'below') zoneSecondsRef.current.below += 1
      else if (d.zone === 'in') zoneSecondsRef.current.in += 1
      else if (d.zone === 'over' || d.zone === 'limit') zoneSecondsRef.current.above += 1
    }, 1000)
    return () => clearInterval(iv)
  }, [phase])

  // SESSION_STOP_RISE rule: stop if symptoms rise >= 2 points from pre-session.
  // A rise is a STOP, not a suggestion — the flow moves to the stopped screen.
  // One "I feel okay, continue" override is allowed ONCE; any further rise after
  // the override re-stops with no second chance.
  const [override, setOverride] = useState<{ used: boolean; atScore: number }>({ used: false, atScore: 0 })
  const symptomRise = currentSymptom - preSymptom
  useEffect(() => {
    if (phase !== 'active') return
    const risen = symptomRise >= SESSION_STOP_RISE
    if (!risen) return
    if (override.used && currentSymptom <= override.atScore) return // overridden at this level
    setPhase('stopped')
  }, [symptomRise, currentSymptom, phase, override])

  const updateSymptom = (v: number) => {
    setCurrentSymptom(v)
    setPeakSymptom((p) => Math.max(p, v))
  }

  const logReading = () => {
    if (!hrValid || hrValue === null) return
    readingsRef.current.push({
      bpm: hrValue,
      verified: isVerifiedReading(hrValue, liveHr ?? null, hrStatus === 'streaming'),
    })
    setManualLogs((n) => n + 1)
  }

  // ── finishing ───────────────────────────────────────────────────────────────
  // The summary is a SNAPSHOT taken at finish time (readings + zone-seconds live
  // in refs while sampling; render never touches them directly).
  const [summary, setSummary] = useState<{
    symptomLimited: boolean
    avg: number | null
    peak: number | null
    hrVerified: boolean
    verifiedReadingPct: number
    zones: { below: number; in: number; above: number }
  } | null>(null)
  const finishSession = (symptomLimited: boolean) => {
    const all = readingsRef.current
    const { hrVerified, verifiedReadingPct } = sessionVerification(all, hrConnect)
    setSummary({
      symptomLimited,
      avg: all.length ? Math.round(all.reduce((a, b) => a + b.bpm, 0) / all.length) : null,
      peak: all.length ? Math.max(...all.map((r) => r.bpm)) : null,
      hrVerified,
      verifiedReadingPct,
      zones: { ...zoneSecondsRef.current },
    })
    setPhase('summary')
  }

  // auto-finish when the prescribed time runs out
  useEffect(() => {
    if (phase === 'active' && remainingMs <= 0) finishSession(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingMs, phase])

  const buildLog = (): SessionLog => {
    const s = summary
    return {
      date: new Date().toLocaleDateString('en-AU', { month: 'short', day: 'numeric' }),
      avgHeartRate: s?.avg ?? 0,
      peakHeartRate: s?.peak ?? 0,
      preSymptom,
      peakSymptom: Math.max(peakSymptom, currentSymptom),
      // record actual time on the screen — never substitute the prescribed
      // target, which would fabricate adherence for a session cut short.
      completedMinutes: Math.round(elapsedMs / 60000),
      hrVerified: s?.hrVerified ?? false,
      verifiedReadingPct: s?.verifiedReadingPct ?? 0,
      symptomLimited: s?.symptomLimited ?? false,
      overrodeStop: override.used,
      endFeel: endFeel ?? undefined,
      secondsBelow: s?.zones.below ?? 0,
      secondsIn: s?.zones.in ?? 0,
      secondsAbove: s?.zones.above ?? 0,
    }
  }

  const mm = String(Math.floor(remainingMs / 60000)).padStart(2, '0')
  const ss = String(Math.floor((remainingMs % 60000) / 1000)).padStart(2, '0')

  // ── STOPPED: the symptom-rise stop screen ───────────────────────────────────
  if (phase === 'stopped') {
    const canOverride = !override.used
    return (
      <section className="flex min-h-[60vh] flex-col justify-center gap-4 pt-1">
        <div className="rounded-[18px] border-2 border-[#d79a3a] bg-[#fbf2e1] px-4 py-4">
          <p className="m-0 text-[17px] font-extrabold leading-snug text-[#a06a1c]">
            Your symptoms rose {symptomRise} points.
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-[#8a6320]">
            That&rsquo;s the stop signal. Finish the session here and rest — this still counts, and
            your clinician will see why it ended.
          </p>
        </div>

        <PrimaryButton onClick={() => finishSession(true)} className="rounded-[18px] py-[17px] text-base">
          Finish session
        </PrimaryButton>

        {canOverride && !confirmContinue && (
          <button
            type="button"
            onClick={() => setConfirmContinue(true)}
            className="rounded-[14px] p-2.5 text-[13px] font-semibold text-[#7d9092] transition active:scale-[0.98]"
          >
            I feel okay — continue
          </button>
        )}
        {canOverride && confirmContinue && (
          <div className="rounded-[16px] border-[1.5px] border-[#cdd9da] bg-white px-3.5 py-3">
            <p className="m-0 text-[12.5px] leading-snug text-[#3b4f52]">
              Continue for the rest of the session? This is a one-time choice — if your symptoms
              rise again, the session ends. Your clinician will see that you continued.
            </p>
            <div className="mt-2.5 flex gap-2">
              <SecondaryButton onClick={() => setConfirmContinue(false)} className="flex-1 p-2.5 text-[12.5px]">
                No — finish
              </SecondaryButton>
              <button
                type="button"
                onClick={() => {
                  setOverride({ used: true, atScore: currentSymptom })
                  setConfirmContinue(false)
                  setPhase('active')
                }}
                className="flex-1 rounded-2xl bg-[#d79a3a] p-2.5 text-[12.5px] font-bold text-white transition active:scale-[0.98]"
              >
                Yes — continue
              </button>
            </div>
          </div>
        )}
      </section>
    )
  }

  // ── SUMMARY ─────────────────────────────────────────────────────────────────
  if (phase === 'summary' && summary) {
    const avg = summary.avg
    const peak = summary.peak
    const hrVerified = summary.hrVerified
    const z = summary.zones
    const zTotal = Math.max(1, z.below + z.in + z.above)
    const symptomLimited = summary.symptomLimited
    const minutes = Math.round(elapsedMs / 60000)
    return (
      <section className="flex flex-col gap-4 pt-1.5">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-[#16282b]">
            Session done
          </h1>
          <p className="m-0 text-[13px] leading-snug text-[#5d7174]">
            {symptomLimited
              ? 'Ended on the symptom stop rule — the right call. Rest now.'
              : `${minutes} minute${minutes === 1 ? '' : 's'} in the bank.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {hrVerified && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e7f2e4] px-3 py-1.5 text-[11px] font-bold text-[#3c7a1f]">
              ✓ Verified — live heart rate tracked
            </span>
          )}
          {symptomLimited && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fbf2e1] px-3 py-1.5 text-[11px] font-bold text-[#a06a1c]">
              Symptom-limited
            </span>
          )}
        </div>

        {/* time-in-band bar */}
        <div className="rounded-[16px] border border-[#dde7e7] bg-white px-4 py-3.5">
          <span className="text-xs font-bold text-[#3b4f52]">Time in band</span>
          <div className="mt-2.5 flex h-3.5 w-full overflow-hidden rounded-full bg-[#eef4f4]">
            <div style={{ width: `${(z.below / zTotal) * 100}%`, background: '#cdd9da' }} />
            <div style={{ width: `${(z.in / zTotal) * 100}%`, background: '#5b9aa6' }} />
            <div style={{ width: `${(z.above / zTotal) * 100}%`, background: '#d79a3a' }} />
          </div>
          <div className={`mt-2 flex justify-between text-[10.5px] text-[#7d9092] ${numFont}`}>
            <span>below {Math.round(z.below / 60)}m</span>
            <span className="font-bold text-[#3c7681]">in band {Math.round(z.in / 60)}m</span>
            <span>above {Math.round(z.above / 60)}m</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-[14px] border border-[#dde7e7] bg-white px-3 py-2.5">
            <span className="text-[10px] font-medium text-[#849c9c]">Avg HR</span>
            <div className={`mt-0.5 text-[17px] text-[#16282b] ${numFont}`}>{avg ?? '—'}</div>
          </div>
          <div className="rounded-[14px] border border-[#dde7e7] bg-white px-3 py-2.5">
            <span className="text-[10px] font-medium text-[#849c9c]">Peak HR</span>
            <div className={`mt-0.5 text-[17px] text-[#16282b] ${numFont}`}>{peak ?? '—'}</div>
          </div>
          <div className="rounded-[14px] border border-[#dde7e7] bg-white px-3 py-2.5">
            <span className="text-[10px] font-medium text-[#849c9c]">Symptoms</span>
            <div className={`mt-0.5 text-[17px] text-[#16282b] ${numFont}`}>
              {preSymptom}→{Math.max(peakSymptom, currentSymptom)}
            </div>
          </div>
        </div>

        {/* end-of-session self-report — one tap, inline */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-[#3b4f52]">
            Compared to before the session, how do you feel?
          </span>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ['better', 'Better'],
                ['same', 'Same'],
                ['worse', 'Worse'],
              ] as const
            ).map(([id, label]) => {
              const on = endFeel === id
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setEndFeel(id)}
                  className={`rounded-[14px] border-[1.5px] px-3 py-3.5 text-[14px] font-bold transition active:scale-[0.98] ${
                    on
                      ? 'border-[#5b9aa6] bg-[#e7f2f3] text-[#16243f]'
                      : 'border-[#d4e0e1] bg-white text-[#3b4f52]'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        <PrimaryButton
          disabled={endFeel === null}
          onClick={() => onComplete(buildLog())}
          className="rounded-[18px] py-[17px] text-base"
        >
          {endFeel === null ? 'Tap one above to save' : 'Save session'}
        </PrimaryButton>
      </section>
    )
  }

  // ── ACTIVE ──────────────────────────────────────────────────────────────────
  return (
    <section className="flex flex-col gap-3.5 pt-1">
      <div className="flex items-center justify-between">
        <h1 className="m-0 text-[18px] font-extrabold leading-none tracking-[-0.02em]">Session</h1>
        <span className={`text-[15px] font-bold text-[#3c7681] ${numFont}`}>
          {mm}:{ss}
          <span className="ml-1 text-[10px] font-semibold text-[#9bafb0]">left</span>
        </span>
      </div>

      <div className="flex items-center justify-center gap-1.5 rounded-full bg-[#eef4f4] px-3 py-2 text-[11.5px] font-semibold text-[#3c7681]">
        <span className="h-[7px] w-[7px] rounded-full bg-[#5b9aa6]" />
        Target {rx.lowerBpm}–{rx.upperBpm} bpm · {rx.sessionMinutes} min
      </div>

      {hrStatus === 'streaming' ? (
        <div className="-mt-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#3c7a1f]">
          <span className="inline-block h-[7px] w-[7px] animate-pulse rounded-full bg-[#3c7a1f]" />
          {hrSourceLabel ?? 'Watch'} · streaming live
        </div>
      ) : hrStatus === 'connecting' ? (
        <div className="-mt-1 text-center text-[11px] font-semibold text-[#b58a32]">
          Signal dropped — reconnecting {hrSourceLabel ?? 'your device'}…
        </div>
      ) : null}

      {/* persistent red banner at/over the do-not-exceed line */}
      {zone === 'limit' && (
        <div className="rounded-[14px] border-2 border-[#d2463a] bg-[#fbeae8] px-3.5 py-3 text-center">
          <p className="m-0 text-[14px] font-extrabold leading-snug text-[#b1392e]">
            Stop — over your limit
          </p>
          <p className="m-0 mt-0.5 text-[11.5px] leading-snug text-[#8a4036]">
            Slow right down until you&rsquo;re back under {rx.upperBpm} bpm.
          </p>
        </div>
      )}
      {/* transient band-exit / re-entry cues */}
      {zone !== 'limit' && zoneToast === 'ease-off' && (
        <div className="animate-pulse rounded-[14px] border-2 border-[#d79a3a] bg-[#fbf2e1] px-3.5 py-2.5 text-center">
          <p className="m-0 text-[13px] font-extrabold text-[#a06a1c]">Ease off</p>
        </div>
      )}
      {zoneToast === 'back-in' && (
        <div className="rounded-[14px] border border-[#5b9aa6] bg-[#e7f2f3] px-3.5 py-2.5 text-center">
          <p className="m-0 text-[13px] font-bold text-[#3c7681]">Back in band</p>
        </div>
      )}

      {/* hero gauge — dashes when no fresh reading, never a frozen number */}
      <div className="relative mx-auto mt-0.5 h-[226px] w-[236px]">
        <TrainGauge lo={rx.lowerBpm} up={rx.upperBpm} limit={rx.hrt} hr={gaugeHr} color={zoneMeta.color} />
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

      {/* Manual HR entry exists ONLY for the manual/camera tiers chosen at
          onboarding. With a live paired sensor the gauge IS the reading —
          a typed number next to it is clutter and an integrity risk. */}
      {hrConnect !== 'bluetooth' && (
        <div className="flex items-center gap-2.5">
          <input
            type="number"
            inputMode="numeric"
            value={heartRate}
            onChange={(e) => setHeartRate(e.target.value)}
            placeholder="Heart rate (bpm)"
            className={`min-w-0 flex-1 rounded-[14px] border-[1.5px] border-[#cdd9da] bg-white px-3.5 py-3 text-base text-[#16282b] outline-none focus:border-[#5b9aa6] ${numFont}`}
          />
          <SecondaryButton onClick={logReading} disabled={!hrValid} className="whitespace-nowrap px-4 py-3">
            Log{manualLogs > 0 ? ` (${manualLogs})` : ''}
          </SecondaryButton>
        </div>
      )}

      {/* symptom check — same aligned pattern as the guided test: label row,
          then one flat strip sharing the container edges. The baseline strip is
          collapsed behind "adjust" — two stacked full-width bar rows read as a
          broken layout and the baseline is rarely touched mid-session. */}
      <div className="flex flex-col gap-2.5 border-t border-[#dde7e7] pt-3">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-semibold text-[#3b4f52]">Symptom check now</span>
          <span
            className={`text-[16px] ${numFont}`}
            style={{ color: symptomRise >= SESSION_STOP_RISE ? '#d79a3a' : '#5b9aa6' }}
          >
            {currentSymptom}
            <span className="text-[11px] text-[#9bafb0]">/10</span>
          </span>
        </div>
        <SegmentBars
          value={currentSymptom}
          onChange={updateSymptom}
          variant="flat"
          danger={symptomRise >= SESSION_STOP_RISE}
          ariaLabel="Current symptom level, 0 to 10"
        />
        <div className="flex items-center justify-between">
          <p className="m-0 text-[10.5px] leading-snug text-[#9bafb0]">
            Before you started: {preSymptom}/10
          </p>
          <button
            type="button"
            onClick={() => setAdjustBaseline((v) => !v)}
            aria-expanded={adjustBaseline}
            className="text-[10.5px] font-semibold text-[#3c7681] underline decoration-[#a7c7cc] underline-offset-2"
          >
            {adjustBaseline ? 'done' : 'adjust'}
          </button>
        </div>
        {adjustBaseline && (
          <SegmentBars
            value={preSymptom}
            onChange={setPreSymptom}
            variant="flat"
            ariaLabel="Symptom level before you started, 0 to 10"
          />
        )}
      </div>

      {/* cancel confirm — leaving is never a silent discard */}
      {confirmCancel && (
        <div className="rounded-[16px] border-[1.5px] border-[#cdd9da] bg-white px-3.5 py-3">
          <p className="m-0 text-[12.5px] leading-snug text-[#3b4f52]">
            Leave without saving? Your clinician will see the session was cut short.
          </p>
          <div className="mt-2.5 flex gap-2">
            <SecondaryButton onClick={() => setConfirmCancel(false)} className="flex-1 p-2.5 text-[12.5px]">
              Stay
            </SecondaryButton>
            <button
              type="button"
              onClick={() =>
                onCancel({
                  elapsedSec: Math.round(elapsedMs / 1000),
                  readingCount: readingsRef.current.length,
                  preSymptom,
                  currentSymptom,
                })
              }
              className="flex-1 rounded-2xl bg-[#d2463a] p-2.5 text-[12.5px] font-bold text-white transition active:scale-[0.98]"
            >
              Leave
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2.5">
        <SecondaryButton onClick={() => setConfirmCancel(true)} className="flex-1 p-3.5">
          Cancel
        </SecondaryButton>
        <PrimaryButton onClick={() => finishSession(false)} className="flex-[1.4] rounded-[16px]">
          Finish early
        </PrimaryButton>
      </div>
    </section>
  )
}
