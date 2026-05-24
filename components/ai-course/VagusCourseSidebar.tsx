'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Library,
  FileQuestion,
  Award,
  ArrowLeft,
  Circle,
  BookMarked,
  Wrench,
} from 'lucide-react'
import { VAGUS_MODULES } from '@/lib/vagus-course/modules'

/**
 * Course-scoped sidebar for the Vagus Nerve course. Mirrors
 * CourseSidebar.tsx for the AI course but reads from
 * lib/vagus-course/modules.
 *
 * Once we have 3+ courses, we'll generalise this into a single
 * <CourseSidebar courseSlug=... /> component. For now, parallel
 * implementation is faster than the refactor.
 */
export function VagusCourseSidebar() {
  const pathname = usePathname()
  const currentModuleSlug = pathname?.match(/\/vagus-nerve\/([^/]+)/)?.[1]
  const isOnCourseLanding = pathname === '/courses/vagus-nerve'
  const isResourceActive = (slug: string) =>
    pathname === `/courses/vagus-nerve/${slug}`
  const totalMin = VAGUS_MODULES.reduce((sum, m) => sum + m.durationMin, 0)

  return (
    <aside className="hidden md:flex fixed left-0 top-[60px] bottom-0 w-72 flex-col border-r border-slate-200 bg-white z-30 overflow-y-auto">
      <Link
        href="/courses/vagus-nerve"
        className={`px-5 pt-6 pb-5 border-b border-slate-200 block transition-colors ${
          isOnCourseLanding ? 'bg-accent/[0.04]' : 'hover:bg-slate-50'
        }`}
      >
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-accent mb-2">CEA Learning</p>
        <p className="text-base font-bold text-foreground leading-tight mb-2">The Vagus Nerve in Clinical Practice</p>
        <p className="text-[11px] text-muted-foreground tabular-nums">
          {VAGUS_MODULES.length} modules · {totalMin}m total · 1.25 CPD hours
        </p>
      </Link>

      <div className="flex-1 px-3 pt-5 pb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 px-2 mb-3">Curriculum</p>
        <ul className="space-y-1 mb-6">
          {VAGUS_MODULES.map((m) => {
            const active = currentModuleSlug === m.slug
            return (
              <li key={m.slug}>
                <Link
                  href={`/courses/vagus-nerve/${m.slug}`}
                  className={`flex items-start gap-2.5 px-2 py-2 rounded-lg transition-colors ${
                    active ? 'bg-accent/10' : 'hover:bg-slate-50'
                  }`}
                >
                  <Circle className={`w-3 h-3 shrink-0 mt-1 ${active ? 'text-accent fill-accent/30' : 'text-slate-300'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[10px] font-bold tabular-nums text-slate-500 shrink-0">
                        {String(m.number).padStart(2, '0')}
                      </span>
                      <p className={`text-xs leading-snug ${active ? 'text-accent font-semibold' : 'text-slate-800'}`}>
                        {m.title}
                      </p>
                    </div>
                    <p className="text-[10px] tabular-nums text-slate-400 mt-0.5 ml-6">
                      {m.durationMin} min{m.loadBearing ? ' · Required' : ''}
                    </p>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>

        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 px-2 mb-2">Resources</p>
        <ul className="space-y-0.5">
          <SidebarLink
            href="/courses/vagus-nerve/references"
            label="Reference Repository"
            sub="29 sources · 8 categories"
            icon={BookMarked}
            active={isResourceActive('references')}
          />
          <SidebarLink
            href="/courses/vagus-nerve/toolkit"
            label="Clinical Toolkit"
            sub="Stand test · referral · handouts"
            icon={Wrench}
            active={isResourceActive('toolkit')}
          />
        </ul>

        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 px-2 mb-2 mt-5">Certification</p>
        <ul className="space-y-0.5">
          <SidebarLink
            href="/courses/vagus-nerve/quiz"
            label="Certification quiz"
            sub="10 questions · 8/10 to pass"
            icon={FileQuestion}
            active={isResourceActive('quiz')}
          />
          <SidebarLink
            href="/courses/vagus-nerve/certificate"
            label="Certificate"
            sub="Download · verify"
            icon={Award}
            active={isResourceActive('certificate')}
          />
        </ul>
      </div>

      <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/50">
        <Link
          href="/courses"
          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to marketplace
        </Link>
      </div>
    </aside>
  )
}

function SidebarLink({
  href,
  label,
  sub,
  icon: Icon,
  active,
}: {
  href: string
  label: string
  sub: string
  icon: React.ComponentType<{ className?: string }>
  active: boolean
}) {
  return (
    <li>
      <Link
        href={href}
        className={`flex items-start gap-2 px-2 py-2 rounded-md transition-colors ${active ? 'bg-accent/10' : 'hover:bg-slate-50'}`}
      >
        <Icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${active ? 'text-accent' : 'text-slate-400'}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-semibold leading-tight ${active ? 'text-accent' : 'text-slate-700'}`}>{label}</p>
          <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{sub}</p>
        </div>
      </Link>
    </li>
  )
}

void Library
