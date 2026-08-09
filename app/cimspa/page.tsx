import { PROTOCOL_DOI_LABEL, PROTOCOL_DOI_URL } from '@/lib/protocol-reference'
import Link from 'next/link'
import { intlPriceForCountry } from '@/lib/international-pricing'
import { InternationalCourseSchema } from '@/components/international/InternationalCourseSchema'
import { CONFIG } from '@/lib/config'
import { CRM_REFERENCE_COUNT } from '@/data/reference-count'

/**
 * /cimspa — landing page for UK fitness / active-health professionals via
 * CIMSPA. The ENDORSED product here is the FREE awareness course
 * (/concussion-update) — recognise-&-refer, Certificate of Completion, 0 CPD.
 * Concussion Rehab Mastery is a secondary upsell only.
 */

const CRM_PRICE = intlPriceForCountry('GB') // £275

// Title + description were missing, so this UK page inherited the root layout's
// Australian SCAT6 fallback title while sitting in the sitemap. Copy mirrors the
// InternationalCourseSchema name/description below — one claim, one wording.
export const metadata = {
  title: 'Concussion awareness for UK fitness and active-health professionals | CIMSPA',
  description:
    'Recognise a concussion on the gym floor and know exactly what to do next — a free awareness course covering recognition, red flags and safe referral, with a certificate of completion.',
  alternates: { canonical: '/cimspa' },
}

export default function CimspaLandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <InternationalCourseSchema
        name={"Concussion awareness for UK fitness and active-health professionals"}
        description={"Recognise a concussion on the gym floor and know exactly what to do next — a free awareness course covering recognition, red flags and safe referral, with a certificate of completion."}
        country="GB"
        path="/cimspa"
        roles={['Fitness Professional', 'Exercise Professional']}
      />
      <main className="max-w-3xl mx-auto px-5 py-14 sm:py-20">
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-teal-700">
            For CIMSPA fitness &amp; active-health professionals
          </p>
          <h1 className="mt-3 text-3xl sm:text-[2.6rem] font-extrabold tracking-tight leading-[1.1]">
            Would you recognise a concussion on your gym floor — and know exactly
            what to do next?
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-slate-600">
            <strong className="text-slate-900">Concussion Care Has Changed</strong>{' '}
            is a free, ~1-hour interactive awareness course built for the front line
            of active health: recognise the signs, know the red flags, and refer
            with confidence.
          </p>
          <Link
            href="/concussion-update"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white font-bold px-6 py-3.5 text-sm shadow-md hover:bg-slate-800 transition"
          >
            Start the free course
          </Link>
        </section>

        {/* ── Why it matters ───────────────────────────────────────────────── */}
        <section className="mt-14 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-7">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-slate-500">
            Why it matters
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-700">
            Fitness and active-health professionals are often the first to see a
            head knock — during training, in a class, on the floor. The guidance has
            moved on from &ldquo;rest in a dark room&rdquo;: concussion is now an{' '}
            <strong>exercise-prescription condition</strong>, but the first job on
            the floor is unchanged — <strong>recognise and refer safely</strong>.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-700">
            This course gives you a clear recognise-&amp;-refer workflow and the
            plain-English boundaries of your role — no clinical scope creep, just
            the confident first response.
          </p>
        </section>

        {/* ── The free course (the endorsed product) ───────────────────────── */}
        <section className="mt-14 rounded-2xl border-2 border-teal-600 p-6 sm:p-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal-700">
            The course · Free
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight">Concussion Care Has Changed</h2>
          <p className="mt-2 text-[14px] text-slate-500">
            Interactive · ~1 hour · Certificate of Completion · awareness only (0 CPD).
          </p>
          <ul className="mt-5 space-y-2 text-[14px] text-slate-700">
            {[
              'Recognise the signs of concussion on the floor',
              'Know the red flags that need urgent escalation',
              'Refer safely — and know exactly where your role stops',
              'Certificate of Completion for your records',
            ].map((f) => (
              <li key={f} className="flex gap-2.5">
                <span className="text-teal-600 font-bold flex-none">·</span>
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/concussion-update"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-teal-600 text-white font-bold px-6 py-3.5 text-sm shadow-sm hover:bg-teal-700 transition"
          >
            Open the free course →
          </Link>
        </section>

        {/* ── Secondary upsell: CRM ────────────────────────────────────────── */}
        <section className="mt-14 rounded-2xl border border-slate-200 p-6 sm:p-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Going further
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight">
            Work in rehab or exercise physiology? Go deeper.
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-slate-600">
            <strong className="text-slate-900">Concussion Rehab Mastery</strong> is
            our structured rehab-exercise course for exercise physiologists and
            rehab clinicians — eight online modules, 8 hours of learning, 80% pass
            mark, {CRM_REFERENCE_COUNT} references, and the live clinical platform (SST Trainer +
            Baseline tools).
          </p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold tracking-tight">{CRM_PRICE.display}</span>
            <span className="text-[13px] text-slate-500 font-semibold">{CRM_PRICE.code}</span>
            <span className="text-[12px] text-slate-400">· course + first year on the platform</span>
          </div>
          <p className="mt-3 text-[12.5px] leading-relaxed text-slate-500">
            The clinical pathway you refer into runs on a published, standardised protocol —{' '}
            <a
              href={PROTOCOL_DOI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-slate-600 underline decoration-slate-300 underline-offset-2 hover:decoration-teal-500"
            >
              {PROTOCOL_DOI_LABEL}
            </a>{' '}
            — delivered by the SST Trainer.
          </p>
          <p className="mt-4 text-[13px] font-semibold">
            <Link href="/cep-uk" className="text-teal-700 hover:underline">
              See Concussion Rehab Mastery for UK exercise professionals →
            </Link>
          </p>
        </section>

        {/* ── Honesty gate ─────────────────────────────────────────────────── */}
        <section className="mt-10 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-[13.5px] text-amber-900 leading-relaxed">
            <strong>Endorsement status:</strong> Concussion Education Australia is
            pursuing CIMSPA endorsement of the free awareness course. The awareness
            course carries a Certificate of Completion and awards no CPD points.{' '}
            {CONFIG.FEATURES.ESSA_ACCREDITED
              ? 'Concussion Rehab Mastery is accredited by Exercise & Sports Science Australia (ESSA), following independent review by two ESSA-appointed reviewers.'
              : 'Concussion Rehab Mastery has been independently reviewed by two reviewers appointed by Exercise & Sports Science Australia (ESSA); that endorsement is pending.'}{' '}
            We don&rsquo;t claim accreditation we don&rsquo;t hold — this page updates
            the day each is confirmed.
          </p>
        </section>

        <p className="mt-14 text-[12px] text-slate-400">
          Provider: Concussion Education Australia (CEA Pty Ltd), ABN 74 688 155 508. Author: Zac Lewis, Osteopath, AHPRA OST0001852866 ·{' '}
          <a href="mailto:zac@concussion-education-australia.com" className="underline hover:text-slate-600">
            zac@concussion-education-australia.com
          </a>
        </p>
      </main>
    </div>
  )
}
