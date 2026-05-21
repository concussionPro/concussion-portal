import { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { requireAiCourseAccess, AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import { QuizClient } from './QuizClient'
import { QUIZ_QUESTIONS } from '@/lib/ai-course/quiz'

export const metadata: Metadata = {
  title: 'Quiz — AI in Clinical Practice',
  robots: 'noindex, nofollow',
}

export default async function QuizPage() {
  const access = await requireAiCourseAccess()
  const questions = QUIZ_QUESTIONS.map((q) => ({
    id: q.id,
    question: q.question,
    options: q.options,
  }))
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="max-w-3xl mx-auto px-6 pt-[120px] pb-20">
        <AdminPreviewBadge access={access} />
        <h1 className="text-3xl font-bold tracking-tight mb-2">Certification Quiz</h1>
        <p className="text-muted-foreground mb-2">
          10 questions. Pass mark: 8 out of 10. The certificate is issued automatically on pass.
        </p>
        <p className="text-xs text-muted-foreground mb-8">
          Questions focus on AHPRA, Privacy Act, and TGA compliance — not productivity. The certificate attests that the holder understands the legal framework for AI use in Australian clinical practice.
        </p>
        <QuizClient questions={questions} />
      </div>
    </div>
  )
}
