/**
 * Single source of truth for the prospect-portal sidebar.
 *
 * Replaces the four near-identical inline copies that were drifting
 * apart (the toolkit version had Reference Library at the bottom +
 * locked, the dashboard version had it 5th + linked, module-1 had no
 * sidebar at all, etc). Every sub-page should render this so a
 * prospect navigating between Dashboard → Learning → Toolkit doesn't
 * see items jumping around.
 *
 * Mobile: hidden until a hamburger toggle is added. (Desktop md+ flexes.)
 */
import {
  Home, BookOpen, Brain, Activity, FileText, Library, BookMarked,
  ExternalLink, TrendingUp, Stethoscope, Lock,
} from 'lucide-react'

export type ActiveSection =
  | 'dashboard'
  | 'learning'
  | 'references'
  | 'clinical-toolkit'
  | 'outreach-kit'
  | 'admin-workflow'

export function ProspectSidebar({
  slug,
  accessKey,
  clinicShortName,
  clinicCity,
  clinicState,
  active,
}: {
  slug: string
  accessKey: string
  clinicShortName: string
  clinicCity?: string | null
  clinicState?: string | null
  active?: ActiveSection
}) {
  const portalBase = `/p/${slug}`
  const ak = `k=${accessKey}`
  const cityKnown = clinicCity && !/unknown/i.test(clinicCity)
  return (
    <div className="hidden md:flex fixed left-0 top-0 h-screen w-64 sidebar-premium p-6 flex-col z-40 print:hidden">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-md shadow-accent/15">
            <Brain className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            Concussion<span className="text-accent">Pro</span>
          </h1>
        </div>
      </div>

      <div className="glass-premium rounded-xl p-3 mb-6">
        <p className="text-[9px] uppercase tracking-wider font-bold text-accent mb-1">Prepared for</p>
        <p className="text-sm font-bold text-foreground leading-tight">{clinicShortName}</p>
        {cityKnown ? (
          <p className="text-[11px] text-muted-foreground mt-0.5">{clinicCity}, {clinicState}</p>
        ) : clinicState ? (
          <p className="text-[11px] text-muted-foreground mt-0.5">{clinicState}</p>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1">
        <Item label="Dashboard" icon={Home}
          href={active === 'dashboard' ? undefined : `${portalBase}?${ak}`}
          active={active === 'dashboard'} />
        <Item label="Learning Suite" icon={BookOpen}
          href={active === 'learning' ? undefined : `${portalBase}/learning?${ak}`}
          active={active === 'learning'} />
        <Item label="SCAT Forms" icon={Activity} href="/scat-forms" external />
        <Item label="Baseline Testing" icon={TrendingUp} href="/preseason" external />
        <Item label="Reference Library" icon={Library}
          href={active === 'references' ? undefined : `${portalBase}/references?${ak}`}
          active={active === 'references'} />
        <Item label="Clinical Toolkit" icon={FileText}
          href={active === 'clinical-toolkit' ? undefined : `${portalBase}/toolkit/clinical?${ak}`}
          active={active === 'clinical-toolkit'} />
        <Item label="Outreach Kit" icon={Stethoscope}
          href={active === 'outreach-kit' ? undefined : `${portalBase}/toolkit/outreach?${ak}`}
          active={active === 'outreach-kit'} />
        <Item label="Admin Workflow" icon={BookMarked}
          href={active === 'admin-workflow' ? undefined : `${portalBase}/toolkit/admin?${ak}`}
          active={active === 'admin-workflow'} />
      </nav>

      <div className="pt-5 border-t border-white/30">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">AHPRA Aligned</p>
        <p className="text-[10px] text-muted-foreground">OA Endorsed · 14 CPD hrs</p>
      </div>
    </div>
  )
}

function Item({
  href, label, icon: Icon, active, locked, external,
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
