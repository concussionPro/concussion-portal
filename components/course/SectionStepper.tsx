'use client'

import { CheckCircle2, Lock, FileText, Rocket, ClipboardCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRef, useEffect } from 'react'

export type VirtualSectionType = 'content' | 'resources' | 'apply-tomorrow' | 'quiz'

export interface VirtualSection {
  type: VirtualSectionType
  label: string
  index: number
}

interface SectionStepperProps {
  virtualSections: VirtualSection[]
  currentIndex: number
  visitedIndices: Set<number>
  lockedAfterIndex?: number // sections after this index are locked
  onNavigate: (index: number) => void
}

function getTypeIcon(type: VirtualSectionType) {
  switch (type) {
    case 'resources': return FileText
    case 'apply-tomorrow': return Rocket
    case 'quiz': return ClipboardCheck
    default: return null
  }
}

export function SectionStepper({
  virtualSections,
  currentIndex,
  visitedIndices,
  lockedAfterIndex,
  onNavigate,
}: SectionStepperProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLButtonElement>(null)

  // Scroll active circle into view
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current
      const el = activeRef.current
      const left = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2
      container.scrollTo({ left, behavior: 'smooth' })
    }
  }, [currentIndex])

  const progress = virtualSections.length > 0
    ? ((currentIndex + 1) / virtualSections.length) * 100
    : 0

  // Count content sections separately from special sections
  const contentSections = virtualSections.filter(v => v.type === 'content')
  const specialSections = virtualSections.filter(v => v.type !== 'content')

  return (
    <div className="mb-6">
      {/* Progress bar */}
      <div className="w-full h-1.5 bg-slate-200 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-teal-500 to-blue-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Stepper circles */}
      <div
        ref={scrollRef}
        className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {virtualSections.map((vs, i) => {
          const isCurrent = i === currentIndex
          const isVisited = visitedIndices.has(i)
          const isLocked = lockedAfterIndex !== undefined && i > lockedAfterIndex
          const TypeIcon = getTypeIcon(vs.type)

          // Add a visual gap before special sections (resources, apply-tomorrow, quiz)
          const isFirstSpecial = vs.type !== 'content' && (i === 0 || virtualSections[i - 1].type === 'content')
          // Add subtle group separator every 5 content sections
          const isGroupBreak = vs.type === 'content' && i > 0 && i % 5 === 0

          return (
            <div key={i} className="flex items-center">
              {/* Group separator */}
              {isGroupBreak && (
                <div className="w-px h-5 bg-slate-300 mx-1 flex-shrink-0" />
              )}
              {/* Separator before special sections */}
              {isFirstSpecial && (
                <div className="w-px h-5 bg-teal-300 mx-1.5 flex-shrink-0" />
              )}
              <button
                ref={isCurrent ? activeRef : undefined}
                onClick={() => !isLocked && onNavigate(i)}
                disabled={isLocked}
                title={vs.label}
                className={cn(
                  'flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200',
                  // Special sections get slightly wider pill shape
                  vs.type !== 'content' ? 'w-9 h-8 rounded-lg' : 'w-8 h-8',
                  isCurrent && 'bg-gradient-to-br from-teal-500 to-blue-600 text-white shadow-md scale-110',
                  !isCurrent && isVisited && !isLocked && 'bg-teal-100 text-teal-700 hover:bg-teal-200',
                  !isCurrent && !isVisited && !isLocked && 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                  isLocked && 'bg-slate-100 text-slate-300 cursor-not-allowed'
                )}
              >
                {isLocked ? (
                  <Lock className="w-3.5 h-3.5" />
                ) : TypeIcon ? (
                  <TypeIcon className="w-3.5 h-3.5" />
                ) : isVisited && !isCurrent ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  i + 1
                )}
              </button>
            </div>
          )
        })}
      </div>

      {/* Current section label */}
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500 truncate">
          {virtualSections[currentIndex]?.label}
        </p>
        <span className="text-xs text-slate-400 flex-shrink-0 ml-2">
          {currentIndex + 1} / {virtualSections.length}
        </span>
      </div>
    </div>
  )
}
