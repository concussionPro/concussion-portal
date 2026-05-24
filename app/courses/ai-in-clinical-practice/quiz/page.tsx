import { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { CourseSidebar } from '@/components/ai-course/CourseSidebar'
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
      <CourseSidebar />
      <main className="md:pl-72">
      <div className="max-w-3xl mx-auto px-6 pt-[120px] pb-20">
        <AdminPreviewBadge access={access} />
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent mb-2">
          Certification Quiz
        </p>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Test your understanding.</h1>
        <p className="text-muted-foreground mb-2">
          {QUIZ_QUESTIONS.length} questions. Pass mark: 8 out of {QUIZ_QUESTIONS.length}. The certificate is issued automatically on pass.
        </p>
        <p className="text-xs text-muted-foreground mb-8">
          Questions focus on AHPRA, Privacy Act, and TGA compliance — not productivity. The certificate attests that the holder understands the legal framework for AI use in Australian clinical practice.
        </p>
        <QuizClient questions={questions} />
      </div>
      </main>
    </div>
  )
}
