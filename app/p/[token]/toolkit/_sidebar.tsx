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
} from 'lucide-react'
import type { ProspectClinic } from '@/lib/prospect/types'

/**
 * Sidebar for the dynamic prospect toolkit (engine-generated). Parallels
 * the hand-built /proposals/advanced-health-buderim/toolkit/_sidebar.tsx
 * but parameterises on the clinic record so any prospect can see their
 * own clinic name + state in the "Prepared for" block.
 */
export function ToolkitSidebar({
  clinic,
  active,
}: {
  clinic: ProspectClinic
  active: 'root' | 'clinical' | 'outreach' | 'admin'
}) {
  const k = clinic.accessKey
  const baseHref = `/p/${clinic.slug}`
  const cityKnown = clinic.city && !/unknown/i.test(clinic.city)
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
        <p className="text-[0.65rem] text-muted-foreground ml-12 uppercase tracking-widest font-medium">
          Hub Program Preview
        </p>
      </div>

      <div className="glass-premium rounded-xl p-3 mb-6">
        <p className="text-[9px] uppercase tracking-wider font-bold text-accent mb-1">Prepared for</p>
        <p className="text-sm font-bold text-foreground leading-tight">{clinic.shortName}</p>
        {cityKnown
          ? <p className="text-[11px] text-muted-foreground mt-0.5">{clinic.city}, {clinic.state}</p>
          : clinic.state
            ? <p className="text-[11px] text-muted-foreground mt-0.5">{clinic.state}</p>
            : null}
      </div>

      <nav className="flex-1 space-y-1">
        <Item href={`${baseHref}?k=${k}`} label="Dashboard" icon={Home} />
        <Item href={`${baseHref}/learning?k=${k}`} label="Learning Suite" icon={BookOpen} />
        <Item href="/scat-forms" label="SCAT Forms" icon={Activity} external />
        <Item href="/preseason" label="Baseline Testing" icon={TrendingUp} external />
        <Item
          href={active === 'clinical' ? undefined : `${baseHref}/toolkit/clinical?k=${k}`}
          label="Clinical Toolkit"
          icon={FileText}
          active={active === 'clinical'}
        />
        <Item
          href={active === 'outreach' ? undefined : `${baseHref}/toolkit/outreach?k=${k}`}
          label="Outreach Kit"
          icon={Stethoscope}
          active={active === 'outreach'}
        />
        <Item
          href={active === 'admin' ? undefined : `${baseHref}/toolkit/admin?k=${k}`}
          label="Admin Workflow"
          icon={BookMarked}
          active={active === 'admin'}
        />
        <Item href="#" label="Reference Library" icon={Library} disabled />
      </nav>

      <div className="pt-5 border-t border-white/30">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">AHPRA Aligned</p>
        <p className="text-[10px] text-muted-foreground">OA Endorsed · 14 CPD hrs</p>
      </div>
    </div>
  )
}

function Item({
  href,
  label,
  icon: Icon,
  active,
  external,
  disabled,
}: {
  href?: string
  label: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  active?: boolean
  external?: boolean
  disabled?: boolean
}) {
  const base = 'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all relative text-sm font-medium'
  if (active) {
    return (
      <div className={`${base} bg-accent/8 text-accent font-semibold cursor-default`}>
        <div className="nav-active-indicator" />
        <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
        <span>{label}</span>
      </div>
    )
  }
  if (disabled || !href) {
    return (
      <div className={`${base} text-muted-foreground cursor-default opacity-60`}>
        <Icon className="w-[18px] h-[18px]" strokeWidth={1.5} />
        <span>{label}</span>
        <Lock className="w-3 h-3 ml-auto" />
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
