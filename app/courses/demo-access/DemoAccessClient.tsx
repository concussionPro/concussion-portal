'use client'

import { useState, useRef, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ShieldCheck, Eye, Clock, AlertCircle, Loader2, Check, ArrowRight } from 'lucide-react'

const NDA_VERSION = '2026-05-22-v1'

const NDA_TEXT = `1. PURPOSE OF DISCLOSURE
This preview contains confidential pre-release material owned by Concussion Education Australia ("CEA"). Access is provided for the sole purpose of evaluating a potential partnership or commercial arrangement with CEA.

2. NON-DEVELOPMENT
For a period of 18 months from the date of this access, the recipient and their organisation will not build, fund, commission, or assist any other party in building a substantially similar product based on the materials in this preview.

3. NON-DISCLOSURE
For a period of 24 months, the recipient will not disclose the contents of this preview to third parties outside their organisation. Internal discussion within the recipient's organisation is permitted and encouraged for the purpose stated in clause 1.

4. NO COPYING
The recipient will not download, extract, scrape, screenshot for redistribution, or otherwise reproduce content beyond what is reasonably necessary for internal evaluation.

5. AS-IS
The preview is provided without warranty. Any final commercial arrangement requires a separately negotiated written agreement.

6. JURISDICTION
This agreement is governed by Australian law. Any dispute is heard in the courts of New South Wales.

7. RECORD OF ACCEPTANCE
This is a click-through agreement under the Electronic Transactions Act 1999 (Cth). The recipient's acceptance is logged with organisation, timestamp, IP address, and the version of these terms shown above. Email is optional — provide it if you would like a copy of this agreement sent for your records.

By proceeding, the recipient confirms they are authorised to bind their organisation to the terms above and have read each clause.`

