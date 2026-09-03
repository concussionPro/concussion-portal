'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

/**
 * CheckoutRescue — shown ONLY when a Stripe redirect was ordered but the buyer
 * is still on (or bounced back to) the page. Hospital/clinic egress filtering
 * is the driver: a St John of God clinician minted 11 dead sessions in three
 * minutes on 2026-09-03 because checkout.stripe.com never rendered for them.
 *
 * Three exits, in order of speed:
 *   1. raw link, new tab (beats some proxy setups)
 *   2. QR code — scan with the phone, pay on mobile data, off the network
 *   3. email me the link — sends via /api/checkout-link-email, which also
 *      makes the buyer identifiable to the expired-session recovery sequence
 */
export function CheckoutRescue({ url }: { url: string }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const sendLink = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setState('error'); return }
    setState('sending')
    try {
      const res = await fetch('/api/checkout-link-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, url }),
      })
      setState(res.ok ? 'sent' : 'error')
    } catch {
      setState('error')
    }
  }

  return (
    <div className="rounded-xl border-2 border-amber-300 bg-amber-50 px-4 py-4">
      <p className="text-sm font-bold text-amber-900 mb-1">Checkout didn&apos;t open?</p>
      <p className="text-[13px] text-amber-900/85 mb-3">
        Some clinic and hospital networks block payment pages. Your secure checkout is ready — three ways in:
      </p>
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <div className="flex-1 min-w-0 space-y-3">
          <a
            href={url}
            target="_blank"
            rel="noopener"
            className="inline-block rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white"
          >
            Open secure checkout →
          </a>
          {state === 'sent' ? (
            <p className="text-[13px] font-semibold text-emerald-700">
              Sent — open it from your inbox (your phone works best).
            </p>
          ) : (
            <div>
              <p className="text-[12px] font-semibold text-amber-900 mb-1">Or email the link to yourself:</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (state === 'error') setState('idle') }}
                  onKeyDown={(e) => { if (e.key === 'Enter') sendLink() }}
                  placeholder="you@email.com"
                  className="flex-1 min-w-0 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                />
                <button
                  onClick={sendLink}
                  disabled={state === 'sending'}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                >
                  {state === 'sending' ? 'Sending…' : 'Send'}
                </button>
              </div>
              {state === 'error' && (
                <p className="text-[11px] text-red-700 mt-1">Check the address and try again.</p>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-col items-center gap-1 flex-shrink-0 mx-auto sm:mx-0">
          <div className="rounded-lg bg-white p-2 border border-amber-200">
            <QRCodeSVG value={url} size={104} />
          </div>
          <p className="text-[10px] text-amber-900/70 text-center leading-tight">
            Scan to pay on your phone<br />(mobile data beats work wifi)
          </p>
        </div>
      </div>
    </div>
  )
}
