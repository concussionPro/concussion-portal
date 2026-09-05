'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  PenLine,
  Mail,
  MapPin,
  Check,
  X,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSession } from '@/contexts/SessionContext'
import { useProgress } from '@/contexts/ProgressContext'
import { useCourseTier } from './useCourseTier'
import { holdsOnlineWithoutPracticalDay } from '@/lib/practical-day-seat'

const DISMISS_KEY = 'ccm-start-here-dismissed'
const LETTER_KEY = 'ccm-start-here-letter'
const OUTREACH_KEY = 'ccm-start-here-outreach'

type ChecklistItem = {
  id: string
  label: string
  href: string
  done: boolean
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  onNavigate?: () => void
}

/**
 * Compact day-1 orientation for paid CCM buyers.
 * Hidden for free-tier, CRM-only, and demo sessions.
 * Light visual weight — dismissible, auto-hides when every step is done.
 */
export function StartHereChecklist() {
  const { user } = useSession()
  const { isModuleComplete, progress, isInitialized } = useProgress()
  const { isCcmPaid } = useCourseTier()
  const [dismissed, setDismissed] = useState(true) // start hidden until hydrated
  const [letterDone, setLetterDone] = useState(false)
  const [outreachDone, setOutreachDone] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === '1')
      setLetterDone(localStorage.getItem(LETTER_KEY) === '1')
      setOutreachDone(localStorage.getItem(OUTREACH_KEY) === '1')
    } catch {
      /* private mode */
    }
    setReady(true)
  }, [])

  const isDemo = user?.isDemo === true
  const needsWorkshopStep = holdsOnlineWithoutPracticalDay({
    accessLevel: user?.accessLevel,
    hubPackSeat: user?.hubPackSeat,
  })
  const workshopNominated = !!user?.workshopLocation

  // Module 1 started or completed counts as done.
  const module1Done =
    isInitialized &&
    (isModuleComplete(1) ||
      Object.values(progress).some(
        (p) => p.moduleId === 1 && (!!p.startedAt || p.completed),
      ))

  if (!ready || !isCcmPaid || isDemo || dismissed) return null

  const items: ChecklistItem[] = [
    {
      id: 'module-1',
      label: 'Open Module 1',
      href: '/modules/1',
      done: module1Done,
      icon: BookOpen,
    },
    {
      id: 'letter',
      label: 'Try a discharge letter',
      href: '/clinical-toolkit/templates',
      done: letterDone,
      icon: PenLine,
      onNavigate: () => {
        try {
          localStorage.setItem(LETTER_KEY, '1')
        } catch {
          /* private mode */
        }
        setLetterDone(true)
      },
    },
    {
      id: 'outreach',
      label: 'Send one outreach email',
      href: '/outreach-kit',
      done: outreachDone,
      icon: Mail,
      onNavigate: () => {
        try {
          localStorage.setItem(OUTREACH_KEY, '1')
        } catch {
          /* private mode */
        }
        setOutreachDone(true)
      },
    },
  ]

  if (needsWorkshopStep) {
    const isHubPackSeat = user?.hubPackSeat === true
    items.push({
      id: 'nominate',
      label: workshopNominated
        ? 'Workshop city nominated'
        : 'Nominate your workshop city',
      // Hub Pack seats buy the practical day via the clinic add-on path;
      // classic online-only buyers go through /upgrade.
      href: isHubPackSeat ? '/in-person' : '/upgrade',
      done: workshopNominated,
      icon: MapPin,
    })
  }

  const allDone = items.every((i) => i.done)
  if (allDone) return null

  const doneCount = items.filter((i) => i.done).length

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* private mode */
    }
    setDismissed(true)
  }

  return (
    <div className="glass-premium rounded-xl px-4 py-3.5 sm:px-5 sm:py-4 mb-6 border border-accent/10 relative">
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-accent uppercase tracking-wider m-0 mb-0.5">
            Start here
          </p>
          <p className="text-xs text-muted-foreground m-0">
            Day-1 checklist · {doneCount}/{items.length} done
          </p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss start-here checklist"
          className="p-1 rounded-md text-muted-foreground/60 hover:text-muted-foreground hover:bg-white/40 transition-colors flex-shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <ul className="space-y-1.5 m-0 p-0 list-none">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                onClick={item.onNavigate}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
                  item.done
                    ? 'text-muted-foreground/70'
                    : 'text-foreground hover:bg-accent/5',
                )}
              >
                <span
                  className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border',
                    item.done
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                      : 'bg-white/60 border-border/60 text-muted-foreground',
                  )}
                >
                  {item.done ? (
                    <Check className="w-3 h-3" strokeWidth={2.5} />
                  ) : (
                    <Icon className="w-3 h-3" strokeWidth={1.8} />
                  )}
                </span>
                <span
                  className={cn(
                    'flex-1 min-w-0 font-medium text-[13px]',
                    item.done && 'line-through decoration-muted-foreground/40',
                  )}
                >
                  {item.label}
                </span>
                {!item.done && (
                  <ArrowRight className="w-3.5 h-3.5 text-accent/50 flex-shrink-0" />
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
