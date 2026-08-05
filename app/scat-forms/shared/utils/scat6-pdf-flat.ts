import { SCAT6FormData } from '../types/scat6.types'
import {
  calculateSymptomNumber,
  calculateSymptomSeverity,
  calculateOrientation,
  calculateImmediateMemory,
  calculateConcentration,
  calculateMonthsScore,
  calculateDelayedRecall,
  calculateTotalCognitive,
  calculateMBESS,
  calculateMBESSFoam,
  calculateTandemGaitAverage,
  calculateTandemGaitFastest,
  calculateDualTaskFastest,
  isSymptomsAdministered,
  countSymptomsRated,
  isOrientationAdministered,
  isImmediateMemoryAdministered,
  isDigitsAdministered,
  isDelayedRecallAdministered,
} from './scat6-calculations'
import {
  drawText,
  drawTextCentered,
  drawCheckmark,
  drawFilledCircle,
  drawCircleOutline,
  drawWrappedText,
  drawYesNo,
  drawNotAdministered,
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

    // ========================================================================
    // "WAS THIS SECTION ADMINISTERED?" — clinical-record integrity gate
    // ========================================================================
    // Every scored field that can be skipped is nullable in the model, so
    // "never administered" is carried explicitly rather than guessed from
    // setup fields. Unadministered sections draw NO item circles and print a
    // dash in their score box; an administered section prints its real value
    // INCLUDING a genuine 0 (a true 0/5 orientation is a clinical finding and
    // must reach the record, not be suppressed as "not done").
    const symptomsAdministered = isSymptomsAdministered(formData.symptoms)
    const orientationAdministered = isOrientationAdministered(formData)
    const immediateMemoryAdministered = isImmediateMemoryAdministered(formData)
    const digitsAdministered = isDigitsAdministered(formData)
    const delayedRecallAdministered = isDelayedRecallAdministered(formData)

    // Concentration /5 aggregates digits + months; total cognitive /50
    // aggregates all four subtests. Both are null unless every contributor ran.
    const concentrationScore = calculateConcentration(formData)
    const cognitiveTotal = calculateTotalCognitive(formData)

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
    const symptomsRated = countSymptomsRated(formData.symptoms)
    const symptomScaleComplete = symptomsRated === 22

    /**
     * The form prints the denominators ("of 22" / "of 132"), so a partially
     * rated scale must say how much of it was actually rated — otherwise a
     * 9-item scale reads as a full 22-item scale with 13 symptoms denied.
     */
    const drawSymptomTotal = (x: number, y: number, value: number) => {
      if (!symptomsAdministered) {
        drawNotAdministered(p4, x, y, { font: fontBold, size: fsl })
        return
      }
      drawText(p4, x, y, value.toString(), { font: fontBold, size: fsl })
      if (!symptomScaleComplete) {
        drawText(p4, x + 14, y, `(${symptomsRated}/22 rated)`, { font, size: 6 })
      }
    }

    drawSymptomTotal(390, 503, symNum)

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

    // An unrated symptom leaves its whole row blank. Marking the "0" column by
    // default asserted that the athlete denied all 22 symptoms.
    symptomKeys.forEach((key, i) => {
      const value = formData.symptoms[key]
      if (value !== null && value >= 0 && value <= 6) {
        drawFilledCircle(p4, symptomColX[value], symptomYPositions[i], 3.5)
      }
    })

    // Bottom summary: Total number of symptoms (Text26: x=165.2, y=76) and
    // Symptom severity score (Text27: x=388.8, y=75.6)
    drawSymptomTotal(167, 78, symNum)
    drawSymptomTotal(390, 77, symSev)

    // Percent of normal (Text24: x=292.4, y=322.6, w=204.7, h=15.7 — the answer
    // box under "If 100% is feeling perfectly normal, what percent of normal do
    // you feel?"). Verified against SCAT6_Fillable.pdf widget geometry; the
    // legacy field map's `percentOfNormal: 'Text26'` is wrong — Text26 is the
    // bottom-of-page "total number of symptoms" box.
    drawText(p4, 295, 327, formData.percentOfNormal, { font, size: fs })

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
    if (orientationAdministered) {
      oriBooleans.forEach((val, i) => {
        if (val === null) return // item not asked — leave the row blank
        if (val) {
          drawFilledCircle(p5, 460, oriYPositions[i], 3.5) // "1" position (x=454.2+5.5)
        } else {
          drawFilledCircle(p5, 433, oriYPositions[i], 3.5) // "0" position (x=427.2+5.5)
        }
      })
      // Orientation Score (Text28: x=421.5, y=545.9)
      drawText(p5, 423, 547, calculateOrientation(formData).toString(), { font: fontBold, size: fsl })
    } else {
      // Never administered — leave every item circle blank and dash the score.
      drawNotAdministered(p5, 423, 547, { font: fontBold, size: fsl })
    }

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

    if (immediateMemoryAdministered) {
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
    } else {
      drawNotAdministered(p5, 192, 138, { font: fontBold, size: fs })
      drawNotAdministered(p5, 235, 138, { font: fontBold, size: fs })
      drawNotAdministered(p5, 278, 138, { font: fontBold, size: fs })
      drawNotAdministered(p5, 216, 113, { font: fontBold, size: fsl })
    }

    // Time completed (Text33: x=390.5, y=110)
    drawText(p5, 392, 112, formData.immediateMemoryTimeCompleted, { font, size: fs })

    // ==================== PAGE 6 (index 5): CONCENTRATION + BALANCE ====================
    const p6 = pages[5]

    // Digit List Used (A/B/C)
    if (formData.digitListUsed === 'A') drawCheckmark(p6, 140, 583, 10)
    if (formData.digitListUsed === 'B') drawCheckmark(p6, 181, 583, 10)
    if (formData.digitListUsed === 'C') drawCheckmark(p6, 221, 583, 10)

    // Digits Backward Score (Text34: x=427.3, y=389.6)
    if (digitsAdministered && formData.digitsBackward !== null) {
      drawText(p6, 429, 391, formData.digitsBackward.toString(), { font: fontBold, size: fsl })
    } else {
      drawNotAdministered(p6, 429, 391, { font: fontBold, size: fsl })
    }

    // Months in Reverse
    // Time (Text35: x=183.2, y=294.1, h=-14.1 → field box top=294, bottom=280, draw inside)
    drawText(p6, 185, 284, formData.monthsReverseTime, { font, size: fs })
    // Errors (Text35aa: x=362.2, y=282.1)
    // Months Score (Text36: x=117.8, y=249.8 — "Months Score: __ of 1")
    if (formData.monthsReverseErrors !== null) {
      drawText(p6, 364, 284, formData.monthsReverseErrors.toString(), { font, size: fs })
    } else {
      drawNotAdministered(p6, 364, 284, { font, size: fs })
    }
    // SCAT6: "1 point if no errors and completion under 30 seconds." Without a
    // recorded time the point cannot be decided, so it is dashed rather than
    // scored 0 — a fabricated 0 here also drags the /5 and the /50 down.
    const monthsScore = calculateMonthsScore(formData)
    if (monthsScore !== null) {
      drawText(p6, 122, 254, monthsScore.toString(), { font: fontBold, size: fsl })
    } else {
      drawNotAdministered(p6, 122, 254, { font: fontBold, size: fsl })
    }

    // Concentration Score, Digits + Months (Text37: x=214.7, y=223.5 — the
    // "Concentration Score (Digits + Months) __ of 5" box. Verified against
    // SCAT6_Fillable.pdf geometry + the flat PDF's own label positions; the
    // previous (448, 237) put the score in blank margin.)
    if (concentrationScore !== null) {
      drawText(p6, 217, 228, concentrationScore.toString(), { font: fontBold, size: fsl })
    } else {
      drawNotAdministered(p6, 217, 228, { font: fontBold, size: fsl })
    }

    // Foot Tested (Foot radio: Left x=128.7, Right x=177.7, y=138.1)
    if (formData.footTested === 'Left') drawFilledCircle(p6, 135, 144, 3.5)
    if (formData.footTested === 'Right') drawFilledCircle(p6, 184, 144, 3.5)

    // Testing Surface (Text38: x=201.1, y=116.8) & Footwear (Text39: x=226.8,
    // y=98.4). Previously the surface string was drawn at (216, 225) — which is
    // the Concentration Score box — so an exported record showed e.g.
    // "hard floor" as the concentration score. Footwear was never drawn at all.
    drawText(p6, 203, 121, formData.testingSurface, { font, size: fs })
    drawText(p6, 229, 103, formData.footwear, { font, size: fs })

    // NOTE: mBESS individual errors are on PAGE 7, not page 6

    // ==================== PAGE 7 (index 6): BALANCE + TANDEM + DUAL TASK ====================
    const p7 = pages[6]

    // mBESS Errors - Firm Surface (all on page 7)
    // Text40: x=135.7, y=669.7 (Double Leg)
    // Text41: x=135.7, y=651.1 (Tandem)
    // Text42: x=135.7, y=631.6 (Single Leg)
    // 0 errors of 10 = a PERFECT stance. Never assert it by default — each
    // stance prints only if that stance was actually scored.
    const firmStances: Array<[number, number | null]> = [
      [671, formData.mBessDoubleErrors],
      [653, formData.mBessTandemErrors],
      [633, formData.mBessSingleErrors],
    ]
    firmStances.forEach(([y, errors]) => {
      if (errors !== null) {
        drawText(p7, 137, y, errors.toString(), { font, size: fs })
      } else {
        drawNotAdministered(p7, 137, y, { font, size: fs })
      }
    })

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
    if (mBessTotal !== null) {
      drawText(p7, 137, 614, mBessTotal.toString(), { font: fontBold, size: fsl })
    } else {
      drawNotAdministered(p7, 137, 614, { font: fontBold, size: fsl })
    }

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
    // COLUMN ORDER (verified against the flat PDF's own header row: "Errors"
    // label at x=400.1, "Time" label at x=449.2, and the practice row's
    // "Errors" at x=413.5 / "Time" at x=458.1):
    //   Errors column -> Text53 x=395.7 y=206.6, Text54 x=395.7 y=185.1, Text54bb x=395.7 y=165.1
    //   Time   column -> Text55 x=429.2 y=205.7, Text56 x=429.7 y=185.2, Text57 x=429.4 y=165.2
    // These were previously SWAPPED — times printed in the errors column and
    // vice versa. Each value is drawn only when actually recorded, so a
    // never-run dual task leaves the row blank (0 errors is a real result and
    // still prints once the field holds 0 rather than null).
    if (formData.dualTask1Errors !== null) {
      drawText(p7, 397, 208, formData.dualTask1Errors.toString(), { font, size: fs })
    }
    if (formData.dualTask2Errors !== null) {
      drawText(p7, 397, 187, formData.dualTask2Errors.toString(), { font, size: fs })
    }
    if (formData.dualTask3Errors !== null) {
      drawText(p7, 397, 167, formData.dualTask3Errors.toString(), { font, size: fs })
    }
    if (formData.dualTask1Time) {
      drawText(p7, 431, 208, formData.dualTask1Time, { font, size: fs })
    }
    if (formData.dualTask2Time) {
      drawText(p7, 431, 187, formData.dualTask2Time, { font, size: fs })
    }
    if (formData.dualTask3Time) {
      drawText(p7, 431, 167, formData.dualTask3Time, { font, size: fs })
    }

    // Starting integer in alternate grid (Text58: x=67.3, y=112.4)
    if (formData.dualTaskAlternateStartingInteger) {
      drawText(p7, 69, 114, formData.dualTaskAlternateStartingInteger, { font, size: fs })
    }

    // Practice row — Errors (Text51: x=406.5, y=290.8), Time (Text52: x=448.3,
    // y=291.8). Practice errors were collected but never drawn, and the
    // practice time was being drawn into the errors box.
    if (formData.dualTaskPracticeErrors !== null) {
      drawText(p7, 409, 296, formData.dualTaskPracticeErrors.toString(), { font, size: fs })
    }
    if (formData.dualTaskPracticeTime) {
      drawText(p7, 451, 297, formData.dualTaskPracticeTime, { font, size: fs })
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

    // "Were any single- or dual-task, timed tandem gait trials not completed
    // due to walking errors or other reasons?" (widget centres: Yes 84.8, No
    // 133.5 at y=680; explanation box x=58.5-495.6, y=597.8-656.8).
    // This caveat was collected but NEVER drawn, so a record with abandoned
    // tandem/dual-task trials exported as if those times were clean, complete
    // trials. Only an affirmative Yes is marked — the form models the question
    // as a single checkbox, so "unticked" is not evidence of a No.
    if (formData.trialsNotCompleted) {
      drawFilledCircle(p8, 85, 680, 3.5)
      if (formData.trialsNotCompletedReason) {
        drawWrappedText(p8, 61, 645, formData.trialsNotCompletedReason, 430, { font, size: fsm })
      }
    }

    // Word List Used for Delayed Recall (A_3/B_3/C_3)
    if (formData.wordListUsed === 'A') drawCheckmark(p8, 140, 479, 10)
    if (formData.wordListUsed === 'B') drawCheckmark(p8, 181, 479, 10)
    if (formData.wordListUsed === 'C') drawCheckmark(p8, 221, 479, 10)

    // Delayed Recall — 10 words
    // DEL field positions from extraction: "0" at x=208.4, "1" at x=231.3
    // Y positions: 440.2, 421, 400.6, 381.4, 363.4, 344.2, 324.8, 306.6, 287.1, 268.9
    const delRecallYPositions = [446, 427, 407, 387, 369, 350, 331, 312, 293, 275]
    if (delayedRecallAdministered) {
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
    } else {
      drawNotAdministered(p8, 208, 248, { font: fontBold, size: fsl })
    }

    // Delayed Recall Start Time (Text83B: x=112.3, y=501.8 — note: this is the time administered field)
    drawText(p8, 114, 503, formData.delayedRecallStartTime, { font, size: fs })

    // Total Cognitive Score Summary (all on page 8, field positions from extraction)
    // Text28: x=129.9, y=191.7 — Orientation (of 5)
    // Text32: x=129.9, y=171.6 — Immediate Memory (of 30)
    // Text37: x=129.9, y=152.5 — Concentration (of 5)
    // Text84D: x=129.9, y=133.6 — Delayed Recall (of 10)
    // Text87: x=128.8, y=114.8 — Total (of 50)
    // Each row carries its own section's administered flag; the /50 total is
    // only printed when ALL FOUR contributors ran — a partial total silently
    // understates the athlete, which is worse than reporting nothing.
    const summary: Array<[number, number, number | null]> = [
      [131, 193, orientationAdministered ? calculateOrientation(formData) : null],
      [131, 173, immediateMemoryAdministered ? calculateImmediateMemory(formData) : null],
      [131, 154, concentrationScore],
      [131, 135, delayedRecallAdministered ? calculateDelayedRecall(formData) : null],
      [130, 116, cognitiveTotal],
    ]
    summary.forEach(([x, y, value]) => {
      if (value !== null) {
        drawText(p8, x, y, value.toString(), { font: fontBold, size: fsl })
      } else {
        drawNotAdministered(p8, x, y, { font: fontBold, size: fsl })
      }
    })

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

    // Serial-assessment columns.
    //
    // These numeric fields used to be typed `number` and default to 0, so the
    // old `dd.symptomNumber1?.toString() || ''` guard never fired ("0" is
    // truthy): an untouched form printed a full three-column follow-up table
    // of zeros — three assessments that never happened, each asserting 0
    // symptoms, 0/5 orientation, 0/30 memory and 0 balance errors.
    //
    // A column only exists if it has a DATE, and within a dated column each
    // cell prints only if it was actually filled in (they are nullable now), so
    // a genuine 0 in a real follow-up still appears while an untouched row of a
    // real follow-up stays blank instead of claiming 0.
    const decisionColumns = [
      {
        x: decColX[0],
        date: dd.date1,
        neurologicalExam: dd.neurologicalExam1,
        symptomNumber: dd.symptomNumber1,
        symptomSeverity: dd.symptomSeverity1,
        orientation: dd.orientation1,
        immediateMemory: dd.immediateMemory1,
        concentration: dd.concentration1,
        delayedRecall: dd.delayedRecall1,
        mBessTotal: dd.mBessTotal1,
        tandemGaitFastest: dd.tandemGaitFastest1,
        dualTaskFastest: dd.dualTaskFastest1,
      },
      {
        x: decColX[1],
        date: dd.date2,
        neurologicalExam: dd.neurologicalExam2,
        symptomNumber: dd.symptomNumber2,
        symptomSeverity: dd.symptomSeverity2,
        orientation: dd.orientation2,
        immediateMemory: dd.immediateMemory2,
        concentration: dd.concentration2,
        delayedRecall: dd.delayedRecall2,
        mBessTotal: dd.mBessTotal2,
        tandemGaitFastest: dd.tandemGaitFastest2,
        dualTaskFastest: dd.dualTaskFastest2,
      },
      {
        x: decColX[2],
        date: dd.date3,
        neurologicalExam: dd.neurologicalExam3,
        symptomNumber: dd.symptomNumber3,
        symptomSeverity: dd.symptomSeverity3,
        orientation: dd.orientation3,
        immediateMemory: dd.immediateMemory3,
        concentration: dd.concentration3,
        delayedRecall: dd.delayedRecall3,
        mBessTotal: dd.mBessTotal3,
        tandemGaitFastest: dd.tandemGaitFastest3,
        dualTaskFastest: dd.dualTaskFastest3,
      },
    ]

    decisionColumns.forEach(col => {
      if (!col.date || !col.date.trim()) return
      const cell = (y: number, value: number | null) => {
        if (value === null) return
        drawText(p9, col.x, y, value.toString(), { font, size: fsm })
      }
      drawText(p9, col.x, decRowY.neuroExam, col.neurologicalExam, { font, size: fsm })
      cell(decRowY.symptomNum, col.symptomNumber)
      cell(decRowY.symptomSev, col.symptomSeverity)
      cell(decRowY.orientation, col.orientation)
      cell(decRowY.immMemory, col.immediateMemory)
      cell(decRowY.concentration, col.concentration)
      cell(decRowY.delRecall, col.delayedRecall)
      cell(decRowY.mBess, col.mBessTotal)
      drawText(p9, col.x, decRowY.tandem, col.tandemGaitFastest, { font, size: fsm })
      drawText(p9, col.x, decRowY.dualTask, col.dualTaskFastest, { font, size: fsm })
    })

    // Concussion Diagnosed (field centers: Yes x=85 y=459, No x=133 y=458, Deferred x=201 y=459)
    if (formData.concussionDiagnosed === 'Yes') drawFilledCircle(p9, 85, 459, 3.5)
    else if (formData.concussionDiagnosed === 'No') drawFilledCircle(p9, 133, 458, 3.5)
    else if (formData.concussionDiagnosed === 'Deferred') drawFilledCircle(p9, 201, 459, 3.5)

    // HCP Attestation
    drawText(p9, 90, 387, formData.hcpName, { font, size: fs })
    // Signature (Signature72 widget: x=98.8, y=363.9, w=180.5, h=18.3) — the
    // required-with-asterisk attestation signature. Collected since launch but
    // never drawn, so every exported SCAT6 was an UNSIGNED attestation.
    drawText(p9, 101, 369, formData.hcpSignature, { font, size: fs })
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
