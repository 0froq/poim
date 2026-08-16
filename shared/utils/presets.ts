import type { PoimPresetId } from '../types/post'
import humanistRaw from '~/assets/css/card/humanist.css?raw'
import minimalRaw from '~/assets/css/card/minimal.css?raw'
import plainRaw from '~/assets/css/card/plain.css?raw'
import tokensRaw from '~/assets/css/card/tokens.css?raw'

export interface PoimPreset {
  id: PoimPresetId
  label: string
  html: string
  css: string
}

const BASE_HTML = `
<div class="poim-card">
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
  <div data-poim="quote" class="poim-quote" hidden>
    <div class="poim-quote-inner">
      <span data-poim="author-name" class="poim-name"></span>
      <span data-poim="author-handle" class="poim-handle"></span>
      <div data-poim="text" class="poim-text"></div>
    </div>
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
// 叠层（PROJECT.md §3）：tokens.css（token 基础层）→ 预设额外层 → token 覆盖 → 用户 CSS。
export const POIM_PRESETS: PoimPreset[] = [
  { id: 'plain', label: '普通', html: BASE_HTML, css: `${tokensRaw}${plainRaw}` },
  { id: 'minimal', label: '简洁', html: BASE_HTML, css: `${tokensRaw}${minimalRaw}` },
  { id: 'humanist', label: '人文', html: BASE_HTML, css: `${tokensRaw}${humanistRaw}` },
]

export function getPreset(id: PoimPresetId): PoimPreset {
  return POIM_PRESETS.find(p => p.id === id) ?? POIM_PRESETS[0]!
}
