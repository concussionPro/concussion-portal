'use client'

import { cn } from '@/lib/utils'

type SectionType = 'theory' | 'practical' | 'assessment' | 'summary' | 'reference'

function deriveSectionType(sectionId: string): SectionType {
  const id = sectionId.toLowerCase()
  if (id.includes('case') || id.includes('practical') || id.includes('protocol') || id.includes('methodology') || id.includes('rehab') || id.includes('therapy')) return 'practical'
  if (id.includes('quiz') || id.includes('assessment') || id.includes('check') || id.includes('myths')) return 'assessment'
  if (id.includes('summary') || id.includes('overview') || id.includes('apply')) return 'summary'
  if (id.includes('reference') || id.includes('resource') || id.includes('documentation')) return 'reference'
  return 'theory'
}

const TYPE_STYLES: Record<SectionType, { bg: string; text: string; label: string }> = {
  theory: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Theory' },
  practical: { bg: 'bg-teal-100', text: 'text-teal-700', label: 'Practical' },
  assessment: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Assessment' },
  summary: { bg: 'bg-green-100', text: 'text-green-700', label: 'Summary' },
  reference: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Reference' },
}

interface SectionTypeBadgeProps {
  sectionId: string
  className?: string
}

export function SectionTypeBadge({ sectionId, className }: SectionTypeBadgeProps) {
  const type = deriveSectionType(sectionId)
  const style = TYPE_STYLES[type]

  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider',
      style.bg,
      style.text,
      className
    )}>
      {style.label}
    </span>
  )
}

export function estimateReadingTime(content: string[]): number {
  const totalWords = content.reduce((sum, line) => sum + line.split(/\s+/).length, 0)
  return Math.max(1, Math.ceil(totalWords / 200))
}
