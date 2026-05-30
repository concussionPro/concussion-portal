/**
 * Cron: Fire scheduled course launch blasts.
 *
 * Runs daily. Checks each course in the catalogue. If the course has a
 * launchAt set AND now >= launchAt AND the blast hasn't fired yet
 * (email_audit_log key check) → fires the engaged-user launch blast.
 *
 * Currently wired for the AI in Clinical Practice launch on 2026-06-01.
 * Adding future course launches: add a new entry to LAUNCH_BLAST_REGISTRY
 * with the courseId, the audit-key prefix, and the blast endpoint URL.
 *
 * Idempotent — re-runs are a no-op once the audit-key row exists. Safe
 * to re-fire if a previous run failed (the underlying blast endpoint
 * has its own per-recipient audit-key rollback on failure).
 */
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { sql } from '@/lib/db'
import { COURSES } from '@/lib/ai-course/provider-catalogue'

export const maxDuration = 60

/**
 * Registry of course launches that should auto-fire an engaged-user blast.
 * To add: include the catalogue courseId, the cron-level audit key (so we
 * remember we fired it), and the blast endpoint to POST to.
 */
const LAUNCH_BLAST_REGISTRY: Array<{
  courseId: string
  cronAuditKey: string
  blastEndpoint: string
  confirmFlag: string
}> = [
  {
    courseId: 'ai-in-clinical-practice',
    cronAuditKey: 'cron_blast_ai_course_2026-06-17',
    blastEndpoint: '/api/admin/ai-course-launch-blast',
    confirmFlag: 'ai-course-launch-2026-06-17',
  },
  // Future course launches: add entries here as each becomes ready
  // {
  //   courseId: 'persistent-post-concussion-symptoms',
  //   cronAuditKey: 'cron_blast_ppcs_2026-08-21',
  //   blastEndpoint: '/api/admin/ppcs-course-launch-blast',
  //   confirmFlag: 'ppcs-course-launch-2026-08-21',
  // },
]

export async function GET(request: Request) {
  try {
    // Cron secret guard
    if (!process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
    }
    const authHeader = request.headers.get('authorization')
    const expected = `Bearer ${process.env.CRON_SECRET}`
    if (
      !authHeader ||
      authHeader.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected))
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Skip on duplicate Vercel project (matches send-nurture-emails guard)
    const prodUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || ''
    if (prodUrl && !prodUrl.includes('concussion-education-australia.com')) {
      return NextResponse.json({ skipped: true, reason: 'Not primary project' })
    }

    await sql`CREATE TABLE IF NOT EXISTS email_audit_log (audit_key TEXT PRIMARY KEY, sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
    const now = new Date()
    const results: Array<Record<string, unknown>> = []

    for (const entry of LAUNCH_BLAST_REGISTRY) {
      const course = COURSES.find((c) => c.id === entry.courseId)
      if (!course) {
        results.push({ courseId: entry.courseId, skipped: 'course-not-in-catalogue' })
        continue
      }
      if (!course.launchAt) {
        results.push({ courseId: entry.courseId, skipped: 'no-launchAt-set' })
        continue
      }
      if (now < new Date(course.launchAt)) {
        results.push({
          courseId: entry.courseId,
          skipped: 'before-launchAt',
          launchAt: course.launchAt,
        })
        continue
      }

      // Idempotency check — did we already fire this blast?
      const { rowCount: inserted } = await sql`
        INSERT INTO email_audit_log (audit_key, sent_at)
        VALUES (${entry.cronAuditKey}, NOW())
        ON CONFLICT (audit_key) DO NOTHING
      `
      if (!inserted || inserted === 0) {
        results.push({ courseId: entry.courseId, skipped: 'already-fired' })
        continue
      }

      // Fire the blast — internal POST with cron secret + confirm flag
      try {
        const blastUrl = `${baseUrl}${entry.blastEndpoint}?confirm=${encodeURIComponent(entry.confirmFlag)}`
        const res = await fetch(blastUrl, {
          method: 'POST',
          headers: {
            'x-admin-key': process.env.ADMIN_API_KEY || '',
            'Origin': baseUrl,
            'Referer': `${baseUrl}/admin/analytics`,
            'Content-Type': 'application/json',
          },
        })
        const json = await res.json().catch(() => ({}))
        results.push({
          courseId: entry.courseId,
          fired: res.ok,
          status: res.status,
          ...json,
        })
        if (!res.ok) {
          // Roll back the cron audit key so a future run can retry
          await sql`DELETE FROM email_audit_log WHERE audit_key = ${entry.cronAuditKey}`
        }
      } catch (err) {
        await sql`DELETE FROM email_audit_log WHERE audit_key = ${entry.cronAuditKey}`
        results.push({
          courseId: entry.courseId,
          fired: false,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }

    return NextResponse.json({ ok: true, ranAt: now.toISOString(), results })
  } catch (error) {
    console.error('Launch blast cron error:', error)
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 })
  }
}
