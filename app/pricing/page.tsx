'use client'

import { useState, useEffect } from 'react'
import { Check, X, Users, Sparkles, Clock, TrendingUp, Award, Shield } from 'lucide-react'
import Link from 'next/link'
import { CONFIG } from '@/lib/config'

export default function PricingPage() {
  const [showAnnual, setShowAnnual] = useState(true)
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 })

  // Countdown timer - Q1 2026 Cohort closes Feb 28, 2026
  useEffect(() => {
    const targetDate = new Date('2026-02-28T23:59:59').getTime()

    const interval = setInterval(() => {
      const now = new Date().getTime()
      const distance = targetDate - now

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const tiers = [
    {
      name: 'Individual Professional',
      price: { monthly: 49, annual: 490 },
      savings: 98,
      description: 'For solo practitioners',
      features: [
        'All 8 learning modules',
        '20 CPD points (AHPRA-compliant certificates)',
        'Monthly case study updates',
        'Assessment quizzes with instant feedback',
        'Downloadable resources library',
        'Priority email support',
        'Access to SCAT6/SCOAT6 digital tools',
        'Certificate of completion',
      ],
      notIncluded: [
        'Live quarterly Q&A webinars',
        'Advanced case library (100+ scenarios)',
        'Private community access',
        'Team collaboration features',
      ],
      cta: 'Get Started',
      highlight: false,
    },
    {
      name: 'Premium Professional',
      price: { monthly: 89, annual: 890 },
      savings: 178,
      description: 'For dedicated specialists',
      badge: 'Most Popular',
      features: [
        'Everything in Individual, plus:',
        'Live quarterly Q&A webinars with specialists',
        'Advanced case library (100+ real scenarios)',
        'Customizable patient education templates',
        'CEU certificate (higher recognition)',
        'Private community access (peer forum)',
        'Monthly expert insights newsletter',
        'Early access to new modules',
      ],
      notIncluded: [
        'Branded assessment reports',
        'Practice management dashboard',
        'White-label resources',
        'Dedicated account manager',
      ],
      cta: 'Upgrade to Premium',
      highlight: true,
    },
    {
      name: 'Clinic/Team License',
      price: { monthly: 399, annual: 4788 },
      savings: 0,
      description: '5 professional licenses',
      features: [
        'Everything in Premium, plus:',
        '5 professional licenses (add more anytime)',
        'Branded assessment reports (clinic logo on SCAT)',
        'Practice management dashboard',
        'Team performance tracking',
        'Bulk patient education materials',
        'White-label resources',
        'Dedicated account manager',
        'Custom onboarding & training',
        'Priority phone & email support',
      ],
      notIncluded: [],
      cta: 'Contact Sales',
      highlight: false,
    },
  ]

  const handleEnroll = async (tier: string) => {
    // Map tier name to Stripe price ID
    const priceMap: Record<string, { annual: string; monthly: string }> = {
      'Individual Professional': {
        annual: 'price_1SvS2gEEdMQX6vRJWIXqpes7',
        monthly: 'price_1SvS2gEEdMQX6vRJujcqQ2U3',
      },
      'Premium Professional': {
        annual: 'price_1SvS2hEEdMQX6vRJ65Zcs9pc',
        monthly: 'price_1SvS2hEEdMQX6vRJljqEU8Dn',
      },
      'Clinic/Team License': {
        annual: 'price_1SvS2iEEdMQX6vRJITlno4sK',
        monthly: 'price_1SvS2iEEdMQX6vRJITlno4sK', // Only annual available
      },
    }

    // For team license, redirect to contact form
    if (tier === 'Clinic/Team License') {
      window.location.href = '/contact?tier=team'
      return
    }

    const prices = priceMap[tier]
    if (!prices) {
      console.error('Invalid tier:', tier)
      return
    }

    const priceId = showAnnual ? prices.annual : prices.monthly

    try {
      // Create Stripe Checkout Session
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })

      const data = await response.json()

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
      } else {
        console.error('No checkout URL returned:', data)
        alert('Error creating checkout session. Please try again.')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Error processing payment. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-500 to-teal-400 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold mb-4">
              AHPRA-Compliant Concussion CPD
            </h1>
            <p className="text-2xl text-blue-100 mb-6">
              20 CPD Hours · $24.50/Hour vs $75 Industry Average
            </p>
            <p className="text-lg text-blue-200 max-w-2xl mx-auto">
              Join 3,247 Australian healthcare professionals using evidence-based protocols aligned with anzconcussionguidelines.com
            </p>
          </div>

          {/* Urgency Banner */}
          <div className="bg-red-600 rounded-xl p-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Clock className="w-6 h-6" />
              <div className="text-center">
                <div className="font-bold text-lg mb-1">🔥 Q1 2026 Cohort Enrollment Closes In:</div>
                <div className="flex gap-4 justify-center text-2xl font-bold">
                  <div>
                    <span className="bg-white/20 px-3 py-1 rounded">{timeLeft.days}</span>
                    <div className="text-xs mt-1 text-red-200">days</div>
                  </div>
                  <div>
                    <span className="bg-white/20 px-3 py-1 rounded">{timeLeft.hours}</span>
                    <div className="text-xs mt-1 text-red-200">hours</div>
                  </div>
                  <div>
                    <span className="bg-white/20 px-3 py-1 rounded">{timeLeft.minutes}</span>
                    <div className="text-xs mt-1 text-red-200">mins</div>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-center mt-4 text-sm">
              <strong>38/50 spots filled</strong> · Cohorts capped for interactive Q&A quality
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Toggle */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center gap-4 mb-12">
          <button
            onClick={() => setShowAnnual(false)}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              !showAnnual
                ? 'bg-blue-600 text-white'
                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setShowAnnual(true)}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors relative ${
              showAnnual
                ? 'bg-blue-600 text-white'
                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
            }`}
          >
            Annual
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
              Save 16%
            </span>
          </button>
        </div>

        {/* ROI Banner */}
        <div className="bg-green-50 border-2 border-green-300 rounded-xl p-8 mb-12 max-w-4xl mx-auto">
          <div className="flex items-start gap-4">
            <TrendingUp className="w-8 h-8 text-green-600 flex-shrink-0" />
            <div>
              <h3 className="text-2xl font-bold text-green-900 mb-2">
                Complete Your Annual CPD Requirement for Less Than One Conference
              </h3>
              <p className="text-lg text-slate-700 mb-4">
                <strong>$490/year = $24.50 per CPD hour</strong> vs. $75/hour average at medical conferences
              </p>
              <p className="text-slate-600">
                💰 <strong>Save $1,010/year</strong> vs. traditional CPD methods · Same 20 hours, better outcomes
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {tiers.map((tier, i) => (
            <div
              key={i}
              className={`relative rounded-2xl border-2 ${
                tier.highlight
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 bg-white'
              } p-8 shadow-xl hover:shadow-2xl transition-shadow`}
            >
              {tier.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-gradient-to-r from-blue-500 to-teal-500 text-white px-6 py-2 rounded-full font-bold text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    {tier.badge}
                  </div>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{tier.name}</h3>
                <p className="text-slate-600">{tier.description}</p>
              </div>

              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold text-slate-900">
                    ${showAnnual ? tier.price.annual : tier.price.monthly}
                  </span>
                  <span className="text-slate-600">{showAnnual ? '/year' : '/month'}</span>
                </div>
                {showAnnual && tier.savings > 0 && (
                  <div className="mt-2">
                    <span className="text-green-600 font-semibold">
                      Save ${tier.savings}/year
                    </span>
                    <div className="text-sm text-slate-500 line-through">
                      ${tier.price.monthly * 12}/year if paid monthly
                    </div>
                  </div>
                )}
                {!showAnnual && (
                  <div className="text-sm text-slate-500 mt-2">
                    or ${tier.price.annual}/year (save ${tier.savings})
                  </div>
                )}
              </div>

              <button
                onClick={() => handleEnroll(tier.name)}
                className={`w-full py-4 rounded-lg font-bold text-lg transition-all mb-6 ${
                  tier.highlight
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                {tier.cta}
              </button>

              <div className="space-y-3">
                {tier.features.map((feature, j) => (
                  <div key={j} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700">{feature}</span>
                  </div>
                ))}
                {tier.notIncluded.map((feature, j) => (
                  <div key={j} className="flex items-start gap-3">
                    <X className="w-5 h-5 text-slate-300 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-400">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bonus Stack */}
        <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-300 rounded-xl p-8 mb-12 max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h3 className="text-3xl font-bold text-orange-900 mb-2">
              🎁 Enroll by Feb 28 and Receive:
            </h3>
            <p className="text-lg text-slate-700">
              <strong>$286 in bonuses</strong> when you join Q1 2026 Cohort
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: '2026 Protocol Update Guide', value: '$47' },
              { title: 'Patient Education Template Pack', value: '$39' },
              { title: '30-min Case Review with Specialist', value: '$200' },
            ].map((bonus, i) => (
              <div key={i} className="bg-white rounded-lg p-4 text-center border border-orange-200">
                <div className="font-bold text-orange-600 text-lg mb-1">{bonus.value} value</div>
                <div className="text-sm text-slate-700">{bonus.title}</div>
              </div>
            ))}
          </div>
          <p className="text-center mt-6 text-sm text-slate-600">
            ⏰ Bonuses expire when Q1 Cohort closes (Feb 28, 11:59 PM AEST)
          </p>
        </div>

        {/* Trust Signals */}
        <div className="grid md:grid-cols-4 gap-6 mb-16 max-w-5xl mx-auto">
          {[
            { icon: Award, text: 'AHPRA Aligned' },
            { icon: Users, text: '3,247+ Enrolled' },
            { icon: Shield, text: '30-Day Guarantee' },
            { icon: Sparkles, text: 'Updated 2026' },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-2 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <item.icon className="w-6 h-6 text-blue-600" />
              </div>
              <span className="font-semibold text-slate-700">{item.text}</span>
            </div>
          ))}
        </div>

        {/* FAQ Pricing */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Is this AHPRA-compliant for CPD?',
                a: 'Yes. All modules are aligned with AHPRA CPD requirements and provide certificates for 20 CPD points total. Content is based on anzconcussionguidelines.com and endorsed by Osteopathy Australia.',
              },
              {
                q: 'Can I get a refund if not satisfied?',
                a: '30-day money-back guarantee. If you\'re not 100% satisfied with the course content, email us for a full refund within 30 days of enrollment. No questions asked.',
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit cards (Visa, Mastercard, Amex) and PayPal through our secure Squarespace checkout.',
              },
              {
                q: 'Do I get lifetime access or is it subscription?',
                a: 'Annual subscriptions provide access for 12 months with automatic renewal. Cancel anytime before renewal date. All certificates and downloaded resources remain yours permanently.',
              },
              {
                q: 'Can I upgrade from Individual to Premium later?',
                a: 'Yes. You can upgrade anytime and only pay the difference (pro-rated for remaining months). Contact support@concussionpro.com.au to upgrade.',
              },
            ].map((faq, i) => (
              <div key={i} className="bg-white rounded-lg border border-slate-200 p-6">
                <h3 className="font-bold text-lg text-slate-900 mb-2">{faq.q}</h3>
                <p className="text-slate-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Ready to Master Concussion Management?
          </h2>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Join 3,247 Australian healthcare professionals. Lock in founding member rate before price increases March 1.
          </p>
          <button
            onClick={() => handleEnroll('Individual')}
            className="bg-blue-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
          >
            Get Started Now - $490/Year →
          </button>
          <p className="text-sm text-slate-500 mt-4">
            💰 Price increases to $690/year on March 1, 2026 · Lock in $490 for lifetime
          </p>
        </div>
      </div>
    </div>
  )
}
