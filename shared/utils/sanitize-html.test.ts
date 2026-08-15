import { describe, expect, it } from 'vitest'
import { sanitizeHtmlFragment } from './sanitize-html'

describe('sanitizeHtmlFragment 合同白名单', () => {
  it('允许白名单标签与 data-poim/class/style', () => {
    const html = '<div class="poim-card" data-poim="text">hi <strong>bold</strong> <a href="https://x.com">link</a></div>'
    const out = sanitizeHtmlFragment(html)
    expect(out).toContain('class="poim-card"')
    expect(out).toContain('data-poim="text"')
    expect(out).toContain('<strong>bold</strong>')
    expect(out).toContain('<a href="https://x.com">link</a>')
  })

  it('禁 script / 事件属性 / iframe / object / form', () => {
    const html = `
      <div>
        <script>alert(1)</script>
        <img src="x" onclick="alert(1)" onerror="alert(1)" />
        <iframe src="https://evil.example"></iframe>
        <object data="x"></object>
        <form><input name="a" /></form>
      </div>
    `
    const out = sanitizeHtmlFragment(html)
    expect(out).not.toContain('<script')
    expect(out).not.toContain('iframe')
    expect(out).not.toContain('object')
    expect(out).not.toContain('form')
    expect(out).not.toContain('onclick')
    expect(out).not.toContain('onerror')
    expect(out).toContain('<img')
  })

  it('白名单外标签（article/header/footer/section）被剥离', () => {
    const html = '<article><header>h</header><section>s</section><footer>f</footer><div class="poim-card">ok</div></article>'
    const out = sanitizeHtmlFragment(html)
    expect(out).not.toContain('<article')
    expect(out).not.toContain('<header')
    expect(out).not.toContain('<section')
    expect(out).not.toContain('<footer')
    expect(out).toContain('class="poim-card"')
    expect(out).toContain('ok')
  })

  it('a[href] 仅 http(s)；其余去掉 href', () => {
    const html = `
      <a href="javascript:alert(1)">bad</a>
      <a href="/relative">rel</a>
      <a href="#hash">hash</a>
      <a href="https://ok.example/x">good</a>
    `
    const out = sanitizeHtmlFragment(html)
    expect(out).not.toContain('javascript:')
    expect(out).not.toContain('href="/relative"')
    expect(out).not.toContain('href="#hash"')
    expect(out).toContain('href="https://ok.example/x"')
  })

  it('只保留 data-poim，任意 data-* 剥离', () => {
    const html = '<div data-poim="text" data-xss="1" data-custom="2">t</div>'
    const out = sanitizeHtmlFragment(html)
    expect(out).toContain('data-poim="text"')
    expect(out).not.toContain('data-xss')
    expect(out).not.toContain('data-custom')
  })

  it('媒体标签保留播放所需属性', () => {
    const html = '<video src="/api/media?url=x" poster="/p.jpg" autoplay muted loop playsinline controls></video><img src="data:image/png;base64,AAA">'
    const out = sanitizeHtmlFragment(html)
    expect(out).toContain('<video')
    expect(out).toContain('autoplay')
    expect(out).toContain('muted')
    expect(out).toContain('loop')
    expect(out).toContain('playsinline')
    expect(out).toContain('data:image/png')
  })
})
