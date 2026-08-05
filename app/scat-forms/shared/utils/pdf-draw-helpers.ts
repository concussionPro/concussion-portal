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
 * ============================================================================
 * "NOT ADMINISTERED" MARKER
 * ============================================================================
 *
 * Every boolean in the SCAT/SCOAT form models defaults to `false` and every
 * numeric to `0`. That makes "the clinician never ran this subtest" and "the
 * clinician ran this subtest and the athlete scored zero" IDENTICAL in the
 * data. Drawing the raw default therefore fabricates a clinical finding — an
 * exported record can simultaneously assert profound impairment (orientation
 * 0/5, immediate memory 0/30) and perfect normality (mBESS 0 errors of 30).
 *
 * The exporters must therefore decide, per scored section, whether it was
 * administered (see `anyProvided` below) and:
 *   - administered      -> draw the real value, INCLUDING a genuine 0
 *   - not administered  -> draw NO item circles and put this marker in the
 *                          score box instead of a number
 *
 * `drawText` intentionally still prints '0' (see its guard) — genuine zeros
 * are legitimate clinical findings. Suppression is the CALLER's job.
 */
const NOT_ADMINISTERED_EM_DASH = '—' // em dash
const NOT_ADMINISTERED_ASCII = '-'

/**
 * Resolve the marker glyph for a font. Standard-14 fonts are WinAnsi-encoded
 * and do carry the em dash, but a custom/subsetted font may not — fall back to
 * a plain hyphen rather than throwing mid-export.
 */
export function notAdministeredMark(font?: PDFFont): string {
  if (!font) return NOT_ADMINISTERED_ASCII
  try {
    font.encodeText(NOT_ADMINISTERED_EM_DASH)
    return NOT_ADMINISTERED_EM_DASH
  } catch {
    return NOT_ADMINISTERED_ASCII
  }
}

/**
 * Draw the not-administered marker in a score box.
 */
export function drawNotAdministered(
  page: PDFPage,
  x: number,
  y: number,
  options: DrawTextOptions = {}
) {
  drawText(page, x, y, notAdministeredMark(options.font), options)
}

/**
 * "Did anything in this section differ from its default?"
 *
 * Default-detection rules (matching the `getDefault*FormData()` initialisers):
 *   - boolean          -> `true` counts as provided
 *   - number           -> any non-zero counts as provided
 *   - string           -> any non-blank counts as provided
 *   - null / undefined -> never counts
 *
 * NOTE: a nullable number where 0 is meaningful (e.g. `dualTask1Errors`) must
 * be tested with an explicit `!== null` check, not with this helper.
 */
export function anyProvided(
  ...values: Array<boolean | number | string | null | undefined>
): boolean {
  return values.some(v => {
    if (v === null || v === undefined) return false
    if (typeof v === 'boolean') return v
    if (typeof v === 'number') return Number.isFinite(v) && v !== 0
    return v.trim() !== ''
  })
}

/**
 * Draw text at exact coordinates on a PDF page.
 * Coordinates use pdf-lib convention: origin at bottom-left.
 *
 * A literal '0' IS printed — a real 0/5 orientation is a legitimate clinical
 * finding. Callers are responsible for not calling this for a section that was
 * never administered (use `drawNotAdministered` instead).
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

  const drawOptions: Parameters<PDFPage['drawText']>[1] = { x, y, size, color }
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
