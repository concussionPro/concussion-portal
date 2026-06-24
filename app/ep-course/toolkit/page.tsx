import { Metadata } from 'next'
import Link from 'next/link'
import { Activity, ClipboardList, Dumbbell, TrendingUp, CheckSquare, LineChart, ArrowRight, Gauge, CheckCircle2 } from 'lucide-react'
import { requireAiCourseAccess, AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import { EpCourseNavigation } from '@/components/ep-course/EpCourseNavigation'

export const metadata: Metadata = {
  title: 'Clinical Toolkit — Concussion Rehab for EPs',
  robots: 'noindex, nofollow',
}

// Every item here is specific to the Accredited Exercise Physiologist's
// concussion-rehab workflow — assessment of exercise tolerance, exercise
// prescription, progression, scope-appropriate documentation. Nothing generic.
// Each links to a real, gated, printable document at /ep-course/documents/[slug].
const TOOLS = [
  {
    icon: Activity,
    slug: 'bctt-testing-sheet',
    title: 'Buffalo Concussion Treadmill Test — Recording Sheet',
    kind: 'Assessment',
    desc: 'The full BCTT (and cycle-equivalent BCBT) administration sheet: pre-test contraindication and red-flag screen, the Balke-based incline/speed protocol, a per-minute heart-rate / RPE / symptom-score log, and the structured identification of the heart-rate threshold (HRt) — symptom-limited vs exhaustion-limited termination. The single most important number you carry into prescription, captured cleanly and defensibly.',
  },
  {
    icon: ClipboardList,
    slug: 'sstae-prescription',
    title: 'Sub-Symptom-Threshold Aerobic Prescription Template',
    kind: 'Template',
    desc: 'Converts the HRt into an individualised aerobic program: the 80–90% HRt training band with the worked calculation, full FITT prescription, the within-session symptom-exacerbation stop rule, RPE cross-check, warm-up/cool-down, and the re-test-driven progression schedule. Printable for the patient with a clear daily heart-rate ceiling.',
  },
  {
    icon: TrendingUp,
    slug: 'session-tracking-sheet',
    title: 'Session & Progression Tracking Sheet',
    kind: 'Template',
    desc: 'Per-session log — date, modality, HR response against the band, pre/post symptom score, RPE, duration and adherence — so the HR↔symptom↔duration trend is visible at a glance. The audit trail behind every prescription change.',
  },
  {
    icon: Dumbbell,
    slug: 'phenotype-exercise-library',
    title: 'Phenotype Exercise Library (EP scope)',
    kind: 'Reference',
    desc: 'Dosed, progressable exercise sets for the phenotypes an AEP treats: vestibular (gaze stabilisation / VOR×1, habituation, dynamic balance), cervical (deep neck flexor endurance, proprioception / joint-position-error retraining) and oculomotor (convergence, saccades, smooth pursuit), each with starting dose, progression criteria and the clear refer-out boundaries (BPPV, manipulation, prism).',
  },
  {
    icon: CheckSquare,
    slug: 'progression-stop-criteria',
    title: 'Progression & Stop-Criteria Quick Reference',
    kind: 'Reference',
    desc: 'The one-page decision aid: the within-session ≥2-point stop rule, the between-session next-day-flare rule, the every-1–2-week progress/hold/regress/escalate review algorithm, the red-flag list that means stop and refer, and where medical clearance sits relative to your role.',
  },
]

const KIND_COLOR: Record<string, string> = {
  Assessment: 'bg-teal-50 text-teal-700 border-teal-200',
  Template: 'bg-blue-50 text-blue-700 border-blue-200',
  Reference: 'bg-amber-50 text-amber-700 border-amber-200',
}

// Flagship live, browser-based instruments (not downloads) — mirrors the
// "Interactive clinical tools" bento on /clinical-toolkit. Enrolled EP-course
// users have access, so these are live navigations with an "Included" badge.
const FLAGSHIP_TOOLS = [
  {
    href: '/sst-trainer',
    icon: Activity,
    title: 'Sub-Symptom-Threshold Trainer',
    blurb: 'Heart-rate-guided sub-symptom-threshold exertion rehab — keep patients training inside the safe Buffalo-protocol band.',
    chips: ['Live HR (Bluetooth + camera)', 'Buffalo protocol band', 'Session & symptom tracking'],
    cta: 'Open trainer',
    from: 'from-rose-500',
    to: 'to-teal-600',
    accent: 'hover:border-rose-300',
  },
  {
    href: '/preseason',
    icon: Gauge,
    title: 'Preseason Baseline Testing',
    blurb: 'SCAT6 baseline cognitive & symptom testing for athletes and teams — establish individual baselines for accurate post-injury comparison.',
    chips: ['SCAT6 baseline', 'Team / squad testing', 'Pre-injury comparison'],
    cta: 'Start baseline testing',
    from: 'from-teal-600',
    to: 'to-blue-600',
    accent: 'hover:border-blue-300',
  },
]

export default async function EpToolkitPage() {
  const access = await requireAiCourseAccess('/login')

  return (
    <div className="flex min-h-screen bg-slate-50">
      <EpCourseNavigation />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <AdminPreviewBadge access={access} />
          <Link href="/ep-course/modules/1" className="text-sm font-semibold text-teal-700 hover:underline">
            ← Course
          </Link>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">Clinical Toolkit</h1>
          <p className="mt-2 text-slate-600">
            Scope-appropriate, fillable resources an Accredited Exercise Physiologist uses to assess exercise tolerance,
            prescribe and progress active recovery, and document it defensibly. Every template below opens as a real,
            printable document — view, fill in, and save as PDF for your clinic.
          </p>

          {/* Interactive clinical tools (flagship) — mirrors /clinical-toolkit */}
          <div className="mt-8">
            <div className="mb-1 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-teal-700">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
                Interactive clinical tools
              </span>
            </div>
            <p className="mb-5 text-sm text-slate-600">
              Live, browser-based instruments — not downloads. Included with your access.
            </p>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {FLAGSHIP_TOOLS.map((tool) => {
                const Icon = tool.icon
                return (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className={`group relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-6 transition-all hover:shadow-xl ${tool.accent}`}
                  >
                    <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${tool.from} ${tool.to}`} />
                    <div className="mb-4 flex items-start justify-between">
                      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br shadow-sm ${tool.from} ${tool.to}`}>
                        <Icon className="h-7 w-7 text-white" strokeWidth={2} />
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        INCLUDED
                      </span>
                    </div>
                    <h3 className="mb-2 text-xl font-bold tracking-tight text-slate-900">{tool.title}</h3>
                    <p className="mb-4 text-sm leading-relaxed text-slate-600">{tool.blurb}</p>
                    <div className="mb-5 flex flex-wrap gap-2">
                      {tool.chips.map((chip) => (
                        <span
                          key={chip}
                          className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                    <div className="border-t border-slate-100 pt-4">
                      <span className={`inline-flex items-center gap-2 rounded-lg bg-gradient-to-r px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-shadow group-hover:shadow-md ${tool.from} ${tool.to}`}>
                        {tool.cta}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* LIVE TOOL — Baseline & serial testing, wired to the working tool */}
          <Link
            href="/preseason/register"
            className="group mt-8 block rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 via-white to-blue-50 p-6 transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-600 text-white">
                  <LineChart className="h-6 w-6" />
                </span>
                <div>
                  <span className="rounded-full bg-teal-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Live tool</span>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">Baseline &amp; Serial Testing Tool</h2>
                </div>
              </div>
              <ArrowRight className="mt-1 h-5 w-5 text-teal-600 transition-transform group-hover:translate-x-1" />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Generate a private link, send it to your athlete or patient, and they complete a self-administered baseline
              (symptoms, cognition, oculomotor) from home or in clinic. Each result reports straight to you — and once an
              athlete has done two or more, the tool builds an automatic <strong>serial-comparison report</strong> so you
              can see at a glance where they have improved, stalled or declined against their own baseline. Built for
              pre-season screening and for tracking return-to-baseline through rehab.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700">
              Launch the tool <ArrowRight className="h-4 w-4" />
            </span>
          </Link>

          {/* Templates & references — each links to a real, printable, gated document */}
          <h3 className="mt-10 text-sm font-bold uppercase tracking-[0.12em] text-slate-500">Templates &amp; references</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {TOOLS.map((t) => {
              const Icon = t.icon
              return (
                <Link
                  key={t.slug}
                  href={`/ep-course/documents/${t.slug}`}
                  className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:border-teal-300 hover:shadow-md"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                      <Icon className="h-5 w-5 text-slate-600" />
                    </span>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${KIND_COLOR[t.kind]}`}>
                      {t.kind}
                    </span>
                  </div>
                  <h2 className="font-semibold text-slate-900 group-hover:text-teal-700">{t.title}</h2>
                  <p className="mt-1 flex-1 text-sm text-slate-600">{t.desc}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700">
                    Open &amp; print <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              )
            })}
          </div>

          {/* BCTT Calculator — live tool */}
          <Link
            href="/ep-course/tools/bctt"
            className="group mt-6 block rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50 via-white to-blue-50 p-5 transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600 text-white">
                  <Activity className="h-5 w-5" />
                </span>
                <div>
                  <span className="rounded-full bg-teal-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Live tool</span>
                  <h2 className="mt-1 font-semibold text-slate-900">BCTT Calculator &amp; HRt → Prescription Engine</h2>
                </div>
              </div>
              <ArrowRight className="mt-1 h-5 w-5 text-teal-600 transition-transform group-hover:translate-x-1" />
            </div>
            <p className="mt-3 text-sm text-slate-600">
              The digital companion to the Buffalo test: enter the per-minute test data, the tool flags the heart-rate
              threshold, auto-calculates the 80–90% sub-symptom-threshold training band, and generates the
              sub-symptom-threshold aerobic prescription. The clinical loop — assess, prescribe, progress — in one place.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700">
              Launch the calculator <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </main>
    </div>
  )
}
