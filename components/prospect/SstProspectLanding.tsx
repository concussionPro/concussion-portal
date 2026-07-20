/**
 * SST prospect pitch — a re-org of the course dashboard pitch, optimized for the
 * SST Trainer TOOL (not the CCM course). Reuses the same dashboard shell +
 * sidebar as ProspectLanding, and the REAL landing-page graphics (the animated
 * watch, the cited stat cards, the clinician-loop steps, the navy dashboard
 * loopback panel) so it's visual, not a text wall. Still UPSELLS the course.
 *
 * SST is pending App Store approval — the ask is a 15-min dashboard walkthrough
 * + founding place, not a live download. Separate route + tracking lane from the
 * course engine (SST outreach has not begun).
 */
import { CONFIG } from '@/lib/config'
import { ArrowRight, GraduationCap, ClipboardCheck } from 'lucide-react'
import type { ProspectClinic } from '@/lib/prospect/types'
import { ProspectTracker } from './ProspectTracker'
import { ProspectSidebar } from './ProspectSidebar'
import { SstWatchAnimation } from '@/components/platform/SstWatchAnimation'

const NAVY = '#16243f'

// Cited facts + clinician loop — lifted verbatim from the live SST landing
// (components/platform/SstSuiteLanding.tsx) so the pitch and the public page
// tell the same, evidence-backed story.
const FACTS = [
  { stat: '12 vs 21.5 days', body: 'Median recovery for patients who completed their prescribed sub-symptom sessions versus those who didn’t.', cite: 'Leddy et al., adolescent SRC cohort (PMC9378725), p = 0.016' },
  { stat: '~4 in 10', body: 'Fell short of even two-thirds of their prescribed volume — unseen until re-test on a paper diary.', cite: 'Same cohort; physio home-exercise adherence runs as low as 50%' },
  { stat: 'First-line', body: 'Sub-symptom aerobic exercise is first-line concussion care — measured threshold, ~20 min/day, 6 of 7 days.', cite: 'Patricios et al., Amsterdam 2023 (BJSM); Leddy, JAMA Peds 2019' },
]
// The clinician's real pain points (Zac) — each named, with the SST answer folded in.
const PAINS = [
  { t: 'Patients drift off after visit two', b: 'Most concussion episodes lose the patient once symptoms ease — the rehab stalls and so does the revenue. Every scheduled re-test is a checkpoint that books them back in, with billable oversight in between.' },
  { t: 'Home data is a paper diary you can’t trust', b: 'Adherence gets self-reported on a sheet and reconstructed at re-test. SST collects heart rate, minutes in-band and symptoms from the patient’s own wearable — objective, timestamped, no manual entry.' },
  { t: 'Progressive load is guesswork', b: 'Sub-threshold rehab only works if the band advances as the threshold improves. SST plots the measured-threshold trajectory and lets only verified live sessions progress the band — progression you can see and defend.' },
]
// Ease of use is the wedge on both sides (tap-minimal doctrine).
const EASE = [
  { who: 'For your patient', b: 'No new device, no account to build. They open the app, enter your clinic code once, and train with the watch they already own — the band and the symptom stop-rules do the thinking. Tap-minimal, built for a foggy concussed brain.' },
  { who: 'For you', b: 'No data wrangling. Sessions land on your dashboard as they happen, flares surface in a review queue, and the GP report writes itself at discharge. You review and sign — that’s the whole workflow.' },
]
const LOOPBACK = [
  { t: 'Every session, live', b: 'Each home session syncs to your dashboard as it happens — heart rate, minutes in-band, symptom score.' },
  { t: 'Flares flag to you', b: 'A symptom flare surfaces in your review queue the same day, not at the next appointment.' },
  { t: 'The recovery trajectory', b: 'A serial measured-threshold curve per patient — the instrument your re-test and clearance calls read from.' },
  { t: 'The GP report writes itself', b: 'At episode end, a single-page PDF: trajectory, symptom tables, and a clearance-or-extend recommendation to sign.' },
]

