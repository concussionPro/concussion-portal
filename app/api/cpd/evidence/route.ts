import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { cpdSession, trackCpdEvent } from '@/lib/cpd/session'
import {
  addEvidence,
  getEvidence,
  listCredentialDocs,
  EVIDENCE_MAX_BYTES,
  EVIDENCE_MIME_ALLOWLIST,
  EVIDENCE_KINDS,
  type EvidenceKind,
} from '@/lib/cpd/store'
import { rateLimit } from '@/lib/rate-limit'

/**
 * /api/cpd/evidence — the evidence vault (spec §3: content-addressed).
 *  POST {activityId?, filename, mime, dataBase64} → store (5 MB cap,
 *  pdf/jpg/png only). GET ?id= → the file back, owner-scoped.
 */

export async function POST(req: NextRequest) {
  const session = cpdSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const limited = await rateLimit({ key: `cpd-evidence:${session.email}`, limit: 30, windowSec: 900 })
  if (!limited.ok) return NextResponse.json({ error: 'Too many uploads — try again shortly.' }, { status: 429 })

  const b = await req.json().catch(() => ({}))
  const filename = typeof b?.filename === 'string' ? b.filename.trim().slice(0, 200) : ''
  const mime = typeof b?.mime === 'string' ? b.mime : ''
  const dataBase64 = typeof b?.dataBase64 === 'string' ? b.dataBase64 : ''
  if (!filename || !dataBase64) return NextResponse.json({ error: 'File required.' }, { status: 400 })
  if (!EVIDENCE_MIME_ALLOWLIST.includes(mime)) {
    return NextResponse.json({ error: 'PDF, JPG or PNG only.' }, { status: 400 })
  }
  const approxBytes = Math.floor((dataBase64.length * 3) / 4)
  if (approxBytes > EVIDENCE_MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (5 MB max).' }, { status: 400 })
  }
  const activityId = Number.isInteger(Number(b?.activityId)) ? Number(b.activityId) : null
  const kind: EvidenceKind = EVIDENCE_KINDS.includes(b?.kind) ? b.kind : 'activity'
  const expiryDate =
    typeof b?.expiryDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b.expiryDate)
      ? b.expiryDate
      : null
  const sha256 = crypto.createHash('sha256').update(Buffer.from(dataBase64, 'base64')).digest('hex')
  const id = await addEvidence(session.email, {
    activityId: kind === 'activity' ? activityId : null,
    filename,
    mime,
    sha256,
    dataBase64,
    kind,
    expiryDate,
  })
  await trackCpdEvent(req, 'cpd_evidence_uploaded', { bytes: approxBytes, mime, kind })
  return NextResponse.json({ success: true, id })
}

export async function GET(req: NextRequest) {
  const session = cpdSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // ?list=credentials → the standalone credential-file inventory (metadata only)
  if (req.nextUrl.searchParams.get('list') === 'credentials') {
    return NextResponse.json({ documents: await listCredentialDocs(session.email) })
  }
  const id = Number(req.nextUrl.searchParams.get('id'))
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  const file = await getEvidence(session.email, id)
  if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return new NextResponse(Buffer.from(file.dataBase64, 'base64'), {
    headers: {
      'Content-Type': file.mime,
      'Content-Disposition': `attachment; filename="${file.filename.replace(/[^\w. -]/g, '_')}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
