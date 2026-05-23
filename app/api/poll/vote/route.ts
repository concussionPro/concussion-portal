import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { recordVotes, getTopicTallies, getVoterCount, POLL_TOPICS } from '@/lib/polls'

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  topicSlugs: z.array(z.string().min(1).max(80)).min(1).max(3),
  source: z.string().max(40).optional(),
})

const VALID_SLUGS = new Set(POLL_TOPICS.map((t) => t.slug))

export async function POST(request: NextRequest) {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const { email, topicSlugs, source } = parsed.data
  const valid = topicSlugs.filter((s) => VALID_SLUGS.has(s))
  if (valid.length === 0) {
    return NextResponse.json({ error: 'No valid topic slugs in request' }, { status: 400 })
  }

  const result = await recordVotes({ email, topicSlugs: valid, source })

  // Return updated tallies so client can re-render
  const [tallies, voterCount] = await Promise.all([getTopicTallies(), getVoterCount()])
  return NextResponse.json({
    ok: true,
    votesRecorded: result.count,
    voterCount,
    tallies,
  })
}

export async function GET() {
  const [tallies, voterCount] = await Promise.all([getTopicTallies(), getVoterCount()])
  return NextResponse.json({ ok: true, voterCount, tallies })
}
