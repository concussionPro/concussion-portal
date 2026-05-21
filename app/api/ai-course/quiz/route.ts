import { NextRequest, NextResponse } from 'next/server'
import { checkAiCourseAccess } from '@/lib/ai-course/access'
import { QUIZ_QUESTIONS, gradeQuiz, QuizSubmission } from '@/lib/ai-course/quiz'
import { issueCertificate } from '@/lib/ai-course/certificate'
import { z } from 'zod'

/**
 * GET /api/ai-course/quiz — return quiz questions (without correct answers)
 * POST /api/ai-course/quiz — submit answers, grade, issue certificate on pass
 */

const submissionSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      selectedIndex: z.number().int().min(0).max(20),
    })
  ).min(1).max(50),
})

export async function GET(request: NextRequest) {
  const access = await checkAiCourseAccess(request)
  if (!access.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({
    questions: QUIZ_QUESTIONS.map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
    })),
    passMark: 8,
    total: QUIZ_QUESTIONS.length,
  })
}

export async function POST(request: NextRequest) {
  const access = await checkAiCourseAccess(request)
  if (!access.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = submissionSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid submission', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const submission: QuizSubmission = parsed.data
  const result = gradeQuiz(submission)

  // Issue certificate on pass — must have an email on session
  let certificate = null
  if (result.passed) {
    if (access.email) {
      try {
        certificate = await issueCertificate(access.email)
      } catch (err) {
        console.error('[ai-course/quiz] Certificate issuance failed:', err)
      }
    } else if (access.reason === 'admin') {
      // Admin preview — pass but no certificate (no email tied to admin auth)
      certificate = null
    }
  }

  return NextResponse.json({
    ...result,
    certificate,
  })
}
