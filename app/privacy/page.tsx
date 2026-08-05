import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { CONFIG } from '@/lib/config'

/**
 * PRIVACY POLICY — the operative policy, not a draft (owner decision 2026-08-05:
 * "fix the privacy draft, push real").
 *
 * Two things had to change together. The counsel-review banner came off, AND the
 * scope widened: the previous version described only the pre-season baseline tool,
 * while the portal also holds course accounts, SST clinical session data, PMS
 * connections and outreach email. Removing the banner alone would have turned an
 * admittedly-partial document into a complete-LOOKING one — worse for the ACC and
 * PMS reviewers who read this page than the honest draft label was.
 *
 * Every factual claim here is traceable to real system behaviour:
 *   - AU data residency          → vercel.json regions ["syd1"] + Neon ap-southeast-2
 *   - provider list              → lib/db, lib/resend-client, lib/stripe, rate-limit KV
 *   - clinic-chosen patient refs → lib/sst-trainer/clinic-registry (label/ref identity)
 *   - clinician-initiated filing → lib/sst-trainer/pms/*
 *   - suppression on every lane  → lib/email-suppression + CLAUDE.md invariant
 * Do not add a protection here that the code does not actually implement.
 */

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <div className="max-w-3xl mx-auto px-6 pt-[120px] pb-16">
        <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-sm text-muted-foreground mb-10">
          Personal and health information · Version 2.0 · Effective 5 August 2026
        </p>

        <p className="text-sm text-muted-foreground leading-relaxed mb-10">
          This policy explains how Concussion Education Australia (CEA Pty Ltd, ABN 74 688 155 508)
          (&quot;we&quot;, &quot;us&quot;) handles personal information and sensitive health information
          collected through this portal — including our education courses, the clinical testing suite
          (graded exertion testing and concussion assessment tools) and the pre-season baseline testing
          tool. We handle this information in line with the Australian Privacy Principles (APPs) under
          the <em>Privacy Act 1988</em> (Cth). Our general website terms are in our{' '}
          <Link href="/terms" className="text-accent hover:underline">Terms</Link>. The iOS and watchOS
          SST Trainer apps are covered by the{' '}
          <Link href="/sst-privacy" className="text-accent hover:underline">SST Trainer privacy policy</Link>,
          which sits alongside this one.
        </p>

        {/* Roles */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">1. Our role, and your clinic&apos;s role</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Where a clinic uses our clinical tools with its own patients, that clinic holds the clinical
            record and is responsible for its own privacy obligations to its patients, including obtaining
            consent. We provide and operate the software that stores and processes the information on the
            clinic&apos;s behalf. If you are a patient and want to access or correct your clinical record,
            your clinic is normally the right first point of contact — but you can also contact us directly
            using section 9.
          </p>
        </section>

        {/* What we collect */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">
            2. What information we collect
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            <strong className="text-foreground">Account and course information</strong> — name, email
            address, profession and, where you provide it, your registration or accreditation details.
            We record your progress through course modules, your quiz results and any certificate issued
            to you.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            <strong className="text-foreground">Purchase information</strong> — what you bought, when,
            and the invoice we issue. Card details are entered directly with our payment processor and
            are never received or stored by us.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            <strong className="text-foreground">Clinical testing suite (SST)</strong> — sensitive health
            information about a clinic&apos;s patients: exertion test results, heart-rate measurements and
            their source, symptom ratings, red-flag events, test interpretations and return-to-activity
            status, together with the date and the clinician who performed or recorded the test. Patients
            are identified in this tool by a label and reference that the clinic itself chooses; we do not
            require a patient&apos;s full name or date of birth, and how identifiable that label is remains
            the clinic&apos;s decision.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            <strong className="text-foreground">Pre-season baseline tool</strong> — personal and sensitive
            health information self-entered by the athlete or their parent/guardian: identity and background
            (full name, date of birth, sex, dominant hand, ID/jersey number, sport, team/club, position,
            years of education, primary language); health history (prior concussion history, diagnosed
            migraines or headaches, medical conditions such as ADHD, learning disability, depression or
            anxiety, prior brain surgery, and current medications); assessment results (symptom ratings,
            cognitive screening and oculomotor screening responses); and consent records (confirmation of
            consent, the time it was given, the policy version, and for under-16s the parent/guardian name
            and their consent).
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Technical and usage information</strong> — IP address,
            approximate location derived from it, device and browser information, pages viewed and actions
            taken in the portal, and whether our emails were delivered, opened or reported as spam. We use
            this to operate, secure and improve the service.
          </p>
        </section>

        {/* Why */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">3. Why we collect it</h2>
          <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed list-disc pl-5">
            <li>To provide the courses, issue certificates and record continuing professional development.</li>
            <li>To let a clinic run, store, review and report on concussion assessments and graded exertion testing, and to compare a later test against a baseline.</li>
            <li>To produce the reports a clinician generates for a patient, a treating doctor, an employer, a school or an insurer.</li>
            <li>To take payment, issue tax invoices and meet our record-keeping obligations.</li>
            <li>To provide support, keep the service secure, prevent misuse and fix faults.</li>
            <li>To send service messages about your account, and — separately, and only where permitted — educational and marketing email you can opt out of at any time.</li>
          </ul>
          <p className="text-sm text-muted-foreground leading-relaxed mt-3">
            We collect sensitive health information only with consent and only where it is reasonably
            necessary for these purposes. We do not sell personal information, and we do not use patient
            health information for marketing.
          </p>
        </section>

        {/* Who can access */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">4. Who can access it</h2>
          <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed list-disc pl-5">
            <li>The <strong className="text-foreground">clinic</strong> the record belongs to. Access to a clinic&apos;s workspace requires that clinic&apos;s code and access key, and any clinician the clinic has given access to can view that clinic&apos;s patient records.</li>
            <li>Authorised CEA personnel, for the purpose of operating, supporting and securing the service.</li>
            <li>The service providers listed in section 6, strictly to provide hosting, storage, email and payment infrastructure.</li>
            <li>Where a clinician chooses to file a report into their own practice-management system, the information they file is sent to that system at their instruction. We do not send clinical information to a practice-management system on our own initiative.</li>
            <li>Anyone else you or your clinic directs us to share it with, or where we are required or authorised by law to disclose it.</li>
          </ul>
        </section>

        {/* Storage / residency / retention */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">5. Storage, location and retention</h2>
          <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed list-disc pl-5">
            <li><strong className="text-foreground">Database:</strong> records are stored in a PostgreSQL database hosted in Australia (Sydney region).</li>
            <li><strong className="text-foreground">Application:</strong> the portal&apos;s serverless functions — which handle clinical records, reports and account data — are configured to run in the Sydney region, so that processing happens in Australia. A thin request-handling layer (routing, access checks and rate limiting) runs at edge locations close to the visitor, which may be outside Australia; it sees request metadata such as your IP address, your session identifier and the email address inside it, but not clinical records.</li>
            <li><strong className="text-foreground">Reports:</strong> reports are generated on demand from the stored record. Where a report is emailed, delivery is handled by the provider named in section 6.</li>
            <li><strong className="text-foreground">Security:</strong> information is encrypted in transit. Access to a clinic&apos;s records requires that clinic&apos;s credentials, administrative access is separately authenticated, and any credentials you give us to connect a practice-management system are stored encrypted.</li>
            <li><strong className="text-foreground">Retention:</strong> clinical records are retained so that later tests can be compared against earlier ones and so that a clinic keeps a defensible record of care. We keep them for as long as needed for that purpose and for any period the clinic&apos;s own professional or legal obligations require, and we delete or de-identify information when it is no longer required or on a valid request, subject to any legal retention obligations. Course and purchase records are retained for as long as needed to evidence your training and to meet tax and record-keeping obligations.</li>
          </ul>
        </section>

        {/* Third parties / cross-border */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">
            6. Service providers and cross-border disclosure
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            We use the following service providers to run the service. Some are located overseas, which
            means some information may be disclosed to or processed by them outside Australia (APP 8):
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed list-disc pl-5">
            <li><strong className="text-foreground">Neon</strong> — managed PostgreSQL database hosting. Our database is in Australia (Sydney region).</li>
            <li><strong className="text-foreground">Vercel</strong> — application hosting and delivery. Our server functions are configured to run in the Sydney region; content delivery is global.</li>
            <li><strong className="text-foreground">Cloudflare</strong> — network security, DNS and content delivery. It handles requests to this site and sees request metadata including your IP address; delivery is global.</li>
            <li><strong className="text-foreground">Upstash</strong> — key/value store used for service controls such as rate limiting, and for operational data including clinic contact details and access keys and short-lived test data.</li>
            <li><strong className="text-foreground">Resend</strong> — transactional and educational email delivery, including delivery and engagement events; United States.</li>
            <li><strong className="text-foreground">Stripe</strong> — payment processing; United States. Stripe receives your payment details directly.</li>
            <li><strong className="text-foreground">Google</strong> — website analytics and advertising measurement. Where a purchase is measured, your email address is sent only as an irreversible cryptographic hash, never in readable form; United States.</li>
            <li><strong className="text-foreground">Practice-management systems</strong> (for example Cliniko or PracSuite) — only where your clinic connects one, and only for the information a clinician chooses to file.</li>
            <li><strong className="text-foreground">Cal.com</strong> — appointment booking, where you book a call with us.</li>
            <li><strong className="text-foreground">Squarespace</strong> — our marketing website and its enquiry forms.</li>
          </ul>
          <p className="text-sm text-muted-foreground leading-relaxed mt-3">
            Separately, for business-to-business marketing we use{' '}
            <strong className="text-foreground">Apollo</strong> and <strong className="text-foreground">Hunter</strong>{' '}
            to source and verify publicly listed professional contact details for clinics — business
            contact information only. This never involves patient information. If you receive marketing
            from us this way you can opt out using the link in the email, and we will not contact you again.
          </p>
        </section>

        {/* Minors */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">7. Children and young athletes</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Many athletes assessed with these tools are minors. Where the athlete is under 16, our
            pre-season baseline tool requires a parent or guardian to provide consent on the athlete&apos;s
            behalf before any information is collected, and we record that consent alongside the submission.
            Where a clinician uses the clinical testing suite with a child patient, obtaining consent from
            the child&apos;s parent or guardian is the treating clinic&apos;s responsibility as part of its
            own consent process.
          </p>
        </section>

        {/* Breach */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">8. Data breaches</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If we become aware of unauthorised access to, disclosure of, or loss of personal information
            that is likely to result in serious harm, we will assess it and, where the Notifiable Data
            Breaches scheme applies, notify the affected individuals and the Office of the Australian
            Information Commissioner as required by Part IIIC of the <em>Privacy Act 1988</em> (Cth). Where
            the information belongs to a clinic&apos;s patients, we will also notify that clinic so it can
            meet its own obligations.
          </p>
        </section>

        {/* Rights */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">9. Your rights — access, correction, deletion, complaints</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            You can ask us to access or correct the personal or health information we hold, or raise a
            privacy concern, by emailing{' '}
            <a href={`mailto:${CONFIG.CONTACT_EMAIL}`} className="text-accent hover:underline">
              {CONFIG.CONTACT_EMAIL}
            </a>. You can request deletion of your account and associated data at{' '}
            <Link href="/delete-my-data" className="text-accent hover:underline">delete my data</Link>.
            You can opt out of educational and marketing email at any time using the unsubscribe link in
            any such email; once you opt out we suppress your address across every sending list. Service
            messages about an account or a purchase are not marketing and continue.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            Where the information forms part of a clinic&apos;s clinical record, we may need to direct your
            request to that clinic, or ask it to authorise the change, because the clinic — not CEA — holds
            that record and may have its own retention obligations.
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
          <h2 className="text-xl font-bold text-foreground mb-4">10. Contact us</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            For any privacy question or request, email{' '}
            <a href={`mailto:${CONFIG.CONTACT_EMAIL}`} className="text-accent hover:underline">
              {CONFIG.CONTACT_EMAIL}
            </a>. We aim to respond within 30 days.
          </p>
        </section>

        {/* Changes */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">11. Changes to this policy</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We may update this policy as the service changes. The version and effective date at the top of
            this page identify the current policy, and where consent was recorded against an earlier version
            we retain a record of which version was agreed to.
          </p>
        </section>

        <div className="border-t border-border pt-6">
          <Link href="/preseason" className="text-sm text-accent hover:underline">
            &larr; Back to pre-season baseline
          </Link>
        </div>
      </div>
    </div>
  )
}
