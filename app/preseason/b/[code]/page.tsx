'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AlertCircle, ArrowLeft, ArrowRight, Check, Clock, Brain, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { WORD_LISTS, type WordListKey } from '@/app/scat-forms/shared/constants/wordLists'
import { DIGIT_LISTS, type DigitListKey } from '@/app/scat-forms/shared/constants/digitLists'

const SYMPTOMS = [
  'Headache', 'Pressure in head', 'Neck pain', 'Nausea or vomiting', 'Dizziness',
  'Blurred vision', 'Balance problems', 'Sensitivity to light', 'Sensitivity to noise',
  'Feeling slowed down', 'Feeling like in a fog', "Don't feel right",
  'Difficulty concentrating', 'Difficulty remembering', 'Fatigue or low energy',
  'Confusion', 'Drowsiness', 'More emotional', 'Irritability', 'Sadness',
  'Nervous or anxious', 'Trouble falling asleep',
]

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const MONTHS_REVERSED = [...MONTHS].reverse()

const MEDICAL_CONDITIONS = [
  { key: 'headacheDisorder', label: 'Headache disorder (e.g. migraine)' },
  { key: 'learningDisability', label: 'Learning disability / Dyslexia' },
  { key: 'adhd', label: 'ADHD' },
  { key: 'depressionAnxiety', label: 'Depression / Anxiety' },
  { key: 'otherPsychDisorder', label: 'Other psychiatric disorder' },
  { key: 'previousBrainSurgery', label: 'Previous brain surgery' },
]

