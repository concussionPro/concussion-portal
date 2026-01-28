import { PDFDocument } from 'pdf-lib'
import { SCAT6FormData } from '../types/scat6.types'

export async function exportSCAT6ToFilledPDF(
  formData: SCAT6FormData,
  filename: string = 'SCAT6_Filled.pdf'
) {
  try {
    console.log('=== SCAT6 PDF Export Started ===')
    console.log('Form data:', formData)

    // Load the blank fillable PDF
    const response = await fetch('/docs/SCAT6_Fillable.pdf')
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    console.log('PDF loaded, size:', arrayBuffer.byteLength, 'bytes')

    const pdfDoc = await PDFDocument.load(arrayBuffer)
    console.log('PDF parsed successfully')

    const form = pdfDoc.getForm()
    const fields = form.getFields()

    console.log('=== PDF FORM FIELDS ===')
    console.log(`Total fields: ${fields.length}`)

    // Log ALL field names
    const fieldNames: string[] = []
    fields.forEach((field, index) => {
      const name = field.getName()
      const type = field.constructor.name
      console.log(`${index + 1}. "${name}" (${type})`)
      fieldNames.push(name)
    })

    console.log('\n=== Attempting to fill fields ===')

    // Fill in the form fields - Demographics
    setTextFieldIfExists(form, 'athleteName', formData.athleteName)
    setTextFieldIfExists(form, 'idNumber', formData.idNumber)
    setTextFieldIfExists(form, 'dateOfBirth', formData.dateOfBirth)
    setTextFieldIfExists(form, 'dateOfExamination', formData.dateOfExamination)
    setTextFieldIfExists(form, 'dateOfInjury', formData.dateOfInjury)
    setTextFieldIfExists(form, 'timeOfInjury', formData.timeOfInjury)
    setTextFieldIfExists(form, 'sex', formData.sex)
    setTextFieldIfExists(form, 'dominantHand', formData.dominantHand)
    setTextFieldIfExists(form, 'sportTeamSchool', formData.sportTeamSchool)
    setTextFieldIfExists(form, 'currentYear', formData.currentYear)
    setTextFieldIfExists(form, 'yearsEducation', formData.yearsEducation)
    setTextFieldIfExists(form, 'firstLanguage', formData.firstLanguage)
    setTextFieldIfExists(form, 'preferredLanguage', formData.preferredLanguage)
    setTextFieldIfExists(form, 'examiner', formData.examiner)

    // Concussion History
    setTextFieldIfExists(form, 'previousConcussions', formData.previousConcussions)
    setTextFieldIfExists(form, 'mostRecentConcussion', formData.mostRecentConcussion)
    setTextFieldIfExists(form, 'primarySymptoms', formData.primarySymptoms)
    setTextFieldIfExists(form, 'recoveryTime', formData.recoveryTime)

    // Athlete Background
    setCheckBoxIfExists(form, 'hospitalizedForHeadInjury', formData.hospitalizedForHeadInjury)
    setCheckBoxIfExists(form, 'headacheDisorder', formData.headacheDisorder)
    setCheckBoxIfExists(form, 'learningDisability', formData.learningDisability)
    setCheckBoxIfExists(form, 'adhd', formData.adhd)
    setCheckBoxIfExists(form, 'psychologicalDisorder', formData.psychologicalDisorder)
    setTextFieldIfExists(form, 'athleteBackgroundNotes', formData.athleteBackgroundNotes)
    setTextFieldIfExists(form, 'currentMedications', formData.currentMedications)

    // Symptoms (22 items, rated 0-6)
    setTextFieldIfExists(form, 'headaches', formData.symptoms.headaches.toString())
    setTextFieldIfExists(form, 'pressureInHead', formData.symptoms.pressureInHead.toString())
    setTextFieldIfExists(form, 'neckPain', formData.symptoms.neckPain.toString())
    setTextFieldIfExists(form, 'nauseaVomiting', formData.symptoms.nauseaVomiting.toString())
    setTextFieldIfExists(form, 'dizziness', formData.symptoms.dizziness.toString())
    setTextFieldIfExists(form, 'blurredVision', formData.symptoms.blurredVision.toString())
    setTextFieldIfExists(form, 'balanceProblems', formData.symptoms.balanceProblems.toString())
    setTextFieldIfExists(form, 'sensitivityLight', formData.symptoms.sensitivityLight.toString())
    setTextFieldIfExists(form, 'sensitivityNoise', formData.symptoms.sensitivityNoise.toString())
    setTextFieldIfExists(form, 'feelingSlowedDown', formData.symptoms.feelingSlowedDown.toString())
    setTextFieldIfExists(form, 'feelingInFog', formData.symptoms.feelingInFog.toString())
    setTextFieldIfExists(form, 'dontFeelRight', formData.symptoms.dontFeelRight.toString())
    setTextFieldIfExists(form, 'difficultyConcentrating', formData.symptoms.difficultyConcentrating.toString())
    setTextFieldIfExists(form, 'difficultyRemembering', formData.symptoms.difficultyRemembering.toString())
    setTextFieldIfExists(form, 'fatigueOrLowEnergy', formData.symptoms.fatigueOrLowEnergy.toString())
    setTextFieldIfExists(form, 'confusion', formData.symptoms.confusion.toString())
    setTextFieldIfExists(form, 'drowsiness', formData.symptoms.drowsiness.toString())
    setTextFieldIfExists(form, 'moreEmotional', formData.symptoms.moreEmotional.toString())
    setTextFieldIfExists(form, 'irritability', formData.symptoms.irritability.toString())
    setTextFieldIfExists(form, 'sadness', formData.symptoms.sadness.toString())
    setTextFieldIfExists(form, 'nervousAnxious', formData.symptoms.nervousAnxious.toString())
    setTextFieldIfExists(form, 'troubleFallingAsleep', formData.symptoms.troubleFallingAsleep.toString())

    setTextFieldIfExists(form, 'percentOfNormal', formData.percentOfNormal)
    setTextFieldIfExists(form, 'whyNotHundredPercent', formData.whyNotHundredPercent)

    // Cognitive - Orientation
    setCheckBoxIfExists(form, 'orientationMonth', formData.orientationMonth)
    setCheckBoxIfExists(form, 'orientationDate', formData.orientationDate)
    setCheckBoxIfExists(form, 'orientationDayOfWeek', formData.orientationDayOfWeek)
    setCheckBoxIfExists(form, 'orientationYear', formData.orientationYear)
    setCheckBoxIfExists(form, 'orientationTime', formData.orientationTime)

    // Word list and immediate memory
    setTextFieldIfExists(form, 'wordListUsed', formData.wordListUsed)

    // Balance - mBESS
    setTextFieldIfExists(form, 'footTested', formData.footTested)
    setTextFieldIfExists(form, 'testingSurface', formData.testingSurface)
    setTextFieldIfExists(form, 'footwear', formData.footwear)
    setTextFieldIfExists(form, 'mBessDoubleErrors', formData.mBessDoubleErrors.toString())
    setTextFieldIfExists(form, 'mBessTandemErrors', formData.mBessTandemErrors.toString())
    setTextFieldIfExists(form, 'mBessSingleErrors', formData.mBessSingleErrors.toString())

    // Tandem Gait
    setTextFieldIfExists(form, 'tandemGaitTrial1', formData.tandemGaitTrial1)
    setTextFieldIfExists(form, 'tandemGaitTrial2', formData.tandemGaitTrial2)
    setTextFieldIfExists(form, 'tandemGaitTrial3', formData.tandemGaitTrial3)

    // Delayed Recall
    setTextFieldIfExists(form, 'delayedRecallStartTime', formData.delayedRecallStartTime)

    // Different from usual
    setTextFieldIfExists(form, 'differentFromUsualDescription', formData.differentFromUsualDescription)

    // Note: Not flattening form so users can manually edit if field names don't match exactly

    console.log('\n=== Saving PDF ===')
    // Save and download
    const pdfBytes = await pdfDoc.save()
    console.log('PDF saved, size:', pdfBytes.length, 'bytes')

    const blob = new Blob([pdfBytes], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)

    console.log('✓ PDF downloaded successfully:', filename)
    console.log('\n=== IMPORTANT ===')
    console.log('Check the console logs above to see:')
    console.log('1. All available PDF field names')
    console.log('2. Which fields were successfully filled (✓)')
    console.log('3. Which fields failed to fill (✗)')
    console.log('4. Which fields were skipped (⊘ - no data provided)')
    console.log('\nIf the PDF is blank, the field names in the PDF don\'t match our code.')
    console.log('Share the field names list above so we can create accurate mappings.')
  } catch (error) {
    console.error('PDF fill failed:', error)
    throw new Error(`Failed to fill PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Helper functions to safely set fields with verbose logging
function setTextFieldIfExists(form: any, fieldName: string, value: string | number) {
  try {
    if (value === undefined || value === null || value === '') {
      console.log(`⊘ Skipping "${fieldName}" - no value provided`)
      return
    }

    const field = form.getTextField(fieldName)
    field.setText(String(value))
    console.log(`✓ Set "${fieldName}" = "${value}"`)
  } catch (error) {
    console.error(`✗ Failed to set "${fieldName}":`, error instanceof Error ? error.message : error)
  }
}

function setCheckBoxIfExists(form: any, fieldName: string, value: boolean) {
  try {
    if (value === undefined || value === null) {
      console.log(`⊘ Skipping "${fieldName}" - no value provided`)
      return
    }

    const field = form.getCheckBox(fieldName)
    if (value) {
      field.check()
      console.log(`✓ Checked "${fieldName}"`)
    } else {
      field.uncheck()
      console.log(`✓ Unchecked "${fieldName}"`)
    }
  } catch (error) {
    console.error(`✗ Failed to set checkbox "${fieldName}":`, error instanceof Error ? error.message : error)
  }
}
