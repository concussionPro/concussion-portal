/**
 * Self-cleaning analytics findings engine — the pure analysis layer.
 *
 * Money-anchored work orders, small-n discipline (absolute counts, never
 * percentages of tiny bases), visitor stitching via eventData.visitorId.
 */
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/db', () => ({ sql: vi.fn() }))

import { analyze } from '@/lib/analytics-findings'

type Ev = Parameters<typeof analyze>[0][number]

let n = 0
function ev(partial: Partial<Ev> & { type: string }): Ev {
  n++
  return {
    data: {},
    sessionId: partial.sessionId ?? `sess-${n}`,
    ts: 1000 + n,
    referrer: null,
    path: null,
    ...partial,
  } as Ev
}

function pricingVisitor(id: string): Ev[] {
  return [
    ev({ type: 'page_view', path: '/pricing', sessionId: id, data: { visitorId: id } }),
  ]
}

describe('analyze — money anchoring', () => {
  it('flags pricing traffic with zero checkout intent (MONEY LEAK)', () => {
    const events = Array.from({ length: 9 }, (_, i) => pricingVisitor(`v${i}`)).flat()
    const f = analyze(events)
    expect(f.map((x) => x.key)).toContain('pricing-no-intent')
    expect(f.find((x) => x.key === 'pricing-no-intent')!.severity).toBe(1)
  })

  it('small-n discipline: 3 pricing viewers do NOT trigger the leak', () => {
    const events = Array.from({ length: 3 }, (_, i) => pricingVisitor(`v${i}`)).flat()
    expect(analyze(events).map((x) => x.key)).not.toContain('pricing-no-intent')
  })

  it('visitor stitching: same visitorId across sessions counts ONCE', () => {
    // 9 sessions, but all the same persistent visitor → 1 visitor, no finding
    const events = Array.from({ length: 9 }, (_, i) =>
      ev({ type: 'page_view', path: '/pricing', sessionId: `sess-${i}`, data: { visitorId: 'same-person' } }),
    )
    expect(analyze(events).map((x) => x.key)).not.toContain('pricing-no-intent')
  })

  it('flags tours that never book (ACC pipeline)', () => {
    const events = [
      ev({ type: 'demo_tour_start', sessionId: 'server_demo_1' }),
      ev({ type: 'demo_tour_start', sessionId: 'server_demo_2' }),
      ev({ type: 'demo_tour_start', sessionId: 'server_demo_3' }),
    ]
    const f = analyze(events)
    expect(f.map((x) => x.key)).toContain('tour-no-booking')
  })

  it('cal clicks clear the tour-no-booking finding (self-cleaning input)', () => {
    const events = [
      ev({ type: 'demo_tour_start', sessionId: 'server_demo_1' }),
      ev({ type: 'demo_tour_start', sessionId: 'server_demo_2' }),
      ev({ type: 'demo_tour_start', sessionId: 'server_demo_3' }),
      ev({ type: 'cal_click', data: { visitorId: 'p1' } }),
    ]
    expect(analyze(events).map((x) => x.key)).not.toContain('tour-no-booking')
  })

  it('reports AI/LLM referred visitors as a GEO signal', () => {
    const events = [
      ev({ type: 'page_view', path: '/blog/x', referrer: 'https://chatgpt.com/', data: { visitorId: 'a1' } }),
    ]
    const f = analyze(events)
    const geo = f.find((x) => x.key === 'geo-llm-arriving')
    expect(geo).toBeTruthy()
    expect(geo!.severity).toBe(3)
  })

  it('quiet site produces zero findings — nothing invented', () => {
    expect(analyze([])).toEqual([])
  })
})
