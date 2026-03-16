'use client'

import { useMemo } from 'react'
import {
  CheckCircle2,
  Lightbulb,
  Square,
  ChevronRight,
  BarChart3,
  Zap,
  Brain,
  RefreshCw,
  AlertTriangle,
  Target,
  Link2,
  Calendar,
  BookOpen,
  ClipboardList,
  Play,
  Shield,
  Eye,
  Bone,
  Activity,
  GraduationCap,
  Circle,
  Microscope,
  Battery,
  Dna,
  Recycle,
  Hash,
  Info,
} from 'lucide-react'

// Map content-marker emoji to lucide icons for professional rendering
const EMOJI_ICON_MAP: Record<string, { icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; color: string }> = {
  '🔹': { icon: ChevronRight, color: 'text-teal-500' },
  '📊': { icon: BarChart3, color: 'text-blue-500' },
  '💡': { icon: Lightbulb, color: 'text-amber-500' },
  '⚡': { icon: Zap, color: 'text-yellow-500' },
  '🧠': { icon: Brain, color: 'text-purple-500' },
  '🔄': { icon: RefreshCw, color: 'text-slate-500' },
  '⚠️': { icon: AlertTriangle, color: 'text-amber-600' },
  '✅': { icon: CheckCircle2, color: 'text-green-500' },
  '📋': { icon: ClipboardList, color: 'text-slate-600' },
  '🎯': { icon: Target, color: 'text-red-500' },
  '⛓': { icon: Link2, color: 'text-slate-500' },
  '📅': { icon: Calendar, color: 'text-blue-500' },
  '📚': { icon: BookOpen, color: 'text-indigo-500' },
  // Phase & mechanism emojis used in module content
  '💥': { icon: Zap, color: 'text-orange-500' },
  '↔️': { icon: RefreshCw, color: 'text-blue-500' },
  '🔋': { icon: Battery, color: 'text-green-600' },
  '🧬': { icon: Dna, color: 'text-violet-500' },
  '🔬': { icon: Microscope, color: 'text-indigo-500' },
  '🛡️': { icon: Shield, color: 'text-blue-600' },
  '♻️': { icon: Recycle, color: 'text-emerald-500' },
  '🖼️': { icon: Info, color: 'text-slate-500' },
  '👁️': { icon: Eye, color: 'text-blue-500' },
  '🦴': { icon: Bone, color: 'text-slate-600' },
  '🏃': { icon: Activity, color: 'text-teal-600' },
  '🎓': { icon: GraduationCap, color: 'text-amber-600' },
  '🚀': { icon: Zap, color: 'text-teal-500' },
  // Phase color dots for phased management framework
  '🔴': { icon: Circle, color: 'text-red-500' },
  '🟡': { icon: Circle, color: 'text-yellow-500' },
  '🟢': { icon: Circle, color: 'text-green-500' },
  '⚪': { icon: Circle, color: 'text-slate-400' },
}

function EmojiIcon({ emoji, size = 'md' }: { emoji: string; size?: 'sm' | 'md' | 'lg' }) {
  const mapping = EMOJI_ICON_MAP[emoji]
  if (!mapping) return null
  const Icon = mapping.icon
  const sizeClass = size === 'lg' ? 'w-7 h-7' : size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
  return <Icon className={`${sizeClass} ${mapping.color} flex-shrink-0`} strokeWidth={2} />
}

interface DynamicContentRendererProps {
  content: string[]
  sectionIndex: number
}

