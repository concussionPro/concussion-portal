'use client'

import { useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ShieldCheck, Eye, Clock, AlertCircle, Loader2, Check, ArrowRight } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'
import { DEMO_EVENTS } from '@/lib/analytics-demo'

const NDA_VERSION = '2026-05-25-v2'

const NDA_TEXT = `1. PURPOSE OF DISCLOSURE
This preview contains confidential pre-release material, trade secrets, technical architecture, regulatory mapping, and commercial methodology ("the Confidential Information") owned by Concussion Education Australia Pty Ltd ("CEA"). Access is granted solely for the purpose of evaluating a potential partnership, licensing arrangement, or acquisition involving CEA ("the Permitted Purpose"). Use for any other purpose is a material breach of this agreement.

2. TRADE SECRET DESIGNATION
The recipient acknowledges that the Confidential Information includes trade secrets within the meaning of common law and equity, the disclosure or unauthorised use of which would cause CEA serious and irreparable harm. The recipient will treat the Confidential Information with no less care than it treats its own trade secrets, and in any event with no less than a reasonable standard of care.

3. NON-DISCLOSURE
For a period of thirty-six (36) months from the date of access, the recipient will not disclose any part of the Confidential Information to any third party outside the recipient's organisation. Internal disclosure within the recipient's organisation is limited to personnel who (a) have a need to know for the Permitted Purpose, and (b) are bound by confidentiality obligations no less protective than this agreement.

4. NON-DEVELOPMENT AND NON-USE
For a period of thirty-six (36) months from the date of access, the recipient and any entity controlling, controlled by, or under common control with the recipient ("Affiliates") will not: (a) build, develop, fund, commission, or assist any other party in building a product, feature, or service that is substantially derived from, substantially similar to, or competitive with the Confidential Information; (b) use any element of the Confidential Information — including but not limited to AHPRA Board calibration logic, multi-provider CPD marketplace architecture, passive-CPD categorisation methodology, or course-shell design — in the recipient's own products or services without a separately executed written licence from CEA.

5. RESIDUAL INFORMATION
The recipient agrees that even where specific written materials are not retained, ideas, concepts, architectures, regulatory mappings, and methodologies disclosed under this agreement remain Confidential Information and are subject to clauses 3 and 4. The "residual information" defence — that an individual was free to use anything retained in memory — is expressly waived.

6. RIGHT OF FIRST NEGOTIATION
If, within thirty-six (36) months of access, the recipient or any Affiliate proposes to develop, launch, or acquire a continuing professional development ("CPD") or continuing medical education ("CME") product or feature for the Australian healthcare market that overlaps in whole or in part with the Confidential Information, the recipient will give CEA written notice and a period of not less than sixty (60) days within which to negotiate in good faith a partnership, licence, or acquisition that would permit the proposed development. This clause does not oblige either party to conclude an agreement.

7. NON-CIRCUMVENTION
The recipient will not, directly or indirectly, contact any clinician, partner, vendor, regulator, professional body, or supplier identified in the Confidential Information for the purpose of replicating, substituting, or competing with the relationships disclosed, without CEA's prior written consent.

8. NO COPYING OR REVERSE-ENGINEERING
The recipient will not download, scrape, screenshot for redistribution, transcribe, reverse-engineer, decompile, or otherwise reproduce any part of the Confidential Information beyond what is strictly necessary for the Permitted Purpose. All such permitted reproductions remain CEA's property and must be destroyed on request.

9. INDEPENDENT DEVELOPMENT WARRANTY
The recipient warrants that, as at the date of access, neither the recipient nor any Affiliate has commenced development of any product or feature substantially similar to the Confidential Information. If such development is in progress, the recipient must disclose this in writing to CEA before proceeding past this page; failure to do so is a material breach.

10. REMEDIES — INJUNCTIVE RELIEF AND COSTS
The parties acknowledge that monetary damages may be inadequate for breaches of this agreement and that CEA is entitled to seek injunctive relief and specific performance in addition to any other remedy at law or in equity. The prevailing party in any dispute arising under this agreement is entitled to recover its reasonable legal costs and disbursements.

11. AS-IS — NO WARRANTY
The preview is provided "as is" without warranty of any kind. Any final commercial arrangement requires a separately negotiated written agreement.

12. ASSIGNMENT
This agreement binds the recipient, its Affiliates, successors, assigns, and any party acquiring the recipient (whether by merger, asset purchase, or otherwise). Obligations under clauses 2–7 survive any termination or expiry.

13. JURISDICTION AND GOVERNING LAW
This agreement is governed by the laws of New South Wales, Australia. The parties submit to the exclusive jurisdiction of the courts of New South Wales. CEA may also seek injunctive relief in any court of competent jurisdiction where the recipient does business.

14. SIGNER AUTHORITY AND PERSONAL ACKNOWLEDGEMENT
By proceeding, the individual signer warrants (a) that they have authority to bind the named organisation to this agreement, (b) that they have read each clause, and (c) that they acknowledge personal awareness of the obligations herein. The individual signer's acknowledgement is logged alongside organisation, timestamp, IP address, and the version of these terms shown above.

15. CLICK-THROUGH ACCEPTANCE
This is a click-through agreement under the Electronic Transactions Act 1999 (Cth) and equivalent state legislation. Acceptance is logged digitally and constitutes a binding electronic signature. Email is optional but recommended for a copy of this agreement to be sent to the signer.

By proceeding, the recipient agrees to be bound by each clause above.`

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
  const [agreed, setAgreed] = useState(false)
  const [authorised, setAuthorised] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accepted, setAccepted] = useState<{ id: number } | null>(null)
  const ndaRef = useRef<HTMLDivElement>(null)

  const orgLabel = organisation.trim() || '[your organisation]'
  // Email is genuinely optional. Only blocker for submit: org filled,
  // both consents checked, not currently submitting. Scroll-to-read is
  // encouraged via the box height + page layout, not enforced.
  const canSubmit = !!organisation.trim() && agreed && authorised && !submitting

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!organisation.trim()) {
      setError('Organisation required.')
      return
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Email format looks invalid — leave blank or fix.')
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
      // Fire NDA acceptance event explicitly (cookie isn't readable until
      // next render, so trackDemoEvent's getDemoOrgFromCookie() would
      // no-op here). Manually attach demoOrg + isDemo so the admin
      // demo-activity query picks it up.
      trackEvent(DEMO_EVENTS.NDA_ACCEPTED, {
        demoOrg: organisation.trim(),
        isDemo: true,
        ndaVersion: NDA_VERSION,
        acceptanceId: data.acceptanceId || 0,
        hadEmail: !!email.trim(),
      }).catch(() => {})
      // Land partners on the curated tour, not the raw marketplace.
      // The tour does the work of orienting them to the build.
      setTimeout(() => router.push('/courses/private-preview'), 1800)
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
    <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] gap-8 lg:gap-10 items-start">
      {/* LEFT — hero + context cards (the marketing column) */}
      <div className="relative">
        <div
          aria-hidden="true"
          className="absolute -top-12 -left-12 w-72 h-72 rounded-full bg-gradient-to-br from-accent/15 via-emerald-100/40 to-transparent blur-3xl pointer-events-none"
        />
        <div className="relative">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-accent mb-4">
            Confidential preview · Partner-only
          </p>

          {isPrefilled ? (
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 leading-[1.05]">
              Curated for{' '}
              <span className="bg-gradient-to-r from-accent to-emerald-600 bg-clip-text text-transparent">
                {organisation}
              </span>
            </h1>
          ) : (
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 leading-[1.05]">
              A clinical-education platform, by your side.
            </h1>
          )}

          <p className="text-base text-muted-foreground leading-relaxed mb-2">
            Preview the AHPRA-aligned course, the multi-provider CPD marketplace shell, and the passive-CPD layer that captures the informal learning clinicians already do but never log.
          </p>
          {suggestedName && (
            <p className="text-sm text-muted-foreground mt-3 italic">
              Prepared specifically for {suggestedName}.
            </p>
          )}

          {/* Three context cards — stacked tighter, premium styling preserved */}
          <div className="grid sm:grid-cols-3 gap-3 mt-6">
            {[
              { icon: Eye, label: 'Read-only', body: 'Course, certification flow, passive-CPD mockup.' },
              { icon: Clock, label: '7-day access', body: 'Auto-expires. Re-enter via the link to extend.' },
              { icon: ShieldCheck, label: 'Watermarked', body: 'Every page carries your organisation name.' },
            ].map((c) => {
              const Icon = c.icon
              return (
                <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-3.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/10 to-emerald-50 border border-accent/20 flex items-center justify-center mb-2">
                    <Icon className="w-4 h-4 text-accent" />
                  </div>
                  <p className="text-xs font-bold text-foreground mb-0.5">{c.label}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{c.body}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* RIGHT — acceptance form (sticky on desktop so it stays in view) */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 lg:sticky lg:top-[100px] rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm"
        noValidate
      >
        {isPrefilled && (
          <div className="rounded-xl border border-accent/30 bg-gradient-to-br from-accent/5 to-emerald-50/30 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-accent mb-1">
              Accepting on behalf of
            </p>
            <p className="text-xl font-bold text-foreground mb-2">{organisation}</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              IP + timestamp logged with the agreement. Add work email below for a copy — optional.
            </p>
            <input
              type="text"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              placeholder="Optional · your work email"
              autoComplete="email"
              className="mt-2.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-foreground placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent disabled:opacity-50 transition-colors"
            />
          </div>
        )}

        {!isPrefilled && (
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              type="text"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              placeholder="your work email"
              autoComplete="email"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
            />
            <input
              type="text"
              value={organisation}
              onChange={(e) => setOrganisation(e.target.value)}
              disabled={submitting}
              placeholder="Your organisation"
              autoComplete="organization"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
            />
          </div>
        )}

        {/* NDA — summary + collapsible full text */}
        <details className="group rounded-xl border border-slate-200 bg-slate-50">
          <summary className="cursor-pointer px-4 py-3 list-none hover:bg-slate-100 rounded-xl">
            <p className="text-sm font-semibold text-foreground mb-1">
              Confidentiality &amp; non-development agreement
              <span className="text-[10px] font-normal text-slate-500 ml-1">v{NDA_VERSION}</span>
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              36-month non-disclosure + non-use · trade-secret designation · right of first negotiation if you launch a CPD/CME product in AU within 3 years · NSW jurisdiction · binds successors.
              <span className="text-accent font-semibold"> Expand to read all 15 clauses →</span>
            </p>
          </summary>
          <div className="px-4 pb-4">
            <div
              ref={ndaRef}
              className="rounded-lg border border-slate-200 bg-white p-4 max-h-72 overflow-y-auto text-xs text-foreground leading-relaxed whitespace-pre-line"
            >
              {NDA_TEXT}
            </div>
          </div>
        </details>

        {/* Two checkboxes */}
        <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              disabled={submitting}
              className="mt-0.5 w-4 h-4 accent-accent shrink-0"
            />
            <span className="text-xs text-foreground leading-relaxed">
              I have read and agree to the confidentiality &amp; non-development terms.
            </span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={authorised}
              onChange={(e) => setAuthorised(e.target.checked)}
              disabled={submitting}
              className="mt-0.5 w-4 h-4 accent-accent shrink-0"
            />
            <span className="text-xs text-foreground leading-relaxed">
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
          className="group w-full px-5 py-3 rounded-lg bg-accent text-white font-semibold text-sm hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
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

        <p className="text-[10px] text-muted-foreground text-center">
          Questions before accepting? <a href="mailto:zac@concussion-education-australia.com" className="text-accent hover:underline">zac@concussion-education-australia.com</a>
        </p>
      </form>
    </div>
  )
}

