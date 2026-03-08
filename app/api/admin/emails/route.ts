import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { loadUsers } from '@/lib/users'

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
 * Admin API: Get all email signups
 * Protected — requires ADMIN_API_KEY
 */
export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const users = await loadUsers()

    const emailList = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      accessLevel: user.accessLevel,
      createdAt: user.createdAt,
      lastLogin: user.lastLoginAt || null,
    }))

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
