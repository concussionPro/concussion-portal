import { NextRequest, NextResponse } from 'next/server'
import { cpdSession, trackCpdEvent } from '@/lib/cpd/session'
import { getPack, type CpdPack } from '@/lib/cpd/packs'
import { computeStatus, type RegistrationStatus } from '@/lib/cpd/rules'
import { listActivities, listRegistrations, type CpdActivityRow } from '@/lib/cpd/store'
import { renderReportContentToHtml } from '@/lib/sst-trainer/reports/render'
import type { ReportContent, ReportSection } from '@/lib/sst-trainer/reports/skins'
import { rateLimit } from '@/lib/rate-limit'

/**
 * GET /api/cpd/export?pack=<packId> — the audit-ready board export.
 *
 * Reuses the SST report architecture end-to-end (spec directive: reuse, don't
 * rebuild): this route is a new SKIN emitting the shared ReportContent model,
 * rendered by the existing print-ready HTML renderer (renderReportContentToHtml
 * → browser print/save-PDF, same as every SST report). No SST patient/session
 * model is imported — only the generic content+renderer layer (spec §0
 * boundary: the allowlist is content model + renderer, nothing else).
 *
 * The export contains ONLY the caller's own professional records. Board skins
 * mirror what an auditor asks for: registration, requirement-vs-logged table
 * with source references, dated activity log, evidence inventory.
 */

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

function buildExport(
  pack: CpdPack,
  status: RegistrationStatus,
  activities: CpdActivityRow[],
  who: { name: string; email: string; regNumber: string | null },
  generatedOn: string,
): ReportContent {
  const inWindow = activities.filter(
    (a) => a.status === 'confirmed' && a.date >= status.window.start && a.date < status.window.end,
  )
  const catLabel = (id: string) =>
    pack.categories.find((c) => c.id === id)?.label ??
    pack.artifacts.find((a) => a.category === id)?.label ??
    id

  const sections: ReportSection[] = [
    {
      heading: 'Practitioner',
      kind: 'summary',
      fields: [
        { label: 'Name', value: who.name || '—' },
        { label: 'Email', value: who.email },
        { label: 'Registration number', value: who.regNumber ?? 'Not recorded' },
        { label: 'Board / body', value: pack.body },
        { label: 'Profession', value: pack.profession },
      ],
    },
    {
      heading:
        pack.cycle.windowType === 'rolling'
          ? `CPD period — rolling ${pack.cycle.years}-year window ending ${status.window.end}`
          : `CPD period — ${status.window.start} to ${status.window.end}`,
      kind: 'audit',
      fields: [
        ...status.lines.map((l) => ({
          label: `${l.label} (required ${fmt(l.required)} ${l.unit}${l.per === 'year' ? '/year' : ''})`,
          value: `${fmt(l.logged)} ${l.unit} logged${l.shortfall > 0 ? ` — ${fmt(l.shortfall)} outstanding` : ' — requirement met'}`,
        })),
        ...status.artifacts.map((a) => ({
          label: a.label,
          value: a.done ? 'Completed this period' : 'Outstanding',
        })),
      ],
      body: [
        `Requirement source: ${[...new Set(pack.lines.map((l) => l.sourceUrl))].join(' · ')}`,
        `Requirements pack version ${pack.version} (${pack.verifiedBy}). Verify current requirements against the Board's published standard — this export is a record of activity, not regulatory advice.`,
      ],
    },
    {
      heading: `Activity log (${inWindow.length} activities this period)`,
      kind: 'narrative',
      fields: inWindow.map((a) => ({
        label: `${a.date} — ${a.title}${a.provider ? ` (${a.provider})` : ''}`,
        value: [
          `${fmt(a.hours)} hrs`,
          pack.unit === 'points' ? `${fmt(a.points ?? a.hours)} pts` : null,
          a.categories.length ? a.categories.map(catLabel).join(', ') : null,
          a.evidenceIds.length ? `${a.evidenceIds.length} evidence file(s)` : 'no evidence attached',
        ]
          .filter(Boolean)
          .join(' · '),
      })),
      body: inWindow.length === 0 ? ['No confirmed activities recorded in this period.'] : undefined,
    },
    {
      heading: 'Declaration',
      kind: 'outcome',
      body: [
        `The practitioner named above maintains this CPD record. Evidence files listed are held in the practitioner's evidence vault and are available on request.`,
        `Generated ${generatedOn} by CPD Tracker, Concussion Education Australia (concussion-education-australia.com).`,
      ],
    },
  ]

  return { title: `CPD record — ${pack.body}`, sections }
}

export async function GET(req: NextRequest) {
  const session = cpdSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rl = await rateLimit({ key: `cpd-export:${session.email}`, limit: 30, windowSec: 900 })
  if (!rl.ok) return NextResponse.json({ error: 'Too many exports — try again shortly.' }, { status: 429 })

  const pack = getPack(req.nextUrl.searchParams.get('pack') ?? '')
  if (!pack) return NextResponse.json({ error: 'Unknown board' }, { status: 400 })

  const [regs, activities] = await Promise.all([
    listRegistrations(session.email),
    listActivities(session.email),
  ])
  const reg = regs.find((r) => r.packId === pack.id)
  if (!reg) return NextResponse.json({ error: 'Add this board on your records page first.' }, { status: 400 })

  const today = new Date().toISOString().slice(0, 10)
  const status = computeStatus(
    pack,
    activities.map((a) => ({
      date: a.date,
      hours: a.hours,
      points: a.points,
      categories: a.categories,
      status: a.status,
    })),
    today,
  )

  const content = buildExport(
    pack,
    status,
    activities,
    { name: session.name, email: session.email, regNumber: reg.regNumber },
    today,
  )
  const html = renderReportContentToHtml(content, {})
  await trackCpdEvent(req, 'cpd_export_generated', { packId: pack.id, overall: status.overall })
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
