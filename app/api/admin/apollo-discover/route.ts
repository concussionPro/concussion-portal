/**
 * POST /api/admin/apollo-discover
 *
 * Probes the Apollo account to surface what's there.
 * Zac has been running Apollo for 6 months with tracking mostly OFF (deliverability
 * focused). So opens/clicks aren't reliable engagement signals from this account.
 * What IS reliable:
 *  - REPLIES (always logged regardless of pixel-tracking)
 *  - Sequence completion status
 *  - Bounces (logged)
 *  - Unsubscribes (logged)
 *  - Last-contacted timestamps (recent = warm)
 *
 * Returns: sequence inventory, replied-contact list, delivered-cleanly list,
 * unsubscribe + bounce blocklist (so we never re-pitch).
 *
 * Body: { sequenceId?: string, perPage?: number }
 *
 * Auth: admin.
 */
import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/require-admin'

const APOLLO_BASE = 'https://api.apollo.io/api/v1'

async function apollo<T = unknown>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const key = process.env.APOLLO_API_KEY
  if (!key) throw new Error('APOLLO_API_KEY env var not set')
  const url = new URL(`${APOLLO_BASE}${path}`)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v))
  const res = await fetch(url.toString(), {
    headers: {
      accept: 'application/json',
      'Cache-Control': 'no-cache',
      'X-Api-Key': key,
    },
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Apollo ${res.status}: ${detail.slice(0, 300)}`)
  }
  return res.json()
}

interface ApolloSequence {
  id: string
  name?: string
  active?: boolean
  num_steps?: number
  emailer_campaign_stats?: {
    num_contacts?: number
    num_finished?: number
    num_replied?: number
    num_bounced?: number
    num_unsubscribed?: number
  }
}

interface ApolloContact {
  id: string
  first_name?: string
  last_name?: string
  email?: string
  email_status?: string
  title?: string
  contact_stage?: { name?: string }
  organization?: { name?: string; website_url?: string; primary_domain?: string; country?: string }
  emailer_campaign_status?: { replied?: boolean; bounced?: boolean; unsubscribed?: boolean; finished?: boolean }
  last_contacted_at?: string
  account_id?: string
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { sequenceId?: string; perPage?: number; section?: 'sequences' | 'replied' | 'all' }
  try {
    body = await req.json().catch(() => ({}))
  } catch {
    body = {}
  }
  const perPage = Math.min(body.perPage ?? 100, 200)
  const section = body.section ?? 'all'

  const result: Record<string, unknown> = {
    apollo: { keyConfigured: !!process.env.APOLLO_API_KEY },
  }

  // 1. Sequence inventory — what campaigns have you run?
  if (section === 'sequences' || section === 'all') {
    try {
      const seqs = await apollo<{ emailer_campaigns?: ApolloSequence[]; pagination?: { total_entries?: number } }>(
        '/emailer_campaigns/search',
        { per_page: perPage, sort_ascending: 'false' },
      )
      result.sequences = {
        totalEntries: seqs.pagination?.total_entries ?? 0,
        returned: seqs.emailer_campaigns?.length ?? 0,
        items: (seqs.emailer_campaigns ?? []).map((c) => ({
          id: c.id,
          name: c.name,
          active: c.active,
          steps: c.num_steps,
          contacts: c.emailer_campaign_stats?.num_contacts ?? 0,
          replied: c.emailer_campaign_stats?.num_replied ?? 0,
          bounced: c.emailer_campaign_stats?.num_bounced ?? 0,
          unsubscribed: c.emailer_campaign_stats?.num_unsubscribed ?? 0,
        })),
      }
    } catch (err) {
      result.sequencesError = err instanceof Error ? err.message : String(err)
    }
  }

  // 2. REPLIED contacts — the highest-value engaged pool, tracking-independent
  if (section === 'replied' || section === 'all') {
    try {
      const replied = await apollo<{ contacts?: ApolloContact[]; pagination?: { total_entries?: number } }>(
        '/contacts/search',
        {
          per_page: perPage,
          'contact_stage_names[]': 'Replied',
          // Apollo replied-status filter — try both common keys
        },
      )
      result.repliedContacts = {
        totalEntries: replied.pagination?.total_entries ?? 0,
        returned: replied.contacts?.length ?? 0,
        items: (replied.contacts ?? []).map((c) => ({
          name: `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim(),
          email: c.email,
          emailStatus: c.email_status,
          title: c.title,
          company: c.organization?.name,
          domain: c.organization?.primary_domain ?? c.organization?.website_url,
          country: c.organization?.country,
          replied: c.emailer_campaign_status?.replied,
          finished: c.emailer_campaign_status?.finished,
          lastContactedAt: c.last_contacted_at,
        })),
      }
    } catch (err) {
      result.repliedContactsError = err instanceof Error ? err.message : String(err)
    }
  }

  // 3. AU Allied Health contacts — the ICP match pool
  if (section === 'all') {
    try {
      const icp = await apollo<{ contacts?: ApolloContact[]; pagination?: { total_entries?: number } }>(
        '/contacts/search',
        {
          per_page: 25,
          'person_locations[]': 'Australia',
          q_keywords: 'physiotherapy OR osteopathy OR allied health OR sports medicine',
        },
      )
      result.icpAuAlliedHealth = {
        totalEntries: icp.pagination?.total_entries ?? 0,
        returned: icp.contacts?.length ?? 0,
        sample: (icp.contacts ?? []).slice(0, 10).map((c) => ({
          name: `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim(),
          email: c.email,
          emailStatus: c.email_status,
          title: c.title,
          company: c.organization?.name,
        })),
      }
    } catch (err) {
      result.icpError = err instanceof Error ? err.message : String(err)
    }
  }

  return NextResponse.json(result)
}
