'use client'

import { Rocket, CheckSquare, Play, Download } from 'lucide-react'

interface ApplyTomorrowItem {
  action: string
  description: string
  type: 'checklist' | 'demo' | 'both'
}

export function ApplyTomorrow({ moduleId }: { moduleId: number }) {
  const actionsByModule: Record<number, ApplyTomorrowItem[]> = {
    1: [
      {
        action: 'Identify rotational vs. linear forces',
        description: 'When taking patient history, ask about mechanism of injury to determine force type',
        type: 'checklist'
      },
      {
        action: 'Explain the energy crisis',
        description: 'Use this simple explanation with patients: "Your brain needs more energy to heal, but has less blood flow - that\'s why rest is critical"',
        type: 'checklist'
      },
      {
        action: 'Screen for risk factors',
        description: 'Check previous concussion history, age, and genetic factors',
        type: 'checklist'
      }
    ],
    2: [
      {
        action: 'Use this 2-minute SCAT6 screening',
        description: 'Rapid sideline assessment protocol with red flag identification',
        type: 'both'
      },
      {
        action: 'Test cranial nerves systematically',
        description: 'Use the rapid verbal screen: smell, vision, hearing changes?',
        type: 'demo'
      },
      {
        action: 'Apply VOMS protocol',
        description: 'Screen for vestibular-ocular dysfunction in subacute patients',
        type: 'both'
      }
    ],
    3: [
      {
        action: 'Follow acute management checklist',
        description: 'First 72-hour protocol: relative rest, symptom monitoring, graduated activity',
        type: 'checklist'
      },
      {
        action: 'Give patient handout',
        description: 'Evidence-based patient education reduces anxiety and improves compliance',
        type: 'checklist'
      }
    ],
    4: [
      {
        action: 'Use PCS differential diagnosis tree',
        description: 'Distinguish true PCS from cervicogenic, vestibular, and mood disorders',
        type: 'checklist'
      },
      {
        action: 'Know when to refer',
        description: 'Red flags for specialist referral at 4-week mark',
        type: 'checklist'
      }
    ],
    5: [
      {
        action: 'Map your multidisciplinary team',
        description: 'Who do you refer to for vestibular? Ocular-motor? Mood?',
        type: 'checklist'
      }
    ],
    6: [
      {
        action: 'Apply graduated RTP protocol',
        description: '6-stage progression with 24-hour observation between stages',
        type: 'both'
      },
      {
        action: 'Provide school accommodation guide',
        description: 'Give this to parents/teachers for return-to-learn support',
        type: 'checklist'
      }
    ],
    7: [
      {
        action: 'Identify symptom phenotype',
        description: 'Use assessment tool to determine dominant cluster',
        type: 'checklist'
      },
      {
        action: 'Apply phenotype-specific protocol',
        description: 'Target treatment to vestibular, cervicogenic, or ocular-motor dysfunction',
        type: 'demo'
      }
    ],
    8: [
      {
        action: 'Use documentation template',
        description: 'AHPRA-compliant progress notes protect you legally',
        type: 'checklist'
      },
      {
        action: 'Script difficult conversations',
        description: 'How to discuss RTP with pushy coaches or worried parents',
        type: 'checklist'
      }
    ]
  }

  const actions = actionsByModule[moduleId] || []

  if (actions.length === 0) return null

  const handleChecklistClick = () => {
    alert('Downloading checklist... (This will download the actual PDF in production)')
  }

  const handleDemoClick = () => {
    alert('Opening demonstration video... (This will play the actual video in production)')
  }

  return (
    <div className="bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 rounded-2xl border-2 border-teal-300 p-8 my-6">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-md animate-pulse">
          <Rocket className="w-6 h-6 text-white" strokeWidth={2} />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-slate-900 mb-2">Use This Tomorrow</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Tomorrow, when you see your next concussion patient, apply these evidence-based techniques immediately.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {actions.map((item, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-5 border-2 border-teal-200 hover:border-teal-400 transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                <div className="w-6 h-6 rounded-md bg-teal-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-teal-700">{index + 1}</span>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-base font-bold text-slate-900 mb-2 group-hover:text-teal-700 transition-colors">
                  {item.action}
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed mb-3">
                  {item.description}
                </p>
                <div className="flex gap-2">
                  {(item.type === 'checklist' || item.type === 'both') && (
                    <button
                      onClick={handleChecklistClick}
                      className="flex items-center gap-2 px-4 py-2 bg-teal-100 hover:bg-teal-200 text-teal-700 rounded-lg text-xs font-semibold transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Checklist
                    </button>
                  )}
                  {(item.type === 'demo' || item.type === 'both') && (
                    <button
                      onClick={handleDemoClick}
                      className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border-2 border-teal-200 text-teal-700 rounded-lg text-xs font-semibold transition-all"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Watch Demo
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-teal-200">
        <p className="text-xs text-slate-600 leading-relaxed">
          <span className="font-semibold">Clinical Integration Tip:</span> Start with one technique per week. Master it, then add the next. This builds sustainable clinical habits.
        </p>
      </div>
    </div>
  )
}
