'use client'

import { useEffect, useState } from 'react'

/**
 * Clinician live in-session monitor. Polls /api/sst/live?code= every 3s and
 * shows the clinic's patients who are training RIGHT NOW — their live HR, target
 * band, and whether they're under / in / over the band. Patients drop off
 * automatically ~15s after their last tick (session ended / app closed).
 */
interface LivePatient {
  patientLabel: string
  bpm: number | null
  bandLow: number | null
  bandHigh: number | null
  zone: 'under' | 'in' | 'over' | null
  elapsedSec: number | null
}

function fmtElapsed(s: number | null) {
  if (s == null) return ''
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}

const ZONE = {
  in: { label: 'In band', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  under: { label: 'Below band', cls: 'bg-amber-100 text-amber-800 border-amber-300' },
  over: { label: 'OVER band', cls: 'bg-red-100 text-red-800 border-red-300' },
}

export function SstLivePanel({ code, viewKey }: { code: string; viewKey?: string | null }) {
  const [active, setActive] = useState<LivePatient[]>([])
  const [loaded, setLoaded] = useState(false)
  const [denied, setDenied] = useState(false)

  useEffect(() => {
    if (!code) return
    let alive = true
    let stopped = false
    let iv: ReturnType<typeof setInterval> | null = null
    // View-key contract: GET /api/sst/live?code=X&k=VIEWKEY — 401 without a
    // valid k for any non-DEMO00 code. DEMO00 stays public (no key).
    const url = `/api/sst/live?code=${encodeURIComponent(code)}${viewKey ? `&k=${encodeURIComponent(viewKey)}` : ''}`
    const poll = async () => {
      if (stopped) return
      try {
        const res = await fetch(url, { cache: 'no-store' })
        if (res.status === 401 || res.status === 403) {
          stopped = true
          if (iv) clearInterval(iv)
          if (alive) setDenied(true)
          return
        }
        if (!res.ok) return
        const data = await res.json()
        if (alive) setActive(Array.isArray(data.active) ? data.active : [])
      } catch {
        /* transient — keep the last frame */
      } finally {
        if (alive) setLoaded(true)
      }
    }
    poll()
    iv = setInterval(poll, 3000)
    return () => {
      alive = false
      stopped = true
      if (iv) clearInterval(iv)
    }
  }, [code, viewKey])

  if (denied) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 mb-6">
        <h3 className="text-sm font-bold text-amber-900 mb-1">Live view locked</h3>
        <p className="text-xs text-amber-800 leading-relaxed">
          This hub link is missing its clinic key — use the link from your welcome email.
        </p>
      </div>
    )
  }

  if (!loaded && active.length === 0) return null

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className={`relative flex h-2.5 w-2.5 ${active.length ? '' : 'opacity-40'}`}>
          {active.length > 0 && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />}
          <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${active.length ? 'bg-red-500' : 'bg-slate-400'}`} />
        </span>
        <h3 className="text-sm font-bold text-slate-900">Live now</h3>
        <span className="text-xs text-slate-500">{active.length ? `${active.length} training` : 'no active sessions'}</span>
      </div>
      <p className="text-[11.5px] text-slate-500 -mt-2 mb-3">
        <strong>Provenance-verified</strong> live HR — streamed from a paired sensor and signal-quality gated, never held or estimated. This is a data-integrity guarantee, <strong>not an accuracy guarantee</strong>: chest-strap HR is most accurate, wrist/optical has known error during exercise. Interpret with clinical judgment.
      </p>

      {active.length === 0 ? (
        <p className="text-xs text-slate-500">When a patient runs a session with this clinic code, they appear here in real time.</p>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {active.map((p) => {
            const z = p.zone ? ZONE[p.zone] : null
            return (
              <div key={p.patientLabel} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{p.patientLabel}</p>
                  <p className="text-[11px] text-slate-500">
                    {p.bandLow != null && p.bandHigh != null ? `target ${p.bandLow}–${p.bandHigh} bpm` : 'no band'}
                    {p.elapsedSec != null ? ` · ${fmtElapsed(p.elapsedSec)}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-none">
                  <span className="text-2xl font-bold tabular-nums text-slate-900">{p.bpm ?? '—'}</span>
                  <span className="text-[10px] text-slate-500">bpm</span>
                  {z && <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md border ${z.cls}`}>{z.label}</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
