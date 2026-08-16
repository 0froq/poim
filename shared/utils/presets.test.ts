import { describe, expect, it } from 'vitest'
import defaultRaw from '~/assets/css/card/default.css?raw'
import tokensRaw from '~/assets/css/card/tokens.css?raw'
import { getPreset, POIM_PRESETS } from './presets'
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

describe('v1 仅一个 preset：default（RE-11）', () => {
  it('注册表只有 default，无 plain/minimal/humanist 残留', () => {
    expect(POIM_PRESETS.map(p => p.id)).toEqual(['default'])
    expect(POIM_PRESETS[0]!.label).toBe('默认')
    // 不保留任何别名 / 兼容入口
    expect(POIM_PRESETS.some(p => ['plain', 'minimal', 'humanist'].includes(p.id))).toBe(false)
    expect(() => getPreset('plain' as never)).toThrow()
  })
})

describe('卡片平整化（v1 合同 2026-08-16）', () => {
  function stripComments(css: string): string {
    // 注释里允许提到「rotate 被禁止」这一规则本身；断言只针对真实声明
    return css.replace(/\/\*[\s\S]*?\*\//g, '')
  }

  it('所有预设 CSS 无 rotate / transform，卡片几何平整', () => {
    for (const preset of POIM_PRESETS) {
      const css = stripComments(preset.css)
      expect(css).not.toMatch(/rotate/i)
      expect(css).not.toMatch(/transform\s*:/)
    }
  })
})

describe('预设 CSS 外置 .css 文件（构建链追踪）', () => {
  it('pOIM_PRESETS.css 由真实 .css 源文件组合而成', () => {
    expect(POIM_PRESETS).toHaveLength(1)
    expect(POIM_PRESETS[0]!.css).toBe(`${tokensRaw}${defaultRaw}`)
  })

  it('tokens.css 声明全部 --poim-* token（唯一颜色契约来源）', () => {
    for (const token of ['--poim-bg', '--poim-card', '--poim-fg', '--poim-muted', '--poim-line', '--poim-serif', '--poim-sans', '--poim-radius'])
      expect(tokensRaw).toContain(token)
    // 浅深独立维度：两套选择器都在
    expect(tokensRaw).toContain('.poim-stage[data-theme=')
    expect(tokensRaw).toContain(':host([data-theme=')
  })

  it('卡片 canvas 宽度固定 640px，不被外层压缩（RE-11）', () => {
    const block = tokensRaw.match(/\.poim-card\s*\{[\s\S]*?\}/)?.[0]
    expect(block).toBeTruthy()
    expect(block).toMatch(/width:\s*640px/)
    expect(block).toMatch(/min-width:\s*640px/)
    expect(block).toMatch(/max-width:\s*none/)
  })
})
