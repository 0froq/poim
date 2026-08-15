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
  it('emits declarative shadow DOM', () => {
    const html = serializePoimEmbed({
      innerHTML: '<article class="poim-card"></article>',
      css: '.poim-card{color:red}',
      theme: 'light',
    })
    expect(html).toContain('shadowrootmode="open"')
    expect(html).toContain('data-theme="light"')
  })
})
