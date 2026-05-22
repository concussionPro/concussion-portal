import { Metadata } from 'next'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { requireAiCourseAccess, AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import { Check, Clock, AlertCircle, FileSearch } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Build status — What\'s shipped, what\'s next',
  robots: 'noindex, nofollow',
}

interface StatusItem {
  name: string
  detail: string
  status: 'shipped' | 'in-progress' | 'roadmap' | 'mockup'
  evidence?: string
}

const STATUS: StatusItem[] = [
  // Shipped
  { name: 'AHPRA-aligned AI compliance course', detail: '9 modules · ~120 min reading · KEYPOINT/REDFLAG/DEFINITION/TRYTHIS interactive cards · 8 infographics · mid-section quizzes', status: 'shipped', evidence: '/courses/ai-in-clinical-practice' },
  { name: 'Certification infrastructure', detail: '10-question quiz · pass mark 8/10 · verifiable certificate URL · A4 PDF download · 12-month validity', status: 'shipped', evidence: '/courses/ai-in-clinical-practice/quiz' },
  { name: 'Multi-provider marketplace shell', detail: 'Provider catalogue · per-course CPD recognition tags · placeholder slots for marketplace expansion', status: 'shipped', evidence: '/courses' },
  { name: 'Provider curation policy', detail: 'Six-criterion review process · five-step pilot/verification workflow · transparent rejection criteria', status: 'shipped', evidence: '/courses/how-we-vet' },
  { name: 'CPD record dashboard', detail: 'Per-clinician completion log · CPD hours tally · audit-export-ready format · verification URLs per certificate', status: 'shipped', evidence: '/courses/cpd-record' },
  { name: 'Per-Board AHPRA reference', detail: 'All 15 AHPRA Boards + RACGP + ACRRM CPD Homes · passive-CPD ceilings calibrated per Board · sourced against registration standards', status: 'shipped', evidence: '/courses/cpd-record/requirements' },
  { name: 'Monthly content-refresh pipeline', detail: 'Cron monitors 12 sources (AHPRA, OAIC, TGA, indemnity insurers, tool vendors, professional bodies) · diff detection · email digest to admin', status: 'shipped', evidence: '/api/cron/ai-course-content-refresh' },
  { name: 'Prompt library + document templates', detail: '40 prompts × 8 categories · 14 template documents · all with required de-identification + clinician review steps', status: 'shipped', evidence: '/courses/ai-in-clinical-practice/hub' },
  { name: 'Literature search (PubMed + Semantic Scholar)', detail: 'Free-tier integration · Vancouver-style citation export · 1-hour cache · 30 req/h rate limit', status: 'shipped', evidence: '/courses/ai-in-clinical-practice/hub/literature' },
  { name: 'NDA-gated demo access', detail: 'Click-through clickwrap agreement under Electronic Transactions Act 1999 · 7-day cookie · per-partner short URLs · acceptance log with IP + timestamp', status: 'shipped', evidence: '/d/<slug>' },
  { name: 'Partner-attributed behavioural analytics', detail: 'Per-org event capture · demo_landed / demo_pageview / demo_nda_accepted · admin dashboard at /admin/demo-activity', status: 'shipped', evidence: '/admin/demo-activity' },
  { name: 'Reference repository (CCM dashboard)', detail: '140+ peer-reviewed references with verified DOIs · 2024-2025 AU-specific guidelines (AIS, AFL, ASC, AHPRA AI, TGA) · misattributions and broken DOIs audited and fixed', status: 'shipped', evidence: '/dashboard' },

  // In progress
  { name: 'Osteopathy Australia endorsement for AI course', detail: 'CEA is already OA-endorsed via CCM. AI-course-specific endorsement application initiated. Timeline: 6-12 weeks per OA review cycle.', status: 'in-progress' },

  // Mockup (visible in demo as illustrative; not built behind it)
  { name: 'Passive-CPD capture UI', detail: 'Visual demo of "log this 45-min session as CPD?" prompt and event timeline. Renders illustrative data. Becomes real when Heidi (or equivalent partner) integrates the event stream.', status: 'mockup', evidence: '/courses/cpd-record/passive' },

  // Roadmap (real-world build that requires partnership or further work)
  { name: 'Heidi (or partner) event-stream integration', detail: 'POST /api/cpd/events ingestion + categoriser. Spec at /courses/integration. 6-week MVP scope.', status: 'roadmap' },
  { name: 'RACGP CPD Home auto-submission', detail: 'Direct submission of audit-ready CPD records to RACGP CPD Home. Requires API partnership with RACGP CPD Education team.', status: 'roadmap' },
  { name: 'ACRRM CPD Home auto-submission', detail: 'Equivalent integration to RACGP path. PR3 submission-format alignment.', status: 'roadmap' },
  { name: 'Second verified marketplace provider', detail: 'One additional clinician-led provider to double the marketplace credibility from "one provider + placeholders" to "two verified".', status: 'roadmap' },
  { name: 'Enterprise / hospital network tier', detail: 'Multi-clinician licensing with central admin + reporting + custom branding. Scaffolded in pricing doc, not built.', status: 'roadmap' },
]

