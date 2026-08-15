import { Metadata } from 'next'
import Link from 'next/link'
import CourseStreamsClient from '@/components/courses/CourseStreamsClient'
import { COURSES, findProvider, getEffectiveStatus, getEffectivePrice } from '@/lib/ai-course/provider-catalogue'
import { getAllEarlyAccessCounts } from '@/lib/early-access'
import { ComingSoonSection } from '@/components/courses/ComingSoonSection'
import { BookOpenCheck, Stethoscope, ArrowRight, Check } from 'lucide-react'
import { CONFIG } from '@/lib/config'
import { checkServerAccess } from '@/components/ai-course/CourseGate'

export const metadata: Metadata = {
  // NO trailing brand: app/layout.tsx applies `template: '%s | Concussion
  // Education Australia'`, so a title that already ends in the brand renders
  // "… | Concussion Education Australia | Concussion Education Australia"
  // (verified live 2026-08-06).
  title: 'Courses — Concussion Clinical Mastery & Concussion Rehab Mastery',
  // The ESSA claim is gated: CONFIG.FEATURES.ESSA_ACCREDITED auto-expires from
  // CONFIG.ESSA_ACCREDITATION.VALID_UNTIL, and a bare literal here would keep
  // asserting accreditation in the SERP description after it lapses.
  description:
    `Two concussion CPD streams: Concussion Clinical Mastery for physiotherapists, osteopaths and chiropractors (Osteopathy Australia endorsed) and Concussion Rehab Mastery for exercise physiologists (${CONFIG.FEATURES.ESSA_ACCREDITED ? 'ESSA accredited' : 'designed to ESSA CPD standards'}, ${CONFIG.COURSE.CRM_TOTAL_CPD_POINTS} CPD). Plus evidence-graded short courses.`,
}

/**
 * /courses — the dual-stream course hub (owner 2026-08-04: "the /courses page
 * does not have the tabbed shape and only shows CCM"). CourseStreamsClient
 * (the CCM ⇄ CRM toggle over the two full landing bodies) was built for
 * exactly this and parked until ESSA approval — approval landed 07-24, so it
 * now owns the page. The short-course marketplace (AI / Vagus, early access,
 * vetting links) renders below the streams.
 */
export default async function CoursesIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ stream?: string }>
}) {
  const sp = await searchParams
  const initialStream = sp?.stream === 'crm' ? 'crm' as const : 'ccm' as const
  // Short courses only — the two flagship streams are owned by the tabs above.
  const shortCourses = COURSES.filter(
    (c) =>
      !['concussion-clinical-mastery', 'concussion-rehab-mastery'].includes(c.id) &&
      getEffectiveStatus(c) === 'live',
  )
  const earlyAccessCourses = COURSES.filter(
    (c) => getEffectiveStatus(c) === 'coming-soon' && c.earlyBirdDiscountPct,
  )
  const earlyAccessCounts = await getAllEarlyAccessCounts().catch(() => ({}))

  // /courses is PUBLIC; "How we vet providers" and "About the founder" are
  // marketplace pre-launch pages that call requireAiCourseAccess() and are
  // noindex. A public visitor clicking either was redirected to
  // /login?redirect=/courses/ai-in-clinical-practice — a sign-in wall for a
  // DIFFERENT course, from a page that never said either link was gated.
  // checkServerAccess() is the same test without the redirect, so the gate is
  // unchanged and only the misleading CTAs stop rendering for people who
  // cannot open them.
  const marketplaceAccess = await checkServerAccess().catch(() => ({ ok: false, reason: 'error' }))

  return (
    <>
      <CourseStreamsClient initial={initialStream} />

      {/* ── Short-course marketplace strip ─────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <section className="border-t border-slate-200 pt-12">
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="text-xl font-bold text-foreground">More CPD short courses</h2>
            <p className="text-xs text-muted-foreground">
              {shortCourses.length + earlyAccessCourses.length} course
              {shortCourses.length + earlyAccessCourses.length === 1 ? '' : 's'}
            </p>
          </div>
          <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
            Evidence-graded short courses for AHPRA-registered clinicians — every provider passes a
            six-criterion review before listing, hours auto-log, certificates come audit-ready.
          </p>

          {shortCourses.length > 0 && (
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {shortCourses.map((c) => {
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
                        {getEffectivePrice(c).price !== null && <> · A${getEffectivePrice(c).price!.toLocaleString('en-AU')}</>}
                      </span>
                      <span className="text-accent font-semibold">View →</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          <ComingSoonSection courses={earlyAccessCourses} initialCounts={earlyAccessCounts} />

          <div className="mt-8 flex flex-wrap gap-3">
            {marketplaceAccess.ok && (
              <>
                <Link
                  href="/courses/how-we-vet"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-foreground font-semibold text-xs hover:bg-slate-50 transition-colors"
                >
                  <BookOpenCheck className="w-3.5 h-3.5" />
                  How we vet providers
                </Link>
                <Link
                  href="/courses/about-the-founder"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-foreground font-semibold text-xs hover:bg-slate-50 transition-colors"
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  About the founder
                </Link>
              </>
            )}
            <a
              href="mailto:zac@concussion-education-australia.com?subject=CPD%20provider%20application"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-foreground font-semibold text-xs hover:bg-slate-50 transition-colors"
            >
              List your course
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </section>
      </div>
    </>
  )
}
