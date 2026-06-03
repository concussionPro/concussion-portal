/**
 * GET /api/admin/completion-audit
 *
 * Three independent counts of who has completed the SCAT free course +
 * the paid course. Discrepancies between them surface logging / data gaps.
 *
 *   1. Cert-issued: users with `scat_completion_upsell_<id>` audit entry
 *      (= certificate was generated + upsell email fired)
 *   2. Progress-shows-completed: users whose user_progress JSONB has
 *      all 3 SCAT modules (101/102/103) marked completed:true
 *   3. Progress-shows-passed-but-not-completed: users with quiz score
 *      >= 75% on all 3 SCAT modules but completed:false (the historic bug
 *      we just backfilled)
 *
 * Same three counts for the paid course (modules 1-8).
 *
 * Plus a per-user list with their actual progress shape so we can see
 * what's happening.
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { isAdminRequest } from '@/lib/require-admin'

interface ModuleProgressRow {
  completed?: boolean
  quizScore?: number | null
  quizTotalQuestions?: number | null
  quizCompleted?: boolean
  quizSubmittedAt?: string | null
  completedAt?: string | null
}

type UserProgress = Record<string, ModuleProgressRow>

function passed(m?: ModuleProgressRow): boolean {
  if (!m) return false
  const s = m.quizScore
  const t = m.quizTotalQuestions
  return s != null && t != null && t > 0 && s / t >= 0.75
}

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 1. Users with cert-generated audit entries (SCAT upsell fired = they completed)
  const { rows: scatCertRows } = await sql<{ audit_key: string }>`
    SELECT audit_key FROM email_audit_log
    WHERE audit_key LIKE 'scat_completion_upsell_%'
  `
  const scatCertUserIds = new Set(scatCertRows.map((r) => r.audit_key.replace('scat_completion_upsell_', '')))

  // 2. Pull users + their progress + their accessLevel so we can split by tier.
  // Earlier version queried user_progress alone and conflated "user with any
  // progress record" with "paid user", which gave a wildly misleading "56
  // paid users never started". Truth: many of those have access_level = preview.
  const { rows: progressRows } = await sql<{
    user_id: string
    progress: UserProgress
    access_level: string
    email: string | null
  }>`
    SELECT
      up.user_id,
      up.progress,
      COALESCE(u.access_level, 'unknown') AS access_level,
      u.email
    FROM user_progress up
    LEFT JOIN users u ON u.id = up.user_id
  `

  // Also pull paid users who have NO progress row at all — they bought but
  // never touched the course. That's the genuine "ghost paid users" bucket.
  const { rows: paidUsersAll } = await sql<{ id: string; email: string; access_level: string }>`
    SELECT id, email, access_level
    FROM users
    WHERE access_level IN ('online-only', 'full-course')
  `
  const paidUsersAllIds = new Set(paidUsersAll.map((u) => u.id))
  const paidUsersWithProgress = new Set(
    progressRows.filter((r) => r.access_level === 'online-only' || r.access_level === 'full-course').map((r) => r.user_id),
  )
  const paidUsersZeroProgressRecord = [...paidUsersAllIds].filter((id) => !paidUsersWithProgress.has(id))

  const scatBuckets = {
    progressShowsAll3Completed: [] as Array<{ userId: string }>,
    progressShowsAllPassedButNotMarked: [] as Array<{ userId: string; details: string }>,
    progressShowsPartial: [] as Array<{ userId: string; completed: number; passed: number }>,
    progressShowsNone: [] as string[],
  }
  const paidBuckets = {
    progressShowsAll8Completed: [] as string[],
    progressShowsPartial: [] as Array<{ userId: string; completed: number; passed: number }>,
    progressShowsNone: [] as string[],
  }
  // Users with cert but no matching progress (gap)
  const certWithoutProgress: string[] = []

  for (const row of progressRows) {
    const p = row.progress
    if (!p) {
      scatBuckets.progressShowsNone.push(row.user_id)
      paidBuckets.progressShowsNone.push(row.user_id)
      continue
    }

    // SCAT 101-103
    let scatCompleted = 0
    let scatPassed = 0
    const scatDetails: string[] = []
    for (const m of [101, 102, 103]) {
      const mod = p[String(m)]
      if (mod?.completed) scatCompleted += 1
      if (passed(mod)) scatPassed += 1
      if (mod) {
        scatDetails.push(
          `m${m}:${mod.completed ? 'C' : (passed(mod) ? 'P' : '-')}${mod.quizScore != null ? `(${mod.quizScore}/${mod.quizTotalQuestions})` : ''}`,
        )
      }
    }
    if (scatCompleted === 3) {
      scatBuckets.progressShowsAll3Completed.push({ userId: row.user_id })
    } else if (scatPassed === 3 && scatCompleted < 3) {
      scatBuckets.progressShowsAllPassedButNotMarked.push({ userId: row.user_id, details: scatDetails.join(' ') })
    } else if (scatCompleted > 0 || scatPassed > 0) {
      scatBuckets.progressShowsPartial.push({ userId: row.user_id, completed: scatCompleted, passed: scatPassed })
    } else {
      scatBuckets.progressShowsNone.push(row.user_id)
    }

    // Paid 1-8
    let paidCompleted = 0
    let paidPassed = 0
    for (const m of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const mod = p[String(m)]
      if (mod?.completed) paidCompleted += 1
      if (passed(mod)) paidPassed += 1
    }
    if (paidCompleted === 8) {
      paidBuckets.progressShowsAll8Completed.push(row.user_id)
    } else if (paidCompleted > 0 || paidPassed > 0) {
      paidBuckets.progressShowsPartial.push({ userId: row.user_id, completed: paidCompleted, passed: paidPassed })
    } else {
      paidBuckets.progressShowsNone.push(row.user_id)
    }

    // Cross-check: does this user have a cert audit entry?
    if (scatCertUserIds.has(row.user_id) && scatCompleted < 3) {
      certWithoutProgress.push(row.user_id)
    }
  }

  // Users who have a cert audit entry but no progress row at all
  const userIdsInProgressTable = new Set(progressRows.map((r) => r.user_id))
  const certHasNoProgressRow: string[] = []
  for (const id of scatCertUserIds) {
    if (!userIdsInProgressTable.has(id)) certHasNoProgressRow.push(id)
  }

  // Split paid-course completion stats by access_level. The earlier version
  // looked at ALL users (free + paid) and reported "56 with no progress" as
  // if they were paid customers — that was free-preview users dominating
  // the dataset.
  const byTier = {
    'preview': { all8: 0, partial: 0, none: 0, total: 0 },
    'online-only': { all8: 0, partial: 0, none: 0, total: 0 },
    'full-course': { all8: 0, partial: 0, none: 0, total: 0 },
    'unknown': { all8: 0, partial: 0, none: 0, total: 0 },
  } as Record<string, { all8: number; partial: number; none: number; total: number }>

  for (const row of progressRows) {
    const tier = row.access_level || 'unknown'
    if (!byTier[tier]) byTier[tier] = { all8: 0, partial: 0, none: 0, total: 0 }
    byTier[tier].total += 1
    const p = row.progress || {}
    let paidCompleted = 0
    let paidStarted = 0
    for (const m of [1, 2, 3, 4, 5, 6, 7, 8]) {
      if (p[String(m)]?.completed) paidCompleted += 1
      if (p[String(m)]) paidStarted += 1
    }
    if (paidCompleted === 8) byTier[tier].all8 += 1
    else if (paidStarted > 0 || paidCompleted > 0) byTier[tier].partial += 1
    else byTier[tier].none += 1
  }

  return NextResponse.json({
    scat: {
      certUsers: scatCertUserIds.size,
      progressShowsAll3Completed: scatBuckets.progressShowsAll3Completed.length,
      progressShowsAllPassedButNotMarked: scatBuckets.progressShowsAllPassedButNotMarked.length,
      progressShowsPartial: scatBuckets.progressShowsPartial.length,
      progressShowsNone: scatBuckets.progressShowsNone.length,
      certUsersWithoutFullProgressCompletion: certWithoutProgress.length,
      certUsersWithNoProgressRowAtAll: certHasNoProgressRow.length,
    },
    paidByTier: byTier,
    paidUsersTotal: paidUsersAll.length,
    paidUsersWithNoProgressRow: paidUsersZeroProgressRecord.length,
    paidUsersZeroProgressIds: paidUsersZeroProgressRecord.slice(0, 50),
    totalUsersWithProgressRecord: progressRows.length,
    scatCertUserIds: [...scatCertUserIds].slice(0, 50),
    samples: {
      progressShowsAll3Completed: scatBuckets.progressShowsAll3Completed.slice(0, 10),
      progressShowsPartial: scatBuckets.progressShowsPartial.slice(0, 10),
      certUsersWithoutFullProgressCompletion: certWithoutProgress.slice(0, 10),
      certUsersWithNoProgressRowAtAll: certHasNoProgressRow.slice(0, 10),
    },
  })
}
