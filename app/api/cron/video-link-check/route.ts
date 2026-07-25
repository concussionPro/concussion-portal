/**
 * Video link-rot check — /api/cron/video-link-check
 *
 * The paid courses embed YouTube videos we do NOT own (`[VIDEO: id | title]`
 * markers across data/modules.ts + data/ep-modules/*). When one is deleted, set
 * private, or region-blocked, the module renders a dead black iframe inside
 * content a clinician paid for — and the current way we'd learn about it is a
 * customer email.
 *
 * This asks YouTube's public oEmbed endpoint whether each id still resolves.
 * oEmbed needs no API key and no quota: 200 = playable, 401/403 = private,
 * 404 = deleted. Only a definitive dead response counts — network errors and
 * rate limits are reported separately and never alert, so a flaky run can't cry
 * wolf about content that is fine.
 *
 * Emails the owner ONLY when something is actually dead. Silent otherwise.
 */
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getAllModules } from '@/data/modules'
import { getEpModules } from '@/data/ep-modules'
import { getSCATModules } from '@/data/scat-modules'
import { sendEmail, escapeHtml } from '@/lib/resend-client'
import { CONFIG } from '@/lib/config'

export const maxDuration = 60

interface VideoRef {
  id: string
  title: string
  where: string
}

/** Every [VIDEO: id | title] marker across all three courses. */
function collectVideos(): VideoRef[] {
  const found = new Map<string, VideoRef>()
  const scan = (course: string, mods: Array<{ id: number; sections: Array<{ id: string; content: string[] }> }>) => {
    for (const m of mods) {
      for (const s of m.sections) {
        for (const line of s.content) {
          for (const match of line.matchAll(/\[VIDEO:\s*([^\]|]+?)\s*\|\s*([^\]]*?)\s*\]/g)) {
            const id = match[1].split('&')[0]
            const where = `${course} module ${m.id} / ${s.id}`
            // Same video can appear twice; keep the first location for the report.
            if (!found.has(id)) found.set(id, { id, title: match[2] || '(untitled)', where })
          }
        }
      }
    }
  }
  scan('CCM', getAllModules() as never)
  scan('CRM', getEpModules() as never)
  scan('SCAT', getSCATModules() as never)
  return [...found.values()]
}

type Verdict = 'ok' | 'dead' | 'unknown'

async function checkVideo(id: string): Promise<{ verdict: Verdict; status: number | null }> {
  const url = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      headers: { 'User-Agent': 'CEA-link-check/1.0' },
    })
    if (res.ok) return { verdict: 'ok', status: res.status }
    // 404 = removed, 401/403 = private or embedding disabled. Anything else
    // (429, 5xx) is YouTube being unhappy with US, not the video being gone.
    if (res.status === 404 || res.status === 401 || res.status === 403) {
      return { verdict: 'dead', status: res.status }
    }
    return { verdict: 'unknown', status: res.status }
  } catch {
    return { verdict: 'unknown', status: null }
  }
}

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET) {
    console.error('[video-link-check] CRON_SECRET not configured — refusing to run')
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }
  const authHeader = request.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`
  if (
    !authHeader ||
    authHeader.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected))
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const videos = collectVideos()
  const dead: Array<VideoRef & { status: number | null }> = []
  const unknown: Array<VideoRef & { status: number | null }> = []

  // Sequential with a small gap — a couple of dozen ids, and hammering oEmbed
  // in parallel is what earns a 429 (which we'd have to treat as inconclusive).
  for (const v of videos) {
    const { verdict, status } = await checkVideo(v.id)
    if (verdict === 'dead') dead.push({ ...v, status })
    else if (verdict === 'unknown') unknown.push({ ...v, status })
    await new Promise((r) => setTimeout(r, 150))
  }

  const summary = { checked: videos.length, dead: dead.length, inconclusive: unknown.length }

  if (dead.length > 0) {
    const rows = dead
      .map(
        (v) =>
          `<li style="margin-bottom:10px"><strong>${escapeHtml(v.title)}</strong><br>
           <code>${escapeHtml(v.id)}</code> — HTTP ${v.status} (${v.status === 404 ? 'deleted' : 'private / embedding disabled'})<br>
           <span style="color:#64748b">${escapeHtml(v.where)}</span><br>
           <a href="https://www.youtube.com/watch?v=${encodeURIComponent(v.id)}">open on YouTube</a></li>`,
      )
      .join('')
    try {
      await sendEmail({
        to: CONFIG.CONTACT_EMAIL,
        subject: `ACTION REQUIRED: ${dead.length} course video${dead.length === 1 ? '' : 's'} no longer playable`,
        html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px">
          <h2 style="font-size:19px;color:#0f172a">Dead video${dead.length === 1 ? '' : 's'} in paid course content</h2>
          <p style="font-size:15px;color:#475569;line-height:1.6">
            ${dead.length} of ${videos.length} embedded videos no longer resolve. They currently render as a dead
            player inside module content that clinicians have paid for.
          </p>
          <ul style="font-size:14px;color:#334155;line-height:1.6">${rows}</ul>
          <p style="font-size:14px;color:#475569">
            Replace the id in the <code>[VIDEO: …]</code> marker at the location shown, or remove the marker.
            ${unknown.length ? `<br><br>${unknown.length} further video(s) were inconclusive this run (network/rate limit) — not necessarily a problem.` : ''}
          </p>
        </div>`,
      })
    } catch (err) {
      console.error('[video-link-check] alert email failed:', err)
    }
  }

  console.log(`[video-link-check] ${JSON.stringify(summary)}`)
  return NextResponse.json({
    success: true,
    ...summary,
    deadVideos: dead.map((v) => ({ id: v.id, title: v.title, where: v.where, status: v.status })),
  })
}
