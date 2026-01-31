'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Download, Clock, Award, ArrowRight, Users, FileText, Brain, Shield, Zap } from 'lucide-react'
import { CONFIG } from '@/lib/config'

export default function SCATMasteryPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')

  const handleEnroll = () => {
    // TODO: Integrate with Stripe
    window.location.href = CONFIG.SHOP_URL
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white">
        <div className="max-w-6xl mx-auto px-4 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-4">
                🔥 Limited Time: $99 (Regular $197)
              </div>
              <h1 className="text-5xl font-bold mb-6 leading-tight">
                SCAT6/SCOAT6 Mastery + Clinical Toolkit
              </h1>
              <p className="text-xl mb-6 text-blue-100">
                Master concussion assessment in 2 hours. Get 100% confident for your next patient tomorrow.
              </p>
              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span className="font-semibold">2 CPD Hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  <span className="font-semibold">AHPRA Aligned</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span className="font-semibold">3,247+ Enrolled</span>
                </div>
              </div>
              <button
                onClick={handleEnroll}
                className="bg-white text-blue-700 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-50 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
              >
                Enroll Now - $99 (Save $98) →
              </button>
              <p className="text-sm mt-4 text-blue-100">
                💰 Your $99 fee is <strong>fully deducted</strong> from the full Hybrid Course using code <strong>SCAT99</strong>
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
              <h3 className="text-2xl font-bold mb-6">What You'll Get:</h3>
              <ul className="space-y-4">
                {[
                  'Digitally fillable, auto-scoring SCAT6 & SCOAT6 (2026 updated)',
                  'Step-by-step training on every section without missing red flags',
                  'Clinical toolkit: referral letters, parent handouts, RTP forms',
                  '2025 one-page cheat sheet for quick reference',
                  'Reality-check quiz showing your knowledge gaps',
                  'Certificate of completion (2 CPD hours)',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 flex-shrink-0 text-green-300" />
                    <span className="text-lg">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Problem/Solution Section */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">
            40% of Australian GPs Don't Feel Confident Managing Concussion
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Guidelines updated. SCAT-6 replaced SCAT-5. New red flag criteria. Stricter medicolegal requirements.
            <br /><br />
            <strong>Outdated protocols = liability.</strong> Get up to date in 2 hours.
          </p>
        </div>

        {/* The Golden Rule Visual */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">
          <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-8 h-8 text-blue-600" />
              <h3 className="text-2xl font-bold text-blue-900">SCAT6</h3>
            </div>
            <p className="text-lg font-semibold text-blue-800 mb-4">
              Sideline / Acute Tool
            </p>
            <ul className="space-y-2 text-slate-700">
              <li><strong>When:</strong> 0–72 hours post-injury (ideally &lt;30 min)</li>
              <li><strong>Where:</strong> Field, change room, acute rooms</li>
              <li><strong>Time:</strong> 10–15 minutes</li>
              <li><strong>Purpose:</strong> Immediate remove-from-play decision</li>
            </ul>
          </div>

          <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-8 h-8 text-purple-600" />
              <h3 className="text-2xl font-bold text-purple-900">SCOAT6</h3>
            </div>
            <p className="text-lg font-semibold text-purple-800 mb-4">
              Office / Clinic Tool
            </p>
            <ul className="space-y-2 text-slate-700">
              <li><strong>When:</strong> Day 1–7+ (structured clinic visits)</li>
              <li><strong>Where:</strong> Your clinic, GP rooms, concussion clinic</li>
              <li><strong>Time:</strong> 20–30 minutes</li>
              <li><strong>Purpose:</strong> Confirm diagnosis + plan RTP/RTL</li>
            </ul>
          </div>
        </div>

        {/* Legal Warning */}
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-8 mb-20">
          <div className="flex items-start gap-4">
            <Shield className="w-8 h-8 text-red-600 flex-shrink-0" />
            <div>
              <h3 className="text-2xl font-bold text-red-900 mb-4">
                Legal Implications You Can't Ignore
              </h3>
              <p className="text-lg text-slate-700 mb-4">
                The <strong>Berlin 2025 Consensus</strong> and <strong>Concussion in Sport Australia</strong> position statement explicitly state you must use the correct tool at the correct time.
              </p>
              <p className="text-lg text-slate-700">
                <strong>AHPRA, the AMA and every major sporting code have adopted it.</strong>
              </p>
              <p className="text-lg text-slate-900 font-bold mt-4">
                If a player suffers second-impact syndrome because you used SCOAT6 on the sideline (or never did proper office follow-up), the documentation trail will show you fell below standard of care.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Course Curriculum */}
      <div className="bg-slate-50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">
            Course Curriculum (2 Hours Total)
          </h2>

          <div className="space-y-6">
            {[
              {
                module: 'Module 1',
                title: 'Quick Guide & Medico-Legal',
                lessons: [
                  'SCAT6 vs SCOAT6 – Which Tool, When, and Why It Keeps You Safe',
                  'Medico-legal considerations'
                ],
                duration: '20 min'
              },
              {
                module: 'Module 2',
                title: 'Immediate / On-Field Assessment (SCAT6)',
                lessons: [
                  'Immediate / On-Field Assessment',
                  'Immediate management',
                  'Full Off-Field Immediate Assessment',
                  'SCAT6 Full Domain-by-Domain Walkthrough'
                ],
                duration: '35 min'
              },
              {
                module: 'Module 3',
                title: 'Clinical Use of SCOAT6',
                lessons: [
                  'Off-Field Clinical Serial Monitoring',
                  'Practical Clinic Essentials & Common Traps',
                  'SCOAT6 Full Domain-by-Domain Walkthrough'
                ],
                duration: '40 min'
              },
              {
                module: 'Module 4',
                title: 'Paediatric Concussion + Red Flags',
                lessons: [
                  'Paediatric Concussion (Child SCAT6 & Child SCOAT6)',
                  'Red Flags, Imaging & When to Refer'
                ],
                duration: '25 min'
              },
              {
                module: 'Knowledge Quiz',
                title: 'From SCAT to Synapses',
                lessons: [
                  'Reality-check quiz (deliberately tough)',
                  'Shows exactly where you have knowledge gaps'
                ],
                duration: '15 min'
              }
            ].map((mod, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-sm font-semibold text-blue-600 mb-1">{mod.module}</div>
                    <h3 className="text-xl font-bold text-slate-900">{mod.title}</h3>
                  </div>
                  <div className="bg-blue-50 px-4 py-2 rounded-lg">
                    <span className="text-sm font-semibold text-blue-700">{mod.duration}</span>
                  </div>
                </div>
                <ul className="space-y-2">
                  {mod.lessons.map((lesson, j) => (
                    <li key={j} className="flex items-center gap-3 text-slate-600">
                      <FileText className="w-4 h-4 text-slate-400" />
                      {lesson}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Toolkit Preview */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-12">
          Clinical Toolkit Included
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Download,
              title: 'Fillable Forms',
              desc: 'Auto-scoring SCAT6 & SCOAT6 PDFs (2026 updated)',
            },
            {
              icon: FileText,
              title: 'Templates',
              desc: 'Referral letters, parent handouts, RTP clearance forms',
            },
            {
              icon: Brain,
              title: 'Cheat Sheet',
              desc: '2025 one-page quick reference for desk/sideline',
            },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-xl p-8 shadow-sm border border-slate-200 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <item.icon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">{item.title}</h3>
              <p className="text-slate-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Social Proof */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-700 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Join 3,247 Australian Healthcare Professionals
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Using evidence-based concussion protocols aligned with anzconcussionguidelines.com
          </p>
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              { number: '3,247+', label: 'HCPs Trained' },
              { number: '2 Hours', label: 'To Mastery' },
              { number: '100%', label: 'AHPRA Aligned' },
            ].map((stat, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <div className="text-4xl font-bold mb-2">{stat.number}</div>
                <div className="text-blue-100">{stat.label}</div>
              </div>
            ))}
          </div>
          <button
            onClick={handleEnroll}
            className="bg-white text-blue-700 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-50 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
          >
            Enroll Now - $99 (Limited Time) →
          </button>
        </div>
      </div>

      {/* Guarantee */}
      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="bg-green-50 border-2 border-green-300 rounded-xl p-8 text-center">
          <h3 className="text-2xl font-bold text-green-900 mb-4">
            30-Day Money-Back Guarantee
          </h3>
          <p className="text-lg text-slate-700">
            Complete the course. If you're not 100% confident in your next concussion assessment, email us for a full refund. No questions asked.
          </p>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-slate-900 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Master Concussion Assessment?
          </h2>
          <p className="text-xl mb-8 text-slate-300">
            Get 100% confident for your next patient. 2 hours. 2 CPD points. $99.
          </p>
          <button
            onClick={handleEnroll}
            className="bg-blue-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition-all shadow-xl"
          >
            Enroll Now - Start Learning Today →
          </button>
          <p className="text-sm mt-6 text-slate-400">
            💰 Full $99 credit toward Hybrid Course with code SCAT99
          </p>
        </div>
      </div>
    </div>
  )
}
