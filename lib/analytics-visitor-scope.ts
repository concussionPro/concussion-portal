/**
 * VISITOR-scoped counting for the admin analytics dashboard.
 *
 * The dashboard's "Unique Visitors" card counted unique SESSION ids: one
 * clinician who came back three times in a week read as three visitors, and the
 * bounce rate divided session-bounces by that same inflated number. Since the
 * analytics provider started stamping a persistent `visitorId` on every event
 * (getVisitorContext() in lib/analytics.ts), the honest count is available —
 * these helpers are it.
 *
 * uniques and bounces MUST move together: bounces ÷ uniques is only a bounce
 * RATE if both sides count the same kind of thing. That is why they live in one
 * file rather than inline in the route.
 *
 * Extracted from app/api/analytics/data/route.ts so the behaviour is testable —
 * a Next route file can only export its handlers.
 */

/** The subset of a stored analytics event these helpers need. */
export interface ScopedEvent {
  eventType: string
  eventData?: Record<string, unknown> | null
  sessionId: string
}

/** Match both 'page_view' (current client) and 'pageview' (legacy data). */
export function isPageViewEvent(e: ScopedEvent): boolean {
  return e.eventType === 'page_view' || e.eventType === 'pageview'
}

/**
 * Resolve each SESSION to one visitor id.
 *
 * Resolving per EVENT would be wrong, and measurably so: in live data most rows
 * predate visitorId (and any event sent by a helper that doesn't stamp it lacks
 * it too), so a single session can contain both stamped and unstamped events.
 * Keyed per event, that one visit yields TWO keys — `v-abc` and `s:<session>` —
 * and the "unique visitor" count comes out HIGHER than the session count it was
 * supposed to deduplicate. A session belongs to exactly one browser, so the
 * first id seen in it is the id for all of it.
 */
function sessionVisitorIds(events: ScopedEvent[]): Map<string, string> {
  const bySession = new Map<string, string>()
  for (const e of events) {
    const v = e.eventData?.visitorId
    if (typeof v === 'string' && v && !bySession.has(e.sessionId)) {
      bySession.set(e.sessionId, v)
    }
  }
  return bySession
}

/**
 * The PERSON behind an event. Falls back to a session-scoped key for sessions
 * with no visitorId anywhere in them — rows written before visitorId existed,
 * and browsers with localStorage blocked — so those degrade to the old
 * session-level counting instead of collapsing into one giant "unknown"
 * visitor. Same fallback shape as lib/analytics-findings.ts, so the dashboard
 * and the findings engine cannot disagree about who counts as one person.
 *
 * Pass `resolved` (from a whole-window pass) whenever counting a set of events;
 * the single-event form is for spot checks only.
 */
export function visitorKeyOf(e: ScopedEvent, resolved?: Map<string, string>): string {
  const fromSession = resolved?.get(e.sessionId)
  if (fromSession) return fromSession
  const v = e.eventData?.visitorId
  return typeof v === 'string' && v ? v : `s:${e.sessionId}`
}

/** Unique PEOPLE in the window. Can never exceed the session count. */
export function countUniqueVisitors(events: ScopedEvent[]): number {
  const resolved = sessionVisitorIds(events)
  return new Set(events.map((e) => visitorKeyOf(e, resolved))).size
}

/**
 * Visitors who viewed exactly ONE page in the window — the denominator-matched
 * partner to countUniqueVisitors(). A returning visitor who bounced twice is
 * one bounced visitor, not two.
 */
export function countBounceVisitors(events: ScopedEvent[]): number {
  const resolved = sessionVisitorIds(events)
  const pvPerVisitor = new Map<string, number>()
  for (const e of events) {
    if (isPageViewEvent(e)) {
      const key = visitorKeyOf(e, resolved)
      pvPerVisitor.set(key, (pvPerVisitor.get(key) ?? 0) + 1)
    }
  }
  let bounces = 0
  for (const count of pvPerVisitor.values()) {
    if (count === 1) bounces++
  }
  return bounces
}
