import { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { VagusCourseSidebar } from '@/components/ai-course/VagusCourseSidebar'
import { requireAiCourseAccess, AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import { QuizClient } from './QuizClient'
import { VAGUS_QUIZ_QUESTIONS, VAGUS_QUIZ_PASS_MARK } from '@/lib/vagus-course/quiz'

export const metadata: Metadata = {
  title: 'Quiz — The Vagus Nerve in Clinical Practice',
  robots: 'noindex, nofollow',
}

export default async function VagusQuizPage() {
  const access = await requireAiCourseAccess()
  const questions = VAGUS_QUIZ_QUESTIONS.map((q) => ({
    id: q.id,
    question: q.question,
    options: q.options,
  }))
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <VagusCourseSidebar />
      <main className="md:pl-72">
        <div className="max-w-3xl mx-auto px-6 pt-[120px] pb-20">
          <AdminPreviewBadge access={access} />
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent mb-2">
            Certification Quiz
          </p>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Test your understanding.
          </h1>
          <p className="text-muted-foreground mb-2">
            {VAGUS_QUIZ_QUESTIONS.length} questions. Pass mark: {VAGUS_QUIZ_PASS_MARK} out of {VAGUS_QUIZ_QUESTIONS.length}. Certificate is issued automatically on pass.
          </p>
          <p className="text-xs text-muted-foreground mb-8">
            Questions cover anatomy, polyvagal evidence critique, red-flag triage, phenotype differentiation, intervention evidence, and CPD documentation. Re-attempts allowed if not passed.
          </p>
          <QuizClient questions={questions} />
        </div>
      </main>
    </div>
  )
}
