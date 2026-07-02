// /app/api/analytics/data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { sql } from '@/lib/db';
import { isAdminRequest } from '@/lib/require-admin';

// Legacy blob support removed — all data now in Vercel Postgres

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
  country?: string;
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
  // Delegate to shared helper so the cookie-based admin session works here too.
  // Falls through to x-admin-key / Bearer for cron / CLI clients.
  // Still honors ANALYTICS_API_KEY as an alternate header if configured.
  if (isAdminRequest(request)) return true;

  const analyticsKey = process.env.ANALYTICS_API_KEY;
  if (!analyticsKey) return false;
  const headerKey = request.headers.get('x-admin-key');
  if (!headerKey) return false;
  const aHash = crypto.createHmac('sha256', 'compare').update(headerKey).digest();
  const bHash = crypto.createHmac('sha256', 'compare').update(analyticsKey).digest();
  return crypto.timingSafeEqual(aHash, bHash);
}

// ---------------------------------------------------------------------------
// Date helpers — ALL day bucketing is Australia/Sydney (the business
// timezone). Previously every boundary was UTC, so the "24h" tab reset at
// ~10-11am AEST and growth deltas compared a partial UTC day against a full
// one every morning. Day keys are Sydney calendar dates; window start/end
// timestamps are Sydney midnights converted to UTC epoch ms.
// ---------------------------------------------------------------------------

const SYDNEY_TZ = 'Australia/Sydney';

// en-CA locale formats as YYYY-MM-DD, matching the existing date-key shape.
const sydneyDayFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: SYDNEY_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
});

/** Calendar date key (YYYY-MM-DD) for an instant, in Australia/Sydney. */
function toDateKey(date: Date): string {
  return sydneyDayFmt.format(date);
}

/** Sydney's UTC offset in minutes at a given instant — 600 (AEST) or 660 (AEDT). */
function sydneyOffsetMinutes(at: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: SYDNEY_TZ, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(at).reduce<Record<string, string>>((acc, p) => { acc[p.type] = p.value; return acc; }, {});
  const asUtc = Date.UTC(
    Number(parts.year), Number(parts.month) - 1, Number(parts.day),
    Number(parts.hour) % 24, Number(parts.minute), Number(parts.second),
  );
  return Math.round((asUtc - at.getTime()) / 60_000);
}

/** UTC epoch ms of midnight (00:00) in Sydney for a YYYY-MM-DD date key. */
function sydneyMidnightUtcMs(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number);
  // Start from UTC midnight, then correct by the Sydney offset. Iterate twice
  // so a DST transition between the initial guess and the target converges.
  let ts = Date.UTC(y, m - 1, d);
  for (let i = 0; i < 2; i++) {
    ts = Date.UTC(y, m - 1, d) - sydneyOffsetMinutes(new Date(ts)) * 60_000;
  }
  return ts;
}

