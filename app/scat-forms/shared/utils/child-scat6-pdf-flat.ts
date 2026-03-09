import { ChildSCAT6FormData } from '../types/child-scat6.types'
import {
  calculateChildSymptomNumber,
  calculateChildSymptomSeverity,
  calculateParentSymptomNumber,
  calculateParentSymptomSeverity,
  calculateOrientation,
  calculateImmediateMemory,
  calculateConcentration,
  calculateDelayedRecall,
  calculateTotalCognitive,
  calculateMBESS,
  calculateMBESSFoam,
  calculateTandemGaitAverage,
  calculateTandemGaitFastest,
  calculateComplexTandemForward,
  calculateComplexTandemBackward,
  calculateComplexTandemTotal,
  calculateDualTaskFastest,
} from './child-scat6-calculations'
import {
  drawText,
  drawTextCentered,
  drawCheckmark,
  drawFilledCircle,
  drawWrappedText,
  drawYesNo,
  embedStandardFonts,
  loadFlatPDF,
  savePDFAndDownload,
  BLACK,
} from './pdf-draw-helpers'
import type { PDFFont, PDFPage } from 'pdf-lib'

/**
 * Child SCAT6 Flat PDF Export — draws values at precise coordinates.
 *
 * Page dimensions: 595.28 x 793.70 pts.
 * 12 pages total. Pages 1, 11, 12 are editorial (no data).
 */
