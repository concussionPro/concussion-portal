import { PDFDocument } from 'pdf-lib'
import { SCOAT6FormData } from '../types/scoat6.types'

export async function exportSCOAT6ToFilledPDF(
  formData: SCOAT6FormData,
  filename: string = 'SCOAT6_Filled.pdf'
) {
  try {
    console.clear()
    console.log('%c=== SCOAT6 PDF EXPORT - DEBUG MODE ===', 'background: purple; color: white; font-size: 20px; padding: 10px;')
    console.log('%cIf you see this, the new code is running', 'background: green; color: white; padding: 5px;')
    console.log('Form data:', formData)

    // Load the blank fillable PDF
    const response = await fetch('/docs/SCOAT6_Fillable.pdf')
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
    fields.forEach((field, index) => {
      const name = field.getName()
      const type = field.constructor.name
      console.log(`${index + 1}. "${name}" (${type})`)
    })

    console.log('\n=== Attempting to fill fields ===')

    // Fill in Demographics
    setTextFieldIfExists(form, 'athleteName', formData.athleteName)
    setTextFieldIfExists(form, 'idNumber', formData.idNumber)
    setTextFieldIfExists(form, 'dateOfBirth', formData.dateOfBirth)
    setTextFieldIfExists(form, 'age', formData.age)
    setTextFieldIfExists(form, 'sex', formData.sex)
    setTextFieldIfExists(form, 'dominantHand', formData.dominantHand)
    setTextFieldIfExists(form, 'sportTeamSchool', formData.sportTeamSchool)
    setTextFieldIfExists(form, 'yearsEducation', formData.yearsEducation)
    setTextFieldIfExists(form, 'firstLanguage', formData.firstLanguage)
    setTextFieldIfExists(form, 'preferredLanguage', formData.preferredLanguage)
    setTextFieldIfExists(form, 'dateOfExamination', formData.dateOfExamination)
    setTextFieldIfExists(form, 'clinician', formData.clinician)

    // Current Injury
    setTextFieldIfExists(form, 'removalFromPlay', formData.removalFromPlay)
    setTextFieldIfExists(form, 'continuedToPlayMinutes', formData.continuedToPlayMinutes)
    setTextFieldIfExists(form, 'dateOfInjury', formData.dateOfInjury)
    setTextFieldIfExists(form, 'injuryDescription', formData.injuryDescription)
    setTextFieldIfExists(form, 'dateSymptomsFirstAppeared', formData.dateSymptomsFirstAppeared)
    setTextFieldIfExists(form, 'dateSymptomsFirstReported', formData.dateSymptomsFirstReported)

    // Disorders
    setCheckBoxIfExists(form, 'migraine', formData.disorders.migraine.checked)
    setTextFieldIfExists(form, 'migraineYear', formData.disorders.migraine.yearDiagnosed)
    setTextFieldIfExists(form, 'migraineManagement', formData.disorders.migraine.management)

    setCheckBoxIfExists(form, 'chronicHeadache', formData.disorders.chronicHeadache.checked)
    setTextFieldIfExists(form, 'chronicHeadacheYear', formData.disorders.chronicHeadache.yearDiagnosed)
    setTextFieldIfExists(form, 'chronicHeadacheManagement', formData.disorders.chronicHeadache.management)

    setCheckBoxIfExists(form, 'depression', formData.disorders.depression.checked)
    setTextFieldIfExists(form, 'depressionYear', formData.disorders.depression.yearDiagnosed)
    setTextFieldIfExists(form, 'depressionManagement', formData.disorders.depression.management)

    setCheckBoxIfExists(form, 'anxiety', formData.disorders.anxiety.checked)
    setTextFieldIfExists(form, 'anxietyYear', formData.disorders.anxiety.yearDiagnosed)
    setTextFieldIfExists(form, 'anxietyManagement', formData.disorders.anxiety.management)

    setCheckBoxIfExists(form, 'adhd', formData.disorders.adhd.checked)
    setTextFieldIfExists(form, 'adhdYear', formData.disorders.adhd.yearDiagnosed)
    setTextFieldIfExists(form, 'adhdManagement', formData.disorders.adhd.management)

    setCheckBoxIfExists(form, 'learningDisorder', formData.disorders.learningDisorder.checked)
    setTextFieldIfExists(form, 'learningDisorderYear', formData.disorders.learningDisorder.yearDiagnosed)
    setTextFieldIfExists(form, 'learningDisorderManagement', formData.disorders.learningDisorder.management)

    // Symptoms - Current consultation (consult1)
    setTextFieldIfExists(form, 'headaches', formData.symptoms.headaches.consult1.toString())
    setTextFieldIfExists(form, 'pressureInHead', formData.symptoms.pressureInHead.consult1.toString())
    setTextFieldIfExists(form, 'neckPain', formData.symptoms.neckPain.consult1.toString())
    setTextFieldIfExists(form, 'nauseaVomiting', formData.symptoms.nauseaVomiting.consult1.toString())
    setTextFieldIfExists(form, 'dizziness', formData.symptoms.dizziness.consult1.toString())
    setTextFieldIfExists(form, 'blurredVision', formData.symptoms.blurredVision.consult1.toString())
    setTextFieldIfExists(form, 'balanceProblems', formData.symptoms.balanceProblems.consult1.toString())
    setTextFieldIfExists(form, 'sensitivityLight', formData.symptoms.sensitivityLight.consult1.toString())
    setTextFieldIfExists(form, 'sensitivityNoise', formData.symptoms.sensitivityNoise.consult1.toString())
    setTextFieldIfExists(form, 'feelingSlowedDown', formData.symptoms.feelingSlowedDown.consult1.toString())
    setTextFieldIfExists(form, 'feelingInFog', formData.symptoms.feelingInFog.consult1.toString())
    setTextFieldIfExists(form, 'difficultyConcentrating', formData.symptoms.difficultyConcentrating.consult1.toString())
    setTextFieldIfExists(form, 'difficultyRemembering', formData.symptoms.difficultyRemembering.consult1.toString())
    setTextFieldIfExists(form, 'fatigueOrLowEnergy', formData.symptoms.fatigueOrLowEnergy.consult1.toString())
    setTextFieldIfExists(form, 'confusion', formData.symptoms.confusion.consult1.toString())
    setTextFieldIfExists(form, 'drowsiness', formData.symptoms.drowsiness.consult1.toString())
    setTextFieldIfExists(form, 'moreEmotional', formData.symptoms.moreEmotional.consult1.toString())
    setTextFieldIfExists(form, 'irritability', formData.symptoms.irritability.consult1.toString())
    setTextFieldIfExists(form, 'sadness', formData.symptoms.sadness.consult1.toString())
    setTextFieldIfExists(form, 'nervousAnxious', formData.symptoms.nervousAnxious.consult1.toString())
    setTextFieldIfExists(form, 'sleepDisturbance', formData.symptoms.sleepDisturbance.consult1.toString())

    setTextFieldIfExists(form, 'percentOfNormal', formData.percentOfNormal)

    // Cognitive Tests
    setTextFieldIfExists(form, 'wordListUsed', formData.wordListUsed)
    setTextFieldIfExists(form, 'immediateMemoryTimeCompleted', formData.immediateMemoryTimeCompleted)
    setTextFieldIfExists(form, 'digitListUsed', formData.digitListUsed)
    setTextFieldIfExists(form, 'digitsBackward', formData.digitsBackward.toString())
    setTextFieldIfExists(form, 'monthsReverseTime', formData.monthsReverseTime)
    setTextFieldIfExists(form, 'monthsReverseErrors', formData.monthsReverseErrors.toString())

    // Balance
    setTextFieldIfExists(form, 'footTested', formData.footTested)
    setTextFieldIfExists(form, 'mBessDoubleErrors', formData.mBessDoubleErrors.toString())
    setTextFieldIfExists(form, 'mBessTandemErrors', formData.mBessTandemErrors.toString())
    setTextFieldIfExists(form, 'mBessSingleErrors', formData.mBessSingleErrors.toString())

    // Tandem Gait
    setTextFieldIfExists(form, 'tandemGaitTrial1', formData.tandemGaitTrial1)
    setTextFieldIfExists(form, 'tandemGaitTrial2', formData.tandemGaitTrial2)
    setTextFieldIfExists(form, 'tandemGaitTrial3', formData.tandemGaitTrial3)

    // Delayed Recall
    setTextFieldIfExists(form, 'delayedRecallStartTime', formData.delayedRecallStartTime)

    // Note: Not flattening form so users can manually edit if field names don't match exactly

    const pdfBytes = await pdfDoc.save()
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)

    console.log('SCOAT6 PDF filled and downloaded successfully')
  } catch (error) {
    console.error('SCOAT6 PDF fill failed:', error)
    throw new Error(`Failed to fill PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Helper functions
function setTextFieldIfExists(form: any, fieldName: string, value: string | number) {
  try {
    const field = form.getTextField(fieldName)
    if (field && value !== undefined && value !== null && value !== '') {
      field.setText(String(value))
    }
  } catch (error) {
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
    console.log(`Checkbox not found: ${fieldName}`)
  }
}
