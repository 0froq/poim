// 卡片可视化 token（RE-9）
// 与 presets.ts 的 TOKEN_CSS 同一份颜色契约：默认值从这里出，
// presets.ts 负责把它写进预设 CSS，composeTokenCss 负责把「覆盖」写成用户层 CSS。
// 浅深是独立维度：颜色按主题存；字体与圆角两主题共用（与 presets.md §1 一致）。

import type { PoimTheme } from '../types/post'

export const COLOR_KEYS = ['bg', 'card', 'fg', 'muted', 'line'] as const
export type ColorTokenKey = typeof COLOR_KEYS[number]

export interface ColorTokens {
  bg: string
  card: string
  fg: string
  muted: string
  line: string
}

// 与 presets.ts TOKEN_CSS 同步；改预设配色先改这里
export const CARD_COLOR_DEFAULTS: Record<PoimTheme, ColorTokens> = {
  light: {
    bg: '#f5f5f4',
    card: '#fafaf9',
    fg: '#1c1917',
    muted: '#78716c',
    line: '#d6d3d1',
  },
  dark: {
    bg: '#0c0a09',
    card: '#1c1917',
    fg: '#e7e5e4',
    muted: '#a8a29e',
    line: '#44403c',
  },
}

export const COLOR_META: Record<ColorTokenKey, { label: string }> = {
  bg: { label: '舞台底色' },
  card: { label: '纸面' },
  fg: { label: '正文' },
  muted: { label: '次要文字' },
  line: { label: '规则线' },
}

export interface FontOption {
  value: string
  label: string
}

// 空 value = 不覆盖（用预设默认）。值都是固定字体栈，进 CSS 前有字符守卫。
export const SERIF_OPTIONS: FontOption[] = [
  { value: '', label: '默认（EB Garamond）' },
  { value: 'Georgia, "Songti SC", serif', label: 'Georgia' },
  { value: '"Songti SC", "SimSun", serif', label: '宋体' },
  { value: '"Kaiti SC", "KaiTi", serif', label: '楷体' },
  { value: 'ui-serif, Georgia, serif', label: '系统衬线' },
]

export const SANS_OPTIONS: FontOption[] = [
  { value: '', label: '默认（Instrument Sans）' },
  { value: '"Inter", ui-sans-serif, system-ui, sans-serif', label: 'Inter' },
  { value: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif', label: '黑体（PingFang）' },
  { value: 'ui-sans-serif, system-ui, sans-serif', label: '系统无衬线' },
  { value: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace', label: '等宽' },
]

export const RADIUS_OPTIONS: FontOption[] = [
  { value: '', label: '直角' },
  { value: '4px', label: '4px' },
  { value: '8px', label: '8px' },
  { value: '16px', label: '16px' },
]

// 卡片默认圆角（预设 CSS 的 --poim-radius）
export const RADIUS_DEFAULT = '0px'

export interface CardTokenOverrides {
  light: Partial<ColorTokens>
  dark: Partial<ColorTokens>
  serif: string
  sans: string
  radius: string
}

export function emptyTokenOverrides(): CardTokenOverrides {
  return { light: {}, dark: {}, serif: '', sans: '', radius: '' }
}

function varLine(name: string, value: string): string | null {
  const v = value.trim()
  // 守卫：只放行安全值（hex 颜色 / 固定字体栈 / px 圆角），
  // 剥掉任何可能破坏样式块结构或逃逸注入的字符
  if (!v || /[;{}]/.test(v))
    return null
  return `  --poim-${name}: ${v};`
}

// 把可视化 token 覆盖写成卡片层 CSS（夹在预设 CSS 与用户 CSS 之间）。
// 颜色按主题分块；字体/圆角只在基础块。等于默认值的覆盖不输出，保持导出干净。
export function composeTokenCss(overrides: CardTokenOverrides): string {
  const base = [
    varLine('serif', overrides.serif),
    varLine('sans', overrides.sans),
    varLine('radius', overrides.radius),
  ]
  const lightColors = COLOR_KEYS
    .filter(key => overrides.light[key] && overrides.light[key] !== CARD_COLOR_DEFAULTS.light[key])
    .map(key => varLine(key, overrides.light[key]!))
  const darkColors = COLOR_KEYS
    .filter(key => overrides.dark[key] && overrides.dark[key] !== CARD_COLOR_DEFAULTS.dark[key])
    .map(key => varLine(key, overrides.dark[key]!))

  const blocks: string[] = []
  const baseBlock = [...base, ...lightColors].filter((v): v is string => Boolean(v))
  if (baseBlock.length)
    blocks.push(`:host, .poim-stage {\n${baseBlock.join('\n')}\n}`)
  const darkBlock = darkColors.filter((v): v is string => Boolean(v))
  if (darkBlock.length)
    blocks.push(`.poim-stage[data-theme="dark"], :host([data-theme="dark"]) {\n${darkBlock.join('\n')}\n}`)
  return blocks.join('\n')
}
