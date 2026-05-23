import { Metadata } from 'next'
import { MODULES } from '@/lib/ai-course/content'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { requireAiCourseAccess, AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import { CourseSidebar } from '@/components/ai-course/CourseSidebar'
import { Library, FileQuestion, Award, ArrowRight, Wrench, BookMarked } from 'lucide-react'

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
      <main className="md:pl-72">
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
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-3">
            Resources
          </p>
          <div className="grid gap-3 sm:grid-cols-3 mb-4">
            <ResourceCard
              href="/courses/ai-in-clinical-practice/hub"
              icon={Library}
              tag="AI Practice Hub"
              title="Prompts · Templates · Tools"
              note="40 prompts · 14 templates · 9 vendors in the tool comparison"
            />
            <ResourceCard
              href="/courses/ai-in-clinical-practice/toolkit"
              icon={Wrench}
              tag="Clinical Toolkit"
              title="Consent · de-id · audit · incident"
              note="9 clinician-grade artefacts designed to survive an AHPRA notification"
            />
            <ResourceCard
              href="/courses/ai-in-clinical-practice/references"
              icon={BookMarked}
              tag="Reference Repository"
              title="AHPRA · OAIC · TGA · evidence"
              note="Every regulatory claim has an upstream source · refreshed monthly"
            />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-3 mt-6">
            Certification
          </p>
          <div className="grid gap-3 sm:grid-cols-2 mb-8">
            <ResourceCard
              href="/courses/ai-in-clinical-practice/quiz"
              icon={FileQuestion}
              tag="Quiz"
              title="10 questions · 8/10 to pass"
              note="Issues the certificate on pass."
            />
            <ResourceCard
              href="/courses/ai-in-clinical-practice/certificate"
              icon={Award}
              tag="My Certificate"
              title="Download · verify"
              note="12-month validity · public verification URL"
            />
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

function ResourceCard({
  href,
  icon: Icon,
  tag,
  title,
  note,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  tag: string
  title: string
  note: string
}) {
  return (
    <Link
      href={href}
      className="card rounded-xl p-4 hover:border-accent/40 transition-colors flex items-start gap-3"
    >
      <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-accent mb-1">{tag}</p>
        <p className="text-sm text-foreground font-semibold leading-tight">{title}</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{note}</p>
      </div>
    </Link>
  )
}
