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
              <button
                onClick={() => router.push('/preview')}
                className="btn-primary px-6 py-2 rounded-lg text-sm font-semibold"
              >
                Enroll Now
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-6 py-16">
          {/* Hero */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-4">
              <Award className="w-4 h-4 text-accent" />
              <span className="text-sm font-semibold text-accent">6 CPD points - AHPRA Aligned · Limited Spots</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Master Clinical Assessment <span className="text-gradient">You Can't Learn Online</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              <strong className="text-foreground">Theory isn't enough.</strong> This intensive hands-on workshop gives you the clinical confidence to accurately assess, phenotype, and manage concussions from day one.
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
            <h2 className="text-2xl font-bold mb-4 text-gradient">Critical Clinical Skills You'll Master</h2>
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-amber-900 font-semibold">
                ⚠️ <strong>Reading about assessment isn't the same as performing it.</strong> This workshop bridges the gap between theoretical knowledge and clinical competence through intensive hands-on practice with expert feedback.
              </p>
            </div>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              <strong className="text-foreground">You can't master these techniques from a textbook.</strong> This full-day workshop gives you live, supervised practice with standardized protocols, immediate feedback, and real-world case simulations—building the clinical confidence that separates competent practitioners from the rest.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">In-Depth Neurological Screening</h4>
                  <p className="text-sm text-muted-foreground">
                    Master SCAT6 and Child SCAT6 administration with confidence. Practice immediate post-injury assessment protocols, symptom severity grading, cognitive screening (orientation, immediate/delayed memory, concentration), and red flag identification. <strong className="text-foreground">Critical for accurate diagnosis and medicolegal documentation.</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">Concussion-Specific Cranial Nerve Examination</h4>
                  <p className="text-sm text-muted-foreground">
                    Learn targeted cranial nerve assessments essential for concussion phenotyping: CN II (visual field defects, accommodation), CN III/IV/VI (extraocular movements, convergence insufficiency), CN V (sensory changes, jaw deviation), CN VIII (vestibular function, nystagmus), and CN XI (cervical involvement). <strong className="text-foreground">These subtle findings often differentiate concussion subtypes and guide treatment.</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">Vestibular-Ocular Motor Screening (VOMS)</h4>
                  <p className="text-sm text-muted-foreground">
                    Hands-on practice with smooth pursuit, horizontal/vertical saccades, VOR (horizontal/vertical), VMS, and near point of convergence. Learn to identify vestibular vs oculomotor dysfunction, quantify symptom provocation, and integrate findings with balance testing. <strong className="text-foreground">Essential for phenotyping and predicting prolonged recovery.</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">Advanced Oculomotor Assessment</h4>
                  <p className="text-sm text-muted-foreground">
                    Master convergence testing (near point of convergence, accommodative facility), smooth pursuit tracking quality, saccadic accuracy and latency, and vestibulo-ocular reflex integrity. Identify oculomotor subtype presentations and understand their impact on return-to-learn protocols. <strong className="text-foreground">These deficits are frequently missed yet critical for academic accommodations.</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">Balance Error Scoring System (BESS)</h4>
                  <p className="text-sm text-muted-foreground">
                    Standardized balance testing across double-leg, single-leg, and tandem stances on firm and foam surfaces. Practice error recognition, scoring consistency, and integration with mBESS for sideline assessment. <strong className="text-foreground">Objective balance data is essential for return-to-sport clearance and risk stratification.</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">Cervicogenic Assessment & Integration</h4>
                  <p className="text-sm text-muted-foreground">
                    Physical examination of cervical spine dysfunction that mimics or complicates concussion: flexion-rotation test, segmental palpation, upper cervical instability screening, and proprioceptive testing. Differentiate cervicogenic dizziness from vestibular pathology. <strong className="text-foreground">Up to 90% of concussions have concomitant cervical involvement—missing this delays recovery.</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">Dual-Task & Multi-Modal Testing</h4>
                  <p className="text-sm text-muted-foreground">
                    Advanced assessment combining cognitive, motor, and vestibular challenges: dual-task gait testing, cognitive-motor interference paradigms, and sport-specific return-to-play protocols. Learn to identify persistent deficits hidden by single-domain testing. <strong className="text-foreground">Athletes can compensate on basic tests but fail under dual-task conditions—this is where re-injury happens.</strong>
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
          <div className="glass rounded-2xl p-8 text-center bg-gradient-to-br from-accent/5 to-transparent border-2 border-accent/20">
            <div className="inline-flex items-center gap-2 bg-red-100 border border-red-300 text-red-800 px-4 py-2 rounded-full mb-4">
              <span className="text-sm font-bold">🔥 Limited to 12 Participants Per Workshop</span>
            </div>
            <h2 className="text-3xl font-bold mb-3">
              Stop Guessing. Start Assessing with <span className="text-gradient">Confidence.</span>
            </h2>
            <p className="text-muted-foreground mb-4 leading-relaxed max-w-2xl mx-auto">
              <strong className="text-foreground">Your patients deserve accurate assessment.</strong> This intensive workshop gives you the hands-on skills, clinical judgment, and assessment confidence you can't get from online learning alone.
            </p>
            <p className="text-sm text-muted-foreground mb-6 max-w-xl mx-auto">
              Complete 8 evidence-based online modules + full-day practical workshop. Walk away ready to confidently assess, phenotype, and manage concussions from day one.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => router.push('/preview')}
                className="btn-primary px-10 py-4 rounded-xl text-base font-bold inline-flex items-center gap-2 shadow-xl hover:scale-105 transition-transform"
              >
                <Sparkles className="w-5 h-5" />
                Secure Your Spot - $1,190
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => router.push('/preview')}
                className="btn-secondary px-8 py-4 rounded-xl text-base font-bold inline-flex items-center gap-2"
              >
                View Course Preview
              </button>
            </div>
            <div className="mt-6 pt-6 border-t border-border/30">
              <p className="text-xs text-muted-foreground">
                ✓ 14 total AHPRA CPD hours (8 online + 6 in-person)<br/>
                ✓ Lifetime access to all online modules and clinical toolkit<br/>
                ✓ Small group sizes (max 12) for personalized feedback<br/>
                ✓ Choose your preferred location: Melbourne, Sydney, or Byron Bay
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
