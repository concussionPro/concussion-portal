import { Metadata } from 'next'
import { VAGUS_MODULES } from '@/lib/vagus-course/modules'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import { requireCourseAccess } from '@/lib/course-access'
import { VagusCourseSidebar } from '@/components/ai-course/VagusCourseSidebar'
import { ArrowRight, BookMarked, FileQuestion, Award, Wrench } from 'lucide-react'

export const metadata: Metadata = {
  title: 'The Vagus Nerve in Clinical Practice',
  description: 'Evidence-based assessment and defensible interventions for autonomic dysfunction.',
  robots: 'noindex, nofollow',
}

export default async function VagusCoursePage() {
  const access = await requireCourseAccess('vagus-nerve')
  const totalMin = VAGUS_MODULES.reduce((sum, m) => sum + m.durationMin, 0)

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <VagusCourseSidebar />
      <main className="md:pl-72">
        <div className="max-w-4xl mx-auto px-6 pt-[120px] pb-20">
          <AdminPreviewBadge access={access} />

          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent mb-2">
            Course · 6 modules · A$97 · 1 CPD hour
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            The Vagus Nerve in Clinical Practice
          </h1>
          <p className="text-lg text-muted-foreground mb-2">
            Evidence-based assessment and defensible interventions for autonomic dysfunction.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            {VAGUS_MODULES.length} modules · {totalMin} minutes total · Certificate of completion on passing the 10-question quiz.
          </p>

          <div className="grid gap-3 mb-12">
            {VAGUS_MODULES.map((m) => (
              <Link
                key={m.slug}
                href={`/courses/vagus-nerve/${m.slug}`}
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

          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-3">
            Resources
          </p>
          <div className="grid gap-3 sm:grid-cols-3 mb-4">
            <ResourceCard
              href="/courses/vagus-nerve/references"
              icon={BookMarked}
              tag="Reference Repository"
              title="29 sources · 8 categories"
              note="Anatomy · polyvagal critique · HRV · POTS · post-concussion · long COVID · interventions · guidelines"
            />
            <ResourceCard
              href="/courses/vagus-nerve/toolkit"
              icon={Wrench}
              tag="Clinical Toolkit"
              title="Stand test · referral · handouts"
              note="Adaptable artefacts for autonomic-complaint workups"
            />
            <ResourceCard
              href="/courses/vagus-nerve/quiz"
              icon={FileQuestion}
              tag="Certification quiz"
              title="10 questions · 8/10 to pass"
              note="Issues the verifiable certificate on pass"
            />
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-5 text-xs text-slate-700">
            <p className="font-semibold mb-2">Education, not legal advice.</p>
            <p>
              This course is general clinical education for Australian registered health practitioners on the anatomy, assessment, and defensible interventions for the vagus nerve and autonomic dysfunction phenotypes. It does not constitute legal, medical, or psychological advice for any specific patient. For case-specific guidance, consult appropriate colleagues and your professional indemnity insurer.
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

void Award
