/**
 * "Unique Visitors" must count VISITORS.
 *
 * The admin dashboard card labelled "Unique Visitors" counted unique SESSION
 * ids, and divided session-bounces by that same number to produce a "bounce
 * rate". A clinician who came back three times in a week was three visitors,
 * three chances to bounce, and three sessions' worth of denominator.
 *
 * uniques and bounces now key on the persistent visitorId — and they must move
 * TOGETHER, or the rate stops being a ratio of like to like. That lockstep is
 * what these tests hold.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import {
  visitorKeyOf,
  countUniqueVisitors,
  countBounceVisitors,
} from '@/lib/analytics-visitor-scope'

const pv = (sessionId: string, visitorId?: string) => ({
  eventType: 'page_view',
  sessionId,
  eventData: visitorId ? { visitorId } : {},
})

describe('visitor scope', () => {
  it('one person across three sessions is ONE unique visitor', () => {
    const events = [pv('s1', 'v-abc'), pv('s2', 'v-abc'), pv('s3', 'v-abc')]
    expect(countUniqueVisitors(events)).toBe(1)
    // The old behaviour, kept explicit so a regression is unmistakable.
    expect(new Set(events.map((e) => e.sessionId)).size).toBe(3)
  })

  it('three people are three unique visitors', () => {
    expect(countUniqueVisitors([pv('s1', 'v-a'), pv('s2', 'v-b'), pv('s3', 'v-c')])).toBe(3)
  })

  it('a returning one-page visitor bounces ONCE, not once per visit', () => {
    const events = [pv('s1', 'v-abc'), pv('s2', 'v-abc'), pv('s3', 'v-abc')]
    // Three one-pageview sessions, one person who saw three pages in total.
    expect(countBounceVisitors(events)).toBe(0)
    expect(countUniqueVisitors(events)).toBe(1)
  })

  it('bounce rate can never exceed 100% — bounces and uniques share a scope', () => {
    const events = [
      pv('s1', 'v-a'), pv('s2', 'v-a'), // returning, 2 pages total → not a bounce
      pv('s3', 'v-b'),                  // one page → bounce
      pv('s4', 'v-c'), pv('s5', 'v-c'),
    ]
    const bounces = countBounceVisitors(events)
    const uniques = countUniqueVisitors(events)
    expect(bounces).toBe(1)
    expect(uniques).toBe(3)
    expect(bounces / uniques).toBeLessThanOrEqual(1)
  })

  it('a session whose events are only PARTLY stamped is still ONE visitor', () => {
    // Live data (Aug 2026): most stored rows predate visitorId, so a session can
    // hold both stamped and unstamped events. Keyed per event that visit counted
    // twice and "unique visitors" came out ABOVE the session count — the exact
    // inverse of the fix. The session resolves to one id.
    const events = [
      pv('s1'),            // unstamped (legacy helper / older row)
      pv('s1', 'v-abc'),   // stamped
      pv('s1'),
    ]
    expect(countUniqueVisitors(events)).toBe(1)
  })

  it('unique visitors can never exceed the session count', () => {
    const events = [pv('s1'), pv('s1', 'v-a'), pv('s2', 'v-a'), pv('s3'), pv('s3', 'v-b')]
    const sessions = new Set(events.map((e) => e.sessionId)).size
    expect(countUniqueVisitors(events)).toBeLessThanOrEqual(sessions)
  })

  it('legacy rows with no visitorId fall back to session scope, never collapse together', () => {
    const events = [pv('s1'), pv('s2'), pv('s3')]
    expect(countUniqueVisitors(events)).toBe(3)
    expect(visitorKeyOf(pv('s1'))).toBe('s:s1')
    expect(visitorKeyOf(pv('s1', ''))).toBe('s:s1')
  })

  it('non-pageview events count toward a visitor but never toward bounces', () => {
    const events = [
      pv('s1', 'v-a'),
      { eventType: 'scroll_depth', sessionId: 's1', eventData: { visitorId: 'v-a' } },
      { eventType: 'page_exit', sessionId: 's1', eventData: { visitorId: 'v-a' } },
    ]
    expect(countUniqueVisitors(events)).toBe(1)
    expect(countBounceVisitors(events)).toBe(1) // one pageview only → a bounce
  })

  it('legacy "pageview" event type is counted alongside "page_view"', () => {
    expect(countBounceVisitors([{ eventType: 'pageview', sessionId: 's1', eventData: { visitorId: 'v-a' } }])).toBe(1)
  })
})

describe('the dashboard labels match the arithmetic', () => {
  const page = readFileSync(join(__dirname, '..', 'app', 'admin', 'analytics', 'page.tsx'), 'utf8')
  const route = readFileSync(join(__dirname, '..', 'app', 'api', 'analytics', 'data', 'route.ts'), 'utf8')

  it('the API builds uniques from visitors, not session ids', () => {
    expect(route).toMatch(/uniques:\s*\{\s*value: countUniqueVisitors\(cur\)/)
    expect(route).not.toMatch(/countUniqueSessionIds/)
    expect(route).toMatch(/const countBounces = countBounceVisitors/)
  })

  it('nothing divided by uniques is still labelled "session"', () => {
    expect(page).toMatch(/label="Unique Visitors"/)
    // totaltime ÷ uniques is time per VISITOR — the card used to say "Avg. Session".
    expect(page).not.toMatch(/label="Avg\. Session"/)
    expect(page).toMatch(/label="Avg\. Time \/ Visitor"/)
    expect(page).not.toMatch(/average session of/)
  })
})
