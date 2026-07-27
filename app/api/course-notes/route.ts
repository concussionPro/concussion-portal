import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/jwt-session'
import { rateLimit } from '@/lib/rate-limit'
import { listNotes, saveNote, deleteNote, NOTE_MAX_CHARS } from '@/lib/course-notes'
import { isDemoUserId } from '@/lib/demo-session'

/**
 * Learner notes + CPD reflections.
 *
 * Everything is scoped to the user id from the SESSION COOKIE — never to an id
 * in the request body — so one learner can't read or overwrite another's notes.
 *
 *  GET    ?moduleId=1   -> that module's notes (omit for all)
 *  POST   { moduleId, kind, body, sectionId?, id? } -> upsert (empty body deletes)
 *  DELETE ?id=123       -> remove one note
 */
function sessionOf(request: NextRequest) {
  const token = request.cookies.get('session')?.value
  return token ? verifySessionToken(token) : null
}

export async function GET(request: NextRequest) {
  const session = sessionOf(request)
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const raw = request.nextUrl.searchParams.get('moduleId')
  const moduleId = raw ? Number(raw) : undefined
  if (raw && !Number.isFinite(moduleId)) {
    return NextResponse.json({ error: 'Invalid moduleId' }, { status: 400 })
  }
  try {
    return NextResponse.json({ success: true, notes: await listNotes(session.userId, moduleId) })
  } catch (err) {
    console.error('[course-notes] list failed:', err)
    return NextResponse.json({ error: 'Could not load notes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = sessionOf(request)
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  // Demo viewers never persist (no users row; state would be shared across
  // prospects). Echo an ephemeral note so the editor behaves for the visit.
  if (isDemoUserId(session.userId)) {
    let demoBody: Record<string, unknown> = {}
    try {
      demoBody = await request.json()
    } catch { /* ignore */ }
    return NextResponse.json({
      success: true,
      demo: true,
      note: {
        id: Number(demoBody.id) || Date.now(),
        moduleId: Number(demoBody.moduleId) || 0,
        sectionId: typeof demoBody.sectionId === 'string' ? demoBody.sectionId : null,
        kind: demoBody.kind === 'reflection' ? 'reflection' : 'note',
        body: typeof demoBody.body === 'string' ? demoBody.body : '',
        updatedAt: new Date().toISOString(),
      },
    })
  }

  const rl = await rateLimit({ key: `notes:${session.userId}`, limit: 120, windowSec: 60 })
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const moduleId = Number(body.moduleId)
  if (!Number.isFinite(moduleId)) {
    return NextResponse.json({ error: 'moduleId required' }, { status: 400 })
  }
  const kind = body.kind === 'reflection' ? 'reflection' : 'note'
  const text = typeof body.body === 'string' ? body.body : ''
  if (text.length > NOTE_MAX_CHARS) {
    return NextResponse.json({ error: `Notes are limited to ${NOTE_MAX_CHARS} characters.` }, { status: 413 })
  }

  try {
    const note = await saveNote({
      userId: session.userId,
      moduleId,
      sectionId: typeof body.sectionId === 'string' ? body.sectionId.slice(0, 120) : null,
      kind,
      body: text,
      id: Number.isFinite(Number(body.id)) ? Number(body.id) : undefined,
    })
    return NextResponse.json({ success: true, note })
  } catch (err) {
    console.error('[course-notes] save failed:', err)
    return NextResponse.json({ error: 'Could not save' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = sessionOf(request)
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const id = Number(request.nextUrl.searchParams.get('id'))
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'id required' }, { status: 400 })
  try {
    await deleteNote(session.userId, id)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[course-notes] delete failed:', err)
    return NextResponse.json({ error: 'Could not delete' }, { status: 500 })
  }
}
