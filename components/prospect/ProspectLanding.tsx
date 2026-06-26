/**
 * Engine-version prospect landing — server-renders any ProspectClinic
 * via the same visual language as the hand-built Advanced Health page
 * but driven entirely from the DB row.
 *
 * Sub-components are intentionally inlined here so the engine landing
 * stays a single self-contained file (the rich Advanced Health page
 * is the design reference; this is the dynamic generator).
 */
import Link from 'next/link'
import Image from 'next/image'
import {
  Brain,
  ArrowUpRight,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  TrendingUp,
  MapPin,
  Activity,
  Library,
  FileText,
  Stethoscope,
  BookMarked,
  Lock,
  Mail,
} from 'lucide-react'
import type { ProspectClinic, PricingBreakdown } from '@/lib/prospect/types'
import { computePricing, clinicalCount, isTeamVerified } from '@/lib/prospect/pricing'
import { IndividualInterestCard } from './IndividualInterestCard'
import { HubPackBuyCard } from './HubPackBuyCard'
import { DualStreamTabs } from './DualStreamTabs'
import { ProspectTracker } from './ProspectTracker'
import { ProspectSidebar } from './ProspectSidebar'

export function ProspectLanding({ clinic }: { clinic: ProspectClinic }) {
  const pricing = computePricing(clinic.team, clinic.travelBand)
  const clinical = clinicalCount(clinic.team)
  const teamVerified = isTeamVerified(clinic.notes)

  // Location fallback — when city or region is missing/unknown, drop the
  // geographic frame entirely and pitch as the local concussion hub.
  // Clinic name + clinician count carry the personalisation regardless.
  const cityUnknown = !clinic.city || /unknown/i.test(clinic.city)
  const regionUnknown = !clinic.region || /unknown/i.test(clinic.region)
  const eyebrow = cityUnknown
    ? `Concussion Hub Program · ${clinic.shortName}`
    : `Concussion Hub Program · ${clinic.city}${clinic.state ? `, ${clinic.state}` : ''}`
  const subhead = regionUnknown
    ? `Become the local hub for concussion management.`
    : `Become the first call for concussion on the ${clinic.region}.`

  return (
    <div className="flex min-h-screen dashboard-bg">
      <ProspectTracker token={clinic.slug} accessKey={clinic.accessKey} />
      <Sidebar clinic={clinic} />
      <main className="flex-1 ml-0 md:ml-64">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 pt-16 md:pt-8 pb-6 sm:pb-8">
          {/* Greeting */}
          <div data-track-section="hero" className="mb-6">
            <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-2">
              {eyebrow}
            </p>
            <h2 className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.02] mb-2 bg-gradient-to-br from-foreground via-foreground to-accent bg-clip-text text-transparent">
              {clinic.shortName} Dashboard
            </h2>
            <p className="text-base sm:text-lg text-foreground/80 font-semibold max-w-2xl mb-4">
              {subhead}
            </p>
            {/* Catchment opportunity strip — surfaces the regional volume the
                program is built to handle, so the prospect sees scale before
                they reach pricing. Same stats appear at end of Module 1 trial
                but the dashboard placement front-loads the case. */}
            {!regionUnknown && (
              <div className="rounded-xl bg-gradient-to-br from-accent/5 via-white to-white border border-accent/15 px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl">
                <CatchmentStat headline="~144k" label="Sport-related concussions in Australia / year" />
                <CatchmentStat headline="~14%" label="Senior community AFL players concussed / season" />
                <CatchmentStat headline="4–12%" label="Youth contact-sport athletes ≥1 / season" />
                <CatchmentStat headline="60+" label={`Contact-sport clubs across ${clinic.region}`} />
              </div>
            )}
          </div>

          {/* Purpose: the two-stream selector front-and-centre on the home page —
              they pick a discipline and see that stream's modules / the difference,
              before the rest of the pitch. Gated to Purpose (ESSA-pending EP stream). */}
          {clinic.slug === 'purpose-healthcare' && (
            <DualStreamTabs learningHref={`/p/${clinic.slug}/learning?k=${clinic.accessKey ?? ''}`} />
          )}

          <div data-track-section="credibility">
            <ZacCredibility />
          </div>

          {/* Trial CTA */}
          <Link
            data-track-section="trial-cta"
            data-track-cta="trial-module1"
            href={`/p/${clinic.slug}/learning?k=${clinic.accessKey}`}
            className="block rounded-2xl mb-6 relative overflow-hidden bg-gradient-to-br from-accent via-accent to-accent-dark text-white shadow-lg group hover:shadow-xl transition-shadow"
          >
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,white,transparent_60%)]" />
            <div className="relative p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-5 items-center">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
                    <BookOpen className="w-4 h-4" strokeWidth={2} />
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-white/90">Start here</p>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-1 leading-tight">
                  Module 1 Trial · What is a Concussion?
                </h3>
                <p className="text-sm text-white/85 leading-relaxed">
                  First sections + interactive quiz checkpoint. 8 CPD hrs online across 8 modules (14 with the in-person day).
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-2 text-sm font-bold bg-white text-accent px-5 py-3 rounded-xl shadow-md group-hover:scale-[1.02] transition-transform">
                Open trial
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          {/* Toolkit callout — branded clinical pack, outreach kit, admin
              micro-course, all pre-populated with the clinic's details.
              Lives between the Module 1 trial and the on-site hero because
              the email body explicitly promises these docs; surfacing them
              prominently closes the credibility loop. */}
          <Link
            data-track-section="toolkit-callout"
            data-track-cta="toolkit-launcher"
            href={`/p/${clinic.slug}/toolkit?k=${clinic.accessKey}`}
            className="block rounded-2xl mb-6 relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-accent/5 border border-amber-200 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="relative p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-center">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5 text-amber-700" strokeWidth={2} />
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-amber-700">
                    Branded for {clinic.shortName}
                  </p>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1 leading-tight">
                  Clinical pack · outreach kit · admin micro-course
                </h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  Fillable templates pre-populated with {clinic.shortName}&apos;s name. GP letters, NDIS, school sport intake, RTP tracking, capability one-pager, front-desk training.
                </p>
              </div>
              <div className="shrink-0 inline-flex items-center gap-1.5 text-sm font-bold bg-accent text-white px-4 py-2.5 rounded-lg shadow-sm group-hover:translate-x-0.5 transition-transform">
                Open toolkit
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          {/* Onsite hero */}
          <a
            data-track-section="onsite-hero"
            data-track-cta="onsite-hero-see-pricing"
            href="#pricing"
            className="block rounded-2xl mb-6 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg group hover:shadow-xl transition-shadow"
          >
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,#fbbf24,transparent_60%)]" />
            <div className="relative p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-5 items-center">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-400/20 backdrop-blur flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 text-amber-300" strokeWidth={2} />
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-amber-300">
                    {cityUnknown ? `On-site at ${clinic.shortName}` : `The day at ${clinic.city}`} · highest-value product
                  </p>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-1 leading-tight">
                  On-site Practical Skills · your team trained on your own cases
                </h3>
                <p className="text-sm text-white/85 leading-relaxed">
                  Full practical day in-clinic. 8 hrs online pre-work + 1 day on-site = 14 CPD hrs · OA-endorsed.
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-2 text-sm font-bold bg-amber-300 text-slate-900 px-5 py-3 rounded-xl shadow-md group-hover:scale-[1.02] transition-transform">
                See pricing
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
          </a>

          {/* Team snapshot bento */}
          <div data-track-section="team-snapshot">
            <TeamSnapshot clinic={clinic} verified={teamVerified} />
          </div>

          {/* Multidisciplinary integration value frame */}
          <div data-track-section="multidisciplinary">
            <MultidisciplinaryIntegration clinic={clinic} />
          </div>

          {/* Pricing — small clinics (2–5 clinical) get the self-serve Hub Pack
              (online, no travel, can check out); ≥6 get the on-site cohort
              (book-a-call, since no-one cold-checks-out a $5–10k team day). */}
          <div data-track-section="pricing">
            {clinical >= 2 && clinical <= 5 ? (
              <HubPackBuyCard clinical={clinical} slug={clinic.slug} />
            ) : (
              <PricingTiers clinic={clinic} pricing={pricing} />
            )}
          </div>

          {/* Risk reversal */}
          <div data-track-section="risk-reversal">
            <RiskReversal />
          </div>

          {/* Local hub */}
          <div data-track-section="local-hub">
            <LocalHubSection clinic={clinic} />
          </div>

          {/* Booking + reply CTAs (consolidated; workshop fallback removed — on-site only) */}
          <div data-track-section="next-step">
            <NextStepCTA clinic={clinic} />
          </div>

          {/* Quiet pointer to individual enrolment — for clinicians who land
              on the dashboard and would rather enrol themselves than wait for
              the team deal. Links straight to /pricing. */}
          <div data-track-section="individual-signup">
            <IndividualInterestCard />
          </div>

          {/* Footer */}
          <div data-track-section="footer">
            <SocialProofFooter />
          </div>
        </div>
      </main>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────

