import { describe, expect, it } from 'vitest'
import { fillTemplate } from '../utils/fill-template'
import { getPreset } from '../utils/presets'
import { CARD_CASES } from './card-cases'

describe('卡片样例夹具', () => {
  it('覆盖原创/回复/转发/引用与 0–4 图', () => {
    const ids = CARD_CASES.map(item => item.id)
    expect(ids).toContain('post-text')
    expect(ids).toContain('post-1-port')
    expect(ids).toContain('post-3')
    expect(ids).toContain('post-4')
    expect(ids).toContain('reply-handle-only')
    expect(ids).toContain('reply-parent-port')
    expect(ids).toContain('reply-both-media')
    expect(ids).toContain('repost-text')
    expect(ids).toContain('quote-text')
    expect(ids).toContain('quote-parent-port')
    expect(ids).toContain('quote-both-1')
    expect(ids).toContain('reply-quote-media')
    expect(ids).toContain('repost-quote')
  })

  it('每条样例能填进 default 模板且引用头栏与主帖同构', () => {
    const html = getPreset('default').html
    for (const item of CARD_CASES) {
      document.body.innerHTML = html
      const root = document.querySelector('.poim-card') as HTMLElement
      fillTemplate(root, item.post, { mediaSrc: u => u })
      const header = root.querySelector(':scope > .poim-header')
        ?? root.querySelector(':scope > .poim-embed > .poim-header')
      expect(header, item.id).toBeTruthy()
      expect(header!.querySelector('[data-poim="author-name"]')?.tagName).toBe('DIV')
      expect(header!.querySelector('[data-poim="author-handle"]')?.tagName).toBe('DIV')
      if (item.post.quote) {
        const qHeader = root.querySelector('[data-poim="quote"] .poim-header')
        expect(qHeader, item.id).toBeTruthy()
        expect(qHeader!.querySelector('[data-poim="author-name"]')?.tagName).toBe('DIV')
        expect(qHeader!.querySelector('[data-poim="author-handle"]')?.tagName).toBe('DIV')
        expect(qHeader!.querySelector('[data-poim="author-avatar"]')?.classList.contains('poim-avatar')).toBe(true)
      }
      if (item.post.replyTo) {
        const flow = root.querySelector('[data-poim="reply"]') as HTMLElement
        expect(flow.hidden, item.id).toBe(false)
        expect(flow.classList.contains('poim-flow')).toBe(true)
        expect(flow.querySelector('[data-poim="author-name"]')?.textContent).toBe(item.post.replyTo.author.name)
        expect(root.querySelector('.poim-reply-to'), item.id).toBeNull()
      }
      else if (item.post.replyToHandle) {
        const flow = root.querySelector('[data-poim="reply"]') as HTMLElement
        expect(flow.hidden, item.id).toBe(false)
        expect(flow.querySelector('[data-poim="author-handle"]')?.textContent).toBe(`@${item.post.replyToHandle}`)
        expect(root.querySelector('.poim-reply-to'), item.id).toBeNull()
      }
      if (item.post.repostedBy) {
        expect(root.querySelector('.poim-repost')?.textContent).toContain('转发了')
        expect(root.querySelector(':scope > .poim-embed'), item.id).toBeTruthy()
      }
    }
  })
})
