// /app/api/analytics/data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { list } from '@vercel/blob';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StoredEvent {
  eventType: string;
  eventData: Record<string, unknown>;
  sessionId: string;
  timestamp: number;
  userAgent: string;
  referrer: string | null;
  path: string;
  search: string | null;
}

interface StatValue {
  value: number;
  prev: number;
}

interface StatsResponse {
  pageviews: StatValue;
  uniques: StatValue;
  bounces: StatValue;
  totaltime: StatValue;
}

interface TimeSeriesPoint {
  x: string;
  y: number;
}

interface TimeSeriesResponse {
  pageviews: TimeSeriesPoint[];
  sessions: TimeSeriesPoint[];
}

type MetricPoint = { x: string; y: number };

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

function isAuthorised(request: NextRequest): boolean {
  const key = request.headers.get('x-admin-key');
  const expected = process.env.ANALYTICS_API_KEY;
  if (!expected) {
    // No key configured — block all access to prevent data leaks
    return false;
  }
  return key === expected;
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

/** Format a Date as YYYY-MM-DD in UTC */
function toDateKey(date: Date): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Return an array of YYYY-MM-DD strings for `days` days ending at `endDate` (inclusive) */
function dateRange(endDate: Date, days: number): string[] {
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(endDate);
    d.setUTCDate(d.getUTCDate() - i);
    keys.push(toDateKey(d));
  }
  return keys;
}

/** Parse period string like "7d", "30d", "90d" into number of days */
function parsePeriodDays(period: string): number {
  const match = period.match(/^(\d+)d$/);
  if (match) {
    const n = parseInt(match[1], 10);
    if (n > 0 && n <= 365) return n;
  }
  return 7;
}

// ---------------------------------------------------------------------------
// Blob fetching
// ---------------------------------------------------------------------------

/**
 * Fetch NDJSON content for a specific date key.
 * Returns parsed events or empty array.
 */
async function fetchEventsForDate(
  dateKey: string,
  blobUrlMap: Map<string, string>
): Promise<StoredEvent[]> {
  const url = blobUrlMap.get(`analytics/${dateKey}.ndjson`);
  if (!url) return [];

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [];
    const text = await res.text();
    return text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .flatMap((l) => {
        try {
          return [JSON.parse(l) as StoredEvent];
        } catch {
          return [];
        }
      });
  } catch {
    return [];
  }
}

/**
 * Build a map of pathname → url from Vercel Blob listing.
 * Fetches all blobs under the analytics/ prefix.
 */
async function buildBlobUrlMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    // list() is paginated; handle cursor-based pagination
    let cursor: string | undefined;
    do {
      const result = await list({
        prefix: 'analytics/',
        cursor,
        limit: 1000,
      });
      for (const blob of result.blobs) {
        map.set(blob.pathname, blob.url);
      }
      cursor = result.cursor;
    } while (cursor);
  } catch (err) {
    console.error('[analytics/data] Failed to list blobs:', err);
  }
  return map;
}

/**
 * Fetch events for a set of date keys in parallel (max concurrency: 10).
 */
async function fetchEventsForDateRange(
  dateKeys: string[],
  blobUrlMap: Map<string, string>
): Promise<StoredEvent[]> {
  const CONCURRENCY = 10;
  const allEvents: StoredEvent[] = [];

  for (let i = 0; i < dateKeys.length; i += CONCURRENCY) {
    const batch = dateKeys.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map((key) => fetchEventsForDate(key, blobUrlMap))
    );
    for (const r of results) allEvents.push(...r);
  }

  return allEvents;
}

// ---------------------------------------------------------------------------
// Aggregation helpers
// ---------------------------------------------------------------------------

function countPageviews(events: StoredEvent[]): number {
  return events.filter((e) => e.eventType === 'pageview').length;
}

function countUniqueSessionIds(events: StoredEvent[]): number {
  return new Set(events.map((e) => e.sessionId)).size;
}

/**
 * Bounce count: sessions with exactly 1 pageview.
 */
function countBounces(events: StoredEvent[]): number {
  const pvPerSession = new Map<string, number>();
  for (const e of events) {
    if (e.eventType === 'pageview') {
      pvPerSession.set(e.sessionId, (pvPerSession.get(e.sessionId) ?? 0) + 1);
    }
  }
  let bounces = 0;
  for (const count of pvPerSession.values()) {
    if (count === 1) bounces++;
  }
  return bounces;
}

/**
 * Total time: sum of (lastTimestamp - firstTimestamp) per session.
 * Sessions with only one event contribute 0.
 */
function calcTotalTime(events: StoredEvent[]): number {
  const firstTs = new Map<string, number>();
  const lastTs = new Map<string, number>();

  for (const e of events) {
    const ts = e.timestamp;
    if (!firstTs.has(e.sessionId) || ts < firstTs.get(e.sessionId)!) {
      firstTs.set(e.sessionId, ts);
    }
    if (!lastTs.has(e.sessionId) || ts > lastTs.get(e.sessionId)!) {
      lastTs.set(e.sessionId, ts);
    }
  }

  let total = 0;
  for (const [sid, first] of firstTs.entries()) {
    const last = lastTs.get(sid) ?? first;
    const duration = Math.max(0, last - first);
    // Cap per-session to 30 minutes to filter outliers
    total += Math.min(duration, 30 * 60 * 1000);
  }
  // Return in seconds
  return Math.round(total / 1000);
}

