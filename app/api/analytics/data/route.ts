// /app/api/analytics/data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Conditionally use @vercel/blob when token is available
let blobList: typeof import('@vercel/blob').list | null = null;
const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

if (useBlob) {
  try {
    const blob = require('@vercel/blob');
    blobList = blob.list;
  } catch {
    // @vercel/blob not available
  }
}

const LOCAL_DIR = path.join(process.cwd(), '.data', 'analytics');

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
  ip?: string;
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
  const expected = process.env.ANALYTICS_API_KEY || process.env.ADMIN_API_KEY;
  if (!expected || !key) return false;
  if (key.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(key), Buffer.from(expected));
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function toDateKey(date: Date): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function dateRange(endDate: Date, days: number): string[] {
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(endDate);
    d.setUTCDate(d.getUTCDate() - i);
    keys.push(toDateKey(d));
  }
  return keys;
}

function parsePeriodDays(period: string): number {
  const match = period.match(/^(\d+)d$/);
  if (match) {
    const n = parseInt(match[1], 10);
    if (n > 0 && n <= 365) return n;
  }
  return 7;
}

// ---------------------------------------------------------------------------
// Local filesystem storage (dev fallback)
// ---------------------------------------------------------------------------

function readLocalNdjson(dateKey: string): StoredEvent[] {
  const filePath = path.join(LOCAL_DIR, `${dateKey}.ndjson`);
  try {
    const text = fs.readFileSync(filePath, 'utf-8');
    return parseNdjson(text);
  } catch {
    return [];
  }
}

function fetchEventsLocalForDateRange(dateKeys: string[]): StoredEvent[] {
  const allEvents: StoredEvent[] = [];
  for (const key of dateKeys) {
    allEvents.push(...readLocalNdjson(key));
  }
  return allEvents;
}

// ---------------------------------------------------------------------------
// Blob fetching
// ---------------------------------------------------------------------------

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
    return parseNdjson(text);
  } catch {
    return [];
  }
}

async function buildBlobUrlMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!blobList) return map;
  try {
    let cursor: string | undefined;
    do {
      const result = await blobList({
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
// NDJSON parsing
// ---------------------------------------------------------------------------

function parseNdjson(text: string): StoredEvent[] {
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
    total += Math.min(duration, 30 * 60 * 1000);
  }
  return Math.round(total / 1000);
}

// ---------------------------------------------------------------------------
// Browser detection
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
    return url.hostname.replace(/^www\./, '');
  } catch {
    return referrer.slice(0, 100);
  }
}

function detectDevice(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|playbook|silk/i.test(ua)) return 'Tablet';
  if (/mobile|iphone|ipod|android.*mobile|windows phone/i.test(ua)) return 'Mobile';
  return 'Desktop';
}

// ---------------------------------------------------------------------------
// UTM / Channel helpers
// ---------------------------------------------------------------------------

const SEARCH_ENGINES = new Set([
  'google.com', 'google.com.au', 'bing.com', 'yahoo.com',
  'duckduckgo.com', 'baidu.com', 'yandex.ru',
]);

function getUtmFromEvent(e: StoredEvent): Record<string, string> {
  // Check eventData.utm first (new format)
  const ed = e.eventData as Record<string, any>;
  if (ed?.utm && typeof ed.utm === 'object') return ed.utm as Record<string, string>;
  // Fallback: parse from search string
  if (e.search) {
    try {
      const params = new URLSearchParams(e.search);
      const utms: Record<string, string> = {};
      for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid']) {
        const val = params.get(key);
        if (val) utms[key] = val;
      }
      return utms;
    } catch { /* ignore */ }
  }
  return {};
}

function classifyChannel(e: StoredEvent): string {
  const utm = getUtmFromEvent(e);
  if (utm.gclid || utm.utm_medium === 'cpc' || utm.utm_medium === 'paidsearch') return 'Paid Search';
  if (utm.utm_medium === 'email') return 'Email';
  if (utm.utm_medium === 'social' || utm.utm_medium === 'paidsocial') return 'Social';
  if (utm.utm_source) return 'Referral';
  const refDomain = extractReferrerDomain(e.referrer);
  if (refDomain === '(direct)') return 'Direct';
  if (SEARCH_ENGINES.has(refDomain)) return 'Organic Search';
  return 'Referral';
}

