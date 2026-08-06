'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

/**
 * Per-clinic patient onboarding card for the SST Trainer.
 *
 * Renders a scannable QR to the deep link /sst-trainer?clinic=CODE — the patient
 * scans it, lands in the PWA with their clinic code pre-filled and clinic-code
 * mode on, adds their name, pairs a heart-rate source, and trains. Printable
 * (the clinic displays/hands it to patients). No app store / DUNS needed.
 *
 * Variants:
 *  - 'patient' (default): the printable hand-to-patient card. NEVER shows the
 *    viewKey/hub link — the code is patient-held; the key must not be.
 *  - 'clinician' (requires `viewKey`): adds the private Clinical Hub link
 *    (?clinic=CODE&k=viewKey) beneath the patient URL, for the clinician's own
 *    reference copy.
 */
export function SstPatientQrCard({
  clinicName,
  code,
  onClose,
  viewKey,
  variant = 'patient',
}: {
  clinicName: string
  code: string
  onClose: () => void
  /** Clinic's private read key — only rendered on the 'clinician' variant. */
  viewKey?: string
  variant?: 'patient' | 'clinician'
}) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://portal.concussion-education-australia.com'
  // /j/CODE = platform-smart join (iPhone → native-app chooser, else straight
  // into the web app). Shorter URL also means a lighter, faster-scanning QR.
  const url = `${origin}/j/${encodeURIComponent(code)}`
  const hubUrl =
    variant === 'clinician' && viewKey
      ? `${origin}/clinical-hub?clinic=${encodeURIComponent(code)}&k=${encodeURIComponent(viewKey)}`
      : null
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked — the link is shown below to copy by hand */
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 print:bg-white print:p-0"
      onClick={onClose}
    >
      {/* Only this card prints. */}
      <style>{`@media print {
        body * { visibility: hidden !important; }
        #sst-print-card, #sst-print-card * { visibility: visible !important; }
        #sst-print-card { position: absolute !important; inset: 0 !important; margin: auto !important; box-shadow: none !important; max-width: 420px !important; }
        .sst-no-print { display: none !important; }
      }`}</style>
      <div
        id="sst-print-card"
        className="bg-white rounded-2xl max-w-sm w-full p-7 text-center shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-teal-700 mb-1">SST Trainer · Recovery training</p>
        <h3 className="text-lg font-bold text-slate-900 mb-1">{clinicName}</h3>
        <p className="text-xs text-slate-500 mb-4">Scan to start your guided sub-symptom-threshold training</p>

        <div className="inline-block bg-white p-3 rounded-xl border border-slate-200">
          <QRCodeSVG value={url} size={208} level="M" marginSize={2} />
        </div>

        <p className="text-sm text-slate-700 mt-4">
          Clinic code: <span className="font-mono font-bold tracking-[0.2em] text-teal-700">{code}</span>
        </p>

        {/* This card is PRINTED and handed to the patient, so its steps have to
            match what the app actually does (2026-08-06 census — they didn't):
            · /j/CODE already routes iPhones to the app chooser, so "Add to Home
              Screen in Safari" sent iPhone patients down the one path that
              CANNOT pair a heart-rate monitor (no Web Bluetooth on iOS).
            · The phone camera is a RESTING SPOT-CHECK only — camera PPG is not
              valid during exercise (hr-source.ts) — yet the card offered it as
              a way to start a training session. */}
        <ol className="text-left text-[12.5px] text-slate-600 leading-relaxed mt-4 mb-4 list-decimal pl-5 space-y-1">
          <li>Scan the code (or open the link) on your phone — it takes you to the right place for your device.</li>
          <li>Enter your name. Your clinic is already linked.</li>
          <li>
            Pair your heart-rate monitor or watch if you have one (Garmin, Polar, Wahoo, chest strap).
            No monitor, or on an iPhone browser? You&rsquo;ll type each reading instead — everything
            still works.
          </li>
        </ol>

        <p className="text-[10.5px] text-slate-400 break-all mb-4">{url}</p>

        {hubUrl && (
          <div className="text-left border border-amber-200 bg-amber-50 rounded-lg px-3 py-2.5 mb-4">
            <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-amber-700 mb-0.5">
              Clinician hub — keep private
            </p>
            <a href={hubUrl} className="text-[10.5px] text-slate-600 break-all underline decoration-amber-300">
              {hubUrl}
            </a>
            <p className="text-[10px] text-amber-700/80 mt-1">
              This link is your clinic&apos;s key. Don&apos;t hand this card to patients — print the patient version instead.
            </p>
          </div>
        )}

        <div className="flex gap-2 sst-no-print">
          <button onClick={() => window.print()} className="flex-1 px-4 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-bold hover:bg-teal-700 transition-colors">
            Print / Save PDF
          </button>
          <button onClick={copy} className="px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:border-teal-500 transition-colors">
            {copied ? 'Copied' : 'Copy link'}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:border-slate-400 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
