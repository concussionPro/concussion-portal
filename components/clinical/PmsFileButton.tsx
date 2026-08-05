'use client'

import { useEffect, useState } from 'react'
import { Send, Loader2, CheckCircle2, X, Search, AlertTriangle } from 'lucide-react'

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

export function PmsFileButton({ clinicCode, viewKey, patientName, patientRef = null, demo = false }: {
  clinicCode: string
  viewKey: string
  patientName: string
  /** install-UUID identity — disambiguates same-named patients (round-3 #3) */
  patientRef?: string | null
  /** DEMO00 showcase: full Gensolve filing flow, clearly labelled, writes nothing. */
  demo?: boolean
}) {
  const [pms, setPms] = useState<string | null>(demo ? 'gensolve' : null)
  // A connection the API could not verify (revoked key, rotated server secret).
  // The control stays visible — the clinician still needs to know filing exists
  // — but it says so up front instead of failing after they pick a patient.
  const [needsAttention, setNeedsAttention] = useState(false)
  const [healthMessage, setHealthMessage] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const auth = `code=${encodeURIComponent(clinicCode)}&k=${encodeURIComponent(viewKey)}`
  useEffect(() => {
    if (demo) return
    let alive = true
    void fetch(`/api/sst/pms/connection?${auth}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive || !d?.connected) return
        setPms(d.kind)
        setNeedsAttention(d.needsAttention === true)
        setHealthMessage(typeof d.message === 'string' ? d.message : null)
      })
      .catch(() => {})
    return () => { alive = false }
  }, [auth, demo])

  if (!pms) return null
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          needsAttention
            ? 'inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 transition'
            : 'inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition'
        }
      >
        {needsAttention ? <AlertTriangle className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
        {needsAttention ? `${pms} needs attention` : `File to ${pms}`}
      </button>
      {open && (
        <FileModal
          auth={auth}
          clinicCode={clinicCode}
          viewKey={viewKey}
          patientName={patientName}
          patientRef={patientRef}
          pms={pms}
          demo={demo}
          healthMessage={needsAttention ? healthMessage : null}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

function FileModal({ auth, clinicCode, viewKey, patientName, patientRef = null, pms, demo = false, healthMessage = null, onClose }: {
  auth: string
  clinicCode: string
  viewKey: string
  patientName: string
  patientRef?: string | null
  pms: string
  demo?: boolean
  /** set when the connection GET could not verify the connection */
  healthMessage?: string | null
  onClose: () => void
}) {
  const [q, setQ] = useState(patientName)
  const [results, setResults] = useState<Array<{ id: string; name: string; dob: string | null }>>([])
  const [searching, setSearching] = useState(false)
  const [picked, setPicked] = useState<{ id: string; name: string } | null>(null)
  const [skin, setSkin] = useState('gp-report')
  const [claim, setClaim] = useState('')
  // Filed notes must carry the acting clinician. Opened from the keyed hub
  // link there is no portal session for the server to resolve, so ask once
  // and remember (2026-08-05 sweep #12).
  // Namespaced per clinic (2026-08-05): a device-global key meant a shared
  // clinic tablet pre-filled the previous clinician's name for everyone.
  const clinicianKey = `sst:filing-clinician:${clinicCode}`
  const [clinician, setClinician] = useState(() => {
    try { return window.localStorage.getItem(clinicianKey) || '' } catch { return '' }
  })
  const [busy, setBusy] = useState(false)
  // `unknown` = we never got an answer, so we must NOT claim "Not filed".
  const [result, setResult] = useState<{ ok: boolean; msg: string; unknown?: boolean } | null>(null)

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
      const d = await r.json().catch(() => null)
      setResults(d?.patients ?? [])
      // A FAILED search rendered as "No matches — refine the search", so an
      // expired key or a PMS outage looked like the patient wasn't in the PMS.
      if (r.status === 404) setResult({ ok: false, msg: 'No PMS connected' })
      else if (!r.ok) {
        setResult({
          ok: false,
          msg: d?.error || `${pms} could not be searched just now — this is a connection problem, not an empty result. Try again in a moment.`,
        })
      }
    } catch {
      setResult({ ok: false, msg: `Could not reach ${pms} to search — this is a connection problem, not an empty result.` })
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
          ref: patientRef || undefined,
          skin, pmsPatientId: picked.id, claim: claim.trim() || undefined,
          clinician: clinician.trim() || undefined,
        }),
      })
      const d = await r.json()
      // The server now returns an ACTIONABLE message ("the stored API key is no
      // longer valid … reconnect, then file again") instead of the adapter's
      // raw "cliniko: HTTP 401" — and it is rendered as an error, not as an
      // amber note the same colour as the informational text beneath it.
      setResult(r.ok && d.ok
        ? { ok: true, msg: `Filed to ${picked.name}'s record in ${pms}.` }
        : { ok: false, msg: d.error || `${pms} refused the note — nothing was filed. Try again in a moment.` })
    } catch {
      // A dropped/timed-out request leaves the outcome UNKNOWN — the write may
      // well have landed. Claiming "nothing was filed" here and inviting a
      // retry is how a patient record ends up with two copies of the same
      // report (there is no idempotency key on a PMS note). Say what is
      // actually true (2026-08-05 reporting-integrity sweep).
      setResult({
        ok: false,
        unknown: true,
        msg: `The connection to ${pms} dropped before we got an answer, so we can't confirm whether the note was filed. Check ${picked.name}'s record in ${pms} before filing again — a second attempt would create a duplicate note.`,
      })
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

        {/* Connection is known-broken BEFORE anything is attempted — say so
            here rather than letting the clinician pick a patient, hit File, and
            discover it then. */}
        {healthMessage && (
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <AlertTriangle className="mt-0.5 w-3.5 h-3.5 flex-shrink-0 text-red-600" />
            <p className="m-0 text-[12px] leading-snug text-red-700">{healthMessage}</p>
          </div>
        )}

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

        <input
          value={clinician}
          onChange={(e) => {
            setClinician(e.target.value)
            try { window.localStorage.setItem(clinicianKey, e.target.value) } catch { /* private mode */ }
          }}
          placeholder="Filing as (your name — appears on the note)"
          className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px]"
        />

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
          result.ok ? (
            <p className="m-0 mb-3 text-[12.5px] font-medium text-emerald-700">
              <CheckCircle2 className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />{result.msg}
            </p>
          ) : (
            <div className="m-0 mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
              <AlertTriangle className="mt-0.5 w-3.5 h-3.5 flex-shrink-0 text-red-600" />
              <div>
                <p className="m-0 text-[12px] font-bold text-red-800">
                  {result.unknown ? 'Filing status unknown — check the record' : 'Not filed'}
                </p>
                <p className="m-0 mt-0.5 text-[12px] leading-snug text-red-700">{result.msg}</p>
              </div>
            </div>
          )
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
