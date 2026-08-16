import type { FillContext } from './fill-template'
import { describe, expect, it } from 'vitest'
import { emptyPost } from './empty-post'
import { fillTemplate } from './fill-template'
import { serializePoimEmbed } from './serialize-embed'

describe('fillTemplate', () => {
  it('fills slots and skips quote until present', () => {
    document.body.innerHTML = `
      <article>
        <div data-poim="author-name"></div>
        <div data-poim="text"></div>
        <div data-poim="quote" hidden>
          <div data-poim="author-name"></div>
          <div data-poim="text"></div>
        </div>
        <div data-poim="badge"></div>
      </article>
    `
    const root = document.querySelector('article')!
    const post = emptyPost()
    post.author.name = 'jack'
    post.text = 'hello'
    fillTemplate(root, post, { mediaSrc: u => u })
    expect(root.querySelector('[data-poim="author-name"]')?.textContent).toBe('jack')
    expect((root.querySelector('[data-poim="quote"]') as HTMLElement).hidden).toBe(true)
  })
})

describe('serializePoimEmbed', () => {
  it('emits declarative shadow DOM with frozen theme + canonical JSON', () => {
    const post = emptyPost()
    post.author.name = 'jack'
    post.text = 'hello </script>'
    const html = serializePoimEmbed({
      innerHTML: '<div class="poim-card"></div>',
      css: '.poim-card{color:red}',
      theme: 'dark',
      post,
    })
    expect(html).toContain('shadowrootmode="open"')
    expect(html).toContain('data-theme="dark"')
    expect(html).toContain('type="application/json"')
    // 载荷内 </script> 被转义，全片只应有块自身的收尾 </script>
    expect(html).toContain('\\u003c/script')
    expect(html.match(/<\/script>/g)).toHaveLength(1)
  })
})

