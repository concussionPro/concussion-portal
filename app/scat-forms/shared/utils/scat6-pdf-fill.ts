import { PDFDocument } from 'pdf-lib'
import { SCAT6FormData } from '../types/scat6.types'

/**
 * SCAT6 PDF Export - CORRECTED Field Mapping
 *
 * Field names were verified by filling the blank SCAT6_Fillable.pdf
 * with self-labeling text and visually confirming each position.
 *
 * KNOWN LIMITATIONS (pdf-lib does not support rich text fields):
 * - Text28 (Orientation Score), Text31, Text32, Text37 (mBESS double errors)
 * - Text42, Text42A, Text45, Text84D, Text87 (different from usual description)
 *
 * These fields will remain empty in the exported PDF.
 */
export async function exportSCAT6ToFilledPDF(
  formData: SCAT6FormData,
  filename: string = 'SCAT6_Filled.pdf'
) {
  console.log('%c=== SCAT6 PDF EXPORT (v2 - Corrected) ===', 'background: green; color: white; font-size: 20px; padding: 10px;')

  try {
    // Load the blank fillable PDF
    const response = await fetch('/docs/SCAT6_Fillable.pdf')
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer, {
      ignoreEncryption: true,
      throwOnInvalidObject: false
    })
    const form = pdfDoc.getForm()

    let filledCount = 0

    // ==================== PAGE 2: DEMOGRAPHICS ====================
    filledCount += setTextField(form, 'Text1', formData.athleteName)
    filledCount += setTextField(form, 'Text2', formData.idNumber)
    filledCount += setTextField(form, 'Text3', formData.dateOfBirth)
    filledCount += setTextField(form, 'Text4', formData.dateOfExamination)
    filledCount += setTextField(form, 'Text5', formData.dateOfInjury)
    filledCount += setTextField(form, 'Text4a', formData.timeOfInjury)       // WAS Text6
    filledCount += setTextField(form, 'Text8b', formData.sportTeamSchool)    // WAS Text7
    filledCount += setTextField(form, 'Text7', formData.currentYear)         // WAS Text8
    filledCount += setTextField(form, 'Text8', formData.yearsEducation)      // WAS Text9
    filledCount += setTextField(form, 'Text9', formData.firstLanguage)       // WAS Text10
    filledCount += setTextField(form, 'Text10', formData.preferredLanguage)  // WAS Text11
    filledCount += setTextField(form, 'Text11a', formData.examiner)          // WAS Text12

    // Sex radio - try both possible field groups
    if (formData.sex) {
      filledCount += setRadioButtonByValue(form, 'Sex', `/${formData.sex}`)
      filledCount += setRadioButtonByValue(form, 'Sex_V2', `/${formData.sex}`)
    }

    // Dominant Hand - store as text
    if (formData.dominantHand) {
      filledCount += setTextField(form, 'Text6', formData.dominantHand)
    }

    // ==================== PAGE 2: CONCUSSION HISTORY ====================
    filledCount += setTextField(form, 'Text11', formData.previousConcussions) // WAS Text14
    filledCount += setTextField(form, 'Text12', formData.mostRecentConcussion) // WAS Text15
    filledCount += setTextField(form, 'Text13', formData.primarySymptoms)      // WAS Text16
    filledCount += setTextField(form, 'Text14', formData.recoveryTime)         // WAS Text17

    // ==================== PAGE 4: ATHLETE BACKGROUND ====================
    filledCount += setCheckBox(form, 'Check Box1', formData.hospitalizedForHeadInjury)
    filledCount += setCheckBox(form, 'Check Box2', formData.headacheDisorder)
    filledCount += setCheckBox(form, 'Check Box3', formData.learningDisability)
    filledCount += setCheckBox(form, 'Check Box4', formData.adhd)
    filledCount += setCheckBox(form, 'Check Box5', formData.psychologicalDisorder)

    // Y/N radio buttons for medical history
    filledCount += setRadioButtonByValue(form, 'athelete1', formData.hospitalizedForHeadInjury ? '/0' : '/1')
    filledCount += setRadioButtonByValue(form, 'athelete2', formData.headacheDisorder ? '/0' : '/1')
    filledCount += setRadioButtonByValue(form, 'athelete3', formData.learningDisability ? '/0' : '/1')
    filledCount += setRadioButtonByValue(form, 'athelete4', formData.adhd ? '/0' : '/1')
    filledCount += setRadioButtonByValue(form, 'athelete5', formData.psychologicalDisorder ? '/0' : '/1')

    filledCount += setTextField(form, 'Text21', formData.athleteBackgroundNotes)   // WAS Text18
    filledCount += setTextField(form, 'Text22', formData.currentMedications)       // WAS Text19

    // ==================== PAGE 4: SYMPTOMS (22 items, 0-6 scale) ====================
    filledCount += setSymptomRadio(form, 's1', formData.symptoms.headaches)
    filledCount += setSymptomRadio(form, 's2', formData.symptoms.pressureInHead)
    filledCount += setSymptomRadio(form, 's3', formData.symptoms.neckPain)
    filledCount += setSymptomRadio(form, 's4', formData.symptoms.nauseaVomiting)
    filledCount += setSymptomRadio(form, 's5', formData.symptoms.dizziness)
    filledCount += setSymptomRadio(form, 's6', formData.symptoms.blurredVision)
    filledCount += setSymptomRadio(form, 's7', formData.symptoms.balanceProblems)
    filledCount += setSymptomRadio(form, 's8', formData.symptoms.sensitivityLight)
    filledCount += setSymptomRadio(form, 's9', formData.symptoms.sensitivityNoise)
    filledCount += setSymptomRadio(form, 's10', formData.symptoms.feelingSlowedDown)
    filledCount += setSymptomRadio(form, 's11', formData.symptoms.feelingInFog)
    filledCount += setSymptomRadio(form, 's12', formData.symptoms.dontFeelRight)
    filledCount += setSymptomRadio(form, 's13', formData.symptoms.difficultyConcentrating)
    filledCount += setSymptomRadio(form, 's14', formData.symptoms.difficultyRemembering)
    filledCount += setSymptomRadio(form, 's15', formData.symptoms.fatigueOrLowEnergy)
    filledCount += setSymptomRadio(form, 's16', formData.symptoms.confusion)
    filledCount += setSymptomRadio(form, 's17', formData.symptoms.drowsiness)
    filledCount += setSymptomRadio(form, 's18', formData.symptoms.moreEmotional)
    filledCount += setSymptomRadio(form, 's19', formData.symptoms.irritability)
    filledCount += setSymptomRadio(form, 's20', formData.symptoms.sadness)
    filledCount += setSymptomRadio(form, 's21', formData.symptoms.nervousAnxious)
    filledCount += setSymptomRadio(form, 's22', formData.symptoms.troubleFallingAsleep)

    filledCount += setTextField(form, 'Text26', formData.percentOfNormal)
    filledCount += setTextField(form, 'Text25', formData.whyNotHundredPercent || '')

    // Symptoms worse with physical/mental
    if (formData.symptomsWorseWithPhysical !== null) {
      filledCount += setRadioButtonByValue(form, 'athelete6', formData.symptomsWorseWithPhysical ? '/0' : '/1')
    }
    if (formData.symptomsWorseWithMental !== null) {
      filledCount += setRadioButtonByValue(form, 'athelete7', formData.symptomsWorseWithMental ? '/0' : '/1')
    }

    // ==================== PAGE 5: ORIENTATION (5 items) ====================
    filledCount += setRadioButtonByValue(form, 'ori1', formData.orientationMonth ? '/1' : '/0')
    filledCount += setRadioButtonByValue(form, 'ori2', formData.orientationDate ? '/1' : '/0')
    filledCount += setRadioButtonByValue(form, 'ori3', formData.orientationDayOfWeek ? '/1' : '/0')
    filledCount += setRadioButtonByValue(form, 'ori4', formData.orientationYear ? '/1' : '/0')
    filledCount += setRadioButtonByValue(form, 'ori5', formData.orientationTime ? '/1' : '/0')

    // ==================== PAGE 5: IMMEDIATE MEMORY ====================
    const trial1Fields = ['Tri1a', 'Tri1b', 'Tri1c', 'Tri1d', 'Tri1e', 'Tri1f', 'Tri1g', 'Tri1h', 'Tri1i', 'Tri1j']
    const trial2Fields = ['Tri2a', 'Tri2b', 'Tri2c', 'Tri2d', 'Tri2e', 'Tri2f', 'Tri2g', 'Tri2h', 'Tri2i', 'Tri2j']
    const trial3Fields = ['Tri3a', 'Tri3b', 'Tri3c', 'Tri3d', 'Tri3e', 'Tri3f', 'Tri3g', 'Tri3h', 'Tri3i', 'Tri3j']

    formData.immediateMemoryTrial1.forEach((checked, i) => {
      if (trial1Fields[i]) filledCount += setRadioButtonByValue(form, trial1Fields[i], checked ? '/1' : '/0')
    })
    formData.immediateMemoryTrial2.forEach((checked, i) => {
      if (trial2Fields[i]) filledCount += setRadioButtonByValue(form, trial2Fields[i], checked ? '/1' : '/0')
    })
    formData.immediateMemoryTrial3.forEach((checked, i) => {
      if (trial3Fields[i]) filledCount += setRadioButtonByValue(form, trial3Fields[i], checked ? '/1' : '/0')
    })

    filledCount += setTextField(form, 'Text33', formData.immediateMemoryTimeCompleted) // WAS Text11a

    // Word List Used
    if (formData.wordListUsed === 'A') filledCount += setCheckBox(form, 'A', true)
    if (formData.wordListUsed === 'B') filledCount += setCheckBox(form, 'B', true)
    if (formData.wordListUsed === 'C') filledCount += setCheckBox(form, 'C', true)

    // ==================== PAGE 6: CONCENTRATION ====================
    if (formData.digitListUsed === 'A') filledCount += setCheckBox(form, 'A_2', true)
    if (formData.digitListUsed === 'B') filledCount += setCheckBox(form, 'B_2', true)
    if (formData.digitListUsed === 'C') filledCount += setCheckBox(form, 'C_2', true)

    filledCount += setTextField(form, 'Text34', formData.digitsBackward.toString())        // WAS Text20
    filledCount += setTextField(form, 'Text35', formData.monthsReverseTime)                // WAS Text21
    filledCount += setTextField(form, 'Text35aa', formData.monthsReverseErrors.toString()) // WAS Text22

    // ==================== PAGE 6-7: BALANCE - mBESS ====================
    if (formData.footTested === 'Left') filledCount += setRadioButtonByValue(form, 'Foot', '/0')
    if (formData.footTested === 'Right') filledCount += setRadioButtonByValue(form, 'Foot', '/1')

    filledCount += setTextField(form, 'Text40', formData.testingSurface)
    filledCount += setTextField(form, 'Text41', formData.footwear)

    // mBESS errors on FIRM surface
    filledCount += setTextField(form, 'Text38', formData.mBessDoubleErrors.toString())
    filledCount += setTextField(form, 'Text39', formData.mBessTandemErrors.toString())
    filledCount += setTextField(form, 'Text46', formData.mBessSingleErrors.toString())

    // mBESS errors on FOAM (optional)
    if (formData.mBessFoamDoubleErrors !== null) {
      filledCount += setTextField(form, 'Text43', (formData.mBessFoamDoubleErrors ?? '').toString())
    }
    if (formData.mBessFoamTandemErrors !== null) {
      filledCount += setTextField(form, 'Text44', (formData.mBessFoamTandemErrors ?? '').toString())
    }
    if (formData.mBessFoamSingleErrors !== null) {
      filledCount += setTextField(form, 'Text43C', (formData.mBessFoamSingleErrors ?? '').toString())
    }

    // ==================== PAGE 7: TANDEM GAIT ====================
    filledCount += setTextField(form, 'Text47', formData.tandemGaitTrial1)
    filledCount += setTextField(form, 'Text48', formData.tandemGaitTrial2)
    filledCount += setTextField(form, 'Text49', formData.tandemGaitTrial3)

    // ==================== PAGE 7: DUAL TASK (Optional) ====================
    filledCount += setTextField(form, 'Text55', formData.dualTask1Time || '')
    filledCount += setTextField(form, 'Text56', formData.dualTask2Time || '')
    filledCount += setTextField(form, 'Text54', formData.dualTask3Time || '')
    filledCount += setTextField(form, 'Text83A', formData.dualTaskPracticeTime || '')
    filledCount += setTextField(form, 'Text81', formData.dualTaskAlternateStartingInteger || '')

    // ==================== PAGE 8: DELAYED RECALL ====================
    const delayedRecallFields = ['DEL3', 'DEL4', 'DEL5', 'DEL6', 'DEL4A', 'DEL8']
    formData.delayedRecall.slice(0, 6).forEach((checked, i) => {
      if (delayedRecallFields[i]) {
        filledCount += setRadioButtonByValue(form, delayedRecallFields[i], checked ? '/1' : '/0')
      }
    })

    filledCount += setTextField(form, 'Text80', formData.delayedRecallStartTime) // WAS Text27

    // ==================== PAGE 8: DIFFERENT FROM USUAL ====================
    if (formData.differentFromUsual !== null) {
      filledCount += setRadioButtonByValue(form, 'TTL12',
        formData.differentFromUsual ? '/Yes_2' : '/No_2')
    }

    // ==================== PAGE 9: DECISION TABLE ====================
    const dd = formData.decisionDates
    if (dd) {
      filledCount += setTextField(form, '100', dd.date1)
      filledCount += setTextField(form, '101', dd.date2)
      filledCount += setTextField(form, '102', dd.date3)

      filledCount += setTextField(form, '100d', dd.symptomNumber1?.toString() || '')
      filledCount += setTextField(form, '101e', dd.symptomNumber2?.toString() || '')
      filledCount += setTextField(form, '102f', dd.symptomNumber3?.toString() || '')

      filledCount += setTextField(form, '100g', dd.symptomSeverity1?.toString() || '')
      filledCount += setTextField(form, '101h', dd.symptomSeverity2?.toString() || '')
      filledCount += setTextField(form, '102i', dd.symptomSeverity3?.toString() || '')

      filledCount += setTextField(form, '100j', dd.orientation1?.toString() || '')
      filledCount += setTextField(form, '101k', dd.orientation2?.toString() || '')
      filledCount += setTextField(form, '102l', dd.orientation3?.toString() || '')

      filledCount += setTextField(form, '100m', dd.immediateMemory1?.toString() || '')
      filledCount += setTextField(form, '101n', dd.immediateMemory2?.toString() || '')
      filledCount += setTextField(form, '102o', dd.immediateMemory3?.toString() || '')

      filledCount += setTextField(form, '100p', dd.cognitiveTotal1?.toString() || '')
      filledCount += setTextField(form, '101q', dd.cognitiveTotal2?.toString() || '')
      filledCount += setTextField(form, '102r', dd.cognitiveTotal3?.toString() || '')

      filledCount += setTextField(form, '100s', dd.mBessTotal1?.toString() || '')
      filledCount += setTextField(form, '101s', dd.mBessTotal2?.toString() || '')
      filledCount += setTextField(form, '102t', dd.mBessTotal3?.toString() || '')

      filledCount += setTextField(form, '100u', dd.tandemGaitFastest1 || '')
      filledCount += setTextField(form, '101v', dd.tandemGaitFastest2 || '')
      filledCount += setTextField(form, '102w', dd.tandemGaitFastest3 || '')

      filledCount += setTextField(form, '100x', dd.dualTaskFastest1 || '')
      filledCount += setTextField(form, '101y', dd.dualTaskFastest2 || '')
      filledCount += setTextField(form, '102z', dd.dualTaskFastest3 || '')
    }

    // ==================== PAGE 9: DISPOSITION ====================
    if (formData.concussionDiagnosed === 'Yes') {
      filledCount += setRadioButtonByValue(form, 'Concussion diagnosed', '/Yes_3')
    } else if (formData.concussionDiagnosed === 'No') {
      filledCount += setRadioButtonByValue(form, 'Concussion diagnosed', '/No_3')
    } else if (formData.concussionDiagnosed === 'Deferred') {
      filledCount += setRadioButtonByValue(form, 'Concussion diagnosed', '/Deferred')
    }

    // ==================== PAGE 9: HCP ATTESTATION ====================
    filledCount += setTextField(form, 'Text91', formData.hcpName)         // WAS Text88
    filledCount += setTextField(form, 'Text92', formData.hcpTitle)        // WAS Text89
    filledCount += setTextField(form, 'Text93', formData.hcpRegistration) // WAS Text90
    filledCount += setTextField(form, 'Text94a', formData.hcpDate)        // WAS Text91

    // ==================== PAGE 9: CLINICAL NOTES ====================
    filledCount += setTextField(form, 'Text94', formData.additionalClinicalNotes) // WAS Text93

    console.log(`\u2713 Filled ${filledCount} fields successfully`)

    // Save with updateFieldAppearances: false to skip rich text field processing
    const pdfBytes = await pdfDoc.save({
      useObjectStreams: false,
      updateFieldAppearances: false
    })

    const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)

    console.log('\u2713 PDF exported successfully!')
  } catch (error: any) {
    console.error('PDF export failed:', error)
    alert(`PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    throw error
  }
}

// ==================== HELPER FUNCTIONS ====================

function setTextField(form: any, fieldName: string, value: string | number): number {
  try {
    if (value === undefined || value === null || value === '') return 0

    const field = form.getTextField(fieldName)
    field.setText(String(value))
    console.log(`\u2713 ${fieldName} = "${value}"`)
    return 1
  } catch (error: any) {
    if (error?.message?.includes('rich text')) {
      console.log(`\u2298 ${fieldName}: Rich text field (not supported by pdf-lib)`)
    } else {
      console.log(`\u2717 ${fieldName}: ${error?.message || 'field not found'}`)
    }
    return 0
  }
}

function setCheckBox(form: any, fieldName: string, value: boolean): number {
  try {
    if (value === undefined || value === null) return 0

    try {
      const field = form.getCheckBox(fieldName)
      if (value) {
        field.check()
      } else {
        field.uncheck()
      }
      console.log(`\u2713 ${fieldName} = ${value}`)
      return 1
    } catch (e) {
      const field = form.getButton(fieldName)
      field.select(value ? '/1' : '/0')
      console.log(`\u2713 ${fieldName} = ${value}`)
      return 1
    }
  } catch (error) {
    console.log(`\u2717 ${fieldName}: ${(error as any)?.message || 'not found'}`)
    return 0
  }
}

/**
 * Set a symptom radio button (0-6 scale).
 * The PDF radio buttons use /{value} format.
 */
function setSymptomRadio(form: any, fieldName: string, value: number): number {
  try {
    if (value === undefined || value === null) return 0

    const field = form.getRadioGroup(fieldName)
    field.select(`/${value}`)
    console.log(`\u2713 ${fieldName} = ${value}`)
    return 1
  } catch (error) {
    // Fallback: try as button
    try {
      const field = form.getButton(fieldName)
      field.select(`/${value}`)
      console.log(`\u2713 ${fieldName} = ${value} (button fallback)`)
      return 1
    } catch (e) {
      console.log(`\u2717 ${fieldName}: ${(error as any)?.message || 'not found'}`)
      return 0
    }
  }
}

function setRadioButtonByValue(form: any, fieldName: string, value: string): number {
  try {
    if (!value || value === '') return 0

    // Try as radio group first
    try {
      const field = form.getRadioGroup(fieldName)
      field.select(value)
      console.log(`\u2713 ${fieldName} = ${value}`)
      return 1
    } catch (e) {
      // Fallback to button
      const field = form.getButton(fieldName)
      field.select(value)
      console.log(`\u2713 ${fieldName} = ${value} (button fallback)`)
      return 1
    }
  } catch (error) {
    console.log(`\u2717 ${fieldName}: ${(error as any)?.message || 'not found'}`)
    return 0
  }
}
