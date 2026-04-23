'use client'

import { useState, useEffect, useCallback } from 'react'
import { Mail, MousePointerClick, Eye, AlertCircle, TrendingUp, Users, Loader2, RefreshCw, ExternalLink, Download } from 'lucide-react'

interface Totals {
  emails: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  complained: number
  deliveryRate: number
  openRate: number
  clickRate: number
  clickThroughOnOpen: number
  bounceRate: number
}

interface SequenceRow {
  sequence: string
  emails: number
  delivered: number
  opened: number
  clicked: number
  openRate: number
  clickRate: number
}

interface Engagement {
  email: string
  name: string | null
  accessLevel: string
  signupSource: string | null
  sends: number
  opens: number
  clicks: number
  lastOpen: string | null
  lastClick: string | null
  lastClickUrl: string | null
  createdAt: string
  lastLoginAt: string | null
}

interface StatsResp {
  windowDays: number
  totals: Totals
  bySequence: SequenceRow[]
  topClicks: { url: string; clicks: number }[]
  note?: string
  error?: string
}

interface RetargetingResp {
  windowDays: number
  counts: {
    totalRecipients: number
    hotClickers: number
    warmOpeners: number
    convertedClickers: number
    coldNonOpeners: number
  }
  hotClickers: Engagement[]
  warmOpeners: Engagement[]
  convertedClickers: Engagement[]
  coldNonOpeners: Engagement[]
  error?: string
}

const WINDOWS = [7, 30, 90] as const

type Tab = 'hotClickers' | 'warmOpeners' | 'convertedClickers' | 'coldNonOpeners'

const TAB_LABELS: Record<Tab, string> = {
  hotClickers: 'Hot (clicked, still preview)',
  warmOpeners: 'Warm (opened, no click)',
  convertedClickers: 'Converted clickers (bought)',
  coldNonOpeners: 'Cold (no opens in window)',
}

