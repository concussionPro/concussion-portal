'use client'

import { CheckCircle2 } from 'lucide-react'

interface DynamicContentRendererProps {
  content: string[]
  sectionIndex: number
}

export function DynamicContentRenderer({ content, sectionIndex }: DynamicContentRendererProps) {
  // Pre-process: Group table rows together AND group pathway sections
  const processedContent: string[] = []
  let i = 0

  while (i < content.length) {
    const line = content[i]

    // Check if this line is an emoji table header (includes both emoji AND pipes)
    const isEmojiTableHeader = (line.startsWith('📊') || line.startsWith('📋')) && line.includes(':')

    // Check if NEXT line starts a table (has pipes + line after that is separator)
    const nextLineIsTableHeader = i + 1 < content.length && content[i + 1].includes('|')
    const lineAfterNextIsSeparator = i + 2 < content.length && (content[i + 2].includes('──') || content[i + 2].includes('---'))

    // Check if this is a major section header (emoji + number + title)
    // Simple check: starts with emoji (ignoring variation selectors) and has " N. " pattern
    const startsWithTargetEmoji = line.charCodeAt(0) === 0x1F3AF || // 🎯
                                   line.charCodeAt(0) === 0x26D3 ||  // ⛓
                                   line.charCodeAt(0) === 0x1F4C5 || // 📅
                                   line.charCodeAt(0) === 0x2705 ||  // ✅
                                   line.charCodeAt(0) === 0x1F4A1 || // 💡
                                   line.charCodeAt(0) === 0x1F4DA    // 📚
    const isMajorSection = startsWithTargetEmoji && / \d+\. /.test(line)

    // Check if this is a pathway section (A., B., C. followed by content with Mechanism:, Target:, etc.)
    const isPathwayHeader = /^[A-C]\.\s+THE\s+/.test(line)

    if (isPathwayHeader) {
      // Group the pathway header with all its content (Mechanism, Target, Intervention, etc.)
      const pathwayLines = [line]
      i++

      // Collect lines until we hit another pathway header or major section
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

      processedContent.push('__PATHWAY__\n' + pathwayLines.join('\n'))
    } else if (isMajorSection) {
      // Group major section with following intro paragraphs (until bullets/checklist/tables/pathways)
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

      processedContent.push('__SECTION__\n' + sectionLines.join('\n'))
    } else if (isEmojiTableHeader && nextLineIsTableHeader && lineAfterNextIsSeparator) {
      // Include emoji header with the table
      const tableLines = [line, content[i + 1], content[i + 2]] // emoji + header + separator
      i += 3

      // Collect all subsequent data rows (stop only at new emoji HEADINGS with colons)
      while (i < content.length) {
        const currentLine = content[i]
        // Stop only at new section headings (emoji + colon at end)
        const isNewSection = (currentLine.startsWith('🔹') || currentLine.startsWith('📊') || currentLine.startsWith('💡') || currentLine.startsWith('🔴')) &&
                             currentLine.includes(':') &&
                             !currentLine.includes('|')
        if (currentLine.trim() === '' || isNewSection) {
          break
        }
        tableLines.push(currentLine)
        i++
      }

      processedContent.push(tableLines.join('\n'))
    } else if (line.includes('|') && i + 1 < content.length && (content[i + 1].includes('──') || content[i + 1].includes('---'))) {
      // Regular table without emoji header
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

      processedContent.push(tableLines.join('\n'))
    } else {
      processedContent.push(line)
      i++
    }
  }

  // Render all content in single column with consistent spacing
  return (
    <div className="space-y-6">
      {processedContent.map((paragraph, index) => renderParagraph(paragraph, `content-${index}`))}
    </div>
  )
}

