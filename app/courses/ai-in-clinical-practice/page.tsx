import { Metadata } from 'next'
import { MODULES } from '@/lib/ai-course/content'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { requireAiCourseAccess, AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import { CourseSidebar } from '@/components/ai-course/CourseSidebar'
import { Library, FileQuestion, Award, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'AI in Clinical Practice',
  description: 'AHPRA-aligned AI compliance course for Australian clinicians.',
  robots: 'noindex, nofollow',
}

export default async function CoursePage() {
  const access = await requireAiCourseAccess()
  const totalMin = MODULES.reduce((sum, m) => sum + m.durationMin, 0)

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <CourseSidebar />
      <main className="md:pl-64">
        <div className="max-w-4xl mx-auto px-6 pt-[120px] pb-20">
          <AdminPreviewBadge access={access} />

          {/* Hero */}
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent mb-2">
            Course · launches 1 June 2026
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            AI in Clinical Practice
          </h1>
          <p className="text-lg text-muted-foreground mb-2">
            For Australian clinicians using LLMs in patient care.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            {MODULES.length} modules · {totalMin} minutes total · Certificate of completion on passing the quiz.
          </p>

          {/* Module list */}
          <div className="grid gap-3 mb-12">
            {MODULES.map((m) => (
              <Link
                key={m.slug}
                href={`/courses/ai-in-clinical-practice/${m.slug}`}
                className="card rounded-xl p-5 hover:border-accent/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-accent">
                        Module {m.number}
                      </span>
                      {m.loadBearing && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                          Required
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground">{m.durationMin} min</span>
                    </div>
                    <h3 className="text-base font-bold text-foreground mb-1">{m.title}</h3>
                    <p className="text-sm text-muted-foreground leading-snug">{m.description}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-accent shrink-0 mt-1" />
                </div>
              </Link>
            ))}
          </div>

          {/* Resource grid */}
          <div className="grid gap-3 sm:grid-cols-3 mb-8">
            <Link
              href="/courses/ai-in-clinical-practice/hub"
              className="card rounded-xl p-4 hover:border-accent/40 transition-colors flex items-start gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                <Library className="w-4 h-4 text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wide text-accent mb-1">AI Practice Hub</p>
                <p className="text-sm text-foreground font-semibold">Prompts · Templates · Tools</p>
                <p className="text-xs text-muted-foreground mt-1">Post-course resources.</p>
              </div>
            </Link>
            <Link
              href="/courses/ai-in-clinical-practice/quiz"
              className="card rounded-xl p-4 hover:border-accent/40 transition-colors flex items-start gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                <FileQuestion className="w-4 h-4 text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wide text-accent mb-1">Quiz</p>
                <p className="text-sm text-foreground font-semibold">10 questions · 8/10 to pass</p>
                <p className="text-xs text-muted-foreground mt-1">Issues the certificate on pass.</p>
              </div>
            </Link>
            <Link
              href="/courses/ai-in-clinical-practice/certificate"
              className="card rounded-xl p-4 hover:border-accent/40 transition-colors flex items-start gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                <Award className="w-4 h-4 text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wide text-accent mb-1">My Certificate</p>
                <p className="text-sm text-foreground font-semibold">Download · verify</p>
                <p className="text-xs text-muted-foreground mt-1">12-month validity.</p>
              </div>
            </Link>
          </div>

          {/* Footer disclaimer */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-5 text-xs text-slate-700">
            <p className="font-semibold mb-2">Education, not legal advice.</p>
            <p>
              This course is general clinical education for Australian registered health practitioners. It does not constitute legal advice. For case-specific guidance, consult your professional indemnity insurer (Avant, MIPS, Guild, MIGA) and, where appropriate, a regulatory lawyer. AHPRA and OAIC guidance referenced throughout is current as of the last content refresh — see the Hub update feed for the latest.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
