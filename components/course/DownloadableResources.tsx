'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Download, FileText, CheckSquare, FileCheck, Users, ExternalLink } from 'lucide-react'
import type { CourseKey } from '@/hooks/useModuleData'

interface Resource {
  title: string
  description: string
  fileSize: string
  /** Binary served by the authed /api/download route (flagship). */
  downloadUrl?: string
  /**
   * In-portal document opened in place instead of downloaded (EP course).
   * The EP deliverables are gated, printable pages at
   * /ep-course/documents/[slug] — "Print / Save as PDF" produces the clinic
   * copy — not files on disk, so there is nothing for /api/download to serve
   * (and /api/download's entitlement is CCM-shaped: a CRM buyer carries
   * access_level 'preview' and would be refused).
   */
  openUrl?: string
  icon: 'pdf' | 'checklist' | 'protocol' | 'handout'
}

/**
 * Flagship (CCM) module resources — real binaries in public/docs, served by
 * the authed /api/download route.
 */
const FLAGSHIP_RESOURCES: Record<number, Resource[]> = {
  1: [
    {
      title: 'Concussion Clinical Cheat Sheet',
      description: '1-page clinical reference for concussion assessment and management',
      fileSize: 'PDF',
      downloadUrl: '/api/download?file=Concussion Clinical Cheat Sheet.pdf',
      icon: 'pdf'
    },
    {
      title: 'Concussion Myth-Buster Sheet',
      description: 'Common misconceptions debunked with evidence-based corrections',
      fileSize: 'PDF',
      downloadUrl: '/api/download?file=Concussion Myth-Buster Sheet.pdf',
      icon: 'checklist'
    }
  ],
  2: [
    {
      title: 'SCAT6 Fillable PDF',
      description: 'Official SCAT6 form — fillable and printable',
      fileSize: 'PDF',
      downloadUrl: '/api/download?file=SCAT6_Fillable.pdf',
      icon: 'pdf'
    },
    {
      title: 'SCOAT6 Fillable PDF',
      description: 'Official SCOAT6 form — fillable and printable',
      fileSize: 'PDF',
      downloadUrl: '/api/download?file=SCOAT6_Fillable.pdf',
      icon: 'pdf'
    },
    {
      title: 'SCAT/SCOAT Fillable PDFs (ZIP)',
      description: 'All SCAT and SCOAT forms bundled in a single download',
      fileSize: 'ZIP',
      downloadUrl: '/api/download?file=SCAT-SCOAT_FillablePDFs.zip',
      icon: 'checklist'
    }
  ],
  3: [
    {
      title: '"What to Expect After a Concussion"',
      description: 'Patient education handout — plain-language guidance for the first weeks',
      fileSize: 'PDF',
      downloadUrl: '/api/download?file=What to Expect After a Concussion.pdf',
      icon: 'handout'
    }
  ],
  4: [
    {
      title: 'PCS Clinical Flowchart',
      description: 'Post-Concussion Syndrome decision tree for persistent symptoms',
      fileSize: 'PDF',
      downloadUrl: '/api/download?file=Post-Concussion Syndrome (PCS) Clinical Flowchart.pdf',
      icon: 'protocol'
    }
  ],
  5: [
    {
      title: 'Referral Flowchart',
      description: 'When and who to refer to — specialist referral decision aid',
      fileSize: 'PDF',
      downloadUrl: '/api/download?file=Referral Flowchart.pdf',
      icon: 'protocol'
    }
  ],
  6: [
    {
      title: 'Return-to-Play & Return-to-Learn Progression Ladder',
      description: 'Graduated RTP and RTL stages with progression criteria',
      fileSize: 'PDF',
      downloadUrl: '/api/download?file=Return-to-Play (RTP) & Return-to-Learn (RTL) Progression Ladder.pdf',
      icon: 'protocol'
    },
    {
      title: 'Return-to-School Plan Template',
      description: 'Editable school accommodation plan template',
      fileSize: 'DOCX',
      downloadUrl: '/api/download?file=Return-to-School Plan Template (DOCX).docx',
      icon: 'handout'
    }
  ],
  7: [
    {
      title: 'Rehabilitation Flowchart',
      description: 'Visual rehabilitation pathway for concussion recovery',
      fileSize: 'PNG',
      downloadUrl: '/api/download?file=RehabFlow.png',
      icon: 'protocol'
    }
  ],
  8: [
    {
      title: 'Employer / School Letter Template',
      description: 'Editable letter template for employers and schools',
      fileSize: 'DOCX',
      downloadUrl: '/api/download?file=Employer _ School Letter Template.docx',
      icon: 'handout'
    },
    {
      title: 'Email Template Pack',
      description: 'Pre-written email templates for patient communication',
      fileSize: 'DOCX',
      downloadUrl: '/api/download?file=Email Template Pack.docx',
      icon: 'handout'
    }
  ]
}

