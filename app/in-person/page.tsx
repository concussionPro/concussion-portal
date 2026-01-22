'use client'

import { useRouter } from 'next/navigation'
import { Clock, MapPin, Users, Award, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react'
import { CONFIG } from '@/lib/config'
import { BreadcrumbSchema } from '@/components/SchemaMarkup'

export default function InPersonTrainingPage() {
  const router = useRouter()

  return (
    <>
      <BreadcrumbSchema items={[
        { name: 'Home', url: '/' },
        { name: 'In-Person Training', url: '/in-person' },
      ]} />

      <div className="min-h-screen bg-background">
        {/* Header */}
        <nav className="glass border-b border-border/30">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="text-xl font-bold"
            >
              Concussion<span className="text-gradient">Pro</span>
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/preview')}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Course Preview
              </button>
              <a
                href={CONFIG.SHOP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary px-6 py-2 rounded-lg text-sm font-semibold"
              >
                Enroll Now
              </a>
            </div>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-6 py-16">
          {/* Hero */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-4">
              <Award className="w-4 h-4 text-accent" />
              <span className="text-sm font-semibold text-accent">6 AHPRA CPD Hours</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Full-Day Practical <span className="text-gradient">Workshop</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Hands-on clinical assessment training with expert feedback in small groups
            </p>
          </div>

          {/* Key Info Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-12">
            <div className="glass rounded-xl p-5 text-center">
              <Clock className="w-8 h-8 text-accent mx-auto mb-2" />
              <h3 className="font-bold mb-1">Duration</h3>
              <p className="text-sm text-muted-foreground">8:00 AM - 4:00 PM</p>
            </div>
            <div className="glass rounded-xl p-5 text-center">
              <Users className="w-8 h-8 text-accent mx-auto mb-2" />
              <h3 className="font-bold mb-1">Group Size</h3>
              <p className="text-sm text-muted-foreground">Max 12 participants</p>
            </div>
            <div className="glass rounded-xl p-5 text-center">
              <MapPin className="w-8 h-8 text-accent mx-auto mb-2" />
              <h3 className="font-bold mb-1">Locations</h3>
              <p className="text-sm text-muted-foreground">Melb · Syd · Byron Bay</p>
            </div>
          </div>

          {/* Workshop Focus */}
          <div className="glass rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Workshop Focus</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              This intensive full-day practical workshop builds on the 8 online modules you'll complete beforehand.
              You'll practice hands-on clinical assessment techniques with live instructor feedback in small groups.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">SCAT6 & Child SCAT6 Application</h4>
                  <p className="text-sm text-muted-foreground">
                    Standardized administration, symptom evaluation, cognitive screening, and balance assessment.
                    Practice red flag identification and scoring interpretation.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">Vestibular-Ocular Motor Screening (VOMS)</h4>
                  <p className="text-sm text-muted-foreground">
                    Hands-on practice with smooth pursuit, saccades, VOR testing, and convergence assessment.
                    Learn to differentiate vestibular, ocular, and cervicogenic symptoms.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">Balance Error Scoring System (BESS)</h4>
                  <p className="text-sm text-muted-foreground">
                    Practical balance testing across multiple stances and surfaces. Recognize error patterns
                    and apply findings to return-to-activity clearance decisions.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">Cranial Nerve & Cervical Assessment</h4>
                  <p className="text-sm text-muted-foreground">
                    Physical examination techniques for concussion-related deficits. Cervical flexion-rotation
                    testing and integration with vestibular findings.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">Clinical Case Simulations</h4>
                  <p className="text-sm text-muted-foreground">
                    Work through complex presentations: mixed phenotypes, persistent symptoms, pediatric cases.
                    Practice clinical decision-making and documentation.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">Clinical Integration</h4>
                  <p className="text-sm text-muted-foreground">
                    Putting it all together: assessment workflows, return-to-activity protocols,
                    documentation templates, and medicolegal considerations.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* What to Bring / What's Provided */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">What to Bring</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-1">•</span>
                  <span>Completed online modules (8 modules)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-1">•</span>
                  <span>Comfortable clothing for practical exercises</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-1">•</span>
                  <span>Lunch and water bottle</span>
                </li>
              </ul>
            </div>

            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">What's Provided</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-1">•</span>
                  <span>All assessment equipment and testing materials</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-1">•</span>
                  <span>High-quality printed workbook</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-1">•</span>
                  <span>SCAT6, Child SCAT6, VOMS, BESS protocols</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-1">•</span>
                  <span>Clinical templates and reference materials</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-1">•</span>
                  <span>Certificate of completion (14 CPD hours total after workshop)</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Locations */}
          <div className="glass rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">Choose Your Location</h2>
            <div className="space-y-4">
              {Object.values(CONFIG.LOCATIONS).map((location) => (
                <div key={location.city} className="flex items-center justify-between p-4 rounded-xl border-2 border-border/30 hover:border-accent/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-accent" />
                    <div>
                      <h4 className="font-bold">{location.city}</h4>
                      <p className="text-sm text-muted-foreground">{location.date}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-accent bg-accent/10 px-3 py-1 rounded-full">
                    Available
                  </span>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Venue details will be emailed to enrolled participants 2 weeks prior to workshop date.
            </p>
          </div>

          {/* CTA */}
          <div className="glass rounded-2xl p-8 text-center bg-gradient-to-br from-accent/5 to-transparent">
            <h2 className="text-2xl font-bold mb-3">
              Ready to Master Hands-On Assessment?
            </h2>
            <p className="text-muted-foreground mb-6">
              One enrollment includes 8 online modules + this full-day practical workshop
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={CONFIG.SHOP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary px-10 py-4 rounded-xl text-base font-bold inline-flex items-center gap-2 shadow-xl"
              >
                <Sparkles className="w-5 h-5" />
                Enroll Now - $1,190
                <ArrowRight className="w-5 h-5" />
              </a>
              <button
                onClick={() => router.push('/preview')}
                className="btn-secondary px-8 py-4 rounded-xl text-base font-bold inline-flex items-center gap-2"
              >
                View Course Preview
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              14 total AHPRA CPD hours · Lifetime online access · Flexible workshop scheduling
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
