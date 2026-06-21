/**
 * Real heart-rate connections for the Sub-Symptom-Threshold Trainer.
 *
 * Framework-agnostic. Each connector returns a common `LiveHrConnection`:
 * subscribe to a stream of real bpm values, and stop() to tear the hardware
 * down. There is NO simulated/fabricated bpm anywhere in this module — a bpm is
 * only ever emitted from an actual device (Web Bluetooth heart-rate profile) or
 * an actual camera photoplethysmography (PPG) signal.
 *
 *  - connectBluetoothHr() — Web Bluetooth, standard Heart Rate Service (0x180D)
 *    / Heart Rate Measurement characteristic (0x2A37). Covers Polar, Wahoo,
 *    WHOOP, Garmin broadcast, and any BLE chest strap or sensor. The browser
 *    chooser lists every device advertising the heart_rate service and the user
 *    picks theirs — there is no way (and no need) to brand-filter.
 *  - connectCameraPpg() — rear-camera PPG: mean red-channel per frame into a
 *    rolling buffer, detrend + autocorrelation to estimate bpm in 40–200, with
 *    light smoothing and ~1 Hz emission. Torch on where supported.
 *
 * Both APIs need a secure context (HTTPS) and a USER GESTURE for the initial
 * permission prompt, so callers must invoke these from a click/tap handler.
 */

/** What every consuming screen reads. Implementation-agnostic. */
export interface LiveHrConnection {
  /** subscribe to real bpm values; returns an unsubscribe fn. */
  subscribe(cb: (bpm: number) => void): () => void
  /** release the hardware (GATT disconnect / stop camera tracks). */
  stop(): void
  /** human label for the connected source, e.g. "Polar H10". */
  label: string
}

// ── capability detection ─────────────────────────────────────────────────────

/** True only where Web Bluetooth + a secure context are actually available. */
export function bluetoothSupported(): boolean {
  if (typeof navigator === 'undefined') return false
  const secure = typeof window === 'undefined' ? true : window.isSecureContext
  return secure && !!(navigator as unknown as { bluetooth?: unknown }).bluetooth
}

/** True only where getUserMedia + a secure context are actually available. */
export function cameraSupported(): boolean {
  if (typeof navigator === 'undefined') return false
  const secure = typeof window === 'undefined' ? true : window.isSecureContext
  return secure && !!navigator.mediaDevices?.getUserMedia
}

// ── Web Bluetooth heart-rate ─────────────────────────────────────────────────
//
// Minimal local typings for the Web Bluetooth API (not in the default TS DOM
// lib). These describe only the surface we touch.

interface BleCharacteristic {
  value?: DataView
  startNotifications(): Promise<BleCharacteristic>
  stopNotifications(): Promise<BleCharacteristic>
  addEventListener(type: string, cb: (e: Event) => void): void
  removeEventListener(type: string, cb: (e: Event) => void): void
}
interface BleService {
  getCharacteristic(uuid: string): Promise<BleCharacteristic>
}
interface BleServer {
  readonly connected: boolean
  connect(): Promise<BleServer>
  getPrimaryService(uuid: string): Promise<BleService>
  disconnect(): void
}
interface BleDevice {
  name?: string
  gatt?: BleServer
  addEventListener(type: string, cb: (e: Event) => void): void
  removeEventListener(type: string, cb: (e: Event) => void): void
}
interface BluetoothApi {
  requestDevice(opts: {
    filters?: Array<{ services: string[] }>
    optionalServices?: string[]
  }): Promise<BleDevice>
}

/**
 * Parse the Heart Rate Measurement characteristic (0x2A37).
 * Byte 0 = flags; bit 0 selects 8-bit (clear) vs 16-bit (set) HR value.
 */
function parseHeartRate(value: DataView): number | null {
  const flags = value.getUint8(0)
  const is16bit = (flags & 0x1) === 0x1
  const bpm = is16bit ? value.getUint16(1, true) : value.getUint8(1)
  if (!Number.isFinite(bpm) || bpm <= 0 || bpm > 250) return null
  return bpm
}

/**
 * REAL Web Bluetooth heart-rate connection. Must be called from a user gesture.
 * Throws if the user cancels the chooser or pairing fails — callers should fall
 * back to manual entry on rejection.
 */
