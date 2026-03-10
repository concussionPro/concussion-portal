'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Sparkles,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Star,
  ShieldCheck,
  Receipt,
  Building2,
} from 'lucide-react'
import { SiteNav } from '@/components/SiteNav'
import { PricingOptions } from '@/components/PricingOptions'
import { createFAQSchema } from '@/lib/schema-markup'
import { CONFIG } from '@/lib/config'

// ─── Main Pricing Content ────────────────────────────────────────────────────

function PricingContent() {
  const searchParams = useSearchParams()
  const canceled = searchParams.get('canceled')

  // FAQ accordion
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const faqs = [
    {
      q: 'Can I upgrade from online-only to the full course later?',
      a: 'Yes — contact us to arrange an upgrade. Note that early bird pricing may no longer be available, so enrolling in the complete course now locks in the best rate.',
    },
    {
      q: 'When do I get access to the online modules?',
      a: "Immediately after purchase. You'll receive a login link via email within minutes.",
    },
    {
      q: 'What if I can\'t make my workshop date?',
      a: 'No problem — you can reschedule to any future workshop date or location at no extra cost. There\'s no expiry. Once enrolled, you have lifetime access to the online modules and full flexibility on when you attend the hands-on day.',
    },
    {
      q: "What happens if I register interest for a TBA location?",
      a: "You'll be emailed as soon as the date and venue are confirmed — typically 4–6 weeks before the event. You'll also get early access to book before spots open publicly.",
    },
    {
      q: 'How much time does the course take?',
      a: 'The online modules take approximately 11 hours total, completed at your own pace with no deadline. The hands-on workshop is a single full day. Most clinicians complete the online content over 2–4 weeks alongside their clinical workload.',
    },
    {
      q: 'Is this course only for osteopaths?',
      a: 'No — the course is designed for any clinician managing concussion, including physiotherapists, GPs, sports medicine doctors, exercise physiologists, and athletic trainers. The curriculum is AHPRA-aligned and endorsed by Osteopathy Australia, but the clinical content is universal.',
    },
    {
      q: 'What is your refund policy?',
      a: 'We offer a 7-day satisfaction guarantee. If the course isn\'t right for you, email us within 7 days of purchase for a full refund (online content must be less than 25% accessed). Workshop cancellations: full refund 14+ days before your workshop date, 50% refund 7–13 days before. Attendee substitution is always available. See our full terms at /terms.',
    },
    {
      q: 'Can my employer pay for this?',
      a: 'Yes — most practices and employers cover CPD training costs. After purchase, you\'ll receive a tax invoice and AHPRA-aligned CPD certificate that your employer can use for reimbursement. Many clinicians pay nothing out of pocket.',
    },
  ]

  // FAQ schema for Google rich results
  const faqSchemaData = faqs.map(f => ({ question: f.q, answer: f.a }))

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(createFAQSchema(faqSchemaData)) }}
      />
      <SiteNav />

      <div className="max-w-6xl mx-auto px-6 pt-[80px] pb-12 md:pb-20">

        {/* Canceled notice */}
        {canceled && (
          <div className="max-w-2xl mx-auto mb-8 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              Checkout was canceled — no charge was made. You can try again whenever you&apos;re ready.
            </p>
          </div>
        )}

        {/* Page Header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-5 border border-accent/20">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-semibold text-accent">
              AHPRA Aligned · 14 CPD Points · Endorsed by Osteopathy Australia
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-5">
            Invest in Your Clinical{' '}
            <span className="text-gradient">Confidence</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            The only Australian concussion CPD with hands-on assessment training.
            Start with 8 online modules — add the workshop when dates are confirmed.
          </p>
        </div>

        {/* Social proof strip */}
        {CONFIG.FEATURES.SHOW_SOCIAL_PROOF && (
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mb-10 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="font-semibold text-foreground">{CONFIG.SOCIAL_PROOF.SCAT_FORM_DOWNLOADS}+</span> SCAT6 forms downloaded
            </span>
            <span>·</span>
            <span>Endorsed by <span className="font-semibold text-foreground">Osteopathy Australia</span></span>
            <span>·</span>
            <span>30-day money-back guarantee</span>
          </div>
        )}

        {/* Pricing Cards — delegated to PricingOptions */}
        <PricingOptions variant="full" />

        {/* Testimonials */}
        <div className="max-w-4xl mx-auto mt-16 md:mt-20">
          <h2 className="text-2xl font-bold text-center mb-8 text-foreground">Trusted by Australian Clinicians</h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              {
                quote: 'Well organised...content explained in a way that was relative and memorable',
                name: 'Alex',
                role: 'Osteopath, Melbourne',
                initials: 'A',
              },
              {
                quote: "An outstanding blend of evidence-based knowledge and practical skills. Directly applicable to concussion diagnosis and management in real-world settings.",
                name: 'Dean',
                role: 'University Clinical Educator, QLD',
                initials: 'D',
              },
              {
                quote: 'Relevant, applicable and easy to absorb. A must for any clinician managing concussion',
                name: 'Sarah',
                role: 'Physiotherapist',
                initials: 'S',
              },
              {
                quote: 'Incredibly thorough and well structured...hands on component was invaluable',
                name: 'Amelia',
                role: 'Physiotherapist',
                initials: 'A',
              },
              {
                quote: 'Highly recommend for any health professional wanting to improve their concussion management skills',
                name: 'Bailey',
                role: 'Exercise Physiologist',
                initials: 'B',
              },
            ].map((t) => (
              <div key={t.name} className="glass rounded-xl p-5">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-[#0b6165] flex items-center justify-center text-xs font-semibold text-white shadow-sm">
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instructor */}
        <div className="text-center mt-10">
          <p className="text-sm text-muted-foreground">
            Led by <span className="font-semibold text-foreground">Zac Lewis</span>, Osteopath &amp; Founder, Concussion Education Australia
          </p>
        </div>

        {/* Guarantee + Employer Reimbursement */}
        <div className="max-w-4xl mx-auto mt-16 md:mt-20 grid md:grid-cols-2 gap-4">
          {/* Money-back guarantee */}
          <div className="glass rounded-xl p-6 border border-emerald-200/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-bold text-foreground">30-Day Satisfaction Guarantee</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Complete Module 1. If you&apos;re not confident this course is right for you,
              email us within 30 days for a full refund — no questions asked.
              We&apos;re confident in what we&apos;ve built, and we want you to be too.
            </p>
          </div>

          {/* Employer reimbursement */}
          <div className="glass rounded-xl p-6 border border-blue-200/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-bold text-foreground">Employer CPD Reimbursement</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Most employers and practices cover CPD training costs. We provide a
              tax invoice and AHPRA-aligned CPD certificate — everything your
              employer needs to approve reimbursement. Many clinicians pay $0 out of pocket.
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mt-16 md:mt-20">
          <h2 className="text-2xl font-bold text-center mb-8 text-foreground">Common Questions</h2>
          <div className="space-y-3">
            {faqs.map((item, i) => (
              <div key={i} className="glass rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left gap-3"
                  aria-expanded={openFaq === i}
                >
                  <span className="font-semibold text-sm text-foreground">{item.q}</span>
                  {openFaq === i ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

// ─── Page Export ─────────────────────────────────────────────────────────────

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
      }
    >
      <PricingContent />
    </Suspense>
  )
}