export function DemoAccessClient() {
  const params = useSearchParams()
  const router = useRouter()
  const keyFromUrl = params.get('key') || ''
  const suggestedOrg = params.get('org') || ''
  const suggestedName = params.get('name') || ''

  // Slug-prefilled mode = no form inputs visible. Falls back to manual
  // entry only when the URL didn't come from a /d/<slug> short link.
  const isPrefilled = !!suggestedOrg

  const [email, setEmail] = useState('')
  const [organisation, setOrganisation] = useState(suggestedOrg)
  const [hasScrolled, setHasScrolled] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [authorised, setAuthorised] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accepted, setAccepted] = useState<{ id: number } | null>(null)
  const ndaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ndaRef.current
    if (!el) return
    const onScroll = () => {
      const reachedBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 8
      if (reachedBottom && !hasScrolled) setHasScrolled(true)
    }
    el.addEventListener('scroll', onScroll)
    if (el.scrollHeight <= el.clientHeight) setHasScrolled(true)
    return () => el.removeEventListener('scroll', onScroll)
  }, [hasScrolled])

  const orgLabel = organisation.trim() || '[your organisation]'
  const canSubmit = !!organisation.trim() && hasScrolled && agreed && authorised && !submitting

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!organisation.trim()) {
      setError('Organisation required.')
      return
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Email looks invalid — leave blank or fix.')
      return
    }
    if (!hasScrolled) {
      setError('Please read to the bottom of the agreement before proceeding.')
      return
    }
    if (!agreed || !authorised) {
      setError('Both acknowledgements are required.')
      return
    }
    if (!keyFromUrl) {
      setError('Demo key missing. Please use the link from your invitation email.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/ai-course/demo-access/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: keyFromUrl,
          email: email.trim() ? email.trim().toLowerCase() : `anon@${organisation.trim().toLowerCase().replace(/\s+/g, '')}.preview`,
          organisation: organisation.trim(),
          ndaVersion: NDA_VERSION,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data?.error || 'Could not grant access. Contact zac@concussion-education-australia.com.')
        setSubmitting(false)
        return
      }
      setAccepted({ id: data.acceptanceId || 0 })
      setTimeout(() => router.push('/courses'), 1800)
    } catch {
      setError('Network error. Try again.')
      setSubmitting(false)
    }
  }

  if (accepted) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
          <Check className="w-8 h-8 text-emerald-700" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
          Access granted
        </h1>
        <p className="text-sm text-muted-foreground mb-1">
          Agreement <span className="font-mono">DEM-2026-{String(accepted.id).padStart(4, '0')}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Logged {new Date().toLocaleString('en-AU', { dateStyle: 'long', timeStyle: 'short' })} · Redirecting…
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Hero — confident, presence, clear partnership signal */}
      <div className="relative mb-12">
        {/* Subtle background accent */}
        <div
          aria-hidden="true"
          className="absolute -top-12 -left-12 w-72 h-72 rounded-full bg-gradient-to-br from-accent/15 via-emerald-100/40 to-transparent blur-3xl pointer-events-none"
        />
        <div className="relative">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-accent mb-4">
            Confidential preview · Partner-only
          </p>

          {isPrefilled ? (
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-5 leading-[1.05] max-w-3xl">
              Curated for{' '}
              <span className="bg-gradient-to-r from-accent to-emerald-600 bg-clip-text text-transparent">
                {organisation}
              </span>
            </h1>
          ) : (
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-5 leading-[1.05] max-w-3xl">
              A clinical-education platform, by your side.
            </h1>
          )}

          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mb-1">
            Preview the AHPRA-aligned course, the multi-provider CPD marketplace shell, and the passive-CPD layer that captures the 100-400 hours of research clinicians already do but never log.
          </p>
          {suggestedName && (
            <p className="text-sm text-muted-foreground mt-3 italic">
              Prepared specifically for {suggestedName}.
            </p>
          )}
        </div>
      </div>

      {/* Three context cards — premium */}
      <div className="grid sm:grid-cols-3 gap-3 mb-12">
        {[
          { icon: Eye, label: 'Read-only', body: 'Course, certification flow, passive-CPD mockup, marketplace shell.' },
          { icon: Clock, label: '7-day access', body: 'Auto-expires. Re-enter via the link to extend.' },
          { icon: ShieldCheck, label: 'Watermarked', body: 'Every page carries a confidentiality stripe with your organisation name.' },
        ].map((c) => {
          const Icon = c.icon
          return (
            <div key={c.label} className="group relative rounded-2xl border border-slate-200 bg-white p-5 hover:border-accent/40 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/10 to-emerald-50 border border-accent/20 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Icon className="w-5 h-5 text-accent" />
              </div>
              <p className="text-sm font-bold text-foreground mb-1">{c.label}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{c.body}</p>
            </div>
          )
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Pre-filled mode: show acceptance context, no form fields */}
        {isPrefilled ? (
          <div className="rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/5 to-emerald-50/30 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-accent mb-2">
              Accepting on behalf of
            </p>
            <p className="text-2xl font-bold text-foreground mb-3">{organisation}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your IP and timestamp will be logged with the agreement. If you&apos;d like a copy of the agreement emailed to you, add your work email below — optional.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              placeholder="Optional · your work email for a copy of the agreement"
              autoComplete="email"
              className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-foreground placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent disabled:opacity-50 transition-colors"
            />
          </div>
        ) : (
          // Fallback (manual access — direct URL without slug)
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Work email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                placeholder="your work email"
                autoComplete="email"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Organisation</label>
              <input
                type="text"
                value={organisation}
                onChange={(e) => setOrganisation(e.target.value)}
                disabled={submitting}
                placeholder="Your organisation"
                autoComplete="organization"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
              />
            </div>
          </div>
        )}

        {/* NDA */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <label className="text-sm font-semibold text-foreground">
              Confidentiality &amp; non-development agreement
            </label>
            <span className={`text-[11px] font-medium ${hasScrolled ? 'text-emerald-700' : 'text-slate-400'}`}>
              {hasScrolled ? '✓ Read' : 'Scroll to read'}
            </span>
          </div>
          <div
            ref={ndaRef}
            className="rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-5 max-h-64 overflow-y-auto text-xs text-foreground leading-relaxed whitespace-pre-line shadow-inner"
          >
            {NDA_TEXT}
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Agreement version <span className="font-mono">{NDA_VERSION}</span>. Both checkboxes below unlock once you scroll to the bottom.
          </p>
        </div>

        {/* Two checkboxes */}
        <div className="space-y-2.5 rounded-xl border border-slate-200 bg-white p-5">
          <label className={`flex items-start gap-3 cursor-pointer rounded-lg p-2 -m-2 hover:bg-slate-50 transition-colors ${!hasScrolled ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => hasScrolled && setAgreed(e.target.checked)}
              disabled={!hasScrolled || submitting}
              className="mt-1 w-4 h-4 accent-accent"
            />
            <span className="text-sm text-foreground leading-relaxed">
              I agree to the confidentiality and non-development terms above.
            </span>
          </label>
          <label className={`flex items-start gap-3 cursor-pointer rounded-lg p-2 -m-2 hover:bg-slate-50 transition-colors ${!hasScrolled ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <input
              type="checkbox"
              checked={authorised}
              onChange={(e) => hasScrolled && setAuthorised(e.target.checked)}
              disabled={!hasScrolled || submitting}
              className="mt-1 w-4 h-4 accent-accent"
            />
            <span className="text-sm text-foreground leading-relaxed">
              I am authorised to bind <strong>{orgLabel}</strong> to this agreement.
            </span>
          </label>
        </div>

        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-800">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="group w-full px-6 py-4 rounded-xl bg-gradient-to-r from-foreground to-slate-700 text-white font-semibold text-base hover:shadow-lg hover:shadow-slate-900/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Recording acceptance…
            </>
          ) : (
            <>
              Agree and open the preview
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>

        <p className="text-[11px] text-muted-foreground text-center">
          Questions before accepting? <a href="mailto:zac@concussion-education-australia.com" className="text-accent hover:underline">zac@concussion-education-australia.com</a>
        </p>
      </form>
    </div>
  )
}

