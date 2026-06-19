import { NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { jsPDF } from 'jspdf'
import { sendEmailWithAttachment } from '@/lib/resend-client'
import { CONFIG } from '@/lib/config'
import { sql } from '@/lib/db'
import { generateComparisonPdf, type ComparisonTest } from '@/lib/preseason/comparison-pdf'

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
  orientation: { month: string; date: string; dayOfWeek: string; year: string; time: string; score: number }
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
  }
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

interface SubmitPayload {
  clinicCode: string
  testNumber?: number
  athlete: AthleteBackground
  symptoms: SymptomData
  cognitive: CognitiveData
  oculomotor?: OculomotorData
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

  // Calculate age from DOB
  let ageString = '—'
  if (data.athlete.dob) {
    const dob = new Date(data.athlete.dob)
    if (!isNaN(dob.getTime())) {
      const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      ageString = `${age} years`
    }
  }

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

  addText(`Previous Concussions: ${data.athlete.previousConcussions || '0'}`, margin, y, { fontSize: 9 })
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

  addText(`Feels normal: ${data.symptoms.feelNormalPercent}%`, margin, y, { fontSize: 9 })
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

  // Score table
  const scores: string[][] = [
    ['Orientation', `${data.cognitive.orientation.score}`, '5'],
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
  const totalCognitive = data.cognitive.orientation.score + immTotal +
    data.cognitive.concentration.total + data.cognitive.delayedRecall.score
  const totalMax = hasTrials ? 50 : 30
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
  for (const [label, val] of [['Month', orient.month], ['Date', orient.date], ['Day', orient.dayOfWeek], ['Year', orient.year], ['Time', orient.time]]) {
    addText(`  ${label}: ${val}`, margin, y, { fontSize: 8 })
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
    ['Orientation', `${data.cognitive.orientation.score}`, '/ 5'],
    ['Immediate Memory', `${immTotal}`, `/ ${immMax}`],
    ['Concentration — Digits Backward', `${conc.digitsScore}`, '/ 4'],
    ['Concentration — Months in Reverse', `${conc.monthsScore}`, '/ 1'],
    ['Delayed Recall', `${data.cognitive.delayedRecall.score}`, '/ 10'],
  ]
  if (conc.monthsTimeSeconds != null) {
    summaryRows.push(['Months in Reverse Time', `${conc.monthsTimeSeconds.toFixed(1)}s`, ''])
  }

  for (const [label, score, max] of summaryRows) {
    if (label === '' && score === '') { y += 2; continue }
    doc.setFillColor(summaryRows.indexOf([label, score, max]) % 2 === 0 ? 250 : 255, 250, 250)
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

  addText(`Feels Normal: ${data.symptoms.feelNormalPercent}%`, margin + 4, y, { fontSize: 8 })
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
    'Orientation',
    'Immediate Memory',
    'Digits Backward',
    'Months in Reverse',
    'Delayed Recall',
    ...(hasOculomotor ? ['Oculomotor Screening'] : []),
  ]
  const notAdministered: string[] = [
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
    t.orientation = p.cognitive.orientation?.score
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

    // Demo mode — clinicians trying the test themselves
    const isDemo = body.clinicCode.toUpperCase() === 'DEMO00'

    let clinic: ClinicData | null = null
    if (isDemo) {
      clinic = { clinicName: 'Demo — Try It Yourself', contactName: 'Demo', email: '', createdAt: new Date().toISOString() }
    } else {
      // Validate clinic
      clinic = await kv.get<ClinicData>(`clinic:${body.clinicCode.toUpperCase()}`)
      if (!clinic) {
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

    const athleteName = escapeHtml(body.athlete.name || 'Unknown Athlete')
    const date = new Date().toLocaleDateString('en-AU')
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || CONFIG.APP_URL

    const immScore = body.cognitive.immediateMemory.total ?? body.cognitive.immediateMemory.score ?? 0
    const totalCognitive = body.cognitive.orientation.score + immScore +
      body.cognitive.concentration.total + body.cognitive.delayedRecall.score
    const immData = body.cognitive.immediateMemory
    const hasTrialData = immData.trial1 !== undefined && immData.trial1 !== null
    const totalCognitiveMax = hasTrialData ? 50 : 30
    const symptomCount = body.symptoms.ratings.filter((r: number) => r > 0).length
    const symptomTotal = body.symptoms.ratings.reduce((a: number, b: number) => a + b, 0)

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
      } catch (err) {
        console.error('Failed to persist baseline submission to Postgres:', err)
      }

      // Serial comparison — once this athlete has 2+ baselines, build a
      // side-by-side comparison report so the clinician sees improvement/stall
      // at a glance. Non-fatal: a failure here must never block the email.
      try {
        const normName = (body.athlete.name || 'Unknown').trim().toLowerCase()
        const normCode = body.clinicCode.toUpperCase()
        const { rows: priorRows } = body.athlete.dob
          ? await sql`
              SELECT submitted_at, symptom_count, symptom_severity, cognitive_score, cognitive_max, test_number, payload
              FROM preseason_baselines
              WHERE clinic_code = ${normCode} AND LOWER(TRIM(athlete_name)) = ${normName}
                AND (dob IS NULL OR dob = ${body.athlete.dob})
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
      } catch (err) {
        console.error('Serial comparison generation failed (non-fatal):', err)
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
      subject: `SCAT6 Baseline Report — ${athleteName}${body.testNumber && body.testNumber > 1 ? ` (Test #${body.testNumber})` : ''} (${date})${comparisonBuffer ? ' + Serial Comparison' : ''}`,
      html: emailHtml,
      attachments: [
        {
          filename: `SCAT6-Baseline-${athleteName.replace(/\s+/g, '-')}-${date.replace(/\//g, '-')}.pdf`,
          content: pdfBuffer,
        },
        ...(comparisonBuffer
          ? [{
              filename: `SCAT6-Serial-Comparison-${athleteName.replace(/\s+/g, '-')}-${date.replace(/\//g, '-')}.pdf`,
              content: comparisonBuffer,
            }]
          : []),
      ],
    })

    if (!emailSent) {
      // Data is already saved to blob storage — don't return 500 or user will retry and create duplicates
      console.error(`Baseline email failed for ${clinic.email} — data saved, email not delivered`)
      return NextResponse.json({ success: true, emailFailed: true })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Preseason submit error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
