// One-time migration: create analytics_events table + import old Blob data
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import crypto from 'crypto';

function isAuthorised(request: NextRequest): boolean {
  const key = request.headers.get('x-admin-key');
  if (!key) return false;
  const expected = process.env.ANALYTICS_API_KEY || process.env.ADMIN_API_KEY;
  if (!expected) return false;
  try {
    const a = Buffer.from(key);
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorised(request)) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  try {
    // Create table
    await sql`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id SERIAL PRIMARY KEY,
        event_type VARCHAR(64) NOT NULL,
        event_data JSONB DEFAULT '{}',
        session_id VARCHAR(128) NOT NULL,
        timestamp_ms BIGINT NOT NULL,
        user_agent VARCHAR(512),
        referrer VARCHAR(512),
        path VARCHAR(512) NOT NULL,
        search VARCHAR(512),
        ip VARCHAR(45),
        country VARCHAR(4),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // Create indexes for efficient querying
    await sql`CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics_events (timestamp_ms)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics_events (session_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events (event_type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_analytics_path ON analytics_events (path)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events (created_at)`;

    // Check row count
    const { rows } = await sql`SELECT COUNT(*) as count FROM analytics_events`;

    return NextResponse.json({
      ok: true,
      message: 'Table created with indexes',
      rowCount: rows[0]?.count ?? 0,
    });
  } catch (err) {
    console.error('[analytics/migrate] Error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
