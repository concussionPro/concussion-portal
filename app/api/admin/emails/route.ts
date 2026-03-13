import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { loadUsers } from '@/lib/users'
import { sql } from '@/lib/db'

function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

function isAdminAuthorized(request: NextRequest): boolean {
  const expected = process.env.ADMIN_API_KEY
  if (!expected) return false
  const adminKey = request.headers.get('x-admin-key')
  if (adminKey && timingSafeCompare(adminKey, expected)) return true
  const authHeader = request.headers.get('authorization')
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (bearer && timingSafeCompare(bearer, expected)) return true
  return false
}

/**
 * Admin API: Get all users with course progress
 * Protected — requires ADMIN_API_KEY
 */
export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const users = await loadUsers()

    // Load all progress from Postgres in one query
    const { rows: progressRows } = await sql`SELECT user_id, progress FROM user_progress`
    const progressMap = new Map<string, any>()
    for (const row of progressRows) {
      progressMap.set(row.user_id, row.progress)
    }

    const emailList = users.map((user) => {
      const progress = progressMap.get(user.id)
      let completedModules = 0
      let totalCPDPoints = 0
      const moduleDetails: Record<number, { completed: boolean; quizScore: number | null }> = {}

      let completedScatModules = 0

      if (progress) {
        // Count completed paid modules (1-8)
        for (let m = 1; m <= 8; m++) {
          const mod = progress[String(m)]
          if (mod) {
            moduleDetails[m] = {
              completed: !!mod.completed,
              quizScore: mod.quizScore ?? null,
            }
            if (mod.completed) {
              completedModules++
              totalCPDPoints++
            }
          }
        }
        // Count completed SCAT free modules (101-105)
        for (let m = 101; m <= 105; m++) {
          const mod = progress[String(m)]
          if (mod?.completed) {
            completedScatModules++
          }
        }
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        accessLevel: user.accessLevel,
        createdAt: user.createdAt,
        lastLogin: user.lastLoginAt || null,
        workshopLocation: user.workshopLocation || null,
        nurtureUnsubscribed: user.nurtureUnsubscribed || false,
        signupSource: user.signupSource || null,
        completedModules,
        completedScatModules,
        totalCPDPoints,
        moduleDetails,
      }
    })

    emailList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({
      success: true,
      total: emailList.length,
      emails: emailList,
    })
  } catch (error: unknown) {
    console.error('Admin emails API error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    const isConnectionError = msg.includes('POSTGRES_URL') || msg.includes('connection') || msg.includes('ECONNREFUSED')
    const isTableError = msg.includes('does not exist') || msg.includes('relation')
    const hint = isConnectionError
      ? 'POSTGRES_URL env var may be missing. Run: vercel env pull .env.local'
      : isTableError
        ? 'Database tables may not exist. Run: npx tsx scripts/migrate-blob-to-postgres.ts'
        : 'Check server logs for details'
    return NextResponse.json(
      { error: `Failed to load emails: ${hint}` },
      { status: 500 }
    )
  }
}
