import type { ReactNode } from 'react'

/**
 * Shared chrome for every EP-course infographic — a bordered, softly-tinted card
 * with an eyebrow, title, the diagram itself (announced as a single img to AT via
 * aria-label), and a one-line caption. Keeps all five infographics visually
 * consistent (the "instrument-grade" look) without repeating markup.
 */
export function InfographicFrame({
  eyebrow,
  title,
  caption,
  ariaLabel,
  children,
}: {
  eyebrow: string
  title: string
  caption: string
  ariaLabel: string
  children: ReactNode
}) {
  return (
    <figure className="my-6 w-full">
      <div className="rounded-2xl border border-[#cfe3e4] bg-gradient-to-b from-white to-[#f6fafa] p-5 sm:p-6 shadow-sm">
        <div className="mb-4 flex items-start gap-2.5">
          <span className="mt-0.5 h-5 w-1 flex-shrink-0 rounded-full bg-[#0d7377]" />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#0d7377]">
              {eyebrow}
            </p>
            <h4 className="text-base sm:text-lg font-bold leading-tight text-[#16282b]">
              {title}
            </h4>
          </div>
        </div>
        <div role="img" aria-label={ariaLabel}>
          {children}
        </div>
        <figcaption className="mt-3 text-[13px] italic leading-snug text-[#4a6a6e]">
          {caption}
        </figcaption>
      </div>
    </figure>
  )
}
