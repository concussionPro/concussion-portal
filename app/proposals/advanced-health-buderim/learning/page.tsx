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
  ArrowLeft,
  ExternalLink,
  Clock,
  TrendingUp,
} from 'lucide-react'
import { getModulesMeta } from '@/data/module-meta'

const ACCESS_KEY = 'ah2026'

const CLINIC = {
  shortName: 'Advanced Health',
  city: 'Buderim',
  state: 'QLD',
  contactFirstName: 'Lauren',
}

export const metadata: Metadata = {
  title: 'Learning Suite — Advanced Health Hub Preview',
  description: 'Module list preview for Advanced Health Pain & Injury Clinic.',
  robots: 'noindex, nofollow',
}

export default async function ProspectLearningSuite({
  searchParams,
}: {
  searchParams: Promise<{ k?: string }>
}) {
  const { k } = await searchParams
  if (k !== ACCESS_KEY) {
    return (
      <div className="min-h-screen dashboard-bg flex items-center justify-center p-6">
        <div className="max-w-md w-full glass-premium rounded-2xl p-8 text-center">
          <h1 className="text-xl font-bold text-foreground mb-3">Private proposal portal</h1>
          <p className="text-sm text-muted-foreground">Access requires the link from Zac&rsquo;s introductory email.</p>
        </div>
      </div>
    )
  }

  const modules = getModulesMeta()
  const m1 = modules.find((m) => m.id === 1)!
  const locked = modules.filter((m) => m.id !== 1)

  return (
    <div className="flex min-h-screen dashboard-bg">
      <ProspectSidebar />
      <main className="flex-1 ml-0 md:ml-64">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8">
          <Link
            href={`/proposals/advanced-health-buderim?k=${ACCESS_KEY}`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors mb-4"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to dashboard
          </Link>

          <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-1">
            Concussion Clinical Mastery · {CLINIC.shortName} preview
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-2">
            Learning Suite
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            8 modules · 14 CPD hrs · AHPRA-aligned · Osteopathy Australia endorsed. Module 1 is open as a trial — Modules 2-8 unlock with the Hub Program.
          </p>

          {/* M1 — TRIAL OPEN */}
          <Link
            href={`/proposals/advanced-health-buderim/learning/module-1?k=${ACCESS_KEY}`}
            className="block glass-premium rounded-2xl p-5 sm:p-6 mb-4 border-l-4 border-l-accent hover:shadow-md transition-shadow group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center shrink-0">
                <span className="text-base font-bold text-accent">M1</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="text-sm font-bold text-foreground">{m1.title}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                    Trial open
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{m1.subtitle}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mb-2">{m1.description}</p>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{m1.duration}</span>
                  <span>·</span>
                  <span>{m1.points} CPD hr</span>
                </div>
              </div>
              <div className="shrink-0 text-[11px] font-bold text-accent group-hover:translate-x-0.5 transition-transform">
                Start trial →
              </div>
            </div>
          </Link>

          {/* M2-M8 — LOCKED */}
          <div className="space-y-2.5">
            {locked.map((m) => (
              <LockedModuleRow key={m.id} module={m} />
            ))}
          </div>

          <div className="glass-premium rounded-2xl p-4 mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Modules 2-8 unlock for every {CLINIC.shortName} clinician with the Hub Program · 14 CPD hrs each, AHPRA-aligned.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

function LockedModuleRow({ module: m }: { module: { id: number; title: string; subtitle: string; duration: string; description: string } }) {
  return (
    <div className="glass-premium rounded-2xl p-5 opacity-75 relative">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-200/50 to-slate-100/50 flex items-center justify-center shrink-0">
          <Lock className="w-5 h-5 text-slate-400" strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="text-sm font-bold text-foreground">M{m.id}. {m.title}</p>
          </div>
          <p className="text-xs text-muted-foreground mb-1">{m.subtitle}</p>
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{m.description}</p>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{m.duration}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR (same as landing — keeps Lauren in the dashboard chrome)
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
        <SidebarItem href={`/proposals/advanced-health-buderim?k=${ACCESS_KEY}`} label="Dashboard" icon={Home} />
        <SidebarItem label="Learning Suite" icon={BookOpen} active />
        <SidebarItem label="SCAT Forms" icon={Activity} />
        <SidebarItem href="/preseason" label="Baseline Testing" icon={TrendingUp} external />
        <SidebarItem href={`/proposals/advanced-health-buderim/references?k=${ACCESS_KEY}`} label="Reference Library" icon={Library} />
        <SidebarItem label="Clinical Toolkit" icon={FileText} locked />
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
