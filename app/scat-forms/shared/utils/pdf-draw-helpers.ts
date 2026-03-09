import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb, RGB } from 'pdf-lib'

// Standard colors
export const BLACK = rgb(0, 0, 0)
export const DARK_GRAY = rgb(0.2, 0.2, 0.2)

export interface DrawTextOptions {
  font?: PDFFont
  size?: number
  color?: RGB
  maxWidth?: number
}

/**
 * Draw text at exact coordinates on a PDF page.
 * Coordinates use pdf-lib convention: origin at bottom-left.
 */
export function drawText(
  page: PDFPage,
  x: number,
  y: number,
  text: string,
  options: DrawTextOptions = {}
) {
  if (!text && text !== '0') return
  const { font, size = 9, color = BLACK, maxWidth } = options

  const drawOptions: any = { x, y, size, color }
  if (font) drawOptions.font = font
  if (maxWidth) drawOptions.maxWidth = maxWidth

  page.drawText(String(text), drawOptions)
}

/**
 * Draw text centered within a box region.
 */
export function drawTextCentered(
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  text: string,
  options: DrawTextOptions = {}
) {
  if (!text && text !== '0') return
  const { font, size = 9, color = BLACK } = options

  let textWidth = text.length * size * 0.5 // rough estimate
  if (font) {
    textWidth = font.widthOfTextAtSize(String(text), size)
  }

  const centeredX = x + (width - textWidth) / 2
  page.drawText(String(text), { x: centeredX, y, size, color, font })
}

/**
 * Draw a checkmark (tick) at coordinates.
 */
export function drawCheckmark(
  page: PDFPage,
  x: number,
  y: number,
  size: number = 10
) {
  // Draw a simple checkmark using two lines
  const s = size * 0.8
  page.drawLine({
    start: { x: x, y: y + s * 0.4 },
    end: { x: x + s * 0.35, y: y },
    thickness: 1.5,
    color: BLACK,
  })
  page.drawLine({
    start: { x: x + s * 0.35, y: y },
    end: { x: x + s, y: y + s * 0.8 },
    thickness: 1.5,
    color: BLACK,
  })
}

/**
 * Draw a cross (X) mark at coordinates.
 */
export function drawCross(
  page: PDFPage,
  x: number,
  y: number,
  size: number = 8
) {
  page.drawLine({
    start: { x, y },
    end: { x: x + size, y: y + size },
    thickness: 1.5,
    color: BLACK,
  })
  page.drawLine({
    start: { x: x + size, y },
    end: { x, y: y + size },
    thickness: 1.5,
    color: BLACK,
  })
}

/**
 * Draw a filled circle to mark a selected radio/option.
 */
export function drawFilledCircle(
  page: PDFPage,
  x: number,
  y: number,
  radius: number = 3.5,
  color: RGB = BLACK
) {
  page.drawCircle({
    x,
    y,
    size: radius,
    color,
    borderWidth: 0,
  })
}

/**
 * Draw a circle outline around a selected option.
 */
export function drawCircleOutline(
  page: PDFPage,
  x: number,
  y: number,
  radius: number = 6,
  color: RGB = rgb(0, 0, 0)
) {
  page.drawCircle({
    x,
    y,
    size: radius,
    borderColor: color,
    borderWidth: 1.5,
    opacity: 0,
  })
}

/**
 * Embed Helvetica and Helvetica-Bold fonts for consistent rendering.
 */
export async function embedStandardFonts(pdfDoc: PDFDocument) {
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  return { font, fontBold }
}

/**
 * Draw multi-line text that wraps at maxWidth.
 * Returns the y position after the last line.
 */
export function drawWrappedText(
  page: PDFPage,
  x: number,
  y: number,
  text: string,
  maxWidth: number,
  options: DrawTextOptions = {}
): number {
  if (!text) return y
  const { font, size = 9, color = BLACK } = options
  const lineHeight = size * 1.3

  const words = text.split(' ')
  let line = ''
  let currentY = y

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word
    let testWidth = testLine.length * size * 0.5
    if (font) {
      testWidth = font.widthOfTextAtSize(testLine, size)
    }

    if (testWidth > maxWidth && line) {
      page.drawText(line, { x, y: currentY, size, color, font })
      currentY -= lineHeight
      line = word
    } else {
      line = testLine
    }
  }

  if (line) {
    page.drawText(line, { x, y: currentY, size, color, font })
    currentY -= lineHeight
  }

  return currentY
}

/**
 * Helper to draw Y/N value as text.
 */
export function drawYesNo(
  page: PDFPage,
  yesX: number,
  noX: number,
  y: number,
  value: boolean | null,
  font: PDFFont,
  size: number = 9
) {
  if (value === null || value === undefined) return
  if (value) {
    drawFilledCircle(page, yesX, y + 3, 3.5)
  } else {
    drawFilledCircle(page, noX, y + 3, 3.5)
  }
}

/**
 * Load a flat PDF from a URL path, returning PDFDocument ready for drawing.
 */
export async function loadFlatPDF(pdfPath: string): Promise<PDFDocument> {
  const response = await fetch(pdfPath)
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.status}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return PDFDocument.load(arrayBuffer, {
    ignoreEncryption: true,
    throwOnInvalidObject: false,
  })
}

/**
 * Save PDF and trigger download.
 */
export async function savePDFAndDownload(
  pdfDoc: PDFDocument,
  filename: string
) {
  const pdfBytes = await pdfDoc.save({ useObjectStreams: false })
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
