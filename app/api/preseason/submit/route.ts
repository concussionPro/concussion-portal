import { NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { jsPDF } from 'jspdf'
import { sendEmailWithAttachment, sendEmail } from '@/lib/resend-client'
import { CONFIG } from '@/lib/config'
import { sql } from '@/lib/db'
import { generateComparisonPdf, type ComparisonTest } from '@/lib/preseason/comparison-pdf'
import { notAnswered, percentOrNotAnswered } from '@/lib/preseason/report-format'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

interface ClinicData {
  clinicName: string
  contactName: string
  email: string
  createdAt: string
}

interface SymptomData {
  ratings: number[]
  feelNormalPercent: string
  notNormalReason: string
  physicalWorsens: boolean
  mentalWorsens: boolean
}

interface CognitiveData {
  orientation: {
    month: string; date: string; dayOfWeek: string; year: string; time: string
    // null when the section was not administered. Legacy submissions always
    // sent a number (and `administered` is absent) — those are treated as
    // administered so historic reports are unchanged.
    score: number | null
    administered?: boolean
  }
  immediateMemory: {
    listUsed: string; score?: number; trial1?: number; trial2?: number; trial3?: number; total?: number
    wordsSelected?: string[]
    targetWords?: string[]
  }
  concentration: {
    digitsScore: number; monthsScore: number; monthsTimeSeconds?: number | null; total: number
    digitTrials?: { shown: string; expected: string; typed: string; correct: boolean }[]
    monthsOrder?: string[]
  }
  delayedRecall: {
    score: number
    wordsSelected?: string[]
    targetWords?: string[]
    /** TRUE seconds between the end of immediate memory and opening the recall list. */
    delaySeconds?: number | null
    requiredDelaySeconds?: number
    delayIntervalMet?: boolean
    /** Recall was started before the interval elapsed, by explicit override. */
    earlyStartOverride?: boolean
  }
}

/** Orientation counts toward scoring only when it was actually administered. */
function orientationAdministered(o: CognitiveData['orientation']): boolean {
  if (o.administered === false) return false
  return o.score !== null && o.score !== undefined
}

function fmtInterval(seconds: number): string {
  const s = Math.max(0, Math.round(seconds))
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
}

interface AthleteBackground {
  name: string
  dob: string
  idNumber: string
  sex: string
  dominantHand: string
  sport: string
  team: string
  position: string
  yearsOfEducation: string
  primaryLanguage: string
  previousConcussions: string
  mostRecentConcussionDate: string
  previousConcussionSymptoms?: string
  longestRecovery: string
  diagnosedMigraines: boolean
  medicalHistory: string[]
  currentMedications: string
}

interface OculomotorExerciseResult {
  symptoms: string[]
  severity: number
}

interface OculomotorData {
  horizontalSaccades: OculomotorExerciseResult
  verticalSaccades: OculomotorExerciseResult
  horizontalPursuit: OculomotorExerciseResult
  verticalPursuit: OculomotorExerciseResult
}

interface ConsentData {
  agreed: boolean
  atISO?: string
  version?: string
  guardian?: { name: string; agreed: boolean }
}

interface SubmitPayload {
  clinicCode: string
  testNumber?: number
  consent?: ConsentData
  athlete: AthleteBackground
  symptoms: SymptomData
  cognitive: CognitiveData
  oculomotor?: OculomotorData
}

// Age (in years) below which a parent/guardian must also consent. NOTE: 16 is a
// working threshold — the exact age of capacity for health-data consent should
// be confirmed with legal advice (varies by state and information type).
const MINOR_CONSENT_AGE = 16

// Years between a DOB string and now. Returns null if DOB is missing/invalid.
function ageFromDob(dob?: string): number | null {
  if (!dob) return null
  const d = new Date(dob)
  if (isNaN(d.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return age
}

const SYMPTOMS = [
  'Headache', 'Pressure in head', 'Neck pain', 'Nausea or vomiting', 'Dizziness',
  'Blurred vision', 'Balance problems', 'Sensitivity to light', 'Sensitivity to noise',
  'Feeling slowed down', 'Feeling like in a fog', "Don't feel right",
  'Difficulty concentrating', 'Difficulty remembering', 'Fatigue or low energy',
  'Confusion', 'Drowsiness', 'More emotional', 'Irritability', 'Sadness',
  'Nervous or anxious', 'Trouble falling asleep',
]

function generatePdf(data: SubmitPayload, clinicName: string): Buffer {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const contentWidth = pageWidth - 2 * margin
  let y = 20

  const addText = (text: string, x: number, currentY: number, opts?: { fontSize?: number; fontStyle?: string; maxWidth?: number }) => {
    doc.setFontSize(opts?.fontSize || 10)
    if (opts?.fontStyle) doc.setFont('helvetica', opts.fontStyle)
    else doc.setFont('helvetica', 'normal')
    doc.text(text, x, currentY, { maxWidth: opts?.maxWidth || contentWidth })
  }

  const checkPage = (needed: number) => {
    if (y + needed > 275) {
      doc.addPage()
      y = 20
    }
  }

  const drawLine = () => {
    doc.setDrawColor(200)
    doc.line(margin, y, pageWidth - margin, y)
    y += 5
  }

  // Header
  doc.setFillColor(91, 154, 166)
  doc.rect(0, 0, pageWidth, 35, 'F')
  doc.setTextColor(255, 255, 255)
  const testLabel = data.testNumber && data.testNumber > 1 ? ` (Test #${data.testNumber})` : ''
  addText(`SCAT6 Pre-Season Baseline — Self-Administered${testLabel}`, margin, 15, { fontSize: 16, fontStyle: 'bold' })
  addText(`Generated: ${new Date().toLocaleDateString('en-AU', { dateStyle: 'full' })} at ${new Date().toLocaleTimeString('en-AU', { timeStyle: 'short' })}`, margin, 25, { fontSize: 9 })
  doc.setTextColor(0, 0, 0)
  y = 45

  // Clinic info
  addText(`Clinic: ${clinicName}`, margin, y, { fontSize: 11, fontStyle: 'bold' })
  y += 10

  // Athlete details
  addText('ATHLETE INFORMATION', margin, y, { fontSize: 12, fontStyle: 'bold' })
  y += 8

  // Age from DOB — uses the SAME calendar-accurate helper as the under-16
  // guardian-consent gate. The old 365.25-day division disagreed with it by a
  // year around birthdays, so the printed age could contradict the consent
  // decision made on the same submission.
  const ageYears = ageFromDob(data.athlete.dob)
  const ageString = ageYears !== null ? `${ageYears} years` : '—'

  const fields = [
    ['Name', data.athlete.name], ['Date of Birth', data.athlete.dob],
    ['Age', ageString], ['Sex', data.athlete.sex],
    ['ID/Jersey', data.athlete.idNumber], ['Dominant Hand', data.athlete.dominantHand],
    ['Sport', data.athlete.sport], ['Team/Club', data.athlete.team],
    ['Position', data.athlete.position], ['Years of Education', data.athlete.yearsOfEducation],
    ['Primary Language', data.athlete.primaryLanguage],
  ]

  for (let i = 0; i < fields.length; i += 2) {
    const left = fields[i]
    const right = fields[i + 1]
    addText(`${left[0]}:`, margin, y, { fontSize: 9, fontStyle: 'bold' })
    addText(left[1] || '—', margin + 40, y, { fontSize: 9 })
    if (right) {
      addText(`${right[0]}:`, margin + contentWidth / 2, y, { fontSize: 9, fontStyle: 'bold' })
      addText(right[1] || '—', margin + contentWidth / 2 + 40, y, { fontSize: 9 })
    }
    y += 6
  }
  y += 5

  // Concussion & Medical History
  drawLine()
  addText('CONCUSSION & MEDICAL HISTORY', margin, y, { fontSize: 12, fontStyle: 'bold' })
  y += 8

  // `|| '0'` printed "Previous Concussions: 0" for an athlete who never answered
  // — a fabricated negative on the strongest risk factor in the record. An
  // unanswered field must read as unanswered so the clinician can chase it.
  addText(`Previous Concussions: ${notAnswered(data.athlete.previousConcussions)}`, margin, y, { fontSize: 9 })
  y += 6
  addText(`Most Recent: ${data.athlete.mostRecentConcussionDate || 'N/A'}`, margin, y, { fontSize: 9 })
  addText(`Longest Recovery: ${data.athlete.longestRecovery || 'N/A'}`, margin + contentWidth / 2, y, { fontSize: 9 })
  y += 6
  if (data.athlete.previousConcussionSymptoms) {
    addText(`Previous Concussion Symptoms: ${data.athlete.previousConcussionSymptoms}`, margin, y, { fontSize: 9, maxWidth: contentWidth })
    y += Math.ceil(data.athlete.previousConcussionSymptoms.length / 90) * 5 + 3
  }
  addText(`Diagnosed Migraines: ${data.athlete.diagnosedMigraines ? 'Yes' : 'No'}`, margin, y, { fontSize: 9 })
  y += 6

  const medHistory = data.athlete.medicalHistory || []
  if (medHistory.length > 0) {
    addText(`Medical History: ${medHistory.join(', ')}`, margin, y, { fontSize: 9, maxWidth: contentWidth })
    y += Math.ceil(medHistory.join(', ').length / 90) * 5 + 3
  }
  if (data.athlete.currentMedications) {
    addText(`Current Medications: ${data.athlete.currentMedications}`, margin, y, { fontSize: 9, maxWidth: contentWidth })
    y += 8
  }
  y += 5

  // Symptom Evaluation
  checkPage(80)
  drawLine()
  addText('SYMPTOM EVALUATION', margin, y, { fontSize: 12, fontStyle: 'bold' })
  y += 8

  const symptomCount = data.symptoms.ratings.filter(r => r > 0).length
  const symptomTotal = data.symptoms.ratings.reduce((a, b) => a + b, 0)

  addText(`Symptom Number: ${symptomCount}/22`, margin, y, { fontSize: 10, fontStyle: 'bold' })
  addText(`Severity Score: ${symptomTotal}/132`, margin + contentWidth / 2, y, { fontSize: 10, fontStyle: 'bold' })
  y += 8

  // Individual symptoms in 2 columns
  for (let i = 0; i < SYMPTOMS.length; i += 2) {
    checkPage(6)
    const left = `${SYMPTOMS[i]}: ${data.symptoms.ratings[i]}`
    addText(left, margin, y, { fontSize: 8 })
    if (i + 1 < SYMPTOMS.length) {
      const right = `${SYMPTOMS[i + 1]}: ${data.symptoms.ratings[i + 1]}`
      addText(right, margin + contentWidth / 2, y, { fontSize: 8 })
    }
    y += 5
  }
  y += 3

  addText(`Feels normal: ${percentOrNotAnswered(data.symptoms.feelNormalPercent)}`, margin, y, { fontSize: 9 })
  y += 5
  if (data.symptoms.notNormalReason) {
    addText(`Reason: ${data.symptoms.notNormalReason}`, margin, y, { fontSize: 9, maxWidth: contentWidth })
    y += 6
  }
  addText(`Physical activity worsens symptoms: ${data.symptoms.physicalWorsens ? 'Yes' : 'No'}`, margin, y, { fontSize: 9 })
  y += 5
  addText(`Mental activity worsens symptoms: ${data.symptoms.mentalWorsens ? 'Yes' : 'No'}`, margin, y, { fontSize: 9 })
  y += 10

  // Cognitive Scores
  checkPage(60)
  drawLine()
  addText('COGNITIVE SCREENING', margin, y, { fontSize: 12, fontStyle: 'bold' })
  y += 10

  // Resolve immediate memory score — handles both old (trial1/2/3/total) and new (score) formats
  const imm = data.cognitive.immediateMemory
  const hasTrials = imm.trial1 !== undefined && imm.trial1 !== null
  const immTotal = imm.total ?? imm.score ?? 0
  const immMax = hasTrials ? '30' : '10'

  // Orientation is only scored when it was administered. An unanswered
  // orientation used to evaluate to 0 from empty strings and print as a real
  // "0 / 5" — a fabricated clinical value. It now reports as not administered
  // and is excluded from the total (and from the total's maximum).
  const orientDone = orientationAdministered(data.cognitive.orientation)
  const orientScore = orientDone ? (data.cognitive.orientation.score as number) : 0

  // Score table
  const scores: string[][] = [
    ['Orientation', orientDone ? `${orientScore}` : 'Not administered', orientDone ? '5' : '—'],
    ['Immediate Memory', `${immTotal}`, immMax],
  ]
  if (hasTrials) {
    scores.push(
      ['  Trial 1', `${imm.trial1}`, '10'],
      ['  Trial 2', `${imm.trial2 ?? 0}`, '10'],
      ['  Trial 3', `${imm.trial3 ?? 0}`, '10'],
    )
  }
  scores.push(
    ['Concentration', `${data.cognitive.concentration.total}`, '5'],
    ['  Digits Backward', `${data.cognitive.concentration.digitsScore}`, '4'],
    ['  Months in Reverse', `${data.cognitive.concentration.monthsScore}`, '1'],
    ['Delayed Recall', `${data.cognitive.delayedRecall.score}`, '10'],
  )

  // Table header
  doc.setFillColor(240, 240, 240)
  doc.rect(margin, y - 4, contentWidth, 8, 'F')
  addText('Component', margin + 2, y, { fontSize: 9, fontStyle: 'bold' })
  addText('Score', margin + contentWidth - 50, y, { fontSize: 9, fontStyle: 'bold' })
  addText('Max', margin + contentWidth - 20, y, { fontSize: 9, fontStyle: 'bold' })
  y += 8

  for (const row of scores) {
    checkPage(7)
    const isIndented = row[0].startsWith('  ')
    addText(row[0], margin + 2, y, { fontSize: isIndented ? 8 : 9, fontStyle: isIndented ? 'normal' : 'bold' })
    addText(row[1], margin + contentWidth - 50, y, { fontSize: 9 })
    addText(row[2], margin + contentWidth - 20, y, { fontSize: 9 })
    y += 6
  }

  y += 4
  doc.setFillColor(91, 154, 166)
  doc.rect(margin, y - 4, contentWidth, 10, 'F')
  doc.setTextColor(255, 255, 255)
  const totalCognitive = orientScore + immTotal +
    data.cognitive.concentration.total + data.cognitive.delayedRecall.score
  const totalMax = (hasTrials ? 50 : 30) - (orientDone ? 0 : 5)
  addText('TOTAL COGNITIVE SCORE', margin + 2, y + 1, { fontSize: 11, fontStyle: 'bold' })
  addText(`${totalCognitive}/${totalMax}`, margin + contentWidth - 50, y + 1, { fontSize: 11, fontStyle: 'bold' })
  doc.setTextColor(0, 0, 0)
  y += 15

  addText(`Word List Used: List ${data.cognitive.immediateMemory.listUsed}`, margin, y, { fontSize: 9 })
  y += 10

  // Immediate Memory — Word Recognition Detail
  if (imm.targetWords && imm.wordsSelected) {
    checkPage(35)
    addText('IMMEDIATE MEMORY — WORD RECOGNITION', margin, y, { fontSize: 10, fontStyle: 'bold' })
    y += 7
    const selectedSet = new Set(imm.wordsSelected)
    const targetSet = new Set(imm.targetWords)
    const hits = imm.targetWords.filter(w => selectedSet.has(w))
    const misses = imm.targetWords.filter(w => !selectedSet.has(w))
    const falsePositives = imm.wordsSelected.filter(w => !targetSet.has(w))

    // Target words with hit/miss indicator
    addText('Target Words:', margin, y, { fontSize: 8, fontStyle: 'bold' })
    y += 5
    const targetDisplay = imm.targetWords.map(w => `${w} ${selectedSet.has(w) ? '(Y)' : '(N)'}`).join('   ')
    addText(targetDisplay, margin + 4, y, { fontSize: 8, maxWidth: contentWidth - 4 })
    y += Math.ceil(targetDisplay.length / 95) * 5 + 3

    if (falsePositives.length > 0) {
      addText(`False Positives: ${falsePositives.join(', ')}`, margin, y, { fontSize: 8 })
      y += 5
    }

    addText(`${hits.length}/10 correct  ·  ${misses.length} miss${misses.length !== 1 ? 'es' : ''}  ·  ${falsePositives.length} false positive${falsePositives.length !== 1 ? 's' : ''}`, margin, y, { fontSize: 8, fontStyle: 'bold' })
    y += 8
  }

  // Orientation answers
  checkPage(30)
  addText('Orientation Responses:', margin, y, { fontSize: 9, fontStyle: 'bold' })
  y += 6
  const orient = data.cognitive.orientation
  if (!orientDone) {
    addText('  NOT ADMINISTERED — no orientation score is reported for this test.', margin, y, { fontSize: 8, fontStyle: 'bold' })
    y += 5
  }
  for (const [label, val] of [['Month', orient.month], ['Date', orient.date], ['Day', orient.dayOfWeek], ['Year', orient.year], ['Time', orient.time]]) {
    addText(`  ${label}: ${val || '—'}`, margin, y, { fontSize: 8 })
    y += 5
  }
  y += 10

  // Digits Backward — Trial Detail
  const conc = data.cognitive.concentration
  if (conc.digitTrials && conc.digitTrials.length > 0) {
    checkPage(70)
    drawLine()
    addText('DIGITS BACKWARD — TRIAL DETAIL', margin, y, { fontSize: 10, fontStyle: 'bold' })
    y += 8

    // Table header
    doc.setFillColor(240, 240, 240)
    doc.rect(margin, y - 4, contentWidth, 8, 'F')
    const dtCols = [margin + 2, margin + 28, margin + 68, margin + 112, margin + contentWidth - 22]
    addText('Length', dtCols[0], y, { fontSize: 7, fontStyle: 'bold' })
    addText('Shown', dtCols[1], y, { fontSize: 7, fontStyle: 'bold' })
    addText('Expected', dtCols[2], y, { fontSize: 7, fontStyle: 'bold' })
    addText('Response', dtCols[3], y, { fontSize: 7, fontStyle: 'bold' })
    addText('Result', dtCols[4], y, { fontSize: 7, fontStyle: 'bold' })
    y += 7

    // Track which length levels had at least one correct trial
    const lengthLevels = new Map<number, boolean>()
    for (const trial of conc.digitTrials) {
      checkPage(6)
      const len = trial.shown.replace(/[^0-9]/g, '').length || trial.shown.split(/[-\s]/).length
      if (!lengthLevels.has(len)) lengthLevels.set(len, false)
      if (trial.correct) lengthLevels.set(len, true)

      addText(`${len}-digit`, dtCols[0], y, { fontSize: 7 })
      addText(trial.shown, dtCols[1], y, { fontSize: 7 })
      addText(trial.expected, dtCols[2], y, { fontSize: 7 })
      addText(trial.typed || '—', dtCols[3], y, { fontSize: 7 })
      addText(trial.correct ? 'PASS' : 'FAIL', dtCols[4], y, { fontSize: 7, fontStyle: trial.correct ? 'bold' : 'normal' })
      y += 5
    }
    y += 3

    // Scoring explanation
    const passedLevels = [...lengthLevels.entries()].filter(([, passed]) => passed).map(([len]) => `${len}-digit`)
    addText(`Score = length levels with at least 1 correct trial: ${passedLevels.join(', ') || 'none'}`, margin, y, { fontSize: 7 })
    y += 4
    addText(`Digits Backward Score: ${conc.digitsScore}/4`, margin, y, { fontSize: 8, fontStyle: 'bold' })
    y += 8
  }

  // Months in Reverse — Detail
  if (conc.monthsOrder && conc.monthsOrder.length > 0) {
    checkPage(25)
    if (!conc.digitTrials || conc.digitTrials.length === 0) drawLine()
    addText('MONTHS IN REVERSE — DETAIL', margin, y, { fontSize: 10, fontStyle: 'bold' })
    y += 7
    const completed = conc.monthsScore === 1
    addText(`Completed: ${completed ? 'Yes (all 12 months in correct reverse order)' : `No — reached ${conc.monthsOrder.length}/12 before error`}`, margin, y, { fontSize: 8 })
    y += 5
    if (conc.monthsTimeSeconds != null) {
      addText(`Time: ${conc.monthsTimeSeconds.toFixed(1)} seconds`, margin, y, { fontSize: 8 })
      y += 5
    }
    const orderStr = conc.monthsOrder.join(' > ')
    addText(`Order: ${orderStr}`, margin, y, { fontSize: 8, maxWidth: contentWidth })
    y += Math.ceil(orderStr.length / 90) * 5 + 5
  }

  // Delayed Recall — Word Recognition Detail
  const dr = data.cognitive.delayedRecall
  if (dr.targetWords && dr.wordsSelected) {
    checkPage(30)
    drawLine()
    addText('DELAYED RECALL — WORD RECOGNITION', margin, y, { fontSize: 10, fontStyle: 'bold' })
    y += 7
    // Actual elapsed interval between immediate memory and recall. The 5-minute
    // delay used to be bypassable from second 0 and was never recorded, so this
    // number could not be checked at all.
    if (dr.delaySeconds != null) {
      const required = dr.requiredDelaySeconds ?? 300
      const met = dr.delayIntervalMet ?? dr.delaySeconds >= required
      addText(
        `Delay interval: ${fmtInterval(dr.delaySeconds)} (protocol ${fmtInterval(required)}) — ${met ? 'met' : 'NOT MET, recall started early by explicit override'}`,
        margin, y, { fontSize: 8, fontStyle: met ? 'normal' : 'bold', maxWidth: contentWidth }
      )
      y += 6
    } else {
      addText('Delay interval: not recorded (test submitted before interval tracking).', margin, y, { fontSize: 8 })
      y += 6
    }
    const drSelectedSet = new Set(dr.wordsSelected)
    const drTargetSet = new Set(dr.targetWords)
    const drHits = dr.targetWords.filter(w => drSelectedSet.has(w))
    const drMisses = dr.targetWords.filter(w => !drSelectedSet.has(w))
    const drFalsePositives = dr.wordsSelected.filter(w => !drTargetSet.has(w))

    addText('Target Words:', margin, y, { fontSize: 8, fontStyle: 'bold' })
    y += 5
    const drDisplay = dr.targetWords.map(w => `${w} ${drSelectedSet.has(w) ? '(Y)' : '(N)'}`).join('   ')
    addText(drDisplay, margin + 4, y, { fontSize: 8, maxWidth: contentWidth - 4 })
    y += Math.ceil(drDisplay.length / 95) * 5 + 3

    if (drFalsePositives.length > 0) {
      addText(`False Positives: ${drFalsePositives.join(', ')}`, margin, y, { fontSize: 8 })
      y += 5
    }

    addText(`${drHits.length}/10 correct  ·  ${drMisses.length} miss${drMisses.length !== 1 ? 'es' : ''}  ·  ${drFalsePositives.length} false positive${drFalsePositives.length !== 1 ? 's' : ''}`, margin, y, { fontSize: 8, fontStyle: 'bold' })
    y += 8
  }

  // Oculomotor Screening
  if (data.oculomotor) {
    checkPage(60)
    drawLine()
    addText('OCULOMOTOR SCREENING', margin, y, { fontSize: 12, fontStyle: 'bold' })
    y += 10

    const oculomotorExercises: { key: keyof OculomotorData; label: string }[] = [
      { key: 'horizontalSaccades', label: 'Horizontal Saccades' },
      { key: 'verticalSaccades', label: 'Vertical Saccades' },
      { key: 'horizontalPursuit', label: 'Horizontal Smooth Pursuit' },
      { key: 'verticalPursuit', label: 'Vertical Smooth Pursuit' },
    ]

    // Table header
    doc.setFillColor(240, 240, 240)
    doc.rect(margin, y - 4, contentWidth, 8, 'F')
    addText('Exercise', margin + 2, y, { fontSize: 9, fontStyle: 'bold' })
    addText('Symptoms', margin + 60, y, { fontSize: 9, fontStyle: 'bold' })
    addText('Severity', margin + contentWidth - 25, y, { fontSize: 9, fontStyle: 'bold' })
    y += 8

    let exercisesWithSymptoms = 0
    for (const ex of oculomotorExercises) {
      checkPage(7)
      const result = data.oculomotor[ex.key]
      const hasSymptoms = result.symptoms.length > 0 && !result.symptoms.includes('None')
      if (hasSymptoms) exercisesWithSymptoms++

      addText(ex.label, margin + 2, y, { fontSize: 8 })
      addText(hasSymptoms ? result.symptoms.join(', ') : 'None', margin + 60, y, { fontSize: 8, maxWidth: contentWidth - 90 })
      addText(hasSymptoms ? `${result.severity}/10` : '—', margin + contentWidth - 25, y, { fontSize: 8 })
      y += 6
    }

    y += 4
    addText(`${exercisesWithSymptoms}/4 exercises provoked symptoms`, margin + 2, y, { fontSize: 9, fontStyle: 'bold' })
    y += 10
  }

  // ── SCORE SUMMARY ──
  checkPage(65)
  drawLine()
  doc.setFillColor(91, 154, 166)
  doc.rect(margin, y - 4, contentWidth, 10, 'F')
  doc.setTextColor(255, 255, 255)
  addText('SCORE SUMMARY', margin + 2, y + 1, { fontSize: 11, fontStyle: 'bold' })
  const testLabelSummary = data.testNumber && data.testNumber > 1 ? `Test #${data.testNumber}` : 'Baseline'
  addText(testLabelSummary, margin + contentWidth - 30, y + 1, { fontSize: 9, fontStyle: 'bold' })
  doc.setTextColor(0, 0, 0)
  y += 12

  // Summary table
  const summaryRows: [string, string, string][] = [
    ['Symptom Number', `${symptomCount}`, '/ 22'],
    ['Symptom Severity', `${symptomTotal}`, '/ 132'],
    ['', '', ''],
    ['Orientation', orientDone ? `${orientScore}` : 'Not administered', orientDone ? '/ 5' : ''],
    ['Immediate Memory', `${immTotal}`, `/ ${immMax}`],
    ['Concentration — Digits Backward', `${conc.digitsScore}`, '/ 4'],
    ['Concentration — Months in Reverse', `${conc.monthsScore}`, '/ 1'],
    ['Delayed Recall', `${data.cognitive.delayedRecall.score}`, '/ 10'],
  ]
  if (conc.monthsTimeSeconds != null) {
    summaryRows.push(['Months in Reverse Time', `${conc.monthsTimeSeconds.toFixed(1)}s`, ''])
  }
  if (dr.delaySeconds != null) {
    const required = dr.requiredDelaySeconds ?? 300
    const met = dr.delayIntervalMet ?? dr.delaySeconds >= required
    summaryRows.push([
      'Delayed Recall Interval',
      fmtInterval(dr.delaySeconds),
      met ? '' : `(< ${fmtInterval(required)})`,
    ])
  }

  for (const [label, score, max] of summaryRows) {
    if (label === '' && score === '') { y += 2; continue }
    // (Removed a dead setFillColor whose `summaryRows.indexOf([...])` built a
    // fresh array and so always returned -1 — and which was never followed by a
    // rect, so it painted nothing either way.)
    addText(label, margin + 4, y, { fontSize: 8 })
    addText(score, margin + contentWidth - 40, y, { fontSize: 9, fontStyle: 'bold' })
    addText(max, margin + contentWidth - 22, y, { fontSize: 8 })
    y += 5.5
  }

  y += 3
  doc.setFillColor(91, 154, 166)
  doc.rect(margin, y - 4, contentWidth, 10, 'F')
  doc.setTextColor(255, 255, 255)
  addText('TOTAL COGNITIVE', margin + 4, y + 1, { fontSize: 10, fontStyle: 'bold' })
  addText(`${totalCognitive} / ${totalMax}`, margin + contentWidth - 40, y + 1, { fontSize: 10, fontStyle: 'bold' })
  doc.setTextColor(0, 0, 0)
  y += 12

  // Oculomotor summary if present
  if (data.oculomotor) {
    const oculoKeys: (keyof OculomotorData)[] = ['horizontalSaccades', 'verticalSaccades', 'horizontalPursuit', 'verticalPursuit']
    const exercisesProvoked = oculoKeys.filter(k => {
      const r = data.oculomotor![k]
      return r.symptoms.length > 0 && !r.symptoms.includes('None')
    }).length
    addText('Oculomotor: Exercises Provoking Symptoms', margin + 4, y, { fontSize: 8 })
    addText(`${exercisesProvoked}`, margin + contentWidth - 40, y, { fontSize: 9, fontStyle: 'bold' })
    addText('/ 4', margin + contentWidth - 22, y, { fontSize: 8 })
    y += 8
  }

  addText(`Feels Normal: ${percentOrNotAnswered(data.symptoms.feelNormalPercent)}`, margin + 4, y, { fontSize: 8 })
  addText(`Physical Worsens: ${data.symptoms.physicalWorsens ? 'Yes' : 'No'}`, margin + contentWidth / 2, y, { fontSize: 8 })
  y += 5
  addText(`Mental Worsens: ${data.symptoms.mentalWorsens ? 'Yes' : 'No'}`, margin + contentWidth / 2, y, { fontSize: 8 })
  y += 10

  // SCAT6 Assessment Domains Checklist
  checkPage(55)
  drawLine()
  addText('SCAT6 ASSESSMENT DOMAINS', margin, y, { fontSize: 10, fontStyle: 'bold' })
  addText('Self-administered baseline — not a clinical assessment.', margin + 65, y, { fontSize: 7 })
  y += 6

  const hasOculomotor = !!data.oculomotor
  const administered: string[] = [
    'Symptom Evaluation',
    ...(orientDone ? ['Orientation'] : []),
    'Immediate Memory',
    'Digits Backward',
    'Months in Reverse',
    'Delayed Recall',
    ...(hasOculomotor ? ['Oculomotor Screening'] : []),
  ]
  const notAdministered: string[] = [
    ...(orientDone ? [] : ['Orientation']),
    'Red Flags',
    'Observable Signs',
    'Maddocks Questions',
    'Glasgow Coma Scale',
    'Cervical Spine Assessment',
    'Modified BESS (Balance)',
    'Tandem Gait',
    'Dual Task Gait',
    ...(hasOculomotor ? [] : ['Oculomotor Screening']),
    'Decision & HCP Attestation',
  ]

  // Two-column layout: Administered (left) | Not Administered (right)
  const colLeft = margin + 2
  const colRight = margin + contentWidth / 2
  doc.setTextColor(80)
  addText('Administered (self)', colLeft, y, { fontSize: 7, fontStyle: 'bold' })
  doc.setTextColor(140)
  addText('Not administered (requires clinician)', colRight, y, { fontSize: 7, fontStyle: 'bold' })
  y += 4

  const maxRows = Math.max(administered.length, notAdministered.length)
  for (let i = 0; i < maxRows; i++) {
    checkPage(4)
    if (i < administered.length) {
      doc.setTextColor(80)
      addText(`[Y]  ${administered[i]}`, colLeft, y, { fontSize: 6.5 })
    }
    if (i < notAdministered.length) {
      doc.setTextColor(160)
      addText(`[  ]  ${notAdministered[i]}`, colRight, y, { fontSize: 6.5 })
    }
    y += 3.5
  }
  y += 3

  // Serial testing note
  doc.setTextColor(0, 0, 0)
  checkPage(15)
  doc.setFillColor(245, 248, 250)
  doc.rect(margin, y - 3, contentWidth, 12, 'F')
  addText('Serial Testing: This baseline establishes reference values for comparison with future post-injury assessments.', margin + 3, y + 2, { fontSize: 7, fontStyle: 'bold' })
  addText('Changes from baseline may indicate concussion. Repeat testing recommended annually and after any suspected concussion.', margin + 3, y + 7, { fontSize: 7 })
  y += 15

  doc.setTextColor(91, 154, 166)
  doc.setFontSize(9)
  doc.text('Powered by Concussion Education Australia — concussion-education-australia.com', margin, y)
  y += 6
  doc.text('Free SCAT6/SCOAT6 Mastery Course: portal.concussion-education-australia.com/scat-mastery', margin, y)

  // Page numbers
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, 290, { align: 'center' })
  }

  return Buffer.from(doc.output('arraybuffer'))
}

// One-time table creation — ensures preseason_baselines table exists
let baselinesTableReady = false
async function ensureBaselinesTable() {
  if (baselinesTableReady) return
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS preseason_baselines (
        id SERIAL PRIMARY KEY,
        clinic_code TEXT NOT NULL,
        clinic_name TEXT NOT NULL DEFAULT '',
        athlete_name TEXT NOT NULL DEFAULT '',
        dob TEXT,
        submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        symptom_count INTEGER NOT NULL DEFAULT 0,
        symptom_severity INTEGER NOT NULL DEFAULT 0,
        cognitive_score INTEGER NOT NULL DEFAULT 0
      )
    `
    // Added later for the serial-comparison report. payload stores the full
    // submission so per-domain comparison is possible for tests submitted from
    // here on (legacy rows keep only the summary scalars). Idempotent.
    await sql`ALTER TABLE preseason_baselines ADD COLUMN IF NOT EXISTS cognitive_max INTEGER`
    await sql`ALTER TABLE preseason_baselines ADD COLUMN IF NOT EXISTS test_number INTEGER`
    await sql`ALTER TABLE preseason_baselines ADD COLUMN IF NOT EXISTS payload JSONB`
  } catch {
    // Table already exists or permissions differ — safe to continue
  }
  baselinesTableReady = true
}

// Map a stored baseline row to the comparison shape. Per-domain fields come
// from the JSONB payload when present; legacy rows fall back to summary scalars.
function rowToComparisonTest(r: Record<string, unknown>, index: number): ComparisonTest {
  const t: ComparisonTest = {
    testNumber: (r.test_number as number) ?? index,
    date: r.submitted_at instanceof Date ? r.submitted_at.toISOString() : String(r.submitted_at),
    symptomCount: Number(r.symptom_count ?? 0),
    symptomSeverity: Number(r.symptom_severity ?? 0),
    cognitiveScore: Number(r.cognitive_score ?? 0),
    cognitiveMax: Number(r.cognitive_max ?? 30),
  }
  const p = r.payload as SubmitPayload | null
  if (p && p.cognitive) {
    const imm = p.cognitive.immediateMemory
    // Leave orientation undefined (renders '—' and is excluded from the trend
    // maths) when it was not administered — never plot a fabricated 0.
    t.orientation = p.cognitive.orientation && orientationAdministered(p.cognitive.orientation)
      ? (p.cognitive.orientation.score as number)
      : undefined
    t.immediateMemory = imm?.total ?? imm?.score
    t.delayedRecall = p.cognitive.delayedRecall?.score
    t.concentration = p.cognitive.concentration?.total
    if (p.oculomotor) {
      const keys: (keyof OculomotorData)[] = ['horizontalSaccades', 'verticalSaccades', 'horizontalPursuit', 'verticalPursuit']
      t.oculomotorProvoked = keys.filter((k) => {
        const ex = p.oculomotor![k]
        return ex && ex.symptoms.length > 0 && !ex.symptoms.includes('None')
      }).length
    }
  }
  return t
}

export async function POST(request: Request) {
  try {
    if (!process.env.KV_REST_API_URL) {
      return NextResponse.json({ error: 'Preseason service not configured' }, { status: 503 })
    }

    const body: SubmitPayload = await request.json()

    if (!body.clinicCode || !body.athlete || !body.symptoms || !body.cognitive) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Consent is mandatory before any health information may be stored or sent
    // (APP 3.3 / APP 5). Reject anything without explicit consent.
    if (body.consent?.agreed !== true) {
      return NextResponse.json({ error: 'Consent is required to submit this baseline.' }, { status: 400 })
    }

    // SYMPTOM SCALE COMPLETENESS — server side (2026-08-06 residual sweep).
    // app/preseason/b/[code]/page.tsx already refuses to submit a partial scale
    // ("Fail closed: never file a symptom scale with unanswered items"), but the
    // gate lived ONLY in the client while the server is the record of truth.
    // Unanswered items arrive as the UNRATED sentinel -1, and both severity
    // sums here are bare `reduce((a,b) => a+b, 0)` with no clamp (the client
    // clamps with Math.max(0, b) — the fix was applied to one side only). So a
    // stale tab on an older bundle, an offline replay, or any crafted client
    // files a baseline whose PDF prints "Headache: -1" and a Severity Score
    // UNDERSTATED by one point per skipped item — potentially negative — into
    // preseason_baselines.symptom_severity, which is the comparator every
    // future post-injury assessment is measured against. Reject, don't coerce:
    // silently clamping would file a scale as complete that never was.
    const ratings = body.symptoms?.ratings
    if (
      !Array.isArray(ratings) ||
      ratings.length !== SYMPTOMS.length ||
      ratings.some((r) => typeof r !== 'number' || !Number.isInteger(r) || r < 0 || r > 6)
    ) {
      return NextResponse.json(
        {
          error: `All ${SYMPTOMS.length} symptom items must be answered (0-6) before this baseline can be filed.`,
        },
        { status: 400 }
      )
    }

    // Under-16s additionally require a parent/guardian consent (FIX 2).
    const athleteAge = ageFromDob(body.athlete.dob)
    if (athleteAge !== null && athleteAge < MINOR_CONSENT_AGE && body.consent.guardian?.agreed !== true) {
      return NextResponse.json(
        { error: 'A parent/guardian must consent for athletes under 16.' },
        { status: 400 }
      )
    }

    // Demo mode — clinicians trying the test themselves
    const isDemo = body.clinicCode.toUpperCase() === 'DEMO00'

    let clinic: ClinicData | null = null
    if (isDemo) {
      clinic = { clinicName: 'Demo — Try It Yourself', contactName: 'Demo', email: '', createdAt: new Date().toISOString() }
    } else {
      // Validate clinic. KV is the live layer; `preseason_clinics` is the
      // durable mirror written at registration. A bare `kv.get() → null →
      // 404` discarded an ENTIRE 20-minute baseline (consent, symptoms,
      // cognitive, oculomotor — all of it lives in this POST body and nowhere
      // else) whenever KV blipped or the key was evicted, with no retry path.
      // Fall back to Postgres, and distinguish "KV is broken" (503, retryable)
      // from "this code really doesn't exist" (404). 2026-08-06 audit.
      const code = body.clinicCode.toUpperCase()
      let kvFailed = false
      try {
        clinic = await kv.get<ClinicData>(`clinic:${code}`)
      } catch (kvErr) {
        console.error(`[preseason/submit] KV lookup failed for ${code}:`, kvErr)
        kvFailed = true
      }
      if (!clinic) {
        try {
          const { rows } = await sql<{ clinic_name: string; contact_name: string; email: string; created_at: Date | string | null }>`
            SELECT clinic_name, contact_name, email, created_at
            FROM preseason_clinics WHERE code = ${code} LIMIT 1
          `
          if (rows[0]) {
            clinic = {
              clinicName: rows[0].clinic_name,
              contactName: rows[0].contact_name,
              email: rows[0].email,
              createdAt: rows[0].created_at ? new Date(rows[0].created_at).toISOString() : new Date().toISOString(),
            }
            console.warn(`[preseason/submit] KV missed ${code} — served from preseason_clinics`)
          }
        } catch (pgErr) {
          console.error(`[preseason/submit] Postgres clinic fallback failed for ${code}:`, pgErr)
          kvFailed = true
        }
      }
      if (!clinic) {
        // Never tell an athlete their valid code is invalid because our cache
        // is down — that answer is unrecoverable and their data is gone.
        if (kvFailed) {
          return NextResponse.json(
            { error: 'We could not verify your clinic code right now. Please try submitting again in a moment.' },
            { status: 503 }
          )
        }
        return NextResponse.json({ error: 'Invalid clinic code' }, { status: 404 })
      }
    }

    // Rate limit: 50 submissions per clinic per day (skip for demo)
    if (!isDemo) {
      const today = new Date().toISOString().slice(0, 10)
      const submitRateKey = `rate:submit:${body.clinicCode.toUpperCase()}:${today}`
      const submitCount = await kv.incr(submitRateKey)
      if (submitCount === 1) await kv.expire(submitRateKey, 86400)
      if (submitCount > 50) {
        return NextResponse.json(
          { error: 'Daily submission limit reached. Please try again tomorrow.' },
          { status: 429 }
        )
      }
    }

    // Generate PDF
    const pdfBuffer = generatePdf(body, clinic.clinicName)

    // Raw name for non-HTML contexts (email SUBJECT, PDF filename); the escaped
    // form is used only where it is interpolated into HTML. Escaping once up
    // front turned every O'Brien into "O&#39;Brien" in the clinician's subject
    // line and on the attached file.
    const athleteNameRaw = body.athlete.name || 'Unknown Athlete'
    const athleteName = escapeHtml(athleteNameRaw)
    // Filename-safe: collapse whitespace, drop path/reserved characters.
    const athleteNameFile = athleteNameRaw.replace(/[^\p{L}\p{N}\s'-]/gu, '').trim().replace(/\s+/g, '-') || 'Athlete'
    const date = new Date().toLocaleDateString('en-AU')
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || CONFIG.APP_URL

    const immScore = body.cognitive.immediateMemory.total ?? body.cognitive.immediateMemory.score ?? 0
    // Orientation contributes to the total only when it was administered; its 5
    // points come off the maximum otherwise, so the stored/emailed total is
    // never diluted by a section that was never done.
    const orientWasDone = orientationAdministered(body.cognitive.orientation)
    const totalCognitive = (orientWasDone ? (body.cognitive.orientation.score as number) : 0) + immScore +
      body.cognitive.concentration.total + body.cognitive.delayedRecall.score
    const immData = body.cognitive.immediateMemory
    const hasTrialData = immData.trial1 !== undefined && immData.trial1 !== null
    const totalCognitiveMax = (hasTrialData ? 50 : 30) - (orientWasDone ? 0 : 5)
    const symptomCount = body.symptoms.ratings.filter((r: number) => r > 0).length
    const symptomTotal = body.symptoms.ratings.reduce((a: number, b: number) => a + b, 0)
    // Real elapsed delayed-recall interval (absent on pre-tracking submissions).
    const delaySeconds = body.cognitive.delayedRecall.delaySeconds ?? null
    const requiredDelaySeconds = body.cognitive.delayedRecall.requiredDelaySeconds ?? 300
    const delayIntervalMet = body.cognitive.delayedRecall.delayIntervalMet
      ?? (delaySeconds != null && delaySeconds >= requiredDelaySeconds)

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background: #f8fafc; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #64a8b0 0%, #5b9aa6 100%); padding: 28px 24px; text-align: center; }
            .header h1 { margin: 0; color: white; font-size: 20px; font-weight: 700; }
            .content { padding: 28px 24px; }
            .score-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0; }
            .score-box { background: #f8fafc; border-radius: 10px; padding: 14px; text-align: center; }
            .score-value { font-size: 24px; font-weight: 800; color: #5b9aa6; }
            .score-label { font-size: 12px; color: #64748b; }
            .footer { padding: 20px 24px; text-align: center; color: #64748b; font-size: 13px; border-top: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Baseline Report: ${athleteName}${body.testNumber && body.testNumber > 1 ? ` <span style="font-size: 14px; font-weight: 400;">(Test #${body.testNumber})</span>` : ''}</h1>
            </div>
            <div class="content">
              <p>Hi ${escapeHtml(clinic.contactName)},</p>
              <p>${body.testNumber && body.testNumber > 1
                ? `This is baseline test <strong>#${body.testNumber}</strong> for ${athleteName}. The full report is attached as a PDF.`
                : 'A new pre-season baseline has been completed. The full report is attached as a PDF.'
              }</p>

              <p style="font-weight: 700; margin-bottom: 8px;">Quick Summary:</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 16px 0;">
                <tr>
                  <td style="background: #f8fafc; border-radius: 10px; padding: 14px; text-align: center; width: 50%;">
                    <div style="font-size: 24px; font-weight: 800; color: #5b9aa6;">${symptomCount}/22</div>
                    <div style="font-size: 12px; color: #64748b;">Symptom Number</div>
                  </td>
                  <td style="width: 12px;"></td>
                  <td style="background: #f8fafc; border-radius: 10px; padding: 14px; text-align: center; width: 50%;">
                    <div style="font-size: 24px; font-weight: 800; color: #5b9aa6;">${symptomTotal}/132</div>
                    <div style="font-size: 12px; color: #64748b;">Severity Score</div>
                  </td>
                </tr>
                <tr><td colspan="3" style="height: 12px;"></td></tr>
                <tr>
                  <td style="background: #f8fafc; border-radius: 10px; padding: 14px; text-align: center;" colspan="3">
                    <div style="font-size: 28px; font-weight: 800; color: #5b9aa6;">${totalCognitive}/${totalCognitiveMax}</div>
                    <div style="font-size: 12px; color: #64748b;">Total Cognitive Score</div>
                  </td>
                </tr>
              </table>

              <p style="font-size: 13px; color: #475569;"><strong>Athlete:</strong> ${athleteName} · <strong>Sport:</strong> ${escapeHtml(body.athlete.sport || '—')} · <strong>Team:</strong> ${escapeHtml(body.athlete.team || '—')}</p>
              ${!orientWasDone ? `<p style="font-size: 13px; color: #b45309;"><strong>Note:</strong> Orientation was not administered — it is excluded from the total above (max ${totalCognitiveMax}, not ${hasTrialData ? 50 : 30}).</p>` : ''}
              ${delaySeconds != null && !delayIntervalMet ? `<p style="font-size: 13px; color: #b45309;"><strong>Note:</strong> Delayed recall was started after ${fmtInterval(delaySeconds)}, short of the ${fmtInterval(requiredDelaySeconds)} protocol interval.</p>` : ''}

              <p style="font-size: 13px; color: #475569; margin: 20px 0 8px;">You've captured one dimension of baseline data. The SCAT6 protocol covers symptom evaluation, cognitive screening, neurological exam, balance testing, and more. Are you confident interpreting all 7 domains?</p>

              <div style="background: #f0f9ff; border: 2px solid #5b9aa6; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
                <p style="margin: 0 0 8px; font-weight: 700; font-size: 16px; color: #1e293b;">Free: Master the Full SCAT6 Protocol</p>
                <p style="margin: 0 0 20px; font-size: 13px; color: #475569; line-height: 1.5;">Learn how to properly administer and interpret every SCAT6 section. Fillable forms, clinical toolkit &amp; certificate included. <strong>Completely free.</strong></p>
                <a href="${baseUrl}/scat-mastery?utm_source=email&utm_medium=email&utm_campaign=preseason_baseline&utm_content=free_course" style="display: inline-block; padding: 14px 32px; background-color: #5b9aa6; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px;">Get Free Course &rarr;</a>
                <p style="margin: 16px 0 0; font-size: 12px; color: #64748b; line-height: 1.5;">Want deeper training? Our <a href="${baseUrl}/pricing?utm_source=email&utm_medium=email&utm_campaign=preseason_baseline&utm_content=paid_course" style="color: #1e6b73; font-weight: 600; text-decoration: underline; display: inline; background: none; padding: 0; border-radius: 0; border: none;">full ${CONFIG.COURSE.TOTAL_CPD_POINTS} CPD hour course</a> covers VOMS, BESS, return-to-play &amp; more.</p>
              </div>
            </div>
            <div class="footer">
              <p>Concussion Education Australia</p>
            </div>
          </div>
        </body>
      </html>
    `

    // Persist baseline submission to Postgres for admin dashboard (skip demo)
    let comparisonBuffer: Buffer | null = null
    if (!isDemo) {
      try {
        await ensureBaselinesTable()
        await sql`
          INSERT INTO preseason_baselines (clinic_code, clinic_name, athlete_name, dob, submitted_at, symptom_count, symptom_severity, cognitive_score, cognitive_max, test_number, payload)
          VALUES (${body.clinicCode.toUpperCase()}, ${clinic.clinicName}, ${body.athlete.name || 'Unknown'}, ${body.athlete.dob || null}, NOW(), ${symptomCount}, ${symptomTotal}, ${totalCognitive}, ${totalCognitiveMax}, ${body.testNumber ?? 1}, ${JSON.stringify(body)}::jsonb)
        `
      } catch {
        // Log a generic message + clinic code only — never the error object,
        // which can carry the health payload (SQL params).
        console.error('Failed to persist baseline submission to Postgres for clinic', body.clinicCode.toUpperCase())
      }

      // Serial comparison — once this athlete has 2+ baselines, build a
      // side-by-side comparison report so the clinician sees improvement/stall
      // at a glance. Non-fatal: a failure here must never block the email.
      try {
        const normName = (body.athlete.name || 'Unknown').trim().toLowerCase()
        const normCode = body.clinicCode.toUpperCase()
        // IDENTITY: when this athlete gave a DOB, match on name AND that exact
        // DOB. The old `(dob IS NULL OR dob = ...)` branch also pulled in any
        // same-named athlete whose DOB was never recorded, so two same-named
        // juniors at one club could be folded into a single serial-comparison
        // PDF — a fabricated recovery curve emailed to the clinician. Rows with
        // no DOB now only ever match other rows with no DOB (the else branch).
        const { rows: priorRows } = body.athlete.dob
          ? await sql`
              SELECT submitted_at, symptom_count, symptom_severity, cognitive_score, cognitive_max, test_number, payload
              FROM preseason_baselines
              WHERE clinic_code = ${normCode} AND LOWER(TRIM(athlete_name)) = ${normName}
                AND dob = ${body.athlete.dob}
              ORDER BY submitted_at ASC`
          : await sql`
              SELECT submitted_at, symptom_count, symptom_severity, cognitive_score, cognitive_max, test_number, payload
              FROM preseason_baselines
              WHERE clinic_code = ${normCode} AND LOWER(TRIM(athlete_name)) = ${normName}
              ORDER BY submitted_at ASC`
        if (priorRows.length >= 2) {
          const tests = priorRows.map((r, i) => rowToComparisonTest(r, i + 1))
          comparisonBuffer = generateComparisonPdf({
            clinicName: clinic.clinicName,
            athleteName: body.athlete.name || 'Unknown Athlete',
            athleteMeta: { sport: body.athlete.sport, team: body.athlete.team, dob: body.athlete.dob, sex: body.athlete.sex },
            tests,
          })
        }
      } catch {
        // Generic message + clinic code only — avoid logging the payload.
        console.error('Serial comparison generation failed (non-fatal) for clinic', body.clinicCode.toUpperCase())
      }
    }

    // Demo mode — skip email, just return success with score
    if (isDemo) {
      return NextResponse.json({ success: true })
    }

    // Send via Resend SDK with attachment(s). When a serial comparison was
    // built (2+ tests), attach it alongside this test's individual report.
    const emailSent = await sendEmailWithAttachment({
      to: clinic.email,
      subject: `SCAT6 Baseline Report — ${athleteNameRaw}${body.testNumber && body.testNumber > 1 ? ` (Test #${body.testNumber})` : ''} (${date})${comparisonBuffer ? ' + Serial Comparison' : ''}`,
      html: emailHtml,
      attachments: [
        {
          filename: `SCAT6-Baseline-${athleteNameFile}-${date.replace(/\//g, '-')}.pdf`,
          content: pdfBuffer,
        },
        ...(comparisonBuffer
          ? [{
              filename: `SCAT6-Serial-Comparison-${athleteNameFile}-${date.replace(/\//g, '-')}.pdf`,
              content: comparisonBuffer,
            }]
          : []),
      ],
    })

    if (!emailSent) {
      // Data is already saved — don't return 500 or user will retry and create duplicates.
      // Log the clinic CODE, never the email address.
      console.error(`Baseline email failed for clinic ${body.clinicCode.toUpperCase()} — data saved, email not delivered`)
      // Failure must be VISIBLE (2026-08-05 round-C #3): the clinic email is
      // the report's only delivery channel and the submission is already
      // stored — alert the owner so it can be resent manually.
      try {
        await sendEmail({
          to: CONFIG.CONTACT_EMAIL,
          subject: `ACTION: baseline report email FAILED — ${clinic.clinicName}`,
          html: `<p style="margin:0 0 1em 0;">A baseline report email failed to send.</p><p style="margin:0 0 1em 0;">Clinic: ${escapeHtml(clinic.clinicName)}<br/>Athlete: ${escapeHtml(athleteNameRaw)}<br/>Submitted: ${new Date().toISOString()}</p><p style="margin:0;">The submission is stored in preseason_baselines — regenerate and resend manually.</p>`,
          tags: [{ name: 'type', value: 'preseason-email-failed' }],
        })
      } catch { /* alert is best-effort */ }
      return NextResponse.json({ success: true, emailFailed: true })
    }

    return NextResponse.json({ success: true })
  } catch {
    // Generic message only — the error object can include the request body
    // (health payload), so we don't log it.
    console.error('Preseason submit error (see request for context)')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
