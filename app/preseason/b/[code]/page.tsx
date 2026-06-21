'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AlertCircle, ArrowLeft, ArrowRight, Check, Clock, Brain, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { WORD_LISTS, type WordListKey } from '@/app/scat-forms/shared/constants/wordLists'
import { DIGIT_LISTS, type DigitListKey } from '@/app/scat-forms/shared/constants/digitLists'
import { trackEvent, ANALYTICS_EVENTS } from '@/lib/analytics'

// Age (in years) below which a parent/guardian must also consent before any
// health information is collected. NOTE: 16 is a working threshold — the exact
// age of capacity for health-data consent should be confirmed with legal advice
// (it can vary by state and by the nature of the information).
const MINOR_CONSENT_AGE = 16
// Version stamp stored with each consent record so we can tell which wording
// the person agreed to if the consent copy changes later.
const CONSENT_VERSION = 'v1'

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

const OCULOMOTOR_SYMPTOMS = [
  'Headache', 'Eye fatigue/strain', 'Dizziness', 'Nausea',
  'Blurred vision', 'Double vision', 'Difficulty focusing', 'None',
]

const OCULOMOTOR_EXERCISES = [
  { key: 'horizontalSaccades', label: 'Horizontal Saccades', type: 'saccade', direction: 'horizontal' },
  { key: 'verticalSaccades', label: 'Vertical Saccades', type: 'saccade', direction: 'vertical' },
  { key: 'horizontalPursuit', label: 'Horizontal Smooth Pursuit', type: 'pursuit', direction: 'horizontal' },
  { key: 'verticalPursuit', label: 'Vertical Smooth Pursuit', type: 'pursuit', direction: 'vertical' },
] as const

type OculomotorExerciseKey = typeof OCULOMOTOR_EXERCISES[number]['key']

interface OculomotorExerciseResult {
  symptoms: string[]
  severity: number
}

type OculomotorResults = Record<OculomotorExerciseKey, OculomotorExerciseResult>

const INITIAL_OCULOMOTOR_RESULTS: OculomotorResults = {
  horizontalSaccades: { symptoms: [], severity: 0 },
  verticalSaccades: { symptoms: [], severity: 0 },
  horizontalPursuit: { symptoms: [], severity: 0 },
  verticalPursuit: { symptoms: [], severity: 0 },
}

const MEDICAL_CONDITIONS = [
  { key: 'hospitalizedHeadInjury', label: 'Hospitalized or medical imaging for a head injury' },
  { key: 'headacheDisorder', label: 'Headache disorder (e.g. migraine)' },
  { key: 'learningDisability', label: 'Learning disability / Dyslexia' },
  { key: 'adhd', label: 'ADHD' },
  { key: 'depressionAnxiety', label: 'Depression / Anxiety' },
  { key: 'otherPsychDisorder', label: 'Other psychiatric disorder' },
  { key: 'previousBrainSurgery', label: 'Previous brain surgery' },
]

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

function OculomotorExercise({
  exercise,
  exerciseIndex,
  running,
  onStart,
  onComplete,
  timerRef,
  rafRef,
}: {
  exercise: typeof OCULOMOTOR_EXERCISES[number]
  exerciseIndex: number
  running: boolean
  onStart: () => void
  onComplete: () => void
  timerRef: React.MutableRefObject<number | null>
  rafRef: React.MutableRefObject<number | null>
}) {
  const [activeSide, setActiveSide] = useState(0) // 0=left/top, 1=right/bottom
  const [cycleCount, setCycleCount] = useState(0)
  const [dotPosition, setDotPosition] = useState(0) // 0-1 for pursuit
  const [started, setStarted] = useState(false)
  const isHorizontal = exercise.direction === 'horizontal'

  // Stable ref for onComplete so the effect doesn't restart on every render
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    if (!started) return

    if (exercise.type === 'saccade') {
      // Saccade: toggle active dot at ~1Hz for 5 cycles
      let count = 0
      const interval = setInterval(() => {
        count++
        setActiveSide(prev => prev === 0 ? 1 : 0)
        setCycleCount(Math.floor(count / 2))
        if (count >= 10) { // 5 full cycles = 10 toggles
          clearInterval(interval)
          onCompleteRef.current()
        }
      }, 500)
      return () => clearInterval(interval)
    } else {
      // Pursuit: smooth motion, 3 full passes (~18s)
      const totalDuration = 18000
      const halfCycleDuration = 3000
      const startTime = performance.now()
      let raf: number

      const animate = (now: number) => {
        const elapsed = now - startTime
        if (elapsed >= totalDuration) {
          setDotPosition(0.5)
          onCompleteRef.current()
          return
        }
        const cycleTime = elapsed % (halfCycleDuration * 2)
        const pos = cycleTime < halfCycleDuration
          ? cycleTime / halfCycleDuration
          : 1 - (cycleTime - halfCycleDuration) / halfCycleDuration
        setDotPosition(pos)
        raf = requestAnimationFrame(animate)
        rafRef.current = raf
      }
      raf = requestAnimationFrame(animate)
      rafRef.current = raf
      return () => cancelAnimationFrame(raf)
    }
  }, [started, exercise.type, exercise.direction, rafRef])

  const handleStart = () => {
    setStarted(true)
    onStart()
  }

  if (!started) {
    return (
      <div>
        <h2 className="text-lg font-bold mb-2">{exercise.label}</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Exercise {exerciseIndex + 1} of 4 —{' '}
          {exercise.type === 'saccade'
            ? 'Follow the highlighted dot as it alternates. Keep your head still.'
            : 'Follow the dot smoothly as it moves. Keep your head still.'}
        </p>
        <div className="text-center">
          <button onClick={handleStart} className="btn-primary px-8 py-3 rounded-xl text-base font-semibold">
            Start Exercise
          </button>
        </div>
      </div>
    )
  }

  if (exercise.type === 'saccade') {
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold">{exercise.label}</h2>
          <span className="text-xs text-muted-foreground">{cycleCount}/5 cycles</span>
        </div>
        <div
          className={`rounded-2xl bg-slate-900 relative overflow-hidden ${
            isHorizontal ? 'h-[250px] md:h-[300px]' : 'h-[350px] md:h-[400px]'
          }`}
        >
          <div className={`absolute inset-0 flex ${isHorizontal ? 'flex-row items-center justify-between px-2 md:px-4' : 'flex-col items-center justify-between py-2 md:py-3'}`}>
            <div
              className={`rounded-full transition-all duration-150 ${
                activeSide === 0
                  ? 'w-10 h-10 md:w-14 md:h-14 bg-teal-400 shadow-[0_0_20px_rgba(45,212,191,0.6)]'
                  : 'w-6 h-6 md:w-8 md:h-8 bg-slate-600'
              }`}
            />
            <div
              className={`rounded-full transition-all duration-150 ${
                activeSide === 1
                  ? 'w-10 h-10 md:w-14 md:h-14 bg-teal-400 shadow-[0_0_20px_rgba(45,212,191,0.6)]'
                  : 'w-6 h-6 md:w-8 md:h-8 bg-slate-600'
              }`}
            />
          </div>
        </div>
      </div>
    )
  }

  // Pursuit animation
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold">{exercise.label}</h2>
        <span className="text-xs text-muted-foreground">Follow the dot</span>
      </div>
      <div
        className={`rounded-2xl bg-slate-900 relative overflow-hidden ${
          isHorizontal ? 'h-[250px] md:h-[300px]' : 'h-[350px] md:h-[400px]'
        }`}
      >
        <div
          className="absolute w-10 h-10 md:w-14 md:h-14 rounded-full bg-teal-400 shadow-[0_0_20px_rgba(45,212,191,0.6)]"
          style={
            isHorizontal
              ? {
                  left: `calc(${dotPosition * 96 + 2}% - 20px)`,
                  top: '50%',
                  transform: 'translateY(-50%)',
                }
              : {
                  top: `calc(${dotPosition * 94 + 3}% - 20px)`,
                  left: '50%',
                  transform: 'translateX(-50%)',
                }
          }
        />
      </div>
    </div>
  )
}

