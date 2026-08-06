import { SCOAT6FormData } from '../types/scoat6.types'
import {
  calculateSymptomNumber,
  calculateSymptomSeverity,
  calculateImmediateMemory,
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
  type Scoat6SymptomColumnKey,
} from './scoat6-calculations'
import {
  drawText,
  drawTextCentered,
  drawCheckmark,
  drawCircleOutline,
  drawWrappedText,
  drawNotAdministered,
  notAdministeredMark,
  embedStandardFonts,
  loadFlatPDF,
  savePDFAndDownload,
} from './pdf-draw-helpers'

/**
 * SCOAT6 Flat PDF Export — draws values at precise coordinates on a
 * non-fillable PDF. 15 pages, 595.28 x 841.89 pts (A4).
 *
 * COORDINATES
 * -----------
 * There is no usable AcroForm to read widget geometry from, so every
 * coordinate below was measured off public/docs/SCOAT6_Flat.pdf by overlaying
 * a 10 pt calibration grid, rendering each page at 150 dpi and reading the
 * answer boxes straight off the artwork.
 *
 * They had to be re-measured wholesale: a rendered export of a fully populated
 * assessment showed the previous coordinates putting symptom ratings in the
 * "Date of Assessment" header, ten of the 24 symptoms on the WRONG PAGE (over
 * the Immediate Memory instructions), blood pressure inside a dark table
 * header, every cervical and neurological finding in blank margin, all six
 * mBESS error counts inside the Comments box, and the HCP attestation on
 * page 15 — which is the printed Return-to-Sport strategy table, not an
 * attestation page. Nothing about that record was readable.
 *
 * NOT-ADMINISTERED RULE (unchanged)
 * ---------------------------------
 * Scored fields are `number | null` so "never tested" and "scored zero" stay
 * distinguishable, and the predicates live in scoat6-calculations so the
 * on-screen totals and this PDF can never disagree. The explicit not-done
 * flags (gad7NotDone / phq2NotDone / sleepNotDone / mvoms*.notTested) force the
 * not-administered path regardless of any other value. Unadministered sections
 * draw no item marks and print a dash in their score box; administered
 * sections print their real value, including a genuine 0.
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

    /** Centre a value in a 30 pt box around x. */
    const cell = (
      page: (typeof pages)[number],
      x: number,
      y: number,
      text: string,
      bold = false
    ) => drawTextCentered(page, x - 15, y, 30, text, { font: bold ? fontBold : font, size: fsm })

    // ==================== PAGE 1: DEMOGRAPHICS ====================
    const p1 = pages[0]

    // The athlete ID has no printed box of its own; it rides with the name so
    // the record can still be matched to a patient.
    drawText(p1, 124, 429,
      formData.athleteName + (formData.idNumber ? `  (ID: ${formData.idNumber})` : ''),
      { font, size: fs, maxWidth: 430 })
    drawText(p1, 112, 406, formData.dateOfBirth, { font, size: fs })
    if (formData.sex === 'Male') drawCheckmark(p1, 261, 404, 8)
    else if (formData.sex === 'Female') drawCheckmark(p1, 326, 404, 8)
    else if (formData.sex === 'Prefer Not To Say') drawCheckmark(p1, 436, 404, 8)
    else if (formData.sex === 'Other') drawText(p1, 490, 406, 'Other', { font, size: fsm })
    drawText(p1, 80, 383, formData.sportTeamSchool, { font, size: fs, maxWidth: 470 })
    drawText(p1, 328, 338, formData.yearsEducation, { font, size: fs, maxWidth: 220 })
    drawText(p1, 95, 315, formData.clinician, { font, size: fs, maxWidth: 180 })
    drawText(p1, 415, 315, formData.dateOfExamination, { font, size: fs })
    // Age, dominant hand and the language fields have no printed field on the
    // SCOAT6 — they stay on screen rather than being written into a box that
    // asks a different question.

    // ==================== PAGE 2: CURRENT INJURY + HISTORY ====================
    const p2 = pages[1]

    const removal = formData.removalFromPlay
    if (removal === 'Immediate') drawCheckmark(p2, 205, 717, 8)
    else if (removal === 'Continued to play') drawCheckmark(p2, 452, 717, 8)
    else if (removal === 'Walked off') drawCheckmark(p2, 205, 693, 8)
    else if (removal === 'Assisted off') drawCheckmark(p2, 322, 693, 8)
    else if (removal === 'Stretchered off') drawCheckmark(p2, 452, 693, 8)
    drawText(p2, 355, 717, formData.continuedToPlayMinutes, { font, size: fs })

    drawText(p2, 115, 674, formData.dateOfInjury, { font, size: fs })
    drawWrappedText(p2, 42, 640, formData.injuryDescription, 505, { font, size: fsm })
    drawText(p2, 189, 542, formData.dateSymptomsFirstAppeared, { font, size: fs })
    drawText(p2, 464, 542, formData.dateSymptomsFirstReported, { font, size: fs })

    // History of head injuries — three rows in the open table body
    formData.headInjuries.forEach((hi, i) => {
      if (!hi.date && !hi.description && !hi.management) return
      const y = 440 - i * 40
      drawText(p2, 44, y, hi.date, { font, size: fsm, maxWidth: 90 })
      drawText(p2, 146, y, hi.description, { font, size: fsm, maxWidth: 200 })
      drawText(p2, 357, y, hi.management, { font, size: fsm, maxWidth: 195 })
    })

    // History of disorders — one printed row per diagnosis
    const disorderRows: Array<[keyof SCOAT6FormData['disorders'], number]> = [
      ['migraine', 245], ['chronicHeadache', 222], ['depression', 196],
      ['anxiety', 173], ['syncope', 149], ['epilepsy', 125],
      ['adhd', 101], ['learningDisorder', 75], ['other', 50],
    ]
    disorderRows.forEach(([key, y]) => {
      const d = formData.disorders[key]
      if (!d.checked) return
      drawCheckmark(p2, 48, y - 2, 8)
      if (key === 'other' && 'name' in d && d.name) {
        drawText(p2, 100, y, d.name, { font, size: fsm, maxWidth: 60 })
      }
      drawText(p2, 248, y, d.yearDiagnosed, { font, size: fsm, maxWidth: 62 })
      drawText(p2, 327, y, d.management, { font, size: fsm, maxWidth: 225 })
    })

    // ==================== PAGE 3: MEDICATIONS + FAMILY HISTORY ====================
    const p3 = pages[2]

    formData.medications.forEach((med, i) => {
      if (!med.item) return
      const y = 750 - i * 45
      drawText(p3, 44, y, med.item, { font, size: fsm, maxWidth: 98 })
      drawText(p3, 150, y, med.dose, { font, size: fsm, maxWidth: 64 })
      drawText(p3, 222, y, med.frequency, { font, size: fsm, maxWidth: 82 })
      drawText(p3, 313, y, med.reasonTaken, { font, size: fsm, maxWidth: 240 })
    })

    // The printed family-history table is a single diagnosis checklist, not the
    // per-relative grid the form collects. Each printed diagnosis row is
    // therefore ticked when ANY relative carries it, and names the relatives —
    // the association is kept rather than flattened away.
    const familyRows: Array<[keyof SCOAT6FormData['familyHistory'][number] | 'other', number]> = [
      ['depression', 415], ['anxiety', 378], ['adhd', 342],
      ['learningDisorder', 305], ['migraine', 267], ['other', 240],
    ]
    familyRows.forEach(([key, y]) => {
      const matches = formData.familyHistory.filter(fh =>
        key === 'other' ? fh.other.trim() !== '' : Boolean(fh[key as 'depression'])
      )
      if (matches.length === 0) return
      drawCheckmark(p3, 154, y - 2, 8)
      const who = matches.map(m => m.familyMember || 'unspecified').join(', ')
      drawText(p3, 44, y, who, { font, size: fsm, maxWidth: 92 })
      const management = matches.map(m => m.management).filter(Boolean).join('; ')
      drawText(p3, 293, y, management, { font, size: fsm, maxWidth: 260 })
      if (key === 'other') {
        const names = matches.map(m => m.other).filter(Boolean).join(', ')
        drawText(p3, 180, y - 12, names, { font, size: fsm, maxWidth: 100 })
      }
    })

    if (formData.familyHistoryNotes) {
      drawWrappedText(p3, 42, 182, formData.familyHistoryNotes, 505, { font, size: fsm })
    }

    // ==================== PAGE 4: SYMPTOM EVALUATION ====================
    const p4 = pages[3]

    // Column centres and row baselines measured off the template: 23 named
    // symptoms at a 25 pt pitch starting at 625, then the "Other" row at 50.
    const colX: Record<Scoat6SymptomColumnKey, number> = {
      preInjury: 218.4, dayInjured: 292.8, consult1: 372, consult2: 445.4, consult3: 519.8,
    }
    const columns: Scoat6SymptomColumnKey[] =
      ['preInjury', 'dayInjured', 'consult1', 'consult2', 'consult3']

    drawText(p4, 262, 663, formData.symptomDates.dayInjured, { font, size: 7 })
    drawText(p4, 343, 663, formData.symptomDates.consult1, { font, size: 7 })
    drawText(p4, 417, 663, formData.symptomDates.consult2, { font, size: 7 })
    drawText(p4, 490, 663, formData.symptomDates.consult3, { font, size: 7 })

    const symptomKeys: (keyof Omit<SCOAT6FormData['symptoms'], 'other'>)[] = [
      'headaches', 'pressureInHead', 'neckPain', 'nauseaVomiting', 'dizziness',
      'blurredVision', 'balanceProblems', 'sensitivityLight', 'sensitivityNoise',
      'feelingSlowedDown', 'feelingInFog', 'difficultyConcentrating', 'difficultyRemembering',
      'fatigueOrLowEnergy', 'confusion', 'drowsiness', 'moreEmotional', 'irritability',
      'sadness', 'nervousAnxious', 'sleepDisturbance', 'abnormalHeartRate', 'excessiveSweating',
    ]

    symptomKeys.forEach((key, i) => {
      const s = formData.symptoms[key]
      const y = 625 - i * 25
      columns.forEach(col => {
        if (s[col] > 0) cell(p4, colX[col], y, String(s[col]))
      })
    })

    const otherS = formData.symptoms.other
    if (otherS.name) {
      drawText(p4, 70, 50, otherS.name, { font, size: fsm, maxWidth: 110 })
      columns.forEach(col => {
        if (otherS[col] > 0) cell(p4, colX[col], 50, String(otherS[col]))
      })
    }

    // ==================== PAGE 5: SYMPTOM TOTALS + IMMEDIATE MEMORY ====================
    const p5 = pages[4]

    columns.forEach(col => {
      // "Symptom number 0 / severity 0" is the assertion that the athlete is
      // ASYMPTOMATIC at that visit. A column nobody filled in gets a dash.
      if (!isSymptomColumnAdministered(formData, col)) {
        cell(p5, colX[col], 649, na, true)
        cell(p5, colX[col], 627, na, true)
        return
      }
      cell(p5, colX[col], 649, String(calculateSymptomNumber(formData.symptoms, col)), true)
      cell(p5, colX[col], 627, String(calculateSymptomSeverity(formData.symptoms, col)), true)
    })

    // "Do symptoms worsen with…?" and "% of normal" are asked once, about NOW,
    // but the sheet repeats them per assessment column. They are therefore
    // recorded against the most recent column that was actually administered,
    // and not written at all if no column was.
    const latestColumn = [...columns].reverse().find(c => isSymptomColumnAdministered(formData, c))
    if (latestColumn) {
      const x = colX[latestColumn]
      if (formData.symptomsWorseWithPhysical !== null) {
        cell(p5, x, 700, formData.symptomsWorseWithPhysical ? 'Yes' : 'No')
      }
      if (formData.symptomsWorseWithMental !== null) {
        cell(p5, x, 675, formData.symptomsWorseWithMental ? 'Yes' : 'No')
      }
      if (formData.percentOfNormal) cell(p5, x, 605, `${formData.percentOfNormal}%`)
    }

    // Immediate memory — the sheet prints "0  1" per word per trial; ring the
    // score given. Nothing is ringed unless the subtest was administered.
    const wordListX: Record<string, number> = { A: 133, B: 183, C: 233 }
    if (formData.wordListUsed) drawCheckmark(p5, wordListX[formData.wordListUsed], 413, 8)

    const trialDigitX = [
      { incorrect: 205.4, correct: 230.9 },
      { incorrect: 256.3, correct: 282.2 },
      { incorrect: 307.2, correct: 333.1 },
    ]
    const trials = [
      formData.immediateMemoryTrial1,
      formData.immediateMemoryTrial2,
      formData.immediateMemoryTrial3,
    ]
    const trialTotalX = [218, 269, 320]

    if (immediateMemoryAdministered) {
      trials.forEach((trial, t) => {
        trial.forEach((correct, w) => {
          // Ring the printed digit, not through it: radius and centre were
          // nudged after a 300 dpi render showed a tight ring clipping the "0".
          const y = 368 - w * 26.1 + 2
          drawCircleOutline(p5, correct ? trialDigitX[t].correct : trialDigitX[t].incorrect, y, 6.5)
        })
        cell(p5, trialTotalX[t], 107, String(trial.filter(Boolean).length), true)
      })
      drawText(p5, 160, 74, String(calculateImmediateMemory(formData)), { font: fontBold, size: fsl })
    } else {
      trialTotalX.forEach(x => cell(p5, x, 107, na, true))
      drawNotAdministered(p5, 160, 74, { font: fontBold, size: fsl })
    }
    drawText(p5, 175, 50, formData.immediateMemoryTimeCompleted, { font, size: fs })

    // ==================== PAGE 6: ALTERNATE LIST + DIGITS + MONTHS ====================
    const p6 = pages[5]

    if (formData.alternate15WordTotal !== null) {
      drawText(p6, 65, 727, String(formData.alternate15WordTotal), { font, size: fs })
    }

    if (formData.digitListUsed) drawCheckmark(p6, wordListX[formData.digitListUsed], 578, 8)
    if (digitsAdministered) {
      drawText(p6, 495, 352, String(formData.digitsBackward), { font: fontBold, size: fsl })
    } else {
      drawNotAdministered(p6, 495, 352, { font: fontBold, size: fsl })
    }

    drawText(p6, 195, 189, formData.monthsReverseTime, { font, size: fs })
    if (formData.monthsReverseErrors !== null) {
      drawText(p6, 462, 189, String(formData.monthsReverseErrors), { font, size: fs })
    } else {
      drawNotAdministered(p6, 462, 189, { font, size: fs })
    }

    // NO combined "Concentration (Digits + Months) of 5" box is drawn.
    // Verified against the sheet itself: SCOAT6 page 6 prints "Digits score __
    // of 4", "Time Taken to Complete (secs) __ (N <30 sec)" and "Number of
    // Errors __" — and no months-score or concentration total. That box is a
    // SCAT6 feature. The screen still shows the derived total as a clinician
    // aid; the record carries only the fields the instrument defines.

    // ==================== PAGE 7: ORTHOSTATIC + CERVICAL ====================
    const p7 = pages[6]

    drawText(p7, 230, 660, formData.orthostaticsSupineBP, { font, size: fs })
    drawText(p7, 400, 660, formData.orthostaticsStandingBP, { font, size: fs })
    drawText(p7, 230, 624, formData.orthostaticsSupineHR, { font, size: fs })
    drawText(p7, 400, 624, formData.orthostaticsStandingHR, { font, size: fs })

    // Orthostatic symptoms: null = never asked, so neither box is ticked.
    if (formData.orthostaticsSupineSymptoms !== null) {
      drawCheckmark(p7, formData.orthostaticsSupineSymptoms ? 330 : 275, 584, 8)
      if (formData.orthostaticsSupineSymptoms) {
        drawText(p7, 220, 555, formData.orthostaticsSupineSymptomsDescription,
          { font, size: 7, maxWidth: 160 })
      }
    }
    if (formData.orthostaticsStandingSymptoms !== null) {
      drawCheckmark(p7, formData.orthostaticsStandingSymptoms ? 503 : 448, 584, 8)
      if (formData.orthostaticsStandingSymptoms) {
        drawText(p7, 390, 555, formData.orthostaticsStandingSymptomsDescription,
          { font, size: 7, maxWidth: 160 })
      }
    }

    // The printed Results row carries ONE Normal/Abnormal pair for the test as
    // a whole, while the form records supine and standing separately — so each
    // is written as text in its own column instead of guessing which the
    // printed pair refers to.
    if (formData.orthostaticsSupineResult) {
      drawText(p7, 222, 467, `Supine: ${formData.orthostaticsSupineResult}`, { font, size: 7 })
    }
    if (formData.orthostaticsStandingResult) {
      drawText(p7, 465, 467, `Standing: ${formData.orthostaticsStandingResult}`, { font, size: 7 })
    }

    const cervicalRows: Array<[keyof SCOAT6FormData, number]> = [
      ['cervicalMuscleSpasm', 334.5],
      ['cervicalMidlineTenderness', 297.6],
      ['cervicalParavertebralTenderness', 260.6],
      ['cervicalFlexion', 191.5],
      ['cervicalExtension', 164.1],
      ['cervicalRightLateralFlexion', 136.3],
      ['cervicalLeftLateralFlexion', 108.9],
      ['cervicalRightRotation', 81.1],
      ['cervicalLeftRotation', 53.7],
    ]
    cervicalRows.forEach(([key, y]) => {
      const value = formData[key]
      if (value === 'Normal') drawCheckmark(p7, 313, y - 2, 8)
      else if (value === 'Abnormal') drawCheckmark(p7, 395, y - 2, 8)
    })

    // ==================== PAGE 8: NEUROLOGICAL + BALANCE + TANDEM ====================
    const p8 = pages[7]

    if (formData.cranialNerves === 'Normal') drawCheckmark(p8, 85, 746, 8)
    else if (formData.cranialNerves === 'Abnormal') drawCheckmark(p8, 211, 746, 8)
    else if (formData.cranialNerves === 'Not tested') drawCheckmark(p8, 335, 746, 8)
    if (formData.cranialNervesNotes) {
      drawWrappedText(p8, 42, 712, formData.cranialNervesNotes, 505, { font, size: fsm })
    }

    const neuroRows: Array<[keyof SCOAT6FormData, number]> = [
      ['limbTone', 624.9], ['strength', 599.5], ['deepTendonReflexes', 573.6],
      ['sensation', 548.1], ['cerebellarFunction', 522.7],
    ]
    neuroRows.forEach(([key, y]) => {
      const value = formData[key]
      if (value === 'Normal') drawCheckmark(p8, 198, y - 2, 8)
      else if (value === 'Abnormal') drawCheckmark(p8, 324, y - 2, 8)
      else if (value === 'Not tested') drawCheckmark(p8, 446, y - 2, 8)
    })
    if (formData.neurologicalComments) {
      drawWrappedText(p8, 42, 482, formData.neurologicalComments, 505, { font, size: fsm })
    }

    if (formData.footTested === 'Left') drawCheckmark(p8, 122, 364, 8)
    else if (formData.footTested === 'Right') drawCheckmark(p8, 181, 364, 8)

    // 0 errors of 30 = a PERFECT balance result. Never assert it by default —
    // each stance prints only its own recorded value, and the /30 total only
    // once all three stances exist.
    const firmStances: Array<[number, number | null]> = [
      [313.9, formData.mBessDoubleErrors],
      [291.3, formData.mBessTandemErrors],
      [268.8, formData.mBessSingleErrors],
    ]
    firmStances.forEach(([y, value]) => {
      if (value !== null) drawText(p8, 140, y, String(value), { font, size: fs })
      else drawNotAdministered(p8, 140, y, { font, size: fs })
    })
    const mBessTotal = calculateMBESS(formData)
    if (balanceAdministered && mBessTotal !== null) {
      drawText(p8, 140, 245.7, String(mBessTotal), { font: fontBold, size: fs })
    } else {
      drawNotAdministered(p8, 140, 245.7, { font: fontBold, size: fs })
    }

    // The foam block is OPTIONAL — an unperformed optional section stays blank
    // rather than being marked "not administered".
    const foamStances: Array<[number, number | null]> = [
      [313.9, formData.mBessFoamDoubleErrors],
      [291.3, formData.mBessFoamTandemErrors],
      [268.8, formData.mBessFoamSingleErrors],
    ]
    foamStances.forEach(([y, value]) => {
      if (value !== null) drawText(p8, 422, y, String(value), { font, size: fs })
    })
    const foamTotal = calculateMBESSFoam(formData)
    if (foamTotal !== null) {
      drawText(p8, 422, 245.7, String(foamTotal), { font: fontBold, size: fs })
    }

    const tandemCols = [
      { x: 42.2, w: 101.8, text: formData.tandemGaitTrial1 },
      { x: 146.4, w: 100.8, text: formData.tandemGaitTrial2 },
      { x: 249.6, w: 100.8, text: formData.tandemGaitTrial3 },
      { x: 352.8, w: 100.8, text: calculateTandemGaitAverage(formData) },
    ]
    tandemCols.forEach(c => drawTextCentered(p8, c.x, 78, c.w, c.text, { font, size: fs }))
    drawTextCentered(p8, 456, 78, 100.8, calculateTandemGaitFastest(formData),
      { font: fontBold, size: fs })

    // Qualitative failure flag — times alone read as a normal gait, so an
    // athlete who swayed, over-stepped, fell or could not complete must say so.
    // The form collects the four printed options as one flag, so only the
    // first ("Abnormal/failed to complete") is ticked.
    if (formData.tandemGaitAbnormal) drawCheckmark(p8, 175, 45, 8)

    // ==================== PAGE 9: COMPLEX TANDEM + DUAL TASK ====================
    const p9 = pages[8]

    // Complex tandem gait — a printed 0 asserts a flawless walk, so each cell
    // prints only what was actually recorded and totals need every component.
    const complexCells: Array<[number, number | null, boolean]> = [
      [722, formData.complexTandemForwardEyesOpen, false],
      [699, formData.complexTandemForwardEyesClosed, false],
      [676, calculateComplexTandemForward(formData), true],
      [578, formData.complexTandemBackwardEyesOpen, false],
      [555, formData.complexTandemBackwardEyesClosed, false],
      [532, calculateComplexTandemBackward(formData), true],
    ]
    complexCells.forEach(([y, value, bold]) => {
      const opts = { font: bold ? fontBold : font, size: fs }
      if (value !== null) drawText(p9, 245, y, String(value), opts)
      else drawNotAdministered(p9, 245, y, opts)
    })
    const complexTotal = calculateComplexTandemTotal(formData)
    if (complexTandemAdministered && complexTotal !== null) {
      drawText(p9, 245, 492, String(complexTotal), { font: fontBold, size: fsl })
    } else {
      drawNotAdministered(p9, 245, 492, { font: fontBold, size: fsl })
    }

    const dualTaskRowY: Record<string, number> = { Words: 357, 'Serial 7s': 315, Months: 273 }
    if (formData.dualTaskCognitiveTask) {
      drawCheckmark(p9, 31, dualTaskRowY[formData.dualTaskCognitiveTask] - 4, 8)
    }

    if (dualTaskAdministered) {
      if (formData.dualTaskTrialsAttempted !== null) {
        drawText(p9, 172, 193, String(formData.dualTaskTrialsAttempted), { font, size: fs })
      } else {
        drawNotAdministered(p9, 172, 193, { font, size: fs })
      }
      if (formData.dualTaskTrialsCorrect !== null) {
        drawText(p9, 358, 193, String(formData.dualTaskTrialsCorrect), { font, size: fs })
      } else {
        drawNotAdministered(p9, 358, 193, { font, size: fs })
      }
      // Accuracy is '' unless both counts exist; an empty string draws nothing.
      const accuracy = calculateDualTaskAccuracy(formData)
      if (accuracy) drawText(p9, 336, 172, accuracy, { font: fontBold, size: fs })
      else drawNotAdministered(p9, 336, 172, { font: fontBold, size: fs })
    } else {
      drawNotAdministered(p9, 172, 193, { font, size: fs })
      drawNotAdministered(p9, 358, 193, { font, size: fs })
      drawNotAdministered(p9, 336, 172, { font: fontBold, size: fs })
    }
    // Recorded time stands on its own — it is a measurement, not a derived score.
    drawText(p9, 508, 193, formData.dualTaskAverageTime, { font, size: fs })
    if (formData.dualTaskComments) {
      drawWrappedText(p9, 42, 140, formData.dualTaskComments, 505, { font, size: fsm })
    }

    // ==================== PAGE 10: mVOMS + GAD-7 + PHQ-2 ====================
    const p10 = pages[9]

    const mvomsColX = { headache: 237, dizziness: 294, nausea: 351.6, fogginess: 409.7 }

    // mVOMS baseline — 0/0/0/0 asserts "no symptom provocation at rest", which
    // is a real clinical finding and must not be manufactured by default.
    const baselineCells: Array<[number, number | null]> = [
      [mvomsColX.headache, formData.mvomsBaseline.headache],
      [mvomsColX.dizziness, formData.mvomsBaseline.dizziness],
      [mvomsColX.nausea, formData.mvomsBaseline.nausea],
      [mvomsColX.fogginess, formData.mvomsBaseline.fogginess],
    ]
    baselineCells.forEach(([x, value]) => {
      if (mvomsBaselineAdministered && value !== null) cell(p10, x, 732, String(value))
      else cell(p10, x, 732, na)
    })

    const mvomsTests = [
      { data: formData.mvomsSmoothPursuits, y: 691 },
      { data: formData.mvomsSaccadesHorizontal, y: 650 },
      { data: formData.mvomsVORHorizontal, y: 607 },
      { data: formData.mvomsVMS, y: 548 },
    ]
    mvomsTests.forEach(test => {
      // `notTested` is the explicit flag and wins outright; otherwise the row
      // prints each provocation rating it actually has. A blank cell is NOT
      // "no provocation" — that finding has to be typed as a 0.
      const rowAdministered = isMvomsRowAdministered(test.data)
      if (test.data.notTested) {
        cell(p10, 179, test.y, 'Yes')
      } else {
        const cells: Array<[number, number | null]> = [
          [mvomsColX.headache, test.data.headache],
          [mvomsColX.dizziness, test.data.dizziness],
          [mvomsColX.nausea, test.data.nausea],
          [mvomsColX.fogginess, test.data.fogginess],
        ]
        cells.forEach(([x, value]) => {
          if (rowAdministered && value !== null) cell(p10, x, test.y, String(value))
          else cell(p10, x, test.y, na)
        })
      }
      if (test.data.comments) {
        drawText(p10, 445, test.y, test.data.comments, { font, size: 7, maxWidth: 108 })
      }
    })

    // GAD-7 — an untouched screen scores 0 and reads "Minimal anxiety", which
    // is a diagnostic assertion. Requires an actual response to print.
    const screenColX = [307.2, 376.8, 445.4, 517.4]
    const gad7Y = [380.1, 363.3, 346.1, 329.3, 312, 295.2, 278.4]
    if (formData.gad7NotDone) drawCheckmark(p10, 95, 461, 8)
    if (gad7Administered) {
      const gad7Items = [formData.gad7_1, formData.gad7_2, formData.gad7_3, formData.gad7_4,
        formData.gad7_5, formData.gad7_6, formData.gad7_7]
      gad7Items.forEach((val, i) => {
        if (val === null || val < 0 || val > 3) return // unanswered item: no ring at all
        drawCircleOutline(p10, screenColX[val], gad7Y[i] + 3, 5.5)
      })
      const gad7Total = calculateGAD7(formData)
      drawText(p10, 150, 248,
        gad7Total === null ? na : `${gad7Total} — ${getGAD7Severity(gad7Total)}`,
        { font: fontBold, size: 7 })
    } else {
      // No item rings; the score box states not-done rather than "0".
      drawText(p10, 150, 248, formData.gad7NotDone ? `${na} Not done` : na,
        { font: fontBold, size: 7 })
    }

    // PHQ-2 — same rule.
    if (formData.phq2NotDone) drawCheckmark(p10, 95, 186, 8)
    if (phq2Administered) {
      const phq2Items = [formData.phq2_1, formData.phq2_2]
      const phq2Y = [158.4, 140.1]
      phq2Items.forEach((val, i) => {
        if (val === null || val < 0 || val > 3) return
        drawCircleOutline(p10, screenColX[val], phq2Y[i] + 3, 5.5)
      })
      drawText(p10, 164, 46, String(calculatePHQ2(formData) ?? na), { font: fontBold, size: fs })
    } else {
      drawText(p10, 164, 46, formData.phq2NotDone ? `${na} Not done` : na,
        { font: fontBold, size: 7 })
    }

    // ==================== PAGE 11: SLEEP SCREEN ====================
    const p11 = pages[10]

    if (formData.sleepNotDone) drawCheckmark(p11, 92, 773, 8)

    // Each question prints its options with the score alongside; ring the score
    // of the option the patient chose. An untouched screen scores 0 and reads
    // "Normal", so nothing is ringed unless every item was answered.
    const sleepQuestions: Array<{ value: number | null; options: Record<number, number> }> = [
      { value: formData.sleep1, options: { 4: 722.4, 3: 705.1, 2: 688.3, 1: 671, 0: 654.2 } },
      { value: formData.sleep2, options: { 4: 592.3, 3: 575, 2: 558.2, 1: 540.9, 0: 524.1 } },
      { value: formData.sleep3, options: { 3: 464.1, 2: 446.9, 1: 430.1, 0: 412.8 } },
      { value: formData.sleep4, options: { 3: 350.4, 2: 334.1, 1: 316.8, 0: 299.5 } },
      { value: formData.sleep5, options: { 3: 237.1, 2: 220.3, 1: 203, 0: 186.2 } },
    ]
    if (sleepAdministered) {
      sleepQuestions.forEach(q => {
        if (q.value === null) return
        const y = q.options[q.value]
        if (y === undefined) return
        drawCircleOutline(p11, 519.4, y + 3, 5.5)
      })
      const sleepTotal = calculateSleepScore(formData)
      drawText(p11, 152, 155,
        sleepTotal === null ? na : `${sleepTotal} — ${getSleepSeverity(sleepTotal)}`,
        { font: fontBold, size: 7 })
    } else {
      drawText(p11, 152, 155, formData.sleepNotDone ? `${na} Not done` : na,
        { font: fontBold, size: 7 })
    }

    // ==================== PAGE 12: DELAYED RECALL + TESTS + ASSESSMENT ====================
    const p12 = pages[11]

    if (formData.wordListUsed) drawCheckmark(p12, wordListX[formData.wordListUsed], 728, 8)

    const recallRowY = [685.4, 661.9, 638.4, 614.9, 591.8, 567.8, 544.3, 520.8, 497.3, 473.7]
    if (delayedRecallAdministered) {
      formData.delayedRecall.forEach((correct, i) => {
        drawCircleOutline(p12, correct ? 261.6 : 235.2, recallRowY[i] + 3, 5)
      })
      drawText(p12, 80, 440, String(calculateDelayedRecall(formData)), { font: fontBold, size: fsl })
    } else {
      drawNotAdministered(p12, 80, 440, { font: fontBold, size: fsl })
    }
    // The sheet asks only for the elapsed minutes; there is no printed box for
    // the clock time the recall started, so it is not written anywhere.
    drawText(p12, 510, 440, formData.delayedRecallMinutesSinceImmediate, { font, size: fs })

    if (formData.computerizedTestNotDone) {
      drawCheckmark(p12, 95, 374, 8)
    } else {
      drawText(p12, 128, 352, formData.computerizedTestBattery, { font, size: fs, maxWidth: 420 })
      drawText(p12, 211, 329, formData.computerizedTestBaselineDate, { font, size: fs, maxWidth: 335 })
      drawText(p12, 163, 306, formData.computerizedTestPostInjuryRest, { font, size: fsm, maxWidth: 385 })
      drawText(p12, 230, 284, formData.computerizedTestPostInjuryExercise, { font, size: fsm, maxWidth: 320 })
    }

    if (formData.aerobicExerciseNotDone) {
      drawCheckmark(p12, 95, 222, 8)
    } else {
      drawText(p12, 128, 172, formData.aerobicExerciseProtocol, { font, size: fs, maxWidth: 420 })
    }

    if (formData.overallAssessmentSummary) {
      drawWrappedText(p12, 42, 96, formData.overallAssessmentSummary, 505, { font, size: fsm })
    }

    // ==================== PAGE 13: MANAGEMENT + REFERRALS ====================
    const p13 = pages[12]

    if (formData.imagingRequested) {
      drawCheckmark(p13, 230, 775, 8)
      drawText(p13, 141, 753, formData.imagingType, { font, size: fs, maxWidth: 405 })
      drawText(p13, 101, 731, formData.imagingReason, { font, size: fs, maxWidth: 445 })
      drawText(p13, 101, 709, formData.imagingFindings, { font, size: fs, maxWidth: 445 })
    }

    drawText(p13, 84, 658, formData.returnToClass, { font, size: fs, maxWidth: 460 })
    drawText(p13, 84, 636, formData.returnToWork, { font, size: fs, maxWidth: 460 })
    drawText(p13, 84, 613, formData.returnToDriving, { font, size: fs, maxWidth: 460 })
    drawText(p13, 84, 590, formData.returnToSport, { font, size: fs, maxWidth: 460 })

    const referralRows: Array<[keyof SCOAT6FormData['referrals'], number]> = [
      ['athleticTrainer', 474.2], ['exercisePhysiologist', 451.7], ['neurologist', 429.1],
      ['neuropsychologist', 406.1], ['neurosurgeon', 383.5], ['ophthalmologist', 360.9],
      ['optometrist', 338.4], ['paediatrician', 315.3], ['physiatrist', 292.8],
      ['physiotherapist', 270.2], ['psychologist', 247.7], ['psychiatrist', 224.6],
      ['sportMedicine', 202.1], ['other', 179.5],
    ]
    referralRows.forEach(([key, y]) => {
      const ref = formData.referrals[key]
      if (!ref.checked) return
      drawCheckmark(p13, 39, y - 2, 8)
      if (ref.name) drawText(p13, 228, y, ref.name, { font, size: fsm, maxWidth: 320 })
    })

    if (formData.pharmacotherapyPrescribed) {
      drawWrappedText(p13, 42, 133, formData.pharmacotherapyPrescribed, 505, { font, size: fsm })
    }
    drawText(p13, 122, 43, formData.dateOfReview, { font, size: fs })
    drawText(p13, 403, 43, formData.dateOfFollowUp, { font, size: fs })

    // ==================== PAGE 14: ADDITIONAL CLINICAL NOTES ====================
    // Page 15 is the printed Return-to-Sport strategy table and page 14 the
    // Additional Clinical Notes box; the SCOAT6 has no printed HCP attestation
    // block at all, so the attestation is written at the foot of the notes box
    // rather than over the RTS guidance where it used to land.
    const p14 = pages[13]

    let notesY = 780
    if (formData.additionalClinicalNotes) {
      notesY = drawWrappedText(p14, 42, notesY, formData.additionalClinicalNotes, 505,
        { font, size: fsm })
    }

    const attestation = [
      formData.hcpName && `Assessed by: ${formData.hcpName}`,
      formData.hcpTitle,
      formData.hcpRegistration && `Reg. ${formData.hcpRegistration}`,
      formData.hcpDate,
    ].filter(Boolean).join('  |  ')
    if (attestation) {
      drawText(p14, 42, Math.max(notesY - 14, 490), attestation, { font: fontBold, size: fsm, maxWidth: 505 })
    }
    if (formData.hcpSignature) {
      drawText(p14, 42, Math.max(notesY - 28, 476), `Signed: ${formData.hcpSignature}`,
        { font, size: fsm, maxWidth: 505 })
    }

    // Save and download
    await savePDFAndDownload(pdfDoc, filename)
  } catch (error) {
    console.error('SCOAT6 flat PDF export failed:', error)
    alert(`PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    throw error
  }
}
