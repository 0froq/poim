import type { PoimPresetId } from '../types/post'
import defaultRaw from '~/assets/css/card/default.css?raw'
import tokensRaw from '~/assets/css/card/tokens.css?raw'

export interface PoimPreset {
  id: PoimPresetId
  label: string
  html: string
  css: string
}

const BASE_HTML = `
<div class="poim-card">
  <div data-poim="reply" class="poim-flow" hidden>
    <div class="poim-header">
      <img data-poim="author-avatar" class="poim-avatar" alt="" />
      <div class="poim-author">
        <div data-poim="author-name" class="poim-name"></div>
        <div data-poim="author-handle" class="poim-handle"></div>
      </div>
      <time data-poim="time" class="poim-time"></time>
    </div>
    <div data-poim="text" class="poim-text"></div>
    <div data-poim="media" class="poim-media"></div>
  </div>
  <div class="poim-header">
    <img data-poim="author-avatar" class="poim-avatar" alt="" />
    <div class="poim-author">
      <div data-poim="author-name" class="poim-name"></div>
      <div data-poim="author-handle" class="poim-handle"></div>
    </div>
    <time data-poim="time" class="poim-time"></time>
  </div>
  <div data-poim="text" class="poim-text"></div>
  <div data-poim="media" class="poim-media"></div>
  <div data-poim="quote" class="poim-quote poim-embed" hidden>
    <div class="poim-header">
      <img data-poim="author-avatar" class="poim-avatar" alt="" />
      <div class="poim-author">
        <div data-poim="author-name" class="poim-name"></div>
        <div data-poim="author-handle" class="poim-handle"></div>
      </div>
    </div>
    <div data-poim="text" class="poim-text"></div>
    <div data-poim="media" class="poim-media"></div>
  </div>
  <div class="poim-footer">
    <div data-poim="metrics" class="poim-metrics"></div>
    <div data-poim="badge" class="poim-badge"></div>
    <a data-poim="brand" class="poim-brand">poim</a>
  </div>
</div>
`.trim()

// 预设 CSS 的可编辑源是 app/assets/css/card/ 下的真实 .css 文件（构建链直接追踪：
// 编辑即 LSP / 语法高亮 / Vite HMR）。WC 导出注入的是 ?raw 冻结文本，单 DOM 契约不变。
// 叠层：tokens.css（token 基础层）→ 预设额外层。
// v1 仅一个 preset：default（原 plain 迁移；minimal / humanist 已彻底移除）。
export const POIM_PRESETS: PoimPreset[] = [
  { id: 'default', label: '默认', html: BASE_HTML, css: `${tokensRaw}${defaultRaw}` },
]

export function getPreset(id: PoimPresetId): PoimPreset {
  // 不设兼容别名 / 静默回退：未知 id 直接报错（v1 仅 default，PROJECT.md §3）
  const preset = POIM_PRESETS.find(p => p.id === id)
  if (!preset)
    throw new Error(`unknown preset: ${id}`)
  return preset
}
