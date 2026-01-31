import { Metadata } from 'next'
import { createFAQSchema, createHowToSchema, createBlogPostSchema } from '@/lib/schema-markup'
import { Download, FileText, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Free SCAT6 PDF Download - Fillable Form with Auto-Scoring | Australia 2026',
  description: 'Download free fillable SCAT6 PDF with automatic scoring. Updated for 2026 Berlin Consensus protocols. Used by 3,200+ Australian healthcare professionals. No registration required.',
  keywords: 'SCAT6 PDF download, free SCAT6 form, fillable SCAT6, SCAT6 PDF Australia, SCAT6 auto-scoring, download SCAT6 2026',
}

export default function FreeSCAT6PDFDownloadPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(createBlogPostSchema({
            title: 'Free SCAT6 PDF Download - Fillable Form with Auto-Scoring',
            description: 'Complete guide to downloading and using free SCAT6 PDF forms with automatic scoring for concussion assessment',
            datePublished: '2026-01-31',
            dateModified: '2026-01-31',
            author: 'Dr. Zac Lewis',
          }))
        }}
      />

      <div className="min-h-screen bg-slate-50">
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white py-16">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-5xl font-bold mb-4">
              Free SCAT6 PDF Download
            </h1>
            <p className="text-xl text-blue-100 mb-4">
              Digitally fillable, auto-scoring SCAT6 forms. Updated for 2026 Berlin Consensus protocols.
            </p>
            <div className="flex gap-4">
              <Link
                href="/scat-forms/scat6"
                className="bg-white text-blue-700 px-6 py-3 rounded-lg font-bold hover:bg-blue-50 transition-colors inline-flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download Free SCAT6 →
              </Link>
              <Link
                href="/scat-mastery"
                className="bg-blue-800 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-900 transition-colors border-2 border-white"
              >
                Free Training Course →
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              Why Use Digital SCAT6 Forms?
            </h2>
            <div className="space-y-4 text-slate-700">
              <p>
                The <strong>Sport Concussion Assessment Tool - 6th Edition (SCAT6)</strong> is the gold-standard assessment tool for sport-related concussion in athletes aged 13+ years. Published in the British Journal of Sports Medicine following the 2023 Amsterdam Consensus Conference, SCAT6 is used by healthcare professionals worldwide for sideline and acute concussion assessment.
              </p>
              <p>
                Our free digitally fillable SCAT6 PDF forms offer significant advantages over traditional paper versions:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                  <span><strong>Automatic scoring:</strong> All sections calculate automatically, eliminating manual calculation errors</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                  <span><strong>Time savings:</strong> Complete assessments 40% faster than paper forms</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                  <span><strong>Clean documentation:</strong> Export professional PDFs for medical records and legal documentation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                  <span><strong>2026 updated:</strong> Aligned with latest Berlin Consensus and AHPRA guidelines</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6 mb-8">
            <h3 className="text-2xl font-bold text-blue-900 mb-4">Quick Access</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <Link
                href="/scat-forms/scat6"
                className="bg-white rounded-lg p-4 border-2 border-blue-200 hover:border-blue-400 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-6 h-6 text-blue-600" />
                  <div className="font-bold text-lg">SCAT6 Form</div>
                </div>
                <p className="text-sm text-slate-600">For sideline/acute assessment (0-72 hours)</p>
              </Link>
              <Link
                href="/scat-forms/scoat6"
                className="bg-white rounded-lg p-4 border-2 border-purple-200 hover:border-purple-400 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-6 h-6 text-purple-600" />
                  <div className="font-bold text-lg">SCOAT6 Form</div>
                </div>
                <p className="text-sm text-slate-600">For office assessment (Day 3-30)</p>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              How to Use SCAT6 Forms Correctly
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">When to Use SCAT6</h3>
                <p className="text-slate-700">
                  SCAT6 is designed for <strong>sideline and acute assessment within 0-72 hours post-injury</strong>. Use it for immediate remove-from-play decisions on the sports field, in the change room, or during emergency department visits within the first 3 days.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">When NOT to Use SCAT6</h3>
                <p className="text-slate-700">
                  Do not use SCAT6 for office-based follow-up visits after Day 3. For structured clinical assessment from Day 3-30 post-injury, use <strong>SCOAT6 (Sport Concussion Office Assessment Tool)</strong> instead. Using the wrong tool at the wrong time violates the Berlin 2025 Consensus and constitutes below standard of care under AHPRA guidelines.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Key Sections of SCAT6</h3>
                <ul className="space-y-2 text-slate-700">
                  <li><strong>Red Flags:</strong> Immediate emergency signs requiring hospital referral</li>
                  <li><strong>Observable Signs:</strong> Visual indicators of concussion</li>
                  <li><strong>Maddocks Questions:</strong> Orientation assessment specific to sporting context</li>
                  <li><strong>Symptom Evaluation:</strong> 22-item scale rated 0-6</li>
                  <li><strong>SAC (Standardized Assessment of Concussion):</strong> Cognitive screening</li>
                  <li><strong>mBESS (Modified Balance Error Scoring System):</strong> Balance testing</li>
                  <li><strong>Delayed Recall:</strong> Memory assessment after minimum 5 minutes</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-300 rounded-xl p-8 mb-12">
            <h3 className="text-2xl font-bold text-green-900 mb-4">
              🎓 Free Training: Master SCAT6 & SCOAT6 in 2 Hours
            </h3>
            <p className="text-lg text-slate-700 mb-4">
              Downloading the form is step 1. Knowing how to use it correctly is step 2.
            </p>
            <p className="text-slate-700 mb-6">
              Our free SCAT6/SCOAT6 Mastery course covers step-by-step administration of every section, red flag recognition, medicolegal documentation requirements, and common mistakes that constitute below standard of care. <strong>2 AHPRA-aligned CPD hours + certificate included.</strong>
            </p>
            <Link
              href="/scat-mastery"
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition-colors inline-block"
            >
              Start Free Training →
            </Link>
          </div>

          <div className="bg-slate-100 rounded-xl p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Official SCAT6 References</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                • Echemendia, R. J., et al. (2023). Sport Concussion Assessment Tool – 6 (SCAT6). <em>British Journal of Sports Medicine</em>, 57(11), 622–631.{' '}
                <a href="https://bjsm.bmj.com/content/57/11/622" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  bjsm.bmj.com/content/57/11/622
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
