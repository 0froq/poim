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

describe('元信息显示开关（metrics / fetchedAt）', () => {
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
    post.metrics = { likes: 12, views: 340 }
    return post
  }

  it('默认开启：URL + fetchedAt 显示 badge，有指标显示 metrics', () => {
    const { root, metrics, badge } = rootWithMeta()
    fillTemplate(root, urlPost(), { mediaSrc: u => u })
    expect(badge.hidden).toBe(false)
    expect(badge.textContent).toContain('Fetched from X')
    expect(metrics.hidden).toBe(false)
    expect(metrics.textContent).toContain('喜欢 12')
  })

  it('showMetrics=false 隐藏指标（即使有数据）', () => {
    const { root, metrics } = rootWithMeta()
    fillTemplate(root, urlPost(), { mediaSrc: u => u, showMetrics: false })
    expect(metrics.hidden).toBe(true)
  })

  it('showFetchedAt=false 隐藏 badge（即使 URL + fetchedAt）', () => {
    const { root, badge } = rootWithMeta()
    fillTemplate(root, urlPost(), { mediaSrc: u => u, showFetchedAt: false })
    expect(badge.hidden).toBe(true)
    expect(badge.textContent).toBe('')
  })

  it('手填（source=manual，无 fetchedAt）即使开关开启也不制造伪标记', () => {
    const post = emptyPost()
    post.metrics = { likes: 12 }
    const { root, metrics, badge } = rootWithMeta()
    fillTemplate(root, post, { mediaSrc: u => u, showFetchedAt: true })
    expect(badge.hidden).toBe(true)
    expect(badge.textContent).toBe('')
    // metrics 开关不受影响：有数据仍显示
    expect(metrics.hidden).toBe(false)
  })

  it('uRL 来源但 fetchedAt 缺失时同样不制造伪标记', () => {
    const post = emptyPost()
    post.source = 'url'
    post.fetchedAt = undefined
    const { root, badge } = rootWithMeta()
    fillTemplate(root, post, { mediaSrc: u => u })
    expect(badge.hidden).toBe(true)
  })

  it('手动关闭两个开关后无任何元信息残留', () => {
    const ctx: FillContext = { mediaSrc: u => u, showMetrics: false, showFetchedAt: false }
    const { root, metrics, badge } = rootWithMeta()
    fillTemplate(root, urlPost(), ctx)
    expect(metrics.hidden).toBe(true)
    expect(badge.hidden).toBe(true)
    expect(badge.textContent).toBe('')
  })
})
