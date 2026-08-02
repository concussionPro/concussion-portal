import { NextRequest, NextResponse } from 'next/server'
import { cpdSession, trackCpdEvent } from '@/lib/cpd/session'
import { listActivities, addActivity, deleteActivity } from '@/lib/cpd/store'

/**
 * /api/cpd/activities — the quick-add channel (spec §5.2, 60-second add).
 *  GET → caller's activities. POST → add (confirmed). DELETE {id} → remove.
 */

export async function GET(req: NextRequest) {
  const session = cpdSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ activities: await listActivities(session.email) })
}

export async function POST(req: NextRequest) {
  const session = cpdSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const b = await req.json().catch(() => ({}))

  const title = typeof b?.title === 'string' ? b.title.trim().slice(0, 200) : ''
  const date = typeof b?.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b.date) ? b.date : ''
  const hours = Number(b?.hours)
  if (title.length < 2) return NextResponse.json({ error: 'Title is required.' }, { status: 400 })
  if (!date) return NextResponse.json({ error: 'A valid date is required.' }, { status: 400 })
  if (!Number.isFinite(hours) || hours <= 0 || hours > 100) {
    return NextResponse.json({ error: 'Hours must be between 0 and 100.' }, { status: 400 })
  }
  const points =
    b?.points === null || b?.points === undefined || b?.points === ''
      ? null
      : Number.isFinite(Number(b.points)) && Number(b.points) >= 0 && Number(b.points) <= 100
        ? Number(b.points)
        : null
  const categories = Array.isArray(b?.categories)
    ? b.categories.filter((c: unknown): c is string => typeof c === 'string').slice(0, 10)
    : []

  const id = await addActivity(session.email, {
    title,
    date,
    hours,
    points,
    categories,
    provider: typeof b?.provider === 'string' ? b.provider.trim().slice(0, 120) || null : null,
    notes: typeof b?.notes === 'string' ? b.notes.trim().slice(0, 1000) || null : null,
    source: 'manual',
  })
  await trackCpdEvent(req, 'cpd_activity_added', { hours, categories })
  return NextResponse.json({ success: true, id })
}

export async function DELETE(req: NextRequest) {
  const session = cpdSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const b = await req.json().catch(() => ({}))
  const id = Number(b?.id)
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  const ok = await deleteActivity(session.email, id)
  return ok
    ? NextResponse.json({ success: true })
    : NextResponse.json({ error: 'Not found' }, { status: 404 })
}