// ---------------------------------------------------------------------------
// Session analysis helpers
// ---------------------------------------------------------------------------

interface SessionSummary {
  sessionId: string;
  ip: string;
  events: StoredEvent[];
  firstTs: number;
  lastTs: number;
  duration: number;
  pageviews: number;
  pages: string[];
  entryPage: string;
  exitPage: string;
  channel: string;
  utmSource: string;
  utmCampaign: string;
  browser: string;
  device: string;
  isBounce: boolean;
  visitNumber: number;
  hasConversion: boolean;
  hasPricingView: boolean;
  hasPreseasonRegister: boolean;
  hasPreseasonSubmit: boolean;
  hasEnrollClick: boolean;
}

function buildSessionSummaries(events: StoredEvent[]): SessionSummary[] {
  const sessionMap = new Map<string, StoredEvent[]>();
  for (const e of events) {
    const arr = sessionMap.get(e.sessionId) || [];
    arr.push(e);
    sessionMap.set(e.sessionId, arr);
  }

  const summaries: SessionSummary[] = [];
  for (const [sessionId, sessionEvents] of sessionMap.entries()) {
    const sorted = sessionEvents.sort((a, b) => a.timestamp - b.timestamp);
    const pvEvents = sorted.filter((e) => e.eventType === 'pageview');
    const firstEvent = sorted[0];
    const lastEvent = sorted[sorted.length - 1];
    const utm = getUtmFromEvent(firstEvent);
    const ed = firstEvent.eventData as Record<string, any>;

    summaries.push({
      sessionId,
      ip: (firstEvent as any).ip || 'unknown',
      events: sorted,
      firstTs: firstEvent.timestamp,
      lastTs: lastEvent.timestamp,
      duration: Math.min(Math.max(0, lastEvent.timestamp - firstEvent.timestamp), 30 * 60 * 1000),
      pageviews: pvEvents.length,
      pages: pvEvents.map((e) => e.path),
      entryPage: pvEvents[0]?.path || firstEvent.path,
      exitPage: pvEvents.length > 0 ? pvEvents[pvEvents.length - 1].path : lastEvent.path,
      channel: classifyChannel(firstEvent),
      utmSource: utm.utm_source || '',
      utmCampaign: utm.utm_campaign || '',
      browser: detectBrowser(firstEvent.userAgent || ''),
      device: detectDevice(firstEvent.userAgent || ''),
      isBounce: pvEvents.length <= 1,
      visitNumber: typeof ed?.visitNumber === 'number' ? ed.visitNumber : 1,
      hasConversion: sorted.some((e) => e.path?.startsWith('/checkout/success')),
      hasPricingView: sorted.some((e) => e.path === '/pricing'),
      hasPreseasonRegister: sorted.some((e) => e.eventType === 'preseason_clinic_register'),
      hasPreseasonSubmit: sorted.some((e) => e.eventType === 'preseason_baseline_submit'),
      hasEnrollClick: sorted.some((e) => e.eventType === 'enroll_button_click'),
    });
  }

  return summaries.sort((a, b) => b.lastTs - a.lastTs);
}

// ---------------------------------------------------------------------------
// Marketing response builders
// ---------------------------------------------------------------------------

