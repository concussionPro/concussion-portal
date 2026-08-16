'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Check, MapPin } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'

/**
 * One-tap confirmation banner for an email city nomination.
 *
 * The nominate link in the Q4 blast lands here with a signed pending payload
 * (?nominate=<slug>&ne=<email>&nt=<hmac>); nothing was recorded server-side
 * on the click, because mail-security sandboxes detonate email links with
 * real browsers and fabricated the entire first round of nomination numbers.
 * The nomination only counts when this button's POST fires — a human action
 * on the landed page.
 */

const CITY_LABELS: Record<string, string> = {
  sydney: 'Sydney',
  'byron-bay': 'Byron Bay',
  melbourne: 'Melbourne',
  adelaide: 'Adelaide',
  wa: 'Western Australia',
}

export default function NominateConfirmBanner() {
  const params = useSearchParams()
  const slug = params.get('nominate') || ''
  const email = params.get('ne') || ''
  const token = params.get('nt') || ''
  const label = CITY_LABELS[slug]
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')

  if (!label || !email || !token) return null

  async function confirm() {
    setState('busy')
    trackEvent('nomination_confirm_click', { city: slug })
    try {
      const res = await fetch('/api/workshop/nominate-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ e: email, t: token, city: slug }),
      })
      setState(res.ok ? 'done' : 'error')
    } catch {
      setState('error')
    }
  }

  return (
    // Clears the fixed nav itself, and pulls the page's own pt-[120px] block
    // back up so the layout is untouched whenever this returns null.
    <div className="max-w-3xl mx-auto px-6 pt-[104px] -mb-20">
      <div className="rounded-2xl border-2 border-[var(--accent)] bg-[rgba(13,115,119,0.05)] px-5 py-4 text-center">
        {state === 'done' ? (
          <p className="m-0 text-[15px] font-semibold text-foreground flex items-center justify-center gap-2">
            <Check className="w-5 h-5 text-[var(--accent)]" strokeWidth={2.5} />
            You&apos;re counted for {label}. We&apos;ll email you the moment a date is locked in.
          </p>
        ) : (
          <>
            <p className="m-0 text-[15px] font-semibold text-foreground flex items-center justify-center gap-2">
              <MapPin className="w-4 h-4 text-[var(--accent)]" strokeWidth={2.2} />
              Register your interest for the {label} practical day
            </p>
            <p className="m-0 mt-1 text-[13px] text-muted-foreground">
              One tap — dates are booked on these numbers, so only confirm if you&apos;d genuinely attend in {label}.
            </p>
            <button
              onClick={confirm}
              disabled={state === 'busy'}
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--accent)] text-white text-sm font-bold px-6 py-2.5 hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {state === 'busy' ? 'Saving…' : `Confirm — count me for ${label}`}
            </button>
            {state === 'error' && (
              <p className="m-0 mt-2 text-[12.5px] text-red-600">
                That didn&apos;t save — try again, or reply to the email and we&apos;ll add you manually.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