function statusStyle(s: StatusItem['status']) {
  switch (s) {
    case 'shipped':
      return { icon: Check, label: 'Shipped', color: 'bg-emerald-50 text-emerald-800 border-emerald-200', iconColor: 'text-emerald-700' }
    case 'in-progress':
      return { icon: Clock, label: 'In progress', color: 'bg-blue-50 text-blue-800 border-blue-200', iconColor: 'text-blue-700' }
    case 'mockup':
      return { icon: FileSearch, label: 'Mockup (live in demo)', color: 'bg-amber-50 text-amber-800 border-amber-200', iconColor: 'text-amber-700' }
    case 'roadmap':
      return { icon: AlertCircle, label: 'Roadmap', color: 'bg-slate-50 text-slate-700 border-slate-200', iconColor: 'text-slate-500' }
  }
}

export default async function BuildStatusPage() {
  const access = await requireAiCourseAccess()
  const groups: Array<{ status: StatusItem['status']; items: StatusItem[]; title: string; description: string }> = [
    { status: 'shipped', items: STATUS.filter((s) => s.status === 'shipped'), title: 'Shipped', description: 'Live in production. Clickable, demo-able, working.' },
    { status: 'in-progress', items: STATUS.filter((s) => s.status === 'in-progress'), title: 'In progress', description: 'Active work, not yet complete.' },
    { status: 'mockup', items: STATUS.filter((s) => s.status === 'mockup'), title: 'Mockup', description: 'Visible in demo as illustrative. Becomes real when the dependency unlocks.' },
    { status: 'roadmap', items: STATUS.filter((s) => s.status === 'roadmap'), title: 'Roadmap', description: 'Concrete planned work. Most require a partnership or additional resources to unlock.' },
  ]

  const counts = {
    shipped: STATUS.filter((s) => s.status === 'shipped').length,
    inProgress: STATUS.filter((s) => s.status === 'in-progress').length,
    mockup: STATUS.filter((s) => s.status === 'mockup').length,
    roadmap: STATUS.filter((s) => s.status === 'roadmap').length,
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="max-w-4xl mx-auto px-6 pt-[120px] pb-20">
        <AdminPreviewBadge access={access} />

        <Link href="/courses" className="text-xs text-accent hover:underline mb-4 inline-block">
          ← Marketplace
        </Link>

        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-accent mb-3">
          12 months of solo execution · proof of velocity
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-tight">
          What one clinician-founder shipped solo in a year.
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mb-3 leading-relaxed">
          Honest split between what&apos;s live, in progress, mockup, or roadmap. Twelve capabilities shipped with clickable evidence — the rate-of-shipping a clinical product lead role gets you. Imagine the same operator with Heidi&apos;s engineering team and runway.
        </p>
        <p className="text-sm text-muted-foreground max-w-2xl mb-10 leading-relaxed">
          The demo mixes shipped + roadmap; this page draws the line so you know exactly what you&apos;d be getting.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          <SummaryStat label="Shipped" count={counts.shipped} color="emerald" />
          <SummaryStat label="In progress" count={counts.inProgress} color="blue" />
          <SummaryStat label="Mockup" count={counts.mockup} color="amber" />
          <SummaryStat label="Roadmap" count={counts.roadmap} color="slate" />
        </div>

        {groups.map((g) => (
          <section key={g.status} className="mb-10">
            <div className="flex items-baseline justify-between mb-2">
              <h2 className="text-xl font-bold">{g.title}</h2>
              <span className="text-xs text-muted-foreground">{g.items.length} items</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{g.description}</p>
            <div className="space-y-2">
              {g.items.map((item) => {
                const sty = statusStyle(item.status)
                const Icon = sty.icon
                return (
                  <div key={item.name} className="rounded-xl border border-slate-200 bg-white p-4 flex items-start gap-4">
                    <div className={`w-9 h-9 rounded-lg ${sty.color} border flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4 h-4 ${sty.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-baseline gap-2 mb-1">
                        <p className="text-sm font-bold text-foreground">{item.name}</p>
                        {item.evidence && item.status === 'shipped' && (
                          <Link href={item.evidence.startsWith('/api') ? '#' : item.evidence} className="text-[11px] text-accent hover:underline font-mono">
                            {item.evidence}
                          </Link>
                        )}
                        {item.evidence && item.status !== 'shipped' && (
                          <span className="text-[11px] font-mono text-muted-foreground">{item.evidence}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{item.detail}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ))}

        <section className="rounded-xl bg-slate-50 border border-slate-200 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-700 mb-2">Why this page exists</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Partner-pitch demos mix working features and aspirational mockups. That mix usually leaves a CRO or product lead uncertain about what they&apos;d actually be buying. This page is the single source of truth: clickable evidence for everything labelled &ldquo;Shipped,&rdquo; transparent labelling for everything else. If a feature on the demo isn&apos;t here, treat it as undocumented.
          </p>
        </section>
      </div>
    </div>
  )
}

function SummaryStat({ label, count, color }: { label: string; count: number; color: 'emerald' | 'blue' | 'amber' | 'slate' }) {
  const colorClass =
    color === 'emerald' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
    color === 'blue' ? 'bg-blue-50 border-blue-200 text-blue-900' :
    color === 'amber' ? 'bg-amber-50 border-amber-200 text-amber-900' :
    'bg-slate-50 border-slate-200 text-slate-700'
  return (
    <div className={`rounded-xl border p-4 ${colorClass}`}>
      <p className="text-xs font-bold uppercase tracking-wide opacity-80">{label}</p>
      <p className="text-3xl font-bold tabular-nums mt-1">{count}</p>
    </div>
  )
}
