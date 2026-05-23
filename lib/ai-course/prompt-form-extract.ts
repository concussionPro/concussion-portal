/**
 * Auto-detects `**Inputs the model needs:** / **Prompt:** / **Review
 * checklist:**` patterns across module section bodies and extracts
 * structured form data so the ModuleViewer can render an interactive
 * prompt form instead of a wall of prose.
 *
 * Used during server-side parsing of each module section. The matched
 * markdown is replaced with `[PROMPT-FORM-AUTO: <index>]` markers; the
 * extracted data lives on the ParsedSection.
 */

export interface PromptFormInput {
  label: string
  hint?: string
  /** Dropdown options if the hint matches "a / b / c" pattern */
  options?: string[]
}

export interface PromptFormData {
  /** Field definitions extracted from "Inputs the model needs:" list */
  inputs: PromptFormInput[]
  /** Prompt body text (after stripping blockquote markers) */
  promptTemplate: string
  /** Bullet items from "Review checklist:" */
  checklist: string[]
  /** "What the model does well:" guidance */
  doesWell?: string
  /** "What the model does poorly:" guidance */
  doesPoorly?: string
  /** "Risk tier:" guidance — surfaced as warning */
  riskTier?: string
  /** "Goal:" line — surfaced as descriptive sub-header */
  goal?: string
}

function parseInputBullet(raw: string): PromptFormInput {
  const match = raw.match(/^(.+?)\s*\((.+?)\)\s*$/)
  if (!match) return { label: raw }
  const label = match[1].trim()
  const hint = match[2].trim()
  // If hint has slash-separated options, treat as dropdown
  if (/^[A-Za-z][\w-]*(?:\s*\/\s*[A-Za-z][\w-]*){1,}$/.test(hint)) {
    const options = hint.split('/').map((s) => s.trim()).filter(Boolean)
    return { label, options }
  }
  return { label, hint }
}

function stripBlockquote(s: string): string {
  return s.replace(/^>\s?/gm, '').trim()
}

function isHardSection(line: string): boolean {
  return (
    /^\*\*(Review checklist|What the model does well|What the model does poorly|Inputs the model needs|Goal|Risk tier|Prompt|Output|Tool|Compliance):\*\*/i.test(
      line
    ) ||
    /^##\s+/.test(line) ||
    /^\[(KEYPOINT|REDFLAG|DEFINITION|TRYTHIS|INFOGRAPHIC|PROMPT-CARD):/.test(line)
  )
}

export function extractPromptForms(body: string): {
  transformed: string
  forms: PromptFormData[]
} {
  const lines = body.split('\n')
  const forms: PromptFormData[] = []
  const output: string[] = []

  let i = 0
  while (i < lines.length) {
    const line = lines[i]

    // Detect prompt section start. Variants we handle:
    //   "**Prompt:**", "**Prompt example:**"
    if (!/^\*\*Prompt(?:\s+example)?:\*\*\s*$/.test(line)) {
      output.push(line)
      i++
      continue
    }

    // Walk backward in `output` (not lines, since we're emitting transformed
    // lines into output) to find prior context: Goal, Risk tier, Inputs.
    let inputsBlockStartInOutput = -1
    let goal: string | undefined
    let riskTier: string | undefined
    let scanFrom = output.length - 1
    while (scanFrom >= 0 && output.length - scanFrom < 30) {
      const ol = output[scanFrom]
      if (/^##\s+/.test(ol)) break
      if (/^\*\*Inputs the model needs:\*\*/.test(ol)) {
        inputsBlockStartInOutput = scanFrom
      }
      const goalMatch = ol.match(/^\*\*Goal:\*\*\s*(.+)$/)
      if (goalMatch && !goal) goal = goalMatch[1].trim()
      const riskMatch = ol.match(/^\*\*Risk tier:\*\*\s*(.+)$/)
      if (riskMatch && !riskTier) riskTier = riskMatch[1].trim()
      scanFrom--
    }

    // Walk forward to capture prompt body
    let promptEnd = i + 1
    while (promptEnd < lines.length) {
      if (isHardSection(lines[promptEnd])) break
      promptEnd++
    }
    const promptLines = lines.slice(i + 1, promptEnd)
    const promptTemplate = stripBlockquote(promptLines.join('\n')).trim()

    // Capture checklist + does-well/poorly if they immediately follow
    let checklist: string[] = []
    let doesWell: string | undefined
    let doesPoorly: string | undefined
    let after = promptEnd

    // Look ahead for Review checklist + does well/poorly within next 40 lines
    const tailLimit = Math.min(lines.length, after + 60)
    let tailEnd = after
    while (tailEnd < tailLimit) {
      const cur = lines[tailEnd]
      const checkMatch = /^\*\*Review checklist:\*\*\s*$/.test(cur)
      const wellMatch = cur.match(/^\*\*What the model does well:\*\*\s*(.+)$/)
      const poorlyMatch = cur.match(/^\*\*What the model does poorly:\*\*\s*(.+)$/)

      if (checkMatch) {
        tailEnd++
        while (tailEnd < tailLimit) {
          const cl = lines[tailEnd].trim()
          if (cl.startsWith('-') || cl.startsWith('*')) {
            checklist.push(cl.replace(/^[-*]\s+/, '').trim())
            tailEnd++
          } else if (cl === '') {
            tailEnd++
          } else {
            break
          }
        }
        continue
      }
      if (wellMatch) {
        doesWell = wellMatch[1].trim()
        tailEnd++
        continue
      }
      if (poorlyMatch) {
        doesPoorly = poorlyMatch[1].trim()
        tailEnd++
        continue
      }
      // Allow blank lines between captured sections
      if (cur.trim() === '') {
        tailEnd++
        continue
      }
      // Stop on anything else
      break
    }

    // Parse inputs from the captured inputs block (if any) in output
    let inputs: PromptFormInput[] = []
    if (inputsBlockStartInOutput !== -1) {
      for (let j = inputsBlockStartInOutput + 1; j < output.length; j++) {
        const cur = output[j].trim()
        if (cur.startsWith('-') || cur.startsWith('*')) {
          inputs.push(parseInputBullet(cur.replace(/^[-*]\s+/, '').trim()))
        } else if (cur === '') {
          continue
        } else {
          break
        }
      }
    }

    // Trim trailing content from output: from inputsBlockStartInOutput onward
    // (so the form marker takes the place of the inputs + prompt + checklist
    // block).
    const replaceFromInOutput = inputsBlockStartInOutput !== -1 ? inputsBlockStartInOutput : output.length
    output.length = replaceFromInOutput

    const formIdx = forms.length
    forms.push({
      inputs,
      promptTemplate,
      checklist,
      doesWell,
      doesPoorly,
      goal,
      riskTier,
    })

    output.push(`[PROMPT-FORM-AUTO: ${formIdx}]`)
    i = tailEnd
  }

  return { transformed: output.join('\n'), forms }
}
