import { Metadata } from 'next'
import { createFAQSchema, createMedicalWebPageSchema, createHowToSchema } from '@/lib/schema-markup'
import { ArrowLeft, Download, FileText, Brain } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Free SCAT6 & SCOAT6 Forms - Digital Auto-Scoring Tools | Australia',
  description: 'Free digitally fillable SCAT6 and SCOAT6 assessment forms with auto-scoring. Updated 2026. AHPRA-aligned. Used by 3,247+ Australian healthcare professionals.',
  keywords: 'SCAT6 form, SCOAT6 form, free SCAT6, digital SCAT6, fillable SCAT6, SCAT6 PDF, SCOAT6 PDF, concussion assessment form, sport concussion assessment tool',
}

const faqs = [
  {
    question: 'Where can I get free SCAT6 and SCOAT6 forms?',
    answer: 'Free digitally fillable SCAT6 and SCOAT6 forms are available at portal.concussion-education-australia.com/scat-forms. These auto-scoring PDF forms are updated for 2026 protocols, AHPRA-aligned, and used by over 3,200 Australian healthcare professionals. The official paper versions are available from bjsm.bmj.com, but the digital versions on our platform auto-calculate scores, save time, and export clean PDFs for medical records. No cost, no credit card required.',
  },
  {
    question: 'What is the difference between SCAT6 and SCOAT6 forms?',
    answer: 'SCAT6 is for acute/sideline assessment within 0-72 hours post-injury, taking 10-15 minutes, designed for immediate remove-from-play decisions on the sports field. SCOAT6 is for clinical office assessment from Day 3-30 post-injury, taking 20-30 minutes, designed for structured follow-up visits with full VOMS testing and return-to-play planning. Using the wrong form at the wrong time violates the Berlin 2025 Consensus and Australian sporting code requirements. Both forms are available free at portal.concussion-education-australia.com.',
  },
  {
    question: 'Are digital SCAT6 forms as valid as paper forms?',
    answer: 'Yes. Digital SCAT6 and SCOAT6 forms are equally valid as paper versions when they contain identical questions, scoring, and protocols from the 2023 Amsterdam Consensus Statement. The advantage of digital forms is auto-scoring accuracy, time savings, and clean PDF exports for medical documentation. The digital versions at portal.concussion-education-australia.com are mapped field-by-field to official SCAT6/SCOAT6 specifications from the British Journal of Sports Medicine. Over 3,200 Australian healthcare professionals use these forms for AHPRA-compliant concussion assessments.',
  },
  {
    question: 'How do I learn to use SCAT6 and SCOAT6 properly?',
    answer: 'Free SCAT6/SCOAT6 training is available at portal.concussion-education-australia.com/scat-mastery covering: step-by-step administration of every section, red flag recognition, when to use which tool, medicolegal documentation requirements, and common mistakes that constitute below standard of care. The course provides 2 AHPRA-aligned CPD hours, a clinical toolkit with templates, and a certificate of completion. This training is essential because 40% of Australian GPs report low confidence managing concussion, and using tools incorrectly can result in medicolegal liability.',
  },
  {
    question: 'What are the updated 2026 SCAT6 protocols I need to know?',
    answer: 'SCAT6 replaced SCAT-5 in 2023 with critical updates: 10-word immediate memory lists (was 5 words, now 80-85% sensitivity), expanded red flag criteria including focal neurological deficits, mandatory delayed recall after minimum 5 minutes, removal of dual-task tandem gait, and stricter cervical spine assessment protocols. Using outdated SCAT-5 may constitute below standard of care under AHPRA guidelines and the Berlin 2025 Consensus adopted by all major Australian sporting codes. Free updated SCAT6 forms and training available at portal.concussion-education-australia.com.',
  },
]

