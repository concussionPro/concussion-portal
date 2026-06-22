// HIDDEN / INTERNAL PREVIEW — Screen Comfort section (working title; consumer brand TBD).
// Kept hidden deliberately: robots noindex+nofollow, NOT in SiteNav, NOT in sitemap.ts.
// Sits alongside the Preseason Baseline tool as a future clinic tool + research/literature hub.
// Compliance: wellness/comfort framing only — NO diagnosis/treatment claims (TGA/AHPRA).
// To reveal later: add to SiteNav + sitemap.ts and remove the robots block.
import Link from 'next/link'
import { Eye, FileText, FlaskConical, ArrowRight, ShieldCheck } from 'lucide-react'
import { SiteNav } from '@/components/SiteNav'

export const metadata = {
  title: 'Screen Comfort — research preview',
  description: 'A measured, personalized screen-comfort tool and its research base. Internal preview.',
  robots: { index: false, follow: false },
}

export default function ScreenComfortPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteNav />

      <main className="mx-auto max-w-3xl px-5 pb-24 pt-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Internal preview — not yet public
        </div>

        <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Screen Comfort
          <span className="block text-lg font-medium text-slate-500">measured colour &amp; contrast for light-sensitive eyes</span>
        </h1>

        <p className="mt-4 text-[15px] leading-relaxed text-slate-600">
          A free, on-device webcam tool that observes how the eyes respond to a few screen colour-and-contrast
          settings — and what each one feels like — then personalizes the screen for comfort. Built as a complement
          to clinical care for people managing light sensitivity and screen tolerance, including during recovery.
          It is a comfort and accessibility tool; it does not diagnose, measure, or treat any condition.
        </p>

        {/* For clinicians — sits alongside Preseason Baseline */}
        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700"><Eye size={20} /></span>
            <h2 className="text-lg font-semibold text-slate-900">For clinicians</h2>
          </div>
          <p className="mt-3 text-[14.5px] leading-relaxed text-slate-600">
            A tool you can offer patients who find screens uncomfortable — to find a gentler colour-and-contrast
            setting and support a graduated return to screen work. Sits alongside the Preseason Baseline tool as a
            patient-facing clinic resource. Nothing is uploaded; the test runs on the patient&apos;s own device.
          </p>
          <p className="mt-3 inline-flex items-center gap-2 text-[13px] text-slate-500">
            <ShieldCheck size={15} className="text-teal-600" /> Wellness / accessibility support — not a clinical assessment.
          </p>
        </section>

        {/* Research / literature hub */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-700"><FlaskConical size={20} /></span>
            <h2 className="text-lg font-semibold text-slate-900">The research</h2>
          </div>
          <p className="mt-3 text-[14.5px] leading-relaxed text-slate-600">
            The approach is grounded in published vision science — the melanopsin/ipRGC photophobia pathway,
            objective squint/blink responses to glare, and validated contrast-sensitivity measurement. Our white
            paper sets out the method, the evidence, and its honest limits; a scoping review and a sham-controlled
            feasibility study are in preparation.
          </p>
          <ul className="mt-4 space-y-2 text-[14px]">
            {[
              ['White paper — method, evidence & boundaries', '#'],
              ['Scoping review — objective measurement of photophobia (in prep)', '#'],
              ['Feasibility / methods paper (in prep)', '#'],
            ].map(([label, href]) => (
              <li key={label}>
                <Link href={href as string} className="inline-flex items-center gap-2 text-slate-700 hover:text-indigo-700">
                  <FileText size={15} className="text-slate-400" /> {label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[12px] text-slate-400">
            Links go live as each artifact is published (Zenodo DOI / preprint). Placeholder for now.
          </p>
        </section>

        {/* Try it — internal preview build (hidden, not yet public) */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-sm">
          <h2 className="text-lg font-semibold">Try the tool</h2>
          <p className="mt-2 text-[14.5px] leading-relaxed text-slate-300">
            The eye-comfort instrument runs entirely in your browser — it asks for your camera to read squint &amp; gaze
            on-device, and nothing is uploaded. You can also explore it without a camera (taps only). Preview build.
          </p>
          <a
            href="/tools/screen-comfort/index.html"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2 text-[14px] font-semibold text-slate-900 transition hover:bg-teal-400"
          >
            Launch Screen Comfort <ArrowRight size={15} />
          </a>
          <p className="mt-3 text-[12px] text-slate-400">
            Internal preview · wellness / accessibility support — not a clinical assessment.
          </p>
        </section>

        <p className="mt-8 text-center text-[12px] text-slate-400">
          Concussion Education Australia · research preview · brand &amp; public launch pending
        </p>
      </main>
    </div>
  )
}
