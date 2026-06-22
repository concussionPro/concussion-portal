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
 * The three first-class heart-rate paths. Every wearable on the market reaches
 * the app through one of these — we don't brand-gate, because we can't and
 * don't need to:
 *  - 'bluetooth' covers ANY BLE heart-rate wearable. Polar, Wahoo, WHOOP, Garmin
 *    (HR broadcast), and every chest strap advertise the SAME standard Web
 *    Bluetooth heart-rate service; the browser chooser lists them all and the
 *    user picks theirs.
 *  - 'camera' streams live pulse via phone-camera PPG — no wearable needed.
 *  - 'manual' is the clinician fallback: when no wearable is available, HR is
 *    entered by hand (this is also the path for Apple Watch / Fitbit, which
 *    can't feed a live web page). It is a first-class choice, not a last resort.
 */
export const HR_SOURCES: HrSource[] = [
  { id: 'bluetooth-hr', name: 'Bluetooth HR monitor', method: 'Any BLE wearable — Polar, Wahoo, WHOOP, Garmin or chest strap', tag: 'Live HR', connect: 'bluetooth', live: true, glyph: '◍', tint: '#d2463a' },
  { id: 'phone-camera', name: 'Phone camera', method: 'Live pulse from the camera (PPG) — no wearable needed', tag: 'Live HR', connect: 'camera', live: true, camera: true, glyph: '◎', tint: '#5d7174' },
  { id: 'manual', name: 'Enter HR manually', method: 'Clinician enters it — also for Apple Watch / Fitbit', tag: 'Clinician', connect: 'manual', live: false, glyph: '✎', tint: '#3c7681' },
]

// Default to the manual clinician path: it always works with no hardware, so the
// app is usable end-to-end even when no wearable is present. The patient/clinician
// can switch to a live source in onboarding.
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
