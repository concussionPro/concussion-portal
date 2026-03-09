import { SCAT6FormData } from '../types/scat6.types'
import {
  calculateSymptomNumber,
  calculateSymptomSeverity,
  calculateOrientation,
  calculateImmediateMemory,
  calculateConcentration,
  calculateDelayedRecall,
  calculateTotalCognitive,
  calculateMBESS,
  calculateMBESSFoam,
  calculateTandemGaitAverage,
  calculateTandemGaitFastest,
  calculateDualTaskFastest,
} from './scat6-calculations'
import {
  drawText,
  drawTextCentered,
  drawCheckmark,
  drawFilledCircle,
  drawCircleOutline,
  drawWrappedText,
  drawYesNo,
  embedStandardFonts,
  loadFlatPDF,
  savePDFAndDownload,
  BLACK,
} from './pdf-draw-helpers'
import type { PDFFont, PDFPage } from 'pdf-lib'

/**
 * SCAT6 Flat PDF Export — draws values at precise coordinates on a non-fillable PDF.
 *
 * Coordinates derived from the fillable SCAT6 PDF form field positions.
 * Page dimensions: 595.28 x 793.70 pts (custom, slightly smaller than A4).
 */
export async function exportSCAT6ToFlatPDF(
  formData: SCAT6FormData,
  filename: string = 'SCAT6_Filled.pdf'
) {
  try {
    const pdfDoc = await loadFlatPDF('/docs/SCAT6_Flat.pdf')
    const { font, fontBold } = await embedStandardFonts(pdfDoc)
    const pages = pdfDoc.getPages()

    // Page indices (0-based): Page 1 = cover, Pages 2-9 = data
    const fs = 9    // default font size
    const fsm = 8   // small font size
    const fsl = 10  // large font size

    // ==================== PAGE 2 (index 1): DEMOGRAPHICS ====================
    const p2 = pages[1]
    drawText(p2, 128, 666, formData.athleteName, { font, size: fs })
    drawText(p2, 407, 666, formData.idNumber, { font, size: fs })
    drawText(p2, 128, 647, formData.dateOfBirth, { font, size: fs })
    drawText(p2, 284, 647, formData.dateOfExamination, { font, size: fs })
    drawText(p2, 420, 647, formData.dateOfInjury, { font, size: fs })
    drawText(p2, 128, 627, formData.timeOfInjury, { font, size: fs })
    drawText(p2, 438, 628, formData.dominantHand, { font, size: fs })
    drawText(p2, 376, 608, formData.sportTeamSchool, { font, size: fs })
    drawText(p2, 207, 590, formData.currentYear, { font, size: fs })
    drawText(p2, 437, 589, formData.yearsEducation, { font, size: fs })
    drawText(p2, 128, 571, formData.firstLanguage, { font, size: fs })
    drawText(p2, 377, 571, formData.preferredLanguage, { font, size: fs })
    drawText(p2, 109, 552, formData.examiner, { font, size: fs })

    // Sex radio — draw filled circle at appropriate position
    if (formData.sex === 'Male') drawFilledCircle(p2, 150, 613, 3.5)
    else if (formData.sex === 'Female') drawFilledCircle(p2, 192, 614, 3.5)
    else if (formData.sex === 'Prefer Not To Say' || formData.sex === 'Other') drawFilledCircle(p2, 265, 613, 3.5)

    // Concussion History
    drawText(p2, 316, 505, formData.previousConcussions, { font, size: fs })
    drawText(p2, 219, 486, formData.mostRecentConcussion, { font, size: fs })
    drawText(p2, 143, 467, formData.primarySymptoms, { font, size: fs })
    drawText(p2, 409, 447, formData.recoveryTime, { font, size: fs })

    // ==================== PAGE 3 (index 2): RED FLAGS + GCS + OBSERVABLE SIGNS ====================
    const p3 = pages[2]

    // Observable Signs Y/N radio buttons (Radio1-Radio8 on left column, Radio9-Radio15 on right)
    // These map to Red Flags checkboxes — we don't have individual fields for them in the data model
    // The GCS E/V/M scoring would go here if we had individual GCS scores in the data model
    // For now, page 3 is mostly structural/clinical examination data not captured in our form

    // ==================== PAGE 4 (index 3): ATHLETE BACKGROUND + SYMPTOMS ====================
    const p4 = pages[3]

    // Athlete Background Y/N
    drawYesNo(p4, 237, 253, 636, formData.hospitalizedForHeadInjury, font, fs)
    drawYesNo(p4, 237, 253, 615, formData.headacheDisorder, font, fs)
    drawYesNo(p4, 237, 253, 596, formData.learningDisability, font, fs)
    drawYesNo(p4, 467, 483, 636, formData.adhd, font, fs)
    drawYesNo(p4, 467, 483, 615, formData.psychologicalDisorder, font, fs)

    // Notes and Medications
    drawWrappedText(p4, 63, 567, formData.athleteBackgroundNotes, 200, { font, size: fsm })
    drawWrappedText(p4, 293, 567, formData.currentMedications, 200, { font, size: fsm })

    // Symptom count — header area (right side of symptom section: Text23 x=388.8, y=501)
    const symNum = calculateSymptomNumber(formData.symptoms)
    const symSev = calculateSymptomSeverity(formData.symptoms)
    drawText(p4, 390, 503, symNum.toString(), { font: fontBold, size: fsl })

    // Symptoms (22 items, 0-6 scale)
    // Column center x positions from fillable field data (s1 radio widgets + half width)
    const symptomColX = [193, 204, 215, 226, 238, 249, 260]
    // Row y positions from field extraction (s1..s22 field y + 5.5 for center)
    const symptomYPositions = [
      393, 381, 369, 357.3, 345.3, 332.3, 319.3, 307.3, 295.3, 283.3, 271.3,
      259.3, 247.3, 234.3, 222.3, 210.3, 198.3, 185.3, 173.3, 161.3, 149.3, 137.3,
    ]

    const symptomKeys: (keyof SCAT6FormData['symptoms'])[] = [
      'headaches', 'pressureInHead', 'neckPain', 'nauseaVomiting', 'dizziness',
      'blurredVision', 'balanceProblems', 'sensitivityLight', 'sensitivityNoise',
      'feelingSlowedDown', 'feelingInFog', 'dontFeelRight', 'difficultyConcentrating',
      'difficultyRemembering', 'fatigueOrLowEnergy', 'confusion', 'drowsiness',
      'moreEmotional', 'irritability', 'sadness', 'nervousAnxious', 'troubleFallingAsleep',
    ]

    symptomKeys.forEach((key, i) => {
      const value = formData.symptoms[key]
      if (value >= 0 && value <= 6) {
        drawFilledCircle(p4, symptomColX[value], symptomYPositions[i], 3.5)
      }
    })

    // Bottom summary: Total number of symptoms (Text26: x=165.2, y=76)
    drawText(p4, 167, 78, symNum.toString(), { font: fontBold, size: fsl })
    // Bottom summary: Symptom severity score (Text27: x=388.8, y=75.6)
    drawText(p4, 390, 77, symSev.toString(), { font: fontBold, size: fsl })

    // Why not 100% (Text25: x=293.4, y=227.7, large text box in right panel)
    if (formData.whyNotHundredPercent) {
      drawWrappedText(p4, 295, 290, formData.whyNotHundredPercent, 200, { font, size: fsm })
    }

    // Worse with physical/mental (athelete6: Y=462.8/N=478.6 y=384, athelete7: Y=463.8/N=479.6 y=368)
    drawYesNo(p4, 468, 484, 381, formData.symptomsWorseWithPhysical, font, fs)
    drawYesNo(p4, 469, 485, 365, formData.symptomsWorseWithMental, font, fs)

    // ==================== PAGE 5 (index 4): ORIENTATION + IMMEDIATE MEMORY ====================
    const p5 = pages[4]

    // Orientation items (5 items, score 0 or 1 each)
    // ori1-5 field positions: "0" at x=427.2, "1" at x=454.2
    // y positions from extraction: 663.8, 641.8, 618.8, 594.8, 571.8 (center = y+5.5)
    const oriYPositions = [669, 647, 624, 600, 577]
    const oriBooleans = [
      formData.orientationMonth,
      formData.orientationDate,
      formData.orientationDayOfWeek,
      formData.orientationYear,
      formData.orientationTime,
    ]
    oriBooleans.forEach((val, i) => {
      if (val) {
        drawFilledCircle(p5, 460, oriYPositions[i], 3.5) // "1" position (x=454.2+5.5)
      } else {
        drawFilledCircle(p5, 433, oriYPositions[i], 3.5) // "0" position (x=427.2+5.5)
      }
    })

    // Orientation Score (Text28: x=421.5, y=545.9)
    drawText(p5, 423, 547, calculateOrientation(formData).toString(), { font: fontBold, size: fsl })

    // Word List Used (A/B/C checkboxes)
    if (formData.wordListUsed === 'A') drawCheckmark(p5, 140, 423, 10)
    if (formData.wordListUsed === 'B') drawCheckmark(p5, 181, 423, 10)
    if (formData.wordListUsed === 'C') drawCheckmark(p5, 221, 423, 10)

    // Immediate Memory — 3 trials x 10 words
    // Field positions: Tri1 "0" x=186.7 "1" x=208.7, Tri2 "0" x=230.2 "1" x=252.2, Tri3 "0" x=273.5 "1" x=295.5
    // Centers: Tri1: 0→192, 1→214; Tri2: 0→236, 1→258; Tri3: 0→279, 1→301
    // Word rows: a=381.9, b=356.9, c=332.9, d=307.9, e=282.9, f=257.9, g=232.9, h=208.9, i=182.9, j=157.9
    const trial0X = [192, 236, 279]  // "0" circle center x per trial
    const trial1X = [214, 258, 301]  // "1" circle center x per trial
    const wordYPositions = [387, 362, 338, 313, 288, 263, 238, 214, 188, 163]

    const trials = [
      formData.immediateMemoryTrial1,
      formData.immediateMemoryTrial2,
      formData.immediateMemoryTrial3,
    ]

    trials.forEach((trial, t) => {
      trial.forEach((correct, w) => {
        const y = wordYPositions[w]
        if (correct) {
          drawFilledCircle(p5, trial1X[t], y, 3.5)
        } else {
          drawFilledCircle(p5, trial0X[t], y, 3.5)
        }
      })
    })

    // Trial totals (Text29: x=190.3 y=136, Text30: x=233.4 y=136.3, Text31: x=276.5 y=136.3)
    const trial1Total = formData.immediateMemoryTrial1.filter(Boolean).length
    const trial2Total = formData.immediateMemoryTrial2.filter(Boolean).length
    const trial3Total = formData.immediateMemoryTrial3.filter(Boolean).length
    drawText(p5, 192, 138, trial1Total.toString(), { font: fontBold, size: fs })
    drawText(p5, 235, 138, trial2Total.toString(), { font: fontBold, size: fs })
    drawText(p5, 278, 138, trial3Total.toString(), { font: fontBold, size: fs })

    // Immediate Memory Score (Text32: x=214.5, y=111.6)
    drawText(p5, 216, 113, calculateImmediateMemory(formData).toString(), { font: fontBold, size: fsl })

    // Time completed (Text33: x=390.5, y=110)
    drawText(p5, 392, 112, formData.immediateMemoryTimeCompleted, { font, size: fs })

    // ==================== PAGE 6 (index 5): CONCENTRATION + BALANCE ====================
    const p6 = pages[5]

    // Digit List Used (A/B/C)
    if (formData.digitListUsed === 'A') drawCheckmark(p6, 140, 583, 10)
    if (formData.digitListUsed === 'B') drawCheckmark(p6, 181, 583, 10)
    if (formData.digitListUsed === 'C') drawCheckmark(p6, 221, 583, 10)

    // Digits Backward Score (Text34: x=427.3, y=389.6)
    drawText(p6, 429, 391, formData.digitsBackward.toString(), { font: fontBold, size: fsl })

    // Months in Reverse
    // Time (Text35: x=183.2, y=294.1, h=-14.1 → field box top=294, bottom=280, draw inside)
    drawText(p6, 185, 284, formData.monthsReverseTime, { font, size: fs })
    // Errors (Text35aa: x=362.2, y=282.1)
    drawText(p6, 364, 284, formData.monthsReverseErrors.toString(), { font, size: fs })

    // Months Score (0 or 1): position at (119, 251) = Text36 area on flat PDF
    const monthsScore = (formData.monthsReverseErrors === 0 && parseFloat(formData.monthsReverseTime || '999') < 30) ? 1 : 0
    drawText(p6, 200, 259, monthsScore.toString(), { font: fontBold, size: fsl })

    // Concentration Score (Digits + Months) — in the dark blue bar value area
    drawText(p6, 448, 237, calculateConcentration(formData).toString(), { font: fontBold, size: fsl })

    // Foot Tested (Foot radio: Left x=128.7, Right x=177.7, y=138.1)
    if (formData.footTested === 'Left') drawFilledCircle(p6, 135, 144, 3.5)
    if (formData.footTested === 'Right') drawFilledCircle(p6, 184, 144, 3.5)

    // Testing Surface (Text37: x=214.7, y=223.5) & Footwear (Text38: x=201.1, y=116.8)
    drawText(p6, 216, 225, formData.testingSurface, { font, size: fs })

    // NOTE: mBESS individual errors are on PAGE 7, not page 6

    // ==================== PAGE 7 (index 6): BALANCE + TANDEM + DUAL TASK ====================
    const p7 = pages[6]

    // mBESS Errors - Firm Surface (all on page 7)
    // Text40: x=135.7, y=669.7 (Double Leg)
    // Text41: x=135.7, y=651.1 (Tandem)
    // Text42: x=135.7, y=631.6 (Single Leg)
    drawText(p7, 137, 671, formData.mBessDoubleErrors.toString(), { font, size: fs })
    drawText(p7, 137, 653, formData.mBessTandemErrors.toString(), { font, size: fs })
    drawText(p7, 137, 633, formData.mBessSingleErrors.toString(), { font, size: fs })

    // mBESS Errors - Foam (optional, page 7 right side)
    // Text43: x=371.6, y=683.2 (Double Leg foam)
    // Text44: x=371.6, y=652 (Tandem foam)
    // Text43C: x=371.6, y=632.5 (Single Leg foam)
    if (formData.mBessFoamDoubleErrors !== null) {
      drawText(p7, 373, 685, formData.mBessFoamDoubleErrors.toString(), { font, size: fs })
    }
    if (formData.mBessFoamTandemErrors !== null) {
      drawText(p7, 373, 654, formData.mBessFoamTandemErrors.toString(), { font, size: fs })
    }
    if (formData.mBessFoamSingleErrors !== null) {
      drawText(p7, 373, 634, formData.mBessFoamSingleErrors.toString(), { font, size: fs })
    }

    // mBESS Total Errors (Text42A: x=135.7, y=612.7 firm; Text45: x=371.6, y=613.6 foam)
    const mBessTotal = calculateMBESS(formData)
    drawText(p7, 137, 614, mBessTotal.toString(), { font: fontBold, size: fsl })

    const mBessFoamTotal = calculateMBESSFoam(formData)
    if (mBessFoamTotal !== null) {
      drawText(p7, 373, 615, mBessFoamTotal.toString(), { font: fontBold, size: fsl })
    }

    // Tandem Gait — 3 trials + average + fastest
    drawText(p7, 65, 422, formData.tandemGaitTrial1, { font, size: fs })
    drawText(p7, 151, 422, formData.tandemGaitTrial2, { font, size: fs })
    drawText(p7, 237, 422, formData.tandemGaitTrial3, { font, size: fs })
    drawText(p7, 323, 422, calculateTandemGaitAverage(formData), { font, size: fs })
    drawText(p7, 409, 422, calculateTandemGaitFastest(formData), { font: fontBold, size: fs })

    // Dual Task Gait (Optional section)
    // Trial times: Text53 x=395.7 y=206.6, Text54 x=395.7 y=185.1, Text54bb x=395.7 y=165.1
    // Trial errors: Text55 x=429.2 y=205.7, Text56 x=429.7 y=185.2, Text57 x=429.4 y=165.2
    if (formData.dualTask1Time) {
      drawText(p7, 397, 208, formData.dualTask1Time, { font, size: fs })
    }
    if (formData.dualTask2Time) {
      drawText(p7, 397, 187, formData.dualTask2Time, { font, size: fs })
    }
    if (formData.dualTask3Time) {
      drawText(p7, 397, 167, formData.dualTask3Time, { font, size: fs })
    }
    if (formData.dualTask1Errors !== null) {
      drawText(p7, 431, 208, (formData.dualTask1Errors ?? '').toString(), { font, size: fs })
    }
    if (formData.dualTask2Errors !== null) {
      drawText(p7, 431, 187, (formData.dualTask2Errors ?? '').toString(), { font, size: fs })
    }
    if (formData.dualTask3Errors !== null) {
      drawText(p7, 431, 167, (formData.dualTask3Errors ?? '').toString(), { font, size: fs })
    }

    // Starting integer in alternate grid (Text58: x=67.3, y=112.4)
    if (formData.dualTaskAlternateStartingInteger) {
      drawText(p7, 69, 114, formData.dualTaskAlternateStartingInteger, { font, size: fs })
    }

    // Practice time (Text51: x=406.5, y=290.8)
    if (formData.dualTaskPracticeTime) {
      drawText(p7, 408, 292, formData.dualTaskPracticeTime, { font, size: fs })
    }

    // Bottom summary row: Starting Integer (Text82: x=130.4, y=87.9), Errors (Text83: x=221, y=88.2), Time (Text83A: x=307.2, y=87.2)
    const dtFastest = calculateDualTaskFastest(formData)
    if (formData.dualTaskAlternateStartingInteger) {
      drawText(p7, 132, 89, formData.dualTaskAlternateStartingInteger, { font, size: fs })
    }
    if (dtFastest) {
      drawText(p7, 309, 89, dtFastest, { font: fontBold, size: fs })
    }

    // ==================== PAGE 8 (index 7): DELAYED RECALL + COGNITIVE TOTALS ====================
    const p8 = pages[7]

    // Word List Used for Delayed Recall (A_3/B_3/C_3)
    if (formData.wordListUsed === 'A') drawCheckmark(p8, 140, 479, 10)
    if (formData.wordListUsed === 'B') drawCheckmark(p8, 181, 479, 10)
    if (formData.wordListUsed === 'C') drawCheckmark(p8, 221, 479, 10)

    // Delayed Recall — 10 words
    // DEL field positions from extraction: "0" at x=208.4, "1" at x=231.3
    // Y positions: 440.2, 421, 400.6, 381.4, 363.4, 344.2, 324.8, 306.6, 287.1, 268.9
    const delRecallYPositions = [446, 427, 407, 387, 369, 350, 331, 312, 293, 275]
    formData.delayedRecall.forEach((correct, i) => {
      const y = delRecallYPositions[i]
      if (y) {
        if (correct) {
          drawFilledCircle(p8, 237, y, 3.5) // "1" position (x=231.3 + 5.5)
        } else {
          drawFilledCircle(p8, 214, y, 3.5) // "0" position (x=208.4 + 5.5)
        }
      }
    })

    // Delayed Recall Score (Text84D: x=206.1, y=246.2)
    drawText(p8, 208, 248, calculateDelayedRecall(formData).toString(), { font: fontBold, size: fsl })

    // Delayed Recall Start Time (Text83B: x=112.3, y=501.8 — note: this is the time administered field)
    drawText(p8, 114, 503, formData.delayedRecallStartTime, { font, size: fs })

    // Total Cognitive Score Summary (all on page 8, field positions from extraction)
    // Text28: x=129.9, y=191.7 — Orientation (of 5)
    // Text32: x=129.9, y=171.6 — Immediate Memory (of 30)
    // Text37: x=129.9, y=152.5 — Concentration (of 5)
    // Text84D: x=129.9, y=133.6 — Delayed Recall (of 10)
    // Text87: x=128.8, y=114.8 — Total (of 50)
    const orientation = calculateOrientation(formData)
    const immMem = calculateImmediateMemory(formData)
    const concentration = calculateConcentration(formData)
    const delayedRecall = calculateDelayedRecall(formData)
    const totalCognitive = calculateTotalCognitive(formData)

    drawText(p8, 131, 193, orientation.toString(), { font: fontBold, size: fsl })
    drawText(p8, 131, 173, immMem.toString(), { font: fontBold, size: fsl })
    drawText(p8, 131, 154, concentration.toString(), { font: fontBold, size: fsl })
    drawText(p8, 131, 135, delayedRecall.toString(), { font: fontBold, size: fsl })
    drawText(p8, 130, 116, totalCognitive.toString(), { font: fontBold, size: fsl })

    // Different from usual (TTL12: Yes x=70.7, No x=119.4, N/A x=208.7, y=74.5)
    if (formData.differentFromUsual !== null) {
      if (formData.differentFromUsual) {
        drawFilledCircle(p8, 77, 81, 3.5) // Yes
      } else {
        drawFilledCircle(p8, 126, 81, 3.5) // No
      }
    }

    // ==================== PAGE 9 (index 8): DECISION TABLE + DISPOSITION + HCP ====================
    const p9 = pages[8]
    const dd = formData.decisionDates

    // Decision table — 3 date columns
    // Date row positions (Text88-90): x=[225, 322, 420], y=694
    // Data row positions (100-102 series): x=[203, 302, 399]
    const decDateX = [227, 324, 422]
    const decColX = [203, 302, 399]
    const decRowY = {
      date: 694,
      neuroExam: 657,
      symptomNum: 641,
      symptomSev: 626,
      orientation: 609,
      immMemory: 593,
      concentration: 578,
      delRecall: 562,
      mBess: 545,
      tandem: 529,
      dualTask: 514,
    }

    // Date row (uses wider column positions)
    drawText(p9, decDateX[0], decRowY.date, dd.date1, { font, size: fsm })
    drawText(p9, decDateX[1], decRowY.date, dd.date2, { font, size: fsm })
    drawText(p9, decDateX[2], decRowY.date, dd.date3, { font, size: fsm })

    // Neurological Exam
    drawText(p9, decColX[0], decRowY.neuroExam, dd.neurologicalExam1, { font, size: fsm })
    drawText(p9, decColX[1], decRowY.neuroExam, dd.neurologicalExam2, { font, size: fsm })
    drawText(p9, decColX[2], decRowY.neuroExam, dd.neurologicalExam3, { font, size: fsm })

    // Symptom Number
    drawText(p9, decColX[0], decRowY.symptomNum, dd.symptomNumber1?.toString() || '', { font, size: fsm })
    drawText(p9, decColX[1], decRowY.symptomNum, dd.symptomNumber2?.toString() || '', { font, size: fsm })
    drawText(p9, decColX[2], decRowY.symptomNum, dd.symptomNumber3?.toString() || '', { font, size: fsm })

    // Symptom Severity
    drawText(p9, decColX[0], decRowY.symptomSev, dd.symptomSeverity1?.toString() || '', { font, size: fsm })
    drawText(p9, decColX[1], decRowY.symptomSev, dd.symptomSeverity2?.toString() || '', { font, size: fsm })
    drawText(p9, decColX[2], decRowY.symptomSev, dd.symptomSeverity3?.toString() || '', { font, size: fsm })

    // Orientation
    drawText(p9, decColX[0], decRowY.orientation, dd.orientation1?.toString() || '', { font, size: fsm })
    drawText(p9, decColX[1], decRowY.orientation, dd.orientation2?.toString() || '', { font, size: fsm })
    drawText(p9, decColX[2], decRowY.orientation, dd.orientation3?.toString() || '', { font, size: fsm })

    // Immediate Memory
    drawText(p9, decColX[0], decRowY.immMemory, dd.immediateMemory1?.toString() || '', { font, size: fsm })
    drawText(p9, decColX[1], decRowY.immMemory, dd.immediateMemory2?.toString() || '', { font, size: fsm })
    drawText(p9, decColX[2], decRowY.immMemory, dd.immediateMemory3?.toString() || '', { font, size: fsm })

    // Concentration
    drawText(p9, decColX[0], decRowY.concentration, dd.concentration1?.toString() || '', { font, size: fsm })
    drawText(p9, decColX[1], decRowY.concentration, dd.concentration2?.toString() || '', { font, size: fsm })
    drawText(p9, decColX[2], decRowY.concentration, dd.concentration3?.toString() || '', { font, size: fsm })

    // mBESS Total
    drawText(p9, decColX[0], decRowY.mBess, dd.mBessTotal1?.toString() || '', { font, size: fsm })
    drawText(p9, decColX[1], decRowY.mBess, dd.mBessTotal2?.toString() || '', { font, size: fsm })
    drawText(p9, decColX[2], decRowY.mBess, dd.mBessTotal3?.toString() || '', { font, size: fsm })

    // Tandem Gait Fastest
    drawText(p9, decColX[0], decRowY.tandem, dd.tandemGaitFastest1 || '', { font, size: fsm })
    drawText(p9, decColX[1], decRowY.tandem, dd.tandemGaitFastest2 || '', { font, size: fsm })
    drawText(p9, decColX[2], decRowY.tandem, dd.tandemGaitFastest3 || '', { font, size: fsm })

    // Dual Task Fastest
    drawText(p9, decColX[0], decRowY.dualTask, dd.dualTaskFastest1 || '', { font, size: fsm })
    drawText(p9, decColX[1], decRowY.dualTask, dd.dualTaskFastest2 || '', { font, size: fsm })
    drawText(p9, decColX[2], decRowY.dualTask, dd.dualTaskFastest3 || '', { font, size: fsm })

    // Concussion Diagnosed (field centers: Yes x=85 y=459, No x=133 y=458, Deferred x=201 y=459)
    if (formData.concussionDiagnosed === 'Yes') drawFilledCircle(p9, 85, 459, 3.5)
    else if (formData.concussionDiagnosed === 'No') drawFilledCircle(p9, 133, 458, 3.5)
    else if (formData.concussionDiagnosed === 'Deferred') drawFilledCircle(p9, 201, 459, 3.5)

    // HCP Attestation
    drawText(p9, 90, 387, formData.hcpName, { font, size: fs })
    drawText(p9, 353, 368, formData.hcpTitle, { font, size: fs })
    drawText(p9, 223, 348, formData.hcpRegistration, { font, size: fs })
    drawText(p9, 422, 350, formData.hcpDate, { font, size: fs })

    // Additional Clinical Notes
    if (formData.additionalClinicalNotes) {
      drawWrappedText(p9, 63, 300, formData.additionalClinicalNotes, 430, { font, size: fsm })
    }

    // Save and download
    await savePDFAndDownload(pdfDoc, filename)
  } catch (error) {
    console.error('SCAT6 flat PDF export failed:', error)
    alert(`PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    throw error
  }
}
