import { describe, expect, it } from 'vitest'
import { POIM_PRESETS } from './presets'
import { getDomPurifyConfig } from './sanitize-html'

const WHITELIST = new Set([
  'div',
  'span',
  'p',
  'a',
  'img',
  'video',
  'picture',
  'source',
  'h1',
  'h2',
  'h3',
  'ul',
  'ol',
  'li',
  'blockquote',
  'figure',
  'figcaption',
  'time',
  'strong',
  'em',
  'br',
])

describe('预设与合同白名单', () => {
  it('每个预设 HTML 只使用合同白名单标签', () => {
    for (const preset of POIM_PRESETS) {
      const doc = new DOMParser().parseFromString(preset.html, 'text/html')
      const tags = new Set(Array.from(doc.body.querySelectorAll('*')).map(el => el.tagName.toLowerCase()))
      for (const tag of tags) {
        expect(WHITELIST.has(tag), `${preset.id} 用了白名单外标签 <${tag}>`).toBe(true)
      }
    }
  })

  it('预设 CSS 走 --poim-* token（浅深独立维度）', () => {
    for (const preset of POIM_PRESETS) {
      expect(preset.css).toMatch(/var\(--poim-/)
      expect(preset.css).toContain('--poim-')
    }
  })

  it('预设 HTML 覆盖全部槽位契约', () => {
    const requiredSlots = [
      'author-name',
      'author-handle',
      'author-avatar',
      'time',
      'text',
      'media',
      'metrics',
      'badge',
      'brand',
    ]
    for (const preset of POIM_PRESETS) {
      for (const slot of requiredSlots) {
        expect(preset.html, `${preset.id} 缺槽位 ${slot}`).toContain(`data-poim="${slot}"`)
      }
      // quote 是空容器，默认 hidden
      expect(preset.html).toContain('data-poim="quote"')
      expect(preset.html).toContain('hidden')
    }
  })

  it('消毒配置与合同白名单一致（不含 article/header/footer/section）', () => {
    const config = getDomPurifyConfig()
    const allowed = config.ALLOWED_TAGS as string[]
    for (const tag of ['article', 'header', 'footer', 'section', 'script', 'iframe', 'object', 'form'])
      expect(allowed.includes(tag), `${tag} 不应在白名单`).toBe(false)
  })
})
