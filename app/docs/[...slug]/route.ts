import { NextRequest, NextResponse } from 'next/server'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { Readable } from 'node:stream'
import { join, normalize } from 'node:path'
import { isPaidDoc } from '@/lib/gated-docs'

/**
 * Serves the PAID documents, which no longer live under public/.
 *
 * WHY THIS EXISTS (2026-08-06).
 *
 * Everything in public/ is served straight off the CDN. The paywall was a
 * middleware matcher keyed on the `/docs/` path prefix — which means the file
 * itself was always world-readable, and only the URL was protected. That is a
 * distinction attackers do not respect, and it failed twice in one day:
 *
 *   public/docs_backup_2026-01/  byte-identical copies of the whole toolkit,
 *                                200 to anonymous requests
 *   public/toolkit-previews/     print-resolution PNG renders of seven paid
 *                                documents, 200 to anonymous requests
 *
 * Both were fixed by deleting a directory, which fixes the instance and leaves
 * the CLASS wide open: any future copy, in any directory, is public again.
 *
 * So the paid files were moved OUT of public/ entirely, into private-docs/,
 * which the CDN cannot serve. The only path to those bytes is this handler, and
 * this handler only ever runs for requests that middleware has already allowed
 * through the entitlement gate.
 *
 * DELIBERATELY NO GATING LOGIC HERE. middleware.ts owns the entitlement
 * decision — six identity sources, demo cookies, preview sessions, HTML-vs-JSON
 * denials — and it is well tested. Duplicating any of that would create a
 * second gate to keep in sync, which is how the first bypass happened. If
 * middleware denies, Next never routes here. The `isPaidDoc` check below is a
 * belt-and-braces refusal to serve anything the paid list does not name, NOT a
 * second authorisation model.
 *
 * The free/auth documents (official SCAT6 and SCOAT6 forms) intentionally stay
 * in public/docs. They are the lead magnet, they are login-gated rather than
 * paid, and a static file is faster. Next serves a matching public/ file before
 * this route, so those never reach this handler.
 */

export const runtime = 'nodejs'
// Never cache at the edge: the response body is paid content and the caller's
// entitlement is decided per request.
export const dynamic = 'force-dynamic'

const DOCS_DIR = join(process.cwd(), 'private-docs')

const CONTENT_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  zip: 'application/zip',
  png: 'image/png',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params
  // Decode each segment: a browser sends `/docs/Email%20Template%20Pack.docx`.
  const name = slug.map((s) => decodeURIComponent(s)).join('/')

  // Path traversal: `normalize` collapses `..`, and the result must still be a
  // single filename with no separators before it is joined to DOCS_DIR.
  const safe = normalize(name).replace(/^(\.\.(\/|\\|$))+/, '')
  if (safe.includes('/') || safe.includes('\\') || safe.startsWith('.')) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Only ever serve something the paid list names. Anything else is a 404 —
  // this handler is not a general file server.
  if (!isPaidDoc(`/docs/${safe}`)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Stream — do NOT buffer. CCM_Complete_Reference_2026.pdf is ~5.8MB and
  // Vercel serverless buffered responses cap at ~4.5MB; buffering made
  // /complete-reference hang on Loading forever.
  const filePath = join(DOCS_DIR, safe)
  let size: number
  try {
    size = (await stat(filePath)).size
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const ext = safe.split('.').pop()?.toLowerCase() ?? ''
  const nodeStream = createReadStream(filePath)
  const webStream = Readable.toWeb(nodeStream) as unknown as ReadableStream

  return new NextResponse(webStream, {
    status: 200,
    headers: {
      'Content-Type': CONTENT_TYPES[ext] ?? 'application/octet-stream',
      'Content-Length': String(size),
      // `inline` keeps the PDF viewer behaviour these links have always had;
      // the filename is quoted for the spaces in several of them.
      'Content-Disposition': `inline; filename="${safe.replace(/"/g, '')}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
