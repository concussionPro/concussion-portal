import Link from 'next/link'
import { LineChart, Activity, HeartPulse, LayoutDashboard, ArrowRight, GraduationCap, BookOpen } from 'lucide-react'

export const metadata = { title: 'Tools — CEA', robots: 'noindex, nofollow' }

// The CEA clinical tool suite — the med-tech side of the edu+med-tech business.
// One launchpad for the tools clinics use, alongside Preseason.
const TOOLS = [
  {
    icon: LineChart,
    title: 'Preseason Baseline & Serial Testing',
    status: 'Live',
    href: '/admin/preseason',
    clinicianHref: '/preseason/register',
    desc: 'Generate a patient link, capture self-administered baselines (symptoms, cognition, oculomotor), and auto-build the serial-comparison report once an athlete has 2+ tests. For pre-season screening and return-to-baseline tracking.',
  },
  {
    icon: Activity,
    title: 'BCTT Calculator & HRt → Prescription',
    status: 'Live',
    href: '/ep-course/tools/bctt',
    desc: 'Enter the Buffalo test stages; the tool flags the heart-rate threshold (HRt) and returns the 80–90% sub-symptom-threshold training band + the plain-language prescription.',
  },
  {
    icon: HeartPulse,
    title: 'Sub-Threshold Trainer (patient app)',
    status: 'Preview',
    href: '/sst-trainer',
    desc: 'The home-based guided trainer: self-guided or clinician-set threshold, per-minute symptom prompts, in-band HR guidance and progression. Mobile-first; scaffold in for the design pass.',
  },
  {
    icon: GraduationCap,
    title: 'Concussion Rehab Mastery — Landing (EP course)',
    status: 'Preview',
    href: '/concussion-rehab-mastery',
    desc: 'The EP-scoped course landing/sales page (gated pre-launch — admin/demo only). Preview the bento, curriculum, the in-person workshop section and pricing. Hidden from the public; visible to you via admin.',
  },
  {
    icon: BookOpen,
    title: 'EP Course — Modules (review copy)',
    status: 'Preview',
    href: '/ep-course/modules/1',
    desc: 'The gated EP course delivery — the same content the ESSA reviewer sees via /demo/essa. 8 modules with quizzes, plus the live Clinical Toolkit + admin-doc downloads.',
  },
  {
    icon: LayoutDashboard,
    title: 'Clinic Dashboard',
    status: 'In development',
    href: null,
    desc: 'The clinician workstation: patient roster, at-home session data, the HRt recovery curve, and one-click GP / NDIS / WorkCover report output. Converges the tools above into the licensed clinic product.',
  },
]

const STATUS_STYLE: Record<string, string> = {
  Live: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Preview: 'bg-blue-50 text-blue-700 border-blue-200',
  'In development': 'bg-slate-100 text-slate-500 border-slate-200',
}

export default function AdminToolsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Clinical Tools</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        The CEA clinical tool suite — the med-tech side of the business. Each tool runs on the shared
        sub-symptom-threshold engine and feeds the same patient data.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {TOOLS.map((t) => {
          const Icon = t.icon
          const inner = (
            <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                  <Icon className="h-5 w-5 text-slate-600" />
                </span>
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[t.status]}`}>
                  {t.status}
                </span>
              </div>
              <h2 className="font-semibold text-slate-900">{t.title}</h2>
              <p className="mt-1 flex-1 text-sm text-slate-600">{t.desc}</p>
              {t.href ? (
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700">
                  Open <ArrowRight className="h-4 w-4" />
                </span>
              ) : (
                <span className="mt-4 inline-flex w-fit items-center rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-400">
                  In development
                </span>
              )}
              {t.clinicianHref && (
                <span className="mt-1 text-xs text-slate-400">Clinician entry: {t.clinicianHref}</span>
              )}
            </div>
          )
          return t.href ? (
            <Link key={t.title} href={t.href} className="block transition-shadow hover:shadow-md">{inner}</Link>
          ) : (
            <div key={t.title}>{inner}</div>
          )
        })}
      </div>
    </div>
  )
}
