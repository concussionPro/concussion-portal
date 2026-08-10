import { describe, it, expect } from 'vitest'
import { htmlToText } from '../lib/resend-client'

/**
 * Every send must carry a plain-text alternative. An HTML-only message is a
 * multipart/alternative with one part, which filters treat as a signal in
 * itself — and it is what the inbox preview line renders from.
 */
describe('plain-text alternative', () => {
  it('keeps link destinations, because a text part with no URLs is useless', () => {
    const t = htmlToText('<p>Book the <a href="https://x.test/pricing">Melbourne seat</a> now.</p>')
    expect(t).toContain('Melbourne seat (https://x.test/pricing)')
  })

  it('does not duplicate a bare URL used as its own label', () => {
    const t = htmlToText('<a href="https://x.test">https://x.test</a>')
    expect(t).toBe('https://x.test')
  })

  it('preserves reading order and block breaks', () => {
    const t = htmlToText('<p>One</p><p>Two</p>')
    expect(t).toBe('One\n\nTwo')
  })

  it('strips scripts and styles entirely', () => {
    const t = htmlToText('<style>.a{color:red}</style><p>Hi</p><script>alert(1)</script>')
    expect(t).toBe('Hi')
    expect(t).not.toContain('color')
    expect(t).not.toContain('alert')
  })

  it('renders list items as list items', () => {
    expect(htmlToText('<ul><li>First</li><li>Second</li></ul>')).toBe('- First\n\n- Second')
  })

  it('decodes the entities the templates actually use', () => {
    expect(htmlToText('<p>A&nbsp;&mdash;&nbsp;B</p>')).toBe('A — B')
    expect(htmlToText('<p>Sarah&rsquo;s</p>')).toBe('Sarah’s')
  })

  it('leaves no markup behind', () => {
    const t = htmlToText('<div class="x"><h2>Title</h2><p><strong>Bold</strong> text</p></div>')
    expect(t).not.toMatch(/[<>]/)
    expect(t).toContain('Title')
    expect(t).toContain('Bold text')
  })

  it('collapses runaway whitespace from templated HTML', () => {
    expect(htmlToText('<p>A</p>\n\n\n\n<p>B</p>')).toBe('A\n\nB')
  })
})
