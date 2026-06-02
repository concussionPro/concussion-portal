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
  Award,
  TrendingUp,
  ArrowUpRight,
  GraduationCap,
  ExternalLink,
  MapPin,
  Users,
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

// Revenue model — defensible Year 1 estimates for the Sunshine Coast catchment
const REVENUE = {
  baselineTestingLow: 6000,   // 3 contracts × ~50 athletes × $40
  baselineTestingHigh: 12000,  // 5 contracts
  newConsultsLow: 15000,       // ~30 new presentations × $130 + 3 follow-ups
  newConsultsHigh: 28000,      // 50 presentations × deeper follow-up
  rehabEpisodesLow: 10000,     // 10 rehab episodes × 8 sessions × ~$130
  rehabEpisodesHigh: 20000,    // 20 episodes
  yearOneLow: 31000,
  yearOneHigh: 60000,
}

const PRICING = {
  combined: 12434,
  retail: 22400,
  paybackMonthsLow: 2,
  paybackMonthsHigh: 4,
}

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
          <BusinessCaseHero />
          <ProspectBento />
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
        <SidebarItem label="Learning Suite" icon={BookOpen} />
        <SidebarItem label="Clinical Toolkit" icon={FileText} locked />
        <SidebarItem href="/scat-forms" label="SCAT Forms" icon={Activity} external />
        <SidebarItem href="/references" label="Reference Repository" icon={Library} external />
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
// GREETING
// ─────────────────────────────────────────────────────────────────────────────

