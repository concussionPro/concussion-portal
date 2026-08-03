import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, KeyRound, FileText, ShieldCheck, Plug, Activity, ClipboardList } from 'lucide-react'
import { SiteNav } from '@/components/SiteNav'

/**
 * /integrations/cliniko — the public integration landing page.
 *
 * Exists for two audiences (2026-07-31):
 *  1. The Cliniko connected-apps directory: Cliniko has no formal marketplace
 *     program — you build against the API, then ask support@cliniko.com for a
 *     listing, and they expect a public page describing the integration,
 *     setup and support. This is that page.
 *  2. Clinicians googling "Cliniko concussion" — indexable, canonical.
 *
 * Copy is limited to what the adapter VERIFIABLY does (lib/sst-trainer/pms/
 * cliniko.ts): patient search/match, treatment-note writes (validated live
 * 2026-07-20), PDF report attachments via the documented presigned-POST flow.
 */
export const metadata: Metadata = {
  title: 'SST Trainer + Cliniko — concussion rehab reports filed straight into the patient record',
  description:
    'Connect SST Trainer to Cliniko: measured sub-threshold concussion rehab with every home session verified, and the GP report and return-to-play summary filed into the patient’s Cliniko record in one click.',
  alternates: { canonical: '/integrations/cliniko' },
}

const STEPS = [
  {
    icon: KeyRound,
    title: 'Create a Cliniko API key',
    body: 'In Cliniko: My Info → Manage API keys → create a key. Takes under a minute — no developer needed.',
  },
  {
    icon: Plug,
    title: 'Connect it in your SST workspace',
    body: 'In your clinic’s Clinical Testing workspace, open the PMS connection card, choose Cliniko and paste the key. The connection is per-clinic and you can disconnect at any time.',
  },
  {
    icon: FileText,
    title: 'Reports file in one click',
    body: 'SST matches the patient in your Cliniko, and your clinician files the episode documentation to their record in one click — no copy-paste, no PDF juggling.',
  },
]

const WRITES = [
  {
    icon: ClipboardList,
    title: 'Treatment notes',
    body: 'Session and episode summaries written to the patient’s Cliniko treatment notes as care happens.',
  },
  {
    icon: FileText,
    title: 'PDF report attachments',
    body: 'The GP report and return-to-play data summary attach to the patient record using Cliniko’s documented attachment flow.',
  },
  {
    icon: Activity,
    title: 'The clinical layer stays in SST',
    body: 'Threshold testing (Buffalo protocol), verified home sessions on the patient’s own watch, and the live recovery trajectory — your team keeps working in Cliniko; SST files into it.',
  },
]

export default function ClinikoIntegrationPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="max-w-5xl mx-auto px-6 pb-16 pt-[120px]">
        <div className="text-center mb-10">
          <div className="badge mb-5 inline-flex">
            <Plug className="w-3.5 h-3.5 mr-1.5" />
            Cliniko integration &middot; live
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Measured concussion rehab,
            <br className="hidden sm:block" /> filed <span className="text-gradient">into Cliniko</span>.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            SST Trainer runs the Buffalo threshold test, verifies every home session on the
            patient&rsquo;s own watch, and writes the documentation — GP report, return-to-play data
            summary, treatment notes — straight into the patient&rsquo;s Cliniko record.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/clinical-suite/start" className="btn-primary inline-flex items-center gap-2 px-7 py-3 rounded-xl font-semibold text-sm">
              Start free &mdash; 3 patients, no card
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/clinics" className="inline-flex items-center gap-2 px-7 py-3 rounded-xl border border-slate-300 font-semibold text-sm text-foreground hover:bg-slate-50">
              See it live &mdash; no login
            </Link>
            <Link href="/clinical-testing" className="inline-flex items-center gap-2 px-7 py-3 rounded-xl border border-slate-300 font-semibold text-sm text-foreground hover:bg-slate-50">
              Clinician workspace
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-12">
          {WRITES.map((w) => (
            <div key={w.title} className="rounded-2xl border border-slate-200 bg-white p-5">
              <w.icon className="w-6 h-6 text-accent mb-3" strokeWidth={1.8} />
              <p className="text-sm font-bold text-foreground mb-1.5">{w.title}</p>
              <p className="text-[13px] text-muted-foreground leading-relaxed">{w.body}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 md:p-8 mb-12">
          <h2 className="text-xl font-bold text-foreground mb-6">Setup &mdash; three steps, no developer</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <div key={s.title} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/10 text-accent font-bold text-sm flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground mb-1">{s.title}</p>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-6 md:p-8 mb-12 flex items-start gap-4">
          <ShieldCheck className="w-8 h-8 text-accent flex-shrink-0" strokeWidth={1.8} />
          <div>
            <h2 className="text-base font-bold text-foreground mb-2">Security &amp; data handling</h2>
            <ul className="text-[13.5px] text-muted-foreground leading-relaxed space-y-1.5 list-disc pl-4">
              <li>Your Cliniko API key is stored per-clinic and used only to match patients and file reports; disconnect at any time and the key is removed.</li>
              <li>All processing runs in Australia (Sydney region) with data stored in Australia.</li>
              <li>Requests to Cliniko identify the app and a support contact, per Cliniko&rsquo;s API requirements.</li>
              <li>SST never reads your calendar, billing or other patients&rsquo; clinical notes &mdash; patient search and report filing only.</li>
            </ul>
          </div>
        </div>

        <div className="text-center rounded-2xl border border-slate-200 bg-white p-8">
          <h2 className="text-xl font-bold text-foreground mb-2">Questions or setup help</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Direct line to the founder &mdash; <a href="mailto:zac@concussion-education-australia.com" className="text-accent font-semibold hover:underline">zac@concussion-education-australia.com</a>
          </p>
          <p className="text-xs text-muted-foreground">
            The clinical protocol SST delivers is published open-access:{' '}
            <a href="https://doi.org/10.5281/zenodo.21482634" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              doi.org/10.5281/zenodo.21482634
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
