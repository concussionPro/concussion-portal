import {
  ChildSCAT6FormData,
  ChildSCAT6SymptomScores,
  CHILD_SCAT6_SYMPTOM_KEYS,
  CHILD_SCAT6_SYMPTOM_COUNT,
} from '../types/child-scat6.types'
import {
  calculateSymptomNumber,
  calculateSymptomSeverity,
  countSymptomsRated,
  isSymptomScaleComplete,
  isImmediateMemoryAdministered,
  isDelayedRecallAdministered,
  calculateImmediateMemory,
  calculateDaysReverse,
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
  drawCircleOutline,
  drawWrappedText,
  notAdministeredMark,
  embedStandardFonts,
  loadFlatPDF,
  savePDFAndDownload,
} from './pdf-draw-helpers'
import type { PDFFont, PDFPage } from 'pdf-lib'

/**
 * Child SCAT6 Flat PDF Export — draws values at precise coordinates.
 *
 * Page dimensions: 595.28 x 793.70 pts. 12 pages; pages 1, 3, 11, 12 carry no
 * data we model.
 *
 * COORDINATES: there is no Child_SCAT6_Fillable.pdf to read AcroForm widget
 * geometry from, so every coordinate below was measured off the shipped
 * public/docs/Child_SCAT6_Flat.pdf by locating the pale-blue answer boxes in a
 * 288 dpi render and converting to PDF points (bottom-left origin). They are
 * measured, not estimated — but they are measured from the artwork, so a
 * printed export should still be eyeballed after any template change.
 *
 * NOT-ADMINISTERED RULE: every scored field in the form model is nullable and
 * defaults to null. A null prints a dash in its score box and NO item marks —
 * it must never print as 0. "0 errors of 30" is a perfect balance result and
 * "0 of 21 symptoms" is an asymptomatic child; neither may be asserted by a
 * form nobody filled in. A partially rated symptom scale prints its running
 * total WITH the number of items actually rated, because the "of 21" / "of 63"
 * denominators are pre-printed on the page.
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
    const fsx = 6   // extra small (qualifiers inside narrow boxes)

    const na = notAdministeredMark(font)

    /** Draw a score into a box, or the not-administered dash when it is null. */
    const drawScoreBox = (
      page: PDFPage,
      x: number,
      width: number,
      baseline: number,
      value: number | string | null,
      options: { font?: PDFFont; size?: number } = {}
    ) => {
      const text = value === null || value === '' ? na : String(value)
      drawTextCentered(page, x, baseline, width, text, { font: options.font ?? font, size: options.size ?? fs })
    }

    /**
     * Text for a symptom total box. The denominators ("of 21" / "of 63") are
     * printed on the form, so a partial scale must say how much of it was
     * actually rated rather than quietly under-report against a full scale.
     */
    const symptomBoxText = (scores: ChildSCAT6SymptomScores, value: number | null): string => {
      if (value === null) return na
      if (isSymptomScaleComplete(scores)) return String(value)
      return `${value} (${countSymptomsRated(scores)}/${CHILD_SCAT6_SYMPTOM_COUNT} rated)`
    }

    const drawSymptomTotal = (
      page: PDFPage,
      x: number,
      width: number,
      baseline: number,
      scores: ChildSCAT6SymptomScores,
      value: number | null
    ) => {
      // A complete (or entirely unrated) scale gets the normal score-box
      // treatment; a partial one is set small so the "(n/21 rated)" qualifier
      // fits inside the box next to the pre-printed denominator.
      const full = value === null || isSymptomScaleComplete(scores)
      drawTextCentered(page, x, baseline, width, symptomBoxText(scores, value), {
        font: full ? fontBold : font,
        size: full ? fsl : fsx,
      })
    }

    /**
     * Ring the printed "Y" or "N". null (never asked) rings neither — the
     * Child SCAT6 prints letters rather than tick boxes here, so a filled mark
     * would obscure the very letter it is answering.
     */
    const ringYesNo = (
      page: PDFPage,
      yesX: number,
      noX: number,
      centreY: number,
      value: boolean | null
    ) => {
      if (value === null) return
      drawCircleOutline(page, value ? yesX : noX, centreY, 6)
    }

    /** Ring the chosen 0/1/2/3 column of a symptom row (the digits are pre-printed). */
    const drawSymptomScale = (
      page: PDFPage,
      scores: ChildSCAT6SymptomScores,
      firstRowBottom: number,
      rowHeight: number,
      colCentres: number[]
    ) => {
      CHILD_SCAT6_SYMPTOM_KEYS.forEach((key, i) => {
        const value = scores[key]
        if (value === null || value < 0 || value > 3) return
        const cy = firstRowBottom - rowHeight * i + 5.5
        drawCircleOutline(page, colCentres[value], cy, 5.5)
      })
    }

    // ==================== PAGE 2 (index 1): DEMOGRAPHICS + CONCUSSION HISTORY ====================
    const p2 = pages[1]

    drawText(p2, 116, 668, formData.athleteName, { font, size: fs })
    drawText(p2, 100, 649, formData.idNumber, { font, size: fs })
    drawText(p2, 335, 649, formData.dateOfBirth, { font, size: fs })
    drawText(p2, 133, 630.5, formData.dateOfExamination, { font, size: fs })
    drawText(p2, 263.5, 630.5, formData.dateOfInjury, { font, size: fs })
    drawText(p2, 410.5, 630.5, formData.timeOfInjury, { font, size: fs })

    // Sex / dominant hand tick boxes
    if (formData.sex === 'Male') drawCheckmark(p2, 98.5, 610.7, 8)
    else if (formData.sex === 'Female') drawCheckmark(p2, 152.5, 610.7, 8)
    else if (formData.sex === 'Prefer Not To Say') drawCheckmark(p2, 244.5, 610.7, 8)

    if (formData.dominantHand === 'Left') drawCheckmark(p2, 358.5, 610.7, 8)
    else if (formData.dominantHand === 'Right') drawCheckmark(p2, 400, 610.7, 8)
    else if (formData.dominantHand === 'Ambidextrous') drawCheckmark(p2, 472, 610.7, 8)

    drawText(p2, 130.5, 592.5, formData.sportTeamSchool, { font, size: fs })
    drawText(p2, 416.5, 592.5, formData.currentYear, { font, size: fs })
    drawText(p2, 116, 573.5, formData.firstLanguage, { font, size: fs })
    drawText(p2, 362.5, 573.5, formData.preferredLanguage, { font, size: fs })
    drawText(p2, 96.5, 555, formData.examiner, { font, size: fs })

    // Concussion History
    drawText(p2, 302.5, 508, formData.previousConcussions, { font, size: fs })
    drawText(p2, 207, 489, formData.mostRecentConcussion, { font, size: fs })
    drawText(p2, 132.5, 470, formData.primarySymptoms, { font, size: fs })
    drawText(p2, 394.5, 451.5, formData.recoveryTime, { font, size: fs })

    // ==================== PAGE 3 (index 2): IMMEDIATE ASSESSMENT / NEURO SCREEN ====================
    // Red flags, observable signs, GCS and cervical spine are clinician
    // observations this form model does not capture. Left blank deliberately —
    // a blank is honest, an unconditional "No" would not be.

    // ==================== PAGE 4 (index 3): CHILD BACKGROUND + CHILD SYMPTOM REPORT ====================
    const p4 = pages[3]

    // "Has the child ever been..." Y/N — null (never asked) leaves both blank.
    ringYesNo(p4, 231.5, 245.5, 644.5, formData.hospitalizedForHeadInjury)
    ringYesNo(p4, 231.5, 245.5, 623.7, formData.headacheDisorder)
    ringYesNo(p4, 231.5, 245.5, 605, formData.learningDisability)
    ringYesNo(p4, 458, 472, 644.5, formData.adhd)
    ringYesNo(p4, 458, 472, 623.7, formData.psychologicalDisorder)

    // Notes and Medications
    drawWrappedText(p4, 55, 571.7, formData.athleteBackgroundNotes, 198, { font, size: fsm })
    drawWrappedText(p4, 283, 572.7, formData.currentMedications, 197, { font, size: fsm })

    // Child Symptom Report — 21 rows, columns 0 / 1 / 2 / 3
    const childSymptomColX = [256.5, 321, 386, 451]
    drawSymptomScale(p4, formData.childSymptoms, 386.7, 13, childSymptomColX)

    // "Do the symptoms get worse with...?" (child page)
    ringYesNo(p4, 234.5, 251, 108.7, formData.childSymptomsWorseWithPhysical)
    ringYesNo(p4, 234.5, 251, 94.2, formData.childSymptomsWorseWithMental)

    // ==================== PAGE 5 (index 4): CHILD OVERALL + PARENT REPORT ====================
    const p5 = pages[4]

    // "On a scale of 0 to 10 (where 10 is normal), how do you feel now?"
    // 0 is the WORST possible answer, so an unrecorded rating must not print as
    // 0 — ring the digit only when the child actually gave one.
    // The 0-10 digits are NOT evenly spaced on the artwork (and "10" is two
    // glyphs), so each centre is measured off the template rather than derived
    // from a stride.
    const childRatingX = [292.5, 308.4, 324.6, 340.8, 356.9, 373.2, 389.2, 405.4, 421.6, 437.7, 456.1]
    if (formData.childOverallRating !== null) {
      const rating = Math.max(0, Math.min(10, Math.round(formData.childOverallRating)))
      drawCircleOutline(p5, childRatingX[rating], 664.5, 6)
    }

    // Child Report totals (of 21 / of 63)
    const childNumber = calculateSymptomNumber(formData.childSymptoms)
    const childSeverity = calculateSymptomSeverity(formData.childSymptoms)
    drawSymptomTotal(p5, 210.5, 45, 585.5, formData.childSymptoms, childNumber)
    drawSymptomTotal(p5, 414, 45, 585.5, formData.childSymptoms, childSeverity)

    // Parent Report — same 21 items, parent wording
    const parentSymptomColX = [256, 320.5, 385.5, 450]
    drawSymptomScale(p5, formData.parentSymptoms, 500.7, 13.05, parentSymptomColX)

    ringYesNo(p5, 234.5, 251, 223, formData.parentSymptomsWorseWithPhysical)
    ringYesNo(p5, 234.5, 251, 208.5, formData.parentSymptomsWorseWithMental)

    // "On a scale of 0 to 100% (where 100% is normal)" — a PERCENTAGE, not /10.
    if (formData.parentOverallPercent !== null) {
      drawText(p5, 335.5, 159, `${Math.max(0, Math.min(100, formData.parentOverallPercent))}%`, {
        font: fontBold,
        size: fs,
      })
    }

    // Parent Report totals (of 21 / of 63)
    const parentNumber = calculateSymptomNumber(formData.parentSymptoms)
    const parentSeverity = calculateSymptomSeverity(formData.parentSymptoms)
    drawSymptomTotal(p5, 213, 44.5, 87, formData.parentSymptoms, parentNumber)
    drawSymptomTotal(p5, 414, 45, 86.5, formData.parentSymptoms, parentSeverity)

    // ==================== PAGE 6 (index 5): IMMEDIATE MEMORY + DIGITS BACKWARD ====================
    // The Child SCAT6 has NO orientation subtest — nothing is drawn for one.
    const p6 = pages[5]

    const wordListBoxX: Record<string, number> = { A: 133, B: 173.5, C: 213.5 }
    if (formData.wordListUsed) drawCheckmark(p6, wordListBoxX[formData.wordListUsed], 592.2, 8)

    const memoryAdministered = isImmediateMemoryAdministered(formData)
    const trials = [
      formData.immediateMemoryTrial1,
      formData.immediateMemoryTrial2,
      formData.immediateMemoryTrial3,
    ]
    // Each trial cell prints "0   1"; ring the score given for that word.
    // Offsets to the printed digits within the cell, measured off the template
    // (the "1" sits 31.5pt in, not 30 — at 30 the ring clips the glyph).
    const trialCellX = [181, 223.5, 266.5]
    const trialCellW = 41
    const trialDigitDx = { incorrect: 9.6, correct: 31.5 }

    if (memoryAdministered) {
      trials.forEach((trial, t) => {
        trial.forEach((correct, w) => {
          const cy = 559.2 - 14.444 * w + 5.5
          drawCircleOutline(p6, trialCellX[t] + (correct ? trialDigitDx.correct : trialDigitDx.incorrect), cy, 5)
        })
      })

      trials.forEach((trial, t) => {
        drawTextCentered(p6, trialCellX[t], 417.5, trialCellW, trial.filter(Boolean).length.toString(), {
          font: fontBold,
          size: fs,
        })
      })
    } else {
      trials.forEach((_, t) => {
        drawTextCentered(p6, trialCellX[t], 417.5, trialCellW, na, { font: fontBold, size: fs })
      })
    }

    drawText(p6, 190, 398.5, formData.immediateMemoryTimeCompleted, { font, size: fs })
    drawScoreBox(p6, 204.5, 49, 372, calculateImmediateMemory(formData), { font: fontBold, size: fsl })

    // Digits Backward — score of 5 on the Child SCAT6 (levels of 2,3,4,5,6 digits)
    if (formData.digitListUsed) drawCheckmark(p6, wordListBoxX[formData.digitListUsed], 275.2, 8)
    drawScoreBox(p6, 415.5, 66, 87.5, formData.digitsBackward, { font: fontBold, size: fsl })

    // ==================== PAGE 7 (index 6): DAYS IN REVERSE + BALANCE + TANDEM GAIT ====================
    const p7 = pages[6]

    // DAYS of the week in reverse (the adult SCAT6 uses months; the child form does not)
    drawText(p7, 178, 613, formData.daysReverseTime, { font, size: fs })
    drawScoreBox(p7, 351.5, 132, 613, formData.daysReverseErrors, { font, size: fs })
    drawScoreBox(p7, 111, 40.5, 583, calculateDaysReverse(formData), { font: fontBold, size: fs })

    // Concentration Score (Digits + Days) — of 6, and only once BOTH halves exist
    drawScoreBox(p7, 203, 49.5, 557, calculateConcentration(formData), { font: fontBold, size: fsl })

    // mBESS setup
    if (formData.footTested === 'Left') drawCheckmark(p7, 122, 466.2, 8)
    if (formData.footTested === 'Right') drawCheckmark(p7, 170, 466.2, 8)
    drawText(p7, 195, 448, formData.testingSurface, { font, size: fsm })
    drawText(p7, 222, 429.5, formData.footwear, { font, size: fsm })

    // mBESS firm surface — 0 errors of 30 is a PERFECT result, never a default.
    drawScoreBox(p7, 128.5, 39.5, 364.7, formData.mBessDoubleErrors, { font, size: fs })
    drawScoreBox(p7, 128.5, 39.5, 345.7, formData.mBessTandemErrors, { font, size: fs })
    drawScoreBox(p7, 128.5, 39.5, 326.7, formData.mBessSingleErrors, { font, size: fs })
    drawScoreBox(p7, 128.5, 39.5, 308.2, calculateMBESS(formData), { font: fontBold, size: fs })

    // mBESS on foam is OPTIONAL — an unperformed optional section stays blank
    // rather than being marked "not administered".
    if (formData.mBessFoamDoubleErrors !== null) {
      drawTextCentered(p7, 363.5, 364.7, 38.5, formData.mBessFoamDoubleErrors.toString(), { font, size: fs })
    }
    if (formData.mBessFoamTandemErrors !== null) {
      drawTextCentered(p7, 363.5, 345.7, 38.5, formData.mBessFoamTandemErrors.toString(), { font, size: fs })
    }
    if (formData.mBessFoamSingleErrors !== null) {
      drawTextCentered(p7, 363.5, 326.7, 38.5, formData.mBessFoamSingleErrors.toString(), { font, size: fs })
    }
    const foamTotal = calculateMBESSFoam(formData)
    if (foamTotal !== null) {
      drawTextCentered(p7, 363.5, 308.2, 38.5, foamTotal.toString(), { font: fontBold, size: fs })
    }

    // Timed tandem gait — trials, average of 3, fastest
    const tandemX = [53.5, 139.5, 225, 311, 396.5]
    drawTextCentered(p7, tandemX[0], 126, 84, formData.tandemGaitTrial1, { font, size: fs })
    drawTextCentered(p7, tandemX[1], 126, 84, formData.tandemGaitTrial2, { font, size: fs })
    drawTextCentered(p7, tandemX[2], 126, 84, formData.tandemGaitTrial3, { font, size: fs })
    drawTextCentered(p7, tandemX[3], 126, 84, calculateTandemGaitAverage(formData), { font, size: fs })
    drawTextCentered(p7, tandemX[4], 126, 83.5, calculateTandemGaitFastest(formData), { font: fontBold, size: fs })

    // ==================== PAGE 8 (index 7): COMPLEX TANDEM + DUAL TASK ====================
    const p8 = pages[7]

    // Complex tandem gait error POINTS (1 per step off the line, 1 for truncal sway)
    drawScoreBox(p8, 217.5, 39, 620.9, formData.complexTandemForwardEyesOpen, { font, size: fs })
    drawScoreBox(p8, 217.5, 39, 602.4, formData.complexTandemForwardEyesClosed, { font, size: fs })
    drawScoreBox(p8, 217.5, 39, 583.4, calculateComplexTandemForward(formData), { font: fontBold, size: fs })
    drawScoreBox(p8, 445, 39, 620.9, formData.complexTandemBackwardEyesOpen, { font, size: fs })
    drawScoreBox(p8, 445, 39, 602.4, formData.complexTandemBackwardEyesClosed, { font, size: fs })
    drawScoreBox(p8, 445, 39, 583.4, calculateComplexTandemBackward(formData), { font: fontBold, size: fs })
    drawScoreBox(p8, 191.5, 39, 559.4, calculateComplexTandemTotal(formData), { font: fontBold, size: fsl })

    // Dual task gait is OPTIONAL — blank when not run, real values (including 0
    // errors) when it was. `!== null` so a genuine zero prints.
    if (formData.dualTaskPracticeErrors !== null) {
      drawTextCentered(p8, 394.5, 414, 40, formData.dualTaskPracticeErrors.toString(), { font, size: fs })
    }
    drawTextCentered(p8, 436.5, 414, 40, formData.dualTaskPracticeTime, { font, size: fs })

    const dualTaskRows: { errors: number | null; time: string; baseline: number }[] = [
      { errors: formData.dualTask1Errors, time: formData.dualTask1Time, baseline: 328.7 },
      { errors: formData.dualTask2Errors, time: formData.dualTask2Time, baseline: 307.7 },
      { errors: formData.dualTask3Errors, time: formData.dualTask3Time, baseline: 287.2 },
    ]
    dualTaskRows.forEach(row => {
      if (row.errors !== null) {
        drawTextCentered(p8, 386, row.baseline, 31, row.errors.toString(), { font, size: fs })
      }
      drawTextCentered(p8, 419, row.baseline, 57, row.time, { font, size: fs })
    })

    drawTextCentered(p8, 122, 211.6, 52, formData.dualTaskAlternateStartingInteger, { font, size: fs })

    // "Were any timed tandem gait trials not completed?" — the record must say
    // so, otherwise the times above read as a complete assessment.
    if (formData.trialsNotCompleted === true) drawCheckmark(p8, 73, 161.2, 8)
    else if (formData.trialsNotCompleted === false) drawCheckmark(p8, 121, 161.2, 8)
    if (formData.trialsNotCompletedReason) {
      drawWrappedText(p8, 55, 129.7, formData.trialsNotCompletedReason, 424, { font, size: fsm })
    }

    // ==================== PAGE 9 (index 8): DELAYED RECALL + DECISION + DISPOSITION ====================
    const p9 = pages[8]

    drawText(p9, 108, 654.5, formData.delayedRecallStartTime, { font, size: fs })
    if (formData.wordListUsed) {
      drawCheckmark(p9, wordListBoxX[formData.wordListUsed] + 0.5, 631.2, 8)
    }

    const delayedRecallRowBottoms = [
      599.2, 585.2, 571.7, 558.2, 544.2, 530.7, 516.7, 502.7, 489.2, 475.7,
    ]
    // The Score cell prints "0   1" at 214.6 and 236.5 (measured off the
    // template). Ringing the "1" at 233 put the stroke through the glyph, so a
    // recalled word read as an unringed — i.e. not recalled — row.
    if (isDelayedRecallAdministered(formData)) {
      formData.delayedRecall.forEach((correct, i) => {
        drawCircleOutline(p9, correct ? 236.5 : 214.6, delayedRecallRowBottoms[i] + 6, 5)
      })
    }
    drawScoreBox(p9, 196, 58.5, 461, calculateDelayedRecall(formData), { font: fontBold, size: fsl })

    // Step 6 decision table — first date column. Every row prints a dash when
    // its subtest was not administered; the printed denominators are of 21,
    // of 63, of 30, of 6, of 10, of 46 and of 30.
    const decCol = { x: 192.5, w: 95 }
    drawTextCentered(p9, decCol.x, 367.5, decCol.w, formData.dateOfExamination, { font, size: fsm })

    drawTextCentered(p9, decCol.x, 330.7, decCol.w, symptomBoxText(formData.childSymptoms, childNumber), { font, size: fsx })
    drawTextCentered(p9, decCol.x, 318.7, decCol.w, symptomBoxText(formData.parentSymptoms, parentNumber), { font, size: fsx })
    drawTextCentered(p9, decCol.x, 300.7, decCol.w, symptomBoxText(formData.childSymptoms, childSeverity), { font, size: fsx })
    drawTextCentered(p9, decCol.x, 288.7, decCol.w, symptomBoxText(formData.parentSymptoms, parentSeverity), { font, size: fsx })

    drawScoreBox(p9, decCol.x, decCol.w, 273.5, calculateImmediateMemory(formData), { size: fsm })
    drawScoreBox(p9, decCol.x, decCol.w, 261, calculateConcentration(formData), { size: fsm })
    drawScoreBox(p9, decCol.x, decCol.w, 248.5, calculateDelayedRecall(formData), { size: fsm })
    drawScoreBox(p9, decCol.x, decCol.w, 236.5, calculateTotalCognitive(formData), { font: fontBold, size: fsm })
    drawScoreBox(p9, decCol.x, decCol.w, 224, calculateMBESS(formData), { size: fsm })
    drawTextCentered(p9, decCol.x, 212, decCol.w, calculateTandemGaitFastest(formData), { font, size: fsm })
    drawScoreBox(p9, decCol.x, decCol.w, 200, calculateComplexTandemTotal(formData), { size: fsm })
    drawTextCentered(p9, decCol.x, 187.5, decCol.w, calculateDualTaskFastest(formData), { font, size: fsm })

    // Concussion diagnosed
    if (formData.concussionDiagnosed === 'Yes') drawCheckmark(p9, 171.5, 145.7, 8)
    else if (formData.concussionDiagnosed === 'No') drawCheckmark(p9, 219.5, 145.7, 8)
    else if (formData.concussionDiagnosed === 'Deferred') drawCheckmark(p9, 287, 145.7, 8)

    // ==================== PAGE 10 (index 9): HCP ATTESTATION + CLINICAL NOTES ====================
    const p10 = pages[9]

    drawText(p10, 83, 682, formData.hcpName, { font, size: fs })
    drawText(p10, 96, 663, formData.hcpSignature, { font, size: fs })
    drawText(p10, 343, 663, formData.hcpTitle, { font, size: fs })
    drawText(p10, 216, 644.5, formData.hcpRegistration, { font, size: fs })
    drawText(p10, 411, 644.5, formData.hcpDate, { font, size: fs })

    if (formData.additionalClinicalNotes) {
      drawWrappedText(p10, 56, 593, formData.additionalClinicalNotes, 422, { font, size: fsm })
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