function buildChannels(sessions: SessionSummary[]) {
  const channelData = new Map<string, {
    sessions: number; pageviews: number; bounces: number;
    totalDuration: number; conversions: number; pricingViews: number;
  }>();

  for (const s of sessions) {
    const ch = s.channel;
    const existing = channelData.get(ch) || {
      sessions: 0, pageviews: 0, bounces: 0,
      totalDuration: 0, conversions: 0, pricingViews: 0,
    };
    existing.sessions++;
    existing.pageviews += s.pageviews;
    if (s.isBounce) existing.bounces++;
    existing.totalDuration += s.duration;
    if (s.hasConversion) existing.conversions++;
    if (s.hasPricingView) existing.pricingViews++;
    channelData.set(ch, existing);
  }

  return Array.from(channelData.entries())
    .sort((a, b) => b[1].sessions - a[1].sessions)
    .map(([channel, data]) => ({
      channel,
      sessions: data.sessions,
      pageviews: data.pageviews,
      bounceRate: data.sessions > 0 ? data.bounces / data.sessions : 0,
      avgDuration: data.sessions > 0 ? Math.round(data.totalDuration / data.sessions / 1000) : 0,
      conversions: data.conversions,
      conversionRate: data.sessions > 0 ? data.conversions / data.sessions : 0,
      pricingViews: data.pricingViews,
      intentRate: data.sessions > 0 ? data.pricingViews / data.sessions : 0,
    }));
}

function buildUtmBreakdown(sessions: SessionSummary[], field: 'utmSource' | 'utmCampaign') {
  const data = new Map<string, { sessions: number; conversions: number; pricingViews: number; bounces: number }>();
  for (const s of sessions) {
    const key = s[field] || '(none)';
    const existing = data.get(key) || { sessions: 0, conversions: 0, pricingViews: 0, bounces: 0 };
    existing.sessions++;
    if (s.hasConversion) existing.conversions++;
    if (s.hasPricingView) existing.pricingViews++;
    if (s.isBounce) existing.bounces++;
    data.set(key, existing);
  }
  return Array.from(data.entries())
    .filter(([k]) => k !== '(none)')
    .sort((a, b) => b[1].sessions - a[1].sessions)
    .slice(0, 20)
    .map(([name, d]) => ({
      name,
      sessions: d.sessions,
      conversions: d.conversions,
      pricingViews: d.pricingViews,
      bounceRate: d.sessions > 0 ? d.bounces / d.sessions : 0,
    }));
}

function buildSessionFlow(sessions: SessionSummary[]) {
  // Top entry pages
  const entryPages = new Map<string, number>();
  const exitPages = new Map<string, number>();
  for (const s of sessions) {
    entryPages.set(s.entryPage, (entryPages.get(s.entryPage) ?? 0) + 1);
    exitPages.set(s.exitPage, (exitPages.get(s.exitPage) ?? 0) + 1);
  }

  // Common page-to-page transitions
  const transitions = new Map<string, number>();
  for (const s of sessions) {
    for (let i = 0; i < s.pages.length - 1; i++) {
      const key = `${s.pages[i]} → ${s.pages[i + 1]}`;
      transitions.set(key, (transitions.get(key) ?? 0) + 1);
    }
  }

  // Visit distribution
  const visitDist = new Map<number, number>();
  for (const s of sessions) {
    const v = Math.min(s.visitNumber, 10);
    visitDist.set(v, (visitDist.get(v) ?? 0) + 1);
  }

  // Device split
  const devices = new Map<string, number>();
  for (const s of sessions) {
    devices.set(s.device, (devices.get(s.device) ?? 0) + 1);
  }

  return {
    entryPages: Array.from(entryPages.entries())
      .sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([x, y]) => ({ x, y })),
    exitPages: Array.from(exitPages.entries())
      .sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([x, y]) => ({ x, y })),
    topTransitions: Array.from(transitions.entries())
      .sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([x, y]) => ({ x, y })),
    visitDistribution: Array.from(visitDist.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([visit, count]) => ({ x: visit === 10 ? '10+' : String(visit), y: count })),
    devices: Array.from(devices.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([x, y]) => ({ x, y })),
  };
}

