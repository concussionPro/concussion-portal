import type { Metadata } from 'next'
import Link from 'next/link'
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
  Clock,
  ArrowUpRight,
  GraduationCap,
  Sparkles,
  MapPin,
  Calendar,
  ExternalLink,
} from 'lucide-react'

// Soft access gate. Paired with the unguessable clinic-name slug.
// Anyone with full URL + key sees the personalised dashboard.
// Without the key, render an access wall (no pricing leakage).
const ACCESS_KEY = 'ah2026'

// Single source of truth for this prospect's personalisation.
// In the engine version (`/p/[token]/page.tsx`), this is loaded
// from the prospect_clinics + prospect_clinicians tables.
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

const CLINICAL_TOTAL =
  CLINIC.team.osteopaths +
  CLINIC.team.exercisePhys +
  CLINIC.team.myotherapists +
  CLINIC.team.remedialMassage

const PRICING = {
  tier1: {
    osteo: { count: 9, seat: 397, subtotal: 3573 },
    ep: { count: 3, seat: 347, subtotal: 1041 },
    myo: { count: 2, seat: 197, subtotal: 394 },
    rmt: { count: 2, seat: 197, subtotal: 394 },
    pm: { count: 1, seat: 197, subtotal: 197 },
    admin: { count: 2, seat: 97, subtotal: 194 },
    subtotal: 5793,
    discountPct: 20,
    discountAud: 1159,
    total: 4634,
  },
  tier2: { onsite: 4500, templates: 1500, outreach: 1000, support: 500, travel: 300, total: 7800 },
  combined: 12434,
  individualRetail: 22400,
}

