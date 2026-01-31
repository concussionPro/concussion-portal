import { NextRequest, NextResponse } from 'next/server'
import { loadUsers } from '@/lib/users'

/**
 * Admin API: Get all email signups
 * For viewing captured emails in admin dashboard
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check here
    // For now, returning data (secure this in production)

    const users = await loadUsers()

    // Format for display
    const emailList = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      accessLevel: user.accessLevel,
      createdAt: user.createdAt,
      lastLogin: user.lastLoginAt || null,
    }))

    // Sort by newest first
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