/**
 * EP course (CRM) module resources — the REAL gated deliverables that already
 * exist for this course (data/ep-documents.ts), attached to the module each
 * one was derived from (see that file's header: module 3 → BCTT, module 4 →
 * SSTAE prescription/stop rule/progression, module 5 → phenotype library,
 * module 8 → the four EP-scope administrative documents).
 *
 * Modules with no matching document simply have no Resources step — the
 * virtual section is suppressed rather than rendering an empty panel. Adding
 * one is a single entry here plus the document in data/ep-documents.ts.
 */
const EP_RESOURCES: Record<number, Resource[]> = {
  3: [
    {
      title: 'Buffalo Concussion Treadmill Test — Recording Sheet',
      description: 'Contraindication screen, Balke-based protocol, per-minute HR/RPE/symptom log and the HRt capture',
      fileSize: 'Printable',
      openUrl: '/ep-course/documents/bctt-testing-sheet',
      icon: 'checklist'
    }
  ],
  4: [
    {
      title: 'Sub-Symptom-Threshold Aerobic Exercise (SSTAE) Prescription',
      description: 'Turns the HRt into an individualised FITT prescription with the training band and stop rule',
      fileSize: 'Printable',
      openUrl: '/ep-course/documents/sstae-prescription',
      icon: 'protocol'
    },
    {
      title: 'Session & Progression Tracking Sheet',
      description: 'Per-session log of HR response, pre/post symptom score, RPE, duration and adherence',
      fileSize: 'Printable',
      openUrl: '/ep-course/documents/session-tracking-sheet',
      icon: 'checklist'
    },
    {
      title: 'Progression & Stop-Criteria Quick Reference',
      description: 'One-page decision aid: within-session stop rule, next-day flare rule, progress/hold/regress/escalate',
      fileSize: 'Printable',
      openUrl: '/ep-course/documents/progression-stop-criteria',
      icon: 'protocol'
    }
  ],
  5: [
    {
      title: 'Phenotype Exercise Library (EP Scope)',
      description: 'Dosed, progressable vestibular, cervical and oculomotor sets with refer-out boundaries',
      fileSize: 'Printable',
      openUrl: '/ep-course/documents/phenotype-exercise-library',
      icon: 'protocol'
    }
  ],
  8: [
    {
      title: 'GP / Referrer Letter',
      description: 'Closes the loop with the referring clinician — findings, prescription, response, recommendation',
      fileSize: 'Printable',
      openUrl: '/ep-course/documents/gp-referrer-letter',
      icon: 'handout'
    },
    {
      title: 'Return-to-Activity Progress Note',
      description: 'Scope-appropriate progress note for the graded return to activity',
      fileSize: 'Printable',
      openUrl: '/ep-course/documents/return-to-activity-note',
      icon: 'handout'
    },
    {
      title: 'NDIS Allied Health Progress Report',
      description: 'Funding-body report template in EP scope language',
      fileSize: 'Printable',
      openUrl: '/ep-course/documents/ndis-progress-report',
      icon: 'handout'
    },
    {
      title: 'WorkCover / CTP Progress Report',
      description: 'Insurer progress report template in EP scope language',
      fileSize: 'Printable',
      openUrl: '/ep-course/documents/workcover-ctp-report',
      icon: 'handout'
    }
  ]
}

