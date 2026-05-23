import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkAiCourseAccess } from '@/lib/ai-course/access'
import {
  VAGUS_QUIZ_QUESTIONS,
  VAGUS_QUIZ_PASS_MARK,
  gradeVagusQuiz,
  type VagusQuizSubmission,
} from '@/lib/vagus-course/quiz'
import { issueCourseCertificate } from '@/lib/course-certificates'
import { findCourse } from '@/lib/ai-course/provider-catalogue'

const submissionSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string(),
        selectedIndex: z.number().int().min(0).max(20),
      })
    )
    .min(1)
    .max(50),
})

export async function GET(request: NextRequest) {
  const access = await checkAiCourseAccess(request)
  if (!access.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({
    questions: VAGUS_QUIZ_QUESTIONS.map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
    })),
    passMark: VAGUS_QUIZ_PASS_MARK,
    total: VAGUS_QUIZ_QUESTIONS.length,
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

  const submission: VagusQuizSubmission = parsed.data
  const result = gradeVagusQuiz(submission)

  let certificate = null
  if (result.passed && access.email) {
    const course = findCourse('vagus-nerve')
    try {
      certificate = await issueCourseCertificate({
        email: access.email,
        courseSlug: 'vagus-nerve',
        courseTitle: course?.title ?? 'The Vagus Nerve in Clinical Practice',
        cpdHours: course?.cpdHours ?? 1.25,
      })
    } catch (err) {
      console.error('[vagus-course/quiz] Certificate issuance failed:', err)
    }
  }

  return NextResponse.json({
    ...result,
    certificate,
  })
}
