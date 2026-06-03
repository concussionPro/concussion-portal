/**
 * POST /api/admin/backfill-module-completions
 *
 * Retroactively marks modules as completed for users who passed the quiz at
 * 75%+ but never clicked the "Mark Complete" button.
 *
 * Root cause (fixed in module page useEffect): module completion required a
 * manual button click after quiz pass. Many users missed it. Result: paid
 * users showing as "barely finished any content" in admin, and any cron
 * gated on completion count (SCAT-free → paid upsell, almost-done nurture,
 * 7/8 completion email) never fired for them.
 *
 * Backfill logic (idempotent — SET completed=true only for modules where
 * quiz passed at 75%+ AND completed is currently false):
 *  - Scans user_progress.progress JSONB
 *  - For each module in {1-8, 101-103} with quizScore/quizTotalQuestions >= 0.75
 *    AND completed=false: set completed=true and completedAt=quizSubmittedAt
 *  - Returns per-user audit log of what was updated
 *
 * Body: { dryRun?: bool } — default true.
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { isAdminRequest } from '@/lib/require-admin'

interface ModuleProgressRow {
  moduleId?: number
  completed?: boolean
  quizScore?: number | null
  quizTotalQuestions?: number | null
  quizCompleted?: boolean
  quizSubmittedAt?: string | null
  completedAt?: string | null
}

type UserProgress = Record<string, ModuleProgressRow>

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { dryRun?: boolean }
  try {
    body = await req.json().catch(() => ({}))
  } catch {
    body = {}
  }
  const dryRun = body.dryRun !== false

  const { rows } = await sql<{ user_id: string; progress: UserProgress }>`
    SELECT user_id, progress FROM user_progress
  `

  const updates: Array<{
    userId: string
    moduleIds: number[]
    quizScores: Record<number, string>
  }> = []
  let totalModulesBackfilled = 0

  for (const row of rows) {
    const progress = row.progress
    if (!progress || typeof progress !== 'object') continue

    const moduleIdsToFix: number[] = []
    const quizScoresRecord: Record<number, string> = {}
    const updatedProgress: UserProgress = { ...progress }

    for (const moduleId of [1, 2, 3, 4, 5, 6, 7, 8, 101, 102, 103]) {
      const key = String(moduleId)
      const m = progress[key]
      if (!m) continue
      if (m.completed) continue
      const score = m.quizScore
      const total = m.quizTotalQuestions
      if (score == null || total == null || total <= 0) continue
      const pct = score / total
      if (pct < 0.75) continue

      moduleIdsToFix.push(moduleId)
      quizScoresRecord[moduleId] = `${score}/${total} (${(pct * 100).toFixed(0)}%)`
      updatedProgress[key] = {
        ...m,
        completed: true,
        completedAt: m.quizSubmittedAt ?? new Date().toISOString(),
      }
    }

    if (moduleIdsToFix.length === 0) continue

    updates.push({
      userId: row.user_id,
      moduleIds: moduleIdsToFix,
      quizScores: quizScoresRecord,
    })
    totalModulesBackfilled += moduleIdsToFix.length

    if (!dryRun) {
      await sql`
        UPDATE user_progress
        SET progress = ${JSON.stringify(updatedProgress)}::jsonb,
            updated_at = NOW()
        WHERE user_id = ${row.user_id}
      `
    }
  }

  return NextResponse.json({
    summary: {
      mode: dryRun ? 'dry-run' : 'applied',
      usersScanned: rows.length,
      usersWithBackfill: updates.length,
      totalModulesBackfilled,
    },
    updates: updates.slice(0, 50), // First 50 for audit
    truncated: updates.length > 50,
  })
}