/** Pure calendar arithmetic on a YYYY-MM-DD key (no timezone involved). */
function addDaysToKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${dt.getUTCFullYear()}-${mm}-${dd}`;
}

/** `days` consecutive Sydney calendar-date keys ending at endKey (inclusive). */
function dateRange(endKey: string, days: number): string[] {
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    keys.push(addDaysToKey(endKey, -i));
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
// Postgres event fetching
// ---------------------------------------------------------------------------

async function fetchEventsFromPostgres(startMs: number, endMs: number): Promise<StoredEvent[]> {
  try {
    const { rows } = await sql`
      SELECT event_type, event_data, session_id, timestamp_ms, user_agent,
             referrer, path, search, ip, country
      FROM analytics_events
      WHERE timestamp_ms >= ${startMs} AND timestamp_ms < ${endMs}
      ORDER BY timestamp_ms ASC
    `;
    return rows.map((r: any) => ({
      eventType: r.event_type,
      eventData: typeof r.event_data === 'string' ? JSON.parse(r.event_data) : (r.event_data || {}),
      sessionId: r.session_id,
      timestamp: Number(r.timestamp_ms),
      userAgent: r.user_agent || '',
      referrer: r.referrer || null,
      path: r.path,
      search: r.search || null,
      ip: r.ip,
      country: r.country,
    }));
  } catch (err) {
    console.error('[analytics/data] Postgres read failed:', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Aggregation helpers
// ---------------------------------------------------------------------------

/** Filter out server-side webhook events (sessionId starts with 'server_') */
function excludeServerEvents(events: StoredEvent[]): StoredEvent[] {
  return events.filter((e) => !e.sessionId.startsWith('server_'));
}

/** Match both 'page_view' (current client) and 'pageview' (legacy data) */
function isPageView(e: StoredEvent): boolean {
  return e.eventType === 'page_view' || e.eventType === 'pageview';
}

function countPageviews(events: StoredEvent[]): number {
  return events.filter(isPageView).length;
}

function countUniqueSessionIds(events: StoredEvent[]): number {
  return new Set(events.map((e) => e.sessionId)).size;
}

function countBounces(events: StoredEvent[]): number {
  const pvPerSession = new Map<string, number>();
  for (const e of events) {
    if (isPageView(e)) {
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
  if (utm.fbclid) return 'Social';
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
  country: string;
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
  // Exclude server-side webhook events from session analysis
  const clientEvents = excludeServerEvents(events);
  const sessionMap = new Map<string, StoredEvent[]>();
  for (const e of clientEvents) {
    const arr = sessionMap.get(e.sessionId) || [];
    arr.push(e);
    sessionMap.set(e.sessionId, arr);
  }

  const summaries: SessionSummary[] = [];
  for (const [sessionId, sessionEvents] of sessionMap.entries()) {
    const sorted = sessionEvents.sort((a, b) => a.timestamp - b.timestamp);
    const pvEvents = sorted.filter((e) => isPageView(e));
    const firstEvent = sorted[0];
    const lastEvent = sorted[sorted.length - 1];
    const utm = getUtmFromEvent(firstEvent);
    const ed = firstEvent.eventData as Record<string, any>;

    summaries.push({
      sessionId,
      ip: (firstEvent as any).ip || 'unknown',
      country: firstEvent.country || '',
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
      hasPricingView: sorted.some((e) => e.path === '/pricing' || e.path === '/pricing-international'),
      hasPreseasonRegister: sorted.some((e) => e.eventType === 'preseason_clinic_register'),
      hasPreseasonSubmit: sorted.some((e) => e.eventType === 'preseason_baseline_submit'),
      hasEnrollClick: sorted.some((e) => e.eventType === 'enroll_button_click' || e.eventType === 'enrol_click' || e.eventType === 'checkout_start' || e.eventType === 'shop_click'),
    });
  }

  return summaries.sort((a, b) => b.lastTs - a.lastTs);
}

// ---------------------------------------------------------------------------
// Marketing response builders
// ---------------------------------------------------------------------------

// NOTE: `conversions` in the channel/UTM breakdowns are PAGE-BASED (sessions
// that reached /checkout/success). Server-verified purchase events carry a
// `server_` session id and can't be attributed to a channel/UTM, so these
// stay session-based for attribution — the UI labels them "page conv." and
// the headline Conversions card uses verified purchase events instead.
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

/**
 * Count verified COURSE purchases in the window from server-side events.
 *
 * Why this exists: the client-side `hasConversion` flag was set on any
 * session that hit /checkout/success — so refreshes, bookmarks, and stale
 * URL revisits all inflated the number. The Stripe webhook writes
 * `purchase_complete` events to the same table with a `server_` session_id
 * (filtered out of session-level analysis), so counting those events in
 * the window gives us a DB-of-record truth number immune to pageview noise.
 *
 * `reference_purchase` (the Clinical Reference Text book) is deliberately
 * EXCLUDED — it's a $-small side product and was inflating course-funnel
 * conversion counts. It's reported separately via countBookPurchases().
 */
function countVerifiedPurchases(rawEvents: StoredEvent[]): number {
  return rawEvents.filter((e) => e.eventType === 'purchase_complete').length;
}

/** Verified reference-book purchases in the window (reported separately). */
function countBookPurchases(rawEvents: StoredEvent[]): number {
  return rawEvents.filter((e) => e.eventType === 'reference_purchase').length;
}

function buildRetargeting(sessions: SessionSummary[], rawEvents: StoredEvent[]) {
  // Group sessions by IP to find returning high-intent visitors
  const ipData = new Map<string, {
    ip: string; sessions: SessionSummary[]; totalPageviews: number;
    pricingViews: number; converted: boolean; lastSeen: number;
    pages: Set<string>; channel: string; device: string; country: string;
  }>();

  for (const s of sessions) {
    if (s.ip === 'unknown') continue;
    const existing = ipData.get(s.ip) || {
      ip: s.ip, sessions: [], totalPageviews: 0,
      pricingViews: 0, converted: false, lastSeen: 0,
      pages: new Set(), channel: s.channel, device: s.device, country: s.country,
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
      country: d.country,
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
      country: d.country,
    }));

  // Summary stats
  const totalVisitors = ipData.size;
  const returningVisitors = Array.from(ipData.values()).filter((d) => d.sessions.length > 1).length;
  const pricingViewerEntries = Array.from(ipData.values()).filter((d) => d.pricingViews > 0);
  const pricingViewers = pricingViewerEntries.length;
  // Pricing → conversion is a same-unit rate: IPs that viewed pricing AND
  // hit checkout success ÷ IPs that viewed pricing. Per-IP boolean dedup means
  // success-page refreshes can't inflate it, and the units match so no clamp
  // is needed (the old version divided purchase EVENTS by viewer IPs and hid
  // the mismatch behind Math.min(1, ...)).
  const convertedPricingViewers = pricingViewerEntries.filter((d) => d.converted).length;
  // Authoritative: count server-side purchase_complete events in the window,
  // not client-side /checkout/success pageviews. Stale URL refreshes inflated
  // the old number (saw 2 "conversions" on days with 0 Stripe payments).
  const converters = countVerifiedPurchases(rawEvents);
  const bookPurchases = countBookPurchases(rawEvents);

  // Geography breakdown
  const countryCounts = new Map<string, number>();
  for (const d of ipData.values()) {
    const c = d.country || 'Unknown';
    countryCounts.set(c, (countryCounts.get(c) ?? 0) + 1);
  }
  const geography = Array.from(countryCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([country, visitors]) => ({ country, visitors }));

  return {
    hotLeads,
    preseasonLeads,
    geography,
    summary: {
      totalVisitors,
      returningVisitors,
      returningRate: totalVisitors > 0 ? returningVisitors / totalVisitors : 0,
      pricingViewers,
      // Same-unit rate: purchasing pricing-viewer IPs ÷ pricing-viewer IPs.
      // Success-page based per IP (server purchases can't be joined to IPs).
      pricingToConversion: pricingViewers > 0 ? convertedPricingViewers / pricingViewers : 0,
      converters,
      // Reference-book sales in the window — reported separately, never
      // mixed into course conversion counts.
      bookPurchases,
    },
  };
}

function buildExpandedFunnel(sessions: SessionSummary[], rawEvents: StoredEvent[]) {
  // Direct funnel: Homepage → Preview → Pricing → Checkout.
  // Final step uses VERIFIED purchases (server-side purchase_complete events
  // written by the Stripe webhook) instead of /checkout/success pageviews —
  // refreshes / bookmarked success URLs were inflating the old count.
  const directFunnel = [
    { label: 'Homepage', count: sessions.filter((s) => s.pages.includes('/')).length },
    { label: 'Preview / Course', count: sessions.filter((s) => s.pages.some((p) => p.startsWith('/preview') || p.startsWith('/course') || p.startsWith('/scat-mastery'))).length },
    { label: 'Pricing Page', count: sessions.filter((s) => s.hasPricingView).length },
    { label: 'Enrol Click', count: sessions.filter((s) => s.hasEnrollClick).length },
    { label: 'Purchases (verified)', count: countVerifiedPurchases(rawEvents) },
  ];

  // Preseason funnel: Preseason Landing → Register → Baseline Submit → Pricing → Checkout
  const preseasonFunnel = [
    { label: 'Preseason Landing', count: sessions.filter((s) => s.pages.some((p) => p.startsWith('/preseason'))).length },
    { label: 'Clinic Register', count: sessions.filter((s) => s.hasPreseasonRegister).length },
    { label: 'Baseline Submit', count: sessions.filter((s) => s.hasPreseasonSubmit).length },
    // Final step stays session-based because server purchase events can't be
    // joined back to preseason sessions — labelled page-based so it's never
    // read as a verified-purchase count.
    { label: 'Viewed Pricing', count: sessions.filter((s) => (s.hasPreseasonRegister || s.hasPreseasonSubmit) && s.hasPricingView).length },
    { label: 'Converted (page-based)', count: sessions.filter((s) => (s.hasPreseasonRegister || s.hasPreseasonSubmit) && s.hasConversion).length },
  ];

  return { directFunnel, preseasonFunnel };
}

// ---------------------------------------------------------------------------
// Insights — auto-generated marketing recommendations
// ---------------------------------------------------------------------------

interface Insight {
  type: 'critical' | 'warning' | 'opportunity' | 'positive';
  category: 'funnel' | 'channel' | 'content' | 'audience' | 'preseason' | 'ads';
  title: string;
  detail: string;
  metric: string;
  action: string;
}

function buildInsights(
  sessions: SessionSummary[],
  stats: StatsResponse,
  prevStats: StatsResponse | null,
): Insight[] {
  const insights: Insight[] = [];
  if (sessions.length === 0) return insights;

  const totalSessions = sessions.length;
  const pricingViewers = sessions.filter((s) => s.hasPricingView).length;
  const enrollClickers = sessions.filter((s) => s.hasEnrollClick).length;
  // Per-segment "conversion" mentions below are success-page based (session
  // attribution) — verified purchase truth lives on the headline card.
  const bouncers = sessions.filter((s) => s.isBounce).length;
  const bounceRate = bouncers / totalSessions;

  // --- Funnel insights ---

  // Pricing page drop-off
  if (pricingViewers > 3) {
    const pricingToEnrol = enrollClickers / pricingViewers;
    if (pricingToEnrol < 0.05) {
      insights.push({
        type: 'critical',
        category: 'funnel',
        title: 'Pricing page is leaking',
        detail: `Only ${(pricingToEnrol * 100).toFixed(1)}% of pricing page viewers click Enrol. ${pricingViewers} people looked at pricing, only ${enrollClickers} clicked through.`,
        metric: `${(pricingToEnrol * 100).toFixed(1)}% pricing → enrol`,
        action: 'Add testimonials to pricing page. Clarify what they get. Add urgency (early bird deadline). Consider adding a comparison table.',
      });
    } else if (pricingToEnrol > 0.15) {
      insights.push({
        type: 'positive',
        category: 'funnel',
        title: 'Pricing page converts well',
        detail: `${(pricingToEnrol * 100).toFixed(1)}% of pricing viewers click Enrol. This is strong for a $497+ product.`,
        metric: `${(pricingToEnrol * 100).toFixed(1)}% pricing → enrol`,
        action: 'Focus on driving MORE traffic to /pricing rather than optimising the page itself.',
      });
    }
  }

  // Traffic → pricing intent
  if (totalSessions > 10) {
    const trafficToIntent = pricingViewers / totalSessions;
    if (trafficToIntent < 0.03) {
      insights.push({
        type: 'warning',
        category: 'funnel',
        title: 'Low purchase intent',
        detail: `Only ${(trafficToIntent * 100).toFixed(1)}% of all sessions reach /pricing. Most visitors never see your offer.`,
        metric: `${(trafficToIntent * 100).toFixed(1)}% intent rate`,
        action: 'Add CTAs to high-traffic pages pointing to /pricing. Make pricing link more prominent in nav. Add "See Pricing" in the free course completion flow.',
      });
    }
  }

  // High bounce rate
  if (totalSessions > 10 && bounceRate > 0.7) {
    insights.push({
      type: 'warning',
      category: 'content',
      title: 'High bounce rate',
      detail: `${(bounceRate * 100).toFixed(0)}% of visitors leave after one page. Either traffic quality is poor or the landing page doesn't match visitor expectations.`,
      metric: `${(bounceRate * 100).toFixed(0)}% bounce rate`,
      action: 'Check if Google Ads landing page matches ad copy. Add clear next-step CTAs above the fold. Consider if blog posts need internal links.',
    });
  }

  // --- Channel insights ---
  const channelGroups = new Map<string, SessionSummary[]>();
  for (const s of sessions) {
    const arr = channelGroups.get(s.channel) || [];
    arr.push(s);
    channelGroups.set(s.channel, arr);
  }

  const paidSessions = channelGroups.get('Paid Search') || [];
  if (paidSessions.length > 3) {
    const paidBounce = paidSessions.filter((s) => s.isBounce).length / paidSessions.length;
    const paidIntent = paidSessions.filter((s) => s.hasPricingView).length / paidSessions.length;
    if (paidBounce > 0.6) {
      insights.push({
        type: 'critical',
        category: 'ads',
        title: 'Google Ads traffic is bouncing',
        detail: `${(paidBounce * 100).toFixed(0)}% of paid visitors bounce immediately. You're paying for clicks that don't engage.`,
        metric: `${(paidBounce * 100).toFixed(0)}% paid bounce`,
        action: 'Review ad copy vs landing page match. Check keyword relevance. Consider negative keywords. Make sure landing page loads fast on mobile.',
      });
    }
    if (paidIntent > 0.15) {
      insights.push({
        type: 'positive',
        category: 'ads',
        title: 'Google Ads driving purchase intent',
        detail: `${(paidIntent * 100).toFixed(0)}% of paid visitors view pricing. Your ads are attracting qualified buyers.`,
        metric: `${(paidIntent * 100).toFixed(0)}% paid → pricing`,
        action: 'Consider increasing ad spend on high-performing campaigns. This intent rate justifies higher bids.',
      });
    }
  }

  // Email channel
  const emailSessions = channelGroups.get('Email') || [];
  if (emailSessions.length > 0) {
    const emailIntent = emailSessions.filter((s) => s.hasPricingView).length / emailSessions.length;
    insights.push({
      type: emailIntent > 0.1 ? 'positive' : 'opportunity',
      category: 'channel',
      title: `Email driving ${emailSessions.length} sessions`,
      detail: `${(emailIntent * 100).toFixed(0)}% of email visitors view pricing. ${emailSessions.filter((s) => s.hasConversion).length} reached the success page (page-based).`,
      metric: `${emailSessions.length} email sessions`,
      action: emailIntent < 0.1
        ? 'Cold emails are reaching the site but not driving pricing views. Add a direct /pricing link in the email. Lead with the problem, not the product.'
        : 'Email campaign is working. Scale what\'s converting — send more to similar audiences.',
    });
  }

  // --- Content insights ---

  // Top exit pages (excluding checkout success)
  const exitCounts = new Map<string, number>();
  for (const s of sessions) {
    if (s.exitPage === '/checkout/success') continue;
    exitCounts.set(s.exitPage, (exitCounts.get(s.exitPage) ?? 0) + 1);
  }
  const topExits = Array.from(exitCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  if (topExits.length > 0 && topExits[0][1] > totalSessions * 0.15) {
    const [exitPage, exitCount] = topExits[0];
    insights.push({
      type: 'warning',
      category: 'content',
      title: `"${exitPage}" is your top exit page`,
      detail: `${exitCount} sessions (${((exitCount / totalSessions) * 100).toFixed(0)}%) end here. This page may need a stronger CTA or better next-step guidance.`,
      metric: `${exitCount} exits`,
      action: exitPage === '/pricing'
        ? 'Pricing page exits = price objection. Add testimonials, money-back guarantee, or payment plans.'
        : `Add a clear CTA on ${exitPage} pointing toward /pricing or /scat-mastery.`,
    });
  }

  // Blog → intent conversion
  const blogSessions = sessions.filter((s) => s.entryPage.startsWith('/blog/'));
  if (blogSessions.length > 5) {
    const blogToIntent = blogSessions.filter((s) => s.hasPricingView).length / blogSessions.length;
    insights.push({
      type: blogToIntent > 0.05 ? 'positive' : 'opportunity',
      category: 'content',
      title: `Blog generating ${blogSessions.length} sessions`,
      detail: `${(blogToIntent * 100).toFixed(1)}% of blog readers view pricing. ${blogSessions.filter((s) => s.hasConversion).length} reached the success page (page-based).`,
      metric: `${(blogToIntent * 100).toFixed(1)}% blog → pricing`,
      action: blogToIntent < 0.05
        ? 'Blog posts need stronger CTAs. Add "Related: Our SCAT6 Mastery Course" boxes. Internal link to /pricing from every post.'
        : 'Blog content is driving commercial intent. Write more posts on similar topics.',
    });
  }

  // --- Preseason insights ---
  const preseasonRegisters = sessions.filter((s) => s.hasPreseasonRegister);
  const preseasonSubmits = sessions.filter((s) => s.hasPreseasonSubmit);
  if (preseasonRegisters.length > 0 || preseasonSubmits.length > 0) {
    const preseasonToPrice = [...preseasonRegisters, ...preseasonSubmits]
      .filter((s) => s.hasPricingView).length;
    const preseasonTotal = new Set([...preseasonRegisters, ...preseasonSubmits].map((s) => s.sessionId)).size;

    insights.push({
      type: preseasonToPrice > 0 ? 'positive' : 'opportunity',
      category: 'preseason',
      title: `${preseasonTotal} preseason leads this period`,
      detail: `${preseasonRegisters.length} clinic registrations, ${preseasonSubmits.length} baseline submissions. ${preseasonToPrice} also viewed pricing.`,
      metric: preseasonTotal > 0 ? `${((preseasonToPrice / preseasonTotal) * 100).toFixed(0)}% viewed pricing` : '0% viewed pricing',
      action: preseasonToPrice === 0
        ? 'Preseason users aren\'t seeing the course. Add CTAs to the baseline completion page and registration confirmation email pointing to /scat-mastery or /pricing.'
        : 'Preseason lead magnet is working. Optimise the post-submission CTA copy to increase pricing views further.',
    });
  }

  // --- Audience insights ---

  // Returning visitors
  const returners = sessions.filter((s) => s.visitNumber > 1);
  if (returners.length > 0 && totalSessions > 10) {
    const returnRate = returners.length / totalSessions;
    const returnerConversions = returners.filter((s) => s.hasConversion).length;
    const firstVisitConversions = sessions.filter((s) => s.visitNumber === 1 && s.hasConversion).length;

    insights.push({
      type: 'opportunity',
      category: 'audience',
      title: `${(returnRate * 100).toFixed(0)}% are returning visitors`,
      detail: `Returning visitors hit the success page ${returnerConversions} times vs ${firstVisitConversions} first-visit (page-based). ${returnRate > 0.3 ? 'Clinicians are researching before buying — this is normal for $500+ purchases.' : 'Most traffic is first-time — focus on capturing emails for follow-up.'}`,
      metric: `${(returnRate * 100).toFixed(0)}% return rate`,
      action: returnRate > 0.3
        ? 'Your retargeting strategy should nurture these returners. Send email follow-ups 3-5 days after first visit.'
        : 'Capture more first-visit emails via free SCAT mastery signup. Build a retargeting audience from pricing page visitors.',
    });
  }

  // Device mismatch
  const mobileSessions = sessions.filter((s) => s.device === 'Mobile');
  const desktopSessions = sessions.filter((s) => s.device === 'Desktop');
  if (mobileSessions.length > 5 && desktopSessions.length > 5) {
    const mobileConvRate = mobileSessions.filter((s) => s.hasConversion).length / mobileSessions.length;
    const desktopConvRate = desktopSessions.filter((s) => s.hasConversion).length / desktopSessions.length;
    if (mobileSessions.length > desktopSessions.length && mobileConvRate < desktopConvRate * 0.5) {
      insights.push({
        type: 'warning',
        category: 'audience',
        title: 'Mobile traffic high but conversions low',
        detail: `${mobileSessions.length} mobile sessions vs ${desktopSessions.length} desktop, but mobile converts at ${(mobileConvRate * 100).toFixed(1)}% vs desktop ${(desktopConvRate * 100).toFixed(1)}% (success-page based).`,
        metric: `${(mobileConvRate * 100).toFixed(1)}% mobile conv.`,
        action: 'Review pricing page on mobile. Ensure checkout flow works on phone. Clinicians may browse on mobile but buy on desktop — consider "email yourself this link" feature.',
      });
    }
  }

  // --- Growth insight ---
  if (prevStats && stats.pageviews.value > 0) {
    const pvGrowth = stats.pageviews.prev > 0
      ? ((stats.pageviews.value - stats.pageviews.prev) / stats.pageviews.prev) * 100
      : 100;
    if (pvGrowth > 20) {
      insights.push({
        type: 'positive',
        category: 'channel',
        title: `Traffic up ${pvGrowth.toFixed(0)}% vs previous period`,
        detail: `${stats.pageviews.value} pageviews this period vs ${stats.pageviews.prev} previously. ${stats.uniques.value} unique visitors.`,
        metric: `+${pvGrowth.toFixed(0)}% growth`,
        action: 'Momentum is building. Double down on whatever changed — new ads, new content, or outreach campaign.',
      });
    } else if (pvGrowth < -20 && stats.pageviews.prev > 10) {
      insights.push({
        type: 'warning',
        category: 'channel',
        title: `Traffic down ${Math.abs(pvGrowth).toFixed(0)}% vs previous period`,
        detail: `${stats.pageviews.value} pageviews this period vs ${stats.pageviews.prev} previously.`,
        metric: `${pvGrowth.toFixed(0)}% decline`,
        action: 'Check if ad campaigns are still running. Review organic search rankings. Consider a new blog post or cold email blast.',
      });
    }
  }

  // Sort: critical first, then warning, opportunity, positive
  const priority: Record<string, number> = { critical: 0, warning: 1, opportunity: 2, positive: 3 };
  insights.sort((a, b) => priority[a.type] - priority[b.type]);

  return insights;
}

