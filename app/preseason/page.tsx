'use client'

import Link from 'next/link'
import { ArrowRight, ClipboardList, Share2, FileText, Shield, Brain, Users, CheckCircle2 } from 'lucide-react'
import { CONFIG } from '@/lib/config'
import { SiteNav } from '@/components/SiteNav'

export default function PreseasonLandingPage() {

  return (
    <div className="min-h-screen bg-background relative">
      <div className="mesh-gradient" aria-hidden="true" />
      <div className="noise-overlay" aria-hidden="true" />

      <SiteNav />

      {/* Hero */}
      <section className="section-padding pt-[120px] pb-8 relative z-10">
        <div className="container-lg px-6 md:px-8 text-center">
          <div className="animate-fade-in max-w-3xl mx-auto">
            <div className="badge mb-5">
              <Shield className="w-4 h-4 mr-2" aria-hidden="true" />
              Free for Clinics — No Account Required
            </div>

            <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight leading-[1.15]">
              Pre-Season Baseline Testing
              <br />
              <span className="text-gradient text-4xl md:text-6xl">
                Made Simple
              </span>
            </h1>

            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-6 leading-relaxed">
              Let athletes self-administer the SCAT6 baseline remotely. No appointment needed.
              Reports are emailed to your clinic, and basic test records are stored for repeat-test tracking.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
              <Link
                href="/preseason/register"
                className="btn-primary px-10 py-4 rounded-xl text-base font-bold flex items-center gap-2 w-full sm:w-auto shadow-2xl"
              >
                Register Your Clinic
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </Link>
            </div>

            <Link
              href="/preseason/b/DEMO00"
              className="text-sm text-orange-600 font-semibold hover:underline underline-offset-4 transition-colors px-4 py-2 rounded-lg bg-orange-50 border border-orange-200 shadow-[0_0_12px_rgba(249,115,22,0.3)] hover:shadow-[0_0_18px_rgba(249,115,22,0.45)]"
            >
              Try the test yourself first →
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works - 3 Steps */}
      <section className="section-padding py-12 relative z-10">
        <div className="container-lg px-6 md:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 tracking-tight">
            How It <span className="text-gradient">Works</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                icon: ClipboardList,
                step: '1',
                title: 'Register Your Clinic',
                description: 'Enter your clinic name and email. Get a unique link in seconds — completely free.',
                color: 'from-blue-500 to-cyan-500',
              },
              {
                icon: Share2,
                step: '2',
                title: 'Share With Clubs',
                description: 'Send the link to your sports clubs and teams. Athletes complete the baseline on their phone or computer.',
                color: 'from-cyan-500 to-teal-500',
              },
              {
                icon: FileText,
                step: '3',
                title: 'Receive Reports',
                description: 'A PDF report with full SCAT6 baseline scores is emailed to your clinic for each athlete.',
                color: 'from-teal-500 to-emerald-500',
              },
            ].map((item) => (
              <div key={item.step} className="glass rounded-2xl p-6 text-center">
                <div className={`w-14 h-14 rounded-xl mx-auto mb-4 bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                  <item.icon className="w-7 h-7 text-white" strokeWidth={2} />
                </div>
                <div className="text-xs font-bold text-accent mb-2">STEP {item.step}</div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included in the Baseline */}
      <section className="section-padding py-12 relative z-10 bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
        <div className="container-lg px-6 md:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-3 tracking-tight">
            What the Baseline <span className="text-gradient">Covers</span>
          </h2>
          <p className="text-center text-muted-foreground mb-8 max-w-xl mx-auto">
            Self-administered sections of the SCAT6, matching the official assessment tool
          </p>

          <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {[
              { title: 'Symptom Evaluation', desc: 'All 22 symptoms rated 0-6, symptom number and severity score' },
              { title: 'Orientation', desc: 'Month, date, day of week, year, and time assessment' },
              { title: 'Immediate Memory', desc: '10-word recall using standard SCAT6 word lists' },
              { title: 'Concentration', desc: 'Digits backward and months in reverse order' },
              { title: 'Delayed Recall', desc: '10-word recall after minimum 5-minute delay' },
              { title: 'Medical History', desc: 'Concussion history, medical conditions, current medications' },
            ].map((item) => (
              <div key={item.title} className="glass rounded-xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6 max-w-lg mx-auto">
            Sections requiring clinical observation (balance testing, coordination, cervical spine, GCS) are excluded and noted on the report.
          </p>
        </div>
      </section>

      {/* Why It Matters / Value Prop */}
      <section className="section-padding py-12 relative z-10">
        <div className="container-lg px-6 md:px-8">
          <div className="glass rounded-2xl p-8 md:p-10 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">
                Why Baseline Testing Matters
              </h2>
            </div>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              Without a pre-injury baseline, clinicians are comparing a concussed athlete's scores to population norms — not their own normal. A baseline lets you detect subtle deficits that normative data would miss.
            </p>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              The problem? Athletes rarely commit to booking a clinic appointment for baseline testing. This tool removes that barrier — athletes complete it on their own time, and you get the data you need.
            </p>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="glass rounded-xl p-3">
                <div className="text-2xl font-bold text-gradient">5 min</div>
                <div className="text-xs text-muted-foreground">Athlete completion</div>
              </div>
              <div className="glass rounded-xl p-3">
                <div className="text-2xl font-bold text-gradient">$0</div>
                <div className="text-xs text-muted-foreground">Completely free</div>
              </div>
              <div className="glass rounded-xl p-3">
                <div className="text-2xl font-bold text-gradient">PDF</div>
                <div className="text-xs text-muted-foreground">Emailed to you</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Free Course CTA */}
      <section className="py-12 bg-gradient-to-br from-blue-400 via-teal-400 to-emerald-400 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10" />
        <div className="container-lg px-6 md:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-4">
              100% FREE — No Credit Card Required
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Know How to Use the Baseline When It Matters
            </h2>
            <p className="text-base md:text-lg mb-6 text-white/90 max-w-xl mx-auto">
              Collecting baselines is step one. Our free SCAT6/SCOAT6 Mastery course teaches you how to properly administer and interpret every section — so when an athlete gets hurt, you'll know exactly what to do.
            </p>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/20 max-w-lg mx-auto text-left">
              <h3 className="font-bold text-lg mb-3 text-center">Free SCAT6 Mastery Includes:</h3>
              <ul className="space-y-2 text-sm">
                {[
                  'Step-by-step SCAT6 & SCOAT6 training (every section)',
                  'Fillable, auto-scoring SCAT6 & SCOAT6 forms',
                  'Clinical toolkit: referral letters, parent handouts, RTP forms',
                  'Knowledge quiz to identify your gaps',
                  'Certificate of completion included',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/scat-mastery"
                className="bg-white text-teal-600 px-8 py-4 rounded-xl text-lg font-bold hover:bg-teal-50 transition-all shadow-2xl flex items-center gap-2 w-full sm:w-auto"
              >
                Get Free Course
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href={CONFIG.SHOP_URL}
                className="bg-white/10 backdrop-blur-sm text-white border-2 border-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-white/20 transition-all flex items-center gap-2 w-full sm:w-auto"
              >
                Explore Full Course
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-padding py-12 relative z-10">
        <div className="container-md px-6 md:px-8 text-center">
          <div className="glass rounded-2xl p-8 md:p-10 bg-gradient-to-br from-blue-600/5 to-teal-600/5">
            <div className="icon-container w-14 h-14 mx-auto mb-5">
              <Users className="w-7 h-7 text-accent" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight">
              Ready to get started?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Register your clinic in 30 seconds and start collecting baselines from your sports club athletes today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/preseason/register"
                className="btn-primary px-10 py-4 rounded-xl text-base font-bold inline-flex items-center gap-2 w-full sm:w-auto"
              >
                Register Your Clinic
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/pricing"
                className="px-8 py-4 rounded-xl text-base font-semibold text-accent border-2 border-accent/20 hover:bg-accent/5 transition-all inline-flex items-center gap-2 w-full sm:w-auto"
              >
                View Full Course ({CONFIG.COURSE.TOTAL_CPD_POINTS} CPD pts)
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer rendered by FooterWrapper in root layout */}
    </div>
  )
}
