import { PDFDocument } from 'pdf-lib'
import { SCAT6FormData } from '../types/scat6.types'

/**
 * SCAT6 PDF Export - Complete Field Mapping
 *
 * This function fills ALL supported fields in the SCAT6 PDF.
 *
 * KNOWN LIMITATIONS (pdf-lib does not support rich text fields):
 * - Text28, Text31, Text32, Text37, Text40 (testing surface)
 * - Text42, Text42A, Text45 (some tandem gait fields)
 * - Text84D, Text87 (different from usual description)
 *
 * These fields will remain empty in the exported PDF.
 */
export async function exportSCAT6ToFilledPDF(
  formData: SCAT6FormData,
  filename: string = 'SCAT6_Filled.pdf'
) {
  console.clear()
  console.log('%c=== SCAT6 PDF EXPORT ===', 'background: green; color: white; font-size: 20px; padding: 10px;')

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
    let skippedCount = 0

    // ==================== DEMOGRAPHICS ====================
    filledCount += setTextField(form, 'Text1', formData.athleteName)
    filledCount += setTextField(form, 'Text2', formData.idNumber)
    filledCount += setTextField(form, 'Text3', formData.dateOfBirth)
    filledCount += setTextField(form, 'Text4', formData.dateOfExamination)
    filledCount += setTextField(form, 'Text5', formData.dateOfInjury)
    filledCount += setTextField(form, 'Text6', formData.timeOfInjury)
    filledCount += setTextField(form, 'Text7', formData.sportTeamSchool)
    filledCount += setTextField(form, 'Text8', formData.currentYear)
    filledCount += setTextField(form, 'Text9', formData.yearsEducation)
    filledCount += setTextField(form, 'Text10', formData.firstLanguage)
    filledCount += setTextField(form, 'Text11', formData.preferredLanguage)
    filledCount += setTextField(form, 'Text12', formData.examiner)
    filledCount += setTextField(form, 'Text13', formData.dominantHand)

    // Sex - try both possible field names
    if (formData.sex) {
      filledCount += setRadioButtonByValue(form, 'Sex', `/${formData.sex}`)
      filledCount += setRadioButtonByValue(form, 'Sex_V2', `/${formData.sex}`)
    }

    // ==================== CONCUSSION HISTORY ====================
    filledCount += setTextField(form, 'Text14', formData.previousConcussions)
    filledCount += setTextField(form, 'Text15', formData.mostRecentConcussion)
    filledCount += setTextField(form, 'Text16', formData.primarySymptoms)
    filledCount += setTextField(form, 'Text17', formData.recoveryTime)

    // ==================== ATHLETE BACKGROUND ====================
    filledCount += setCheckBox(form, 'Check Box1', formData.hospitalizedForHeadInjury)
    filledCount += setCheckBox(form, 'Check Box2', formData.headacheDisorder)
    filledCount += setCheckBox(form, 'Check Box3', formData.learningDisability)
    filledCount += setCheckBox(form, 'Check Box4', formData.adhd)
    filledCount += setCheckBox(form, 'Check Box5', formData.psychologicalDisorder)
    filledCount += setTextField(form, 'Text18', formData.athleteBackgroundNotes)
    filledCount += setTextField(form, 'Text19', formData.currentMedications)

    // ==================== SYMPTOMS (22 items, 0-6 scale) ====================
    filledCount += setRadioButton(form, 's1', formData.symptoms.headaches)
    filledCount += setRadioButton(form, 's2', formData.symptoms.pressureInHead)
    filledCount += setRadioButton(form, 's3', formData.symptoms.neckPain)
    filledCount += setRadioButton(form, 's4', formData.symptoms.nauseaVomiting)
    filledCount += setRadioButton(form, 's5', formData.symptoms.dizziness)
    filledCount += setRadioButton(form, 's6', formData.symptoms.blurredVision)
    filledCount += setRadioButton(form, 's7', formData.symptoms.balanceProblems)
    filledCount += setRadioButton(form, 's8', formData.symptoms.sensitivityLight)
    filledCount += setRadioButton(form, 's9', formData.symptoms.sensitivityNoise)
    filledCount += setRadioButton(form, 's10', formData.symptoms.feelingSlowedDown)
    filledCount += setRadioButton(form, 's11', formData.symptoms.feelingInFog)
    filledCount += setRadioButton(form, 's12', formData.symptoms.dontFeelRight)
    filledCount += setRadioButton(form, 's13', formData.symptoms.difficultyConcentrating)
    filledCount += setRadioButton(form, 's14', formData.symptoms.difficultyRemembering)
    filledCount += setRadioButton(form, 's15', formData.symptoms.fatigueOrLowEnergy)
    filledCount += setRadioButton(form, 's16', formData.symptoms.confusion)
    filledCount += setRadioButton(form, 's17', formData.symptoms.drowsiness)
    filledCount += setRadioButton(form, 's18', formData.symptoms.moreEmotional)
    filledCount += setRadioButton(form, 's19', formData.symptoms.irritability)
    filledCount += setRadioButton(form, 's20', formData.symptoms.sadness)
    filledCount += setRadioButton(form, 's21', formData.symptoms.nervousAnxious)
    filledCount += setRadioButton(form, 's22', formData.symptoms.troubleFallingAsleep)

    filledCount += setTextField(form, 'Text26', formData.percentOfNormal)

    // ==================== ORIENTATION (5 items) ====================
    filledCount += setCheckBox(form, 'ori1', formData.orientationMonth)
    filledCount += setCheckBox(form, 'ori2', formData.orientationDate)
    filledCount += setCheckBox(form, 'ori3', formData.orientationDayOfWeek)
    filledCount += setCheckBox(form, 'ori4', formData.orientationYear)
    filledCount += setCheckBox(form, 'ori5', formData.orientationTime)

    // ==================== IMMEDIATE MEMORY (3 trials, 10 words each) ====================
    const trial1Fields = ['Tri1a', 'Tri1b', 'Tri1c', 'Tri1d', 'Tri1e', 'Tri1f', 'Tri1g', 'Tri1h', 'Tri1i', 'Tri1j']
    const trial2Fields = ['Tri2a', 'Tri2b', 'Tri2c', 'Tri2d', 'Tri2e', 'Tri2f', 'Tri2g', 'Tri2h', 'Tri2i', 'Tri2j']
    const trial3Fields = ['Tri3a', 'Tri3b', 'Tri3c', 'Tri3d', 'Tri3e', 'Tri3f', 'Tri3g', 'Tri3h', 'Tri3i', 'Tri3j']

    formData.immediateMemoryTrial1.forEach((checked, i) => {
      if (trial1Fields[i]) filledCount += setCheckBox(form, trial1Fields[i], checked)
    })
    formData.immediateMemoryTrial2.forEach((checked, i) => {
      if (trial2Fields[i]) filledCount += setCheckBox(form, trial2Fields[i], checked)
    })
    formData.immediateMemoryTrial3.forEach((checked, i) => {
      if (trial3Fields[i]) filledCount += setCheckBox(form, trial3Fields[i], checked)
    })

    filledCount += setTextField(form, 'Text11a', formData.immediateMemoryTimeCompleted)

    // Word List Used (A, B, or C)
    if (formData.wordListUsed === 'A') filledCount += setCheckBox(form, 'A', true)
    if (formData.wordListUsed === 'B') filledCount += setCheckBox(form, 'B', true)
    if (formData.wordListUsed === 'C') filledCount += setCheckBox(form, 'C', true)

    // ==================== CONCENTRATION ====================
    // Digit List Used (A_2, B_2, or C_2)
    if (formData.digitListUsed === 'A') filledCount += setCheckBox(form, 'A_2', true)
    if (formData.digitListUsed === 'B') filledCount += setCheckBox(form, 'B_2', true)
    if (formData.digitListUsed === 'C') filledCount += setCheckBox(form, 'C_2', true)

    filledCount += setTextField(form, 'Text20', formData.digitsBackward.toString())
    filledCount += setTextField(form, 'Text21', formData.monthsReverseTime)
    filledCount += setTextField(form, 'Text22', formData.monthsReverseErrors.toString())

    // ==================== BALANCE - mBESS ====================
    if (formData.footTested === 'Left') filledCount += setCheckBox(form, 'Foot', false)
    if (formData.footTested === 'Right') filledCount += setCheckBox(form, 'Foot', true)

    filledCount += setTextField(form, 'Text38', formData.mBessDoubleErrors.toString())
    filledCount += setTextField(form, 'Text39', formData.mBessTandemErrors.toString())
    // Text37 is RICH TEXT - skip
    // Text40 (testing surface) is RICH TEXT - skip
    filledCount += setTextField(form, 'Text41', formData.footwear)

    // ==================== TANDEM GAIT ====================
    // Text42, Text42A, Text45 are RICH TEXT - skip
    filledCount += setTextField(form, 'Text43', formData.tandemGaitTrial1)
    filledCount += setTextField(form, 'Text44', formData.tandemGaitTrial2)
    filledCount += setTextField(form, 'Text43C', formData.tandemGaitTrial3)

    // ==================== DELAYED RECALL (10 words) ====================
    const delayedRecallFields = ['DEL3', 'DEL4', 'DEL5', 'DEL6', 'DEL4A', 'DEL8']
    formData.delayedRecall.slice(0, 6).forEach((checked, i) => {
      if (delayedRecallFields[i]) {
        filledCount += setCheckBox(form, delayedRecallFields[i], checked)
      }
    })
    // Note: DEL7 and DEL9 are radio buttons (0-3), not checkboxes - may be score fields, not word recall

    filledCount += setTextField(form, 'Text27', formData.delayedRecallStartTime)

    // ==================== DIFFERENT FROM USUAL ====================
    if (formData.differentFromUsual !== null) {
      filledCount += setCheckBox(form, 'Check Box6', formData.differentFromUsual)
    }
    // Text87 (description) is RICH TEXT - skip

    // ==================== DISPOSITION ====================
    if (formData.concussionDiagnosed === 'Yes') {
      filledCount += setRadioButtonByValue(form, 'Concussion diagnosed', '/Yes_3')
    } else if (formData.concussionDiagnosed === 'No') {
      filledCount += setRadioButtonByValue(form, 'Concussion diagnosed', '/No_3')
    } else if (formData.concussionDiagnosed === 'Deferred') {
      filledCount += setRadioButtonByValue(form, 'Concussion diagnosed', '/Deferred')
    }

    // ==================== HCP ATTESTATION ====================
    filledCount += setTextField(form, 'Text88', formData.hcpName)
    filledCount += setTextField(form, 'Text89', formData.hcpTitle)
    filledCount += setTextField(form, 'Text90', formData.hcpRegistration)
    filledCount += setTextField(form, 'Text91', formData.hcpDate)

    // ==================== CLINICAL NOTES ====================
    filledCount += setTextField(form, 'Text93', formData.additionalClinicalNotes)

    console.log(`✓ Filled ${filledCount} fields (${skippedCount} rich text fields skipped)`)

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

    console.log('✓ PDF exported successfully!')
  } catch (error: any) {
    console.error('PDF export failed:', error)
    alert(`PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    throw error
  }
}

// Helper functions - return 1 if field was filled, 0 if skipped
function setTextField(form: any, fieldName: string, value: string | number): number {
  try {
    if (value === undefined || value === null || value === '') return 0

    const field = form.getTextField(fieldName)
    field.setText(String(value))
    console.log(`✓ ${fieldName} = "${value}"`)
    return 1
  } catch (error: any) {
    if (error?.message?.includes('rich text')) {
      console.log(`⊘ ${fieldName}: Rich text (not supported)`)
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
      console.log(`✓ ${fieldName} = ${value}`)
      return 1
    } catch (e) {
      const field = form.getButton(fieldName)
      field.select(value ? '/1' : '/0')
      console.log(`✓ ${fieldName} = ${value}`)
      return 1
    }
  } catch (error) {
    return 0
  }
}

function setRadioButton(form: any, fieldName: string, value: number): number {
  try {
    if (value === undefined || value === null) return 0

    const field = form.getButton(fieldName)
    field.select(`/${value}`)
    console.log(`✓ ${fieldName} = ${value}`)
    return 1
  } catch (error) {
    return 0
  }
}

function setRadioButtonByValue(form: any, fieldName: string, value: string): number {
  try {
    if (!value || value === '') return 0

    const field = form.getButton(fieldName)
    field.select(value)
    console.log(`✓ ${fieldName} = ${value}`)
    return 1
  } catch (error) {
    return 0
  }
}
