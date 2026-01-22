'use client'

import { useRouter } from 'next/navigation'
import { MapPin, Calendar, Users, ArrowRight, CheckCircle2, Award } from 'lucide-react'
import { CONFIG } from '@/lib/config'
import { EventSchema, BreadcrumbSchema } from '@/components/SchemaMarkup'
import CountdownTimer from '@/components/CountdownTimer'
import SpotsRemaining from '@/components/SpotsRemaining'

export default function SydneyPage() {
  const router = useRouter()
  const location = CONFIG.LOCATIONS.SYDNEY

  return (
    <>
      {/* Schema Markup for SEO */}
      <EventSchema location="SYDNEY" />
      <BreadcrumbSchema items={[
        { name: 'Home', url: '/' },
        { name: 'Training Locations', url: '/course' },
        { name: 'Sydney', url: '/courses/melbourne' },
      ]} />

      <div className="min-h-screen bg-background py-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-accent/10 px-4 py-2 rounded-full mb-4">
              <MapPin className="w-4 h-4 text-accent" aria-hidden="true" />
              <span className="text-sm font-bold text-accent">{location.city}, New South Wales</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Concussion Management Training
              <br />
              <span className="text-gradient">{location.city}</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6 leading-relaxed">
              Master SCAT6, VOMS, and BESS protocols in Sydney's premier concussion management course.
              Full-day practical training with {CONFIG.COURSE.TOTAL_CPD_HOURS} AHPRA CPD hours.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <div className="flex items-center gap-2 text-slate-700">
                <Calendar className="w-5 h-5 text-accent" aria-hidden="true" />
                <span className="font-semibold">{location.date}</span>
              </div>
              <SpotsRemaining location="SYDNEY" />
            </div>

            <CountdownTimer className="justify-center mb-8" />

            <a
              href={CONFIG.SHOP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary px-10 py-4 rounded-xl text-lg font-bold inline-flex items-center gap-2 shadow-2xl focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
              aria-label={`Enroll in Sydney session for $${CONFIG.COURSE.PRICE_EARLY_BIRD}`}
            >
              Enroll Now - ${CONFIG.COURSE.PRICE_EARLY_BIRD}
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </a>

            <p className="text-sm text-muted-foreground mt-4">
              Use code <span className="font-bold text-accent">{CONFIG.COURSE.PROMO_CODE}</span> to save ${CONFIG.COURSE.SAVINGS}
            </p>
          </div>

          {/* What's Included */}
          <div className="glass rounded-2xl p-8 mb-12">
            <h2 className="text-2xl font-bold mb-6 text-center">What's Included in {location.city}</h2>

            <div className="grid md:grid-cols-2 gap-4">
              {[
                'Full-day hands-on SCAT6 training',
                'VOMS protocol practice with live patients',
                'BESS testing certification',
                'Clinical decision-making frameworks',
                'Return-to-play protocol training',
                `${CONFIG.COURSE.TOTAL_CPD_HOURS} AHPRA CPD hours`,
                'Lifetime access to {CONFIG.COURSE.TOTAL_MODULES} online modules',
                'Course completion certificate',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="text-sm text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Training Details */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="glass rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-accent" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Training Date</h3>
                  <p className="text-sm text-muted-foreground">{location.date}</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Full-day intensive training from 9:00 AM to 5:00 PM. Includes morning tea, lunch, and afternoon tea.
              </p>
            </div>

            <div className="glass rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-accent" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Location</h3>
                  <p className="text-sm text-muted-foreground">{location.city}, New South Wales</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Exact venue details will be sent via email 1 week before the training date.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="glass rounded-2xl p-8 text-center bg-gradient-to-br from-blue-600/5 to-teal-600/5">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Secure Your Spot in {location.city}
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Join Sydney clinicians mastering evidence-based concussion management. Limited to {location.spotsRemaining} spots for optimal hands-on practice.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={CONFIG.SHOP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary px-10 py-4 rounded-xl text-base font-bold inline-flex items-center gap-2 shadow-2xl w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
              >
                Enroll Now
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </a>
              <button
                onClick={() => router.push('/preview')}
                className="glass px-8 py-4 rounded-xl text-base font-semibold hover:bg-slate-100 transition-colors inline-flex items-center gap-2 border border-slate-200 w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
              >
                Preview Course Content
              </button>
            </div>
          </div>

          {/* Back Link */}
          <div className="text-center mt-8">
            <button
              onClick={() => router.push('/course')}
              className="text-sm text-muted-foreground hover:text-accent transition-colors focus:outline-none focus:ring-2 focus:ring-accent rounded px-2 py-1"
            >
              ← View All Locations
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
