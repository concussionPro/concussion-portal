import { PROTOCOL_DOI, PROTOCOL_DOI_URL } from '@/lib/protocol-reference'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, KeyRound, FileText, ShieldCheck, Plug, Activity, ClipboardList } from 'lucide-react'
import { SiteNav } from '@/components/SiteNav'

/**
 * /integrations/nookal — the public integration landing page (Nookal twin of
 * /integrations/cliniko, 2026-08-11).
 *
 * Exists for the same two audiences:
 *  1. Nookal's curated Integrations directory: listings are arranged directly
 *     with Nookal (info@nookal.com — no formal program), each listing links a
 *     public "Connect X with Nookal" style page. This is that page.
 *  2. Clinicians googling "Nookal concussion" — indexable, canonical.
 *
 * Copy is limited to what the adapter VERIFIABLY does (lib/sst-trainer/pms/
 * nookal.ts): patient search, treatment notes filed into the correct case
 * (created when none exists), PDF report attachments via Nookal's documented
 * upload flow. The per-location API key scoping is called out in setup —
 * it is the one silent misconfiguration a multi-site clinic can make.
 */
export const metadata: Metadata = {
  title: 'SST Trainer + Nookal — concussion rehab reports filed straight into the patient record',
  description:
    'Connect SST Trainer to Nookal: measured sub-threshold concussion rehab with every home session verified, and the GP report and return-to-play summary filed into the patient’s Nookal record in one click.',
  alternates: { canonical: '/integrations/nookal' },
}

const STEPS = [
  {
    icon: KeyRound,
    title: 'Create a Nookal API key',
    body: 'In Nookal: Setup → Connections → API Keys → Generate API Key. Tick every location SST should file into — keys are per-location, and an unticked location stays invisible. Under a minute, no developer needed.',
  },
  {
    icon: Plug,
    title: 'Connect it in your SST workspace',
    body: 'In your clinic’s Clinical Testing workspace, open the PMS connection card, choose Nookal and paste the key. The connection verifies itself instantly, is per-clinic, and you can disconnect at any time.',
  },
  {
    icon: FileText,
    title: 'Reports file in one click',
    body: 'SST matches the patient in your Nookal, and your clinician files the episode documentation to their record in one click — into the right case, with the PDF attached. No copy-paste, no PDF juggling.',
  },
]

const WRITES = [
  {
    icon: ClipboardList,
    title: 'Treatment notes, in the right case',
    body: 'Session and episode summaries write to the patient’s Nookal treatment notes — filed against their current case, or an “SST — concussion episode” case created for them.',
  },
  {
    icon: FileText,
    title: 'PDF report attachments',
    body: 'The GP report and return-to-play data summary attach to the patient record using Nookal’s documented file-upload flow.',
  },
  {
    icon: Activity,
    title: 'The clinical layer stays in SST',
    body: 'Threshold testing (Buffalo protocol), verified home sessions on the patient’s own watch, and the live recovery trajectory — your team keeps working in Nookal; SST files into it.',
  },
]

export default function NookalIntegrationPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="max-w-5xl mx-auto px-6 pb-16 pt-[120px]">
        <div className="text-center mb-10">
          <div className="badge mb-5 inline-flex">
            <Plug className="w-3.5 h-3.5 mr-1.5" />
            Nookal integration
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Measured concussion rehab,
            <br className="hidden sm:block" /> filed <span className="text-gradient">into Nookal</span>.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            SST Trainer runs the Buffalo threshold test, verifies every home session on the
            patient&rsquo;s own watch, and writes the documentation — GP report, return-to-play data
            summary, treatment notes — straight into the patient&rsquo;s Nookal record.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {/* ?src=nookal — the listing-URL attribution convention (mirrors
                cliniko); without it this page's signups land unattributed. */}
            <Link href="/clinical-suite/start?src=nookal" className="btn-primary inline-flex items-center gap-2 px-7 py-3 rounded-xl font-semibold text-sm">
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
              <li>Your Nookal API key is stored per-clinic and used only to match patients and file reports; disconnect at any time and the key is removed. Scope it to the locations you choose when generating it in Nookal.</li>
              <li>Data is stored in Australia (Sydney region) and the functions that handle clinical records, reports and account data run in the Sydney region. A thin routing and session-authentication layer runs at the network edge; clinical records are neither stored nor processed there. See <Link href="/security" className="text-accent hover:underline">security &amp; data handling</Link>.</li>
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
            <a href={PROTOCOL_DOI_URL} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              {PROTOCOL_DOI}
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
