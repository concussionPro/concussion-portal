'use client'

import { trackEvent } from '@/lib/analytics'

/**
 * Outbound link with intent tracking — for the clicks that ARE the conversion
 * on B2B surfaces (cal.com bookings, external CTAs) but are invisible to
 * pageview analytics because the destination is off-site. Fire-and-forget:
 * navigation is never delayed.
 */
export function TrackedOutbound({
  href,
  event,
  source,
  className,
  style,
  children,
}: {
  href: string
  /** Event type, e.g. 'cal_click' */
  event: string
  /** Where on the page the click happened, e.g. 'acc-hero' */
  source: string
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={style}
      onClick={() => void trackEvent(event, { source, href })}
    >
      {children}
    </a>
  )
}
