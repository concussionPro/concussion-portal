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

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
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

      {/* Crawlable intro */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-3">
          SCAT6 Online Form — Free Fillable SCAT6 Calculator
        </h2>
        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
          <p>
            This is a free, web-based fillable version of the SCAT6 (Sport Concussion Assessment
            Tool, 6th Edition) — the standardised concussion assessment instrument from the
            Amsterdam 2022 International Consensus on Concussion in Sport, published in the
            British Journal of Sports Medicine in 2023. Symptom, cognitive and balance scores are
            calculated automatically as you complete each section, and the finished assessment can
            be exported as a PDF for the medical record.
          </p>
          <p>
            The SCAT6 is intended for the acute assessment of athletes aged 13 and over — ideally
            within the first 72 hours post-injury and up to 7 days. Beyond that window, the SCOAT6
            office assessment is the more appropriate tool; for children aged 8–12, use the Child
            SCAT6.
          </p>
          <p>
            Drafts save automatically to your browser, so an interrupted assessment can be resumed
            on the same device. This tool is intended for use by trained healthcare professionals
            and does not replace clinical judgement.
          </p>
        </div>
      </section>

      <SCAT6Client />
    </>
  )
}
