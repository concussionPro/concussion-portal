import { NextRequest, NextResponse } from 'next/server'
import { loadUsers } from '@/lib/users'
import { crmOwnerEmails, crmPracticalOwnerEmails } from '@/lib/crm-course'
import { sql } from '@/lib/db'
import { isAdminRequest } from '@/lib/require-admin'

/**
 * Admin API: Get all users with course progress
 * Protected — requires ADMIN_API_KEY
 */
export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const users = await loadUsers()

    // CRM (EP stream) ownership — lives in course_purchases, NOT access_level
    // (the streams are isolated, lib/crm-course.ts). Every admin surface fed by
    // this route counted a paying EP customer as a "Free User" because their
    // access_level is 'preview'. On a DB error these come back null; the flags
    // then read false, which is the pre-fix display — never a wrong send, this
    // route only reports.
    const [crmOwners, crmPracticalOwners] = await Promise.all([
      crmOwnerEmails(),
      crmPracticalOwnerEmails(),
    ])

    // Latest purchase per user. Without it this route can only report when an
    // ACCOUNT was created, and a purchase that upgrades an existing free signup
    // is then indistinguishable from that signup's original date. A $497 sale
    // on 2026-08-10 by a user who joined the free course on 2026-03-29 sorted
    // to position 233 of 297 and counted 0 against "Today".
    const { rows: purchaseRows } = await sql`
      SELECT LOWER(user_email) AS email, MAX(purchased_at) AS last_purchase
      FROM course_purchases GROUP BY LOWER(user_email)
    `
    const lastPurchaseMap = new Map<string, string>()
    for (const row of purchaseRows) {
      lastPurchaseMap.set(
        row.email,
        row.last_purchase instanceof Date ? row.last_purchase.toISOString() : row.last_purchase,
      )
    }

    // Load all progress from Postgres in one query
    const { rows: progressRows } = await sql`SELECT user_id, progress FROM user_progress`
    const progressMap = new Map<string, Record<string, { completed?: boolean; completedAt?: string; quizScore?: number; quizCompleted?: boolean }> | null>()
    for (const row of progressRows) {
      progressMap.set(row.user_id, row.progress)
    }

    const emailList = users.map((user) => {
      const progress = progressMap.get(user.id)
      let completedModules = 0
      let totalCPDPoints = 0
      const moduleDetails: Record<number, { completed: boolean; quizScore: number | null }> = {}

      let completedScatModules = 0
      let completedCrmModules = 0

      if (progress) {
        // CRM/EP modules are namespaced 201-208 (data/ep-module-meta.ts) so the
        // two courses can share one progress store without colliding.
        for (let m = 201; m <= 208; m++) {
          if (progress[String(m)]?.completed) completedCrmModules++
        }
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
        // Count completed SCAT free modules (101-103)
        for (let m = 101; m <= 103; m++) {
          const mod = progress[String(m)]
          if (mod?.completed) {
            completedScatModules++
          }
        }
      }

      const emailKey = user.email.toLowerCase()
      const ownsCrm = crmOwners?.has(emailKey) ?? false
      const ownsCrmPractical = crmPracticalOwners?.has(emailKey) ?? false

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        accessLevel: user.accessLevel,
        // Stream-aware truth for the admin boards: `preview` + ownsCrm is a
        // PAYING customer, and ownsCrmPractical is a paid practical-day seat.
        ownsCrm,
        ownsCrmPractical,
        // THIRD paid door: the Reference+Toolkit bundle. These buyers keep
        // accessLevel 'preview' with only reference_book_purchased_at set, so
        // every "Paid"/"Free" tile on the admin boards was filing paying
        // customers under Free and inflating the unconverted-lead denominator.
        ownsReferenceBook: !!user.referenceBookPurchasedAt,
        createdAt: user.createdAt,
        lastLogin: user.lastLoginAt || null,
        workshopLocation: user.workshopLocation || null,
        nurtureUnsubscribed: user.nurtureUnsubscribed || false,
        signupSource: user.signupSource || null,
        convertedFrom: user.convertedFrom || null,
        isTest: user.isTest || false,
        completedModules,
        completedScatModules,
        completedCrmModules,
        totalCPDPoints,
        moduleDetails,
        lastPurchaseAt: lastPurchaseMap.get(user.email.toLowerCase()) ?? null,
      }
    })

    // Sort by LAST ACTIVITY — the later of "bought something" and "signed up" —
    // not by account age. Otherwise the newest revenue is the hardest thing on
    // the page to find.
    const activityAt = (u: { createdAt: string; lastPurchaseAt: string | null }) =>
      Math.max(
        new Date(u.createdAt).getTime(),
        u.lastPurchaseAt ? new Date(u.lastPurchaseAt).getTime() : 0,
      )
    emailList.sort((a, b) => activityAt(b) - activityAt(a))

    return NextResponse.json({
      success: true,
      total: emailList.length,
      emails: emailList,
    })
  } catch (error: unknown) {
    console.error('Admin emails API error:', error)
    return NextResponse.json(
      { error: 'Failed to load emails' },
      { status: 500 }
    )
  }
}
