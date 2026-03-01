import { NextRequest, NextResponse } from 'next/server'
import { loadUsers } from '@/lib/users'

function isAdminAuthorized(request: NextRequest): boolean {
  const adminKey = request.headers.get('x-admin-key')
  if (adminKey && adminKey === process.env.ADMIN_API_KEY) return true
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ') && authHeader.slice(7) === process.env.ADMIN_API_KEY) return true
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
