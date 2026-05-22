/**
 * Demo-attributed analytics. Lets you track partner-pitch behaviour
 * (e.g. what Heidi's CRO clicked through, how long they spent on which
 * page, whether they opened the killer-feature mockup) separately from
 * organic portal traffic.
 *
 * All events fire through the existing /api/analytics/track endpoint —
 * no new analytics infrastructure. The differentiator is the `demoOrg`
 * property attached to every event when the demo_org cookie is set.
 */

import { trackEvent } from './analytics'

export const DEMO_EVENTS = {
  LANDED: 'demo_landed',
  NDA_VIEWED: 'demo_nda_viewed',
  NDA_ACCEPTED: 'demo_nda_accepted',
  PAGEVIEW: 'demo_pageview',
  MODULE_OPEN: 'demo_module_open',
  QUIZ_STARTED: 'demo_quiz_started',
  QUIZ_SUBMITTED: 'demo_quiz_submitted',
  CERTIFICATE_VIEWED: 'demo_certificate_viewed',
  RESOURCE_CLICKED: 'demo_resource_clicked',
  EXTERNAL_LINK_CLICKED: 'demo_external_link_clicked',
  SECTION_COMPLETED: 'demo_section_completed',
} as const

/**
 * Read the demo_org cookie on the client. Returns null if not a demo
 * viewer.
 */
export function getDemoOrgFromCookie(): string | null {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(/(?:^|;\s*)demo_org=([^;]+)/)
  if (!m) return null
  try {
    return decodeURIComponent(m[1])
  } catch {
    return m[1]
  }
}

/**
 * Fire a demo-attributed analytics event. No-op if the visitor isn't a
 * demo viewer (so this is safe to call unconditionally from shared UI).
 */
export async function trackDemoEvent(
  eventType: (typeof DEMO_EVENTS)[keyof typeof DEMO_EVENTS],
  eventData: Record<string, unknown> = {}
): Promise<void> {
  const demoOrg = getDemoOrgFromCookie()
  if (!demoOrg) return
  await trackEvent(eventType, { ...eventData, demoOrg, isDemo: true })
}
