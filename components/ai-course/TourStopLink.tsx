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
}

/**
 * Single stop in the 3-stop guided tour on /courses/private-preview.
 *
 * On click, fires demo_resource_clicked with stop=N + href so Zac can
 * see which stops Paul actually explored (and in what order).
 */
export function TourStopLink({ number, href, title, body, highlight }: TourStopLinkProps) {
  const onClick = () => {
    trackDemoEvent(DEMO_EVENTS.RESOURCE_CLICKED, {
      resource: 'tour-stop',
      stop: number,
      href,
      title,
    }).catch(() => {})
  }
  return (
    <li>
      <Link
        href={href}
        onClick={onClick}
        className="group flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 hover:border-accent/40 hover:shadow-sm transition-all"
      >
        <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold shrink-0">
          {number}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground leading-tight mb-0.5">{title}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
          <p className="text-[11px] text-accent font-semibold mt-1">{highlight}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-accent shrink-0 mt-1" />
      </Link>
    </li>
  )
}
