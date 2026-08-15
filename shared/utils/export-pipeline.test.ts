import type { PoimPost } from '../types/post'
import { describe, expect, it } from 'vitest'
import { fillTemplate } from './fill-template'
import { toProxyMediaUrl } from './media-url'
import { getPreset } from './presets'
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

describe('export pipeline e2e', () => {
  it('preset → 消毒 → 填充 → 序列化（模拟 copyEmbed）', () => {
    const preset = getPreset('plain')
    const clean = sanitizeHtmlFragment(preset.html)
    const doc = new DOMParser().parseFromString(clean, 'text/html')
    const card = doc.body.firstElementChild as HTMLElement
    fillTemplate(card, SAMPLE, { mediaSrc: toProxyMediaUrl, brandHref: 'https://github.com/0froq/poim' })

    const html = serializePoimEmbed({ innerHTML: card.outerHTML, css: preset.css, theme: 'dark', post: SAMPLE })

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
    // metrics 填充
    expect(html).toContain('喜欢 1.2K')
    // badge（URL 来源）
    expect(html).toContain('Fetched from X')
    // 规范 JSON 载荷
    expect(html).toContain('type="application/json" data-poim="payload"')
    expect(html).toContain('"handle":"froq"')
  })
})
