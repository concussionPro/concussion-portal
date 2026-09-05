'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Copy, Check, Mail } from 'lucide-react'
import { useSession } from '@/contexts/SessionContext'
import { CONFIG } from '@/lib/config'
import { HUB_ADDON_CAL_URL } from '@/lib/hub-addon-contact'

/**
 * Hub Pack owner seat card — "{claimed} of {cap} seats redeemed", the
 * forwardable key with a copy button, the /join-clinic link, and who has
 * claimed a seat. Renders NOTHING for non-owners: the fetch is gated to
 * full-course users (hub owners are always provisioned at full-course by the
 * Stripe webhook), and /api/hub/mine answers { hub: null } with one indexed
 * SELECT for full-course users who didn't buy a hub. No layout shift either
 * way — the card only mounts once a hub comes back.
 */

interface HubMine {
  code: string
  clinicName: string | null
  clinicianSeats: number
  adminSeats: number
  clinicianUsed: number
  adminUsed: number
  members: Array<{ firstName: string; email: string; role: string }>
}

export function HubSeatsCard() {
  const { user, isLoading } = useSession()
  const [hub, setHub] = useState<HubMine | null>(null)
  const [copied, setCopied] = useState<'key' | 'link' | null>(null)

  const isFullCourse = user?.accessLevel === 'full-course'

  useEffect(() => {
    if (!isFullCourse) return // gate: never fetch for preview/online-only
    let cancelled = false
    fetch('/api/hub/mine', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.hub) setHub(data.hub)
      })
      .catch(() => {
        /* non-owner experience — render nothing */
      })
    return () => { cancelled = true }
  }, [isFullCourse])

  if (isLoading || !isFullCourse || !hub) return null

  const joinUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/join-clinic?key=${hub.code}`
  const claimed = hub.clinicianUsed
  const cap = hub.clinicianSeats
  const pct = cap > 0 ? Math.round((claimed / cap) * 100) : 0

  const copy = (what: 'key' | 'link', text: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(what)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  // No self-serve add-seats flow exists yet (the extra-seat Stripe product
  // doesn't bump the key's cap) — the add-seats path is a reply to Zac.
  const addSeatsMailto = `mailto:${CONFIG.CONTACT_EMAIL}?subject=${encodeURIComponent(
    `Add clinician seats — Hub key ${hub.code}`
  )}&body=${encodeURIComponent(
    `Hi Zac,\n\nWe'd like to add clinician seats to our Hub Pack (key ${hub.code}).\n\nNumber of extra seats: `
  )}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="glass-premium rounded-2xl p-5 sm:p-6 relative overflow-hidden bento-span-2"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center">
          <Users className="w-[18px] h-[18px] text-accent" strokeWidth={1.8} />
        </div>
        <p className="stat-label mb-0">{hub.clinicName ? `${hub.clinicName} — Team Seats` : 'Your Clinic’s Team Seats'}</p>
      </div>

      {/* Seat status */}
      <p className="stat-value">
        {claimed} <span className="text-base font-medium text-muted-foreground">of {cap} seats redeemed</span>
      </p>
      <div className="mt-2 progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      {claimed < cap ? (
        <p className="text-xs text-muted-foreground mt-2">
          {cap - claimed} clinician seat{cap - claimed === 1 ? '' : 's'} still unclaimed — forward the key below to your team.
        </p>
      ) : (
        <p className="text-xs text-accent font-semibold mt-2">All clinician seats redeemed.</p>
      )}

      {/* Forwardable key + join link */}
      <div className="mt-4 rounded-xl border border-border bg-white/50 p-3.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Team access key</p>
        <div className="flex items-center gap-2">
          <code className="text-sm font-bold font-mono tracking-wider text-foreground">{hub.code}</code>
          <button
            onClick={() => copy('key', hub.code)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
            aria-label="Copy access key"
          >
            {copied === 'key' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied === 'key' ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div className="mt-2.5 flex items-center gap-2 min-w-0">
          <a href={joinUrl} className="text-[11px] text-accent truncate hover:underline">{joinUrl}</a>
          <button
            onClick={() => copy('link', joinUrl)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline flex-shrink-0"
            aria-label="Copy join link"
          >
            {copied === 'link' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied === 'link' ? 'Copied' : 'Copy link'}
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          Forward the key or link to your team — each person redeems it once for their own login.
        </p>
      </div>

      {/* Member list */}
      {hub.members.length > 0 && (
        <div className="mt-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Redeemed seats ({hub.members.length})
          </p>
          <ul className="space-y-1.5">
            {hub.members.map((m) => (
              <li key={m.email} className="flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-foreground">{m.firstName}</span>
                <span className="text-muted-foreground truncate">{m.email}</span>
                {m.role === 'admin' && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 uppercase tracking-wider flex-shrink-0">Admin</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Add-seats path — self-serve checkout not live; mailto + Cal today */}
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
        <a
          href={addSeatsMailto}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-accent hover:underline"
        >
          <Mail className="w-3 h-3" />
          Need more seats? Email me — A${CONFIG.COURSE.PRICE_CLINIC_HUB_EXTRA_SEAT} per extra clinician seat
        </a>
        <a
          href={HUB_ADDON_CAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-accent hover:underline"
        >
          or book a 30-min call →
        </a>
      </div>
    </motion.div>
  )
}
