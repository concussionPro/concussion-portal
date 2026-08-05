'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  Award,
  Calendar,
  Check,
  MapPin,
  ArrowRight,
  FileText,
  Download,
  BookOpen,
  Users,
  Brain,
  Shield,
} from 'lucide-react'
import { CONFIG, isEarlyBirdForLocation, workshopPriceFor } from '@/lib/config'
import { SiteNav } from '@/components/SiteNav'
import { createCourseSchema } from '@/lib/schema-markup'

// Flagship Course structured data. CPD truth: 8 hours online; 16 CPD hours
// ONLY as online + in-person practical day combined — which is what this
// Complete Course page sells. Price always via CONFIG, never hardcoded.
const courseSchema = createCourseSchema({
  name: 'Concussion Clinical Mastery — Complete Course',
  description:
    'Hybrid concussion assessment and management training for Australian healthcare professionals — 8 online modules (8 CPD hours) plus a full-day in-person practical workshop (16 CPD hours combined) covering SCAT6, SCOAT6, VOMS, BESS and return-to-play protocols. Endorsed by Osteopathy Australia; hours count toward AHPRA registration CPD requirements.',
  // Derived — a hardcoded 14 shipped a WRONG credential claim in the
  // schema.org markup (and contradicted this object's own description)
  // after the 07-30 re-rate to 16 (2026-08-05 live crawl).
  cpdHours: CONFIG.COURSE.TOTAL_CPD_POINTS,
  priceAUD: CONFIG.COURSE.PRICE_EARLY_BIRD,
  instances: [
    {
      courseMode: 'blended',
      priceAUD: CONFIG.COURSE.PRICE_EARLY_BIRD,
    },
  ],
})

const locations = Object.values(CONFIG.LOCATIONS)
  .map(loc => ({
    city: loc.city,
    date: loc.status === 'confirmed' && loc.date
      ? loc.date
      : 'Date launches as your city fills — enrol now at early-bird',
    availability: loc.status === 'confirmed' ? 'Available' : 'Taking nominations',
    shopUrl: `/pricing?location=${loc.slug}`,
    status: loc.status,
  }))

const included = [
  { icon: BookOpen, title: '8 Online Modules', desc: 'Self-paced expert training' },
  { icon: Calendar, title: 'Full-Day Skills Training', desc: 'Full-day practical SCAT6, VOMS, BESS' },
  { icon: Award, title: `${CONFIG.COURSE.TOTAL_CPD_POINTS} CPD Hours`, desc: 'AHPRA aligned' },
  { icon: FileText, title: 'Clinical Resources', desc: 'Templates & frameworks' },
  { icon: Users, title: 'Expert Support', desc: 'Direct instructor access' },
  { icon: Brain, title: 'Lifetime Access', desc: 'Content updated regularly' },
]

