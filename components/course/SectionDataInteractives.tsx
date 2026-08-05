'use client'

import {
  QuickCheck,
  MultiSelectQuiz,
  ClinicalInsight,
  KeyConcept,
  Flowchart,
  ClinicalScenario,
  OrderingExercise,
  MatchingExercise,
} from '@/components/course/InteractiveElements'
import type { SectionInteractive } from '@/data/modules'

/**
 * Renders the interactive elements a section carries as DATA
 * (Section.interactives — see data/modules.ts).
 *
 * Same widgets the flagship course uses; the difference is only where the
 * specs come from. Hardcoded JSX (SectionInteractiveElements.tsx) ships its
 * answer keys in a public client chunk; specs authored on the section travel
 * inside the entitlement-gated module payload instead.
 *
 * Unknown `kind` values render nothing rather than throwing — a content typo
 * must never white-screen a paid module.
 */
export function SectionDataInteractives({
  specs,
  isPreview,
}: {
  specs?: SectionInteractive[]
  isPreview?: boolean
}) {
  if (!specs || specs.length === 0) return null

  return (
    <>
      {specs.map((spec, i) => {
        switch (spec.kind) {
          case 'quick-check':
            return (
              <QuickCheck
                key={i}
                question={spec.question}
                options={spec.options}
                correctAnswer={spec.correctAnswer}
                explanation={spec.explanation}
              />
            )
          case 'multi-select':
            return (
              <MultiSelectQuiz
                key={i}
                question={spec.question}
                options={spec.options}
                correctAnswers={spec.correctAnswers}
                explanation={spec.explanation}
              />
            )
          case 'insight':
            return <ClinicalInsight key={i} title={spec.title} content={spec.content} type={spec.type} />
          case 'key-concept':
            return <KeyConcept key={i} title={spec.title} points={spec.points} content={spec.content} />
          case 'flowchart':
            return <Flowchart key={i} title={spec.title} steps={spec.steps} />
          case 'scenario':
            return (
              <ClinicalScenario
                key={i}
                title={spec.title}
                patientSummary={spec.patientSummary}
                steps={spec.steps}
                isPreview={isPreview}
              />
            )
          case 'ordering':
            return (
              <OrderingExercise
                key={i}
                title={spec.title}
                instruction={spec.instruction}
                items={spec.items}
                correctOrder={spec.correctOrder}
                explanation={spec.explanation}
              />
            )
          case 'matching':
            return (
              <MatchingExercise
                key={i}
                title={spec.title}
                instruction={spec.instruction}
                pairs={spec.pairs}
                leftLabel={spec.leftLabel}
                rightLabel={spec.rightLabel}
              />
            )
          default:
            return null
        }
      })}
    </>
  )
}