function buildRetargeting(sessions: SessionSummary[]) {
  // Group sessions by IP to find returning high-intent visitors
  const ipData = new Map<string, {
    ip: string; sessions: SessionSummary[]; totalPageviews: number;
    pricingViews: number; converted: boolean; lastSeen: number;
    pages: Set<string>; channel: string; device: string;
  }>();

  for (const s of sessions) {
    if (s.ip === 'unknown') continue;
    const existing = ipData.get(s.ip) || {
      ip: s.ip, sessions: [], totalPageviews: 0,
      pricingViews: 0, converted: false, lastSeen: 0,
      pages: new Set(), channel: s.channel, device: s.device,
    };
    existing.sessions.push(s);
    existing.totalPageviews += s.pageviews;
    if (s.hasPricingView) existing.pricingViews++;
    if (s.hasConversion) existing.converted = true;
    if (s.lastTs > existing.lastSeen) existing.lastSeen = s.lastTs;
    for (const p of s.pages) existing.pages.add(p);
    ipData.set(s.ip, existing);
  }

  // High-intent non-converters: viewed pricing but didn't convert
  const hotLeads = Array.from(ipData.values())
    .filter((d) => d.pricingViews > 0 && !d.converted)
    .sort((a, b) => b.pricingViews - a.pricingViews || b.sessions.length - a.sessions.length)
    .slice(0, 20)
    .map((d) => ({
      ip: d.ip,
      visits: d.sessions.length,
      pageviews: d.totalPageviews,
      pricingViews: d.pricingViews,
      lastSeen: d.lastSeen,
      pagesVisited: Array.from(d.pages).slice(0, 5),
      channel: d.channel,
      device: d.device,
    }));

  // Preseason leads who haven't viewed pricing
  const preseasonLeads = Array.from(ipData.values())
    .filter((d) =>
      d.sessions.some((s) => s.hasPreseasonRegister || s.hasPreseasonSubmit) &&
      !d.converted && d.pricingViews === 0
    )
    .sort((a, b) => b.lastSeen - a.lastSeen)
    .slice(0, 20)
    .map((d) => ({
      ip: d.ip,
      visits: d.sessions.length,
      lastSeen: d.lastSeen,
      hasRegistered: d.sessions.some((s) => s.hasPreseasonRegister),
      hasSubmitted: d.sessions.some((s) => s.hasPreseasonSubmit),
      channel: d.channel,
    }));

  // Summary stats
  const totalVisitors = ipData.size;
  const returningVisitors = Array.from(ipData.values()).filter((d) => d.sessions.length > 1).length;
  const pricingViewers = Array.from(ipData.values()).filter((d) => d.pricingViews > 0).length;
  const converters = Array.from(ipData.values()).filter((d) => d.converted).length;

  return {
    hotLeads,
    preseasonLeads,
    summary: {
      totalVisitors,
      returningVisitors,
      returningRate: totalVisitors > 0 ? returningVisitors / totalVisitors : 0,
      pricingViewers,
      pricingToConversion: pricingViewers > 0 ? converters / pricingViewers : 0,
      converters,
    },
  };
}

