import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { SCHOOLS_COURSE } from '@/data/schools-course'
import { ArrowRight, ShieldCheck } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Recognise & Remove — schools/sport awareness course landing.
// Built on the vagus/AI short-course scaffold (same card design, module list,
// resource cards, disclaimer). Non-clinical scope. Review-only / noindex.
// ─────────────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Recognise & Remove — Concussion Awareness for Sport & Schools',
  description: 'A self-serve concussion awareness course for coaches, umpires, first-aiders and teachers. Aligned to the Australian Concussion Guidelines for Youth & Community Sport (2024).',
  robots: 'noindex, nofollow',
}

const C = SCHOOLS_COURSE

export default function SchoolsCourseLanding() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main>
        <div className="max-w-4xl mx-auto px-6 pt-[120px] pb-20">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent mb-2">
            Awareness course · {C.lessons.length} lessons · ~30–45 min · Certificate of Completion
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">{C.title}</h1>
          <p className="text-lg text-muted-foreground mb-2">{C.subtitle}</p>
          <p className="text-sm font-semibold text-accent mb-6">{C.aligned}</p>

          {/* Scope note — the non-clinical guardrail */}
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 mb-8 flex gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[13px] text-amber-900 leading-relaxed">{C.scopeNote}</p>
          </div>

          {/* Module list — vagus-scaffold card design */}
          <div className="grid gap-3 mb-12">
            {C.lessons.map((l) => (
              <Link
                key={l.id}
                href={`/courses/schools/lesson-${l.id}`}
                className="card rounded-xl p-5 hover:border-accent/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-accent">Lesson {l.id}</span>
                    </div>
                    <h3 className="text-base font-bold text-foreground mb-1">{l.title}</h3>
                    <p className="text-sm text-muted-foreground leading-snug line-clamp-2">{l.body[0]}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-accent shrink-0 mt-1" />
                </div>
              </Link>
            ))}
          </div>

          {/* Resources (quiz + reseller pitch pages) are not built yet — cards
              removed to avoid dead links. Restore when those routes exist. */}

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-5 text-xs text-slate-700">
            <p className="font-semibold mb-2">Awareness education — Recognise and Remove, then refer.</p>
            <p>
              This course teaches non-clinical sport and school staff to recognise a suspected concussion, remove the person from play, and refer them to a doctor. It is a Certificate of Completion aligned to the Australian Concussion Guidelines for Youth &amp; Community Sport (2024) — not an accreditation or clinical credential. It does not authorise anyone to diagnose, clear, or treat concussion; those decisions belong to a medical or healthcare practitioner.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