function pickRandom<T extends string>(keys: T[]): T {
  return keys[Math.floor(Math.random() * keys.length)]
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildRecallPool(listKey: WordListKey): { word: string; isTarget: boolean }[] {
  const target = WORD_LISTS[listKey]
  const otherKeys = (['A', 'B', 'C'] as WordListKey[]).filter(k => k !== listKey)
  // Grab 5 distractors from the other lists (not overlapping with target)
  const targetSet = new Set<string>(target)
  const allOther = otherKeys.flatMap(k => [...WORD_LISTS[k]]).filter(w => !targetSet.has(w))
  const distractors = shuffle(allOther).slice(0, 5)
  const pool = [
    ...target.map(w => ({ word: w, isTarget: true })),
    ...distractors.map(w => ({ word: w, isTarget: false })),
  ]
  return shuffle(pool)
}

export default function AthleteBaselineForm() {
  const params = useParams()
  const router = useRouter()
  const code = (params.code as string)?.toUpperCase()

  // Clinic validation
  const [clinicName, setClinicName] = useState<string | null>(null)
  const [clinicError, setClinicError] = useState(false)
  const [loading, setLoading] = useState(true)

  // Form step
  const [step, setStep] = useState(1)
  const totalSteps = 5 // 4 steps + summary

  // Step 1: Athlete Background
  const [name, setName] = useState('')
  const [dob, setDob] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [sex, setSex] = useState('')
  const [dominantHand, setDominantHand] = useState('')
  const [sport, setSport] = useState('')
  const [team, setTeam] = useState('')
  const [position, setPosition] = useState('')
  const [yearsOfEducation, setYearsOfEducation] = useState('')
  const [primaryLanguage, setPrimaryLanguage] = useState('English')
  const [previousConcussions, setPreviousConcussions] = useState('0')
  const [mostRecentConcussionDate, setMostRecentConcussionDate] = useState('')
  const [longestRecovery, setLongestRecovery] = useState('')
  const [diagnosedMigraines, setDiagnosedMigraines] = useState(false)
  const [medicalHistory, setMedicalHistory] = useState<Record<string, boolean>>({})
  const [currentMedications, setCurrentMedications] = useState('')

  // Step 2: Symptoms
  const [symptomRatings, setSymptomRatings] = useState<number[]>(new Array(22).fill(0))
  const [feelNormalPercent, setFeelNormalPercent] = useState('100')
  const [notNormalReason, setNotNormalReason] = useState('')
  const [physicalWorsens, setPhysicalWorsens] = useState(false)
  const [mentalWorsens, setMentalWorsens] = useState(false)

  // Step 3: Cognitive
  const [orientMonth, setOrientMonth] = useState('')
  const [orientDate, setOrientDate] = useState('')
  const [orientDay, setOrientDay] = useState('')
  const [orientYear, setOrientYear] = useState('')
  const [orientTime, setOrientTime] = useState('')

  // Immediate Memory
  const [wordListKey] = useState<WordListKey>(() => pickRandom(['A', 'B', 'C'] as WordListKey[]))
  const recallPool = useMemo(() => buildRecallPool(wordListKey), [wordListKey])
  const [memoryPhase, setMemoryPhase] = useState<'intro' | 'showing' | 'recalling' | 'done'>('intro')
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [currentTrial, setCurrentTrial] = useState(0)
  const [trialSelections, setTrialSelections] = useState<Record<string, boolean>[]>([{}, {}, {}])
  const [memoryTimestamp, setMemoryTimestamp] = useState(0) // for delayed recall timer

  // Digits Backward
  const [digitListKey] = useState<DigitListKey>(() => pickRandom(['A', 'B', 'C'] as DigitListKey[]))
  const [digitPhase, setDigitPhase] = useState<'intro' | 'showing' | 'input' | 'done'>('intro')
  const [currentDigitIndex, setCurrentDigitIndex] = useState(0)
  const [digitInput, setDigitInput] = useState('')
  const [digitResults, setDigitResults] = useState<boolean[]>([])

  // Months in Reverse
  const [monthsPhase, setMonthsPhase] = useState<'intro' | 'active' | 'done'>('intro')
  const [monthsTapped, setMonthsTapped] = useState<string[]>([])
  const [monthsStartTime, setMonthsStartTime] = useState(0)
  const [monthsTimeElapsed, setMonthsTimeElapsed] = useState(0)
  const [monthsCorrect, setMonthsCorrect] = useState<boolean | null>(null)

  // Cognitive sub-step tracking
  const [cognitiveSubStep, setCognitiveSubStep] = useState<'orientation' | 'memory' | 'digits' | 'months'>('orientation')

  // Step 4: Delayed Recall
  const [delayedRecallReady, setDelayedRecallReady] = useState(false)
  const [delayedRecallSelections, setDelayedRecallSelections] = useState<Record<string, boolean>>({})
  const [delayTimeRemaining, setDelayTimeRemaining] = useState(300) // 5 minutes in seconds

  // Submission
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const wordTimerRef = useRef<NodeJS.Timeout | null>(null)
  const digitTimerRef = useRef<NodeJS.Timeout | null>(null)
  const monthsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Validate clinic code
  useEffect(() => {
    if (!code) return
    fetch(`/api/preseason/clinic/${code}`)
      .then(res => {
        if (!res.ok) throw new Error('Invalid')
        return res.json()
      })
      .then(data => {
        setClinicName(data.clinicName)
        setLoading(false)
      })
      .catch(() => {
        setClinicError(true)
        setLoading(false)
      })
  }, [code])

  // Delayed recall timer
  useEffect(() => {
    if (step !== 4 || delayedRecallReady) return

    const elapsed = memoryTimestamp ? Math.floor((Date.now() - memoryTimestamp) / 1000) : 0
    const remaining = Math.max(0, 300 - elapsed)
    setDelayTimeRemaining(remaining)

    if (remaining <= 0) {
      setDelayedRecallReady(true)
      return
    }

    const interval = setInterval(() => {
      const now = Math.floor((Date.now() - memoryTimestamp) / 1000)
      const rem = Math.max(0, 300 - now)
      setDelayTimeRemaining(rem)
      if (rem <= 0) {
        setDelayedRecallReady(true)
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [step, memoryTimestamp, delayedRecallReady])

  // Word flash animation
  const startWordFlash = useCallback(() => {
    setMemoryPhase('showing')
    setCurrentWordIndex(0)

    let idx = 0
    const words = WORD_LISTS[wordListKey]

    const showNext = () => {
      if (idx < words.length - 1) {
        idx++
        setCurrentWordIndex(idx)
        wordTimerRef.current = setTimeout(showNext, 1500)
      } else {
        // Done showing, move to recall
        wordTimerRef.current = setTimeout(() => {
          setMemoryPhase('recalling')
          // Initialize selections for this trial
          setTrialSelections(prev => {
            const updated = [...prev]
            updated[currentTrial] = {}
            return updated
          })
        }, 1500)
      }
    }

    wordTimerRef.current = setTimeout(showNext, 1500)
  }, [wordListKey, currentTrial])

  useEffect(() => {
    return () => {
      if (wordTimerRef.current) clearTimeout(wordTimerRef.current)
      if (digitTimerRef.current) clearTimeout(digitTimerRef.current)
      if (monthsTimerRef.current) clearInterval(monthsTimerRef.current)
    }
  }, [])

  // Digit display
  const startDigitShow = useCallback(() => {
    setDigitPhase('showing')
    digitTimerRef.current = setTimeout(() => {
      setDigitPhase('input')
      setDigitInput('')
    }, 2000)
  }, [])

  // Months timer
  const startMonthsTest = useCallback(() => {
    setMonthsPhase('active')
    setMonthsTapped([])
    setMonthsStartTime(Date.now())
    setMonthsCorrect(null)

    monthsTimerRef.current = setInterval(() => {
      setMonthsTimeElapsed(Math.floor((Date.now() - Date.now()) / 1000))
    }, 100)
  }, [])

  // Scoring calculations
  const symptomCount = symptomRatings.filter(r => r > 0).length
  const symptomTotal = symptomRatings.reduce((a, b) => a + b, 0)

  const orientationScore = (() => {
    const now = new Date()
    let score = 0
    const correctMonth = now.toLocaleString('en-AU', { month: 'long' })
    if (orientMonth === correctMonth) score++
    if (parseInt(orientDate) === now.getDate()) score++
    const correctDay = now.toLocaleString('en-AU', { weekday: 'long' })
    if (orientDay === correctDay) score++
    if (parseInt(orientYear) === now.getFullYear()) score++
    // Time within 1 hour — format is "3pm", "10am" etc
    const timeParts = orientTime.match(/(\d{1,2})(am|pm)/i)
    if (timeParts) {
      let hour = parseInt(timeParts[1])
      const ampm = timeParts[2].toLowerCase()
      if (ampm === 'pm' && hour < 12) hour += 12
      if (ampm === 'am' && hour === 12) hour = 0
      if (Math.abs(hour - now.getHours()) <= 1) score++
    }
    return score
  })()

  const immediateMemoryScore = (() => {
    const targetWords = new Set<string>(WORD_LISTS[wordListKey])
    let total = 0
    for (let t = 0; t < 3; t++) {
      const selections = trialSelections[t]
      if (!selections) continue
      for (const [word, selected] of Object.entries(selections)) {
        if (selected && targetWords.has(word)) total++
      }
    }
    return total
  })()

  const trialScores = trialSelections.map(sel => {
    if (!sel) return 0
    const targetWords = new Set<string>(WORD_LISTS[wordListKey])
    return Object.entries(sel).filter(([word, selected]) => selected && targetWords.has(word)).length
  })

  const digitsBackwardScore = (() => {
    // Score = number of length levels with at least 1 correct (max 4)
    // Pairs: [0,1]=3-digit, [2,3]=4-digit, [4,5]=5-digit, [6,7]=6-digit
    let score = 0
    for (let level = 0; level < 4; level++) {
      const i1 = level * 2
      const i2 = level * 2 + 1
      if (digitResults[i1] || digitResults[i2]) score++
    }
    return score
  })()

  const monthsReverseScore = monthsCorrect ? 1 : 0
  const concentrationScore = digitsBackwardScore + monthsReverseScore

  const delayedRecallScore = (() => {
    const targetWords = new Set<string>(WORD_LISTS[wordListKey])
    return Object.entries(delayedRecallSelections).filter(([word, selected]) => selected && targetWords.has(word)).length
  })()

  const totalCognitiveScore = orientationScore + immediateMemoryScore + concentrationScore + delayedRecallScore

  // Submit handler
  const handleSubmit = async () => {
    setSubmitting(true)
    setSubmitError('')

    const selectedConditions = MEDICAL_CONDITIONS
      .filter(c => medicalHistory[c.key])
      .map(c => c.label)

    try {
      const response = await fetch('/api/preseason/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicCode: code,
          athlete: {
            name, dob, idNumber, sex, dominantHand, sport, team, position,
            yearsOfEducation, primaryLanguage, previousConcussions,
            mostRecentConcussionDate, longestRecovery, diagnosedMigraines,
            medicalHistory: selectedConditions,
            currentMedications,
          },
          symptoms: {
            ratings: symptomRatings,
            feelNormalPercent,
            notNormalReason,
            physicalWorsens,
            mentalWorsens,
          },
          cognitive: {
            orientation: {
              month: orientMonth, date: orientDate, dayOfWeek: orientDay,
              year: orientYear, time: orientTime, score: orientationScore,
            },
            immediateMemory: {
              listUsed: wordListKey,
              trial1: trialScores[0], trial2: trialScores[1], trial3: trialScores[2],
              total: immediateMemoryScore,
            },
            concentration: {
              digitsScore: digitsBackwardScore,
              monthsScore: monthsReverseScore,
              total: concentrationScore,
            },
            delayedRecall: { score: delayedRecallScore },
          },
        }),
      })

      if (response.ok) {
        setSubmitted(true)
      } else {
        const data = await response.json()
        setSubmitError(data.error || 'Failed to submit. Please try again.')
      }
    } catch {
      setSubmitError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle digit submission
  const handleDigitSubmit = () => {
    const digits = DIGIT_LISTS[digitListKey]
    const currentSequence = digits[currentDigitIndex]
    const correctReverse = currentSequence.split('-').reverse().join('-')
    const userAnswer = digitInput.trim().replace(/\s+/g, '-').replace(/,/g, '-')
    const isCorrect = userAnswer === correctReverse

    setDigitResults(prev => [...prev, isCorrect])

    if (currentDigitIndex < digits.length - 1) {
      setCurrentDigitIndex(prev => prev + 1)
      setDigitPhase('showing')
      digitTimerRef.current = setTimeout(() => {
        setDigitPhase('input')
        setDigitInput('')
      }, 2000)
    } else {
      setDigitPhase('done')
    }
  }

  // Handle month tap
  const handleMonthTap = (month: string) => {
    const expectedIndex = monthsTapped.length
    const expected = MONTHS_REVERSED[expectedIndex]

    if (month !== expected) {
      // Wrong order
      setMonthsCorrect(false)
      setMonthsPhase('done')
      if (monthsTimerRef.current) clearInterval(monthsTimerRef.current)
      return
    }

    const newTapped = [...monthsTapped, month]
    setMonthsTapped(newTapped)

    if (newTapped.length === 12) {
      // All months tapped correctly
      const elapsed = (Date.now() - monthsStartTime) / 1000
      setMonthsTimeElapsed(Math.round(elapsed))
      setMonthsCorrect(elapsed <= 30)
      setMonthsPhase('done')
      if (monthsTimerRef.current) clearInterval(monthsTimerRef.current)
    }
  }

  // Handle trial completion (move to next trial or finish)
  const completeTrialRecall = () => {
    if (currentTrial < 2) {
      setCurrentTrial(prev => prev + 1)
      setMemoryPhase('intro')
    } else {
      setMemoryPhase('done')
      setMemoryTimestamp(Date.now())
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Invalid code
  if (clinicError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="glass rounded-2xl p-8 max-w-md w-full text-center">
          <div className="icon-container w-14 h-14 mx-auto mb-5 bg-red-100">
            <AlertCircle className="w-7 h-7 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Invalid Link</h1>
          <p className="text-muted-foreground mb-6">
            This baseline testing link is not valid. Please check with your clinic for the correct link.
          </p>
          <button
            onClick={() => router.push('/')}
            className="btn-primary px-8 py-3 rounded-xl font-semibold"
          >
            Go to ConcussionPro
          </button>
        </div>
      </div>
    )
  }

  // Submitted success
  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="mesh-gradient" aria-hidden="true" />
        <div className="glass rounded-2xl p-8 max-w-md w-full text-center relative z-10">
          <div className="icon-container w-14 h-14 mx-auto mb-5 bg-green-100">
            <Check className="w-7 h-7 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Baseline Complete</h1>
          <p className="text-muted-foreground mb-4">
            Your baseline report has been sent to <strong>{clinicName}</strong>. No data has been stored.
          </p>
          <div className="glass rounded-xl p-4 mb-6 border border-accent/20">
            <p className="text-sm font-semibold mb-1">Your Cognitive Score</p>
            <p className="text-3xl font-bold text-accent">{totalCognitiveScore}/50</p>
          </div>
          <p className="text-xs text-muted-foreground">
            You can safely close this page.
          </p>
        </div>
      </div>
    )
  }

  const words = WORD_LISTS[wordListKey]
  const digits = DIGIT_LISTS[digitListKey]

  return (
    <div className="min-h-screen bg-background relative">
      <div className="mesh-gradient" aria-hidden="true" />
      <div className="noise-overlay" aria-hidden="true" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6 md:py-10">
        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-xs text-accent font-semibold uppercase tracking-wider mb-1">
            Pre-Season Baseline
          </p>
          <p className="text-sm text-muted-foreground">
            for <strong className="text-foreground">{clinicName}</strong>
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map(s => (
            <div
              key={s}
              className={`h-1.5 rounded-full flex-1 transition-all ${
                s <= step ? 'bg-accent' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center mb-6">
          Step {step} of {totalSteps}: {
            step === 1 ? 'Athlete Background' :
            step === 2 ? 'Symptom Evaluation' :
            step === 3 ? 'Cognitive Screening' :
            step === 4 ? 'Delayed Recall' :
            'Score Summary'
          }
        </p>

        {/* STEP 1: Athlete Background */}
        {step === 1 && (
          <div className="glass rounded-2xl p-6 animate-fade-in">
            <h2 className="text-lg font-bold mb-4">Athlete Information</h2>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Full Name *</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)}
                    className="w-full glass px-3 py-2.5 rounded-lg text-sm border border-transparent focus:ring-2 focus:ring-accent/50 focus:outline-none"
                    placeholder="Athlete name" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Date of Birth</label>
                  <input type="date" value={dob} onChange={e => setDob(e.target.value)}
                    className="w-full glass px-3 py-2.5 rounded-lg text-sm border border-transparent focus:ring-2 focus:ring-accent/50 focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">ID / Jersey #</label>
                  <input type="text" value={idNumber} onChange={e => setIdNumber(e.target.value)}
                    className="w-full glass px-3 py-2.5 rounded-lg text-sm border border-transparent focus:ring-2 focus:ring-accent/50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Sex</label>
                  <select value={sex} onChange={e => setSex(e.target.value)}
                    className="w-full glass px-3 py-2.5 rounded-lg text-sm border border-transparent focus:ring-2 focus:ring-accent/50 focus:outline-none">
                    <option value="">Select</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Dominant Hand</label>
                  <select value={dominantHand} onChange={e => setDominantHand(e.target.value)}
                    className="w-full glass px-3 py-2.5 rounded-lg text-sm border border-transparent focus:ring-2 focus:ring-accent/50 focus:outline-none">
                    <option value="">Select</option>
                    <option>Right</option>
                    <option>Left</option>
                    <option>Ambidextrous</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Sport</label>
                  <input type="text" value={sport} onChange={e => setSport(e.target.value)}
                    className="w-full glass px-3 py-2.5 rounded-lg text-sm border border-transparent focus:ring-2 focus:ring-accent/50 focus:outline-none"
                    placeholder="e.g. AFL, Rugby" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Team / Club</label>
                  <input type="text" value={team} onChange={e => setTeam(e.target.value)}
                    className="w-full glass px-3 py-2.5 rounded-lg text-sm border border-transparent focus:ring-2 focus:ring-accent/50 focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Position</label>
                  <input type="text" value={position} onChange={e => setPosition(e.target.value)}
                    className="w-full glass px-3 py-2.5 rounded-lg text-sm border border-transparent focus:ring-2 focus:ring-accent/50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Years of Education</label>
                  <input type="number" value={yearsOfEducation} onChange={e => setYearsOfEducation(e.target.value)}
                    className="w-full glass px-3 py-2.5 rounded-lg text-sm border border-transparent focus:ring-2 focus:ring-accent/50 focus:outline-none"
                    min="0" max="30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Primary Language</label>
                  <input type="text" value={primaryLanguage} onChange={e => setPrimaryLanguage(e.target.value)}
                    className="w-full glass px-3 py-2.5 rounded-lg text-sm border border-transparent focus:ring-2 focus:ring-accent/50 focus:outline-none" />
                </div>
              </div>
            </div>

            {/* Concussion History */}
            <h3 className="text-base font-bold mt-6 mb-3">Concussion History</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1"># Previous Concussions</label>
                  <input type="number" value={previousConcussions} onChange={e => setPreviousConcussions(e.target.value)}
                    className="w-full glass px-3 py-2.5 rounded-lg text-sm border border-transparent focus:ring-2 focus:ring-accent/50 focus:outline-none"
                    min="0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Most Recent Date</label>
                  <input type="date" value={mostRecentConcussionDate} onChange={e => setMostRecentConcussionDate(e.target.value)}
                    className="w-full glass px-3 py-2.5 rounded-lg text-sm border border-transparent focus:ring-2 focus:ring-accent/50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Longest Recovery</label>
                  <input type="text" value={longestRecovery} onChange={e => setLongestRecovery(e.target.value)}
                    className="w-full glass px-3 py-2.5 rounded-lg text-sm border border-transparent focus:ring-2 focus:ring-accent/50 focus:outline-none"
                    placeholder="e.g. 2 weeks" />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={diagnosedMigraines} onChange={e => setDiagnosedMigraines(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-accent focus:ring-accent" />
                <span className="text-sm">Diagnosed migraines / headaches?</span>
              </label>
            </div>

            {/* Medical History */}
            <h3 className="text-base font-bold mt-6 mb-3">Medical History</h3>
            <div className="space-y-2">
              {MEDICAL_CONDITIONS.map(c => (
                <label key={c.key} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!medicalHistory[c.key]}
                    onChange={e => setMedicalHistory(prev => ({ ...prev, [c.key]: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-300 text-accent focus:ring-accent" />
                  <span className="text-sm">{c.label}</span>
                </label>
              ))}
            </div>

            <div className="mt-3">
              <label className="block text-xs font-semibold mb-1">Current Medications</label>
              <textarea value={currentMedications} onChange={e => setCurrentMedications(e.target.value)}
                className="w-full glass px-3 py-2.5 rounded-lg text-sm border border-transparent focus:ring-2 focus:ring-accent/50 focus:outline-none"
                rows={2} placeholder="List any current medications..." />
            </div>
          </div>
        )}

        {/* STEP 2: Symptom Evaluation */}
        {step === 2 && (
          <div className="glass rounded-2xl p-6 animate-fade-in">
            <h2 className="text-lg font-bold mb-2">Symptom Evaluation</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Rate each symptom from 0 (none) to 6 (severe) based on how you feel right now.
            </p>

            {/* Header row */}
            <div className="flex items-center gap-1 mb-1 pl-[40%]">
              {[0, 1, 2, 3, 4, 5, 6].map(v => (
                <span key={v} className="flex-1 text-center text-[10px] font-bold text-muted-foreground">{v}</span>
              ))}
            </div>
            <div className="space-y-0.5">
              {SYMPTOMS.map((symptom, i) => (
                <div key={symptom} className="flex items-center gap-1">
                  <span className="text-xs w-[40%] flex-shrink-0 truncate" title={symptom}>{symptom}</span>
                  <div className="flex gap-0.5 flex-1">
                    {[0, 1, 2, 3, 4, 5, 6].map(val => (
                      <button
                        key={val}
                        onClick={() => {
                          const updated = [...symptomRatings]
                          updated[i] = val
                          setSymptomRatings(updated)
                        }}
                        className={`flex-1 h-7 rounded text-[10px] font-bold transition-all ${
                          symptomRatings[i] === val
                            ? val === 0 ? 'bg-green-100 text-green-700 ring-1 ring-green-400'
                              : 'bg-accent text-white'
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-4 p-3 glass rounded-xl border border-accent/20">
              <div className="flex justify-between text-sm">
                <span>Symptom Number: <strong>{symptomCount}/22</strong></span>
                <span>Severity Score: <strong>{symptomTotal}/132</strong></span>
              </div>
            </div>

            {/* Follow-up questions */}
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Do you feel normal? (% of normal)</label>
                <div className="flex items-center gap-2">
                  <input type="range" min="0" max="100" value={feelNormalPercent}
                    onChange={e => setFeelNormalPercent(e.target.value)}
                    className="flex-1 accent-accent" />
                  <span className="text-sm font-bold w-12 text-right">{feelNormalPercent}%</span>
                </div>
              </div>

              {parseInt(feelNormalPercent) < 100 && (
                <div>
                  <label className="block text-xs font-semibold mb-1">If not 100%, please describe why</label>
                  <input type="text" value={notNormalReason} onChange={e => setNotNormalReason(e.target.value)}
                    className="w-full glass px-3 py-2.5 rounded-lg text-sm border border-transparent focus:ring-2 focus:ring-accent/50 focus:outline-none" />
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={physicalWorsens} onChange={e => setPhysicalWorsens(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-accent focus:ring-accent" />
                <span className="text-sm">Physical activity worsens symptoms</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={mentalWorsens} onChange={e => setMentalWorsens(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-accent focus:ring-accent" />
                <span className="text-sm">Mental activity worsens symptoms</span>
              </label>
            </div>
          </div>
        )}

        {/* STEP 3: Cognitive Screening */}
        {step === 3 && (
          <div className="glass rounded-2xl p-6 animate-fade-in">
            {/* Sub-step navigation */}
            <div className="flex gap-1 mb-4">
              {(['orientation', 'memory', 'digits', 'months'] as const).map((sub, i) => (
                <button
                  key={sub}
                  onClick={() => setCognitiveSubStep(sub)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    cognitiveSubStep === sub ? 'bg-accent text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {['Orientation', 'Memory', 'Digits', 'Months'][i]}
                </button>
              ))}
            </div>

            {/* Orientation */}
            {cognitiveSubStep === 'orientation' && (
              <div>
                <h2 className="text-lg font-bold mb-2">Orientation</h2>
                <p className="text-xs text-muted-foreground mb-4">Select the correct answer for each (1 point each, max 5)</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold mb-2">What month is it?</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {MONTHS.map(m => (
                        <button key={m} onClick={() => setOrientMonth(m)}
                          className={`py-2 rounded-lg text-xs font-medium transition-all ${
                            orientMonth === m ? 'bg-accent text-white' : 'glass hover:bg-slate-50'
                          }`}>{m.slice(0, 3)}</button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-2">What is today's date?</label>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                        <button key={d} onClick={() => setOrientDate(String(d))}
                          className={`py-1.5 rounded-md text-xs font-medium transition-all ${
                            orientDate === String(d) ? 'bg-accent text-white' : 'glass hover:bg-slate-50'
                          }`}>{d}</button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-2">What day of the week is it?</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                        <button key={d} onClick={() => setOrientDay(d)}
                          className={`py-2 rounded-lg text-xs font-medium transition-all ${
                            orientDay === d ? 'bg-accent text-white' : 'glass hover:bg-slate-50'
                          }`}>{d.slice(0, 3)}</button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-2">What year is it?</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[2024, 2025, 2026, 2027].map(yr => (
                        <button key={yr} onClick={() => setOrientYear(String(yr))}
                          className={`py-2 rounded-lg text-xs font-medium transition-all ${
                            orientYear === String(yr) ? 'bg-accent text-white' : 'glass hover:bg-slate-50'
                          }`}>{yr}</button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-2">What time is it right now? (nearest hour)</label>
                    <div className="grid grid-cols-6 gap-1">
                      {Array.from({ length: 24 }, (_, i) => {
                        const hr = i % 12 || 12
                        const ampm = i < 12 ? 'am' : 'pm'
                        const label = `${hr}${ampm}`
                        return (
                          <button key={i} onClick={() => setOrientTime(label)}
                            className={`py-1.5 rounded-md text-[11px] font-medium transition-all ${
                              orientTime === label ? 'bg-accent text-white' : 'glass hover:bg-slate-50'
                            }`}>{label}</button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button onClick={() => setCognitiveSubStep('memory')}
                    className="btn-primary px-6 py-2.5 rounded-lg text-sm font-semibold inline-flex items-center gap-1">
                    Next: Memory Test <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Immediate Memory */}
            {cognitiveSubStep === 'memory' && (
              <div>
                <h2 className="text-lg font-bold mb-2">Immediate Memory</h2>
                <p className="text-xs text-muted-foreground mb-4">
                  You'll be shown 10 words, one at a time. After all words are shown, select the ones you remember. This repeats 3 times.
                </p>

                {memoryPhase === 'intro' && (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground mb-4">
                      Trial {currentTrial + 1} of 3 — Words will appear for 1.5 seconds each
                    </p>
                    <button onClick={startWordFlash}
                      className="btn-primary px-8 py-3 rounded-xl text-base font-semibold">
                      {currentTrial === 0 ? 'Start Memory Test' : 'Start Next Trial'}
                    </button>
                  </div>
                )}

                {memoryPhase === 'showing' && (
                  <div className="text-center py-10">
                    <p className="text-xs text-muted-foreground mb-3">
                      Word {currentWordIndex + 1} of {words.length}
                    </p>
                    <div className="text-4xl md:text-5xl font-bold text-accent animate-fade-in" key={currentWordIndex}>
                      {words[currentWordIndex]}
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">Remember this word</p>
                  </div>
                )}

                {memoryPhase === 'recalling' && (
                  <div>
                    <p className="text-sm font-semibold mb-3">
                      Trial {currentTrial + 1}: Select the words you remember
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {recallPool.map(({ word }) => (
                        <button
                          key={word}
                          onClick={() => {
                            setTrialSelections(prev => {
                              const updated = [...prev]
                              const trial = { ...(updated[currentTrial] || {}) }
                              trial[word] = !trial[word]
                              updated[currentTrial] = trial
                              return updated
                            })
                          }}
                          className={`p-2.5 rounded-xl text-sm font-medium transition-all ${
                            trialSelections[currentTrial]?.[word]
                              ? 'bg-accent text-white'
                              : 'glass hover:bg-slate-50'
                          }`}
                        >
                          {word}
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <p className="text-xs text-muted-foreground">
                        Selected: {Object.values(trialSelections[currentTrial] || {}).filter(Boolean).length}
                      </p>
                      <button onClick={completeTrialRecall}
                        className="btn-primary px-6 py-2.5 rounded-lg text-sm font-semibold">
                        {currentTrial < 2 ? 'Next Trial' : 'Finish Memory Test'}
                      </button>
                    </div>
                  </div>
                )}

                {memoryPhase === 'done' && (
                  <div className="text-center py-4">
                    <div className="icon-container w-12 h-12 mx-auto mb-3 bg-green-100">
                      <Check className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-sm font-semibold mb-1">Memory Test Complete</p>
                    <p className="text-xs text-muted-foreground mb-2">
                      Trial 1: {trialScores[0]}/10 · Trial 2: {trialScores[1]}/10 · Trial 3: {trialScores[2]}/10
                    </p>
                    <p className="text-lg font-bold text-accent">Total: {immediateMemoryScore}/30</p>

                    <div className="mt-4">
                      <button onClick={() => setCognitiveSubStep('digits')}
                        className="btn-primary px-6 py-2.5 rounded-lg text-sm font-semibold inline-flex items-center gap-1">
                        Next: Digits Backward <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Digits Backward */}
            {cognitiveSubStep === 'digits' && (
              <div>
                <h2 className="text-lg font-bold mb-2">Concentration — Digits Backward</h2>
                <p className="text-xs text-muted-foreground mb-4">
                  A sequence of digits will appear for 2 seconds. Type them in reverse order.
                </p>

                {digitPhase === 'intro' && (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground mb-4">
                      Sequence {currentDigitIndex + 1} of {digits.length}
                    </p>
                    <button onClick={startDigitShow}
                      className="btn-primary px-8 py-3 rounded-xl text-base font-semibold">
                      {currentDigitIndex === 0 ? 'Start Digits Test' : 'Next Sequence'}
                    </button>
                  </div>
                )}

                {digitPhase === 'showing' && (
                  <div className="text-center py-10">
                    <p className="text-xs text-muted-foreground mb-3">Remember these digits</p>
                    <div className="text-4xl md:text-5xl font-bold text-accent tracking-widest font-mono">
                      {digits[currentDigitIndex].replace(/-/g, '  ')}
                    </div>
                  </div>
                )}

                {digitPhase === 'input' && (
                  <div className="text-center py-4">
                    <p className="text-sm font-semibold mb-3">Type the digits in REVERSE order</p>
                    <p className="text-xs text-muted-foreground mb-3">Separate with dashes (e.g. 3-9-4)</p>
                    <input
                      type="text"
                      value={digitInput}
                      onChange={e => setDigitInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleDigitSubmit() }}
                      className="w-full glass px-4 py-3 rounded-xl text-center text-2xl font-mono tracking-widest border border-transparent focus:ring-2 focus:ring-accent/50 focus:outline-none"
                      placeholder="Type reversed digits"
                      autoFocus
                    />
                    <button onClick={handleDigitSubmit}
                      className="btn-primary px-8 py-3 rounded-xl text-base font-semibold mt-4">
                      Submit
                    </button>
                  </div>
                )}

                {digitPhase === 'done' && (
                  <div className="text-center py-4">
                    <div className="icon-container w-12 h-12 mx-auto mb-3 bg-green-100">
                      <Check className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-sm font-semibold mb-1">Digits Backward Complete</p>
                    <p className="text-lg font-bold text-accent">Score: {digitsBackwardScore}/4</p>

                    <div className="mt-4">
                      <button onClick={() => setCognitiveSubStep('months')}
                        className="btn-primary px-6 py-2.5 rounded-lg text-sm font-semibold inline-flex items-center gap-1">
                        Next: Months in Reverse <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Months in Reverse */}
            {cognitiveSubStep === 'months' && (
              <div>
                <h2 className="text-lg font-bold mb-2">Concentration — Months in Reverse</h2>
                <p className="text-xs text-muted-foreground mb-4">
                  Tap the months in reverse order: December → January. You have 30 seconds.
                </p>

                {monthsPhase === 'intro' && (
                  <div className="text-center py-6">
                    <button onClick={startMonthsTest}
                      className="btn-primary px-8 py-3 rounded-xl text-base font-semibold">
                      Start Months Test
                    </button>
                  </div>
                )}

                {monthsPhase === 'active' && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold">
                        Tap: <span className="text-accent">{MONTHS_REVERSED[monthsTapped.length]}</span>
                      </p>
                      <p className="text-sm font-mono text-muted-foreground">
                        {((Date.now() - monthsStartTime) / 1000).toFixed(0)}s
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {MONTHS.map(month => {
                        const tapped = monthsTapped.includes(month)
                        return (
                          <button
                            key={month}
                            onClick={() => !tapped && handleMonthTap(month)}
                            disabled={tapped}
                            className={`p-3 rounded-xl text-sm font-medium transition-all ${
                              tapped
                                ? 'bg-accent/20 text-accent/60'
                                : 'glass hover:bg-accent/5'
                            }`}
                          >
                            {month.slice(0, 3)}
                          </button>
                        )
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-3 text-center">
                      {monthsTapped.length}/12 months selected
                    </p>
                  </div>
                )}

                {monthsPhase === 'done' && (
                  <div className="text-center py-4">
                    <div className={`icon-container w-12 h-12 mx-auto mb-3 ${monthsCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                      {monthsCorrect ? <Check className="w-6 h-6 text-green-600" /> : <AlertCircle className="w-6 h-6 text-red-600" />}
                    </div>
                    <p className="text-sm font-semibold mb-1">
                      {monthsCorrect
                        ? `Correct! Completed in ${monthsTimeElapsed}s`
                        : monthsTapped.length < 12
                          ? 'Incorrect order'
                          : `Completed in ${monthsTimeElapsed}s (over 30s limit)`
                      }
                    </p>
                    <p className="text-lg font-bold text-accent">Score: {monthsReverseScore}/1</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Delayed Recall */}
        {step === 4 && (
          <div className="glass rounded-2xl p-6 animate-fade-in">
            <h2 className="text-lg font-bold mb-2">Delayed Recall</h2>

            {!delayedRecallReady ? (
              <div className="text-center py-8">
                <div className="icon-container w-16 h-16 mx-auto mb-4">
                  <Clock className="w-8 h-8 text-accent" />
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Waiting for 5-minute delay to elapse
                </p>
                <p className="text-3xl font-bold text-accent font-mono">
                  {Math.floor(delayTimeRemaining / 60)}:{(delayTimeRemaining % 60).toString().padStart(2, '0')}
                </p>
                <p className="text-xs text-muted-foreground mt-4">
                  You can go back to review previous sections while waiting.
                </p>
                <button
                  onClick={() => setStep(1)}
                  className="btn-secondary px-6 py-2.5 rounded-lg text-sm font-semibold mt-4"
                >
                  Review Previous Sections
                </button>
              </div>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Select the words you recall from the memory test earlier.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {recallPool.map(({ word }) => (
                    <button
                      key={word}
                      onClick={() => {
                        setDelayedRecallSelections(prev => ({ ...prev, [word]: !prev[word] }))
                      }}
                      className={`p-2.5 rounded-xl text-sm font-medium transition-all ${
                        delayedRecallSelections[word]
                          ? 'bg-accent text-white'
                          : 'glass hover:bg-slate-50'
                      }`}
                    >
                      {word}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Selected: {Object.values(delayedRecallSelections).filter(Boolean).length}
                </p>
              </div>
            )}
          </div>
        )}

        {/* STEP 5: Score Summary */}
        {step === 5 && (
          <div className="glass rounded-2xl p-6 animate-fade-in">
            <h2 className="text-lg font-bold mb-4 text-center">Score Summary</h2>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="glass rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-accent">{symptomCount}/22</p>
                  <p className="text-xs text-muted-foreground">Symptom Number</p>
                </div>
                <div className="glass rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-accent">{symptomTotal}/132</p>
                  <p className="text-xs text-muted-foreground">Severity Score</p>
                </div>
              </div>

              <div className="glass rounded-xl p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Orientation</span>
                    <span className="font-bold">{orientationScore}/5</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Immediate Memory</span>
                    <span className="font-bold">{immediateMemoryScore}/30</span>
                  </div>
                  <div className="flex justify-between text-sm pl-4 text-muted-foreground">
                    <span>Trial 1 / 2 / 3</span>
                    <span>{trialScores[0]} / {trialScores[1]} / {trialScores[2]}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Concentration</span>
                    <span className="font-bold">{concentrationScore}/5</span>
                  </div>
                  <div className="flex justify-between text-sm pl-4 text-muted-foreground">
                    <span>Digits Backward</span>
                    <span>{digitsBackwardScore}/4</span>
                  </div>
                  <div className="flex justify-between text-sm pl-4 text-muted-foreground">
                    <span>Months in Reverse</span>
                    <span>{monthsReverseScore}/1</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Delayed Recall</span>
                    <span className="font-bold">{delayedRecallScore}/10</span>
                  </div>
                </div>
              </div>

              <div className="glass rounded-xl p-4 bg-gradient-to-br from-accent/5 to-transparent border border-accent/20 text-center">
                <p className="text-sm font-semibold mb-1">Total Cognitive Score</p>
                <p className="text-4xl font-bold text-accent">{totalCognitiveScore}/50</p>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Sections requiring clinical observation (balance, coordination, cervical spine, GCS) were not administered.
              </p>
            </div>

            {submitError && (
              <div className="glass bg-red-50 border border-red-200 rounded-xl p-3 mt-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-800">{submitError}</p>
                </div>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full btn-primary py-3.5 rounded-xl text-base font-semibold mt-4 disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending Report...
                </>
              ) : (
                <>
                  Send Report to {clinicName}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-6">
          {step > 1 ? (
            <button
              onClick={() => setStep(prev => prev - 1)}
              className="btn-secondary px-6 py-2.5 rounded-lg text-sm font-semibold inline-flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : <div />}

          {step < totalSteps && (
            <button
              onClick={() => {
                if (step === 1 && !name) {
                  return // require name at minimum
                }
                setStep(prev => prev + 1)
              }}
              disabled={step === 4 && !delayedRecallReady}
              className="btn-primary px-6 py-2.5 rounded-lg text-sm font-semibold inline-flex items-center gap-1 disabled:opacity-50"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
