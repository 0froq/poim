import { describe, expect, it } from 'vitest'
import {
  CARD_COLOR_DEFAULTS,
  composeTokenCss,
  emptyTokenOverrides,
} from './card-tokens'

describe('card-tokens 可视化 token', () => {
  it('空覆盖输出空串', () => {
    expect(composeTokenCss(emptyTokenOverrides())).toBe('')
  })

  it('颜色覆盖按主题分块，等于默认值不输出', () => {
    const css = composeTokenCss({
      light: { card: '#ffffff' },
      dark: { card: CARD_COLOR_DEFAULTS.dark.card },
      serif: '',
      sans: '',
      radius: '',
    })
    expect(css).toContain(':host, .poim-stage')
    expect(css).toContain('--poim-card: #ffffff;')
    // 深色与默认相同 → 不产生深色块
    expect(css).not.toContain('data-theme="dark"')
  })

  it('深色覆盖只出现在深色块', () => {
    const css = composeTokenCss({
      light: {},
      dark: { fg: '#eeeeee' },
      serif: '',
      sans: '',
      radius: '',
    })
    expect(css).not.toContain(':host, .poim-stage')
    expect(css).toContain('.poim-stage[data-theme="dark"], :host([data-theme="dark"])')
    expect(css).toContain('--poim-fg: #eeeeee;')
  })

  it('字体与圆角进基础块，颜色进各自主题块', () => {
    const css = composeTokenCss({
      light: { bg: '#101010' },
      dark: { bg: '#202020' },
      serif: 'Georgia, serif',
      sans: '',
      radius: '8px',
    })
    expect(css).toContain(':host, .poim-stage')
    expect(css).toContain('--poim-serif: Georgia, serif;')
    expect(css).toContain('--poim-radius: 8px;')
    expect(css).toContain('--poim-bg: #101010;')
    expect(css).toContain('--poim-bg: #202020;')
  })

  it('全部主题与字体圆角都覆盖时输出两块', () => {
    const css = composeTokenCss({
      light: { card: '#111111' },
      dark: { card: '#222222' },
      serif: 'Georgia, serif',
      sans: 'ui-sans-serif, sans-serif',
      radius: '16px',
    })
    expect(css.split('\n').filter(l => l.includes('{'))).toHaveLength(2)
    expect(css).toContain('--poim-sans: ui-sans-serif, sans-serif;')
  })

  it('危险字符被守卫整个剥离，不破坏样式块', () => {
    const css = composeTokenCss({
      light: { card: '#ff0000;color:red' },
      dark: {},
      serif: 'Georgia;} body { display:none',
      sans: '',
      radius: '',
    })
    expect(css).not.toContain('--poim-card')
    expect(css).not.toContain('color:red')
    expect(css).not.toContain('body')
    expect(css).toBe('')
  })
})
