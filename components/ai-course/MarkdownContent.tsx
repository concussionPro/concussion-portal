'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Renders markdown course content with prose styling consistent with the
 * portal. Tables, lists, blockquotes, code blocks all supported via
 * remark-gfm.
 */
export function MarkdownContent({ source }: { source: string }) {
  return (
    <article className="prose prose-slate max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3 prose-p:text-[15px] prose-p:leading-relaxed prose-li:text-[15px] prose-li:leading-relaxed prose-strong:text-foreground prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-blockquote:border-accent prose-blockquote:bg-slate-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-md prose-blockquote:not-italic prose-code:bg-slate-100 prose-code:text-slate-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:hidden prose-code:after:hidden prose-table:text-sm prose-th:bg-slate-50 prose-th:text-left">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{source}</ReactMarkdown>
    </article>
  )
}
