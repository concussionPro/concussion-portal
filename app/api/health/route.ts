// Health check endpoint for monitoring
//
// WHY THIS REPORTS A BUILD SHA (2026-08-06, master clean register F).
//
// This route pinged Postgres and returned {"status":"healthy"}. That is true
// and useless, because it says nothing about WHICH BUILD is answering. A
// production pinned to a three-day-old deployment reports healthy, every time.
//
// That is not hypothetical — it happened TWICE in one day. Commit 925d8b5f
// failed to build and production served the previous build for forty minutes
// with none of that day's fixes live. Then a middleware matcher with two
// adjacent path-to-regexp parameters failed the build, and because THAT commit
// was the one deleting a directory serving the entire paid toolkit
// unauthenticated, the failed deploy held a live paywall bypass open for a
// further eleven minutes.
//
// The lesson is that a failed deploy is not "the new thing is missing" — it
// PINS PRODUCTION TO THE OLD STATE, and nothing in twenty cron jobs, tsc,
// vitest, or this health check could see it. Reporting the SHA is what makes
// the drift observable: CI now polls this endpoint after every push to main and
// fails if the commit it just built never becomes the commit being served.
//
// A commit SHA is not a secret (it identifies a revision, it does not grant
// access to one), so this stays on the PUBLIC branch — an authenticated
// liveness probe cannot be polled by the thing that needs to poll it.
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import crypto from 'crypto'

export const runtime = 'nodejs'

// Never cache: a cached response would report a stale SHA, which is precisely
// the failure this exists to detect.
export const dynamic = 'force-dynamic'

function buildInfo() {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA ?? null
  return {
    // Short SHA for humans; `sha` full for exact comparison by CI.
    commit: sha ? sha.slice(0, 8) : null,
    sha,
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    env: process.env.VERCEL_ENV ?? 'local',
    region: process.env.VERCEL_REGION ?? null,
  }
}

function isAdmin(request: NextRequest): boolean {
  const adminKey = request.headers.get('x-admin-key')
  const expected = process.env.ADMIN_API_KEY
  if (!expected || !adminKey) return false
  try {
    return crypto.timingSafeEqual(
      crypto.createHmac('sha256', 'compare').update(adminKey).digest(),
      crypto.createHmac('sha256', 'compare').update(expected).digest()
    )
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  // Public: minimal health check
  if (!isAdmin(request)) {
    try {
      await sql`SELECT 1`
      return NextResponse.json({ status: 'healthy', build: buildInfo() })
    } catch {
      // The build block is returned on the failure path TOO. When the database
      // is down, "which build is serving this" is the first thing anyone asks.
      return NextResponse.json({ status: 'down', build: buildInfo() }, { status: 503 })
    }
  }

  // Admin: full diagnostics
  const checks = {
    database: false,
    authentication: false,
    environment: false,
  }

  let status: 'healthy' | 'degraded' | 'down' = 'healthy'

  try {
    await sql`SELECT 1`
    checks.database = true
  } catch {
    status = 'degraded'
  }

  let userCount = 0
  try {
    const { rows } = await sql`SELECT COUNT(*)::int as n FROM users`
    userCount = Number(rows[0].n)
  } catch { /* ignore */ }

  checks.environment = !!(
    process.env.MAGIC_LINK_SECRET &&
    process.env.RESEND_API_KEY
  )

  if (!checks.environment) {
    status = 'degraded'
  }

  const healthyCount = Object.values(checks).filter(Boolean).length
  if (healthyCount < 2) {
    status = 'down'
  }

  const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 503 : 500

  return NextResponse.json({
    status,
    checks,
    userCount,
    build: buildInfo(),
  }, { status: statusCode })
}
