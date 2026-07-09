import type { Metadata } from 'next'
import SCOAT6Client from './Client'

const PAGE_URL = 'https://portal.concussion-education-australia.com/scat-forms/scoat6'

export const metadata: Metadata = {
  title: 'SCOAT6 Online Form — Fillable SCOAT6 Office Assessment Tool',
  description:
    'Free fillable SCOAT6 online form with automatic score calculation and PDF export. Digital Sport Concussion Office Assessment Tool 6 (Amsterdam 2022 consensus, BJSM 2023) for clinic assessment from 72 hours post-injury.',
  alternates: {
    canonical: PAGE_URL,
  },
  openGraph: {
    title: 'SCOAT6 Online Form — Fillable SCOAT6 Office Assessment Tool',
    description:
      'Complete the SCOAT6 office concussion assessment online. Automatic scoring, PDF export, drafts save in your browser. For trained healthcare professionals.',
    url: PAGE_URL,
    type: 'website',
    images: ['/og-image.jpg'],
  },
}

// Visible Q&A content — rendered below the form AND mirrored 1:1 in the
// FAQPage JSON-LD (Google requires exact parity between schema and page).
const faqs = [
  {
    question: 'When should the SCOAT6 be used instead of the SCAT6?',
    answer:
      'Use the SCOAT6 from 72 hours post-injury onwards — it is the structured office and clinic assessment for the sub-acute period, typically Day 3 to Day 30, and is designed for repeat follow-up visits. The SCAT6 is the acute tool for the first 72 hours (and up to 7 days) after injury.',
  },
  {
    question: 'What does the SCOAT6 assess?',
    answer:
      'The SCOAT6 is a multi-domain office assessment covering serial symptom tracking, cognitive screening, cervical spine assessment, neurological examination, balance testing, full vestibular-ocular motor screening (VOMS), orthostatic vital signs and structured return-to-play planning. A complete assessment typically takes 20–30 minutes.',
  },
  {
    question: 'Who can administer the SCOAT6?',
    answer:
      'The SCOAT6 is intended for licensed healthcare professionals managing concussion follow-up — GPs, physiotherapists, osteopaths and other clinicians trained in concussion assessment. It supports, but does not replace, clinical judgement. Concussion Education Australia offers a free ~1-hour online course covering SCAT6 and SCOAT6 administration, with a certificate on completion.',
  },
  {
    question: 'Is this digital SCOAT6 form free to use?',
    answer:
      'Yes. This fillable SCOAT6 is free for clinical use — scores calculate automatically as you work through the form, drafts save in your browser, and the completed assessment exports as a PDF for the medical record. A free fillable PDF version is also available to download and print.',
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
      name: 'SCOAT6 Online Form',
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
        'Free web-based fillable SCOAT6 (Sport Concussion Office Assessment Tool 6) with automatic score calculation and PDF export, for use by trained healthcare professionals.',
      provider: {
        '@type': 'Organization',
        name: 'Concussion Education Australia',
        url: 'https://portal.concussion-education-australia.com',
      },
    },
    {
      '@type': 'MedicalWebPage',
      '@id': `${PAGE_URL}#webpage`,
      name: 'SCOAT6 Online Form — Fillable SCOAT6 Office Assessment Tool',
      url: PAGE_URL,
      description:
        'Fillable digital version of the SCOAT6 office concussion assessment (Amsterdam 2022 consensus, BJSM 2023) with automatic scoring and PDF export.',
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

export default function SCOAT6Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Crawlable definition block */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-3">What is the SCOAT6?</h2>
        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
          <p>
            The SCOAT6 (Sport Concussion Office Assessment Tool, 6th Edition) is the standardised
            office and clinic assessment for sport-related concussion in the sub-acute period —
            from 72 hours post-injury onwards, typically Day 3 to Day 30, including repeat
            follow-up visits. It was introduced through the 2022 Amsterdam International Consensus
            on Concussion in Sport and published in the British Journal of Sports Medicine in
            2023, giving clinicians a structured multi-domain tool for concussion follow-up where
            the acute SCAT6 no longer applies.
          </p>
          <p>
            The SCOAT6 covers serial symptom tracking, cognitive screening, cervical spine
            assessment, neurological examination, balance testing, full vestibular-ocular motor
            screening (VOMS), orthostatic vital signs and structured return-to-play planning. It
            is intended for use by licensed healthcare professionals; for acute assessment in the
            first days after injury, the SCAT6 remains the appropriate tool. This page provides a
            free, fillable digital SCOAT6 that calculates scores automatically and exports the
            completed assessment as a PDF for the medical record.
          </p>
        </div>
        <p className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
          Reviewed by Zac Lewis — Osteopath (AHPRA), B.Clin.Sci, M.Ost.Med · Updated July 2026
        </p>
      </section>

      <SCOAT6Client />

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
          Drafts save automatically to your browser, so a long office assessment can be resumed
          on the same device. This tool supports, and does not replace, clinical judgement.
        </p>
      </section>
    </>
  )
}
