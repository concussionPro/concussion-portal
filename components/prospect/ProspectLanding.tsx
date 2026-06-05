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
import { computePricing, teamTotal, clinicalCount } from '@/lib/prospect/pricing'
import { IndividualInterestCard } from './IndividualInterestCard'

export function ProspectLanding({ clinic }: { clinic: ProspectClinic }) {
  const pricing = computePricing(clinic.team, clinic.travelBand)
  const total = teamTotal(clinic.team)
  const clinical = clinicalCount(clinic.team)

  return (
    <div className="flex min-h-screen dashboard-bg">
      <Sidebar clinic={clinic} />
      <main className="flex-1 ml-0 md:ml-64">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8">
          {/* Greeting */}
          <div className="mb-6">
            <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-2">
              Concussion Hub Program · {clinic.city}, {clinic.state}
            </p>
            <h2 className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.02] mb-2 bg-gradient-to-br from-foreground via-foreground to-accent bg-clip-text text-transparent">
              {clinic.shortName} Dashboard
            </h2>
            <p className="text-base sm:text-lg text-foreground/80 font-semibold max-w-2xl">
              Become the first call for concussion on the {clinic.region}.
            </p>
          </div>

          <ZacCredibility />

          {/* Trial CTA */}
          <Link
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
                  First sections + interactive quiz checkpoint. 14 CPD hrs total across 8 modules.
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-2 text-sm font-bold bg-white text-accent px-5 py-3 rounded-xl shadow-md group-hover:scale-[1.02] transition-transform">
                Open trial
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          {/* Onsite hero */}
          <a
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
                    The day at {clinic.city} · highest-value product
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
          <TeamSnapshot clinic={clinic} clinicalCount={clinical} totalCount={total} />

          {/* Multidisciplinary integration value frame */}
          <MultidisciplinaryIntegration clinic={clinic} />

          {/* Pricing */}
          <PricingTiers clinic={clinic} pricing={pricing} />

          {/* Risk reversal */}
          <RiskReversal />

          {/* Local hub */}
          <LocalHubSection clinic={clinic} />

          {/* Booking + reply CTAs (consolidated; workshop fallback removed — on-site only) */}
          <NextStepCTA clinic={clinic} />

          {/* Quiet pointer to individual enrolment — for clinicians who land
              on the dashboard and would rather enrol themselves than wait for
              the team deal. Links straight to /pricing. */}
          <IndividualInterestCard />

          {/* Footer */}
          <SocialProofFooter />
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
    <div className="hidden md:flex fixed left-0 top-0 h-screen w-64 sidebar-premium p-6 flex-col z-40">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-md shadow-accent/15">
            <Brain className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            Concussion<span className="text-accent">Pro</span>
          </h1>
        </div>
        <p className="text-[0.65rem] text-muted-foreground ml-12 uppercase tracking-widest font-medium">
          Hub Program Preview
        </p>
      </div>

      <div className="glass-premium rounded-xl p-3 mb-6">
        <p className="text-[9px] uppercase tracking-wider font-bold text-accent mb-1">Prepared for</p>
        <p className="text-sm font-bold text-foreground leading-tight">{clinic.shortName}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{clinic.city}, {clinic.state}</p>
      </div>

      <nav className="flex-1 space-y-1">
        <SidebarItem label="Dashboard" icon={() => <span className="text-base">●</span>} active />
        <SidebarItem label="Learning Suite" icon={BookOpen} href={`/p/${clinic.slug}/learning?k=${clinic.accessKey}`} />
        <SidebarItem label="SCAT Forms" icon={Activity} href="/scat-forms" external />
        <SidebarItem label="Baseline Testing" icon={TrendingUp} href="/preseason" external />
        <SidebarItem label="Reference Library" icon={Library} />
        <SidebarItem label="Clinical Toolkit" icon={FileText} locked />
        <SidebarItem label="Outreach Kit" icon={Stethoscope} locked />
        <SidebarItem label="Admin Workflow" icon={BookMarked} locked />
      </nav>

      <div className="pt-5 border-t border-white/30">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">AHPRA Aligned</p>
        <p className="text-[10px] text-muted-foreground">OA Endorsed · 14 CPD hrs</p>
      </div>
    </div>
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
            Dr Zac Lewis, Osteopath
          </p>
          <p className="text-xs text-muted-foreground mb-2">
            B.Clin.Sci., M.Ost.Med. · AHPRA-registered · Course Director, Concussion Education Australia
          </p>
          <p className="text-[12.5px] text-foreground leading-relaxed">
            Over a decade specialising in concussion — work with national + professional ice-hockey leagues across New Zealand and Canada, and quietly upskilling allied health teams across Australia on diagnosis, structured management, and return-to-play clearance.
          </p>
        </div>
      </div>
    </section>
  )
}

