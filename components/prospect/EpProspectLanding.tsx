/**
 * EP-clinic course pitch — Concussion Rehab Mastery (CRM), the exercise-
 * physiology stream. A re-org of the course dashboard pitch aimed at ESSA-
 * registered exercise physiologists: leads with the exercise-rehab pathway
 * (SSTAE is core EP scope), shows the real CRM modules via DualStreamTabs, and
 * carries the shared Concussion Clinical Mastery practical day.
 *
 * "In the barrel" for post-ESSA outreach: every ESSA claim derives from the
 * single CONFIG.FEATURES.ESSA_ACCREDITED switch. FALSE (today) → "built to ESSA
 * CPD standards · endorsement pending", CTA is register-interest, NEVER "enrol"
 * or "accredited". Flip the switch on real approval and the pitch goes live.
 * Separate route + tracking lane from both the CCM course engine and SST.
 */
import { CONFIG } from '@/lib/config'
import { HeartPulse, Activity, ShieldCheck, ArrowRight, ClipboardCheck, Stethoscope } from 'lucide-react'
import type { ProspectClinic } from '@/lib/prospect/types'
import { ProspectTracker } from './ProspectTracker'
import { ProspectSidebar } from './ProspectSidebar'
import { DualStreamTabs } from './DualStreamTabs'
import { getModulesMeta } from '@/data/module-meta'
import { getEpModulesMeta } from '@/data/ep-modules'

