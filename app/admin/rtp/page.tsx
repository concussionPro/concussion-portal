'use client'

import { useEffect, useState } from 'react'

/**
 * Admin RTP roster — orgs + athletes with their current engine-computed pathway
 * state. Gated by middleware (admin_session) AND the /api/admin/rtp route's
 * isAdminRequest check. Read-only Phase 1 view.
 */

interface Org {
  id: number
  name: string
  type: string
  sport: string | null
  shareCode: string
  athleteCount: number
  createdAt: string
}

interface AthleteRow {
  athleteName: string
  shareCode: string
  orgName: string | null
  sport: string | null
  injuryDate: string
  status: string
  grtsStage: number
  grtsStageName: string
  rtlStage: number
  rtlStageName: string
  earliestContactDate: string | null
  redFlag: boolean
  awaitingClearance: boolean
  eligibleToAdvance: boolean
  statusLine: string
}

function fmt(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: '2-digit' })
}

function Badge({ row }: { row: AthleteRow }) {
  if (row.redFlag) return <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700 ring-1 ring-red-200">RED FLAG</span>
  if (row.awaitingClearance) return <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 ring-1 ring-amber-200">AWAITING CLEARANCE</span>
  if (row.status === 'cleared') return <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">RETURNED</span>
  if (row.eligibleToAdvance) return <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-700 ring-1 ring-sky-200">READY TO ADVANCE</span>
  return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">IN PROGRESS</span>
}

export default function AdminRtpPage() {
  const [orgs, setOrgs] = useState<Org[]>([])
  const [athletes, setAthletes] = useState<AthleteRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/admin/rtp', { cache: 'no-store' })
        const json = await res.json()
        if (!res.ok) {
          setError(json.error || 'Failed to load roster')
        } else {
          setOrgs(json.orgs || [])
          setAthletes(json.athletes || [])
        }
      } catch {
        setError('Network error')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-1 flex items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">RTP Tracker — Roster</h1>
        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200">
          PRE-LAUNCH · ADMIN ONLY
        </span>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Organisations and athletes with their live Return-to-Sport / Return-to-Learn pathway state.
        Every stage and date is computed by the shared guideline engine (lib/rtp/protocol.ts).
      </p>

      {loading && <p className="mt-8 text-sm text-slate-500">Loading…</p>}
      {error && <p className="mt-8 text-sm font-semibold text-red-600">{error}</p>}

      {!loading && !error && (
        <>
          {/* Orgs */}
          <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-slate-500">
            Organisations ({orgs.length})
          </h2>
          {orgs.length === 0 ? (
            <p className="mt-2 text-sm text-slate-400">No organisations registered yet.</p>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {orgs.map((o) => (
                <div key={o.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">{o.name}</h3>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500">
                      {o.type}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {o.sport || 'Sport —'} · code <span className="font-mono font-semibold text-teal-700">{o.shareCode}</span> · {o.athleteCount} athlete{o.athleteCount === 1 ? '' : 's'}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Athletes */}
          <h2 className="mt-10 text-sm font-bold uppercase tracking-wide text-slate-500">
            Athletes ({athletes.length})
          </h2>
          {athletes.length === 0 ? (
            <p className="mt-2 text-sm text-slate-400">No athlete pathways yet.</p>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Athlete</th>
                    <th className="px-3 py-2 font-semibold">Org</th>
                    <th className="px-3 py-2 font-semibold">Injured</th>
                    <th className="px-3 py-2 font-semibold">GRTS</th>
                    <th className="px-3 py-2 font-semibold">RTL</th>
                    <th className="px-3 py-2 font-semibold">Earliest contact</th>
                    <th className="px-3 py-2 font-semibold">State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {athletes.map((a) => (
                    <tr key={a.shareCode} className="align-top">
                      <td className="px-3 py-2.5">
                        <div className="font-semibold text-slate-900">{a.athleteName}</div>
                        <div className="font-mono text-[11px] text-slate-400">{a.shareCode}</div>
                      </td>
                      <td className="px-3 py-2.5 text-slate-600">{a.orgName || '—'}</td>
                      <td className="px-3 py-2.5 text-slate-600">{fmt(a.injuryDate)}</td>
                      <td className="px-3 py-2.5 text-slate-600">
                        <span className="font-semibold text-slate-900">{a.grtsStage}/6</span>
                        <div className="text-[11px] text-slate-400">{a.grtsStageName}</div>
                      </td>
                      <td className="px-3 py-2.5 text-slate-600">
                        <span className="font-semibold text-slate-900">{a.rtlStage}/4</span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-600">{fmt(a.earliestContactDate)}</td>
                      <td className="px-3 py-2.5"><Badge row={a} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