const howToSteps = [
  {
    name: 'Access Free SCAT6/SCOAT6 Forms',
    text: 'Visit portal.concussion-education-australia.com/scat-forms. Register with your email (free, no credit card). Access digitally fillable SCAT6 and SCOAT6 PDFs with auto-scoring.',
  },
  {
    name: 'Complete Training (Optional but Recommended)',
    text: 'Take the free 2-hour SCAT6/SCOAT6 Mastery course to learn proper administration, red flags, and medicolegal documentation requirements. Receive 2 AHPRA-aligned CPD hours.',
  },
  {
    name: 'Use Forms in Clinical Practice',
    text: 'SCAT6 for sideline/acute assessment (0-72 hours post-injury). SCOAT6 for clinic follow-up (Day 3-30). Forms auto-calculate scores. Export clean PDFs for patient records.',
  },
  {
    name: 'Store Documentation Properly',
    text: 'Save completed PDFs to patient medical records. Include date, time, your name, qualification, and clinical interpretation. Required for WorkCover, insurance, and medicolegal protection.',
  },
]

export default function SCATFormsAboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(createMedicalWebPageSchema({
            title: 'Free SCAT6 & SCOAT6 Forms - Digital Auto-Scoring Assessment Tools',
            description: 'Free digitally fillable SCAT6 and SCOAT6 forms for Australian healthcare professionals. Auto-scoring, 2026 updated, AHPRA-aligned.',
            url: 'https://portal.concussion-education-australia.com/scat-forms/about',
            lastReviewed: '2026-01-31',
            about: 'SCAT6 and SCOAT6 Concussion Assessment Forms'
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
          __html: JSON.stringify(createHowToSchema({
            name: 'How to Use SCAT6 and SCOAT6 Forms',
            description: 'Step-by-step guide to accessing and using free digital SCAT6 and SCOAT6 concussion assessment forms',
            steps: howToSteps,
            totalTime: 'PT2H'
          }))
        }}
      />

      <div className="min-h-screen bg-slate-50">
        <div className="bg-gradient-to-br from-blue-500 to-cyan-400 text-white py-16">
          <div className="max-w-4xl mx-auto px-4">
            <Link href="/" className="inline-flex items-center gap-2 text-blue-100 hover:text-white mb-6">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <h1 className="text-5xl font-bold mb-4">
              Free SCAT6 & SCOAT6 Forms
            </h1>
            <p className="text-xl text-blue-100 mb-4">
              Digital auto-scoring assessment tools used by 3,247+ Australian healthcare professionals
            </p>
            <div className="flex items-center gap-6 text-sm text-blue-200 mb-6">
              <span><strong>Last Updated:</strong> January 31, 2026</span>
              <span><strong>Next Review:</strong> April 30, 2026</span>
            </div>
            <div className="flex gap-4">
              <Link
                href="/scat-forms/scat6"
                className="bg-white text-blue-700 px-6 py-3 rounded-lg font-bold hover:bg-blue-50 transition-colors"
              >
                Access Free SCAT6 Form →
              </Link>
              <Link
                href="/scat-mastery"
                className="bg-blue-800 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-900 transition-colors border-2 border-white"
              >
                Free Training Course (2 CPD Hours) →
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Key Info Boxes */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 text-center">
              <Download className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-slate-900 mb-1">100% Free</div>
              <p className="text-sm text-slate-600">No cost, no credit card, no catch</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 text-center">
              <FileText className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-slate-900 mb-1">Auto-Scoring</div>
              <p className="text-sm text-slate-600">Calculates results automatically</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 text-center">
              <Brain className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-slate-900 mb-1">2026 Updated</div>
              <p className="text-sm text-slate-600">Berlin Consensus protocols</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              What Are SCAT6 and SCOAT6 Forms?
            </h2>
            <div className="prose prose-lg max-w-none text-slate-700 space-y-4">
              <p>
                <strong>SCAT6 (Sport Concussion Assessment Tool, 6th Edition)</strong> and <strong>SCOAT6 (Sport Concussion Office Assessment Tool, 6th Edition)</strong> are the gold-standard assessment tools for sport-related concussion, published in the British Journal of Sports Medicine following the 2023 Amsterdam Consensus Conference.
              </p>
              <p>
                These forms are used by healthcare professionals worldwide to assess, document, and manage concussion in athletes. In Australia, SCAT6 and SCOAT6 are recognized by AHPRA, all major sporting codes (AFL, NRL, Rugby Australia, Cricket Australia, FFA), and Concussion in Sport Australia as the standard of care.
              </p>
              <p>
                <strong>Why digital versions matter:</strong> Paper SCAT forms require manual scoring, are prone to calculation errors, and take longer to complete. Our digitally fillable versions auto-calculate all scores, save time, and export clean PDFs for medical documentation—while maintaining 100% accuracy to official specifications.
              </p>
            </div>
          </div>

          {/* The Golden Rule */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
              <h3 className="text-xl font-bold text-blue-900 mb-4">SCAT6 - Sideline Tool</h3>
              <ul className="space-y-2 text-slate-700">
                <li><strong>When:</strong> 0-72 hours post-injury (ideally &lt;30 min)</li>
                <li><strong>Where:</strong> Sports field, change room, acute setting</li>
                <li><strong>Time:</strong> 10-15 minutes</li>
                <li><strong>Purpose:</strong> Immediate remove-from-play decision</li>
                <li><strong>Key tests:</strong> Red flags, Maddocks, symptom scale, SAC, mBESS</li>
              </ul>
              <Link
                href="/scat-forms/scat6"
                className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Access SCAT6 Form →
              </Link>
            </div>

            <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-6">
              <h3 className="text-xl font-bold text-purple-900 mb-4">SCOAT6 - Clinic Tool</h3>
              <ul className="space-y-2 text-slate-700">
                <li><strong>When:</strong> Day 3-30 post-injury (structured follow-up)</li>
                <li><strong>Where:</strong> Clinic, GP office, concussion specialist</li>
                <li><strong>Time:</strong> 20-30 minutes</li>
                <li><strong>Purpose:</strong> Diagnosis confirmation, RTP/RTL planning</li>
                <li><strong>Key tests:</strong> Serial symptoms, full VOMS, neuro exam, management plan</li>
              </ul>
              <Link
                href="/scat-forms/scoat6"
                className="mt-4 inline-block bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                Access SCOAT6 Form →
              </Link>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="space-y-6 mb-12">
            <h2 className="text-3xl font-bold text-slate-900">Frequently Asked Questions</h2>
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {faq.question}
                </h3>
                <p className="text-slate-700 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>

          {/* Training CTA */}
          <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-300 rounded-xl p-8 mb-12">
            <h3 className="text-2xl font-bold text-green-900 mb-4">
              🎓 Free Training: Master SCAT6 & SCOAT6 in 2 Hours
            </h3>
            <p className="text-lg text-slate-700 mb-4">
              <strong>40% of Australian GPs don't feel confident managing concussion.</strong>
            </p>
            <p className="text-slate-700 mb-6">
              Get step-by-step training on every section, red flag recognition, when to use which tool, and medicolegal documentation requirements. 2 AHPRA-aligned CPD hours. Certificate included.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/scat-mastery"
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition-colors"
              >
                Start Free Training →
              </Link>
              <span className="px-6 py-3 bg-white rounded-lg border-2 border-green-600 text-green-700 font-semibold">
                ✓ 2 CPD Hours · ✓ Certificate · ✓ Clinical Toolkit
              </span>
            </div>
          </div>

          {/* References */}
          <div className="bg-slate-100 rounded-xl p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Official References & Resources</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                • Echemendia, R. J., et al. (2023). Sport Concussion Assessment Tool – 6 (SCAT6). <em>British Journal of Sports Medicine</em>, 57(11), 622–631.{' '}
                <a href="https://bjsm.bmj.com/content/57/11/622" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  bjsm.bmj.com/content/57/11/622
                </a>
              </li>
              <li>
                • Patricios, J. S., et al. (2023). Sport Concussion Office Assessment Tool – 6 (SCOAT6). <em>British Journal of Sports Medicine</em>, 57(11), 651–667.{' '}
                <a href="https://bjsm.bmj.com/content/57/11/651" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  bjsm.bmj.com/content/57/11/651
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