// ---------------------------------------------------------------------------
// Browser detection (simple UA parsing)
// ---------------------------------------------------------------------------

function detectBrowser(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes('edg/') || ua.includes('edge/')) return 'Edge';
  if (ua.includes('opr/') || ua.includes('opera')) return 'Opera';
  if (ua.includes('chrome') && !ua.includes('chromium')) return 'Chrome';
  if (ua.includes('chromium')) return 'Chromium';
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
  if (ua.includes('msie') || ua.includes('trident')) return 'IE';
  return 'Other';
}

function extractReferrerDomain(referrer: string | null): string {
  if (!referrer) return '(direct)';
  try {
    const url = new URL(referrer);
    return url.hostname.replace(/^www\\./, '');
  } catch {
    return referrer.slice(0, 100);
  }
}

// ---------------------------------------------------------------------------
// Response builders
// ---------------------------------------------------------------------------

function buildStats(current: StoredEvent[], prev: StoredEvent[]): StatsResponse {
  return {
    pageviews: {
      value: countPageviews(current),
      prev: countPageviews(prev),
    },
    uniques: {
      value: countUniqueSessionIds(current),
      prev: countUniqueSessionIds(prev),
    },
    bounces: {
      value: countBounces(current),
      prev: countBounces(prev),
    },
    totaltime: {
      value: calcTotalTime(current),
      prev: calcTotalTime(prev),
    },
  };
}

function buildTimeSeries(
  currentEvents: StoredEvent[],
  dateKeys: string[]
): TimeSeriesResponse {
  const pvByDate = new Map<string, number>();
  const sessionsByDate = new Map<string, Set<string>>();

  for (const key of dateKeys) {
    pvByDate.set(key, 0);
    sessionsByDate.set(key, new Set());
  }

  for (const e of currentEvents) {
    const dateKey = toDateKey(new Date(e.timestamp));
    if (e.eventType === 'pageview' && pvByDate.has(dateKey)) {
      pvByDate.set(dateKey, (pvByDate.get(dateKey) ?? 0) + 1);
    }
    if (sessionsByDate.has(dateKey)) {
      sessionsByDate.get(dateKey)!.add(e.sessionId);
    }
  }

  return {
    pageviews: dateKeys.map((key) => ({ x: key, y: pvByDate.get(key) ?? 0 })),
    sessions: dateKeys.map((key) => ({
      x: key,
      y: sessionsByDate.get(key)?.size ?? 0,
    })),
  };
}

function buildMetrics(
  events: StoredEvent[],
  metricType: string
): MetricPoint[] {
  const counts = new Map<string, number>();

  for (const e of events) {
    if (e.eventType !== 'pageview' && metricType === 'url') continue;

    let key: string;
    switch (metricType) {
      case 'url':
        key = e.path || '/';
        break;
      case 'referrer':
        key = extractReferrerDomain(e.referrer);
        break;
      case 'browser':
        key = detectBrowser(e.userAgent ?? '');
        break;
      default:
        key = 'unknown';
    }

    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([x, y]) => ({ x, y }));
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Auth check
  if (!isAuthorised(request)) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') ?? 'stats';
  const periodParam = searchParams.get('period') ?? '7d';
  const metricType = searchParams.get('metricType') ?? 'url';

  const days = parsePeriodDays(periodParam);

  // Build date ranges
  const today = new Date();
  const currentDates = dateRange(today, days);

  // Previous period: same length, immediately before the current period
  const prevEnd = new Date(today);
  prevEnd.setUTCDate(prevEnd.getUTCDate() - days);
  const prevDates = dateRange(prevEnd, days);

  // All dates we need to fetch
  const allDates = Array.from(new Set([...currentDates, ...prevDates]));

  // Fetch blob listing once
  const blobUrlMap = await buildBlobUrlMap();

  if (type === 'stats') {
    const [currentEvents, prevEvents] = await Promise.all([
      fetchEventsForDateRange(currentDates, blobUrlMap),
      fetchEventsForDateRange(prevDates, blobUrlMap),
    ]);

    const stats = buildStats(currentEvents, prevEvents);
    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  }

  if (type === 'pageviews') {
    const currentEvents = await fetchEventsForDateRange(currentDates, blobUrlMap);
    const timeSeries = buildTimeSeries(currentEvents, currentDates);
    return NextResponse.json(timeSeries, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  if (type === 'metrics') {
    // Metrics always use the current period
    const currentEvents = await fetchEventsForDateRange(currentDates, blobUrlMap);
    const metrics = buildMetrics(currentEvents, metricType);
    return NextResponse.json(metrics, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
}

// Reject non-GET
export async function POST(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
