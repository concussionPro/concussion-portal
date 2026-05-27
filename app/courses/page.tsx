import { Metadata } from 'next'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { checkServerAccess, AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import { COURSES, PROVIDERS, findProvider, getEffectiveStatus } from '@/lib/ai-course/provider-catalogue'
import { getAllEarlyAccessCounts } from '@/lib/early-access'
import { ComingSoonSection } from '@/components/courses/ComingSoonSection'
import { Check, AlertCircle, ShieldCheck, BookOpenCheck, Award, Stethoscope, Users, Building2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'CPD Courses — Concussion Education Australia',
  description: 'Evidence-graded CPD short courses for AHPRA-registered clinicians. Concussion Clinical Mastery available now, AI in Clinical Practice and Vagus Nerve coming soon.',
}

/**
 * Marketplace catalogue index. Public surface — anyone can browse
 * available + coming-soon courses, click through to buy CCM, or sign up
 * for the 15% early-access waitlist on upcoming courses.
 *
 * The individual course landing pages (AI + Vagus) remain admin/demo
 * gated; this page only links into them, doesn't render their content.
 */
export default async function CoursesIndexPage() {
  const access = await checkServerAccess()
  // Use getEffectiveStatus so the AI course auto-flips to 'live' at launchAt
  // without needing a manual edit or cron. Pilot courses (Vagus) stay hidden
  // because they're neither 'live' nor 'coming-soon'.
  const liveCourses = COURSES.filter((c) => getEffectiveStatus(c) === 'live')
  const earlyAccessCourses = COURSES.filter(
    (c) => getEffectiveStatus(c) === 'coming-soon' && c.earlyBirdDiscountPct
  )
  const earlyAccessCounts = await getAllEarlyAccessCounts().catch(() => ({}))

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="max-w-5xl mx-auto px-6 pt-[120px] pb-20">
        <AdminPreviewBadge access={access} />

        {/* Hero — clinician-first, outcome-focused */}
        <div className="mb-14">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent mb-3">
            CEA CPD Marketplace
          </p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-5 leading-[1.05] max-w-3xl">
            CPD that&rsquo;s <span className="text-accent">worth your time.</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mb-8">
            Short, evidence-graded courses for AHPRA-registered clinicians. Each one passes a six-criterion review before listing. Hours auto-log, certificates come AHPRA-audit-ready, every clinical claim cites a primary source.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent/90 transition-colors"
            >
              <Award className="w-4 h-4" />
              See the flagship course
            </Link>
            <Link
              href="/courses/how-we-vet"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-slate-300 text-foreground font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              <BookOpenCheck className="w-4 h-4" />
              How we vet providers
            </Link>
            <Link
              href="/courses/about-the-founder"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-slate-300 text-foreground font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              <Stethoscope className="w-4 h-4" />
              About the founder
            </Link>
          </div>
        </div>

        {/* Traction strip — real CEA assets. Closes the "is this a business or a deck?" gap. */}
        <section className="mb-10 rounded-2xl border border-slate-200 bg-white">
          <div className="px-6 py-3 border-b border-slate-100">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
              The provider behind the platform
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100">
            <div className="px-4 py-4">
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-4 h-4 text-emerald-700" />
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Endorsement</p>
              </div>
              <p className="text-sm font-bold text-foreground leading-tight">Osteopathy Australia</p>
              <p className="text-xs text-muted-foreground mt-0.5">Endorsed CPD provider (CCM)</p>
            </div>
            <div className="px-4 py-4">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-4 h-4 text-accent" />
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Shipping product</p>
              </div>
              <p className="text-sm font-bold text-foreground leading-tight">CCM at A$1,190</p>
              <p className="text-xs text-muted-foreground mt-0.5">Concussion Clinical Mastery</p>
            </div>
            <div className="px-4 py-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-blue-700" />
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Audience</p>
              </div>
              <p className="text-sm font-bold text-foreground leading-tight">AU clinicians</p>
              <p className="text-xs text-muted-foreground mt-0.5">Direct subscriber base</p>
            </div>
            <Link href="/courses/about-the-founder" className="px-4 py-4 hover:bg-slate-50 transition-colors group">
              <div className="flex items-center gap-2 mb-1">
                <Stethoscope className="w-4 h-4 text-orange-700" />
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Founder</p>
              </div>
              <p className="text-sm font-bold text-foreground leading-tight group-hover:underline">Zac Lewis</p>
              <p className="text-xs text-muted-foreground mt-0.5">Osteopath · AHPRA-registered</p>
            </Link>
          </div>
        </section>

        {/* Trust strip — three problems the marketplace solves */}
        <div className="grid sm:grid-cols-3 gap-3 mb-10">
          {[
            { title: 'Trusted curation', body: 'Every provider vetted. No random Google-found courses. If it&apos;s listed, it&apos;s legitimate.', icon: ShieldCheck, color: 'emerald' },
            { title: 'Auto-logged hours', body: 'CPD hours tracked across providers in one dashboard. No spreadsheets, no email confirmations.', icon: Check, color: 'blue' },
            { title: 'Audit-ready export', body: 'One-click export when AHPRA asks. RACGP / ACRRM CPD Home integration on roadmap.', icon: AlertCircle, color: 'amber' },
          ].map((t) => {
            const Icon = t.icon
            const colorClass = t.color === 'emerald' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              t.color === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-200' :
              'bg-amber-50 text-amber-700 border-amber-200'
            return (
              <div key={t.title} className="card rounded-xl p-5">
                <div className={`w-10 h-10 rounded-lg ${colorClass} border flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold text-foreground mb-1.5">{t.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: t.body }} />
              </div>
            )
          })}
        </div>

        {/* Available courses */}
        <section className="mb-12">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Available now</h2>
            <p className="text-xs text-muted-foreground">{liveCourses.length} {liveCourses.length === 1 ? 'course' : 'courses'}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {liveCourses.map((c) => {
              const provider = findProvider(c.providerId)
              return (
                <Link
                  key={c.id}
                  href={c.route}
                  className="card rounded-xl p-5 hover:border-accent/40 hover:shadow-sm transition-all flex flex-col"
                >
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-accent">
                      {provider?.shortName || c.providerId}
                    </span>
                    {provider?.verified && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" /> Verified provider
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1 leading-tight">{c.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed flex-1">{c.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground tabular-nums">
                      <strong className="text-foreground">{c.cpdHours} CPD hours</strong>
                      {c.priceAUD !== null && <> · A${c.priceAUD.toLocaleString('en-AU')}</>}
                    </span>
                    <span className="text-accent font-semibold">View →</span>
                  </div>
                  {c.cpdRecognition.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap gap-x-2 gap-y-0.5">
                      {c.cpdRecognition.map((r) => (
                        <span key={r} className="text-[10px] text-muted-foreground">· {r}</span>
                      ))}
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        </section>

        <ComingSoonSection courses={earlyAccessCourses} initialCounts={earlyAccessCounts} />

        {/* Open for provider applications — replaces the placeholder card grid */}
        <section className="mb-12 rounded-2xl bg-gradient-to-br from-foreground to-slate-800 text-white p-7">
          <div className="grid md:grid-cols-[1fr_auto] gap-6 items-center">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-accent mb-3">
                Marketplace · open
              </p>
              <h2 className="text-2xl md:text-3xl font-bold mb-2 leading-tight">
                Clinician-led CPD provider? You belong on this shelf.
              </h2>
              <p className="text-sm text-white/80 max-w-xl leading-relaxed">
                Six-criterion vetting. Two-week onboarding. Audit-ready CPD logging built in. We share marketing surface and the platform-curator endorsement — you keep the IP and the customer relationship.
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <a
                href="mailto:zac@concussion-education-australia.com?subject=CPD%20provider%20application"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors"
              >
                Apply to be a provider
              </a>
              <Link
                href="/courses/how-we-vet"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-semibold transition-colors"
              >
                Read the vetting policy
              </Link>
            </div>
          </div>
        </section>

        {/* Provider directory */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-2">Providers</h2>
          <p className="text-sm text-muted-foreground mb-4">
            One verified, two in invited-candidate pipeline. The marketplace model scales by onboarding additional vetted providers under platform-curator endorsement.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {PROVIDERS.map((p) => (
              <div key={p.id} className={`card rounded-xl p-4 ${p.verified ? '' : 'opacity-70 border-dashed'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{p.description}</p>
                  </div>
                  {p.verified ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      Verified
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                      Candidate
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {p.courseCount} {p.courseCount === 1 ? 'course' : 'courses'} on platform
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
