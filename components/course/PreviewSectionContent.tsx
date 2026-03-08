'use client'

import { DynamicContentRenderer } from './DynamicContentRenderer'
import { SectionInteractiveElements } from './SectionInteractiveElements'
import { SectionTypeBadge, estimateReadingTime } from './SectionTypeBadge'
import { Clock, BookOpen } from 'lucide-react'

interface PreviewSection {
  id: string
  title: string
  content: string[]
}

interface PreviewSectionContentProps {
  moduleId: number
  section: PreviewSection
}

export function PreviewSectionContent({ moduleId, section }: PreviewSectionContentProps) {
  const readingTime = estimateReadingTime(section.content)

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Section header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center">
            <span className="text-xs font-bold text-white">1</span>
          </div>
          <SectionTypeBadge sectionId={section.id} />
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="w-3 h-3" />
            {readingTime} min read
          </div>
        </div>
        <h3 className="text-lg font-bold text-slate-800">{section.title}</h3>
      </div>

      {/* Section content */}
      <div className="p-6">
        <DynamicContentRenderer content={section.content} sectionIndex={0} />
        <SectionInteractiveElements
          moduleId={moduleId}
          section={section}
          sectionIndex={0}
        />
      </div>
    </div>
  )
}
