import { PDFDocument } from 'pdf-lib'

export async function inspectPDFFields(pdfPath: string) {
  try {
    const response = await fetch(pdfPath)
    const arrayBuffer = await response.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer)
    const form = pdfDoc.getForm()
    const fields = form.getFields()

    const fieldInfo: any[] = []
    fields.forEach((field, index) => {
      const name = field.getName()
      const type = field.constructor.name
      fieldInfo.push({ index: index + 1, name, type })
    })

    return fieldInfo
  } catch (error) {
    console.error('Failed to inspect PDF:', error)
    throw error
  }
}