function Sidebar({ clinic }: { clinic: ProspectClinic }) {
  return (
    <ProspectSidebar
      slug={clinic.slug}
      accessKey={clinic.accessKey}
      clinicShortName={clinic.shortName}
      clinicCity={clinic.city}
      clinicState={clinic.state}
      active="dashboard"
    />
  )
}

function SidebarItem({
  label,
  icon: Icon,
  href,
  active,
  locked,
  external,
}: {
  label: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  href?: string
  active?: boolean
  locked?: boolean
  external?: boolean
}) {
  const base = 'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium'
  if (locked) {
    return (
      <div className={`${base} opacity-50 text-muted-foreground cursor-default`}>
        <Icon className="w-[18px] h-[18px]" strokeWidth={1.5} />
        <span>{label}</span>
        <Lock className="w-3 h-3 ml-auto text-muted-foreground/60" />
      </div>
    )
  }
  if (active) {
    return (
      <div className={`${base} bg-accent/8 text-accent font-semibold cursor-default`}>
        <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
        <span>{label}</span>
      </div>
    )
  }
  if (!href) {
    return (
      <div className={`${base} text-muted-foreground cursor-default`}>
        <Icon className="w-[18px] h-[18px]" strokeWidth={1.5} />
        <span>{label}</span>
      </div>
    )
  }
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener' : undefined}
      className={`${base} text-muted-foreground hover:text-foreground hover:bg-white/40`}
    >
      <Icon className="w-[18px] h-[18px]" strokeWidth={1.5} />
      <span>{label}</span>
    </a>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTENT BLOCKS
// ─────────────────────────────────────────────────────────────────────────────

function ZacCredibility() {
  return (
    <section className="glass-premium rounded-2xl p-5 sm:p-6 mb-6">
      {/* Trust strip — endorsement + speaker + clinical badges, surfaced
          above the bio so the credibility frame loads first. CPD purchase
          decisions in healthcare hinge on this signal more than urgency. */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-accent/10 text-accent text-[10.5px] font-bold uppercase tracking-wider">
          <ShieldCheck className="w-3 h-3" strokeWidth={2.5} />
          Osteopathy Australia endorsed
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 text-amber-700 text-[10.5px] font-bold uppercase tracking-wider border border-amber-200/60">
          14 CPD hrs · AHPRA aligned
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-50 text-slate-700 text-[10.5px] font-bold uppercase tracking-wider border border-slate-200/60">
          Speaker · OA conference circuit
        </span>
      </div>
      <div className="flex items-start gap-4 sm:gap-5">
        <Image
          src="/zac-lewis.jpg"
          alt="Zac Lewis"
          width={88}
          height={88}
          className="rounded-xl w-[72px] h-[72px] sm:w-[88px] sm:h-[88px] object-cover shrink-0 border border-accent/15"
        />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-1">Delivered by</p>
          <p className="text-base sm:text-lg font-bold text-foreground leading-tight">
            Zac Lewis, Osteopath
          </p>
          <p className="text-xs text-muted-foreground mb-2">
            B.Clin.Sci., M.Ost.Med. · AHPRA-registered · Course Director, Concussion Education Australia
          </p>
          <p className="text-[12.5px] text-foreground leading-relaxed">
            A decade in concussion — professional ice-hockey leagues across NZ and Canada, and allied-health teams across Australia, on diagnosis, management and return-to-play clearance.
          </p>
        </div>
      </div>
    </section>
  )
}

function TeamSnapshot({ clinic, verified }: { clinic: ProspectClinic; verified: boolean }) {
  const t = clinic.team
  // NEVER show a headcount in the dash. The Apollo-imported numbers are almost
  // always wrong, and quoting "17 clinical · 2 admin" to a clinic that the
  // numbers don't match is the exact thing we're killing (Zac 2026-06-26). We
  // keep the counts internally for tiering/category, but the dash only ever
  // NAMES the disciplines present — the actual size gets confirmed on the call.
  if (!verified) {
    return (
      <section className="glass-premium rounded-2xl p-5 sm:p-6 mb-6">
        <p className="stat-label">Your team</p>
        <p className="text-lg font-semibold text-foreground mt-1">Trained together, in-house</p>
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
          The program trains your whole clinical team on one concussion protocol — so the case stays in-house from assessment to discharge. We&apos;ll tailor the cohort to your team&apos;s size and mix on a quick call.
        </p>
      </section>
    )
  }
  // Professions only — no counts (Zac: "just ID the professions for the pitch").
  const disciplines = [
    t.osteopaths && 'Osteo',
    t.physiotherapists && 'Physio',
    t.chiropractors && 'Chiro',
    t.generalPractitioners && 'GP',
    t.sportsMedicineDoctors && 'Sports med',
    t.exercisePhys && 'EP',
    (t.myotherapists + t.remedialMassage) && 'Myo/RMT',
    (t.practiceManager + t.admin) && 'Admin',
  ].filter(Boolean) as string[]
  return (
    <section className="glass-premium rounded-2xl p-5 sm:p-6 mb-6">
      <p className="stat-label">Your team</p>
      <div className="flex flex-wrap gap-2 mt-2">
        {disciplines.map((d) => (
          <span key={d} className="text-[13px] font-semibold text-foreground bg-accent/8 border border-accent/15 rounded-lg px-3 py-1.5">
            {d}
          </span>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
        The program trains every discipline on your floor on one concussion protocol — so the case stays in-house from assessment to discharge. We&apos;ll size the cohort with you on a quick call.
      </p>
    </section>
  )
}

function MultidisciplinaryIntegration({ clinic }: { clinic: ProspectClinic }) {
  return (
    <section className="rounded-2xl p-5 sm:p-6 mb-6 bg-gradient-to-br from-accent/8 via-white to-accent/4 border border-accent/15">
      <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-2">
        Multidisciplinary integration
      </p>
      <h3 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight mb-2 leading-tight">
        Your whole team, one protocol.
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4 max-w-2xl">
        Each step of concussion care sits with a different clinician — the Hub Program trains them all on the same pathway, so the case stays in-house from diagnosis to discharge.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { role: 'Osteo / Physio', covers: 'Diagnosis · case management · cervicogenic patterns · neuro-assessment' },
          { role: 'Physio / EP', covers: 'Sub-symptom-threshold aerobic · graded exercise · return-to-play clearance' },
          { role: 'Myo / RMT', covers: 'Massage · soft tissue · inflammation management' },
          { role: 'Admin', covers: 'GP letters · NDIS · school + club correspondence · billing flow' },
        ].map(({ role, covers }) => (
          <div key={role} className="rounded-xl bg-white/70 border border-accent/10 p-3">
            <p className="text-[10px] uppercase tracking-wider font-bold text-accent">{role}</p>
            <p className="text-[11.5px] text-foreground/85 leading-snug mt-1">{covers}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function PricingTiers({ clinic, pricing }: { clinic: ProspectClinic; pricing: PricingBreakdown }) {
  return (
    <section id="pricing" className="mt-8 scroll-mt-8">
      <div className="mb-4">
        <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-1">
          Investment · you choose the cohort
        </p>
        <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          {clinic.city && !/unknown/i.test(clinic.city)
            ? `On-site training at ${clinic.city}`
            : `On-site training for ${clinic.shortName}`}
        </h3>
      </div>

      <div className="mb-4 rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-4 py-3 shadow-sm flex items-center gap-3 sm:gap-5 flex-wrap">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[9px] uppercase tracking-wider font-bold text-white/85">Public rate</span>
          <span className="text-base font-bold">A${pricing.publicRetailRate.toLocaleString()}</span>
          <span className="text-[10px] text-white/80">/ clinician</span>
        </div>
        <span className="text-white/60 text-sm">→</span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-300">On-site cohort</span>
          <span className="text-base font-bold text-emerald-300">From A${Math.min(...pricing.cohortTiers.map((t) => t.perClinician))}</span>
          <span className="text-[10px] text-white/80">/ clinician</span>
        </div>
        <span className="text-[11px] text-white/90 sm:ml-auto">
          Save up to A${pricing.publicRetailRate - Math.min(...pricing.cohortTiers.map((t) => t.perClinician))}/clinician · whole team trains on your own cases
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {pricing.cohortTiers.map((tier) => (
          <CohortCard key={tier.name} tier={tier} publicRate={pricing.publicRetailRate} />
        ))}
      </div>

      <div className="mt-4 rounded-2xl bg-gradient-to-br from-emerald-50/80 via-white to-white border border-emerald-300/60 p-5">
        <div className="flex items-start gap-3 flex-wrap">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <span className="text-emerald-700 font-bold">+</span>
          </div>
          <div className="flex-1 min-w-[200px]">
            <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-700 mb-1">
              Front-of-house — included with every cohort
            </p>
            <p className="text-sm font-bold text-foreground mb-1">
              Concussion forms toolkit + &ldquo;AI in Concussion&rdquo; admin primer
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Reception team gets the intake/discharge forms and a brief non-clinical primer. No extra cost.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function CatchmentStat({ headline, label }: { headline: string; label: string }) {
  return (
    <div>
      <p className="text-base sm:text-lg font-bold text-accent leading-none mb-1">{headline}</p>
      <p className="text-[10.5px] text-muted-foreground leading-snug">{label}</p>
    </div>
  )
}

function CohortCard({
  tier,
  publicRate,
}: {
  tier: PricingBreakdown['cohortTiers'][number]
  publicRate: number
}) {
  const save = publicRate - tier.perClinician
  // Tier-specific cal.com UTM so post-call analytics can attribute which
  // cohort size drove the booking. Lambda B2B reality: no-one checks out
  // a $5–10k team training cold — they want to discuss scope, schedule,
  // pricing nuance first. Card itself is the CTA.
  const calUrl = `https://cal.com/zac-lewis-so8zjs/30min?utm_source=portal&utm_medium=cohort_card&utm_campaign=${encodeURIComponent(tier.name.toLowerCase().replace(/\s+/g, '-'))}`
  return (
    <a
      href={calUrl}
      target="_blank"
      rel="noopener noreferrer"
      data-track-cta={`cohort-${tier.name.toLowerCase()}`}
      className={`group relative rounded-xl p-4 overflow-hidden block hover:shadow-lg transition-all hover:-translate-y-0.5 ${
        tier.recommended
          ? 'bg-gradient-to-br from-accent/8 via-accent/3 to-white border border-accent/40 ring-1 ring-accent/30 shadow-md'
          : 'glass-premium border border-accent/8'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="stat-label mb-0">{tier.name}</p>
        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${tier.recommended ? 'bg-accent text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
          {tier.badge}
        </span>
      </div>
      <div className="flex items-baseline gap-1.5 mb-2">
        <p className={`text-2xl font-bold leading-none ${tier.recommended ? 'text-accent' : 'text-foreground'}`}>
          {tier.clinicians}
        </p>
        <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">clinicians</p>
      </div>
      <div className="flex items-baseline justify-between gap-2 pb-1.5 border-b border-accent/8">
        <span className="text-[11px] text-muted-foreground">Per clinician</span>
        <span className="text-sm font-bold text-foreground">A${tier.perClinician.toLocaleString()}</span>
      </div>
      <div className="flex items-baseline justify-between gap-2 pt-1.5">
        <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Total (GST incl.)</span>
        <span className={`text-base font-bold ${tier.recommended ? 'text-accent' : 'text-foreground'}`}>
          A${tier.total.toLocaleString()}
        </span>
      </div>
      <p className="text-[10px] text-emerald-700 font-semibold mt-1.5">
        Save A${save}/clinician vs public rate
      </p>
      <div className={`mt-3 pt-3 border-t border-accent/10 flex items-center justify-between gap-2 ${tier.recommended ? 'text-accent' : 'text-foreground/70'}`}>
        <span className="text-[11px] font-bold">Talk through this cohort →</span>
        <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </div>
    </a>
  )
}

function RiskReversal() {
  return (
    <section className="mt-6 rounded-2xl bg-gradient-to-br from-emerald-50/60 via-white to-white border border-emerald-200/60 p-5 sm:p-6">
      <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-emerald-700 mb-3">
        What you&rsquo;re covered for
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {[
          ['7-day money-back', "Try the first modules — if the program isn't right for your team, email within 7 days for a full refund (less than 25% of online content accessed)."],
          ['Reschedule free outside 2 weeks', 'Push the on-site day to a future date at no cost, provided 2+ weeks notice.'],
          ['Lifetime portal access', 'Online modules, forms, references and templates stay accessible — no renewals, no expiry.'],
        ].map(([h, d]) => (
          <div key={h} className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-700" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground mb-0.5 leading-snug">{h}</p>
              <p className="text-[11px] text-muted-foreground leading-snug">{d}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function LocalHubSection({ clinic }: { clinic: ProspectClinic }) {
  if (!clinic.localTargets.length) return null
  const sports = clinic.localTargets.filter((t) => t.type === 'sports-club' || t.type === 'surf-life-saving' || t.type === 'triathlon' || t.type === 'cycling')
  const schools = clinic.localTargets.filter((t) => t.type === 'school')
  const gps = clinic.localTargets.filter((t) => t.type === 'gp-practice')
  const regionKnown = clinic.region && !/unknown/i.test(clinic.region)
  return (
    <section className="mt-8 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/70 to-orange-50/40 p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-4 h-4 text-amber-700" />
        <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-amber-700">
          {regionKnown ? `${clinic.region} positioning` : 'Local positioning'} · pre-mapped local catchment
        </p>
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">
        Be the clinic GPs, sports clubs and schools refer to
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
        {sports.length > 0 && <LocalList title="Sports clubs" items={sports} />}
        {schools.length > 0 && <LocalList title="Schools" items={schools} />}
        {gps.length > 0 && <LocalList title="GP practices" items={gps} />}
      </div>
    </section>
  )
}

function LocalList({ title, items }: { title: string; items: { name: string }[] }) {
  return (
    <div className="rounded-xl bg-white/60 border border-amber-200/60 p-3">
      <p className="text-[10px] uppercase tracking-wider font-bold text-amber-800 mb-2">{title}</p>
      <ul className="space-y-1 text-[11px] text-foreground">
        {items.slice(0, 5).map((t, i) => (
          <li key={i}>• {t.name}</li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Single Next-Step CTA — inline Cal.com calendar so prospects pick a
 * time without leaving their tailored portal demo (the off-site Cal page
 * was hitting 4 clicks → 0 bookings in 60 days). Plus an after-5pm
 * request path for clinicians who don't have business-hours availability,
 * and a direct-email fallback.
 */
function NextStepCTA({ clinic }: { clinic: ProspectClinic }) {
  const mailtoSubject = encodeURIComponent(`Re: Concussion training for ${clinic.shortName}`)
  const talkParams = new URLSearchParams({
    slug: clinic.slug,
    name: clinic.contactFirstName ?? '',
    email: clinic.contactEmail ?? '',
    clinic: clinic.shortName ?? clinic.name,
    afterhours: '1',
  }).toString()
  const afterHoursUrl = `/talk?${talkParams}`

  return (
    <section className="mt-10">
      <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-1">Next step</p>
      <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-1">
        Pick a time — or reply
      </h3>
      <p className="text-sm text-muted-foreground mb-5 max-w-xl">
        15 minutes to walk through how the program fits {clinic.shortName}.
        No contract, no slides, just whether it makes sense for your team.
      </p>

      {/* Primary CTA — opens Cal.com booking in a new tab. The inline iframe
          embed Cal.com blocks via X-Frame-Options; their official embed needs
          the JS snippet which adds page weight + a render race. Direct link
          works, never breaks, and opens in a new tab so the prospect doesn't
          lose the portal demo while picking a slot. */}
      <div className="mb-4">
        <a
          data-track-cta="next-step-book-cal"
          href={`https://cal.com/zac-lewis-so8zjs/30min?utm_source=portal&utm_medium=next_step_cta&utm_campaign=cohort_booking&utm_content=${encodeURIComponent(clinic.slug)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl bg-gradient-to-br from-accent via-accent to-accent-dark text-white shadow-lg hover:shadow-xl transition-shadow group px-6 py-5"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Activity className="w-5 h-5" strokeWidth={2} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-white/90">15 minutes · cal.com</p>
              <h4 className="text-lg sm:text-xl font-bold mb-0.5 leading-tight">Pick a time</h4>
              <p className="text-[12px] text-white/85">Open the calendar, grab a slot that works for {clinic.shortName}.</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 text-sm font-bold bg-white text-accent px-4 py-2 rounded-lg shadow-md group-hover:scale-[1.02] transition-transform">
            Open calendar
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </a>
      </div>

      {/* Two lower-friction fallbacks side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <a
          data-track-cta="next-step-after-5pm"
          href={afterHoursUrl}
          className="block rounded-2xl bg-gradient-to-br from-accent via-accent to-accent-dark text-white shadow-lg hover:shadow-xl transition-shadow group"
        >
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
                <Activity className="w-4 h-4" strokeWidth={2} />
              </div>
              <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-white/90">After hours</p>
            </div>
            <h4 className="text-lg sm:text-xl font-bold mb-1 leading-tight">Only free after 5pm?</h4>
            <p className="text-[13px] text-white/85 leading-relaxed">
              Send your evening window — I&apos;ll come back same-day with a time.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 text-sm font-bold bg-white text-accent px-4 py-2 rounded-lg shadow-md group-hover:scale-[1.02] transition-transform">
              Request a time
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
        </a>
        <a
          data-track-cta="next-step-email-zac"
          href={`mailto:zac@concussion-education-australia.com?subject=${mailtoSubject}`}
          className="block rounded-2xl bg-white border-2 border-accent/20 hover:border-accent/40 shadow-md hover:shadow-lg transition-all group"
        >
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Mail className="w-4 h-4 text-accent" strokeWidth={2} />
              </div>
              <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent">Direct</p>
            </div>
            <h4 className="text-lg sm:text-xl font-bold text-foreground mb-1 leading-tight">Just email me</h4>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              Ask anything — team mix, scope, group pricing. I answer same day.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 text-sm font-bold bg-accent text-white px-4 py-2 rounded-lg shadow-md group-hover:scale-[1.02] transition-transform">
              Open email
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
        </a>
      </div>
    </section>
  )
}

function SocialProofFooter() {
  return (
    <section className="mt-10 mb-4">
      <div className="rounded-2xl bg-gradient-to-br from-accent/8 via-white to-white border border-accent/15 p-5 sm:p-7">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            ['500+', 'SCAT6 forms downloaded by AU clinicians'],
            ['OA', 'Endorsed by Osteopathy Australia'],
            ['14 hrs', 'AHPRA-aligned CPD per clinician'],
            ['140+', 'Peer-reviewed references in the library'],
          ].map(([h, l]) => (
            <div key={h}>
              <p className="text-xl sm:text-2xl font-bold text-accent leading-none mb-1">{h}</p>
              <p className="text-[11px] text-muted-foreground leading-snug">{l}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCESS WALL — shown when no/wrong access key
// ─────────────────────────────────────────────────────────────────────────────

export function AccessWall({ clinicName }: { clinicName?: string }) {
  return (
    <div className="min-h-screen dashboard-bg flex items-center justify-center p-6">
      <div className="max-w-md w-full glass-premium rounded-2xl p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center mx-auto mb-4 shadow-md shadow-accent/15">
          <Brain className="w-6 h-6 text-white" strokeWidth={2} />
        </div>
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-accent mb-2">
          Concussion Education Australia
        </p>
        <h1 className="text-xl font-bold text-foreground mb-3">Private proposal portal</h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-5">
          Prepared for <strong className="text-foreground">{clinicName ?? 'this clinic'}</strong>. Access requires the link from Zac&rsquo;s introductory email.
        </p>
        <a
          href="mailto:zac@concussion-education-australia.com?subject=Resend%20proposal%20portal%20access"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors"
        >
          Email Zac for access
        </a>
      </div>
    </div>
  )
}
