import { Metadata } from 'next'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { requireAiCourseAccess, AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import { COURSES, PROVIDERS, findProvider } from '@/lib/ai-course/provider-catalogue'
import { Check, AlertCircle, ShieldCheck, FileBarChart, BookOpenCheck } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Courses — Concussion Education Australia',
  robots: 'noindex, nofollow',
}

/**
 * Marketplace catalogue index. Surfaces every course in the platform
 * grouped by provider, with status badges (live / coming-soon / pilot)
 * and CPD recognition. Marketplace placeholder slots demonstrate the
 * multi-provider shape without claiming providers we have not signed.
 */
export default async function CoursesIndexPage() {
  const access = await requireAiCourseAccess()
  const liveCourses = COURSES.filter((c) => c.status === 'live')
  const upcomingCourses = COURSES.filter((c) => c.status !== 'live')

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="max-w-5xl mx-auto px-6 pt-[120px] pb-20">
        <AdminPreviewBadge access={access} />

        {/* Hero — confident, restrained, outcome-focused */}
        <div className="mb-14">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent mb-3">
            CPD Marketplace
          </p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-5 leading-[1.05] max-w-3xl">
            Trusted CPD. <span className="text-muted-foreground">Audit-ready by default.</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mb-8">
            Every course on the platform passes a six-criterion review. Hours auto-log to one dashboard. Audit export in a click. The passive layer captures the 100-400 hours of research clinicians already do but never log.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/courses/cpd-record/passive"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-foreground text-white font-semibold text-sm hover:bg-foreground/90 transition-colors"
            >
              See the passive-CPD demo
            </Link>
            <Link
              href="/courses/cpd-record"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-slate-300 text-foreground font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              <FileBarChart className="w-4 h-4" />
              CPD dashboard
            </Link>
            <Link
              href="/courses/how-we-vet"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-slate-300 text-foreground font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              <BookOpenCheck className="w-4 h-4" />
              How we vet providers
            </Link>
          </div>
        </div>

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

        {/* Live courses */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-foreground mb-4">Live courses</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {liveCourses.map((c) => {
              const provider = findProvider(c.providerId)
              return (
                <Link
                  key={c.id}
                  href={c.route}
                  className="card rounded-xl p-5 hover:border-accent/40 transition-colors flex flex-col"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-accent">
                      {provider?.shortName || c.providerId}
                    </span>
                    {provider?.verified && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" /> Verified provider
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">{c.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed flex-1">{c.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">{c.cpdHours} CPD hours</strong>
                      {c.priceAUD !== null && <> · AUD ${c.priceAUD}</>}
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

        {/* Marketplace placeholders */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-foreground mb-2">Marketplace expansion</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Slots reserved for partnered providers. Each represents a candidate provider whose courses would be vetted and listed once partnership is in place. Demonstrates marketplace shape — not a current offering.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {upcomingCourses.map((c) => {
              const provider = findProvider(c.providerId)
              return (
                <div
                  key={c.id}
                  className="card rounded-xl p-5 flex flex-col opacity-70 border-dashed"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      {provider?.shortName || c.providerId}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      Awaiting onboarding
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">{c.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed flex-1">{c.description}</p>
                  <p className="text-xs text-muted-foreground">
                    <strong>{c.cpdHours} CPD hours</strong> when live
                  </p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Provider directory */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-2">Providers</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Two verified, two placeholders. The marketplace model scales by onboarding additional vetted providers under platform-curator (e.g. Heidi) endorsement.
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
