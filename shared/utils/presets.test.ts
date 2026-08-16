import { describe, expect, it } from 'vitest'
import humanistRaw from '~/assets/css/card/humanist.css?raw'
import minimalRaw from '~/assets/css/card/minimal.css?raw'
import plainRaw from '~/assets/css/card/plain.css?raw'
import tokensRaw from '~/assets/css/card/tokens.css?raw'
import { CARD_COLOR_DEFAULTS, RADIUS_DEFAULT } from './card-tokens'
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
    const byId = Object.fromEntries(POIM_PRESETS.map(p => [p.id, p]))
    expect(byId.plain!.css).toBe(`${tokensRaw}${plainRaw}`)
    expect(byId.minimal!.css).toBe(`${tokensRaw}${minimalRaw}`)
    expect(byId.humanist!.css).toBe(`${tokensRaw}${humanistRaw}`)
  })

  it('tokens.css 与可视化 token 默认值（CARD_COLOR_DEFAULTS / RADIUS_DEFAULT）同步', () => {
    // 深色选择器出现两次（.poim-stage[data-theme] 与 :host([data-theme])），
    // 不能直接 split 解构——要取第一个出现点之后的整段作为深色块；引号单双都兼容（prettier 会归一）
    const darkIdx = tokensRaw.search(/\.poim-stage\[data-theme=['"]dark['"]\]/)
    expect(darkIdx).toBeGreaterThan(-1)
    const lightBlock = tokensRaw.slice(0, darkIdx)
    const darkBlock = tokensRaw.slice(darkIdx)
    expect(lightBlock).toBeTruthy()
    expect(darkBlock).toBeTruthy()
    const extract = (block: string): Record<string, string> => {
      const out: Record<string, string> = {}
      for (const match of block.matchAll(/--poim-(bg|card|fg|muted|line)\s*:\s*([^;\s][^;]*);/g))
        out[match[1]!] = match[2]!.trim()
      return out
    }
    expect(extract(lightBlock!)).toEqual(CARD_COLOR_DEFAULTS.light)
    expect(extract(darkBlock!)).toEqual(CARD_COLOR_DEFAULTS.dark)
    expect(tokensRaw).toContain(`--poim-radius: ${RADIUS_DEFAULT};`)
  })
})
