'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Multi-device heart-rate sourcing for the Sub-Symptom-Threshold Trainer.
 *
 * The same six sources surfaced on the public "Get the app" page
 * (app/app/page.tsx DEVICES) — modelled here as a typed pairing target plus a
 * live-HR feed hook so the device the patient pairs in onboarding actually
 * drives the threshold test and training screens.
 *
 * In the native app these resolve to HealthKit / Connect IQ / Web-Bluetooth /
 * camera-PPG feeds. In the web preview the live sources stream a simulated bpm
 * (so the end-to-end flow functions for every device); the one sync-only source
 * (Fitbit) falls back to manual entry, exactly as it would in production.
 */
export interface HrSource {
  id: string
  name: string
  method: string
  /** short status tag shown on the device chip */
  tag: string
  /** true = streams live HR into the app; false = syncs after the session (manual entry meanwhile) */
  live: boolean
  /** phone-camera PPG fallback (longer "connecting" warm-up, no wearable needed) */
  camera?: boolean
  glyph: string
  tint: string
}

/** Mirrors the DEVICES array on the marketing page, in pairing-priority order. */
export const HR_SOURCES: HrSource[] = [
  { id: 'apple-watch', name: 'Apple Watch', method: 'On-watch · HealthKit', tag: 'Live HR', live: true, glyph: '⌚', tint: '#1d2325' },
  { id: 'garmin', name: 'Garmin', method: 'Connect IQ · on-watch', tag: 'Live HR', live: true, glyph: '⌚', tint: '#0b7fab' },
  { id: 'whoop', name: 'WHOOP', method: 'Bluetooth HR broadcast', tag: 'Live HR', live: true, glyph: '▬', tint: '#0f172a' },
  { id: 'polar-wahoo', name: 'Polar / Wahoo', method: 'Bluetooth chest strap', tag: 'Most accurate', live: true, glyph: '◍', tint: '#d2463a' },
  { id: 'fitbit', name: 'Fitbit', method: 'Web API sync', tag: 'Syncs after', live: false, glyph: '◆', tint: '#3c7681' },
  { id: 'phone-camera', name: 'Phone camera', method: 'Camera PPG · no wearable', tag: 'Live HR', live: true, camera: true, glyph: '◎', tint: '#5d7174' },
]

export const DEFAULT_HR_SOURCE = HR_SOURCES[0]

export function hrSourceById(id: string | null | undefined): HrSource | null {
  if (!id) return null
  return HR_SOURCES.find((s) => s.id === id) ?? null
}

export type HrStatus = 'idle' | 'connecting' | 'streaming' | 'manual'

/** Shape of the live feed each consuming screen reads. */
export interface HrFeed {
  bpm: number | null
  status: HrStatus
  live: boolean
}

interface FeedOpts {
  /** hold mode mean-reverts toward this bpm (training); omit for a ramp (threshold test) */
  target?: number
  /** ramp mode seed bpm */
  baseline?: number
  /** ramp mode climb per second */
  climbPerTick?: number
  /** hold mode wander amplitude */
  wander?: number
}

/**
 * Live-HR feed for a paired source.
 *
 * - live wearables → brief connect, then a streaming bpm.
 * - phone camera   → longer warm-up (PPG lock), then a streaming bpm.
 * - sync-only (Fitbit) / no source → `manual` (consumer keeps manual entry).
 *
 * `phase` is part of the dependency list so switching test ('ramp') → training
 * ('hold') reseeds the feed; numeric tuning is read live from a ref so changing
 * the training target mid-session doesn't tear down the interval.
 */
export function useLiveHr(
  source: HrSource | null,
  active: boolean,
  phase: 'ramp' | 'hold',
  opts: FeedOpts = {},
): HrFeed {
  const [bpm, setBpm] = useState<number | null>(null)
  const [status, setStatus] = useState<HrStatus>('idle')
  const optsRef = useRef(opts)
  optsRef.current = opts
  const valRef = useRef<number | null>(null)

  useEffect(() => {
    if (!source || !active) {
      setStatus('idle')
      setBpm(null)
      valRef.current = null
      return
    }
    if (!source.live) {
      // sync-only device — no live stream; consumer keeps manual entry.
      setStatus('manual')
      setBpm(null)
      return
    }

    setStatus('connecting')
    const connectMs = source.camera ? 2400 : 800
    let interval: ReturnType<typeof setInterval> | undefined

    const warmup = setTimeout(() => {
      setStatus('streaming')
      const o = optsRef.current
      valRef.current = (phase === 'hold' ? o.target : o.baseline) ?? 96
      setBpm(Math.round(valRef.current))
      interval = setInterval(() => {
        const oo = optsRef.current
        let v = valRef.current ?? (phase === 'hold' ? oo.target ?? 120 : oo.baseline ?? 96)
        if (phase === 'hold') {
          const target = oo.target ?? 120
          const wander = oo.wander ?? 5
          v += (target - v) * 0.25 + (Math.random() * 2 - 1) * wander
        } else {
          v += (oo.climbPerTick ?? 0.9) + (Math.random() * 2 - 1) * 1.4
        }
        v = Math.max(58, Math.min(190, v))
        valRef.current = v
        setBpm(Math.round(v))
      }, 1000)
    }, connectMs)

    return () => {
      clearTimeout(warmup)
      if (interval) clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, active, phase])

  return { bpm, status, live: !!source?.live }
}
