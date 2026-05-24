'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { DEMO_EVENTS, trackDemoEvent } from '@/lib/analytics-demo'

interface TourStopLinkProps {
  number: 1 | 2 | 3
  href: string
  title: string
  body: string
  highlight: string
  /** 'hero' renders larger + accent gradient; 'compact' renders smaller white tile */
  size?: 'hero' | 'compact'
}

/**
 * Bento tile in the guided tour on /courses/private-preview.
 *
 * Two visual sizes — 'hero' for the lead stop, 'compact' for the
 * supporting stops. Renders inside a CSS grid that the parent page
 * configures (Stop 1 hero takes col-span-2 + row-span-2; Stops 2 + 3
 * compact take col-span-1 each).
 *
 * On click, fires demo_resource_clicked with stop=N + href so Zac can
 * see which stops the user actually explored (and in what order).
 */
export function TourStopLink({ number, href, title, body, highlight, size = 'compact' }: TourStopLinkProps) {
  const onClick = () => {
    trackDemoEvent(DEMO_EVENTS.RESOURCE_CLICKED, {
      resource: 'tour-stop',
      stop: number,
      href,
      title,
    }).catch(() => {})
  }

  if (size === 'hero') {
    return (
      <Link
        href={href}
        onClick={onClick}
        className="group flex flex-col rounded-2xl border-2 border-accent/30 bg-gradient-to-br from-accent/[0.06] via-white to-white p-6 hover:border-accent/50 hover:shadow-md transition-all"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="w-11 h-11 rounded-full bg-accent text-white flex items-center justify-center text-base font-bold">
            {number}
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
        </div>
        <p className="text-xl font-bold text-foreground leading-tight mb-2">{title}</p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">{body}</p>
        <p className="text-[12px] text-accent font-semibold leading-snug">{highlight}</p>
      </Link>
    )
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 hover:border-accent/40 hover:shadow-sm transition-all"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-sm font-bold">
          {number}
        </div>
        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
      </div>
      <p className="text-sm font-bold text-foreground leading-tight mb-1.5">{title}</p>
      <p className="text-xs text-muted-foreground leading-relaxed mb-3 flex-1">{body}</p>
      <p className="text-[11px] text-accent font-semibold leading-snug">{highlight}</p>
    </Link>
  )
}
