import { Metadata } from 'next'
import { MODULES } from '@/lib/ai-course/content'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { checkServerAccess, AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import { CourseSidebar } from '@/components/ai-course/CourseSidebar'
import { BuyCourseCard } from '@/components/ai-course/BuyCourseCard'
import { findCourse } from '@/lib/ai-course/provider-catalogue'
import { Library, FileQuestion, Award, ArrowRight, Wrench, BookMarked, Lock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'AI in Clinical Practice — AHPRA-aligned AI compliance for Australian clinicians',
  description: 'AHPRA-aligned AI compliance course for Australian clinicians. 3 CPD hours, A$147.',
}

export default async function CoursePage() {
  const access = await checkServerAccess()
  const catalogue = findCourse('ai-in-clinical-practice')
  const totalMin = MODULES.reduce((sum, m) => sum + m.durationMin, 0)
  const isEnrolled = access.ok
  const isComingSoon = catalogue?.status === 'coming-soon'

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      {isEnrolled && <CourseSidebar />}
      <main className={isEnrolled ? 'md:pl-72' : ''}>
        <div className="max-w-4xl mx-auto px-6 pt-[120px] pb-20">
          <AdminPreviewBadge access={access} />

          {/* Hero */}
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent mb-2">
            Course · {MODULES.length} modules · A$147 · 3 CPD hours{isComingSoon ? ' · launches 1 June 2026' : ''}
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            AI in Clinical Practice
          </h1>
          <p className="text-lg text-muted-foreground mb-2 leading-relaxed">
            For Australian clinicians using LLMs in patient care. AHPRA-aligned, indemnity-insurer reviewed, designed to survive an audit.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            {totalMin} minutes total · Certificate of completion on passing the quiz.
          </p>

          {/* Public visitor — show Buy CTA */}
          {!isEnrolled && !isComingSoon && catalogue && catalogue.priceAUD !== null && (
            <BuyCourseCard
              courseSlug="ai-in-clinical-practice"
              courseTitle="AI in Clinical Practice"
              priceAUD={catalogue.priceAUD}
              cpdHours={catalogue.cpdHours}
              earlyBirdPriceAUD={catalogue.earlyBirdPriceAUD ?? null}
              earlyBirdDiscountPct={catalogue.earlyBirdDiscountPct}
            />
          )}

          {/* Public visitor + still coming soon — show waitlist note */}
          {!isEnrolled && isComingSoon && (
            <section className="mb-12 rounded-2xl border-2 border-accent/30 bg-gradient-to-br from-accent/[0.04] to-white p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent mb-2">
                Launches 1 June 2026
              </p>
              <h2 className="text-xl font-bold text-foreground mb-2">Get 15% off launch week</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                The waitlist gets the early-access code emailed the day this course goes live. Sign up on the marketplace coming-soon section.
              </p>
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors"
              >
                Join the waitlist →
              </Link>
            </section>
          )}

          {/* Module list */}
          <div className="mb-3 flex items-baseline justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
              {isEnrolled ? 'Curriculum' : 'What you get'}
            </p>
            {!isEnrolled && (
              <p className="text-[10px] text-muted-foreground">
                <Lock className="w-3 h-3 inline mr-1" />
                Module content unlocks after enrolment
              </p>
            )}
          </div>
          <div className="grid gap-3 mb-12">
            {MODULES.map((m) => {
              const cardClasses = `card rounded-xl p-5 transition-colors ${isEnrolled ? 'hover:border-accent/40' : 'opacity-90'}`
              const body = (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-accent">
                        Module {m.number}
                      </span>
                      {m.loadBearing && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                          Required
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground">{m.durationMin} min</span>
                    </div>
                    <h3 className="text-base font-bold text-foreground mb-1">{m.title}</h3>
                    <p className="text-sm text-muted-foreground leading-snug">{m.description}</p>
                  </div>
                  {isEnrolled
                    ? <ArrowRight className="w-4 h-4 text-accent shrink-0 mt-1" />
                    : <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-1" />}
                </div>
              )
              return isEnrolled ? (
                <Link key={m.slug} href={`/courses/ai-in-clinical-practice/${m.slug}`} className={cardClasses}>
                  {body}
                </Link>
              ) : (
                <div key={m.slug} className={cardClasses}>{body}</div>
              )
            })}
          </div>

          {/* Resource grid */}
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-3">
            Resources {!isEnrolled && <span className="text-slate-400 font-normal normal-case tracking-normal">— included when you enrol</span>}
          </p>
          <div className="grid gap-3 sm:grid-cols-3 mb-4">
            <ResourceCard
              href="/courses/ai-in-clinical-practice/hub"
              icon={Library}
              tag="AI Practice Hub"
              title="Prompts · Templates · Tools"
              note="40 prompts · 14 templates · 9 vendors in the tool comparison · live literature search"
              locked={!isEnrolled}
            />
            <ResourceCard
              href="/courses/ai-in-clinical-practice/toolkit"
              icon={Wrench}
              tag="Clinical Toolkit"
              title="Consent · de-id · audit · incident"
              note="10 clinician-grade artefacts designed to survive an AHPRA notification"
              locked={!isEnrolled}
            />
            <ResourceCard
              href="/courses/ai-in-clinical-practice/references"
              icon={BookMarked}
              tag="Reference Repository"
              title="AHPRA · OAIC · TGA · evidence"
              note="26 references + 8 podcasts/webinars · refreshed monthly"
              locked={!isEnrolled}
            />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-3 mt-6">
            Certification
          </p>
          <div className="grid gap-3 sm:grid-cols-2 mb-8">
            <ResourceCard
              href="/courses/ai-in-clinical-practice/quiz"
              icon={FileQuestion}
              tag="Quiz"
              title="10 questions · 8/10 to pass"
              note="Issues the certificate on pass."
              locked={!isEnrolled}
            />
            <ResourceCard
              href="/courses/ai-in-clinical-practice/certificate"
              icon={Award}
              tag="My Certificate"
              title="Download · verify"
              note="12-month validity · public verification URL · AHPRA log-entry template"
              locked={!isEnrolled}
            />
          </div>

          {/* Footer disclaimer */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-5 text-xs text-slate-700">
            <p className="font-semibold mb-2">Education, not legal advice.</p>
            <p>
              This course is general clinical education for Australian registered health practitioners. It does not constitute legal advice. For case-specific guidance, consult your professional indemnity insurer (Avant, MIPS, Guild, MIGA) and, where appropriate, a regulatory lawyer. AHPRA and OAIC guidance referenced throughout is current as of the last content refresh — see the Hub update feed for the latest.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

function ResourceCard({
  href,
  icon: Icon,
  tag,
  title,
  note,
  locked,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  tag: string
  title: string
  note: string
  locked?: boolean
}) {
  const inner = (
    <>
      <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-accent mb-1">{tag}</p>
        <p className="text-sm text-foreground font-semibold leading-tight">{title}</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{note}</p>
      </div>
      {locked && <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-1" />}
    </>
  )
  if (locked) {
    return (
      <div className="card rounded-xl p-4 flex items-start gap-3 opacity-90 bg-slate-50/50">
        {inner}
      </div>
    )
  }
  return (
    <Link
      href={href}
      className="card rounded-xl p-4 hover:border-accent/40 transition-colors flex items-start gap-3"
    >
      {inner}
    </Link>
  )
}
