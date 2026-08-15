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
    ALLOW_DATA_ATTR: false,
    ALLOWED_URI_REGEXP: /^(?:https?:|data:image\/|\/|#)/i,
  }
}

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
