import type { Metadata } from 'next'
import { PROTOCOL_DOI_LABEL, PROTOCOL_DOI_URL } from '@/lib/protocol-reference'
import ChildSCAT6Client from './Client'

const PAGE_URL = 'https://portal.concussion-education-australia.com/scat-forms/child-scat6'

export const metadata: Metadata = {
  title: 'Child SCAT6 Online Form — Fillable Child SCAT6 (Ages 8-12)',
  description:
    'Free fillable Child SCAT6 online form with automatic score calculation and PDF export. Digital Child Sport Concussion Assessment Tool 6 (Amsterdam 2022 consensus, BJSM 2023) with child and parent symptom reports.',
  alternates: {
    canonical: PAGE_URL,
  },
  openGraph: {
    title: 'Child SCAT6 Online Form — Fillable Child SCAT6 (Ages 8-12)',
    description:
      'Complete the Child SCAT6 concussion assessment online. Automatic scoring, PDF export, drafts save in your browser. For trained healthcare professionals.',
    url: PAGE_URL,
    type: 'website',
    images: ['/og-image.jpg'],
  },
}

// Visible Q&A content — rendered below the form AND mirrored 1:1 in the
// FAQPage JSON-LD (Google requires exact parity between schema and page).
const faqs = [
  {
    question: 'What age group is the Child SCAT6 for?',
    answer:
      'The Child SCAT6 is designed for children aged 8–12. Athletes aged 13 and over should be assessed with the standard SCAT6. For structured clinic follow-up from 72 hours post-injury onwards, the SCOAT6 applies.',
  },
  {
    question: 'How is the Child SCAT6 different from the adult SCAT6?',
    answer:
      'The Child SCAT6 pairs a child self-report symptom scale with a parent/guardian report — younger children can under-report symptoms — and its cognitive and balance components are adjusted for age. Like the SCAT6, it is an acute assessment tool, used ideally within the first 72 hours after injury.',
  },
  {
    question: 'Who can administer the Child SCAT6?',
    answer:
      'The Child SCAT6 is intended for licensed healthcare professionals trained in concussion assessment. It supports, but does not replace, clinical judgement — and any child with red-flag signs needs urgent medical assessment regardless of score.',
  },
  {
    question: 'Is this digital Child SCAT6 form free to use?',
    answer:
      'Yes. This fillable Child SCAT6 is free for clinical use — it includes both the child self-report and parent/guardian symptom scales, calculates scores automatically, saves drafts in your browser, and exports the completed assessment as a PDF for the medical record.',
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
      name: 'Child SCAT6 Online Form',
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
        'Free web-based fillable Child SCAT6 (Child Sport Concussion Assessment Tool 6) with automatic score calculation and PDF export, for use by trained healthcare professionals.',
      provider: {
        '@type': 'Organization',
        name: 'Concussion Education Australia',
        url: 'https://portal.concussion-education-australia.com',
      },
    },
    {
      '@type': 'MedicalWebPage',
      '@id': `${PAGE_URL}#webpage`,
      name: 'Child SCAT6 Online Form — Fillable Child SCAT6 (Ages 8-12)',
      url: PAGE_URL,
      description:
        'Fillable digital version of the Child SCAT6 concussion assessment for children (Amsterdam 2022 consensus, BJSM 2023) with automatic scoring and PDF export.',
      about: {
        '@type': 'MedicalCondition',
        name: 'Concussion',
        alternateName: 'Paediatric sport-related concussion',
      },
      audience: {
        '@type': 'MedicalAudience',
        audienceType: 'Healthcare professionals',
      },
      mainEntity: { '@id': `${PAGE_URL}#webapp` },
    },
  ],
}

export default function ChildSCAT6Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Crawlable definition block */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-3">What is the Child SCAT6?</h2>
        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
          <p>
            The Child SCAT6 (Child Sport Concussion Assessment Tool, 6th Edition) is the
            standardised tool for the acute assessment of suspected sport-related concussion in
            children aged 8–12. It comes from the 2022 Amsterdam International Consensus on
            Concussion in Sport and was published in the British Journal of Sports Medicine in
            2023. Unlike the adult SCAT6, the Child SCAT6 pairs a child self-report symptom scale
            with a parent/guardian report — younger children can under-report symptoms — and its
            cognitive and balance components are adjusted for age.
          </p>
          <p>
            It is intended for use by licensed healthcare professionals, ideally within the first
            72 hours after injury; athletes aged 13 and over should be assessed with the standard
            SCAT6. This page provides a free, fillable digital Child SCAT6 with both child and
            parent symptom reports, automatic score calculation and PDF export for the medical
            record.
          </p>
        </div>
        <p className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
          Reviewed by Zac Lewis — Osteopath (AHPRA), B.Clin.Sci, M.Ost.Med · Updated July 2026{' '}· Rehab method published open-access:{' '}
          <a href={PROTOCOL_DOI_URL} target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-700">{PROTOCOL_DOI_LABEL}</a> (Zenodo, CC BY)
        </p>
      </section>

      <ChildSCAT6Client />

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
