import Link from 'next/link'
import { CONFIG } from '@/lib/config'

/* SST Trainer privacy policy — pre-launch pass completed 2026-07-02.
   Intentionally self-contained (no SiteNav) so it renders cleanly as a
   stand-alone URL pasted into app-store listings when those go live. */

export const metadata = {
  title: 'SST Trainer — Privacy Policy',
  robots: { index: false, follow: false },
}

export default function SstPrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 pt-16 pb-16">
        <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
          SST Trainer — Privacy Policy
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Last updated: 2 July 2026 · Last reviewed: 2 July 2026
        </p>

        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          This policy explains how Concussion Education Australia (CEA Pty Ltd, ABN 15 657 685 613)
          (&quot;we&quot;, &quot;us&quot;) handles information collected through the{' '}
          <strong className="text-foreground">SST Trainer</strong> mobile and web application
          (the &quot;app&quot;). We handle information in line with the Australian Privacy Principles
          (APPs) under the <em>Privacy Act 1988</em> (Cth).
        </p>

        {/* Not a medical device */}
        <div className="rounded-xl border border-border bg-muted/40 p-4 mb-10">
          <p className="text-sm text-foreground leading-relaxed">
            <strong>Important:</strong> SST Trainer is a tool that supports exercise rehabilitation
            overseen by a treating clinician. It is <strong>not a medical device</strong>, does{' '}
            <strong>not diagnose</strong>, and does <strong>not provide return-to-play or
            return-to-sport clearance</strong>. Those decisions remain with your treating practitioner.
          </p>
        </div>

        {/* 1. What we collect */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">1. What information the app collects</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            Used on your own, the app works without your email address or other direct identifiers.
            In <strong className="text-foreground">clinic mode</strong> (when you enter a clinic
            code), your name is required so your clinic can identify your program. The app collects:
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed list-disc pl-5">
            <li><strong className="text-foreground">Name</strong> — optional when you use the app on your own; in clinic mode your name is required and is shared with your clinic.</li>
            <li><strong className="text-foreground">Heart rate</strong> — measured live during a session (from a paired Bluetooth heart-rate sensor, your phone camera pulse, or manual entry) to calculate your heart-rate threshold and pace each session.</li>
            <li><strong className="text-foreground">Symptom ratings</strong> — scores you enter during a session, used to gate progression and to stop a session that is provoking symptoms.</li>
            <li><strong className="text-foreground">Session records</strong> — the prescribed training band, exertion test results and session history, so progress can be tracked over time.</li>
            <li><strong className="text-foreground">Clinic code</strong> (optional) — a code that links your program to your treating clinic.</li>
            <li><strong className="text-foreground">Live session stream</strong> (clinic mode) — during a session, your live heart rate and band status stream to your clinic&apos;s dashboard so your clinician can monitor the session as it happens. This live data is held in a short-lived cache (around 15 seconds) and is not stored.</li>
          </ul>
        </section>

        {/* 2. Camera & Bluetooth */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">2. Camera and Bluetooth permissions</h2>
          <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed list-disc pl-5">
            <li><strong className="text-foreground">Camera</strong> — used <em>only</em> for optical pulse (photoplethysmography) measurement when you choose the camera method to read your heart rate. No photos or video are stored or transmitted; only the derived pulse value is used.</li>
            <li><strong className="text-foreground">Bluetooth</strong> — used <em>only</em> to connect to and read a paired heart-rate sensor.</li>
          </ul>
        </section>

        {/* 3. Why */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">3. Why we collect it (purpose)</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We collect this information to establish your sub-symptom-threshold, prescribe and pace
            safe exercise sessions, and track your recovery. Where you enter a clinic code, results
            are made available to that clinic to support your clinician&apos;s oversight of your
            rehabilitation. We do <strong className="text-foreground">not</strong> use your information
            for advertising and we do <strong className="text-foreground">not</strong> sell it to third parties.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mt-3">
            <strong className="text-foreground">De-identified research use (optional):</strong> the app
            may ask whether your session records can be used, in de-identified form (name, clinic code
            and other identifiers removed), for research and service improvement — for example,
            aggregate analysis of recovery trajectories. This consent is optional, is not required to
            use the app, and can be withdrawn at any time by emailing us (section 7).
          </p>
        </section>

        {/* 4. Who can access */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">4. Who can access it</h2>
          <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed list-disc pl-5">
            <li>You, on your device.</li>
            <li>The <strong className="text-foreground">clinic</strong> whose clinic code you entered, where applicable.</li>
            <li>Authorised CEA personnel, for the purpose of operating, supporting and securing the service.</li>
            <li>The infrastructure providers in section 6, strictly to provide hosting, storage and email.</li>
          </ul>
        </section>

        {/* 5. Storage / retention */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">5. Storage and retention</h2>
          <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed list-disc pl-5">
            <li><strong className="text-foreground">Database:</strong> where a clinic code is used, session records are stored in a PostgreSQL database with our Australian-region database provider (Neon). Data is encrypted in transit.</li>
            <li><strong className="text-foreground">Live session data:</strong> the real-time heart-rate stream sent to your clinic&apos;s dashboard during a session is held in a short-lived cache (around 15 seconds) and is not stored.</li>
            <li><strong className="text-foreground">Retention:</strong> records are kept for as long as needed to support your rehabilitation program, and are deleted or de-identified when no longer required or on a valid request, subject to any legal retention obligations.</li>
            <li><strong className="text-foreground">Deletion:</strong> email us at {CONFIG.CONTACT_EMAIL} to have your records deleted (section 7).</li>
          </ul>
        </section>

        {/* 6. Third parties */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">6. Third parties and cross-border disclosure</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            We use the following providers to run the service. Some are located overseas, which means
            some information may be processed outside Australia (APP 8):
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed list-disc pl-5">
            <li><strong className="text-foreground">Neon</strong> — managed PostgreSQL database hosting (Australian region).</li>
            <li><strong className="text-foreground">Vercel</strong> — application hosting and delivery.</li>
            <li><strong className="text-foreground">Vercel KV / Upstash</strong> — the short-lived cache used for the live in-session heart-rate stream; may process data outside Australia.</li>
            <li><strong className="text-foreground">Resend</strong> — transactional email delivery, where used; United States.</li>
          </ul>
        </section>

        {/* 7. Rights */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">7. Your rights — access, correction, deletion, complaints</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            You can ask us to access, correct or delete the information held about you, or raise a
            privacy concern, by emailing{' '}
            <a href={`mailto:${CONFIG.CONTACT_EMAIL}`} className="text-accent hover:underline">
              {CONFIG.CONTACT_EMAIL}
            </a>. Where your records sit with your clinic, you may also need to contact that clinic.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If you are not satisfied with how we handle a privacy complaint, you can contact the Office
            of the Australian Information Commissioner (OAIC) at{' '}
            <a href="https://www.oaic.gov.au" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              oaic.gov.au
            </a>{' '}or on 1300 363 992.
          </p>
        </section>

        {/* 8. Contact */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">8. Contact us</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            For any privacy question or request, email{' '}
            <a href={`mailto:${CONFIG.CONTACT_EMAIL}`} className="text-accent hover:underline">
              {CONFIG.CONTACT_EMAIL}
            </a>.
          </p>
        </section>

        <div className="border-t border-border pt-6">
          <p className="text-xs text-muted-foreground">
            If anything in this policy is unclear, or you believe it does not reflect how the app
            behaves, email us at{' '}
            <a href={`mailto:${CONFIG.CONTACT_EMAIL}`} className="underline">
              {CONFIG.CONTACT_EMAIL}
            </a>{' '}
            and we will review it.
          </p>
        </div>
      </div>
    </div>
  )
}
