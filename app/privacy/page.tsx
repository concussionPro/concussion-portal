import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { CONFIG } from '@/lib/config'

/* DRAFT — review with legal/privacy counsel before relying on this. */

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <div className="max-w-3xl mx-auto px-6 pt-[120px] pb-16">
        <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
          Privacy Policy — Health Information
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Last updated: June 2026
        </p>

        {/* Draft / counsel-review banner */}
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 mb-10">
          <p className="text-sm text-amber-900 font-semibold mb-1">Draft — under review</p>
          <p className="text-sm text-amber-800 leading-relaxed">
            This policy is a working draft. It should be reviewed and approved by legal/privacy
            counsel before it is relied upon. If anything here is unclear or appears inaccurate,
            please contact us at{' '}
            <a href={`mailto:${CONFIG.CONTACT_EMAIL}`} className="underline font-medium">
              {CONFIG.CONTACT_EMAIL}
            </a>.
          </p>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed mb-10">
          This policy explains how Concussion Education Australia (CEA Pty Ltd, ABN 74 688 155 508)
          (&quot;we&quot;, &quot;us&quot;) handles personal information and sensitive health information
          collected through our clinical tools, in particular the pre-season concussion baseline
          testing tool. We handle this information in line with the Australian Privacy Principles (APPs)
          under the <em>Privacy Act 1988</em> (Cth). This policy is specific to our clinical tools;
          our general website terms are in our{' '}
          <Link href="/terms" className="text-accent hover:underline">Terms</Link>.
        </p>

        {/* What we collect */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">
            1. What information we collect
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            Through the pre-season baseline tool we collect <strong className="text-foreground">personal
            information</strong> and <strong className="text-foreground">sensitive (health) information</strong>,
            which the athlete (or their parent/guardian) self-enters. This includes:
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed list-disc pl-5">
            <li>Identity and background: full name, date of birth, sex, dominant hand, ID/jersey number, sport, team/club, position, years of education, primary language.</li>
            <li>Health history: prior concussion history (number, dates, recovery, symptoms), diagnosed migraines/headaches, medical conditions (e.g. ADHD, learning disability, depression/anxiety, prior brain surgery), and current medications.</li>
            <li>Assessment results: symptom ratings, cognitive screening results (orientation, memory, concentration, delayed recall) and oculomotor (eye-movement) screening responses.</li>
            <li>Consent records: confirmation of consent, the time it was given, the policy version, and — for under-16s — the parent/guardian name and their consent.</li>
          </ul>
        </section>

        {/* Why */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">2. Why we collect it (purpose)</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We collect this information so that the athlete&apos;s clinic can establish a concussion
            baseline and use it to support the management of any future suspected concussion (including
            comparing a later test against the baseline). We collect sensitive information only with
            consent and only where it is reasonably necessary for this purpose.
          </p>
        </section>

        {/* Who can access */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">3. Who can access it</h2>
          <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed list-disc pl-5">
            <li>The <strong className="text-foreground">clinic</strong> whose baseline link was used — the completed report is emailed to that clinic&apos;s nominated contact.</li>
            <li>Authorised CEA personnel, for the purpose of operating, supporting and securing the service.</li>
            <li>The service providers listed in section 5, strictly to provide hosting, storage, email and payment infrastructure.</li>
          </ul>
        </section>

        {/* Storage / residency / retention */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">4. Storage, location and retention</h2>
          <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed list-disc pl-5">
            <li><strong className="text-foreground">Database:</strong> baseline records are stored in a PostgreSQL database hosted in Australia (Sydney region) by our database provider (Neon).</li>
            <li><strong className="text-foreground">Generated report:</strong> a PDF report is produced and emailed to the clinic. Email delivery is handled by a third party (see section 5).</li>
            <li><strong className="text-foreground">Retention:</strong> baseline records are retained so that future tests can be compared against the baseline. We keep them for as long as needed for that concussion-management purpose, and will delete or de-identify information when it is no longer required or on a valid request, subject to any legal retention obligations.</li>
          </ul>
        </section>

        {/* Third parties / cross-border */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">
            5. Third parties and cross-border disclosure
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            We use the following service providers to run the service. Some are located overseas, which
            means some information may be disclosed or processed outside Australia (APP 8):
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed list-disc pl-5">
            <li><strong className="text-foreground">Neon</strong> — managed PostgreSQL database hosting (Australia, Sydney region).</li>
            <li><strong className="text-foreground">Vercel</strong> — application hosting and delivery.</li>
            <li><strong className="text-foreground">Upstash</strong> — key/value store used for service controls such as rate limiting.</li>
            <li><strong className="text-foreground">Resend</strong> — transactional email delivery (used to email the report to the clinic); United States.</li>
            <li><strong className="text-foreground">Stripe</strong> — payment processing for course/product purchases (not used for baseline submissions); United States.</li>
          </ul>
          <p className="text-xs text-muted-foreground leading-relaxed mt-3">
            We are working to confirm appropriate data-handling arrangements with these providers. The
            specific contractual protections (e.g. data processing agreements) are being reviewed.
          </p>
        </section>

        {/* Minors */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">6. Children and young athletes</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Many athletes who use the baseline tool are minors. Where the athlete is under 16, the tool
            requires a parent or guardian to provide consent on the athlete&apos;s behalf before any
            information is collected. We record that guardian consent alongside the submission. The exact
            age threshold for consent capacity is being confirmed with legal advice and may be adjusted.
          </p>
        </section>

        {/* Rights */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">7. Your rights — access, correction, complaints</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            You can ask us to access or correct the personal/health information we hold about an athlete,
            or raise a privacy concern, by emailing{' '}
            <a href={`mailto:${CONFIG.CONTACT_EMAIL}`} className="text-accent hover:underline">
              {CONFIG.CONTACT_EMAIL}
            </a>. As the report is provided to the athlete&apos;s clinic, you may also need to contact
            the clinic that holds the clinical record.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If you are not satisfied with how we handle a privacy complaint, you can contact the Office of
            the Australian Information Commissioner (OAIC) at{' '}
            <a href="https://www.oaic.gov.au" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              oaic.gov.au
            </a>{' '}or on 1300 363 992.
          </p>
        </section>

        {/* Contact */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">8. Contact us</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            For any privacy question or request, email{' '}
            <a href={`mailto:${CONFIG.CONTACT_EMAIL}`} className="text-accent hover:underline">
              {CONFIG.CONTACT_EMAIL}
            </a>. We aim to respond within a reasonable time.
          </p>
        </section>

        <div className="border-t border-border pt-6">
          <p className="text-xs text-muted-foreground italic mb-4">
            Note: this is a draft policy and should be reviewed by legal/privacy counsel before being relied upon.
          </p>
          <Link href="/preseason" className="text-sm text-accent hover:underline">
            &larr; Back to pre-season baseline
          </Link>
        </div>
      </div>
    </div>
  )
}
