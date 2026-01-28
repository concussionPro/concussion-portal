// Simplified PDF export for SCAT6 - downloads the blank fillable PDF
// TODO: Add field mapping once type definitions are verified

import { SCAT6FormData } from '../types/scat6.types'

export async function exportSCAT6ToFilledPDF(
  formData: SCAT6FormData,
  filename: string = 'SCAT6_Blank.pdf'
) {
  try {
    // For now, just download the blank fillable PDF
    // User can fill it manually until we fix the field mappings
    const response = await fetch('/docs/SCAT6_Fillable.pdf')
    const blob = await response.blob()

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('PDF download failed:', error)
    throw new Error('Failed to download PDF')
  }
}
