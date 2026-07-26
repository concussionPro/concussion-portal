/**
 * Learner notes + CPD reflections.
 *
 * Two things the portal was missing as a LEARNING product, not a sales funnel:
 *
 *  NOTES — a clinician working through a 75-minute module had no way to mark a
 *  spot, and no way to leave themselves a line about how a concept applies to
 *  their caseload. Notes are also the cheapest retention hook there is: they
 *  make the portal *theirs*, and they are the argument against churn.
 *
 *  REFLECTIONS — AHPRA CPD wants a reflection recorded against each activity.
 *  /courses/cpd-record previously *instructed the user to write one themselves*.
 *  Capturing it in-product and putting it in the export turns a certificate into
 *  an audit-ready CPD record, which is a real differentiator over generic CPD.
 *
 * One row per (user, module, kind). `kind='note'` may repeat per section;
 * `kind='reflection'` is one per module (enforced by the unique index).
 * Scoped by user id from the session — never by anything client-supplied.
 */
import { sql } from './db'

export type NoteKind = 'note' | 'reflection'

export interface CourseNote {
  id: number
  moduleId: number
  sectionId: string | null
  kind: NoteKind
  body: string
  updatedAt: string
}

/** Notes are a learning aid, not an essay tool — bound the storage. */
export const NOTE_MAX_CHARS = 4000

let ready = false
async function ensureTable(): Promise<void> {
  if (ready) return
  await sql`
    CREATE TABLE IF NOT EXISTS course_notes (
      id          SERIAL PRIMARY KEY,
      user_id     TEXT NOT NULL,
      module_id   INTEGER NOT NULL,
      section_id  TEXT,
      kind        TEXT NOT NULL DEFAULT 'note',
      body        TEXT NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS course_notes_user_idx ON course_notes (user_id, module_id)`
  // One reflection per module per user — an upsert target.
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS course_notes_reflection_uniq
      ON course_notes (user_id, module_id) WHERE kind = 'reflection'
  `
  ready = true
}

interface NoteRow {
  id: number
  module_id: number
  section_id: string | null
  kind: string
  body: string
  updated_at: Date | string
}

function toNote(r: NoteRow): CourseNote {
  return {
    id: r.id,
    moduleId: r.module_id,
    sectionId: r.section_id,
    kind: r.kind === 'reflection' ? 'reflection' : 'note',
    body: r.body,
    updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at),
  }
}

/** Every note this user holds, newest first. Optionally scoped to one module. */
export async function listNotes(userId: string, moduleId?: number): Promise<CourseNote[]> {
  await ensureTable()
  const { rows } = moduleId
    ? await sql<NoteRow>`
        SELECT id, module_id, section_id, kind, body, updated_at FROM course_notes
        WHERE user_id = ${userId} AND module_id = ${moduleId}
        ORDER BY updated_at DESC`
    : await sql<NoteRow>`
        SELECT id, module_id, section_id, kind, body, updated_at FROM course_notes
        WHERE user_id = ${userId}
        ORDER BY module_id ASC, updated_at DESC`
  return rows.map(toNote)
}

/**
 * Create or update a note. A `reflection` upserts on (user, module) so a module
 * can only ever carry one; a `note` with an id updates that row, without an id
 * inserts a new one. An empty body DELETES — that's how the UI clears a note.
 */
export async function saveNote(args: {
  userId: string
  moduleId: number
  sectionId?: string | null
  kind: NoteKind
  body: string
  id?: number
}): Promise<CourseNote | null> {
  await ensureTable()
  const body = args.body.trim().slice(0, NOTE_MAX_CHARS)

  if (!body) {
    if (args.kind === 'reflection') {
      await sql`DELETE FROM course_notes WHERE user_id = ${args.userId} AND module_id = ${args.moduleId} AND kind = 'reflection'`
    } else if (args.id) {
      await sql`DELETE FROM course_notes WHERE id = ${args.id} AND user_id = ${args.userId}`
    }
    return null
  }

  if (args.kind === 'reflection') {
    const { rows } = await sql<NoteRow>`
      INSERT INTO course_notes (user_id, module_id, section_id, kind, body)
      VALUES (${args.userId}, ${args.moduleId}, NULL, 'reflection', ${body})
      ON CONFLICT (user_id, module_id) WHERE kind = 'reflection'
      DO UPDATE SET body = EXCLUDED.body, updated_at = NOW()
      RETURNING id, module_id, section_id, kind, body, updated_at
    `
    return toNote(rows[0])
  }

  if (args.id) {
    const { rows } = await sql<NoteRow>`
      UPDATE course_notes SET body = ${body}, updated_at = NOW()
      WHERE id = ${args.id} AND user_id = ${args.userId}
      RETURNING id, module_id, section_id, kind, body, updated_at
    `
    if (rows.length) return toNote(rows[0])
    // Row vanished or belongs to someone else — fall through to an insert
    // rather than silently losing what the learner typed.
  }

  const { rows } = await sql<NoteRow>`
    INSERT INTO course_notes (user_id, module_id, section_id, kind, body)
    VALUES (${args.userId}, ${args.moduleId}, ${args.sectionId ?? null}, 'note', ${body})
    RETURNING id, module_id, section_id, kind, body, updated_at
  `
  return toNote(rows[0])
}

export async function deleteNote(userId: string, id: number): Promise<void> {
  await ensureTable()
  await sql`DELETE FROM course_notes WHERE id = ${id} AND user_id = ${userId}`
}

/** Reflections keyed by module id — used by the CPD record export. */
export async function reflectionsByModule(userId: string): Promise<Record<number, string>> {
  await ensureTable()
  const { rows } = await sql<{ module_id: number; body: string }>`
    SELECT module_id, body FROM course_notes
    WHERE user_id = ${userId} AND kind = 'reflection'
  `
  const out: Record<number, string> = {}
  for (const r of rows) out[r.module_id] = r.body
  return out
}
