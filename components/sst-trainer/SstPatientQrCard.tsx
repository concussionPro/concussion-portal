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
 */
export function SstPatientQrCard({
  clinicName,
  code,
  onClose,
}: {
  clinicName: string
  code: string
  onClose: () => void
}) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://portal.concussion-education-australia.com'
  const url = `${origin}/sst-trainer?clinic=${encodeURIComponent(code)}`
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

        <ol className="text-left text-[12.5px] text-slate-600 leading-relaxed mt-4 mb-4 list-decimal pl-5 space-y-1">
          <li>Scan the code (or open the link) on your phone.</li>
          <li>Tap <strong>Share → Add to Home Screen</strong> to install it (iPhone: use Safari).</li>
          <li>Pair your heart-rate monitor (or use the phone camera), enter your name, and begin.</li>
        </ol>

        <p className="text-[10.5px] text-slate-400 break-all mb-4">{url}</p>

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
