'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Clock, MapPin, Users, Award, CheckCircle2, ArrowRight, Loader2, Mail } from 'lucide-react'
import Image from 'next/image'
import { CONFIG } from '@/lib/config'
import { BreadcrumbSchema } from '@/components/SchemaMarkup'
import { SiteNav } from '@/components/SiteNav'
import { trackInterestRegistration } from '@/lib/analytics'

export default function InPersonTrainingPage() {
  const [interestEmail, setInterestEmail] = useState('')
  const [interestName, setInterestName] = useState('')
  const [interestCity, setInterestCity] = useState('sydney')
  const [interestLoading, setInterestLoading] = useState(false)
  const [interestSuccess, setInterestSuccess] = useState<string | null>(null)
  const [interestError, setInterestError] = useState<string | null>(null)

  const handleInterest = async (e: React.FormEvent) => {
    e.preventDefault()
    setInterestLoading(true)
    setInterestError(null)
    try {
      const res = await fetch('/api/register-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: interestEmail, name: interestName, city: interestCity }),
      })
      const data = await res.json()
      if (data.success) {
        trackInterestRegistration(interestCity, interestEmail)
        setInterestSuccess(data.message)
        setInterestEmail('')
        setInterestName('')
        setInterestCity('sydney')
      } else {
        setInterestError(data.error || 'Something went wrong.')
      }
    } catch {
      setInterestError('Network error. Please try again.')
    } finally {
      setInterestLoading(false)
    }
  }

  return (
    <>
      <BreadcrumbSchema items={[
        { name: 'Home', url: '/' },
        { name: 'In-Person Training', url: '/in-person' },
      ]} />

      <div className="min-h-screen bg-background">
        <SiteNav />

        <div className="max-w-4xl mx-auto px-6 pt-[120px] pb-16">
          {/* Hero */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-4">
              <Award className="w-4 h-4 text-accent" />
              <span className="text-sm font-semibold text-accent">8 CPD hours - AHPRA Aligned · Limited Spots</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Master Clinical Assessment <span className="text-gradient">You Can&apos;t Learn Online</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              <strong className="text-foreground">Theory isn&apos;t enough.</strong> This intensive hands-on workshop gives you the clinical confidence to accurately assess, phenotype, and manage concussions from day one.
            </p>
          </div>

          {/* Workshop Photo */}
          <div className="relative rounded-2xl overflow-hidden mb-12 shadow-lg">
            <Image
              src="/workshop-training.jpg"
              alt="Hands-on vestibular-ocular assessment demonstration during a Concussion Education Australia workshop"
              width={1200}
              height={900}
              className="w-full h-auto"
              priority
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-6 py-4">
              <p className="text-white text-sm font-medium">Supervised clinical assessment practice — Concussion Education Australia workshop, 2025</p>
            </div>
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
              <p className="text-sm text-muted-foreground">Multiple AU Locations</p>
            </div>
          </div>

          {/* Workshop Focus */}
          <div className="glass rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gradient">Critical Clinical Skills You&apos;ll Master</h2>
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-amber-900 font-semibold">
                <strong>Assessment skills require hands-on practice.</strong> This workshop bridges the gap between theoretical knowledge and clinical competence through supervised practice with expert feedback.
              </p>
            </div>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              This full-day workshop provides supervised practice with standardized protocols, expert feedback, and clinical case simulations.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">In-Depth Neurological Screening</h4>
                  <p className="text-sm text-muted-foreground">
                    Master SCAT6 and Child SCAT6 administration. Practice immediate post-injury assessment protocols, symptom severity grading, cognitive screening (orientation, immediate/delayed memory, concentration), and red flag identification.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">Concussion-Specific Cranial Nerve Examination</h4>
                  <p className="text-sm text-muted-foreground">
                    Targeted cranial nerve assessments for concussion phenotyping: CN II (visual field defects, accommodation), CN III/IV/VI (extraocular movements, convergence insufficiency), CN V (sensory changes, jaw deviation), CN VIII (vestibular function, nystagmus), and CN XI (cervical involvement).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">Vestibular-Ocular Motor Screening (VOMS)</h4>
                  <p className="text-sm text-muted-foreground">
                    Hands-on practice with smooth pursuit, horizontal/vertical saccades, VOR (horizontal/vertical), VMS, and near point of convergence. Learn to identify vestibular vs oculomotor dysfunction, quantify symptom provocation, and integrate findings with balance testing.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">Advanced Oculomotor Assessment</h4>
                  <p className="text-sm text-muted-foreground">
                    Master convergence testing (near point of convergence, accommodative facility), smooth pursuit tracking quality, saccadic accuracy and latency, and vestibulo-ocular reflex integrity. Identify oculomotor subtype presentations and their implications for return-to-learn protocols.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">Balance Error Scoring System (BESS)</h4>
                  <p className="text-sm text-muted-foreground">
                    Standardized balance testing across double-leg, single-leg, and tandem stances on firm and foam surfaces. Practice error recognition, scoring consistency, and integration with mBESS for sideline assessment.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">Cervicogenic Assessment & Integration</h4>
                  <p className="text-sm text-muted-foreground">
                    Physical examination of cervical spine dysfunction that mimics or complicates concussion: flexion-rotation test, segmental palpation, upper cervical instability screening, and proprioceptive testing. Differentiate cervicogenic dizziness from vestibular pathology.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">Dual-Task & Multi-Modal Testing</h4>
                  <p className="text-sm text-muted-foreground">
                    Advanced assessment combining cognitive, motor, and vestibular challenges: dual-task gait testing, cognitive-motor interference paradigms, and sport-specific return-to-play protocols. Learn to identify persistent deficits that single-domain testing may not reveal.
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

          {/* What's Provided */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">What&apos;s Provided</h3>
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
                  <span>Certificate of completion (16 CPD hours total after workshop)</span>
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
                      <p className="text-sm text-muted-foreground">
                        {location.status === 'confirmed' && location.date
                          ? location.date
                          : 'Date to be confirmed — register your interest below'}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${location.status === 'confirmed' ? 'text-accent bg-accent/10' : 'text-muted-foreground bg-muted'}`}>
                    {location.status === 'confirmed' ? 'Available' : 'Scheduling Now'}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Venue details will be emailed to enrolled participants 2 weeks prior to workshop date.
            </p>

            {/* City interest email capture */}
            <div className="mt-6 pt-6 border-t border-border/30">
              {interestSuccess ? (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <p className="text-sm text-emerald-800 font-medium">{interestSuccess}</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <Mail className="w-4 h-4 text-accent" />
                    <h4 className="text-sm font-bold text-foreground">Get notified when your city confirms</h4>
                  </div>
                  <form onSubmit={handleInterest} className="flex flex-col sm:flex-row gap-2">
                    <label htmlFor="interest-name" className="sr-only">Your name</label>
                    <input
                      id="interest-name"
                      type="text"
                      required
                      placeholder="Your name"
                      value={interestName}
                      onChange={(e) => setInterestName(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                    />
                    <label htmlFor="interest-email" className="sr-only">Email address</label>
                    <input
                      id="interest-email"
                      type="email"
                      required
                      placeholder="you@clinic.com.au"
                      value={interestEmail}
                      onChange={(e) => setInterestEmail(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                    />
                    <label htmlFor="interest-city" className="sr-only">Workshop city</label>
                    <select
                      id="interest-city"
                      value={interestCity}
                      onChange={(e) => setInterestCity(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                    >
                      <option value="sydney">Sydney</option>
                      <option value="melbourne">Melbourne</option>
                      <option value="byron-bay">Byron Bay</option>
                      <option value="adelaide">Adelaide</option>
                      <option value="wa">Perth / WA</option>
                    </select>
                    <button
                      type="submit"
                      disabled={interestLoading}
                      className="btn-primary px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {interestLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Notify Me'}
                    </button>
                  </form>
                  {interestError && <p className="text-xs text-red-600 mt-2">{interestError}</p>}
                </>
              )}
            </div>
          </div>

          {/* CTA */}
          <div className="glass rounded-2xl p-8 text-center bg-gradient-to-br from-accent/5 to-transparent border-2 border-accent/20">
            <div className="inline-flex items-center gap-2 bg-red-100 border border-red-300 text-red-800 px-4 py-2 rounded-full mb-4">
              <span className="text-sm font-bold">Limited to 12 Participants Per Workshop</span>
            </div>
            <h2 className="text-3xl font-bold mb-3">
              Build hands-on assessment <span className="text-gradient">competence.</span>
            </h2>
            <p className="text-muted-foreground mb-4 leading-relaxed max-w-2xl mx-auto">
              Practical skills training in SCAT6 administration, VOMS, BESS, and cervicogenic assessment — supervised by experienced clinicians.
            </p>
            <p className="text-sm text-muted-foreground mb-6 max-w-xl mx-auto">
              Complete 8 evidence-based online modules + full-day practical workshop. Walk away ready to confidently assess, phenotype, and manage concussions from day one.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/pricing"
                className="btn-primary px-10 py-4 rounded-xl text-base font-bold inline-flex items-center gap-2 shadow-xl hover:scale-105 transition-transform"
              >
                <Award className="w-5 h-5" />
                See Pricing & Options
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/preview"
                className="btn-secondary px-8 py-4 rounded-xl text-base font-bold inline-flex items-center gap-2"
              >
                View Course Preview
              </Link>
            </div>
            <div className="mt-6 pt-6 border-t border-border/30">
              <p className="text-xs text-muted-foreground">
                {CONFIG.COURSE.TOTAL_CPD_POINTS} total AHPRA CPD hours ({CONFIG.COURSE.ONLINE_CPD_POINTS} online + {CONFIG.COURSE.IN_PERSON_CPD_POINTS} in-person)<br/>
                Lifetime access to all online modules and clinical toolkit — content updated regularly<br/>
                Small group sizes (max 12) for personalized feedback
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
