'use client'

import { Download, FileText, CheckSquare, FileCheck, Users } from 'lucide-react'

interface Resource {
  title: string
  description: string
  fileSize: string
  downloadUrl: string
  icon: 'pdf' | 'checklist' | 'protocol' | 'handout'
}

export function DownloadableResources({ moduleId }: { moduleId: number }) {
  const iconMap = {
    pdf: FileText,
    checklist: CheckSquare,
    protocol: FileCheck,
    handout: Users
  }

  // Module-specific resources
  const resourcesByModule: Record<number, Resource[]> = {
    1: [
      {
        title: 'Concussion Science Summary',
        description: '1-page visual summary of neurometabolic cascade and biomechanics',
        fileSize: '245 KB',
        downloadUrl: '/resources/module-1-summary.pdf',
        icon: 'pdf'
      },
      {
        title: 'Risk Factors Checklist',
        description: 'Assessment tool for identifying high-risk patients',
        fileSize: '180 KB',
        downloadUrl: '/resources/risk-factors-checklist.pdf',
        icon: 'checklist'
      }
    ],
    2: [
      {
        title: 'SCAT6 Quick Reference',
        description: 'Laminated card-ready SCAT6 scoring guide and red flags',
        fileSize: '420 KB',
        downloadUrl: '/resources/scat6-quick-reference.pdf',
        icon: 'pdf'
      },
      {
        title: 'VOMS Testing Protocol',
        description: 'Step-by-step VOMS administration with scoring criteria',
        fileSize: '315 KB',
        downloadUrl: '/resources/voms-protocol.pdf',
        icon: 'protocol'
      },
      {
        title: 'Cranial Nerve Exam Checklist',
        description: 'Systematic CN assessment for concussion patients',
        fileSize: '210 KB',
        downloadUrl: '/resources/cranial-nerve-checklist.pdf',
        icon: 'checklist'
      },
      {
        title: 'Red Flags Reference',
        description: 'Emergency referral criteria - clinic wall poster',
        fileSize: '290 KB',
        downloadUrl: '/resources/red-flags-poster.pdf',
        icon: 'pdf'
      }
    ],
    3: [
      {
        title: 'Acute Management Protocol',
        description: 'First 72-hour management flowchart',
        fileSize: '380 KB',
        downloadUrl: '/resources/acute-management-protocol.pdf',
        icon: 'protocol'
      },
      {
        title: 'Patient Education Handout',
        description: 'What to expect after concussion - patient-friendly',
        fileSize: '225 KB',
        downloadUrl: '/resources/patient-education-handout.pdf',
        icon: 'handout'
      }
    ],
    4: [
      {
        title: 'PCS Differential Diagnosis',
        description: 'Decision tree for persistent symptoms beyond 4 weeks',
        fileSize: '340 KB',
        downloadUrl: '/resources/pcs-differential-diagnosis.pdf',
        icon: 'protocol'
      },
      {
        title: 'Specialist Referral Criteria',
        description: 'When and who to refer to for complex cases',
        fileSize: '190 KB',
        downloadUrl: '/resources/specialist-referral-criteria.pdf',
        icon: 'checklist'
      }
    ],
    5: [
      {
        title: 'Multidisciplinary Care Map',
        description: 'Team roles and communication pathways',
        fileSize: '310 KB',
        downloadUrl: '/resources/multidisciplinary-care-map.pdf',
        icon: 'protocol'
      }
    ],
    6: [
      {
        title: 'Return-to-Play Protocol',
        description: 'Graduated RTP stages with progression criteria',
        fileSize: '405 KB',
        downloadUrl: '/resources/return-to-play-protocol.pdf',
        icon: 'protocol'
      },
      {
        title: 'Return-to-Learn Guidelines',
        description: 'School accommodation recommendations',
        fileSize: '265 KB',
        downloadUrl: '/resources/return-to-learn-guidelines.pdf',
        icon: 'handout'
      },
      {
        title: 'Workplace Return Checklist',
        description: 'Graduated return-to-work assessment tool',
        fileSize: '195 KB',
        downloadUrl: '/resources/workplace-return-checklist.pdf',
        icon: 'checklist'
      }
    ],
    7: [
      {
        title: 'Phenotype Assessment Tool',
        description: 'Identify dominant symptom clusters for targeted treatment',
        fileSize: '350 KB',
        downloadUrl: '/resources/phenotype-assessment-tool.pdf',
        icon: 'checklist'
      },
      {
        title: 'Rehabilitation Protocols by Phenotype',
        description: 'Evidence-based treatment protocols for each phenotype',
        fileSize: '520 KB',
        downloadUrl: '/resources/rehabilitation-protocols.pdf',
        icon: 'protocol'
      }
    ],
    8: [
      {
        title: 'Medical-Legal Documentation Template',
        description: 'AHPRA-compliant progress notes and clearance forms',
        fileSize: '280 KB',
        downloadUrl: '/resources/medico-legal-templates.pdf',
        icon: 'protocol'
      },
      {
        title: 'Informed Consent Scripts',
        description: 'Communication templates for RTP discussions',
        fileSize: '175 KB',
        downloadUrl: '/resources/informed-consent-scripts.pdf',
        icon: 'handout'
      }
    ]
  }

  const resources = resourcesByModule[moduleId] || []

  if (resources.length === 0) return null

  const handleDownload = (url: string, title: string) => {
    // In production, this would trigger actual file download
    // For now, show alert
    alert(`Download functionality will be implemented for: ${title}\n\nFile: ${url}`)
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
            Print these clinical tools and use them immediately with your patients. All resources are AHPRA-compliant.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {resources.map((resource, index) => {
          const Icon = iconMap[resource.icon]

          return (
            <div
              key={index}
              className="bg-white rounded-xl p-5 border-2 border-slate-200 hover:border-blue-300 transition-all group cursor-pointer"
              onClick={() => handleDownload(resource.downloadUrl, resource.title)}
            >
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
                      <Download className="w-3.5 h-3.5" strokeWidth={2} />
                      <span className="text-xs font-semibold">Download PDF</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-slate-200">
        <p className="text-xs text-slate-500 leading-relaxed">
          💡 <span className="font-semibold">Pro Tip:</span> Print the laminated card resources and keep them in your clinic for quick reference during patient consultations.
        </p>
      </div>
    </div>
  )
}
