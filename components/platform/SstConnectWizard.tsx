'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { connectBluetoothHr, type LiveHrConnection } from '@/lib/sst-trainer/hr-live'

/**
 * Guided wearable-connection wizard — replaces the old one-tap-and-pray pair
 * flow (and the "get our app" dead end) on the web. Walks the patient through
 * the three things that actually go wrong, in order:
 *
 *  1. environment — does THIS browser/computer have working Bluetooth?
 *     (Web Bluetooth support, adapter on, macOS Chrome Bluetooth permission)
 *  2. the wearable — broadcast mode per brand, and the classic silent killer:
 *     the watch already claimed by its phone app.
 *  3. pairing — the chooser itself, with error-specific diagnosis instead of a
 *     generic "couldn't connect", then a live signal check before handing the
 *     connection to the app.
 *
 * Manual entry stays one tap away on every step — never a dead end.
 */

type StepId = 'env' | 'broadcast' | 'scan' | 'verify'

interface Platform {
  ios: boolean
  mac: boolean
  android: boolean
  windows: boolean
}

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return { ios: false, mac: false, android: false, windows: false }
  const ua = navigator.userAgent
  // iPadOS 13+ masquerades as Macintosh; touch points give it away.
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
  return {
    ios,
    mac: /Macintosh/.test(ua) && !ios,
    android: /Android/.test(ua),
    windows: /Windows/.test(ua),
  }
}

const BRANDS: { id: string; label: string; how: string; manualOnly?: boolean }[] = [
  { id: 'garmin', label: 'Garmin', how: 'On the watch: hold the light/menu button → Settings → Sensors & Accessories → Wrist Heart Rate → Broadcast Heart Rate (on some models it’s under the controls menu). The watch shows a broadcast icon while it’s on.' },
  { id: 'polar', label: 'Polar', how: 'On the watch: Settings → General settings → Pair and sync → turn on “HR visible to other devices”. Polar chest straps broadcast automatically when worn.' },
  { id: 'whoop', label: 'WHOOP', how: 'In the WHOOP app on your phone: More → Device Settings → Broadcast Heart Rate. Leave the WHOOP app open while pairing.' },
  { id: 'coros', label: 'Coros / Suunto / Amazfit', how: 'In the watch settings, turn on heart-rate broadcast (Coros: Settings → Broadcast Heart Rate; Suunto: Options → Connectivity → HR broadcast).' },
  { id: 'strap', label: 'Chest strap (Wahoo, Polar H10, Garmin HRM…)', how: 'Straps broadcast automatically: moisten the electrodes, clip it on, and it’s discoverable straight away. Nothing to turn on.' },
  { id: 'apple-fitbit', label: 'Apple Watch or Fitbit', how: '', manualOnly: true },
]

/** Map a Web Bluetooth failure to a diagnosis the patient can act on. */
function diagnose(err: unknown, p: Platform): { title: string; fixes: string[] } {
  const name = err instanceof Error ? err.name : ''
  if (name === 'NotFoundError') {
    // Chooser cancelled OR nothing showed up in the list.
    return {
      title: 'No device picked — if the list was empty:',
      fixes: [
        'Check the broadcast icon is showing on the watch (broadcast turns itself off when you leave the menu on some models).',
        'Bring the watch within arm’s reach of this computer.',
        'Turn OFF Bluetooth on your phone for a minute — if the watch is connected to its phone app (Garmin Connect, Polar Flow…), it can be invisible to everything else.',
        ...(p.mac ? ['macOS: System Settings → Privacy & Security → Bluetooth → make sure your browser is allowed, then fully quit and reopen it.'] : []),
      ],
    }
  }
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return {
      title: 'The browser was blocked from using Bluetooth.',
      fixes: [
        ...(p.mac
          ? ['System Settings → Privacy & Security → Bluetooth → allow your browser (Chrome/Edge), then quit and reopen it.']
          : p.windows
            ? ['Windows Settings → Bluetooth & devices → make sure Bluetooth is on and the browser is allowed.']
            : ['Check the site isn’t blocked: click the icon left of the address bar → Site settings → allow Bluetooth.']),
        'Then come back and scan again.',
      ],
    }
  }
  return {
    title: 'The connection dropped while pairing.',
    fixes: [
      'Keep the watch close and still, then scan again.',
      'If it keeps happening, restart Bluetooth on this computer (off → on) and retry.',
    ],
  }
}

