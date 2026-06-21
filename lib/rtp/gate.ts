/**
 * Pre-launch access gate for the RTP Tracker API.
 *
 * Every /api/rtp/* route is GATED until the founder signs off — even though the
 * athlete surface will be free at launch, nothing is publicly reachable yet.
 * A request is allowed when it is either:
 *   - an admin request (admin_session cookie / x-admin-key / Bearer), or
 *   - carrying the shared demo key (x-demo-key header, ?demo= query, or the
 *     demo_key cookie set by /demo/essa) — the same pre-launch reviewer gate
 *     the EP / AI courses use.
 *
 * This mirrors checkAiCourseAccess() but without the enrolled-user path, since
 * RTP has no paid entitlement column. To launch publicly, relax this gate.
 */

import { isAdminRequest } from '@/lib/require-admin'
import { DEMO_KEY } from '@/lib/demo-key'

function cookieValue(header: string | null, name: string): string | undefined {
  if (!header) return undefined
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === name) return decodeURIComponent(v.join('='))
  }
  return undefined
}

export function isRtpRequestAllowed(request: Request): boolean {
  if (isAdminRequest(request)) return true
  let queryDemo: string | null = null
  try {
    queryDemo = new URL(request.url).searchParams.get('demo')
  } catch {
    /* non-absolute URL — ignore */
  }
  const supplied =
    request.headers.get('x-demo-key') ||
    queryDemo ||
    cookieValue(request.headers.get('cookie'), 'demo_key')
  return !!supplied && supplied === DEMO_KEY
}
