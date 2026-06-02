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
        <SidebarItem label="SCAT Forms" icon={Activity} />
        <SidebarItem label="Baseline Testing" icon={TrendingUp} />
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
      <h2 className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.02] mb-3 bg-gradient-to-br from-foreground via-foreground to-accent bg-clip-text text-transparent">
        {CLINIC.shortName}
      </h2>
      <p className="text-sm text-muted-foreground max-w-xl">
        Hi {CLINIC.contactFirstName} — your team&rsquo;s preview workspace.
      </p>
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
        title="8 Modules · 14 CPD"
        badge={{ text: 'Trial open', tone: 'emerald' }}
        span2
        accent
      />
      <Tile
        href="/scat-forms"
        icon={Activity}
        iconTone="violet"
        label="SCAT Forms"
        title="SCAT6 · SCOAT6 · Child"
        badge={{ text: 'Open', tone: 'emerald' }}
        external
      />
      <Tile
        href="/scat-forms"
        icon={TrendingUp}
        iconTone="emerald"
        label="Baseline Testing"
        title="Pre-season cognitive"
        badge={{ text: 'Built', tone: 'emerald' }}
        external
      />
      <Tile
        href="/references"
        icon={Library}
        iconTone="amber"
        label="Reference Library"
        title="140+ peer-reviewed"
        badge={{ text: 'Open', tone: 'emerald' }}
        span2
        external
      />
      <Tile
        icon={FileText}
        label="Clinical Toolkit"
        title="6 discharge templates"
      />
      <Tile
        icon={Stethoscope}
        label="Outreach Kit"
        title="Schools · clubs · GPs"
      />
      <Tile
        icon={BookMarked}
        label="Admin Workflow"
        title="1-hr reception course"
      />
      <Tile
        icon={GraduationCap}
        iconTone="rose"
        label="On-site Hub Day"
        title="Hands-on in Buderim"
        badge={{ text: 'Next step', tone: 'amber' }}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PRICING TIERS — participant tiers + where the value is
// ─────────────────────────────────────────────────────────────────────────────

const TIER1 = {
  name: 'Online Clinic License',
  price: 4634,
  priceLabel: 'one-time · lifetime access',
  participants: `${TEAM_TOTAL} seats — full ${CLINIC.shortName} team`,
  perSeat: 'A$97–A$397 / seat by discipline · 20% volume discount applied',
  inclusions: [
    'All 8 modules of Concussion Clinical Mastery',
    '14 CPD hrs / osteo · 8 hrs / EP · 4 hrs / myo+RMT · 1 hr / admin',
    'Discipline-specific learning tracks',
    'Fillable SCAT6, SCOAT6, Child SCAT6',
    'Pre-season baseline testing service',
    '140+ peer-reviewed reference library',
    'Per-clinician CPD dashboards + certificates',
    'Content updates as consensus evolves',
  ],
  value: 'Every clinician on your team capable of structured concussion management.',
}

const TIER2 = {
  name: 'Combined Hub Program',
  price: 12434,
  priceLabel: 'one-time · everything in Tier 1 + on-site',
  participants: `${TEAM_TOTAL} seats + full-day on-site at ${CLINIC.city}`,
  perSeat: 'Includes Tier 1 (A$4,634) + on-site Hub day (A$7,800)',
  inclusions: [
    'Everything in Tier 1',
    'Full-day on-site training at Buderim (Zac travels in)',
    '6 discharge templates — GP letter, school RTP, parent plan, sports cert, WorkCover, NDIS — clinic-branded',
    '6 outreach templates + email sequences + phone scripts + follow-up tracker',
    '30-day post-training implementation support',
    'CEA-trained-clinic badge + waiting-room poster',
    'Travel included (Byron → Buderim)',
  ],
  value: `${CLINIC.shortName} positioned as the ${CLINIC.region}'s concussion referral destination.`,
  recommended: true,
}

function PricingTiers() {
  return (
    <section className="mt-8">
      <div className="mb-5">
        <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-1">
          Investment · two tiers
        </p>
        <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          Choose the scope of the Hub Program
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          One-time pricing. Lifetime access per seat. If a clinician leaves, the seat transfers at no charge.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TierCard tier={TIER1} />
        <TierCard tier={TIER2} />
      </div>

      <div className="mt-5 glass-premium rounded-xl p-4 text-center">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Pricing rendered against {CLINIC.shortName}&rsquo;s identified team composition ({TEAM_TOTAL} staff). GST exclusive. Final scope confirmed on the 20-min scoping call.
        </p>
        <a
          href="https://cal.com/zac-lewis-so8zjs/30min"
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-bold hover:bg-accent/90 transition-colors mt-3 shadow-md"
        >
          Book scoping call
          <ArrowUpRight className="w-4 h-4" />
        </a>
      </div>
    </section>
  )
}

