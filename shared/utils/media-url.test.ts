import { describe, expect, it } from 'vitest'
import { absolutizeProxyUrl, isAllowedMediaUrl, toProxyMediaUrl } from './media-url'

describe('isAllowedMediaUrl', () => {
  it('只允许 twimg 系 https 域名', () => {
    expect(isAllowedMediaUrl('https://pbs.twimg.com/media/ABC.jpg')).toBe(true)
    expect(isAllowedMediaUrl('https://video.twimg.com/ext_tw_video/1.mp4')).toBe(true)
    expect(isAllowedMediaUrl('https://api.fxtwitter.com/status/1')).toBe(true)
  })

  it('拒绝非白名单 / 非 https / 畸形 URL', () => {
    expect(isAllowedMediaUrl('https://evil.example/x.jpg')).toBe(false)
    expect(isAllowedMediaUrl('http://pbs.twimg.com/x.jpg')).toBe(false)
    expect(isAllowedMediaUrl('data:image/png;base64,AAA')).toBe(false)
    expect(isAllowedMediaUrl('not a url')).toBe(false)
  })
})

describe('toProxyMediaUrl', () => {
  it('白名单媒体转同源代理；data/相对/外站原样返回', () => {
    expect(toProxyMediaUrl('https://pbs.twimg.com/media/ABC.jpg'))
      .toBe('/api/media?url=https%3A%2F%2Fpbs.twimg.com%2Fmedia%2FABC.jpg')
    expect(toProxyMediaUrl('data:image/png;base64,AAA')).toBe('data:image/png;base64,AAA')
    expect(toProxyMediaUrl('/api/media?url=x')).toBe('/api/media?url=x')
    expect(toProxyMediaUrl('https://evil.example/x.jpg')).toBe('https://evil.example/x.jpg')
    expect(toProxyMediaUrl('')).toBe('')
  })
})

describe('absolutizeProxyUrl', () => {
  it('相对代理路径补成绝对 URL，其余原样', () => {
    expect(absolutizeProxyUrl('/api/media?url=x', 'https://poim.example'))
      .toBe('https://poim.example/api/media?url=x')
    expect(absolutizeProxyUrl('data:image/png;base64,AAA', 'https://poim.example'))
      .toBe('data:image/png;base64,AAA')
    expect(absolutizeProxyUrl('https://pbs.twimg.com/media/ABC.jpg', 'https://poim.example'))
      .toBe('https://pbs.twimg.com/media/ABC.jpg')
  })

  it('origin 带路径时以 origin 为基准拼接', () => {
    expect(absolutizeProxyUrl('/api/media?url=x', 'https://poim.example/sub'))
      .toBe('https://poim.example/api/media?url=x')
  })
})