export default function CoursePage() {
  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }}
      />
      <SiteNav />

      {/* Hero */}
      <section className="section-padding pt-[120px]">
        <div className="container-lg px-6 md:px-8 text-center">
          <div className="badge mb-5">
            <Award className="w-3.5 h-3.5 mr-1.5" />
            {CONFIG.COURSE.CPD_BADGE_TEXT}
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-5 tracking-tight leading-[1.1]">
            Master concussion
            <br />
            clinical management
          </h1>

          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Evidence-based hybrid training: 8 comprehensive online modules + full-day practical skills training.
            Full-day medical diagnostic training designed for GPs, physiotherapists, and allied health professionals.
          </p>

          <div className="flex items-center justify-center gap-6 md:gap-12 max-w-lg mx-auto">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gradient mb-2">8</div>
              <div className="text-xs text-muted-foreground font-medium">Online Modules</div>
            </div>
            <div className="h-12 w-px bg-border" />
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gradient mb-2">1 Day</div>
              <div className="text-xs text-muted-foreground font-medium">Practical Training</div>
            </div>
            <div className="h-12 w-px bg-border" />
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gradient mb-2">{CONFIG.COURSE.TOTAL_CPD_POINTS}</div>
              <div className="text-xs text-muted-foreground font-medium">CPD Hours</div>
            </div>
          </div>
        </div>
      </section>

      {/* Course Preview Download */}
      <section className="py-8 px-6 md:px-8">
        <div className="container-lg">
          <a
            href="/CourseContent_2026.pdf"
            download
            className="glass glass-hover rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-5"
          >
            <div className="flex items-center gap-5">
              <div className="icon-container w-14 h-14">
                <FileText className="w-7 h-7 text-accent" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-foreground mb-1 tracking-tight">
                  Course Content Preview
                </h3>
                <p className="text-sm text-muted-foreground">
                  Download complete module breakdown (PDF)
                </p>
                {/* The file is gated to enrolled accounts (middleware PAID
                    gate). Say so here — an unsignalled gate on a public page
                    is what sent anonymous visitors into a 401. */}
                <p className="text-xs text-muted-foreground/80 mt-1">
                  Included with enrolment — sign in to download
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-accent font-semibold text-sm">
              Download
              <Download className="w-4 h-4" />
            </div>
          </a>
        </div>
      </section>

      {/* What's Included */}
      <section className="section-padding bg-muted/30">
        <div className="container-lg px-6 md:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight">
              What&apos;s included
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              Complete training package with online learning and practical application
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {included.map((item, index) => (
              <div
                key={item.title}
                className="glass rounded-2xl p-6 animate-scale-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="icon-container w-12 h-12 mb-5">
                  <item.icon className="w-6 h-6 text-accent" strokeWidth={1.5} />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2 tracking-tight">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="section-padding">
        <div className="container-md px-6 md:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight">
            Investment in clinical excellence
          </h2>
          <p className="text-base text-muted-foreground mb-6">
            Online course from ${CONFIG.COURSE.PRICE_ONLINE} AUD · Complete course with workshop ${workshopPriceFor().toLocaleString()} AUD
          </p>
          {isEarlyBirdForLocation() && (
            <p className="text-sm text-muted-foreground mb-6">
              Early-bird rate. Standard ${CONFIG.COURSE.PRICE_REGULAR.toLocaleString()} applies in the final{' '}
              {CONFIG.WORKSHOP.EARLY_BIRD_DAYS_BEFORE} days before a scheduled workshop.
            </p>
          )}
          <Link
            href="/pricing"
            className="btn-primary px-10 py-4 rounded-xl text-base font-bold inline-flex items-center gap-2"
          >
            View Pricing & Enrol
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Location Selection */}
      <section className="section-padding bg-muted/30">
        <div className="container-md px-6 md:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight">
              Choose your location
            </h2>
            <p className="text-base text-muted-foreground">
              Select a practical training session
            </p>
          </div>

          <div className="space-y-4">
            {locations.map((location) => (
              <Link
                key={location.city}
                href={location.shopUrl}
                className="glass rounded-2xl p-6 block hover:border-accent/40 hover:shadow-md transition-all group"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="icon-container w-11 h-11">
                      <MapPin className="w-5 h-5 text-accent" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-1 tracking-tight">
                        {location.city}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {location.date}
                      </div>
                    </div>
                  </div>

                  <span className="flex items-center gap-3">
                    <span
                      className={`badge ${
                        location.availability === 'Taking nominations'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : location.availability === 'Limited spots'
                          ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          : ''
                      }`}
                    >
                      {location.availability}
                    </span>
                    <span className="text-sm font-semibold text-accent group-hover:translate-x-0.5 transition-transform">
                      Enrol →
                    </span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Flexibility Guarantee */}
      <section className="py-12 px-6 md:px-8">
        <div className="container-md">
          <div className="glass rounded-2xl p-8 md:p-10 border-l-4 border-[#7ba8b0]">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-[#7ba8b0] to-emerald-600 flex items-center justify-center shadow-xl">
                  <Shield className="w-8 h-8 md:w-10 md:h-10 text-white" strokeWidth={2} />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3 tracking-tight">
                  Total Flexibility — No Expiry
                </h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-4">
                  Life gets busy. Once enrolled, you get lifetime access to all online modules — content is
                  updated and added to regularly as guidelines evolve, so your knowledge stays current.
                  Reschedule your workshop to any future date or location at no extra cost. Start the
                  online content immediately and attend the hands-on day when it suits you.
                </p>
                <div className="flex flex-wrap gap-2 md:gap-3 justify-start">
                  <div className="inline-flex items-center gap-2 text-xs md:text-sm font-semibold text-[#5b8d96] bg-teal-50 px-2.5 md:px-3 py-1.5 rounded-lg border border-teal-200">
                    <Check className="w-3.5 md:w-4 h-3.5 md:h-4" strokeWidth={2.5} />
                    Lifetime Access
                  </div>
                  <div className="inline-flex items-center gap-2 text-xs md:text-sm font-semibold text-[#5b8d96] bg-teal-50 px-2.5 md:px-3 py-1.5 rounded-lg border border-teal-200">
                    <Check className="w-3.5 md:w-4 h-3.5 md:h-4" strokeWidth={2.5} />
                    Reschedule Anytime
                  </div>
                  <div className="inline-flex items-center gap-2 text-xs md:text-sm font-semibold text-[#5b8d96] bg-teal-50 px-2.5 md:px-3 py-1.5 rounded-lg border border-teal-200">
                    <Check className="w-3.5 md:w-4 h-3.5 md:h-4" strokeWidth={2.5} />
                    Any Location
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enrollment CTA */}
      <section className="section-padding">
        <div className="container-sm px-6 md:px-8">
          <div className="glass rounded-2xl p-8 md:p-10 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-5 tracking-tight">
              Ready to enrol?
            </h2>

            <p className="text-lg text-muted-foreground mb-8">
              Start with the online course today, or choose a complete package with hands-on workshop.
            </p>
            <Link
              href="/pricing"
              className="btn-primary px-10 py-5 rounded-xl text-lg inline-flex items-center gap-2"
            >
              See Pricing & Enrol
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-xs text-muted-foreground mt-4">
              Secure checkout · Multiple payment options available
            </p>
            <div className="flex items-center justify-center gap-3 mt-3 text-xs text-muted-foreground">
              <span>Afterpay</span>
              <span>·</span>
              <span>Klarna</span>
              <span>·</span>
              <span>Cards</span>
              <span>·</span>
              <span>Apple Pay</span>
            </div>
          </div>
        </div>
      </section>

      {/* Your Facilitators */}
      <section className="section-padding">
        <div className="container-md px-6 md:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight">
              Your Facilitators
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              Learn from clinicians with real-world concussion management experience
            </p>
          </div>

          <div className="space-y-5 max-w-3xl mx-auto">
            {/* Zac Lewis */}
            <div className="glass rounded-2xl p-6 md:p-8" style={{ borderWidth: '2px', borderImage: 'linear-gradient(135deg, rgba(13,115,119,0.3), rgba(91,154,166,0.1)) 1' }}>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#64a8b0] to-[#5b9aa6] flex items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-xl font-bold text-white">ZL</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-1 tracking-tight text-center sm:text-left">Zac Lewis</h3>
                  <p className="text-sm font-semibold text-accent mb-3 text-center sm:text-left">
                    Osteopath · Founder
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Zac is a registered Osteopath with over a decade of clinical experience specialising in neurological health, rehabilitation, and concussion management. His career includes work with national and professional ice hockey leagues across New Zealand and Canada, where he developed deep expertise in acute and long-term concussion care. An experienced clinical mentor, Zac has supervised numerous early-career clinicians in applying evidence-based neurological and musculoskeletal care. His current research focuses on developing improved diagnostic and prognostic tools for concussion management.
                  </p>
              <div className="mt-4 flex items-center justify-end gap-2">
                <span className="text-[11px] font-medium text-muted-foreground">Member, Sports Medicine Australia</span>
                <Image src="/sma-member-2026.png" alt="Sports Medicine Australia — Member 2026" width={225} height={99} className="h-8 w-auto opacity-90" />
              </div>
                </div>
              </div>
            </div>

            {/* Dr Peter Corredig */}
            <div className="glass rounded-2xl p-6 md:p-8" style={{ borderWidth: '2px', borderImage: 'linear-gradient(135deg, rgba(13,115,119,0.3), rgba(91,154,166,0.1)) 1' }}>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#5b9aa6] to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-xl font-bold text-white">PC</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-1 tracking-tight text-center sm:text-left">Dr Peter Corredig</h3>
                  <p className="text-sm font-semibold text-accent mb-3 text-center sm:text-left">
                    MBBS, FRACGP, Diploma of Child Health &middot; General Practitioner
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Dr Corredig is a GP based in Victoria with a broad clinical interest spanning musculoskeletal health, sports medicine, and children&apos;s health. He has developed a strong interest in concussion assessment and management, particularly in community and grassroots sport settings. Peter has worked closely with local sporting clubs supporting athletes through return-to-play assessments and concussion management protocols, and is an experienced educator who has delivered teaching sessions for GP colleagues and registrars on concussion recognition and clinical decision-making.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="section-padding bg-muted/30">
        <div className="container-lg px-6 md:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 tracking-tight">
              Trusted by Australian clinicians
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                quote: 'Well organised...content explained in a way that was relevant and memorable',
                author: 'Alex, Osteopath, Melbourne',
                initials: 'A',
                bgColor: 'from-[#64a8b0] to-[#7ba8b0]',
              },
              {
                quote: 'Relevant, applicable and easy to absorb. A must for any clinician managing concussion',
                author: 'Sarah, Physiotherapist',
                initials: 'S',
                bgColor: 'from-[#7ba8b0] to-emerald-500',
              },
              {
                quote: 'Incredibly thorough and well structured...hands on component was invaluable',
                author: 'Amelia, Physiotherapist',
                initials: 'A',
                bgColor: 'from-[#5b9aa6] to-indigo-500',
              },
            ].map((testimonial, index) => (
              <div key={index} className="glass rounded-xl p-6">
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed italic">
                  &quot;{testimonial.quote}&quot;
                </p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${testimonial.bgColor} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                    <span className="text-sm font-bold text-white">{testimonial.initials}</span>
                  </div>
                  <div className="text-sm font-semibold text-foreground">{testimonial.author}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}
