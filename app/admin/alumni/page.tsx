'use client'

import { useEffect, useState } from 'react'
import { GraduationCap } from 'lucide-react'

interface Alum {
  email: string
  name: string
  location: string
  since: string | null
}

export default function AlumniPage() {
  const [alumni, setAlumni] = useState<Alum[]>([])
  const [byLocation, setByLocation] = useState<Record<string, number>>({})
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/workshop-alumni', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); return }
        setAlumni(d.alumni ?? [])
        setByLocation(d.byLocation ?? {})
        setTotal(d.total ?? 0)
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  // Group alumni by workshop location for display.
  const grouped = alumni.reduce<Record<string, Alum[]>>((acc, a) => {
    (acc[a.location] ??= []).push(a)
    return acc
  }, {})

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-2">
        <GraduationCap className="w-6 h-6 text-emerald-600" />
        <h1 className="text-2xl font-bold text-slate-900">Workshop Alumni</h1>
      </div>
      <p className="text-sm text-slate-500 mb-6">
        Full-course buyers whose workshop has run — <strong>parked &amp; excluded from all outreach</strong> until a
        Level 2 exists. Auto-derived (completed workshop + full-course access); every future workshop joins here the
        moment its date passes.
      </p>

      {loading && <p className="text-slate-400">Loading…</p>}
      {error && <p className="text-red-600">Error: {error}</p>}

      {!loading && !error && total === 0 && (
        <p className="text-slate-500">No alumni yet — they appear here once a workshop date passes.</p>
      )}

      {!loading && total > 0 && (
        <>
          <div className="mb-6 flex flex-wrap gap-3">
            <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-sm font-semibold text-emerald-800">
              {total} alumni · no outreach
            </span>
            {Object.entries(byLocation).map(([loc, n]) => (
              <span key={loc} className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-1.5 text-sm text-slate-700 capitalize">
                {loc.replace(/-/g, ' ')}: {n}
              </span>
            ))}
          </div>

          {Object.entries(grouped).map(([loc, list]) => (
            <div key={loc} className="mb-8">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-2 capitalize">
                {loc.replace(/-/g, ' ')} · {list.length}
              </h2>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-2 font-semibold">Name</th>
                      <th className="px-4 py-2 font-semibold">Email</th>
                      <th className="px-4 py-2 font-semibold">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {list.map((a) => (
                      <tr key={a.email} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 font-medium text-slate-900">{a.name}</td>
                        <td className="px-4 py-2.5 text-slate-600">{a.email}</td>
                        <td className="px-4 py-2.5 text-slate-500">
                          {a.since ? new Date(a.since).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
