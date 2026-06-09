'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Calendar, ArrowRight, CheckCircle2, Utensils, Clock, BookOpen, FileText, Infinity, BedDouble, Car, Plane } from 'lucide-react'
import { CONFIG } from '@/lib/config'
import { EventSchema, BreadcrumbSchema } from '@/components/SchemaMarkup'
import SpotsRemaining from '@/components/SpotsRemaining'
import { SiteNav } from '@/components/SiteNav'
import { NextEarlyBirdCapture } from '@/components/NextEarlyBirdCapture'

export default function MelbournePage() {
  const location = CONFIG.LOCATIONS.MELBOURNE

  return (
    <>
      {/* Schema Markup for SEO */}
      <EventSchema location="MELBOURNE" />
      <BreadcrumbSchema items={[
        { name: 'Home', url: '/' },
        { name: 'Training Locations', url: '/course' },
        { name: 'Melbourne', url: '/courses/melbourne' },
      ]} />

      <SiteNav />
      <div className="min-h-screen bg-background pt-[120px] pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Hero image — Melbourne workshop feature card (smaller, centred) */}
          {location.status === 'confirmed' && (
            <div className="relative mx-auto w-full max-w-sm aspect-[4/3] rounded-xl overflow-hidden mb-8 shadow-md">
              <Image
                src="/melbourne-workshop.jpg"
                alt="Concussion Clinical Mastery · Melbourne · June 13 2026"
                fill
                priority
                sizes="(max-width: 768px) 320px, 384px"
                className="object-cover"
              />
            </div>
          )}

          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-accent/10 px-4 py-2 rounded-full mb-4">
              <MapPin className="w-4 h-4 text-accent" aria-hidden="true" />
              <span className="text-sm font-bold text-accent">{location.city}, Victoria</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Concussion Management Training
              <br />
              <span className="text-gradient">{location.city}</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6 leading-relaxed">
              Master SCAT6, VOMS, and BESS protocols in Melbourne's premier concussion management course.
              Full-day practical training with {CONFIG.COURSE.TOTAL_CPD_POINTS} AHPRA CPD hours.
            </p>

            {location.status === 'confirmed' ? (
              <>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-3">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Calendar className="w-5 h-5 text-accent" aria-hidden="true" />
                    <span className="font-semibold">{location.date}</span>
                  </div>
                  <span className="hidden sm:inline text-slate-300">·</span>
                  <div className="flex items-center gap-2 text-slate-700">
                    <MapPin className="w-5 h-5 text-accent" aria-hidden="true" />
                    <span className="font-semibold">Rydges Melbourne · Exhibition St</span>
                  </div>
                  <span className="hidden sm:inline text-slate-300">·</span>
                  <SpotsRemaining location="MELBOURNE" />
                </div>

                <p className="text-sm text-slate-600 mb-6">
                  Full day (8am–4pm) · catered lunch included · lifetime online access
                </p>

                <a
                  href={`${CONFIG.SHOP_URL}?location=melbourne`}
                  className="btn-primary px-10 py-4 rounded-xl text-lg font-bold inline-flex items-center gap-2 shadow-2xl focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                  aria-label={`Enrol in Melbourne session for $${CONFIG.COURSE.PRICE_REGULAR}`}
                >
                  Enrol Now — ${CONFIG.COURSE.PRICE_REGULAR.toLocaleString()}
                  <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </a>

                {/* Early bird closed 31 May 2026 — capture buyers who missed
                    it for the next workshop's early-bird list instead. */}
                <NextEarlyBirdCapture defaultCity="melbourne" />
              </>
            ) : (
              <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-5 py-2.5 rounded-full text-sm font-semibold">
                <Calendar className="w-4 h-4" aria-hidden="true" />
                {CONFIG.WORKSHOP.NEXT_ROUND} — Reserve Your Spot Below
              </div>
            )}
          </div>

          {/* What's Included */}
          <div className="glass rounded-2xl p-8 mb-12">
            <h2 className="text-2xl font-bold mb-2 text-center">Everything you get</h2>
            <p className="text-sm text-center text-muted-foreground mb-6">
              One price. Online content + a full day of hands-on training in Melbourne. No recurring fees.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              {[
                { icon: CheckCircle2, text: `${CONFIG.COURSE.TOTAL_CPD_POINTS} AHPRA CPD hours — one certificate covering SCAT6, SCOAT6, VOMS, mBESS, return-to-play and rehabilitation by phenotype` },
                { icon: CheckCircle2, text: 'Full-day hands-on practice with live partners — SCAT6, SCOAT6, VOMS and mBESS' },
                { icon: CheckCircle2, text: 'Return-to-play, return-to-school and return-to-work frameworks' },
                { icon: Infinity, text: `Lifetime access to all ${CONFIG.COURSE.TOTAL_MODULES} online modules — updated as guidelines evolve` },
                { icon: FileText, text: 'Fillable SCAT6 / SCOAT6 / Child SCAT6 PDFs (yours to keep)' },
                { icon: BookOpen, text: '140+ evidence-based references &amp; clinical decision aids' },
                { icon: BookOpen, text: 'Complete Clinical Reference PDF (save offline)' },
                { icon: Utensils, text: 'Catered lunch included — plus morning and afternoon tea' },
                { icon: Clock, text: '8am–4pm, Saturday — finish the course in a single day' },
                { icon: CheckCircle2, text: '7-day money-back guarantee' },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Icon className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="text-sm text-slate-700" dangerouslySetInnerHTML={{ __html: text }} />
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
                  <h3 className="text-lg font-bold">Workshop date</h3>
                  <p className="text-sm text-muted-foreground">{location.date}</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Full-day intensive, 8:00am–4:00pm. Catered lunch included, plus morning and afternoon tea. Small group format — capped at {CONFIG.WORKSHOP.CAPACITY_PER_COURSE} clinicians for maximum hands-on practice time.
              </p>
            </div>

            <div className="glass rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-accent" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Venue</h3>
                  <p className="text-sm text-muted-foreground">Rydges Melbourne · Exhibition St, CBD</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Rydges Hotel, 186 Exhibition St, Melbourne CBD. Walking distance from Parliament Station and Flinders Street. Full venue details and parking/transit info emailed 2 weeks before the workshop.
              </p>
            </div>
          </div>

          {/* Travel & stay — for out-of-town attendees */}
          <div className="glass rounded-2xl p-6 md:p-8 mb-12">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-lg bg-accent/10 flex items-center justify-center">
                <Plane className="w-5 h-5 text-accent" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Travelling in? Stay on-site.</h2>
                <p className="text-sm text-muted-foreground">Partner perks at the venue for interstate and regional attendees.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 p-4 bg-white">
                <div className="flex items-center gap-2 mb-2">
                  <BedDouble className="w-4 h-4 text-accent" aria-hidden="true" />
                  <h3 className="text-sm font-bold">{CONFIG.VENUE_BENEFITS.MELBOURNE.accommodationDiscountPct}% off accommodation</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Book directly at <strong>{CONFIG.VENUE_BENEFITS.MELBOURNE.hotelName}</strong> and save {CONFIG.VENUE_BENEFITS.MELBOURNE.accommodationDiscountPct}%. Your discount code and booking link are sent with your enrolment confirmation — use it for the night before or a multi-night stay.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 bg-white">
                <div className="flex items-center gap-2 mb-2">
                  <Car className="w-4 h-4 text-accent" aria-hidden="true" />
                  <h3 className="text-sm font-bold">Secure parking on-site</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Conference day rate:</strong> ${CONFIG.VENUE_BENEFITS.MELBOURNE.parkingConferenceRate} (enter before 10am, exit by 6pm).<br />
                  <strong>Overnight guests:</strong> ${CONFIG.VENUE_BENEFITS.MELBOURNE.parkingOvernightRate}/night. Secure car park below the hotel, subject to availability.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500 mt-4">
              Full travel logistics (venue door, parking entrance, nearest trains) are in the 2-weeks-out workshop email.
            </p>
          </div>

          {/* CTA */}
          <div className="glass rounded-2xl p-8 text-center bg-gradient-to-br from-blue-600/5 to-teal-600/5">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Secure Your Spot in {location.city}
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Join Melbourne clinicians mastering evidence-based concussion management.{location.status === 'confirmed' ? ` Workshop date confirmed — limited spots for optimal hands-on practice.` : ` Reserve your spot now — dates confirmed once ${CONFIG.WORKSHOP.CONFIRMATION_THRESHOLD} registrants per city are locked in.`}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {location.status === 'confirmed' ? (
                <a
                  href={`${CONFIG.SHOP_URL}?location=melbourne`}
                  className="btn-primary px-10 py-4 rounded-xl text-base font-bold inline-flex items-center gap-2 shadow-2xl w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                >
                  Enrol Now
                  <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </a>
              ) : (
                <a
                  href="/pricing"
                  className="btn-primary px-10 py-4 rounded-xl text-base font-bold inline-flex items-center gap-2 shadow-2xl w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                >
                  Reserve My Spot
                  <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </a>
              )}
              <Link
                href="/preview"
                className="glass px-8 py-4 rounded-xl text-base font-semibold hover:bg-slate-100 transition-colors inline-flex items-center gap-2 border border-slate-200 w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
              >
                Preview Course Content
              </Link>
            </div>
          </div>

          {/* Back Link */}
          <div className="text-center mt-8">
            <Link
              href="/course"
              className="text-sm text-muted-foreground hover:text-accent transition-colors focus:outline-none focus:ring-2 focus:ring-accent rounded px-2 py-1"
            >
              ← View All Locations
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
