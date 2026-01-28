// Script to inspect PDF form fields
const fs = require('fs')
const { PDFDocument } = require('pdf-lib')

async function inspectPDF(pdfPath, formName) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`${formName} - Form Fields`)
  console.log('='.repeat(60))

  try {
    const pdfBytes = fs.readFileSync(pdfPath)
    const pdfDoc = await PDFDocument.load(pdfBytes)
    const form = pdfDoc.getForm()
    const fields = form.getFields()

    console.log(`\nTotal Fields: ${fields.length}\n`)

    fields.forEach((field, index) => {
      const name = field.getName()
      const type = field.constructor.name
      console.log(`${index + 1}. ${name} (${type})`)
    })

    console.log(`\nTotal: ${fields.length} fields`)
  } catch (error) {
    console.error(`Error inspecting ${formName}:`, error.message)
  }
}

async function main() {
  const scat6Path = '/Users/zaclewis/ConcussionPro/portal/public/docs/SCAT6_Fillable.pdf'
  const scoat6Path = '/Users/zaclewis/ConcussionPro/portal/public/docs/SCOAT6_Fillable.pdf'

  await inspectPDF(scat6Path, 'SCAT6')
  await inspectPDF(scoat6Path, 'SCOAT6')
}

main()
