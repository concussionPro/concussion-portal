import type { Metadata } from 'next'
import {
  Home,
  BookOpen,
  Brain,
  Activity,
  FileText,
  Library,
  BookMarked,
  Lock,
  ArrowUpRight,
  GraduationCap,
  ExternalLink,
  TrendingUp,
  Stethoscope,
} from 'lucide-react'

const ACCESS_KEY = 'ah2026'

const CLINIC = {
  name: 'Advanced Health Pain & Injury Clinic',
  shortName: 'Advanced Health',
  city: 'Buderim',
  region: 'Sunshine Coast',
  state: 'QLD',
  contactFirstName: 'Lauren',
  team: {
    osteopaths: 9,
    exercisePhys: 3,
    myotherapists: 2,
    remedialMassage: 2,
    practiceManager: 1,
    admin: 2,
  },
}

const TEAM_TOTAL =
  CLINIC.team.osteopaths +
  CLINIC.team.exercisePhys +
  CLINIC.team.myotherapists +
  CLINIC.team.remedialMassage +
  CLINIC.team.practiceManager +
  CLINIC.team.admin

export const metadata: Metadata = {
  title: 'Concussion Hub Program — Advanced Health Buderim',
  description: 'Working preview portal for Advanced Health Pain & Injury Clinic, Buderim QLD.',
  robots: 'noindex, nofollow',
}

