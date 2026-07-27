'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plug, CheckCircle2, Loader2, Unplug } from 'lucide-react'

/**
 * Per-clinic PMS connection card — "your team stays in Gensolve/Cliniko; SST
 * files the reports into it." Authorised by the clinic's code + viewKey (the
 * pair this surface already holds). Cliniko is fully live; Gensolve connects
 * and searches now, with report WRITES unlocking on first-partner validation
 * (the API explains this when asked to file).
 */
export function PmsConnect({ code, viewKey, demo = false }: { code: string; viewKey: string; demo?: boolean }) {
  const [status, setStatus] = useState<{ connected: boolean; kind: string | null } | null>(null)
  const [kind, setKind] = useState<'cliniko' | 'gensolve'>('cliniko')
  const [apiKey, setApiKey] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const auth = `code=${encodeURIComponent(code)}&k=${encodeURIComponent(viewKey)}`

  const load = useCallback(() => {
    if (demo) {
      setStatus({ connected: true, kind: 'gensolve' })
      return
    }
    void fetch(`/api/sst/pms/connection?${auth}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setStatus({ connected: !!d.connected, kind: d.kind }))
      .catch(() => {})
  }, [auth, demo])
  useEffect(load, [load])

  const connect = async () => {
    setBusy(true)
    setMsg(null)
    try {
      const r = await fetch('/api/sst/pms/connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, k: viewKey, kind, apiKey }),
      })
      const d = await r.json()
      if (r.ok && d.ok) {
        setMsg(`Connected — ${kind} verified with a live search.`)
        setApiKey('')
        load()
      } else {
        setMsg(d.error || 'Connection failed')
      }
    } catch {
      setMsg('Connection failed')
    } finally {
      setBusy(false)
    }
  }

  const disconnect = async () => {
    setBusy(true)
    try {
      await fetch(`/api/sst/pms/connection?${auth}`, { method: 'DELETE' })
      setMsg('Disconnected.')
      setStatus({ connected: false, kind: null })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-5 border-t border-slate-100 pt-4">
      <div className="flex items-center gap-2 mb-1">
        <Plug className="w-4 h-4 text-teal-600" />
        <p className="text-xs font-bold text-foreground m-0">Connect your practice software</p>
      </div>
      <p className="text-[12px] text-muted-foreground m-0 mb-3">
        Your team keeps working in your PMS — SST files each report into the patient&rsquo;s record
        there. No re-keying, no second system.
      </p>

      {status?.connected ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> {status.kind} connected
            {demo && <span className="rounded bg-amber-50 border border-amber-200 px-1 text-[9px] font-bold text-amber-700">DEMO</span>}
          </span>
          {status.kind === 'gensolve' && (
            <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
              search live · report filing unlocks with tenant validation
            </span>
          )}
          <button
            type="button"
            onClick={demo ? undefined : disconnect}
            disabled={busy || demo}
            className="inline-flex items-center gap-1 text-[12px] font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
          >
            <Unplug className="w-3.5 h-3.5" /> Disconnect
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as 'cliniko' | 'gensolve')}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[13px]"
          >
            <option value="cliniko">Cliniko</option>
            <option value="gensolve">Gensolve</option>
          </select>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={`${kind === 'cliniko' ? 'Cliniko' : 'Gensolve'} API key`}
            className="flex-1 min-w-[180px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px]"
          />
          <button
            type="button"
            onClick={connect}
            disabled={busy || apiKey.trim().length < 8}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-[13px] font-bold text-white hover:bg-teal-700 disabled:opacity-50 transition"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plug className="w-3.5 h-3.5" />}
            Connect
          </button>
        </div>
      )}
      {msg && <p className="text-[12px] text-slate-600 mt-2 m-0">{msg}</p>}
      <p className="text-[11px] text-muted-foreground/80 mt-2 m-0">
        The key is stored encrypted, used only to search patients and file reports your clinician
        triggers, and can be disconnected any time. Gensolve: your key is generated per tenant in
        GPM; connection verifies with a read-only search.
      </p>
    </div>
  )
}