export default function EmailAnalyticsPage() {
  const [days, setDays] = useState<number>(30)
  const [stats, setStats] = useState<StatsResp | null>(null)
  const [retarget, setRetarget] = useState<RetargetingResp | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('hotClickers')
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const [s, r] = await Promise.all([
        fetch(`/api/admin/email-stats?days=${days}`, { cache: 'no-store' }).then((r) => r.json()),
        fetch(`/api/admin/email-retargeting?days=${days}`, { cache: 'no-store' }).then((r) => r.json()),
      ])
      if (s.error) setErr(s.error)
      if (r.error && !s.error) setErr(r.error)
      setStats(s)
      setRetarget(r)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => { load() }, [load])

  const syncFromResend = useCallback(async () => {
    setSyncing(true)
    setSyncMsg(null)
    try {
      const r = await fetch(`/api/admin/sync-resend-events?days=${days}`, {
        method: 'POST',
        cache: 'no-store',
      }).then((r) => r.json())
      if (r.error) {
        setSyncMsg(`Sync failed: ${r.error}`)
      } else {
        const { checked, inserted, capped } = r
        setSyncMsg(
          `Checked ${checked} email${checked === 1 ? '' : 's'} — backfilled ${inserted.opened} open${inserted.opened === 1 ? '' : 's'}, ${inserted.clicked} click${inserted.clicked === 1 ? '' : 's'}${capped ? ' (capped — run again for more).' : '.'}`
        )
        await load()
      }
    } catch (e) {
      setSyncMsg(`Sync failed: ${(e as Error).message}`)
    } finally {
      setSyncing(false)
    }
  }, [days, load])

  const bucket = retarget ? retarget[tab] : []

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Email Analytics</h1>
            <p className="text-slate-600 text-sm">Delivery, opens, clicks, and retargeting candidates from Resend webhook events.</p>
          </div>
          <div className="flex items-center gap-2">
            {WINDOWS.map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${days === d ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
              >
                {d}d
              </button>
            ))}
            <button
              onClick={load}
              disabled={loading}
              className="ml-1 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Refresh
            </button>
            <button
              onClick={syncFromResend}
              disabled={syncing || loading}
              title="Poll Resend API for opens/clicks missing from webhook feed"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              Sync from Resend
            </button>
          </div>
        </div>

        {syncMsg && (
          <div className="mb-6 rounded-lg bg-slate-900 text-white p-3 text-sm flex items-center justify-between gap-3">
            <span>{syncMsg}</span>
            <button onClick={() => setSyncMsg(null)} className="text-white/60 hover:text-white text-xs">dismiss</button>
          </div>
        )}

        {err && (
          <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">{err}</p>
                <p className="text-amber-800">
                  Resend webhook probably isn&apos;t wired yet. Resend → Webhooks → Add endpoint → <code className="bg-amber-100 px-1.5 py-0.5 rounded">https://portal.concussion-education-australia.com/api/webhooks/resend</code>
                  {' '}— tick <code>email.delivered</code>, <code>email.opened</code>, <code>email.clicked</code>, <code>email.bounced</code>, <code>email.complained</code>. Copy the signing secret (<code>whsec_...</code>) into the Vercel env var <code>RESEND_WEBHOOK_SECRET</code> and redeploy.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Totals */}
        {stats && stats.totals && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <StatCard icon={Mail} label="Emails" value={stats.totals.emails.toLocaleString()} sub={`${stats.totals.delivered} delivered`} color="slate" />
            <StatCard icon={TrendingUp} label="Delivery" value={`${stats.totals.deliveryRate}%`} sub={`${stats.totals.bounced} bounced`} color="emerald" />
            <StatCard icon={Eye} label="Open rate" value={`${stats.totals.openRate}%`} sub={`${stats.totals.opened} opened`} color="blue" />
            <StatCard icon={MousePointerClick} label="Click rate" value={`${stats.totals.clickRate}%`} sub={`${stats.totals.clicked} clicked`} color="purple" />
            <StatCard icon={AlertCircle} label="Bounce rate" value={`${stats.totals.bounceRate}%`} sub={`${stats.totals.complained} complaints`} color={stats.totals.bounceRate > 2 ? 'red' : 'slate'} />
          </div>
        )}

        {/* By sequence */}
        {stats && stats.bySequence && stats.bySequence.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 mb-6 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900">By sequence</h2>
              <p className="text-xs text-slate-500">Emails grouped by the <code>sequence</code> tag set at send time.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <Th>Sequence</Th>
                    <Th align="right">Sent</Th>
                    <Th align="right">Delivered</Th>
                    <Th align="right">Opens</Th>
                    <Th align="right">Clicks</Th>
                    <Th align="right">Open %</Th>
                    <Th align="right">Click %</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.bySequence.map((r) => (
                    <tr key={r.sequence} className="hover:bg-slate-50">
                      <Td className="font-medium">{r.sequence}</Td>
                      <Td align="right">{r.emails}</Td>
                      <Td align="right">{r.delivered}</Td>
                      <Td align="right">{r.opened}</Td>
                      <Td align="right">{r.clicked}</Td>
                      <Td align="right">{r.openRate}%</Td>
                      <Td align="right">{r.clickRate}%</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top clicks */}
        {stats && stats.topClicks && stats.topClicks.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 mb-6 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900">Top clicked URLs</h2>
            </div>
            <ul className="divide-y divide-slate-100">
              {stats.topClicks.map((c) => (
                <li key={c.url} className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-slate-50">
                  <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-700 hover:text-slate-900 truncate inline-flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{c.url}</span>
                  </a>
                  <span className="text-sm font-semibold text-slate-900 flex-shrink-0">{c.clicks}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Retargeting buckets */}
        {retarget && retarget.counts && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              <div>
                <h2 className="text-base font-bold text-slate-900">Retargeting candidates</h2>
                <p className="text-xs text-slate-500">Joined with users table — click emails to copy.</p>
              </div>
            </div>

            <div className="flex gap-1 px-5 py-3 border-b border-slate-200 overflow-x-auto">
              {(Object.keys(TAB_LABELS) as Tab[]).map((t) => {
                const count = retarget.counts[t === 'hotClickers' ? 'hotClickers' : t === 'warmOpeners' ? 'warmOpeners' : t === 'convertedClickers' ? 'convertedClickers' : 'coldNonOpeners']
                return (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${tab === t ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {TAB_LABELS[t]} ({count})
                  </button>
                )
              })}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <Th>Email</Th>
                    <Th>Name</Th>
                    <Th>Access</Th>
                    <Th align="right">Sends</Th>
                    <Th align="right">Opens</Th>
                    <Th align="right">Clicks</Th>
                    <Th>Last activity</Th>
                    <Th>Last click URL</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bucket.map((u) => (
                    <tr key={u.email} className="hover:bg-slate-50">
                      <Td>
                        <button
                          onClick={() => navigator.clipboard?.writeText(u.email)}
                          title="Click to copy"
                          className="font-medium text-slate-900 hover:text-accent"
                        >
                          {u.email}
                        </button>
                      </Td>
                      <Td>{u.name || <span className="text-slate-400">—</span>}</Td>
                      <Td>
                        <AccessBadge level={u.accessLevel} />
                      </Td>
                      <Td align="right">{u.sends}</Td>
                      <Td align="right">{u.opens}</Td>
                      <Td align="right">{u.clicks}</Td>
                      <Td className="text-xs text-slate-500 whitespace-nowrap">
                        {formatWhen(u.lastClick || u.lastOpen)}
                      </Td>
                      <Td className="text-xs text-slate-500">
                        {u.lastClickUrl ? (
                          <a href={u.lastClickUrl} target="_blank" rel="noopener noreferrer" className="truncate inline-block max-w-[200px] hover:underline">
                            {u.lastClickUrl}
                          </a>
                        ) : <span className="text-slate-300">—</span>}
                      </Td>
                    </tr>
                  ))}
                  {bucket.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-slate-400 text-sm">
                        {loading ? 'Loading...' : 'No recipients in this bucket for the selected window.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  color: 'slate' | 'emerald' | 'blue' | 'purple' | 'red'
}) {
  const colorMap = {
    slate: 'text-slate-600 bg-slate-100',
    emerald: 'text-emerald-600 bg-emerald-50',
    blue: 'text-blue-600 bg-blue-50',
    purple: 'text-purple-600 bg-purple-50',
    red: 'text-red-600 bg-red-50',
  }
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg mb-2 ${colorMap[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-900 leading-tight">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  )
}

function AccessBadge({ level }: { level: string }) {
  const style = level === 'preview'
    ? 'bg-green-100 text-green-700'
    : level === 'online-only' || level === 'full-course'
    ? 'bg-purple-100 text-purple-700'
    : 'bg-slate-100 text-slate-500'
  return <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${style}`}>{level}</span>
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return <th className={`px-4 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider ${align === 'right' ? 'text-right' : 'text-left'}`}>{children}</th>
}
function Td({ children, align = 'left', className = '' }: { children: React.ReactNode; align?: 'left' | 'right'; className?: string }) {
  return <td className={`px-4 py-3 ${align === 'right' ? 'text-right' : 'text-left'} ${className}`}>{children}</td>
}

function formatWhen(iso: string | null): string {
  if (!iso) return '—'
  const then = new Date(iso).getTime()
  const now = Date.now()
  const mins = Math.floor((now - then) / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 48) return `${hrs}h ago`
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}
