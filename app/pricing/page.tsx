'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Sparkles,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { SiteNav } from '@/components/SiteNav'
import { PricingOptions } from '@/components/PricingOptions'

// ─── Main Pricing Content ────────────────────────────────────────────────────

function PricingContent() {
  const searchParams = useSearchParams()
  const canceled = searchParams.get('canceled')

  // FAQ accordion
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const faqs = [
    {
      q: 'Can I upgrade from online-only to the full course later?',
      a: 'Yes. Start with the online course for $497, then upgrade to the full course by paying the difference ($693). Contact us to arrange this.',
    },
    {
      q: 'When do I get access to the online modules?',
      a: "Immediately after purchase. You'll receive a login link via email within minutes.",
    },
    {
      q: 'Can I change my workshop date or location?',
      a: 'Yes — you have full flexibility to attend any available workshop date. Email us to reschedule at no extra charge (subject to availability).',
    },
    {
      q: 'Is the purchase refundable?',
      a: 'Contact us at zac@concussion-education-australia.com to discuss any concerns. We want you to be confident in your investment.',
    },
    {
      q: "What happens if I register interest for a TBA location?",
      a: "You'll be emailed as soon as the date and venue are confirmed — typically 4–6 weeks before the event. You'll also get early access to book before spots open publicly.",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
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
            Australia&apos;s most comprehensive concussion management training. Start online at your own pace,
            or commit to the full certification with hands-on workshop.
          </p>
        </div>

        {/* Pricing Cards — delegated to PricingOptions */}
        <PricingOptions variant="full" />

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
