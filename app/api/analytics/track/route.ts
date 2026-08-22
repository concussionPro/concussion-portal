// /app/api/analytics/track/route.ts
// Analytics event ingestion — stores events in Vercel Postgres (Neon)
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getClientIp } from '@/lib/get-client-ip';
import { verifySessionToken } from '@/lib/jwt-session';
import { isOwnerEmail } from '@/lib/owner';
import { isDemoUserId, isDemoEmail } from '@/lib/demo-session';

// Rate limiting (in-memory, per serverless instance)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, limit: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

function isAllowedOrigin(request: NextRequest): boolean {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
  if (process.env.NODE_ENV === 'development') return true;

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const candidate = origin || referer;
  if (!candidate) return false;
  if (!appUrl) return true;

  try {
    const candidateHost = new URL(candidate).hostname;
    const appHost = new URL(
      appUrl.startsWith('http') ? appUrl : `https://${appUrl}`
    ).hostname;
    return (
      candidateHost === appHost ||
      candidateHost.endsWith('.vercel.app')
    );
  } catch {
    return false;
  }
}

/** Non-declaring crawlers, blocked by IP — see the note at the filter below. */
const BLOCKED_IPS = new Set<string>([
  '157.211.44.47', // Sydney; 2,312 events / 304 sessions, 6 weeks, zero logins
]);

const BOT_PATTERNS = [
  // Email-security link scanners + previewers (2026-07-30: cold rounds made
  // Singapore/US sandbox detonations the top GA 'city' — they execute JS):
  'safelinks', 'mimecast', 'proofpoint', 'barracuda', 'forcepoint',
  'googleimageproxy', 'expanse', 'bitsight', 'urlscan', 'checkmarknetworks',
  'office 365', 'microsoft office', 'slackbot', 'skypeuripreview',
  'bot', 'crawler', 'spider', 'headless', 'phantom', 'puppeteer',
  'selenium', 'googlebot', 'bingbot', 'yandex', 'baidu', 'duckduckbot',
  'slurp', 'ia_archiver', 'facebookexternalhit', 'twitterbot',
  'linkedinbot', 'embedly', 'quora link', 'outbrain', 'pinterest',
  'applebot', 'semrushbot', 'ahrefsbot', 'mj12bot', 'dotbot',
  'petalbot', 'bytespider', 'gptbot', 'claudebot',
];

/**
 * Query params that must never persist. `k` / `token` / `key` are credentials;
 * `email` is PII — `/auth/verify?email=<plaintext>&token=…` was writing the
 * user's address into the `search` column of every magic-link pageview, where
 * nothing reads it (only UTMs are parsed back out). Identity has one home: the
 * dedicated, normalised `user_email` column.
 */
const SENSITIVE_SEARCH_PARAMS = ['k', 'token', 'key', 'email'];

interface TrackPayload {
  eventType: string;
  eventData: Record<string, unknown>;
  sessionId: string;
  timestamp: number;
  userAgent: string;
  referrer: string | null;
  path: string;
  search: string | null;
  /** Optional — caller can stitch identity at event time (logged-in user,
   *  or email already collected via form). Persisted to user_email column
   *  for indexed JOINs to email_events + users. */
  userEmail?: string | null;
}

function stripSensitiveParams(search: string): string {
  try {
    const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
    for (const key of SENSITIVE_SEARCH_PARAMS) params.delete(key)
    const out = params.toString()
    return out ? `?${out}` : ''
  } catch {
    return ''
  }
}

/**
 * Which internal audience (if any) this request belongs to. Demo tours and
 * reviewer previews browse the REAL portal, so their pageviews were landing in
 * the same buckets as cold traffic — counted as unique visitors and sitting in
 * the bounce denominator. Tag rather than drop: the tour is still auditable in
 * the raw table (and /demo/* writes its own `demo_tour_start` row), while every
 * visitor-facing aggregate in /api/analytics/data filters `eventData.internal`.
 *
 * Note the demo cookies last 30 days, so a prospect who took a tour and comes
 * back organically stays tagged until the cookie expires. That is deliberate —
 * a prospect browsing under the demo identity is not measurable as ordinary
 * traffic anyway, and under-counting is the safer error for a truth metric.
 */