function TierCard({ tier }: { tier: typeof TIER1 | typeof TIER2 }) {
  const recommended = 'recommended' in tier && tier.recommended
  return (
    <div
      className={`relative rounded-2xl p-6 sm:p-7 overflow-hidden ${
        recommended
          ? 'bg-gradient-to-br from-accent/8 via-accent/4 to-white border-2 border-accent shadow-md'
          : 'glass-premium'
      }`}
    >
      {recommended && (
        <span className="absolute top-4 right-4 text-[9px] font-bold uppercase tracking-wider bg-accent text-white px-2.5 py-1 rounded-full">
          Recommended
        </span>
      )}

      <p className="stat-label">{tier.name}</p>
      <p className={`text-3xl sm:text-4xl font-bold leading-none mt-1 mb-1 ${recommended ? 'text-accent' : 'text-foreground'}`}>
        A${tier.price.toLocaleString()}
      </p>
      <p className="text-[11px] text-muted-foreground mb-4">{tier.priceLabel}</p>

      <div className="rounded-lg bg-white/60 border border-accent/10 px-3 py-2.5 mb-3">
        <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-0.5">Participants</p>
        <p className="text-[13px] font-semibold text-foreground leading-snug">{tier.participants}</p>
        <p className="text-[11px] text-muted-foreground leading-snug mt-1">{tier.perSeat}</p>
      </div>

      <div className="rounded-lg bg-amber-50/60 border border-amber-200 px-3 py-2.5 mb-4">
        <p className="text-[10px] uppercase tracking-wider font-bold text-amber-800 mb-0.5">Where the value is</p>
        <p className="text-[12px] text-foreground leading-snug">{tier.value}</p>
      </div>

      <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2">What&rsquo;s included</p>
      <ul className="space-y-1.5">
        {tier.inclusions.map((item, i) => (
          <li key={i} className="text-[12px] text-foreground leading-snug flex gap-2">
            <span className={recommended ? 'text-accent mt-0.5 shrink-0' : 'text-emerald-600 mt-0.5 shrink-0'}>✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TILE — single component, visual treatment driven by props
// ─────────────────────────────────────────────────────────────────────────────

type Tone = 'accent' | 'violet' | 'emerald' | 'amber' | 'rose' | 'slate'
type BadgeTone = 'emerald' | 'amber' | 'slate'

const TONE_BG: Record<Tone, string> = {
  accent: 'from-accent/20 to-accent/5',
  violet: 'from-violet-500/15 to-violet-400/5',
  emerald: 'from-emerald-500/15 to-emerald-400/5',
  amber: 'from-amber-500/15 to-amber-400/5',
  rose: 'from-rose-500/15 to-rose-400/5',
  slate: 'from-slate-200/50 to-slate-100/50',
}

const TONE_TEXT: Record<Tone, string> = {
  accent: 'text-accent',
  violet: 'text-violet-600',
  emerald: 'text-emerald-600',
  amber: 'text-amber-600',
  rose: 'text-rose-600',
  slate: 'text-slate-400',
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
  badge?: { text: string; tone: BadgeTone }
  span2?: boolean
  external?: boolean
  accent?: boolean
}) {
  const locked = !href
  const tone: Tone = locked ? 'slate' : (iconTone ?? 'accent')
  const isLink = !!href

  const containerClasses = [
    'glass-premium rounded-2xl p-5 sm:p-6 relative overflow-hidden',
    span2 ? 'bento-span-2' : '',
    locked ? 'opacity-80' : '',
    isLink ? 'group block hover:shadow-md transition-all' : '',
    accent ? 'border-l-4 border-l-accent' : '',
  ].filter(Boolean).join(' ')

  const inner = (
    <>
      {isLink && (
        <ArrowUpRight className="absolute top-5 right-5 w-4 h-4 text-muted-foreground/40 group-hover:text-accent transition-colors" />
      )}
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${TONE_BG[tone]} flex items-center justify-center shrink-0`}>
          {locked ? (
            <Lock className={`w-5 h-5 ${TONE_TEXT[tone]}`} strokeWidth={1.8} />
          ) : (
            <Icon className={`w-5 h-5 ${TONE_TEXT[tone]}`} strokeWidth={1.8} />
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