export const metadata: Metadata = {
  title: 'Concussion Hub Program — Advanced Health Buderim',
  description: 'Working preview portal: concussion training hub prepared for Advanced Health Pain & Injury Clinic, Buderim QLD.',
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
        <h1 className="text-xl font-bold text-foreground mb-3">
          Private proposal portal
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-5">
          This portal was prepared for <strong className="text-foreground">Advanced Health Pain &amp; Injury Clinic</strong>, Buderim. Access requires the link from Zac&rsquo;s introductory email.
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed mb-6">
          Lost the link? Reply to the introductory email and Zac will resend within 1 business day.
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
// PROSPECT DASHBOARD — matches production /dashboard chrome
// ─────────────────────────────────────────────────────────────────────────────

function ProspectDashboard() {
  return (
    <div className="flex min-h-screen dashboard-bg">
      <ProspectSidebar />
      <main className="flex-1 ml-0 md:ml-64">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8">
          <Greeting />
          <BespokeBanner />
          <ProspectBento />
          <InvestmentDetail />
          <LocalHubDetail />
          <BookingCta />
          <FooterMeta />
        </div>
      </main>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR — production look, prospect-mode content
// ─────────────────────────────────────────────────────────────────────────────

function ProspectSidebar() {
  return (
    <div className="hidden md:flex fixed left-0 top-0 h-screen w-64 sidebar-premium p-6 flex-col z-40 overflow-y-auto overscroll-contain">
      {/* Logo */}
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

      {/* Prepared for card */}
      <div className="glass-premium rounded-xl p-3 mb-6">
        <p className="text-[9px] uppercase tracking-wider font-bold text-accent mb-1">Prepared for</p>
        <p className="text-sm font-bold text-foreground leading-tight">{CLINIC.shortName}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{CLINIC.city}, {CLINIC.state}</p>
        <div className="mt-2 pt-2 border-t border-accent/10">
          <p className="text-[10px] text-muted-foreground">Hi {CLINIC.contactFirstName} —</p>
          <p className="text-[10px] text-muted-foreground">This is your team&rsquo;s preview.</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        <SidebarItem href="#dashboard" label="Dashboard" icon={Home} active />
        <SidebarItem href="#learning" label="Learning Suite" icon={BookOpen} />
        <SidebarItem href="#clinical-toolkit" label="Clinical Toolkit" icon={FileText} locked />
        <SidebarItem href="/scat-forms" label="SCAT Forms" icon={Activity} external />
        <SidebarItem href="/references" label="Reference Repository" icon={Library} external />
        <SidebarItem href="#admin-track" label="Admin Workflow" icon={BookMarked} locked />
        <SidebarItem href="#investment" label="Investment" icon={Award} />
        <SidebarItem href="#book" label="Book a call" icon={Calendar} />
      </nav>

      {/* Footer */}
      <div className="pt-5 border-t border-white/30">
        <div className="px-1">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            AHPRA Aligned
          </p>
          <p className="text-[10px] text-muted-foreground mb-2">OA Endorsed · 14 CPD hrs</p>
          <p className="text-[10px] text-muted-foreground">
            Author: <span className="font-semibold text-foreground">Zac Lewis</span>
          </p>
          <p className="text-[10px] text-muted-foreground">Osteopath · Founder, CEA</p>
        </div>
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
  href: string
  label: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  active?: boolean
  locked?: boolean
  external?: boolean
}) {
  const base = 'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all relative text-sm font-medium'

  if (locked) {
    return (
      <a href={href} className={`${base} opacity-50 hover:opacity-70 text-muted-foreground`}>
        <Icon className="w-[18px] h-[18px]" strokeWidth={1.5} />
        <span>{label}</span>
        <Lock className="w-3 h-3 ml-auto text-muted-foreground/60" />
      </a>
    )
  }

  if (active) {
    return (
      <a href={href} className={`${base} bg-accent/8 text-accent font-semibold`}>
        <div className="nav-active-indicator" />
        <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
        <span>{label}</span>
      </a>
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
// GREETING — mirrors production dashboard greeting
// ─────────────────────────────────────────────────────────────────────────────

function Greeting() {
  return (
    <div id="dashboard" className="mb-6">
      <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-1">
        Welcome, {CLINIC.shortName} team
      </h2>
      <p className="text-sm text-muted-foreground">
        This is a preview of what the Concussion Hub Program looks like for your {TEAM_TOTAL}-staff clinic in {CLINIC.city}.
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BESPOKE BANNER — explains this is a personalised preview, not paid access
// ─────────────────────────────────────────────────────────────────────────────

function BespokeBanner() {
  return (
    <div className="glass-premium rounded-2xl p-5 mb-6 border-l-4 border-l-accent">
      <div className="flex items-start gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <p className="text-[10px] uppercase tracking-wider font-bold text-accent">
              Bespoke preview · prepared for Lauren Kidston
            </p>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            Unlocked tiles below are live on the CEA portal — your team can open and use them today. Locked tiles activate per-clinician once the Hub Program is in place. The pricing math beneath the grid is calculated against your actual team composition ({CLINIC.team.osteopaths} osteos, {CLINIC.team.exercisePhys} EPs, {CLINIC.team.myotherapists + CLINIC.team.remedialMassage} myo/RMT, {CLINIC.team.practiceManager + CLINIC.team.admin} admin).
          </p>
        </div>
        <a
          href="#book"
          className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90 transition-colors whitespace-nowrap"
        >
          Book scoping call
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BENTO GRID — mirrors production BentoGrid layout
// ─────────────────────────────────────────────────────────────────────────────

function ProspectBento() {
  return (
    <div id="learning" className="bento-premium mb-8">
      {/* 1. Team Snapshot (wide) — replaces Course Progress */}
      <TeamSnapshotCard />

      {/* 2. CPD Hours per clinician */}
      <CpdCard />

      {/* 3. Investment Quick View */}
      <InvestmentQuickCard />

      {/* 4. Learning Suite — partial unlocked */}
      <LearningSuiteCard />

      {/* 5. Clinical Toolkit — locked */}
      <ClinicalToolkitCard />

      {/* 6. SCAT Forms — unlocked */}
      <ScatFormsCard />

      {/* 7. Reference Repository (wide) — unlocked */}
      <ReferenceCard />

      {/* 8. On-site Hub Day — Tier 2 */}
      <OnsiteCard />

      {/* 9. Admin Micro-course — B2B exclusive */}
      <AdminCourseCard />

      {/* 10. Templates & Outreach */}
      <TemplatesCard />

      {/* 11. CEA-trained-clinic badge */}
      <BadgeCard />

      {/* 12. Local Hub Positioning */}
      <LocalHubCard />
    </div>
  )
}

// ── Card 1: Team Snapshot (span-2, in place of Course Progress) ──────────────
function TeamSnapshotCard() {
  return (
    <div className="glass-premium rounded-2xl p-5 sm:p-6 relative overflow-hidden bento-span-2">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center shrink-0">
          <span className="text-xl font-bold text-accent">{TEAM_TOTAL}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="stat-label">Your team</p>
          <p className="stat-value">{CLINICAL_TOTAL}<span className="text-base font-medium text-muted-foreground"> clinical </span>+ {CLINIC.team.practiceManager + CLINIC.team.admin}<span className="text-base font-medium text-muted-foreground"> admin</span></p>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <TeamMicroPill label="Osteo" count={CLINIC.team.osteopaths} />
            <TeamMicroPill label="Ex Phys" count={CLINIC.team.exercisePhys} />
            <TeamMicroPill label="Myo/RMT" count={CLINIC.team.myotherapists + CLINIC.team.remedialMassage} />
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Identified from your team page. Discipline pathways below are curated to this composition.
          </p>
        </div>
      </div>
    </div>
  )
}

function TeamMicroPill({ label, count }: { label: string; count: number }) {
  return (
    <div className="rounded-lg bg-white/60 border border-accent/10 px-2 py-1.5 text-center">
      <p className="text-sm font-bold text-foreground leading-none">{count}</p>
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground mt-1">{label}</p>
    </div>
  )
}

// ── Card 2: CPD Hours (in place of CPD Hours) ────────────────────────────────
function CpdCard() {
  return (
    <div className="glass-premium rounded-2xl p-5 sm:p-6 relative overflow-hidden group">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center">
          <Award className="w-[18px] h-[18px] text-accent" strokeWidth={1.8} />
        </div>
        <p className="stat-label mb-0">Hub Program CPD</p>
      </div>
      <p className="stat-value-accent">
        14<span className="text-base text-muted-foreground font-medium"> hrs / osteo</span>
      </p>
      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
        8 hrs / EP · 4 hrs / myo+RMT · 1 hr / admin. AHPRA-aligned, Osteopathy Australia endorsed.
      </p>
    </div>
  )
}

// ── Card 3: Investment Quick (in place of Study Time) ────────────────────────
function InvestmentQuickCard() {
  return (
    <a href="#investment" className="glass-premium rounded-2xl p-5 sm:p-6 relative overflow-hidden group block">
      <ArrowUpRight className="absolute top-5 right-5 w-4 h-4 text-muted-foreground/40 group-hover:text-accent transition-colors" />
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-400/5 flex items-center justify-center">
          <Clock className="w-[18px] h-[18px] text-blue-600/70" strokeWidth={1.8} />
        </div>
        <p className="stat-label mb-0">Investment</p>
      </div>
      <p className="stat-value">A${PRICING.combined.toLocaleString()}<span className="text-xs font-medium text-muted-foreground"> one-time</span></p>
      <p className="text-xs text-muted-foreground mt-1">vs A${PRICING.individualRetail.toLocaleString()} retail · 44% off</p>
    </a>
  )
}

// ── Card 4: Learning Suite — partial unlocked ────────────────────────────────
function LearningSuiteCard() {
  return (
    <div className="glass-premium rounded-2xl p-5 sm:p-6 relative overflow-hidden group">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center">
          <BookOpen className="w-[18px] h-[18px] text-accent" strokeWidth={1.8} />
        </div>
        <p className="stat-label mb-0">Learning Suite</p>
        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
          Module 1
        </span>
      </div>
      <p className="text-sm text-foreground font-semibold mb-1">8 Clinical Modules</p>
      <p className="text-xs text-muted-foreground leading-relaxed mb-2">
        CCM full curriculum: SCAT6, SCOAT6, VOMS, BESS, cervical, PPCS, paediatric, RTP.
      </p>
      <p className="text-[11px] text-accent font-semibold">
        Module 1 trial unlocked · 2-8 activate with Tier 1
      </p>
    </div>
  )
}

// ── Card 5: Clinical Toolkit — locked ────────────────────────────────────────
function ClinicalToolkitCard() {
  return (
    <a href="#investment" id="clinical-toolkit" className="glass-premium rounded-2xl p-5 sm:p-6 relative overflow-hidden group block opacity-90 hover:opacity-100 transition-opacity">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-200/50 to-slate-100/50 flex items-center justify-center">
          <Lock className="w-[18px] h-[18px] text-slate-400" strokeWidth={1.8} />
        </div>
        <p className="stat-label mb-0">Clinical Toolkit</p>
        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 uppercase tracking-wider">
          Hub Program
        </span>
      </div>
      <p className="text-sm text-foreground font-semibold mb-1">6 Discharge Templates</p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        GP letter, school RTP, parent plan, sports cert, WorkCover, NDIS — clinic-branded.
      </p>
    </a>
  )
}

// ── Card 6: SCAT Forms — unlocked, real link ─────────────────────────────────
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
        SCAT6, Child SCAT6, SCOAT6 — fillable, auto-scored, downloadable.
      </p>
    </a>
  )
}

// ── Card 7: Reference Repository (span-2) — unlocked ─────────────────────────
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
            Amsterdam 2023, AIS 2024, RACGP, Cochrane. Your team can search and cite from this library today — already free on the public CEA portal.
          </p>
        </div>
      </div>
    </a>
  )
}

// ── Card 8: On-site Hub Day — Tier 2 ─────────────────────────────────────────
function OnsiteCard() {
  return (
    <a href="#investment" className="glass-premium rounded-2xl p-5 sm:p-6 relative overflow-hidden group block opacity-90 hover:opacity-100 transition-opacity">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500/10 to-rose-400/5 flex items-center justify-center">
          <GraduationCap className="w-[18px] h-[18px] text-rose-600/70" strokeWidth={1.8} />
        </div>
        <p className="stat-label mb-0">On-site Hub Day</p>
        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 uppercase tracking-wider">
          Tier 2
        </span>
      </div>
      <p className="text-sm text-foreground font-semibold mb-1">Full-day on-site training</p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Zac delivers in-clinic at Buderim. Hands-on SCAT/VOMS/BESS, BCTT lab, role-specific tracks.
      </p>
    </a>
  )
}

// ── Card 9: Admin Micro-course — B2B exclusive ───────────────────────────────
function AdminCourseCard() {
  return (
    <a href="#investment" id="admin-track" className="glass-premium rounded-2xl p-5 sm:p-6 relative overflow-hidden group block opacity-90 hover:opacity-100 transition-opacity">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-200/50 to-slate-100/50 flex items-center justify-center">
          <Lock className="w-[18px] h-[18px] text-slate-400" strokeWidth={1.8} />
        </div>
        <p className="stat-label mb-0">Admin Workflow</p>
        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 uppercase tracking-wider">
          B2B only
        </span>
      </div>
      <p className="text-sm text-foreground font-semibold mb-1">1-hr Reception Course</p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Phone triage, red flags, intake form, booking priority. Not available individually.
      </p>
    </a>
  )
}

// ── Card 10: Outreach Templates ──────────────────────────────────────────────
function TemplatesCard() {
  return (
    <a href="#investment" className="glass-premium rounded-2xl p-5 sm:p-6 relative overflow-hidden group block opacity-90 hover:opacity-100 transition-opacity">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-200/50 to-slate-100/50 flex items-center justify-center">
          <Lock className="w-[18px] h-[18px] text-slate-400" strokeWidth={1.8} />
        </div>
        <p className="stat-label mb-0">Outreach Kit</p>
        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 uppercase tracking-wider">
          Tier 2
        </span>
      </div>
      <p className="text-sm text-foreground font-semibold mb-1">6 Outreach Templates</p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Schools, sports clubs, GPs — email sequences + phone scripts + follow-up tracker.
      </p>
    </a>
  )
}

// ── Card 11: CEA-trained badge ───────────────────────────────────────────────
function BadgeCard() {
  return (
    <a href="#investment" className="glass-premium rounded-2xl p-5 sm:p-6 relative overflow-hidden group block opacity-90 hover:opacity-100 transition-opacity">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-200/50 to-slate-100/50 flex items-center justify-center">
          <Lock className="w-[18px] h-[18px] text-slate-400" strokeWidth={1.8} />
        </div>
        <p className="stat-label mb-0">CEA-Trained Badge</p>
        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 uppercase tracking-wider">
          Tier 2
        </span>
      </div>
      <p className="text-sm text-foreground font-semibold mb-1">Website + Waiting Room</p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Verifiable per-clinician certification. Local positioning asset.
      </p>
    </a>
  )
}

// ── Card 12: Local Hub Positioning ───────────────────────────────────────────
function LocalHubCard() {
  return (
    <a href="#local-hub" className="glass-premium rounded-2xl p-5 sm:p-6 relative overflow-hidden group block bento-span-2">
      <ArrowUpRight className="absolute top-5 right-5 w-4 h-4 text-muted-foreground/40 group-hover:text-accent transition-colors" />
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-400/5 flex items-center justify-center shrink-0">
          <MapPin className="w-5 h-5 text-amber-600/70" strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="stat-label">{CLINIC.region} positioning</p>
          <p className="text-sm text-foreground font-semibold mb-1">Local concussion hub targets</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Sunshine Coast Falcons, Matthew Flinders, SC Grammar, Immanuel, Mooloolaba triathlon, surf life saving clubs — pre-mapped referral opportunities in your catchment.
          </p>
        </div>
      </div>
    </a>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// INVESTMENT DETAIL — full pricing breakdown beneath the bento
// ─────────────────────────────────────────────────────────────────────────────

function InvestmentDetail() {
  return (
    <section id="investment" className="glass-premium rounded-2xl p-5 sm:p-7 mb-8 scroll-mt-8">
      <div className="flex items-center justify-between gap-4 mb-1 flex-wrap">
        <div>
          <p className="stat-label">Investment</p>
          <h2 className="text-xl font-bold text-foreground">One-time clinic license · lifetime access per seat</h2>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-accent/10 text-accent border border-accent/20 uppercase tracking-wider whitespace-nowrap">
          Built for {CLINIC.shortName}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-5">
        If a clinician leaves, the seat transfers to their replacement at no charge. Content updates as consensus evolves (Amsterdam → Berlin, etc).
      </p>

      <div className="rounded-xl bg-white/40 border border-accent/10 p-4 mb-4">
        <p className="text-[10px] uppercase tracking-wider font-bold text-accent mb-3">
          Tier 1 — Online clinic license
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] border-collapse">
            <thead>
              <tr className="border-b-2 border-accent/20">
                <th className="text-left py-1.5 font-semibold text-foreground">Role</th>
                <th className="text-right py-1.5 px-2 font-semibold text-muted-foreground">Count</th>
                <th className="text-right py-1.5 px-2 font-semibold text-muted-foreground">Per seat</th>
                <th className="text-right py-1.5 px-2 font-semibold text-muted-foreground">Subtotal</th>
              </tr>
            </thead>
            <tbody className="text-foreground">
              <SeatRow role="Osteopaths" {...PRICING.tier1.osteo} />
              <SeatRow role="Exercise Physiologists" {...PRICING.tier1.ep} />
              <SeatRow role="Myotherapists" {...PRICING.tier1.myo} />
              <SeatRow role="Remedial Massage" {...PRICING.tier1.rmt} />
              <SeatRow role="Practice Manager" {...PRICING.tier1.pm} />
              <SeatRow role="Admin / Reception" {...PRICING.tier1.admin} />
              <tr className="border-t-2 border-accent/20 font-semibold">
                <td className="py-1.5">Subtotal ({TEAM_TOTAL} seats)</td>
                <td></td>
                <td></td>
                <td className="text-right py-1.5 px-2">A${PRICING.tier1.subtotal.toLocaleString()}</td>
              </tr>
              <tr>
                <td className="py-1.5 text-emerald-700">Volume discount (16-30 band)</td>
                <td></td>
                <td></td>
                <td className="text-right py-1.5 px-2 text-emerald-700">−{PRICING.tier1.discountPct}% (A${PRICING.tier1.discountAud.toLocaleString()})</td>
              </tr>
              <tr className="border-t border-accent/20 bg-accent/5 font-bold">
                <td className="py-2 text-accent">Tier 1 one-time total</td>
                <td></td>
                <td></td>
                <td className="text-right py-2 px-2 text-accent text-base">A${PRICING.tier1.total.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl bg-white/40 border border-accent/10 p-4">
          <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-3">
            Tier 2 — On-site Hub upgrade
          </p>
          <ul className="space-y-1.5 text-[12px] text-foreground">
            <PriceLine label="On-site training day at Buderim" amount={PRICING.tier2.onsite} />
            <PriceLine label="6 discharge templates (clinic-licensed)" amount={PRICING.tier2.templates} />
            <PriceLine label="Outreach package" amount={PRICING.tier2.outreach} />
            <PriceLine label="30-day implementation support" amount={PRICING.tier2.support} />
            <PriceLine label="Travel (Byron → Buderim)" amount={PRICING.tier2.travel} />
          </ul>
          <div className="border-t-2 border-accent/20 mt-3 pt-2 flex items-center justify-between">
            <p className="text-xs font-bold text-foreground">Tier 2 total</p>
            <p className="text-base font-bold text-foreground">A${PRICING.tier2.total.toLocaleString()}</p>
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 border-2 border-accent p-4 shadow-md">
          <div className="flex items-center justify-between gap-2 mb-3">
            <p className="text-[10px] uppercase tracking-wider text-accent font-bold">
              Combined Hub Program
            </p>
            <span className="text-[9px] uppercase tracking-wider font-bold text-white bg-accent px-2 py-0.5 rounded-full">
              Recommended
            </span>
          </div>
          <ul className="space-y-1.5 text-[12px] text-foreground">
            <PriceLine label="Tier 1 — Online clinic license" amount={PRICING.tier1.total} />
            <PriceLine label="Tier 2 — On-site + templates + outreach" amount={PRICING.tier2.total} />
          </ul>
          <div className="border-t-2 border-accent mt-3 pt-2 flex items-center justify-between">
            <p className="text-sm font-bold text-accent">Combined one-time</p>
            <p className="text-xl font-bold text-accent">A${PRICING.combined.toLocaleString()}</p>
          </div>
          <p className="text-[11px] text-foreground mt-2 leading-snug">
            vs <strong>A${PRICING.individualRetail.toLocaleString()}</strong> at individual CCM Complete retail
          </p>
          <p className="text-[11px] text-accent font-semibold mt-1">
            = 44% off retail with full local-hub package bundled
          </p>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground italic mt-3 leading-snug">
        GST exclusive. Pricing rendered against {CLINIC.shortName}&rsquo;s identified team composition; adjustable on the scoping call.
      </p>
    </section>
  )
}

function SeatRow({ role, count, seat, subtotal }: { role: string; count: number; seat: number; subtotal: number }) {
  return (
    <tr className="border-b border-accent/10">
      <td className="py-1.5">{role}</td>
      <td className="text-right py-1.5 px-2">{count}</td>
      <td className="text-right py-1.5 px-2">A${seat}</td>
      <td className="text-right py-1.5 px-2 font-semibold">A${subtotal.toLocaleString()}</td>
    </tr>
  )
}

function PriceLine({ label, amount }: { label: string; amount: number }) {
  return (
    <li className="flex items-baseline justify-between gap-3">
      <span className="leading-snug">{label}</span>
      <span className="font-semibold whitespace-nowrap">A${amount.toLocaleString()}</span>
    </li>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL HUB DETAIL
// ─────────────────────────────────────────────────────────────────────────────

function LocalHubDetail() {
  return (
    <section id="local-hub" className="glass-premium rounded-2xl p-5 sm:p-7 mb-8 scroll-mt-8 border-l-4 border-l-amber-500">
      <p className="stat-label">Local hub positioning</p>
      <h2 className="text-xl font-bold text-foreground mb-2">Become the {CLINIC.region}&rsquo;s concussion clinic</h2>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        One trained clinic per region becomes the natural concussion referral destination. The Hub Program builds these relationships explicitly — not just the training, but the outreach kit that turns it into patient volume.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl bg-white/40 border border-amber-200 p-4">
          <p className="text-sm font-bold text-foreground mb-2">Sports teams + clubs</p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>• Sunshine Coast Falcons (Q-Cup rugby league)</li>
            <li>• Junior rugby league + AFL + soccer</li>
            <li>• Surf life saving (Maroochydore → Caloundra)</li>
            <li>• Mooloolaba triathlon + cycling</li>
            <li>• Pre-season baseline testing as a paid service</li>
          </ul>
        </div>
        <div className="rounded-xl bg-white/40 border border-amber-200 p-4">
          <p className="text-sm font-bold text-foreground mb-2">Schools + GPs</p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>• Matthew Flinders Anglican College</li>
            <li>• Sunshine Coast Grammar</li>
            <li>• Immanuel Lutheran, Pacific Lutheran</li>
            <li>• Local GPs needing concussion referral path</li>
            <li>• Univ. of the Sunshine Coast sports program</li>
          </ul>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BOOKING CTA
// ─────────────────────────────────────────────────────────────────────────────

function BookingCta() {
  return (
    <section id="book" className="rounded-2xl bg-gradient-to-br from-accent to-accent-dark text-white p-6 sm:p-8 shadow-lg mb-8 scroll-mt-8">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-5 items-center">
        <div>
          <p className="text-[10px] uppercase tracking-wider opacity-80 font-bold mb-1">Next step</p>
          <h2 className="text-xl font-bold mb-1">Book a 20-minute scoping call</h2>
          <p className="text-sm opacity-90 leading-relaxed">
            Tuesday or Wednesday afternoon QLD time works well. We&rsquo;ll walk through pathways for your team, answer questions, and confirm a delivery date.
          </p>
        </div>
        <a
          href="https://cal.com/zac-lewis-so8zjs/30min"
          target="_blank"
          rel="noopener"
          className="shrink-0 inline-flex items-center justify-center gap-1.5 px-6 py-3 rounded-xl bg-white text-accent text-sm font-bold hover:bg-white/95 transition-colors whitespace-nowrap shadow-md no-underline"
        >
          Book call → cal.com
        </a>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────────────────────────────────────

function FooterMeta() {
  return (
    <footer className="pt-5 border-t border-accent/10">
      <div className="flex items-start justify-between gap-4 flex-wrap text-xs text-muted-foreground">
        <div>
          <p className="font-bold text-foreground">Zac Lewis · AHPRA-registered Osteopath</p>
          <p>Founder, Concussion Education Australia</p>
        </div>
        <div className="text-right">
          <p>zac@concussion-education-australia.com</p>
          <p className="text-accent">portal.concussion-education-australia.com</p>
        </div>
      </div>
      <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-bold text-center mt-4">
        AHPRA-aligned · Osteopathy Australia endorsed · 140+ peer-reviewed references · Amsterdam 2023 + AIS 2024
      </p>
    </footer>
  )
}
