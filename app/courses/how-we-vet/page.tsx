import { Metadata } from 'next'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { requireAiCourseAccess, AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import {
  ShieldCheck,
  FileSearch,
  UserCheck,
  RefreshCw,
  Award,
  ClipboardCheck,
  Eye,
  AlertOctagon,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'How We Vet Providers — Marketplace Curation',
  robots: 'noindex, nofollow',
}

const VETTING_CRITERIA = [
  {
    icon: UserCheck,
    title: 'Clinician-led',
    body: 'Course author or course director is an AHPRA-registered practitioner or equivalent regulated professional. No tech-vendor "AI experts" without clinical practice.',
  },
  {
    icon: Award,
    title: 'College or AHPRA recognition',
    body: 'Course is recognised by at least one of: RACGP CPD Home, ACRRM CPD Program, an AHPRA National Board, or a peak professional body (OA, APA, ESSA, ANTA, ACA).',
  },
  {
    icon: FileSearch,
    title: 'Evidence-based content',
    body: 'Clinical claims cite peer-reviewed sources or authoritative guidelines (CISG, RACGP, AIS, NHMRC). No unsubstantiated marketing.',
  },
  {
    icon: ShieldCheck,
    title: 'AHPRA-compliant marketing',
    body: 'No "AHPRA-certified" overclaim. No therapeutic claims that breach TGA. No testimonials that violate s 133 of the National Law.',
  },
  {
    icon: ClipboardCheck,
    title: 'Indemnity-defensible',
    body: 'Course materials are reviewed by indemnity counsel where appropriate (e.g. AI use, scope of practice). Disclaimers present where required.',
  },
  {
    icon: RefreshCw,
    title: 'Maintenance commitment',
    body: 'Provider commits to quarterly content review and 30-day update SLA when AHPRA, OAIC, or TGA position changes.',
  },
]

const REJECTION_REASONS = [
  'Course author is a tech vendor with no clinical credential.',
  'Marketing uses "AHPRA-certified" or "AHPRA-approved" language.',
  'Patient-facing claims breach TGA Therapeutic Goods Advertising Code.',
  'No documented update process when underlying guidelines change.',
  'Testimonials make clinical-outcome claims (AHPRA s 133 breach).',
  'Pricing structure shifts pre-paid clinicians to higher tiers without disclosure.',
]

const PROCESS_STEPS = [
  {
    n: 1,
    title: 'Provider application',
    body: 'Provider submits a course outline, credential verification, sample content, and pricing structure. Free to apply.',
  },
  {
    n: 2,
    title: 'CEA clinical review',
    body: 'Two-clinician review against the six criteria above. Sample content read end-to-end. Independent reviewer if the topic is outside CEA core expertise.',
  },
  {
    n: 3,
    title: 'Legal / compliance review',
    body: 'Marketing copy, disclaimers, and TGA-adjacent claims reviewed against the standards above. Indemnity counsel consulted where AI use or scope-of-practice is in play.',
  },
  {
    n: 4,
    title: 'Pilot listing',
    body: '30-day pilot listing with the "New provider — under review" badge. Clinician feedback monitored. Pricing transparency enforced.',
  },
  {
    n: 5,
    title: 'Verified status + ongoing audit',
    body: 'Provider receives the "Verified" badge. Annual re-audit. Spot-checks on content updates when regulator positions change.',
  },
]

export default async function HowWeVetPage() {
  const access = await requireAiCourseAccess()

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="max-w-4xl mx-auto px-6 pt-[120px] pb-20">
        <AdminPreviewBadge access={access} />

        <div className="mb-2">
          <Link href="/courses" className="text-xs text-accent hover:underline">← Back to marketplace</Link>
        </div>

        <p className="text-xs font-bold uppercase tracking-wide text-accent mb-2">
          Marketplace curation policy
        </p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          How we vet providers
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mb-10">
          Every course on the platform passes a six-criterion review before listing, plus an annual re-audit. The marketplace is curated, not open. This page documents the standards.
        </p>

        {/* Six criteria grid */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-foreground mb-4">The six vetting criteria</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {VETTING_CRITERIA.map((c) => {
              const Icon = c.icon
              return (
                <div key={c.title} className="card rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground mb-1">{c.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{c.body}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Process */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-foreground mb-4">The five-step review process</h2>
          <div className="relative">
            <div className="absolute left-4 top-6 bottom-6 w-px bg-accent/30" aria-hidden="true" />
            <ol className="space-y-3">
              {PROCESS_STEPS.map((s) => (
                <li key={s.n} className="relative flex gap-4 rounded-xl bg-white border border-slate-200 p-4">
                  <div className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center font-bold text-sm shrink-0 z-10">
                    {s.n}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">{s.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Rejection reasons */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-foreground mb-2">What gets a course rejected</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Transparent rejection criteria. A provider who fails review gets specific feedback and can re-apply after addressing the gaps.
          </p>
          <div className="card rounded-xl p-5">
            <ul className="space-y-2">
              {REJECTION_REASONS.map((r, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-foreground">
                  <AlertOctagon className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* What clinicians get */}
        <section className="card rounded-xl bg-gradient-to-br from-accent/5 to-emerald-50 border border-accent/20 p-6">
          <div className="flex items-start gap-4">
            <Eye className="w-6 h-6 text-accent shrink-0 mt-1" />
            <div>
              <h2 className="text-lg font-bold text-foreground mb-2">What this gives clinicians</h2>
              <p className="text-sm text-foreground leading-relaxed mb-3">
                If a course is on the platform, it has passed this review. Clinicians don&apos;t have to ask &ldquo;is this legit?&rdquo; — that question is answered by the listing itself. The audit insurance proposition is downstream of this curation: only verified courses contribute auto-tracked CPD hours to the dashboard.
              </p>
              <Link href="/courses" className="text-sm font-semibold text-accent hover:underline">
                Back to the marketplace catalogue →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
