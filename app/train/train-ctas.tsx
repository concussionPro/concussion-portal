'use client'

import { useState } from 'react'

/**
 * CTA block for /train. The interest buttons call nominate-confirm with the
 * signed (e, t) pair from the email link — the same human-on-page pattern that
 * replaced one-click nominations after the Defender detonation incident, so a
 * scanner following the email link can never register interest.
 */
export function TrainCtas({
  audience,
  e,
  t,
}: {
  audience: 'upgrade' | 'enrolled' | 'new'
  e: string
  t: string
}) {
  const [registered, setRegistered] = useState<Record<string, 'done' | 'error' | 'busy'>>({})

  const canRegister = !!e && !!t

  async function registerCity(city: 'sydney' | 'byron-bay') {
    setRegistered((r) => ({ ...r, [city]: 'busy' }))
    try {
      const res = await fetch('/api/workshop/nominate-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ e, t, city }),
      })
      setRegistered((r) => ({ ...r, [city]: res.ok ? 'done' : 'error' }))
    } catch {
      setRegistered((r) => ({ ...r, [city]: 'error' }))
    }
  }

  const cityButton = (city: 'sydney' | 'byron-bay', label: string) => {
    const state = registered[city]
    if (state === 'done') {
      return (
        <span className="inline-flex items-center justify-center rounded-lg border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm font-semibold text-teal-700">
          ✓ {label} — registered
        </span>
      )
    }
    return (
      <button
        onClick={() => registerCity(city)}
        disabled={state === 'busy'}
        className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-teal-500 hover:text-teal-700 disabled:opacity-50"
      >
        {state === 'busy' ? '…' : state === 'error' ? `Retry ${label}` : `Register for ${label}`}
      </button>
    )
  }

  return (
    <div className="mt-6">
      {audience === 'upgrade' && (
        <a
          href="/upgrade"
          className="block w-full text-center rounded-xl bg-teal-600 px-6 py-3.5 text-white font-semibold hover:bg-teal-700"
        >
          Complete my course — upgrade to the practical day →
        </a>
      )}

      {audience === 'new' && (
        <a
          href="/melbourne-nov7"
          className="block w-full text-center rounded-xl bg-teal-600 px-6 py-3.5 text-white font-semibold hover:bg-teal-700"
        >
          Enrol — next Melbourne round →
        </a>
      )}

      {canRegister ? (
        <div className="mt-4">
          <p className="text-sm text-slate-500 mb-2">
            {audience === 'enrolled'
              ? 'Register for the round that suits you:'
              : 'Melbourne not yours? Count me toward the next:'}
          </p>
          <div className="flex flex-wrap gap-2">
            {cityButton('sydney', 'Sydney')}
            {cityButton('byron-bay', 'Byron Bay')}
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500 mt-4">
          Prefer Sydney or Byron Bay? Reply to Zac&rsquo;s email and he&rsquo;ll count you toward
          that city&rsquo;s next date.
        </p>
      )}
    </div>
  )
}
