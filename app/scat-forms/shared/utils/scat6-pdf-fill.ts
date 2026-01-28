import { PDFDocument } from 'pdf-lib'
import { SCAT6FormData } from '../types/scat6.types'

export async function exportSCAT6ToFilledPDF(
  formData: SCAT6FormData,
  filename: string = 'SCAT6_Filled.pdf'
) {
  try {
    console.clear()
    console.log('%c=== SCAT6 PDF EXPORT - CORRECT FIELD MAPPING ===', 'background: green; color: white; font-size: 20px; padding: 10px;')

    // Load the blank fillable PDF
    const response = await fetch('/docs/SCAT6_Fillable.pdf')
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer)
    const form = pdfDoc.getForm()

    console.log('PDF loaded, filling fields with correct mapping...')

    // Demographics - Using actual PDF field names (Text1, Text2, etc.)
    setTextField(form, 'Text1', formData.athleteName)
    setTextField(form, 'Text2', formData.idNumber)
    setTextField(form, 'Text3', formData.dateOfBirth)
    setTextField(form, 'Text4', formData.dateOfExamination)
    setTextField(form, 'Text5', formData.dateOfInjury)
    setTextField(form, 'Text6', formData.timeOfInjury)
    setTextField(form, 'Text7', formData.sportTeamSchool)
    setTextField(form, 'Text8', formData.currentYear)
    setTextField(form, 'Text9', formData.yearsEducation)
    setTextField(form, 'Text10', formData.firstLanguage)
    setTextField(form, 'Text11', formData.preferredLanguage)
    setTextField(form, 'Text12', formData.examiner)
    setTextField(form, 'Text13', formData.dominantHand)

    // Concussion History
    setTextField(form, 'Text14', formData.previousConcussions)
    setTextField(form, 'Text15', formData.mostRecentConcussion)
    setTextField(form, 'Text16', formData.primarySymptoms)
    setTextField(form, 'Text17', formData.recoveryTime)

    // Athlete Background
    setCheckBox(form, 'Check Box1', formData.hospitalizedForHeadInjury)
    setCheckBox(form, 'Check Box2', formData.headacheDisorder)
    setCheckBox(form, 'Check Box3', formData.learningDisability)
    setCheckBox(form, 'Check Box4', formData.adhd)
    setCheckBox(form, 'Check Box5', formData.psychologicalDisorder)
    setTextField(form, 'Text18', formData.athleteBackgroundNotes)
    setTextField(form, 'Text19', formData.currentMedications)

    // Symptoms - Radio buttons (s1-s22) with values 0-6
    setRadioButton(form, 's1', formData.symptoms.headaches)
    setRadioButton(form, 's2', formData.symptoms.pressureInHead)
    setRadioButton(form, 's3', formData.symptoms.neckPain)
    setRadioButton(form, 's4', formData.symptoms.nauseaVomiting)
    setRadioButton(form, 's5', formData.symptoms.dizziness)
    setRadioButton(form, 's6', formData.symptoms.blurredVision)
    setRadioButton(form, 's7', formData.symptoms.balanceProblems)
    setRadioButton(form, 's8', formData.symptoms.sensitivityLight)
    setRadioButton(form, 's9', formData.symptoms.sensitivityNoise)
    setRadioButton(form, 's10', formData.symptoms.feelingSlowedDown)
    setRadioButton(form, 's11', formData.symptoms.feelingInFog)
    setRadioButton(form, 's12', formData.symptoms.dontFeelRight)
    setRadioButton(form, 's13', formData.symptoms.difficultyConcentrating)
    setRadioButton(form, 's14', formData.symptoms.difficultyRemembering)
    setRadioButton(form, 's15', formData.symptoms.fatigueOrLowEnergy)
    setRadioButton(form, 's16', formData.symptoms.confusion)
    setRadioButton(form, 's17', formData.symptoms.drowsiness)
    setRadioButton(form, 's18', formData.symptoms.moreEmotional)
    setRadioButton(form, 's19', formData.symptoms.irritability)
    setRadioButton(form, 's20', formData.symptoms.sadness)
    setRadioButton(form, 's21', formData.symptoms.nervousAnxious)
    setRadioButton(form, 's22', formData.symptoms.troubleFallingAsleep)

    setTextField(form, 'Text26', formData.percentOfNormal)

    // Orientation checkboxes (ori1-ori5)
    setCheckBox(form, 'ori1', formData.orientationMonth)
    setCheckBox(form, 'ori2', formData.orientationDate)
    setCheckBox(form, 'ori3', formData.orientationDayOfWeek)
    setCheckBox(form, 'ori4', formData.orientationYear)
    setCheckBox(form, 'ori5', formData.orientationTime)

    // Immediate Memory Trials (Tri1a-j, Tri2a-j, Tri3a-j)
    const trial1Fields = ['Tri1a', 'Tri1b', 'Tri1c', 'Tri1d', 'Tri1e', 'Tri1f', 'Tri1g', 'Tri1h', 'Tri1i', 'Tri1j']
    const trial2Fields = ['Tri2a', 'Tri2b', 'Tri2c', 'Tri2d', 'Tri2e', 'Tri2f', 'Tri2g', 'Tri2h', 'Tri2i', 'Tri2j']
    const trial3Fields = ['Tri3a', 'Tri3b', 'Tri3c', 'Tri3d', 'Tri3e', 'Tri3f', 'Tri3g', 'Tri3h', 'Tri3i', 'Tri3j']

    formData.immediateMemoryTrial1.forEach((checked, i) => {
      if (trial1Fields[i]) setCheckBox(form, trial1Fields[i], checked)
    })
    formData.immediateMemoryTrial2.forEach((checked, i) => {
      if (trial2Fields[i]) setCheckBox(form, trial2Fields[i], checked)
    })
    formData.immediateMemoryTrial3.forEach((checked, i) => {
      if (trial3Fields[i]) setCheckBox(form, trial3Fields[i], checked)
    })

    // Balance - mBESS
    setTextField(form, 'Text37', formData.mBessDoubleErrors.toString())
    setTextField(form, 'Text38', formData.mBessTandemErrors.toString())
    setTextField(form, 'Text39', formData.mBessSingleErrors.toString())
    setTextField(form, 'Text40', formData.testingSurface)
    setTextField(form, 'Text41', formData.footwear)

    // Tandem Gait
    setTextField(form, 'Text42', formData.tandemGaitTrial1)
    setTextField(form, 'Text43', formData.tandemGaitTrial2)
    setTextField(form, 'Text44', formData.tandemGaitTrial3)

    // Delayed Recall
    setTextField(form, 'Text87', formData.differentFromUsualDescription)

    // Save and download
    const pdfBytes = await pdfDoc.save()
    const blob = new Blob([pdfBytes.buffer], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)

    console.log('✓ PDF exported successfully with data!')
  } catch (error) {
    console.error('PDF export failed:', error)
    throw new Error(`Failed to fill PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

function setTextField(form: any, fieldName: string, value: string | number) {
  try {
    if (value === undefined || value === null || value === '') return

    const field = form.getTextField(fieldName)
    field.setText(String(value))
    console.log(`✓ ${fieldName} = "${value}"`)
  } catch (error) {
    // Field doesn't exist - skip silently
  }
}

function setCheckBox(form: any, fieldName: string, value: boolean) {
  try {
    if (value === undefined || value === null) return

    const field = form.getCheckBox(fieldName)
    if (value) {
      field.check()
    } else {
      field.uncheck()
    }
    console.log(`✓ ${fieldName} = ${value}`)
  } catch (error) {
    // Field doesn't exist - skip silently
  }
}

function setRadioButton(form: any, fieldName: string, value: number) {
  try {
    if (value === undefined || value === null) return

    // Radio buttons in pdf-lib are button fields with options
    const field = form.getButton(fieldName)

    // Get all options for this radio group
    const options = field.acroField.getOnValues()

    // Find the option that matches our value (0-6)
    const targetValue = value.toString()
    if (options.includes(targetValue)) {
      field.select(targetValue)
      console.log(`✓ ${fieldName} = ${value}`)
    } else {
      // Try common radio value formats
      const alternateFormats = [`${value}`, `Choice${value}`, `Option${value}`, `${value}.0`]
      for (const format of alternateFormats) {
        if (options.includes(format)) {
          field.select(format)
          console.log(`✓ ${fieldName} = ${value} (as ${format})`)
          return
        }
      }
      console.log(`○ ${fieldName}: value ${value} not in options [${options.join(', ')}]`)
    }
  } catch (error) {
    // Field doesn't exist or isn't a button - skip silently
    console.log(`○ ${fieldName}: ${error}`)
  }
}