export function SstProspectLanding({ clinic }: { clinic: ProspectClinic }) {
  const cityUnknown = !clinic.city || /unknown/i.test(clinic.city)
  const kq = clinic.accessKey ? `?k=${clinic.accessKey}` : ''
  const calUrl = `https://cal.com/zac-lewis-so8zjs/30min?utm_source=portal&utm_medium=sst_pitch&utm_campaign=${encodeURIComponent(clinic.slug)}`

  return (
    <div className="flex min-h-screen dashboard-bg">
      <ProspectTracker token={clinic.slug} accessKey={clinic.accessKey} />
      <ProspectSidebar
        slug={clinic.slug}
        accessKey={clinic.accessKey}
        clinicShortName={clinic.shortName}
        clinicCity={clinic.city}
        clinicState={clinic.state}
        active="dashboard"
      />
      <main className="flex-1 ml-0 md:ml-64">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 pt-16 md:pt-8 pb-28 sm:pb-24">

          {/* Hero — obvious value prop first, beside the live watch graphic */}
          <div data-track-section="hero" className="mb-8">
            <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-3">
              For clinicians managing concussion &amp; neuro rehab{cityUnknown ? '' : ` · ${clinic.city}`}
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 lg:gap-12 items-center">
              <div className="min-w-0">
                <h2 className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.03] mb-4 bg-gradient-to-br from-foreground via-foreground to-accent bg-clip-text text-transparent">
                  See the home rehab you prescribe but can’t watch.
                </h2>
                <p className="text-base sm:text-lg text-foreground/80 font-semibold max-w-xl mb-5">
                  You already prescribe sub-symptom aerobic rehab. It happens at home, 6 days a week, where you can’t tell if they hit the band or bailed. SST Trainer makes every home session <span className="text-accent">measured, visible, and signed off</span> — and writes the GP report for you.
                </p>
                {/* Three outcomes, not features — what the clinician GETS. */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-xl">
                  {[
                    ['See every session', 'Live HR, minutes in-band, symptoms — as it happens'],
                    ['Catch flares same-day', 'Surfaced in your queue, not at the next visit'],
                    ['GP report writes itself', 'Trajectory + clearance call, ready to sign'],
                  ].map(([t, b]) => (
                    <div key={t} className="rounded-xl bg-accent/[0.06] border border-accent/15 px-3 py-2.5">
                      <p className="text-[13px] font-bold text-foreground leading-tight">{t}</p>
                      <p className="text-[11.5px] text-foreground/60 leading-snug mt-0.5">{b}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-center lg:justify-end shrink-0">
                <SstWatchAnimation />
              </div>
            </div>
          </div>

          {/* Offer hook — the ask, high up */}
          <div data-track-section="offer-hook" className="mb-10 rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/[0.06] via-white to-white p-5 sm:p-6 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 sm:gap-6 sm:items-center">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-1.5">Founding clinics · forming now</p>
                <p className="text-lg sm:text-xl font-bold text-foreground leading-snug mb-1.5">
                  See the between-visit view for one of your patients — and the report it writes at episode end.
                </p>
                <p className="text-[13px] sm:text-sm text-foreground/70 font-semibold">
                  Your first 3 patients free · clinic code the same week · founding terms locked for good.
                </p>
              </div>
              <div className="flex flex-col gap-2.5 shrink-0">
                <a
                  href={calUrl}
                  data-track-cta="sst-hook-book"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent text-white font-bold px-5 py-3 text-sm shadow-md hover:opacity-95 transition active:scale-[0.98]"
                >
                  Book a 15-min dashboard demo <ArrowRight className="w-4 h-4" />
                </a>
                <a href="#pains" data-track-cta="sst-hook-pains" className="text-center text-[12.5px] font-semibold text-accent hover:underline">
                  See where it fits ↓
                </a>
              </div>
            </div>
          </div>

          {/* Their pain points — named, with the SST answer folded in */}
          <div data-track-section="pain-points" id="pains" className="mb-10 scroll-mt-8">
            <h3 className="mb-5 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Where concussion rehab breaks down</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {PAINS.map((p) => (
                <div key={p.t} className="rounded-2xl border border-black/10 bg-white p-6">
                  <p className="text-[16px] font-bold text-foreground mb-2 leading-snug">{p.t}</p>
                  <p className="text-[13.5px] text-foreground/65 leading-relaxed">{p.b}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Cited stat cards (from the live landing) */}
          <div data-track-section="evidence" className="mb-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {FACTS.map((f) => (
              <div key={f.stat} className="rounded-2xl border border-black/10 bg-white p-6">
                <div className="font-bold tracking-tight text-accent leading-none" style={{ fontSize: 'clamp(24px,2.6vw,30px)' }}>{f.stat}</div>
                <p className="mt-2 text-[13.5px] leading-[1.5] text-foreground/70">{f.body}</p>
                <p className="mt-3 text-[11px] italic leading-[1.4] text-foreground/40">{f.cite}</p>
              </div>
            ))}
          </div>

          {/* Ease of use — both sides, the two-sided wedge */}
          <div data-track-section="ease-of-use" className="mb-10">
            <h3 className="mb-5 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Effortless on both sides</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {EASE.map((e) => (
                <div key={e.who} className="rounded-2xl border border-black/10 bg-white p-6">
                  <p className="text-[11px] uppercase tracking-[0.14em] font-bold text-accent mb-2">{e.who}</p>
                  <p className="text-[14.5px] text-foreground/75 leading-relaxed">{e.b}</p>
                </div>
              ))}
            </div>
          </div>

          {/* The dashboard loopback — the navy panel from the landing */}
          <div data-track-section="dashboard-loopback" className="mb-10 rounded-2xl p-8 sm:p-10" style={{ background: NAVY }}>
            <span className="text-[12px] font-bold uppercase tracking-[0.1em]" style={{ color: '#7fd4c8' }}>Your clinician portal</span>
            <h3 className="mb-2 mt-2 font-bold tracking-tight text-white" style={{ fontSize: 'clamp(24px,3vw,34px)', lineHeight: 1.1 }}>
              The patient trains at home. Everything comes back to you.
            </h3>
            <p className="m-0 mb-7 max-w-[660px] text-[14.5px] leading-[1.55]" style={{ color: '#b9c6da' }}>
              Signing up gives {clinic.shortName} a login to the CEA portal — that’s where the data lands. You don’t chase the patient; you review what the app sends back between appointments, so they keep following the program <em>you</em> prescribed instead of it stalling until the next visit.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {LOOPBACK.map((i) => (
                <div key={i.t} className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <h4 className="m-0 mb-1.5 text-[15px] font-bold text-white">{i.t}</h4>
                  <p className="m-0 text-[12.5px] leading-[1.5]" style={{ color: '#a7c2c5' }}>{i.b}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Course upsell — still points them to the CPD course */}
          <div data-track-section="course-upsell" className="mb-10 rounded-2xl border border-accent/25 bg-accent/[0.04] p-5 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 sm:items-center">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5 text-accent" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[15px] font-bold text-foreground mb-1">Credential the team behind the tool</p>
                  <p className="text-[13px] text-foreground/70 leading-relaxed max-w-2xl">
                    SST delivers the protocol; the Osteopathy Australia-endorsed <span className="font-semibold text-foreground">Concussion Clinical Mastery</span> course credentials the clinicians running it — assessment, the Buffalo protocol, return-to-play. From A${CONFIG.COURSE.PRICE_ONLINE} online.
                  </p>
                </div>
              </div>
              <a
                href={`/p/${clinic.slug}${kq}`}
                data-track-cta="sst-course-upsell"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-[1.5px] border-accent text-accent font-bold px-5 py-2.5 text-[13px] hover:bg-accent/5 transition shrink-0"
              >
                See the course <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Close */}
          <div data-track-section="next-step" className="rounded-2xl border border-black/10 bg-white p-6 sm:p-8 text-center">
            <ClipboardCheck className="w-8 h-8 text-accent mx-auto mb-3" strokeWidth={1.75} />
            <p className="text-xl sm:text-2xl font-bold text-foreground mb-2">Fifteen minutes, one patient</p>
            <p className="text-[14px] text-foreground/70 max-w-xl mx-auto mb-5">
              I’ll show you the between-visit view for a single patient, and the report it generates at episode end. If it’s a fit, your clinic code is live that week.
            </p>
            <a
              href={calUrl}
              data-track-cta="next-step-book-cal"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-accent text-white font-bold px-6 py-3.5 text-sm shadow-md hover:opacity-95 transition active:scale-[0.98]"
            >
              Book a 15-min dashboard demo <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="h-20 sm:h-16" aria-hidden />
        </div>
      </main>

      {/* Persistent CTA bar */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 z-40 border-t border-black/10 bg-white/95 backdrop-blur-md px-4 py-2.5 shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.18)]">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0 hidden sm:block">
            <p className="text-[11.5px] font-bold text-foreground leading-tight truncate">Your first 3 patients free · founding terms locked for good</p>
            <p className="text-[11px] text-foreground/60 truncate">{clinic.shortName}</p>
          </div>
          <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
            <a href={`/p/${clinic.slug}${kq}`} data-track-cta="sticky-course" className="text-[13px] font-semibold text-accent px-3 py-2 rounded-lg hover:bg-accent/5 transition">
              The course
            </a>
            <a
              href={calUrl}
              data-track-cta="sticky-primary"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-accent text-white font-bold px-4 py-2.5 text-[13px] shadow-md hover:opacity-95 transition active:scale-[0.98]"
            >
              Book a demo <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
