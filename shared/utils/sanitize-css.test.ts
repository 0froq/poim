import { describe, expect, it } from 'vitest'
import { sanitizeUserCss } from './sanitize-css'

describe('sanitizeUserCss', () => {
  it('禁 @import', () => {
    const css = '@import url("https://evil.example/x.css");\n.poim-card { color: red; }'
    const out = sanitizeUserCss(css)
    expect(out).not.toContain('@import')
    expect(out).toContain('color: red')
  })

  it('外部 url() 替换为 none；data / 同源相对 / # 保留', () => {
    const css = [
      '.a { background: url("https://evil.example/img.png"); }',
      '.b { background: url(data:image/png;base64,AAA); }',
      '.c { background: url(\'/api/media?url=x\'); }',
      '.d { mask-image: url(#grad); }',
    ].join('\n')
    const out = sanitizeUserCss(css)
    expect(out).toContain('url(data:image/png;base64,AAA)')
    expect(out).toContain('url(\'/api/media?url=x\')')
    expect(out).toContain('url(#grad)')
    expect(out).not.toContain('https://evil.example')
    expect(out).toContain('.a { background: none; }')
  })

  it('expression / javascript: 被清除', () => {
    const css = '.x { width: expression(alert(1)); } a { background: url(javascript:alert(1)); }'
    const out = sanitizeUserCss(css)
    expect(out).not.toContain('expression')
    expect(out).not.toContain('javascript:')
  })
})
