'use client'

import { useState } from 'react'
import { trackEvent } from '@/lib/analytics'

/**
 * "What's holding you back?" — one question, on /pricing, for people who scroll
 * the page and do not buy.
 *
 * WHY THIS EXISTS (2026-08-06, item 8 of the conversion pass).
 *
 * The measured 90-day funnel:
 *
 *     saw pricing      225 sessions
 *     clicked enrol     19          8.4%
 *     purchased          6          31.6% of clicks
 *
 * Click-to-purchase at 31.6% is strong — checkout is not the problem. The leak
 * is the 206 sessions that read the page and left, and there is currently NO
 * data about them at all: the only pricing events are checkout_start,
 * workshop_city_select and workshop_interest_submit, every one of which fires
 * only for people already converting. The page can tell you who bought and
 * nothing whatsoever about who didn't.
 *
 * DELIBERATELY NOT AN EXIT-INTENT MODAL. A popup that interrupts someone
 * deciding on a $497–$1,400 purchase costs conversions to measure conversions,
 * which is self-defeating. This is an inline card at the foot of the page,
 * below the offer, that a buyer never has to interact with — it cannot block,
 * dim, or intercept anything.
 *
 * The options are the four objections the price ladder actually raises, plus
 * free text. They are deliberately blunt: a euphemistic option set produces
 * euphemistic data.
 */

const REASONS = [
  { id: 'price', label: 'Too expensive right now' },
  { id: 'no_date', label: "My city has no workshop date yet" },
  { id: 'unsure_value', label: "Not sure it's right for my practice" },
  { id: 'need_approval', label: 'Need employer/practice approval' },
  { id: 'just_looking', label: 'Just looking for now' },
] as const

export default function PricingObjection() {
  const [sent, setSent] = useState(false)
  const [picked, setPicked] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  function choose(id: string) {
    setPicked(id)
    // Record immediately. If they never write a note, the choice is still
    // captured — the common failure of these widgets is requiring a second
    // step nobody takes.
    void trackEvent('pricing_objection', { reason: id })
  }

  function submitNote() {
    if (note.trim()) void trackEvent('pricing_objection_note', { reason: picked, note: note.trim().slice(0, 300) })
    setSent(true)
  }

  if (sent || (picked && !note)) {
    return (
      <div className="mt-10 rounded-xl border border-border p-5 text-center">
        <p className="text-sm text-muted-foreground">
          Thanks — that genuinely helps us fix the right thing.
        </p>
        {picked === 'no_date' && (
          <a href="/ready-to-train" className="text-sm font-semibold text-accent hover:underline mt-2 inline-block">
            See where your city is up to →
          </a>
        )}
        {picked === 'need_approval' && (
          <a href="/courses/about-the-founder" className="text-sm font-semibold text-accent hover:underline mt-2 inline-block">
            Something to forward to your practice →
          </a>
        )}
      </div>
    )
  }

  return (
    <div className="mt-10 rounded-xl border border-border p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Not enrolling today?</p>
          <p className="text-[13px] text-muted-foreground">
            One tap tells us what to fix. No email required.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="text-muted-foreground hover:text-foreground text-lg leading-none px-1"
        >
          ×
        </button>
      </div>

      {!picked ? (
        <div className="flex flex-wrap gap-2">
          {REASONS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => choose(r.id)}
              className="min-h-[40px] rounded-lg border border-slate-300 px-3 py-2 text-[13px] text-slate-700 hover:border-accent hover:text-accent transition-colors"
            >
              {r.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Anything else? (optional)"
            maxLength={300}
            className="flex-1 min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-[14px]"
          />
          <button
            type="button"
            onClick={submitNote}
            className="btn-primary rounded-lg px-4 py-2 text-sm font-semibold"
          >
            Send
          </button>
        </div>
      )}
    </div>
  )
}
