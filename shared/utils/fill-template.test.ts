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
