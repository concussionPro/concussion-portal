'use client'

import { useEffect, useState } from 'react'
import type { LiveHrConnection } from '@/lib/sst-trainer/hr-live'

/**
 * Heart-rate sourcing for the Sub-Symptom-Threshold Trainer.
 *
 * The pairing targets the patient can choose in onboarding. Each one declares
 * HOW it actually connects in a web app:
 *  - 'bluetooth' → Web Bluetooth heart-rate profile (real strap / sensor)
 *  - 'camera'    → rear-camera PPG (real pulse from the phone camera)
 *  - 'manual'    → no live web feed exists for this device; the patient enters
 *                  their heart rate (Apple Watch / Fitbit do NOT expose live HR
 *                  to a web page).
 *
 * The live bpm is ONLY ever produced by a real `LiveHrConnection`
 * (see lib/sst-trainer/hr-live.ts). There is no simulated heart rate.
 */
export type HrConnectKind = 'bluetooth' | 'camera' | 'manual'

export interface HrSource {
  id: string
  name: string
  method: string
  /** short status tag shown on the device chip */
  tag: string
  /** how this source actually connects in a web app */
  connect: HrConnectKind
  /** true = streams live HR into the app; false = manual entry */
  live: boolean
  /** phone-camera PPG (no wearable needed) */
  camera?: boolean
  glyph: string
  tint: string
}

/**
 * Pairing targets, in priority order. Capability-honest:
 *  - Polar/Wahoo, WHOOP, Garmin all stream over the SAME Web Bluetooth heart-
 *    rate profile (the browser chooser shows every HR sensor; the user picks
 *    theirs — we can't brand-filter).
 *  - Phone camera streams via camera PPG.
 *  - Apple Watch / Fitbit can't feed a web page live, so they're manual entry.
 */
export const HR_SOURCES: HrSource[] = [
  { id: 'polar-wahoo', name: 'Bluetooth HR strap', method: 'Polar · Wahoo · any BLE strap', tag: 'Live HR', connect: 'bluetooth', live: true, glyph: '◍', tint: '#d2463a' },
  { id: 'phone-camera', name: 'Phone camera', method: 'Camera PPG · no wearable', tag: 'Live HR', connect: 'camera', live: true, camera: true, glyph: '◎', tint: '#5d7174' },
  { id: 'whoop', name: 'WHOOP', method: 'Bluetooth HR broadcast', tag: 'Live HR', connect: 'bluetooth', live: true, glyph: '▬', tint: '#0f172a' },
  { id: 'garmin', name: 'Garmin', method: 'Bluetooth HR broadcast', tag: 'Live HR', connect: 'bluetooth', live: true, glyph: '⌚', tint: '#0b7fab' },
  { id: 'apple-watch', name: 'Apple Watch', method: 'Pair a strap or use the camera', tag: 'Manual', connect: 'manual', live: false, glyph: '⌚', tint: '#1d2325' },
  { id: 'fitbit', name: 'Fitbit', method: 'Syncs after · enter HR', tag: 'Manual', connect: 'manual', live: false, glyph: '◆', tint: '#3c7681' },
]

export const DEFAULT_HR_SOURCE = HR_SOURCES.find((s) => s.connect === 'manual') ?? HR_SOURCES[0]

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

/**
 * Live-HR feed for a REAL paired connection.
 *
 *  - no connection            → 'manual' (consumer uses manual entry).
 *  - connection, no bpm yet   → 'connecting'.
 *  - first real bpm received  → 'streaming'.
 *
 * The connection's lifecycle (creation on a user gesture, stop() on
 * teardown/device-change) is owned by the page; this hook only subscribes.
 */
export function useLiveHr(connection: LiveHrConnection | null): HrFeed {
  const [bpm, setBpm] = useState<number | null>(null)
  const [status, setStatus] = useState<HrStatus>('manual')

  useEffect(() => {
    if (!connection) {
      setBpm(null)
      setStatus('manual')
      return
    }
    setBpm(null)
    setStatus('connecting')
    const unsubscribe = connection.subscribe((next) => {
      if (!Number.isFinite(next) || next <= 0) return
      setBpm(Math.round(next))
      setStatus('streaming')
    })
    return unsubscribe
  }, [connection])

  return { bpm, status, live: !!connection }
}