describe('元信息显示开关（metrics / fetchedAt / 来源行）', () => {
  function rootWithMeta(): { root: HTMLElement, metrics: HTMLElement, badge: HTMLElement } {
    document.body.innerHTML = `
      <div class="poim-card">
        <div data-poim="metrics"></div>
        <div data-poim="badge"></div>
      </div>
    `
    return {
      root: document.querySelector('.poim-card')!,
      metrics: document.querySelector('[data-poim="metrics"]')!,
      badge: document.querySelector('[data-poim="badge"]')!,
    }
  }

  function urlPost(): ReturnType<typeof emptyPost> {
    const post = emptyPost()
    post.source = 'url'
    post.fetchedAt = '2026-08-15T10:00:00Z'
    post.createdAt = '2026-08-14T08:30:00Z'
    post.metrics = { likes: 12, views: 340 }
    return post
  }

  it('默认开启：URL 显示来源行 + 抓取时间子节点，指标显示图标', () => {
    const { root, metrics, badge } = rootWithMeta()
    fillTemplate(root, urlPost(), { mediaSrc: u => u })
    expect(badge.hidden).toBe(false)
    // 来源行始终在；时间戳是子节点
    expect(badge.textContent).toContain('Fetched from')
    const fetchedAt = badge.querySelector('.poim-fetched-at')
    expect(fetchedAt).not.toBeNull()
    expect(fetchedAt!.textContent).toBe('2026-08-15')
    expect((fetchedAt as HTMLTimeElement).dateTime).toBe('2026-08-15T10:00:00Z')
    // 指标：图标 + 数值 + 无障碍名，不以可见自然语言为主 UI
    expect(metrics.hidden).toBe(false)
    const items = Array.from(metrics.querySelectorAll('.poim-metric'))
    expect(items.map(el => el.getAttribute('aria-label'))).toEqual(['12 likes', '340 views'])
    expect(metrics.querySelectorAll('svg').length).toBeGreaterThan(0)
    expect(metrics.textContent).not.toContain('喜欢')
    expect(metrics.textContent).not.toContain('浏览')
  })

  it('showMetrics=false 隐藏指标（即使有数据）', () => {
    const { root, metrics } = rootWithMeta()
    fillTemplate(root, urlPost(), { mediaSrc: u => u, showMetrics: false })
    expect(metrics.hidden).toBe(true)
  })

  it('showFetchedAt=false 只隐藏时间戳子节点，来源行仍可见', () => {
    const { root, badge } = rootWithMeta()
    fillTemplate(root, urlPost(), { mediaSrc: u => u, showFetchedAt: false })
    expect(badge.hidden).toBe(false)
    expect(badge.textContent).toContain('Fetched from')
    expect(badge.querySelector('.poim-fetched-at')).toBeNull()
  })

  it('手填（source=manual，无 fetchedAt）即使开关开启也不制造来源标记', () => {
    const post = emptyPost()
    post.metrics = { likes: 12 }
    const { root, metrics, badge } = rootWithMeta()
    fillTemplate(root, post, { mediaSrc: u => u, showFetchedAt: true })
    expect(badge.hidden).toBe(true)
    expect(badge.textContent).toBe('')
    // metrics 开关不受影响：有数据仍显示
    expect(metrics.hidden).toBe(false)
  })

  it('uRL 来源但 fetchedAt 缺失：来源行仍可见，只是没有时间戳子节点', () => {
    const post = emptyPost()
    post.source = 'url'
    post.fetchedAt = undefined
    const { root, badge } = rootWithMeta()
    fillTemplate(root, post, { mediaSrc: u => u })
    expect(badge.hidden).toBe(false)
    expect(badge.textContent).toContain('Fetched from')
    expect(badge.querySelector('.poim-fetched-at')).toBeNull()
  })

  it('手动关闭两个开关后：指标隐藏，来源行保留（仅时间戳隐藏）', () => {
    const ctx: FillContext = { mediaSrc: u => u, showMetrics: false, showFetchedAt: false }
    const { root, metrics, badge } = rootWithMeta()
    fillTemplate(root, urlPost(), ctx)
    expect(metrics.hidden).toBe(true)
    expect(badge.hidden).toBe(false)
    expect(badge.textContent).toContain('Fetched from')
    expect(badge.querySelector('.poim-fetched-at')).toBeNull()
  })
})

describe('卡片 metadata 日期与图标（RE-11）', () => {
  it('发帖时间使用稳定国际格式 YYYY-MM-DD HH:mm，无中文年月日', () => {
    document.body.innerHTML = '<div class="poim-card"><time data-poim="time"></time></div>'
    const root = document.querySelector('.poim-card') as HTMLElement
    const post = emptyPost()
    post.createdAt = '2026-08-14T08:30:00Z'
    fillTemplate(root, post, { mediaSrc: u => u })
    const time = root.querySelector('[data-poim="time"]')!
    expect(time.textContent).toBe('2026-08-14 08:30')
    expect(time.textContent).not.toMatch(/[年月日]/)
  })

  it('平台 X 标识为图标且带无障碍名，不以可见 "X" 文本为主', () => {
    const { root, badge } = (() => {
      document.body.innerHTML = '<div class="poim-card"><div data-poim="badge"></div></div>'
      const root = document.querySelector('.poim-card') as HTMLElement
      return { root, badge: document.querySelector('[data-poim="badge"]')! }
    })()
    const post = emptyPost()
    post.source = 'url'
    fillTemplate(root, post, { mediaSrc: u => u })
    const mark = badge.querySelector('.poim-platform')
    expect(mark).not.toBeNull()
    expect(mark!.getAttribute('role')).toBe('img')
    expect(mark!.getAttribute('aria-label')).toBe('X')
    expect(mark!.querySelector('svg')).not.toBeNull()
    // 来源行里没有裸文本 "X"（平台名只存在于无障碍标签）
    expect(badge.textContent?.trim()).toBe('Fetched from')
  })
})
