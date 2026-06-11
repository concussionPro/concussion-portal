'use client'

/**
 * Admin manager for the Concussion Care PARTNERSHIP arm.
 *
 * Standalone admin page (NOT bolted onto the analytics page). Lists
 * partner_institutions, lets Zac edit status + contact inline, and links
 * to each institution's live partner page. Isolated from the cold-clinic
 * engine — its only data source is /api/admin/partner-* .
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, RefreshCw, AlertCircle, ExternalLink, Sprout, Handshake } from 'lucide-react'

interface Partner {
  id: number
  slug: string
  name: string
  type: 'academy' | 'school' | 'club'
  tier: number
  region: string
  association: string | null
  contactName: string | null
  contactEmail: string | null
  contactRole: string | null
  accessKey: string
  status: 'lead' | 'contacted' | 'active' | 'declined'
  notes: string | null
}

const STATUSES: Partner['status'][] = ['lead', 'contacted', 'active', 'declined']

const STATUS_TONE: Record<Partner['status'], string> = {
  lead: 'bg-slate-100 text-slate-600 border-slate-200',
  contacted: 'bg-blue-50 text-blue-700 border-blue-200',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  declined: 'bg-slate-100 text-slate-400 border-slate-200',
}

const TIER_LABEL: Record<number, string> = { 1: 'Tier 1 · Academies', 2: 'Tier 2 · Schools', 3: 'Tier 3 · Clubs' }

export default function PartnershipsPage() {
  const [data, setData] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch('/api/admin/partner-list', { cache: 'no-store', credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json.partners ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function seed() {
    setSeeding(true)
    setFlash(null)
    setError(null)
    try {
      const res = await fetch('/api/admin/partner-seed', { method: 'POST', credentials: 'include' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.detail || json.error || `HTTP ${res.status}`)
      setFlash(`Seeded — ${json.created} new of ${json.total} institutions.`)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSeeding(false)
    }
  }

  // Optimistic PATCH for status / contact fields.
  const patch = useCallback(
    async (id: number, fields: Partial<Pick<Partner, 'status' | 'contactName' | 'contactEmail' | 'contactRole'>>) => {
      setData((prev) => prev.map((p) => (p.id === id ? { ...p, ...fields } : p)))
      try {
        const res = await fetch('/api/admin/partner-update', {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id, ...fields }),
        })
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          throw new Error(json.detail || json.error || `HTTP ${res.status}`)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
        load() // re-sync from server on failure
      }
    },
    [load],
  )

  const counts = useMemo(() => {
    const byTier: Record<number, number> = {}
    const byStatus: Record<string, number> = {}
    for (const p of data) {
      byTier[p.tier] = (byTier[p.tier] ?? 0) + 1
      byStatus[p.status] = (byStatus[p.status] ?? 0) + 1
    }
    return { byTier, byStatus, total: data.length }
  }, [data])

  // Group by tier, then name (server already sorts tier ASC, name ASC).
  const grouped = useMemo(() => {
    const map = new Map<number, Partner[]>()
    for (const p of data) {
      if (!map.has(p.tier)) map.set(p.tier, [])
      map.get(p.tier)!.push(p)
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0])
  }, [data])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between gap-4 mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Handshake className="w-6 h-6 text-slate-700" />
            Partnerships
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={seed}
              disabled={seeding}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-700 disabled:opacity-50 rounded-lg px-3 py-1.5"
            >
              {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sprout className="w-3.5 h-3.5" />}
              Seed institutions
            </button>
            <button
              onClick={() => {
                setRefreshing(true)
                load()
              }}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
        <p className="text-sm text-slate-500 mb-6">
          Concussion Care partnership arm · sports institutions offered the free athlete resource.
          Founder-led — nothing is auto-sent from here.
        </p>

        {flash && (
          <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-800">
            {flash}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-900">Something went wrong</p>
              <p className="text-xs text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Counts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
          <Stat label="Total" value={counts.total} />
          {[1, 2, 3].map((t) => (
            <Stat key={t} label={TIER_LABEL[t]?.replace(/ · .*/, '') ?? `Tier ${t}`} value={counts.byTier[t] ?? 0} />
          ))}
          {STATUSES.map((s) => (
            <Stat key={s} label={s[0].toUpperCase() + s.slice(1)} value={counts.byStatus[s] ?? 0} />
          ))}
        </div>

        {data.length === 0 && (
          <div className="rounded-xl bg-white border border-slate-200 p-10 text-center">
            <p className="text-sm text-slate-500 mb-3">No institutions yet.</p>
            <button
              onClick={seed}
              disabled={seeding}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-700 disabled:opacity-50 rounded-lg px-4 py-2"
            >
              {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sprout className="w-4 h-4" />}
              Seed institutions
            </button>
          </div>
        )}

        {grouped.map(([tier, rows]) => (
          <section key={tier} className="mb-8">
            <h2 className="text-base font-bold text-slate-900 mb-3">
              {TIER_LABEL[tier] ?? `Tier ${tier}`} · {rows.length}
            </h2>
            <div className="rounded-xl bg-white border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[980px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                      <th className="text-left px-3 py-2.5">Institution</th>
                      <th className="text-left px-3 py-2.5">Type</th>
                      <th className="text-left px-3 py-2.5">Assoc</th>
                      <th className="text-left px-3 py-2.5">Region</th>
                      <th className="text-left px-3 py-2.5">Status</th>
                      <th className="text-left px-3 py-2.5">Contact</th>
                      <th className="px-3 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors align-top">
                        <td className="px-3 py-2.5">
                          <p className="font-semibold text-slate-900">{p.name}</p>
                          {p.notes && <p className="text-[11px] text-amber-600 font-medium">{p.notes}</p>}
                        </td>
                        <td className="px-3 py-2.5 capitalize text-slate-600">{p.type}</td>
                        <td className="px-3 py-2.5 text-slate-600">{p.association ?? '—'}</td>
                        <td className="px-3 py-2.5 text-slate-600">{p.region}</td>
                        <td className="px-3 py-2.5">
                          <select
                            value={p.status}
                            onChange={(e) => patch(p.id, { status: e.target.value as Partner['status'] })}
                            className={`text-[11px] font-bold uppercase tracking-wider rounded-full border px-2 py-1 cursor-pointer ${STATUS_TONE[p.status]}`}
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex flex-col gap-1 min-w-[200px]">
                            <ContactInput
                              placeholder="Contact name"
                              value={p.contactName}
                              onSave={(v) => patch(p.id, { contactName: v })}
                            />
                            <ContactInput
                              placeholder="Contact email"
                              value={p.contactEmail}
                              onSave={(v) => patch(p.id, { contactEmail: v })}
                            />
                            <ContactInput
                              placeholder="Role"
                              value={p.contactRole}
                              onSave={(v) => patch(p.id, { contactRole: v })}
                            />
                          </div>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <a
                            href={`/partners/${p.slug}?k=${encodeURIComponent(p.accessKey)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-xs font-semibold text-accent hover:text-accent-dark"
                            title="Open partner page in new tab"
                          >
                            View page <ExternalLink className="w-3 h-3 ml-0.5" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white border border-slate-200 p-3">
      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1 truncate">{label}</p>
      <p className="text-xl font-bold tabular-nums text-slate-900">{value}</p>
    </div>
  )
}

/** Inline text field that PATCHes on blur (or Enter) only when changed. */
function ContactInput({
  placeholder,
  value,
  onSave,
}: {
  placeholder: string
  value: string | null
  onSave: (v: string) => void
}) {
  const [v, setV] = useState(value ?? '')
  useEffect(() => {
    setV(value ?? '')
  }, [value])
  const commit = () => {
    if (v !== (value ?? '')) onSave(v)
  }
  return (
    <input
      value={v}
      placeholder={placeholder}
      onChange={(e) => setV(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
      }}
      className="text-xs rounded-md border border-slate-200 px-2 py-1 text-slate-700 placeholder:text-slate-300 focus:border-accent focus:outline-none"
    />
  )
}
