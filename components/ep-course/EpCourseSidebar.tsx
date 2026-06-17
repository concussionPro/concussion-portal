'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { EP_MODULES } from '@/lib/ep-course/modules'

/**
 * Course-scoped sidebar for the EP concussion-rehab course. Mirrors
 * VagusCourseSidebar so the EP stream looks identical to the rest of the suite.
 */
export function EpCourseSidebar() {
  const pathname = usePathname()
  const base = '/courses/concussion-ep-rehab'
  const currentModuleSlug = pathname?.match(/\/concussion-ep-rehab\/([^/]+)/)?.[1]
  const isOnCourseLanding = pathname === base
  const totalMin = EP_MODULES.reduce((sum, m) => sum + m.durationMin, 0)

  return (
    <aside className="hidden md:flex fixed left-0 top-[60px] bottom-0 w-72 flex-col border-r border-slate-200 bg-white z-30 overflow-y-auto">
      <Link
        href={base}
        className={`px-5 pt-6 pb-5 border-b border-slate-200 block transition-colors ${
          isOnCourseLanding ? 'bg-accent/[0.04]' : 'hover:bg-slate-50'
        }`}
      >
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-accent mb-2">CEA Learning</p>
        <p className="text-base font-bold text-foreground leading-tight mb-2">Concussion Rehabilitation for Exercise Physiologists</p>
        <p className="text-[11px] text-muted-foreground tabular-nums">
          {EP_MODULES.length} modules · {(totalMin / 60).toFixed(0)}h online · 8 CPD hours
        </p>
      </Link>

      <div className="flex-1 px-3 pt-5 pb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 px-2 mb-3">Curriculum</p>
        <ul className="space-y-1 mb-6">
          {EP_MODULES.map((m) => {
            const active = currentModuleSlug === m.slug
            return (
              <li key={m.slug}>
                <Link
                  href={`${base}/${m.slug}`}
                  className={`flex items-start gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                    active ? 'bg-accent/[0.07] text-foreground' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      active ? 'bg-accent text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {m.number}
                  </span>
                  <span className="leading-snug">
                    <span className="block font-medium">{m.title}</span>
                    <span className="block text-[10px] text-slate-400 tabular-nums">{m.durationMin}m</span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>

        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 px-2 mb-2">Course</p>
        <ul className="space-y-1">
          <li>
            <span className="block rounded-lg px-2.5 py-2 text-sm text-slate-400">In-person workshop · 6 CPD hours</span>
          </li>
        </ul>
      </div>

      <div className="border-t border-slate-200 px-5 py-4">
        <p className="text-[10px] text-slate-400">Private review copy · ESSA accreditation</p>
      </div>
    </aside>
  )
}
