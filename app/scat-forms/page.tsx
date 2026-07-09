import { Metadata } from 'next'
import Link from 'next/link'
import { FileText, Clock, ArrowRight } from 'lucide-react'
import { SiteNav } from '@/components/SiteNav'
import { EmailCaptureInline } from '@/components/EmailCaptureInline'
import { createFAQSchema, createMedicalWebPageSchema } from '@/lib/schema-markup'

const PAGE_URL = 'https://portal.concussion-education-australia.com/scat-forms'

export const metadata: Metadata = {
  title: 'SCAT6 & SCOAT6 Web Forms — Auto-Scoring Digital Assessment Tools',
  description: 'Complete SCAT6, SCOAT6 and Child SCAT6 assessments in your browser with automatic score calculation and PDF export for medical records. Built for Australian clinicians.',
  alternates: {
    canonical: PAGE_URL,
  },
}

// Visible Q&A content — rendered on the page AND mirrored 1:1 in the
// FAQPage JSON-LD (Google requires exact parity between schema and page).
const faqs = [
  {
    question: 'What is the difference between the SCAT6 and the SCOAT6?',
    answer:
      'The SCAT6 is the acute assessment — used on the sideline or in the clinic within the first 72 hours of injury (and up to 7 days), for athletes aged 13 and over. The SCOAT6 is the office assessment for structured follow-up from 72 hours onwards, typically Day 3 to Day 30, adding serial symptom tracking, full VOMS and return-to-play planning.',
  },
  {
    question: 'Who can use these SCAT forms?',
    answer:
      'All three tools are designed for licensed healthcare professionals — doctors, physiotherapists, osteopaths and other clinicians trained in concussion assessment. They support, but do not replace, clinical judgement. Free ~1-hour training on SCAT6 and SCOAT6 administration, with a certificate on completion, is available from Concussion Education Australia.',
  },
  {
    question: 'Are these digital SCAT forms free?',
    answer:
      'Yes. The web-based SCAT6, SCOAT6 and Child SCAT6 forms are free for clinical use — no registration required. Scores calculate automatically, drafts save in your browser, and completed assessments export as PDFs for the medical record. Free fillable PDF versions are also available to download and print.',
  },
]

const medicalWebPageSchema = createMedicalWebPageSchema({
  title: 'SCAT6 & SCOAT6 Web Forms — Auto-Scoring Digital Assessment Tools',
  description:
    'Free digital SCAT6, SCOAT6 and Child SCAT6 assessment forms with automatic score calculation and PDF export, for Australian healthcare professionals.',
  url: PAGE_URL,
  lastReviewed: '2026-07-10',
  reviewedBy: 'Zac Lewis',
})

const faqSchema = createFAQSchema(faqs)

export default function SCATFormsPage() {
  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(medicalWebPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <SiteNav />

      <div className="max-w-3xl mx-auto px-6 pt-[120px] pb-16">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight">
            SCAT6 & SCOAT6 Digital Forms
          </h1>
          <p className="text-muted-foreground">
            Free auto-scoring assessment tools — updated to 2023 Amsterdam Consensus
          </p>
        </div>

        <div className="space-y-4">
          {/* SCAT6 */}
          <Link
            href="/scat-forms/scat6"
            className="glass glass-hover rounded-2xl p-6 flex items-center gap-5 group"
          >
            <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <FileText className="w-7 h-7 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-foreground mb-1 tracking-tight">SCAT6</h2>
              <p className="text-sm text-muted-foreground mb-2">
                Sport Concussion Assessment Tool — for acute/sideline use within 72 hours of injury
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 10–15 min</span>
                <span>Auto-scoring</span>
                <span>PDF export</span>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors flex-shrink-0" />
          </Link>

          {/* SCOAT6 */}
          <Link
            href="/scat-forms/scoat6"
            className="glass glass-hover rounded-2xl p-6 flex items-center gap-5 group"
          >
            <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
              <FileText className="w-7 h-7 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-foreground mb-1 tracking-tight">SCOAT6</h2>
              <p className="text-sm text-muted-foreground mb-2">
                Sport Concussion Office Assessment Tool — for structured clinic follow-up from Day 3–30
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 20–30 min</span>
                <span>Full VOMS</span>
                <span>PDF export</span>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors flex-shrink-0" />
          </Link>
          {/* Child SCAT6 */}
          <Link
            href="/scat-forms/child-scat6"
            className="glass glass-hover rounded-2xl p-6 flex items-center gap-5 group"
          >
            <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
              <FileText className="w-7 h-7 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-foreground mb-1 tracking-tight">Child SCAT6</h2>
              <p className="text-sm text-muted-foreground mb-2">
                Sport Concussion Assessment Tool — for children aged 8–12 years
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 15–20 min</span>
                <span>Child + Parent reports</span>
                <span>PDF export</span>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors flex-shrink-0" />
          </Link>
        </div>

        {/* Crawlable definition block */}
        <div className="mt-8 glass rounded-2xl p-6">
          <h2 className="text-xl font-bold text-foreground mb-3 tracking-tight">
            What are the SCAT6, SCOAT6 and Child SCAT6 forms?
          </h2>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              The SCAT6, SCOAT6 and Child SCAT6 are the internationally standardised sport
              concussion assessment tools developed through the 2022 Amsterdam International
              Consensus on Concussion in Sport and published in the British Journal of Sports
              Medicine in 2023. The SCAT6 is the acute assessment for athletes aged 13 and over —
              used on the sideline or in clinic, ideally within the first 72 hours after injury.
              The SCOAT6 (Sport Concussion Office Assessment Tool) is the structured clinic
              assessment for the sub-acute period, from 72 hours post-injury to around Day 30,
              including repeat follow-up visits. The Child SCAT6 adapts the acute assessment for
              children aged 8–12, pairing a child self-report with a parent/guardian symptom
              report.
            </p>
            <p>
              All three tools are intended for use by licensed healthcare professionals. The
              versions on this page are free, web-based and fillable — scores calculate
              automatically and each completed assessment exports as a PDF for the medical
              record, with no registration required.
            </p>
          </div>
          <p className="mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
            Reviewed by Zac Lewis — Osteopath (AHPRA), B.Clin.Sci, M.Ost.Med · Updated July 2026
          </p>
        </div>

        {/* Inline email capture — free SCAT6 Mastery Course */}
        <div className="mt-8">
          <EmailCaptureInline />
        </div>

        {/* Crawlable Q&A — mirrored exactly in the FAQPage JSON-LD */}
        <div className="mt-8 space-y-4">
          {faqs.map((f) => (
            <div key={f.question} className="glass rounded-2xl p-6">
              <h2 className="text-lg font-bold text-foreground mb-2 tracking-tight">{f.question}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.answer}</p>
            </div>
          ))}
        </div>

        {/* Help choosing */}
        <div className="mt-8 glass rounded-xl p-5 text-center">
          <p className="text-sm text-muted-foreground">
            Not sure which to use? <Link href="/scat-forms/about" className="text-accent font-semibold hover:underline">Learn the difference between SCAT6 and SCOAT6</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
