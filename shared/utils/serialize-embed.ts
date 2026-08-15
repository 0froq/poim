import type { PoimTheme } from '../types/post'

export function serializePoimEmbed(options: {
  innerHTML: string
  css: string
  theme: PoimTheme
}): string {
  const { innerHTML, css, theme } = options
  const safeCss = css.replace(/<\/style/gi, '<\\/style')
  return [
    `<poim-card data-theme="${theme}">`,
    '  <template shadowrootmode="open">',
    `    <style>${safeCss}</style>`,
    `    ${innerHTML}`,
    '  </template>',
    '</poim-card>',
  ].join('\n')
}
