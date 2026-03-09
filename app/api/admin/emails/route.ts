import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { loadUsers } from '@/lib/users'
import { list as listBlobs } from '@vercel/blob'

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

interface ModuleProgressEntry {
  completed: boolean
  quizScore: number | null
  quizCompleted: boolean
  completedAt: string | null
}

/**
 * Load progress for a single user from Blob storage
 */
async function loadUserProgress(userId: string): Promise<Record<string, ModuleProgressEntry> | null> {
  try {
    const prefix = `user-progress/${userId}`
    const { blobs } = await listBlobs({ prefix })

    if (blobs.length === 0) return null

    const latestBlob = blobs.sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    )[0]

    const response = await fetch(`${latestBlob.url}?t=${Date.now()}`, { cache: 'no-store' })
    if (response.ok) {
      return await response.json()
    }
  } catch {
    // Fall through
  }
  return null
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

    // Load progress for all users in parallel
    const progressPromises = users.map(u => loadUserProgress(u.id))
    const progressResults = await Promise.all(progressPromises)

    const emailList = users.map((user, i) => {
      const progress = progressResults[i]
      let completedModules = 0
      let totalCPDPoints = 0
      const moduleDetails: Record<number, { completed: boolean; quizScore: number | null }> = {}

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
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        accessLevel: user.accessLevel,
        createdAt: user.createdAt,
        lastLogin: user.lastLoginAt || null,
        workshopLocation: user.workshopLocation || null,
        completedModules,
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
  } catch (error) {
    console.error('Admin emails API error:', error)
    return NextResponse.json(
      { error: 'Failed to load emails' },
      { status: 500 }
    )
  }
}