export function EpProspectLanding({ clinic }: { clinic: ProspectClinic }) {
  const essaApproved = CONFIG.FEATURES.ESSA_ACCREDITED
  const cityUnknown = !clinic.city || /unknown/i.test(clinic.city)
  const calUrl = `https://cal.com/zac-lewis-so8zjs/30min?utm_source=portal&utm_medium=ep_pitch&utm_campaign=${encodeURIComponent(clinic.slug)}`
  const previewHref = `/p/${clinic.slug}/learning/module-1?course=crm${clinic.accessKey ? `&k=${clinic.accessKey}` : ''}`

  // Compliance: CTA + accreditation wording flips ONLY on the master switch.
  const accredLine = essaApproved
    ? '8 ESSA CPD points · exercise-physiology stream · start today'
    : 'Built to ESSA CPD standards · endorsement pending · preview now'
  const primaryLabel = essaApproved ? 'Enrol the team' : 'Book a 15-min call'
  const primaryHref = essaApproved ? '#streams' : calUrl
  const primaryExternal = !essaApproved

  const valueCards = [
    {
      icon: Activity,
      title: 'The assessment IS the treatment',
      body: 'A guided graded test sets each patient’s measured heart-rate threshold, and the sub-symptom-threshold aerobic band is prescribed straight from it — the pathway EPs are scoped to deliver, done properly.',
    },
    {
      icon: HeartPulse,
      title: 'Sub-symptom-threshold aerobic rehab, in your scope',
      body: 'CRM is built around the exercise-rehab pathway: dosing the band, progressing by heart-rate response, and graded return to sport and performance — the parts that sit squarely with exercise physiology.',
    },
    {
      icon: ShieldCheck,
      title: 'Recognition, red flags & when to refer',
      body: 'Clear scope-of-practice boundaries and referral triggers, so you take the exercise-rehab work confidently and hand back what belongs with medical and allied-health colleagues.',
    },
  ]

  return (
    <div className="flex min-h-screen dashboard-bg">
      <ProspectTracker token={clinic.slug} accessKey={clinic.accessKey} />
      <ProspectSidebar
        slug={clinic.slug}
        accessKey={clinic.accessKey}
        clinicShortName={clinic.shortName}
        clinicCity={clinic.city}
        clinicState={clinic.state}
        accreditation="essa"
        active="dashboard"
      />
      <main className="flex-1 ml-0 md:ml-64">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 pt-16 md:pt-8 pb-28 sm:pb-24">

          {/* Hero — the exercise-rehab pathway, personalised */}
          <div data-track-section="hero" className="mb-8">
            <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-2">
              {cityUnknown ? `Concussion Rehab Mastery · for ${clinic.shortName}` : `Concussion Rehab Mastery · ${clinic.city}${clinic.state ? `, ${clinic.state}` : ''}`}
            </p>
            <h2 className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.03] mb-3 bg-gradient-to-br from-foreground via-foreground to-accent bg-clip-text text-transparent">
              Concussion rehab is exercise rehab.
            </h2>
            <p className="text-base sm:text-lg text-foreground/80 font-semibold max-w-2xl">
              The first-line treatment for concussion is now sub-symptom-threshold aerobic exercise — measured, dosed and progressed. That’s exercise physiology. CRM credentials {clinic.shortName}’s EPs to own that pathway end-to-end, from graded test to return to sport.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {['Measured threshold, not age formula', 'SSTAE dosing & progression', 'Graded return to sport'].map((c) => (
                <span key={c} className="inline-flex items-center gap-1.5 rounded-full bg-accent/8 border border-accent/15 px-3 py-1.5 text-[12px] font-semibold text-accent">
                  <Activity className="w-3.5 h-3.5" /> {c}
                </span>
              ))}
            </div>
          </div>

          {/* Offer hook — the ask, tier-aware wording flips on approval */}
          <div data-track-section="offer-hook" className="mb-8 rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/[0.06] via-white to-white p-5 sm:p-6 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 sm:gap-6 sm:items-center">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-1.5">Concussion Rehab Mastery · exercise-physiology stream</p>
                <p className="text-lg sm:text-xl font-bold text-foreground leading-snug mb-1.5">
                  Credential your EPs in the exercise-rehab pathway the guidelines now put first.
                </p>
                <p className="text-[13px] sm:text-sm text-foreground/70 font-semibold">{accredLine}</p>
              </div>
              <div className="flex flex-col gap-2.5 shrink-0">
                <a
                  href={primaryHref}
                  data-track-cta="ep-hook-primary"
                  target={primaryExternal ? '_blank' : undefined}
                  rel={primaryExternal ? 'noopener noreferrer' : undefined}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent text-white font-bold px-5 py-3 text-sm shadow-md hover:opacity-95 transition active:scale-[0.98]"
                >
                  {primaryLabel} <ArrowRight className="w-4 h-4" />
                </a>
                <a href={previewHref} data-track-cta="ep-hook-preview" className="text-center text-[12.5px] font-semibold text-accent hover:underline">
                  Preview Module 1 ↓
                </a>
              </div>
            </div>
          </div>

          {/* Value cards */}
          <div data-track-section="value" className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {valueCards.map((c) => {
              const Icon = c.icon
              return (
                <div key={c.title} className="rounded-2xl border border-black/10 bg-white p-5">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-accent" strokeWidth={2} />
                  </div>
                  <p className="text-[15px] font-bold text-foreground mb-1.5 leading-snug">{c.title}</p>
                  <p className="text-[13px] text-foreground/70 leading-relaxed">{c.body}</p>
                </div>
              )
            })}
          </div>

          {/* Real CRM modules via the shared dual-stream preview (CRM-first) */}
          <div id="streams" className="scroll-mt-8">
            <DualStreamTabs
              initialStream="crm"
              essaApproved={essaApproved}
              detailed={{
                slug: clinic.slug,
                accessKey: clinic.accessKey ?? '',
                ccm: getModulesMeta(),
                crm: getEpModulesMeta(),
              }}
            />
          </div>

          {/* Shared practical day */}
          <div data-track-section="practical-day" className="mb-8 rounded-2xl border border-black/10 bg-gradient-to-br from-slate-50 to-white p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <Stethoscope className="w-5 h-5 text-accent" strokeWidth={2} />
              </div>
              <div>
                <p className="text-[15px] font-bold text-foreground mb-1.5">One practical day, shared with the whole clinic</p>
                <p className="text-[13px] text-foreground/70 leading-relaxed max-w-3xl">
                  Both streams sit over one hands-on Concussion Clinical Mastery practical day — your EPs train alongside the physios and allied-health team on the same cases. Each stream is {CONFIG.COURSE.ONLINE_CPD_POINTS} hours online CPD; the shared day adds {CONFIG.COURSE.IN_PERSON_CPD_POINTS}, for {CONFIG.COURSE.CRM_TOTAL_CPD_POINTS} CPD hours total.
                </p>
              </div>
            </div>
          </div>

          {/* Close */}
          <div data-track-section="next-step" className="rounded-2xl border border-black/10 bg-white p-6 sm:p-8 text-center">
            <ClipboardCheck className="w-8 h-8 text-accent mx-auto mb-3" strokeWidth={1.75} />
            <p className="text-xl sm:text-2xl font-bold text-foreground mb-2">
              {essaApproved ? 'Credential the team' : 'See it before it launches'}
            </p>
            <p className="text-[14px] text-foreground/70 max-w-xl mx-auto mb-5">
              {essaApproved
                ? 'CRM is ESSA-accredited and ready for your exercise physiologists. Fifteen minutes and I’ll set up the team.'
                : 'CRM is built and submitted to ESSA for CPD endorsement. Fifteen minutes and I’ll walk you through the modules and reserve your team’s place for launch.'}
            </p>
            <a
              href={calUrl}
              data-track-cta="next-step-book-cal"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-accent text-white font-bold px-6 py-3.5 text-sm shadow-md hover:opacity-95 transition active:scale-[0.98]"
            >
              Book a 15-min call <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="h-20 sm:h-16" aria-hidden />
        </div>
      </main>

      {/* Persistent CTA bar */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 z-40 border-t border-black/10 bg-white/95 backdrop-blur-md px-4 py-2.5 shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.18)]">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0 hidden sm:block">
            <p className="text-[11.5px] font-bold text-foreground leading-tight truncate">{accredLine}</p>
            <p className="text-[11px] text-foreground/60 truncate">{clinic.shortName}</p>
          </div>
          <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
            <a href={previewHref} data-track-cta="sticky-preview" className="text-[13px] font-semibold text-accent px-3 py-2 rounded-lg hover:bg-accent/5 transition">
              Preview a module
            </a>
            <a
              href={calUrl}
              data-track-cta="sticky-primary"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-accent text-white font-bold px-4 py-2.5 text-[13px] shadow-md hover:opacity-95 transition active:scale-[0.98]"
            >
              Book a call <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
