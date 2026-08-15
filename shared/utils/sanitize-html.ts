import DOMPurify from 'isomorphic-dompurify'

// 合同 §3 HTML 消毒白名单：div/span/p/a/img/video/picture/source/h1-h3/ul/ol/li/blockquote/figure/figcaption/time/strong/em/br
// 禁 script、事件属性、iframe、object、form；a[href] 仅 http(s)。
const ALLOWED_TAGS = [
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
]

export function getDomPurifyConfig(): Record<string, unknown> {
  return {
    ALLOWED_TAGS,
    ALLOWED_ATTR: [
      'data-poim',
      'class',
      'style',
      'id',
      'href',
      'src',
      'alt',
      'datetime',
      'hidden',
      'width',
      'height',
      'poster',
      'controls',
      'autoplay',
      'loop',
      'muted',
      'playsinline',
    ],
    ALLOWED_URI_REGEXP: /^(?:https?:|data:image\/|\/|#)/i,
  }
}

// 只放行 data-poim 槽位标记，其余 data-* 一律剥掉。
// （不能用 ALLOW_DATA_ATTR: false —— 那会让 data-poim 落入 URI 安全检查，值非 URL 时被误删。）
DOMPurify.addHook('afterSanitizeAttributes', (node: unknown) => {
  if (typeof (node as { getAttributeNames?: () => string[] }).getAttributeNames !== 'function')
    return
  for (const name of (node as { getAttributeNames: () => string[] }).getAttributeNames()) {
    if (name.startsWith('data-') && name !== 'data-poim')
      (node as { removeAttribute: (n: string) => void }).removeAttribute(name)
  }
})

function isHttpUrl(href: string): boolean {
  return /^https?:\/\//i.test(href)
}

// 消毒 + 收尾：a[href] 仅 http(s)，其余去掉 href（src/poster 仍允许同源代理与 data:image）。
export function sanitizeHtmlFragment(html: string): string {
  const clean = DOMPurify.sanitize(html, getDomPurifyConfig())
  const doc = new DOMParser().parseFromString(clean, 'text/html')
  doc.querySelectorAll('a[href]').forEach((anchor) => {
    if (!isHttpUrl(anchor.getAttribute('href') ?? ''))
      anchor.removeAttribute('href')
  })
  return doc.body.innerHTML
}
