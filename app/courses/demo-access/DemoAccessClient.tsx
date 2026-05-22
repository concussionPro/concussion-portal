'use client'

import { useState, useRef, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Eye, Clock, ShieldCheck, AlertCircle, Loader2, Check } from 'lucide-react'

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
This is a click-through agreement under the Electronic Transactions Act 1999 (Cth). The recipient's acceptance is logged with email, organisation, timestamp, IP address, and the version of these terms shown above.

By proceeding, the recipient confirms they are authorised to bind their organisation to the terms above and have read each clause.`

export function DemoAccessClient() {
  const params = useSearchParams()
  const router = useRouter()
  const keyFromUrl = params.get('key') || ''
  const [email, setEmail] = useState('')
  const [organisation, setOrganisation] = useState('')
  const [hasScrolled, setHasScrolled] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [authorised, setAuthorised] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accepted, setAccepted] = useState<{ id: number } | null>(null)
  const ndaRef = useRef<HTMLDivElement>(null)

  // Scroll enforcement — checkboxes only become enabled after the user
  // reaches the bottom of the NDA scroll area
  useEffect(() => {
    const el = ndaRef.current
    if (!el) return
    const onScroll = () => {
      const reachedBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 8
      if (reachedBottom && !hasScrolled) setHasScrolled(true)
    }
    el.addEventListener('scroll', onScroll)
    // Also handle the case where the NDA text fits without scrolling
    if (el.scrollHeight <= el.clientHeight) setHasScrolled(true)
    return () => el.removeEventListener('scroll', onScroll)
  }, [hasScrolled])

  const orgPlaceholder = organisation.trim() || '[Organisation]'
  const canSubmit = !!email.trim() && !!organisation.trim() && hasScrolled && agreed && authorised && !submitting

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Valid work email required.')
      return
    }
    if (!organisation.trim()) {
      setError('Organisation required.')
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
          email: email.trim().toLowerCase(),
          organisation: organisation.trim(),
          ndaVersion: NDA_VERSION,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data?.error || 'Could not grant access. Please contact zac@concussion-education-australia.com.')
        setSubmitting(false)
        return
      }
      setAccepted({ id: data.acceptanceId || 0 })
      // Brief confirmation pause so the recipient sees the agreement ID,
      // then redirect to the marketplace
      setTimeout(() => router.push('/courses'), 1800)
    } catch {
      setError('Network error. Try again.')
      setSubmitting(false)
    }
  }

  if (accepted) {
    return (
      <div className="text-center py-12">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
          <Check className="w-7 h-7 text-emerald-700" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
          Access granted
        </h1>
        <p className="text-sm text-muted-foreground mb-1">
          Agreement ID <span className="font-mono">DEM-2026-{String(accepted.id).padStart(4, '0')}</span>
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Logged at {new Date().toLocaleString('en-AU', { dateStyle: 'long', timeStyle: 'short' })}
        </p>
        <p className="text-sm text-muted-foreground">
          Redirecting to the demo…
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Hero — Heidi-style: short, confident, outcome-focused */}
      <div className="mb-12">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent mb-3">
          Concussion Education Australia · Partner preview
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-tight">
          A clinical-education platform, by your side.
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
          Preview the AHPRA-aligned course, the CPD marketplace shell, and the passive-CPD layer that captures the 100-400 hours of research clinicians already do but never log.
        </p>
      </div>

      {/* Three quick context cards */}
      <div className="grid sm:grid-cols-3 gap-3 mb-12">
        {[
          { icon: Eye, label: 'Read-only', body: 'Browse the full experience — courses, certification flow, passive-CPD mockup, marketplace shell.' },
          { icon: Clock, label: '7-day access', body: 'Your cookie expires automatically. Re-enter via the link to extend.' },
          { icon: ShieldCheck, label: 'Watermarked', body: 'Every page carries a confidentiality stripe with your organisation name.' },
        ].map((c) => {
          const Icon = c.icon
          return (
            <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-5">
              <Icon className="w-5 h-5 text-accent mb-3" />
              <p className="text-sm font-bold text-foreground mb-1">{c.label}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{c.body}</p>
            </div>
          )
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              Work email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              placeholder="ben.condon@heidihealth.com"
              autoComplete="email"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-foreground placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent disabled:opacity-50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              Organisation
            </label>
            <input
              type="text"
              value={organisation}
              onChange={(e) => setOrganisation(e.target.value)}
              disabled={submitting}
              placeholder="Heidi Health"
              autoComplete="organization"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-foreground placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent disabled:opacity-50 transition-colors"
            />
          </div>
        </div>

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
            className="rounded-xl border border-slate-200 bg-slate-50 p-5 max-h-64 overflow-y-auto text-xs text-foreground leading-relaxed whitespace-pre-line"
          >
            {NDA_TEXT}
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Agreement version <span className="font-mono">{NDA_VERSION}</span>. Both checkboxes below unlock once you scroll to the bottom.
          </p>
        </div>

        <div className="space-y-3">
          <label className={`flex items-start gap-3 cursor-pointer ${!hasScrolled ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => hasScrolled && setAgreed(e.target.checked)}
              disabled={!hasScrolled || submitting}
              className="mt-1"
            />
            <span className="text-sm text-foreground leading-relaxed">
              I agree to the confidentiality and non-development terms above. My acceptance is logged with my email, IP, and timestamp.
            </span>
          </label>
          <label className={`flex items-start gap-3 cursor-pointer ${!hasScrolled ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <input
              type="checkbox"
              checked={authorised}
              onChange={(e) => hasScrolled && setAuthorised(e.target.checked)}
              disabled={!hasScrolled || submitting}
              className="mt-1"
            />
            <span className="text-sm text-foreground leading-relaxed">
              I am authorised to bind <strong>{orgPlaceholder}</strong> to this agreement.
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
          className="w-full px-6 py-3.5 rounded-xl bg-foreground text-white font-semibold text-sm hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Recording acceptance…
            </>
          ) : (
            'Agree and open the demo'
          )}
        </button>

        <p className="text-[11px] text-muted-foreground text-center">
          Questions before accepting? <a href="mailto:zac@concussion-education-australia.com" className="text-accent hover:underline">zac@concussion-education-australia.com</a>
        </p>
      </form>
    </div>
  )
}
