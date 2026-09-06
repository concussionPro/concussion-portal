import Link from 'next/link'
import { ArrowRight, Activity, GraduationCap, BookOpen } from 'lucide-react'
import { CONFIG, SST_TIER_FROM_AUD } from '@/lib/config'

/**
 * "After the assessment" — free-SCAT form / download exit.
 *
 * Soft path: free SCAT6 Mastery (scat-mastery) — where form traffic should land
 * when they want training without buying yet.
 * Equal-weight paid dual exit:
 *  1) Learn full clinical competency → /pricing (Online front door)
 *  2) Apply protocol in clinic → /clinical-suite (SST standalone)
 *
 * Course and SST stay on separate surfaces — do not merge prices into one CTA.
 * UI-only bridge — does not unpause cold SCAT / PDF nurture email.
 */
export function AfterTheAssessment({
  className = '',
  /** Analytics src on money CTAs (e.g. scat6_download_post). */
  source,
  /**
   * Compact post-download / post-capture surface for sticky success cards.
   * Same three exits (mastery + Online + SST) — tighter copy, no cold email.
   */
  compact = false,
}: {
  className?: string
  source?: string
  compact?: boolean
}) {
  const srcQ = source ? `?src=${encodeURIComponent(source)}` : ''
  const pricingHref = `/pricing${srcQ}`
  const suiteHref = `/clinical-suite${srcQ}`
  const masteryHref = source
    ? `/scat-mastery?src=${encodeURIComponent(source)}`
    : '/scat-mastery'

  const eyebrow = compact ? 'After your download' : 'After the assessment'
  const title = compact
    ? 'Forms downloaded. Two clear next steps.'
    : 'You have a score. The SCAT6 doesn’t tell you what to do next.'
  const lead = compact
    ? 'The PDF is the assessment. Next: free SCAT mastery, full clinical competency (Online), or run measured rehab with SST — separate products, separate prices.'
    : 'It confirms a suspected concussion and flags red flags — it does not tell you which phenotype you’re looking at, what the exercise dose should be, or when this person is ready to return to contact. Those are the decisions that carry the medico-legal weight.'

  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white ${
        compact ? 'p-4 sm:p-5' : 'p-6 sm:p-7'
      } ${className}`}
      aria-labelledby={compact ? 'after-download-bridge' : 'after-the-assessment'}
    >
      <p className="m-0 text-[11px] font-bold uppercase tracking-[0.14em] text-[#5b9aa6]">
        {eyebrow}
      </p>
      <h2
        id={compact ? 'after-download-bridge' : 'after-the-assessment'}
        className={`mt-2 font-bold leading-snug tracking-tight text-slate-900 ${
          compact ? 'text-base sm:text-lg' : 'text-xl sm:text-2xl'
        }`}
      >
        {title}
      </h2>
      <p
        className={`mt-2 max-w-2xl leading-relaxed text-slate-600 ${
          compact ? 'text-[12.5px]' : 'text-sm'
        }`}
      >
        {lead}
      </p>

      {/* Soft free path — high-traffic form/download completers often want training before paid */}
      <Link
        href={masteryHref}
        className={`group mt-4 flex flex-col rounded-xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/90 to-white transition-colors hover:border-emerald-300 sm:flex-row sm:items-center sm:justify-between sm:gap-4 ${
          compact ? 'p-3' : 'mt-5 p-4'
        }`}
      >
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-800">
            Free first · SCAT mastery
          </p>
          <span className="mt-0.5 inline-flex items-center gap-2 text-[13px] font-bold text-slate-900">
            <BookOpen className="h-4 w-4 text-emerald-700" strokeWidth={2} />
            Master SCAT6 &amp; SCOAT6 in ~1 hour
          </span>
          {!compact && (
            <span className="mt-1 block text-[12.5px] leading-snug text-slate-600">
              Proper administration, scoring, interpretation, and documentation — then A$
              {CONFIG.COURSE.SCAT_DISCOUNT_AUD} off Online with code {CONFIG.COURSE.PROMO_CODE}.
            </span>
          )}
        </div>
        <span className="mt-2 inline-flex shrink-0 items-center gap-1 text-[12px] font-bold text-emerald-800 sm:mt-0">
          Start free course{' '}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>

      <div className={`mt-3 grid gap-3 ${compact ? '' : 'sm:grid-cols-2'}`}>
        <Link
          href={pricingHref}
          className="group flex flex-col rounded-xl border-2 border-teal-300/80 bg-gradient-to-br from-teal-50/90 to-white p-3.5 transition-colors hover:border-teal-400 sm:p-4"
        >
          <p className="text-[11px] font-bold uppercase tracking-wide text-teal-700">
            Path 1 · Training
          </p>
          <span className="mt-0.5 inline-flex items-center gap-2 text-[13px] font-bold text-slate-900">
            <GraduationCap className="h-4 w-4 text-[#0d7377]" strokeWidth={2} />
            Learn full clinical competency
          </span>
          <span className="mt-1 text-[12.5px] leading-snug text-slate-600">
            Enrol Online first (front door) from A${CONFIG.COURSE.PRICE_ONLINE}. Then unlock your
            seat (A${CONFIG.COURSE.PRICE_SECURE_SEAT}) toward the{' '}
            {CONFIG.WORKSHOP.CONFIRMATION_THRESHOLD}-seat gate — or Complete.
          </span>
          <span className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold text-[#0d7377]">
            Enrol Online{' '}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>

        <Link
          href={suiteHref}
          className="group flex flex-col rounded-xl border-2 border-cyan-300/80 bg-gradient-to-br from-cyan-50/90 to-white p-3.5 transition-colors hover:border-cyan-400 sm:p-4"
        >
          <p className="text-[11px] font-bold uppercase tracking-wide text-cyan-800">
            Path 2 · Clinic tools
          </p>
          <span className="mt-0.5 inline-flex items-center gap-2 text-[13px] font-bold text-slate-900">
            <Activity className="h-4 w-4 text-cyan-800" strokeWidth={2} />
            Apply your protocol with SST
          </span>
          <span className="mt-1 text-[12.5px] leading-snug text-slate-600">
            SST Clinical Testing measures the heart-rate threshold and returns home sessions —
            standalone from A${SST_TIER_FROM_AUD}/mo. Equal next step; separate from course fees.
          </span>
          <span className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold text-cyan-900">
            See SST Clinical Testing{' '}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      </div>

      {!compact && (
        <p className="mt-4 text-[12px] text-slate-500">
          Free mastery on{' '}
          <Link href={masteryHref} className="font-semibold text-[#5b9aa6] underline underline-offset-2">
            /scat-mastery
          </Link>
          ; course pricing on{' '}
          <Link href={pricingHref} className="font-semibold text-[#5b9aa6] underline underline-offset-2">
            /pricing
          </Link>
          ; SST standalone on{' '}
          <Link href={suiteHref} className="font-semibold text-[#5b9aa6] underline underline-offset-2">
            /clinical-suite
          </Link>
          . Separate products — do not combine into one fee.
        </p>
      )}
    </section>
  )
}
