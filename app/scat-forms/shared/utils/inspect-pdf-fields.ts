import { PDFDocument } from 'pdf-lib'

export async function inspectPDFFields(pdfPath: string) {
  try {
    const response = await fetch(pdfPath)
    const arrayBuffer = await response.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer)
    const form = pdfDoc.getForm()
    const fields = form.getFields()

    console.log('=== PDF FIELD INSPECTION ===')
    console.log(`Total fields: ${fields.length}`)
    console.log('Field details:')

    const fieldInfo: any[] = []
    fields.forEach((field, index) => {
      const name = field.getName()
      const type = field.constructor.name
      console.log(`${index + 1}. "${name}" - Type: ${type}`)
      fieldInfo.push({ index: index + 1, name, type })
    })

    return fieldInfo
  } catch (error) {
    console.error('Failed to inspect PDF:', error)
    throw error
  }
}