export function DynamicContentRenderer({ content, sectionIndex }: DynamicContentRendererProps) {
  // PERFORMANCE: Memoize content preprocessing to avoid re-processing on every render
  const processedContent = useMemo(() => {
    const processed: string[] = []
    let i = 0

  while (i < content.length) {
    const line = content[i]

    // Check if this line is an emoji table header (includes both emoji AND pipes)
    const isEmojiTableHeader = (line.startsWith('📊') || line.startsWith('📋')) && line.includes(':')

    // Check if NEXT line starts a table (has pipes + line after that is separator)
    const nextLineIsTableHeader = i + 1 < content.length && content[i + 1].includes('|')
    const lineAfterNextIsSeparator = i + 2 < content.length && (content[i + 2].includes('──') || content[i + 2].includes('---'))

    // Check if this is a major section header (emoji + number + title)
    const startsWithTargetEmoji = line.codePointAt(0) === 0x1F3AF || // 🎯
                                   line.codePointAt(0) === 0x26D3 ||  // ⛓
                                   line.codePointAt(0) === 0x1F4C5 || // 📅
                                   line.codePointAt(0) === 0x2705 ||  // ✅
                                   line.codePointAt(0) === 0x1F4A1 || // 💡
                                   line.codePointAt(0) === 0x1F4DA    // 📚
    const isMajorSection = startsWithTargetEmoji && / \d+\. /.test(line)

    // Check if this is a pathway section (A., B., C. followed by content with Mechanism:, Target:, etc.)
    const isPathwayHeader = /^[A-C]\.\s+THE\s+/.test(line)

    if (isPathwayHeader) {
      const pathwayLines = [line]
      i++

      while (i < content.length) {
        const currentLine = content[i]
        const isNextPathway = /^[A-C]\.\s+THE\s+/.test(currentLine)
        const isMajorSection = /^[🎯⛓️📅✅💡📚🔹]/.test(currentLine) && !currentLine.startsWith('• ')

        if (isNextPathway || isMajorSection) {
          break
        }
        pathwayLines.push(currentLine)
        i++
      }

      processed.push('__PATHWAY__\n' + pathwayLines.join('\n'))
    } else if (isMajorSection) {
      const sectionLines = [line]
      i++

      while (i < content.length) {
        const currentLine = content[i]
        const isNextMajorSection = (/^[🎯⛓📅✅💡📚🔹]/u.test(currentLine) && /\d+\./.test(currentLine))
        const isPathway = /^[A-C]\.\s+THE\s+/.test(currentLine)
        const isBullet = currentLine.trim().startsWith('•')
        const isChecklist = currentLine.trim().startsWith('☐')
        const isTable = currentLine.includes('|')

        if (isNextMajorSection || isPathway || isBullet || isChecklist || isTable) {
          break
        }
        sectionLines.push(currentLine)
        i++
      }

      processed.push('__SECTION__\n' + sectionLines.join('\n'))
    } else if (isEmojiTableHeader && nextLineIsTableHeader && lineAfterNextIsSeparator) {
      const tableLines = [line, content[i + 1], content[i + 2]]
      i += 3

      while (i < content.length) {
        const currentLine = content[i]
        const isNewSection = (currentLine.startsWith('🔹') || currentLine.startsWith('📊') || currentLine.startsWith('💡') || currentLine.startsWith('🔴')) &&
                             currentLine.includes(':') &&
                             !currentLine.includes('|')
        if (currentLine.trim() === '' || isNewSection) {
          break
        }
        tableLines.push(currentLine)
        i++
      }

      processed.push(tableLines.join('\n'))
    } else if (line.includes('|') && i + 1 < content.length && (content[i + 1].includes('──') || content[i + 1].includes('---'))) {
      const tableLines = [line, content[i + 1]]
      i += 2

      while (i < content.length) {
        const currentLine = content[i]
        const isNewSection = (currentLine.startsWith('🔹') || currentLine.startsWith('📊') || currentLine.startsWith('💡') || currentLine.startsWith('🔴')) &&
                             currentLine.includes(':') &&
                             !currentLine.includes('|')
        if (currentLine.trim() === '' || isNewSection) {
          break
        }
        tableLines.push(currentLine)
        i++
      }

      processed.push(tableLines.join('\n'))
    } else {
      processed.push(line)
      i++
    }
  }

    return processed
  }, [content])

  // Precompute definition color indices to avoid mutation inside .map() (breaks in React StrictMode)
  const isDefinitionCheck = (paragraph: string) =>
    !paragraph.startsWith('__SECTION__') &&
    !paragraph.startsWith('__PATHWAY__') &&
    !(paragraph.includes('|') && (paragraph.includes('───') || paragraph.includes('---'))) &&
    !paragraph.trim().startsWith('☐') &&
    !paragraph.trim().startsWith('✓') &&
    !paragraph.trim().startsWith('•') &&
    !paragraph.trim().startsWith('-') &&
    !paragraph.trim().startsWith('* ') &&
    !paragraph.startsWith('##') &&
    !paragraph.trim().endsWith(':') &&
    !/^[\p{Emoji_Presentation}\p{Emoji}\uFE0F]/u.test(paragraph) &&
    /^[A-Z][A-Z0-9\s&\-/]+:\s*.+/.test(paragraph) &&
    (paragraph.match(/^[A-Z][A-Z0-9\s&\-/]+/)?.[0]?.length ?? 999) < 50

  const definitionColorMap: number[] = []
  let counter = 0
  for (const p of processedContent) {
    const isDef = isDefinitionCheck(p)
    definitionColorMap.push(isDef ? counter++ : 0)
  }

  const rendered = processedContent.map((paragraph, index) => {
    const colorIndex = definitionColorMap[index]
    return renderParagraph(paragraph, `content-${index}`, colorIndex)
  })

  // Extract key takeaways from definition blocks (first sentence of each)
  const takeaways = useMemo(() => {
    const points: string[] = []
    for (const paragraph of processedContent) {
      const defMatch = paragraph.match(/^([A-Z][A-Z0-9\s&\-/]+):\s*(.+)/)
      if (defMatch && defMatch[1].length < 50 &&
        !paragraph.startsWith('__SECTION__') && !paragraph.startsWith('__PATHWAY__')) {
        const fullText = defMatch[2]
        const firstSentence = fullText.match(/^(.+?\.)\s/) ? fullText.match(/^(.+?\.)\s/)![1] : fullText
        if (firstSentence.length > 20 && firstSentence.length < 200) {
          points.push(firstSentence)
        }
      }
    }
    return points
  }, [processedContent])

  return (
    <div className="space-y-6">
      {rendered}

      {/* Key Takeaways — auto-generated from definition blocks */}
      {takeaways.length >= 2 && (
        <div className="mt-8 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl p-5 border border-teal-200">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-teal-600" />
            <h4 className="text-sm font-bold text-teal-900 uppercase tracking-wide">Key Takeaways</h4>
          </div>
          <ul className="space-y-2">
            {takeaways.slice(0, 5).map((point, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                <span className="text-sm text-slate-700 leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// Rotating color palette for definition blocks to prevent visual monotony
const DEFINITION_COLORS = [
  { bg: 'bg-blue-50', border: 'border-blue-500', label: 'text-blue-900' },
  { bg: 'bg-teal-50', border: 'border-teal-500', label: 'text-teal-900' },
  { bg: 'bg-indigo-50', border: 'border-indigo-500', label: 'text-indigo-900' },
  { bg: 'bg-slate-50', border: 'border-slate-500', label: 'text-slate-900' },
  { bg: 'bg-purple-50', border: 'border-purple-500', label: 'text-purple-900' },
]

function renderVideoEmbed(videoId: string, title: string, key: string) {
  // Strip timestamp params from videoId (e.g., "CJF6kJcFGqE&t=221s" → "CJF6kJcFGqE")
  const cleanId = videoId.split('&')[0]
  return (
    <div key={key} className="my-6">
      <div className="bg-slate-900 rounded-xl overflow-hidden shadow-lg">
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube-nocookie.com/embed/${cleanId}?rel=0`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
        <div className="px-4 py-3 flex items-center gap-2">
          <Play className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <p className="text-sm text-slate-300 font-medium truncate">{title}</p>
        </div>
      </div>
    </div>
  )
}

// Parse **bold** markdown within text — used across all content renderers
function parseBoldText(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  const regex = /\*\*(.*?)\*\*/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index))
    }
    parts.push(
      <strong key={match.index} className="font-semibold text-slate-900">
        {match[1]}
      </strong>
    )
    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }

  return parts.length > 0 ? parts : [text]
}

function renderParagraph(text: string, key: string, definitionColorIndex: number = 0) {

  // Handle video embeds [VIDEO: youtube_id | Title]
  const videoMatch = text.match(/^\[VIDEO:\s*([^\]|]+?)\s*\|\s*([^\]]+?)\s*\]$/)
  if (videoMatch) {
    return renderVideoEmbed(videoMatch[1], videoMatch[2], key)
  }

  // Handle callout boxes [CALLOUT: type | content]
  const calloutMatch = text.match(/^\[CALLOUT:\s*(warning|evidence|clinical|key)\s*\|\s*(.+)\]$/)
  if (calloutMatch) {
    const calloutType = calloutMatch[1] as 'warning' | 'evidence' | 'clinical' | 'key'
    const calloutContent = calloutMatch[2]
    const calloutConfig = {
      warning: { icon: AlertTriangle, bg: 'bg-amber-50', border: 'border-amber-500', label: 'text-amber-900', iconColor: 'text-amber-600', title: 'Warning' },
      evidence: { icon: BookOpen, bg: 'bg-blue-50', border: 'border-blue-500', label: 'text-blue-900', iconColor: 'text-blue-600', title: 'Evidence' },
      clinical: { icon: Lightbulb, bg: 'bg-purple-50', border: 'border-purple-500', label: 'text-purple-900', iconColor: 'text-purple-600', title: 'Clinical Pearl' },
      key: { icon: Target, bg: 'bg-teal-50', border: 'border-teal-500', label: 'text-teal-900', iconColor: 'text-teal-600', title: 'Key Point' },
    }
    const cfg = calloutConfig[calloutType]
    const CalloutIcon = cfg.icon
    return (
      <div key={key} className={`${cfg.bg} rounded-xl p-5 border-l-4 ${cfg.border} my-4`}>
        <div className="flex items-start gap-3">
          <CalloutIcon className={`w-5 h-5 ${cfg.iconColor} flex-shrink-0 mt-0.5`} strokeWidth={2} />
          <div className="flex-1">
            <p className={`text-xs font-bold uppercase tracking-wide mb-1.5 ${cfg.label}`}>{cfg.title}</p>
            <p className="text-sm text-slate-700 leading-relaxed">{parseBoldText(calloutContent)}</p>
          </div>
        </div>
      </div>
    )
  }

  // Handle quote/guideline blocks [QUOTE: Attribution | Content]
  const quoteMatch = text.match(/^\[QUOTE:\s*([^|]+?)\s*\|\s*(.+)\]$/)
  if (quoteMatch) {
    return (
      <blockquote key={key} className="border-l-4 border-slate-400 bg-slate-50 rounded-r-xl p-5 my-4">
        <p className="text-sm text-slate-700 leading-relaxed italic">{parseBoldText(quoteMatch[2])}</p>
        <p className="text-xs font-bold text-slate-500 mt-2">— {quoteMatch[1]}</p>
      </blockquote>
    )
  }

  // Handle highlight blocks [HIGHLIGHT: content]
  const highlightMatch = text.match(/^\[HIGHLIGHT:\s*(.+)\]$/)
  if (highlightMatch) {
    return (
      <div key={key} className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl p-6 my-4 text-center border border-teal-200">
        <p className="text-base font-semibold text-slate-800 leading-relaxed">{parseBoldText(highlightMatch[1])}</p>
      </div>
    )
  }

  // Handle sub-section headers (### Title)
  const subHeaderMatch = text.match(/^###\s+(.+)$/)
  if (subHeaderMatch) {
    return (
      <div key={key} className="flex items-center gap-2 mt-6 mb-3">
        <div className="w-1 h-5 bg-teal-500 rounded-full" />
        <h5 className="text-base font-bold text-slate-900">{subHeaderMatch[1]}</h5>
      </div>
    )
  }

  // Handle horizontal rules (---)
  if (/^-{3,}$/.test(text.trim())) {
    return <hr key={key} className="border-t border-slate-200 my-8" />
  }

  // Handle major sections with intro text
  if (text.startsWith('__SECTION__\n')) {
    return renderMajorSection(text.replace('__SECTION__\n', ''), key)
  }

  // Handle pathway sections (grouped A/B/C sections with Mechanism, Target, etc.)
  if (text.startsWith('__PATHWAY__\n')) {
    return renderPathwaySection(text.replace('__PATHWAY__\n', ''), key)
  }

  // Handle tables - check for pipes and separator
  if (text.includes('|') && (text.includes('───') || text.includes('---'))) {
    return renderTable(text, key)
  }

  // Handle checklist items (☐)
  if (text.trim().startsWith('☐')) {
    const parts = text.split(':')
    const title = parts[0].replace('☐', '').trim()
    const description = parts.slice(1).join(':').trim()
    return (
      <div key={key} className="flex items-start gap-3 bg-amber-50 rounded-lg p-4 border-l-4 border-amber-400">
        <Square className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
        <div className="flex-1">
          <div className="font-semibold text-slate-900 text-[15px]">{title}</div>
          {description && <div className="text-sm text-slate-600 mt-1">{description}</div>}
        </div>
      </div>
    )
  }

  // Handle key takeaways (✓)
  if (text.trim().startsWith('✓')) {
    const parts = text.split(':')
    const title = parts[0].replace('✓', '').trim()
    const description = parts.slice(1).join(':').trim()
    return (
      <div key={key} className="flex items-start gap-3 bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
        <div className="flex-1">
          <div className="font-semibold text-slate-900 text-[15px]">{title}</div>
          {description && <div className="text-sm text-slate-700 mt-1">{description}</div>}
        </div>
      </div>
    )
  }

  // Handle bullet points with citations (e.g., "• Name (Author, Year): Description")
  if (text.trim().startsWith('•') && text.includes('et al.,') && text.includes('):')) {
    const items = text.split(/\n/).filter(line => line.trim())
    return (
      <div key={key} className="space-y-3">
        {items.map((item, i) => {
          const cleanItem = item.replace(/^[•\-\*]\s*/, '')
          const match = cleanItem.match(/^([^(]+)\(([^)]+)\):\s*(.+)/)

          if (match) {
            const [, title, citation, description] = match
            return (
              <div key={i} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border-l-4 border-purple-400">
                <div className="font-bold text-slate-900 text-[15px]">{title.trim()}</div>
                <div className="text-xs font-semibold text-purple-600 mt-1">({citation.trim()})</div>
                <div className="text-sm text-slate-700 mt-2 leading-relaxed">{description.trim()}</div>
              </div>
            )
          }

          return (
            <div key={i} className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
              <span className="text-[15px] text-slate-700 leading-relaxed">{parseBoldText(cleanItem)}</span>
            </div>
          )
        })}
      </div>
    )
  }

  // Handle regular bullet points
  if (text.trim().startsWith('•') || text.trim().startsWith('-') || text.trim().startsWith('* ') || text.trim() === '*') {
    const items = text.split(/\n/).filter(line => line.trim())
    return (
      <ul key={key} className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
            <span className="text-[15px] text-slate-700 leading-relaxed">
              {parseBoldText(item.replace(/^[•\-\*]\s*/, ''))}
            </span>
          </li>
        ))}
      </ul>
    )
  }

  // Handle case study blocks (CASE X - LABEL: description)
  const caseMatch = text.match(/^CASE\s*(\d*)\s*[-–—]?\s*([^:]*?):\s*(.+)/)
  if (caseMatch) {
    const [, num, label, content] = caseMatch
    const caseTitle = num ? `Case ${num}` : 'Case Study'
    const subtitle = label.trim()
    return (
      <div key={key} className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-5 border-l-4 border-amber-500 my-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500 text-white text-xs font-bold flex-shrink-0">
            {num || '?'}
          </span>
          <span className="font-bold text-amber-900 text-sm uppercase tracking-wide">
            {caseTitle}{subtitle ? ` — ${subtitle}` : ''}
          </span>
        </div>
        <div className="text-[15px] text-slate-700 leading-relaxed">
          {content}
        </div>
      </div>
    )
  }

  // Handle labeled paragraphs with parenthetical details (LABEL (detail): description)
  const labeledParenMatch = text.match(/^([A-Z][A-Z\s&-]+\([^)]+\)):\s*(.+)/)
  if (labeledParenMatch && labeledParenMatch[1].length < 60) {
    const [, label, content] = labeledParenMatch
    const colors = DEFINITION_COLORS[definitionColorIndex % DEFINITION_COLORS.length]
    return (
      <div key={key} className={`${colors.bg} rounded-lg p-4 border-l-4 ${colors.border} my-3`}>
        <div className={`font-bold ${colors.label} text-sm uppercase tracking-wide mb-2`}>
          {label}
        </div>
        <div className="text-[15px] text-slate-700 leading-relaxed">
          {content}
        </div>
      </div>
    )
  }

  // Handle definition-style content (LABEL: description) — includes hyphens, digits, slashes
  const definitionMatch = text.match(/^([A-Z][A-Z0-9\s&\-/]+):\s*(.+)/)
  if (definitionMatch && definitionMatch[1].length < 50) {
    const [, label, content] = definitionMatch
    const colors = DEFINITION_COLORS[definitionColorIndex % DEFINITION_COLORS.length]
    return (
      <div key={key} className={`${colors.bg} rounded-lg p-4 border-l-4 ${colors.border} my-3`}>
        <div className={`font-bold ${colors.label} text-sm uppercase tracking-wide mb-2`}>
          {label}
        </div>
        <div className="text-[15px] text-slate-700 leading-relaxed">
          {content}
        </div>
      </div>
    )
  }

  // Handle intro headers (lines ending with : that introduce a list/section)
  if (text.trim().endsWith(':') && !text.includes('|') && text.length > 10 && text.length < 200) {
    return (
      <div key={key} className="bg-slate-50 rounded-lg px-4 py-3 border-l-4 border-slate-400 mt-4 mb-3">
        <h4 className="text-base font-bold text-slate-900">
          {text.trim()}
        </h4>
      </div>
    )
  }

  // Handle numbered section headers (1. TITLE or 1. TITLE:)
  const numberedSectionMatch = text.match(/^(\d+)\.\s+([A-Z][A-Z\s\-&()]+):?\s*$/)
  if (numberedSectionMatch && numberedSectionMatch[2].length > 5) {
    const [, number, title] = numberedSectionMatch
    return (
      <div key={key} className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg px-5 py-3 border-l-4 border-indigo-500 mt-4 mb-3">
        <div className="flex items-center gap-3">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm">
            {number}
          </span>
          <h4 className="text-base font-bold text-indigo-900 uppercase tracking-wide">
            {title}
          </h4>
        </div>
      </div>
    )
  }

  // Handle headers (markdown-style)
  if (text.startsWith('##')) {
    return (
      <h4 key={key} className="text-lg font-bold text-slate-900 mt-6 mb-3">
        {text.replace(/^##\s*/, '')}
      </h4>
    )
  }

  // Handle numbered emoji sub-headers (1️⃣ TITLE, 2️⃣ TITLE, etc.)
  const numberedEmojiMatch = text.match(/^([1-9]️⃣)\s+(.+)/)
  if (numberedEmojiMatch) {
    const num = numberedEmojiMatch[1].charAt(0)
    const title = numberedEmojiMatch[2]
    return (
      <div key={key} className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg px-5 py-3 border-l-4 border-teal-500 mt-4 mb-1">
        <div className="flex items-center gap-3">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center font-bold text-sm">
            {num}
          </span>
          <h4 className="text-base font-bold text-slate-900">
            {title}
          </h4>
        </div>
      </div>
    )
  }

  // Handle emoji indicators — render with icons instead of raw emoji
  // Match any emoji prefix that exists in our icon map, plus common emoji patterns
  const emojiPrefixMatch = text.match(/^([\p{Emoji_Presentation}\p{Emoji}\uFE0F]+)\s*(.*)/u)

  if (emojiPrefixMatch) {
    const rawEmoji = emojiPrefixMatch[1]
    const content = emojiPrefixMatch[2]
    // Try exact match first, then try without variant selector
    const emoji = EMOJI_ICON_MAP[rawEmoji] ? rawEmoji : Object.keys(EMOJI_ICON_MAP).find(k => rawEmoji.startsWith(k))

    if (emoji && EMOJI_ICON_MAP[emoji]) {
      return (
        <div key={key} className="flex items-start gap-3 bg-white rounded-lg p-4 border border-slate-200">
          <EmojiIcon emoji={emoji} />
          <p className="text-[15px] text-slate-700 leading-relaxed flex-1">
            {parseBoldText(content)}
          </p>
        </div>
      )
    }
  }

  // Standard paragraph with safe bold rendering
  return (
    <p key={key} className="text-[15px] text-slate-700 leading-relaxed">
      {parseBoldText(text)}
    </p>
  )
}

function renderPathwaySection(text: string, key: string) {
  const lines = text.split('\n').filter(line => line.trim())
  if (lines.length === 0) return null

  const title = lines[0]
  const contentLines = lines.slice(1)

  const sections: Array<{ label: string; content: string[] }> = []
  let currentLabel = ''
  let currentContent: string[] = []

  contentLines.forEach(line => {
    if (line.match(/^(Mechanism|Target|Progressive Loading|Intervention|Key Reference):/)) {
      if (currentLabel) {
        sections.push({ label: currentLabel, content: currentContent })
      }
      const match = line.match(/^([^:]+):(.*)/)
      currentLabel = match?.[1] || ''
      currentContent = match?.[2] ? [match[2].trim()] : []
    } else if (currentLabel) {
      currentContent.push(line)
    }
  })

  if (currentLabel) {
    sections.push({ label: currentLabel, content: currentContent })
  }

  return (
    <div key={key} className="space-y-4">
      <h3 className="text-lg font-bold text-slate-900 mt-6 mb-2">
        {title}
      </h3>

      {sections.map((section, idx) => (
        <div key={idx} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-blue-600 px-5 py-3">
            <h4 className="text-base font-bold text-white uppercase tracking-wide">
              {section.label}
            </h4>
          </div>

          <div className="px-5 py-4 bg-slate-50">
            {section.content.map((line, lineIdx) => {
              if (line.trim().startsWith('•')) {
                return (
                  <div key={lineIdx} className="flex items-start gap-2 mt-2 first:mt-0">
                    <span className="text-indigo-500 mt-1 font-bold">•</span>
                    <span className="text-[15px] text-slate-700 leading-relaxed flex-1">
                      {parseBoldText(line.replace(/^•\s*/, ''))}
                    </span>
                  </div>
                )
              }
              return (
                <p key={lineIdx} className="text-[15px] text-slate-700 leading-relaxed mt-2 first:mt-0">
                  {parseBoldText(line)}
                </p>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function renderMajorSection(text: string, key: string) {
  const lines = text.split('\n').filter(line => line.trim())
  if (lines.length === 0) return null

  const headerLine = lines[0]
  const contentLines = lines.slice(1)

  // Extract emoji and title from header — render icon instead of emoji
  const emojiMatch = headerLine.match(/^([🎯⛓📅✅💡📚][\uFE0F]?)\s*(.+)/u)
  const emoji = emojiMatch?.[1] || ''
  const title = emojiMatch?.[2] || headerLine

  return (
    <div key={key} className="bg-slate-100 rounded-xl p-6 border-2 border-slate-300">
      <div className="flex items-center gap-3 mb-4">
        {emoji && <EmojiIcon emoji={emoji} size="lg" />}
        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
      </div>
      <div className="bg-white rounded-lg p-4 space-y-3">
        {contentLines.map((line, idx) => (
          <p key={idx} className="text-[15px] text-slate-700 leading-relaxed">
            {line}
          </p>
        ))}
      </div>
    </div>
  )
}

function renderTable(text: string, key: string) {
  const lines = text.split('\n').filter(line => line.trim())

  // Check if first line is emoji table title — render icon instead
  const hasEmojiTitle = lines[0] && (lines[0].startsWith('📊') || lines[0].startsWith('📋'))
  const emojiTitle = hasEmojiTitle ? lines[0] : null
  const titleEmoji = emojiTitle?.match(/^(📊|📋)/)?.[0] || null

  const headerIndex = lines.findIndex(line => line.includes('|'))
  if (headerIndex === -1) return null

  const headerLine = lines[headerIndex]
  const headers = headerLine.split('|').map(h => h.trim()).filter(Boolean)

  const separatorIndex = lines.findIndex(line => line.includes('──') || line.includes('---'))
  if (separatorIndex === -1) return null

  const dataLines = lines.slice(separatorIndex + 1)

  const rows: Array<{ type: 'category' | 'data', content: string[] }> = []

  dataLines.forEach(line => {
    if (line.includes('|')) {
      const cells = line.split('|').map(cell => cell.trim()).filter(Boolean)
      rows.push({ type: 'data', content: cells })
    } else if (line.trim()) {
      rows.push({ type: 'category', content: [line.trim()] })
    }
  })

  return (
    <div key={key} className="my-6">
      {emojiTitle && (
        <div className="flex items-start gap-3 bg-white rounded-t-lg p-4 border-x-2 border-t-2 border-slate-200">
          {titleEmoji && <EmojiIcon emoji={titleEmoji} />}
          <p className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            {emojiTitle.replace(/^(📊|📋)\s*/, '').replace(/:$/, '')}
          </p>
        </div>
      )}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle px-4 sm:px-0">
          <table className={`min-w-full border-collapse bg-white ${emojiTitle ? '' : 'rounded-lg'} overflow-hidden shadow-sm`}>
          <thead>
            <tr className="bg-gradient-to-r from-teal-500 to-blue-500">
              {headers.map((header, i) => (
                <th
                  key={i}
                  className="px-4 py-3 text-left text-sm font-bold text-white border-r border-white/20 last:border-r-0"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => {
              if (row.type === 'category') {
                return (
                  <tr key={rowIndex} className="bg-slate-100">
                    <td
                      colSpan={headers.length}
                      className="px-4 py-2 text-sm font-bold text-slate-900 uppercase tracking-wide"
                    >
                      {row.content[0]}
                    </td>
                  </tr>
                )
              } else {
                return (
                  <tr
                    key={rowIndex}
                    className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                  >
                    {row.content.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="px-4 py-3 text-sm text-slate-700 border-r border-slate-200 last:border-r-0"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                )
              }
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}