export default function AthleteBaselineForm() {
  const params = useParams()
  const router = useRouter()
  const code = (params.code as string)?.toUpperCase()

  // Clinic validation
  const [clinicName, setClinicName] = useState<string | null>(null)
  const [clinicError, setClinicError] = useState<false | 'invalid' | 'unavailable'>(false)
  const [loading, setLoading] = useState(true)

  // Word/digit list rotation: set after athlete history lookup (per-athlete, not per-browser)
  const [listIndex, setListIndex] = useState<number>(0)

  // Athlete test tracking
  const [testNumber, setTestNumber] = useState<number>(1) // 1 = first test
  const [lookingUpHistory, setLookingUpHistory] = useState(false)
  const historyLookedUpRef = useRef(false)

  // Consent gate (shown before any health data is entered — APP 3.3 / APP 5)
  const [consentGiven, setConsentGiven] = useState(false)
  const [consentAgreed, setConsentAgreed] = useState(false)
  const [guardianName, setGuardianName] = useState('')
  const [guardianAgreed, setGuardianAgreed] = useState(false)
  // The recorded consent object, built when the gate is passed and sent + stored
  // with the submission.
  const [consentRecord, setConsentRecord] = useState<{
    agreed: boolean
    atISO: string
    version: string
    guardian?: { name: string; agreed: boolean }
  } | null>(null)

  // Form step
  const [step, setStep] = useState(1)
  const totalSteps = 6 // 5 steps + summary

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
  const [previousConcussionSymptoms, setPreviousConcussionSymptoms] = useState('')
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
  const [orientationTimestamp, setOrientationTimestamp] = useState<Date | null>(null) // capture time when answers given

  // Immediate Memory — rotate lists A→B→C across tests (repeats every 3)
  const wordListKey: WordListKey = (['A', 'B', 'C'] as const)[listIndex]
  const recallPool = useMemo(() => buildRecallPool(wordListKey), [wordListKey])
  // Separately shuffled pool for delayed recall to prevent position-based pattern recognition
  const delayedRecallPool = useMemo(() => shuffle([...recallPool]), [recallPool])
  const [memoryPhase, setMemoryPhase] = useState<'intro' | 'showing' | 'recalling' | 'done'>('intro')
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [currentTrial, setCurrentTrial] = useState(0)
  const [trialSelections, setTrialSelections] = useState<Record<string, boolean>[]>([{}, {}, {}])
  const [memoryTimestamp, setMemoryTimestamp] = useState(0) // for delayed recall timer

  // Digits Backward
  // Digits also rotate in sync with word lists
  const digitListKey: DigitListKey = (['A', 'B', 'C'] as const)[listIndex]
  const [digitPhase, setDigitPhase] = useState<'intro' | 'showing' | 'input' | 'done'>('intro')
  const [currentDigitIndex, setCurrentDigitIndex] = useState(0)
  const [digitInput, setDigitInput] = useState('')
  const [digitResults, setDigitResults] = useState<boolean[]>([])
  const [digitAnswerLog, setDigitAnswerLog] = useState<{ shown: string; expected: string; typed: string; correct: boolean }[]>([])

  // Months in Reverse — shuffled so athlete can't read them in order
  const [shuffledMonths] = useState(() => shuffle([...MONTHS]))
  const [monthsPhase, setMonthsPhase] = useState<'intro' | 'active' | 'done'>('intro')
  const [monthsTapped, setMonthsTapped] = useState<string[]>([])
  const [monthsStartTime, setMonthsStartTime] = useState(0)
  const [monthsTimeElapsed, setMonthsTimeElapsed] = useState(0)
  const [monthsCorrect, setMonthsCorrect] = useState<boolean | null>(null)

  // Cognitive sub-step tracking
  const [cognitiveSubStep, setCognitiveSubStep] = useState<'orientation' | 'memory' | 'digits' | 'months'>('memory')

  // Step 4: Oculomotor Screening
  const [oculomotorSubStep, setOculomotorSubStep] = useState(0) // 0=instructions, 1=exercise1, 2=report1, 3=exercise2, ...
  const [oculomotorResults, setOculomotorResults] = useState<OculomotorResults>({ ...INITIAL_OCULOMOTOR_RESULTS })
  const [oculomotorExerciseRunning, setOculomotorExerciseRunning] = useState(false)
  const oculomotorTimerRef = useRef<number | null>(null)
  const oculomotorRafRef = useRef<number | null>(null)

  // Step 5: Delayed Recall
  const [delayedRecallReady, setDelayedRecallReady] = useState(false)
  const [delayedRecallSelections, setDelayedRecallSelections] = useState<Record<string, boolean>>({})
  const [delayTimeRemaining, setDelayTimeRemaining] = useState(300) // 5 minutes in seconds

  // Submission
  const submittingRef = useRef(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [validationError, setValidationError] = useState('')

  const wordTimerRef = useRef<NodeJS.Timeout | null>(null)
  const digitTimerRef = useRef<NodeJS.Timeout | null>(null)
  const monthsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const oculomotorAutoAdvanceRef = useRef<NodeJS.Timeout | null>(null)
  const monthsStartTimeRef = useRef<number>(0)

  // Validate clinic code
  useEffect(() => {
    if (!code) return
    fetch(`/api/preseason/clinic/${code}`)
      .then(res => {
        if (res.status === 404 || res.status === 400) {
          setClinicError('invalid')
          setLoading(false)
          return null
        }
        if (!res.ok) {
          setClinicError('unavailable')
          setLoading(false)
          return null
        }
        return res.json()
      })
      .then(data => {
        if (!data) return
        setClinicName(data.clinicName)
        setLoading(false)
      })
      .catch(() => {
        setClinicError('unavailable')
        setLoading(false)
      })
  }, [code])

  // Delayed recall timer
  useEffect(() => {
    if (step !== 5 || delayedRecallReady) return

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
      if (oculomotorTimerRef.current) clearTimeout(oculomotorTimerRef.current)
      if (oculomotorRafRef.current) cancelAnimationFrame(oculomotorRafRef.current)
      if (oculomotorAutoAdvanceRef.current) clearTimeout(oculomotorAutoAdvanceRef.current)
    }
  }, [])

  // Digit display
  const startDigitShow = useCallback(() => {
    if (digitTimerRef.current) clearTimeout(digitTimerRef.current)
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
    const now = Date.now()
    setMonthsStartTime(now)
    monthsStartTimeRef.current = now
    setMonthsCorrect(null)

    monthsTimerRef.current = setInterval(() => {
      setMonthsTimeElapsed(parseFloat(((Date.now() - monthsStartTimeRef.current) / 1000).toFixed(1)))
    }, 100)
  }, [])

  // Scoring calculations
  const symptomCount = symptomRatings.filter(r => r > 0).length
  const symptomTotal = symptomRatings.reduce((a, b) => a + b, 0)

  const orientationScore = (() => {
    // Use captured timestamp (when orientation was completed) not current time
    const now = orientationTimestamp || new Date()
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
      const diff = Math.abs(hour - now.getHours())
      if (diff <= 1 || diff >= 23) score++
    }
    return score
  })()

  const immediateMemoryScore = (() => {
    const targetWords = new Set<string>(WORD_LISTS[wordListKey])
    const selections = trialSelections[0]
    if (!selections) return 0
    return Object.entries(selections).filter(([word, selected]) => selected && targetWords.has(word)).length
  })()

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

  // Athlete age + minor status, computed client-side from the entered DOB so the
  // consent gate can require guardian consent for under-16s (FIX 2).
  const athleteAge = useMemo(() => {
    if (!dob) return null
    const d = new Date(dob)
    if (isNaN(d.getTime())) return null
    const now = new Date()
    let age = now.getFullYear() - d.getFullYear()
    const m = now.getMonth() - d.getMonth()
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
    return age
  }, [dob])
  const isMinor = athleteAge !== null && athleteAge < MINOR_CONSENT_AGE

  // Submit handler
  const handleSubmit = async () => {
    if (submittingRef.current) return

    // Consent must have been captured before any data entry. If the DOB was
    // later changed to a minor's, a guardian consent is required — block here
    // (mirrored by a server-side 400).
    if (!consentRecord?.agreed) {
      setSubmitError('Consent is required before this baseline can be submitted.')
      return
    }
    if (isMinor && !consentRecord.guardian?.agreed) {
      setSubmitError('This athlete is under 16. A parent/guardian must provide consent before submitting.')
      return
    }

    submittingRef.current = true
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
          testNumber,
          consent: consentRecord,
          athlete: {
            name, dob, idNumber, sex, dominantHand, sport, team, position,
            yearsOfEducation, primaryLanguage, previousConcussions,
            mostRecentConcussionDate, previousConcussionSymptoms, longestRecovery,
            diagnosedMigraines, medicalHistory: selectedConditions,
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
              score: immediateMemoryScore,
              wordsSelected: Object.entries(trialSelections[0] || {})
                .filter(([, s]) => s).map(([w]) => w),
              targetWords: [...WORD_LISTS[wordListKey]],
            },
            concentration: {
              digitsScore: digitsBackwardScore,
              monthsScore: monthsReverseScore,
              monthsTimeSeconds: monthsTimeElapsed || null,
              total: concentrationScore,
              digitTrials: digitAnswerLog,
              monthsOrder: monthsTapped,
            },
            delayedRecall: {
              score: delayedRecallScore,
              wordsSelected: Object.entries(delayedRecallSelections)
                .filter(([, s]) => s).map(([w]) => w),
              targetWords: [...WORD_LISTS[wordListKey]],
            },
          },
          oculomotor: oculomotorResults,
        }),
      })

      if (response.ok) {
        setSubmitted(true)
        // Non-clinical "submitted" signal only — no health scores in analytics.
        trackEvent(ANALYTICS_EVENTS.PRESEASON_BASELINE_SUBMIT, {
          clinicCode: code,
          clinicName,
          isDemo: code.toUpperCase() === 'DEMO00',
        })
      } else {
        const data = await response.json()
        setSubmitError(data.error || 'Failed to submit. Please try again.')
      }
    } catch {
      setSubmitError('Something went wrong. Please try again.')
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  // Handle digit submission
  const handleDigitSubmit = () => {
    const allDigits = DIGIT_LISTS[digitListKey]
    const currentSequence = allDigits[currentDigitIndex]
    // Extract just the digit characters from both sides
    const shownDigits = currentSequence.replace(/-/g, '')
    const expectedReverse = shownDigits.split('').reverse().join('')
    const userDigits = digitInput.trim().replace(/[^0-9]/g, '')
    const isCorrect = userDigits === expectedReverse

    setDigitResults(prev => [...prev, isCorrect])
    setDigitAnswerLog(prev => [...prev, {
      shown: currentSequence.replace(/-/g, ' '),
      expected: expectedReverse,
      typed: userDigits || '(empty)',
      correct: isCorrect,
    }])

    if (currentDigitIndex < allDigits.length - 1) {
      setCurrentDigitIndex(prev => prev + 1)
      setDigitPhase('showing')
      if (digitTimerRef.current) clearTimeout(digitTimerRef.current)
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
      // All months tapped correctly — time is the metric, not pass/fail
      const elapsed = (Date.now() - monthsStartTime) / 1000
      setMonthsTimeElapsed(parseFloat(elapsed.toFixed(1)))
      setMonthsCorrect(true)
      setMonthsPhase('done')
      if (monthsTimerRef.current) clearInterval(monthsTimerRef.current)
    }
  }

  // Handle trial completion — single trial, then done
  const completeTrialRecall = () => {
    setMemoryPhase('done')
    setMemoryTimestamp(Date.now())
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
          <h1 className="text-2xl font-bold mb-2">
            {clinicError === 'invalid' ? 'Invalid Link' : 'Service Temporarily Unavailable'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {clinicError === 'invalid'
              ? 'This baseline testing link is not valid. Please check with your clinic for the correct link.'
              : 'The baseline testing service is temporarily unavailable. Please try again in a few minutes.'}
          </p>
          {clinicError === 'unavailable' ? (
            <button
              onClick={() => window.location.reload()}
              className="btn-primary px-8 py-3 rounded-xl font-semibold"
            >
              Try Again
            </button>
          ) : (
            <button
              onClick={() => router.push('/')}
              className="btn-primary px-8 py-3 rounded-xl font-semibold"
            >
              Go to Concussion Education Australia
            </button>
          )}
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
            {code.toUpperCase() === 'DEMO00'
              ? 'This was a demo — no report was sent. Register your clinic to start collecting real baselines.'
              : <>Your results have been emailed to <strong>{clinicName}</strong>. Basic test records are stored to support future baseline comparisons.</>
            }
          </p>
          <p className="text-xs text-muted-foreground">
            Your detailed results have been included in the report sent to your clinician. This baseline covers a subset of the full SCAT6 assessment.
          </p>
        </div>
      </div>
    )
  }

  // Consent gate — shown before ANY health information is collected.
  // Records explicit consent (and guardian consent for under-16s) before the
  // athlete can reach step 1. (APP 3.3 — consent to collect sensitive info /
  // APP 5 — notice at the point of collection.)
  if (!consentGiven) {
    const canProceed = !!dob && consentAgreed && (!isMinor || (guardianName.trim().length > 0 && guardianAgreed))
    return (
      <div className="min-h-screen bg-background relative">
        <div className="mesh-gradient" aria-hidden="true" />
        <div className="noise-overlay" aria-hidden="true" />
        <div className="relative z-10 max-w-xl mx-auto px-4 py-8 md:py-12">
          <div className="text-center mb-6">
            <p className="text-xs text-accent font-semibold uppercase tracking-wider mb-1">
              Pre-Season Baseline
            </p>
            <p className="text-sm text-muted-foreground">
              for <strong className="text-foreground">{clinicName}</strong>
            </p>
          </div>

          <div className="glass rounded-2xl p-6 animate-fade-in">
            <h1 className="text-xl font-bold mb-2">Before you start — consent</h1>
            <p className="text-sm text-muted-foreground mb-4">
              This tool collects <strong>personal and health information</strong> (including your name,
              date of birth, sex, concussion and medical history, medications, and your symptom,
              cognitive and eye-movement results). It is collected so your clinic can establish a
              concussion baseline and support the management of any future suspected concussion.
              Your results are shared with <strong>{clinicName}</strong> and stored to allow comparison
              with future tests.
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Please read how we handle this information in our{' '}
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-accent font-semibold underline">
                Privacy Policy
              </a>{' '}before continuing.
            </p>

            {/* DOB up front so we can determine whether guardian consent is needed */}
            <div className="mb-4">
              <label className="block text-xs font-semibold mb-1">Athlete Date of Birth *</label>
              <input
                type="date"
                value={dob}
                onChange={e => setDob(e.target.value)}
                className="w-full glass px-3 py-2.5 rounded-lg text-sm border border-transparent focus:ring-2 focus:ring-accent/50 focus:outline-none"
              />
              {athleteAge !== null && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  Age: {athleteAge} years{isMinor ? ' — a parent/guardian must also consent below.' : ''}
                </p>
              )}
            </div>

            <label className="flex items-start gap-2 cursor-pointer mb-4">
              <input
                type="checkbox"
                checked={consentAgreed}
                onChange={e => setConsentAgreed(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-slate-300 text-accent focus:ring-accent flex-shrink-0"
              />
              <span className="text-sm">
                I consent to the collection and handling of this personal and health information for
                concussion baseline and management purposes, as described above and in the Privacy Policy.
              </span>
            </label>

            {/* Guardian consent — required for under-16s */}
            {isMinor && (
              <div className="glass rounded-xl p-4 mb-4 border border-amber-200 bg-amber-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <p className="text-sm font-semibold text-amber-800">Parent / guardian consent required</p>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Because the athlete is under {MINOR_CONSENT_AGE}, a parent or guardian must consent
                  on their behalf.
                </p>
                <div className="mb-3">
                  <label className="block text-xs font-semibold mb-1">Parent / Guardian Full Name *</label>
                  <input
                    type="text"
                    value={guardianName}
                    onChange={e => setGuardianName(e.target.value)}
                    className="w-full glass px-3 py-2.5 rounded-lg text-sm border border-transparent focus:ring-2 focus:ring-accent/50 focus:outline-none"
                    placeholder="Parent or guardian name"
                  />
                </div>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={guardianAgreed}
                    onChange={e => setGuardianAgreed(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-slate-300 text-accent focus:ring-accent flex-shrink-0"
                  />
                  <span className="text-sm">
                    I am the parent/guardian of this athlete and I consent to the collection and handling
                    of their personal and health information as described above and in the Privacy Policy.
                  </span>
                </label>
              </div>
            )}

            <button
              onClick={() => {
                const record: {
                  agreed: boolean
                  atISO: string
                  version: string
                  guardian?: { name: string; agreed: boolean }
                } = { agreed: true, atISO: new Date().toISOString(), version: CONSENT_VERSION }
                if (isMinor) record.guardian = { name: guardianName.trim(), agreed: true }
                setConsentRecord(record)
                setConsentGiven(true)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              disabled={!canProceed}
              className="w-full btn-primary py-3 rounded-xl text-base font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              I Consent — Continue <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-[11px] text-muted-foreground text-center mt-3">
              You can stop at any time. Required fields are marked *.
            </p>
          </div>
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
          {[1, 2, 3, 4, 5, 6].map(s => (
            <div
              key={s}
              className={`h-1.5 rounded-full flex-1 transition-all ${
                s <= step ? 'bg-accent' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center mb-4">
          Step {step} of {totalSteps}: {
            step === 1 ? 'Athlete Background' :
            step === 2 ? 'Symptom Evaluation' :
            step === 3 ? 'Cognitive Screening' :
            step === 4 ? 'Oculomotor Screening' :
            step === 5 ? 'Delayed Recall' :
            'Score Summary'
          }
        </p>

        {/* Test number indicator — shown after step 1 */}
        {step > 1 && testNumber > 0 && (
          <div className={`text-center mb-6 py-2.5 px-4 rounded-xl text-sm font-bold ${
            testNumber === 1
              ? 'bg-accent/10 text-accent'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            {testNumber === 1
              ? `Baseline Test 1 — ${name}`
              : `Baseline Test ${testNumber} — ${name}`
            }
          </div>
        )}

        {/* STEP 1: Athlete Background */}
        {step === 1 && (
          <div className="glass rounded-2xl p-6 animate-fade-in">
            <h2 className="text-lg font-bold mb-1">Athlete Information</h2>
            <p className="text-xs text-muted-foreground mb-4">All fields marked * are required for a complete baseline.</p>

            {validationError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{validationError}</p>
              </div>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Full Name *</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)}
                    className="w-full glass px-3 py-2.5 rounded-lg text-sm border border-transparent focus:ring-2 focus:ring-accent/50 focus:outline-none"
                    placeholder="Athlete name" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Date of Birth *</label>
                  <input type="date" value={dob} onChange={e => setDob(e.target.value)}
                    className="w-full glass px-3 py-2.5 rounded-lg text-sm border border-transparent focus:ring-2 focus:ring-accent/50 focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">ID / Jersey #*</label>
                  <input type="text" value={idNumber} onChange={e => setIdNumber(e.target.value)}
                    className="w-full glass px-3 py-2.5 rounded-lg text-sm border border-transparent focus:ring-2 focus:ring-accent/50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Sex *</label>
                  <select value={sex} onChange={e => setSex(e.target.value)}
                    className="w-full glass px-3 py-2.5 rounded-lg text-sm border border-transparent focus:ring-2 focus:ring-accent/50 focus:outline-none">
                    <option value="">Select</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Dominant Hand *</label>
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
                  <label className="block text-xs font-semibold mb-1">Sport *</label>
                  <input type="text" value={sport} onChange={e => setSport(e.target.value)}
                    className="w-full glass px-3 py-2.5 rounded-lg text-sm border border-transparent focus:ring-2 focus:ring-accent/50 focus:outline-none"
                    placeholder="e.g. AFL, Rugby" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Team / Club *</label>
                  <input type="text" value={team} onChange={e => setTeam(e.target.value)}
                    className="w-full glass px-3 py-2.5 rounded-lg text-sm border border-transparent focus:ring-2 focus:ring-accent/50 focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Position *</label>
                  <input type="text" value={position} onChange={e => setPosition(e.target.value)}
                    className="w-full glass px-3 py-2.5 rounded-lg text-sm border border-transparent focus:ring-2 focus:ring-accent/50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Years of Education *</label>
                  <input type="number" value={yearsOfEducation} onChange={e => setYearsOfEducation(e.target.value)}
                    className="w-full glass px-3 py-2.5 rounded-lg text-sm border border-transparent focus:ring-2 focus:ring-accent/50 focus:outline-none"
                    min="0" max="30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Primary Language *</label>
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
                  <label className="block text-xs font-semibold mb-1"># Previous Concussions *</label>
                  <input type="number" value={previousConcussions} onChange={e => setPreviousConcussions(e.target.value)}
                    className="w-full glass px-3 py-2.5 rounded-lg text-sm border border-transparent focus:ring-2 focus:ring-accent/50 focus:outline-none"
                    min="0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Most Recent Date *</label>
                  <input type="date" value={mostRecentConcussionDate} onChange={e => setMostRecentConcussionDate(e.target.value)}
                    className="w-full glass px-3 py-2.5 rounded-lg text-sm border border-transparent focus:ring-2 focus:ring-accent/50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Longest Recovery *</label>
                  <input type="text" value={longestRecovery} onChange={e => setLongestRecovery(e.target.value)}
                    className="w-full glass px-3 py-2.5 rounded-lg text-sm border border-transparent focus:ring-2 focus:ring-accent/50 focus:outline-none"
                    placeholder="e.g. 2 weeks" />
                </div>
              </div>

              {parseInt(previousConcussions) > 0 && (
                <div>
                  <label className="block text-xs font-semibold mb-1">Primary symptoms from most recent concussion *</label>
                  <input type="text" value={previousConcussionSymptoms} onChange={e => setPreviousConcussionSymptoms(e.target.value)}
                    className="w-full glass px-3 py-2.5 rounded-lg text-sm border border-transparent focus:ring-2 focus:ring-accent/50 focus:outline-none"
                    placeholder="e.g. headache, dizziness, memory issues" />
                </div>
              )}

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
              <label className="block text-xs font-semibold mb-1">Current Medications *</label>
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
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={feelNormalPercent}
                      onChange={e => {
                        const v = Math.max(0, Math.min(100, parseInt(e.target.value) || 0))
                        setFeelNormalPercent(String(v))
                      }}
                      className="w-14 glass px-2 py-1 rounded-lg text-sm font-bold text-center border border-transparent focus:ring-2 focus:ring-accent/50 focus:outline-none"
                    />
                    <span className="text-sm font-bold">%</span>
                  </div>
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
              {(['memory', 'orientation', 'digits', 'months'] as const).map((sub, i) => (
                <button
                  key={sub}
                  onClick={() => setCognitiveSubStep(sub)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    cognitiveSubStep === sub ? 'bg-accent text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {['Memory', 'Orientation', 'Digits', 'Months'][i]}
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
                      {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1, new Date().getFullYear() + 2].map(yr => (
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
                  <button onClick={() => { if (!orientationTimestamp) setOrientationTimestamp(new Date()); setCognitiveSubStep('digits') }}
                    className="btn-primary px-6 py-2.5 rounded-lg text-sm font-semibold inline-flex items-center gap-1">
                    Next: Digits Backward <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Immediate Memory */}
            {cognitiveSubStep === 'memory' && (
              <div>
                <h2 className="text-lg font-bold mb-2">Immediate Memory</h2>
                <p className="text-xs text-muted-foreground mb-4">
                  You'll be shown 10 words, one at a time. After all words are shown, select the ones you remember.
                </p>

                {memoryPhase === 'intro' && (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground mb-4">
                      Words will appear for 1.5 seconds each
                    </p>
                    <button onClick={startWordFlash}
                      className="btn-primary px-8 py-3 rounded-xl text-base font-semibold">
                      Start Memory Test
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
                      Select the words you remember
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
                    {(() => {
                      const selectedCount = Object.values(trialSelections[currentTrial] || {}).filter(Boolean).length
                      return (
                        <div className="mt-4 flex justify-between items-center">
                          <div className={`rounded-xl px-4 py-2 border-2 font-bold transition-all ${
                            selectedCount === 10
                              ? 'bg-green-100 border-green-500 text-green-700'
                              : selectedCount > 0
                                ? 'bg-accent/10 border-accent text-accent'
                                : 'bg-slate-100 border-slate-300 text-slate-500'
                          }`}>
                            <span className="text-lg">{selectedCount}</span>
                            <span className="text-base">/10</span>
                            <span className="text-xs ml-1.5 font-medium opacity-75">selected</span>
                          </div>
                          <button onClick={completeTrialRecall}
                            className="btn-primary px-6 py-2.5 rounded-lg text-sm font-semibold">
                            Done
                          </button>
                        </div>
                      )
                    })()}
                  </div>
                )}

                {memoryPhase === 'done' && (
                  <div className="text-center py-4">
                    <div className="icon-container w-12 h-12 mx-auto mb-3 bg-green-100">
                      <Check className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-sm font-semibold mb-1">Memory Test Complete</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Your responses have been recorded. You'll be asked to recall these words again at the end of the test.
                    </p>

                    <div className="mt-4">
                      <button onClick={() => setCognitiveSubStep('orientation')}
                        className="btn-primary px-6 py-2.5 rounded-lg text-sm font-semibold inline-flex items-center gap-1">
                        Next: Orientation <ChevronRight className="w-4 h-4" />
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
                    <p className="text-xs text-muted-foreground mb-3">e.g. if shown 4-9-3, type 394</p>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
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
                  <div className="py-4">
                    <div className="text-center">
                      <div className="icon-container w-12 h-12 mx-auto mb-3 bg-green-100">
                        <Check className="w-6 h-6 text-green-600" />
                      </div>
                      <p className="text-sm font-semibold mb-1">Digits Backward Complete</p>
                      <p className="text-xs text-muted-foreground mt-1">Your responses have been recorded.</p>
                    </div>

                    <div className="mt-4 text-center">
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
                  Tap the months in reverse order: December → January. Time to complete is recorded.
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
                    <div className="text-center mb-4">
                      <p className="text-4xl font-mono font-bold text-accent tabular-nums">
                        {monthsTimeElapsed.toFixed(1)}s
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {monthsTapped.length}/12 — tap in reverse order
                      </p>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {shuffledMonths.map(month => {
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
                  </div>
                )}

                {monthsPhase === 'done' && (
                  <div className="text-center py-4">
                    <div className="icon-container w-12 h-12 mx-auto mb-3 bg-green-100">
                      <Check className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-lg font-bold mb-1">Section Complete</p>
                    <p className="text-sm text-muted-foreground">Your responses have been recorded.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Oculomotor Screening */}
        {step === 4 && (
          <div className="glass rounded-2xl p-6 animate-fade-in">
            {/* Sub-step 0: Instructions */}
            {oculomotorSubStep === 0 && (
              <div>
                <h2 className="text-lg font-bold mb-2">Oculomotor Screening</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  This screen tests your eye movements. You will follow a dot with your eyes through 4 short exercises, then report any symptoms after each.
                </p>
                <div className="glass rounded-xl p-4 mb-4 space-y-2">
                  <p className="text-sm font-semibold">Instructions:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                    <li>Hold your device at arm&apos;s length</li>
                    <li>Keep your head still throughout</li>
                    <li>Follow the dot with your eyes only</li>
                  </ul>
                </div>
                <div className="text-center">
                  <button
                    onClick={() => setOculomotorSubStep(1)}
                    className="btn-primary px-8 py-3 rounded-xl text-base font-semibold"
                  >
                    Begin Exercises
                  </button>
                </div>
              </div>
            )}

            {/* Exercise sub-steps: 1=exercise, 2=report, 3=exercise, 4=report, etc. */}
            {oculomotorSubStep >= 1 && oculomotorSubStep <= 8 && (() => {
              const isExercise = oculomotorSubStep % 2 === 1
              const exerciseIndex = Math.floor((oculomotorSubStep - 1) / 2)
              const exercise = OCULOMOTOR_EXERCISES[exerciseIndex]

              if (isExercise) {
                // Exercise animation sub-step
                return (
                  <OculomotorExercise
                    key={exercise.key}
                    exercise={exercise}
                    exerciseIndex={exerciseIndex}
                    running={oculomotorExerciseRunning}
                    onStart={() => setOculomotorExerciseRunning(true)}
                    onComplete={() => {
                      setOculomotorExerciseRunning(false)
                      setOculomotorSubStep(prev => prev + 1)
                    }}
                    timerRef={oculomotorTimerRef}
                    rafRef={oculomotorRafRef}
                  />
                )
              } else {
                // Symptom report sub-step
                const result = oculomotorResults[exercise.key]
                return (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-lg font-bold">Symptom Report</h2>
                      <span className="text-xs font-semibold text-accent bg-accent/10 px-2.5 py-1 rounded-full">
                        Exercise {exerciseIndex + 1}/4
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      After <strong>{exercise.label}</strong>, did you experience any of the following?
                    </p>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {OCULOMOTOR_SYMPTOMS.map(symptom => {
                        const isNone = symptom === 'None'
                        const isSelected = result.symptoms.includes(symptom)
                        return (
                          <button
                            key={symptom}
                            onClick={() => {
                              setOculomotorResults(prev => {
                                const current = prev[exercise.key]
                                let newSymptoms: string[]
                                if (isNone) {
                                  newSymptoms = isSelected ? [] : ['None']
                                } else {
                                  newSymptoms = current.symptoms.filter(s => s !== 'None')
                                  if (isSelected) {
                                    newSymptoms = newSymptoms.filter(s => s !== symptom)
                                  } else {
                                    newSymptoms = [...newSymptoms, symptom]
                                  }
                                }
                                return {
                                  ...prev,
                                  [exercise.key]: {
                                    ...current,
                                    symptoms: newSymptoms,
                                    severity: newSymptoms.length === 0 || (newSymptoms.length === 1 && newSymptoms[0] === 'None') ? 0 : current.severity,
                                  },
                                }
                              })
                              // Cancel any pending auto-advance when a non-None symptom is selected
                              if (!isNone && oculomotorAutoAdvanceRef.current) {
                                clearTimeout(oculomotorAutoAdvanceRef.current)
                                oculomotorAutoAdvanceRef.current = null
                              }
                              // Auto-advance when "None" is selected
                              if (isNone && !isSelected) {
                                oculomotorAutoAdvanceRef.current = setTimeout(() => {
                                  setOculomotorSubStep(prev => prev + 1)
                                  oculomotorAutoAdvanceRef.current = null
                                }, 300)
                              }
                            }}
                            className={`p-2.5 rounded-xl text-sm font-medium transition-all ${
                              isSelected
                                ? isNone ? 'bg-green-100 text-green-700 ring-1 ring-green-400' : 'bg-accent text-white'
                                : 'glass hover:bg-slate-50'
                            } ${isNone ? 'col-span-2' : ''}`}
                          >
                            {symptom}
                          </button>
                        )
                      })}
                    </div>

                    {result.symptoms.length > 0 && !result.symptoms.includes('None') && (
                      <div className="mb-4">
                        <label className="block text-xs font-semibold mb-2">Overall severity (0-10)</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="10"
                            value={result.severity}
                            onChange={e => {
                              setOculomotorResults(prev => ({
                                ...prev,
                                [exercise.key]: { ...prev[exercise.key], severity: parseInt(e.target.value) },
                              }))
                            }}
                            className="flex-1 accent-accent"
                          />
                          <span className="text-sm font-bold w-8 text-right">{result.severity}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button
                        onClick={() => setOculomotorSubStep(prev => prev + 1)}
                        className="btn-primary px-6 py-2.5 rounded-lg text-sm font-semibold inline-flex items-center gap-1"
                      >
                        {exerciseIndex < 3 ? 'Next Exercise' : 'View Summary'} <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              }
            })()}

            {/* Sub-step 9: Summary */}
            {oculomotorSubStep === 9 && (() => {
              const symptomatic = OCULOMOTOR_EXERCISES.filter(ex => {
                const r = oculomotorResults[ex.key]
                return r.symptoms.length > 0 && !r.symptoms.includes('None')
              }).length
              return (
                <div>
                  <h2 className="text-lg font-bold mb-2">Oculomotor Summary</h2>
                  <p className="text-xs text-muted-foreground mb-4">Results from all 4 eye movement exercises</p>

                  <div className="grid grid-cols-2 gap-3">
                    {OCULOMOTOR_EXERCISES.map(ex => {
                      const result = oculomotorResults[ex.key]
                      const hasSymptoms = result.symptoms.length > 0 && !result.symptoms.includes('None')
                      return (
                        <div key={ex.key} className={`glass rounded-xl p-3 border ${hasSymptoms ? 'border-amber-200 bg-amber-50/50' : 'border-green-200 bg-green-50/50'}`}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${hasSymptoms ? 'bg-amber-100' : 'bg-green-100'}`}>
                              {hasSymptoms
                                ? <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                : <Check className="w-3.5 h-3.5 text-green-600" />
                              }
                            </div>
                            <p className="text-xs font-bold leading-tight">{ex.label}</p>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {hasSymptoms ? `${result.symptoms.join(', ')} — ${result.severity}/10` : 'No symptoms'}
                          </p>
                        </div>
                      )
                    })}
                  </div>

                  <div className={`glass rounded-xl p-3 mt-4 text-center border ${symptomatic > 0 ? 'border-amber-200' : 'border-green-200'}`}>
                    <p className="text-sm font-semibold">
                      <span className={symptomatic > 0 ? 'text-amber-600' : 'text-green-600'}>{symptomatic}/4</span> exercises provoked symptoms
                    </p>
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* STEP 5: Delayed Recall */}
        {step === 5 && (
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
                  You can go back to review previous sections while waiting, or proceed when ready.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
                  <button
                    onClick={() => setDelayedRecallReady(true)}
                    className="btn-primary px-6 py-2.5 rounded-lg text-sm font-semibold"
                  >
                    Complete Delayed Recall Now
                  </button>
                  <button
                    onClick={() => { setStep(2); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                    className="btn-secondary px-6 py-2.5 rounded-lg text-sm font-semibold"
                  >
                    Review Previous Sections
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Select the words you recall from the memory test earlier.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {delayedRecallPool.map(({ word }) => (
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
                {(() => {
                  const selectedCount = Object.values(delayedRecallSelections).filter(Boolean).length
                  return (
                    <div className="mt-3 text-center">
                      <div className={`inline-block rounded-xl px-4 py-2 border-2 font-bold transition-all ${
                        selectedCount === 10
                          ? 'bg-green-100 border-green-500 text-green-700'
                          : selectedCount > 0
                            ? 'bg-accent/10 border-accent text-accent'
                            : 'bg-slate-100 border-slate-300 text-slate-500'
                      }`}>
                        <span className="text-lg">{selectedCount}</span>
                        <span className="text-base">/10</span>
                        <span className="text-xs ml-1.5 font-medium opacity-75">selected</span>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        )}

        {/* STEP 6: Review & Submit */}
        {step === 6 && (
          <div className="glass rounded-2xl p-6 animate-fade-in">
            <div className="text-center mb-4">
              <div className="icon-container w-14 h-14 mx-auto mb-3 bg-green-100">
                <Check className="w-7 h-7 text-green-600" />
              </div>
              <h2 className="text-lg font-bold">All Sections Complete</h2>
              <p className="text-sm text-muted-foreground mt-1">
                All responses have been recorded. Tap &quot;Submit&quot; to send your baseline report to your clinician.
              </p>
            </div>

            <div className="glass rounded-xl p-4 mb-3">
              <p className="text-sm font-semibold mb-2">Sections completed:</p>
              <div className="space-y-1.5">
                {['Symptom Evaluation', 'Orientation', 'Immediate Memory', 'Concentration', 'Delayed Recall', 'Oculomotor Screening'].map(section => (
                  <div key={section} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                    <span>{section}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Your detailed scores will be included in the clinician&apos;s report only.
            </p>

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
              onClick={() => { setStep(prev => prev - 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              className="btn-secondary px-6 py-2.5 rounded-lg text-sm font-semibold inline-flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : <div />}

          {step < totalSteps && (
            <button
              onClick={() => {
                if (step === 1) {
                  if (!name) {
                    setValidationError('Please enter the athlete\'s name to continue.')
                    return
                  }
                  if (!sex) {
                    setValidationError('Please select sex to continue.')
                    return
                  }
                  if (!sport) {
                    setValidationError('Please enter the sport to continue.')
                    return
                  }
                  // Look up previous baselines for this athlete (only once)
                  setValidationError('')
                  if (historyLookedUpRef.current) {
                    setStep(2)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  } else {
                    setLookingUpHistory(true)
                    fetch('/api/preseason/athlete-history', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ clinicCode: code, name: name.trim(), dob }),
                    })
                      .then(res => res.json())
                      .then(data => {
                        // Endpoint now returns only the next test number (no
                        // enumerable date list). Derive list rotation from it.
                        const tn = data.testNumber || 1
                        setTestNumber(tn)
                        // Rotate word list based on athlete's actual test count: 1st→A, 2nd→B, 3rd→C, 4th→A...
                        setListIndex((tn - 1) % 3)
                      })
                      .catch(() => {
                        // On error, default to test #1 / list A
                        setTestNumber(1)
                        setListIndex(0)
                      })
                      .finally(() => {
                        historyLookedUpRef.current = true
                        setLookingUpHistory(false)
                        setStep(2)
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      })
                  }
                  return
                }
                setSubmitError('')
                setStep(prev => prev + 1)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              disabled={(step === 5 && !delayedRecallReady) || (step === 3 && (memoryPhase !== 'done' || digitPhase !== 'done' || monthsPhase !== 'done')) || (step === 4 && oculomotorSubStep < 9) || lookingUpHistory}
              className="btn-primary px-6 py-2.5 rounded-lg text-sm font-semibold inline-flex items-center gap-1 disabled:opacity-50"
            >
              {lookingUpHistory ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</>
              ) : (
                <>Next <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
