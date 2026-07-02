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

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
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

      {/* Crawlable intro */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-3">
          SCOAT6 Online Form — Fillable SCOAT6 Office Assessment Tool
        </h2>
        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
          <p>
            This is a free, web-based fillable version of the SCOAT6 (Sport Concussion Office
            Assessment Tool, 6th Edition), introduced through the Amsterdam 2022 International
            Consensus on Concussion in Sport and published in the British Journal of Sports
            Medicine in 2023. Symptom, cognitive and examination scores calculate automatically as
            you work through the form, and the completed assessment can be exported as a PDF for
            the medical record.
          </p>
          <p>
            The SCOAT6 is the office and clinic assessment for the sub-acute phase — designed for
            use from 72 hours post-injury onwards, including repeat follow-up visits. For acute
            assessment in the first days after injury, the SCAT6 is the appropriate tool.
          </p>
          <p>
            Drafts save automatically to your browser, so a long office assessment can be resumed
            on the same device. This tool is intended for use by trained healthcare professionals
            and does not replace clinical judgement.
          </p>
        </div>
      </section>

      <SCOAT6Client />
    </>
  )
}