// ---------------------------------------------------------------------------
// Response builders
// ---------------------------------------------------------------------------

function buildStats(current: StoredEvent[], prev: StoredEvent[]): StatsResponse {
  // Exclude server-side webhook events from visitor-facing metrics
  const cur = excludeServerEvents(current);
  const prv = excludeServerEvents(prev);
  return {
    pageviews: {
      value: countPageviews(cur),
      prev: countPageviews(prv),
    },
    uniques: {
      value: countUniqueSessionIds(cur),
      prev: countUniqueSessionIds(prv),
    },
    bounces: {
      value: countBounces(cur),
      prev: countBounces(prv),
    },
    totaltime: {
      value: calcTotalTime(cur),
      prev: calcTotalTime(prv),
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
    if (isPageView(e) && pvByDate.has(dateKey)) {
      pvByDate.set(dateKey, (pvByDate.get(dateKey) ?? 0) + 1);
    }
    if (isPageView(e) && sessionsByDate.has(dateKey)) {
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
    if (!isPageView(e) && metricType === 'url') continue;

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
      case 'country':
        key = e.country || 'Unknown';
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
// Unified event fetcher — Postgres
// ---------------------------------------------------------------------------

async function getEventsForDateRange(dateKeys: string[]): Promise<StoredEvent[]> {
  if (dateKeys.length === 0) return [];
  // Window boundaries are Sydney midnights (converted to UTC epoch ms), so a
  // "day" here means a full Australia/Sydney calendar day.
  const startMs = sydneyMidnightUtcMs(dateKeys[0]);
  const endMs = sydneyMidnightUtcMs(addDaysToKey(dateKeys[dateKeys.length - 1], 1)); // exclusive end
  return fetchEventsFromPostgres(startMs, endMs);
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

  // Windows compare like-for-like Sydney calendar days: the current window is
  // the last `days` Sydney dates ending today; the previous window is the
  // `days` Sydney dates immediately before it.
  const todayKey = toDateKey(new Date());
  const currentDates = dateRange(todayKey, days);
  const prevDates = dateRange(addDaysToKey(todayKey, -days), days);

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
    const currentEvents = excludeServerEvents(await getEventsForDateRange(currentDates));
    const timeSeries = buildTimeSeries(currentEvents, currentDates);
    return NextResponse.json(timeSeries, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  if (type === 'metrics') {
    const currentEvents = excludeServerEvents(await getEventsForDateRange(currentDates));
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
      if (isPageView(e)) continue;
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
    const retargeting = buildRetargeting(sessions, currentEvents);
    return NextResponse.json(retargeting, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  // Expanded funnel — direct path + preseason-to-course path
  if (type === 'funnel') {
    const currentEvents = await getEventsForDateRange(currentDates);
    const sessions = buildSessionSummaries(currentEvents);
    const funnel = buildExpandedFunnel(sessions, currentEvents);
    return NextResponse.json(funnel, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  // Insights — auto-generated marketing recommendations
  if (type === 'insights') {
    const [currentEvents, prevEvents] = await Promise.all([
      getEventsForDateRange(currentDates),
      getEventsForDateRange(prevDates),
    ]);
    const sessions = buildSessionSummaries(currentEvents);
    const currentStats = buildStats(currentEvents, prevEvents);
    const prevStats = buildStats(prevEvents, []);
    const insightsData = buildInsights(sessions, currentStats, prevStats);
    return NextResponse.json(insightsData, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
}

export async function POST(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
