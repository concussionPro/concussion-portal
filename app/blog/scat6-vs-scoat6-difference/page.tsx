import { Metadata } from 'next'
import { createFAQSchema, createBlogPostSchema } from '@/lib/schema-markup'
import { ArrowRight, AlertTriangle, CheckCircle, X } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'SCAT6 vs SCOAT6: Which Tool to Use When? | Complete Guide 2026',
  description: 'Understand the critical differences between SCAT6 and SCOAT6. Learn when to use each tool to avoid below standard of care. Updated for Berlin 2025 Consensus and AHPRA guidelines.',
  keywords: 'SCAT6 vs SCOAT6, difference between SCAT6 SCOAT6, when to use SCAT6, when to use SCOAT6, concussion assessment tools',
}

const faqs = [
  {
    question: 'What is the main difference between SCAT6 and SCOAT6?',
    answer: 'SCAT6 is for sideline/acute assessment within 0-72 hours post-injury (10-15 minutes), designed for immediate remove-from-play decisions. SCOAT6 is for clinic office assessment from Day 3-30 post-injury (20-30 minutes), designed for structured follow-up visits with full VOMS testing and return-to-play planning. Using the wrong tool at the wrong time violates the Berlin 2025 Consensus and Australian sporting code requirements.',
  },
  {
    question: 'Can I use SCAT6 for office follow-up visits?',
    answer: 'No. SCAT6 should only be used within 0-72 hours post-injury for acute/sideline assessment. For office-based follow-up visits after Day 3, you must use SCOAT6. Using SCAT6 for late follow-up assessments is below standard of care under AHPRA guidelines and misses critical components like full VOMS testing and structured return-to-play protocols required for clinic settings.',
  },
  {
    question: 'Which tool includes VOMS testing?',
    answer: 'SCOAT6 includes full VOMS (Vestibular/Ocular Motor Screening) testing. SCAT6 does not include VOMS as it is designed for rapid sideline assessment. VOMS testing requires 5-10 minutes in a controlled clinic environment and assesses smooth pursuits, saccades, convergence, vestibulo-ocular reflex, and visual motion sensitivity. This is essential for detecting vestibular and oculomotor dysfunction missed by SCAT6.',
  },
]

export default function SCAT6vsSCOAT6Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(createFAQSchema(faqs))
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(createBlogPostSchema({
            title: 'SCAT6 vs SCOAT6: Which Tool to Use When?',
            description: 'Complete guide to understanding the critical differences between SCAT6 and SCOAT6 concussion assessment tools',
            datePublished: '2026-01-31',
            dateModified: '2026-01-31',
            author: 'Dr. Zac Lewis',
          }))
        }}
      />

      <div className="min-h-screen bg-slate-50">
        <div className="bg-gradient-to-br from-red-600 to-orange-600 text-white py-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-4">
              ⚠️ Critical for AHPRA Compliance
            </div>
            <h1 className="text-5xl font-bold mb-4">
              SCAT6 vs SCOAT6: Which Tool to Use When?
            </h1>
            <p className="text-xl text-red-100 mb-6">
              40% of Australian GPs use the wrong tool at the wrong time. Here's how to avoid below standard of care.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold text-red-900 mb-2">
                  Why This Matters
                </h3>
                <p className="text-slate-700">
                  Using SCAT6 for Day 7+ office visits (when you should use SCOAT6) is <strong>below standard of care</strong> under AHPRA guidelines and the Berlin 2025 Consensus. It misses critical vestibular testing and structured return-to-play protocols required for clinic settings. This creates medicolegal risk and fails the patient.
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
              <h3 className="text-2xl font-bold text-blue-900 mb-4">SCAT6 - Sideline Tool</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <strong>When:</strong> 0-72 hours post-injury (ideally &lt;30 min after injury)
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <strong>Where:</strong> Sports field, change room, ED, acute setting
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <strong>Time:</strong> 10-15 minutes
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <strong>Purpose:</strong> Immediate remove-from-play decision
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <strong>Key tests:</strong> Red flags, Maddocks, symptom scale, SAC, mBESS
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <X className="w-5 h-5 text-slate-400 flex-shrink-0 mt-1" />
                  <div className="text-slate-600">
                    <strong>NOT included:</strong> VOMS, structured RTP protocols
                  </div>
                </div>
              </div>
              <Link
                href="/scat-forms/scat6"
                className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Access SCAT6 Form →
              </Link>
            </div>

            <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-6">
              <h3 className="text-2xl font-bold text-purple-900 mb-4">SCOAT6 - Clinic Tool</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                  <div>
                    <strong>When:</strong> Day 3-30 post-injury (structured follow-up)
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                  <div>
                    <strong>Where:</strong> Clinic, GP office, concussion specialist
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                  <div>
                    <strong>Time:</strong> 20-30 minutes
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                  <div>
                    <strong>Purpose:</strong> Diagnosis confirmation, RTP/RTL planning
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                  <div>
                    <strong>Key tests:</strong> Serial symptoms, <strong>full VOMS</strong>, neuro exam, RTP protocols
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                  <div>
                    <strong>Includes:</strong> Vestibular testing, structured return-to-play/learn frameworks
                  </div>
                </div>
              </div>
              <Link
                href="/scat-forms/scoat6"
                className="mt-4 inline-block bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                Access SCOAT6 Form →
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              The Golden Rule
            </h2>
            <div className="text-lg text-slate-700 space-y-4">
              <p>
                <strong>If the patient is on the sports field or within 72 hours of injury → use SCAT6.</strong>
              </p>
              <p>
                <strong>If the patient is in your clinic on Day 3 or later → use SCOAT6.</strong>
              </p>
              <p className="text-red-600 font-semibold">
                Never use SCAT6 for office-based follow-up visits. This misses critical vestibular testing and return-to-play protocols required by the Berlin Consensus.
              </p>
            </div>
          </div>

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

          <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-300 rounded-xl p-8">
            <h3 className="text-2xl font-bold text-green-900 mb-4">
              🎓 Free Training: Master Both Tools in 2 Hours
            </h3>
            <p className="text-lg text-slate-700 mb-6">
              Get step-by-step training on when to use which tool, how to administer every section correctly, and medicolegal documentation requirements. <strong>2 AHPRA-aligned CPD hours + certificate.</strong>
            </p>
            <Link
              href="/scat-mastery"
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition-colors inline-block"
            >
              Start Free Training →
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
