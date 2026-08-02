import { NextRequest, NextResponse } from 'next/server'
import { cpdSession, trackCpdEvent } from '@/lib/cpd/session'
import { getPack, CPD_PACKS } from '@/lib/cpd/packs'
import { computeStatus } from '@/lib/cpd/rules'
import { listRegistrations, addRegistration, removeRegistration, listActivities } from '@/lib/cpd/store'

/**
 * /api/cpd/registrations
 *  GET    → the caller's registrations, each with its computed status
 *           (rules engine over the caller's confirmed activities), plus the
 *           available-packs catalogue for the board picker.
 *  POST   {packId, regNumber?} → add/update a registration.
 *  DELETE {packId} → remove (activities are retained — they belong to the
 *           practitioner, not the registration; spec §2).
 */

export async function GET(req: NextRequest) {
  const session = cpdSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [regs, activities] = await Promise.all([
    listRegistrations(session.email),
    listActivities(session.email),
  ])
  const today = new Date().toISOString().slice(0, 10)
  const inputs = activities.map((a) => ({
    date: a.date,
    hours: a.hours,
    points: a.points,
    categories: a.categories,
    status: a.status,
  }))

  return NextResponse.json({
    registrations: regs.map((r) => {
      const pack = getPack(r.packId)
      return {
        ...r,
        pack: pack
          ? {
              id: pack.id,
              body: pack.body,
              profession: pack.profession,
              region: pack.region,
              unit: pack.unit,
              categories: pack.categories,
              artifacts: pack.artifacts.map((a) => ({ id: a.id, label: a.label, category: a.category })),
              notes: pack.notes,
              beta: pack.beta ?? false,
              version: pack.version,
            }
          : null,
        status: pack ? computeStatus(pack, inputs, today) : null,
      }
    }),
    packs: CPD_PACKS.map((p) => ({
      id: p.id,
      body: p.body,
      profession: p.profession,
      region: p.region,
      beta: p.beta ?? false,
    })),
  })
}

export async function POST(req: NextRequest) {
  const session = cpdSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const pack = getPack(String(body?.packId ?? ''))
  if (!pack) return NextResponse.json({ error: 'Unknown board' }, { status: 400 })
  const regNumber =
    typeof body?.regNumber === 'string' && body.regNumber.trim() !== ''
      ? body.regNumber.trim().slice(0, 40)
      : null
  await addRegistration(session.email, pack.id, regNumber)
  await trackCpdEvent(req, 'cpd_registration_added', { packId: pack.id })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const session = cpdSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const packId = String(body?.packId ?? '')
  if (!getPack(packId)) return NextResponse.json({ error: 'Unknown board' }, { status: 400 })
  await removeRegistration(session.email, packId)
  return NextResponse.json({ success: true })
}
