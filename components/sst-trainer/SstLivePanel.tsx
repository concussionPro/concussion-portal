'use client'

import { useEffect, useState } from 'react'

/**
 * Clinician live in-session monitor. Polls /api/sst/live?code= every 3s and
 * shows the clinic's patients who are training RIGHT NOW — their live HR, target
 * band, and whether they're under / in / over the band. Patients drop off
 * automatically ~15s after their last tick (session ended / app closed).
 *
 * LIVENESS IS ASSERTED, NOT ASSUMED (2026-08-05 crawl #6): the read endpoint
 * rate-limits 60/min per clinic code and this panel polls 20/min, so three hub
 * tabs at one clinic 429. A dropped poll used to leave the last frame on screen
 * WITH the red "live" ping — a clinician watching a frozen heart rate believing
 * it was live. Any non-OK response, any thrown fetch, or ticks older than the
 * server's 15s TTL now kill the live animation and say so; 429 also backs the
 * poll off so the panel stops making its own rate limit worse.
 */
interface LivePatient {
  patientLabel: string
  /** install UUID (stable per device) — null only from pre-field app builds */
  patientRef?: string | null
  bpm: number | null
  bandLow: number | null
  bandHigh: number | null
  zone: 'under' | 'in' | 'over' | null
  elapsedSec: number | null
  /** server clock, ms — the tick's age is what makes "live" true */
  updatedAt?: number
}

/** Server TTL is 15s; anything older than this is not a live reading. */
const STALE_MS = 20_000
const POLL_MS = 3_000
const BACKOFF_MS = 15_000

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
  /** ok = the last poll landed; lost = we are NOT receiving live data. */
  const [conn, setConn] = useState<'ok' | 'lost'>('ok')
  const [throttled, setThrottled] = useState(false)
  /** ticks every second so a frame that stops refreshing goes stale on screen
   *  even while no poll is landing. */
  const [now, setNow] = useState(() => Date.now())
  // 0 until the first poll lands; `stale` is only consulted once we have
  // patients, which can only come from a poll that set this.
  const [lastOk, setLastOk] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!code) return
    let alive = true
    let stopped = false
    let timer: ReturnType<typeof setTimeout> | null = null
    // View-key contract: GET /api/sst/live?code=X&k=VIEWKEY — 401 without a
    // valid k for any non-DEMO00 code. DEMO00 stays public (no key).
    const url = `/api/sst/live?code=${encodeURIComponent(code)}${viewKey ? `&k=${encodeURIComponent(viewKey)}` : ''}`
    const schedule = (ms: number) => {
      if (stopped) return
      timer = setTimeout(() => void poll(), ms)
    }
    const poll = async () => {
      if (stopped) return
      try {
        const res = await fetch(url, { cache: 'no-store' })
        if (res.status === 401 || res.status === 403) {
          stopped = true
          if (timer) clearTimeout(timer)
          if (alive) setDenied(true)
          return
        }
        if (!res.ok) {
          // 429 = we are polling harder than the clinic's shared budget (other
          // tabs/seats count too) — back off instead of hammering it.
          const rateLimited = res.status === 429
          if (alive) {
            setConn('lost')
            setThrottled(rateLimited)
            setLoaded(true)
          }
          schedule(rateLimited ? BACKOFF_MS : POLL_MS)
          return
        }
        const data = await res.json()
        if (alive) {
          setActive(Array.isArray(data.active) ? data.active : [])
          setConn('ok')
          setThrottled(false)
          setLoaded(true)
          setLastOk(Date.now())
        }
        schedule(POLL_MS)
      } catch {
        // offline / transient — the last frame stays, but it stops claiming live
        if (alive) {
          setConn('lost')
          setLoaded(true)
        }
        schedule(POLL_MS)
      }
    }
    void poll()
    return () => {
      alive = false
      stopped = true
      if (timer) clearTimeout(timer)
    }
  }, [code, viewKey])

  // A tick older than the server's TTL is not a live reading — whether the poll
  // failed or the patient simply stopped mid-frame.
  const newestTick = active.reduce<number>((max, p) => (typeof p.updatedAt === 'number' && p.updatedAt > max ? p.updatedAt : max), 0)
  const stale =
    active.length > 0 &&
    (conn === 'lost' || now - lastOk > STALE_MS || (newestTick > 0 && now - newestTick > STALE_MS))
  const isLive = active.length > 0 && !stale

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

  // IDLE = healthy poll, nobody training. This used to render the full panel —
  // three lines of provenance language as the first thing on the page, with no
  // readings for it to qualify (2026-08-11 design pass). Idle is one quiet
  // line; the provenance paragraph returns with the data it qualifies.
  if (active.length === 0 && conn === 'ok') {
    return (
      <div className="mb-6 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5">
        <span className="relative inline-flex h-2 w-2 flex-none rounded-full bg-slate-300" />
        <span className="text-xs font-bold text-slate-700">Live now</span>
        <span className="truncate text-xs text-slate-500">
          no active sessions — patients training with this clinic code appear here in real time
        </span>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 mb-6">
      <div className="flex items-center gap-2 mb-3">
        {/* The ping is the "this is live" claim — it must never outlive the
            data. No poll landing, or ticks past the TTL, and it stops. */}
        <span className={`relative flex h-2.5 w-2.5 ${isLive ? '' : 'opacity-40'}`}>
          {isLive && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />}
          <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${isLive ? 'bg-red-500' : 'bg-slate-400'}`} />
        </span>
        <h3 className="text-sm font-bold text-slate-900">Live now</h3>
        <span className="text-xs text-slate-500">
          {stale
            ? 'not receiving data'
            : active.length
              ? `${active.length} training`
              : 'no active sessions'}
        </span>
      </div>
      {conn === 'lost' && (
        <div className="-mt-1 mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11.5px] leading-snug text-amber-900">
          <strong>Connection lost — reconnecting…</strong>{' '}
          {throttled
            ? 'Too many live views open on this clinic code; retrying more slowly. Close spare hub tabs to restore the 3-second refresh.'
            : active.length > 0
              ? 'The readings below are the last ones received, not current. Do not treat them as live.'
              : 'No live updates are reaching this view — a patient training right now may not appear.'}
        </div>
      )}
      {conn === 'ok' && stale && (
        <div className="-mt-1 mb-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11.5px] leading-snug text-slate-700">
          <strong>No recent readings.</strong> The last update is over {Math.round(STALE_MS / 1000)}s old — the
          patient&rsquo;s session has probably ended. Values below are their last known readings.
        </div>
      )}
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
              <div
                key={p.patientRef ?? p.patientLabel}
                className={`flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 ${stale ? 'opacity-60' : ''}`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{p.patientLabel}</p>
                  <p className="text-[11px] text-slate-500">
                    {p.bandLow != null && p.bandHigh != null ? `target ${p.bandLow}–${p.bandHigh} bpm` : 'no band'}
                    {p.elapsedSec != null ? ` · ${fmtElapsed(p.elapsedSec)}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-none">
                  <span className="text-2xl font-bold tabular-nums text-slate-900">{p.bpm ?? '—'}</span>
                  <span className="text-[10px] text-slate-500">{stale ? 'bpm (last)' : 'bpm'}</span>
                  {/* zone colour is NOT muted when stale — an over-band last
                      reading is still the clinically important fact; the header
                      banner and the "(last)" unit carry the liveness caveat. */}
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