export default function SstConnectWizard({
  open,
  onClose,
  onConnected,
  onManual,
}: {
  open: boolean
  onClose: () => void
  /** a REAL live connection, signal already verified by the wizard */
  onConnected: (conn: LiveHrConnection) => void
  /** patient chose to type readings in instead */
  onManual: () => void
}) {
  const [step, setStep] = useState<StepId>('env')
  const [platform, setPlatform] = useState<Platform>({ ios: false, mac: false, android: false, windows: false })
  const [btSupported, setBtSupported] = useState<boolean | null>(null)
  const [adapterOn, setAdapterOn] = useState<boolean | null>(null)
  const [brand, setBrand] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [failure, setFailure] = useState<{ title: string; fixes: string[] } | null>(null)
  const [bpm, setBpm] = useState<number | null>(null)
  const [silent, setSilent] = useState(false)
  const connRef = useRef<LiveHrConnection | null>(null)

  // Environment check runs on open. Native shell exposes its BLE bridge through
  // the same connect call, so "supported" covers both paths.
  useEffect(() => {
    if (!open) return
    setStep('env')
    setBrand(null)
    setFailure(null)
    setBpm(null)
    setSilent(false)
    const p = detectPlatform()
    setPlatform(p)
    const bt = (navigator as unknown as { bluetooth?: { getAvailability?: () => Promise<boolean> } }).bluetooth
    const native = !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.()
    const supported = native || !!bt
    setBtSupported(supported)
    if (bt?.getAvailability) {
      bt.getAvailability().then(setAdapterOn).catch(() => setAdapterOn(null))
    } else {
      setAdapterOn(supported ? null : false)
    }
  }, [open])

  // Never leak a connection the app didn't accept.
  useEffect(() => {
    if (!open && connRef.current) {
      connRef.current.stop()
      connRef.current = null
    }
  }, [open])

  const scan = useCallback(async () => {
    setScanning(true)
    setFailure(null)
    try {
      // Must run directly inside the tap — the chooser consumes the gesture.
      const conn = await connectBluetoothHr()
      connRef.current = conn
      setBpm(null)
      setSilent(false)
      setStep('verify')
      const timeout = setTimeout(() => setSilent(true), 12_000)
      conn.subscribe((next) => {
        clearTimeout(timeout)
        setSilent(false)
        setBpm(Math.round(next))
      })
    } catch (err) {
      setFailure(diagnose(err, platform))
    } finally {
      setScanning(false)
    }
  }, [platform])

  const accept = useCallback(() => {
    const conn = connRef.current
    if (!conn) return
    connRef.current = null
    onConnected(conn)
  }, [onConnected])

  const abandonVerify = useCallback(() => {
    connRef.current?.stop()
    connRef.current = null
    setStep('scan')
  }, [])

  if (!open) return null

  const card = 'rounded-[14px] border-[1.5px] border-[#d4e0e1] bg-white px-3.5 py-3'
  const h = 'm-0 text-[15px] font-extrabold leading-tight text-[#16243f]'
  const body = 'm-0 text-[12px] leading-snug text-[#3c5658]'
  const primaryBtn =
    'w-full rounded-[14px] bg-[#16243f] px-4 py-3 text-center text-[14px] font-bold text-white active:scale-[0.99] disabled:opacity-50'
  const quietBtn = 'w-full rounded-[14px] border-[1.5px] border-[#d4e0e1] bg-white px-4 py-2.5 text-center text-[13px] font-semibold text-[#3b4f52]'

  const selectedBrand = BRANDS.find((b) => b.id === brand) ?? null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#16243f]/45 p-3 sm:items-center" role="dialog" aria-modal="true">
      <div className="flex max-h-[92vh] w-full max-w-md flex-col gap-3 overflow-y-auto rounded-[18px] bg-[#f6fafa] p-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className={h}>Connect your watch or strap</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex-none text-[18px] leading-none text-[#849c9c]">
            ✕
          </button>
        </div>

        {step === 'env' && (
          <>
            {btSupported === false ? (
              <div className={card}>
                <p className={body}>
                  {platform.ios
                    ? 'iPhones and iPads can’t do live Bluetooth in any browser (Apple doesn’t ship Web Bluetooth). You can still run everything here with manual entry — read the number off your watch and type it in.'
                    : 'This browser can’t do live Bluetooth. Open this same page in Chrome or Edge on this computer and your watch will pair — or continue here with manual entry.'}
                </p>
              </div>
            ) : adapterOn === false ? (
              <div className={card}>
                <p className={body}>
                  This browser reports Bluetooth as off — but that check is
                  unreliable on {platform.mac ? 'macOS' : 'some computers'}. If your Bluetooth is on
                  and your watch is broadcasting, just continue — the pairing dialog is the real test.
                  If your watch doesn&rsquo;t appear, turn Bluetooth on
                  {platform.mac ? ' (menu bar → Bluetooth)' : ''} and scan again.
                </p>
              </div>
            ) : (
              <div className={card}>
                <p className={body}>
                  ✓ This {platform.mac ? 'Mac' : platform.android ? 'device' : 'computer'} can pair your watch directly — live
                  Bluetooth is available in this browser.
                </p>
              </div>
            )}
            {/* Never hard-block on getAvailability() (unreliable on macOS) —
                if Web Bluetooth is supported at all, let them reach the scan;
                the requestDevice chooser is the true availability test. */}
            {btSupported !== false && (
              <button type="button" className={primaryBtn} onClick={() => setStep('broadcast')}>
                Next — get the watch ready
              </button>
            )}
            <button type="button" className={quietBtn} onClick={onManual}>
              Skip — I’ll type readings in
            </button>
          </>
        )}

        {step === 'broadcast' && (
          <>
            <p className={body}>
              Watches only show up while they’re <strong>broadcasting</strong>{' '}heart rate. What are you wearing?
            </p>
            <div className="flex flex-col gap-1.5">
              {BRANDS.map((b) => {
                const on = brand === b.id
                return (
                  <button
                    key={b.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setBrand(on ? null : b.id)}
                    className={`rounded-[14px] border-[1.5px] px-3.5 py-2.5 text-left text-[13px] font-semibold transition ${
                      on ? 'border-[#5b9aa6] bg-[#e7f2f3] text-[#16243f]' : 'border-[#d4e0e1] bg-white text-[#3b4f52]'
                    }`}
                  >
                    {b.label}
                  </button>
                )
              })}
            </div>
            {selectedBrand && !selectedBrand.manualOnly && (
              <div className={card}>
                <p className={body}>{selectedBrand.how}</p>
                <p className={`${body} mt-1.5 text-[#7d5a1f]`}>
                  If the watch is paired to its phone app, turn your phone’s Bluetooth off while pairing here — the phone
                  hogs the connection.
                </p>
              </div>
            )}
            {selectedBrand?.manualOnly && (
              <div className={card}>
                <p className={body}>
                  Apple Watch and Fitbit can’t broadcast standard Bluetooth heart rate — no app changes that. Use manual
                  entry: glance at the watch, type the number. Every screen works that way.
                </p>
                <button type="button" className={`${primaryBtn} mt-2.5`} onClick={onManual}>
                  Use manual entry
                </button>
              </div>
            )}
            {selectedBrand && !selectedBrand.manualOnly && (
              <button type="button" className={primaryBtn} onClick={() => setStep('scan')}>
                It’s broadcasting — find it
              </button>
            )}
            <button type="button" className={quietBtn} onClick={onManual}>
              Skip — I’ll type readings in
            </button>
          </>
        )}

        {step === 'scan' && (
          <>
            <p className={body}>
              Your browser will open a small device picker. Your watch appears there — select it and hit Pair.
            </p>
            <button type="button" className={primaryBtn} onClick={scan} disabled={scanning}>
              {scanning ? 'Opening the picker…' : 'Open the device picker'}
            </button>
            {failure && (
              <div className={card}>
                <p className={`${body} font-bold`}>{failure.title}</p>
                <ul className="m-0 mt-1.5 flex list-disc flex-col gap-1 pl-4">
                  {failure.fixes.map((f) => (
                    <li key={f} className={body}>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button type="button" className={quietBtn} onClick={() => setStep('broadcast')}>
              Back — broadcast instructions
            </button>
            <button type="button" className={quietBtn} onClick={onManual}>
              Skip — I’ll type readings in
            </button>
          </>
        )}

        {step === 'verify' && (
          <>
            <div className={`${card} text-center`}>
              {bpm != null ? (
                <>
                  <p className="m-0 text-[34px] font-extrabold leading-none text-[#3c7a1f]">{bpm}</p>
                  <p className={`${body} mt-1`}>bpm — live from {connRef.current?.label ?? 'your device'}. That’s a real signal.</p>
                </>
              ) : silent ? (
                <p className={body}>
                  Paired, but no heart rate is coming through. Check the broadcast icon is still showing on the watch (it
                  turns off when you leave the menu on some models), then reconnect.
                </p>
              ) : (
                <p className={body}>Paired — waiting for the first heart-rate reading…</p>
              )}
            </div>
            {bpm != null ? (
              <button type="button" className={primaryBtn} onClick={accept}>
                Use this device
              </button>
            ) : (
              <button type="button" className={quietBtn} onClick={abandonVerify}>
                Reconnect
              </button>
            )}
            <button type="button" className={quietBtn} onClick={onManual}>
              Skip — I’ll type readings in
            </button>
          </>
        )}
      </div>
    </div>
  )
}
