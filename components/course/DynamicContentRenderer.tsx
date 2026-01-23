'use client'

import { CheckCircle2, AlertTriangle, Info, Lightbulb, Brain, Activity } from 'lucide-react'

interface DynamicContentRendererProps {
  content: string[]
  sectionIndex: number
}

export function DynamicContentRenderer({ content, sectionIndex }: DynamicContentRendererProps) {
  // Pre-process: Group table rows together
  const processedContent: string[] = []
  let i = 0

  while (i < content.length) {
    const line = content[i]

    // Check if this starts a table (has header with pipes + next line is separator)
    const hasTableHeader = line.includes('|') && i + 1 < content.length
    const nextLineIsSeparator = i + 1 < content.length && (content[i + 1].includes('──') || content[i + 1].includes('---'))

    if (hasTableHeader && nextLineIsSeparator) {
      // Start collecting table rows
      const tableLines = [line, content[i + 1]] // header + separator
      i += 2

      // Collect all subsequent table-related lines
      while (i < content.length) {
        const currentLine = content[i]
        // Stop if we hit a non-table indicator (emoji heading, empty, or new section)
        if (currentLine.trim() === '' ||
            (currentLine.startsWith('🔹') || currentLine.startsWith('📊') || currentLine.startsWith('💡')) && !currentLine.includes('|')) {
          break
        }
        tableLines.push(currentLine)
        i++
      }

      // Join all table lines into single string
      processedContent.push(tableLines.join('\n'))
    } else {
      processedContent.push(line)
      i++
    }
  }

  // Split content into chunks for varied layout
  const chunks: string[][] = []
  let currentChunk: string[] = []

  processedContent.forEach((paragraph, index) => {
    currentChunk.push(paragraph)

    // Create a new chunk every 3-4 paragraphs for visual variety
    if ((index + 1) % 4 === 0 || index === processedContent.length - 1) {
      chunks.push([...currentChunk])
      currentChunk = []
    }
  })

  return (
    <div className="space-y-6">
      {chunks.map((chunk, chunkIndex) => {
        // Alternate between different layouts
        const layoutType = chunkIndex % 3

        if (layoutType === 0) {
          // Standard single column
          return (
            <div key={chunkIndex} className="space-y-4">
              {chunk.map((para, pIndex) => renderParagraph(para, `${chunkIndex}-${pIndex}`))}
            </div>
          )
        } else if (layoutType === 1 && chunk.length >= 2) {
          // Side-by-side cards
          return (
            <div key={chunkIndex} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {chunk.map((para, pIndex) => (
                <div
                  key={`${chunkIndex}-${pIndex}`}
                  className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-5 border border-slate-200"
                >
                  {renderParagraph(para, `${chunkIndex}-${pIndex}`)}
                </div>
              ))}
            </div>
          )
        } else {
          // Highlighted box with icon
          const iconType = chunkIndex % 4
          const IconComponent = [Brain, Activity, Info, Lightbulb][iconType]
          const colors = [
            { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600' },
            { bg: 'bg-teal-50', border: 'border-teal-200', icon: 'text-teal-600' },
            { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'text-purple-600' },
            { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-600' },
          ][iconType]

          return (
            <div
              key={chunkIndex}
              className={`${colors.bg} border-2 ${colors.border} rounded-xl p-6 relative overflow-hidden`}
            >
              <div className={`absolute top-4 right-4 w-10 h-10 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center`}>
                <IconComponent className={`w-5 h-5 ${colors.icon}`} strokeWidth={2} />
              </div>
              <div className="space-y-4 pr-14">
                {chunk.map((para, pIndex) => renderParagraph(para, `${chunkIndex}-${pIndex}`))}
              </div>
            </div>
          )
        }
      })}
    </div>
  )
}

function renderParagraph(text: string, key: string) {
  // Handle tables - check for pipes and separator
  if (text.includes('|') && (text.includes('───') || text.includes('---'))) {
    return renderTable(text, key)
  }

  // Handle bullet points
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

  // Handle headers (markdown-style)
  if (text.startsWith('##')) {
    return (
      <h4 key={key} className="text-lg font-bold text-slate-900 mt-6 mb-3">
        {text.replace(/^##\s*/, '')}
      </h4>
    )
  }

  // Handle bold emphasis
  const formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>')

  // Handle emoji indicators
  const hasEmoji = /^(🔹|📊|💡|⚡|🧠|🔄|⚠️|✅)/.test(text)

  if (hasEmoji) {
    return (
      <div key={key} className="flex items-start gap-3 bg-white rounded-lg p-4 border border-slate-200">
        <span className="text-2xl flex-shrink-0">{text.match(/^(🔹|📊|💡|⚡|🧠|🔄|⚠️|✅)/)?.[0]}</span>
        <p
          className="text-[15px] text-slate-700 leading-relaxed flex-1"
          dangerouslySetInnerHTML={{ __html: formatted.replace(/^(🔹|📊|💡|⚡|🧠|🔄|⚠️|✅)\s*/, '') }}
        />
      </div>
    )
  }

  // Standard paragraph
  return (
    <p
      key={key}
      className="text-[15px] text-slate-700 leading-relaxed"
      dangerouslySetInnerHTML={{ __html: formatted }}
    />
  )
}

function renderTable(text: string, key: string) {
  const lines = text.split('\n').filter(line => line.trim())

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
    <div key={key} className="overflow-x-auto my-6">
      <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm">
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
  )
}
