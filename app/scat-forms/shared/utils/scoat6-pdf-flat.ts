import { SCOAT6FormData } from '../types/scoat6.types'
import {
  calculateSymptomNumber,
  calculateSymptomSeverity,
  calculateImmediateMemory,
  calculateConcentration,
  calculateDelayedRecall,
  calculateMBESS,
  calculateMBESSFoam,
  calculateTandemGaitAverage,
  calculateTandemGaitFastest,
  calculateComplexTandemForward,
  calculateComplexTandemBackward,
  calculateComplexTandemTotal,
  calculateDualTaskAccuracy,
  calculateGAD7,
  getGAD7Severity,
  calculatePHQ2,
  calculateSleepScore,
  getSleepSeverity,
  isSymptomColumnAdministered,
  isImmediateMemoryAdministered,
  isDigitsAdministered,
  isDelayedRecallAdministered,
  isBalanceAdministered,
  isComplexTandemAdministered,
  isDualTaskAdministered,
  isMvomsBaselineAdministered,
  isMvomsRowAdministered,
  isGAD7Administered,
  isPHQ2Administered,
  isSleepAdministered,
} from './scoat6-calculations'
import {
  drawText,
  drawTextCentered,
  drawCheckmark,
  drawFilledCircle,
  drawWrappedText,
  drawYesNo,
  drawNotAdministered,
  notAdministeredMark,
  embedStandardFonts,
  loadFlatPDF,
  savePDFAndDownload,
  BLACK,
} from './pdf-draw-helpers'
import type { PDFFont, PDFPage } from 'pdf-lib'

/**
 * SCOAT6 Flat PDF Export — draws values at precise coordinates on a non-fillable PDF.
 *
 * Page dimensions: 595.28 x 841.89 pts (A4).
 * 15 pages total.
 */