export async function exportChildSCAT6ToFlatPDF(
  formData: ChildSCAT6FormData,
  filename: string = 'Child_SCAT6_Filled.pdf'
) {
  try {
    const pdfDoc = await loadFlatPDF('/docs/Child_SCAT6_Flat.pdf')
    const { font, fontBold } = await embedStandardFonts(pdfDoc)
    const pages = pdfDoc.getPages()

    const fs = 9    // default font size
    const fsm = 8   // small
    const fsl = 10  // large
    const H = 793.70 // page height

    // ==================== PAGE 2 (index 1): DEMOGRAPHICS + CONCUSSION HISTORY ====================
    const p2 = pages[1]

    drawText(p2, 128, H - 130, formData.athleteName, { font, size: fs })
    drawText(p2, 407, H - 130, formData.idNumber, { font, size: fs })
    drawText(p2, 128, H - 150, formData.dateOfBirth, { font, size: fs })
    drawText(p2, 284, H - 150, formData.dateOfExamination, { font, size: fs })
    drawText(p2, 420, H - 150, formData.dateOfInjury, { font, size: fs })
    drawText(p2, 128, H - 170, formData.timeOfInjury, { font, size: fs })
    drawText(p2, 438, H - 170, formData.dominantHand, { font, size: fs })
    drawText(p2, 376, H - 188, formData.sportTeamSchool, { font, size: fs })
    drawText(p2, 207, H - 206, formData.currentYear, { font, size: fs })
    drawText(p2, 437, H - 206, formData.yearsEducation, { font, size: fs })
    drawText(p2, 128, H - 224, formData.firstLanguage, { font, size: fs })
    drawText(p2, 377, H - 224, formData.preferredLanguage, { font, size: fs })
    drawText(p2, 109, H - 242, formData.examiner, { font, size: fs })

    // Sex
    if (formData.sex === 'Male') drawFilledCircle(p2, 150, H - 188, 3.5)
    else if (formData.sex === 'Female') drawFilledCircle(p2, 192, H - 188, 3.5)
    else if (formData.sex) drawFilledCircle(p2, 265, H - 188, 3.5)

    // Concussion History
    drawText(p2, 316, H - 290, formData.previousConcussions, { font, size: fs })
    drawText(p2, 219, H - 310, formData.mostRecentConcussion, { font, size: fs })
    drawText(p2, 143, H - 330, formData.primarySymptoms, { font, size: fs })
    drawText(p2, 409, H - 350, formData.recoveryTime, { font, size: fs })

    // ==================== PAGE 3 (index 2): OBSERVABLE SIGNS + GCS ====================
    // Page 3 contains Red Flags, Observable Signs, GCS, Cervical Spine, Coordination
    // Most of these are clinical observation fields — structural data not in our form model

    // ==================== PAGE 4 (index 3): ATHLETE BACKGROUND + CHILD SYMPTOMS ====================
    const p4 = pages[3]

    // Athlete Background Y/N
    drawYesNo(p4, 237, 253, H - 160, formData.hospitalizedForHeadInjury, font, fs)
    drawYesNo(p4, 237, 253, H - 180, formData.headacheDisorder, font, fs)
    drawYesNo(p4, 237, 253, H - 200, formData.learningDisability, font, fs)
    drawYesNo(p4, 467, 483, H - 160, formData.adhd, font, fs)
    drawYesNo(p4, 467, 483, H - 180, formData.psychologicalDisorder, font, fs)

    // Notes and Medications
    drawWrappedText(p4, 63, H - 230, formData.athleteBackgroundNotes, 200, { font, size: fsm })
    drawWrappedText(p4, 293, H - 230, formData.currentMedications, 200, { font, size: fsm })

    // Child Symptom Report (21 items, 0-3 scale)
    // Columns: 0 ("Not at all"), 1 ("A little bit"), 2 ("Somewhat"), 3 ("A lot")
    const childSymptomColX = [310, 360, 410, 460] // x positions for 0, 1, 2, 3
    const childSymptomStartY = H - 310
    const childSymptomRowH = 16

    const childSymptomKeys: (keyof ChildSCAT6FormData['childSymptoms'])[] = [
      'headache', 'pressureInHead', 'neckPain', 'feelingSickOrNausea', 'dizziness',
      'blurredVision', 'balanceProblems', 'sensitivityLight', 'sensitivityNoise',
      'feelingSlowedDown', 'feelingInFog', 'dontFeelRight', 'difficultyConcentrating',
      'difficultyRemembering', 'tiredOrLowEnergy', 'confused', 'drowsy',
      'moreEmotional', 'irritable', 'sad', 'nervousOrAnxious',
    ]

    childSymptomKeys.forEach((key, i) => {
      const value = formData.childSymptoms[key]
      const y = childSymptomStartY - (i * childSymptomRowH)
      if (value >= 0 && value <= 3) {
        drawFilledCircle(p4, childSymptomColX[value], y + 4, 3.5)
      }
    })

    // Child Symptom Totals
    drawText(p4, 420, H - 660, calculateChildSymptomNumber(formData.childSymptoms).toString(), { font: fontBold, size: fsl })
    drawText(p4, 420, H - 680, calculateChildSymptomSeverity(formData.childSymptoms).toString(), { font: fontBold, size: fsl })

    // ==================== PAGE 5 (index 4): CHILD OVERALL + PARENT SYMPTOMS ====================
    const p5 = pages[4]

    // Child overall rating (0-10)
    if (formData.childOverallRating >= 0) {
      drawText(p5, 400, H - 120, formData.childOverallRating.toString(), { font: fontBold, size: fsl })
    }

    // Parent Report (21 items, 0-3 scale)
    const parentSymptomStartY = H - 180
    const parentSymptomRowH = 16

    const parentSymptomKeys: (keyof ChildSCAT6FormData['parentSymptoms'])[] = [
      'headache', 'pressureInHead', 'neckPain', 'sickOrNausea', 'dizziness',
      'blurredVision', 'balanceProblems', 'sensitivityLight', 'sensitivityNoise',
      'feelingSlowedDown', 'feelingInFog', 'doesntFeelRight', 'difficultyConcentrating',
      'difficultyRemembering', 'tiredOrLowEnergy', 'confused', 'drowsy',
      'moreEmotional', 'irritable', 'sad', 'nervousOrAnxious',
    ]

    parentSymptomKeys.forEach((key, i) => {
      const value = formData.parentSymptoms[key]
      const y = parentSymptomStartY - (i * parentSymptomRowH)
      if (value >= 0 && value <= 3) {
        drawFilledCircle(p5, childSymptomColX[value], y + 4, 3.5)
      }
    })

    // Parent Symptom Totals
    drawText(p5, 420, H - 530, calculateParentSymptomNumber(formData.parentSymptoms).toString(), { font: fontBold, size: fsl })
    drawText(p5, 420, H - 550, calculateParentSymptomSeverity(formData.parentSymptoms).toString(), { font: fontBold, size: fsl })

    // Parent overall rating
    drawText(p5, 400, H - 580, formData.parentOverallRating.toString(), { font: fontBold, size: fsl })

    // Worse with physical/mental
    drawYesNo(p5, 400, 440, H - 620, formData.symptomsWorseWithPhysical, font, fs)
    drawYesNo(p5, 400, 440, H - 640, formData.symptomsWorseWithMental, font, fs)

    // ==================== PAGE 6 (index 5): IMMEDIATE MEMORY + CONCENTRATION ====================
    const p6 = pages[5]

    // Orientation
    const oriYPositions = [H - 130, H - 150, H - 170, H - 190, H - 210]
    const oriBooleans = [
      formData.orientationMonth,
      formData.orientationDate,
      formData.orientationDayOfWeek,
      formData.orientationYear,
      formData.orientationTime,
    ]
    oriBooleans.forEach((val, i) => {
      if (val) {
        drawFilledCircle(p6, 459, oriYPositions[i] + 4, 3.5)
      } else {
        drawFilledCircle(p6, 432, oriYPositions[i] + 4, 3.5)
      }
    })

    // Orientation Score
    drawText(p6, 430, H - 240, calculateOrientation(formData).toString(), { font: fontBold, size: fsl })

    // Word List Used
    if (formData.wordListUsed === 'A') drawCheckmark(p6, 140, H - 270, 10)
    if (formData.wordListUsed === 'B') drawCheckmark(p6, 181, H - 270, 10)
    if (formData.wordListUsed === 'C') drawCheckmark(p6, 221, H - 270, 10)

    // Immediate Memory — 3 trials x 10 words
    const imTrialXPositions = [200, 250, 300]
    const imWordStartY = H - 310
    const imWordRowH = 22

    const trials = [
      formData.immediateMemoryTrial1,
      formData.immediateMemoryTrial2,
      formData.immediateMemoryTrial3,
    ]

    trials.forEach((trial, t) => {
      trial.forEach((correct, w) => {
        const y = imWordStartY - (w * imWordRowH)
        if (correct) {
          drawCheckmark(p6, imTrialXPositions[t], y, 8)
        }
      })
    })

    // Trial totals
    const trial1Total = formData.immediateMemoryTrial1.filter(Boolean).length
    const trial2Total = formData.immediateMemoryTrial2.filter(Boolean).length
    const trial3Total = formData.immediateMemoryTrial3.filter(Boolean).length
    drawText(p6, 200, H - 540, trial1Total.toString(), { font: fontBold, size: fs })
    drawText(p6, 250, H - 540, trial2Total.toString(), { font: fontBold, size: fs })
    drawText(p6, 300, H - 540, trial3Total.toString(), { font: fontBold, size: fs })

    // Immediate Memory Score
    drawText(p6, 400, H - 560, calculateImmediateMemory(formData).toString(), { font: fontBold, size: fsl })
    drawText(p6, 300, H - 560, formData.immediateMemoryTimeCompleted, { font, size: fs })

    // Digits Backward
    if (formData.digitListUsed === 'A') drawCheckmark(p6, 140, H - 600, 10)
    if (formData.digitListUsed === 'B') drawCheckmark(p6, 181, H - 600, 10)
    if (formData.digitListUsed === 'C') drawCheckmark(p6, 221, H - 600, 10)

    drawText(p6, 430, H - 680, formData.digitsBackward.toString(), { font: fontBold, size: fsl })

    // ==================== PAGE 7 (index 6): MONTHS REVERSE + BALANCE + TANDEM ====================
    const p7 = pages[6]

    // Months in Reverse
    drawText(p7, 300, H - 130, formData.monthsReverseTime, { font, size: fs })
    drawText(p7, 430, H - 130, formData.monthsReverseErrors.toString(), { font, size: fs })

    // Concentration Score
    drawText(p7, 430, H - 160, calculateConcentration(formData).toString(), { font: fontBold, size: fsl })

    // mBESS
    if (formData.footTested === 'Left') drawFilledCircle(p7, 200, H - 220, 3.5)
    if (formData.footTested === 'Right') drawFilledCircle(p7, 260, H - 220, 3.5)

    drawText(p7, 400, H - 260, formData.mBessDoubleErrors.toString(), { font, size: fs })
    drawText(p7, 400, H - 280, formData.mBessTandemErrors.toString(), { font, size: fs })
    drawText(p7, 400, H - 300, formData.mBessSingleErrors.toString(), { font, size: fs })
    drawText(p7, 400, H - 320, calculateMBESS(formData).toString(), { font: fontBold, size: fs })

    if (formData.mBessFoamDoubleErrors !== null) {
      drawText(p7, 490, H - 260, (formData.mBessFoamDoubleErrors ?? '').toString(), { font, size: fs })
    }
    if (formData.mBessFoamTandemErrors !== null) {
      drawText(p7, 490, H - 280, (formData.mBessFoamTandemErrors ?? '').toString(), { font, size: fs })
    }
    if (formData.mBessFoamSingleErrors !== null) {
      drawText(p7, 490, H - 300, (formData.mBessFoamSingleErrors ?? '').toString(), { font, size: fs })
    }
    const foamTotal = calculateMBESSFoam(formData)
    if (foamTotal !== null) {
      drawText(p7, 490, H - 320, foamTotal.toString(), { font: fontBold, size: fs })
    }

    // Tandem Gait
    drawText(p7, 150, H - 420, formData.tandemGaitTrial1, { font, size: fs })
    drawText(p7, 240, H - 420, formData.tandemGaitTrial2, { font, size: fs })
    drawText(p7, 330, H - 420, formData.tandemGaitTrial3, { font, size: fs })
    drawText(p7, 420, H - 420, calculateTandemGaitAverage(formData), { font, size: fs })
    drawText(p7, 490, H - 420, calculateTandemGaitFastest(formData), { font: fontBold, size: fs })

    // ==================== PAGE 8 (index 7): COMPLEX TANDEM + DUAL TASK ====================
    const p8 = pages[7]

    // Complex Tandem Gait
    drawText(p8, 350, H - 160, formData.complexTandemForwardEyesOpen.toString(), { font, size: fs })
    drawText(p8, 430, H - 160, formData.complexTandemForwardEyesClosed.toString(), { font, size: fs })
    drawText(p8, 490, H - 160, calculateComplexTandemForward(formData).toString(), { font: fontBold, size: fs })

    drawText(p8, 350, H - 200, formData.complexTandemBackwardEyesOpen.toString(), { font, size: fs })
    drawText(p8, 430, H - 200, formData.complexTandemBackwardEyesClosed.toString(), { font, size: fs })
    drawText(p8, 490, H - 200, calculateComplexTandemBackward(formData).toString(), { font: fontBold, size: fs })

    drawText(p8, 490, H - 240, calculateComplexTandemTotal(formData).toString(), { font: fontBold, size: fsl })

    // Dual Task Gait
    if (formData.dualTaskPracticeTime) {
      drawText(p8, 350, H - 340, formData.dualTaskPracticeTime, { font, size: fs })
    }
    if (formData.dualTask1Time) {
      drawText(p8, 420, H - 380, formData.dualTask1Time, { font, size: fs })
    }
    if (formData.dualTask2Time) {
      drawText(p8, 420, H - 400, formData.dualTask2Time, { font, size: fs })
    }
    if (formData.dualTask3Time) {
      drawText(p8, 420, H - 420, formData.dualTask3Time, { font, size: fs })
    }

    if (formData.dualTask1Errors !== null) {
      drawText(p8, 380, H - 380, (formData.dualTask1Errors ?? '').toString(), { font, size: fs })
    }
    if (formData.dualTask2Errors !== null) {
      drawText(p8, 380, H - 400, (formData.dualTask2Errors ?? '').toString(), { font, size: fs })
    }
    if (formData.dualTask3Errors !== null) {
      drawText(p8, 380, H - 420, (formData.dualTask3Errors ?? '').toString(), { font, size: fs })
    }

    if (formData.dualTaskAlternateStartingInteger) {
      drawText(p8, 350, H - 460, formData.dualTaskAlternateStartingInteger, { font, size: fs })
    }

    const dtFastest = calculateDualTaskFastest(formData)
    if (dtFastest) {
      drawText(p8, 200, H - 480, dtFastest, { font: fontBold, size: fs })
    }

    // ==================== PAGE 9 (index 8): DELAYED RECALL + DECISION + DISPOSITION ====================
    const p9 = pages[8]

    // Word List Used for Delayed Recall
    if (formData.wordListUsed === 'A') drawCheckmark(p9, 140, H - 130, 10)
    if (formData.wordListUsed === 'B') drawCheckmark(p9, 181, H - 130, 10)
    if (formData.wordListUsed === 'C') drawCheckmark(p9, 221, H - 130, 10)

    // Delayed Recall — 10 words
    const drStartY = H - 170
    const drRowH = 22
    formData.delayedRecall.forEach((correct, i) => {
      const y = drStartY - (i * drRowH)
      if (correct) {
        drawCheckmark(p9, 350, y, 8)
      }
    })

    // Delayed Recall Score
    drawText(p9, 400, H - 400, calculateDelayedRecall(formData).toString(), { font: fontBold, size: fsl })

    // Delayed Recall Start Time
    drawText(p9, 300, H - 400, formData.delayedRecallStartTime, { font, size: fs })

    // Cognitive Score Summary
    drawText(p9, 200, H - 440, `Orientation: ${calculateOrientation(formData)}/5`, { font, size: fsm })
    drawText(p9, 200, H - 455, `Immediate Memory: ${calculateImmediateMemory(formData)}/30`, { font, size: fsm })
    drawText(p9, 200, H - 470, `Concentration: ${calculateConcentration(formData)}/5`, { font, size: fsm })
    drawText(p9, 200, H - 485, `Delayed Recall: ${calculateDelayedRecall(formData)}/10`, { font, size: fsm })
    drawText(p9, 200, H - 505, `Total Cognitive: ${calculateTotalCognitive(formData)}/50`, { font: fontBold, size: fs })

    // Concussion Diagnosed
    if (formData.concussionDiagnosed === 'Yes') drawFilledCircle(p9, 200, H - 560, 3.5)
    else if (formData.concussionDiagnosed === 'No') drawFilledCircle(p9, 260, H - 560, 3.5)
    else if (formData.concussionDiagnosed === 'Deferred') drawFilledCircle(p9, 340, H - 560, 3.5)

    // ==================== PAGE 10 (index 9): HCP + CLINICAL NOTES ====================
    const p10 = pages[9]

    drawText(p10, 200, H - 160, formData.hcpName, { font, size: fs })
    drawText(p10, 200, H - 180, formData.hcpTitle, { font, size: fs })
    drawText(p10, 200, H - 200, formData.hcpRegistration, { font, size: fs })
    drawText(p10, 200, H - 220, formData.hcpDate, { font, size: fs })

    // Additional Clinical Notes
    if (formData.additionalClinicalNotes) {
      drawWrappedText(p10, 65, H - 300, formData.additionalClinicalNotes, 470, { font, size: fsm })
    }

    // Pages 11-12 (index 10-11) are editorial — no data

    // Save and download
    await savePDFAndDownload(pdfDoc, filename)
  } catch (error) {
    console.error('Child SCAT6 flat PDF export failed:', error)
    alert(`PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    throw error
  }
}