function Greeting() {
  return (
    <div className="mb-6">
      <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-1">
        Hi {CLINIC.contactFirstName} — here&rsquo;s the business case for {CLINIC.shortName}
      </h2>
      <p className="text-sm text-muted-foreground">
        Your team is 1-2 trained clinicians away from being the {CLINIC.region}&rsquo;s concussion clinic.
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BUSINESS CASE HERO — value first, big number is revenue not cost
// ─────────────────────────────────────────────────────────────────────────────

function BusinessCaseHero() {
  return (
    <div className="glass-premium rounded-2xl p-6 sm:p-8 mb-6 relative overflow-hidden border-2 border-accent/20">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-center">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-accent" />
            <p className="text-[10px] uppercase tracking-wider font-bold text-accent">
              Year 1 revenue estimate · {CLINIC.region} catchment
            </p>
          </div>
          <p className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight leading-none mb-3">
            A${REVENUE.yearOneLow.toLocaleString()} – A${REVENUE.yearOneHigh.toLocaleString()}
          </p>
          <p className="text-sm text-foreground leading-relaxed mb-4 max-w-2xl">
            New concussion revenue once Advanced Health is the trained, referral-positioned concussion clinic in Buderim. Investment of A${PRICING.combined.toLocaleString()} recovered in <strong>{PRICING.paybackMonthsLow}-{PRICING.paybackMonthsHigh} months</strong> — and lifetime portal access for every team member after that.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-2xl">
            <RevenueStream
              label="Pre-season baseline testing"
              detail="3-5 club contracts × 50 athletes"
              low={REVENUE.baselineTestingLow}
              high={REVENUE.baselineTestingHigh}
            />
            <RevenueStream
              label="New concussion presentations"
              detail="Sports + GP + school referrals"
              low={REVENUE.newConsultsLow}
              high={REVENUE.newConsultsHigh}
            />
            <RevenueStream
              label="Structured rehab episodes"
              detail="BCTT-led, 6-10 sessions each"
              low={REVENUE.rehabEpisodesLow}
              high={REVENUE.rehabEpisodesHigh}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          <a
            href="https://cal.com/zac-lewis-so8zjs/30min"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center justify-center gap-1.5 px-6 py-3 rounded-xl bg-accent text-white text-sm font-bold hover:bg-accent/90 transition-colors whitespace-nowrap shadow-md"
          >
            Book 20-min scoping call
            <ArrowUpRight className="w-4 h-4" />
          </a>
          <p className="text-[10px] text-muted-foreground text-center">
            cal.com/zac-lewis-so8zjs/30min
          </p>
        </div>
      </div>
    </div>
  )
}

function RevenueStream({ label, detail, low, high }: { label: string; detail: string; low: number; high: number }) {
  return (
    <div className="rounded-lg bg-white/60 border border-accent/10 px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-bold text-foreground leading-tight">
        A${(low / 1000).toFixed(0)}k–{(high / 1000).toFixed(0)}k
      </p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{detail}</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BENTO — value-led tile ordering
// ─────────────────────────────────────────────────────────────────────────────

function ProspectBento() {
  return (
    <div className="bento-premium">
      <LocalHubCard />
      <BaselineTestingCard />
      <InvestmentCard />
      <LearningSuiteCard />
      <ScatFormsCard />
      <ReferenceCard />
      <OnsiteCard />
      <TeamSnapshotCard />
    </div>
  )
}

// ── 1: LOCAL HUB (span-2) — the why, region-specific opportunity ─────────────
function LocalHubCard() {
  return (
    <div className="glass-premium rounded-2xl p-5 sm:p-6 relative overflow-hidden bento-span-2 border-l-4 border-l-amber-400">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/15 to-amber-400/5 flex items-center justify-center shrink-0">
          <MapPin className="w-6 h-6 text-amber-600/80" strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="stat-label mb-0">{CLINIC.region} positioning</p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
              Hub opportunity
            </span>
          </div>
          <p className="text-base text-foreground font-semibold mb-2">
            Be the clinic GPs, sports clubs and schools refer to
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            One trained clinic per region owns the referral flow. Pre-mapped catchment targets:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-muted-foreground leading-snug">
            <ul className="space-y-0.5">
              <li>• Sunshine Coast Falcons (Q-Cup)</li>
              <li>• Junior rugby league + AFL + soccer</li>
              <li>• Surf life saving (Maroochydore → Caloundra)</li>
              <li>• Mooloolaba triathlon + cycling</li>
            </ul>
            <ul className="space-y-0.5">
              <li>• Matthew Flinders Anglican</li>
              <li>• Sunshine Coast Grammar</li>
              <li>• Immanuel, Pacific Lutheran</li>
              <li>• Local GPs needing referral path</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── 2: BASELINE SCAT TESTING SERVICE — the revenue stream most clinics miss ──
function BaselineTestingCard() {
  return (
    <a href="/scat-forms" target="_blank" rel="noopener" className="glass-premium rounded-2xl p-5 sm:p-6 relative overflow-hidden group block">
      <ArrowUpRight className="absolute top-5 right-5 w-4 h-4 text-muted-foreground/40 group-hover:text-accent transition-colors" />
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/15 to-emerald-400/5 flex items-center justify-center">
          <Activity className="w-[18px] h-[18px] text-emerald-600/80" strokeWidth={1.8} />
        </div>
        <p className="stat-label mb-0">Baseline SCAT service</p>
        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
          Built
        </span>
      </div>
      <p className="text-sm text-foreground font-semibold mb-1">Pre-season club revenue</p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Our fillable SCAT6 + SCOAT6 are paid-service ready. Offer pre-season baseline testing to local clubs — A${REVENUE.baselineTestingLow.toLocaleString()}-{REVENUE.baselineTestingHigh.toLocaleString()}/year capture realistic.
      </p>
    </a>
  )
}

// ── 3: INVESTMENT — small, value framing not cost framing ────────────────────
function InvestmentCard() {
  return (
    <div className="glass-premium rounded-2xl p-5 sm:p-6 relative overflow-hidden">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-400/5 flex items-center justify-center">
          <Award className="w-[18px] h-[18px] text-blue-600/70" strokeWidth={1.8} />
        </div>
        <p className="stat-label mb-0">Total investment</p>
      </div>
      <p className="text-2xl font-bold text-foreground leading-tight">
        A${PRICING.combined.toLocaleString()}
        <span className="text-xs font-medium text-muted-foreground"> one-time</span>
      </p>
      <p className="text-xs text-accent font-semibold mt-1">
        Recovered in {PRICING.paybackMonthsLow}-{PRICING.paybackMonthsHigh} months
      </p>
      <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
        Lifetime portal access for {TEAM_TOTAL} staff + on-site delivery + templates + outreach kit. No subscription.
      </p>
    </div>
  )
}

// ── 4: LEARNING SUITE — what's included ──────────────────────────────────────
function LearningSuiteCard() {
  return (
    <div className="glass-premium rounded-2xl p-5 sm:p-6 relative overflow-hidden">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center">
          <BookOpen className="w-[18px] h-[18px] text-accent" strokeWidth={1.8} />
        </div>
        <p className="stat-label mb-0">Learning Suite</p>
        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 uppercase tracking-wider">
          Hub
        </span>
      </div>
      <p className="text-sm text-foreground font-semibold mb-1">14 CPD hrs / osteo</p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Full Concussion Clinical Mastery: SCAT6, SCOAT6, VOMS, BESS, cervical, PPCS, paediatric, structured rehab + RTP.
      </p>
    </div>
  )
}

// ── 5: SCAT FORMS — unlocked, real link, your-team-can-use-today ─────────────
function ScatFormsCard() {
  return (
    <a href="/scat-forms" target="_blank" rel="noopener" className="glass-premium rounded-2xl p-5 sm:p-6 relative overflow-hidden group block">
      <ArrowUpRight className="absolute top-5 right-5 w-4 h-4 text-muted-foreground/40 group-hover:text-accent transition-colors" />
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/10 to-violet-400/5 flex items-center justify-center">
          <Activity className="w-[18px] h-[18px] text-violet-600/70" strokeWidth={1.8} />
        </div>
        <p className="stat-label mb-0">SCAT Forms</p>
        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
          Open now
        </span>
      </div>
      <p className="text-sm text-foreground font-semibold mb-1">Digital Assessment</p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        SCAT6, Child SCAT6, SCOAT6 — fillable, auto-scored. Use today.
      </p>
    </a>
  )
}

// ── 6: REFERENCE REPOSITORY (span-2) — unlocked ──────────────────────────────
function ReferenceCard() {
  return (
    <a href="/references" target="_blank" rel="noopener" className="glass-premium rounded-2xl p-5 sm:p-6 relative overflow-hidden group block bento-span-2">
      <ArrowUpRight className="absolute top-5 right-5 w-4 h-4 text-muted-foreground/40 group-hover:text-accent transition-colors" />
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-400/5 flex items-center justify-center shrink-0">
          <Library className="w-5 h-5 text-amber-600/70" strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="stat-label">Reference Repository</p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
              Open now
            </span>
          </div>
          <p className="text-sm text-foreground font-semibold mb-1">140+ Peer-Reviewed Sources</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Amsterdam 2023, AIS 2024, RACGP, Cochrane. Searchable. Your team uses it today.
          </p>
        </div>
      </div>
    </a>
  )
}

// ── 7: ON-SITE HUB DAY ───────────────────────────────────────────────────────
function OnsiteCard() {
  return (
    <div className="glass-premium rounded-2xl p-5 sm:p-6 relative overflow-hidden opacity-90">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500/10 to-rose-400/5 flex items-center justify-center">
          <GraduationCap className="w-[18px] h-[18px] text-rose-600/70" strokeWidth={1.8} />
        </div>
        <p className="stat-label mb-0">On-site Hub Day</p>
        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 uppercase tracking-wider">
          Included
        </span>
      </div>
      <p className="text-sm text-foreground font-semibold mb-1">In-clinic at Buderim</p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Full-day hands-on training + 6 discharge templates + outreach kit + 30-day support.
      </p>
    </div>
  )
}

// ── 8: TEAM SNAPSHOT — context, not hero ─────────────────────────────────────
function TeamSnapshotCard() {
  return (
    <div className="glass-premium rounded-2xl p-5 sm:p-6 relative overflow-hidden">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center">
          <Users className="w-[18px] h-[18px] text-accent" strokeWidth={1.8} />
        </div>
        <p className="stat-label mb-0">Your team trained</p>
      </div>
      <p className="text-2xl font-bold text-foreground leading-tight">
        {TEAM_TOTAL}<span className="text-xs font-medium text-muted-foreground"> staff</span>
      </p>
      <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
        {CLINIC.team.osteopaths} osteo · {CLINIC.team.exercisePhys} EP · {CLINIC.team.myotherapists + CLINIC.team.remedialMassage} myo/RMT · {CLINIC.team.practiceManager + CLINIC.team.admin} admin
      </p>
    </div>
  )
}
