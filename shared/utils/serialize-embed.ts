import type { PoimPost, PoimTheme } from '../types/post'

export interface SerializeEmbedOptions {
  innerHTML: string
  css: string
  theme: PoimTheme
  post: PoimPost
}

// 导出快照：Shadow DOM 内 = 消毒 HTML + 冻住的预设 CSS + 当时 data-theme + 规范 JSON。
// 声明式 Shadow DOM，嵌入页零 JS、不加载 Nuxt。data-theme 冻死导出当时值，不跟嵌入页主题跑。
export function serializePoimEmbed(options: SerializeEmbedOptions): string {
  const { innerHTML, css, theme, post } = options
  const safeCss = css.replace(/<\/style/gi, '<\\/style')
  // application/json 是 data block，永不执行；转义 < 防止 </script> 逃逸
  const payload = JSON.stringify(post).replace(/</g, '\\u003c')
  return [
    `<poim-card data-theme="${theme}">`,
    '  <template shadowrootmode="open">',
    `    <style>${safeCss}</style>`,
    `    ${innerHTML}`,
    `    <script type="application/json" data-poim="payload">${payload}</script>`,
    '  </template>',
    '</poim-card>',
  ].join('\n')
}
