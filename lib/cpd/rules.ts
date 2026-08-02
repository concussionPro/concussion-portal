/**
 * CPD rules engine — pure functions over (pack, activities, today).
 * No I/O, no dates-from-environment: `today` is always injected so every
 * computation is reproducible in tests (fixtures in tests/cpd-rules.test.ts).
 */

import type { CpdPack } from './packs'

export interface CpdActivityInput {
  /** ISO date (yyyy-mm-dd) the activity occurred. */
  date: string
  hours: number
  /** Points where the pack is points-based; defaults to hours (1 pt/hr). */
  points?: number | null
  /** Category tags (pack category ids and artifact categories). */
  categories: string[]
  status: 'draft' | 'confirmed'
}

export interface LineStatus {
  id: string
  label: string
  required: number
  logged: number
  shortfall: number
  unit: string
  per: 'cycle' | 'year'
  sourceUrl: string
}

export interface ArtifactStatus {
  id: string
  label: string
  done: boolean
  sourceUrl: string
}

export interface CycleWindow {
  /** Inclusive start / exclusive end, ISO dates. */
  start: string
  end: string
  /** The sub-window for `per: 'year'` lines and annual artifacts. */
  yearStart: string
  yearEnd: string
  /** Next renewal/window-end date the countdown runs to. */
  renewalDate: string
  daysLeft: number
}

export interface RegistrationStatus {
  packId: string
  window: CycleWindow
  lines: LineStatus[]
  artifacts: ArtifactStatus[]
  overall: 'green' | 'amber' | 'red'
  totalShortfall: number
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function addYears(d: Date, n: number): Date {
  const c = new Date(d)
  c.setUTCFullYear(c.getUTCFullYear() + n)
  return c
}

function daysBetween(a: Date, b: Date): number {
  return Math.ceil((b.getTime() - a.getTime()) / 86_400_000)
}

/** Most recent anchor date (month/day) at or before `today` (UTC). */
function lastAnchor(today: Date, month: number, day: number): Date {
  const y = today.getUTCFullYear()
  const thisYear = new Date(Date.UTC(y, month - 1, day))
  return thisYear <= today ? thisYear : new Date(Date.UTC(y - 1, month - 1, day))
}

export function computeWindow(pack: CpdPack, todayIso: string): CycleWindow {
  const today = new Date(todayIso + 'T00:00:00Z')
  const { anchorMonth, anchorDay, years, windowType, phaseYear } = pack.cycle

  // Registration year (annual anchor) — always needed for per-year lines,
  // annual artifacts, and the renewal countdown.
  const yearStart = lastAnchor(today, anchorMonth, anchorDay)
  const yearEnd = addYears(yearStart, 1)

  let start: Date
  let end: Date
  if (windowType === 'rolling') {
    end = today
    start = addYears(today, -years)
  } else if (years === 1) {
    start = yearStart
    end = yearEnd
  } else {
    // Multi-year fixed cycle phased from a known cycle-start year.
    const phase = phaseYear ?? yearStart.getUTCFullYear()
    const sinceStart = (yearStart.getUTCFullYear() - phase) % years
    const offset = ((sinceStart % years) + years) % years
    start = addYears(yearStart, -offset)
    end = addYears(start, years)
  }

  const renewalDate = windowType === 'rolling' ? yearEnd : end
  return {
    start: iso(start),
    end: iso(end),
    yearStart: iso(yearStart),
    yearEnd: iso(yearEnd),
    renewalDate: iso(renewalDate),
    daysLeft: daysBetween(today, renewalDate),
  }
}

function inWindow(dateIso: string, startIso: string, endIso: string): boolean {
  return dateIso >= startIso && dateIso < endIso
}

function value(pack: CpdPack, a: CpdActivityInput): number {
  if (pack.unit === 'points') return a.points ?? a.hours
  return a.hours
}

export function computeStatus(
  pack: CpdPack,
  activities: CpdActivityInput[],
  todayIso: string,
): RegistrationStatus {
  const window = computeWindow(pack, todayIso)
  const confirmed = activities.filter((a) => a.status === 'confirmed')

  const lines: LineStatus[] = pack.lines.map((line) => {
    const [ws, we] =
      line.per === 'year' ? [window.yearStart, window.yearEnd] : [window.start, window.end]
    const logged = confirmed
      .filter((a) => inWindow(a.date, ws, we))
      .filter((a) => (line.category === null ? true : a.categories.includes(line.category)))
      .reduce((sum, a) => sum + value(pack, a), 0)
    return {
      id: line.id,
      label: line.label,
      required: line.min,
      logged: Math.round(logged * 100) / 100,
      shortfall: Math.max(0, Math.round((line.min - logged) * 100) / 100),
      unit: pack.unit,
      per: line.per,
      sourceUrl: line.sourceUrl,
    }
  })

  const artifacts: ArtifactStatus[] = pack.artifacts.map((art) => {
    const [ws, we] =
      art.cadence === 'year' ? [window.yearStart, window.yearEnd] : [window.start, window.end]
    const done = confirmed.some(
      (a) => inWindow(a.date, ws, we) && a.categories.includes(art.category),
    )
    return { id: art.id, label: art.label, done, sourceUrl: art.sourceUrl }
  })

  const totalShortfall = lines.reduce((s, l) => s + l.shortfall, 0)
  const artifactsMissing = artifacts.some((a) => !a.done)
  const behind = totalShortfall > 0 || artifactsMissing
  const overall: RegistrationStatus['overall'] = !behind
    ? 'green'
    : window.daysLeft < 28
      ? 'red'
      : 'amber'

  return { packId: pack.id, window, lines, artifacts, overall, totalShortfall }
}
