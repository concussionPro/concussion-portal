import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'

/**
 * /integrations/cliniko/guide — the customer setup guide.
 *
 * REQUIRED for Cliniko's connected-apps application ("Integration guide URL*" —
 * instructions to help customers integrate your app with Cliniko, per their
 * integrator guide, June 2026). Written as plain instructions, third person,
 * no marketing. Keep every step literally accurate to the shipped UI.
 */
export const metadata: Metadata = {
  title: 'Connect SST Trainer to Cliniko — setup guide',
  description:
    'Step-by-step instructions for connecting SST Trainer to a Cliniko account: create a Cliniko API key, connect it in the SST clinic workspace, and file reports to patient records.',
  alternates: { canonical: '/integrations/cliniko/guide' },
}

const STEPS: { title: string; body: string[] }[] = [
  {
    title: '1. Create a Cliniko API key',
    body: [
      'Log in to Cliniko as the practitioner whose account will file the reports.',
      'Open "My info" (bottom-left of the Cliniko navigation), then choose "Manage API keys".',
      'Select "Create API key", give it a name such as "SST Trainer", and copy the key. Treat this key like a password — it grants access to the Cliniko account.',
    ],
  },
  {
    title: '2. Connect Cliniko in the SST clinic workspace',
    body: [
      'Open the clinic workspace (Clinical Testing) in SST Trainer and locate the "PMS connection" card.',
      'Choose "Cliniko" as the practice-management system, paste the API key, and select Connect.',
      'The card shows "Connected" once the key is verified. The connection is specific to the clinic workspace, and selecting Disconnect removes the stored key at any time.',
    ],
  },
  {
    title: '3. File reports to a patient record',
    body: [
      'When an episode report is ready (for example a GP report or return-to-play data summary), select "File to Cliniko" on the report.',
      'SST Trainer searches the Cliniko patient list by name; select the matching patient.',
      'The report files to that patient’s record — episode summaries as treatment notes, and reports as PDF attachments. The treating clinician reviews and signs all clinical content; SST Trainer does not make clinical decisions.',
    ],
  },
]

export default function ClinikoGuidePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="max-w-2xl mx-auto px-6 pb-16 pt-[120px]">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
          Connect SST Trainer to Cliniko
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Setup takes a few minutes and does not require a developer. What syncs: SST Trainer
          reads patient names for matching, and writes treatment notes and PDF report
          attachments to the selected patient&rsquo;s record. It does not read or modify
          appointments, billing, or other patients&rsquo; clinical notes.
        </p>
        <div className="space-y-8">
          {STEPS.map((s) => (
            <div key={s.title}>
              <h2 className="text-base font-bold text-foreground mb-2">{s.title}</h2>
              <ul className="space-y-1.5">
                {s.body.map((b, i) => (
                  <li key={i} className="text-[14px] text-muted-foreground leading-relaxed pl-4 relative">
                    <span className="absolute left-0 top-[9px] w-1.5 h-1.5 rounded-full bg-accent/60" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-semibold text-foreground mb-1">Troubleshooting &amp; support</p>
          <p className="text-[13.5px] text-muted-foreground leading-relaxed">
            If the connection fails, confirm the API key was copied in full and was created on
            an account with access to the relevant patients. Disconnecting and reconnecting
            with a fresh key resolves most issues. For anything else:{' '}
            <a href="mailto:zac@concussion-education-australia.com" className="text-accent font-semibold hover:underline">
              zac@concussion-education-australia.com
            </a>
          </p>
          <p className="text-[12.5px] text-muted-foreground mt-3">
            See also: <Link href="/integrations/cliniko" className="text-accent hover:underline">integration overview</Link> ·{' '}
            <Link href="/security" className="text-accent hover:underline">security &amp; data handling</Link> ·{' '}
            <Link href="/privacy" className="text-accent hover:underline">privacy policy</Link> ·{' '}
            <Link href="/terms" className="text-accent hover:underline">terms</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
