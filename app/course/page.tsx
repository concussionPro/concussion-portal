'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { CONFIG } from '@/lib/config'
import { SiteNav } from '@/components/SiteNav'

const locations = Object.values(CONFIG.LOCATIONS)
  .filter(loc => loc.status === 'confirmed' && loc.date)
  .map(loc => ({
    city: loc.city,
    date: loc.date,
    availability: 'Available',
    shopUrl: '/pricing'
  }))

const included = [
  { icon: BookOpen, title: '8 Online Modules', desc: 'Self-paced expert training' },
  { icon: Calendar, title: 'Full-Day Skills Training', desc: 'Full-day practical SCAT6, VOMS, BESS' },
  { icon: Award, title: '14 CPD Points', desc: 'AHPRA aligned' },
  { icon: FileText, title: 'Clinical Resources', desc: 'Templates & frameworks' },
  { icon: Users, title: 'Expert Support', desc: 'Direct instructor access' },
  { icon: Brain, title: 'Lifetime Access', desc: 'Ongoing material updates' },
]

export default function CoursePage() {
  const router = useRouter()
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedShopUrl, setSelectedShopUrl] = useState<string | null>(null)
  const [pricingTier, setPricingTier] = useState<'early' | 'standard'>('early')

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      {/* Hero */}
      <section className="section-padding pt-[80px]">
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
              <div className="text-3xl md:text-4xl font-bold text-gradient mb-2">14</div>
              <div className="text-xs text-muted-foreground font-medium">CPD Points</div>
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
              What's included
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

      {/* Pricing */}
      <section className="section-padding">
        <div className="container-md px-6 md:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight">
              Investment in clinical excellence
            </h2>
            <p className="text-base text-muted-foreground">Choose your enrollment tier</p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {/* Early Bird */}
            <div
              onClick={() => setPricingTier('early')}
              className={`glass glass-hover rounded-2xl p-7 cursor-pointer transition-all ${
                pricingTier === 'early'
                  ? 'ring-2 ring-accent shadow-lg'
                  : 'ring-1 ring-transparent'
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-foreground tracking-tight">Early Bird</h3>
                {pricingTier === 'early' && (
                  <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  </div>
                )}
              </div>

              <div className="mb-6">
                <div className="text-4xl font-bold text-gradient mb-2">${CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Book 4+ weeks in advance</div>
              </div>

              <ul className="space-y-3">
                {[
                  'Full access to 8 online modules',
                  '1-day practical training',
                  '14 AHPRA CPD points',
                  'All clinical resources',
                  'Lifetime platform access',
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm">
                    <Check className="w-4 h-4 text-accent flex-shrink-0" strokeWidth={2.5} />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Standard */}
            <div
              onClick={() => setPricingTier('standard')}
              className={`glass glass-hover rounded-2xl p-7 cursor-pointer transition-all ${
                pricingTier === 'standard'
                  ? 'ring-2 ring-accent shadow-lg'
                  : 'ring-1 ring-transparent'
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-foreground tracking-tight">Standard</h3>
                {pricingTier === 'standard' && (
                  <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  </div>
                )}
              </div>

              <div className="mb-6">
                <div className="text-4xl font-bold text-foreground mb-2">${CONFIG.COURSE.PRICE_REGULAR.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Book less than 4 weeks advance</div>
              </div>

              <ul className="space-y-3">
                {[
                  'Full access to 8 online modules',
                  '1-day practical training',
                  '14 AHPRA CPD points',
                  'All clinical resources',
                  'Lifetime platform access',
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm">
                    <Check className="w-4 h-4 text-accent flex-shrink-0" strokeWidth={2.5} />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
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
              <div
                key={location.city}
                onClick={() => {
                  setSelectedLocation(location.city)
                  setSelectedDate(location.date)
                  setSelectedShopUrl(location.shopUrl)
                }}
                className={`glass glass-hover rounded-2xl p-6 cursor-pointer transition-all ${
                  selectedLocation === location.city
                    ? 'ring-2 ring-accent shadow-lg'
                    : 'ring-1 ring-transparent'
                }`}
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

                  <div className="flex items-center gap-3">
                    <span
                      className={`badge ${
                        location.availability === 'Limited spots'
                          ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          : ''
                      }`}
                    >
                      {location.availability}
                    </span>
                    {selectedLocation === location.city && (
                      <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
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
                  Life gets busy. Once enrolled, you get lifetime access to all online modules and can
                  reschedule your workshop to any future date or location at no extra cost. Start the
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
              Ready to enroll?
            </h2>

            {selectedLocation && selectedDate && selectedShopUrl ? (
              <>
                <div className="glass rounded-xl p-5 mb-6 max-w-md mx-auto">
                  <div className="text-sm text-muted-foreground mb-2">Your selection</div>
                  <div className="text-xl font-semibold text-foreground mb-1">
                    {selectedLocation} — {selectedDate}
                  </div>
                  <div className="text-3xl font-bold text-gradient mt-3">
                    ${pricingTier === 'early' ? CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString() : CONFIG.COURSE.PRICE_REGULAR.toLocaleString()}
                  </div>
                  {pricingTier === 'early' && (
                    <p className="text-xs text-[#6b9da8] font-medium mt-2">
                      Save ${CONFIG.COURSE.SAVINGS} with early bird pricing
                    </p>
                  )}
                </div>

                <button
                  onClick={() => router.push('/pricing')}
                  className="btn-primary px-10 py-5 rounded-xl text-lg inline-flex items-center gap-2"
                >
                  Complete enrollment
                  <ArrowRight className="w-5 h-5" />
                </button>

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
              </>
            ) : (
              <>
                <p className="text-lg text-muted-foreground mb-8">
                  Select a location and pricing tier above
                </p>
                <button
                  onClick={() => window.scrollTo({ top: 600, behavior: 'smooth' })}
                  className="btn-secondary px-8 py-4 rounded-xl text-base inline-flex items-center gap-2"
                >
                  Choose options
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Your Instructor */}
      <section className="section-padding">
        <div className="container-md px-6 md:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight">
              Your Instructor
            </h2>
          </div>
          <div className="glass rounded-2xl p-8 md:p-10 max-w-2xl mx-auto" style={{ borderWidth: '2px', borderImage: 'linear-gradient(135deg, rgba(13,115,119,0.3), rgba(91,154,166,0.1)) 1' }}>
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#64a8b0] to-[#5b9aa6] flex items-center justify-center flex-shrink-0 shadow-lg">
                <span className="text-2xl font-bold text-white">ZL</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-1 tracking-tight text-center sm:text-left">Zac Lewis</h3>
                <p className="text-sm font-semibold text-accent mb-3 text-center sm:text-left">Osteopath, B.Clin.Sci., M.Ost.Med</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Founder of Concussion Education Australia. Zac developed this training to bridge the gap between concussion research and clinical practice — giving allied health professionals the confidence and competence to manage concussion cases from sideline to return-to-play.
                </p>
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
                quote: 'Well organised...content explained in a way that was relative and memorable',
                author: 'Alex, Melbourne Osteopath',
                initials: 'A',
                bgColor: 'from-[#64a8b0] to-[#7ba8b0]',
              },
              {
                quote: 'Great for accurate diagnosis and skill for concussion management',
                author: 'Sarah, Osteopath',
                initials: 'S',
                bgColor: 'from-[#7ba8b0] to-emerald-500',
              },
              {
                quote: 'Comprehensive and content rich',
                author: 'NSW Physiotherapist',
                initials: 'NP',
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
