import { NextRequest, NextResponse } from 'next/server'
import { verifyCertificate } from '@/lib/ai-course/certificate'
import { checkAiCourseAccess } from '@/lib/ai-course/access'
import { jsPDF } from 'jspdf'
import { CONFIG } from '@/lib/config'

/**
 * GET /api/ai-course/certificate/pdf/:id
 *
 * Admin-gated during preview. The certificate ID alone is no longer
 * enough — even a leaked URL doesn't expose the PDF. Once
 * AI_COURSE_PUBLIC=true, the bearer-token model resumes (high-entropy
 * ID guards guessing).
 */

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const access = await checkAiCourseAccess(request)
  if (!access.ok) {
    return NextResponse.json({ error: 'Admin key required during preview.' }, { status: 401 })
  }

  const { id } = await params
  if (!id || id.length < 8 || !/^[A-Za-z0-9_-]+$/.test(id)) {
    return NextResponse.json({ error: 'Invalid certificate ID' }, { status: 400 })
  }
  const cert = await verifyCertificate(id)
  if (!cert) {
    return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
  }

  const issuedDate = new Date(cert.issuedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
  const expiresDate = new Date(cert.expiresAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
  const verifyUrl = `${CONFIG.SEO.SITE_URL}/courses/ai-in-clinical-practice/verify/${cert.certificateId}`

  // A4 landscape, mm
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Decorative double border
  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.6)
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20)
  doc.setLineWidth(0.3)
  doc.rect(13, 13, pageWidth - 26, pageHeight - 26)

  // Top tag
  doc.setFontSize(9)
  doc.setTextColor(120, 120, 120)
  doc.text('CONCUSSION EDUCATION AUSTRALIA', pageWidth / 2, 30, { align: 'center' })

  doc.setFontSize(11)
  doc.text('Certificate of Completion', pageWidth / 2, 40, { align: 'center' })

  // Course title
  doc.setFontSize(28)
  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.text('AI in Clinical Practice', pageWidth / 2, 60, { align: 'center' })

  // Subtitle
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text(
    "Aligned with AHPRA's 2024 AI guidance, Australian Privacy Principles, and TGA Therapeutic Goods Advertising Code",
    pageWidth / 2,
    68,
    { align: 'center', maxWidth: pageWidth - 60 }
  )

  // Awarded to
  doc.setFontSize(10)
  doc.setTextColor(120, 120, 120)
  doc.text('Awarded to', pageWidth / 2, 90, { align: 'center' })

  doc.setFontSize(26)
  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.text(cert.name, pageWidth / 2, 105, { align: 'center' })

  // Three-column dates / ID
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120, 120, 120)
  const colY = 140
  doc.text('Issued', pageWidth / 4, colY, { align: 'center' })
  doc.text('Valid until', pageWidth / 2, colY, { align: 'center' })
  doc.text('Certificate ID', (3 * pageWidth) / 4, colY, { align: 'center' })

  doc.setFontSize(11)
  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.text(issuedDate, pageWidth / 4, colY + 6, { align: 'center' })
  doc.text(expiresDate, pageWidth / 2, colY + 6, { align: 'center' })
  doc.text(cert.certificateId.slice(0, 12), (3 * pageWidth) / 4, colY + 6, { align: 'center' })

  // Verification footer
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120, 120, 120)
  doc.text(`Verify at: ${verifyUrl}`, pageWidth / 2, pageHeight - 20, { align: 'center' })
  doc.setFontSize(7)
  doc.text(
    'This certificate is education for Australian registered health practitioners and does not replace legal or indemnity advice.',
    pageWidth / 2,
    pageHeight - 15,
    { align: 'center', maxWidth: pageWidth - 30 }
  )

  const buffer = Buffer.from(doc.output('arraybuffer'))
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="ai-in-clinical-practice-${cert.certificateId.slice(0, 8)}.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}
