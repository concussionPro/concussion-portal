'use client'

import { useEffect, useState } from 'react'
import { Send, Loader2, CheckCircle2, X, Search } from 'lucide-react'

/**
 * "File to PMS" — the hub-side end of the plugin. The clinician picks the
 * report type and the matching patient IN THEIR PMS (the identity bridge:
 * picked at filing time, never stored, never synced), and the report lands in
 * that patient's record as a clinical note. Renders only when the clinic has a
 * PMS connected; the API owns every rule (jurisdiction, Gensolve write gate).
 */
const SKINS: Array<[string, string]> = [
  ['gp-report', 'GP report'],
  ['rtp-clearance', 'RTP data summary'],
  ['medicolegal', 'Clinical record'],
  ['acc884', 'ACC884 (NZ)'],
]

export function PmsFileButton({ clinicCode, viewKey, patientName, demo = false }: {
  clinicCode: string
  viewKey: string
  patientName: string
  /** DEMO00 showcase: full Gensolve filing flow, clearly labelled, writes nothing. */
  demo?: boolean
}) {
  const [pms, setPms] = useState<string | null>(demo ? 'gensolve' : null)
  const [open, setOpen] = useState(false)

  const auth = `code=${encodeURIComponent(clinicCode)}&k=${encodeURIComponent(viewKey)}`
  useEffect(() => {
    if (demo) return
    let alive = true
    void fetch(`/api/sst/pms/connection?${auth}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive && d?.connected) setPms(d.kind) })
      .catch(() => {})
    return () => { alive = false }
  }, [auth, demo])

  if (!pms) return null
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition"
      >
        <Send className="w-3.5 h-3.5" /> File to {pms}
      </button>
      {open && (
        <FileModal
          auth={auth}
          clinicCode={clinicCode}
          viewKey={viewKey}
          patientName={patientName}
          pms={pms}
          demo={demo}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

function FileModal({ auth, clinicCode, viewKey, patientName, pms, demo = false, onClose }: {
  auth: string
  clinicCode: string
  viewKey: string
  patientName: string
  pms: string
  demo?: boolean
  onClose: () => void
}) {
  const [q, setQ] = useState(patientName)
  const [results, setResults] = useState<Array<{ id: string; name: string; dob: string | null }>>([])
  const [searching, setSearching] = useState(false)
  const [picked, setPicked] = useState<{ id: string; name: string } | null>(null)
  const [skin, setSkin] = useState('gp-report')
  const [claim, setClaim] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const search = async () => {
    setSearching(true)
    setResults([])
    if (demo) {
      // Fixture match — the same patient "found" in Gensolve. No API touched.
      setResults([{ id: 'demo-1', name: patientName, dob: null }])
      setSearching(false)
      return
    }
    try {
      const r = await fetch(`/api/sst/pms/patients?${auth}&q=${encodeURIComponent(q.trim())}`)
      const d = await r.json()
      setResults(d.patients ?? [])
      if (r.status === 404) setResult({ ok: false, msg: 'No PMS connected' })
    } catch {
      setResult({ ok: false, msg: 'Search failed' })
    } finally {
      setSearching(false)
    }
  }
  useEffect(() => { void search() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const file = async () => {
    if (!picked) return
    setBusy(true)
    setResult(null)
    if (demo) {
      setTimeout(() => {
        setResult({ ok: true, msg: `Filed to ${picked.name}'s record in Gensolve (demo — nothing written).` })
        setBusy(false)
      }, 600)
      return
    }
    try {
      const r = await fetch('/api/sst/pms/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: clinicCode, k: viewKey, patient: patientName,
          skin, pmsPatientId: picked.id, claim: claim.trim() || undefined,
        }),
      })
      const d = await r.json()
      setResult(r.ok && d.ok
        ? { ok: true, msg: `Filed to ${picked.name}'s record in ${pms}.` }
        : { ok: false, msg: d.error || 'Filing failed' })
    } catch {
      setResult({ ok: false, msg: 'Filing failed' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="m-0 text-sm font-bold text-slate-900">
            File report to {pms}
            {demo && <span className="ml-2 rounded bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 align-middle">DEMO</span>}
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        </div>

        <p className="m-0 mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">Report</p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {SKINS.map(([k, label]) => (
            <button key={k} type="button" onClick={() => setSkin(k)}
              className={`text-[12px] font-semibold px-2.5 py-1.5 rounded-lg border transition ${skin === k ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {label}
            </button>
          ))}
        </div>

        {skin === 'acc884' && (
          <input value={claim} onChange={(e) => setClaim(e.target.value)} placeholder="ACC45 claim number (optional)"
            className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px]" />
        )}

        <p className="m-0 mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">Patient in {pms}</p>
        <div className="flex gap-1.5 mb-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search()}
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-[13px]" placeholder="Search name…" />
          <button type="button" onClick={search} disabled={searching}
            className="rounded-lg border border-slate-200 px-3 text-slate-600 hover:bg-slate-50">
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
        </div>
        <div className="max-h-40 overflow-y-auto space-y-1 mb-3">
          {results.map((r) => (
            <button key={r.id} type="button" onClick={() => setPicked({ id: r.id, name: r.name })}
              className={`w-full text-left text-[13px] px-3 py-2 rounded-lg border transition ${picked?.id === r.id ? 'border-teal-500 bg-teal-50 font-semibold' : 'border-slate-100 hover:bg-slate-50'}`}>
              {r.name}{r.dob ? <span className="text-slate-400"> · {r.dob}</span> : null}
            </button>
          ))}
          {!searching && results.length === 0 && (
            <p className="text-[12px] text-slate-400 px-1 m-0">No matches — refine the search.</p>
          )}
        </div>

        {result && (
          <p className={`m-0 mb-3 text-[12.5px] font-medium ${result.ok ? 'text-emerald-700' : 'text-amber-700'}`}>
            {result.ok && <CheckCircle2 className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />}{result.msg}
          </p>
        )}

        <button type="button" onClick={file} disabled={!picked || busy || result?.ok}
          className="w-full rounded-xl bg-teal-600 py-2.5 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-50 transition">
          {busy ? 'Filing…' : result?.ok ? 'Filed' : `File ${SKINS.find(([k]) => k === skin)?.[1] ?? 'report'}`}
        </button>
        <p className="m-0 mt-2 text-[10.5px] text-slate-400 leading-snug">
          Files as a clinical note in the selected patient&rsquo;s {pms} record. Review before
          relying on it — the supervising clinician signs off, always.
        </p>
      </div>
    </div>
  )
}
