// /app/api/analytics/track/route.ts
// Analytics event ingestion — stores events in Vercel Postgres (Neon)
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getClientIp } from '@/lib/get-client-ip';

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

const BOT_PATTERNS = [
  'bot', 'crawler', 'spider', 'headless', 'phantom', 'puppeteer',
  'selenium', 'googlebot', 'bingbot', 'yandex', 'baidu', 'duckduckbot',
  'slurp', 'ia_archiver', 'facebookexternalhit', 'twitterbot',
  'linkedinbot', 'embedly', 'quora link', 'outbrain', 'pinterest',
  'applebot', 'semrushbot', 'ahrefsbot', 'mj12bot', 'dotbot',
  'petalbot', 'bytespider', 'gptbot', 'claudebot',
];

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
  if (BOT_PATTERNS.some(p => ua.includes(p))) {
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
  const search = payload.search ? String(payload.search).slice(0, 512) : null;
  const eventDataRaw = JSON.stringify(payload.eventData ?? {});
  const eventData = eventDataRaw.length > 4096 ? '{}' : eventDataRaw;
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