export async function connectBluetoothHr(): Promise<LiveHrConnection> {
  const bt = (navigator as unknown as { bluetooth?: BluetoothApi }).bluetooth
  if (!bt) throw new Error('Web Bluetooth is not available in this browser.')

  // requestDevice MUST be the first thing — it consumes the user gesture.
  const device = await bt.requestDevice({
    filters: [{ services: ['heart_rate'] }],
    optionalServices: ['battery_service'],
  })

  const listeners = new Set<(bpm: number) => void>()
  let stopped = false
  let characteristic: BleCharacteristic | null = null

  const onValueChanged = (event: Event) => {
    const ch = event.target as unknown as BleCharacteristic
    if (!ch.value) return
    const bpm = parseHeartRate(ch.value)
    if (bpm != null) listeners.forEach((cb) => cb(bpm))
  }

  const wireUp = async () => {
    if (stopped || !device.gatt) return
    const server = await device.gatt.connect()
    const service = await server.getPrimaryService('heart_rate')
    characteristic = await service.getCharacteristic('heart_rate_measurement')
    await characteristic.startNotifications()
    characteristic.addEventListener('characteristicvaluechanged', onValueChanged)
  }

  // Auto-reconnect on an unexpected drop (strap moved, brief range loss).
  const onDisconnected = () => {
    if (!stopped) wireUp().catch(() => {})
  }
  device.addEventListener('gattserverdisconnected', onDisconnected)

  await wireUp()

  return {
    label: device.name || 'Bluetooth HR',
    subscribe(cb) {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    stop() {
      stopped = true
      device.removeEventListener('gattserverdisconnected', onDisconnected)
      if (characteristic) {
        try {
          characteristic.removeEventListener('characteristicvaluechanged', onValueChanged)
          characteristic.stopNotifications().catch(() => {})
        } catch {
          /* characteristic already gone */
        }
      }
      try {
        if (device.gatt?.connected) device.gatt.disconnect()
      } catch {
        /* already disconnected */
      }
      listeners.clear()
    },
  }
}

// ── Camera PPG ───────────────────────────────────────────────────────────────

const PPG_MAX_SAMPLES = 256
const PPG_MIN_SAMPLES = 64
const PPG_MIN_BPM = 40
const PPG_MAX_BPM = 200

/**
 * Estimate bpm from a rolling buffer of mean-red samples by detrending and
 * autocorrelating over the lag range that maps to 40–200 bpm. Returns null when
 * the window is too short or no plausible periodicity is found.
 */
function estimateBpm(samples: number[], times: number[]): number | null {
  const n = samples.length
  if (n < PPG_MIN_SAMPLES) return null
  const durSec = (times[n - 1] - times[0]) / 1000
  if (durSec < 3) return null
  const fps = (n - 1) / durSec
  if (!Number.isFinite(fps) || fps <= 0) return null

  // Detrend: remove the mean so the slow DC/lighting drift doesn't dominate.
  const mean = samples.reduce((a, b) => a + b, 0) / n
  const sig = samples.map((v) => v - mean)

  // Reject a flat / noise-only signal (e.g. camera not covered).
  const variance = sig.reduce((a, v) => a + v * v, 0) / n
  if (variance < 1e-4) return null

  const minLag = Math.max(1, Math.floor((60 / PPG_MAX_BPM) * fps))
  const maxLag = Math.min(n - 1, Math.ceil((60 / PPG_MIN_BPM) * fps))

  let bestLag = -1
  let bestCorr = -Infinity
  for (let lag = minLag; lag <= maxLag; lag++) {
    let corr = 0
    for (let i = 0; i + lag < n; i++) corr += sig[i] * sig[i + lag]
    if (corr > bestCorr) {
      bestCorr = corr
      bestLag = lag
    }
  }
  if (bestLag <= 0 || bestCorr <= 0) return null

  const bpm = (60 * fps) / bestLag
  if (bpm < PPG_MIN_BPM || bpm > PPG_MAX_BPM) return null
  return bpm
}

/**
 * REAL rear-camera PPG connection. Must be called from a user gesture (camera
 * permission prompt). Throws if permission is denied or no camera is available.
 */
export async function connectCameraPpg(): Promise<LiveHrConnection> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Camera access is not available in this browser.')
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: 'environment' } },
    audio: false,
  })
  const track = stream.getVideoTracks()[0]

  // Torch greatly improves the PPG signal when a fingertip covers the lens.
  try {
    const caps = track.getCapabilities?.() as (MediaTrackCapabilities & { torch?: boolean }) | undefined
    if (caps?.torch) {
      await track.applyConstraints({ advanced: [{ torch: true }] } as unknown as MediaTrackConstraints)
    }
  } catch {
    /* torch unsupported — PPG still works in good ambient light */
  }

  const video = document.createElement('video')
  video.playsInline = true
  video.muted = true
  video.srcObject = stream
  await video.play().catch(() => {})

  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d', { willReadFrequently: true })

  const listeners = new Set<(bpm: number) => void>()
  const samples: number[] = []
  const times: number[] = []
  let stopped = false
  let rafId = 0
  let lastEmit = 0
  let smoothed = 0

  const tick = () => {
    if (stopped) return
    rafId = requestAnimationFrame(tick)
    if (!ctx || video.readyState < 2) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    let data: Uint8ClampedArray
    try {
      data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    } catch {
      return // very rare: tainted canvas
    }

    let redSum = 0
    const pixels = data.length / 4
    for (let i = 0; i < data.length; i += 4) redSum += data[i]
    const meanRed = redSum / pixels

    const now = performance.now()
    samples.push(meanRed)
    times.push(now)
    if (samples.length > PPG_MAX_SAMPLES) {
      samples.shift()
      times.shift()
    }

    if (samples.length >= PPG_MIN_SAMPLES && now - lastEmit >= 1000) {
      lastEmit = now
      const bpm = estimateBpm(samples, times)
      if (bpm != null) {
        smoothed = smoothed ? smoothed * 0.7 + bpm * 0.3 : bpm
        const out = Math.round(smoothed)
        listeners.forEach((cb) => cb(out))
      }
    }
  }
  rafId = requestAnimationFrame(tick)

  return {
    label: 'Phone camera (PPG)',
    subscribe(cb) {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    stop() {
      stopped = true
      cancelAnimationFrame(rafId)
      try {
        stream.getTracks().forEach((t) => t.stop())
      } catch {
        /* tracks already stopped */
      }
      video.srcObject = null
      listeners.clear()
    },
  }
}
