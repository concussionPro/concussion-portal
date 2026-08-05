'use client'

import { useCallback, useEffect, useState } from 'react'
import { UserPlus, X } from 'lucide-react'

/**
 * Practitioner seats — the tier's enforceable unit (owner 2026-08-04:
 * clinician identity, not caseload). Lists the named team, adds seats up to
 * the tier allowance, and surfaces the upgrade path at the limit. Owner
 * occupies seat 1 implicitly.
 */
interface Member { id: string; name: string; email: string | null }

export function SstTeamSection({ demo = false }: { demo?: boolean }) {
  const [members, setMembers] = useState<Member[]>([])
  const [seats, setSeats] = useState<{ used: number; allowance: number; tier: string; isOwner: boolean } | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    if (demo) {
      setMembers([{ id: 'demo-1', name: 'Alex Reviewer', email: null }])
      setSeats({ used: 2, allowance: 5, tier: 'clinic', isOwner: true })
      return
    }
    void fetch('/api/clinical-testing/team')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return
        setMembers(d.members ?? [])
        setSeats({ used: d.seatsUsed ?? 1, allowance: d.seatAllowance ?? 1, tier: d.tier ?? 'trial', isOwner: d.isOwner !== false })
      })
      .catch(() => {})
  }, [demo])
  useEffect(load, [load])

  const add = async () => {
    if (demo || busy || !name.trim()) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/clinical-testing/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() || undefined }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.message || data?.error || 'Could not add practitioner.')
      } else {
        setName(''); setEmail(''); load()
      }
    } catch {
      setError('Network error — try again.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (id: string) => {
    if (demo) return
    await fetch('/api/clinical-testing/team', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(() => {})
    load()
  }

  if (!seats) return null

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-white/70 p-4">
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <p className="text-[12px] font-bold text-foreground">Practitioners</p>
        <span className="text-[11px] font-semibold text-muted-foreground">
          {seats.used} of {seats.allowance} seat{seats.allowance === 1 ? '' : 's'}
          {seats.tier !== 'trial' && ` · ${seats.tier} plan`}
        </span>
      </div>
      <ul className="space-y-1.5">
        <li className="flex items-center justify-between text-[12.5px] text-slate-700">
          <span className="font-medium">{seats.isOwner ? 'You (clinic owner)' : 'Clinic owner'}</span>
          <span className="text-[11px] text-muted-foreground">seat 1</span>
        </li>
        {members.map((m) => (
          <li key={m.id} className="flex items-center justify-between text-[12.5px] text-slate-700">
            <span className="font-medium truncate">{m.name}{m.email ? <span className="text-muted-foreground font-normal"> · {m.email}</span> : null}</span>
            {seats.isOwner && (
              <button type="button" onClick={() => remove(m.id)} aria-label={`Remove ${m.name}`} className="text-slate-400 hover:text-red-500">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </li>
        ))}
      </ul>
      {!seats.isOwner ? (
        <p className="mt-3 text-[12px] text-muted-foreground">Seats are managed by the clinic owner.</p>
      ) : seats.used < seats.allowance ? (
        <div className="mt-3 flex flex-col sm:flex-row gap-2">
          <input
            type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Practitioner name"
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-[12.5px] outline-none focus:border-accent"
          />
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Email (optional)"
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-[12.5px] outline-none focus:border-accent"
          />
          <button
            type="button" onClick={add} disabled={busy || !name.trim()}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-[12px] font-bold text-white disabled:opacity-50"
          >
            <UserPlus className="w-3.5 h-3.5" />
            {busy ? 'Adding…' : 'Add'}
          </button>
        </div>
      ) : (
        <p className="mt-3 text-[12px] text-muted-foreground">
          All seats on your plan are in use —{' '}
          <a href="/clinical-testing/subscribe" className="font-semibold text-accent hover:underline">upgrade to add more practitioners</a>.
        </p>
      )}
      {error && <p className="mt-2 text-[12px] text-red-600">{error}</p>}
    </div>
  )
}
