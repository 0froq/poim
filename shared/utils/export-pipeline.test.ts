import type { PoimPost } from '../types/post'
import type { FillContext } from './fill-template'
import { describe, expect, it } from 'vitest'
import { fillTemplate } from './fill-template'
import { toProxyMediaUrl } from './media-url'
import { getPreset } from './presets'
import { sanitizeUserCss } from './sanitize-css'
import { sanitizeHtmlFragment } from './sanitize-html'
import { serializePoimEmbed } from './serialize-embed'

const SAMPLE: PoimPost = {
  version: 1,
  platform: 'x',
  source: 'url',
  fetchedAt: '2026-08-15T10:00:00Z',
  canonicalUrl: 'https://x.com/froq/status/123456',
  id: '123456',
  author: { name: 'froQ', handle: 'froq', avatar: 'https://pbs.twimg.com/profile_images/1.jpg' },
  createdAt: '2026-08-14T08:30:00Z',
  text: '把帖子做成卡片，第一行\n第二行，还有 <b>原始标签</b>',
  media: [
    { type: 'image', url: 'https://pbs.twimg.com/media/ABC.jpg', width: 1200, height: 800 },
    { type: 'gif', url: 'https://video.twimg.com/ext_tw_video/1.mp4', poster: 'https://pbs.twimg.com/tweet_video_thumb/1.jpg' },
  ],
  metrics: { likes: 1234, retweets: 56, replies: 7, views: 89012 },
}

function buildEmbed(post: PoimPost, userCss = '', fill?: Partial<FillContext>): string {
  const preset = getPreset('default')
  const clean = sanitizeHtmlFragment(preset.html)
  const doc = new DOMParser().parseFromString(clean, 'text/html')
  const card = doc.body.firstElementChild as HTMLElement
  fillTemplate(card, post, { mediaSrc: toProxyMediaUrl, brandHref: 'https://github.com/0froq/poim', ...fill })
  return serializePoimEmbed({
    innerHTML: card.outerHTML,
    css: `${preset.css}\n${sanitizeUserCss(userCss)}`,
    theme: 'dark',
    post,
  })
}

describe('export pipeline e2e', () => {
  it('preset → 消毒 → 填充 → 序列化（模拟 copyEmbed）', () => {
    const html = buildEmbed(SAMPLE)

    expect(html).toContain('<poim-card data-theme="dark">')
    expect(html).toContain('shadowrootmode="open"')
    expect(html).toContain('froQ')
    expect(html).toContain('@froq')
    // 原始 <b> 标签不解析为标签（textContent 语义），且无白名单外标签
    expect(html).not.toContain('<b>')
    // 媒体走同源代理
    expect(html).toContain('/api/media?url=')
    expect(html).toContain('<video')
    expect(html).toContain('playsinline')
    // quote 无内容 → hidden
    expect(html).toContain('data-poim="quote"')
    expect(html).toMatch(/data-poim="quote"[^>]*hidden/)
    // metrics 填充为图标（RE-11）：无障碍名 + 数值，无可见中文标签
    expect(html).toContain('aria-label="1.2K likes"')
    expect(html).toContain('aria-label="7 replies"')
    expect(html).toContain('aria-label="56 reposts"')
    expect(html).toContain('aria-label="89K views"')
    expect(html).not.toContain('喜欢')
    expect(html).not.toContain('浏览')
    // 来源行（URL 卡始终有）：Fetched from + X 图标 + 时间戳子节点
    expect(html).toContain('Fetched from')
    expect(html).toContain('aria-label="X"')
    expect(html).toContain('class="poim-fetched-at"')
    expect(html).toContain('2026-08-15')
    // 发帖时间走稳定国际格式
    expect(html).toContain('2026-08-14 08:30')
    expect(html).not.toMatch(/[年月日]/)
    // 规范 JSON 载荷
    expect(html).toContain('type="application/json" data-poim="payload"')
    expect(html).toContain('"handle":"froq"')
  })

  it('导出样例无 </script> 逃逸：正文与 CSS 注入均被转义', () => {
    // 正文注入 </script><script>：textContent 负责正文、\\u003c 负责载荷；
    // CSS 注入 </style>：</style → <\\/style（style 是 raw text 元素，只有 </style 能提前闭合；
    //   CSS 里的 <script> 是惰性文本，不构成逃逸，故 CSS 注入只测 </style 这一危险闭合符）
    const evilText = '正常文字 </script><script>alert(1)</script> 结尾'
    const evilCss = '.poim-card::after { content: "</style>"; }'
    const html = buildEmbed({ ...SAMPLE, text: evilText }, evilCss)

    // 结构不变量：全文恰有一个 <script 开标签（payload data block）与一个 </script> 收尾。
    // 正文里的 script 文本要么被 textContent 转义成 &lt;，要么在载荷里被 \\u003c 转义。
    expect(html.match(/<script/g)).toHaveLength(1)
    expect(html.match(/<\/script>/gi)).toHaveLength(1)
    // 危险闭合符 </style 只出现一次（style 块自身收尾），CSS 注入的被转义成 <\\/style
    expect(html.match(/<\/style>/gi)).toHaveLength(1)
    expect(html).not.toContain('<script>alert')

    // JSON 载荷里不允许出现裸 </script>，且可还原原文
    const payloadBlock = html.match(/data-poim="payload">([\s\S]*?)<\/script>/)
    expect(payloadBlock).not.toBeNull()
    const payload = payloadBlock![1]!
    // \\u003c 是合法 JSON 转义，JSON.parse 直接还原出原文
    const parsed = JSON.parse(payload) as { text: string }
    expect(parsed.text).toBe(evilText)
    expect(payload.match(/<\/script>/gi)).toBeNull()
  })
})

describe('export pipeline：元信息开关透传到序列化快照（预览/导出同一 DOM）', () => {
  it('uRL 快照默认带 metrics 图标与 Fetched from 来源行', () => {
    const html = buildEmbed(SAMPLE)
    expect(html).toContain('aria-label="1.2K likes"')
    expect(html).toContain('Fetched from')
  })

  it('showMetrics=false：快照不含任何指标项', () => {
    const html = buildEmbed(SAMPLE, '', { showMetrics: false })
    expect(html).not.toContain('class="poim-metric"')
    expect(html).toContain('data-poim="metrics"') // 槽位节点仍在（填节点不删标签）
  })

  it('showFetchedAt=false：URL 快照保留来源行，去掉时间戳子节点', () => {
    const html = buildEmbed(SAMPLE, '', { showFetchedAt: false })
    expect(html).toContain('Fetched from')
    expect(html).not.toContain('poim-fetched-at')
    expect(html).toContain('data-poim="badge"')
  })

  it('手填快照（manual，无 fetchedAt）开关开启也不出现来源标记', () => {
    const manual: PoimPost = {
      ...SAMPLE,
      source: 'manual',
      fetchedAt: undefined,
      canonicalUrl: undefined,
      id: undefined,
    }
    const html = buildEmbed(manual, '', { showFetchedAt: true })
    expect(html).not.toContain('Fetched from')
    expect(html).not.toContain('poim-fetched-at')
  })
})
