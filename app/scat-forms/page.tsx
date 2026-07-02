import { Metadata } from 'next'
import Link from 'next/link'
import { FileText, Clock, ArrowRight } from 'lucide-react'
import { SiteNav } from '@/components/SiteNav'
import { EmailCaptureInline } from '@/components/EmailCaptureInline'

export const metadata: Metadata = {
  title: 'SCAT6 & SCOAT6 Web Forms — Auto-Scoring Digital Assessment Tools',
  description: 'Complete SCAT6, SCOAT6 and Child SCAT6 assessments in your browser with automatic score calculation and PDF export for medical records. Built for Australian clinicians.',
}

export default function SCATFormsPage() {
  return (
    <div className="min-h-screen bg-background">
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

        {/* Inline email capture — free SCAT6 Mastery Course */}
        <div className="mt-8">
          <EmailCaptureInline />
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
