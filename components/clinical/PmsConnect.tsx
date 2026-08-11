'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plug, CheckCircle2, Loader2, Unplug, AlertTriangle } from 'lucide-react'

/**
 * Per-clinic PMS connection card — "your team stays in Gensolve/Cliniko; SST
 * files the reports into it." Authorised by the clinic's code + viewKey (the
 * pair this surface already holds). Cliniko is fully live; Nookal ships with
 * the same flow (live-tenant verification per the MSCC go-live protocol);
 * Gensolve connects
 * and searches now, with report WRITES unlocking on first-partner validation
 * (the API explains this when asked to file).
 */
type PmsStatus = {
  connected: boolean
  kind: string | null
  /** 'ok' = proved recently · 'unknown' = not verified lately · 'error' = the PMS refused us */
  health?: 'ok' | 'unknown' | 'error' | null
  needsAttention?: boolean
  message?: string | null
}

export function PmsConnect({ code, viewKey, demo = false, onStatusChange }: { code: string; viewKey: string; demo?: boolean; onStatusChange?: (connected: boolean) => void }) {
  const [status, setStatus] = useState<PmsStatus | null>(null)
  const [kind, setKind] = useState<'cliniko' | 'gensolve' | 'nookal'>('cliniko')
  const [apiKey, setApiKey] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const auth = `code=${encodeURIComponent(code)}&k=${encodeURIComponent(viewKey)}`

  const load = useCallback(() => {
    if (demo) {
      setStatus({ connected: true, kind: 'cliniko', health: 'ok' })
      return
    }
    void fetch(`/api/sst/pms/connection?${auth}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return
        setStatus({
          connected: !!d.connected,
          kind: d.kind,
          health: d.health ?? null,
          needsAttention: d.needsAttention === true,
          message: typeof d.message === 'string' ? d.message : null,
        })
        // Lets the parent card show/hide its big "connect your PMS" setup step.
        onStatusChange?.(!!d.connected)
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (!window.confirm(
      `Disconnect ${status?.kind ?? 'your practice software'}? Reports stop filing into patient records, and you will need to paste a current API key to reconnect.`,
    )) return
    setBusy(true)
    setMsg(null)
    try {
      // The response was never read: a 401 (or a network drop, which escaped
      // as an unhandled rejection past the catch-less try/finally) still
      // painted "Disconnected." and cleared the card — while the clinic's
      // encrypted PMS key was STILL stored server-side and reports could
      // still be filed into patient records. A revocation that silently
      // didn't happen is the worst possible thing to confirm.
      const r = await fetch(`/api/sst/pms/connection?${auth}`, { method: 'DELETE' })
      const d = await r.json().catch(() => null)
      if (!r.ok || d?.ok !== true) {
        setMsg(d?.error || 'Could NOT disconnect — your practice software is still connected. Try again.')
        load()
        return
      }
      setMsg('Disconnected.')
      setStatus({ connected: false, kind: null })
    } catch {
      setMsg('Could NOT disconnect — your practice software may still be connected. Check the status above and try again.')
      load()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div id="pms-connect" className="mt-5 scroll-mt-24 border-t border-slate-100 pt-4">
      <div className="flex items-center gap-2 mb-1">
        <Plug className="w-4 h-4 text-teal-600" />
        <p className="text-xs font-bold text-foreground m-0">Connect your practice software</p>
      </div>
      <p className="text-[12px] text-muted-foreground m-0 mb-3">
        Your team keeps working in your PMS — SST files each report into the patient&rsquo;s record
        there. No re-keying, no second system.
      </p>

      {status?.connected && (
        <div className="flex flex-wrap items-center gap-2">
          {/* A stored connection is not a WORKING connection: the API probes a
              stale one and reports health, so a revoked key or a rotated server
              secret shows here instead of only failing at filing time. */}
          {status.needsAttention ? (
            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> {status.kind} connection needs attention
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> {status.kind} connected
              {demo && <span className="rounded bg-amber-50 border border-amber-200 px-1 text-[9px] font-bold text-amber-700">DEMO</span>}
            </span>
          )}
          {status.kind === 'gensolve' && !status.needsAttention && (
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
      )}

      {/* Broken connection: say what it means and put the fix right here. */}
      {status?.connected && status.needsAttention && (
        <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <p className="m-0 text-[12px] font-bold text-red-800">Reports will not file until this is reconnected.</p>
          <p className="m-0 mt-1 text-[11.5px] leading-snug text-red-700">
            {status.message ?? `${status.kind} rejected the stored API key. Paste a current key below to reconnect.`}
          </p>
        </div>
      )}

      {(!status?.connected || status.needsAttention) && !demo && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as 'cliniko' | 'gensolve' | 'nookal')}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[13px]"
          >
            <option value="cliniko">Cliniko</option>
            <option value="nookal">Nookal</option>
            <option value="gensolve">Gensolve</option>
          </select>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={`${kind === 'cliniko' ? 'Cliniko' : kind === 'nookal' ? 'Nookal' : 'Gensolve'} API key`}
            className="flex-1 min-w-[180px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px]"
          />
          <button
            type="button"
            onClick={connect}
            disabled={busy || apiKey.trim().length < 8}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-[13px] font-bold text-white hover:bg-teal-700 disabled:opacity-50 transition"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plug className="w-3.5 h-3.5" />}
            {status?.needsAttention ? 'Reconnect' : 'Connect'}
          </button>
        </div>
      )}
      {msg && <p className="text-[12px] text-slate-600 mt-2 m-0">{msg}</p>}
      <p className="text-[11px] text-muted-foreground/80 mt-2 m-0">
        The key is stored encrypted, used only to search patients and file reports your clinician
        triggers, and can be disconnected any time. Nookal: your Practice Manager enables the API
        key under Setup — that key is the only thing we need; cases and filing are handled for you.
        Gensolve: your key is generated per tenant in GPM; connection verifies with a read-only search.
      </p>
    </div>
  )
}
