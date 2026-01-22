'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, CheckCircle2, XCircle, AlertTriangle, Award, Target } from 'lucide-react'
import { CONFIG } from '@/lib/config'
import { BreadcrumbSchema } from '@/components/SchemaMarkup'

// 6 HARDEST clinical questions for free "Test Your Knowledge" assessment
const questions = [
  {
    id: 1,
    category: 'Vestibular Assessment',
    question: 'A patient has positive VOR (+4 dizziness) but negative smooth pursuit. C1-C2 flexion-rotation test is 28°. What is the PRIMARY phenotype requiring targeted intervention?',
    options: [
      'Vestibular-ocular only',
      'Cervicogenic only',
      'Mixed vestibular-cervicogenic with vestibular dominant',
      'Post-traumatic migraine'
    ],
    correct: 2,
    rationale: 'Requires understanding phenotype overlap and clinical prioritization based on symptom severity. This question tests integration of multiple assessment findings.'
  },
  {
    id: 2,
    category: 'Clinical Decision Making',
    question: 'Athlete is symptom-free at rest, completed 6-stage RTS protocol, but NPC is 8cm. Your clearance decision?',
    options: [
      'Clear for full return - protocol complete',
      'Withhold clearance - refer vision therapy first',
      'Clear with restrictions - no contact drills',
      'Repeat BESS testing before deciding'
    ],
    correct: 1,
    rationale: 'Convergence insufficiency (NPC >6cm) is an absolute contraindication to clearance regardless of symptom status. Missing this puts athletes at serious risk.'
  },
  {
    id: 3,
    category: 'Differential Diagnosis',
    question: 'Patient reports "dizziness" 3 weeks post-concussion. Which test definitively differentiates cervicogenic from vestibular etiology?',
    options: [
      'Dix-Hallpike maneuver',
      'Head-neck differentiation test (trunk rotation vs head rotation)',
      'BESS testing',
      'Spurling\'s test'
    ],
    correct: 1,
    rationale: 'Symptoms only with trunk rotation (head stationary) = cervical origin. Symptoms with head rotation = vestibular. This precise differential diagnosis is critical for targeted treatment.'
  },
  {
    id: 4,
    category: 'Cervical Assessment',
    question: 'Cervical flexion-rotation test shows 26° rotation right, 38° left. What does this indicate?',
    options: [
      'Normal - within expected asymmetry',
      'Right-sided C1-C2 dysfunction - likely cervicogenic headache',
      'Left-sided pathology',
      'Non-specific finding'
    ],
    correct: 1,
    rationale: '>10° asymmetry indicates C1-C2 dysfunction on the restricted side. Strongly correlates with cervicogenic headache. This tests precise interpretation of clinical measurements.'
  },
  {
    id: 5,
    category: 'Phenotype Management',
    question: 'Patient has PHQ-9 = 16 (moderate-severe depression) at 6 weeks post-concussion. Evidence-based intervention?',
    options: [
      'Wait for spontaneous recovery',
      'Exercise only',
      'Combination CBT + SSRI if indicated',
      'Strict rest'
    ],
    correct: 2,
    rationale: 'PHQ-9 ≥15 warrants combined CBT and pharmacotherapy. Untreated mood symptoms significantly prolong recovery and increase risk of persistent PCS.'
  },
  {
    id: 6,
    category: 'Prognostic Factors',
    question: 'Which factor is the STRONGEST predictor of persistent post-concussive symptoms (>4 weeks)?',
    options: [
      'Loss of consciousness >1 minute',
      'Female sex',
      'Pre-existing migraine disorder (3-5x increased risk)',
      'Mechanism of injury (MVA vs sport)'
    ],
    correct: 2,
    rationale: 'Pre-existing migraine is the strongest predictor (3-5x increased risk of prolonged recovery). Many commonly assumed injury factors are actually weak predictors. This tests evidence-based prognostic understanding.'
  }
]

