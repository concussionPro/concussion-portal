import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { sendEmail, escapeHtml } from '@/lib/resend-client'
import { CONFIG } from '@/lib/config'
import { getClientIp } from '@/lib/get-client-ip'
import {
  createSstClinic,
  getSstClinicByEmail,
  type SstClinic,
} from '@/lib/sst-trainer/clinic-registry'
import { buildWelcomeEmail } from '@/lib/sst-trainer/clinic-welcome-email'
import { grantSstEntitlement } from '@/lib/users'
import { createMagicToken } from '@/lib/magic-link-jwt'

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/platform/founding
//
// Founding-clinic signup for the SST Trainer platform — now SELF-SERVE
// provisioning (launch architecture 2026-07-02). On submit we:
//   1. Persist the lead to Postgres (founding_clinic_interest) — committed
//      FIRST so a lead is never lost to any downstream failure.
//   2. Provision the clinic immediately via the shared clinic registry
//      (lib/sst-trainer/clinic-registry): 6-char clinic code + private viewKey
//      in KV `clinic:{code}` + a durable sst_clinics row. Idempotent per email
//      — a resubmission reuses the existing clinic instead of minting a second
//      code.
//   3. Email the clinic their code, private Clinical Hub link and patient app
//      link (SST-branded welcome, resent on resubmission — doubles as a
//      "recover my link" path).
//   4. Notify Zac (best effort).
// If provisioning fails (KV down / not configured) the lead still lands and
// Zac gets the notification — he provisions manually, nothing is lost.
// ─────────────────────────────────────────────────────────────────────────────

// Rate limiting (in-memory, per-instance — matches register-interest)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(key: string, limit: number): boolean {
  const now = Date.now()
  if (rateLimitMap.size > 1000) rateLimitMap.clear()
  const entry = rateLimitMap.get(key)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 })
    return true
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}

const VALID_STATES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'] as const
const VALID_VOLUMES = ['1-3', '4-10', '11-25', '25+', 'unsure'] as const

const VOLUME_LABELS: Record<string, string> = {
  '1-3': '1–3 patients / month',
  '4-10': '4–10 patients / month',
  '11-25': '11–25 patients / month',
  '25+': '25+ patients / month',
  unsure: 'Not sure yet',
}

async function ensureTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS founding_clinic_interest (
      id SERIAL PRIMARY KEY,
      clinician_name TEXT NOT NULL,
      clinic_name TEXT NOT NULL,
      email TEXT NOT NULL,
      state TEXT NOT NULL,
      patient_volume TEXT NOT NULL,
      message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (email)
    )
  `
}

/** RETIRED 2026-08-04 (readiness audit P2-5): superseded by /api/sst/start.
 * This was a second, unlinked, unmonitored public clinic-provisioning
 * endpoint on the same rails — one front door only. */
export async function POST() {
  return NextResponse.json(
    { error: 'This signup has moved. Start your clinic trial at /clinical-suite/start' },
    { status: 410 },
  )
}
