// Shared components for the Advanced Health prospect portal.
// Kept in _shared.tsx (underscore prefix is a Next.js private file,
// not routed as a URL).

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
  ExternalLink,
  TrendingUp,
  Stethoscope,
  Mail,
} from 'lucide-react'

export const ACCESS_KEY = 'ah2026'

export const CLINIC = {
  name: 'Advanced Health Pain & Injury Clinic',
  shortName: 'Advanced Health',
  city: 'Buderim',
  region: 'Sunshine Coast',
  state: 'QLD',
  contactFirstName: 'Lauren',
}

export function AccessWall() {
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
          Prepared for <strong className="text-foreground">{CLINIC.name}</strong>. Access requires the link from Zac&rsquo;s introductory email.
        </p>
      </div>
    </div>
  )
}

export type SidebarKey =
  | 'dashboard'
  | 'learning'
  | 'scat-forms'
  | 'baseline'
  | 'references'
  | 'clinical-toolkit'
  | 'outreach'
  | 'admin'

export function ProspectSidebar({ active }: { active: SidebarKey }) {
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
        <Item k="dashboard" active={active} label="Dashboard" icon={Home} href={`/proposals/advanced-health-buderim?k=${ACCESS_KEY}`} />
        <Item k="learning" active={active} label="Learning Suite" icon={BookOpen} href={`/proposals/advanced-health-buderim/learning?k=${ACCESS_KEY}`} />
        <Item k="scat-forms" active={active} label="SCAT Forms" icon={Activity} />
        <Item k="baseline" active={active} label="Baseline Testing" icon={TrendingUp} />
        <Item k="references" active={active} label="Reference Library" icon={Library} />
        <Item k="clinical-toolkit" active={active} label="Clinical Toolkit" icon={FileText} href={`/proposals/advanced-health-buderim/templates?k=${ACCESS_KEY}`} />
        <Item k="outreach" active={active} label="Outreach Kit" icon={Mail} href={`/proposals/advanced-health-buderim/outreach?k=${ACCESS_KEY}`} />
        <Item k="admin" active={active} label="Admin Workflow" icon={BookMarked} href={`/proposals/advanced-health-buderim/admin-course?k=${ACCESS_KEY}`} />
      </nav>

      <div className="pt-5 border-t border-white/30">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">AHPRA Aligned</p>
        <p className="text-[10px] text-muted-foreground">OA Endorsed · 16 CPD hrs</p>
      </div>
    </div>
  )
}

function Item({
  k,
  active,
  label,
  icon: Icon,
  href,
}: {
  k: SidebarKey
  active: SidebarKey
  label: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  href?: string
}) {
  const base = 'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all relative text-sm font-medium'
  const isActive = k === active

  if (isActive) {
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
    <Link href={href} className={`${base} text-muted-foreground hover:text-foreground hover:bg-white/40`}>
      <Icon className="w-[18px] h-[18px]" strokeWidth={1.5} />
      <span>{label}</span>
    </Link>
  )
}

// Inline icon re-export so route files don't need to import lucide separately for nothing
export { Stethoscope, Lock, ExternalLink }
