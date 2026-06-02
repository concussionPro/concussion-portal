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
      <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-1">
        Concussion Hub Program · {CLINIC.city}, {CLINIC.state}
      </p>
      <h2 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight leading-[1.05] mb-2">
        {CLINIC.shortName}
      </h2>
      <p className="text-sm text-muted-foreground">
        Hi {CLINIC.contactFirstName} — your team&rsquo;s preview workspace. Explore the contents below.
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BENTO — capability-led, no pricing visible
// ─────────────────────────────────────────────────────────────────────────────

function ProspectBento() {
  return (
    <div className="bento-premium">
      <LearningSuiteCard />
      <ScatFormsCard />
      <BaselineTestingCard />
      <ReferenceCard />
      <ClinicalToolkitCard />
      <OutreachKitCard />
      <AdminWorkflowCard />
      <OnsiteCard />
    </div>
  )
}

// ── 1: LEARNING SUITE (span-2, hero) — links to module list ──────────────────
function LearningSuiteCard() {
  return (
    <a href={`/proposals/advanced-health-buderim/learning?k=${ACCESS_KEY}`} className="glass-premium rounded-2xl p-5 sm:p-6 relative overflow-hidden group block bento-span-2 border-l-4 border-l-accent">
      <ArrowUpRight className="absolute top-5 right-5 w-5 h-5 text-muted-foreground/40 group-hover:text-accent transition-colors" />
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center shrink-0">
          <BookOpen className="w-6 h-6 text-accent" strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="stat-label mb-0">Learning Suite</p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
              Trial open
            </span>
          </div>
          <p className="text-base text-foreground font-semibold mb-1">8 Clinical Modules · 14 CPD hrs</p>
          <p className="text-xs text-muted-foreground leading-relaxed mb-2">
            Concussion Clinical Mastery — SCAT6, SCOAT6, VOMS, BESS, cervical, PPCS, paediatric, return-to-play. AHPRA-aligned, OA endorsed.
          </p>
          <p className="text-[11px] font-bold text-accent">
            → Open Module 1 trial
          </p>
        </div>
      </div>
    </a>
  )
}

// ── 2: SCAT FORMS — unlocked ─────────────────────────────────────────────────
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
          Open
        </span>
      </div>
      <p className="text-sm text-foreground font-semibold mb-1">Digital Assessment</p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        SCAT6, Child SCAT6, SCOAT6 — fillable, auto-scored, downloadable.
      </p>
    </a>
  )
}

// ── 3: BASELINE COGNITIVE TESTING ────────────────────────────────────────────
function BaselineTestingCard() {
  return (
    <a href="/scat-forms" target="_blank" rel="noopener" className="glass-premium rounded-2xl p-5 sm:p-6 relative overflow-hidden group block">
      <ArrowUpRight className="absolute top-5 right-5 w-4 h-4 text-muted-foreground/40 group-hover:text-accent transition-colors" />
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/15 to-emerald-400/5 flex items-center justify-center">
          <Activity className="w-[18px] h-[18px] text-emerald-600/80" strokeWidth={1.8} />
        </div>
        <p className="stat-label mb-0">Pre-season baseline</p>
        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
          Built
        </span>
      </div>
      <p className="text-sm text-foreground font-semibold mb-1">Cognitive baseline testing</p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Pre-season baseline SCAT6 + SCOAT6 for local sports clubs. Recurring service capability.
      </p>
    </a>
  )
}

// ── 4: REFERENCE REPOSITORY (span-2) — unlocked ──────────────────────────────
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
              Open
            </span>
          </div>
          <p className="text-sm text-foreground font-semibold mb-1">140+ Peer-Reviewed Sources</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Amsterdam 2023, AIS 2024, RACGP, Cochrane. Searchable.
          </p>
        </div>
      </div>
    </a>
  )
}

// ── 5: CLINICAL TOOLKIT — locked ─────────────────────────────────────────────
function ClinicalToolkitCard() {
  return (
    <div className="glass-premium rounded-2xl p-5 sm:p-6 relative overflow-hidden opacity-85">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-200/50 to-slate-100/50 flex items-center justify-center">
          <Lock className="w-[18px] h-[18px] text-slate-400" strokeWidth={1.8} />
        </div>
        <p className="stat-label mb-0">Clinical Toolkit</p>
      </div>
      <p className="text-sm text-foreground font-semibold mb-1">6 Discharge Templates</p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        GP letter, school RTP, parent plan, sports cert, WorkCover, NDIS — clinic-branded.
      </p>
    </div>
  )
}

// ── 6: OUTREACH KIT — locked ─────────────────────────────────────────────────
function OutreachKitCard() {
  return (
    <div className="glass-premium rounded-2xl p-5 sm:p-6 relative overflow-hidden opacity-85">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-200/50 to-slate-100/50 flex items-center justify-center">
          <Lock className="w-[18px] h-[18px] text-slate-400" strokeWidth={1.8} />
        </div>
        <p className="stat-label mb-0">Outreach Kit</p>
      </div>
      <p className="text-sm text-foreground font-semibold mb-1">6 Templates · scripts · tracker</p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Schools, sports clubs, GPs — email sequences + phone scripts + follow-up tracker.
      </p>
    </div>
  )
}

// ── 7: ADMIN WORKFLOW — locked ───────────────────────────────────────────────
function AdminWorkflowCard() {
  return (
    <div className="glass-premium rounded-2xl p-5 sm:p-6 relative overflow-hidden opacity-85">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-200/50 to-slate-100/50 flex items-center justify-center">
          <Lock className="w-[18px] h-[18px] text-slate-400" strokeWidth={1.8} />
        </div>
        <p className="stat-label mb-0">Admin Workflow</p>
      </div>
      <p className="text-sm text-foreground font-semibold mb-1">1-hr Reception Course</p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Phone triage, red flags, intake form, AI-safe workflow, template library.
      </p>
    </div>
  )
}

// ── 8: ON-SITE HUB DAY — the "next step" framing ─────────────────────────────
function OnsiteCard() {
  return (
    <div className="glass-premium rounded-2xl p-5 sm:p-6 relative overflow-hidden opacity-85">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500/10 to-rose-400/5 flex items-center justify-center">
          <GraduationCap className="w-[18px] h-[18px] text-rose-600/70" strokeWidth={1.8} />
        </div>
        <p className="stat-label mb-0">On-site Hub Day</p>
        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
          Next step
        </span>
      </div>
      <p className="text-sm text-foreground font-semibold mb-1">Hands-on training in Buderim</p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Builds on the online program — full-day on-site delivery once your team has the foundations.
      </p>
    </div>
  )
}