export default function AssessmentPage() {
  const router = useRouter()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [showResults, setShowResults] = useState(false)

  const handleAnswer = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers]
    newAnswers[currentQuestion] = answerIndex
    setSelectedAnswers(newAnswers)
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      setShowResults(true)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const score = selectedAnswers.reduce((acc, answer, index) => {
    return acc + (answer === questions[index].correct ? 1 : 0)
  }, 0)

  const percentage = Math.round((score / questions.length) * 100)

  const categoryGaps = questions.reduce((acc, q, index) => {
    if (selectedAnswers[index] !== q.correct) {
      acc[q.category] = (acc[q.category] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  const topGaps = Object.entries(categoryGaps)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)

  if (showResults) {
    return (
      <div className="min-h-screen bg-background py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Score Display */}
            <div className="text-center mb-12">
              <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full mb-6 ${
                percentage >= 70 ? 'bg-accent/20' : percentage >= 40 ? 'bg-yellow-500/20' : 'bg-red-500/20'
              }`}>
                <div className={`text-5xl font-bold ${
                  percentage >= 70 ? 'text-accent' : percentage >= 40 ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  {percentage}%
                </div>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">
                <span className="text-gradient">
                  {percentage >= 70 ? 'Strong Foundation - Ready to Master' : percentage >= 40 ? 'Room for Growth Identified' : 'Excellent Opportunity to Upskill'}
                </span>
              </h1>

              <p className="text-base text-muted-foreground mb-6">
                You scored {score}/{questions.length}. {percentage < 70 && 'These areas offer the most opportunity for clinical development.'}
              </p>

              {percentage < 70 && (
                <div className="glass rounded-xl p-6 mb-6 text-left max-w-2xl mx-auto border-l-4 border-[#64a8b0]">
                  <div className="flex items-start gap-3 mb-3">
                    <AlertTriangle className="w-6 h-6 text-[#5b9aa6] flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-1">Key Learning Opportunities</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Focus your continuing education on these clinical areas to enhance patient outcomes:
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {topGaps.map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between glass rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-[#5b9aa6]" />
                          <span className="text-sm font-medium text-foreground">{category}</span>
                        </div>
                        <span className="text-sm text-[#5b9aa6] font-bold">{count} to review</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Course CTA */}
            <div className="glass rounded-2xl p-6 md:p-8 text-center bg-gradient-to-br from-[#5b9aa6]/5 to-[#6b9da8]/5">
              <h2 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight">
                <span className="text-gradient">
                  Master These Skills in 14 CPD Hours
                </span>
              </h2>
              <p className="text-sm md:text-base text-muted-foreground mb-3 max-w-2xl mx-auto leading-relaxed">
                Complete training: 8 online modules + full-day hands-on practical (SCAT6, VOMS, BESS).
                Master every assessment you missed above. Choose Melbourne, Sydney, or Byron Bay.
              </p>
              <button
                onClick={() => router.push('/in-person')}
                className="text-accent hover:underline text-sm font-semibold mb-5"
              >
                View workshop agenda →
              </button>

              <div className="grid grid-cols-4 gap-2 mb-5 max-w-2xl mx-auto">
                <div className="glass rounded-lg p-3">
                  <div className="text-lg font-bold text-gradient mb-1">8</div>
                  <div className="text-xs text-muted-foreground leading-tight">Online Modules</div>
                </div>
                <div className="glass rounded-lg p-3">
                  <div className="text-lg font-bold text-gradient mb-1">8</div>
                  <div className="text-xs text-muted-foreground leading-tight">Online CPD</div>
                </div>
                <div className="glass rounded-lg p-3">
                  <div className="text-lg font-bold text-gradient mb-1">6</div>
                  <div className="text-xs text-muted-foreground leading-tight">In-Person CPD</div>
                </div>
                <div className="glass rounded-lg p-3 border-2 border-accent/30">
                  <div className="text-lg font-bold text-accent mb-1">14</div>
                  <div className="text-xs font-semibold text-accent leading-tight">Total CPD</div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3">
                <a
                  href={CONFIG.SHOP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary px-10 py-4 rounded-xl text-base font-bold text-white inline-flex items-center gap-2 shadow-2xl"
                >
                  Enroll Now - $1,190
                  <ArrowRight className="w-5 h-5" />
                </a>
                <p className="text-xs text-muted-foreground">
                  Includes online modules + in-person training · Code <span className="font-bold text-accent bg-accent/10 px-2 py-1 rounded">SCAT6</span> saves $210
                </p>
              </div>
            </div>

            <div className="text-center mt-8">
              <button
                onClick={() => router.push('/')}
                className="text-sm text-muted-foreground hover:text-accent transition-colors"
              >
                ← Back to Home
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100
  const question = questions[currentQuestion]
  const hasAnswer = selectedAnswers[currentQuestion] !== undefined

  return (
    <>
      {/* Schema Markup for SEO */}
      <BreadcrumbSchema items={[
        { name: 'Home', url: '/' },
        { name: 'Free Skills Assessment', url: '/assessment' },
      ]} />

      <div className="min-h-screen bg-background py-20 px-6">
        <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <span className="text-sm font-medium text-accent">{Math.round(progress)}% Complete</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-accent"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="glass rounded-3xl p-10 mb-8"
          >
            <div className="inline-block glass px-4 py-2 rounded-full mb-6">
              <span className="text-xs font-medium text-accent">{question.category}</span>
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-8 leading-tight">
              {question.question}
            </h2>

            <div className="space-y-4">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  className={`w-full text-left p-6 rounded-xl transition-all ${
                    selectedAnswers[currentQuestion] === index
                      ? 'bg-accent/20 border-2 border-accent'
                      : 'glass hover:bg-secondary/50 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      selectedAnswers[currentQuestion] === index
                        ? 'border-accent bg-accent'
                        : 'border-muted-foreground/30'
                    }`}>
                      {selectedAnswers[currentQuestion] === index && (
                        <CheckCircle2 className="w-4 h-4 text-background" />
                      )}
                    </div>
                    <span className="text-base text-foreground leading-relaxed">{option}</span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="glass px-6 py-3 rounded-xl text-sm font-bold text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary/50 transition-colors"
          >
            Previous
          </button>

          <button
            onClick={handleNext}
            disabled={!hasAnswer}
            className="btn-primary px-8 py-3 rounded-xl text-sm font-bold text-foreground disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {currentQuestion === questions.length - 1 ? 'View Results' : 'Next Question'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      </div>
    </>
  )
}