function renderParagraph(text: string, key: string) {
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
        <span className="text-2xl flex-shrink-0">☐</span>
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
        <span className="text-xl flex-shrink-0 text-green-600">✓</span>
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
              <span className="text-[15px] text-slate-700 leading-relaxed">{cleanItem}</span>
            </div>
          )
        })}
      </div>
    )
  }

  // Handle regular bullet points
  if (text.trim().startsWith('•') || text.trim().startsWith('-') || text.trim().startsWith('*')) {
    const items = text.split(/\n/).filter(line => line.trim())
    return (
      <ul key={key} className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
            <span className="text-[15px] text-slate-700 leading-relaxed">
              {item.replace(/^[•\-\*]\s*/, '')}
            </span>
          </li>
        ))}
      </ul>
    )
  }

  // Handle definition-style content (LABEL: description)
  const definitionMatch = text.match(/^([A-Z][A-Z\s&]+):\s*(.+)/)
  if (definitionMatch && definitionMatch[1].length < 50) {
    const [, label, content] = definitionMatch
    return (
      <div key={key} className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500 my-3">
        <div className="font-bold text-blue-900 text-sm uppercase tracking-wide mb-2">
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

  // SECURITY FIX: Safe text rendering without dangerouslySetInnerHTML
  // Parse bold text **like this** into React components
  const parseBoldText = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = []
    const regex = /\*\*(.*?)\*\*/g
    let lastIndex = 0
    let match

    while ((match = regex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index))
      }
      // Add the bold text
      parts.push(
        <strong key={match.index} className="font-semibold text-slate-900">
          {match[1]}
        </strong>
      )
      lastIndex = regex.lastIndex
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex))
    }

    return parts.length > 0 ? parts : [text]
  }

  // Handle emoji indicators
  const emojiMatch = text.match(/^(🔹|📊|💡|⚡|🧠|🔄|⚠️|✅)\s*(.*)/)

  if (emojiMatch) {
    const emoji = emojiMatch[1]
    const content = emojiMatch[2]

    return (
      <div key={key} className="flex items-start gap-3 bg-white rounded-lg p-4 border border-slate-200">
        <span className="text-2xl flex-shrink-0">{emoji}</span>
        <p className="text-[15px] text-slate-700 leading-relaxed flex-1">
          {parseBoldText(content)}
        </p>
      </div>
    )
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

  const title = lines[0] // "A. THE VESTIBULAR & OCULOMOTOR PATHWAY"
  const contentLines = lines.slice(1)

  // Group content by labels (Mechanism:, Target:, etc.)
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
      {/* Pathway title */}
      <h3 className="text-lg font-bold text-slate-900 mt-6 mb-2">
        {title}
      </h3>

      {/* Each section as a separate card like STRESS MANAGEMENT example */}
      {sections.map((section, idx) => (
        <div key={idx} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          {/* Colored header bar with label */}
          <div className="bg-gradient-to-r from-indigo-500 to-blue-600 px-5 py-3">
            <h4 className="text-base font-bold text-white uppercase tracking-wide">
              {section.label}
            </h4>
          </div>

          {/* White content area */}
          <div className="px-5 py-4 bg-slate-50">
            {section.content.map((line, lineIdx) => {
              if (line.trim().startsWith('•')) {
                return (
                  <div key={lineIdx} className="flex items-start gap-2 mt-2 first:mt-0">
                    <span className="text-indigo-500 mt-1 font-bold">•</span>
                    <span className="text-[15px] text-slate-700 leading-relaxed flex-1">
                      {line.replace(/^•\s*/, '')}
                    </span>
                  </div>
                )
              }
              return (
                <p key={lineIdx} className="text-[15px] text-slate-700 leading-relaxed mt-2 first:mt-0">
                  {line}
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

  // Extract emoji and title from header
  // Handle emoji with variation selectors
  const emojiMatch = headerLine.match(/^([🎯⛓📅✅💡📚][\uFE0F]?)\s*(.+)/u)
  const emoji = emojiMatch?.[1] || ''
  const title = emojiMatch?.[2] || headerLine

  return (
    <div key={key} className="bg-slate-100 rounded-xl p-6 border-2 border-slate-300">
      <div className="flex items-center gap-3 mb-4">
        {emoji && <span className="text-3xl">{emoji}</span>}
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

  // Check if first line is emoji table title
  const hasEmojiTitle = lines[0] && (lines[0].startsWith('📊') || lines[0].startsWith('📋'))
  const emojiTitle = hasEmojiTitle ? lines[0] : null

  // Find header row (first line with pipes)
  const headerIndex = lines.findIndex(line => line.includes('|'))
  if (headerIndex === -1) return null

  const headerLine = lines[headerIndex]
  const headers = headerLine.split('|').map(h => h.trim()).filter(Boolean)

  // Find separator line
  const separatorIndex = lines.findIndex(line => line.includes('──') || line.includes('---'))
  if (separatorIndex === -1) return null

  // Get all rows after separator
  const dataLines = lines.slice(separatorIndex + 1)

  // Process rows - some are categories (no pipes), some are data (with pipes)
  const rows: Array<{ type: 'category' | 'data', content: string[] }> = []

  dataLines.forEach(line => {
    if (line.includes('|')) {
      // Data row
      const cells = line.split('|').map(cell => cell.trim()).filter(Boolean)
      rows.push({ type: 'data', content: cells })
    } else if (line.trim()) {
      // Category row (no pipes)
      rows.push({ type: 'category', content: [line.trim()] })
    }
  })

  return (
    <div key={key} className="my-6">
      {emojiTitle && (
        <div className="flex items-start gap-3 bg-white rounded-t-lg p-4 border-x-2 border-t-2 border-slate-200">
          <span className="text-2xl flex-shrink-0">{emojiTitle.match(/^(📊|📋)/)?.[0]}</span>
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
                // Category header spanning all columns
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
                // Data row
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