const RESOURCES_BY_COURSE: Record<CourseKey, Record<number, Resource[]>> = {
  flagship: FLAGSHIP_RESOURCES,
  ep: EP_RESOURCES,
}

/**
 * Does this (course, module) have any resources? The player calls this so a
 * module with none never gets an empty "Downloadable Resources" step in the
 * section stepper.
 */
export function hasDownloadableResources(course: CourseKey, moduleId: number): boolean {
  return (RESOURCES_BY_COURSE[course]?.[moduleId]?.length ?? 0) > 0
}

export function DownloadableResources({ moduleId, course = 'flagship' }: { moduleId: number; course?: CourseKey }) {
  const [downloadError, setDownloadError] = useState('')
  const iconMap = {
    pdf: FileText,
    checklist: CheckSquare,
    protocol: FileCheck,
    handout: Users
  }

  const resources = RESOURCES_BY_COURSE[course]?.[moduleId] || []

  if (resources.length === 0) return null

  const handleDownload = async (url: string, title: string) => {
    try {
      // All downloads go through authenticated /api/download route
      const urlObj = new URL(url, window.location.origin)
      const fileName = urlObj.searchParams.get('file') || urlObj.pathname.split('/').pop() || title

      const response = await fetch(url, { credentials: 'include' })

      if (!response.ok) {
        throw new Error('Download failed')
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()

      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch {
      setDownloadError(`Failed to download ${title}. Please try again or contact support.`)
      setTimeout(() => setDownloadError(''), 5000)
    }
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border-2 border-slate-200 p-8 my-6">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-md">
          <Download className="w-6 h-6 text-white" strokeWidth={2} />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-slate-900 mb-2">Downloadable Resources</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            {course === 'ep'
              ? 'Open these clinical tools and use them immediately with your patients — each one is a printable sheet (Print / Save as PDF) written to Accredited Exercise Physiologist scope.'
              : 'Print these clinical tools and use them immediately with your patients. All resources are AHPRA-aligned.'}
          </p>
        </div>
      </div>

      {downloadError && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">{downloadError}</div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {resources.map((resource, index) => {
          const Icon = iconMap[resource.icon]
          const cardClass = "bg-white rounded-xl p-5 border-2 border-slate-200 hover:border-blue-300 transition-all group cursor-pointer"
          const ActionIcon = resource.openUrl ? ExternalLink : Download
          const body = (
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                <Icon className="w-5 h-5 text-blue-600" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                  {resource.title}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-2">
                  {resource.description}
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">{resource.fileSize}</span>
                  <div className="flex items-center gap-1 text-blue-600 group-hover:gap-2 transition-all">
                    <ActionIcon className="w-3.5 h-3.5" strokeWidth={2} />
                    <span className="text-xs font-semibold">{resource.openUrl ? 'Open & print' : 'Download'}</span>
                  </div>
                </div>
              </div>
            </div>
          )

          // In-portal printable document (EP) — a real navigation, so it is a
          // link (middle-click / open-in-new-tab keep working), not a blob
          // fetch.
          if (resource.openUrl) {
            return (
              <Link key={index} href={resource.openUrl} className={`${cardClass} block`}>
                {body}
              </Link>
            )
          }

          const downloadUrl = resource.downloadUrl
          if (!downloadUrl) return null

          return (
            <div
              key={index}
              role="button"
              tabIndex={0}
              className={cardClass}
              onClick={() => handleDownload(downloadUrl, resource.title)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleDownload(downloadUrl, resource.title) } }}
            >
              {body}
            </div>
          )
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-slate-200">
        <p className="text-xs text-slate-500 leading-relaxed">
          <span className="font-semibold">Tip:</span>{' '}
          {course === 'ep'
            ? 'Every template above also lives in the Clinical Toolkit, so you can reach it mid-consult without opening the module.'
            : 'Print the laminated card resources and keep them in your clinic for quick reference during patient consultations.'}
        </p>
      </div>
    </div>
  )
}
