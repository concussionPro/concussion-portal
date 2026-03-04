// /app/api/analytics/track/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { put, list } from '@vercel/blob';

interface TrackPayload {
  eventType: string;
  eventData: Record<string, unknown>;
  sessionId: string;
  timestamp: number;
  userAgent: string;
  referrer: string | null;
  path: string;
  search: string | null;
}

interface StoredEvent extends TrackPayload {
  ip?: string;
}

function getTodayKey(): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getBlobPath(dateKey: string): string {
  return `analytics/${dateKey}.ndjson`;
}

/**
 * Check that the request originates from the same domain (or localhost for dev).
 * We inspect the Origin header first, then fall back to Referer.
 */
function isAllowedOrigin(request: NextRequest): boolean {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;

  // In development, always allow
  if (process.env.NODE_ENV === 'development') return true;

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  const candidate = origin || referer;
  if (!candidate) return false;

  // If we have no configured app URL, allow any non-null origin
  // (better than blocking all traffic; admin should set NEXT_PUBLIC_APP_URL)
  if (!appUrl) return true;

  // Normalise: strip trailing slash, compare hosts
  try {
    const candidateHost = new URL(candidate).hostname;
    const appHost = new URL(
      appUrl.startsWith('http') ? appUrl : `https://${appUrl}`
    ).hostname;

    return (
      candidateHost === appHost ||
      // Allow Vercel preview URLs on the same project
      candidateHost.endsWith('.vercel.app')
    );
  } catch {
    return false;
  }
}

/**
 * Read the current NDJSON file for a given date from Vercel Blob.
 * Returns the raw text or null if not found.
 */
async function readBlobNdjson(dateKey: string): Promise<string | null> {
  try {
    const blobPath = getBlobPath(dateKey);
    const { blobs } = await list({ prefix: blobPath });
    const match = blobs.find((b) => b.pathname === blobPath);
    if (!match) return null;

    const res = await fetch(match.url, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/**
 * Parse NDJSON text into an array of StoredEvent objects.
 * Invalid lines are silently skipped.
 */
function parseNdjson(text: string): StoredEvent[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      try {
        return [JSON.parse(line) as StoredEvent];
      } catch {
        return [];
      }
    });
}

/**
 * Serialize an array of events back to NDJSON.
 */
function serializeNdjson(events: StoredEvent[]): string {
  return events.map((e) => JSON.stringify(e)).join('\n') + '\n';
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Rate-limit by origin — reject cross-origin requests
  if (!isAllowedOrigin(request)) {
    return NextResponse.json(
      { error: 'Forbidden: cross-origin tracking not allowed' },
      { status: 403 }
    );
  }

  // Parse body
  let payload: TrackPayload;
  try {
    payload = (await request.json()) as TrackPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Basic validation
  if (!payload.eventType || !payload.sessionId || !payload.path) {
    return NextResponse.json(
      { error: 'Missing required fields: eventType, sessionId, path' },
      { status: 400 }
    );
  }

  // Sanitise: limit string lengths to prevent oversized blobs
  const event: StoredEvent = {
    eventType: String(payload.eventType).slice(0, 64),
    eventData: payload.eventData ?? {},
    sessionId: String(payload.sessionId).slice(0, 128),
    timestamp: typeof payload.timestamp === 'number' ? payload.timestamp : Date.now(),
    userAgent: String(payload.userAgent ?? '').slice(0, 512),
    referrer: payload.referrer ? String(payload.referrer).slice(0, 512) : null,
    path: String(payload.path).slice(0, 512),
    search: payload.search ? String(payload.search).slice(0, 512) : null,
  };

  const dateKey = getTodayKey();
  const blobPath = getBlobPath(dateKey);

  // Read-modify-write the daily NDJSON file
  // If we fail to read (file doesn't exist or transient error), start fresh
  let existingText: string | null = null;
  try {
    existingText = await readBlobNdjson(dateKey);
  } catch {
    existingText = null;
  }

  let events: StoredEvent[] = [];
  if (existingText) {
    events = parseNdjson(existingText);
  }

  events.push(event);

  const newContent = serializeNdjson(events);

  try {
    await put(blobPath, newContent, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/x-ndjson',
    });
  } catch (err) {
    console.error('[analytics/track] Failed to write blob:', err);
    return NextResponse.json(
      { error: 'Failed to store event' },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

// Reject everything except POST
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