function internalSourceFor(request: NextRequest): string | null {
  if (request.cookies.get('clinic_demo')) return 'demo';
  if (request.cookies.get('demo_key')) return 'review';
  try {
    const tok = request.cookies.get('session')?.value;
    if (tok) {
      const sess = verifySessionToken(tok);
      if (sess && (isDemoUserId(sess.userId) || isDemoEmail(sess.email))) return 'demo';
    }
  } catch { /* unverifiable session — treat as ordinary traffic */ }
  return null;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const ip = getClientIp(request);
  if (!checkRateLimit(`ip:${ip}`, 200)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  let payload: TrackPayload;
  try {
    payload = (await request.json()) as TrackPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!payload.eventType || !payload.sessionId || !payload.path) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Exclude admin pages
  if (payload.path.startsWith('/admin')) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // Filter bots
  const ua = (payload.userAgent || '').toLowerCase();
// OWNER TRAFFIC (2026-07-30): Zac's own logged-in browsing polluted every
  // funnel (design reviews read as 20-visit sessions). Accept and drop.
  try {
    const tok = request.cookies.get('session')?.value
    if (tok) {
      const sess = verifySessionToken(tok)
      if (sess && isOwnerEmail(sess.email)) {
        return NextResponse.json({ success: true, skipped: 'owner' });
      }
    }
  } catch { /* fall through to normal handling */ }

  if (BOT_PATTERNS.some(p => ua.includes(p))) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // HEADLESS CRAWLERS THAT LIE ABOUT THEIR USER-AGENT (2026-08-22).
  //
  // BOT_PATTERNS only catches self-declaring bots. One client presenting a
  // normal desktop Chrome UA had logged 2,312 events / 304 sessions from a
  // single IP over six weeks — 16.6% of the entire event store, including 347
  // hits on /pricing — while never once logging in, never buying, and never
  // touching a page a human browses in that pattern. It inflated the
  // pricing-funnel denominator by ~20% and made every conversion rate a lie.
  //
  // Blocked by IP because that is the only stable signal it emits. Keep this
  // list SHORT and evidence-based: an IP earns a place here only after it has
  // been checked for a login, a purchase and an admin visit (a real clinic
  // behind NAT will have at least one).
  const clientIp = (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    ''
  ).trim();
  if (clientIp && BLOCKED_IPS.has(clientIp)) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const country = request.headers.get('cf-ipcountry') || request.headers.get('x-vercel-ip-country') || null;
  // Vercel populates region (state code, e.g. "NSW") and city (e.g. "Sydney")
  // on every request — captured so the demand heatmap can show anonymous
  // browsers' geography for planning where to host the next workshop.
  // Cloudflare uses different header names if traffic ever routes through CF.
  const region =
    request.headers.get('x-vercel-ip-country-region') ||
    request.headers.get('cf-region-code') ||
    null;
  const city =
    request.headers.get('x-vercel-ip-city') ||
    request.headers.get('cf-ipcity') ||
    null;
  const eventType = String(payload.eventType).slice(0, 64);
  const sessionId = String(payload.sessionId).slice(0, 128);
  const ts = typeof payload.timestamp === 'number' ? payload.timestamp : Date.now();
  const userAgent = String(payload.userAgent ?? '').slice(0, 512);
  const referrer = payload.referrer ? String(payload.referrer).slice(0, 512) : null;
  const pagePath = String(payload.path).slice(0, 512);
  // Credential params must never persist (2026-08-05 round-H #1): clinic
  // viewKeys (?k=) and magic tokens (?token=) arrive in page URLs — strip
  // server-side so BOTH client senders (AnalyticsProvider + lib/analytics
  // trackEvent) are covered.
  const search = payload.search ? stripSensitiveParams(String(payload.search)).slice(0, 512) : null;
  // Stamp the internal audience (demo tour / reviewer preview) so the dashboard
  // can exclude it from visitor-facing aggregates.
  const internal = internalSourceFor(request);
  const incomingData =
    payload.eventData && typeof payload.eventData === 'object' && !Array.isArray(payload.eventData)
      ? payload.eventData
      : {};
  const eventDataRaw = JSON.stringify({
    ...incomingData,
    ...(internal ? { internal } : {}),
  });
  const eventData = eventDataRaw.length > 4096 ? (internal ? `{"internal":"${internal}"}` : '{}') : eventDataRaw;
  // Normalise + clamp the optional user_email so a malformed client payload
  // can't write garbage to the indexed column.
  const userEmailRaw = payload.userEmail ?? null;
  const userEmail =
    typeof userEmailRaw === 'string' && userEmailRaw.includes('@') && userEmailRaw.length <= 254
      ? userEmailRaw.toLowerCase().trim()
      : null;

  try {
    await sql`
      INSERT INTO analytics_events (
        event_type, event_data, session_id, timestamp_ms, user_agent,
        referrer, path, search, ip, country, region, city, user_email
      ) VALUES (
        ${eventType}, ${eventData}::jsonb, ${sessionId}, ${ts}, ${userAgent},
        ${referrer}, ${pagePath}, ${search}, ${ip}, ${country}, ${region}, ${city}, ${userEmail}
      )
    `;
  } catch (err) {
    console.error('[analytics/track] Postgres write failed:', err);
    return NextResponse.json({ error: 'Failed to store event' }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
