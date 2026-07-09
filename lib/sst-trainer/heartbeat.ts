/**
 * SST Trainer — in-progress heartbeat persistence.
 *
 * A phone call 15 minutes into a 20-minute session (or mid graded test) kills
 * the page and loses everything. Both exertion screens write a lightweight
 * heartbeat (~every 5s) so a remount inside RESUME_WINDOW_MS can offer
 * "Resume / Discard". This is interruption RECOVERY of data the patient
 * already entered — never fabrication: only real readings/stages are stored
 * and restored, and stale heartbeats are discarded silently.
 *
 * Keys are namespaced beside the main store key (`sst:v1` in store.ts).
 */

export const SESSION_HEARTBEAT_KEY = 'sst:v1:heartbeat:session'
export const TEST_HEARTBEAT_KEY = 'sst:v1:heartbeat:test'

/** Heartbeats older than this are silently discarded on load. */
export const RESUME_WINDOW_MS = 30 * 60_000

interface Envelope<T> {
  savedAt: number
  data: T
}

function storageAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.localStorage
  } catch {
    return false
  }
}

/** Overwrite the heartbeat for `key`. Best-effort (quota / private mode). */
export function saveHeartbeat<T>(key: string, data: T): void {
  if (!storageAvailable()) return
  try {
    const env: Envelope<T> = { savedAt: Date.now(), data }
    window.localStorage.setItem(key, JSON.stringify(env))
  } catch {
    /* best-effort */
  }
}

/**
 * Load a live heartbeat. Returns null — and clears the key — when nothing is
 * stored, the blob is corrupt, or it is older than RESUME_WINDOW_MS.
 */
export function loadHeartbeat<T>(key: string): { savedAt: number; data: T } | null {
  if (!storageAvailable()) return null
  let raw: string | null = null
  try {
    raw = window.localStorage.getItem(key)
  } catch {
    return null
  }
  if (!raw) return null
  try {
    const env = JSON.parse(raw) as Envelope<T> | null
    if (
      !env ||
      typeof env !== 'object' ||
      typeof env.savedAt !== 'number' ||
      env.data == null ||
      Date.now() - env.savedAt > RESUME_WINDOW_MS
    ) {
      clearHeartbeat(key)
      return null
    }
    return { savedAt: env.savedAt, data: env.data }
  } catch {
    clearHeartbeat(key)
    return null
  }
}

export function clearHeartbeat(key: string): void {
  if (!storageAvailable()) return
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* best-effort */
  }
}