function TeamSnapshot({ clinic, clinicalCount, totalCount }: { clinic: ProspectClinic; clinicalCount: number; totalCount: number }) {
  const t = clinic.team
  return (
    <section className="glass-premium rounded-2xl p-5 sm:p-6 mb-6">
      <p className="stat-label">Your team</p>
      <p className="stat-value">
        {clinicalCount}
        <span className="text-base font-medium text-muted-foreground"> clinical · </span>
        {totalCount - clinicalCount}
        <span className="text-base font-medium text-muted-foreground"> admin</span>
      </p>
      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
        {[
          t.osteopaths && `${t.osteopaths} osteo`,
          t.physiotherapists && `${t.physiotherapists} physio`,
          t.generalPractitioners && `${t.generalPractitioners} GP`,
          t.sportsMedicineDoctors && `${t.sportsMedicineDoctors} sports med`,
          t.exercisePhys && `${t.exercisePhys} EP`,
          (t.myotherapists + t.remedialMassage) && `${t.myotherapists + t.remedialMassage} myo/RMT`,
          (t.practiceManager + t.admin) && `${t.practiceManager + t.admin} admin`,
        ].filter(Boolean).join(' · ')}
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
        Your whole team activated for the best concussion outcomes.
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4 max-w-2xl">
        Concussion isn&apos;t a single-discipline problem. Acute assessment, vestibular, cervical, sub-symptom-threshold aerobic, return-to-play clearance, and discharge documentation each sit with a different clinician on the {clinic.shortName} floor. The Hub Program trains the protocol across the team so the case stays in-house from diagnosis to discharge.
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
          On-site training at {clinic.city}
        </h3>
      </div>

      <div className="mb-4 rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-4 py-3 shadow-sm flex items-center gap-3 sm:gap-5 flex-wrap">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[9px] uppercase tracking-wider font-bold text-white/50">Public rate</span>
          <span className="text-base font-bold">A${pricing.publicRetailRate.toLocaleString()}</span>
          <span className="text-[10px] text-white/60">/ clinician</span>
        </div>
        <span className="text-white/30 text-sm">→</span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-300/80">On-site cohort</span>
          <span className="text-base font-bold text-emerald-300">From A${Math.min(...pricing.cohortTiers.map((t) => t.perClinician))}</span>
          <span className="text-[10px] text-white/60">/ clinician</span>
        </div>
        <span className="text-[10px] text-white/60 sm:ml-auto">
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

function CohortCard({
  tier,
  publicRate,
}: {
  tier: PricingBreakdown['cohortTiers'][number]
  publicRate: number
}) {
  const save = publicRate - tier.perClinician
  return (
    <div
      className={`relative rounded-xl p-4 overflow-hidden ${
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
    </div>
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
          ['14 CPD or refund', "Every clinician walks away with an AHPRA-aligned certificate. If your team doesn't, full refund."],
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
  return (
    <section className="mt-8 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/70 to-orange-50/40 p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-4 h-4 text-amber-700" />
        <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-amber-700">
          {clinic.region} positioning · pre-mapped local catchment
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
 * Single Next-Step CTA — consolidates the prior PublicWorkshopFallback +
 * BookingEmbed. On-site only (workshop fallback removed per Zac directive).
 * Two side-by-side options: a 30-min call, or just reply directly. Reply
 * is the lower-friction default for cold-outreach response — calendar is
 * an option, not the only path.
 */
function NextStepCTA({ clinic }: { clinic: ProspectClinic }) {
  const mailtoSubject = encodeURIComponent(`Re: Concussion training for ${clinic.shortName}`)
  return (
    <section className="mt-10">
      <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-1">Next step</p>
      <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-1">
        Reply or book a call
      </h3>
      <p className="text-sm text-muted-foreground mb-5 max-w-xl">
        Two ways to take this further. No pre-call form, no contract.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <a
          href={`mailto:zac@concussion-education-australia.com?subject=${mailtoSubject}`}
          className="block rounded-2xl bg-gradient-to-br from-accent via-accent to-accent-dark text-white shadow-lg hover:shadow-xl transition-shadow group"
        >
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
                <Mail className="w-4 h-4" strokeWidth={2} />
              </div>
              <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-white/90">Reply directly</p>
            </div>
            <h4 className="text-lg sm:text-xl font-bold mb-1 leading-tight">Just email Zac</h4>
            <p className="text-[13px] text-white/85 leading-relaxed">
              Ask anything — team mix, scheduling, scope. I&apos;ll answer the same day.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 text-sm font-bold bg-white text-accent px-4 py-2 rounded-lg shadow-md group-hover:scale-[1.02] transition-transform">
              Open email
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
        </a>
        <a
          href="https://cal.com/zac-lewis-so8zjs/30min"
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-2xl bg-white border-2 border-accent/20 hover:border-accent/40 shadow-md hover:shadow-lg transition-all group"
        >
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Activity className="w-4 h-4 text-accent" strokeWidth={2} />
              </div>
              <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent">cal.com · 30 minutes</p>
            </div>
            <h4 className="text-lg sm:text-xl font-bold text-foreground mb-1 leading-tight">Book a call</h4>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              Direct calendar — pick a slot that works for {clinic.shortName}.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 text-sm font-bold bg-accent text-white px-4 py-2 rounded-lg shadow-md group-hover:scale-[1.02] transition-transform">
              Open calendar
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
