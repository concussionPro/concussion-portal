// /app/api/analytics/track/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Conditionally import @vercel/blob — only available when BLOB_READ_WRITE_TOKEN is set
let blobPut: typeof import('@vercel/blob').put | null = null;
let blobList: typeof import('@vercel/blob').list | null = null;

const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

if (useBlob) {
  try {
    const blob = require('@vercel/blob');
    blobPut = blob.put;
    blobList = blob.list;
  } catch {
    // @vercel/blob not available
  }
}

// Local filesystem analytics directory (dev fallback)
const LOCAL_DIR = path.join(process.cwd(), '.data', 'analytics');

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

// ---------------------------------------------------------------------------
// Local filesystem storage (dev fallback)
// ---------------------------------------------------------------------------

function ensureLocalDir(): void {
  if (!fs.existsSync(LOCAL_DIR)) {
    fs.mkdirSync(LOCAL_DIR, { recursive: true });
  }
}

function readLocalNdjson(dateKey: string): string | null {
  const filePath = path.join(LOCAL_DIR, `${dateKey}.ndjson`);
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

function writeLocalNdjson(dateKey: string, content: string): void {
  ensureLocalDir();
  const filePath = path.join(LOCAL_DIR, `${dateKey}.ndjson`);
  fs.writeFileSync(filePath, content, 'utf-8');
}

// ---------------------------------------------------------------------------
// Blob storage
// ---------------------------------------------------------------------------

async function readBlobNdjson(dateKey: string): Promise<string | null> {
  if (!blobList) return null;
  try {
    const blobPath = getBlobPath(dateKey);
    const { blobs } = await blobList({ prefix: blobPath });
    const match = blobs.find((b) => b.pathname === blobPath);
    if (!match) return null;
    const res = await fetch(match.url, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

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

function serializeNdjson(events: StoredEvent[]): string {
  return events.map((e) => JSON.stringify(e)).join('\n') + '\n';
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json(
      { error: 'Forbidden: cross-origin tracking not allowed' },
      { status: 403 }
    );
  }

  let payload: TrackPayload;
  try {
    payload = (await request.json()) as TrackPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!payload.eventType || !payload.sessionId || !payload.path) {
    return NextResponse.json(
      { error: 'Missing required fields: eventType, sessionId, path' },
      { status: 400 }
    );
  }

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

  // --- Vercel Blob path ---
  if (useBlob && blobPut) {
    const blobPath = getBlobPath(dateKey);
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

    try {
      await blobPut(blobPath, serializeNdjson(events), {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'application/x-ndjson',
      });
    } catch (err) {
      console.error('[analytics/track] Failed to write blob:', err);
      return NextResponse.json({ error: 'Failed to store event' }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // --- Local filesystem fallback (dev) ---
  try {
    const existingText = readLocalNdjson(dateKey);
    let events: StoredEvent[] = [];
    if (existingText) {
      events = parseNdjson(existingText);
    }
    events.push(event);
    writeLocalNdjson(dateKey, serializeNdjson(events));
  } catch (err) {
    console.error('[analytics/track] Failed to write local file:', err);
    return NextResponse.json({ error: 'Failed to store event' }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