function buildExpandedFunnel(sessions: SessionSummary[]) {
  // Direct funnel: Homepage → Preview → Pricing → Checkout
  const directFunnel = [
    { label: 'Homepage', count: sessions.filter((s) => s.pages.includes('/')).length },
    { label: 'Preview / Course', count: sessions.filter((s) => s.pages.some((p) => p.startsWith('/preview') || p.startsWith('/course') || p.startsWith('/scat-mastery'))).length },
    { label: 'Pricing Page', count: sessions.filter((s) => s.hasPricingView).length },
    { label: 'Enrol Click', count: sessions.filter((s) => s.hasEnrollClick).length },
    { label: 'Checkout Success', count: sessions.filter((s) => s.hasConversion).length },
  ];

  // Preseason funnel: Preseason Landing → Register → Baseline Submit → Pricing → Checkout
  const preseasonFunnel = [
    { label: 'Preseason Landing', count: sessions.filter((s) => s.pages.some((p) => p.startsWith('/preseason'))).length },
    { label: 'Clinic Register', count: sessions.filter((s) => s.hasPreseasonRegister).length },
    { label: 'Baseline Submit', count: sessions.filter((s) => s.hasPreseasonSubmit).length },
    { label: 'Viewed Pricing', count: sessions.filter((s) => (s.hasPreseasonRegister || s.hasPreseasonSubmit) && s.hasPricingView).length },
    { label: 'Converted', count: sessions.filter((s) => (s.hasPreseasonRegister || s.hasPreseasonSubmit) && s.hasConversion).length },
  ];

  return { directFunnel, preseasonFunnel };
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
// Unified event fetcher (blob or local)
// ---------------------------------------------------------------------------

async function getEventsForDateRange(dateKeys: string[]): Promise<StoredEvent[]> {
  if (useBlob && blobList) {
    const blobUrlMap = await buildBlobUrlMap();
    return fetchEventsForDateRange(dateKeys, blobUrlMap);
  }
  return fetchEventsLocalForDateRange(dateKeys);
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorised(request)) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') ?? 'stats';
  const periodParam = searchParams.get('period') ?? '7d';
  const metricType = searchParams.get('metricType') ?? 'url';

  const days = parsePeriodDays(periodParam);

  const today = new Date();
  const currentDates = dateRange(today, days);

  const prevEnd = new Date(today);
  prevEnd.setUTCDate(prevEnd.getUTCDate() - days);
  const prevDates = dateRange(prevEnd, days);

  if (type === 'stats') {
    const [currentEvents, prevEvents] = await Promise.all([
      getEventsForDateRange(currentDates),
      getEventsForDateRange(prevDates),
    ]);

    const stats = buildStats(currentEvents, prevEvents);
    return NextResponse.json(stats, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  if (type === 'pageviews') {
    const currentEvents = await getEventsForDateRange(currentDates);
    const timeSeries = buildTimeSeries(currentEvents, currentDates);
    return NextResponse.json(timeSeries, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  if (type === 'metrics') {
    const currentEvents = await getEventsForDateRange(currentDates);
    const metrics = buildMetrics(currentEvents, metricType);
    return NextResponse.json(metrics, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  // Custom events breakdown — counts by eventType (excludes pageviews)
  if (type === 'events') {
    const currentEvents = await getEventsForDateRange(currentDates);
    const counts = new Map<string, { count: number; latest: StoredEvent[] }>();

    for (const e of currentEvents) {
      if (e.eventType === 'pageview') continue;
      const existing = counts.get(e.eventType) || { count: 0, latest: [] };
      existing.count++;
      if (existing.latest.length < 10) existing.latest.push(e);
      counts.set(e.eventType, existing);
    }

    const events = Array.from(counts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([eventType, data]) => ({
        eventType,
        count: data.count,
        latest: data.latest.map((e) => ({
          timestamp: e.timestamp,
          data: e.eventData,
          path: e.path,
        })),
      }));

    return NextResponse.json(events, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  // Channel attribution — sessions grouped by traffic source with conversion data
  if (type === 'channels') {
    const currentEvents = await getEventsForDateRange(currentDates);
    const sessions = buildSessionSummaries(currentEvents);
    const channels = buildChannels(sessions);
    const utmSources = buildUtmBreakdown(sessions, 'utmSource');
    const utmCampaigns = buildUtmBreakdown(sessions, 'utmCampaign');
    return NextResponse.json({ channels, utmSources, utmCampaigns }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  // Session flow — entry/exit pages, transitions, device split, visit distribution
  if (type === 'flow') {
    const currentEvents = await getEventsForDateRange(currentDates);
    const sessions = buildSessionSummaries(currentEvents);
    const flow = buildSessionFlow(sessions);
    return NextResponse.json(flow, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  // Retargeting — high-intent non-converters, preseason leads, IP-level data
  if (type === 'retargeting') {
    const currentEvents = await getEventsForDateRange(currentDates);
    const sessions = buildSessionSummaries(currentEvents);
    const retargeting = buildRetargeting(sessions);
    return NextResponse.json(retargeting, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  // Expanded funnel — direct path + preseason-to-course path
  if (type === 'funnel') {
    const currentEvents = await getEventsForDateRange(currentDates);
    const sessions = buildSessionSummaries(currentEvents);
    const funnel = buildExpandedFunnel(sessions);
    return NextResponse.json(funnel, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
}

export async function POST(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
