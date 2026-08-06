/**
 * CRM (Concussion Rehab Mastery, for Exercise Physiologists) shipped as eight
 * modules of prose: 4 interactive elements against the flagship course's 152.
 * The teaching content that should have been testable was already written —
 * every module opens with MYTH statements it goes on to disprove, and the
 * sections carry worked sequences, phenotype tables and scope boundaries.
 *
 * data/ep-module-interactives.ts RETAGS that material as 157 widget specs,
 * attached to Section.interactives in data/ep-modules/index.ts and rendered by
 * the SHARED components/course/SectionDataInteractives.tsx — the same
 * components, and therefore the same design, as CCM. No EP variant of anything.
 *
 * These tests fail if that is undone. Client-chunk exposure is covered
 * separately, in tests/course-answer-key-exposure.test.ts.
 */
import { describe, it, expect } from 'vitest'
import { createHash } from 'node:crypto'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { SectionDataInteractives } from '@/components/course/SectionDataInteractives'
import { EP_MODULE_INTERACTIVES } from '@/data/ep-module-interactives'
import { getEpModules, getEpModuleById, EP_MODULE_ID_OFFSET } from '@/data/ep-modules'
import { getPreviewContent } from '@/lib/preview-content'

/**
 * SHA-256 of JSON.stringify(EP_MODULE_INTERACTIVES) — every question, option,
 * answer index, explanation, scenario branch and clinical-reasoning block, in
 * order.
 *
 * This is ESSA-accredited clinical material (No. PDNF26077). Every explanation
 * here was built from sentences copied VERBATIM out of data/ep-modules/*, and
 * every distractor is a misconception the course itself names. If this digest
 * moves, CLINICAL TEACHING CONTENT changed. That must be a deliberate, reviewed
 * edit — never a refactor side effect. Re-record it in the same commit as the
 * content change, not before.
 *
 * (Taken over the DATA, not rendered HTML: OrderingExercise and
 * MatchingExercise shuffle on mount by design, so markup is nondeterministic.)
 */
const EP_INTERACTIVES_DIGEST = '0e63ffa55ee365111a739e5eef0a7c30c6facdaa31e030254272214476f09d4a'

describe('the CRM interactives are pinned content', () => {
  it('every clinical string is unchanged', () => {
    const json = JSON.stringify(EP_MODULE_INTERACTIVES)
    expect(json.length).toBe(248040)
    expect(createHash('sha256').update(json).digest('hex')).toBe(EP_INTERACTIVES_DIGEST)
  })

  it('holds 157 widgets, in the recorded per-kind counts', () => {
    const all = Object.values(EP_MODULE_INTERACTIVES).flatMap((m) => Object.values(m).flat())
    expect(all.length).toBe(157)
    const byKind: Record<string, number> = {}
    for (const spec of all) byKind[spec.kind] = (byKind[spec.kind] ?? 0) + 1
    expect(byKind).toEqual({
      'quick-check': 90,
      'multi-select': 24,
      matching: 17,
      ordering: 9,
      scenario: 7,
      flowchart: 6,
      insight: 4,
    })
  })

  it('every data-authored key names a real section of that module', () => {
    // A typo'd section id renders NOTHING for a paying customer, silently.
    for (const [moduleId, sections] of Object.entries(EP_MODULE_INTERACTIVES)) {
      const epModule = getEpModuleById(Number(moduleId))
      expect(epModule, `EP module ${moduleId} exists`).toBeTruthy()
      for (const sectionId of Object.keys(sections)) {
        expect(
          epModule!.sections.some((s) => s.id === sectionId),
          `EP module ${moduleId} has a section '${sectionId}'`,
        ).toBe(true)
      }
    }
  })

  it('keys on the namespaced module ids (201-208), not the display ids', () => {
    // EP data ids are offset to avoid colliding with CCM in the progress store.
    // Keying on 1-8 here would attach nothing and fail silently.
    expect(Object.keys(EP_MODULE_INTERACTIVES).map(Number).sort((a, b) => a - b)).toEqual(
      [1, 2, 3, 4, 5, 6, 7, 8].map((n) => EP_MODULE_ID_OFFSET + n),
    )
  })

  it('every keyed section actually renders its widgets', () => {
    // The worst outcome of a bad wiring: a paying customer opening a module
    // that silently renders nothing where a quiz should be.
    let nonEmpty = 0
    for (const epModule of getEpModules()) {
      for (const section of epModule.sections) {
        const html = renderToStaticMarkup(
          createElement(SectionDataInteractives, { specs: section.interactives, isPreview: false }),
        )
        if (html !== '') nonEmpty++
      }
    }
    expect(nonEmpty).toBe(76)
  })

  it('renders through the shared widget set — no EP-only component', () => {
    // Identical components are what keep the two courses visually identical.
    const specs = Object.values(EP_MODULE_INTERACTIVES).flatMap((m) => Object.values(m).flat())
    const html = renderToStaticMarkup(
      createElement(SectionDataInteractives, { specs, isPreview: false }),
    )
    // Section headings the CCM components emit, one per kind in use.
    for (const marker of [
      'Quick Knowledge Check',
      'Select all that apply',
      'Clinical Scenario',
      'Patient Summary',
    ]) {
      expect(html, `${marker} must come from the shared component`).toContain(marker)
    }
  })
})