export default async function AdvancedHealthHubPage({
  searchParams,
}: {
  searchParams: Promise<{ k?: string }>
}) {
  const { k } = await searchParams
  if (k !== ACCESS_KEY) return <AccessWall />
  return <ProspectDashboard />
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCESS WALL
// ─────────────────────────────────────────────────────────────────────────────

function AccessWall() {
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
          Prepared for <strong className="text-foreground">Advanced Health Pain &amp; Injury Clinic</strong>. Access requires the link from Zac&rsquo;s introductory email.
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

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

function ProspectDashboard() {
  return (
    <div className="flex min-h-screen dashboard-bg">
      <ProspectSidebar />
      <main className="flex-1 ml-0 md:ml-64">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8">
          <Greeting />
          <StartHereHero />
          <OnsiteHubHeadline />
          <ProspectBento />
          <PricingTiers />
        </div>
      </main>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────

function ProspectSidebar() {
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
        <p className="text-sm font-bold text-foreground leading-tight">{CLINIC.shortName}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{CLINIC.city}, {CLINIC.state}</p>
      </div>

      <nav className="flex-1 space-y-1">
        <SidebarItem label="Dashboard" icon={Home} active />
        <SidebarItem href={`/proposals/advanced-health-buderim/learning?k=${ACCESS_KEY}`} label="Learning Suite" icon={BookOpen} />
        <SidebarItem href="/scat-forms" label="SCAT Forms" icon={Activity} external />
        <SidebarItem href="/preseason" label="Baseline Testing" icon={TrendingUp} external />
        <SidebarItem href={`/proposals/advanced-health-buderim/references?k=${ACCESS_KEY}`} label="Reference Library" icon={Library} />
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
  href,
  label,
  icon: Icon,
  active,
  locked,
  external,
}: {
  href?: string
  label: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  active?: boolean
  locked?: boolean
  external?: boolean
}) {
  const base = 'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all relative text-sm font-medium'
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
        <div className="nav-active-indicator" />
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
      {external && <ExternalLink className="w-3 h-3 ml-auto opacity-50" />}
    </a>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// GREETING — accent gradient on clinic name
// ─────────────────────────────────────────────────────────────────────────────

function Greeting() {
  return (
    <div className="mb-6">
      <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-2">
        Concussion Hub Program · {CLINIC.city}, {CLINIC.state}
      </p>
      <h2 className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.02] mb-2 bg-gradient-to-br from-foreground via-foreground to-accent bg-clip-text text-transparent">
        {CLINIC.shortName} Dashboard
      </h2>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// START HERE HERO — clear focal point
// ─────────────────────────────────────────────────────────────────────────────

function StartHereHero() {
  return (
    <a
      href={`/proposals/advanced-health-buderim/learning?k=${ACCESS_KEY}`}
      className="block rounded-2xl mb-6 relative overflow-hidden bg-gradient-to-br from-accent via-accent to-accent-dark text-white shadow-lg group hover:shadow-xl transition-shadow"
    >
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,white,transparent_60%)]" />
      <div className="relative p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-5 items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
              <BookOpen className="w-4 h-4" strokeWidth={2} />
            </div>
            <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-white/90">
              Start here
            </p>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold mb-1 leading-tight">
            Module 1 Trial · What is a Concussion?
          </h3>
          <p className="text-sm text-white/85 leading-relaxed">
            First sections + interactive quiz checkpoint, open for your team. 14 CPD hrs total across 8 modules.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2 text-sm font-bold bg-white text-accent px-5 py-3 rounded-xl shadow-md group-hover:scale-[1.02] transition-transform">
          Open trial
          <ArrowUpRight className="w-4 h-4" />
        </div>
      </div>
    </a>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BENTO — visual-led, minimal text per tile
// ─────────────────────────────────────────────────────────────────────────────

function ProspectBento() {
  return (
    <div className="bento-premium">
      <Tile
        href={`/proposals/advanced-health-buderim/learning?k=${ACCESS_KEY}`}
        icon={BookOpen}
        iconTone="accent"
        label="Learning Suite"
        title="Concussion Clinical Mastery"
        stat="8"
        statSuffix="modules · 14 CPD hrs"
        badge={{ text: 'Trial open', tone: 'emerald' }}
        span2
        accent
      />
      <Tile
        href="/scat-forms"
        icon={Activity}
        iconTone="violet"
        label="SCAT Forms"
        title="Sideline + office assessment"
        stat="3"
        statSuffix="fillable forms"
        badge={{ text: 'Open', tone: 'emerald' }}
        external
      />
      <Tile
        href="/preseason"
        icon={TrendingUp}
        iconTone="emerald"
        label="Baseline Testing"
        title="Pre-season cognitive baseline"
        stat="Pre-season"
        statSuffix="club service"
        badge={{ text: 'Built', tone: 'emerald' }}
        external
      />
      <Tile
        href={`/proposals/advanced-health-buderim/references?k=${ACCESS_KEY}`}
        icon={Library}
        iconTone="amber"
        label="Reference Library"
        title="Amsterdam 2023 · AIS · RACGP · Cochrane"
        stat="140+"
        statSuffix="peer-reviewed sources"
        badge={{ text: 'Preview', tone: 'emerald' }}
        span2
      />
      <Tile
        icon={FileText}
        iconTone="amber"
        label="Clinical Toolkit"
        title="Discharge templates"
        stat="6"
        statSuffix="clinic-branded docs"
      />
      <Tile
        icon={Stethoscope}
        iconTone="amber"
        label="Outreach Kit"
        title="Schools · clubs · GPs"
        stat="6"
        statSuffix="templates + scripts"
      />
      <Tile
        icon={BookMarked}
        iconTone="amber"
        label="Admin Workflow"
        title="Reception micro-course"
        stat="1 hr"
        statSuffix="phone triage · intake · AI"
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ON-SITE HUB DAY HEADLINE — highest-value product, prominent placement
// ─────────────────────────────────────────────────────────────────────────────

function OnsiteHubHeadline() {
  return (
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
              The day at Buderim · highest-value product
            </p>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold mb-1 leading-tight">
            On-site Hub Day · your team trained on your own cases
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
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PRICING TIERS — 3 cohort sizes, per-clinician rate scales down
// ─────────────────────────────────────────────────────────────────────────────

const COHORT_TIERS = [
  {
    name: 'Essential',
    badge: 'Minimum',
    clinicians: 8,
    perClinician: 1000,
    total: 8000,
    detail: 'Minimum cohort size. Run the program with your senior team.',
  },
  {
    name: 'Recommended',
    badge: 'Most clinics your size',
    clinicians: 10,
    perClinician: 950,
    total: 9500,
    detail: `Sweet spot for a multi-disciplinary clinic like ${CLINIC.shortName}.`,
    recommended: true,
  },
  {
    name: 'Full team',
    badge: 'Best value',
    clinicians: 12,
    perClinician: 900,
    total: 10800,
    detail: 'Whole-clinic training. Per-clinician rate drops at scale.',
  },
] as const

function PricingTiers() {
  return (
    <section id="pricing" className="mt-8 scroll-mt-8">
      <div className="mb-4">
        <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-1">
          Investment · you choose the cohort
        </p>
        <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          On-site training at Buderim
        </h3>
      </div>

      <div className="mb-4 rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-4 py-3 shadow-sm flex items-center gap-3 sm:gap-5 flex-wrap">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[9px] uppercase tracking-wider font-bold text-white/50">Public rate</span>
          <span className="text-base font-bold">A$1,400</span>
          <span className="text-[10px] text-white/60">/ clinician</span>
        </div>
        <span className="text-white/30 text-sm">→</span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-300/80">On-site cohort</span>
          <span className="text-base font-bold text-emerald-300">From A$900</span>
          <span className="text-[10px] text-white/60">/ clinician</span>
        </div>
        <span className="text-[10px] text-white/60 sm:ml-auto">
          Save up to A$500/clinician · whole team trains on your own cases
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {COHORT_TIERS.map((tier) => (
          <CohortCard key={tier.name} tier={tier} />
        ))}
      </div>

      <div className="mt-4 rounded-2xl bg-gradient-to-br from-emerald-50/80 via-white to-white border-2 border-emerald-200 p-5">
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
              Reception team gets the intake/discharge forms and a brief non-clinical primer — enough to triage and book cases into the right pathway. No extra cost.
            </p>
          </div>
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full">
            Included
          </span>
        </div>
      </div>

      <div className="mt-5 glass-premium rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
        <p className="text-xs text-muted-foreground leading-relaxed flex-1 min-w-[200px]">
          All prices + GST. Cohort size confirmed on a 20-min call alongside a date that suits the clinic.
        </p>
        <a
          href="https://cal.com/zac-lewis-so8zjs/30min"
          target="_blank"
          rel="noopener"
          className="shrink-0 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-bold hover:bg-accent/90 transition-colors shadow-md"
        >
          Book call
          <ArrowUpRight className="w-4 h-4" />
        </a>
      </div>
    </section>
  )
}

function CohortCard({ tier }: { tier: (typeof COHORT_TIERS)[number] }) {
  const recommended = 'recommended' in tier && tier.recommended
  const savePerClinician = 1400 - tier.perClinician
  return (
    <div
      className={`relative rounded-xl p-4 overflow-hidden border ${
        recommended
          ? 'bg-gradient-to-br from-accent/8 via-accent/3 to-white border-2 border-accent shadow-md'
          : 'glass-premium border-accent/8'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="stat-label mb-0">{tier.name}</p>
        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${recommended ? 'bg-accent text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
          {tier.badge}
        </span>
      </div>

      <div className="flex items-baseline gap-1.5 mb-2">
        <p className={`text-2xl font-bold leading-none ${recommended ? 'text-accent' : 'text-foreground'}`}>
          {tier.clinicians}
        </p>
        <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
          clinicians
        </p>
      </div>

      <div className="flex items-baseline justify-between gap-2 pb-1.5 border-b border-accent/8">
        <span className="text-[11px] text-muted-foreground">Per clinician</span>
        <span className="text-sm font-bold text-foreground">A${tier.perClinician.toLocaleString()}</span>
      </div>
      <div className="flex items-baseline justify-between gap-2 pt-1.5">
        <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Total + GST</span>
        <span className={`text-base font-bold ${recommended ? 'text-accent' : 'text-foreground'}`}>
          A${tier.total.toLocaleString()}
        </span>
      </div>
      <p className="text-[10px] text-emerald-700 font-semibold mt-1.5">
        Save A${savePerClinician}/clinician vs public rate
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TILE — single component, visual treatment driven by props
// ─────────────────────────────────────────────────────────────────────────────

type Tone = 'accent' | 'violet' | 'emerald' | 'amber' | 'rose' | 'slate'
type BadgeTone = 'emerald' | 'amber' | 'slate'

const TONE_ICON_BG: Record<Tone, string> = {
  accent: 'from-accent/25 to-accent/10',
  violet: 'from-violet-500/20 to-violet-400/8',
  emerald: 'from-emerald-500/20 to-emerald-400/8',
  amber: 'from-amber-500/20 to-amber-400/8',
  rose: 'from-rose-500/20 to-rose-400/8',
  slate: 'from-slate-200/60 to-slate-100/40',
}

const TONE_CARD_BG: Record<Tone, string> = {
  accent: 'from-accent/[0.04] via-white to-white',
  violet: 'from-violet-50/40 via-white to-white',
  emerald: 'from-emerald-50/40 via-white to-white',
  amber: 'from-amber-50/40 via-white to-white',
  rose: 'from-rose-50/40 via-white to-white',
  slate: 'from-slate-50/60 via-white to-white',
}

const TONE_TEXT: Record<Tone, string> = {
  accent: 'text-accent',
  violet: 'text-violet-600',
  emerald: 'text-emerald-600',
  amber: 'text-amber-600',
  rose: 'text-rose-600',
  slate: 'text-slate-400',
}

const TONE_BORDER_BOTTOM: Record<Tone, string> = {
  accent: 'bg-accent',
  violet: 'bg-violet-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  slate: 'bg-slate-300',
}

const BADGE_TONE: Record<BadgeTone, string> = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  slate: 'bg-slate-50 text-slate-500 border-slate-200',
}

function Tile({
  href,
  icon: Icon,
  iconTone,
  label,
  title,
  stat,
  statSuffix,
  badge,
  span2,
  external,
  accent,
}: {
  href?: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  iconTone?: Tone
  label: string
  title: string
  stat?: string
  statSuffix?: string
  badge?: { text: string; tone: BadgeTone }
  span2?: boolean
  external?: boolean
  accent?: boolean
}) {
  const locked = !href
  const tone: Tone = locked ? 'slate' : (iconTone ?? 'accent')
  const isLink = !!href

  const containerClasses = [
    'rounded-2xl p-5 sm:p-6 relative overflow-hidden border border-accent/8',
    'bg-gradient-to-br', TONE_CARD_BG[tone],
    'shadow-sm',
    span2 ? 'bento-span-2' : '',
    locked ? 'opacity-85' : '',
    isLink ? 'group block hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200' : '',
    accent ? 'border-l-4 border-l-accent' : '',
  ].filter(Boolean).join(' ')

  const inner = (
    <>
      {isLink && (
        <ArrowUpRight className="absolute top-5 right-5 w-4 h-4 text-muted-foreground/40 group-hover:text-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
      )}

      {/* Decorative accent bar at bottom */}
      <div className={`absolute bottom-0 left-0 right-0 h-[3px] ${TONE_BORDER_BOTTOM[tone]} opacity-70`} />

      <div className="flex items-start gap-3 mb-3">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${TONE_ICON_BG[tone]} flex items-center justify-center shrink-0 shadow-sm`}>
          {locked ? (
            <Lock className={`w-5 h-5 ${TONE_TEXT[tone]}`} strokeWidth={2} />
          ) : (
            <Icon className={`w-[22px] h-[22px] ${TONE_TEXT[tone]}`} strokeWidth={1.8} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className="stat-label mb-0">{label}</p>
            {badge && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${BADGE_TONE[badge.tone]}`}>
                {badge.text}
              </span>
            )}
          </div>
          <p className={`text-sm font-bold leading-tight ${locked ? 'text-muted-foreground' : 'text-foreground'}`}>
            {title}
          </p>
        </div>
      </div>

      {stat && (
        <div className="flex items-baseline gap-2 pt-2 border-t border-accent/8">
          <span className={`text-2xl font-bold leading-none ${locked ? 'text-slate-400' : TONE_TEXT[tone]}`}>
            {stat}
          </span>
          {statSuffix && (
            <span className="text-[11px] text-muted-foreground leading-snug">{statSuffix}</span>
          )}
        </div>
      )}
    </>
  )

  if (href) {
    return (
      <a
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener' : undefined}
        className={containerClasses}
      >
        {inner}
      </a>
    )
  }

  return <div className={containerClasses}>{inner}</div>
}
