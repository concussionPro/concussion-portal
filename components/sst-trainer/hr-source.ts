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
 *  - 'manual'    → no live feed exists for this device; the patient enters
 *                  their heart rate. Apple Watch / Fitbit CANNOT broadcast the
 *                  standard BLE heart-rate profile at all, so they are manual on
 *                  every platform — web AND the native app.
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
  /** terse label for header/status chrome (NOT the long picker name) */
  statusLabel: string
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
 * The heart-rate paths, in the honesty order that matches the verified tier:
 *  - 'bluetooth' = the VERIFIED tier: any LIVE standard BLE heart-rate stream.
 *    Wrist wearables provide this in broadcast mode (Garmin "Broadcast Heart
 *    Rate", Polar watches, WHOOP Broadcast, Coros / Suunto / Amazfit) as well
 *    as chest straps — the browser chooser lists them all and the user picks
 *    theirs. Apple Watch and Fitbit cannot broadcast standard BLE HR → manual
 *    entry for those regardless of platform (their hardware never broadcasts;
 *    the native app doesn't change that — it only adds BLE pairing on iPhone
 *    for wearables that DO broadcast: Garmin, Polar, WHOOP, Coros, straps…).
 *  - 'camera' is a RESTING SPOT-CHECK only. Camera PPG is not valid during
 *    exercise (motion artefact), so it never feeds a live session and can never
 *    mark a session verified. Useful for a resting pulse before/after.
 *  - 'manual' is a first-class path, not a last resort: type each reading from
 *    any monitor (also the path for Apple Watch / Fitbit). Manual sessions
 *    still count for safety — they just never advance the band.
 */
export const HR_SOURCES: HrSource[] = [
  { id: 'bluetooth-hr', name: 'Watch or heart-rate sensor', method: 'Turn on your watch or strap broadcast, pair in one tap.', tag: 'Live HR', statusLabel: 'Bluetooth HR', connect: 'bluetooth', live: true, glyph: '◍', tint: '#d2463a' },
  { id: 'manual', name: 'Type it in yourself', method: 'Type each reading — Apple Watch & Fitbit too.', tag: 'Manual', statusLabel: 'Manual entry', connect: 'manual', live: false, glyph: '✎', tint: '#3c7681' },
  { id: 'phone-camera', name: 'Phone camera — resting only', method: 'Resting pulse before and after — not live tracking.', tag: 'Spot-check', statusLabel: 'Camera (resting)', connect: 'camera', live: true, camera: true, glyph: '◎', tint: '#5d7174' },
]

// Default to the manual clinician path: it always works with no hardware, so the
// app is usable end-to-end even when no wearable is present. The patient/clinician
// can switch to a live source in onboarding.
export const DEFAULT_HR_SOURCE = HR_SOURCES.find((s) => s.connect === 'manual') ?? HR_SOURCES[0]

export function hrSourceById(id: string | null | undefined): HrSource | null {
  if (!id) return null
  return HR_SOURCES.find((s) => s.id === id) ?? null
}

/**
 * True when running inside the native app shell (Capacitor on iOS / Android).
 *
 * This is the SAME signal `bluetoothSupported()` in lib/sst-trainer/hr-live.ts
 * uses to enable native BLE, exposed here so onboarding copy can adapt: inside
 * the native app the watch/Bluetooth path is FULLY available (including on
 * iPhone, where Apple ships no Web Bluetooth), so we drop the web-only "needs
 * our app / manual only" caveats. Safe on the server and in any browser — it
 * just returns false when Capacitor isn't present.
 */
export function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
  return !!cap?.isNativePlatform?.()
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
    let last = 0
    const unsubscribe = connection.subscribe((next) => {
      if (!Number.isFinite(next) || next <= 0) return
      last = Date.now()
      setBpm(Math.round(next))
      setStatus('streaming')
    })
    // Staleness watchdog: a BLE strap dropping out of range or a finger lifting
    // off the camera just STOPS emitting — the last bpm would otherwise freeze
    // on screen, still labelled "live". After STALE_MS with no new value, clear
    // the reading + fall back to 'connecting' (re-acquiring) so a dead feed is
    // never shown as a current heart rate. Never fabricate a bpm.
    const STALE_MS = 5000
    const watchdog = setInterval(() => {
      if (last && Date.now() - last > STALE_MS) {
        setBpm(null)
        setStatus('connecting')
      }
    }, 1000)
    return () => {
      unsubscribe()
      clearInterval(watchdog)
    }
  }, [connection])

  return { bpm, status, live: !!connection }
}