describe('CRM interactives are delivered by the entitled payload only', () => {
  it('an entitled CRM buyer receives every interactive of every module', () => {
    // /api/ep-course/modules/[id] serves getEpModuleById(id) whole once the
    // caller is admin, demo, or a CRM owner — so this is what a buyer gets.
    let total = 0
    for (let id = 1; id <= 8; id++) {
      const epModule = getEpModuleById(id)
      expect(epModule, `EP module ${id} resolves`).toBeTruthy()
      total += epModule!.sections.reduce((n, s) => n + (s.interactives?.length ?? 0), 0)
    }
    expect(total).toBe(157)
  })

  it('the public CRM trial hands over NO interactives at all', () => {
    // Every EP module's FIRST section is its myths intro, and the trial serves
    // first sections publicly. Handing over interactives here would publish all
    // eight modules' myth answer keys to anonymous visitors.
    const preview = getPreviewContent('crm')
    expect(preview.length).toBe(8)
    expect(preview.flatMap((m) => m.previewSections).length).toBeGreaterThan(0)
    expect(preview.flatMap((m) => m.previewSections).flatMap((s) => s.interactives ?? []).length).toBe(0)
  })

  it('the CRM trial still shows exactly the prose it showed before', () => {
    // The retag added widgets; it must not have moved a single word of the
    // trial's public content.
    const preview = getPreviewContent('crm')
    const modules = getEpModules()
    for (const m of preview) {
      const source = modules.find((x) => x.id === EP_MODULE_ID_OFFSET + m.id)!
      const previewCount = m.id === 1 ? 3 : 1
      expect(m.previewSections.map((s) => s.id)).toEqual(
        source.sections.slice(0, previewCount).map((s) => s.id),
      )
      m.previewSections.forEach((s, i) => {
        expect(s.title).toBe(source.sections[i].title)
        expect(s.content).toEqual(source.sections[i].content)
      })
      expect(m.sectionTitles).toEqual(source.sections.map((s) => s.title))
    }
  })

  it('the flagship trial is untouched by the CRM change', () => {
    // getPreviewContent is shared. CCM's trial keeps its 12 widgets.
    const preview = getPreviewContent('ccm')
    const one = preview.find((m) => m.id === 1)!
    expect(one.previewSections.flatMap((s) => s.interactives ?? []).length).toBe(12)
    expect(
      preview.filter((m) => m.id !== 1).flatMap((m) => m.previewSections).flatMap((s) => s.interactives ?? []).length,
    ).toBe(0)
  })
})

describe('the retag did not restructure the course', () => {
  it('no section id, module id or section ordering moved', () => {
    // Real users have stored progress keyed to these ids. Attaching
    // interactives must be purely additive.
    const shape = getEpModules().map((m) => ({ id: m.id, sections: m.sections.map((s) => s.id) }))
    expect(shape.map((m) => m.id)).toEqual([201, 202, 203, 204, 205, 206, 207, 208])
    expect(shape.map((m) => m.sections.length)).toEqual([11, 9, 12, 16, 11, 11, 10, 9])
    for (const m of shape) expect(new Set(m.sections).size).toBe(m.sections.length)
  })

  it('every module still carries its quiz intact', () => {
    for (const m of getEpModules()) {
      expect(m.quiz.length, `EP module ${m.id} quiz`).toBeGreaterThan(0)
      for (const q of m.quiz) {
        expect(q.id).toBeTruthy()
        expect(q.correctAnswer).toBeGreaterThanOrEqual(0)
        expect(q.correctAnswer).toBeLessThan(q.options.length)
      }
    }
  })
})
