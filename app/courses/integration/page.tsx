import { Metadata } from 'next'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { requireAiCourseAccess, AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import {
  Headphones,
  BookOpen,
  ArrowRight,
  Database,
  ListChecks,
  ShieldCheck,
  Download,
  Sparkles,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Integration Architecture — CEA × Heidi',
  robots: 'noindex, nofollow',
}

/**
 * Integration architecture page. Turns the passive-CPD mockup into a
 * concrete engineering proposal: where CEA's service plugs into Heidi's
 * existing product surface (Scribe + Evidence), what the API contract
 * looks like, and what a 6-week MVP costs.
 *
 * Closes the "is this a deck or a build?" gap a CRO would flag.
 */
export default async function IntegrationPage() {
  const access = await requireAiCourseAccess()

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="max-w-5xl mx-auto px-6 pt-[120px] pb-20">
        <AdminPreviewBadge access={access} />

        <Link href="/courses" className="text-xs text-accent hover:underline mb-4 inline-block">
          ← Marketplace
        </Link>

        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-accent mb-3">
          Integration architecture · 6-week MVP
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-tight max-w-3xl">
          Scribe + Evidence events → CPD log. Live API.
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mb-4 leading-relaxed">
          ~2 engineer-weeks on Heidi side. Six-week joint MVP. The categoriser, per-Board reference data, and export PDF are already shipped at CEA.
        </p>
        <p className="text-sm text-muted-foreground max-w-2xl mb-8 leading-relaxed">
          One event per qualifying Scribe session or Evidence search, fired to <code className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded">POST /api/cpd/events</code>. CEA returns categorisation + audit-ready log entry. No replatforming. No clinician-facing UX changes beyond a non-blocking confirmation prompt.
        </p>

        {/* CFO-friendly callout — the line Paul takes to the board */}
        <div className="mb-12 rounded-2xl bg-gradient-to-br from-foreground to-slate-800 text-white p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent mb-3">
            Why this is a CFO-friendly bet
          </p>
          <div className="grid sm:grid-cols-3 gap-5">
            <div>
              <p className="text-sm font-bold mb-1">Zero net CAC</p>
              <p className="text-xs text-white/75 leading-relaxed">Every CPD user is already a Heidi user. No acquisition spend. Monetization depth, not a new cohort.</p>
            </div>
            <div>
              <p className="text-sm font-bold mb-1">Near-zero marginal cost</p>
              <p className="text-xs text-white/75 leading-relaxed">Categoriser runs on event metadata only. Export PDF is templated. Gross margin sits structurally above scribe-only ARPU.</p>
            </div>
            <div>
              <p className="text-sm font-bold mb-1">Retention surface</p>
              <p className="text-xs text-white/75 leading-relaxed">30+ logged CPD hours = 12-month behavioural lock-in. Improves net dollar retention without a price increase.</p>
            </div>
          </div>
        </div>

        {/* Architecture diagram */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4">Architecture (text)</h2>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="grid md:grid-cols-3 gap-4 items-stretch">
              {/* Heidi surface */}
              <div className="rounded-xl border-2 border-blue-200 bg-blue-50/50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-blue-700 mb-3">Heidi product surface</p>
                <div className="space-y-2">
                  {[
                    { icon: Headphones, label: 'Scribe', detail: 'Session metadata — duration, complexity flags, topic tags. Dominant signal.' },
                    { icon: BookOpen, label: 'Evidence', detail: 'Literature search + read events. Secondary signal.' },
                  ].map((item) => {
                    const Icon = item.icon
                    return (
                      <div key={item.label} className="flex items-start gap-2 rounded-lg bg-white border border-blue-100 p-2.5">
                        <Icon className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-foreground">{item.label}</p>
                          <p className="text-[11px] text-muted-foreground leading-snug">{item.detail}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Bridge */}
              <div className="flex items-center justify-center">
                <div className="rounded-xl border-2 border-accent/40 bg-accent/5 p-4 text-center w-full">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-accent mb-2">Event stream</p>
                  <p className="text-xs font-semibold text-foreground mb-2">POST /api/cpd/events</p>
                  <ArrowRight className="w-5 h-5 text-accent mx-auto my-2" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Heidi fires an event when a session completes. CEA returns categorisation + log id. Synchronous, &lt;200ms.
                  </p>
                </div>
              </div>

              {/* CEA surface */}
              <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 mb-3">CEA CPD platform</p>
                <div className="space-y-2">
                  {[
                    { icon: Sparkles, label: 'Categoriser', detail: 'AHPRA Board → category mapping' },
                    { icon: Database, label: 'CPD log', detail: 'Per-clinician audit-ready record' },
                    { icon: ListChecks, label: 'Marketplace', detail: 'Vetted formal-CPD providers' },
                    { icon: Download, label: 'Audit export', detail: 'RACGP / ACRRM submission ready' },
                  ].map((item) => {
                    const Icon = item.icon
                    return (
                      <div key={item.label} className="flex items-start gap-2 rounded-lg bg-white border border-emerald-100 p-2.5">
                        <Icon className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-foreground">{item.label}</p>
                          <p className="text-[11px] text-muted-foreground leading-snug">{item.detail}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The contract — what Heidi sends, what CEA returns */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4">The integration contract</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-700 mb-2">Heidi → CEA (POST /api/cpd/events)</p>
              <pre className="text-[11px] bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-x-auto leading-snug">
{`{
  "userId": "heidi_user_xyz",
  "sessionId": "heidi_sess_abc",
  "kind": "literature_search" |
    "guideline_review" |
    "case_research" |
    "scribe_reflection",
  "durationMin": 47,
  "topicTags": ["diabetes", "GLP-1"],
  "completedAt": "2026-05-22T03:14:00Z",
  "ahpraBoard": "medical" // optional
}`}
              </pre>
              <p className="text-[11px] text-muted-foreground mt-3">
                One event per qualifying session. No PII. Heidi keeps the underlying transcript/search content; CEA only sees the metadata.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 mb-2">CEA → Heidi (response)</p>
              <pre className="text-[11px] bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-x-auto leading-snug">
{`{
  "ok": true,
  "cpdLogId": "cpd_2026_xyz",
  "category": "Educational Activities",
  "subcategory": "Literature review",
  "boardCalibration": {
    "board": "medical",
    "countsTowardAnnual": true,
    "remainingHours": 12.3
  },
  "promptUser": true,
  "promptCopy": "You spent 47 min..."
}`}
              </pre>
              <p className="text-[11px] text-muted-foreground mt-3">
                Heidi renders the prompt copy as a non-blocking notification inside the existing UI. One tap to confirm. Categorisation + Board calibration handled by CEA.
              </p>
            </div>
          </div>
        </section>

        {/* MVP scope + cost */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-2">6-week MVP scope</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Phase 1 — what gets built in the first 6 weeks of partnership. Both teams ship; nothing speculative.
          </p>
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left">
                  <th className="px-4 py-2.5 text-xs font-semibold text-slate-700">Week</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-slate-700">Heidi team</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-slate-700">CEA team</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {[
                  { wk: '1', heidi: 'Spec freeze + event-source identification (which Scribe / Evidence events trigger CPD prompts)', cea: 'API spec + AHPRA categoriser v1 (RACGP categories first)' },
                  { wk: '2', heidi: 'POST /api/cpd/events client integration in Evidence', cea: 'Event ingestion + categoriser endpoint live in staging' },
                  { wk: '3', heidi: 'Prompt UI inside Heidi (non-blocking notification)', cea: 'Per-clinician CPD log + dashboard view' },
                  { wk: '4', heidi: 'Internal QA — 5 staff clinicians using daily', cea: 'Audit-export PDF generator + verification URL' },
                  { wk: '5', heidi: 'Limited beta — 100 AU users opt-in', cea: 'Behaviour monitoring dashboard + content-refresh cron live in prod' },
                  { wk: '6', heidi: 'Beta review + go/no-go for wider rollout', cea: 'Address feedback + onboard provider #2 for marketplace credibility' },
                ].map((r) => (
                  <tr key={r.wk} className="border-t border-slate-100">
                    <td className="px-4 py-2.5 font-bold text-foreground">Wk {r.wk}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{r.heidi}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{r.cea}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Engineering effort estimate */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4">Engineering effort estimate</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { label: "Heidi side", body: '~2 engineer-weeks (1 senior backend + 1 front-end). Event-source instrumentation + prompt UI component. No DB schema changes; piggybacks on existing event stream.', highlight: '~A$30k loaded cost' },
              { label: 'CEA side', body: 'Founder-led. Categoriser logic + endpoint + dashboard view. ~6 weeks at the existing build pace. Audit-export PDF reuses the certificate generator infrastructure already shipping.', highlight: 'Founder time' },
              { label: 'Joint integration', body: 'Spec review, API contract finalisation, beta-cohort coordination, GTM messaging for the opt-in beta. ~4 hrs/wk across the 6 weeks for each side.', highlight: '~30 hrs total' },
            ].map((b) => (
              <div key={b.label} className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-accent mb-2">{b.label}</p>
                <p className="text-sm font-bold text-foreground mb-1">{b.highlight}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{b.body}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4 italic">
            For reference: Heidi&apos;s product team ships features of this complexity in 4-6 weeks per Stripe-style engineering norms. This MVP is well inside that envelope.
          </p>
        </section>

        {/* Why CEA, not Heidi, builds this */}
        <section className="rounded-2xl bg-foreground text-white p-8 mb-12">
          <p className="text-xs font-bold uppercase tracking-wide text-accent mb-3">
            Why CEA is the builder, not Heidi&apos;s in-house team
          </p>
          <h2 className="text-2xl font-bold mb-4">Three things Heidi&apos;s engineering team would have to acquire, that CEA already has.</h2>
          <div className="space-y-3 text-sm leading-relaxed">
            <div>
              <p className="font-semibold text-white mb-1">1. AHPRA per-Board calibration logic.</p>
              <p className="text-white/80">15 National Boards × different category structures × different self-directed allowances × different recording requirements. Already encoded in <code className="bg-white/10 px-1 py-0.5 rounded text-xs">lib/ai-course/cpd-requirements.ts</code> with per-Board passive ceilings. Heidi&apos;s team would need 4-6 weeks just to source-verify this; CEA shipped it in two days because the founder is an AHPRA-registered osteopath who already lives inside the regulatory framework.</p>
            </div>
            <div>
              <p className="font-semibold text-white mb-1">2. Provider vetting process.</p>
              <p className="text-white/80">Marketplace value depends on supply quality. CEA has the six-criterion vetting policy + the clinical credibility (OA endorsement) to onboard providers. Heidi&apos;s team would be starting from zero on a multi-month build.</p>
            </div>
            <div>
              <p className="font-semibold text-white mb-1">3. Content-refresh maintenance pipeline.</p>
              <p className="text-white/80">CPD content + regulatory context drifts monthly. Already shipping at <code className="bg-white/10 px-1 py-0.5 rounded text-xs">/api/cron/ai-course-content-refresh</code> — monitors AHPRA, OAIC, TGA, insurers, tool vendors and emails diffs. Heidi&apos;s team would have to build this from scratch or accept content rot.</p>
            </div>
          </div>
          <p className="text-sm text-white/80 mt-6">
            <strong className="text-white">Net:</strong> Heidi builds the integration (2 engineer-weeks); CEA delivers the platform (12+ months of work already shipped). Costs Heidi roughly A$30k of engineering + the partnership terms in <code className="bg-white/10 px-1 py-0.5 rounded text-xs">docs/heidi-proposal.md</code>.
          </p>
        </section>

        {/* Open questions */}
        <section>
          <h2 className="text-xl font-bold mb-2">Open questions to resolve in the first call</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Where the diagram is provisional and the answer affects scope.
          </p>
          <ul className="space-y-2">
            {[
              'Which Heidi product surfaces are in scope for v1 — Evidence only, or Scribe + Evidence?',
              'Does Heidi want CPD-prompt UI inline in the existing notifications stream, or a separate dashboard tab?',
              'Branding: "Heidi Academy powered by CEA" or "CEA inside Heidi" — which positions the partnership correctly?',
              'Data-residency constraint: where do CPD log records live — Heidi infrastructure (AU residency already confirmed) or CEA-hosted with Heidi data-processing agreement?',
              'Commercial structure — licensing / white-label / equity-employment shapes outlined in the proposal doc; not pre-committed to any. Open to scoping in the first call.',
            ].map((q, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-foreground">
                <ShieldCheck className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span>{q}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              This document is a starting proposal. Architecture, scope and timeline are open to revision based on Heidi&apos;s engineering and product input during the first scoping call. The goal is a concrete shared spec by end of week 1.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
