'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Library,
  FileQuestion,
  Award,
  ArrowLeft,
  Lock,
  CheckCircle2,
  Circle,
  BookMarked,
  Wrench,
} from 'lucide-react'
import { MODULES } from '@/lib/ai-course/modules'

/**
 * Course-specific sidebar for the AI in Clinical Practice page tree.
 *
 * Renders a fixed left rail below the SiteNav (top: 60px) so any AI
 * course page can use it as a sticky learning-dashboard left column.
 *
 * Why a separate component (not the /learning Sidebar): /learning's
 * sidebar is tied to ProgressContext + the full ConcussionPro app
 * shell. The AI course wants a course-scoped navigation pattern
 * showing the curriculum + course-level resources only.
 */
export function CourseSidebar() {
  const pathname = usePathname()

  const currentModuleSlug = pathname?.match(/\/ai-in-clinical-practice\/([^/]+)/)?.[1]
  const isOnCourseLanding = pathname === '/courses/ai-in-clinical-practice'

  const isResourceActive = (slug: string) =>
    pathname === `/courses/ai-in-clinical-practice/${slug}`

  const totalMin = MODULES.reduce((sum, m) => sum + m.durationMin, 0)

  return (
    <aside className="hidden md:flex fixed left-0 top-[60px] bottom-0 w-72 flex-col border-r border-slate-200 bg-white z-30 overflow-y-auto">
      {/* Course header — generous spacing, no border crush */}
      <Link
        href="/courses/ai-in-clinical-practice"
        className={`px-5 pt-6 pb-5 border-b border-slate-200 block transition-colors ${
          isOnCourseLanding ? 'bg-accent/[0.04]' : 'hover:bg-slate-50'
        }`}
      >
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-accent mb-2">CEA Learning</p>
        <p className="text-base font-bold text-foreground leading-tight mb-2">AI in Clinical Practice</p>
        <p className="text-[11px] text-muted-foreground tabular-nums">
          {MODULES.length} modules · {totalMin}m total
        </p>
      </Link>

      {/* Module list — full-width titles, no truncation */}
      <div className="flex-1 px-3 pt-5 pb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 px-2 mb-3">
          Curriculum
        </p>
        <ul className="space-y-1 mb-6">
          {MODULES.map((m) => {
            const active = currentModuleSlug === m.slug
            return (
              <li key={m.slug}>
                <Link
                  href={`/courses/ai-in-clinical-practice/${m.slug}`}
                  className={`flex items-start gap-2.5 px-2 py-2 rounded-lg transition-colors ${
                    active
                      ? 'bg-accent/10'
                      : 'hover:bg-slate-50'
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

        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 px-2 mb-2">
          Resources
        </p>
        <ul className="space-y-0.5">
          <SidebarLink
            href="/courses/ai-in-clinical-practice/hub"
            label="AI Practice Hub"
            sub="40 prompts · 14 templates · tools matrix"
            icon={Library}
            active={isResourceActive('hub')}
          />
          <SidebarLink
            href="/courses/ai-in-clinical-practice/toolkit"
            label="Clinical Toolkit"
            sub="Consent · de-id · audit · incident"
            icon={Wrench}
            active={isResourceActive('toolkit')}
          />
          <SidebarLink
            href="/courses/ai-in-clinical-practice/references"
            label="Reference Repository"
            sub="AHPRA · OAIC · TGA · clinical evidence"
            icon={BookMarked}
            active={isResourceActive('references')}
          />
        </ul>

        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 px-2 mb-2 mt-5">
          Certification
        </p>
        <ul className="space-y-0.5">
          <SidebarLink
            href="/courses/ai-in-clinical-practice/quiz"
            label="Certification quiz"
            sub="10 questions · 8/10 to pass"
            icon={FileQuestion}
            active={isResourceActive('quiz')}
          />
          <SidebarLink
            href="/courses/ai-in-clinical-practice/certificate"
            label="Certificate"
            sub="Download · verify"
            icon={Award}
            active={isResourceActive('certificate')}
          />
        </ul>
      </div>

      {/* Footer — return to demo */}
      <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/50">
        <Link
          href="/courses/heidi-tour"
          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to overview
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
        className={`flex items-start gap-2 px-2 py-2 rounded-md transition-colors ${
          active ? 'bg-accent/10' : 'hover:bg-slate-50'
        }`}
      >
        <Icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${active ? 'text-accent' : 'text-slate-400'}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-semibold leading-tight ${active ? 'text-accent' : 'text-slate-700'}`}>
            {label}
          </p>
          <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{sub}</p>
        </div>
      </Link>
    </li>
  )
}

// Re-export silenced unused imports if needed later
void Lock
void CheckCircle2
