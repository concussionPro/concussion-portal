import type { Metadata } from 'next'
import SCAT6Client from './Client'

const PAGE_URL = 'https://portal.concussion-education-australia.com/scat-forms/scat6'

export const metadata: Metadata = {
  title: 'SCAT6 Online Form — Free Fillable SCAT6 Calculator',
  description:
    'Free fillable SCAT6 online form with automatic score calculation and PDF export. Digital Sport Concussion Assessment Tool 6 (Amsterdam 2022 consensus, BJSM 2023) for acute assessment by healthcare professionals.',
  alternates: {
    canonical: PAGE_URL,
  },
  openGraph: {
    title: 'SCAT6 Online Form — Free Fillable SCAT6 Calculator',
    description:
      'Complete the SCAT6 concussion assessment online. Automatic scoring, PDF export, drafts save in your browser. For trained healthcare professionals.',
    url: PAGE_URL,
    type: 'website',
    images: ['/og-image.jpg'],
  },
}

// Visible Q&A content — rendered below the form AND mirrored 1:1 in the
// FAQPage JSON-LD (Google requires exact parity between schema and page).
const faqs = [
  {
    question: 'When should clinicians use the SCAT6 vs the SCOAT6?',
    answer:
      'Use the SCAT6 for acute assessment — on the sideline or in the clinic within the first 72 hours of injury, and up to 7 days. From 72 hours onwards, use the SCOAT6 (Sport Concussion Office Assessment Tool), which is built for structured clinic follow-up and repeat visits through the sub-acute period, typically Day 3 to Day 30.',
  },
  {
    question: 'Who can administer the SCAT6?',
    answer:
      'The SCAT6 is designed for use by licensed healthcare professionals — doctors, physiotherapists, osteopaths and other clinicians trained in concussion assessment. It supports, but does not replace, clinical judgement. Concussion Education Australia offers a free ~1-hour online course covering SCAT6 and SCOAT6 administration, with a certificate on completion.',
  },
  {
    question: 'What age group is the SCAT6 intended for?',
    answer:
      'The SCAT6 is intended for athletes aged 13 and over. Children aged 8–12 should be assessed with the Child SCAT6, which pairs a child self-report with a parent/guardian symptom report and adjusts the cognitive and balance components for age.',
  },
  {
    question: 'Which SCAT6 sections does this digital form include?',
    answer:
      'This form implements the SCAT6 off-field assessment — Steps 1 to 6: athlete background, the 22-item symptom evaluation, cognitive screening (orientation, immediate memory, concentration), the balance examination (mBESS, timed tandem gait and the optional dual-task gait), delayed recall, and the decision and healthcare-professional attestation. It does NOT include the immediate on-field screen: there are no fields for red flags, observable signs, the Maddocks questions, the Glasgow Coma Scale or the cervical spine assessment, and those sections are left blank in the exported PDF. Perform the on-field steps at the point of injury using the printable official SCAT6 PDF or a sideline card, then record the outcome in this form’s clinical notes.',
  },
  {
    question: 'Is this digital SCAT6 form free to use?',
    answer:
      'Yes. This fillable SCAT6 is free for clinical use — no account or password is needed to open, complete and auto-score it, and drafts save in your browser. Exporting the finished assessment as a PDF for the medical record asks for your email address once. A free fillable PDF version is also available to download and print with no email at all.',
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'FAQPage',
      '@id': `${PAGE_URL}#faq`,
      inLanguage: 'en-AU',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    },
    {
      '@type': 'WebApplication',
      '@id': `${PAGE_URL}#webapp`,
      name: 'SCAT6 Online Form',
      url: PAGE_URL,
      applicationCategory: 'HealthApplication',
      operatingSystem: 'Any (web browser)',
      browserRequirements: 'Requires JavaScript',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'AUD',
      },
      description:
        'Free web-based fillable SCAT6 (Sport Concussion Assessment Tool 6) with automatic score calculation and PDF export, for use by trained healthcare professionals.',
      provider: {
        '@type': 'Organization',
        name: 'Concussion Education Australia',
        url: 'https://portal.concussion-education-australia.com',
      },
    },
    {
      '@type': 'MedicalWebPage',
      '@id': `${PAGE_URL}#webpage`,
      name: 'SCAT6 Online Form — Free Fillable SCAT6 Calculator',
      url: PAGE_URL,
      description:
        'Fillable digital version of the SCAT6 concussion assessment (Amsterdam 2022 consensus, BJSM 2023) with automatic scoring and PDF export.',
      about: {
        '@type': 'MedicalCondition',
        name: 'Concussion',
        alternateName: 'Sport-related concussion',
      },
      audience: {
        '@type': 'MedicalAudience',
        audienceType: 'Healthcare professionals',
      },
      mainEntity: { '@id': `${PAGE_URL}#webapp` },
    },
  ],
}

export default function SCAT6Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Crawlable definition block */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-3">What is the SCAT6?</h2>
        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
          <p>
            The SCAT6 (Sport Concussion Assessment Tool, 6th Edition) is the standardised tool
            for the acute assessment of sport-related concussion in athletes aged 13 and over. It
            was developed through the 2022 Amsterdam International Consensus on Concussion in
            Sport and published in the British Journal of Sports Medicine in 2023, replacing the
            SCAT5. The SCAT6 combines immediate on-field screening — red flags, observable signs
            and the Maddocks questions — with an off-field assessment covering symptom
            evaluation, cognitive screening, neurological examination and balance testing.
          </p>
          <p>
            It is designed for use by licensed healthcare professionals and performs best within
            the first 72 hours after injury, remaining useful up to 7 days post-injury. Beyond
            that window, the SCOAT6 office assessment is the more appropriate tool, and children
            aged 8–12 should be assessed with the Child SCAT6.
          </p>
          <p>
            <strong>What this digital form covers.</strong> The fillable form on this page
            implements the SCAT6 <em>off-field</em> assessment — Steps 1 to 6: athlete background,
            the 22-item symptom evaluation, cognitive screening (orientation, immediate memory,
            concentration), the balance examination (mBESS, timed tandem gait and the optional dual-task
            gait), delayed recall, and the decision and healthcare-professional attestation. It
            calculates scores automatically and exports the completed assessment as a PDF for the
            medical record.
          </p>
          <p>
            <strong>What it does not cover.</strong> The immediate on-field screen is{' '}
            <strong>not implemented here</strong>: there are no fields for red flags, observable
            signs, the Maddocks questions, the Glasgow Coma Scale or the cervical spine
            assessment, and those sections are left blank in the exported PDF. Those steps are
            time-critical and performed at the point of injury — use the printable{' '}
            <a href="/docs/SCAT6_Fillable.pdf" className="text-blue-600 hover:underline">
              official SCAT6 PDF
            </a>{' '}
            (free — sign-in required){' '}
            (or the sideline card) for them, and record the outcome in the clinical notes field of
            this form.
          </p>
        </div>
        <p className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
          Reviewed by Zac Lewis — Osteopath (AHPRA), B.Clin.Sci, M.Ost.Med · Updated July 2026
        </p>
      </section>

      <SCAT6Client />

      {/* Crawlable Q&A — mirrored exactly in the FAQPage JSON-LD above */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-6">
        <div className="space-y-6">
          {faqs.map((f) => (
            <div key={f.question}>
              <h2 className="text-lg font-bold text-slate-900 mb-2">{f.question}</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{f.answer}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500">
          Drafts save automatically to your browser, so an interrupted assessment can be resumed
          on the same device. This tool supports, and does not replace, clinical judgement.
        </p>
      </section>
    </>
  )
}
