import type { Metadata } from 'next'
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

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
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

      {/* Crawlable intro */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-3">
          Child SCAT6 Online Form — Fillable Child SCAT6 (Ages 8-12)
        </h2>
        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
          <p>
            This is a free, web-based fillable version of the Child SCAT6 (Child Sport Concussion
            Assessment Tool, 6th Edition) from the Amsterdam 2022 International Consensus on
            Concussion in Sport, published in the British Journal of Sports Medicine in 2023. It
            includes both the child self-report and parent/guardian symptom scales, calculates
            scores automatically, and exports the completed assessment as a PDF for the medical
            record.
          </p>
          <p>
            The Child SCAT6 is designed for the acute assessment of children aged 8–12. Athletes
            aged 13 and over should be assessed with the standard SCAT6, and the SCOAT6 office
            assessment applies from 72 hours post-injury onwards.
          </p>
          <p>
            Drafts save automatically to your browser, so an interrupted assessment can be resumed
            on the same device. This tool is intended for use by trained healthcare professionals
            and does not replace clinical judgement.
          </p>
        </div>
      </section>

      <ChildSCAT6Client />
    </>
  )
}
