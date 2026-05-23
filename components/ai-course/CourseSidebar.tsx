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
import { MODULES } from '@/lib/ai-course/content'

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
    <aside className="hidden md:flex fixed left-0 top-[60px] bottom-0 w-64 flex-col border-r border-slate-200 bg-white z-30 overflow-y-auto">
      {/* Course header */}
      <Link
        href="/courses/ai-in-clinical-practice"
        className={`px-5 py-4 border-b border-slate-200 block transition-colors ${
          isOnCourseLanding ? 'bg-accent/[0.04]' : 'hover:bg-slate-50'
        }`}
      >
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-accent mb-1">CEA Learning</p>
        <p className="text-sm font-bold text-foreground leading-tight">AI in Clinical Practice</p>
        <p className="text-[10px] text-muted-foreground mt-1 tabular-nums">
          {MODULES.length} modules · {totalMin}m total
        </p>
      </Link>

      {/* Module list */}
      <div className="flex-1 px-3 py-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 px-2 mb-2">
          Curriculum
        </p>
        <ul className="space-y-0.5 mb-5">
          {MODULES.map((m) => {
            const active = currentModuleSlug === m.slug
            return (
              <li key={m.slug}>
                <Link
                  href={`/courses/ai-in-clinical-practice/${m.slug}`}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors ${
                    active
                      ? 'bg-accent/10 text-accent font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Circle className={`w-3 h-3 shrink-0 ${active ? 'text-accent fill-accent/30' : 'text-slate-300'}`} />
                  <span className="w-7 text-[10px] font-bold tabular-nums text-slate-500">
                    {String(m.number).padStart(2, '0')}
                  </span>
                  <span className="flex-1 truncate leading-tight">{m.title}</span>
                  <span className="shrink-0 text-[9px] tabular-nums text-slate-400">{m.durationMin}m</span>
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
