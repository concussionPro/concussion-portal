'use client'

import { ChevronLeft, ChevronRight, BookOpen, Rocket, FileText, CheckSquare } from 'lucide-react'
import type { VirtualSection } from './SectionStepper'

interface SectionNavButtonsProps {
  virtualSections: VirtualSection[]
  currentIndex: number
  lockedAfterIndex?: number
  onNavigate: (index: number) => void
}

function getIconForType(type: string) {
  switch (type) {
    case 'resources': return FileText
    case 'apply-tomorrow': return Rocket
    case 'quiz': return CheckSquare
    default: return BookOpen
  }
}

export function SectionNavButtons({
  virtualSections,
  currentIndex,
  lockedAfterIndex,
  onNavigate,
}: SectionNavButtonsProps) {
  const prev = currentIndex > 0 ? virtualSections[currentIndex - 1] : null
  const next = currentIndex < virtualSections.length - 1 ? virtualSections[currentIndex + 1] : null
  const nextLocked = lockedAfterIndex !== undefined && next && currentIndex + 1 > lockedAfterIndex

  return (
    <div className="flex items-stretch gap-3 mt-8">
      {/* Previous */}
      {prev ? (
        <button
          onClick={() => onNavigate(currentIndex - 1)}
          className="flex-1 flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all text-left group"
        >
          <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-slate-600 flex-shrink-0 transition-colors" />
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Previous</div>
            <div className="text-sm font-semibold text-slate-700 truncate">{prev.label}</div>
          </div>
        </button>
      ) : (
        <div className="flex-1" />
      )}

      {/* Next */}
      {next && !nextLocked ? (
        <button
          onClick={() => onNavigate(currentIndex + 1)}
          className="flex-1 flex items-center justify-end gap-3 p-4 bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl border border-teal-200 hover:border-teal-300 hover:shadow-sm transition-all text-right group"
        >
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-teal-600 uppercase tracking-wider mb-0.5">Next</div>
            <div className="text-sm font-semibold text-slate-700 truncate">{next.label}</div>
          </div>
          <ChevronRight className="w-5 h-5 text-teal-500 group-hover:text-teal-700 flex-shrink-0 transition-colors" />
        </button>
      ) : next && nextLocked ? (
        <div className="flex-1 flex items-center justify-end gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-right opacity-60">
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Locked</div>
            <div className="text-sm font-semibold text-slate-400 truncate">{next.label}</div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
        </div>
      ) : (
        <div className="flex-1" />
      )}
    </div>
  )
}
