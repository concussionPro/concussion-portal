/**
 * Admin readback for survey_responses — shows who answered which letter
 * for the SCAT-completer follow-up (and any future surveys).
 *
 * GET /api/admin/survey-responses
 * GET /api/admin/survey-responses?surveyKey=scat_completer_followup_v1
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { isAdminRequest } from '@/lib/require-admin'

interface SurveyRow { email: string; name: string | null; access_level: string; answer: string; answered_at: string | Date }

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const surveyKey = new URL(request.url).searchParams.get('surveyKey') || 'scat_completer_followup_v1'
  try {
    const { rows } = await sql`
      SELECT s.user_id, s.answer, s.answered_at, u.email, u.name, u.access_level
      FROM survey_responses s
      LEFT JOIN users u ON u.id = s.user_id
      WHERE s.survey_key = ${surveyKey}
      ORDER BY s.answered_at DESC
    `
    const breakdown: Record<string, number> = {}
    for (const r of rows as SurveyRow[]) breakdown[r.answer] = (breakdown[r.answer] || 0) + 1
    return NextResponse.json({
      surveyKey,
      total: rows.length,
      breakdown,
      responses: rows.map((r) => (r as SurveyRow)).map((r) => ({
        email: r.email,
        name: r.name,
        accessLevel: r.access_level,
        answer: r.answer,
        answeredAt: r.answered_at,
      })),
    })
  } catch (err) {
    if ((err as { code?: string })?.code === '42P01') {
      return NextResponse.json({ surveyKey, total: 0, breakdown: {}, responses: [], note: 'survey_responses table not yet created — first answer click creates it' })
    }
    console.error('survey-responses error:', err)
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 })
  }
}
