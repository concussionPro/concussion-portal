import type { Metadata } from 'next'
import { ShieldCheck, Lock, Server, KeyRound, FileText, Users, AlertTriangle, Globe } from 'lucide-react'
import { SiteNav } from '@/components/SiteNav'

/**
 * /security — public security & data-handling statement.
 *
 * Exists because every PMS vetting process we've triggered (Cliniko listing,
 * PracSuite vendor key, Coreplus product review, Jane's "The Jane 10") asks
 * the same questions; this page answers them once, publicly, and is linked
 * from applications. Claims here are LOAD-BEARING for those reviews — keep
 * every statement literally true of the running system.
 */
export const metadata: Metadata = {
  title: 'Security & Data Handling | Concussion Education Australia',
  description:
    'How Concussion Education Australia and SST Trainer handle clinical data: encryption, Australian data residency, per-clinic credentials, write-back-only PMS integrations, and our subprocessor list.',
  alternates: { canonical: '/security' },
}

const SECTIONS = [
  {
    icon: Lock,
    title: 'Encryption',
    body: 'All data is encrypted in transit (TLS 1.2+) and at rest (AES-256). There are no unencrypted transport paths to our services.',
  },
  {
    icon: Globe,
    title: 'Data residency',
    // Corrected 2026-08-05: this said processing ran in Australia full stop,
    // which /privacy had already been corrected NOT to claim — the two pages
    // contradicted each other on the one fact ACC and PMS security reviewers
    // check. middleware.ts matches '/api/:path*' and runs at the edge in the
    // reviewer's own region: it decrypts the session and queries Neon from
    // there. Clinical records, reports and account data are still stored and
    // processed in Sydney; the edge layer routes and authenticates. Say what
    // actually runs where.
    body: 'All data is stored in Australia (Sydney — Neon Postgres, ap-southeast-2) and the application functions that handle clinical records, reports and account data execute in the Sydney region. A thin routing and session-authentication layer runs at the network edge, which may be geographically near the visitor; it reads the session and routes the request, and clinical records are neither stored nor processed there. This satisfies AU/NZ residency requirements including NZ ACC supplier obligations for client information held in New Zealand and/or Australia.',
  },
  {
    icon: KeyRound,
    title: 'PMS integrations are write-back-shaped',
    body: 'Practice-management integrations use per-clinic credentials supplied by the clinic, removable at any time. We match the patient and file finished clinical documents (notes, PDF reports) to the record. We never touch scheduling, billing, calendars or other patients’ records; we never ask for login credentials, never bypass two-factor authentication, and use no browser extensions or scraping.',
  },
  {
    icon: Users,
    title: 'Access control',
    body: 'Clinic workspaces are isolated per clinic code. Administrative access is restricted to named individuals with multi-factor authentication on all infrastructure accounts, on a least-privilege basis.',
  },
  {
    icon: AlertTriangle,
    title: 'Incidents',
    body: 'We maintain an incident-response process and commit to notifying affected clinics of any data breach affecting their information promptly after detection, with a full account of scope and remediation.',
  },
  {
    icon: Server,
    title: 'Subprocessors',
    // Kept in step with the fuller list on /privacy (2026-08-05): the two pages
    // must not name different subprocessor sets. PMS vendors are listed because
    // a write-back sends a finished clinical document to the clinic's own
    // system — Gensolve in particular carries the NZ/ACC fields.
    body: 'Vercel (application hosting), Neon (Postgres database), Vercel KV / Upstash (rate limiting and short-lived operational state), Stripe (payments — card data never touches our servers), Resend (transactional email), Cloudflare (DNS/edge), Google (analytics and conversion measurement — email addresses are SHA-256 hashed before they leave our systems), Cal.com (booking) and Squarespace (marketing site). Where a clinic enables practice-management write-back, its own PMS vendor (Cliniko, PracSuite, Gensolve or Core Plus) receives the finished document. Each is engaged under its own security and privacy terms.',
  },
  {
    icon: FileText,
    title: 'Clinical boundaries',
    body: 'SST Trainer supports clinician prescriptions and documentation. The software never diagnoses and never makes clearance decisions — clinicians review and sign every report. The clinical protocol it delivers is published open-access (DOI 10.5281/zenodo.21482634).',
  },
]

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="max-w-3xl mx-auto px-6 pb-16 pt-[120px]">
        <div className="text-center mb-10">
          <div className="badge mb-5 inline-flex">
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
            Security &amp; data handling
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            How we handle clinical data
          </h1>
          <p className="text-muted-foreground">
            The standing answers to the questions clinics, partners and platform reviews ask us.
            Questions or security documentation requests:{' '}
            <a href="mailto:zac@concussion-education-australia.com" className="text-accent font-semibold hover:underline">
              zac@concussion-education-australia.com
            </a>
          </p>
        </div>
        <div className="space-y-4">
          {SECTIONS.map((s) => (
            <div key={s.title} className="rounded-2xl border border-slate-200 bg-white p-5 flex items-start gap-4">
              <s.icon className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" strokeWidth={1.8} />
              <div>
                <p className="text-sm font-bold text-foreground mb-1">{s.title}</p>
                <p className="text-[13.5px] text-muted-foreground leading-relaxed">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-8">
          Concussion Education Australia (CEA Pty Ltd) · ABN 74 688 155 508 · Last reviewed July 2026
        </p>
      </div>
    </div>
  )
}
