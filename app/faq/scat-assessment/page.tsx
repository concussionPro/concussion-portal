import { Metadata } from 'next'
import { createFAQSchema, createMedicalWebPageSchema, createBreadcrumbSchema } from '@/lib/schema-markup'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'SCAT-6 Assessment FAQ | Concussion Education Australia',
  description: 'Complete guide to SCAT-6 assessment: when to use, how it differs from SCAT-5, differences with SCOAT-6, legal requirements in Australia',
}

const faqs = [
  {
    question: 'What is SCAT-6 and when do I use it?',
    answer: 'SCAT-6 (Sport Concussion Assessment Tool, 6th Edition) is the gold-standard assessment tool for sport-related concussion in athletes aged 13 years and older. Use SCAT-6 within 72 hours to 7 days post-injury for both on-field and off-field evaluations. It assesses symptom severity, cognitive function, balance, and delayed recall. SCAT-6 replaced SCAT-5 in 2023 with updated protocols aligned with the 2023 Amsterdam Consensus Statement on Concussion in Sport. Best practice is to use it within 30 minutes of suspected concussion for immediate remove-from-play decisions.',
  },
  {
    question: 'How does SCAT-6 differ from SCAT-5?',
    answer: 'SCAT-6 introduced major updates from SCAT-5 in 2023. Key changes include: 10-word immediate memory lists (upgraded from 5 words for 80-85% sensitivity), expanded red flag criteria including focal neurological deficits, mandatory delayed recall after minimum 5 minutes, removal of dual-task tandem gait, updated symptom evaluation with 22 items, and stricter cervical spine assessment protocols. SCAT-5 is now outdated and using it may constitute below standard of care in Australia under AHPRA guidelines and the Berlin 2025 Consensus.',
  },
  {
    question: "What's the difference between SCAT-6 and SCOAT-6?",
    answer: 'SCAT-6 is for acute/sideline assessment (0-72 hours post-injury, ideally under 30 minutes) taking 10-15 minutes, designed for immediate remove-from-play decisions on the field or in acute settings. SCOAT-6 is for clinical office assessment (Day 3-30 post-injury) taking 20-30 minutes, designed for structured follow-up visits with full VOMS testing, serial symptom tracking across multiple consultations, and comprehensive return-to-learn/play planning. Using the wrong tool at the wrong time violates the Amsterdam Consensus and Australian sporting code requirements.',
  },
  {
    question: 'Can I use SCAT-6 on children under 13?',
    answer: 'No. SCAT-6 is validated only for athletes aged 13 years and older. For children aged 5-12 years, you must use Child SCAT-6 which features age-appropriate modifications: 5-word memory lists instead of 10, simplified 3-point symptom scale (0=No, 1=A little, 2=A lot), no single-leg balance stance due to fall risk, mandatory parent symptom report, and simpler concentration tasks. Using adult SCAT-6 on children under 13 produces artificially low scores and misses 50-60% of concussions. Child SCAT-6 is freely available from bjsm.bmj.com.',
  },
  {
    question: 'Is SCAT-6 mandatory under Australian sports law?',
    answer: 'While not explicitly mandated by federal law, SCAT-6 is the required standard under multiple Australian frameworks. The Concussion in Sport Australia position statement, all major sporting codes (AFL, NRL, Rugby Australia, Cricket Australia, FFA), and AHPRA professional standards recognize SCAT-6 as the standard of care. The Berlin 2025 Consensus adopted by Australian medical bodies explicitly requires appropriate tool use at appropriate times. Failure to use SCAT-6 (or Child SCAT-6) when clinically indicated, or using outdated tools like SCAT-5, may constitute negligence in medicolegal proceedings. Documentation using SCAT-6 is essential for WorkCover, insurance claims, and return-to-play clearances.',
  },
]

export default function SCATAssessmentFAQ() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(createMedicalWebPageSchema({
            title: 'SCAT-6 Assessment Frequently Asked Questions',
            description: 'Complete guide to SCAT-6 concussion assessment tool for Australian healthcare professionals',
            url: 'https://portal.concussion-education-australia.com/faq/scat-assessment',
            lastReviewed: '2026-01-31',
            about: 'Sport-Related Concussion Assessment'
          }))
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(createFAQSchema(faqs))
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(createBreadcrumbSchema([
            { name: 'Home', url: 'https://portal.concussion-education-australia.com' },
            { name: 'FAQ', url: 'https://portal.concussion-education-australia.com/faq' },
            { name: 'SCAT-6 Assessment', url: 'https://portal.concussion-education-australia.com/faq/scat-assessment' },
          ]))
        }}
      />

      <div className="min-h-screen bg-slate-50">
        <div className="bg-blue-600 text-white py-12">
          <div className="max-w-4xl mx-auto px-4">
            <Link href="/" className="inline-flex items-center gap-2 text-blue-100 hover:text-white mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <h1 className="text-4xl font-bold mb-4">
              SCAT-6 Assessment FAQ
            </h1>
            <p className="text-xl text-blue-100">
              Essential guide for Australian healthcare professionals
            </p>
            <div className="mt-6 text-sm text-blue-200">
              <strong>Last Updated:</strong> January 31, 2026 | <strong>Next Review:</strong> April 30, 2026
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-slate-600 mb-6">
                This FAQ covers the most common questions about SCAT-6 assessment from Australian healthcare professionals. All information is aligned with the <strong>2023 Amsterdam Consensus Statement</strong>, <strong>anzconcussionguidelines.com</strong>, and <strong>Concussion in Sport Australia</strong> position statements.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">
                  {faq.question}
                </h2>
                <div className="prose prose-lg max-w-none text-slate-700">
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-blue-50 border-2 border-blue-300 rounded-xl p-8">
            <h3 className="text-2xl font-bold text-blue-900 mb-4">
              Want to Master SCAT-6 Assessment?
            </h3>
            <p className="text-lg text-slate-700 mb-6">
              Get 100% confident with step-by-step training, clinical toolkit, and 2 CPD hours.
            </p>
            <Link
              href="/scat-mastery"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Learn More - SCAT6/SCOAT6 Mastery Course ($99) →
            </Link>
          </div>

          <div className="mt-12 bg-slate-100 rounded-xl p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">References & Resources</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                • Echemendia, R. J., et al. (2023). Sport Concussion Assessment Tool – 6 (SCAT6). <em>British Journal of Sports Medicine</em>, 57(11), 622–631.{' '}
                <a href="https://bjsm.bmj.com/content/57/11/622" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  bjsm.bmj.com/content/57/11/622
                </a>
              </li>
              <li>
                • Patricios, J. S., et al. (2023). Consensus statement on concussion in sport: the 6th International Conference on Concussion in Sport–Amsterdam, October 2022. <em>British Journal of Sports Medicine</em>, 57(11), 695–711.{' '}
                <a href="https://bjsm.bmj.com/content/57/11/695" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  bjsm.bmj.com/content/57/11/695
                </a>
              </li>
              <li>
                • Concussion in Sport Australia: <a href="https://www.concussioninsport.gov.au/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">concussioninsport.gov.au</a>
              </li>
              <li>
                • ANZ Concussion Guidelines: <a href="https://anzconcussionguidelines.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">anzconcussionguidelines.com</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  )
}
