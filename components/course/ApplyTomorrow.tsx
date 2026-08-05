'use client'

import { Rocket, CheckSquare } from 'lucide-react'
import type { CourseKey } from '@/hooks/useModuleData'

interface ApplyTomorrowItem {
  action: string
  description: string
}

/** Flagship (CCM) per-module practice actions. */
const FLAGSHIP_ACTIONS: Record<number, ApplyTomorrowItem[]> = {
  1: [
    {
      action: 'Identify rotational vs. linear forces',
      description: 'When taking patient history, ask about mechanism of injury to determine force type',
    },
    {
      action: 'Explain the energy crisis',
      description: 'Use this simple explanation with patients: "Your brain needs more energy to heal, but has less blood flow - that\'s why rest is critical"',
    },
    {
      action: 'Screen for risk factors',
      description: 'Check previous concussion history, age, and genetic factors',
    }
  ],
  2: [
    {
      action: 'Use this 2-minute SCAT6 screening',
      description: 'Rapid sideline assessment protocol with red flag identification',
    },
    {
      action: 'Test cranial nerves systematically',
      description: 'Use the rapid verbal screen: smell, vision, hearing changes?',
    },
    {
      action: 'Apply VOMS protocol',
      description: 'Screen for vestibular-ocular dysfunction in subacute patients',
    }
  ],
  3: [
    {
      action: 'Follow acute management checklist',
      description: 'First 72-hour protocol: relative rest, symptom monitoring, graduated activity',
    },
    {
      action: 'Give patient handout',
      description: 'Evidence-based patient education reduces anxiety and improves compliance',
    }
  ],
  4: [
    {
      action: 'Use PCS differential diagnosis tree',
      description: 'Distinguish true PCS from cervicogenic, vestibular, and mood disorders',
    },
    {
      action: 'Know when to refer',
      description: 'Red flags for specialist referral at 4-week mark',
    }
  ],
  5: [
    {
      action: 'Map your multidisciplinary team',
      description: 'Who do you refer to for vestibular? Ocular-motor? Mood?',
    }
  ],
  6: [
    {
      action: 'Apply graduated RTP protocol',
      description: '6-stage progression with 24-hour observation between stages',
    },
    {
      action: 'Provide school accommodation guide',
      description: 'Give this to parents/teachers for return-to-learn support',
    }
  ],
  7: [
    {
      action: 'Identify symptom phenotype',
      description: 'Use assessment tool to determine dominant cluster',
    },
    {
      action: 'Apply phenotype-specific protocol',
      description: 'Target treatment to vestibular, cervicogenic, or ocular-motor dysfunction',
    }
  ],
  8: [
    {
      action: 'Use documentation template',
      description: 'AHPRA-aligned progress notes protect you legally',
    },
    {
      action: 'Script difficult conversations',
      description: 'How to discuss RTP with pushy coaches or worried parents',
    }
  ]
}

/**
 * EP course (CRM) per-module practice actions — CONTENT NOT YET AUTHORED.
 *
 * This map is deliberately empty rather than filled with CCM-derived text: the
 * actions are clinical instructions in AEP scope and must be written by the
 * course author, not inferred. While a module has no entry the player omits
 * its "Apply Tomorrow" step entirely (see hasApplyTomorrow below), so an empty
 * map costs the buyer nothing — it is not a blank panel.
 *
 * TO POPULATE: add `N: [{ action, description }, …]` for EP display ids 1-8.
 * Keep every action inside AEP scope (implement / monitor / progress /
 * recommend — never diagnose, never medically clear for return to contact).
 */
const EP_ACTIONS: Record<number, ApplyTomorrowItem[]> = {}

const ACTIONS_BY_COURSE: Record<CourseKey, Record<number, ApplyTomorrowItem[]>> = {
  flagship: FLAGSHIP_ACTIONS,
  ep: EP_ACTIONS,
}

/**
 * Does this (course, module) have practice actions? The player calls this so a
 * module with none never gets an empty "Apply Tomorrow" step in the stepper.
 */
export function hasApplyTomorrow(course: CourseKey, moduleId: number): boolean {
  return (ACTIONS_BY_COURSE[course]?.[moduleId]?.length ?? 0) > 0
}

export function ApplyTomorrow({ moduleId, course = 'flagship' }: { moduleId: number; course?: CourseKey }) {
  const actions = ACTIONS_BY_COURSE[course]?.[moduleId] || []

  if (actions.length === 0) return null

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
