/**
 * Pre-launch access gate for the RTP Tracker API.
 *
 * Every /api/rtp/* route is GATED until the founder signs off — even though the
 * athlete surface will be free at launch, nothing is publicly reachable yet.
 * A request is allowed when it is either:
 *   - an admin request (admin_session cookie / x-admin-key / Bearer), or
 *   - carrying the shared demo key (x-demo-key header or the demo_key cookie
 *     set by /demo/*) — the same pre-launch reviewer gate the EP / AI courses
 *     use. The ?demo= query param is intentionally NOT accepted (it leaks the
 *     key into logs / Referer). DEMO_KEY is empty (fail-closed) in production
 *     unless HEIDI_DEMO_KEY is set (see lib/demo-key.ts).
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
  const supplied =
    request.headers.get('x-demo-key') ||
    cookieValue(request.headers.get('cookie'), 'demo_key')
  return !!supplied && supplied === DEMO_KEY
}