export async function exportSCOAT6ToFlatPDF(
  formData: SCOAT6FormData,
  filename: string = 'SCOAT6_Filled.pdf'
) {
  try {
    const pdfDoc = await loadFlatPDF('/docs/SCOAT6_Flat.pdf')
    const { font, fontBold } = await embedStandardFonts(pdfDoc)
    const pages = pdfDoc.getPages()

    const fs = 9    // default font size
    const fsm = 8   // small
    const fsl = 10  // large
    const H = 841.89 // A4 page height

    // ========================================================================
    // "WAS THIS SECTION ADMINISTERED?" — clinical-record integrity gate
    // ========================================================================
    // Scored fields are `number | null` so "never tested" and "scored zero"
    // are distinguishable, and the predicates live in scoat6-calculations so
    // the on-screen totals and this PDF can never disagree. The explicit
    // not-done flags (gad7NotDone / phq2NotDone / sleepNotDone /
    // mvoms*.notTested) FORCE the not-administered path regardless of any
    // other value. Unadministered sections draw no item marks and print a dash
    // in their score box; administered sections print their real value,
    // including a genuine 0.
    const na = notAdministeredMark(font)

    const immediateMemoryAdministered = isImmediateMemoryAdministered(formData)
    const digitsAdministered = isDigitsAdministered(formData)
    const delayedRecallAdministered = isDelayedRecallAdministered(formData)
    const balanceAdministered = isBalanceAdministered(formData)
    const complexTandemAdministered = isComplexTandemAdministered(formData)
    const dualTaskAdministered = isDualTaskAdministered(formData)
    const mvomsBaselineAdministered = isMvomsBaselineAdministered(formData)
    const gad7Administered = isGAD7Administered(formData)
    const phq2Administered = isPHQ2Administered(formData)
    const sleepAdministered = isSleepAdministered(formData)

    // ==================== PAGE 1 (index 0): DEMOGRAPHICS ====================
    const p1 = pages[0]

    // Demographics — approximate positions for A4 SCOAT6
    drawText(p1, 130, H - 165, formData.athleteName, { font, size: fs })
    drawText(p1, 400, H - 165, formData.idNumber, { font, size: fs })
    drawText(p1, 130, H - 183, formData.dateOfBirth, { font, size: fs })
    drawText(p1, 280, H - 183, formData.age, { font, size: fs })
    drawText(p1, 400, H - 183, formData.dateOfExamination, { font, size: fs })

    // Sex
    if (formData.sex === 'Male') drawFilledCircle(p1, 155, H - 200, 3.5)
    else if (formData.sex === 'Female') drawFilledCircle(p1, 200, H - 200, 3.5)
    else if (formData.sex) drawFilledCircle(p1, 270, H - 200, 3.5)

    drawText(p1, 430, H - 200, formData.dominantHand, { font, size: fs })
    drawText(p1, 130, H - 218, formData.sportTeamSchool, { font, size: fs })
    drawText(p1, 400, H - 218, formData.yearsEducation, { font, size: fs })
    drawText(p1, 130, H - 236, formData.firstLanguage, { font, size: fs })
    drawText(p1, 400, H - 236, formData.preferredLanguage, { font, size: fs })
    drawText(p1, 130, H - 254, formData.clinician, { font, size: fs })

    // ==================== PAGE 2 (index 1): CURRENT INJURY + HISTORY ====================
    const p2 = pages[1]

    drawText(p2, 190, H - 130, formData.removalFromPlay, { font, size: fs })
    if (formData.continuedToPlayMinutes) {
      drawText(p2, 400, H - 130, formData.continuedToPlayMinutes + ' min', { font, size: fs })
    }
    drawText(p2, 190, H - 148, formData.dateOfInjury, { font, size: fs })
    drawWrappedText(p2, 65, H - 175, formData.injuryDescription, 470, { font, size: fsm })
    drawText(p2, 240, H - 205, formData.dateSymptomsFirstAppeared, { font, size: fs })
    drawText(p2, 240, H - 223, formData.dateSymptomsFirstReported, { font, size: fs })

    // Head Injuries History (3 rows)
    const hiStartY = H - 290
    formData.headInjuries.forEach((hi, i) => {
      const y = hiStartY - (i * 20)
      drawText(p2, 65, y, hi.date, { font, size: fsm })
      drawText(p2, 160, y, hi.description, { font, size: fsm, maxWidth: 200 })
      drawText(p2, 380, y, hi.management, { font, size: fsm, maxWidth: 150 })
    })

    // Disorders
    const disorders = formData.disorders
    const disorderStartY = H - 400
    const disorderItems = [
      { key: 'migraine' as const, label: 'Migraine' },
      { key: 'chronicHeadache' as const, label: 'Chronic Headache' },
      { key: 'depression' as const, label: 'Depression' },
      { key: 'anxiety' as const, label: 'Anxiety' },
      { key: 'syncope' as const, label: 'Syncope' },
      { key: 'epilepsy' as const, label: 'Epilepsy' },
      { key: 'adhd' as const, label: 'ADHD' },
      { key: 'learningDisorder' as const, label: 'Learning Disorder' },
    ]

    disorderItems.forEach((item, i) => {
      const d = disorders[item.key]
      const y = disorderStartY - (i * 18)
      if (d.checked) {
        drawCheckmark(p2, 65, y, 8)
        drawText(p2, 210, y + 2, d.yearDiagnosed, { font, size: fsm })
        drawText(p2, 330, y + 2, d.management, { font, size: fsm, maxWidth: 200 })
      }
    })

    // Other disorder
    if (disorders.other.checked) {
      const otherY = disorderStartY - (8 * 18)
      drawCheckmark(p2, 65, otherY, 8)
      drawText(p2, 100, otherY + 2, disorders.other.name, { font, size: fsm })
      drawText(p2, 210, otherY + 2, disorders.other.yearDiagnosed, { font, size: fsm })
      drawText(p2, 330, otherY + 2, disorders.other.management, { font, size: fsm, maxWidth: 200 })
    }

    // ==================== PAGE 3 (index 2): MEDICATIONS + FAMILY HISTORY ====================
    const p3 = pages[2]

    // Medications (5 rows)
    const medStartY = H - 130
    formData.medications.forEach((med, i) => {
      if (med.item) {
        const y = medStartY - (i * 20)
        drawText(p3, 65, y, med.item, { font, size: fsm })
        drawText(p3, 180, y, med.dose, { font, size: fsm })
        drawText(p3, 280, y, med.frequency, { font, size: fsm })
        drawText(p3, 400, y, med.reasonTaken, { font, size: fsm, maxWidth: 140 })
      }
    })

    // Family History (3 rows)
    const famStartY = H - 350
    formData.familyHistory.forEach((fh, i) => {
      if (fh.familyMember) {
        const y = famStartY - (i * 20)
        drawText(p3, 65, y, fh.familyMember, { font, size: fsm })
        if (fh.depression) drawCheckmark(p3, 170, y - 2, 7)
        if (fh.anxiety) drawCheckmark(p3, 210, y - 2, 7)
        if (fh.adhd) drawCheckmark(p3, 250, y - 2, 7)
        if (fh.learningDisorder) drawCheckmark(p3, 290, y - 2, 7)
        if (fh.migraine) drawCheckmark(p3, 340, y - 2, 7)
        if (fh.other) drawText(p3, 380, y, fh.other, { font, size: fsm })
        drawText(p3, 440, y, fh.management, { font, size: fsm, maxWidth: 100 })
      }
    })

    if (formData.familyHistoryNotes) {
      drawWrappedText(p3, 65, H - 430, formData.familyHistoryNotes, 470, { font, size: fsm })
    }

    // ==================== PAGES 4-5 (index 3-4): SYMPTOMS ====================
    const p4 = pages[3]

    // Symptom dates header
    drawText(p4, 260, H - 118, formData.symptomDates.dayInjured, { font, size: fsm })
    drawText(p4, 340, H - 118, formData.symptomDates.consult1, { font, size: fsm })
    drawText(p4, 410, H - 118, formData.symptomDates.consult2, { font, size: fsm })
    drawText(p4, 480, H - 118, formData.symptomDates.consult3, { font, size: fsm })

    // 24 symptoms x 5 columns
    const symptomKeys: (keyof Omit<SCOAT6FormData['symptoms'], 'other'>)[] = [
      'headaches', 'pressureInHead', 'neckPain', 'nauseaVomiting', 'dizziness',
      'blurredVision', 'balanceProblems', 'sensitivityLight', 'sensitivityNoise',
      'feelingSlowedDown', 'feelingInFog', 'difficultyConcentrating', 'difficultyRemembering',
      'fatigueOrLowEnergy', 'confusion', 'drowsiness', 'moreEmotional', 'irritability',
      'sadness', 'nervousAnxious', 'sleepDisturbance', 'abnormalHeartRate', 'excessiveSweating',
    ]

    const colPositions = {
      preInjury: 195,
      dayInjured: 260,
      consult1: 340,
      consult2: 410,
      consult3: 480,
    }

    const symptomStartY = H - 150
    const symptomRowH = 16

    symptomKeys.forEach((key, i) => {
      const s = formData.symptoms[key]
      // Determine which page (first 13 symptoms on page 4, rest on page 5)
      let page: PDFPage
      let y: number
      if (i < 13) {
        page = p4
        y = symptomStartY - (i * symptomRowH)
      } else {
        page = pages[4] // page 5
        y = H - 130 - ((i - 13) * symptomRowH)
      }

      const columns: ('preInjury' | 'dayInjured' | 'consult1' | 'consult2' | 'consult3')[] = [
        'preInjury', 'dayInjured', 'consult1', 'consult2', 'consult3'
      ]
      columns.forEach(col => {
        const val = s[col]
        if (val > 0) {
          drawTextCentered(page, colPositions[col] - 10, y, 30, val.toString(), { font, size: fsm })
        }
      })
    })

    // Other symptom
    const otherS = formData.symptoms.other
    if (otherS.name) {
      const page5 = pages[4]
      const otherY = H - 130 - (10 * symptomRowH)
      drawText(page5, 65, otherY, otherS.name, { font, size: fsm })
      const otherCols: ('preInjury' | 'dayInjured' | 'consult1' | 'consult2' | 'consult3')[] =
        ['preInjury', 'dayInjured', 'consult1', 'consult2', 'consult3']
      otherCols.forEach(col => {
        if (otherS[col] > 0) {
          drawTextCentered(page5, colPositions[col] - 10, otherY, 30, otherS[col].toString(), { font, size: fsm })
        }
      })
    }

    // Symptom totals for each column
    const p5 = pages[4]
    const totalsY = H - 320
    const totalColumns: ('preInjury' | 'dayInjured' | 'consult1' | 'consult2' | 'consult3')[] =
      ['preInjury', 'dayInjured', 'consult1', 'consult2', 'consult3']
    totalColumns.forEach(col => {
      // "Symptom number 0 / severity 0" is the assertion that the athlete is
      // ASYMPTOMATIC at that visit. A column nobody filled in gets a dash.
      if (!isSymptomColumnAdministered(formData, col)) {
        drawTextCentered(p5, colPositions[col] - 10, totalsY, 30, na, { font: fontBold, size: fsm })
        drawTextCentered(p5, colPositions[col] - 10, totalsY - 18, 30, na, { font: fontBold, size: fsm })
        return
      }
      const num = calculateSymptomNumber(formData.symptoms, col)
      const sev = calculateSymptomSeverity(formData.symptoms, col)
      drawTextCentered(p5, colPositions[col] - 10, totalsY, 30, num.toString(), { font: fontBold, size: fsm })
      drawTextCentered(p5, colPositions[col] - 10, totalsY - 18, 30, sev.toString(), { font: fontBold, size: fsm })
    })

    // Worse with physical/mental
    drawYesNo(p5, 400, 440, H - 380, formData.symptomsWorseWithPhysical, font, fs)
    drawYesNo(p5, 400, 440, H - 398, formData.symptomsWorseWithMental, font, fs)

    // Percent of normal
    drawText(p5, 300, H - 416, formData.percentOfNormal, { font, size: fs })

    // ==================== PAGE 5-6 (index 4-5): COGNITIVE TESTS ====================
    // Immediate Memory on page 5 bottom / page 6 top
    // Word list
    if (formData.wordListUsed === 'A') drawCheckmark(p5, 140, H - 470, 10)
    if (formData.wordListUsed === 'B') drawCheckmark(p5, 180, H - 470, 10)
    if (formData.wordListUsed === 'C') drawCheckmark(p5, 220, H - 470, 10)

    // Immediate Memory trials — draw on page 5 bottom
    const imTrialStartY = H - 510
    const imRowH = 20
    const imTrialXPositions = [200, 250, 300]
    const imTrials = [
      formData.immediateMemoryTrial1,
      formData.immediateMemoryTrial2,
      formData.immediateMemoryTrial3,
    ]

    if (immediateMemoryAdministered) {
      imTrials.forEach((trial, t) => {
        trial.forEach((correct, w) => {
          const y = imTrialStartY - (w * imRowH)
          if (correct) {
            drawCheckmark(p5, imTrialXPositions[t], y, 8)
          }
        })
      })

      // Immediate Memory Score
      drawText(p5, 350, H - 720, calculateImmediateMemory(formData).toString(), { font: fontBold, size: fsl })
    } else {
      drawNotAdministered(p5, 350, H - 720, { font: fontBold, size: fsl })
    }
    drawText(p5, 400, H - 720, formData.immediateMemoryTimeCompleted, { font, size: fs })

    // ==================== PAGE 6 (index 5): ALTERNATE WORD LIST + DIGITS + MONTHS ====================
    const p6 = pages[5]

    // Alternate 15-word list total
    if (formData.alternate15WordTotal !== null) {
      drawText(p6, 400, H - 130, (formData.alternate15WordTotal ?? '').toString(), { font, size: fs })
    }

    // Digit list
    if (formData.digitListUsed === 'A') drawCheckmark(p6, 140, H - 250, 10)
    if (formData.digitListUsed === 'B') drawCheckmark(p6, 180, H - 250, 10)
    if (formData.digitListUsed === 'C') drawCheckmark(p6, 220, H - 250, 10)

    if (digitsAdministered) {
      drawText(p6, 430, H - 340, String(formData.digitsBackward), { font: fontBold, size: fsl })
    } else {
      drawNotAdministered(p6, 430, H - 340, { font: fontBold, size: fsl })
    }

    // Months in reverse
    drawText(p6, 300, H - 430, formData.monthsReverseTime, { font, size: fs })
    if (formData.monthsReverseErrors !== null) {
      drawText(p6, 430, H - 430, String(formData.monthsReverseErrors), { font, size: fs })
    } else {
      drawNotAdministered(p6, 430, H - 430, { font, size: fs })
    }

    // Concentration Score (Digits + Months) — null unless BOTH halves ran.
    const concentration = calculateConcentration(formData)
    if (concentration !== null) {
      drawText(p6, 430, H - 460, concentration.toString(), { font: fontBold, size: fsl })
    } else {
      drawNotAdministered(p6, 430, H - 460, { font: fontBold, size: fsl })
    }

    // ==================== PAGE 7 (index 6): ORTHOSTATIC + CERVICAL ====================
    const p7 = pages[6]

    // Orthostatic Vital Signs
    drawText(p7, 200, H - 160, formData.orthostaticsSupineBP, { font, size: fs })
    drawText(p7, 350, H - 160, formData.orthostaticsSupineHR, { font, size: fs })
    drawText(p7, 200, H - 195, formData.orthostaticsStandingBP, { font, size: fs })
    drawText(p7, 350, H - 195, formData.orthostaticsStandingHR, { font, size: fs })

    if (formData.orthostaticsSupineResult) {
      drawText(p7, 450, H - 160, formData.orthostaticsSupineResult, { font, size: fsm })
    }
    if (formData.orthostaticsStandingResult) {
      drawText(p7, 450, H - 195, formData.orthostaticsStandingResult, { font, size: fsm })
    }

    // Orthostatic symptoms (dizziness/syncope/blurred vision/nausea/fatigue).
    // Collected on screen but previously never exported, so a positive
    // orthostatic response vanished from the record. `null` = never asked.
    const orthostaticSymptomLine = (
      value: boolean | null,
      description: string
    ): string => {
      if (value === null) return na
      if (!value) return 'No'
      return description.trim() ? `Yes — ${description.trim()}` : 'Yes'
    }
    drawText(p7, 200, H - 230,
      `Supine symptoms: ${orthostaticSymptomLine(formData.orthostaticsSupineSymptoms, formData.orthostaticsSupineSymptomsDescription)}`,
      { font, size: fsm, maxWidth: 160 })
    drawText(p7, 370, H - 230,
      `Standing symptoms: ${orthostaticSymptomLine(formData.orthostaticsStandingSymptoms, formData.orthostaticsStandingSymptomsDescription)}`,
      { font, size: fsm, maxWidth: 170 })

    // Cervical Spine Assessment
    const cervicalItems = [
      { key: 'cervicalMuscleSpasm' as const, y: H - 310 },
      { key: 'cervicalMidlineTenderness' as const, y: H - 328 },
      { key: 'cervicalParavertebralTenderness' as const, y: H - 346 },
      { key: 'cervicalFlexion' as const, y: H - 364 },
      { key: 'cervicalExtension' as const, y: H - 382 },
      { key: 'cervicalRightLateralFlexion' as const, y: H - 400 },
      { key: 'cervicalLeftLateralFlexion' as const, y: H - 418 },
      { key: 'cervicalRightRotation' as const, y: H - 436 },
      { key: 'cervicalLeftRotation' as const, y: H - 454 },
    ]

    cervicalItems.forEach(item => {
      const val = formData[item.key]
      if (val === 'Normal') drawFilledCircle(p7, 430, item.y + 4, 3.5)
      else if (val === 'Abnormal') drawFilledCircle(p7, 490, item.y + 4, 3.5)
    })

    // ==================== PAGE 8 (index 7): NEUROLOGICAL + BALANCE + TANDEM ====================
    const p8 = pages[7]

    // Neurological Examination
    const neuroItems = [
      { key: 'cranialNerves' as const, y: H - 130 },
      { key: 'limbTone' as const, y: H - 156 },
      { key: 'strength' as const, y: H - 174 },
      { key: 'deepTendonReflexes' as const, y: H - 192 },
      { key: 'sensation' as const, y: H - 210 },
      { key: 'cerebellarFunction' as const, y: H - 228 },
    ]

    neuroItems.forEach(item => {
      const val = formData[item.key]
      if (val === 'Normal') drawFilledCircle(p8, 380, item.y + 4, 3.5)
      else if (val === 'Abnormal') drawFilledCircle(p8, 430, item.y + 4, 3.5)
      else if (val === 'Not tested') drawFilledCircle(p8, 490, item.y + 4, 3.5)
    })

    if (formData.cranialNervesNotes) {
      drawText(p8, 200, H - 140, formData.cranialNervesNotes, { font, size: fsm, maxWidth: 150 })
    }
    if (formData.neurologicalComments) {
      drawWrappedText(p8, 65, H - 250, formData.neurologicalComments, 470, { font, size: fsm })
    }

    // mBESS
    if (formData.footTested === 'Left') drawFilledCircle(p8, 200, H - 310, 3.5)
    if (formData.footTested === 'Right') drawFilledCircle(p8, 260, H - 310, 3.5)

    // 0 errors of 30 = a PERFECT balance result. Never assert it by default —
    // each stance prints only its own recorded value, and the /30 total only
    // once all three stances exist.
    const mBessStances: Array<[number, number | null]> = [
      [H - 350, formData.mBessDoubleErrors],
      [H - 370, formData.mBessTandemErrors],
      [H - 390, formData.mBessSingleErrors],
    ]
    mBessStances.forEach(([y, value]) => {
      if (value !== null) drawText(p8, 400, y, String(value), { font, size: fs })
      else drawNotAdministered(p8, 400, y, { font, size: fs })
    })
    const mBessTotal = calculateMBESS(formData)
    if (balanceAdministered && mBessTotal !== null) {
      drawText(p8, 400, H - 410, mBessTotal.toString(), { font: fontBold, size: fs })
    } else {
      drawNotAdministered(p8, 400, H - 410, { font: fontBold, size: fs })
    }

    if (formData.mBessFoamDoubleErrors !== null) {
      drawText(p8, 490, H - 350, (formData.mBessFoamDoubleErrors ?? '').toString(), { font, size: fs })
    }
    if (formData.mBessFoamTandemErrors !== null) {
      drawText(p8, 490, H - 370, (formData.mBessFoamTandemErrors ?? '').toString(), { font, size: fs })
    }
    if (formData.mBessFoamSingleErrors !== null) {
      drawText(p8, 490, H - 390, (formData.mBessFoamSingleErrors ?? '').toString(), { font, size: fs })
    }
    const foamTotal = calculateMBESSFoam(formData)
    if (foamTotal !== null) {
      drawText(p8, 490, H - 410, foamTotal.toString(), { font: fontBold, size: fs })
    }

    // Tandem Gait
    drawText(p8, 200, H - 480, formData.tandemGaitTrial1, { font, size: fs })
    drawText(p8, 280, H - 480, formData.tandemGaitTrial2, { font, size: fs })
    drawText(p8, 360, H - 480, formData.tandemGaitTrial3, { font, size: fs })
    drawText(p8, 440, H - 480, calculateTandemGaitAverage(formData), { font, size: fs })
    drawText(p8, 490, H - 480, calculateTandemGaitFastest(formData), { font: fontBold, size: fs })

    // Qualitative failure flag — times alone read as a normal gait, so an
    // athlete who swayed, over-stepped, fell or could not complete must say so.
    if (formData.tandemGaitAbnormal) {
      drawText(p8, 65, H - 505,
        'Abnormal / failed to complete — unstable or sway, fall or over-step, dizzy or nauseous',
        { font: fontBold, size: fsm, maxWidth: 470 })
    }

    // ==================== PAGE 9 (index 8): COMPLEX TANDEM + DUAL TASK ====================
    const p9 = pages[8]

    // Complex Tandem Gait — a printed 0 asserts a flawless walk, so each cell
    // prints only what was actually recorded and totals need every component.
    const complexTandemCells: Array<[number, number, number | null]> = [
      [350, H - 160, formData.complexTandemForwardEyesOpen],
      [450, H - 160, formData.complexTandemForwardEyesClosed],
      [500, H - 160, calculateComplexTandemForward(formData)],
      [350, H - 195, formData.complexTandemBackwardEyesOpen],
      [450, H - 195, formData.complexTandemBackwardEyesClosed],
      [500, H - 195, calculateComplexTandemBackward(formData)],
    ]
    complexTandemCells.forEach(([x, y, value]) => {
      const bold = x === 500 ? { font: fontBold, size: fs } : { font, size: fs }
      if (value !== null) drawText(p9, x, y, String(value), bold)
      else drawNotAdministered(p9, x, y, bold)
    })
    const complexTandemTotal = calculateComplexTandemTotal(formData)
    if (complexTandemAdministered && complexTandemTotal !== null) {
      drawText(p9, 500, H - 230, complexTandemTotal.toString(), { font: fontBold, size: fsl })
    } else {
      drawNotAdministered(p9, 500, H - 230, { font: fontBold, size: fsl })
    }

    // Dual Task Gait
    drawText(p9, 200, H - 320, formData.dualTaskCognitiveTask, { font, size: fs })
    if (dualTaskAdministered) {
      if (formData.dualTaskTrialsAttempted !== null) {
        drawText(p9, 350, H - 350, String(formData.dualTaskTrialsAttempted), { font, size: fs })
      } else {
        drawNotAdministered(p9, 350, H - 350, { font, size: fs })
      }
      if (formData.dualTaskTrialsCorrect !== null) {
        drawText(p9, 450, H - 350, String(formData.dualTaskTrialsCorrect), { font, size: fs })
      } else {
        drawNotAdministered(p9, 450, H - 350, { font, size: fs })
      }
      // Accuracy is '' unless both counts exist; an empty string draws nothing.
      const accuracy = calculateDualTaskAccuracy(formData)
      if (accuracy) drawText(p9, 450, H - 370, accuracy, { font: fontBold, size: fs })
      else drawNotAdministered(p9, 450, H - 370, { font: fontBold, size: fs })
    } else {
      drawNotAdministered(p9, 350, H - 350, { font, size: fs })
      drawNotAdministered(p9, 450, H - 350, { font, size: fs })
      drawNotAdministered(p9, 450, H - 370, { font: fontBold, size: fs })
    }
    // Recorded time stands on its own — it is a measurement, not a derived score.
    drawText(p9, 350, H - 370, formData.dualTaskAverageTime, { font, size: fs })
    if (formData.dualTaskComments) {
      drawWrappedText(p9, 65, H - 400, formData.dualTaskComments, 470, { font, size: fsm })
    }

    // ==================== PAGE 10 (index 9): mVOMS + GAD-7 + PHQ-2 ====================
    const p10 = pages[9]

    // mVOMS Baseline — 0/0/0/0 asserts "no symptom provocation at rest", which
    // is a real clinical finding and must not be manufactured by default.
    const mvomsBaselineCols: Array<[number, number | null]> = [
      [200, formData.mvomsBaseline.headache],
      [280, formData.mvomsBaseline.dizziness],
      [360, formData.mvomsBaseline.nausea],
      [440, formData.mvomsBaseline.fogginess],
    ]
    mvomsBaselineCols.forEach(([x, value]) => {
      if (mvomsBaselineAdministered && value !== null) {
        drawText(p10, x, H - 130, String(value), { font, size: fs })
      } else {
        drawNotAdministered(p10, x, H - 130, { font, size: fs })
      }
    })

    // mVOMS tests
    const mvomsTests = [
      { data: formData.mvomsSmoothPursuits, y: H - 165 },
      { data: formData.mvomsSaccadesHorizontal, y: H - 200 },
      { data: formData.mvomsVORHorizontal, y: H - 235 },
      { data: formData.mvomsVMS, y: H - 270 },
    ]

    mvomsTests.forEach(test => {
      // `notTested` is the explicit flag and wins outright; otherwise the row
      // prints each provocation rating it actually has. A blank cell is NOT
      // "no provocation" — that finding has to be typed as a 0.
      const rowAdministered = isMvomsRowAdministered(test.data)
      if (test.data.notTested) {
        drawText(p10, 200, test.y, 'Not tested', { font, size: fsm })
      } else {
        const cells: Array<[number, number | null]> = [
          [200, test.data.headache],
          [280, test.data.dizziness],
          [360, test.data.nausea],
          [440, test.data.fogginess],
        ]
        cells.forEach(([x, value]) => {
          if (rowAdministered && value !== null) {
            drawText(p10, x, test.y, String(value), { font, size: fs })
          } else {
            drawNotAdministered(p10, x, test.y, { font, size: fs })
          }
        })
      }
      if (test.data.comments) {
        drawText(p10, 500, test.y, test.data.comments, { font, size: 7, maxWidth: 60 })
      }
    })

    // GAD-7 — an untouched screen scores 0 and reads "Minimal anxiety", which
    // is a diagnostic assertion. Requires an actual response to print.
    const gad7StartY = H - 400
    const gad7RowH = 18
    if (gad7Administered) {
      const gad7Items = [formData.gad7_1, formData.gad7_2, formData.gad7_3, formData.gad7_4,
        formData.gad7_5, formData.gad7_6, formData.gad7_7]
      gad7Items.forEach((val, i) => {
        if (val === null) return // unanswered item: no circle at all
        const y = gad7StartY - (i * gad7RowH)
        // Draw the value (0-3) at the appropriate column
        const colX = 350 + (val * 40)
        drawFilledCircle(p10, colX, y + 4, 3.5)
      })
      // GAD-7 total — the severity band is only ever derived from a real score
      const gad7Total = calculateGAD7(formData)
      drawText(p10, 430, gad7StartY - (7 * gad7RowH),
        gad7Total === null ? na : `${gad7Total} — ${getGAD7Severity(gad7Total)}`,
        { font: fontBold, size: fsm })
    } else {
      // No item circles; the score box states not-done rather than "0".
      drawText(p10, 430, gad7StartY - (7 * gad7RowH),
        formData.gad7NotDone ? `${na} Not done` : na, { font: fontBold, size: fsm })
    }

    // PHQ-2 — same rule.
    const phq2StartY = H - 560
    if (phq2Administered) {
      drawText(p10, 400, phq2StartY, String(formData.phq2_1), { font, size: fs })
      drawText(p10, 400, phq2StartY - 18, String(formData.phq2_2), { font, size: fs })
      drawText(p10, 400, phq2StartY - 40, `Total: ${calculatePHQ2(formData) ?? na}`, { font: fontBold, size: fsm })
    } else {
      drawNotAdministered(p10, 400, phq2StartY, { font, size: fs })
      drawNotAdministered(p10, 400, phq2StartY - 18, { font, size: fs })
      drawText(p10, 400, phq2StartY - 40,
        formData.phq2NotDone ? `Total: ${na} Not done` : `Total: ${na}`, { font: fontBold, size: fsm })
    }

    // ==================== PAGE 11 (index 10): SLEEP SCREEN ====================
    const p11 = pages[10]

    // Sleep screen — an untouched screen scores 0 and reads "Normal".
    const sleepStartY = H - 160
    const sleepRowH = 22
    if (sleepAdministered) {
      const sleepItems = [formData.sleep1, formData.sleep2, formData.sleep3, formData.sleep4, formData.sleep5]
      sleepItems.forEach((val, i) => {
        const y = sleepStartY - (i * sleepRowH)
        if (val === null) drawNotAdministered(p11, 430, y, { font, size: fs })
        else drawText(p11, 430, y, String(val), { font, size: fs })
      })
      const sleepTotal = calculateSleepScore(formData)
      drawText(p11, 430, sleepStartY - (5 * sleepRowH),
        sleepTotal === null ? na : `${sleepTotal} — ${getSleepSeverity(sleepTotal)}`,
        { font: fontBold, size: fsm })
    } else {
      for (let i = 0; i < 5; i++) {
        drawNotAdministered(p11, 430, sleepStartY - (i * sleepRowH), { font, size: fs })
      }
      drawText(p11, 430, sleepStartY - (5 * sleepRowH),
        formData.sleepNotDone ? `${na} Not done` : na, { font: fontBold, size: fsm })
    }

    // ==================== PAGE 12 (index 11): DELAYED RECALL + ASSESSMENTS ====================
    const p12 = pages[11]

    // Delayed Recall
    if (formData.wordListUsed === 'A') drawCheckmark(p12, 140, H - 150, 10)
    if (formData.wordListUsed === 'B') drawCheckmark(p12, 180, H - 150, 10)
    if (formData.wordListUsed === 'C') drawCheckmark(p12, 220, H - 150, 10)

    const drStartY = H - 190
    const drRowH = 20
    if (delayedRecallAdministered) {
      formData.delayedRecall.forEach((correct, i) => {
        const y = drStartY - (i * drRowH)
        if (correct) drawCheckmark(p12, 350, y, 8)
      })

      drawText(p12, 430, H - 190, calculateDelayedRecall(formData).toString(), { font: fontBold, size: fsl })
    } else {
      drawNotAdministered(p12, 430, H - 190, { font: fontBold, size: fsl })
    }
    drawText(p12, 200, H - 420, formData.delayedRecallStartTime, { font, size: fs })
    drawText(p12, 350, H - 420, formData.delayedRecallMinutesSinceImmediate, { font, size: fs })

    // Computerized Tests — the post-injury results are the clinically load-
    // bearing half and were previously collected but never exported.
    if (!formData.computerizedTestNotDone && formData.computerizedTestBattery) {
      drawText(p12, 200, H - 470, formData.computerizedTestBattery, { font, size: fs })
      drawText(p12, 200, H - 488, formData.computerizedTestBaselineDate, { font, size: fs })
      drawText(p12, 200, H - 502, formData.computerizedTestPostInjuryRest, { font, size: fsm, maxWidth: 340 })
      drawText(p12, 200, H - 514, formData.computerizedTestPostInjuryExercise, { font, size: fsm, maxWidth: 340 })
    }

    // Aerobic Exercise
    if (!formData.aerobicExerciseNotDone && formData.aerobicExerciseProtocol) {
      drawText(p12, 200, H - 530, formData.aerobicExerciseProtocol, { font, size: fs })
    }

    // Overall Assessment
    if (formData.overallAssessmentSummary) {
      drawWrappedText(p12, 65, H - 580, formData.overallAssessmentSummary, 470, { font, size: fsm })
    }

    // ==================== PAGES 13-14 (index 12-13): MANAGEMENT ====================
    const p13 = pages[12]

    // Imaging
    if (formData.imagingRequested) {
      drawCheckmark(p13, 65, H - 130, 10)
      drawText(p13, 200, H - 130, formData.imagingType, { font, size: fs })
      drawText(p13, 200, H - 148, formData.imagingReason, { font, size: fs, maxWidth: 350 })
      if (formData.imagingFindings) {
        drawWrappedText(p13, 200, H - 170, formData.imagingFindings, 340, { font, size: fsm })
      }
    }

    // Return recommendations
    drawText(p13, 200, H - 250, formData.returnToClass, { font, size: fs })
    drawText(p13, 200, H - 270, formData.returnToWork, { font, size: fs })
    drawText(p13, 200, H - 290, formData.returnToDriving, { font, size: fs })
    drawText(p13, 200, H - 310, formData.returnToSport, { font, size: fs })

    // Referrals
    const referralKeys: (keyof SCOAT6FormData['referrals'])[] = [
      'athleticTrainer', 'exercisePhysiologist', 'neurologist', 'neuropsychologist',
      'neurosurgeon', 'ophthalmologist', 'optometrist', 'paediatrician',
      'physiatrist', 'physiotherapist', 'psychologist', 'psychiatrist',
      'sportMedicine', 'other',
    ]

    const refStartY = H - 380
    const refRowH = 16
    referralKeys.forEach((key, i) => {
      const ref = formData.referrals[key]
      if (ref.checked) {
        const y = refStartY - (i * refRowH)
        drawCheckmark(p13, 65, y, 8)
        if (ref.name) drawText(p13, 250, y + 2, ref.name, { font, size: fsm })
      }
    })

    // Pharmacotherapy, Review, Follow-up
    drawText(p13, 200, H - 620, formData.pharmacotherapyPrescribed, { font, size: fs, maxWidth: 340 })
    drawText(p13, 200, H - 640, formData.dateOfReview, { font, size: fs })
    drawText(p13, 400, H - 640, formData.dateOfFollowUp, { font, size: fs })

    // ==================== PAGE 15 (index 14): HCP + NOTES ====================
    const p15 = pages[14]

    drawText(p15, 200, H - 160, formData.hcpName, { font, size: fs })
    drawText(p15, 200, H - 180, formData.hcpTitle, { font, size: fs })
    drawText(p15, 200, H - 200, formData.hcpRegistration, { font, size: fs })
    drawText(p15, 200, H - 220, formData.hcpDate, { font, size: fs })
    // Attestation signature — collected but never drawn.
    drawText(p15, 200, H - 240, formData.hcpSignature, { font, size: fs })

    // Additional Clinical Notes
    if (formData.additionalClinicalNotes) {
      drawWrappedText(p15, 65, H - 300, formData.additionalClinicalNotes, 470, { font, size: fsm })
    }

    // Save and download
    await savePDFAndDownload(pdfDoc, filename)
  } catch (error) {
    console.error('SCOAT6 flat PDF export failed:', error)
    alert(`PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    throw error
  }
}
