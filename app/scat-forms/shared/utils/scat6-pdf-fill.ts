import { PDFDocument, PDFTextField, PDFCheckBox } from 'pdf-lib'
import { SCAT6FormData } from '../types/scat6.types'

export async function exportSCAT6ToFilledPDF(
  formData: SCAT6FormData,
  filename: string = 'SCAT6_Filled.pdf'
) {
  try {
    // Load the blank fillable PDF
    const response = await fetch('/docs/SCAT6_Fillable.pdf')
    const arrayBuffer = await response.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer)

    const form = pdfDoc.getForm()
    const fields = form.getFields()

    // Log field names for debugging (can remove later)
    console.log('PDF has', fields.length, 'form fields')
    fields.forEach(field => {
      console.log('Field:', field.getName(), 'Type:', field.constructor.name)
    })

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

    // Save and download
    const pdfBytes = await pdfDoc.save()
    const blob = new Blob([pdfBytes], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)

    console.log('PDF filled and downloaded successfully')
  } catch (error) {
    console.error('PDF fill failed:', error)
    throw new Error(`Failed to fill PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Helper functions to safely set fields
function setTextFieldIfExists(form: any, fieldName: string, value: string | number) {
  try {
    const field = form.getTextField(fieldName)
    if (field && value !== undefined && value !== null && value !== '') {
      field.setText(String(value))
    }
  } catch (error) {
    // Field doesn't exist or isn't a text field - silently skip
    console.log(`Field not found or not text: ${fieldName}`)
  }
}

function setCheckBoxIfExists(form: any, fieldName: string, value: boolean) {
  try {
    const field = form.getCheckBox(fieldName)
    if (field && value !== undefined && value !== null) {
      if (value) {
        field.check()
      } else {
        field.uncheck()
      }
    }
  } catch (error) {
    // Field doesn't exist or isn't a checkbox - silently skip
    console.log(`Checkbox not found: ${fieldName}`)
  }
}
